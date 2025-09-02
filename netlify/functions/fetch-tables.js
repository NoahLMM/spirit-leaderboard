import Airtable from "airtable";

export const handler = async (event) => {
  try {
    const { table, filter, sort } = event.queryStringParameters || {};

    const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
      .base(process.env.AIRTABLE_BASE_ID);

    let queryOptions = {};
    if (filter) queryOptions.filterByFormula = decodeURIComponent(filter);
    if (sort) queryOptions.sort = JSON.parse(sort);

    const records = await base(table).select(queryOptions).all();

    const data = records.map((rec) => ({
      id: rec.id,
      ...rec.fields,
    }));

    return {
      statusCode: 200,
      body: JSON.stringify(data),
    };
  } catch (err) {
    console.error("Function Error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
