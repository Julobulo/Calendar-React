import { Hono } from "hono";
import * as Realm from "realm-web";

// The Worker's environment bindings
type Bindings = {
    ATLAS_APPID: string;
    ATLAS_APIKEY: string;
    JWT_SECRET: string; // private key used to sign jwt tokens
    GOOGLE_CLIENT_ID: string;
    GOOGLE_CLIENT_SECRET: string;
    REDIRECT_URI: string;
};

const LocationRoute = new Hono<{ Bindings: Bindings }>();

let App: Realm.App;



export default LocationRoute