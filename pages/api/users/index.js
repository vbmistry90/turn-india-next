import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { requireAdmin } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const { page = 1, limit = 10, search = "", role = "" } = req.query;
      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      const filter = {};
      if (search) {
        filter.$or = [
          { name: { $regex: search, $options: "i" } },
          { email: { $regex: search, $options: "i" } },
        ];
      }
      if (role) filter.role = role;

      const [items, total] = await Promise.all([
        User.find(filter)
          .select("-password -twoFactorSecret -twoFactorTempSecret -otpCode -otpExpiresAt -otpPurpose")
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        User.countDocuments(filter),
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
      console.error("List users error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch users" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAdmin(handler);
