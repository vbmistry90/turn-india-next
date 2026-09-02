import dbConnect from "@/lib/mongodb";
import Media from "@/models/Media";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { page = 1, limit = 20, type = "", search = "" } = req.query;
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 20, 1), 100);

      const filter = {};
      if (type) filter.type = type;
      if (search) filter.name = { $regex: search, $options: "i" };

      const [items, total] = await Promise.all([
        Media.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Media.countDocuments(filter),
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
      return res.status(500).json({ success: false, message: "Failed to fetch media" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, url, publicId, type, tags } = req.body;
      if (!name || !url) {
        return res.status(400).json({ success: false, message: "name and url are required" });
      }
      const media = await Media.create({
        name,
        url,
        publicId,
        type,
        tags,
        uploadedBy: req.user.name,
      });
      return res.status(201).json({ success: true, data: media });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to save media" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
