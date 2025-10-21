import { Hono } from "hono";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity, Location } from "../../models/UserActivityModel";
import { User } from "../../models/UserModel";
import { asObjectId, badRequest, generateRandomColor, handleActivity, handleNote, handleVariable, isActivityDocumentEmpty } from "../../utils/helpers";
import { AppError, Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import ActivityInfoRoute from "./ActivityInfo";
import NewActivityRoute from "./NewActivity";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import EditActivityRoute from "./EditActivity";

const ActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

ActivityRoute.route('/info', ActivityInfoRoute);
ActivityRoute.route('/new', NewActivityRoute);
ActivityRoute.route('/edit', EditActivityRoute)

ActivityRoute.get('/', accessGuard, async (c) => {
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

    const response = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId: id, date: { $gte: startDate, $lte: endDate } },
    });
    const activities = response.result;

    return c.json(activities);
});



// ActivityRoute.get('/check-colors', accessGuard, async (c) => {
//     const db = await getDb(c, 'calendar');
//     const userCollection = db.collection<User>("users");
//     const activityCollection = db.collection<UserActivity>("activity");
//     const id = c.var.user.id

//     // Get user data
//     const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
//     if (!currentUser) {
//         c.status(400);
//         return c.json({ message: 'user not found' });
//     }

//     // Get all activities and variables
//     const activities = await activityCollection.find({ userId: new ObjectId(id.toString()) });
//     const usedColors = new Set([
//         ...Object.values(currentUser?.colors?.activities || {}),
//         ...(currentUser?.colors?.note || ''),
//         ...Object.values(currentUser?.colors?.variables || {}),
//     ]);

//     // Generate colors for missing activities and variables
//     const newColors: {
//         activities: { [activity: string]: string };
//         note: string;
//         variables: { [variable: string]: string };
//     } = { activities: {}, variables: {}, note: "" };

//     // Check each activity entry
//     activities.forEach((activity) => {
//         if (activity.entries) {
//             activity.entries.forEach((entry) => {
//                 if (!currentUser?.colors?.activities[entry.activity]) {
//                     let newColor = generateRandomColor();
//                     while (usedColors.has(newColor)) {
//                         newColor = generateRandomColor();
//                     }
//                     newColors.activities[entry.activity] = newColor;
//                     usedColors.add(newColor);
//                 }
//             });
//         }

//         if (activity.variables) {
//             // Check each variable in the activity
//             activity.variables?.forEach((variable) => {
//                 if (!currentUser?.colors?.variables[variable.variable]) {
//                     let newColor = generateRandomColor();
//                     while (usedColors.has(newColor)) {
//                         newColor = generateRandomColor();
//                     }
//                     newColors.variables[variable.variable] = newColor;
//                     usedColors.add(newColor);
//                 }
//             });
//         }
//     });

//     // Update the user's color data with new colors
//     const updatedColors = {
//         activities: { ...currentUser.colors.activities, ...newColors.activities },
//         variables: { ...currentUser.colors.variables, ...newColors.variables },
//         note: currentUser.colors.note,
//     };

//     await userCollection.updateOne(
//         { _id: new ObjectId(id.toString()) },
//         { $set: { colors: updatedColors } }
//     );

//     return c.json({ message: 'Colors updated successfully', colors: updatedColors });
// });






// ActivityRoute.delete('/delete', accessGuard, async (c) => {
//     const db = await getDb(c, 'calendar');
//     const userCollection = db.collection<User>("users");
//     const activityCollection = db.collection<UserActivity>("activity");
//     const id = c.var.user.id;

//     // Parse request body
//     const { year, month, day, type, activity, _id, variable } = await c.req.json();
//     if (year === undefined || month === undefined || day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);

//     const date = new Date(Date.UTC(parseInt(year), parseInt(month), parseInt(day)));
//     const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
//     if (!existingEntry) {
//         c.status(400);
//         return c.json({ message: "no entry for this day" });
//     }

//     if (type === "activity") {
//         if (!activity) return c.json({ message: "Missing activity fields" }, 400);
//         // Filter out the activity to be deleted
//         const updatedEntries = existingEntry.entries.filter(entry => entry._id.toString() !== _id);
//         if (updatedEntries.length === existingEntry.entries.length) {
//             c.status(400);
//             return c.json({ message: "activity not found for this date" });
//         }
//         if (isActivityDocumentEmpty({ ...existingEntry, entries: updatedEntries })) {
//             // If no more activities, note, or variables remain, delete the document
//             await activityCollection.deleteOne({ _id: existingEntry._id });
//             return c.json({ message: "activity deleted, no more activities or note or variables for this day" });
//         } else {
//             // Otherwise, update the document with the filtered entries
//             await activityCollection.updateOne(
//                 { _id: existingEntry._id },
//                 { $set: { entries: updatedEntries } }
//             );
//             return c.json({ message: "activity deleted successfully" });
//         }
//     }
//     else if (type === "note") {
//         if (!existingEntry?.note) return c.json({ message: "Note doesn't exist for this date" }, 400);
//         if (isActivityDocumentEmpty({ ...existingEntry, note: undefined })) {
//             // If no more activities, note, or variables remain, delete the document
//             await activityCollection.deleteOne({ _id: existingEntry._id });
//             return c.json({ message: "note deleted, no more activities or note or variables for this day" });
//         } else {
//             // Otherwise, update the document by unsetting the note
//             await activityCollection.updateOne(
//                 { _id: existingEntry._id },
//                 { $unset: { note: "" } }
//             );
//             return c.json({ message: "note deleted successfully" });
//         }
//     }
//     else if (type === "variable") {
//         if (!variable) return c.json({ message: "Missing variable fields" }, 400);
//         if (existingEntry.variables && !existingEntry.variables.some(e => e.variable === variable)) {
//             return c.json({ message: "Variable not defined for this date" }, 400);
//         }
//         const updatedEntries = (existingEntry.variables || []).filter(entry => entry.variable !== variable);
//         if (existingEntry.variables && updatedEntries.length === existingEntry.variables.length) {
//             c.status(400);
//             return c.json({ message: "Variable not defined for this date" });
//         }
//         if (isActivityDocumentEmpty({ ...existingEntry, variables: updatedEntries })) {
//             // If no more activities, note, or variables remain, delete the document
//             await activityCollection.deleteOne({ _id: existingEntry._id });
//             return c.json({ message: "variable deleted, no more activities or note or variables for this day" });
//         } else {
//             // Otherwise, update the document with the filtered variables
//             await activityCollection.updateOne(
//                 { _id: existingEntry._id },
//                 { $set: { variables: updatedEntries } }
//             );
//             return c.json({ message: "variable deleted successfully" });
//         }
//     }
//     else {
//         return c.json({ message: "Invalid type" }, 400);
//     }
// })

// UserActivities.find({
//     user: userId,                                // Filter by user
//     "entries.description": { $regex: /keyword/i } // Case-insensitive search for keyword
// });

export default ActivityRoute