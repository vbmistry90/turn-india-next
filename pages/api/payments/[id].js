import dbConnect from "@/lib/mongodb";
import Payment from "@/models/Payment";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    try {
      const payment = await Payment.findById(id);
      if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
      return res.status(200).json({ success: true, data: payment });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to fetch payment" });
    }
  }

  if (req.method === "PUT" || req.method === "PATCH") {
    try {
      const updates = (({ transactionId, amount, currency, status, active, user }) => ({
        transactionId,
        amount,
        currency,
        status,
        active,
        user,
      }))(req.body);

      Object.keys(updates).forEach((key) => updates[key] === undefined && delete updates[key]);

      const payment = await Payment.findByIdAndUpdate(id, updates, {
        new: true,
        runValidators: true,
      });

      if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
      return res.status(200).json({ success: true, data: payment });
    } catch (error) {
      console.error("Update payment error:", error);
      return res.status(500).json({ success: false, message: "Failed to update payment" });
    }
  }

  if (req.method === "DELETE") {
    try {
      const payment = await Payment.findByIdAndDelete(id);
      if (!payment) return res.status(404).json({ success: false, message: "Payment not found" });
      return res.status(200).json({ success: true, message: "Payment deleted" });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to delete payment" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
