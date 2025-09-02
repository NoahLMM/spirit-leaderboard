import Airtable from 'airtable';
import formidable from 'formidable';
import fs from 'fs';

export const config = {
  api: { bodyParser: false }
};

export default async (req, res) => {
  try {
    const form = formidable();
    form.parse(req, async (err, fields, files) => {
      if (err) {
        res.status(500).json({ error: 'Error parsing form' });
        return;
      }

      const base = new Airtable({ apiKey: process.env.AIRTABLE_API_KEY }).base(process.env.AIRTABLE_BASE_ID);

      const record = await base('Submissions').create([
        {
          fields: {
            Name: fields.name,
            Email: fields.email,
            Task: fields.task,
            Notes: fields.notes,
            Status: 'Pending'
          }
        }
      ]);

      res.status(200).json({ success: true, recordId: record[0].id });
    });
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
