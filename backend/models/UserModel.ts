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
    createdAt: Date;
    authentication: GoogleAuth | AppleAuth;
}

// Utility type for creating new users without an _id field
export type NewUser = Omit<User, "_id">;