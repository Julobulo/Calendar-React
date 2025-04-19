import { Hono } from "hono";
import * as Realm from "realm-web";
import { checkToken } from "../utils/helpers";
import { User } from "../models/UserModel";
import { ObjectId } from "bson";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const LocationRoute = new Hono<{ Bindings: Bindings }>();

let App: Realm.App;

async function getUser(c: any) {
    App = App || new Realm.App(c.env.ATLAS_APPID);
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    const user = await App.logIn(credentials);
    const client = user.mongoClient("mongodb-atlas");
    const userCollection = client.db("calendar").collection<User>("users");

    const cookieHeader = c.req.header("Cookie");
    if (!cookieHeader) throw new Error("no cookie found");

    const cookies = cookieHeader.split(";").map((cookie: string) => cookie.trim());
    let token = cookies.find((cookie: string) => cookie.startsWith(`token=`));
    if (!token) throw new Error("no token found");

    token = token.split("=")[1].trim();
    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) throw new Error("bad token");

    const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    if (!currentUser) throw new Error("no user found");

    return { userCollection, currentUser, userId: id };
}

LocationRoute.get('/savedLocations', async (c) => {
    try {
        const { currentUser } = await getUser(c);
        return c.json(currentUser.savedLocations || []);
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

LocationRoute.post('/newLocation', async (c) => {
    try {
        const body = await c.req.json(); // use json() instead of parseBody() for application/json
        const { name, latitude, longitude } = body;
        if (!name || typeof latitude !== "number" || typeof longitude !== "number") {
            c.status(400);
            return c.json({ message: "Please send all required fields" });
        }

        const { userCollection, userId } = await getUser(c);

        await userCollection.updateOne(
            { _id: new ObjectId(userId.toString()) },
            {
                $push: {
                    savedLocations: { name, latitude, longitude }
                }
            }
        );

        return c.json({ message: "Location added successfully" });
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

export default LocationRoute