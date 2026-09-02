import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, data: user });
  }

  if (req.method === "PATCH") {
    try {
      const { name, phone, avatarUrl } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (phone !== undefined) updates.phone = phone;
      if (avatarUrl !== undefined) updates.avatarUrl = avatarUrl;

      const user = await User.findByIdAndUpdate(req.user.id, updates, {
        new: true,
        runValidators: true,
      });

      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error("Update profile error:", error);
      return res.status(500).json({ success: false, message: "Failed to update profile" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
