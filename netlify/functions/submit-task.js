import Airtable from "airtable";

const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY })
  .base(process.env.AIRTABLE_BASE_ID);

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body);
    const { email, challengeId, notes, proofUrl, shareReflection } = data;

    // 1. Look up member by email
    const members = await base("Members")
      .select({
        filterByFormula: `{Email} = "${email}"`, // field name in Members table
        maxRecords: 1,
      })
      .firstPage();

    if (members.length === 0) {
      return {
        statusCode: 404,
        body: JSON.stringify({ error: "Member not found for this email" }),
      };
    }

    const memberId = members[0].id; // Airtable record ID of the member

    // 2. Create new submission linked to the member
    const created = await base("Submissions").create([
      {
        fields: {
          Member: [memberId], // link to Members table
          Challenge: [challengeId], // assuming Challenge is a linked field too
          Notes: notes || "",
          Proof: proofUrl ? [{ url: proofUrl }] : [],
          "Share Reflection?": shareReflection || "No",
        },
      },
    ]);

    return {
      statusCode: 200,
      body: JSON.stringify({ success: true, record: created[0] }),
    };
  } catch (err) {
    console.error("Submit error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
