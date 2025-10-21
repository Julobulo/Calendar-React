import { Hono } from "hono";
import { Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { isActivityDocumentEmpty } from "../../utils/helpers";
import { UserActivity } from "../../models/UserActivityModel";

const DeleteActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

DeleteActivityRoute.delete('/', accessGuard, async (c) => {
    const userId = c.var.user.id;
    const { year, month, day, type, activity, _id, variable } = await c.req.json();


    if (year === undefined || month === undefined || day === undefined || !type) {
        return c.json({ message: "Missing required fields" }, 400);
    }

    const date = new Date(Date.UTC(+year, +month, +day));
    const { result: existingEntry } = await mongoProxyRequest<UserActivity>(c, "findOne", {
        db: "calendar",
        coll: "activity",
        filter: { userId, date },
    });

    if (!existingEntry) {
        return c.json({ message: "No entry for this date" }, 400);
    }


    const deleteDoc = async (msg: string) => {
        await mongoProxyRequest(c, "deleteOne", {
            db: "calendar",
            coll: "activity",
            filter: { _id: existingEntry._id },
        });
        return c.json({ message: msg });
    };


    const updateDoc = async (update: object, msg: string) => {
        await mongoProxyRequest<UserActivity>(c, "updateOne", {
            db: "calendar",
            coll: "activity",
            filter: { _id: existingEntry._id },
            update,
        });
        return c.json({ message: msg });
    };


    switch (type) {
        case "activity": {
            if (!_id) return c.json({ message: "Missing activity ID" }, 400);

            const newEntries = existingEntry.entries.filter(e => e._id.toString() !== _id);
            if (newEntries.length === existingEntry.entries.length) {
                return c.json({ message: "Activity not found for this date" }, 400);
            }

            return isActivityDocumentEmpty({ ...existingEntry, entries: newEntries })
                ? deleteDoc("Activity deleted, no more entries for this day")
                : updateDoc({ $set: { entries: newEntries } }, "Activity deleted successfully");
        }

        case "note": {
            if (!existingEntry.note) return c.json({ message: "Note doesn't exist for this date" }, 400);

            return isActivityDocumentEmpty({ ...existingEntry, note: undefined })
                ? deleteDoc("Note deleted, no more entries for this day")
                : updateDoc({ $unset: { note: "" } }, "Note deleted successfully");
        }

        case "variable": {
            if (!variable) return c.json({ message: "Missing variable name" }, 400);

            const newVars = (existingEntry.variables || []).filter(v => v.variable !== variable);
            if (newVars.length === existingEntry.variables?.length) {
                return c.json({ message: "Variable not found for this date" }, 400);
            }

            return isActivityDocumentEmpty({ ...existingEntry, variables: newVars })
                ? deleteDoc("Variable deleted, no more entries for this day")
                : updateDoc({ $set: { variables: newVars } }, "Variable deleted successfully");
        }

        default:
            return c.json({ message: "Invalid type" }, 400);
    }
});

export default DeleteActivityRoute;
