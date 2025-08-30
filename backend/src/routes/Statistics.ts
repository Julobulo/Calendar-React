import { Hono } from "hono";
import * as Realm from "realm-web";
import { checkToken, getDb } from "../utils/helpers";
import { UserActivity } from "../models/UserActivityModel";
import { ObjectId } from "bson";
import { User } from "../models/UserModel";
import { Variables } from "../utils/types";
import { accessGuard } from "../middleware/auth";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const StatisticsRoute = new Hono<{ Bindings: Bindings, Variables: Variables }>();

let App: Realm.App;

StatisticsRoute.get("/lifetime-activity", accessGuard, async (c) => {
    const db = await getDb(c, "calendar");
    const activityCollection = db.collection<UserActivity>("activity");
    const userId = new ObjectId(c.var.user.id);

    // Earliest recorded activity date (only if there was at least one entry)
    const firstActivity = await activityCollection.aggregate([
        { $match: { userId } },
        { $unwind: "$entries" },
        { $sort: { date: 1 } },
        { $limit: 1 },
        { $project: { _id: 0, firstActivityDate: "$date" } },
    ]);

    // Sum total minutes per activity across all days
    const activities = await activityCollection.aggregate([
        { $match: { userId } },
        { $unwind: "$entries" },
        {
            $addFields: {
                entryMinutes: {
                    $cond: [
                        { $and: [{ $ne: ["$entries.start", null] }, { $ne: ["$entries.end", null] }] },
                        {
                            $let: {
                                vars: {
                                    sh: { $toInt: { $substrBytes: ["$entries.start", 0, 2] } },
                                    sm: { $toInt: { $substrBytes: ["$entries.start", 3, 2] } },
                                    eh: { $toInt: { $substrBytes: ["$entries.end", 0, 2] } },
                                    em: { $toInt: { $substrBytes: ["$entries.end", 3, 2] } },
                                },
                                in: {
                                    $let: {
                                        vars: {
                                            smin: { $add: [{ $multiply: ["$$sh", 60] }, "$$sm"] },
                                            emin: { $add: [{ $multiply: ["$$eh", 60] }, "$$em"] },
                                        },
                                        in: {
                                            // If end < start (crossing midnight), wrap by +1440
                                            $let: {
                                                vars: { diff: { $subtract: ["$$emin", "$$smin"] } },
                                                in: {
                                                    $cond: [{ $lt: ["$$diff", 0] }, { $add: ["$$diff", 1440] }, "$$diff"],
                                                },
                                            },
                                        },
                                    },
                                },
                            },
                        },
                        0,
                    ],
                },
            },
        },
        {
            $group: {
                _id: "$entries.activity",
                totalTime: { $sum: "$entryMinutes" },
            },
        },
        { $sort: { totalTime: -1 } },
    ]);

    const result = {
        activities: activities.map(({ _id, totalTime }: { _id: string; totalTime: number }) => ({
            activity: _id,
            totalTime, // minutes
        })),
        firstActivityDate: firstActivity.length ? firstActivity[0].firstActivityDate : null,
    };

    return c.json(result);
});


StatisticsRoute.get("/daily-activity-count", accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;

    const entriesCounts = await activityCollection.aggregate([
        { $match: { userId: new ObjectId(id.toString()) } },
        {
            $project: {
                date: 1,
                activityCount: {
                    $cond: [
                        { $eq: [{ $type: "$entries" }, "array"] },
                        { $size: "$entries" },
                        0
                    ]
                },
                variableCount: {
                    $cond: [
                        { $eq: [{ $type: "$variables" }, "array"] },
                        { $size: "$variables" },
                        0
                    ]
                },
                noteExists: {
                    $cond: [
                        { $gt: [{ $strLenCP: { $ifNull: ["$note", ""] } }, 0] },
                        1,
                        0
                    ]
                }
            }
        },
        {
            $group: {
                _id: { date: { $toDate: "$date" } },
                totalActivityCount: { $sum: "$activityCount" },
                totalVariableCount: { $sum: "$variableCount" },
                totalNote: { $sum: "$noteExists" }
            }
        },
        { $sort: { "_id.date": 1 } }
    ]);

    type DailyCount = {
        _id: { date: Date };
        totalActivityCount: number;
        totalVariableCount: number;
        totalNote: 0 | 1 | number;
    };

    const formattedData = entriesCounts.map((item: DailyCount) => ({
        date: item._id.date.toISOString().split("T")[0],
        count: {
            activityCount: item.totalActivityCount,
            variableCount: item.totalVariableCount,
            note: item.totalNote > 0 ? 1 : 0
        }
    }));

    return c.json(formattedData);
});

StatisticsRoute.post("/line-graph", accessGuard, async (c) => {
    const db = await getDb(c, "calendar");
    const activityCollection = db.collection<UserActivity>("activity");
    const userId = new ObjectId(c.var.user.id.toString());

    const body = await c.req.json();
    const type = String(body?.type || "").trim();      // "activity" | "variable"
    const name = String(body?.name || "").trim();      // e.g., "total", "Running", "Weight"

    if (!type || !name) {
        return c.json({ message: "type and name required" }, 400);
    }
    if (type !== "activity" && type !== "variable") {
        return c.json({ message: "invalid type" }, 400);
    }

    const isTotal = type === "activity" && name.toLowerCase() === "total";

    // Common first stages
    const pipeline: any[] = [
        { $match: { userId } },
    ];

    if (type === "activity") {
        // Unwind entries and (optionally) filter by activity name
        pipeline.push({ $unwind: "$entries" });
        if (!isTotal) {
            pipeline.push({ $match: { "entries.activity": name } });
        }

        // Compute duration in minutes from "HH:mm" strings.
        // We only count entries where both start and end are non-empty strings.
        const bothTimesPresent = {
            $and: [
                { $gt: [{ $strLenCP: { $ifNull: ["$entries.start", ""] } }, 0] },
                { $gt: [{ $strLenCP: { $ifNull: ["$entries.end", ""] } }, 0] },
            ],
        };

        const durationMinutesExpr = {
            $let: {
                vars: {
                    s: { $split: ["$entries.start", ":"] }, // ["HH","mm"]
                    e: { $split: ["$entries.end", ":"] },
                },
                in: {
                    // max(end - start, 0) in minutes
                    $max: [
                        {
                            $subtract: [
                                {
                                    $add: [
                                        { $multiply: [{ $toInt: { $arrayElemAt: ["$$e", 0] } }, 60] },
                                        { $toInt: { $arrayElemAt: ["$$e", 1] } },
                                    ],
                                },
                                {
                                    $add: [
                                        { $multiply: [{ $toInt: { $arrayElemAt: ["$$s", 0] } }, 60] },
                                        { $toInt: { $arrayElemAt: ["$$s", 1] } },
                                    ],
                                },
                            ],
                        },
                        0,
                    ],
                },
            },
        };

        pipeline.push({
            $group: {
                _id: "$date",
                value: {
                    // Sum durations for the day. If either time is missing, contribute 0.
                    $sum: { $cond: [bothTimesPresent, durationMinutesExpr, 0] },
                },
            },
        });
    } else {
        // type === "variable"
        pipeline.push({ $unwind: "$variables" });
        pipeline.push({ $match: { "variables.variable": name } });

        // Convert string value to number (double). Non-numeric -> null.
        pipeline.push({
            $addFields: {
                numericValue: {
                    $convert: { input: "$variables.value", to: "double", onError: null, onNull: null },
                },
            },
        });

        // If a day has multiple entries for the same variable (unlikely), just take the last one.
        pipeline.push({
            $group: {
                _id: "$date",
                value: { $last: "$numericValue" },
            },
        });
    }

    // Format and sort
    pipeline.push(
        {
            $project: {
                _id: 0,
                date: { $dateToString: { date: "$_id", format: "%Y-%m-%d" } },
                value: 1,
            },
        },
        { $sort: { date: 1 } }
    );

    const data = await activityCollection.aggregate(pipeline);

    // Ensure the exact return shape
    const result: { date: string; value: number | null }[] = data.map((d: any) => ({
        date: d.date,
        value: typeof d.value === "number" ? d.value : d.value === null ? null : Number(d.value),
    }));

    return c.json({ data: result }, 200);
});

StatisticsRoute.get("/latest-week-data", accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;

    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);

    // ✅ Use aggregate to filter, sort and limit directly in the database
    const activities = await activityCollection.aggregate([
        {
            $match: {
                userId: new ObjectId(id.toString()),
                date: { $gte: sevenDaysAgo },
            },
        },
        { $sort: { date: 1 } },
        { $limit: 7 },
    ]);

    return c.json(activities);
})

StatisticsRoute.get('/getAllLocations', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;

    const docs = await activityCollection
        .find({
            userId: new ObjectId(id.toString()),
            location: { $exists: true, $ne: null }
        });

    const locations = docs
        .filter(doc => doc.location)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(doc => ({
            name: doc.location!.name,
            lat: doc.location!.lat,
            lng: doc.location!.lng,
            date: doc.date
        }));

    return c.json(locations);
});

StatisticsRoute.get('/dbCount', async (c) => {
    const db = await getDb(c, "calendar");
    const userCollection = db.collection<User>("users");
    const userCount = await userCollection.count();

    // Count total number of activities across all documents
    const activityCollection = db.collection<UserActivity>("activity");

    const aggResult = await activityCollection.aggregate([
        {
            $project: {
                entriesCount: { $size: { $ifNull: ["$entries", []] } }
            }
        },
        {
            $group: {
                _id: null,
                totalActivities: { $sum: "$entriesCount" }
            }
        }
    ]);

    const activityCount = aggResult.length > 0 ? aggResult[0].totalActivities : 0;
    return c.json({ userCount, activityCount });
})

export default StatisticsRoute