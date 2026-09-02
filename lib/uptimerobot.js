/**
 * Thin wrapper around the UptimeRobot v2 REST API.
 * Get your API key from: https://uptimerobot.com/dashboard#mySettings
 * (Use a "Read-Only" API key — this app only ever reads monitor data.)
 */
export async function fetchUptimeRobotMonitors() {
  const apiKey = process.env.UPTIMEROBOT_API_KEY;
  if (!apiKey) {
    throw new Error("UptimeRobot is not configured. Set UPTIMEROBOT_API_KEY in .env.local");
  }

  const res = await fetch("https://api.uptimerobot.com/v2/getMonitors", {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Cache_Control: "no-cache",
    },
    body: new URLSearchParams({
      api_key: apiKey,
      format: "json",
      logs: "0",
      response_times: "1",
      response_times_limit: "1",
    }),
  });

  const data = await res.json();

  if (data.stat !== "ok") {
    throw new Error(data.error?.message || "Failed to fetch monitors from UptimeRobot");
  }

  // UptimeRobot status codes: 0 paused, 1 not checked yet, 2 up, 8 seems down, 9 down
  const STATUS_MAP = {
    0: "paused",
    1: "pending",
    2: "up",
    8: "seems_down",
    9: "down",
  };

  return (data.monitors || []).map((m) => ({
    id: m.id,
    name: m.friendly_name,
    url: m.url,
    type: m.type,
    status: STATUS_MAP[m.status] || "unknown",
    statusCode: m.status,
    uptimeRatio: m.all_time_uptime_ratio || m.custom_uptime_ratio || null,
    responseTimeMs: m.response_times?.[0]?.value ?? null,
  }));
}
