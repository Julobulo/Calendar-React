import { Hono } from "hono";
import { Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { User } from "../../models/UserModel";


const ActivityInfoRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

ActivityInfoRoute.get('/colors', accessGuard, async (c) => {
    const existingResp = await mongoProxyRequest<User>(c, "findOne", {
        db: "calendar",
        coll: "users",
        filter: { _id: c.var.user.id }
    });
    const currentUser = existingResp.result;

    const colors = currentUser?.colors;
    const usedColors = new Set([
        ...Object.values(currentUser?.colors?.activities || {}),
        ...(currentUser?.colors?.note || ""),
        ...Object.values(currentUser?.colors?.variables || {})
    ]);
    return c.json(colors);
})

ActivityInfoRoute.get('/names', accessGuard, async (c) => {
    const existingResp = await mongoProxyRequest<User>(c, "findOne", {
        db: "calendar",
        coll: "users",
        filter: { _id: c.var.user.id }
    });
    const currentUser = existingResp.result;
    const names = currentUser?.names;
    return c.json(names);
})

export default ActivityInfoRoute