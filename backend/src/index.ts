import { Hono } from "hono";
import { cors } from "hono/cors";
import ActivityRoute from "./routes/activity/Activity";
import StatisticsRoute from "../src/routes/Statistics";
import SettingsRoute from "../src/routes/Settings";
import LocationRoute from "../src/routes/Location";
import { Env, Variables } from "./utils/types";
import { auth } from "./routes/auth";
import { mongoProxyRequest } from "./utils/mongoProxyClient";

const app = new Hono<{ Bindings: Env, Variables: Variables }>();


// setup cors policy
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://calendar.jules.tools"],
    allowMethods: ["GET", "POST", "DELETE", "PUT", "PATCH"],
    allowHeaders: ["Content-Type", "Authorization"],
    credentials: true, // Allow credentials (cookies, etc.)
  }),
);

app.get("/", async (c, next) => {
  const start = Date.now();
  await mongoProxyRequest(c, "findOne", {
    db: "calendar",
    coll: "users",
    filter: { email: "jules.caoeiros@gmail.com" },
    sort: { t: -1 },
    limit: 50,
  });

  const end = Date.now();

  return c.json({
    message: `Hello World! It took ${end - start} milli seconds to handle your request!`,
  });
});

app.onError((err, c) => {
  console.error("Global error:", err);

  if (err.message.includes("Unauthorized")) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (err.message.includes("MongoProxy")) {
    return c.json({ error: "Database error" }, 500);
  }

  // fallback
  return c.json({ error: `Internal server error` }, 500);
});

app.route('/auth', auth);
app.route('/activity', ActivityRoute);
app.route('/statistics', StatisticsRoute);
app.route('/settings', SettingsRoute);
app.route('/location', LocationRoute);

// app.get('/checkUserColors', async (c) => {
//   const db = await getDb(c, "calendar");
//   const userCollection = db.collection<User>("users");
//   const activityCollection = db.collection<UserActivity>('activity');

//   // const cookieHeader = c.req.header("Cookie");
//   // if (!cookieHeader) {
//   //   c.status(400);
//   //   return c.json({ message: "no cookies found" });
//   // }

//   // const cookies = cookieHeader.split(";").map((cookie) => cookie.trim());
//   // let token = cookies.find((cookie) => cookie.startsWith(`token=`));
//   // if (!token) {
//   //   c.status(400);
//   //   return c.json({ message: "no token found" });
//   // }
//   // token = token.split("=")[1].trim();

//   // const id = await checkToken(token, c.env.JWT_SECRET);
//   // if (!id) {
//   //   c.status(400);
//   //   return c.json({ message: "bad token" });
//   // }
//   const { id } = c.req.query();
//   console.log(`id: ${id}`);
//   if (!id) { c.status(400); return c.json({ message: "please pass an id in the parameters of the request" }) }
//   const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
//   if (!currentUser) {
//     c.status(400);
//     return c.json({ message: "Failed to retrieve user" });
//   }
//   // make sure colors.activities and colors.variables are defined
//   currentUser.colors.activities = currentUser.colors.activities || {};
//   currentUser.colors.variables = currentUser.colors.variables || {};

//   const currentUserActivities: UserActivity[] = await activityCollection.find({ userId: new ObjectId(id.toString()) });

//   if (!currentUserActivities.length) {
//     c.status(400);
//     return c.json({ message: "User doesn't have any activities" });
//   }

//   const usedColors = new Set<string>([
//     ...Object.values(currentUser.colors.activities || {}),
//     ...Object.values(currentUser.colors.variables || {}),
//     currentUser.colors.note,
//   ]);

//   const getUniqueColor = () => {
//     let color;
//     do {
//       color = generateRandomColor();
//     } while (usedColors.has(color));
//     usedColors.add(color);
//     return color;
//   };

//   let numberActivityColorCreated = 0, numberVariableColorCreated = 0, numberNoteColorCreated = 0;

//   // Add default activity colors
//   for (const [activity, color] of Object.entries(defaultActivities)) {
//     if (!(activity in currentUser.colors.activities)) {
//       currentUser.colors.activities[activity] = color;
//       numberActivityColorCreated += 1;
//       await userCollection.updateOne(
//         { _id: currentUser._id },
//         { $set: { [`colors.activities.${activity}`]: color } }
//       );
//     }
//   }
//   // Add default variable colors
//   for (const [variable, color] of Object.entries(defaultVariables)) {
//     if (!(variable in currentUser.colors.variables)) {
//       currentUser.colors.variables[variable] = color;
//       numberVariableColorCreated += 1;
//       await userCollection.updateOne(
//         { _id: currentUser._id },
//         { $set: { [`colors.variables.${variable}`]: color } }
//       );
//     }
//   }
//   // Add default note color
//   if (!currentUser.colors.note) {
//     currentUser.colors.note = defaultNoteColor;
//     numberNoteColorCreated += 1;
//     await userCollection.updateOne(
//       { _id: currentUser._id },
//       { $set: { "colors.note": defaultNoteColor } }
//     );
//   }

//   for (const activity of currentUserActivities) {
//     for (const entry of (activity?.entries || [])) {
//       // Assign activity color if missing
//       if (!currentUser.colors.activities || !(entry.activity in currentUser.colors.activities)) {
//         numberActivityColorCreated += 1;
//         const color = getUniqueColor();
//         currentUser.colors.activities[entry.activity] = color;
//         await userCollection.updateOne(
//           { _id: currentUser._id },
//           { $set: { [`colors.activities.${entry.activity}`]: color } }
//         );
//       }
//     }

//     // Assign variable colors if missing
//     for (const variableEntry of (activity?.variables || [])) {
//       if (!currentUser.colors.variables || !(variableEntry.variable in currentUser.colors.variables)) {
//         numberVariableColorCreated += 1;
//         const color = getUniqueColor();
//         currentUser.colors.variables[variableEntry.variable] = color;
//         await userCollection.updateOne(
//           { _id: currentUser._id },
//           { $set: { [`colors.variables.${variableEntry.variable}`]: color } }
//         );
//       }
//     }
//   }

//   let createdParts = [];

//   if (numberActivityColorCreated) {
//     createdParts.push(`${numberActivityColorCreated} activity color${numberActivityColorCreated > 1 ? 's' : ''}`);
//   }
//   if (numberVariableColorCreated) {
//     createdParts.push(`${numberVariableColorCreated} variable color${numberVariableColorCreated > 1 ? 's' : ''}`);
//   }
//   if (numberNoteColorCreated) {
//     createdParts.push(`1 note color`);
//   }

//   const createdSummary = createdParts.length > 0 ? `, creating ${createdParts.join(', ')}` : `, didn't create any new color`;

//   return c.json({ message: `Successfully updated user's colors${createdSummary}.` });
// });

// // Route to process the weekList and create new activities
// app.post('/importActivities', accessGuard, async (c) => {
//   const db = await getDb(c, "calendar");
//   const userCollection = db.collection<User>('users');
//   const activityCollection = db.collection<UserActivity>('activity');

//   const { userId, weekList, patching }: { userId: ObjectId, weekList: any[], patching?: boolean } = await c.req.json();

//   const currentUser = await userCollection.findOne({ _id: new ObjectId(userId.toString()) });

//   // Set the start date (January 1, 2024)
//   const startDate = new Date(Date.UTC(2024, 0, 1));

//   if (!patching) {
//     // 1. Erase all existing activities if not patching
//     console.log(`there are: ${(await activityCollection.find({ userId: new ObjectId(userId.toString()) })).length} documents in activity collection`);
//     await activityCollection.deleteMany({ userId: new ObjectId(userId.toString()) });
//     console.log(`now there are: ${(await activityCollection.find({ userId: new ObjectId(userId.toString()) })).length} documents in activity collection`);
//   }

//   // 2. Iterate over weekList and process each day's activities
//   let currentDate = new Date(startDate); // Start from January 1, 2024

//   for (let i = 0; i < weekList.length; i++) {
//     const currentWeek = weekList[i];

//     for (let j = 0; j < 7; j++) {
//       const currentDayActivities = currentWeek[j];
//       if (Object.keys(currentDayActivities).length > 0) {
//         const date = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));

//         // Check if the activity for this date already exists in the database (in patching mode)
//         if (patching) {
//           const existingActivity = await activityCollection.findOne({
//             userId: new ObjectId(userId.toString()),
//             date: date,
//           });

//           if (existingActivity) {
//             console.log(`Skipping activity for ${date} (already exists)`);
//             currentDate = new Date(Date.UTC(
//               currentDate.getUTCFullYear(),
//               currentDate.getUTCMonth(),
//               currentDate.getUTCDate() + 1
//             ));
//             continue; // Skip to the next day
//           }
//         }

//         const entries: ActivityEntry[] = [];

//         // Iterate through the activities of the day
//         for (const activityName in currentDayActivities) {
//           if (currentDayActivities.hasOwnProperty(activityName)) {
//             const description = currentDayActivities[activityName];

//             // Check if the user already has a color for this activity
//             let color = currentUser?.colors.activities[activityName];
//             if (!color) {
//               // Update the user's colors collection to include the new color
//               await userCollection.updateOne(
//                 { _id: userId },
//                 { $set: { [`colors.activities.${activityName}`]: generateRandomColor() } }
//               );
//             }

//             // Add the activity entry to the list
//             entries.push({
//               activity: activityName,
//               duration: getTimeFromLongString(description),
//               description,
//             });
//           }
//         }

//         // If there are any activities for this day, create an activity document
//         if (entries.length > 0) {
//           console.log(`added ${entries.length} activities for ${date}`);
//           const userActivity: NewUserActivity = {
//             userId: new ObjectId(userId.toString()),
//             date,
//             entries,
//           };

//           // Create the activity in the database
//           await activityCollection.insertOne(userActivity);
//         }
//       }

//       // Increment the date by one day after processing each day
//       currentDate = new Date(Date.UTC(
//         currentDate.getUTCFullYear(),
//         currentDate.getUTCMonth(),
//         currentDate.getUTCDate() + 1
//       ));
//     }
//   }

//   c.status(200);
//   return c.json({ message: "Activities imported successfully!" });
// });


export default app;
