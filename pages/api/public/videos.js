import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";

// Comma-separated list of domains allowed to call this endpoint,
// e.g. "https://yoursite.com,https://www.yoursite.com". Defaults to "*"
// for easy local testing — lock this down before going to production.
const ALLOWED_ORIGINS = (process.env.PUBLIC_SITE_ORIGINS || "*")
  .split(",")
  .map((o) => o.trim());

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Public, unauthenticated endpoint that returns only PUBLISHED videos.
 * Intended for use from an external marketing/public site via fetch().
 */
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { page = 1, limit = 12, category = "" } = req.query;
    const pageNum = Math.max(parseInt(page, 10) || 1, 1);
    const limitNum = Math.min(Math.max(parseInt(limit, 10) || 12, 1), 50);

    const filter = { status: "published" };
    if (category) filter.category = category;

    const [items, total] = await Promise.all([
      Video.find(filter)
        .select("name url category description author priority createdAt")
        .sort({ priority: -1, createdAt: -1 })
        .skip((pageNum - 1) * limitNum)
        .limit(limitNum)
        .lean(),
      Video.countDocuments(filter),
    ]);

    return res.status(200).json({
      success: true,
      data: items,
      pagination: {
        total,
        page: pageNum,
        limit: limitNum,
        totalPages: Math.ceil(total / limitNum) || 1,
      },
    });
  } catch (error) {
    console.error("Public videos error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch videos" });
  }
}
