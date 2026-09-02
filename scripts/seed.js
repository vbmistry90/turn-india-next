/**
 * Seed script — populates the database with a demo admin user and sample
 * records for every collection so you can explore the dashboard right away.
 *
 * Usage:
 *   npm run seed
 *
 * Requires MONGODB_URI to be set in .env.local (or .env)
 */
require("dotenv").config({ path: ".env.local" });
require("dotenv").config();

const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");

const MONGODB_URI = process.env.MONGODB_URI;

if (!MONGODB_URI) {
  console.error("❌ MONGODB_URI is not set. Add it to your .env.local file.");
  process.exit(1);
}

const UserSchema = new mongoose.Schema(
  {
    name: String,
    email: { type: String, unique: true, lowercase: true },
    password: String,
    phone: String,
    role: { type: String, default: "editor" },
    isActive: { type: Boolean, default: true },
    twoFactorEnabled: { type: Boolean, default: false },
    twoFactorMethod: { type: String, default: null },
  },
  { timestamps: true }
);

const VideoSchema = new mongoose.Schema(
  {
    name: String,
    url: String,
    publicId: String,
    category: String,
    description: String,
    author: String,
    status: { type: String, default: "draft" },
    priority: { type: String, default: "medium" },
  },
  { timestamps: true }
);

const PaymentSchema = new mongoose.Schema(
  {
    transactionId: { type: String, unique: true },
    amount: Number,
    currency: { type: String, default: "USD" },
    status: { type: String, default: "pending" },
    active: { type: Boolean, default: true },
    user: String,
  },
  { timestamps: true }
);

const ContactSchema = new mongoose.Schema(
  {
    name: String,
    email: String,
    phone: String,
    subject: String,
    message: String,
    status: { type: String, default: "new" },
  },
  { timestamps: true }
);

const EcoStatSchema = new mongoose.Schema(
  {
    category: String,
    label: String,
    value: Number,
    unit: String,
    month: String,
  },
  { timestamps: true }
);

const SettingsSchema = new mongoose.Schema(
  {
    key: { type: String, default: "site_appearance", unique: true },
    themeColor: { type: String, default: "#16a34a" },
    fontFamily: { type: String, default: "Inter" },
    baseTextSize: { type: String, default: "md" },
    borderRadius: { type: String, default: "md" },
    darkMode: { type: Boolean, default: false },
  },
  { timestamps: true }
);

const HealthEventSchema = new mongoose.Schema(
  {
    monitorId: String,
    monitorName: String,
    monitorUrl: String,
    status: { type: String, default: "unknown" },
    statusCode: String,
    reason: String,
    raw: mongoose.Schema.Types.Mixed,
  },
  { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
const Video = mongoose.model("Video", VideoSchema);
const Payment = mongoose.model("Payment", PaymentSchema);
const Contact = mongoose.model("Contact", ContactSchema);
const EcoStat = mongoose.model("EcoStat", EcoStatSchema);
const Settings = mongoose.model("Settings", SettingsSchema);
const HealthEvent = mongoose.model("HealthEvent", HealthEventSchema);

async function seed() {
  console.log("🔌 Connecting to MongoDB...");
  await mongoose.connect(MONGODB_URI);
  console.log("✅ Connected");

  // --- Demo users (admin + editor, to demo role management) ---
  const adminEmail = "admin@ecoadmin.com";
  const existingAdmin = await User.findOne({ email: adminEmail });
  if (!existingAdmin) {
    const hashed = await bcrypt.hash("Admin@123", 10);
    await User.create({
      name: "Demo Admin",
      email: adminEmail,
      password: hashed,
      phone: "+15550001234",
      role: "admin",
      isActive: true,
    });
    console.log(`👤 Created demo admin -> email: ${adminEmail} / password: Admin@123`);
  } else {
    console.log("👤 Demo admin already exists, skipping");
  }

  const editorEmail = "editor@ecoadmin.com";
  const existingEditor = await User.findOne({ email: editorEmail });
  if (!existingEditor) {
    const hashed = await bcrypt.hash("Editor@123", 10);
    await User.create({
      name: "Demo Editor",
      email: editorEmail,
      password: hashed,
      role: "editor",
      isActive: true,
    });
    console.log(`👤 Created demo editor -> email: ${editorEmail} / password: Editor@123`);
  } else {
    console.log("👤 Demo editor already exists, skipping");
  }

  // --- Videos ---
  const videoCount = await Video.countDocuments();
  if (videoCount === 0) {
    await Video.insertMany([
      {
        name: "Recycling Facility Tour",
        url: "https://res.cloudinary.com/demo/video/upload/v1690000000/samples/elephants.mp4",
        category: "Sustainability",
        description: "A walkthrough of our latest recycling facility.",
        author: "Priya Shah",
        status: "published",
        priority: "high",
      },
      {
        name: "Energy Audit Highlights",
        url: "https://res.cloudinary.com/demo/video/upload/v1690000000/samples/sea-turtle.mp4",
        category: "Energy",
        description: "Key findings from our Q2 energy audit.",
        author: "Rohan Mehta",
        status: "draft",
        priority: "medium",
      },
      {
        name: "Toxic Waste Handling Protocol",
        url: "https://res.cloudinary.com/demo/video/upload/v1690000000/samples/dog.mp4",
        category: "Safety",
        description: "Training video on safe handling procedures.",
        author: "Anita Verma",
        status: "published",
        priority: "high",
      },
    ]);
    console.log("🎬 Seeded sample videos");
  } else {
    console.log("🎬 Videos already exist, skipping");
  }

  // --- Payments ---
  const paymentCount = await Payment.countDocuments();
  if (paymentCount === 0) {
    await Payment.insertMany([
      { transactionId: "TXN-1001", amount: 249.99, status: "success", active: true, user: "john@example.com" },
      { transactionId: "TXN-1002", amount: 89.5, status: "pending", active: true, user: "sara@example.com" },
      { transactionId: "TXN-1003", amount: 499, status: "failed", active: false, user: "amit@example.com" },
      { transactionId: "TXN-1004", amount: 150, status: "refunded", active: false, user: "lisa@example.com" },
      { transactionId: "TXN-1005", amount: 320.75, status: "success", active: true, user: "kevin@example.com" },
    ]);
    console.log("💳 Seeded sample payments");
  } else {
    console.log("💳 Payments already exist, skipping");
  }

  // --- Contacts ---
  const contactCount = await Contact.countDocuments();
  if (contactCount === 0) {
    await Contact.insertMany([
      { name: "Meera Kapoor", email: "meera@example.com", subject: "Partnership inquiry", message: "Interested in partnering on your recycling program.", status: "new" },
      { name: "David Lin", email: "david@example.com", subject: "Bug report", message: "The dashboard chart doesn't load on Safari.", status: "read" },
      { name: "Fatima Noor", email: "fatima@example.com", subject: "General question", message: "Do you offer bulk waste pickup for offices?", status: "resolved" },
    ]);
    console.log("📩 Seeded sample contacts");
  } else {
    console.log("📩 Contacts already exist, skipping");
  }

  // --- Eco stats ---
  const ecoCount = await EcoStat.countDocuments();
  if (ecoCount === 0) {
    const months = ["2026-05", "2026-06", "2026-07", "2026-08"];
    const toxicLabels = ["Lead", "Mercury", "Cadmium"];
    const energyLabels = ["Idle HVAC", "Server Load", "Lighting"];

    const stats = [];
    months.forEach((month, i) => {
      toxicLabels.forEach((label, j) => {
        stats.push({ category: "toxic_materials", label, value: 40 + i * 5 + j * 12, unit: "kg", month });
      });
      energyLabels.forEach((label, j) => {
        stats.push({ category: "energy_waste", label, value: 500 + i * 40 + j * 90, unit: "kWh", month });
      });
    });

    await EcoStat.insertMany(stats);
    console.log("🌱 Seeded sample eco-stats");
  } else {
    console.log("🌱 Eco-stats already exist, skipping");
  }

  // --- Appearance settings (singleton) ---
  const existingSettings = await Settings.findOne({ key: "site_appearance" });
  if (!existingSettings) {
    await Settings.create({ key: "site_appearance" });
    console.log("🎨 Seeded default appearance settings");
  } else {
    console.log("🎨 Appearance settings already exist, skipping");
  }

  // --- Sample health events ---
  const healthCount = await HealthEvent.countDocuments();
  if (healthCount === 0) {
    await HealthEvent.insertMany([
      {
        monitorId: "sample-1",
        monitorName: "Main Website",
        monitorUrl: "https://example.com",
        status: "down",
        statusCode: "1",
        reason: "Connection timeout",
      },
      {
        monitorId: "sample-1",
        monitorName: "Main Website",
        monitorUrl: "https://example.com",
        status: "up",
        statusCode: "2",
        reason: "Back online",
      },
    ]);
    console.log("💓 Seeded sample health events");
  } else {
    console.log("💓 Health events already exist, skipping");
  }

  console.log("\n✅ Seed complete!");
  console.log("   Admin login:  admin@ecoadmin.com / Admin@123");
  console.log("   Editor login: editor@ecoadmin.com / Editor@123\n");

  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error("❌ Seed failed:", err);
  process.exit(1);
});
