import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      // Admins can change role and active status only (not password/2FA of others).
      const { role, isActive } = req.body;
      const updates = {};
      if (role !== undefined) updates.role = role;
      if (isActive !== undefined) updates.isActive = isActive;

      // Prevent an admin from locking themselves out by demoting/disabling their own account
      if (id === req.user.id && (updates.role === "editor" || updates.role === "viewer" || updates.isActive === false)) {
        return res.status(400).json({
          success: false,
          message: "You can't change your own role or disable your own account",
        });
      }

      const user = await User.findByIdAndUpdate(id, updates, { new: true, runValidators: true }).select(
        "-password -twoFactorSecret -twoFactorTempSecret -otpCode -otpExpiresAt -otpPurpose"
      );

      if (!user) return res.status(404).json({ success: false, message: "User not found" });
      return res.status(200).json({ success: true, data: user });
    } catch (error) {
      console.error("Update user error:", error);
      return res.status(500).json({ success: false, message: "Failed to update user" });
    }
  }

  if (req.method === "DELETE") {
    if (id === req.user.id) {
      return res.status(400).json({ success: false, message: "You can't delete your own account" });
    }
    const user = await User.findByIdAndDelete(id);
    if (!user) return res.status(404).json({ success: false, message: "User not found" });
    return res.status(200).json({ success: true, message: "User deleted" });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAdmin(handler);
