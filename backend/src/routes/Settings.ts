import { Hono } from "hono";
import * as Realm from "realm-web";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";
import { checkToken, fixOldActivityDocument, getDb } from "../utils/helpers";
import { accessGuard } from "../middleware/auth";
import { AuthPayload, Variables } from "../utils/types";

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
    const id = new ObjectId(c.var.user.id.toString());

    const body = await c.req.json();

    const entries = body.map((entry: any) => ({
        userId: id,
        date: new Date(entry.date),
        entries: entry.entries || [],
        note: entry.note || "",
        variables: entry.variables || [],
        location: entry.location || null,
    }));

    const results = [];
    for (const entry of entries) {
        const existingActivity = await activityCollection.findOne({
            userId: id,
            date: entry.date,
        });

        if (!existingActivity) {
            console.log(`${entry.date} doesn't exist in db, inserting document`);
            const insertResult = await activityCollection.insertOne(fixOldActivityDocument(entry));
            results.push(insertResult);
        } else {
            // only update fields if they're present in the import and missing in db
            const updateFields: Partial<UserActivity> = {};

            if (entry.note && !existingActivity.note) {
                updateFields.note = entry.note;
            }
            if (entry.variables?.length && (!existingActivity.variables || existingActivity.variables.length === 0)) {
                updateFields.variables = entry.variables;
            }
            if (entry.location && !existingActivity.location) {
                updateFields.location = entry.location;
            }

            if (Object.keys(updateFields).length > 0) {
                console.log(`Merging fields for ${entry.date}`)
                await activityCollection.updateOne(
                    { _id: existingActivity._id },
                    { $set: updateFields }
                );
            } else { console.log(`Entry already exists for day ${entry.date}`) }
        }
    }

    return c.json({ message: `${results.length} new day${results.length > 1 ? 's' : ''} imported successfully` });
});

SettingsRoute.post('/delete-all-data', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    await activityCollection.deleteMany({ userId: new ObjectId(c.var.user.id.toString()) });

    return c.json({ message: "all data deleted successfully" });
})

SettingsRoute.put('/colors', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const id = c.var.user.id;

    const body = await c.req.json();

    await userCollection.updateOne(
        { _id: new ObjectId(id.toString()) },
        { $set: { colors: body } }
    );

    return c.json({ message: "colors updated successfully" });
})

export default SettingsRoute