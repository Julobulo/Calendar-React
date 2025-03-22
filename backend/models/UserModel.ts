import { ObjectId } from "bson";

interface GoogleAuth {
    strategy: "google";
    google_id: string;
}

interface AppleAuth {
    strategy: "apple";
    apple_id: string;
}

export interface User {
    _id: ObjectId;
    email: string;
    username: string;
    createdAt: Date;
    authentication: GoogleAuth | AppleAuth;
    // colors: { [id: string]: string; }; // stores colors in hex for each activity
    colors: {
        activities: { [activity: string]: string };
        note: string;
        variables: { [variable: string]: string };
    };
    names: string[];
}

// Utility type for creating new users without an _id field
export type NewUser = Omit<User, "_id">;