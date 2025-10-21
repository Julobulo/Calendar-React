import { Hono } from "hono";
import { AppError, Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { User } from "../../models/UserModel";
import { badRequest, generateRandomColor, handleActivity, handleColors, handleNames, handleNote, handleVariable } from "../../utils/helpers";
import { UserActivity } from "../../models/UserActivityModel";


const EditActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

EditActivityRoute.patch('/', accessGuard, async (c) => {
    const id = c.var.user.id;
    const body = await c.req.json();

    let { type, activity, description, note, variable, _id } = body;
    activity = (activity || "").trim();
    description = (description || "").trim();
    note = (note || "").trim();
    variable = (variable || "").trim();

    if (body.year === undefined || body.month === undefined || body.day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);
    const date = new Date(Date.UTC(+body.year, +body.month, +body.day));

    const existingResp = await mongoProxyRequest<UserActivity>(c, "findOne", {
        db: "calendar",
        coll: "activity",
        filter: { userId: id, date: new Date(date) },
    });
    const existingEntry = existingResp.result;

    if (!existingEntry) {
        c.status(400);
        return c.json({ message: "no entry for this day" });
    }

    const existingUser = await mongoProxyRequest<User>(c, "findOne", {
        db: "calendar",
        coll: "users",
        filter: { _id: id },
    });
    const currentUser = existingUser.result;
    const usedColors = new Set([
        ...(Object.values(currentUser?.colors?.activities || {})),
        ...(currentUser?.colors?.note ? [currentUser.colors.note] : []),
        ...(Object.values(currentUser?.colors?.variables || {}))
    ]);
    const colorUpdates = handleColors(currentUser, usedColors, activity, variable);
    if (Object.keys(colorUpdates).length > 0) {
        await mongoProxyRequest(c, "updateOne", {
            db: "calendar",
            coll: "users",
            filter: { _id: id },
            update: { $set: colorUpdates },
        });
        console.log(`added a color, ${JSON.stringify(colorUpdates)}`)
    }
    const nameUpdate = handleNames(currentUser, description, note);
    if (nameUpdate) {
        await mongoProxyRequest(c, "updateOne", {
            db: "calendar",
            coll: "users",
            filter: { _id: id },
            update: nameUpdate,
        });
    }

    let updateQuery;
    let res;
    try {
        switch (body.type) {
            case "activity":
                res = await handleActivity(body, existingEntry, _id);
                const updateActivity = await mongoProxyRequest<UserActivity>(c, "updateOne", {
                    db: "calendar",
                    coll: "activity",
                    filter: { userId: id, date: new Date(date) },
                    update: res.updateQuery,
                    arrayFilters: res.arrayFilters,
                });
                console.log(`updatedActivity: ${JSON.stringify(updateActivity)}, for filter and update: ${JSON.stringify(
                    {
                        filter: { userId: id, date: new Date(date) },
                        update: res.updateQuery,
                        arrayFilters: res.arrayFilters,
                    }
                )}`)

                break;
            case "variable":
                if (!existingEntry?.variables?.some(v => v.variable === variable)) {
                    return c.json({ message: "Variable not defined for this date" }, 400);
                }
                res = await handleVariable(body, existingEntry);
                await mongoProxyRequest<UserActivity>(c, "updateOne", {
                    db: "calendar",
                    coll: "activity",
                    filter: { userId: id, date: new Date(date) },
                    update: res.updateQuery,
                    arrayFilters: res.arrayFilters,
                });
                break;
            case "note":
                updateQuery = await handleNote(body, existingEntry, "edit");
                await mongoProxyRequest<UserActivity>(c, "updateOne", {
                    db: "calendar",
                    coll: "activity",
                    filter: { userId: id, date: new Date(date) },
                    update: updateQuery,
                    upsert: true,
                });
                break;
            default:
                return c.json({ message: "Invalid type" }, 400);
        }
    }
    catch (err) {
        if (typeof err === "object" && err !== null && "status" in err && "message" in err) {
            const appErr = err as AppError;
            return c.json({ message: appErr.message }, appErr.status);
        }
        // fallback for unexpected errors
        return c.json({ message: "Internal server error" }, 500);
    }

    return c.json({ message: "activity updated successfully" });
})


export default EditActivityRoute