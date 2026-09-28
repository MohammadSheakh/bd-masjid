# TK-DB-01: Modular Prisma Schema Builder & PostGIS Migrations

## Spec
Parent Spec: [database-migrations.md](../database-migrations.md)

## Status
**Completed** `[x]`

## Priority
Critical

---

## Description
Provide the multi-module schema structure that allows each feature folder to declare its own Prisma models, which are compiled by a pre-generate build script into the root `schema.prisma`.

## Acceptance Criteria
- [x] Schema builder combines module `.prisma` files into `backend-nest-prisma/prisma/schema.prisma`.
- [x] PostGIS extension initialized in PostgreSQL setup.
- [x] Models configured with proper relational integrity, indexes, and nullability semantics.
- [x] Zero drift between TypeScript types and database schema.

## Implementation Files
- Base Schemas: `backend-nest-prisma/prisma/`
- Schema Script: `backend-nest-prisma/package.json`
