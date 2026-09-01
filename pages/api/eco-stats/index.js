import dbConnect from "@/lib/mongodb";
import EcoStat from "@/models/EcoStat";
import { requireAuth } from "@/lib/auth";

async function handler(req, res) {
  await dbConnect();

  if (req.method === "GET") {
    try {
      const stats = await EcoStat.find({}).sort({ month: 1 }).lean();

      const toxic = stats.filter((s) => s.category === "toxic_materials");
      const energy = stats.filter((s) => s.category === "energy_waste");

      const sum = (arr) => arr.reduce((acc, s) => acc + s.value, 0);

      return res.status(200).json({
        success: true,
        data: {
          toxicMaterials: toxic,
          energyWaste: energy,
          summary: {
            totalToxic: sum(toxic),
            totalEnergyWaste: sum(energy),
          },
        },
      });
    } catch (error) {
      console.error("Eco stats error:", error);
      return res.status(500).json({ success: false, message: "Failed to fetch eco stats" });
    }
  }

  if (req.method === "POST") {
    try {
      const { category, label, value, unit, month } = req.body;
      if (!category || !label || value === undefined || !month) {
        return res.status(400).json({
          success: false,
          message: "category, label, value and month are required",
        });
      }
      const stat = await EcoStat.create({ category, label, value, unit, month });
      return res.status(201).json({ success: true, data: stat });
    } catch (error) {
      return res.status(500).json({ success: false, message: "Failed to create eco stat" });
    }
  }

  return res.status(405).json({ success: false, message: "Method not allowed" });
}

export default requireAuth(handler);
