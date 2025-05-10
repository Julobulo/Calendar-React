import { Hono } from "hono";
import * as Realm from "realm-web";
import { checkToken } from "../utils/helpers";
import { UserActivity } from "../models/UserActivityModel";
import { ObjectId } from "bson";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const StatisticsRoute = new Hono<{ Bindings: Bindings }>();

let App: Realm.App;


StatisticsRoute.get('/lifetime-activity', async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const activityCollection = client
        .db("calendar")
        .collection<UserActivity>("activity")

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookie found" });
    }

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    let token = cookies.find((cookie) => cookie.startsWith(`token=`));
    if (!token) {
        c.status(400);
        return c.json({ message: "no token found" });
    }
    token = token.split("=")[1].trim();

    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) {
        c.status(400);
        return c.json({ message: "bad token" });
    }

    // Get the earliest recorded activity date (first time user used the website)
    const firstActivity = await activityCollection
        .aggregate([
            { $match: { userId: new ObjectId(id.toString()) } }, // Filter by userId
            { $unwind: "$entries" }, // Unwind the array of entries
            { $sort: { "date": 1 } }, // Sort by date ascending to get the first date
            { $limit: 1 }, // Get only the first entry
            { $project: { _id: 0, firstActivityDate: "$date" } }
        ]);

    const activities = await activityCollection.aggregate([
        { $match: { userId: new ObjectId(id.toString()) } }, // Filter by userId
        { $unwind: "$entries" }, // Unwind the entries array
        {
            $group: {
                _id: "$entries.activity",  // Group by activity name
                totalTime: { $sum: "$entries.duration" }  // Sum the durations for each activity
            }
        },
        { $sort: { totalTime: -1 } } // Sort by total time spent, descending
    ]);

    console.log(`activities: ${JSON.stringify(activities)}`);

    const result = {
        activities: activities.map(({ _id, totalTime }: { _id: string; totalTime: number }) => ({
            activity: _id,
            totalTime
        })),
        firstActivityDate: firstActivity.length ? firstActivity[0].firstActivityDate : null
    };

    return c.json(result);
})

StatisticsRoute.get("/daily-activity-count", async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const activityCollection = client
        .db("calendar")
        .collection<UserActivity>("activity")

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookie found" });
    }

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    let token = cookies.find((cookie) => cookie.startsWith(`token=`));
    if (!token) {
        c.status(400);
        return c.json({ message: "no token found" });
    }
    token = token.split("=")[1].trim();

    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) {
        c.status(400);
        return c.json({ message: "bad token" });
    }

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

StatisticsRoute.post("/line-graph", async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const activityCollection = client
        .db("calendar")
        .collection<UserActivity>("activity");

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookie found" });
    }

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    let token = cookies.find((cookie) => cookie.startsWith(`token=`));
    if (!token) {
        c.status(400);
        return c.json({ message: "no token found" });
    }

    token = token.split("=")[1].trim();

    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) {
        c.status(400);
        return c.json({ message: "bad token" });
    }

    const body = await c.req.json();
    const { type, name } = body;

    if (!type || !name) {
        return c.json({ message: "type and name required" }, 400);
    }

    // Correct field for match
    const matchField = type === "activity" ? "entries.activity" : "variables.variable";
    const isTotal = type === "activity" && name === "total";

    const activityData = await activityCollection.aggregate([
        { $match: { userId: new ObjectId(id.toString()) } },
        { $unwind: type === "activity" ? "$entries" : "$variables" },
        ...(isTotal ? [] : [{ $match: { [matchField]: name } }]),
        {
            $group: {
                _id: "$date",
                value: type === "activity"
                    ? (isTotal
                        ? { $sum: "$entries.duration" } // ✅ sum all durations for that day
                        : { $first: "$entries.duration" }) // pick first for a specific activity
                    : { $first: "$variables.value" },
            },
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                value: 1,
            },
        },
        { $sort: { date: 1 } },
    ]);


    return c.json({ data: activityData });
});

StatisticsRoute.get("/latest-week-data", async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const activityCollection = client
        .db("calendar")
        .collection<UserActivity>("activity");

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookie found" });
    }

    const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
    let token = cookies.find((cookie) => cookie.startsWith(`token=`));
    if (!token) {
        c.status(400);
        return c.json({ message: "no token found" });
    }

    token = token.split("=")[1].trim();

    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) {
        c.status(400);
        return c.json({ message: "bad token" });
    }

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

export default StatisticsRoute