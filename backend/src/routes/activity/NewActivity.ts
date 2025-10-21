import { Hono } from "hono";
import { AppError, Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { User } from "../../models/UserModel";
import { badRequest, generateRandomColor, handleActivity, handleColors, handleNames, handleNote, handleVariable } from "../../utils/helpers";
import { UserActivity } from "../../models/UserActivityModel";


const NewActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

NewActivityRoute.post('/', accessGuard, async (c) => {
    const id = c.var.user.id;
    const body = await c.req.json();

    let { type, activity, description, note, variable } = body;

    if (body.year === undefined || body.month === undefined || body.day === undefined || !type) return c.json({ message: "Missing required fields" }, 400);
    const date = new Date(Date.UTC(+body.year, +body.month, +body.day));


    const existingResp = await mongoProxyRequest<UserActivity>(c, "findOne", {
        db: "calendar",
        coll: "activity",
        filter: { userId: id, date: new Date(date) },
    });
    const existingEntry = existingResp.result;

    // color logic
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
    try {

        switch (body.type) {
            case "activity":
                updateQuery = await handleActivity(body, existingEntry);
                break;
            case "variable":
                if (existingEntry?.variables?.some((v: any) => v.variable === variable)) {
                    badRequest("Variable already defined for this date");
                }
                ({ updateQuery } = await handleVariable(body, existingEntry));
                break;
            case "note":
                updateQuery = await handleNote(body, existingEntry);
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

    const filter = {
        userId: id,
        date: new Date(date),
    };

    if (!existingEntry) {
        const newDoc = {
            userId: id,
            date: new Date(date),
            entries: updateQuery?.$push?.entries ? [updateQuery.$push.entries] : [],
            variables: [],
        };
        console.log("Inserting new doc:", JSON.stringify(newDoc, null, 2));

        await mongoProxyRequest(c, "insertOne", {
            db: "calendar",
            coll: "activity",
            doc: newDoc
        })
    }
    else {
        // Try to update
        const updateResult = await mongoProxyRequest(c, "updateOne", {
            db: "calendar",
            coll: "activity",
            filter,
            update: updateQuery
        })
        console.log(`updateResult: ${JSON.stringify(updateResult)}`)
    }

    console.log(`${type} added successfully`)
    return c.json({ message: `${type} added successfully` }, 200);
})

export default NewActivityRoute