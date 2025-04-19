import { Hono } from "hono";
import { cors } from "hono/cors";
import * as Realm from "realm-web";
import { User } from "../models/UserModel";
import OAuthRoute from "../routes/Oauth";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import ActivityRoute from "../routes/Activity";
import { generateRandomColor, getTimeFromLongString } from "../../calendar/src/utils/helpers";
import { ObjectId } from "bson";
import { checkToken } from "../utils/helpers";
import StatisticsRoute from "../routes/Statistics";
import SettingsRoute from "../routes/Settings";
import LocationRoute from "../routes/Location";

// The Worker's environment bindings
type Bindings = {
  ATLAS_APPID: string;
  ATLAS_APIKEY: string;
  PRIVATE_KEY: string; // private key used to sign jwt tokens
  JWT_SECRET: string;
};

const app = new Hono<{ Bindings: Bindings }>();
let App: Realm.App;

// Define type alias; available via `realm-web`
type Document = globalThis.Realm.Services.MongoDB.Document;

// set up cors policy
app.use(
  "*",
  cors({
    origin: ["http://localhost:5173", "https://calendar.jules.tf"],
    allowMethods: ["GET", "POST", "DELETE", "PUT", "PATCH"], // Allow these HTTP methods
    allowHeaders: ["Content-Type", "Authorization"], // Specify allowed headers
    credentials: true, // Allow credentials (cookies, etc.)
  }),
);

// route that returns the time it took to connect to database
app.get("/", async (c, next) => {
  const start = Date.now();
  const url = new URL(c.req.url);
  App = App || new Realm.App(c.env.ATLAS_APPID);

  const userID = url.searchParams.get("id") || "";

  try {
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials); // Attempt to authenticate
    const client = user.mongoClient("mongodb-atlas");
    const raceCollection = client
      .db("calendar")
      .collection<User>("users");
  } catch (err) {
    c.status(500);
    return c.json({ message: "Error with authentication." });
  }

  const end = Date.now();

  return c.json({
    message: `Hello World! It took ${end - start} milli seconds to handle your request!`,
  });
});

app.route('/oauth', OAuthRoute);
app.route('/activity', ActivityRoute);
app.route('/statistics', StatisticsRoute);
app.route('/settings', SettingsRoute);
app.route('/location', LocationRoute);

app.get('/checkUserColors', async (c) => {
  App = App || new Realm.App(c.env.ATLAS_APPID);
  const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
  const user = await App.logIn(credentials);
  const client = user.mongoClient("mongodb-atlas");

  const userCollection = client.db("calendar").collection<User>("users");
  const activityCollection = client.db("calendar").collection<UserActivity>("activity");

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

  if (!currentUser) {
    c.status(400);
    return c.json({ message: "Failed to retrieve user" });
  }

  const currentUserActivities: UserActivity[] = await activityCollection.find({ userId: new ObjectId(id.toString()) });

  if (!currentUserActivities.length) {
    c.status(400);
    return c.json({ message: "User doesn't have any activities" });
  }

  const usedColors = new Set<string>([
    ...Object.values(currentUser.colors.activities || {}),
    ...Object.values(currentUser.colors.variables || {}),
    currentUser.colors.note,
  ]);

  const getUniqueColor = () => {
    let color;
    do {
      color = generateRandomColor();
    } while (usedColors.has(color));
    usedColors.add(color);
    return color;
  };

  let numberActivityColorCreated = 0, numberVariableColorCreated = 0, numberNoteColorCreated = 0;

  for (const activity of currentUserActivities) {
    for (const entry of activity.entries) {
      // Assign activity color if missing
      if (!(entry.activity in currentUser.colors.activities)) {
        numberActivityColorCreated += 1;
        const color = getUniqueColor();
        currentUser.colors.activities[entry.activity] = color;
        await userCollection.updateOne(
          { _id: currentUser._id },
          { $set: { [`colors.activities.${entry.activity}`]: color } }
        );
      }
    }

    // Assign variable colors if missing
    for (const variableEntry of activity.variables || []) {
      if (!(variableEntry.variable in currentUser.colors.variables)) {
        numberVariableColorCreated += 1;
        const color = getUniqueColor();
        currentUser.colors.variables[variableEntry.variable] = color;
        await userCollection.updateOne(
          { _id: currentUser._id },
          { $set: { [`colors.variables.${variableEntry.variable}`]: color } }
        );
      }
    }

    // Assign note color if missing
    if (activity.note && !currentUser.colors.note) {
      numberNoteColorCreated = 1;
      const color = getUniqueColor();
      currentUser.colors.note = color;
      await userCollection.updateOne(
        { _id: currentUser._id },
        { $set: { "colors.note": color } }
      );
    }
  }

  let createdParts = [];

  if (numberActivityColorCreated) {
    createdParts.push(`${numberActivityColorCreated} activity color${numberActivityColorCreated > 1 ? 's' : ''}`);
  }
  if (numberVariableColorCreated) {
    createdParts.push(`${numberVariableColorCreated} variable color${numberVariableColorCreated > 1 ? 's' : ''}`);
  }
  if (numberNoteColorCreated) {
    createdParts.push(`1 note color`);
  }

  const createdSummary = createdParts.length > 0 ? `, creating ${createdParts.join(', ')}` : '';

  return c.json({ message: `Successfully updated user's colors${createdSummary}.` });
});

// Route to process the weekList and create new activities
app.post('/importActivities', async (c) => {
  App = App || new Realm.App(c.env.ATLAS_APPID);
  const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
  const user = await App.logIn(credentials);
  const client = user.mongoClient("mongodb-atlas");
  const userCollection = client
    .db("calendar")
    .collection<User>("users");
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

  const { userId, weekList, patching }: { userId: ObjectId, weekList: any[], patching?: boolean } = await c.req.json();

  const currentUser = await userCollection.findOne({ _id: new ObjectId(userId.toString()) });

  // Set the start date (January 1, 2024)
  const startDate = new Date(Date.UTC(2024, 0, 1));

  if (!patching) {
    // 1. Erase all existing activities if not patching
    console.log(`there are: ${(await activityCollection.find({ userId: new ObjectId(userId.toString()) })).length} documents in activity collection`);
    await activityCollection.deleteMany({ userId: new ObjectId(userId.toString()) });
    console.log(`now there are: ${(await activityCollection.find({ userId: new ObjectId(userId.toString()) })).length} documents in activity collection`);
  }

  // 2. Iterate over weekList and process each day's activities
  let currentDate = new Date(startDate); // Start from January 1, 2024

  for (let i = 0; i < weekList.length; i++) {
    const currentWeek = weekList[i];

    for (let j = 0; j < 7; j++) {
      const currentDayActivities = currentWeek[j];
      if (Object.keys(currentDayActivities).length > 0) {
        const date = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));

        // Check if the activity for this date already exists in the database (in patching mode)
        if (patching) {
          const existingActivity = await activityCollection.findOne({
            userId: new ObjectId(userId.toString()),
            date: date,
          });

          if (existingActivity) {
            console.log(`Skipping activity for ${date} (already exists)`);
            currentDate = new Date(Date.UTC(
              currentDate.getUTCFullYear(),
              currentDate.getUTCMonth(),
              currentDate.getUTCDate() + 1
            ));
            continue; // Skip to the next day
          }
        }

        const entries: ActivityEntry[] = [];

        // Iterate through the activities of the day
        for (const activityName in currentDayActivities) {
          if (currentDayActivities.hasOwnProperty(activityName)) {
            const description = currentDayActivities[activityName];

            // Check if the user already has a color for this activity
            let color = currentUser?.colors.activities[activityName];
            if (!color) {
              // Update the user's colors collection to include the new color
              await userCollection.updateOne(
                { _id: userId },
                { $set: { [`colors.activities.${activityName}`]: generateRandomColor() } }
              );
            }

            // Add the activity entry to the list
            entries.push({
              activity: activityName,
              duration: getTimeFromLongString(description),
              description,
            });
          }
        }

        // If there are any activities for this day, create an activity document
        if (entries.length > 0) {
          console.log(`added ${entries.length} activities for ${date}`);
          const userActivity: NewUserActivity = {
            userId: new ObjectId(userId.toString()),
            date,
            entries,
          };

          // Create the activity in the database
          await activityCollection.insertOne(userActivity);
        }
      }

      // Increment the date by one day after processing each day
      currentDate = new Date(Date.UTC(
        currentDate.getUTCFullYear(),
        currentDate.getUTCMonth(),
        currentDate.getUTCDate() + 1
      ));
    }
  }

  c.status(200);
  return c.json({ message: "Activities imported successfully!" });
});


export default app;
