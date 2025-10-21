import { Context } from "hono";
import { MongoProxyResponse, RpcBody } from "./types";

export async function mongoProxyRequest<T>(
  c: Context,
  method: string,
  body: RpcBody
): Promise<MongoProxyResponse<T>> {
  const res = await fetch(c.env.MONGOPROXY_URL + "/rpc/" + method, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${c.env.MONGOPROXY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

   // 1. Handle network / HTTP-level errors
  if (!res.ok) {
    throw new Error(`MongoProxy HTTP error: ${res.status} ${res.statusText}`);
  }

  // 2. Handle JSON parsing
  let json: unknown;
  try {
    json = await res.json();
  } catch {
    throw new Error("MongoProxy returned invalid JSON");
  }

  // 3. Handle proxy-level { error: ... } responses
  const response = json as MongoProxyResponse<T>;
  if ("error" in response && response.error) {
    throw new Error(`MongoProxy error: ${response.error}`);
  }

  // 4. Return the typed result
  return response;
}
