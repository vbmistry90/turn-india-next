import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signAuthToken, buildAuthCookie, verifyTempLoginToken } from "@/lib/auth";
import { verifyTotpToken } from "@/lib/twofactor";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { tempToken, code } = req.body;

  if (!tempToken || !code) {
    return res.status(400).json({ success: false, message: "Missing token or code" });
  }

  const decoded = verifyTempLoginToken(tempToken);
  if (!decoded) {
    return res.status(401).json({ success: false, message: "Your verification session expired. Please log in again." });
  }

  try {
    await dbConnect();

    const user = await User.findById(decoded.id).select("+twoFactorSecret +otpCode +otpExpiresAt +otpPurpose");
    if (!user || !user.isActive) {
      return res.status(401).json({ success: false, message: "Account not found or disabled" });
    }

    let valid = false;

    if (user.twoFactorMethod === "totp") {
      valid = verifyTotpToken(code, user.twoFactorSecret);
    } else if (user.twoFactorMethod === "email" || user.twoFactorMethod === "sms") {
      const notExpired = user.otpExpiresAt && new Date(user.otpExpiresAt) > new Date();
      valid = notExpired && user.otpPurpose === "login" && user.otpCode === code;
      if (valid) {
        user.otpCode = undefined;
        user.otpExpiresAt = undefined;
        user.otpPurpose = undefined;
        await user.save();
      }
    }

    if (!valid) {
      return res.status(401).json({ success: false, message: "Invalid or expired code" });
    }

    const payload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signAuthToken(payload, Boolean(decoded.rememberMe));
    const cookie = buildAuthCookie(token, Boolean(decoded.rememberMe));
    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({ success: true, message: "Logged in successfully", user: payload });
  } catch (error) {
    console.error("2FA verify error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong" });
  }
}
