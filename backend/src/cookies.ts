// src/server/cookies.ts
import type { Context } from "hono";
import { setCookie, deleteCookie } from "hono/cookie";

export function setAccessCookie(c: Context, accessToken: string) {
  setCookie(c, "access_token", accessToken, {
    httpOnly: true,
    secure: c.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/",
    maxAge: parseInt(c.env.ACCESS_TOKEN_TTL || "3600", 10),
    domain: c.env.COOKIE_DOMAIN || undefined,
  });
}
export function setRefreshCookie(c: Context, refreshToken: string) {
  setCookie(c, "refresh_token", refreshToken, {
    httpOnly: true,
    secure: c.env.NODE_ENV === "production",
    sameSite: "Lax",
    path: "/auth", // refresh endpoints only
    maxAge: parseInt(c.env.REFRESH_TOKEN_TTL || "1209600", 10),
    domain: c.env.COOKIE_DOMAIN || undefined,
  });
}

export function clearAuthCookies(c: any) {
  deleteCookie(c, "access_token", { path: "/", domain: c.env.COOKIE_DOMAIN || undefined });
  deleteCookie(c, "refresh_token", { path: "/auth", domain: c.env.COOKIE_DOMAIN || undefined });
}
