import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import mongoose from "mongoose";

// Comma-separated list of domains allowed to call this endpoint,
// e.g. "https://yoursite.com,https://www.yoursite.com". Defaults to "*"
// for easy local testing — lock this down before going to production.
const ALLOWED_ORIGINS = (process.env.PUBLIC_SITE_ORIGINS || "*")
  .split(",")
  .map((o) => o.trim());

const PUBLIC_FIELDS = "name url category description author priority createdAt";

function setCorsHeaders(req, res) {
  const origin = req.headers.origin;
  if (ALLOWED_ORIGINS.includes("*")) {
    res.setHeader("Access-Control-Allow-Origin", "*");
  } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }
  res.setHeader("Access-Control-Allow-Methods", "GET, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type");
  res.setHeader("Cache-Control", "public, s-maxage=60, stale-while-revalidate=300");
}

/**
 * Public, unauthenticated endpoint that returns a single PUBLISHED,
 * "main" priority video — the latest one by default, or a specific
 * one if ?id=<mongoId> is passed.
 * Intended for use from an external marketing/public site via fetch().
 */
export default async function handler(req, res) {
  setCorsHeaders(req, res);

  if (req.method === "OPTIONS") {
    return res.status(200).end();
  }

  if (req.method !== "GET") {
    res.setHeader("Allow", "GET, OPTIONS");
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    await dbConnect();

    const { id } = req.query;

    const filter = { status: "published", priority: "main" };

    if (id) {
      if (!mongoose.Types.ObjectId.isValid(id)) {
        return res.status(400).json({ success: false, message: "Invalid id" });
      }
      filter._id = id;
    }

    const item = await Video.findOne(filter)
      .select(PUBLIC_FIELDS)
      .sort({ createdAt: -1, _id: -1 })
      .lean();

    if (!item) {
      return res.status(404).json({ success: false, message: "Video not found" });
    }

    return res.status(200).json({ success: true, data: item });
  } catch (error) {
    console.error("Public video error:", error);
    return res.status(500).json({ success: false, message: "Failed to fetch video" });
  }
}