import { Hono } from "hono";
import * as Realm from "realm-web";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";
import { generateRandomColor, getTimeFromLongString } from "../../calendar/src/utils/helpers";
import { isActivityDocumentEmpty } from "../utils/helpers";

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
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    const colors = currentUser?.colors;
    const usedColors = new Set([
        ...Object.values(currentUser?.colors?.activities || {}),
        ...(currentUser?.colors?.note || ""),
        ...Object.values(currentUser?.colors?.variables || {})
    ]);
    console.log(`usedColors: ${JSON.stringify(usedColors)}`);
    return c.json(colors);
})

ActivityRoute.get('/check-colors', async (c) => {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient('mongodb-atlas');
    const userCollection = client.db('calendar').collection<User>('users');
    const userActivityCollection = client.db('calendar').collection<UserActivity>('activity');

    // Extract token from cookie
    const cookieHeader = c.req.header('Cookie');
    if (!cookieHeader) {
        c.status(400);
        return c.json({ message: 'no cookie found' });
    }
    const cookies = cookieHeader.split(';').map((cookie) => cookie.trim());
    let token = cookies.find((cookie) => cookie.startsWith('token='));
    if (!token) {
        c.status(400);
        return c.json({ message: 'no token found' });
    }
    token = token.split('=')[1].trim();

    // Verify token
    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) {
        c.status(400);
        return c.json({ message: 'bad token' });
    }

    // Get user data
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    if (!currentUser) {
        c.status(400);
        return c.json({ message: 'user not found' });
    }

    // Get all activities and variables
    const activities = await userActivityCollection.find({ userId: new ObjectId(id.toString()) });
    const usedColors = new Set([
        ...Object.values(currentUser?.colors?.activities || {}),
        ...(currentUser?.colors?.note || ''),
        ...Object.values(currentUser?.colors?.variables || {}),
    ]);

    // Generate colors for missing activities and variables
    const newColors: {
        activities: { [activity: string]: string };
        note: string;
        variables: { [variable: string]: string };
    } = { activities: {}, variables: {}, note: "" };

    // Check each activity entry
    activities.forEach((activity) => {
        if (activity.entries) {
            activity.entries.forEach((entry) => {
                if (!currentUser?.colors?.activities[entry.activity]) {
                    let newColor = generateRandomColor();
                    while (usedColors.has(newColor)) {
                        newColor = generateRandomColor();
                    }
                    newColors.activities[entry.activity] = newColor;
                    usedColors.add(newColor);
                }
            });
        }

        if (activity.variables) {
            // Check each variable in the activity
            activity.variables?.forEach((variable) => {
                if (!currentUser?.colors?.variables[variable.variable]) {
                    let newColor = generateRandomColor();
                    while (usedColors.has(newColor)) {
                        newColor = generateRandomColor();
                    }
                    newColors.variables[variable.variable] = newColor;
                    usedColors.add(newColor);
                }
            });
        }
    });

    // Update the user's color data with new colors
    const updatedColors = {
        activities: { ...currentUser.colors.activities, ...newColors.activities },
        variables: { ...currentUser.colors.variables, ...newColors.variables },
        note: currentUser.colors.note,
    };

    await userCollection.updateOne(
        { _id: new ObjectId(id.toString()) },
        { $set: { colors: updatedColors } }
    );

    return c.json({ message: 'Colors updated successfully', colors: updatedColors });
});

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

    let { year, month, day, type, activity, description, time, note, variable, value } = await c.req.json();
    activity = (activity || "").trim();
    description = (description || "").trim();
    time = (time || "").trim();
    note = (note || "").trim();
    variable = (variable || "").trim();
    value = (value || "").trim();

    if (year === undefined || month === undefined || day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);

    const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));
    const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    console.log(`here are the documents found: ${await activityCollection.find({ userId: new ObjectId(id.toString()), date })}`);

    // color logic
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    const usedColors = new Set([
        ...(Object.values(currentUser?.colors?.activities || {})),
        ...(currentUser?.colors?.note ? [currentUser.colors.note] : []),
        ...(Object.values(currentUser?.colors?.variables || {}))
    ]);

    let updateQuery = {};

    if (type === "activity") {
        if (!activity || !description) return c.json({ message: "Missing activity fields" }, 400);
        const newEntry: ActivityEntry = {
            activity,
            duration: getTimeFromLongString(description),
            description,
            time,
        };

        if (existingEntry) {
            if (existingEntry.entries?.some(e => e.activity === activity)) {
                return c.json({ message: "Activity already defined for this date" }, 400);
            }
            updateQuery = { $push: { entries: newEntry } };
        } else {
            updateQuery = {
                $setOnInsert: {
                    entries: [newEntry],
                    variables: [],
                }
            };
        }

        if (!currentUser?.colors?.activities?.[activity]) {
            let newColor;
            do {
                newColor = generateRandomColor();
            } while (usedColors.has(newColor));

            // Ensure structure exists (safe no-op if user already exists)
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                {
                    $setOnInsert: {
                        "colors.activities": {},
                        "colors.variables": {},
                        "colors.note": ""
                    }
                },
                { upsert: true }
            );

            // Now safely update the nested activity color
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                {
                    $set: {
                        [`colors.activities.${activity}`]: newColor
                    }
                }
            );
        }
    } else if (type === "variable") {
        if (!variable || !value) return c.json({ message: "Missing variable fields" }, 400);
        if (existingEntry?.variables?.some(v => v.variable === variable)) {
            return c.json({ message: "Variable already exists for this date" }, 400);
        }

        const newVariable = { variable, value };
        if (existingEntry) {
            updateQuery = { $push: { variables: newVariable } };
        } else {
            updateQuery = {
                $setOnInsert: {
                    entries: [],
                    variables: [newVariable],
                }
            };
        }

        if (!currentUser?.colors?.variables?.[variable]) {
            let newColor;
            do {
                newColor = generateRandomColor();
            } while (usedColors.has(newColor));

            // Ensure structure exists (safe no-op if user already exists)
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                {
                    $setOnInsert: {
                        "colors.activities": {},
                        "colors.variables": {},
                        "colors.note": ""
                    }
                },
                { upsert: true }
            );

            // Now safely update the nested variable color
            await userCollection.updateOne(
                { _id: new ObjectId(id.toString()) },
                {
                    $set: {
                        [`colors.variables.${variable}`]: newColor
                    }
                }
            );
        }
    } else if (type === "note") {
        if (!note) return c.json({ message: "Missing note field" }, 400);
        if (existingEntry?.note) return c.json({ message: "Note already exists for this date" }, 400);
        updateQuery = { $set: { note } };
    } else {
        return c.json({ message: "Invalid type" }, 400);
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

    // Parse request body
    let { year, month, day, type, activity, description, time, note, variable, value } = await c.req.json();
    activity = (activity || "").trim();
    description = (description || "").trim();
    time = (time || "").trim();
    note = (note || "").trim();
    variable = (variable || "").trim();
    value = (value || "").trim();
    if (year === undefined || month === undefined || day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);

    const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));

    const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    if (!existingEntry) {
        c.status(400);
        return c.json({ message: "no entry for this day" });
    }

    let updateQuery = {};

    if (type === "activity") {
        if (!activity || !description) return c.json({ message: "Missing activity fields" }, 400);
        const newEntry: ActivityEntry = { activity, duration: getTimeFromLongString(description), description, time };

        if (!existingEntry.entries || !existingEntry.entries.some(e => e.activity === activity)) {
            return c.json({ message: "Activity not defined for this date" }, 400);
        }
        updateQuery = {
            $set: {
                "entries.$[elem].description": description,
                "entries.$[elem].duration": getTimeFromLongString(description),
                "entries.$[elem].time": time,
            }
        };
    }
    else if (type === "note") {
        if (!note) return c.json({ message: "Missing note field" }, 400);
        if (!existingEntry?.note) return c.json({ message: "Note doesn't exist for this date" }, 400);
        updateQuery = { $set: { note } };
    }
    else if (type === "variable") {
        if (!variable || !value) return c.json({ message: "Missing variable fields" }, 400);
        if (existingEntry.variables && !existingEntry.variables.some(e => e.variable === variable)) {
            return c.json({ message: "Variable not defined for this date" }, 400);
        }
        // Update the existing variable instead of pushing a new one
        updateQuery = {
            $set: { "variables.$[elem].value": value }
        };
    }
    else {
        return c.json({ message: "Invalid type" }, 400);
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

    await activityCollection.updateOne({ userId: new ObjectId(id.toString()), date }, updateQuery,
        type === "activity"
            ? { arrayFilters: [{ "elem.activity": activity }], upsert: true }
            : (type === "variable"
                ? { arrayFilters: [{ "elem.variable": variable }], upsert: true } :
                { upsert: true })
    );
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

    // Parse request body
    const { year, month, day, type, activity, variable } = await c.req.json();
    if (year === undefined || month === undefined || day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);

    const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));
    const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    if (!existingEntry) {
        c.status(400);
        return c.json({ message: "no entry for this day" });
    }

    if (type === "activity") {
        if (!activity) return c.json({ message: "Missing activity fields" }, 400);
        // Filter out the activity to be deleted
        const updatedEntries = existingEntry.entries.filter(entry => entry.activity !== activity);
        if (updatedEntries.length === existingEntry.entries.length) {
            c.status(400);
            return c.json({ message: "activity not found for this date" });
        }
        if (isActivityDocumentEmpty({ ...existingEntry, entries: updatedEntries })) {
            // If no more activities, note, or variables remain, delete the document
            await activityCollection.deleteOne({ _id: existingEntry._id });
            return c.json({ message: "activity deleted, no more activities or note or variables for this day" });
        } else {
            // Otherwise, update the document with the filtered entries
            await activityCollection.updateOne(
                { _id: existingEntry._id },
                { $set: { entries: updatedEntries } }
            );
            return c.json({ message: "activity deleted successfully" });
        }
    }
    else if (type === "note") {
        if (!existingEntry?.note) return c.json({ message: "Note doesn't exist for this date" }, 400);
        if (isActivityDocumentEmpty({ ...existingEntry, note: undefined })) {
            // If no more activities, note, or variables remain, delete the document
            await activityCollection.deleteOne({ _id: existingEntry._id });
            return c.json({ message: "note deleted, no more activities or note or variables for this day" });
        } else {
            // Otherwise, update the document by unsetting the note
            await activityCollection.updateOne(
                { _id: existingEntry._id },
                { $unset: { note: "" } }
            );
            return c.json({ message: "note deleted successfully" });
        }
    }
    else if (type === "variable") {
        if (!variable) return c.json({ message: "Missing variable fields" }, 400);
        if (existingEntry.variables && !existingEntry.variables.some(e => e.variable === variable)) {
            return c.json({ message: "Variable not defined for this date" }, 400);
        }
        const updatedEntries = (existingEntry.variables || []).filter(entry => entry.variable !== variable);
        if (existingEntry.variables && updatedEntries.length === existingEntry.variables.length) {
            c.status(400);
            return c.json({ message: "Variable not defined for this date" });
        }
        if (isActivityDocumentEmpty({ ...existingEntry, variables: updatedEntries })) {
            // If no more activities, note, or variables remain, delete the document
            await activityCollection.deleteOne({ _id: existingEntry._id });
            return c.json({ message: "variable deleted, no more activities or note or variables for this day" });
        } else {
            // Otherwise, update the document with the filtered variables
            await activityCollection.updateOne(
                { _id: existingEntry._id },
                { $set: { variables: updatedEntries } }
            );
            return c.json({ message: "variable deleted successfully" });
        }
    }
    else {
        return c.json({ message: "Invalid type" }, 400);
    }
})

// UserActivities.find({
//     user: userId,                                // Filter by user
//     "entries.description": { $regex: /keyword/i } // Case-insensitive search for keyword
// });

export default ActivityRoute