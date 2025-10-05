import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { jwtVerify } from "jose";

export async function accessGuard(c: Context, next: Next) {
  const token = getCookie(c, "access_token");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const ACCESS_SECRET = new TextEncoder().encode(c.env.JWT_ACCESS_SECRET!);
    const { payload } = await jwtVerify(token, ACCESS_SECRET);
    c.set("user", payload);
    // c.set("user", {
    //   id: payload.id,
    //   email: payload.email,
    // });
    console.log(`user payload: ${payload}, or other payload: ${JSON.stringify({
      id: payload.id,
      email: payload.email,
      role: payload.role ?? "user",
    })}`)
    return next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}