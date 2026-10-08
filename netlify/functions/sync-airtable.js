import { syncIfDue } from "../lib/snapshot.js";

export default async () => {
  const result = await syncIfDue();
  console.log("sync-airtable:", JSON.stringify(result));
};

export const config = { schedule: "@hourly" };
