import mongoose from "mongoose";

const VideoSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Video name is required"],
      trim: true,
    },
    url: {
      type: String,
      required: [true, "Video URL is required"],
    },
    publicId: {
      type: String, // Cloudinary public_id, used for deletion
    },
    category: {
      type: String,
      required: [true, "Category is required"],
      trim: true,
    },
    description: {
      type: String,
      trim: true,
      default: "",
    },
    author: {
      type: String,
      required: [true, "Author is required"],
      trim: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high"],
      default: "medium",
    },
  },
  { timestamps: true } // gives us createdAt as "time"
);

VideoSchema.index({ name: "text", category: "text", author: "text" });

export default mongoose.models.Video || mongoose.model("Video", VideoSchema);
