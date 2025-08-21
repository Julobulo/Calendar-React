import type { Context, Next } from "hono";
import { getCookie } from "hono/cookie";
import { checkToken } from "../../utils/helpers";

export async function accessGuard(c: Context, next: Next) {
  const token = getCookie(c, "token");
  if (!token) return c.json({ error: "Unauthorized" }, 401);

  try {
    const id = await checkToken(token, c.env.JWT_SECRET);
    if (!id) return c.json({ error: "Unauthorized" }, 401);
    const payload = { id };
    c.set("user", payload); // for now just id
    return next();
  } catch {
    return c.json({ error: "Unauthorized" }, 401);
  }
}