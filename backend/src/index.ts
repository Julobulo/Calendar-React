import { Hono } from "hono";
import { cors } from "hono/cors";
import * as Realm from "realm-web";
import { User } from "../models/UserModel";
import OAuthRoute from "../routes/Oauth";
import { UserActivity } from "../models/UserActivityModel";

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
    {},
    {},
    {
      'TheOdinProject / OpenClassrooms': '40min',
      'Projets de web scraping pour Papa': '40min',
      'Piano': '20min',
    },
    {
      'TheOdinProject / OpenClassrooms': '35min',
      'CNED (français)': '1h',
      'Projets de web scraping pour Papa': '25min',
      'Other': '40min-setting up fiverr, 40min coding the school blocked urls detector',
    },
    {
      'CNED (français)': '30min (test)',
      'Projets de web scraping pour Papa': '40min',
      'Other': '30min-JS game',
    },
    {
      'CNED (français)': '3h',
      'Other': '1h (YT scripts)'
    },
    {
      'TheOdinProject / OpenClassrooms': '1h30min',
      'CNED (français)': '2h30min',
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
          duration: getHumanTimeFromMinutes(getTimeFromLongString(description)),
          description, // Add descriptions if necessary
        }));

        if (!await activityCollection.findOne({ date: new Date(currentDate) })) {
          // Insert into database
          await activityCollection.insertOne({
            userId: new ObjectId('674cc6160ae28b370ffe69a6'), // Replace with the actual user ID
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

export default app;
