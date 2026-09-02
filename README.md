# 🌿 Eco Admin Dashboard v2.0

A full-stack admin dashboard built with **Next.js**, **Tailwind CSS**, and **MongoDB** — authentication with 2FA (Authenticator app / Email / SMS), role-based user management, project videos with Cloudinary, payments tracking, contact inquiries, a media library, dashboard analytics, appearance theming, and UptimeRobot health monitoring.

---

## ✨ Features

| Area | What's included |
|---|---|
| **Login & Registration** | JWT + `httpOnly` cookies, **Remember Me**, first registered account becomes admin automatically |
| **Two-Factor Authentication** | Authenticator app (TOTP/Google Authenticator), Email OTP, SMS OTP — each can be enabled/disabled independently from **My Profile**, enforced at login |
| **Dashboard** | Stat cards + bar charts (Toxic Materials, Energy Waste), monthly trend line chart, and status-breakdown pie charts for videos/payments/inquiries |
| **Project Videos** | Cloudinary upload, full CRUD with **Edit** and **View** actions, paginated + searchable table |
| **Payments** | Transaction history with **Edit** and **View** actions, status/active filters, revenue summary |
| **Contact Inquiries** | Public inquiry form + admin list with **View** and **Edit** actions, status workflow (new → read → resolved) |
| **My Profile** | Edit name/phone, change password, manage 2FA methods |
| **Manage Users** | Admin-only table — assign roles (admin/editor/viewer), enable/disable accounts, remove users |
| **Appearance** | Admin-only theme editor — brand color, font family, text size, corner radius, with live preview, applied dashboard-wide |
| **Media Library** | Static image/video gallery backed by Cloudinary, upload + delete |
| **Health Monitor** | Pulls live monitor status from **UptimeRobot**, plus a webhook receiver that logs Up/Down alert history |
| **Loading States** | Skeleton placeholders on every page (tables, charts, stat cards, forms) instead of spinners/blank screens, plus a top-of-page progress bar on route changes |
| **API Response Time** | A live badge in the navbar shows the latency of the most recent API call (click it for recent-call history), color-coded by speed |
| **Session Management** | `httpOnly` JWT cookie, Edge middleware route protection, logout clears session |

Backed by MongoDB (via Mongoose) with full REST API routes for every module.

---

## 🧱 Tech Stack

- **Next.js 14** (Pages Router) — React framework + API routes
- **Tailwind CSS** — styling
- **MongoDB + Mongoose** — database
- **JWT (`jsonwebtoken` + `jose`)** — authentication (Node runtime + Edge middleware)
- **bcryptjs** — password hashing
- **otplib + qrcode** — TOTP-based 2FA (Google Authenticator compatible)
- **nodemailer** — Email OTP delivery (SMTP)
- **Twilio REST API (via fetch)** — SMS OTP delivery
- **Cloudinary** — video/image storage/CDN
- **UptimeRobot API** — uptime/health monitoring
- **SWR** — client-side data fetching/caching
- **Recharts** — dashboard charts
- **react-icons** — icons

---

## 📁 Project Structure

```
eco-admin-dashboard/
├── components/            # Sidebar, Navbar, DashboardLayout, PaginatedTable, Modal, StatusBadge
├── hooks/                 # useAuth (SWR-based session hook)
├── lib/
│   ├── mongodb.js         # cached DB connection
│   ├── auth.js            # JWT sign/verify, cookie session, requireAuth/requireAdmin, 2FA temp tokens
│   ├── cloudinary.js       # signed upload/delete helpers
│   ├── twofactor.js        # TOTP secret/QR generation + verification
│   ├── mailer.js           # SMTP email sending (OTP delivery)
│   ├── sms.js               # Twilio SMS sending (OTP delivery)
│   └── uptimerobot.js        # UptimeRobot API wrapper
├── models/                 # User, Video, Payment, Contact, EcoStat, Settings, Media, HealthEvent
├── middleware.js           # Edge middleware — protects /dashboard/*
├── pages/
│   ├── login.js             # Login page (Remember Me + 2FA challenge step)
│   ├── register.js          # Registration page
│   ├── contact.js           # Public contact/inquiry form
│   ├── dashboard/
│   │   ├── index.js           # Overview: stat cards + charts
│   │   ├── videos.js           # Project videos (Cloudinary upload, Edit/View/Delete)
│   │   ├── payments.js          # Payment history (Edit/View/Delete)
│   │   ├── contacts.js           # Inquiry management (Edit/View/Delete)
│   │   ├── profile.js             # Account info, password, 2FA setup
│   │   ├── users.js                 # Admin-only: role assignment, enable/disable
│   │   ├── appearance.js             # Admin-only: theme customization
│   │   ├── media.js                    # Media library gallery
│   │   └── health.js                    # UptimeRobot monitor dashboard
│   └── api/
│       ├── auth/{login,register,logout,me,verify-2fa}.js
│       ├── user/{profile,change-password}.js
│       ├── user/2fa/{totp,email,sms}/{setup,verify}.js, 2fa/disable.js
│       ├── users/{index,[id]}.js         # admin-only
│       ├── videos/{index,[id]}.js
│       ├── payments/{index,[id]}.js
│       ├── contacts/{index,[id]}.js
│       ├── eco-stats/index.js
│       ├── settings/theme.js
│       ├── media/{index,[id]}.js
│       ├── health/{monitors,webhook,events}.js
│       ├── public/videos.js               # unauthenticated, for external sites
│       └── upload/cloudinary-signature.js
├── scripts/seed.js          # populates sample data + demo admin/editor users
├── .env.example
└── package.json
```

---

## 🚀 Getting Started

### 1. Prerequisites

- **Node.js 18+**
- A **MongoDB** database ([Atlas](https://www.mongodb.com/atlas) or local)
- A **Cloudinary** account (free tier is fine)
- *(Optional, for full feature set)* An SMTP provider (Gmail, SendGrid, etc.), a Twilio account, and an UptimeRobot account

### 2. Install dependencies

```bash
cd eco-admin-dashboard
npm install
```

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Fill in `.env.local` — see the comments in that file for where to get each value. At minimum you need `MONGODB_URI`, `JWT_SECRET`, and the Cloudinary variables to run the core app. Email/SMS/UptimeRobot variables are only needed if you want to use those specific features.

**Generate a strong JWT secret:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Set up Cloudinary

1. Copy your **Cloud Name** from the [Cloudinary Dashboard](https://cloudinary.com/console) → `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`.
2. **Settings → Upload → Upload presets → Add upload preset** → set **Signing Mode** to `Unsigned` → save → copy the preset name → `NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET`.
3. From **Settings → Access Keys**, copy `CLOUDINARY_API_KEY` / `CLOUDINARY_API_SECRET` (used server-side for deleting assets).

### 5. (Optional) Set up Email OTP

Any SMTP provider works. For Gmail: enable 2-Step Verification on the Google account, then generate an **App Password** and use it as `SMTP_PASS`.

### 6. (Optional) Set up SMS OTP

Create a [Twilio](https://www.twilio.com/) account, buy/verify a phone number, and set `TWILIO_ACCOUNT_SID`, `TWILIO_AUTH_TOKEN`, `TWILIO_FROM_NUMBER`.

### 7. (Optional) Set up UptimeRobot health monitoring

1. Create monitors in your [UptimeRobot dashboard](https://uptimerobot.com/dashboard).
2. Get a **Read-Only API key** from **My Settings** → `UPTIMEROBOT_API_KEY`. This powers the live status table on `/dashboard/health`.
3. *(Optional, for alert history)* Under a monitor's **Alert Contacts**, add a **Web-Hook** contact pointing to:
   ```
   https://your-app.com/api/health/webhook?secret=YOUR_UPTIMEROBOT_WEBHOOK_SECRET
   ```
   with this POST value (JSON):
   ```json
   {
     "monitorID": "*monitorID*",
     "monitorFriendlyName": "*monitorFriendlyName*",
     "monitorURL": "*monitorURL*",
     "alertType": "*alertType*",
     "alertTypeFriendlyName": "*alertTypeFriendlyName*",
     "alertDetails": "*alertDetails*"
   }
   ```
   Set `UPTIMEROBOT_WEBHOOK_SECRET` in `.env.local` to match.

### 8. Seed sample data

```bash
npm run seed
```

Creates:
```
Admin login:  admin@ecoadmin.com  / Admin@123
Editor login: editor@ecoadmin.com / Editor@123
```
Plus sample videos, payments, contacts, eco-stats, appearance settings, and health events.

> If you skip seeding, just register at `/register` — the **first account created becomes an admin automatically**.

### 9. Run it

```bash
npm run dev       # development
# or
npm run build && npm start   # production
```

Visit **http://localhost:3000**.

---

## 🔐 Authentication, 2FA & Sessions

- Passwords are hashed with **bcrypt**.
- Sessions are **httpOnly JWT cookies** — never exposed to client-side JS.
- **Remember Me checked** → cookie persists for `JWT_REMEMBER_EXPIRES_IN` (default 30 days). **Unchecked** → browser-session cookie, backed by a 1-day JWT as a safety net.
- **Two-Factor Authentication** (set up per-user under **My Profile → Two-Factor Authentication**):
  - **Authenticator App**: scan a QR code (TOTP, `otplib`), compatible with Google Authenticator, Authy, 1Password, etc.
  - **Email**: a 6-digit code is emailed via SMTP on each login.
  - **SMS**: a 6-digit code is texted via Twilio on each login.
  - Only one method can be active at a time per user; disabling clears all 2FA state.
  - Login flow: password is verified first → if 2FA is enabled, the server issues a short-lived (5 min) "pending" token and the UI shows a code-entry screen → `/api/auth/verify-2fa` checks the code and only then sets the real session cookie.
- **Roles**: `admin`, `editor`, `viewer` (stored on `User.role`). Admin-only routes are enforced server-side via `requireAdmin` (`/api/users/*`, `PATCH /api/settings/theme`) — the UI also hides/redirects non-admins away from **Manage Users** and **Appearance**, but the API is the real gate.
- `middleware.js` (Edge runtime, via `jose`) redirects unauthenticated users away from `/dashboard/*` and logged-in users away from `/login`/`/register`.

---

## ⚡ Loading States & API Timing

- Every page shows **skeleton loaders** (animated placeholder bars/cards matching the real layout) while its data is fetching — tables, dashboard charts and stat cards, profile/appearance forms, and the media grid all have dedicated skeleton components in `components/skeletons/`.
- A thin **progress bar** appears at the top of the page during route/page changes (powered by `nprogress`, wired up in `pages/_app.js`), styled to match your brand color.
- The navbar shows a live **API response time badge** (e.g. `84ms`) for the most recent request to `/api/*` — green under 200ms, amber under 600ms, red above that or on failure. Click it to see the last 20 calls. This is powered by `lib/apiClient.js` (`timedFetch` / `timedFetcher`), a drop-in wrapper around `fetch()` used throughout the app instead of calling `fetch` directly — swap it back to plain `fetch` anywhere you don't want timing tracked.

## 📡 API Reference

| Method | Endpoint | Auth | Description |
|---|---|---|---|
| POST | `/api/auth/register` | Public | Create account (first account = admin) |
| POST | `/api/auth/login` | Public | Login; returns `requires2FA` if enabled |
| POST | `/api/auth/verify-2fa` | temp token | Completes login after a valid 2FA code |
| POST | `/api/auth/logout` | — | Clears session cookie |
| GET | `/api/auth/me` | Session | Current user (id/name/email/role) |
| GET/PATCH | `/api/user/profile` | Session | View/update own name & phone |
| POST | `/api/user/change-password` | Session | Change own password |
| POST | `/api/user/2fa/totp/setup` | Session | Generate TOTP secret + QR |
| POST | `/api/user/2fa/totp/verify` | Session | Confirm TOTP code, enable 2FA |
| POST | `/api/user/2fa/email/setup` \| `/verify` | Session | Enable email 2FA |
| POST | `/api/user/2fa/sms/setup` \| `/verify` | Session | Enable SMS 2FA |
| POST | `/api/user/2fa/disable` | Session | Disable 2FA entirely |
| GET | `/api/users` | Admin | List users, paginated/searchable |
| PATCH/DELETE | `/api/users/:id` | Admin | Change role/active status, or remove a user |
| GET/POST | `/api/videos` | Session | List (paginated/search/filter) / create |
| GET/PUT/DELETE | `/api/videos/:id` | Session | Fetch / update / delete (+ Cloudinary cleanup) |
| GET/POST | `/api/payments` | Session | List (+ revenue total) / create |
| GET/PUT/DELETE | `/api/payments/:id` | Session | Fetch / update / delete |
| POST | `/api/contacts` | **Public** | Submit an inquiry |
| GET | `/api/contacts` | Session | List inquiries |
| GET/PATCH/DELETE | `/api/contacts/:id` | Session | Fetch / update (any field) / delete |
| GET/POST | `/api/eco-stats` | Session | Dashboard eco metrics |
| GET | `/api/settings/theme` | Session | Read current appearance settings |
| PATCH | `/api/settings/theme` | Admin | Update appearance settings |
| GET/POST | `/api/media` | Session | List / register a media item |
| DELETE | `/api/media/:id` | Session | Delete (+ Cloudinary cleanup) |
| GET | `/api/health/monitors` | Session | Live monitor list from UptimeRobot |
| POST | `/api/health/webhook` | secret param | Receives UptimeRobot alert webhooks |
| GET | `/api/health/events` | Session | Recent stored alert history |
| GET | `/api/public/videos` | **Public**, CORS | Published videos, for external sites |
| GET | `/api/upload/cloudinary-signature` | Session | Signature for signed Cloudinary uploads |

All responses: `{ success: boolean, data?, message?, pagination? }`.

---

## 🎨 Customization Tips

- **Appearance settings** (color/font/text size/corner radius) are stored in MongoDB (`Settings` collection) and applied via CSS variables in `DashboardLayout` — edit at `/dashboard/appearance` (admin only).
- **Add more eco-system categories**: extend the `category` enum in `models/EcoStat.js`.
- **Switch to signed Cloudinary uploads**: use `GET /api/upload/cloudinary-signature` instead of the unsigned preset flow in `videos.js`/`media.js`.
- **Add more roles/permissions**: extend the `role` enum in `models/User.js` and adjust `requireRole([...])` calls in the API routes that need finer-grained access.

---

## 🛠 Troubleshooting

- **"Please define the MONGODB_URI environment variable"** → check `.env.local` exists and restart the dev server.
- **Login loops back to `/login`** → check `JWT_SECRET` is set and hasn't changed since your last login (old cookies won't validate against a new secret — just log in again).
- **2FA email/SMS code never arrives** → check `SMTP_*` / `TWILIO_*` variables; errors are surfaced in the server console and in the UI response.
- **Video/media upload fails** → confirm `NEXT_PUBLIC_CLOUDINARY_CLOUD_NAME`/`NEXT_PUBLIC_CLOUDINARY_UPLOAD_PRESET` and that the preset's signing mode is **Unsigned**.
- **Health Monitor page shows a warning banner** → `UPTIMEROBOT_API_KEY` isn't set, or is invalid; the rest of the dashboard works fine without it.
- **Can't access Manage Users / Appearance** → only accounts with the `admin` role can — the first registered account gets this automatically; promote others from **Manage Users**.

---

## 📄 License

Free to use and modify for personal or commercial projects.
