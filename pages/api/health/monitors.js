import { requireAuth } from "@/lib/auth";
import { fetchUptimeRobotMonitors } from "@/lib/uptimerobot";

async function handler(req, res) {
  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const monitors = await fetchUptimeRobotMonitors();

    const summary = monitors.reduce(
      (acc, m) => {
        acc.total += 1;
        if (m.status === "up") acc.up += 1;
        else if (m.status === "down" || m.status === "seems_down") acc.down += 1;
        else acc.other += 1;
        return acc;
      },
      { total: 0, up: 0, down: 0, other: 0 }
    );

    return res.status(200).json({ success: true, data: monitors, summary });
  } catch (error) {
    console.error("UptimeRobot fetch error:", error);
    return res.status(500).json({ success: false, message: error.message });
  }
}

export default requireAuth(handler);
