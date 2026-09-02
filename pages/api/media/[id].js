import dbConnect from "@/lib/mongodb";
import Media from "@/models/Media";
import { requireAuth } from "@/lib/auth";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "DELETE") {
    const media = await Media.findByIdAndDelete(id);
    if (!media) return res.status(404).json({ success: false, message: "Media not found" });

    if (media.publicId) {
      try {
        await deleteCloudinaryAsset(media.publicId, media.type === "video" ? "video" : "image");
      } catch (err) {
        console.warn("Cloudinary cleanup failed (non-fatal):", err.message);
      }
    }

    return res.status(200).json({ success: true, message: "Media deleted" });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
