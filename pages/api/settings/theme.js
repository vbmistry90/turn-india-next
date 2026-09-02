import dbConnect from "@/lib/mongodb";
import Settings from "@/models/Settings";
import { getUserFromReq, requireAdmin } from "@/lib/auth";

export default async function handler(req, res) {
  await dbConnect();

  // GET is available to any logged-in user (the app needs it to render the
  // theme), but only admins can change it.
  if (req.method === "GET") {
    const user = getUserFromReq(req);
    if (!user) return res.status(401).json({ success: false, message: "Not authenticated" });

    let settings = await Settings.findOne({ key: "site_appearance" });
    if (!settings) {
      settings = await Settings.create({ key: "site_appearance" });
    }
    return res.status(200).json({ success: true, data: settings });
  }

  if (req.method === "PATCH") {
    return requireAdmin(async (req2, res2) => {
      try {
        const { themeColor, fontFamily, baseTextSize, borderRadius, darkMode } = req2.body;
        const updates = {};
        if (themeColor !== undefined) updates.themeColor = themeColor;
        if (fontFamily !== undefined) updates.fontFamily = fontFamily;
        if (baseTextSize !== undefined) updates.baseTextSize = baseTextSize;
        if (borderRadius !== undefined) updates.borderRadius = borderRadius;
        if (darkMode !== undefined) updates.darkMode = darkMode;

        const settings = await Settings.findOneAndUpdate(
          { key: "site_appearance" },
          updates,
          { new: true, upsert: true, runValidators: true }
        );

        return res2.status(200).json({ success: true, data: settings });
      } catch (error) {
        console.error("Update settings error:", error);
        return res2.status(500).json({ success: false, message: "Failed to update settings" });
      }
    })(req, res);
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}
