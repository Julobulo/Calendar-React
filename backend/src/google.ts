import { createRemoteJWKSet, jwtVerify } from "jose";
const GOOGLE_ISS = ["https://accounts.google.com", "accounts.google.com"];

const JWKS = createRemoteJWKSet(new URL("https://www.googleapis.com/oauth2/v3/certs"));

export async function verifyGoogleIdToken(idToken: string, clientId: string) {
  const { payload } = await jwtVerify(idToken, JWKS, {
    issuer: GOOGLE_ISS,
    audience: clientId,
  });
  // payload contains email, sub (google user id), etc.
  return payload as {
    sub: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
    picture?: string;
  };
}
