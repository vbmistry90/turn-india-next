import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { generateNumericOtp, otpExpiryDate } from "@/lib/twofactor";
import { sendOtpEmail } from "@/lib/mailer";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();
  const user = await User.findById(req.user.id).select("+otpCode +otpExpiresAt +otpPurpose");

  const code = generateNumericOtp(6);
  user.otpCode = code;
  user.otpExpiresAt = otpExpiryDate(10);
  user.otpPurpose = "enable_2fa";
  await user.save();

  try {
    await sendOtpEmail(user.email, code);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }

  return res.status(200).json({ success: true, message: `Verification code sent to ${user.email}` });
}

export default requireAuth(handler);
