import { StatusCode } from "hono/utils/http-status";

export interface AuthPayload {
  id: string;
  exp: number;
};

export type Variables = {
  user: AuthPayload
};

export interface AppError {
  status: StatusCode;
  message: string;
};