import { ObjectId } from "bson";

export interface ActivityEntry {
    _id: ObjectId,
    activity: string;
    start?: string;                   // "HH:mm" (local) — optional for quick logging
    end?: string;                     // "HH:mm"
    description: string;
    location?: Location;
}

export interface Location {
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
    variables: { variable: string, value: string }[],
    location?: Location;
};

// Utility type for creating new users without an _id field
export type NewUserActivity = Omit<UserActivity, "_id">;


export interface Colors {
  activities: { [activity: string]: string };
  note: string;
  variables: { [variable: string]: string };
}

export interface DailyActivity {
  date: string;
  count: { activityCount: number, variableCount: number, note: 0 | 1 };
}