import { requireAuth } from "@/lib/auth";
import { generateCloudinarySignature } from "@/lib/cloudinary";

// Optional endpoint: use this if you prefer SIGNED Cloudinary uploads
// instead of an unsigned upload preset. See README for both options.
async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const timestamp = Math.floor(Date.now() / 1000);
  const folder = "eco-admin/videos";

  const signature = generateCloudinarySignature({ timestamp, folder });
  // const apiKey = '658218236937771';
  // const cloudName = 'to5mtmpw';
  // return res.status(200).json({
  //   success: true,
  //   timestamp,
  //   folder,
  //   signature,
  //   apiKey: apiKey,
  //   cloudName: cloudName,
  // });
  return res.status(200).json({
    success: true,
    timestamp,
    folder,
    signature,
    apiKey: process.env.CLOUDINARY_API_KEY,
    cloudName: process.env.NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME,
  });
}

export default requireAuth(handler);
