import mongoose from "mongoose";

const UserSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: [true, "Name is required"],
      trim: true,
    },
    email: {
      type: String,
      required: [true, "Email is required"],
      unique: true,
      lowercase: true,
      trim: true,
    },
    password: {
      type: String,
      required: [true, "Password is required"],
      select: false,
    },
    phone: {
      type: String,
      trim: true,
      default: "",
    },
    role: {
      type: String,
      enum: ["admin", "editor", "viewer"],
      default: "editor",
    },
    isActive: {
      type: Boolean,
      default: true,
    },
    avatarUrl: {
      type: String,
      default: "",
    },

    // --- Two-Factor Authentication ---
    twoFactorEnabled: {
      type: Boolean,
      default: false,
    },
    // "totp" (Google Authenticator style), "email", "sms"
    twoFactorMethod: {
      type: String,
      enum: [null, "totp", "email", "sms"],
      default: null,
    },
    twoFactorSecret: {
      type: String, // base32 TOTP secret
      select: false,
    },
    twoFactorTempSecret: {
      type: String, // holds secret during setup, before it's confirmed
      select: false,
    },
    // one-time codes for email/sms flows
    otpCode: {
      type: String,
      select: false,
    },
    otpExpiresAt: {
      type: Date,
      select: false,
    },
    otpPurpose: {
      type: String, // "login" | "enable_2fa"
      select: false,
    },
  },
  { timestamps: true }
);

export default mongoose.models.User || mongoose.model("User", UserSchema);
