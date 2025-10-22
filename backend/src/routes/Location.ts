import { Hono } from "hono";
import { accessGuard } from "../middleware/auth";
import { Env, Variables } from "../utils/types";
import { mongoProxyRequest } from "../utils/mongoProxyClient";
import { isActivityDocumentEmpty } from "../utils/helpers";
import type { Location, UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";

export const LocationRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

// middleware: after accessGuard, load full user document into context
LocationRoute.use("*", accessGuard, async (c, next) => {
  const userId = c.var.user.id;
  const userResp = await mongoProxyRequest<User>(c, "findOne", {
    db: "calendar",
    coll: "users",
    filter: { _id: userId },
  });

  if (!userResp?.result) return c.json({ error: "User not found" }, 401);
  c.set("userDoc", userResp.result);
  await next();
});

LocationRoute.get("/savedLocations", async (c) => {
  const user = c.get("userDoc");
  return c.json(user?.savedLocations || []);
});

LocationRoute.post("/newLocation", async (c) => {
  const { name, lat, lng } = await c.req.json();
  if (!name || typeof lat !== "number" || typeof lng !== "number") {
    return c.json({ error: "Missing or invalid fields" }, 400);
  }

  const user = c.get("userDoc");

  await mongoProxyRequest<User>(c, "updateOne", {
    db: "calendar",
    coll: "users",
    filter: { _id: user?._id },
    update: { $push: { savedLocations: { name, lat, lng } } },
  });

  return c.json({ ok: true, message: "Location added" });
});

LocationRoute.delete("/deleteLocation", async (c) => {
  const { name } = await c.req.json();
  if (!name) return c.json({ error: "Location name required" }, 400);

  const user = c.get("userDoc");

  if (!user?.savedLocations?.some((loc: Location) => loc.name === name)) {
    return c.json({ error: `Location '${name}' not found` }, 404);
  }

  await mongoProxyRequest<User>(c, "updateOne", {
    db: "calendar",
    coll: "users",
    filter: { _id: user._id },
    update: { $pull: { savedLocations: { name } } },
  });

  return c.json({ ok: true, message: `Location '${name}' deleted` });
});

LocationRoute.put("/updateLocation", async (c) => {
  const { oldName, newName, latitude, longitude } = await c.req.json();
  if (!oldName || !newName || typeof latitude !== "number" || typeof longitude !== "number") {
    return c.json({ error: "Missing or invalid fields" }, 400);
  }

  const user = c.get("userDoc");

  if (!user?.savedLocations?.find((loc: Location) => loc.name === oldName)) {
    return c.json({ error: `Location '${oldName}' not found` }, 404);
  }

  // Update location inside user's savedLocations
  await mongoProxyRequest<User>(c, "updateOne", {
    db: "calendar",
    coll: "users",
    filter: { _id: user._id },
    update: {
      $set: {
        "savedLocations.$[loc].name": newName,
        "savedLocations.$[loc].lat": latitude,
        "savedLocations.$[loc].lng": longitude,
      },
    },
    arrayFilters: [{ "loc.name": oldName }],
  });

  // Also update all related calendarActivities
  await mongoProxyRequest<UserActivity>(c, "updateMany", {
    db: "calendar",
    coll: "activity",
    filter: { userId: user._id, "location.name": oldName },
    update: {
      $set: {
        "location.name": newName,
        "location.lat": latitude,
        "location.lng": longitude,
      },
    },
  });

  return c.json({ ok: true, message: `Updated '${oldName}' → '${newName}'` });
});

LocationRoute.put("/dayLocation", async (c) => {
  const { year, month, day, name, lat, lng } = await c.req.json();
  if (year == null || month == null || day == null || !name || typeof lat !== "number" || typeof lng !== "number") {
    return c.json({ error: "Missing date or location data" }, 400);
  }

  const user = c.get("userDoc");

  const date = new Date(Date.UTC(year, month, day));
  const res = await mongoProxyRequest<UserActivity>(c, "updateOne", {
    db: "calendar",
    coll: "activity",
    filter: { userId: user?._id, date },
    update: {
      $set: {
        location: { name, lat, lng },
        userId: user?._id,
        date,
      },
    },
    upsert: true,
  });

  return c.json({ ok: true, message: "Location added or updated" });
});

LocationRoute.delete("/dayLocation/delete", async (c) => {
  const { year, month, day } = await c.req.json();
  if (year == null || month == null || day == null) {
    return c.json({ error: "Missing date" }, 400);
  }

  const user = c.get("userDoc");
  const date = new Date(Date.UTC(year, month, day));

  const existing = await mongoProxyRequest<UserActivity>(c, "findOne", {
    db: "calendar",
    coll: "activity",
    filter: { userId: user?._id, date },
  });

  if (!existing?.result) return c.json({ error: "No entry found" }, 404);

  const updated = { ...existing.result, location: undefined };
  if (isActivityDocumentEmpty(updated)) {
    await mongoProxyRequest<UserActivity>(c, "deleteOne", {
      db: "calendar",
      coll: "activity",
      filter: { userId: user?._id, date },
    });
    return c.json({ ok: true, message: "Deleted empty activity document" });
  }

  await mongoProxyRequest<UserActivity>(c, "updateOne", {
    db: "calendar",
    coll: "activity",
    filter: { userId: user?._id, date },
    update: { $unset: { location: "" } },
  });

  return c.json({ ok: true, message: "Location removed" });
});

LocationRoute.post("/dayLocation/get", async (c) => {
  const { year, month, day } = await c.req.json();
  if (year == null || month == null || day == null) {
    return c.json({ error: "Missing date" }, 400);
  }

  const user = c.get("userDoc");
  const date = new Date(Date.UTC(year, month, day));

  const activity = await mongoProxyRequest<UserActivity>(c, "findOne", {
    db: "calendar",
    coll: "activity",
    filter: { userId: user?._id, date },
  });

  return c.json({ location: activity?.result?.location || null });
});

export default LocationRoute;
