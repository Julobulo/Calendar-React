// import { Hono } from "hono";
// import { ObjectId } from "bson";
// import { UserActivity } from "../models/UserActivityModel";
// import { fixOldActivityDocument } from "../utils/helpers";
// import { accessGuard } from "../middleware/auth";
// import { Env, Variables } from "../utils/types";
// import { restheartDeleteMany, restheartFind, restheartFindOne, restheartInsert, restheartUpdateOne } from "../utils/restheartHelpers";

// const SettingsRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

// SettingsRoute.get('/export', accessGuard, async (c) => {
//     const id = c.var.user.id;
//     const data = await restheartFind("calendarActivities", {
//         userId: { $oid: id.toString() }
//     }) as Array<UserActivity>;

//     return c.json(data);
// })

// SettingsRoute.post('/import', accessGuard, async (c) => {
//     const id = new ObjectId(c.var.user.id.toString());

//     const body = await c.req.json();

//     const entries = body.map((entry: any) => ({
//         userId: id,
//         date: new Date(entry.date),
//         entries: entry.entries || [],
//         note: entry.note || "",
//         variables: entry.variables || [],
//         location: entry.location || null,
//     }));

//     const results = [];
//     for (const entry of entries) {
//         const existingActivity = await restheartFindOne("calendarActivities", {
//             userId: { $oid: id.toString() },
//             date: entry.date,
//         }) as UserActivity;

//         if (!existingActivity) {
//             console.log(`${entry.date} doesn't exist in db, inserting document`);
//             const insertResult = await restheartInsert('calendarActivities', fixOldActivityDocument(entry))
//             results.push(insertResult);
//         } else {
//             // only update fields if they're present in the import and missing in db
//             const updateFields: Partial<UserActivity> = {};

//             if (entry.note && !existingActivity.note) {
//                 updateFields.note = entry.note;
//             }
//             if (entry.variables?.length && (!existingActivity.variables || existingActivity.variables.length === 0)) {
//                 updateFields.variables = entry.variables;
//             }
//             if (entry.location && !existingActivity.location) {
//                 updateFields.location = entry.location;
//             }

//             if (Object.keys(updateFields).length > 0) {
//                 console.log(`Merging fields for ${entry.date}`)
//                 await restheartUpdateOne("calendarActivities", existingActivity._id,
//                     { $set: updateFields })
//             } else { console.log(`Entry already exists for day ${entry.date}`) }
//         }
//     }
//     // PROBLEM WITH DATE NOT BEING SET CORRECTLY
//     return c.json({ message: `${results.length} new day${results.length > 1 ? 's' : ''} imported successfully` });
// });

// SettingsRoute.post('/delete-all-data', accessGuard, async (c) => {
//     await restheartDeleteMany("calendarActivities", { userId: { $oid: c.var.user.id.toString() } })

//     return c.json({ message: "all data deleted successfully" });
// })

// // SettingsRoute.put('/colors', accessGuard, async (c) => {
// //     const id = c.var.user.id;
// //     c.var.user.id

// //     const body = await c.req.json();
// //     console.log(`no problem reading the body: ${JSON.stringify(body)}`)

// //     await restheartUpdateOne("calendarUsers", id.toString(),
// //         { $set: { colors: body } })
// //     console.log(`no problem with the restheart update`)
// //     return c.json({ message: "colors updated successfully" });
// // })

// export default SettingsRoute