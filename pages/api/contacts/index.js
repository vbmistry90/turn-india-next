import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { getUserFromReq } from "@/lib/auth";

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

export default async function handler(req, res) {
  setCorsHeaders(req, res);
  // POST is public — anyone visiting the contact/inquiry form can submit.
  if (req.method === "POST") {
    try {
      await dbConnect();
      const { name, email, phone, subject, message } = req.body;

      if (!name || !email || !message) {
        return res.status(400).json({ success: false, message: "name, email and message are required" });
      }

      const contact = await Contact.create({ name, email, phone, subject, message });
      return res.status(201).json({
        success: true,
        message: "Thanks for reaching out! We'll get back to you soon.",
        data: contact,
      });
    } catch (error) {
      console.error("Create contact error:", error);
      return res.status(500).json({ success: false, message: "Failed to submit inquiry" });
    }
  }

  // GET (listing) is admin-only.
  if (req.method === "GET") {
    const user = getUserFromReq(req);
    if (!user) {
      return res.status(401).json({ success: false, message: "Not authenticated" });
    }

    try {
      const { page = 1, limit = 10, search = "", status = "" } = req.query;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
          { subject: { $regex: search, $options: "i" } },
        ];
      }
      if (status) filter.status = status;

      const [items, total] = await Promise.all([
        Contact.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Contact.countDocuments(filter),
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
      console.error("List contacts error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch inquiries" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
