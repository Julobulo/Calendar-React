import { Hono } from "hono";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity, Location } from "../../models/UserActivityModel";
import { User } from "../../models/UserModel";
import { asObjectId, badRequest, generateRandomColor, handleActivity, handleNote, handleVariable, isActivityDocumentEmpty } from "../../utils/helpers";
import { AppError, Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import ActivityInfoRoute from "./ActivityInfo";
// import { restheartFind, restheartFindOne, restheartInsert, restheartInsertOne, restheartUpdateOne } from "../utils/restheartHelpers";

const ActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

ActivityRoute.route('/info', ActivityInfoRoute);

// ActivityRoute.get('/', accessGuard, async (c) => {
//     // const db = await getDb(c, 'calendar');
//     // const activityCollection = db.collection<UserActivity>("activity");
//     const { year, month, day } = c.req.queries();

//     const id = c.var.user.id

//     let startDate, endDate;
//     if (!day) {
//         startDate = new Date(Number(year), Number(month) - 1, 20);
//         endDate = new Date(Number(year), Number(month) + 1, 10);
//     }
//     else {
//         startDate = new Date(Number(year), Number(month), Number(day));
//         endDate = new Date(Number(year), Number(month), Number(day), 23, 59, 59, 999);
//     }

//     const activities = await restheartFind("calendarActivities", {
//         userId: { $oid: asObjectId(id.toString()) },
//         date: {
//             $gte: { $date: startDate },
//             $lte: { $date: endDate }
//         }

//     }) as Array<UserActivity>;

//     return c.json(activities);
// });



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


// export async function handleColors(currentUser: User | null, usedColors: Set<string>, userId: string, activity: string, variable: string) {
//     // Assign color if not exists
//     if (activity && !currentUser?.colors?.activities?.[activity]) {
//         let newColor;
//         do {
//             newColor = generateRandomColor();
//         } while (usedColors.has(newColor));

//         // Ensure structure exists
//         await restheartUpdateOne("calendarUsers", userId,
//             {
//                 $setOnInsert: {
//                     "colors.activities": {},
//                     "colors.variables": {},
//                     "colors.note": ""
//                 }
//             },
//             { upsert: true })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId) },
//         //     {
//         //         $setOnInsert: {
//         //             "colors.activities": {},
//         //             "colors.variables": {},
//         //             "colors.note": ""
//         //         }
//         //     },
//         //     { upsert: true }
//         // );

//         // Set the activity color
//         await restheartUpdateOne("calendarUsers", userId,
//             { $set: { [`colors.activities.${activity}`]: newColor } })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId) },
//         //     { $set: { [`colors.activities.${activity}`]: newColor } }
//         // );
//     }

//     if (variable && !currentUser?.colors?.variables?.[variable]) {
//         let newColor;
//         do {
//             newColor = generateRandomColor();
//         } while (usedColors.has(newColor));

//         // Ensure structure exists (safe no-op if user already exists)
//         await restheartUpdateOne("calendarUsers", userId,
//             {
//                 $setOnInsert: {
//                     "colors.activities": {},
//                     "colors.variables": {},
//                     "colors.note": ""
//                 }
//             },
//             { upsert: true })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $setOnInsert: {
//         //             "colors.activities": {},
//         //             "colors.variables": {},
//         //             "colors.note": ""
//         //         }
//         //     },
//         //     { upsert: true }
//         // );

//         await restheartUpdateOne("calendarUsers", userId,
//             { $set: { [`colors.variables.${variable}`]: newColor } })
//         // Now safely update the nested variable color
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $set: {
//         //             [`colors.variables.${variable}`]: newColor
//         //         }
//         //     }
//         // );
//     }
// }

// ActivityRoute.post('/new', accessGuard, async (c) => {
//     const id = c.var.user.id;
//     const body = await c.req.json();

//     let { type, activity, description, note, variable } = body;

//     if (body.year === undefined || body.month === undefined || body.day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);
//     const date = new Date(Date.UTC(+body.year, +body.month, +body.day));


//     const existingEntry = await restheartFindOne("calendarActivities", { userId: { $oid: asObjectId(id.toString()) }, date: { $date: date.getTime() } });
//     console.log(`existingEntry: ${JSON.stringify(existingEntry)}`)

//     // color logic
//     const currentUser = await restheartFindOne("calendarUsers", { _id: { $oid: asObjectId(id.toString()) } })
//     const usedColors = new Set([
//         ...(Object.values(currentUser?.colors?.activities || {})),
//         ...(currentUser?.colors?.note ? [currentUser.colors.note] : []),
//         ...(Object.values(currentUser?.colors?.variables || {}))
//     ]);


//     let updateQuery;
//     try {

//         switch (body.type) {
//             case "activity":
//                 updateQuery = await handleActivity(body, existingEntry);
//                 await handleColors(currentUser, usedColors, id, activity, '');
//                 break;
//             case "variable":
//                 if (existingEntry?.variables?.some((v: any) => v.variable === variable)) {
//                     badRequest("Variable already defined for this date");
//                 }
//                 ({ updateQuery } = await handleVariable(body, existingEntry));
//                 await handleColors(currentUser, usedColors, id, '', variable);
//                 break;
//             case "note":
//                 updateQuery = await handleNote(body, existingEntry);
//                 break;
//             default:
//                 return c.json({ message: "Invalid type" }, 400);
//         }
//     }
//     catch (err) {
//         if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
//             const appErr = err as AppError;
//             return c.json({ message: appErr.message }, appErr.status);
//         }
//         // fallback for unexpected errors
//         return c.json({ message: "Internal server error" }, 500);
//     }

//     // Extract user names from the description (those after "@")
//     // const mentionedNames = Array.from(new Set(`${description} ${note}`.match(/@(\w+)/g)?.map((name: string) => name.slice(1)) || [])); // Removing "@" symbol
//     // if (mentionedNames.length > 0) {
//     //     const currentUser = await restheartFindOne("calendarUsers", { _id: { $oid: asObjectId(id.toString()) } })
//     //     // const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
//     //     const updatedNames = [...new Set([...(currentUser?.names || []), ...mentionedNames])]; // Add new names without duplicates

//     //     // Update user's names array with the new names
//     //     if (updatedNames.length > (currentUser?.names?.length ?? 0)) {
//     //         await restheartUpdateOne("calendarUsers", { _id: { $oid: asObjectId(id.toString()) } },
//     //             { $set: { names: updatedNames } })
//     //         // await userCollection.updateOne(
//     //         //     { _id: new ObjectId(id.toString()) },
//     //         //     { $set: { names: updatedNames } }
//     //         // );
//     //     }
//     // }

//     console.log("updateQuery:", JSON.stringify(updateQuery, null, 2));
//     console.log("Filter date:", date.toISOString());
//     console.log("Existing doc date:", existingEntry?.date);
//     // await restheartUpdateOne("calendarActivities",
//     //     {
//     //         userId: { $oid: asObjectId(id.toString()) },
//     //         date: { $date: date.getTime() }
//     //     },
//     //     updateQuery,
//     //     { upsert: true })
//     const filter = {
//         userId: { $oid: asObjectId(id.toString()) },
//         date: { $date: date.getTime() },
//     };

//     if (!existingEntry) {
//         const newDoc = {
//             userId: { $oid: asObjectId(id.toString()) },
//             date: { $date: date.getTime() },
//             entries: updateQuery?.$push?.entries ? [updateQuery.$push.entries] : [],
//             variables: [],
//         };
//         console.log("Inserting new doc:", JSON.stringify(newDoc, null, 2));
//         await restheartInsertOne("calendarActivities", newDoc);
//     }
//     else {
//         // Try to update
//         const updateResult = await restheartUpdateOne("calendarActivities", filter, updateQuery);
//         console.log(`updateResult: ${JSON.stringify(updateResult)}`)
//     }

//     console.log(`${type} added successfully`)
//     // await activityCollection.updateOne({ userId: new ObjectId(id.toString()), date }, updateQuery, { upsert: true });
//     return c.json({ message: `${type} added successfully` }, 200);
// })

// ActivityRoute.patch('/edit', accessGuard, async (c) => {
//     const db = await getDb(c, 'calendar');
//     const userCollection = db.collection<User>("users");
//     const activityCollection = db.collection<UserActivity>("activity");
//     const id = c.var.user.id;
//     const body = await c.req.json();

//     let { type, activity, description, note, variable, _id } = body;
//     activity = (activity || "").trim();
//     description = (description || "").trim();
//     note = (note || "").trim();
//     variable = (variable || "").trim();

//     if (body.year === undefined || body.month === undefined || body.day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);
//     const date = new Date(Date.UTC(+body.year, +body.month, +body.day));

//     const existingEntry = await activityCollection.findOne({ userId: new ObjectId(id.toString()), date });
//     if (!existingEntry) {
//         c.status(400);
//         return c.json({ message: "no entry for this day" });
//     }

//     let updateQuery;
//     let res;
//     try {

//         switch (body.type) {
//             case "activity":
//                 res = await handleActivity(body, existingEntry, _id);
//                 await activityCollection.updateOne(
//                     { userId: new ObjectId(id.toString()), date },
//                     res.updateQuery,
//                     { arrayFilters: res.arrayFilters } // use the one from handleActivity
//                 );
//                 break;
//             case "variable":
//                 if (!existingEntry?.variables?.some(v => v.variable === variable)) {
//                     return c.json({ message: "Variable not defined for this date" }, 400);
//                 }
//                 res = await handleVariable(body, existingEntry);
//                 await activityCollection.updateOne(
//                     { userId: new ObjectId(id.toString()), date },
//                     res.updateQuery,
//                     res.arrayFilters ? { arrayFilters: res.arrayFilters } : {}
//                 );
//                 // handleColors(currentUser, usedColors, userCollection, id, '', variable);
//                 break;
//             case "note":
//                 updateQuery = await handleNote(body, existingEntry, "edit");
//                 await activityCollection.updateOne({ userId: new ObjectId(id.toString()), date }, updateQuery, { upsert: true });
//                 break;
//             default:
//                 return c.json({ message: "Invalid type" }, 400);
//         }
//     }
//     catch (err) {
//         if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
//             const appErr = err as AppError;
//             return c.json({ message: appErr.message }, appErr.status);
//         }
//         // fallback for unexpected errors
//         return c.json({ message: "Internal server error" }, 500);
//     }

//     // Extract user names from the description (those after "@")
//     const mentionedNames = Array.from(new Set(`${description} ${note}`.match(/@(\w+)/g)?.map((name: string) => name.slice(1)) || [])); // Removing "@" symbol
//     if (mentionedNames.length > 0) {
//         const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
//         const updatedNames = [...new Set([...(currentUser?.names || []), ...mentionedNames])]; // Add new names without duplicates

//         // Update user's names array with the new names
//         if (updatedNames.length > (currentUser?.names?.length ?? 0)) {
//             await userCollection.updateOne(
//                 { _id: new ObjectId(id.toString()) },
//                 { $set: { names: updatedNames } }
//             );
//         }
//     }

//     return c.json({ message: "activity updated successfully" });
// })

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