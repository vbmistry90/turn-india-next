import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const {
        page = 1,
        limit = 10,
        search = "",
        status = "",
        active = "",
      } = req.query;

      const pageNum = Math.max(parseInt(page, 10) || 1, 1);
      const limitNum = Math.min(Math.max(parseInt(limit, 10) || 10, 1), 100);

      const filter = {};
      if (search) {
        filter.$or = [
          { transactionId: { $regex: search, $options: "i" } },
          { user: { $regex: search, $options: "i" } },
        ];
      }
      if (status) filter.status = status;
      if (active !== "") filter.active = active === "true";

      const [items, total, aggregates] = await Promise.all([
        Payment.find(filter)
          .sort({ createdAt: -1 })
          .skip((pageNum - 1) * limitNum)
          .limit(limitNum)
          .lean(),
        Payment.countDocuments(filter),
        Payment.aggregate([
          { $match: { status: "success" } },
          { $group: { _id: null, totalRevenue: { $sum: "$amount" } } },
        ]),
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
        totalRevenue: aggregates[0]?.totalRevenue || 0,
      });
    } catch (error) {
      console.error("List payments error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch payments" });
    }
  }

  if (req.method === "POST") {
    try {
      const { transactionId, amount, currency, status, active, user } = req.body;

      if (!transactionId || amount === undefined || !user) {
        return res.status(400).json({
          success: false,
          message: "transactionId, amount and user are required",
        });
      }

      const payment = await Payment.create({
        transactionId,
        amount,
        currency,
        status,
        active,
        user,
      });

      return res.status(201).json({ success: true, data: payment });
    } catch (error) {
      if (error.code === 11000) {
        return res.status(409).json({ success: false, message: "Transaction ID already exists" });
      }
      console.error("Create payment error:", error);
      return res.status(500).json({ success: false, message: "Failed to create payment" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
