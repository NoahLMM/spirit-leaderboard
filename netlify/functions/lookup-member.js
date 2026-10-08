import { getSnapshot, findMemberByEmail, lowerList, json } from "../lib/snapshot.js";

export default async (req) => {
  if (req.method !== "POST") return json({ error: "Method Not Allowed" }, 405);

  try {
    const { email } = await req.json();
    const snapshot = await getSnapshot();
    const member = findMemberByEmail(snapshot, email);
    if (!member) return json({ found: false });

    const linked = new Set(member.fields?.Submissions || []);
    const teamNames = lowerList(member.fields?.["Team Name"]);

    const challengeIds = (s) => {
      const c = s.fields?.Challenge;
      return Array.isArray(c) ? c : c ? [c] : [];
    };
    const memberSubmissions = [];
    const teamSubmissions = [];
    for (const s of snapshot.tables.Submissions) {
      const slim = { id: s.id, fields: { Challenge: challengeIds(s) } };
      if (linked.has(s.id) || (s.fields?.Member || []).includes(member.id)) {
        memberSubmissions.push(slim);
      }
      if (teamNames.length && lowerList(s.fields?.["Team Name"]).some((t) => teamNames.includes(t))) {
        teamSubmissions.push(slim);
      }
    }

    return json({
      found: true,
      name: member.fields?.Name || "",
      teamNames: member.fields?.["Team Name"] || [],
      memberSubmissions,
      teamSubmissions,
    });
  } catch (err) {
    console.error("lookup-member error:", err);
    return json({ error: err.message }, 500);
  }
};
