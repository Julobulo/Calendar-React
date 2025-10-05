import { Hono } from "hono";
import * as Realm from "realm-web";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity, Location } from "../models/UserActivityModel";
import { User } from "../models/UserModel";
import { generateRandomColor, getTimeFromLongString } from "../../../calendar/src/utils/helpers";
import { getDb, isActivityDocumentEmpty } from "../utils/helpers";
import { AppError, Variables } from "../utils/types";
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

const ActivityRoute = new Hono<{ Bindings: Bindings, Variables: Variables }>();

ActivityRoute.get('/', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const activityCollection = db.collection<UserActivity>("activity");
    const { year, month, day } = c.req.queries();

    const id = c.var.user.id

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

ActivityRoute.get('/colors', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const id = c.var.user.id

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

ActivityRoute.get('/check-colors', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id

    // Get user data
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    if (!currentUser) {
        c.status(400);
        return c.json({ message: 'user not found' });
    }

    // Get all activities and variables
    const activities = await activityCollection.find({ userId: new ObjectId(id.toString()) });
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

ActivityRoute.get('/names', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const id = c.var.user.id;

    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    const names = currentUser?.names;
    return c.json(names);
})

export async function handleColors(currentUser: User | null, usedColors: Set<string>, userCollection: any, userId: string, activity: string, variable: string) {
    // Assign color if not exists
    if (activity && !currentUser?.colors?.activities?.[activity]) {
        let newColor;
        do {
            newColor = generateRandomColor();
        } while (usedColors.has(newColor));

        // Ensure structure exists
        await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            {
                $setOnInsert: {
                    "colors.activities": {},
                    "colors.variables": {},
                    "colors.note": ""
                }
            },
            { upsert: true }
        );

        // Set the activity color
        await userCollection.updateOne(
            { _id: new ObjectId(userId) },
            { $set: { [`colors.activities.${activity}`]: newColor } }
        );
    }

    if (variable && !currentUser?.colors?.variables?.[variable]) {
        let newColor;
        do {
            newColor = generateRandomColor();
        } while (usedColors.has(newColor));

        // Ensure structure exists (safe no-op if user already exists)
        await userCollection.updateOne(
            { _id: new ObjectId(userId.toString()) },
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
            { _id: new ObjectId(userId.toString()) },
            {
                $set: {
                    [`colors.variables.${variable}`]: newColor
                }
            }
        );
    }
}

function badRequest(message: string): never {
    throw { status: 400, message } as AppError;
}

export async function handleActivity(
    body: any,
    existingEntry: UserActivity | null,
    editingId?: string, // pass this for edit mode
): Promise<any> {
    const activity = (body.activity || "").trim();
    const description = (body.description || "").trim();
    if (!activity || !description) badRequest("Missing activity fields");
    if (activity.length > 100) badRequest("Activity name too long");
    if (description.length > 500) badRequest("Description too long");

    const startProvided = (body.start || "").trim();
    const endProvided = (body.end || "").trim();

    let start = startProvided;
    let end = endProvided;

    if (startProvided && endProvided) {
        if (startProvided === endProvided) {
            badRequest("Start and end time cannot be the same");
        }
    } else if (startProvided && !endProvided) {
        end = computeEndFromStart(startProvided, description);
    } else if (!startProvided && endProvided) {
        start = computeStartFromEnd(endProvided, description);
    } else {
        throw badRequest("Either start or end time must be defined");
    }

    const location = body.location;

    if (editingId) {
        // Make sure the activity exists
        const existing = existingEntry?.entries?.find(e => e._id.toString() === editingId);
        if (!existing) badRequest("Activity with this ID does not exist");

        // Build the $set update and arrayFilters
        const updateQuery = {
            $set: {
                "entries.$[elem].activity": activity,
                "entries.$[elem].description": description,
                "entries.$[elem].start": start,
                "entries.$[elem].end": end,
                "entries.$[elem].location": location,
            }
        };
        const arrayFilters = [{ "elem._id": new ObjectId(editingId) }];

        return { updateQuery, arrayFilters };
    }


    // CREATE MODE
    const newEntry: ActivityEntry = {
        _id: new ObjectId(),
        activity,
        description,
        start,
        end,
        location,
    };

    if (existingEntry) {
        if ((existingEntry?.entries?.length || 0) >= 100) {
            badRequest("Too many activities for this day");
        }
        if (existingEntry?.entries?.some(e => e.activity === activity && e.start === start)) {
            badRequest("Activity with the same start time already exists");
        }
        return { $push: { entries: newEntry } };
    } else {
        return {
            $setOnInsert: {
                entries: [newEntry],
                variables: [],
            },
        };
    }
}

export async function handleVariable(
    body: any,
    existingEntry: UserActivity | null,
) {
    const variable = (body.variable || "").trim();
    const value = (body.value || "").trim();
    if (!variable || !value) badRequest("Missing variable fields");
    if (variable.length > 100) badRequest("Variable name too long");

    let updateQuery;

    if (existingEntry?.variables?.some(v => v.variable === variable)) {
        // EDIT MODE: update existing variable value
        updateQuery = {
            $set: { "variables.$[elem].value": value }
        };
        const arrayFilters = [{ "elem.variable": variable }];
        return { updateQuery, arrayFilters };
    } else {
        // CREATE MODE: push new variable
        const newVariable = { variable, value };
        if (existingEntry) {
            updateQuery = { $push: { variables: newVariable } };
            return { updateQuery };
        } else {
            updateQuery = {
                $setOnInsert: {
                    entries: [],
                    variables: [newVariable]
                }
            };

            return { updateQuery };
        }
    }
}

export async function handleNote(
    body: any,
    existingEntry: UserActivity | null,
    editing?: "edit"
) {
    const note = (body.note || "").trim();
    if (!note) badRequest("Missing note field");
    if (note.length > 1000) badRequest("Note too long");

    let updateQuery;

    if (existingEntry) {
        if (existingEntry?.note && editing !== "edit") badRequest("Note already exists")
        updateQuery = { $set: { note } };
        return updateQuery;
    } else {
        updateQuery = {
            $setOnInsert: {
                entries: [],
                variables: [],
                note
            }
        };
        return updateQuery;
    }
}

ActivityRoute.post('/new', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;
    const body = await c.req.json();

    let { type, activity, description, note, variable } = body;

    if (body.year === undefined || body.month === undefined || body.day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);
    const date = new Date(Date.UTC(+body.year, +body.month, +body.day));


    const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    console.log(`here are the documents found: ${await activityCollection.find({ userId: new ObjectId(id.toString()), date })}`);

    // color logic
    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    const usedColors = new Set([
        ...(Object.values(currentUser?.colors?.activities || {})),
        ...(currentUser?.colors?.note ? [currentUser.colors.note] : []),
        ...(Object.values(currentUser?.colors?.variables || {}))
    ]);


    let updateQuery;
    try {

        switch (body.type) {
            case "activity":
                updateQuery = await handleActivity(body, existingEntry);
                await handleColors(currentUser, usedColors, userCollection, id, activity, '');
                break;
            case "variable":
                if (existingEntry?.variables?.some(v => v.variable === variable)) {
                    badRequest("Variable already defined for this date");
                }
                ({ updateQuery } = await handleVariable(body, existingEntry));
                await handleColors(currentUser, usedColors, userCollection, id, '', variable);
                break;
            case "note":
                updateQuery = await handleNote(body, existingEntry);
                break;
            default:
                return c.json({ message: "Invalid type" }, 400);
        }
    }
    catch (err) {
        if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
            const appErr = err as AppError;
            return c.json({ message: appErr.message }, appErr.status);
        }
        // fallback for unexpected errors
        return c.json({ message: "Internal server error" }, 500);
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

ActivityRoute.patch('/edit', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;
    const body = await c.req.json();

    let { type, activity, description, note, variable, _id } = body;
    activity = (activity || "").trim();
    description = (description || "").trim();
    note = (note || "").trim();
    variable = (variable || "").trim();

    if (body.year === undefined || body.month === undefined || body.day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);
    const date = new Date(Date.UTC(+body.year, +body.month, +body.day));

    const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
    if (!existingEntry) {
        c.status(400);
        return c.json({ message: "no entry for this day" });
    }

    let updateQuery;
    let res;
    try {

        switch (body.type) {
            case "activity":
                res = await handleActivity(body, existingEntry, _id);
                await activityCollection.updateOne(
                    { userId: new ObjectId(id.toString()), date },
                    res.updateQuery,
                    { arrayFilters: res.arrayFilters } // use the one from handleActivity
                );
                break;
            case "variable":
                if (!existingEntry?.variables?.some(v => v.variable === variable)) {
                    return c.json({ message: "Variable not defined for this date" }, 400);
                }
                res = await handleVariable(body, existingEntry);
                await activityCollection.updateOne(
                    { userId: new ObjectId(id.toString()), date },
                    res.updateQuery,
                    res.arrayFilters ? { arrayFilters: res.arrayFilters } : {}
                );
                // handleColors(currentUser, usedColors, userCollection, id, '', variable);
                break;
            case "note":
                updateQuery = await handleNote(body, existingEntry, "edit");
                await activityCollection.updateOne({ userId: new ObjectId(id.toString()), date }, updateQuery, { upsert: true });
                break;
            default:
                return c.json({ message: "Invalid type" }, 400);
        }
    }
    catch (err) {
        if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
            const appErr = err as AppError;
            return c.json({ message: appErr.message }, appErr.status);
        }
        // fallback for unexpected errors
        return c.json({ message: "Internal server error" }, 500);
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

    return c.json({ message: "activity updated successfully" });
})

ActivityRoute.delete('/delete', accessGuard, async (c) => {
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");
    const activityCollection = db.collection<UserActivity>("activity");
    const id = c.var.user.id;

    // Parse request body
    const { year, month, day, type, activity, _id, variable } = await c.req.json();
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
        const updatedEntries = existingEntry.entries.filter(entry => entry._id.toString() !== _id);
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