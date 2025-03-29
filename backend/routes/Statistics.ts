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
        { $group: { 
            _id: "$entries.activity",  // Group by activity name
            totalTime: { $sum: "$entries.duration" }  // Sum the durations for each activity
        }},
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


export default StatisticsRoute