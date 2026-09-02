import nodemailer from "nodemailer";

/**
 * Sends email via SMTP. Configure SMTP_HOST / SMTP_PORT / SMTP_USER /
 * SMTP_PASS / SMTP_FROM in your .env.local — works with Gmail (App
 * Password), SendGrid, Mailgun, Amazon SES, or any standard SMTP provider.
 */
function getTransporter() {
  if (!process.env.SMTP_HOST) {
    throw new Error(
      "Email is not configured. Set SMTP_HOST, SMTP_PORT, SMTP_USER, SMTP_PASS in .env.local"
    );
  }

  return nodemailer.createTransport({
    host: process.env.SMTP_HOST,
    port: Number(process.env.SMTP_PORT || 587),
    secure: Number(process.env.SMTP_PORT) === 465,
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
}

export async function sendOtpEmail(toEmail, code) {
  const transporter = getTransporter();

  await transporter.sendMail({
    from: process.env.SMTP_FROM || process.env.SMTP_USER,
    to: toEmail,
    subject: "Your TurnIndiaAdmin verification code",
    text: `Your verification code is: ${code}\n\nThis code expires in 10 minutes. If you didn't request this, you can ignore this email.`,
    html: `
      <div style="font-family: sans-serif; max-width: 420px; margin: auto;">
        <h2 style="color:#16a34a;">TurnIndiaAdmin Verification Code</h2>
        <p>Use the code below to complete your sign-in:</p>
        <p style="font-size: 28px; font-weight: bold; letter-spacing: 4px;">${code}</p>
        <p style="color:#64748b; font-size: 13px;">This code expires in 10 minutes. If you didn't request this, you can safely ignore this email.</p>
      </div>
    `,
  });
}
