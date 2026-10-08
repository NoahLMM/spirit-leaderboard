
import Airtable from "airtable";
import { getStore } from "@netlify/blobs";

const TABLES = ["Members", "Challenges", "Submissions"];
const SNAPSHOT_KEY = "snapshot";
const PROOF_URLS_KEY = "proof-urls";

const HOUR = 60 * 60 * 1000;

export function syncIntervalMs() {
  const hours = Number(process.env.SYNC_INTERVAL_HOURS);
  return (Number.isFinite(hours) && hours > 0 ? hours : 24) * HOUR;
}

function store() {
  return getStore({ name: "airtable-cache", consistency: "strong" });
}

export function airtableBase() {
  return new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
    .base(process.env.AIRTABLE_BASE_ID);
}

export function toRecord(rec) {
  return { id: rec.id, createdTime: rec._rawJson?.createdTime, fields: rec.fields };
}

export async function syncSnapshot() {
  const base = airtableBase();
  const tables = {};
  let apiCalls = 0;

  for (const table of TABLES) {
    const rows = [];
    await base(table)
      .select({ pageSize: 100 })
      .eachPage((records, next) => {
        apiCalls++;
        rows.push(...records.map(toRecord));
        next();
      });
    tables[table] = rows;
  }

  const snapshot = { syncedAt: new Date().toISOString(), tables };
  await store().setJSON(SNAPSHOT_KEY, snapshot);
  console.log(`Airtable sync complete: ${apiCalls} API call(s)`);
  return snapshot;
}

function ageMs(snapshot) {
  return Date.now() - new Date(snapshot?.syncedAt || 0).getTime();
}

export async function syncIfDue() {
  const snapshot = await store().get(SNAPSHOT_KEY, { type: "json" });
  if (snapshot && ageMs(snapshot) < syncIntervalMs() - 10 * 60 * 1000) {
    return { synced: false, syncedAt: snapshot.syncedAt };
  }
  const fresh = await syncSnapshot();
  return { synced: true, syncedAt: fresh.syncedAt };
}

let inFlight = null;

export async function getSnapshot() {
  const snapshot = await store().get(SNAPSHOT_KEY, { type: "json" });
  if (snapshot && ageMs(snapshot) < 2 * syncIntervalMs() + HOUR) return snapshot;

  inFlight ??= syncSnapshot().finally(() => { inFlight = null; });
  return inFlight;
}

export async function saveSnapshot(snapshot) {
  await store().setJSON(SNAPSHOT_KEY, snapshot);
}

export async function getProofUrls() {
  return (await store().get(PROOF_URLS_KEY, { type: "json" })) || {};
}

export async function saveProofUrl(recordId, url) {
  const urls = await getProofUrls();
  urls[recordId] = url;
  await store().setJSON(PROOF_URLS_KEY, urls);
}

export function lowerList(v) {
  const arr = Array.isArray(v) ? v : v == null ? [] : [v];
  return arr.filter(Boolean).map((s) => String(s).trim().toLowerCase());
}

export function findMemberByEmail(snapshot, email) {
  const needle = String(email || "").trim().toLowerCase();
  if (!needle) return null;
  return (
    snapshot.tables.Members.find((m) => lowerList(m.fields?.Email).includes(needle)) || null
  );
}

export function isTruthy(v) {
  if (Array.isArray(v)) v = v[0];
  if (v == null) return false;
  if (typeof v === "boolean") return v;
  if (typeof v === "number") return v === 1;
  return ["yes", "y", "true", "1", "checked"].includes(String(v).trim().toLowerCase());
}

export function json(body, status = 200, headers = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: { "Content-Type": "application/json", ...headers },
  });
}
