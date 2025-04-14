import { Hono } from "hono";
import * as Realm from "realm-web";
import { User } from "../models/UserModel";
import {
    uniqueNamesGenerator,
    adjectives,
    colors,
    animals,
} from "unique-names-generator";
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

const OAuthRoute = new Hono<{ Bindings: Bindings }>();

let App: Realm.App;

// function that returns a token
async function getToken(id: string, secret: string): Promise<string> {
    const header = {
        alg: "HS256",
        typ: "JWT",
    };
    const payload = {
        id,
        exp: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // 3 days in seconds
    };

    const encoder = new TextEncoder();

    const encodedHeader = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const token = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        // Create HMAC-SHA256 signature
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign(
        // sign the token
        "HMAC",
        key,
        encoder.encode(token),
    );

    const encodedSignature = btoa(
        String.fromCharCode(...new Uint8Array(signature)),
    ) // Convert signature to base64url
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    return `${token}.${encodedSignature}`;
}

// function that checks if a token is valid, and if so, it returns the "id" field stored in the payload of the token
async function checkToken(token: string, secret: string): Promise<boolean> {
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

// Step 1: Redirect user to Google's OAuth consent screen
OAuthRoute.get("/google", (c) => {
    const GOOGLE_AUTH_URL = "https://accounts.google.com/o/oauth2/v2/auth";
    const url = new URL(GOOGLE_AUTH_URL);
    url.searchParams.set("client_id", c.env.GOOGLE_CLIENT_ID);
    url.searchParams.set("redirect_uri", c.env.REDIRECT_URI);
    url.searchParams.set("response_type", "code");
    url.searchParams.set("scope", "openid email");
    url.searchParams.set("state", "optional-csrf-token"); // Replace or enhance as needed

    return c.redirect(url.toString());
});

// Step 2: Handle callback and exchange authorization code for tokens
OAuthRoute.get("/google/callback", async (c) => {
    const code = c.req.query("code");
    if (!code) {
        return c.text("Authorization code not provided.", 400);
    }

    const GOOGLE_TOKEN_URL = "https://oauth2.googleapis.com/token";

    const tokenResponse = await fetch(GOOGLE_TOKEN_URL, {
        method: "POST",
        headers: {
            "Content-Type": "application/x-www-form-urlencoded",
        },
        body: new URLSearchParams({
            code,
            client_id: c.env.GOOGLE_CLIENT_ID,
            client_secret: c.env.GOOGLE_CLIENT_SECRET,
            redirect_uri: c.env.REDIRECT_URI,
            grant_type: "authorization_code",
        }).toString(),
    });

    if (!tokenResponse.ok) {
        const error = await tokenResponse.text();
        return c.text(`Failed to fetch token: ${error}`, 500);
    }

    const tokenData = (await tokenResponse.json()) as any;
    if (!tokenData.access_token) {
        return c.text("Failed to obtain access token.", 500);
    }

    // Step 3: Fetch user info
    const GOOGLE_USER_INFO_URL = "https://www.googleapis.com/oauth2/v3/userinfo";

    const userInfoResponse = await fetch(GOOGLE_USER_INFO_URL, {
        headers: {
            Authorization: `Bearer ${tokenData.access_token}`,
        },
    });
    const userInfo = (await userInfoResponse.json()) as {
        email: string;
        sub: string;
    };

    if (!userInfoResponse.ok) {
        const error = await userInfoResponse.text();
        return c.text(`Failed to fetch user info: ${error}`, 500);
    }

    // connecting to the database
    App = App || new Realm.App(c.env.ATLAS_APPID || "");
    try {
        const credentials = Realm.Credentials.apiKey(c.env.ATLAS_APIKEY || "");
        const user = await App.logIn(credentials);
        var client = user.mongoClient("mongodb-atlas");
    } catch (err) {
        console.error("Error with authentication.", err);
        c.status(500);
        return c.json({ message: `internal server error: ${err}` });
    }
    const userCollection = client
        .db("calendar")
        .collection<User>("users");

    let user = (await userCollection.findOne({
        "authentication.strategy": "google",
        "authentication.google_id": userInfo.sub,
    })) as User;
    console.log(`user exists: ${user?._id}`);

    if (!user) {
        console.log("creating user for google oauth");
        const result = (await userCollection.insertOne({
            username: generateUsername(),
            email: userInfo.email,
            createdAt: new Date(),
            authentication: {
                strategy: "google",
                google_id: userInfo.sub,
            },
            colors: {note:"#D9EAFB", activities:{}, variables: {}},
            names: [],
        })) as any;
        // Fetch the full user document using the insertedId
        user = (await userCollection.findOne({ _id: result.insertedId })) as User;
    }
    console.log(`user: ${JSON.stringify(user)}`);

    // add cookie with jwt token to response
    const cookieToken = await getToken(user._id.toString(), c.env.JWT_SECRET);
    c.res.headers.append(
        // set a cookie to a token generated and signed
        "Set-Cookie",
        `token=${cookieToken}; Expires=${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000)}; Path=/; Domain=calendar.jules.tf; Secure; SameSite=None`,
    );

    // return c.redirect("http://localhost:5173");
    return c.redirect("https://calendar.jules.tf");
});

// Generate a funny username
const generateUsername = () => {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals], // Use adjectives and nouns
        separator: "", // Space between the words
        length: 2, // One adjective + one noun
        style: "capital", // Capitalize each word (optional)
    });
};

// Default route
OAuthRoute.get("/", (c) => c.text("Welcome to Google OAuth using Hono!"));

export default OAuthRoute;
