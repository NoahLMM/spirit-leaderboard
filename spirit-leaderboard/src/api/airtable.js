import axios from "axios";

const apiKey = import.meta.env.VITE_AIRTABLE_API_KEY;
const baseId = import.meta.env.VITE_AIRTABLE_BASE_ID;
const apiUrl = `https://api.airtable.com/v0/${baseId}`;

export async function fetchTable(table, filter = "") {
  const url = `${apiUrl}/${table}${filter ? `?${filter}` : ""}`;
  console.log("Fetching URL:", url); // <-- DEBUG
  const res = await axios.get(url, {
    headers: { Authorization: `Bearer ${apiKey}` },
  });
  console.log("Response Data:", res.data); // <-- DEBUG
  return res.data.records.map(r => ({ id: r.id, ...r.fields }));
}
