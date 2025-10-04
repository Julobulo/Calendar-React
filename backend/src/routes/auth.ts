import { Hono } from "hono";
import { getCookie } from "hono/cookie";
import { verifyGoogleIdToken } from "../google";
import { signAccessToken, issueRefreshToken, hashRefreshToken } from "../auth";
import { setAccessCookie, setRefreshCookie, clearAuthCookies } from "../cookies";
import { ObjectId } from "bson";
import { AuthPayload, Env, Variables } from "../utils/types";
import { accessGuard } from "../middleware/auth";
import { defaultActivities, defaultNoteColor, defaultVariables, generateUsername } from "../utils/helpers";
import { restheartFind, restheartInsert, restheartUpdate } from "../utils/restheartHelpers";
import { User } from "../models/UserModel";
import { RefreshToken } from "../models/refreshTokenModel";

export const auth = new Hono<{ Bindings: Env, Variables: Variables }>();

auth.post("/google", async (c) => {
    console.log(`user trying to login with google`)
    const { idToken } = await c.req.json<{ idToken: string }>();
    const payload = await verifyGoogleIdToken(idToken, c.env.GOOGLE_CLIENT_ID!);

    if (!payload.sub) {
        return c.json({ error: "Invalid Google token" }, 401);
    }
    const existingResp = await restheartFind("calendarUsers", { email: payload.email }) as any;
    const existing = existingResp[0];

    let user = existing;
    if (!user) {
        console.log(`user doesn't exist`)
        const now = new Date();
        const newUser = {
            email: payload.email,
            username: generateUsername(),
            authentication: { strategy: "google", google_id: payload.sub },
            colors: { note: defaultNoteColor, activities: defaultActivities, variables: defaultVariables },
            names: [],
            savedLocations: [],
            createdAt: now,
            updatedAt: now,
        };
        const createdUserResp = await restheartInsert("calendarUsers", newUser) as any;
        user = createdUserResp._embedded?.documents?.[0];
    }


    // Issue tokens
    const access = await signAccessToken(user!, c.env);
    const refresh = await issueRefreshToken(user!, c, c.req.header("user-agent"), c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"));

    setAccessCookie(c, access);
    setRefreshCookie(c, refresh);

    return c.json({ ok: true });
});

// POST /auth/refresh  (cookie-based)
auth.post("/refresh", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");
    if (!refreshToken) return c.json({ error: "No refresh token" }, 401);

    const tokenHash = hashRefreshToken(refreshToken);

    const dbRefreshTokens = await restheartFind("refresh_tokens", { tokenHash, revokedAt: { $exists: false } }) as Array<RefreshToken>;
    const doc = dbRefreshTokens[0];
    if (!doc) return c.json({ error: "Invalid refresh token" }, 401);

    if (doc.expiresAt < new Date()) {
        // Expired, revoke
        // TODO use the restheart function
        await restheartUpdate("refresh_tokens", doc._id, { $set: { revokedAt: new Date() } })
        return c.json({ error: "Expired refresh token" }, 401);
    }

    // Load user
    const dbUsers = await restheartFind("calendarUsers", { _id: new ObjectId(doc.userId) }) as Array<User>;
    const user = dbUsers[0];
    if (!user) return c.json({ error: "User missing" }, 401);

    // ROTATE refresh token
    await restheartUpdate("refresh_tokens", doc._id, { $set: { revokedAt: new Date() } })
    const newRefresh = await issueRefreshToken(user, c, c.req.header("user-agent"), c.req.header("x-forwarded-for") || c.req.header("cf-connecting-ip"));

    // New access token
    const access = await signAccessToken(user, c.env);
    setAccessCookie(c, access);
    setRefreshCookie(c, newRefresh);

    return c.json({ ok: true });
});

// POST /auth/logout
auth.post("/logout", async (c) => {
    const refreshToken = getCookie(c, "refresh_token");
    if (refreshToken) {
        const tokenHash = hashRefreshToken(refreshToken);
        await restheartUpdate("refresh_tokens", { tokenHash, revokedAt: { $exists: false } }, { $set: { revokedAt: new Date() } })
    }
    clearAuthCookies(c);
    return c.json({ ok: true });
});

// GET /me
auth.get("/me", accessGuard, (c) => {
    const me = c.get("user") as undefined | AuthPayload;
    if (!me) return c.json({ user: null });
    return c.json({
        user: {
            _id: me.id,
        },
    });
});
