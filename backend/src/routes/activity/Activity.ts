import { Hono } from "hono";
import { UserActivity } from "../../models/UserActivityModel";
import { Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import ActivityInfoRoute from "./ActivityInfo";
import NewActivityRoute from "./NewActivity";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import EditActivityRoute from "./EditActivity";
import DeleteActivityRoute from "./DeleteActivity";
import CheckColorsRoute from "./CheckColors";

const ActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

ActivityRoute.route('/info', ActivityInfoRoute);
ActivityRoute.route('/new', NewActivityRoute);
ActivityRoute.route('/edit', EditActivityRoute)
ActivityRoute.route('/delete', DeleteActivityRoute)
ActivityRoute.route('/check-colors', CheckColorsRoute)

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
        // noLimit: true
    });
    const activities = response.result;

    return c.json(activities);
});

export default ActivityRoute