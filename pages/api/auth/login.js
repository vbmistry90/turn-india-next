import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signAuthToken, buildAuthCookie, signTempLoginToken } from "@/lib/auth";
import { generateNumericOtp, otpExpiryDate } from "@/lib/twofactor";
import { sendOtpEmail } from "@/lib/mailer";
import { sendOtpSms } from "@/lib/sms";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    if (!user.isActive) {
      return res.status(403).json({ success: false, message: "This account has been disabled. Contact an administrator." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const basePayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    // --- Two-Factor Authentication gate ---
    if (user.twoFactorEnabled && user.twoFactorMethod) {
      const tempToken = signTempLoginToken({ ...basePayload, rememberMe: Boolean(rememberMe) });

      if (user.twoFactorMethod === "totp") {
        return res.status(200).json({
          success: true,
          requires2FA: true,
          method: "totp",
          tempToken,
          message: "Enter the 6-digit code from your authenticator app",
        });
      }

      // email or sms: generate + send a one-time code now
      const code = generateNumericOtp(6);
      const freshUser = await User.findById(user._id).select("+otpCode +otpExpiresAt +otpPurpose");
      freshUser.otpCode = code;
      freshUser.otpExpiresAt = otpExpiryDate(10);
      freshUser.otpPurpose = "login";
      await freshUser.save();

      try {
        if (user.twoFactorMethod === "email") {
          await sendOtpEmail(user.email, code);
        } else if (user.twoFactorMethod === "sms") {
          await sendOtpSms(user.phone, code);
        }
      } catch (sendErr) {
        console.error("Failed to send 2FA code:", sendErr.message);
        return res.status(500).json({
          success: false,
          message: `Could not send verification code: ${sendErr.message}`,
        });
      }

      return res.status(200).json({
        success: true,
        requires2FA: true,
        method: user.twoFactorMethod,
        tempToken,
        message:
          user.twoFactorMethod === "email"
            ? `A verification code was sent to ${user.email}`
            : `A verification code was sent to your phone`,
      });
    }

    // --- No 2FA: log in immediately ---
    const token = signAuthToken(basePayload, Boolean(rememberMe));
    const cookie = buildAuthCookie(token, Boolean(rememberMe));
    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: basePayload,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
}
