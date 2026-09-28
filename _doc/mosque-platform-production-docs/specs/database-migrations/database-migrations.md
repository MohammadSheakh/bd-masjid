# Feature Specification: Database Architecture & Migrations

## 1. Overview
The Database Architecture & Migrations feature establishes the PostgreSQL + PostGIS relational schema, modular Prisma schema assembly scripts, spatial indexes, audit schemas, and migration hygiene.

## 2. Business Invariants
1. **PostgreSQL + PostGIS Single Source of Truth**: All persistent state resides in the relational database.
2. **Controlled Migration Replay**: Migrations are versioned and committed to source control; `prisma db push` in production is strictly prohibited.
3. **Additive Non-Breaking Evolution**: Schema updates must maintain backward compatibility during rollouts.

## 3. Extracted Implementation Checklist
- [x] Modular Prisma schema builder scripts configured
- [x] PostGIS extension initialized
- [x] Complete domain schemas defined (Mosque, User, PrayerSchedule, Attendance, Suggestions, Audit)
- [x] Indexes configured for query plans (coordinates, status, actors)
- [x] Foreign key cascade and delete semantics reviewed
- [ ] Automated backup & restore exercise completed on staging/prod infrastructure

## 4. Associated Tickets
- [TK-DB-01: Modular Prisma Schema Builder & PostGIS Migrations](tickets/TK-DB-01-schema-builder-and-migrations.md)
