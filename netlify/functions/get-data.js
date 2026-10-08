import { getSnapshot, getProofUrls, isTruthy, json } from "../lib/snapshot.js";

// Public, read-only view of the cached base for the leaderboard pages.
// Strips member emails and unapproved submissions so they're never sent to
// the browser.
export default async () => {
  try {
    const [snapshot, proofUrls] = await Promise.all([getSnapshot(), getProofUrls()]);
    const { Members, Challenges, Submissions } = snapshot.tables;

    const members = Members.map(({ id, fields }) => {
      const { Email, Submissions: _links, ...rest } = fields;
      return { id, fields: rest };
    });

    const submissions = Submissions
      .filter((s) => isTruthy(s.fields?.Approved))
      .map(({ id, createdTime, fields }) => {
        const { Member: _member, Notes, Proof, ...rest } = fields;
        const out = { ...rest };
        if (isTruthy(fields["Share Reflection?"]) && Notes) out.Notes = Notes;
        const proofUrl = proofUrls[id] || cloudinaryUrlFromAttachment(Proof?.[0]);
        if (proofUrl) out.Proof = [{ url: proofUrl }];
        return { id, createdTime, fields: out };
      });

    return json(
      { syncedAt: snapshot.syncedAt, members, challenges: Challenges, submissions },
      200,
      // Let Netlify's CDN absorb repeat page loads; the data only changes
      // on sync or submit anyway.
      { "Netlify-CDN-Cache-Control": "public, durable, max-age=120, stale-while-revalidate=600" }
    );
  } catch (err) {
    console.error("get-data error:", err);
    return json({ error: err.message }, 500);
  }
};

// Submissions made before the proof-urls map existed only have Airtable's
// copy of the photo, whose URL expires within hours. Airtable keeps the
// original filename, which for Cloudinary uploads is the image's public ID,
// so rebuild the permanent Cloudinary URL from it.
function cloudinaryUrlFromAttachment(attachment) {
  const cloud = process.env.CLOUDINARY_CLOUD_NAME;
  if (!attachment?.filename || !cloud) return attachment?.url || "";
  return `https://res.cloudinary.com/${cloud}/image/upload/${encodeURIComponent(attachment.filename)}`;
}
