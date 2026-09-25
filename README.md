# BD Masjid — Mosque Information & Community Platform

A web-first community platform providing accurate prayer and Jamaat schedules, geographic discovery, attendance tracking, and verified mosque information across Bangladesh.

---

## 🌟 Key Features

- **Geospatial Mosque Discovery**: Map-based navigation powered by OpenStreetMap base tiles with PostGIS spherical proximity filtering.
- **Prayer & Jamaat Timetables**: Precise daily schedules (Fajr, Zuhr, Asr, Maghrib, Isha, Jumu'ah) with dynamic information freshness indicators (Fresh <90d, Stale 90-180d, Very Stale >180d).
- **Pin-Drop Mosque Registration**: Easy community contribution flow with pre-flight spatial duplicate detection within a 50m radius.
- **Attendance & Community Affiliation**: Idempotent tracking allowing community members to mark regular or occasional attendance.
- **Community Corrections & Moderation**: Submit schedule suggestions and report issues (e.g., closed mosque, duplicate listing, inaccurate times) with dedicated moderator review pipelines.
- **Administrative Verification**: Dual-status workflow separating operational states (`OPEN`, `CLOSED`, etc.) from verification tiers (`UNVERIFIED`, `PENDING_VERIFICATION`, `VERIFIED`, `REJECTED`).
- **Complete Audit Trail**: Immutable snapshots of prayer schedule modifications and administrative actions.

---

## 🏗️ System Architecture

```text
bd-masjid/
├── _doc/mosque-platform-production-docs/   # Production specifications and architecture docs
├── backend-nest-prisma/                    # Modular Monolith NestJS API with Prisma ORM
│   ├── libs/                               # Shared libraries (common, database, redis, queue)
│   ├── prisma/schema/                      # Domain-separated modular Prisma schemas
│   └── src/features/                       # Domain modules (mosques, prayer-schedules, attendance, etc.)
└── frontend/                               # Next.js App Router web application
    └── src/app/                            # Ferio visual system, Leaflet map, responsive layout
```

---

## 🚀 Getting Started

### Prerequisites

- Node.js >= 20
- PostgreSQL with PostGIS extension enabled
- npm or pnpm

### Backend Setup

```bash
cd backend-nest-prisma
cp .env.example .env
# Configure your DATABASE_URL, JWT secrets, etc. in .env

npm install
npm run prisma:schema:build
npx prisma generate
npx prisma migrate deploy

npm run start:dev
```

API Documentation will be available at: `http://localhost:6733/api/docs`

### Frontend Setup

```bash
cd frontend
npm install
npm run dev
```

The web application will be available at: `http://localhost:3000`

---

## 📄 License

Private repository — All rights reserved.
