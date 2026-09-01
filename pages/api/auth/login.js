import bcrypt from "bcryptjs";
import dbConnect from "@/lib/mongodb";
import User from "@/models/User";
import { signAuthToken, buildAuthCookie } from "@/lib/auth";

export default async function handler(req, res) {
  if (req.method !== "POST") {
    return res.status(405).json({ success: false, message: "Method not allowed" });
  }

  try {
    const { email, password, rememberMe } = req.body;

    if (!email || !password) {
      return res.status(400).json({ success: false, message: "Email and password are required" });
    }

    await dbConnect();

    const user = await User.findOne({ email: email.toLowerCase() }).select("+password");
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid email or password" });
    }

    const tokenPayload = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role,
    };

    const token = signAuthToken(tokenPayload, Boolean(rememberMe));
    const cookie = buildAuthCookie(token, Boolean(rememberMe));

    res.setHeader("Set-Cookie", cookie);

    return res.status(200).json({
      success: true,
      message: "Logged in successfully",
      user: tokenPayload,
    });
  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({ success: false, message: "Something went wrong. Please try again." });
  }
}
