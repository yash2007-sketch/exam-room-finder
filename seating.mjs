import { getStore } from "@netlify/blobs";

const json = (obj, status = 200) =>
  new Response(JSON.stringify(obj), {
    status,
    headers: { "content-type": "application/json", "cache-control": "no-store" },
  });

export default async (req) => {
  const store = getStore("seating");

  if (req.method === "GET") {
    const raw = await store.get("data", { type: "text" });
    const data = raw ? JSON.parse(raw) : {};
    const usn = new URL(req.url).searchParams.get("usn");
    if (!usn) return json({ count: Object.keys(data).length });
    const rec = data[usn.trim().toUpperCase()];
    return rec ? json(rec) : json({ error: "not found" }, 404);
  }

  if (req.method === "POST") {
    const pass = Netlify.env.get("ADMIN_PASSWORD");
    if (!pass || req.headers.get("x-admin-password") !== pass) {
      return json({ error: "unauthorized" }, 401);
    }
    let body;
    try { body = await req.json(); } catch { return json({ error: "bad json" }, 400); }
    if (!body || typeof body !== "object" || Array.isArray(body)) return json({ error: "bad data" }, 400);
    await store.set("data", JSON.stringify(body));
    return json({ ok: true, count: Object.keys(body).length });
  }

  return json({ error: "method not allowed" }, 405);
};

export const config = { path: "/api/seating" };
