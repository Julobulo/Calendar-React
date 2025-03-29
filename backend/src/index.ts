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

app.post('/userColors', async (c) => {
  App = App || new Realm.App(c.env.ATLAS_APPID);
  const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
  const user = await App.logIn(credentials); // Attempt to authenticate
  const client = user.mongoClient("mongodb-atlas");
  const userCollection = client
    .db("calendar")
    .collection<User>("users");
  const activityCollection = client
    .db("calendar")
    .collection<UserActivity>("activity");

  const { userId } = await c.req.parseBody();
  const currentUser = await userCollection.findOne({ _id: new ObjectId(userId.toString()) });
  if (!currentUser) {
    c.status(400)
    return c.json({ message: "Failed to retrieve user" });
  }
  const currentUserActivities: UserActivity[] = await activityCollection.find({ userId: new ObjectId(userId.toString()) });
  if (!currentUserActivities.length) {
    c.status(400)
    return c.json({ message: "User doesn't have any activities" });
  }

  for (const activity of currentUserActivities) {
    for (const entry of activity.entries) {
      if (!(entry.activity in currentUser.colors)) {
        const randomColor = generateRandomColor();
        currentUser.colors[entry.activity] = randomColor; // update currentUser so for next iterations
        await userCollection.updateOne( // Update the user's colors in the database
          { _id: currentUser._id },
          { $set: { [`colors.${entry.activity}`]: randomColor } }
        );
      }
    }
  }
  return c.json({ message: "successfully updated user's colors" });
})

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
  const { userId, weekList }: { userId: ObjectId, weekList: any[] } = await c.req.json();

  // 1. Erase all existing activities
  console.log(`there are: ${(await activityCollection.find({ userId: new ObjectId(userId.toString()) })).length} documents in activity collection`);
  await activityCollection.deleteMany({ userId: new ObjectId(userId.toString()) });
  console.log(`now there are: ${(await activityCollection.find({ userId: new ObjectId(userId.toString()) })).length} documents in activity collection`);

  const currentUser = await userCollection.findOne({ _id: new ObjectId(userId.toString()) });

  // Set the start date (January 1, 2024)
  const startDate = new Date(Date.UTC(2024, 0, 1));

  // 2. Iterate over weekList and process each day's activities
  let currentDate = new Date(startDate); // Start from January 1, 2024

  for (let i = 0; i < weekList.length; i++) {
    const currentWeek = weekList[i];

    for (let j = 0; j < 7; j++) {
      const currentDayActivities = currentWeek[j];
      if (Object.keys(currentDayActivities).length > 0) {
        // const date = new Date(currentDate); // Clone the current date object
        const date = new Date(Date.UTC(currentDate.getUTCFullYear(), currentDate.getUTCMonth(), currentDate.getUTCDate()));

        const entries: ActivityEntry[] = [];

        // Iterate through the activities of the day
        for (const activityName in currentDayActivities) {
          if (currentDayActivities.hasOwnProperty(activityName)) {
            const description = currentDayActivities[activityName];

            // Check if the user already has a color for this activity
            let color = currentUser?.colors[activityName];
            if (!color) {
              // Update the user's colors collection to include the new color
              await userCollection.updateOne(
                { _id: userId },
                { $set: { [`colors.${activityName}`]: generateRandomColor() } }
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
