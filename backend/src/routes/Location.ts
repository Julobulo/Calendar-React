import { Hono } from "hono";
import * as Realm from "realm-web";
import { checkToken, getDb, isActivityDocumentEmpty } from "../utils/helpers";
import { User } from "../models/UserModel";
import { ObjectId } from "bson";
import { UserActivity } from "../models/UserActivityModel";

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
    const db = await getDb(c, "calendar");
    const userCollection = db.collection<User>("users");
    const activityCollection = db.collection<UserActivity>('activity');

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

    return { userCollection, activityCollection, currentUser, userId: id };
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
        const { name, lat, lng } = body;
        if (!name || typeof lat !== "number" || typeof lng !== "number") {
            c.status(400);
            return c.json({ message: "Please send all required fields" });
        }

        const { userCollection, userId } = await getUser(c);

        await userCollection.updateOne(
            { _id: new ObjectId(userId.toString()) },
            {
                $push: {
                    savedLocations: { name, lat, lng }
                }
            }
        );

        return c.json({ message: "Location added successfully" });
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

LocationRoute.delete('/deleteLocation', async (c) => {
    try {
        const body = await c.req.json();
        const { name } = body;

        if (!name) {
            c.status(400);
            return c.json({ message: "Please provide the location name to delete" });
        }

        const { userCollection, userId, currentUser } = await getUser(c);

        if (!currentUser.savedLocations?.some(loc => loc.name === name)) { c.status(400); return c.json({ message: `Location '${name}' isn't a saved location` }) }

        await userCollection.updateOne(
            { _id: new ObjectId(userId.toString()) },
            {
                $pull: {
                    savedLocations: { name }
                }
            }
        );

        return c.json({ message: `Saved location '${name}' was deleted successfully` });
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

LocationRoute.put('/updateLocation', async (c) => {
    try {
        const body = await c.req.json();
        const { oldName, newName, latitude, longitude } = body;

        if (!oldName || !newName || typeof latitude !== "number" || typeof longitude !== "number") {
            c.status(400);
            return c.json({ message: "Please provide all required fields" });
        }

        const { userCollection, activityCollection, userId, currentUser } = await getUser(c);

        if (!currentUser.savedLocations?.find(loc => loc.name === oldName)) { c.status(400); return c.json({ message: `Location '${oldName}' not found` }) }

        await userCollection.updateOne(
            { _id: new ObjectId(userId.toString()) },
            {
                $set: {
                    "savedLocations.$[loc].name": newName,
                    "savedLocations.$[loc].lat": latitude,
                    "savedLocations.$[loc].lng": longitude
                }
            },
            {
                arrayFilters: [{ "loc.name": oldName }]
            }
        );

        if (!activityCollection) {
            throw new Error("Could not access activity collection");
        }

        await activityCollection.updateMany(
            {
                userId: new ObjectId(userId.toString()),
                "location.name": oldName
            },
            {
                $set: {
                    "location.name": newName,
                    "location.lat": latitude,
                    "location.lng": longitude
                }
            }
        );

        return c.json({ message: `Location '${oldName}' updated to '${newName}' with new coordinates successfully` });
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

LocationRoute.put('/dayLocation', async (c) => { // route to add and edit location
    try {
        const body = await c.req.json();
        const { year, month, day, name, lat, lng } = body;

        if (year === undefined || month === undefined || day === undefined || !name || typeof lat !== "number" || typeof lng !== "number") {
            c.status(400);
            return c.json({ message: "Missing date or location data" });
        }

        const { activityCollection, userId } = await getUser(c);

        const res = await activityCollection.updateOne(
            {
                userId: new ObjectId(userId.toString()),
                date: new Date(Date.UTC(year, month, day))
            },
            {
                $set: {
                    location: { name, lat, lng },
                    userId: new ObjectId(userId.toString()), // Needed in case of upsert
                    date: new Date(Date.UTC(year, month, day)) // Needed in case of upsert
                }
            },
            { upsert: true }
        );

        const message = res.upsertedId
            ? "New activity created with location"
            : res.modifiedCount === 1
                ? "Location added or updated for the day"
                : "Location was already up to date";

        return c.json({ message });
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

LocationRoute.delete('/dayLocation/delete', async (c) => {
    try {
        const { year, month, day } = await c.req.json();

        if (year === undefined || month === undefined || day === undefined) {
            c.status(400);
            return c.json({ message: "Missing date" });
        }

        const { activityCollection, userId } = await getUser(c);

        const existingEntry = await activityCollection.findOne({ userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) });
        if (!existingEntry) {
            c.status(404);
            return c.json({ message: "No activity entry found for that date" });
        }

        const updatedEntry = { ...existingEntry, location: undefined };

        if (isActivityDocumentEmpty(updatedEntry)) {
            // If no more activities, note, or variables remain, delete the document
            await activityCollection.deleteOne({ userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) });
            return c.json({ message: "Location removed, deleted document" });
        } else {
            // Otherwise, just unset the location
            const res = await activityCollection.updateOne(
                { userId: new ObjectId(userId.toString()), date: new Date(Date.UTC(year, month, day)) },
                { $unset: { location: "" } }
            );
            if (res.modifiedCount === 0) {
                c.status(400);
                return c.json({ message: "Failed to remove location" });
            }
            return c.json({ message: "Location removed from the day" });
        }
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

LocationRoute.post('/dayLocation/get', async (c) => {
    try {
        const { year, month, day } = await c.req.json();

        if (year === undefined || month === undefined || day === undefined) {
            c.status(400);
            return c.json({ message: "Missing date" });
        }

        const { activityCollection, userId } = await getUser(c);

        const activity = await activityCollection.findOne({
            userId: new ObjectId(userId.toString()),
            date: new Date(Date.UTC(year, month, day)),
        });

        return c.json({ location: activity?.location || null });
    } catch (err: any) {
        c.status(400);
        return c.json({ message: err.message });
    }
});

export default LocationRoute