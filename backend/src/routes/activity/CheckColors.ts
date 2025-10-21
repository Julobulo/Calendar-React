import { Hono } from "hono";
import { Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { User } from "../../models/UserModel";
import { UserActivity } from "../../models/UserActivityModel";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { generateRandomColor } from "../../utils/helpers";

const CheckColorsRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

CheckColorsRoute.get('/', accessGuard, async (c) => {
    const id = c.var.user.id

    // Get user data
    const existingUser = await mongoProxyRequest<User>(c, "findOne", {
        db: "calendar",
        coll: "users",
        filter: { _id: id },
    });
    const currentUser = existingUser.result;
    if (!currentUser) {
        c.status(400);
        return c.json({ message: 'user not found' });
    }

    // Get all activities and variables
    const existingActivities = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId: id },
    });
    const activities = existingActivities.result;
    const usedColors = new Set([
        ...Object.values(currentUser?.colors?.activities || {}),
        ...(currentUser?.colors?.note || ''),
        ...Object.values(currentUser?.colors?.variables || {}),
    ]);

    // Generate colors for missing activities and variables
    const newColors: {
        activities: { [activity: string]: string };
        note: string;
        variables: { [variable: string]: string };
    } = { activities: {}, variables: {}, note: "" };

    // Check each activity entry
    activities.forEach((activity) => {
        if (activity.entries) {
            activity.entries.forEach((entry) => {
                if (!currentUser?.colors?.activities[entry.activity]) {
                    let newColor = generateRandomColor();
                    while (usedColors.has(newColor)) {
                        newColor = generateRandomColor();
                    }
                    newColors.activities[entry.activity] = newColor;
                    usedColors.add(newColor);
                }
            });
        }

        if (activity.variables) {
            // Check each variable in the activity
            activity.variables?.forEach((variable) => {
                if (!currentUser?.colors?.variables[variable.variable]) {
                    let newColor = generateRandomColor();
                    while (usedColors.has(newColor)) {
                        newColor = generateRandomColor();
                    }
                    newColors.variables[variable.variable] = newColor;
                    usedColors.add(newColor);
                }
            });
        }
    });

    // Update the user's color data with new colors
    const updatedColors = {
        activities: { ...currentUser.colors.activities, ...newColors.activities },
        variables: { ...currentUser.colors.variables, ...newColors.variables },
        note: currentUser.colors.note,
    };

    await mongoProxyRequest(c, "updateOne", {
        db: "calendar",
        coll: "users",
        filter: { _id: id },
        update: { $set: { colors: updatedColors } },
    });

    return c.json({ message: 'Colors updated successfully', colors: updatedColors });
});

export default CheckColorsRoute;