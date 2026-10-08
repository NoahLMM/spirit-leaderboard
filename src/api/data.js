// src/api/data.js
// All reads come from the cached copy of Airtable (see netlify/lib/snapshot.js),
// so page loads never spend Airtable API calls.

let pending = null;

// { syncedAt, members, challenges, submissions } — shared by every page in
// this session; pass { fresh: true } to re-download.
export function getData({ fresh = false } = {}) {
  if (!pending || fresh) {
    pending = fetch("/.netlify/functions/get-data")
      .then(async (res) => {
        if (!res.ok) throw new Error(`Error loading data: ${res.statusText}`);
        return res.json();
      })
      .catch((err) => {
        pending = null;
        throw err;
      });
  }
  return pending;
}

// { found, name, teamNames, memberSubmissions, teamSubmissions }
export async function lookupMember(email) {
  const res = await fetch("/.netlify/functions/lookup-member", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email }),
  });
  if (!res.ok) throw new Error(`Error looking up member: ${res.statusText}`);
  return res.json();
}
