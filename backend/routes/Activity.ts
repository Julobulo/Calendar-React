import { Hono } from "hono";
import * as Realm from "realm-web";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";
import { generateRandomColor, getTimeFromLongString } from "../../calendar/src/utils/helpers";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const ActivityRoute = new Hono<{ Bindings: Bindings }>();

let App: Realm.App;

// function that checks if a token is valid, and if so, it returns the "id" field stored in the payload of the token
async function checkToken(token: string, secret: string): Promise<boolean> {
    const encoder = new TextEncoder();

    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        return false;
    }

    const signedData = `${encodedHeader}.${encodedPayload}`;

    const signature = Uint8Array.from(
        atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
    );

    const key = await crypto.subtle.importKey(
        // Import secret key
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
    );

    const isValid = await crypto.subtle.verify(
        // verify the signature of the token
        "HMAC",
        key,
        signature,
        encoder.encode(signedData),
    );

    if (!isValid) {
        return false;
    }

    const payload = JSON.parse(
        atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
    ); // Decode the payload
    if (payload.exp && Date.now() >= payload.exp * 1000) {
        return false; // token expired
    }

    return payload.id; // return id that was in payload
}

ActivityRoute.get('/', async (c) => {
    const { year, month, day } = c.req.queries();
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
        return c.json({ message: "no cookies found" });
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

    let startDate, endDate;
    if (!day) {
        startDate = new Date(Number(year), Number(month) - 1, 20);
        endDate = new Date(Number(year), Number(month) + 1, 10);
    }
    else {
        startDate = new Date(Number(year), Number(month), Number(day));
        endDate = new Date(Number(year), Number(month), Number(day), 23, 59, 59, 999);
    }

    const activities = await activityCollection
        .find({
            userId: new ObjectId(id.toString()),
            date: {
                $gte: startDate,
                $lte: endDate,
            },
        });

    return c.json(activities);
});

ActivityRoute.get('/colors', async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const userCollection = client
        .db("calendar")
        .collection<User>("users");

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookies found" });
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
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    const colors = currentUser?.colors;
    return c.json(colors);
})

ActivityRoute.get('/names', async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const userCollection = client
        .db("calendar")
        .collection<User>("users");

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookies found" });
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
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    const names = currentUser?.names;
    return c.json(names);
})

ActivityRoute.post('/new', async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const userCollection = client
        .db("calendar")
        .collection<User>("users");
    const activityCollection = client
        .db("calendar")
        .collection<UserActivity>("activity")

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookies found" });
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

    const { year, month, day, type, activity, description, note, variable, value } = await c.req.json();
    if (!year || !month || !day || !type) return c.json({ message: "Missing required fields" }, 400);

    const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));
    const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });

    let updateQuery = {};

    if (type === "activity") {
        if (!activity || !description) return c.json({ message: "Missing activity fields" }, 400);
        const newEntry: ActivityEntry = { activity, duration: getTimeFromLongString(description), description };

        if (existingEntry) {
            if (existingEntry.entries.some(e => e.activity === activity)) {
                return c.json({ message: "Activity already defined for this date" }, 400);
            }
            updateQuery = { $push: { entries: newEntry } };
        } else {
            await activityCollection.insertOne({ userId: new ObjectId(id.toString()), date, entries: [newEntry], variables: [] });
            return c.json({ message: "Activity added" }, 201);
        }
    }
    else if (type === "note") {
        if (!note) return c.json({ message: "Missing note field" }, 400);
        if (existingEntry?.note) return c.json({ message: "Note already exists for this date" }, 400);
        updateQuery = { $set: { note } };
    }
    else if (type === "variable") {
        if (!variable || !value) return c.json({ message: "Missing variable fields" }, 400);
        updateQuery = { $push: { variables: { variable, value } } };
    }

    else {
        return c.json({ message: "Invalid type" }, 400);
    }

    if (type === "activity") {
        // checking if we need to create a new color
        const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
        if (!currentUser?.colors[activity]) {
            const newColor = generateRandomColor();
            // Update user with the new color
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                { $set: { [`colors.${activity}`]: newColor } }
            );
        }
    }

    // Extract user names from the description (those after "@")
    const mentionedNames = Array.from(new Set(`${description} ${note}`.match(/@(\w+)/g)?.map((name: string) => name.slice(1)) || [])); // Removing "@" symbol
    if (mentionedNames.length > 0) {
        const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
        const updatedNames = [...new Set([...(currentUser?.names || []), ...mentionedNames])]; // Add new names without duplicates

        // Update user's names array with the new names
        if (updatedNames.length > (currentUser?.names?.length ?? 0)) {
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                { $set: { names: updatedNames } }
            );
        }
    }

    await activityCollection.updateOne({ userId: new ObjectId(id.toString()), date }, updateQuery, { upsert: true });
    return c.json({ message: `${type} added successfully` }, 200);
})

ActivityRoute.patch('/edit', async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const userCollection = client
        .db("calendar")
        .collection<User>("users");
    const activityCollection = client
        .db("calendar")
        .collection<UserActivity>("activity")

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: "no cookies found" });
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

    // Parse request body
    const { year, month, day, activity, description } = await c.req.json();

    if (year === null || month === null || day === null || !activity) {
        c.status(400);
        return c.json({ message: `Missing required fields` });
    }

    const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));

    const existingActivity = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    if (!existingActivity) {
        c.status(400);
        return c.json({ message: "no activities exist for this day" });
    }

    // Find the specific activity entry
    const activityIndex = existingActivity.entries.findIndex((entry) => entry.activity === activity);
    if (activityIndex === -1) {
        c.status(400);
        return c.json({ message: "specified activity not found" });
    }

    // Update only the fields that are provided
    const updateFields: Partial<ActivityEntry> = {};
    updateFields.description = description;
    const duration = getTimeFromLongString(description);
    updateFields.duration = duration;

    const updateResult = await activityCollection.updateOne(
        { _id: existingActivity._id, "entries.activity": activity },
        { $set: { [`entries.${activityIndex}.description`]: description, [`entries.${activityIndex}.duration`]: duration } }
    );

    if (updateResult.modifiedCount === 0) {
        c.status(500);
        return c.json({ message: "failed to update activity" });
    }

    // Extract user names from the description (those after "@")
    const mentionedNames = Array.from(new Set(description.match(/@(\w+)/g)?.map((name: string) => name.slice(1)) || [])); // Removing "@" symbol
    if (mentionedNames.length > 0) {
        const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
        const updatedNames = [...new Set([...(currentUser?.names || []), ...mentionedNames])]; // Add new names without duplicates

        // Update user's names array with the new names
        if (updatedNames.length > (currentUser?.names?.length ?? 0)) {
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                { $set: { names: updatedNames } }
            );
        }
    }

    return c.json({ message: "activity updated successfully" });
})

ActivityRoute.delete('/delete', async (c) => {
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
        return c.json({ message: "no cookies found" });
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

    const { year, month, day, activity } = await c.req.json(); // Parse request body

    if (!year || !month || !day || !activity) {
        c.status(400);
        return c.json({ message: `Missing required fields` });
    }
    const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));

    // Check if user already has an activity document for that day
    const existingActivity = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    if (!existingActivity) {
        c.status(400);
        return c.json({ message: 'there are no activities for this day' });
    }
    // Filter out the activity to be deleted
    const updatedEntries = existingActivity.entries.filter(entry => entry.activity !== activity);

    if (updatedEntries.length === existingActivity.entries.length) {
        c.status(400);
        return c.json({ message: "activity not found for this date" });
    }

    if (updatedEntries.length === 0) {
        // If no more activities remain for that day, delete the document
        await activityCollection.deleteOne({ _id: existingActivity._id });
        return c.json({ message: "activity deleted, no more activities for this day" });
    } else {
        // Otherwise, update the document with the filtered entries
        await activityCollection.updateOne(
            { _id: existingActivity._id },
            { $set: { entries: updatedEntries } }
        );
        return c.json({ message: "activity deleted successfully" });
    }
})

// UserActivities.find({
//     user: userId,                                // Filter by user
//     "entries.description": { $regex: /keyword/i } // Case-insensitive search for keyword
// });

export default ActivityRoute