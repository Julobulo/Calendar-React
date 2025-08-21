import { Hono } from "hono";
import * as Realm from "realm-web";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";
import { checkToken, getDb } from "../utils/helpers";
import { accessGuard } from "../src/middleware/auth";
import { AuthPayload, Variables } from "../src/utils/types";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const SettingsRoute = new Hono<{ Bindings: Bindings, Variables: Variables }>();

let App: Realm.App;


SettingsRoute.get('/export', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");

    const id = c.var.user.id;

    const data = await activityCollection
        .find({ userId: new ObjectId(id.toString()) }, { sort: { date: 1 } });

    return c.json(data);
})

SettingsRoute.post('/import', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;

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
        console.log(`${entry.date} existing activity: ${JSON.stringify(existingActivity)}`);

        if (!existingActivity) {
            console.log(`activity doesn't exist, inserting document`);
            // Insert if the day does not exist
            const insertResult = await activityCollection.insertOne(entry);
            results.push(insertResult);
        }
    }
    return c.json({ message: `${results.length} day${results.length > 1 ? 's' : ''} imported successfully` });
})

SettingsRoute.post('/delete-all-data', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    await activityCollection.deleteMany({ userId: new ObjectId(c.var.user.id.toString()) });

    return c.json({ message: "all data deleted successfully" });
})

export default SettingsRoute