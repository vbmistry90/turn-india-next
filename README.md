# 🌿 Turn-India Admin Dashboard

A full-stack admin dashboard built with **Next.js**, **Tailwind CSS**, and **MongoDB** — featuring authentication with "Remember Me", an eco-system analytics dashboard (Toxic Materials / Energy Waste), a project-videos manager with **Cloudinary** uploads, a payments/transactions table, and a contact-inquiry manager.

---

## ✨ Features

| # | Feature | Details |
|---|---------|---------|
| 1 | **Login & Registration** | JWT-based auth, `httpOnly` cookies, **Remember Me** (persistent vs. session cookie) |
| 2 | **Dashboard (Turn-India System)** | Charts for **Toxic Materials** & **Energy Waste**, monthly trend line chart, summary stat cards |
| 3 | **Project Videos** | Upload to **Cloudinary**, fields: name, url, category, description, author, status, priority, time — paginated table with search |
| 4 | **Payments** | Transaction history table: transaction ID, amount, status, active toggle, user — paginated + filterable, revenue summary |
| 5 | **Contact Inquiries** | Public inquiry form (`/contact`) + admin list/detail/status management |
| 6 | **Session Management** | `httpOnly` JWT cookie, Edge middleware route protection, logout clears session |

Backed by MongoDB (via Mongoose) with full REST API routes for every module.

---

## 🧱 Tech Stack

- **Next.js 14** (Pages Router) — React framework + API routes
- **Tailwind CSS** — styling
- **MongoDB + Mongoose** — database
- **JWT (`jsonwebtoken` + `jose`)** — authentication (Node runtime + Edge middleware)
- **bcryptjs** — password hashing
- **Cloudinary** — video storage/CDN
- **SWR** — client-side data fetching/caching
- **Recharts** — dashboard charts
- **react-icons** — icons

---

## 📁 Project Structure

```
turn-india-admin-dashboard/
├── components/            # Sidebar, Navbar, DashboardLayout, PaginatedTable, Modal, StatusBadge
├── hooks/                 # useAuth (SWR-based session hook)
├── lib/
│   ├── mongodb.js         # cached DB connection
│   ├── auth.js            # JWT sign/verify + cookie session (remember-me logic)
│   └── cloudinary.js      # signed upload/delete helpers
├── models/                 # User, Video, Payment, Contact, EcoStat (Mongoose schemas)
├── middleware.js           # Edge middleware — protects /dashboard/*
├── pages/
│   ├── index.js            # redirects to /login
│   ├── login.js             # Login page (Remember Me)
│   ├── register.js          # Registration page
│   ├── contact.js           # Public contact/inquiry form
│   ├── dashboard/
│   │   ├── index.js         # Eco-system overview + charts
│   │   ├── videos.js         # Project videos (Cloudinary upload + table)
│   │   ├── payments.js        # Payment history table
│   │   └── contacts.js        # Inquiry management
│   └── api/
│       ├── auth/{login,register,logout,me}.js
│       ├── videos/{index,[id]}.js
│       ├── payments/{index,[id]}.js
│       ├── contacts/{index,[id]}.js
│       ├── eco-stats/index.js
│       └── upload/cloudinary-signature.js
├── scripts/seed.js          # populates sample data + demo admin user
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js 18+**
- A **MongoDB** database — either:
  - [MongoDB Atlas](https://www.mongodb.com/atlas) (free tier, recommended), or
  - a local MongoDB instance (`mongodb://localhost:27017`)
- A **Cloudinary** account (free tier is fine) — [cloudinary.com](https://cloudinary.com)

### 2. Install dependencies

```bash
cd turn-india-admin-dashboard
npm install
```

### 3. Configure environment variables

Copy the example file and fill in your own values:

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```env
# MongoDB connection string
MONGODB_URI=mongodb+srv://<username>:<password>@<cluster-url>/eco_admin?retryWrites=true&w=majority

# JWT secret — use a long random string in production
JWT_SECRET=replace_with_a_long_random_secret_string
JWT_EXPIRES_IN=1d
JWT_REMEMBER_EXPIRES_IN=30d

# Cloudinary
NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME=your_cloud_name
NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET=your_unsigned_upload_preset
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret
```

**Generating a strong JWT secret**, e.g.:
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set up Cloudinary (for video uploads)

The video-upload UI uses an **unsigned upload preset** (simplest, all client-side):

1. Log in to your [Cloudinary Dashboard](https://cloudinary.com/console).
2. Copy your **Cloud Name** → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
3. Go to **Settings → Upload → Upload presets → Add upload preset**.
4. Set **Signing Mode** to `Unsigned`, save, and copy the preset name → `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
5. (Optional) Also fill in `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` from **Settings → Access Keys** — these are used server-side to delete videos from Cloudinary when you delete them from the dashboard, and are required if you switch to signed uploads via `/api/upload/cloudinary-signature`.

### 5. (Optional) Seed sample data

Populates a demo admin user + sample videos, payments, contacts, and eco-stats so the dashboard isn't empty on first run:

```bash
npm run seed
```

This creates a login you can use immediately:
```
Email:    admin@ecoadmin.com
Password: Admin@123
```

> You can also just register a fresh account at `/register` instead of seeding.

### 6. Run the dev server

```bash
npm run dev
```

Visit **http://localhost:3000** — you'll be redirected to `/login`.

### 7. Build for production

```bash
npm run build
npm start
```

---

## 🔐 Authentication & Session Notes

- Passwords are hashed with **bcrypt** before being stored.
- On login, a JWT is signed and set as an **`httpOnly` cookie** (`eco_admin_token`) — never exposed to client-side JS.
- **Remember Me checked** → cookie persists for `JWT_REMEMBER_EXPIRES_IN` (default 30 days), survives browser restarts.
- **Remember Me unchecked** → cookie has no `maxAge`, so it's a **browser-session cookie** (cleared when the browser closes); the underlying JWT itself still expires after `JWT_EXPIRES_IN` (default 1 day) as a safety net.
- `middleware.js` runs on the **Edge runtime** (using `jose`, since `jsonwebtoken` needs Node APIs) and redirects unauthenticated users away from `/dashboard/*`, and redirects already-logged-in users away from `/login` / `/register`.
- Logging out (`POST /api/auth/logout`) clears the cookie immediately.
- All data API routes (`/api/videos`, `/api/payments`, `/api/contacts` GET, `/api/eco-stats`) are wrapped with `requireAuth` and reject requests without a valid session — this is enforced server-side, not just by the UI.

---

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create a new admin account |
| POST | `/api/auth/login` | Public | Login, sets session cookie (`rememberMe` supported) |
| POST | `/api/auth/logout` | — | Clears session cookie |
| GET | `/api/auth/me` | Session | Returns the logged-in user |
| GET | `/api/videos` | Session | List videos — `?page&limit&search&category&status&priority` |
| POST | `/api/videos` | Session | Create a video record |
| GET/PUT/DELETE | `/api/videos/:id` | Session | Fetch / update / delete a video (delete also removes it from Cloudinary) |
| GET | `/api/payments` | Session | List payments — `?page&limit&search&status&active`, returns `totalRevenue` |
| POST | `/api/payments` | Session | Create a payment record |
| GET/PUT/DELETE | `/api/payments/:id` | Session | Fetch / update / delete a payment |
| POST | `/api/contacts` | **Public** | Submit a contact/inquiry form |
| GET | `/api/contacts` | Session | List inquiries — `?page&limit&search&status` |
| GET/PATCH/DELETE | `/api/contacts/:id` | Session | Fetch / update status / delete an inquiry |
| GET | `/api/eco-stats` | Session | Toxic materials & energy waste data for the dashboard charts |
| POST | `/api/eco-stats` | Session | Add a new eco-stat data point |
| GET | `/api/upload/cloudinary-signature` | Session | Get a signature for **signed** Cloudinary uploads (alternative to the unsigned preset flow) |

All responses follow the shape `{ success: boolean, data?, message?, pagination? }`.

---

## 🎨 Customization Tips

- **Colors**: edit the `primary` / `ink` palettes in `tailwind.config.js`.
- **Add more eco-system categories**: extend the `category` enum in `models/EcoStat.js` and update the dashboard charts in `pages/dashboard/index.js`.
- **Switch to signed Cloudinary uploads**: the client currently uses an unsigned preset (`pages/dashboard/videos.js`). To use signed uploads instead, call `GET /api/upload/cloudinary-signature` first and include the returned `signature`, `timestamp`, and `apiKey` in your upload request.
- **Roles**: `models/User.js` has a `role` field (`admin` / `editor`) ready to be used for permission checks if you want to restrict certain actions.

---

## 🛠 Troubleshooting

- **"Please define the MONGODB_URI environment variable"** → make sure `.env.local` exists and the dev server was restarted after adding it.
- **Login redirects back to `/login` immediately** → check `JWT_SECRET` is set and matches between requests (don't change it while cookies from an old secret still exist — just log in again).
- **Video upload fails / "Cloudinary is not configured"** → double check `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME` and `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`, and that the upload preset's signing mode is **Unsigned**.
- **MongoDB connection timeout on Atlas** → make sure your current IP is allow-listed under **Network Access** in the Atlas dashboard (or allow `0.0.0.0/0` for development).

---

## 📄 License

Free to use and modify for personal or commercial projects.
