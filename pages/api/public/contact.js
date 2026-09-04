import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { getUserFromReq } from "@/lib/auth";

// Comma-separated list of domains allowed to call this endpoint
// e.g. "https://yoursite.com,https://www.yoursite.com". Defaults to "*"
// for easy local testing — lock this down before going to production.
const ALLOWED_ORIGINS = (process.env.PUBLIC_SITE_ORIGINS || "*")
    .split(",")
    .map((o) => o.trim());

function setCorsHeaders(req, res) {
    const origin = req.headers.origin;
    if (ALLOWED_ORIGINS.includes("*")) {
        res.setHeader("Access-Control-Allow-Origin", "*");
    } else if (origin && ALLOWED_ORIGINS.includes(origin)) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }
    res.setHeader("Access-Control-Allow-Methods", "GET,POST, OPTIONS");
    res.setHeader("Access-Control-Allow-Headers", "Content-Type");
}

/**
 * Public, unauthenticated endpoint that returns only PUBLISHED videos.
 * Intended for use from an external marketing/public site via fetch().
 */
export default async function handler(req, res) {
    setCorsHeaders(req, res);

    try {
        await dbConnect();

        const { name, email, phone, subject, message } = req.body;
        if (!name || !email || !message) {
            return res.status(400).json({ success: false, message: "name, email and message are required" });
        }

        const contact = await Contact.create({ name, email, phone, subject, message });
        return res.status(201).json({
            success: true,
            message: "Thanks for reaching out! We'll get back to you soon.",
            data: contact,
        });
    } catch (error) {
      console.error("Create contact error:", error);
      return res.status(500).json({ success: false, message: "Failed to submit inquiry" });
    }
}
