import { ObjectId } from "bson";

export interface ActivityEntry {
    activity: string;
    duration: string;
    description: string;
}

export interface UserActivity {
    _id: ObjectId,
    userId: ObjectId,
    date: Date,
    entries: ActivityEntry[]
};


// Utility type for creating new users without an _id field
export type NewUserActivity = Omit<UserActivity, "_id">;