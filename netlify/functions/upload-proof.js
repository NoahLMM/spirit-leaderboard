import fetch from "node-fetch";
import FormData from "form-data";

export const handler = async (event) => {
  try {
    if (event.httpMethod !== "POST") {
      return { statusCode: 405, body: "Method Not Allowed" };
    }

    const data = JSON.parse(event.body);
    const { file, member, challenge } = data; 
    // `file` is a base64 string (dataURL)

    if (!file) {
      return { statusCode: 400, body: "No file uploaded" };
    }

    // Prepare upload
    const formData = new FormData();
    formData.append("file", file); 
    formData.append("upload_preset", process.env.CLOUDINARY_UPLOAD_PRESET || "unsigned_upload");
    formData.append("api_key", process.env.CLOUDINARY_API_KEY);
    formData.append("timestamp", Math.floor(Date.now() / 1000));

    const res = await fetch(
      `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/image/upload`,
      {
        method: "POST",
        body: formData,
      }
    );

    const result = await res.json();
    console.log("Cloudinary result:", result);

    if (result.error) {
      throw new Error(result.error.message);
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        url: result.secure_url,
        member,
        challenge,
      }),
    };
  } catch (err) {
    console.error("Upload error:", err);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: err.message }),
    };
  }
};
