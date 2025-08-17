import { UserActivity } from "../models/UserActivityModel";

// function that checks if a token is valid, and if so, it returns the "id" field stored in the payload of the token
export const checkToken = async (token: string, secret: string): Promise<string | boolean> => {
    const encoder = new TextEncoder();

    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        return false;
    }

    const signedData = `${encodedHeader}.${encodedPayload}`;

    const signature = Uint8Array.from(
        atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
    );

    const key = await crypto.subtle.importKey(
        // Import secret key
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
    );

    const isValid = await crypto.subtle.verify(
        // verify the signature of the token
        "HMAC",
        key,
        signature,
        encoder.encode(signedData),
    );

    if (!isValid) {
        return false;
    }

    const payload = JSON.parse(
        atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
    ); // Decode the payload
    if (payload.exp && Date.now() >= payload.exp * 1000) {
        return false; // token expired
    }

    return payload.id; // return id that was in payload
}

export const isActivityDocumentEmpty = (doc: UserActivity) =>
    (!doc.entries || doc.entries.length === 0) &&
    (!doc.variables || doc.variables.length === 0) &&
    !doc.note &&
    !doc.location;

export const defaultActivities = {
    "Running": "#FF6B6B",
    "Studying": "#6BCB77",
    "Reading": "#4D96FF",
    "Coding": "#FFD93D",
    "Working out": "#A66DD4",
};

export const defaultVariables = {
    "Weight (kg)": "#C34A36",
    "Height (cm)": "#9B5DE5",
};

export const defaultNoteColor = "#D9EAFB";


import * as Realm from "realm-web";
import { Context } from "hono";

let app: Realm.App | null = null;
let cachedUser: Realm.User | null = null;

export async function getDb(c: Context, dbName: string) {
  if (!app) {
    app = new Realm.App({ id: c.env.ATLAS_APPID });
  }

  if (!cachedUser || !cachedUser.isLoggedIn) {
    const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY);
    cachedUser = await app.logIn(credentials);
  }

  const client = cachedUser.mongoClient("mongodb-atlas");
  return client.db(dbName);
}
