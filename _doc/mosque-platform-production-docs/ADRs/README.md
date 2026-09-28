# Architecture Decision Records (ADRs)

This directory contains the foundational Architecture Decision Records for the **Mosque Information & Community Platform**. Each record documents a critical architectural choice, its context, consequences, and compliance requirements.

## Index of Architecture Decision Records

| ADR ID | Title | Status | Date | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| [ADR-001](ADR-001-modular-monolith-architecture.md) | Modular Monolith Architecture with NestJS and Next.js | Accepted | 2026-09-28 | System Architecture & Boundaries |
| [ADR-002](ADR-002-postgresql-postgis-geospatial-registry.md) | PostgreSQL with PostGIS as Authoritative Geospatial Registry | Accepted | 2026-09-28 | Geospatial & Persistence |
| [ADR-003](ADR-003-server-side-actor-derivation-and-rbac.md) | Role-Based Access Control and Server-Side Actor Derivation | Accepted | 2026-09-28 | Authentication & Authorization |
| [ADR-004](ADR-004-prayer-schedule-temporal-modeling.md) | Prayer Schedule Temporal Modeling and Atomic History Snapshots | Accepted | 2026-09-28 | Prayer Times & Transactions |
| [ADR-005](ADR-005-spatial-duplicate-detection.md) | Two-Tier Spatial Proximity Duplicate Detection at Mosque Creation | Accepted | 2026-09-28 | Mosque Creation & Validation |
| [ADR-006](ADR-006-crowdsourced-data-moderation-and-verification.md) | Crowdsourced Suggestions, Reports, and Mosque Verification Workflow | Accepted | 2026-09-28 | Community & Moderation |
| [ADR-007](ADR-007-uniform-error-contract-and-observability.md) | Uniform API Error Contract, Correlation Tracking, and Logging Sanitization | Accepted | 2026-09-28 | Security & Observability |
| [ADR-008](ADR-008-infrastructure-stack-and-mongoose-removal.md) | Infrastructure Retentions (Redis, BullMQ, Cloudinary, Firebase Admin) and Complete Removal of Mongoose | Accepted | 2026-09-28 | Infrastructure & Persistence |

---

## When to write a new ADR
Create a new ADR when introducing or changing:
1. Data storage technologies or schema partitioning strategies.
2. Cross-module communication or external third-party integrations (e.g. SMS gateways, Push notifications).
3. Authorization policies or cryptographic standards.
4. Infrastructure primitives (e.g., adding Redis, BullMQ, or Object Storage).
