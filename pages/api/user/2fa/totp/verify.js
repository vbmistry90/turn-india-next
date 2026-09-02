import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { verifyTotpToken } from "@/lib/twofactor";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { code } = req.body;
  if (!code) return res.status(400).json({ success: false, message: "Code is required" });

  await dbConnect();
  const user = await User.findById(req.user.id).select("+twoFactorTempSecret");

  if (!user.twoFactorTempSecret) {
    return res.status(400).json({ success: false, message: "No setup in progress. Please start over." });
  }

  const valid = verifyTotpToken(code, user.twoFactorTempSecret);
  if (!valid) {
    return res.status(401).json({ success: false, message: "Invalid code. Please try again." });
  }

  user.twoFactorSecret = user.twoFactorTempSecret;
  user.twoFactorTempSecret = undefined;
  user.twoFactorEnabled = true;
  user.twoFactorMethod = "totp";
  await user.save();

  return res.status(200).json({ success: true, message: "Authenticator app enabled successfully" });
}

export default requireAuth(handler);
