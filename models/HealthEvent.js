import mongoose from "mongoose";

// Stores incoming UptimeRobot webhook alerts (monitor down/up events) so the
// dashboard has a persisted history, not just the live API snapshot.
const HealthEventSchema = new mongoose.Schema(
  {
    monitorId: {
      type: String,
    },
    monitorName: {
      type: String,
    },
    monitorUrl: {
      type: String,
    },
    status: {
      type: String, // "up" | "down" | "unknown"
      enum: ["up", "down", "unknown"],
      default: "unknown",
    },
    statusCode: {
      type: String,
    },
    reason: {
      type: String,
      default: "",
    },
    raw: {
      type: mongoose.Schema.Types.Mixed, // full webhook payload for reference
    },
  },
  { timestamps: true }
);

export default mongoose.models.HealthEvent || mongoose.model("HealthEvent", HealthEventSchema);
