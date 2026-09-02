import dbConnect from "@/lib/mongodb";
import HealthEvent from "@/models/HealthEvent";

/**
 * Public webhook receiver for UptimeRobot alert contacts.
 * In UptimeRobot: Monitor -> Alert Contacts -> Add Alert Contact -> "Web-Hook".
 * Set the URL to: https://your-app.com/api/health/webhook?secret=YOUR_WEBHOOK_SECRET
 * and the POST value (JSON) to:
 * {
 *   "monitorID": "*monitorID*",
 *   "monitorFriendlyName": "*monitorFriendlyName*",
 *   "monitorURL": "*monitorURL*",
 *   "alertType": "*alertType*",
 *   "alertTypeFriendlyName": "*alertTypeFriendlyName*",
 *   "alertDetails": "*alertDetails*"
 * }
 */
export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  const configuredSecret = process.env.UPTIMEROBOT_WEBHOOK_SECRET;
  if (configuredSecret && req.query.secret !== configuredSecret) {
    return res.status(401).json({ success: false, message: "Invalid webhook secret" });
  }

  try {
    await dbConnect();

    const body = req.body || {};
    // alertTypeFriendlyName is usually "Up" or "Down"
    const statusRaw = (body.alertTypeFriendlyName || "").toLowerCase();
    const status = statusRaw.includes("up") ? "up" : statusRaw.includes("down") ? "down" : "unknown";

    await HealthEvent.create({
      monitorId: body.monitorID,
      monitorName: body.monitorFriendlyName,
      monitorUrl: body.monitorURL,
      status,
      statusCode: body.alertType,
      reason: body.alertDetails || "",
      raw: body,
    });

    return res.status(200).json({ success: true });
  } catch (error) {
    console.error("Health webhook error:", error);
    return res.status(500).json({ success: false, message: "Failed to record event" });
  }
}
