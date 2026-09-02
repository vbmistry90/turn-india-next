import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: "Code is required" });

  await dbConnect();
  const user = await User.findById(req.user.id).select("+otpCode +otpExpiresAt +otpPurpose");

  const notExpired = user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();
  const valid = notExpired && user.otpPurpose === "enable_2fa" && user.otpCode === code;

  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid or expired code" });
  }

  user.twoFactorEnabled = true;
  user.twoFactorMethod = "sms";
  user.otpCode = undefined;
  user.otpExpiresAt = undefined;
  user.otpPurpose = undefined;
  await user.save();

  return res.status(200).json({ success: true, message: "SMS verification enabled successfully" });
}

export default requireAuth(handler);
