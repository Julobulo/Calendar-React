import { Hono } from "hono";
import { accessGuard } from "../middleware/auth";
import { mongoProxyRequest } from "../utils/mongoProxyClient";
import { Env, Variables } from "../utils/types";
import { UserActivity } from "../models/UserActivityModel";
import { User } from "../models/UserModel";

const StatisticsRoute = new Hono<{ Bindings: Env; Variables: Variables }>();

/*
Line graph:
-> One graph for variables
    -> time range: last week, last month, last year, all time (reliable system)
    Info under the graph:
    -> sum of all the variable's values over time
    -> an average of the variable's values (per day and weeks, right under the chart)
*/

// Type returned by the lifetime-activity aggregation
type LifetimeActivityAgg = {
    _id: string;         // activity name
    totalTime: number;   // sum of minutes
};
// Type returned by the firstActivity aggregation
type FirstActivityAgg = {
    firstActivityDate: string; // ISO date string
};
StatisticsRoute.get("/lifetime-activity", accessGuard, async (c) => {
    const userId = c.var.user.id;

    const activities = await mongoProxyRequest<LifetimeActivityAgg[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $match: { userId } },
            { $unwind: "$entries" },
            {
                $addFields: {
                    entryMinutes: {
                        $let: {
                            vars: {
                                s: { $split: ["$entries.start", ":"] },
                                e: { $split: ["$entries.end", ":"] },
                            },
                            in: {
                                $max: [
                                    {
                                        $subtract: [
                                            {
                                                $add: [
                                                    { $multiply: [{ $toInt: { $arrayElemAt: ["$$e", 0] } }, 60] },
                                                    { $toInt: { $arrayElemAt: ["$$e", 1] } },
                                                ],
                                            },
                                            {
                                                $add: [
                                                    { $multiply: [{ $toInt: { $arrayElemAt: ["$$s", 0] } }, 60] },
                                                    { $toInt: { $arrayElemAt: ["$$s", 1] } },
                                                ],
                                            },
                                        ],
                                    },
                                    0,
                                ],
                            },
                        },
                    },
                },
            },
            {
                $group: {
                    _id: "$entries.activity",
                    totalTime: { $sum: "$entryMinutes" },
                },
            },
            { $sort: { totalTime: -1 } },
        ],
    });

    const firstActivity = await mongoProxyRequest<FirstActivityAgg[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $match: { userId } },
            { $sort: { date: 1 } },
            { $limit: 1 },
            { $project: { _id: 0, firstActivityDate: "$date" } },
        ],
    });

    return c.json({
        activities: activities.result?.map(a => ({
            activity: a._id,
            totalTime: a.totalTime,
        })) ?? [],
        firstActivityDate: firstActivity.result?.[0]?.firstActivityDate ?? null,
    });
});

// Type for daily activity count aggregation result
type DailyActivityCountAgg = {
    _id: string | Date; // the grouped date
    totalActivityCount: number;
    totalVariableCount: number;
    totalNote: number;
};
StatisticsRoute.get("/daily-activity-count", accessGuard, async (c) => {
    const userId = c.var.user.id;

    const res = await mongoProxyRequest<DailyActivityCountAgg[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $match: { userId } },
            {
                $project: {
                    date: 1,
                    activityCount: { $size: { $ifNull: ["$entries", []] } },
                    variableCount: { $size: { $ifNull: ["$variables", []] } },
                    noteExists: {
                        $cond: [{ $gt: [{ $strLenCP: { $ifNull: ["$note", ""] } }, 0] }, 1, 0],
                    },
                },
            },
            {
                $group: {
                    _id: "$date",
                    totalActivityCount: { $sum: "$activityCount" },
                    totalVariableCount: { $sum: "$variableCount" },
                    totalNote: { $sum: "$noteExists" },
                },
            },
            { $sort: { _id: 1 } },
        ],
    });

    const formatted = res.result?.map(d => ({
        date: new Date(d._id).toISOString().split("T")[0],
        count: {
            activityCount: d.totalActivityCount,
            variableCount: d.totalVariableCount,
            note: d.totalNote > 0 ? 1 : 0,
        },
    })) ?? [];

    return c.json(formatted);
});

StatisticsRoute.post("/line-graph-variable", accessGuard, async (c) => {
    const userId = c.var.user.id;
    const { varName, startDate, endDate } = await c.req.json();

    if (!varName) return c.json({ message: "varName required" }, 400);
    if (!endDate) return c.json({ message: "endDate required" }, 400);
    // startDate may be null (for "all")

    const start = startDate ? new Date(startDate) : null;
    const end = new Date(endDate);

    // Build dynamic filter
    const dateFilter: any = { $lte: end };
    if (start) dateFilter.$gte = start;

    const res = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: {
            userId,
            date: dateFilter
        },
        sort: { date: 1 },
        noLimit: true
    });

    const days = res.result ?? [];

    const output = days.flatMap(day => {
        if (!day.variables) return [];

        const found = day.variables.find(v => v.variable === varName);
        if (!found) return [];

        return [{
            date: day.date,
            value: found.value
        }];
    });

    return c.json(output);
});

StatisticsRoute.post("/line-graph-activity", accessGuard, async (c) => {
    const userId = c.var.user.id;
    const { activity, startDate, endDate } = await c.req.json();

    if (!activity) return c.json({ message: "activityName required" }, 400);
    if (!endDate) return c.json({ message: "endDate required" }, 400);
    // startDate may be null for "all"

    const start = startDate ? new Date(startDate) : null;
    const end = new Date(endDate);

    const dateFilter: any = { $lte: end };
    if (start) dateFilter.$gte = start;

    const res = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: {
            userId,
            date: dateFilter,
        },
        sort: { date: 1 },
        noLimit: true,
    });

    const days = res.result ?? [];

    const toMinutes = (t: string) => {
        const [h, m] = t.split(":").map(Number);
        return h * 60 + m;
    };

    const output = days.flatMap(day => {
        if (!day.entries || day.entries.length === 0) return [];

        const totalMinutes = day.entries.reduce((sum, e) => {
            if (e.activity !== activity) return sum;
            if (!e.start || !e.end) return sum; // skip if no time info

            const startMin = toMinutes(e.start);
            const endMin = toMinutes(e.end);

            if (isNaN(startMin) || isNaN(endMin) || endMin <= startMin) return sum;
            return sum + (endMin - startMin);
        }, 0);

        if (totalMinutes === 0) return [];

        return [{
            date: day.date,
            minutes: totalMinutes,
        }];
    });

    return c.json(output);
});


StatisticsRoute.get("/latest-week-data", accessGuard, async (c) => {
    const userId = c.var.user.id;
    const today = new Date();
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setUTCDate(today.getUTCDate() - 7);

    const res = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId, date: { $gte: sevenDaysAgo } },
        sort: { date: 1 },
        limit: 7,
    });

    return c.json(res.result ?? []);
});

StatisticsRoute.get("/getAllLocations", accessGuard, async (c) => {
    const userId = c.var.user.id;

    const res = await mongoProxyRequest<UserActivity[]>(c, "find", {
        db: "calendar",
        coll: "activity",
        filter: { userId, location: { $exists: true, $ne: null } },
    });

    const locations = (res.result ?? [])
        .filter(d => d.location)
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
        .map(d => ({
            name: d.location!.name,
            lat: d.location!.lat,
            lng: d.location!.lng,
            date: d.date,
        }));

    return c.json(locations);
});


type ActivityAggResult = {
    _id: null;
    totalActivities: number;
};
StatisticsRoute.get("/dbCount", async (c) => {
    const userCountRes = await mongoProxyRequest<User>(c, "countDocuments", {
        db: "calendar",
        coll: "users",
    });

    const activityAgg = await mongoProxyRequest<ActivityAggResult[]>(c, "aggregate", {
        db: "calendar",
        coll: "activity",
        pipeline: [
            { $project: { entriesCount: { $size: { $ifNull: ["$entries", []] } } } },
            { $group: { _id: null, totalActivities: { $sum: "$entriesCount" } } },
        ],
    });

    // currently logged-in users: unique userIds with at least one non-revoked token
    const loggedInAgg = await mongoProxyRequest<any>(c, "aggregate", {
        db: "calendar",
        coll: "refresh_tokens",
        pipeline: [
            {
                $match: {
                    $or: [{ revokedAt: { $exists: false } }, { revokedAt: null }],
                },
            },
            { $group: { _id: "$userId" } },
            { $count: "uniqueLoggedInUsers" },
        ],
    });

    return c.json({
        userCount: userCountRes.result,
        activityCount: activityAgg.result?.[0]?.totalActivities ?? 0,
        loggedInCount: loggedInAgg.result?.[0]?.uniqueLoggedInUsers ?? 0,

    });
});

StatisticsRoute.get("/activeUsers", async (c) => {
    // Count users that have at least one refresh token
    const activeUserRes = await mongoProxyRequest<User>(c, "countDocuments", {
        db: "calendar",
        coll: "user",
        query: { refresh_tokens: { $exists: true, $not: { $size: 0 } } }, // only users with non-empty refresh_tokens
    });

    return c.json({
        activeUserCount: activeUserRes.result,
    });
});


export default StatisticsRoute;
