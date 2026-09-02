import mongoose from "mongoose";

// Singleton-style document: there is only ever one Settings row (findOne / upsert).
const SettingsSchema = new mongoose.Schema(
  {
    key: {
      type: String,
      default: "site_appearance",
      unique: true,
    },
    themeColor: {
      type: String,
      default: "#16a34a", // primary-600
    },
    fontFamily: {
      type: String,
      enum: ["Inter", "DM Sans", "Poppins", "Roboto", "Playfair Display", "System UI"],
      default: "Inter",
    },
    baseTextSize: {
      type: String,
      enum: ["sm", "md", "lg"],
      default: "md",
    },
    borderRadius: {
      type: String,
      enum: ["none", "sm", "md", "lg", "full"],
      default: "md",
    },
    darkMode: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.Settings || mongoose.model("Settings", SettingsSchema);
