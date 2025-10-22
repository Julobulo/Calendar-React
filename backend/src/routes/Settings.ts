import { Hono } from "hono";
import { UserActivity } from "../models/UserActivityModel";
import { fixOldActivityDocument } from "../utils/helpers";
import { accessGuard } from "../middleware/auth";
import { Env, Variables } from "../utils/types";
import { mongoProxyRequest } from "../utils/mongoProxyClient";

const SettingsRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

SettingsRoute.get("/export", accessGuard, async (c) => {
  const userId = c.var.user.id;

  const data = await mongoProxyRequest<UserActivity>(c, "find", {
    db: "calendar",
    coll: "activity",
    filter: { userId },
    noLimit: true,
  });

  return c.json(data.result ?? []);
});

SettingsRoute.post("/import", accessGuard, async (c) => {
  const userId = c.var.user.id;
  const body = await c.req.json();

  const entries = body.map((entry: any) => ({
    userId,
    date: new Date(entry.date),
    entries: entry.entries || [],
    note: entry.note || "",
    variables: entry.variables || [],
    location: entry.location || null,
  }));

  const results = [];

  for (const entry of entries) {
    const existingResp = await mongoProxyRequest<UserActivity>(c, "findOne", {
      db: "calendar",
      coll: "activity",
      filter: { userId, date: entry.date },
    });
    const existingActivity = existingResp.result;

    if (!existingActivity) {
      console.log(`${entry.date} doesn't exist in db, inserting document`);
      const insertResult = await mongoProxyRequest<UserActivity>(c, "insertOne", {
        db: "calendar",
        coll: "activity",
        doc: fixOldActivityDocument(entry),
      });
      results.push(insertResult);
    } else {
      const updateFields: Partial<UserActivity> = {};

      if (entry.note && !existingActivity.note) {
        updateFields.note = entry.note;
      }
      if (
        entry.variables?.length &&
        (!existingActivity.variables || existingActivity.variables.length === 0)
      ) {
        updateFields.variables = entry.variables;
      }
      if (entry.location && !existingActivity.location) {
        updateFields.location = entry.location;
      }

      if (Object.keys(updateFields).length > 0) {
        console.log(`Merging fields for ${entry.date}`);
        await mongoProxyRequest<UserActivity>(c, "updateOne", {
          db: "calendar",
          coll: "activity",
          filter: { _id: existingActivity._id },
          update: { $set: updateFields },
        });
      } else {
        console.log(`Entry already exists for day ${entry.date}`);
      }
    }
  }

  return c.json({
    message: `${results.length} new day${results.length > 1 ? "s" : ""} imported successfully`,
  });
});

SettingsRoute.post("/delete-all-data", accessGuard, async (c) => {
  const userId = c.var.user.id;

  await mongoProxyRequest<UserActivity>(c, "deleteMany", {
    db: "calendar",
    coll: "activity",
    filter: { userId },
  });

  return c.json({ message: "all data deleted successfully" });
});

export default SettingsRoute;
