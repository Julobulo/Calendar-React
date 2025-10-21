// import { Hono } from "hono";
// import * as Realm from "realm-web";
// import { checkToken, isActivityDocumentEmpty } from "../utils/helpers";
// import { User } from "../models/UserModel";
// import { ObjectId } from "bson";
// import { Location, UserActivity } from "../models/UserActivityModel";
// import { restheartDeleteOne, restheartFindOne, restheartUpdateMany, restheartUpdateOne } from "../utils/restheartHelpers";
// import { accessGuard } from "../middleware/auth";
// import { Env, Variables } from "../utils/types";

// const LocationRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

// async function getUser(id: string) {
//     // const db = await getDb(c, "calendar");
//     // const userCollection = db.collection<User>("users");
//     // const activityCollection = db.collection<UserActivity>('activity');

//     // const cookieHeader = c.req.header("Cookie");
//     // if (!cookieHeader) throw new Error("no cookie found");

//     // const cookies = cookieHeader.split(";").map((cookie: string) => cookie.trim());
//     // let token = cookies.find((cookie: string) => cookie.startsWith(`token=`));
//     // if (!token) throw new Error("no token found");

//     // token = token.split("=")[1].trim();
//     // const id = await checkToken(token, c.env.JWT_SECRET);
//     // if (!id) throw new Error("bad token");

//     const currentUser = await restheartFindOne("calendarUsers", { _id: new ObjectId(id) })
//     // const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
//     if (!currentUser) throw new Error("no user found");

//     return { currentUser, userId: id };
// }

// LocationRoute.get('/savedLocations', accessGuard, async (c) => {
//     try {
//         const { currentUser } = await getUser(c.var.user.id);
//         return c.json(currentUser.savedLocations || []);
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// LocationRoute.post('/newLocation', async (c) => {
//     try {
//         const body = await c.req.json(); // use json() instead of parseBody() for application/json
//         const { name, lat, lng } = body;
//         if (!name || typeof lat !== "number" || typeof lng !== "number") {
//             c.status(400);
//             return c.json({ message: "Please send all required fields" });
//         }

//         const { userId } = await getUser(c.var.user.id);

//         await restheartUpdateOne("calendarUsers", userId.toString(),
//             {
//                 $push: {
//                     savedLocations: { name, lat, lng }
//                 }
//             })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $push: {
//         //             savedLocations: { name, lat, lng }
//         //         }
//         //     }
//         // );

//         return c.json({ message: "Location added successfully" });
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// LocationRoute.delete('/deleteLocation', async (c) => {
//     try {
//         const body = await c.req.json();
//         const { name } = body;

//         if (!name) {
//             c.status(400);
//             return c.json({ message: "Please provide the location name to delete" });
//         }

//         const { userId, currentUser } = await getUser(c.var.user.id);

//         if (!currentUser.savedLocations?.some((loc: Location) => loc.name === name)) { c.status(400); return c.json({ message: `Location '${name}' isn't a saved location` }) }

//         await restheartUpdateOne("calendarUsers", userId.toString(),
//             {
//                 $pull: { // TODO: this $pull probably doesn't work
//                     savedLocations: { name }
//                 }
//             })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $pull: {
//         //             savedLocations: { name }
//         //         }
//         //     }
//         // );

//         return c.json({ message: `Saved location '${name}' was deleted successfully` });
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// LocationRoute.put('/updateLocation', async (c) => {
//     try {
//         const body = await c.req.json();
//         const { oldName, newName, latitude, longitude } = body;

//         if (!oldName || !newName || typeof latitude !== "number" || typeof longitude !== "number") {
//             c.status(400);
//             return c.json({ message: "Please provide all required fields" });
//         }

//         const { userId, currentUser } = await getUser(c.var.user.id);

//         if (!currentUser.savedLocations?.find((loc: Location) => loc.name === oldName)) { c.status(400); return c.json({ message: `Location '${oldName}' not found` }) }

//         await restheartUpdateOne("calendarUsers", userId.toString(), {
//             $set: {
//                 "savedLocations.$[loc].name": newName,
//                 "savedLocations.$[loc].lat": latitude,
//                 "savedLocations.$[loc].lng": longitude
//             }
//         },
//             {
//                 arrayFilters: [{ "loc.name": oldName }]
//             })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $set: {
//         //             "savedLocations.$[loc].name": newName,
//         //             "savedLocations.$[loc].lat": latitude,
//         //             "savedLocations.$[loc].lng": longitude
//         //         }
//         //     },
//         //     {
//         //         arrayFilters: [{ "loc.name": oldName }]
//         //     }
//         // );

//         // if (!activityCollection) {
//         //     throw new Error("Could not access activity collection");
//         // }

//         await restheartUpdateMany("calendarActivities", {
//             userId: new ObjectId(userId.toString()),
//             "location.name": oldName // TODO: does this location.name filter work?
//         }, {
//             $set: {
//                 "location.name": newName,
//                 "location.lat": latitude,
//                 "location.lng": longitude
//             }
//         });
//         // await activityCollection.updateMany(
//         //     {
//         //         userId: new ObjectId(userId.toString()),
//         //         "location.name": oldName
//         //     },
//         //     {
//         //         $set: {
//         //             "location.name": newName,
//         //             "location.lat": latitude,
//         //             "location.lng": longitude
//         //         }
//         //     }
//         // );

//         return c.json({ message: `Location '${oldName}' updated to '${newName}' with new coordinates successfully` });
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// LocationRoute.put('/dayLocation', accessGuard, async (c) => { // route to add and edit location
//     try {
//         const body = await c.req.json();
//         const { year, month, day, name, lat, lng } = body;

//         if (year === undefined || month === undefined || day === undefined || !name || typeof lat !== "number" || typeof lng !== "number") {
//             c.status(400);
//             return c.json({ message: "Missing date or location data" });
//         }

//         const { userId } = await getUser(c.var.user.id);

//         const res = await restheartUpdateOne(
//             "calendarActivities",
//             {
//                 // userId: new ObjectId(userId.toString()),
//                 userId: new ObjectId(c.get('user').id.toString()),
//                 date: new Date(Date.UTC(year, month, day))
//             },
//             {
//                 $set: {
//                     location: { name, lat, lng },
//                     userId: new ObjectId(userId.toString()), // Needed in case of upsert
//                     date: new Date(Date.UTC(year, month, day)) // Needed in case of upsert
//                 }
//             },
//             { upsert: true }
//         ) as any;

//         // Adapt message logic to RESTHeart response
//         const message =
//             res?.nUpserted && res.nUpserted > 0 // TODO: do these params exist?
//                 ? "New activity created with location"
//                 : res?.nModified && res.nModified > 0
//                     ? "Location added or updated for the day"
//                     : "Location was already up to date";

//         console.log(message);

//         return c.json({ message });
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// LocationRoute.delete('/dayLocation/delete', async (c) => {
//     try {
//         const { year, month, day } = await c.req.json();

//         if (year === undefined || month === undefined || day === undefined) {
//             c.status(400);
//             return c.json({ message: "Missing date" });
//         }

//         const { userId } = await getUser(c.var.user.id);

//         const existingEntry = await restheartFindOne("calendarActivities",{ userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) } )
//         // const existingEntry = await activityCollection.findOne({ userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) });
//         if (!existingEntry) {
//             c.status(404);
//             return c.json({ message: "No activity entry found for that date" });
//         }

//         const updatedEntry = { ...existingEntry, location: undefined };

//         if (isActivityDocumentEmpty(updatedEntry)) {
//             // If no more activities, note, or variables remain, delete the document
//             await restheartDeleteOne("calendarActivities", { userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) })
//             // await activityCollection.deleteOne({ userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) });
//             return c.json({ message: "Location removed, deleted document" });
//         } else {
//             // Otherwise, just unset the location
//             const res = restheartUpdateOne("calendarActivities",
//                 { userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) },
//                 { $unset: { location: "" } }) as any;
//             // const res = await activityCollection.updateOne(
//             //     { userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) },
//             //     { $unset: { location: "" } }
//             // );
//             // TODO: find a solution to know if anything was modified after updateOne
//             if (res.modifiedCount === 0) {
//                 c.status(400);
//                 return c.json({ message: "Failed to remove location" });
//             }
//             return c.json({ message: "Location removed from the day" });
//         }
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// LocationRoute.post('/dayLocation/get', async (c) => {
//     try {
//         const { year, month, day } = await c.req.json();

//         if (year === undefined || month === undefined || day === undefined) {
//             c.status(400);
//             return c.json({ message: "Missing date" });
//         }

//         const { userId } = await getUser(c.var.user.id);

//         const activity = await restheartFindOne("calendarActivities", {
//             userId: new ObjectId(userId.toString()),
//             date: new Date(Date.UTC(year, month, day)),
//         })
//         // const activity = await activityCollection.findOne({
//         //     userId: new ObjectId(userId.toString()),
//         //     date: new Date(Date.UTC(year, month, day)),
//         // });

//         return c.json({ location: activity?.location || null });
//     } catch (err: any) {
//         c.status(400);
//         return c.json({ message: err.message });
//     }
// });

// export default LocationRoute