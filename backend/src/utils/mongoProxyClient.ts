import { Context } from "hono";

export default async function mongoProxyRequest(c: Context, endpoint: string, body: object) {
  const res = await fetch(`${c.env.MONGOPROXY_URL}/rpc/${endpoint}`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${c.env.MONGOPROXY_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  if (!res.ok) {
    throw new Error(
      `MongoProxy ${endpoint} error: ${res.status} ${await res.text()}`
    );
  }

  return await res.json().catch(() => ({}));
}
