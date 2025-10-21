import { Hono } from "hono";
import { AppError, Env, Variables } from "../../utils/types";
import { accessGuard } from "../../middleware/auth";
import { mongoProxyRequest } from "../../utils/mongoProxyClient";
import { User } from "../../models/UserModel";
import { badRequest, generateRandomColor, handleActivity, handleNote, handleVariable } from "../../utils/helpers";
import { UserActivity } from "../../models/UserActivityModel";


const NewActivityRoute = new Hono<{ Bindings: Env, Variables: Variables }>();

// export async function handleColors(currentUser: User | null, usedColors: Set<string>, userId: string, activity: string, variable: string) {
//     // Assign color if not exists
//     if (activity && !currentUser?.colors?.activities?.[activity]) {
//         let newColor;
//         do {
//             newColor = generateRandomColor();
//         } while (usedColors.has(newColor));

//         // Ensure structure exists
//         await restheartUpdateOne("calendarUsers", userId,
//             {
//                 $setOnInsert: {
//                     "colors.activities": {},
//                     "colors.variables": {},
//                     "colors.note": ""
//                 }
//             },
//             { upsert: true })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId) },
//         //     {
//         //         $setOnInsert: {
//         //             "colors.activities": {},
//         //             "colors.variables": {},
//         //             "colors.note": ""
//         //         }
//         //     },
//         //     { upsert: true }
//         // );

//         // Set the activity color
//         await restheartUpdateOne("calendarUsers", userId,
//             { $set: { [`colors.activities.${activity}`]: newColor } })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId) },
//         //     { $set: { [`colors.activities.${activity}`]: newColor } }
//         // );
//     }

//     if (variable && !currentUser?.colors?.variables?.[variable]) {
//         let newColor;
//         do {
//             newColor = generateRandomColor();
//         } while (usedColors.has(newColor));

//         // Ensure structure exists (safe no-op if user already exists)
//         await restheartUpdateOne("calendarUsers", userId,
//             {
//                 $setOnInsert: {
//                     "colors.activities": {},
//                     "colors.variables": {},
//                     "colors.note": ""
//                 }
//             },
//             { upsert: true })
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $setOnInsert: {
//         //             "colors.activities": {},
//         //             "colors.variables": {},
//         //             "colors.note": ""
//         //         }
//         //     },
//         //     { upsert: true }
//         // );

//         await restheartUpdateOne("calendarUsers", userId,
//             { $set: { [`colors.variables.${variable}`]: newColor } })
//         // Now safely update the nested variable color
//         // await userCollection.updateOne(
//         //     { _id: new ObjectId(userId.toString()) },
//         //     {
//         //         $set: {
//         //             [`colors.variables.${variable}`]: newColor
//         //         }
//         //     }
//         // );
//     }
// }

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


    let updateQuery;
    try {

        switch (body.type) {
            case "activity":
                updateQuery = await handleActivity(body, existingEntry);
                // await handleColors(currentUser, usedColors, id, activity, '');
                break;
            case "variable":
                if (existingEntry?.variables?.some((v: any) => v.variable === variable)) {
                    badRequest("Variable already defined for this date");
                }
                ({ updateQuery } = await handleVariable(body, existingEntry));
                // await handleColors(currentUser, usedColors, id, '', variable);
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

    // Extract user names from the description (those after "@")
    // const mentionedNames = Array.from(new Set(`${description} ${note}`.match(/@(\w+)/g)?.map((name: string) => name.slice(1)) || [])); // Removing "@" symbol
    // if (mentionedNames.length > 0) {
    //     const currentUser = await restheartFindOne("calendarUsers", { _id: { $oid: asObjectId(id.toString()) } })
    //     // const currentUser = await userCollection.findOne({ _id: new ObjectId(id.toString()) });
    //     const updatedNames = [...new Set([...(currentUser?.names || []), ...mentionedNames])]; // Add new names without duplicates

    //     // Update user's names array with the new names
    //     if (updatedNames.length > (currentUser?.names?.length ?? 0)) {
    //         await restheartUpdateOne("calendarUsers", { _id: { $oid: asObjectId(id.toString()) } },
    //             { $set: { names: updatedNames } })
    //         // await userCollection.updateOne(
    //         //     { _id: new ObjectId(id.toString()) },
    //         //     { $set: { names: updatedNames } }
    //         // );
    //     }
    // }


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