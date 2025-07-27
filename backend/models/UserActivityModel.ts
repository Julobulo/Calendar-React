import { ObjectId } from "bson";

export interface ActivityEntry {
    activity: string;
    duration: number; // number of minutes
    description: string;
    time?: string;
}

interface Location {
    name: string;
    lat: number;
    lng: number;
}

export interface UserActivity {
    _id: ObjectId,
    userId: ObjectId,
    date: Date,
    entries: ActivityEntry[],
    note?: string,
    variables?: { variable: string, value: string }[],
    location?: Location;
};


// Utility type for creating new users without an _id field
export type NewUserActivity = Omit<UserActivity, "_id">;