import { ObjectId } from "bson";

export interface RefreshToken {
  _id: ObjectId;
  userId: ObjectId;
  // store *hashed* token, never the raw value
  tokenHash: string;
  // useful for invalidating “just this device”
  userAgent?: string;
  ip?: string;
  expiresAt: Date;
  createdAt: Date;
  revokedAt?: Date;
}

export type NewRefreshToken = Omit<RefreshToken, "_id">;