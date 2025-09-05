export async function fetchTable(table, params = "") {
  try {
    // ensure params starts with & if it's non-empty
    const queryString = params
      ? `&${params.replace(/^\?/, "")}`
      : "";

    const res = await fetch(`/.netlify/functions/fetch-tables?table=${table}${queryString}`);
    if (!res.ok) {
      throw new Error(`Error fetching ${table}: ${res.statusText}`);
    }
    const data = await res.json();
    return data;
  } catch (err) {
    console.error("fetchTable error:", err);
    throw err;
  }
}
