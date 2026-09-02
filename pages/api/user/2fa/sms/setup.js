import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { generateNumericOtp, otpExpiryDate } from "@/lib/twofactor";
import { sendOtpSms } from "@/lib/sms";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const { phone } = req.body;

  await dbConnect();
  const user = await User.findById(req.user.id).select("+otpCode +otpExpiresAt +otpPurpose");

  const targetPhone = phone || user.phone;
  if (!targetPhone) {
    return res.status(400).json({ success: false, message: "Please provide a phone number" });
  }

  // Save the phone number now so verify step + future logins use it
  user.phone = targetPhone;

  const code = generateNumericOtp(6);
  user.otpCode = code;
  user.otpExpiresAt = otpExpiryDate(10);
  user.otpPurpose = "enable_2fa";
  await user.save();

  try {
    await sendOtpSms(targetPhone, code);
  } catch (err) {
    return res.status(500).json({ success: false, message: err.message });
  }

  return res.status(200).json({ success: true, message: `Verification code sent to ${targetPhone}` });
}

export default requireAuth(handler);
