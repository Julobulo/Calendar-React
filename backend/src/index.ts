import { Hono } from "hono";
import { cors } from "hono/cors";
import * as Realm from "realm-web";
import { User } from "../models/UserModel";
import OAuthRoute from "../routes/Oauth";
import { ActivityEntry, NewUserActivity, UserActivity } from "../models/UserActivityModel";
import ActivityRoute from "../routes/Activity";
import { generateRandomColor } from "../../calendar/src/utils/helpers";
import { ObjectId } from "bson";

// The Worker's environment bindings
type Bindings = {
  ATLAS_APPID: string;
  ATLAS_APIKEY: string;
  PRIVATE_KEY: string; // private key used to sign jwt tokens
};

const app = new Hono<{ Bindings: Bindings }>();
let App: Realm.App;
const ObjectId = Realm.BSON.ObjectID;

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

// Input: A string that corresponds to a time, ex: "1h30min", or "1min", or "2h"
// Output: A number that corresponds to the number of minutes, ex: 90, 1, 120 (according to above's examples)
// Processing: splits the string, if there are two parts then the first is h, seconds is min, else either h or min, then add/multiply 60
function getTotalMinutesFromPattern(pattern: string) {
  // Split the pattern by 'h' and 'min'
  const parts = pattern.split('h').map(part => part.split('min')[0]);

  // Extract hours and minutes
  const hours = parseInt(parts[0]) || 0;
  const minutes = parseInt(parts[1]) || 0;

  // If there's no 'min', it's just hours
  if (pattern.includes('min') && !parts[1]) {
    return hours;
  }

  // Calculate total minutes
  return (hours * 60) + minutes;
}


// Input: minutes in number
// Output: human-readable time, ex: "3h 23min"
// Processing: divides the min/60 to get hours and % to get minutes, then adds "h " and "min"
function getHumanTimeFromMinutes(minutes: number) {
  // Convert total minutes to hours and remaining minutes
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  // Format total time and push to totalTimePerColumn array
  let ret = '';
  if (hours !== 0) {
    ret += `${hours}h `;
  }
  if (remainingMinutes !== 0) {
    ret += `${remainingMinutes}min`;
  }
  return ret
}

// Input: a string of an activity in a specific day, ex: "30min organiser bitwarden in folders, 20min starting with BugCrowd"
// Output: a list of times, like so ["3h20min", "23min", "1h"]
function identifyTimePatterns(inputString: string) {
  const patterns = [];

  // Regular expression to match the specified time patterns
  const timeRegex = /(\d{1,2})h\s*(\d{1,2})?min?|\b(\d{1,2})min\b|\b(\d{1,2})h\b/g;

  // Match time patterns in the input string
  let match;
  while ((match = timeRegex.exec(inputString)) !== null) {
    const timePattern = match[0];
    patterns.push(timePattern);
  }
  // console.log("Here are the patterns that are going to be returned:", patterns);
  return patterns;
}

// Input: a string
// Output: number of minutes that all the times in string contains
function getTimeFromLongString(input: string) {
  // Identify time patterns in the activity string
  const timePatterns = identifyTimePatterns(input);
  let totalMinutes = 0;

  // Calculate total minutes from each time pattern and sum them up
  timePatterns.forEach(pattern => {
    totalMinutes += getTotalMinutesFromPattern(pattern);
    // console.log(`for week ${weekNumber} and column ${column}, adding ${getTotalMinutesFromPattern(pattern)} minutes`);
  });

  return totalMinutes;
}

const weekList = [
  [
    {
      "Piano": '10min river flows in you',
      "Studying": '20min présentation ES',
      "Reading": '1h tome II (valentine est morte)',
      "Youtube": '40min',
      "Other": '10min speaking with Tito, 40min speaking with Aubin',
    },
    {
      "Piano": '30min piano class',
      "Studying": '40min exposé ES, 30min writing History studying sheets',
      "Reading": '40min',
      "Youtube": '20min',
      "Other": '20min talking with monordiaulycee support (can\'t get BIOS because I didn\'t graduate yet)',
    },
    {
      "Programming": '20min meeting with An (he added github secret), 1h30min meeting with Emile for his vrin website duplicate, 45min fixing github action IT WORKS!!!',
      "Piano": '10min',
      "Studying": '30min continuing to write History sheets',
      "Reading": '25min',
    },
    {
      "Programming": '20min trying to fix jules.tf dns (fixed it by setting ssl/tls mode to full in cloudflare)',
      "Piano": '40min river flows in you',
      "Studying": '30min chemistry exercises',
      "Reading": '10min',
      "Youtube": '40min',
    },
    {
      "Piano": '1h (can do almost all river flows in you)',
      "Studying": '45min writing history study sheets, 30min chemistry exercises',
      "Youtube": '30min poissond fécond + seth meyers',
      "Other": '15min calling tito about snowboarding (mom talked with people from ski station that said that it was fine taking classes in the bigger station)',
    },
    {
      "Programming": '1h10min started actual calendar project, 45min meeting with An',
      "Piano": '20min',
      "Studying": '30min ex 3 for maths expertes',
      "Reading": '1h30min almost finished tome II comte de Monte-Cristo',
      "Working out": '2h with Vasile at basic-fit tolbiac',
    },
    {
      "Programming": '20min contact@jules.tf WORKS!!!, 2h calendar.jules.tf frontend and backend (site online, google oauth, deployed cloudflare worker)',
      "Piano": '15min',
      "Studying": '20min spe maths exs, 45min DM de maths, 1h reading all my philosophy notes',
      "Application": '5min speaking about personal statement with dad',
      "Other": '20min telling Anna I want a vest and a hat and gloves for Christmas',
    },
  ],
];

app.post('/oldData', async (c) => {
  // Connect to MongoDB
  App = App || new Realm.App(c.env.ATLAS_APPID);
  const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
  const user = await App.logIn(credentials); // Attempt to authenticate
  const client = user.mongoClient("mongodb-atlas");
  const activityCollection = client
    .db("calendar")
    .collection<UserActivity>("activity");
  console.log('Connected to MongoDB');

  const startDate = new Date('2024-01-01'); // Start date of the data
  let currentDate = new Date(startDate);

  for (const week of weekList) {
    for (const day of week) {
      if (Object.keys(day).length > 0) {
        // Prepare entries in the correct format
        const entries = Object.entries(day).map(([activity, description]) => ({
          activity,
          duration: getTimeFromLongString(description),
          description, // Add descriptions if necessary
        }));

        if (!await activityCollection.findOne({ date: new Date(currentDate) })) {
          // Insert into database
          await activityCollection.insertOne({
            userId: new ObjectId('674cc6160ae28b370ffe69a6') as any, // Replace with the actual user ID
            date: new Date(currentDate),
            entries,
          });
          console.log(`Added data for ${currentDate.toISOString()}`);
        }
        else {
          console.log(`Didn't add data for ${currentDate.toISOString()} as it was already existing`)
        }
      }

      // Increment the date
      currentDate.setDate(currentDate.getDate() + 1);
    }
  }

  console.log('Data insertion completed');
  return c.json({ message: "successfully completed data insertion" });
})

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
  const { userId, weekList }: { userId: ObjectId, weekList: any[] } = await c.req.json();

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
