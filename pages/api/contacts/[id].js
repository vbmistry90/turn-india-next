import dbConnect from "@/lib/mongodb";
import Contact from "@/models/Contact";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();
  const { id } = req.query;

  if (req.method === "GET") {
    const contact = await Contact.findById(id);
    if (!contact) return res.status(404).json({ success: false, message: "Inquiry not found" });
    return res.status(200).json({ success: true, data: contact });
  }

  if (req.method === "PATCH" || req.method === "PUT") {
    try {
      const { name, email, phone, subject, message, status } = req.body;
      const updates = {};
      if (name !== undefined) updates.name = name;
      if (email !== undefined) updates.email = email;
      if (phone !== undefined) updates.phone = phone;
      if (subject !== undefined) updates.subject = subject;
      if (message !== undefined) updates.message = message;
      if (status !== undefined) updates.status = status;

      const contact = await Contact.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
      if (!contact) return res.status(404).json({ success: false, message: "Inquiry not found" });
      return res.status(200).json({ success: true, data: contact });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to update inquiry" });
    }
  }

  if (req.method === "DELETE") {
    const contact = await Contact.findByIdAndDelete(id);
    if (!contact) return res.status(404).json({ success: false, message: "Inquiry not found" });
    return res.status(200).json({ success: true, message: "Inquiry deleted" });
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
