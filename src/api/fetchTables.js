export async function fetchTable(table, options = {}) {
  const params = new URLSearchParams({ table });
  if (options.filter) params.append("filter", options.filter);
  if (options.sort) params.append("sort", JSON.stringify(options.sort));

  const response = await fetch(`/.netlify/functions/fetch-tables?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`Error fetching ${table}: ${response.statusText}`);
  }
  return await response.json();
}
