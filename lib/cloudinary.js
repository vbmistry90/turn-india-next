import crypto from "crypto";

/**
 * Generates a signature for signed Cloudinary uploads/deletes using the
 * API secret. Used server-side only — never expose CLOUDINARY_API_SECRET
 * to the client.
 */
export function generateCloudinarySignature(paramsToSign) {
  const sortedKeys = Object.keys(paramsToSign).sort();
  const stringToSign = sortedKeys
    .map((key) => `${key}=${paramsToSign[key]}`)
    .join("&");
  const cloudinary_api_secrey_name = 'saGakdMrMeyBQDsOdEqbGe_JH-w';
    return crypto
      .createHash("sha1")
      .update(stringToSign + cloudinary_api_secrey_name)
      .digest("hex");
    // return crypto
    //   .createHash("sha1")
    //   .update(stringToSign + process.env.CLOUDINARY_API_SECRET)
    //   .digest("hex");
}

export async function deleteCloudinaryAsset(publicId, resourceType = "video") {
  const cloudName = process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME;
  const apiKey = process.env.CLOUDINARY_API_KEY;
  // const cloudName = 'to5mtmpw';
  // const apiKey = '658218236937771';
  const timestamp = Math.floor(Date.now() / 1000);

  const signature = generateCloudinarySignature({
    public_id: publicId,
    timestamp,
  });

  const formData = new URLSearchParams();
  formData.append("public_id", publicId);
  formData.append("timestamp", timestamp);
  formData.append("api_key", apiKey);
  formData.append("signature", signature);

  const response = await fetch(
    `https://api.cloudinary.com/v1_1/${cloudName}/${resourceType}/destroy`,
    {
      method: "POST",
      body: formData,
    }
  );

  return response.json();
}
