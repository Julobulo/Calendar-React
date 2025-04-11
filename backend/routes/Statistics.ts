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
        activities: activities.map(({ _id, totalTime }) => ({
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

    // Aggregate the data by counting the number of activities in 'entries'
    const activityCounts = await activityCollection.aggregate([
        // Match documents where userId matches the extracted user ID
        {
            $match: { userId: new ObjectId(id.toString()) }
        },
        // Project: Count activities in 'entries'
        {
            $project: {
                date: 1,
                activityCount: {
                    $cond: [
                        { $eq: [{ $type: "$entries" }, "array"] },  // Check if 'entries' is an array
                        { $size: "$entries" },  // If 'entries' is an array, count its size
                        0  // If 'entries' is not an array or is missing, set count to 0
                    ]
                }
            }
        },
        // Group by date and calculate the total activity count
        {
            $group: {
                _id: { date: { $toDate: "$date" } }, // Group by date
                totalActivityCount: { $sum: "$activityCount" }
            }
        },
        // Sort by date
        {
            $sort: { "_id.date": 1 }
        }
    ]);

    // Explicitly define the type for the items in activityCounts
    type AggregatedActivity = {
        _id: { date: Date };  // The date field in the _id object
        totalActivityCount: number;  // The total activity count
    };


    // Format the result into a usable format for frontend (date as string, activity count)
    const formattedData = activityCounts.map((item: AggregatedActivity) => ({
        date: item._id.date.toISOString().split("T")[0], // Format as YYYY-MM-DD
        count: item.totalActivityCount
    }));

    return c.json({ data: formattedData });
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

    const matchField = type === "activity" ? "entries.activity" : "variables.variable"; // Correct field for match

    const activityData = await activityCollection.aggregate([
        { $match: { userId: new ObjectId(id.toString()) } },
        { $unwind: type === "activity" ? "$entries" : "$variables" }, // Unwind entries or variables
        { $match: { [matchField]: name } },
        {
            $group: {
                _id: "$date",
                value: type === "activity"
                    ? { $first: "$entries.duration" }  // Use $first to take the first found value for activity
                    : { $first: "$variables.value" },   // Use $first to take the first found value for variable
            },
        },
        {
            $project: {
                _id: 0,
                date: "$_id",
                value: 1, // return date and value (either direct value for activity or variable)
            },
        },
        { $sort: { date: 1 } },
    ]);


    return c.json({ data: activityData });
});


export default StatisticsRoute