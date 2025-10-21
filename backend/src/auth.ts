import { SignJWT, jwtVerify, importJWK } from "jose";
import type { JWTPayload } from "jose";
import type { User } from "./models/UserModel";
import { Context } from "hono";
import { Env } from "./utils/types";
import { mongoProxyRequest } from "./utils/mongoProxyClient";
import { asObjectId } from "./utils/helpers";

export async function hashRefreshToken(token: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(token);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    // convert to hex
    return Array.from(new Uint8Array(hashBuffer))
        .map((b) => b.toString(16).padStart(2, "0"))
        .join("");
}

export function generateRefreshTokenValue(length = 64): string {
    const array = new Uint8Array(length);
    crypto.getRandomValues(array);
    return btoa(String.fromCharCode(...array)) // convert to base64url
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
}

export async function signAccessToken(user: User, env: Env) {
    const ACCESS_TTL = parseInt(env.ACCESS_TOKEN_TTL || "3600", 10);
    const ACCESS_SECRET = new TextEncoder().encode(env.JWT_ACCESS_SECRET!);
    const id = asObjectId(user._id);
        // typeof user._id === "string"
        //     ? user._id
        //     : user._id?.$oid ?? user._id.toString();
    const payload: JWTPayload = {
        sub: id.toString(),
        email: user.email,
        strategy: user.authentication?.strategy
    };
    return await new SignJWT(payload)
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime(`${ACCESS_TTL}s`)
        .sign(ACCESS_SECRET);
}

// Verify access token
export async function verifyAccessToken(token: string, env: Env) {
    const ACCESS_SECRET = new TextEncoder().encode(env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    return payload;
}

export async function issueRefreshToken(user: User, c: Context, userAgent?: string, ip?: string) { // Create + persist refresh hashed token, return raw for cookie
    const REFRESH_TTL = parseInt(c.env.REFRESH_TOKEN_TTL || "1209600", 10); // 14d
    const raw = generateRefreshTokenValue();
    const tokenHash = await hashRefreshToken(raw);
    const now = new Date();
    const doc = {
        userId: user._id,
        tokenHash,
        userAgent,
        ip,
        expiresAt: new Date(now.getTime() + REFRESH_TTL * 1000),
        createdAt: now,
    };
    await mongoProxyRequest(c, "insertOne", {
        db: "calendar",
        coll: "refresh_tokens",
        doc,
    })
    console.log(`inserted a refresh token`)
    return raw;
}
