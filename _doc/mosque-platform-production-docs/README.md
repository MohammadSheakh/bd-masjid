# Mosque Information & Community Platform — Production Documentation Set

This folder is the implementation-facing documentation set for the production-grade
Next.js + NestJS + PostgreSQL/PostGIS application.

## Document authority

Use the documents in this order when there is ambiguity:

1. `01-PRD-PRODUCTION.md` — product requirements and release scope
2. `02-SYSTEM-ARCHITECTURE.md` — system boundaries and architecture decisions
3. `03-DATA-API-CONTRACTS.md` — domain invariants, data model, API behavior
4. `04-SECURITY-RELIABILITY-OPERATIONS.md` — security and operational requirements
5. `05-TESTING-STRATEGY.md` — testing layers and risk coverage
6. `06-IMPLEMENTATION-CHECKLIST.md` — implementation sequence and production readiness gates
7. `07-RELEASE-PLAN.md` — staged feature delivery; every released feature remains production-grade
8. `08-PRODUCTION-ENGINEERING-STANDARD.md` — reusable engineering quality bar

## Core architectural decision

OpenStreetMap is used as the **base map/geographic context**, not as the platform's
mosque registry. Mosque records are created and owned by this platform and stored in
PostgreSQL/PostGIS.

Production-grade does **not** mean introducing every possible infrastructure component
up front. Redis, BullMQ, Socket.io, object storage, queues, caching, or distributed
coordination are introduced only when a concrete requirement requires them.

## Working principle

A small release can be production-grade.

A feature is not considered complete only because the happy path works locally.
Released functionality must have appropriate validation, authorization, integrity,
failure handling, concurrency behavior, observability, testing, migration safety,
and recovery behavior.
