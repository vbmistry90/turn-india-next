/**
 * Sends SMS via Twilio's REST API using a plain fetch call (no SDK needed).
 * Configure TWILIO_ACCOUNT_SID / TWILIO_AUTH_TOKEN / TWILIO_FROM_NUMBER in
 * your .env.local. Works with any Twilio-compatible account.
 */
export async function sendOtpSms(toPhone, code) {
  const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER } = process.env;

  if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_FROM_NUMBER) {
    throw new Error(
      "SMS is not configured. Set TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_FROM_NUMBER in .env.local"
    );
  }

  const body = new URLSearchParams({
    To: toPhone,
    From: TWILIO_FROM_NUMBER,
    Body: `Your TurnIndiaAdmin verification code is: ${code} (expires in 10 minutes)`,
  });

  const auth = Buffer.from(`${TWILIO_ACCOUNT_SID}:${TWILIO_AUTH_TOKEN}`).toString("base64");

  const res = await fetch(
    `https://api.twilio.com/2010-04-01/Accounts/${TWILIO_ACCOUNT_SID}/Messages.json`,
    {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body,
    }
  );

  if (!res.ok) {
    const errText = await res.text();
    throw new Error(`Twilio SMS failed: ${errText}`);
  }

  return res.json();
}
