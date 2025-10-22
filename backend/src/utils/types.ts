import { StatusCode } from "hono/utils/http-status";
import { Sort } from "mongodb";
import { User } from "../models/UserModel";

export interface AuthPayload {
  id: string;
  exp: number;
  iat: number;
  email: string;
  strategy: string;
  username: string;
};

export type Variables = {
  user: AuthPayload,
  userDoc?: User,
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
  SECRET_API_KEY: string;
  MONGOPROXY_API_KEY: string;
  MONGOPROXY_URL: string;
};

export interface MongoProxyResponse<T> {
  result: T;
  error?: string;
}

export interface RpcBody {
  db: string
  coll: string
  filter?: object
  projection?: object
  limit?: number
  sort?: Sort
  update?: object
  upsert?: boolean
  doc?: object
  arrayFilters?: object
  noLimit?: boolean
  pipeline?: object[]
}

export type NewActivityBody = {
    type: "activity" | "variable" | "note";
    year: number;
    month: number;
    day: number;
    activity?: string;
    description?: string;
    note?: string;
    variable?: string;
};

export interface Colors {
  activities: { [activity: string]: string };
  note: string;
  variables: { [variable: string]: string };
}