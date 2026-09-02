import mongoose from "mongoose";

const MediaSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    url: {
      type: String,
      required: true,
    },
    publicId: {
      type: String,
    },
    type: {
      type: String,
      enum: ["image", "video", "raw"],
      default: "image",
    },
    tags: {
      type: [String],
      default: [],
    },
    uploadedBy: {
      type: String, // name/email snapshot
      default: "",
    },
  },
  { timestamps: true }
);

export default mongoose.models.Media || mongoose.model("Media", MediaSchema);
