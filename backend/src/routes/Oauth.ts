import { Hono } from "hono";
import * as Realm from "realm-web";
import { User } from "../models/UserModel";
import { defaultActivities, defaultNoteColor, defaultVariables, generateUsername, getDb, getToken } from "../utils/helpers";

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
    const db = await getDb(c, 'calendar');
    const userCollection = db.collection<User>("users");

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
            colors: {
                note: defaultNoteColor,
                activities: defaultActivities,
                variables: defaultVariables
            },
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
        `token=${cookieToken}; Expires=${new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toUTCString()}}; Path=/; Domain=calendar.jules.tools;`,
    );

    // return c.redirect("http://localhost:5173");
    return c.redirect("https://calendar.jules.tools");
});

// Default route
OAuthRoute.get("/", (c) => c.text("Welcome to Google OAuth using Hono!"));

export default OAuthRoute;
