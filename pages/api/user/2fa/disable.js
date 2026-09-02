import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();
  const user = await User.findById(req.user.id).select("+twoFactorSecret +twoFactorTempSecret");

  user.twoFactorEnabled = false;
  user.twoFactorMethod = null;
  user.twoFactorSecret = undefined;
  user.twoFactorTempSecret = undefined;
  await user.save();

  return res.status(200).json({ success: true, message: "Two-factor authentication disabled" });
}

export default requireAuth(handler);
