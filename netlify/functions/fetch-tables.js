import Airtable from "airtable";

export const handler = async (event) => {
  try {
    const qs = event.queryStringParameters || {};

    const table = qs.table;
    if (!table) {
      return { statusCode: 400, body: JSON.stringify({ error: "Missing table parameter" }) };
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    // Accept EITHER ?filter=... OR ?filterByFormula=...
    // (Netlify already gives us decoded values in queryStringParameters)
    const filter = qs.filter ?? qs.filterByFormula;

    let queryOptions = {};
    if (filter) queryOptions.filterByFormula = filter;

    if (qs.sort) {
      try { queryOptions.sort = JSON.parse(qs.sort); }
      catch { console.warn("Invalid sort param:", qs.sort); }
    }
    if (qs.maxRecords) queryOptions.maxRecords = parseInt(qs.maxRecords, 10);

    const records = await base(table).select(queryOptions).all();

    // Preserve your existing shape: { id, fields }
    const data = records.map((rec) => ({ id: rec.id, fields: rec.fields }));

    return { statusCode: 200, body: JSON.stringify(data) };
  } catch (err) {
    console.error("Function Error:", err);
    return { statusCode: err.statusCode || 500, body: JSON.stringify({ error: err.message }) };
  }
};
