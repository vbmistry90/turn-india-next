import dbConnect from "@/lib/mongodb";
import Video from "@/models/Video";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        category = "",
        status = "",
        priority = "",
        sortBy = "createdAt",
        sortOrder = "desc",
      } = req.query;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { author: { $regex: search, $options: "i" } },
          { category: { $regex: search, $options: "i" } },
        ];
      }
      if (category) filter.category = category;
      if (status) filter.status = status;
      if (priority) filter.priority = priority;

      const sort = { [sortBy]: sortOrder === "asc" ? 1 : -1 };

      const [items, total] = await Promise.all([
        Video.find(filter)
          .sort(sort)
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
      console.error("List videos error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch videos" });
    }
  }

  if (req.method === "POST") {
    try {
      const { name, url, publicId, category, description, author, status, priority } = req.body;

      if (!name || !url || !category || !author) {
        return res.status(400).json({
          success: false,
          message: "name, url, category and author are required",
        });
      }

      const video = await Video.create({
        name,
        url,
        publicId,
        category,
        description,
        author,
        status,
        priority,
      });

      return res.status(201).json({ success: true, data: video });
    } catch (error) {
      console.error("Create video error:", error);
      return res.status(500).json({ success: false, message: "Failed to create video" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
