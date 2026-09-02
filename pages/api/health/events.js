import dbConnect from "@/lib/mongodb";
import HealthEvent from "@/models/HealthEvent";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  await dbConnect();

  const { limit = 20 } = req.query;
  const events = await HealthEvent.find({})
    .sort({ createdAt: -1 })
    .limit(Math.min(parseInt(limit, 10) || 20, 100))
    .lean();

  return res.status(200).json({ success: true, data: events });
}

export default requireAuth(handler);
