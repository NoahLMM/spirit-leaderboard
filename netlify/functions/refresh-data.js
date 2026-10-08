import { syncSnapshot, json } from "../lib/snapshot.js";

export default async (req) => {
  const secret = process.env.SYNC_SECRET;
  const key = new URL(req.url).searchParams.get("key");
  if (!secret || key !== secret) return json({ error: "Forbidden" }, 403);

  try {
    const snapshot = await syncSnapshot();
    return json({ ok: true, syncedAt: snapshot.syncedAt });
  } catch (err) {
    console.error("refresh-data error:", err);
    return json({ error: err.message }, 500);
  }
};
