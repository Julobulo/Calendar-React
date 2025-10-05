import { StatusCode } from "hono/utils/http-status";

export interface AuthPayload {
  id: string;
  exp: number;
  email?: string;
};

export type Variables = {
  user: AuthPayload
};

export interface AppError {
  status: StatusCode;
  message: string;
};

export type Env = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string;
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
    JWT_ACCESS_SECRET: string;
    JWT_REFRESH_SECRET: string;
    ACCESS_TOKEN_TTL: string;
    REFRESH_TOKEN_TTL: string;
    COOKIE_DOMAIN: string;
    NODE_ENV: string;
    MONGODB_APP_ID: string;
    MONGODB_API_KEY: string;
    MONGODB_CLUSTER: string;
    MONGODB_DATABASE: string;
};