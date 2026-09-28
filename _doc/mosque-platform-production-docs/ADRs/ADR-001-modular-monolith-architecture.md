# ADR-001: Modular Monolith Architecture with NestJS and Next.js

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
The Mosque Information & Community Platform requires robust, high-performance geospatial discovery, community crowdsourcing, prayer time tracking, and admin moderation for thousands of mosques across Bangladesh.

During initial system design, architectural patterns were evaluated:
1. **Microservices architecture**: Distributing auth, mosques, prayer times, and moderation into independent services with message brokers.
2. **Modular monolith**: A single authoritative NestJS backend structured into strictly decoupled domain modules, paired with a Next.js web application for responsive presentation.

Given that the platform is a single-tenant national application with strong relational invariants (e.g. transactions across schedules and history, cascades on mosque deletion, relational foreign keys for audit logs), microservices would introduce unwarranted network latency, distributed transaction complexity (Sagas/two-phase commit), operational overhead, and premature infrastructure (Kafka, RabbitMQ, Redis).

## Decision
1. **Monorepo / Modular Monolith**: Build a single authoritative NestJS application (`backend-nest-prisma`) coupled with a Next.js web application (`frontend`).
2. **Strict Domain Modularity**: Organize backend code into bounded feature modules (`mosques`, `prayer-schedules`, `attendance`, `suggestions`, `mosque-verification`, `community`, `audit`, `authentication`, `operations-health`).
3. **No Unjustified Infrastructure**: Disallow introducing distributed message queues, microservices, or Redis caching layers until measured traffic or concrete concurrency limits necessitate them. All domain transactions run directly on PostgreSQL.
4. **Separation of Concerns**:
   - Next.js owns rendering, routing, client interaction states, and map display.
   - NestJS owns all authentication, authorization, business invariants, persistence orchestration, and audit trails.

## Consequences

### Positive
- **Transactional Integrity**: Atomic database transactions (`Prisma.$transaction`) guarantee consistency across prayer schedule updates, audit logging, and verification workflows.
- **Fast Developer Velocity**: Shared TypeScript types, straightforward local development (`npm run dev`), single Docker compose footprint.
- **Operational Simplicity**: No service mesh, distributed tracing overhead, or asynchronous eventual consistency lag.
- **Predictable Performance**: Zero internal RPC serialization/network latency between modules.

### Tradeoffs & Mitigations
- **Risk of Module Coupling**: Without physical process boundaries, modules could accidentally import internal helpers.
  - *Mitigation*: Strictly enforce NestJS module boundaries, dependency injection, and clean module exports.
- **Single Process Failure**: An uncaught runtime crash affects all features.
  - *Mitigation*: Comprehensive global exception filter, health probes (`/health/live`, `/health/ready`), process supervisors, and graceful shutdown hooks.

## References
- System Architecture: `_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md`
- Production PRD: `_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md`
