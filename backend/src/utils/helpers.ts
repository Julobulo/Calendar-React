import { ActivityEntry, UserActivity } from "../models/UserActivityModel";

// function that returns a token
export async function getToken(id: string, secret: string): Promise<string> {
    const header = {
        alg: "HS256",
        typ: "JWT",
    };
    const payload = {
        id,
        exp: Math.floor(Date.now() / 1000) + 3 * 24 * 60 * 60, // 3 days in seconds
    };

    const encoder = new TextEncoder();

    const encodedHeader = btoa(JSON.stringify(header))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const encodedPayload = btoa(JSON.stringify(payload))
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    const token = `${encodedHeader}.${encodedPayload}`;

    const key = await crypto.subtle.importKey(
        // Create HMAC-SHA256 signature
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["sign"],
    );

    const signature = await crypto.subtle.sign(
        // sign the token
        "HMAC",
        key,
        encoder.encode(token),
    );

    const encodedSignature = btoa(
        String.fromCharCode(...new Uint8Array(signature)),
    ) // Convert signature to base64url
        .replace(/\+/g, "-")
        .replace(/\//g, "_")
        .replace(/=+$/, "");
    return `${token}.${encodedSignature}`;
}

// function that checks if a token is valid, and if so, it returns the "id" field stored in the payload of the token
export const checkToken = async (token: string, secret: string): Promise<string | boolean> => {
    const encoder = new TextEncoder();

    const [encodedHeader, encodedPayload, encodedSignature] = token.split(".");

    if (!encodedHeader || !encodedPayload || !encodedSignature) {
        return false;
    }

    const signedData = `${encodedHeader}.${encodedPayload}`;

    const signature = Uint8Array.from(
        atob(encodedSignature.replace(/-/g, "+").replace(/_/g, "/")),
        (c) => c.charCodeAt(0),
    );

    const key = await crypto.subtle.importKey(
        // Import secret key
        "raw",
        encoder.encode(secret),
        { name: "HMAC", hash: "SHA-256" },
        false,
        ["verify"],
    );

    const isValid = await crypto.subtle.verify(
        // verify the signature of the token
        "HMAC",
        key,
        signature,
        encoder.encode(signedData),
    );

    if (!isValid) {
        return false;
    }

    const payload = JSON.parse(
        atob(encodedPayload.replace(/-/g, "+").replace(/_/g, "/")),
    ); // Decode the payload
    if (payload.exp && Date.now() >= payload.exp * 1000) {
        return false; // token expired
    }

    return payload.id; // return id that was in payload
}

export const isActivityDocumentEmpty = (doc: UserActivity) =>
    (!doc.entries || doc.entries.length === 0) &&
    (!doc.variables || doc.variables.length === 0) &&
    !doc.note &&
    !doc.location;

export const defaultActivities = {
    "Running": "#FF6B6B",
    "Studying": "#6BCB77",
    "Reading": "#4D96FF",
    "Coding": "#FFD93D",
    "Working out": "#A66DD4",
};

export const defaultVariables = {
    "Weight (kg)": "#C34A36",
    "Height (cm)": "#9B5DE5",
};

export const defaultNoteColor = "#D9EAFB";

import { uniqueNamesGenerator, adjectives, colors, animals } from "unique-names-generator";
import { ObjectId } from "bson";
import { AppError } from "./types";

// Generate a funny username
export const generateUsername = () => {
    return uniqueNamesGenerator({
        dictionaries: [adjectives, colors, animals], // Use adjectives and nouns
        separator: "", // Space between the words
        length: 2, // One adjective + one noun
        style: "capital", // Capitalize each word (optional)
    });
};

export const fixOldActivityDocument = (oldActivityDoc: any): UserActivity => {
    return {
        _id: oldActivityDoc._id || new ObjectId(),
        userId: oldActivityDoc.userId,
        date: new Date(oldActivityDoc.date),
        entries: (oldActivityDoc.entries || []).map((entry: any) => {
            const fixedEntry: ActivityEntry = {
                _id: entry._id || new ObjectId(),
                activity: entry.activity,
                description: entry.description || "",
                location: entry.location,
            };

            // Case 1: entry has duration only
            if (entry.duration && !entry.time) {
                fixedEntry.start = "00:00";
                // Add duration to midnight
                const minutes = entry.duration;
                const hours = Math.floor(minutes / 60).toString().padStart(2, "0");
                const mins = (minutes % 60).toString().padStart(2, "0");
                fixedEntry.end = `${hours}:${mins}`;
            }

            // Case 2: entry has time + duration
            else if (entry.duration && entry.time) {
                fixedEntry.start = entry.time;

                const [h, m] = entry.time.split(":").map(Number);
                const totalMinutes = h * 60 + m + entry.duration;
                const endH = Math.floor(totalMinutes / 60).toString().padStart(2, "0");
                const endM = (totalMinutes % 60).toString().padStart(2, "0");

                fixedEntry.end = `${endH}:${endM}`;
            }

            // Case 3: entry already has start/end (leave untouched)
            else if (entry.start && entry.end) {
                fixedEntry.start = entry.start;
                fixedEntry.end = entry.end;
            }
            console.log(`entry before: ${entry}`)
            return fixedEntry;
        }),
        note: oldActivityDoc.note,
        variables: oldActivityDoc.variables,
        location: oldActivityDoc.location,
    };
};

function parseTimeToMinutes(time: string): number {
    const [h, m] = time.split(":").map(Number);
    return h * 60 + m;
}

function minutesToTime(totalMinutes: number): string {
    const hours = Math.floor(totalMinutes / 60) % 24;
    const minutes = totalMinutes % 60;
    return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
}

export function badRequest(message: string): never {
    throw { status: 400, message } as AppError;
}

export function computeStartFromEnd(end: string, description: string): string {
    const duration = getTimeFromLongString(description);
    const endMinutes = parseTimeToMinutes(end);
    const startMinutes = (endMinutes - duration + 24 * 60) % (24 * 60); // wrap around backwards
    const start = minutesToTime(startMinutes);
    if (start === end) {
        badRequest("Start time cannot equal end time");
    }
    return start;
}

function computeEndFromStart(start: string, description: string): string {
    const duration = getTimeFromLongString(description);
    const startMinutes = parseTimeToMinutes(start);
    const endMinutes = startMinutes + duration;
    const end = minutesToTime(endMinutes);
    if (end === start) {
        badRequest("End time cannot equal start time");
    }
    return end;
}

export async function handleActivity(
    body: any,
    existingEntry: UserActivity | null,
    editingId?: string, // pass this for edit mode
): Promise<any> {
    const activity = (body.activity || "").trim();
    const description = (body.description || "").trim();
    if (!activity || !description) badRequest("Missing activity fields");
    if (activity.length > 100) badRequest("Activity name too long");
    if (description.length > 500) badRequest("Description too long");

    const startProvided = (body.start || "").trim();
    const endProvided = (body.end || "").trim();

    let start = startProvided;
    let end = endProvided;

    if (startProvided && endProvided) {
        if (startProvided === endProvided) {
            badRequest("Start and end time cannot be the same");
        }
    } else if (startProvided && !endProvided) {
        end = computeEndFromStart(startProvided, description);
    } else if (!startProvided && endProvided) {
        start = computeStartFromEnd(endProvided, description);
    } else {
        throw badRequest("Either start or end time must be defined");
    }

    const location = body.location;

    if (editingId) {
        // Make sure the activity exists
        const existing = existingEntry?.entries?.find(e => e._id.toString() === editingId);
        if (!existing) badRequest("Activity with this ID does not exist");

        // Build the $set update and arrayFilters
        const updateQuery = {
            $set: {
                "entries.$[elem].activity": activity,
                "entries.$[elem].description": description,
                "entries.$[elem].start": start,
                "entries.$[elem].end": end,
                "entries.$[elem].location": location,
            }
        };
        const arrayFilters = [{ "elem._id": new ObjectId(editingId) }];

        return { updateQuery, arrayFilters };
    }


    // CREATE MODE
    const newEntry: ActivityEntry = {
        _id: new ObjectId(),
        activity,
        description,
        start,
        end,
        location,
    };

    if (existingEntry) {
        if ((existingEntry?.entries?.length || 0) >= 100) {
            badRequest("Too many activities for this day");
        }
        if (existingEntry?.entries?.some(e => e.activity === activity && e.start === start)) {
            badRequest("Activity with the same start time already exists");
        }
        return { $push: { entries: newEntry } };
    } else {
        return {
            $setOnInsert: {
                entries: [newEntry],
                variables: [],
            },
        };
    }
}

export async function handleVariable(
    body: any,
    existingEntry: UserActivity | null,
) {
    const variable = (body.variable || "").trim();
    const value = (body.value || "").trim();
    if (!variable || !value) badRequest("Missing variable fields");
    if (variable.length > 100) badRequest("Variable name too long");

    let updateQuery;

    if (existingEntry?.variables?.some(v => v.variable === variable)) {
        // EDIT MODE: update existing variable value
        updateQuery = {
            $set: { "variables.$[elem].value": value }
        };
        const arrayFilters = [{ "elem.variable": variable }];
        return { updateQuery, arrayFilters };
    } else {
        // CREATE MODE: push new variable
        const newVariable = { variable, value };
        if (existingEntry) {
            updateQuery = { $push: { variables: newVariable } };
            return { updateQuery };
        } else {
            updateQuery = {
                $setOnInsert: {
                    entries: [],
                    variables: [newVariable]
                }
            };

            return { updateQuery };
        }
    }
}

export async function handleNote(
    body: any,
    existingEntry: UserActivity | null,
    editing?: "edit"
) {
    const note = (body.note || "").trim();
    if (!note) badRequest("Missing note field");
    if (note.length > 1000) badRequest("Note too long");

    let updateQuery;

    if (existingEntry) {
        if (existingEntry?.note && editing !== "edit") badRequest("Note already exists")
        updateQuery = { $set: { note } };
        return updateQuery;
    } else {
        updateQuery = {
            $setOnInsert: {
                entries: [],
                variables: [],
                note
            }
        };
        return updateQuery;
    }
}