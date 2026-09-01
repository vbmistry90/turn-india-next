import mongoose from "mongoose";

const EcoStatSchema = new mongoose.Schema(
  {
    category: {
      type: String,
      enum: ["toxic_materials", "energy_waste"],
      required: true,
    },
    label: {
      type: String, // e.g. "Lead", "Mercury", "Idle HVAC", "Server Load"
      required: true,
      trim: true,
    },
    value: {
      type: Number,
      required: true,
    },
    unit: {
      type: String, // e.g. "kg", "kWh", "%"
      default: "",
    },
    month: {
      type: String, // e.g. "2026-08" for simple time-series grouping
      required: true,
    },
  },
  { timestamps: true }
);

export default mongoose.models.EcoStat || mongoose.model("EcoStat", EcoStatSchema);
