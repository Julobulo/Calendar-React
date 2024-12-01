import { Hono } from "hono";
import { cors } from "hono/cors";
import * as Realm from "realm-web";
import { User } from "../models/UserModel";
import OAuthRoute from "../routes/Oauth";

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

export default app;
