import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import { requireAuth } from "@/lib/auth";
import { deleteCloudinaryAsset } from "@/lib/cloudinary";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const video = await Video.findById(id);
      if (!video) return res.status(404).json({ success: false, message: "Video not found" });
      return res.status(200).json({ success: true, data: video });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch video" });
    }
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const updates = (({ name, url, publicId, category, description, author, status, priority }) => ({
        name,
        url,
        publicId,
        category,
        description,
        author,
        status,
        priority,
      }))(req.body);

      // remove undefined keys so PATCH-style partial updates work
      Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

      const video = await Video.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!video) return res.status(404).json({ success: false, message: "Video not found" });
      return res.status(200).json({ success: true, data: video });
    } catch (error) {
      console.error("Update video error:", error);
      return res.status(500).json({ success: false, message: "Failed to update video" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const video = await Video.findByIdAndDelete(id);
      if (!video) return res.status(404).json({ success: false, message: "Video not found" });

      if (video.publicId) {
        try {
          await deleteCloudinaryAsset(video.publicId, "video");
        } catch (cloudErr) {
          console.warn("Cloudinary cleanup failed (non-fatal):", cloudErr.message);
        }
      }

      return res.status(200).json({ success: true, message: "Video deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to delete video" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
