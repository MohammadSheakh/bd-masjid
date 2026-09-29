---
id: F-001
name: Database Architecture & Migrations
phase: 1
status: completed

depends_on: []

blocks:
  - F-002
  - F-003
  - F-004
  - F-005
  - F-006
  - F-007
  - F-008
  - F-010

parallel_with:
  - F-011

source:
  - 02-SYSTEM-ARCHITECTURE.md#database-architecture
  - 03-DATA-API-CONTRACTS.md#database-schema
  - 06-IMPLEMENTATION-CHECKLIST.md#b-database-and-migrations
---

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

---

## 4. Implementation Slices & Proof of Completion

### TK-DB-01: Modular Prisma Schema Builder & PostGIS Migrations
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Provide the multi-module schema structure that allows each feature folder to declare its own Prisma models, which are compiled by a pre-generate build script into the root `schema.prisma`.
- **Acceptance Criteria**:
  - [x] Schema builder combines module `.prisma` files into `backend-nest-prisma/prisma/schema.prisma`.
  - [x] PostGIS extension initialized in PostgreSQL setup.
  - [x] Models configured with proper relational integrity, indexes, and nullability semantics.
  - [x] Zero drift between TypeScript types and database schema.
- **Implementation Files**:
  - Base Schemas: `backend-nest-prisma/prisma/`
  - Schema Script: `backend-nest-prisma/package.json`
