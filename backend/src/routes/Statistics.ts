import { Hono } from "hono";
import { accessGuard } from "../middleware/auth";
import { mongoProxyRequest } from "../utils/mongoProxyClient";
import { Env, Variables } from "../utils/types";
import { UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";

const StatisticsRoute = new Hono<{ Bindings: Env; Variables: Variables }>();


// Type returned by the lifetime-activity aggregation
type LifetimeActivityAgg = {
    _id: string;         // activity name
    totalTime: number;   // sum of minutes
};
// Type returned by the firstActivity aggregation
type FirstActivityAgg = {
    firstActivityDate: string; // ISO date string
};
StatisticsRoute.get("/lifetime-activity", accessGuard, async (c) => {
    const userId = c.var.user.id;

    const activities = await mongoProxyRequest<LifetimeActivityAgg[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $match: { userId } },
            { $unwind: "$entries" },
            {
                $addFields: {
                    entryMinutes: {
                        $let: {
                            vars: {
                                s: { $split: ["$entries.start", ":"] },
                                e: { $split: ["$entries.end", ":"] },
                            },
                            in: {
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
        ],
    });

    const firstActivity = await mongoProxyRequest<FirstActivityAgg[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $match: { userId } },
            { $sort: { date: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, firstActivityDate: "$date" } },
        ],
    });

    return c.json({
        activities: activities.result?.map(a => ({
            activity: a._id,
            totalTime: a.totalTime,
        })) ?? [],
        firstActivityDate: firstActivity.result?.[0]?.firstActivityDate ?? null,
    });
});

// Type for daily activity count aggregation result
type DailyActivityCountAgg = {
    _id: string | Date; // the grouped date
    totalActivityCount: number;
    totalVariableCount: number;
    totalNote: number;
};
StatisticsRoute.get("/daily-activity-count", accessGuard, async (c) => {
    const userId = c.var.user.id;

    const res = await mongoProxyRequest<DailyActivityCountAgg[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $match: { userId } },
            {
                $project: {
                    date: 1,
                    activityCount: { $size: { $ifNull: ["$entries", []] } },
                    variableCount: { $size: { $ifNull: ["$variables", []] } },
                    noteExists: {
                        $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$note", ""] } }, 0] }, 1, 0],
                    },
                },
            },
            {
                $group: {
                    _id: "$date",
                    totalActivityCount: { $sum: "$activityCount" },
                    totalVariableCount: { $sum: "$variableCount" },
                    totalNote: { $sum: "$noteExists" },
                },
            },
            { $sort: { _id: 1 } },
        ],
    });

    const formatted = res.result?.map(d => ({
        date: new Date(d._id).toISOString().split("T")[0],
        count: {
            activityCount: d.totalActivityCount,
            variableCount: d.totalVariableCount,
            note: d.totalNote > 0 ? 1 : 0,
        },
    })) ?? [];

    return c.json(formatted);
});

// Type for line-graph aggregation result
type LineGraphAggResult = {
    date: Date;
    value: number | null;
};
StatisticsRoute.post("/line-graph", accessGuard, async (c) => {
    const userId = c.var.user.id;
    const { type, name } = await c.req.json();

    if (!type || !name) return c.json({ message: "type and name required" }, 400);
    if (type !== "activity" && type !== "variable") return c.json({ message: "invalid type" }, 400);

    const pipeline: any[] = [{ $match: { userId } }];

    if (type === "activity") {
        const isTotal = name.toLowerCase() === "total";
        pipeline.push({ $unwind: "$entries" });
        if (!isTotal) pipeline.push({ $match: { "entries.activity": name } });

        pipeline.push({
            $group: {
                _id: "$date",
                value: {
                    $sum: {
                        $cond: [
                            {
                                $and: [
                                    { $gt: [{ $strLenCP: { $ifNull: ["$entries.start", ""] } }, 0] },
                                    { $gt: [{ $strLenCP: { $ifNull: ["$entries.end", ""] } }, 0] },
                                ],
                            },
                            {
                                $let: {
                                    vars: {
                                        s: { $split: ["$entries.start", ":"] },
                                        e: { $split: ["$entries.end", ":"] },
                                    },
                                    in: {
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
                            },
                            0,
                        ],
                    },
                },
            },
        });
    } else {
        pipeline.push({ $unwind: "$variables" });
        pipeline.push({ $match: { "variables.variable": name } });
        pipeline.push({
            $addFields: {
                numericValue: {
                    $convert: { input: "$variables.value", to: "double", onError: null, onNull: null },
                },
            },
        });
        pipeline.push({
            $group: { _id: "$date", value: { $last: "$numericValue" } },
        });
    }

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

    const res = await mongoProxyRequest<LineGraphAggResult[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline,
    });

    const data = res.result?.map(d => ({
        date: d.date,
        value: typeof d.value === "number" ? d.value : d.value === null ? null : Number(d.value),
    })) ?? [];

    return c.json({ data });
});

StatisticsRoute.get("/latest-week-data", accessGuard, async (c) => {
    const userId = c.var.user.id;
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);

    const res = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId, date: { $gte: sevenDaysAgo } },
        sort: { date: 1 },
        limit: 7,
    });

    return c.json(res.result ?? []);
});

StatisticsRoute.get("/getAllLocations", accessGuard, async (c) => {
    const userId = c.var.user.id;

    const res = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId, location: { $exists: true, $ne: null } },
    });

    const locations = (res.result ?? [])
        .filter(d => d.location)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(d => ({
            name: d.location!.name,
            lat: d.location!.lat,
            lng: d.location!.lng,
            date: d.date,
        }));

    return c.json(locations);
});


type ActivityAggResult = {
    _id: null;
    totalActivities: number;
};
StatisticsRoute.get("/dbCount", async (c) => {
    const userCountRes = await mongoProxyRequest<User>(c, "countDocuments", {
        db: "calendar",
        coll: "users",
    });

    const activityAgg = await mongoProxyRequest<ActivityAggResult[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $project: { entriesCount: { $size: { $ifNull: ["$entries", []] } } } },
            { $group: { _id: null, totalActivities: { $sum: "$entriesCount" } } },
        ],
    });

    // currently logged-in users: unique userIds with at least one non-revoked token
    const loggedInAgg = await mongoProxyRequest<any>(c, "aggregate", {
        db: "calendar",
        coll: "refresh_tokens",
        pipeline: [
            {
                $match: {
                    $or: [{ revokedAt: { $exists: false } }, { revokedAt: null }],
                },
            },
            { $group: { _id: "$userId" } },
            { $count: "uniqueLoggedInUsers" },
        ],
    });

    return c.json({
        userCount: userCountRes.result,
        activityCount: activityAgg.result?.[0]?.totalActivities ?? 0,
        loggedInCount: loggedInAgg.result?.[0]?.uniqueLoggedInUsers ?? 0,

    });
});

StatisticsRoute.get("/activeUsers", async (c) => {
    // Count users that have at least one refresh token
    const activeUserRes = await mongoProxyRequest<User>(c, "countDocuments", {
        db: "calendar",
        coll: "user",
        query: { refresh_tokens: { $exists: true, $not: { $size: 0 } } }, // only users with non-empty refresh_tokens
    });

    return c.json({
        activeUserCount: activeUserRes.result,
    });
});


export default StatisticsRoute;
