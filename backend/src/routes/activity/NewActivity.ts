import { Hono } from "hono";
import { Env, NewActivityBody, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { User } from "../../models/UserModel";
import { badRequest, handleActivity, handleColors, handleNames, handleNote, handleVariable } from "../../utils/helpers";
import { UserActivity } from "../../models/UserActivityModel";


const NewActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

NewActivityRoute.post('/', accessGuard, async (c) => {
    try {
        const userId = c.var.user.id;
        const body = (await c.req.json()) as NewActivityBody;

        const { year, month, day, type, activity, description, note, variable } = body;
        if (year === undefined || month === undefined || day === undefined || !type) {
            return c.json({ message: "Missing required fields" }, 400);
        }

        const date = new Date(Date.UTC(year, month, day));

        const existingResp = await mongoProxyRequest<UserActivity>(c, "findOne", {
            db: "calendar",
            coll: "activity",
            filter: { userId, date }
        });
        const existingEntry = existingResp.result;

        const userResp = await mongoProxyRequest<User>(c, "findOne", {
            db: "calendar",
            coll: "users",
            filter: { _id: userId }
        });
        const currentUser = userResp.result;
        if (!currentUser) throw badRequest("User not found");

        const usedColors = new Set([
            ...Object.values(currentUser?.colors?.activities || {}),
            ...(currentUser?.colors?.note ? [currentUser.colors.note] : []),
            ...Object.values(currentUser?.colors?.variables || {})
        ]);
        const colorUpdates = handleColors(currentUser, usedColors, activity, variable);
        if (Object.keys(colorUpdates).length > 0) {
            await mongoProxyRequest(c, "updateOne", {
                db: "calendar",
                coll: "users",
                filter: { _id: userId },
                update: { $set: colorUpdates }
            });
            console.log("Added new color:", colorUpdates);
        }

        const nameUpdate = handleNames(currentUser, description, note);
        if (nameUpdate) {
            await mongoProxyRequest(c, "updateOne", {
                db: "calendar",
                coll: "users",
                filter: { _id: userId },
                update: nameUpdate
            });
            console.log("Updated names:", nameUpdate);
        }

        let updateQuery: any;
        switch (type) {
            case "activity":
                updateQuery = await handleActivity(body, existingEntry);
                break;

            case "variable":
                if (existingEntry?.variables?.some(v => v.variable === variable)) {
                    throw badRequest("Variable already defined for this date");
                }
                ({ updateQuery } = await handleVariable(body, existingEntry));
                break;

            case "note":
                updateQuery = await handleNote(body, existingEntry);
                break;

            default:
                return c.json({ message: "Invalid type" }, 400);
        }

        // upsert or update doc
        const filter = { userId, date };

        await mongoProxyRequest(c, "updateOne", {
            db: "calendar",
            coll: "activity",
            filter,
            update: updateQuery,
            upsert: true
        });

        return c.json({ message: `${type} added successfully` }, 200);
    } catch (err: any) {
        // if (err instanceof AppError) {
        //     return c.json({ message: err.message }, err.status);
        // }
        console.error("Unexpected error in NewActivityRoute:", err);
        return c.json({ message: "Internal server error" }, 500);
    }
});
export default NewActivityRoute