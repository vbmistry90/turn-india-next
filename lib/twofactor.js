import { authenticator } from "otplib";
import QRCode from "qrcode";

authenticator.options = { window: 1 }; // allow 1 step (~30s) clock drift

const APP_NAME = "TurnIndiaAdmin";

/** Generates a new base32 TOTP secret for a user. */
export function generateTotpSecret() {
  return authenticator.generateSecret();
}

/** Builds the otpauth:// URI and a QR code data URL for authenticator apps. */
export async function buildTotpQrCode(email, secret) {
  const otpauthUrl = authenticator.keyuri(email, APP_NAME, secret);
  const qrDataUrl = await QRCode.toDataURL(otpauthUrl);
  return { otpauthUrl, qrDataUrl };
}

/** Verifies a 6-digit TOTP code against the stored secret. */
export function verifyTotpToken(token, secret) {
  try {
    return authenticator.verify({ token, secret });
  } catch {
    return false;
  }
}

/** Generates a numeric one-time code for email/SMS delivery. */
export function generateNumericOtp(length = 6) {
  let code = "";
  for (let i = 0; i < length; i++) {
    code += Math.floor(Math.random() * 10);
  }
  return code;
}

export function otpExpiryDate(minutes = 10) {
  return new Date(Date.now() + minutes * 60 * 1000);
}
