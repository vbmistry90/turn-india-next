import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAuth } from "@/lib/auth";
import { generateTotpSecret, buildTotpQrCode } from "@/lib/twofactor";

async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();
  const user = await User.findById(req.user.id);

  const secret = generateTotpSecret();
  user.twoFactorTempSecret = secret;
  await user.save();

  const { qrDataUrl, otpauthUrl } = await buildTotpQrCode(user.email, secret);

  return res.status(200).json({
    success: true,
    secret,
    qrDataUrl,
    otpauthUrl,
    message: "Scan the QR code with Google Authenticator (or any TOTP app), then enter the 6-digit code to confirm.",
  });
}

export default requireAuth(handler);
