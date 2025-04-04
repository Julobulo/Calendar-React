import { Hono } from "hono";
import * as Realm from "realm-web";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";
import { checkToken } from "../utils/helpers";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const SettingsRoute = new Hono<{ Bindings: Bindings }>();

let App: Realm.App;


SettingsRoute.get('/export', async (c) => {
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

    const data = await activityCollection
        .find({ userId: new ObjectId(id.toString()) }, { sort: { date: 1 } });

    return c.json(data);
})

SettingsRoute.post('/import', async (c) => {
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

    // Prepare all entries
    const entries = body.map((entry: any) => ({
        userId: new ObjectId(id.toString()),
        date: new Date(entry.date),
        entries: entry.entries || [],
        note: entry.note || "",
        variables: entry.variables || [],
    }));

    const results = [];
    for (const entry of entries) {
        const existingActivity = await activityCollection.findOne({
            userId: new ObjectId(id.toString()),
            date: entry.date,
        });
        console.log(`existing activity: ${JSON.stringify(existingActivity)}`);

        if (!existingActivity) {
            console.log(`activity doesn't exist`);
            // Insert if the day does not exist
            const insertResult = await activityCollection.insertOne(entry);
            results.push(insertResult);
        }
    }
    return c.json({ message: `${results.length} day${results.length>1 ? 's' : ''} imported successfully` });
})

export default SettingsRoute