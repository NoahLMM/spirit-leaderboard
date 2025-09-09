// src/api/fetchTables.js
export async function fetchTable(table, options = {}) {
  const params = new URLSearchParams();
  if (options.filterByFormula) {
    // send BOTH to be future-proof
    params.append("filter", options.filterByFormula);
    params.append("filterByFormula", options.filterByFormula);
  }
  if (options.sort) params.append("sort", JSON.stringify(options.sort));
  if (options.maxRecords) params.append("maxRecords", String(options.maxRecords));
  const url = `/.netlify/functions/fetch-tables?table=${table}${params.toString() ? `&${params.toString()}` : ""}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Error fetching ${table}: ${res.statusText}`);
  return await res.json();
}
