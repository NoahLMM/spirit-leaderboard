// src/api/fetchTables.js
export async function fetchTable(table, options = {}) {
  try {
    const params = new URLSearchParams();

    // Always include the table name
    params.append("table", table);

    // Supported Airtable options
    if (options.filterByFormula) {
      params.append("filterByFormula", options.filterByFormula);
    }
    if (options.sort) {
      // Sort must be JSON stringified for the backend
      params.append("sort", JSON.stringify(options.sort));
    }
    if (options.maxRecords) {
      params.append("maxRecords", String(options.maxRecords));
    }

    const res = await fetch(`/.netlify/functions/fetch-tables?${params.toString()}`);
    if (!res.ok) {
      throw new Error(`Error fetching ${table}: ${res.statusText}`);
    }

    return await res.json();
  } catch (err) {
    console.error("fetchTable error:", err);
    throw err;
  }
}
