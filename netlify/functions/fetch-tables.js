import Airtable from "airtable";

export const handler = async (event) => {
  try {
    const { table, filter, sort, maxRecords } = event.queryStringParameters || {};

    if (!table) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: "Missing table parameter" }),
      };
    }

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    let queryOptions = {};
    if (filter) queryOptions.filterByFormula = decodeURIComponent(filter);
    if (sort) {
      try {
        queryOptions.sort = JSON.parse(sort);
      } catch (e) {
        console.warn("Invalid sort param:", sort);
      }
    }
    if (maxRecords) queryOptions.maxRecords = parseInt(maxRecords, 10);

    console.log("Fetching from table:", table, "with options:", queryOptions);

    const records = await base(table).select(queryOptions).all();

    // Return in the old shape: fields inside "fields"
    const data = records.map((rec) => ({
      id: rec.id,
      fields: rec.fields,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Function Error:", err);
    return {
      statusCode: err.statusCode || 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
