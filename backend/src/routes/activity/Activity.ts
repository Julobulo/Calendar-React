import { Hono } from "hono";
import { ObjectId } from "bson";
import { ActivityEntry, NewUserActivity, UserActivity, Location } from "../../models/UserActivityModel";
import { User } from "../../models/UserModel";
import { asObjectId, badRequest, generateRandomColor, handleActivity, handleNote, handleVariable, isActivityDocumentEmpty } from "../../utils/helpers";
import { AppError, Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import ActivityInfoRoute from "./ActivityInfo";
import NewActivityRoute from "./NewActivity";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import EditActivityRoute from "./EditActivity";
import DeleteActivityRoute from "./DeleteActivity";

const ActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

ActivityRoute.route('/info', ActivityInfoRoute);
ActivityRoute.route('/new', NewActivityRoute);
ActivityRoute.route('/edit', EditActivityRoute)
ActivityRoute.route('/delete', DeleteActivityRoute)

ActivityRoute.get('/', accessGuard, async (c) => {
    const { year, month, day } = c.req.queries();

    const id = c.var.user.id

    let startDate, endDate;
    if (!day) {
        startDate = new Date(Number(year), Number(month) - 1, 20);
        endDate = new Date(Number(year), Number(month) + 1, 10);
    }
    else {
        startDate = new Date(Number(year), Number(month), Number(day));
        endDate = new Date(Number(year), Number(month), Number(day), 23, 59, 59, 999);
    }

    const response = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId: id, date: { $gte: startDate, $lte: endDate } },
    });
    const activities = response.result;

    return c.json(activities);
});



// ActivityRoute.get('/check-colors', accessGuard, async (c) => {
//     const db = await getDb(c, 'calendar');
//     const userCollection = db.collection<User>("users");
//     const activityCollection = db.collection<UserActivity>("activity");
//     const id = c.var.user.id

//     // Get user data
//     const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
//     if (!currentUser) {
//         c.status(400);
//         return c.json({ message: 'user not found' });
//     }

//     // Get all activities and variables
//     const activities = await activityCollection.find({ userId: new ObjectId(id.toString()) });
//     const usedColors = new Set([
//         ...Object.values(currentUser?.colors?.activities || {}),
//         ...(currentUser?.colors?.note || ''),
//         ...Object.values(currentUser?.colors?.variables || {}),
//     ]);

//     // Generate colors for missing activities and variables
//     const newColors: {
//         activities: { [activity: string]: string };
//         note: string;
//         variables: { [variable: string]: string };
//     } = { activities: {}, variables: {}, note: "" };

//     // Check each activity entry
//     activities.forEach((activity) => {
//         if (activity.entries) {
//             activity.entries.forEach((entry) => {
//                 if (!currentUser?.colors?.activities[entry.activity]) {
//                     let newColor = generateRandomColor();
//                     while (usedColors.has(newColor)) {
//                         newColor = generateRandomColor();
//                     }
//                     newColors.activities[entry.activity] = newColor;
//                     usedColors.add(newColor);
//                 }
//             });
//         }

//         if (activity.variables) {
//             // Check each variable in the activity
//             activity.variables?.forEach((variable) => {
//                 if (!currentUser?.colors?.variables[variable.variable]) {
//                     let newColor = generateRandomColor();
//                     while (usedColors.has(newColor)) {
//                         newColor = generateRandomColor();
//                     }
//                     newColors.variables[variable.variable] = newColor;
//                     usedColors.add(newColor);
//                 }
//             });
//         }
//     });

//     // Update the user's color data with new colors
//     const updatedColors = {
//         activities: { ...currentUser.colors.activities, ...newColors.activities },
//         variables: { ...currentUser.colors.variables, ...newColors.variables },
//         note: currentUser.colors.note,
//     };

//     await userCollection.updateOne(
//         { _id: new ObjectId(id.toString()) },
//         { $set: { colors: updatedColors } }
//     );

//     return c.json({ message: 'Colors updated successfully', colors: updatedColors });
// });


// UserActivities.find({
//     user: userId,                                // Filter by user
//     "entries.description": { $regex: /keyword/i } // Case-insensitive search for keyword
// });

export default ActivityRoute