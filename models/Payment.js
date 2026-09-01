import mongoose from "mongoose";

const PaymentSchema = new mongoose.Schema(
  {
    transactionId: {
      type: String,
      required: [true, "Transaction ID is required"],
      unique: true,
      trim: true,
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
    },
    currency: {
      type: String,
      default: "USD",
    },
    status: {
      type: String,
      enum: ["success", "pending", "failed", "refunded"],
      default: "pending",
    },
    active: {
      type: Boolean,
      default: true,
    },
    user: {
      type: String, // user name / email snapshot for simple display
      required: [true, "User is required"],
      trim: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Payment || mongoose.model("Payment", PaymentSchema);
