import {
  airtableBase,
  getSnapshot,
  saveSnapshot,
  saveProofUrl,
  findMemberByEmail,
  toRecord,
  json,
} from "../lib/snapshot.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  try {
    const { email, challengeId, notes, proofUrl, shareReflection } = await req.json();

    // 1. Look up member by email in the cache (saves an Airtable call)
    const snapshot = await getSnapshot();
    const member = findMemberByEmail(snapshot, email);
    if (!member) {
      return json({ error: "Member not found for this email" }, 404);
    }

    // 2. Create new submission linked to the member — the only Airtable call
    const created = await airtableBase()("Submissions").create([
      {
        fields: {
          Member: [member.id], // link to Members table
          Challenge: [challengeId], // assuming Challenge is a linked field too
          Notes: notes || "",
          Proof: proofUrl ? [{ url: proofUrl }] : [],
          "Share Reflection?": shareReflection || "No",
        },
      },
    ]);

    // 3. Add it to the cache right away so the member can't resubmit a
    //    non-repeatable challenge before the next sync
    snapshot.tables.Submissions.push(toRecord(created[0]));
    await saveSnapshot(snapshot);
    if (proofUrl) await saveProofUrl(created[0].id, proofUrl);

    return json({ success: true, record: { id: created[0].id } });
  } catch (err) {
    console.error("Submit error:", err);
    return json({ error: err.message }, 500);
  }
};
