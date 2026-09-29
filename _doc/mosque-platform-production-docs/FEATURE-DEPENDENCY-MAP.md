# Feature Dependency & Evolution Map (DAG)

> **Important Conceptual Boundary**: This document is **NOT** an implementation order or project roadmap.  
> It is an **Architectural Build, Persistence, and Evolutionary Dependency Graph (DAG)**. It maps:
> *If feature A changes, breaks, or migrates, what downstream features are affected? If feature B is scheduled for development, what MUST already be deployed, indexed, and stable?*
>
> 🚀 For the **phased chronological implementation plan, parallel development tracks, and stage gates**, see [IMPLEMENTATION-SEQUENCE.md](IMPLEMENTATION-SEQUENCE.md).

---

## 1. Visual Dependency Graph (Mermaid DAG)

```mermaid
flowchart TD
    %% Base Roots
    F001["F-001: Database & Migrations<br/><i>(PostgreSQL + PostGIS)</i>"]
    F011["F-011: Observability & Health<br/><i>(Logging, Tracing, Probes)</i>"]

    %% Identity & Access Trunk
    F002["F-002: Authentication & Security<br/><i>(JWT, Passwords, Rate Limits)</i>"]
    F003["F-003: Authorization & RBAC<br/><i>(Roles, PermissionsGuard)</i>"]

    %% Core Domain Gravity Well
    F004["F-004: Mosque Registry<br/><i>(Core Entity, Coordinates, DB CRUD)</i>"]

    %% Domain Extensions (Release 1)
    F005["F-005: Nearby Discovery & Search<br/><i>(PostGIS ST_DWithin, Text Search)</i>"]
    F006["F-006: Suggestions & Reports<br/><i>(Crowdsourced Moderation)</i>"]
    F007["F-007: Prayer Schedules & History<br/><i>(Atomic Jamaat & Audit)</i>"]
    F008["F-008: Mosque Attendance Tracking<br/><i>(Idempotent Musalli Counts)</i>"]
    F010["F-010: Mosque Verification & Admin<br/><i>(Moderator Approval Pipeline)</i>"]
    F012["F-012: Community Engagement<br/><i>(Staff, Announcements, Donations)</i>"]

    %% Frontend Aggregation Leaf
    F009["F-009: Map Discovery UI<br/><i>(Leaflet, Viewport, Live Countdown)</i>"]

    %% Upcoming Release 2 Trunk
    F020["F-020: Staff Delegation & Governance<br/><i>(Mutawalli / Khateeb Role Claims)</i>"]
    F021["F-021: Enhanced Facilities Taxonomy<br/><i>(Capacity, Access Amenities)</i>"]
    F022["F-022: Official Announcements<br/><i>(Staff-Authored Broadcasts)</i>"]
    F023["F-023: Volunteer Roster Coordination<br/><i>(Jummah / Eid Shifts)</i>"]

    %% Linkages - Infrastructure to Trunks
    F001 -->|Foreign Keys & Prisma Schema| F002
    F001 -->|Spatial Point & WGS84 Tables| F004

    %% Linkages - Auth Trunk
    F002 -->|Decoded JWT Payload| F003
    F003 -->|Admin/Moderator Guards| F010
    F003 -->|Staff/Admin Mutate Guards| F007
    F003 -->|Governance Enforcement| F020

    %% Linkages - Mosque Domain Trunk
    F004 -->|mosqueId FK + PostGIS Index| F005
    F004 -->|mosqueId FK & Moderation Queue| F006
    F004 -->|mosqueId @unique FK| F007
    F004 -->|mosqueId FK & Aggregations| F008
    F004 -->|Verification Status Lifecycle| F010
    F004 -->|mosqueId FK & Relational Joins| F012

    %% Linkages - Release 2 Extensions
    F004 -.->|Extends Mosque Model| F021
    F004 -->|mosqueId FK| F020
    F020 -->|Staff Authorization Scope| F022
    F020 -->|Staff Coordination Scope| F023

    %% Linkages - Cross-Domain
    F002 -.->|Optional Creator Actor| F004
    F002 -->|Mandatory User ID FK| F008
    F006 -->|Feeds Pending Queue| F010

    %% Linkages - UI Presentation Leaves
    F004 -->|Profile Data & Metadata| F009
    F005 -->|Radial Pin Coordinates| F009
    F007 -->|Active Jamaat Times| F009

    %% Cross-Cutting Injection
    F011 -.-|Correlation ID & Sanitizer| F002
    F011 -.-|Query Latency & Metrics| F004
    F011 -.-|DB Ready Probes| F001

    %% Class Styling
    classDef root fill:#1e293b,stroke:#38bdf8,stroke-width:2px,color:#f8fafc;
    classDef trunk fill:#0f172a,stroke:#818cf8,stroke-width:2px,color:#f8fafc;
    classDef domain fill:#1e1b4b,stroke:#a855f7,stroke-width:2px,color:#f8fafc;
    classDef leaf fill:#064e3b,stroke:#34d399,stroke-width:2px,color:#f8fafc;
    classDef future fill:#312e81,stroke:#f59e0b,stroke-width:2px,stroke-dasharray: 5 5,color:#f8fafc;

    class F001,F011 root;
    class F002,F003 trunk;
    class F004,F005,F006,F007,F008,F010,F012 domain;
    class F009 leaf;
    class F020,F021,F022,F023 future;
```

---

## 2. Topological Execution & Dependency Order

If this platform had to be compiled and migrated from zero on an empty PostgreSQL database, it MUST strictly execute in this topological order:

| Wave / Tier | Feature ID & Title | Prerequisite (Depends On) | Why this tier position is mandatory |
| :--- | :--- | :--- | :--- |
| **Tier 0 (Foundation)** | `F-001: Database & Migrations`<br/>`F-011: Observability & Health` | *(None)* | PostgreSQL extensions (`postgis`), Prisma base client, and request correlation IDs must exist before any domain table or logger starts. |
| **Tier 1 (Identity & Core Registry)** | `F-002: Authentication & Security`<br/>`F-004: Mosque Registry` | `F-001` | `User` and `Mosque` are the two sovereign entities that anchor all foreign keys in the platform. They can be created in parallel. |
| **Tier 2 (Access Control & Core Services)** | `F-003: Authorization & RBAC`<br/>`F-005: Nearby Discovery & Search`<br/>`F-007: Prayer Schedules & History` | `F-002` (for RBAC)<br/>`F-004` (for Nearby & Prayer) | `PermissionsGuard` requires user tokens. Nearby queries require the PostGIS spatial column. Prayer schedules require `Mosque.id`. |
| **Tier 3 (Community & Moderation)** | `F-006: Suggestions & Reports`<br/>`F-008: Attendance Tracking`<br/>`F-010: Mosque Verification`<br/>`F-012: Community Operations` | `F-003, F-004, F-006` | Verification modifies `Mosque` status and requires admin RBAC (`F-003`). Attendance requires `User` + `Mosque` composite key (`F-002, F-004`). |
| **Tier 4 (Presentation Layer)** | `F-009: Map Discovery UI` | `F-004, F-005, F-007` | Dynamic frontend Leaflet client consumes endpoints from Mosque, Nearby search, and Prayer countdown simultaneously. |
| **Tier 5 (Release 2 Trunk)** | `F-020: Staff Delegation & Governance`<br/>`F-021: Facilities Taxonomy`<br/>`F-022: Announcements`<br/>`F-023: Volunteer Roster` | `F-001..F-004`, `F-020` | Extends `Mosque` and `User` with delegated role matrices and permission-scoped administration. |

---

## 3. Brutal Honest Architecture Realities & Vulnerabilities

### Reality 1: The "Mosque Registry Gravity Well" (Single Point of Domain Contention)
`F-004 (Mosque Registry)` is the gravitational center of the entire codebase. 
- **The Risk**: **8 out of 12 features** have a hard foreign key (`mosqueId`) pointing to `Mosque.id`.
- **The Vulnerability**: If an engineer or agent carelessly changes `Mosque` columns, renames fields, or alters index strategies, it triggers migration cascade breaks across `PrayerSchedule`, `Attendance`, `Suggestions`, `Staff`, and `NearbySearch`.
- **Engineering Invariant**: The `Mosque` model schema must be treated as **additive-only**. Never drop or rename columns without a multi-phase deprecation cycle.

### Reality 2: Database Monolith Connection Contention
There is no Redis or external caching tier (by deliberate architectural design per [ADR-008](file:///_doc/mosque-platform-production-docs/ADRs/ADR-008-infrastructure-stack-and-mongoose-removal.md)).
- **The Risk**: All features share the exact same PostgreSQL connection pool.
- **The Vulnerability**: If a user runs an unindexed heavy spatial radial search (`F-005 Nearby`) during Jummah peak hours, that spatial query holds PostgreSQL worker threads, which can directly starve write transactions for `F-008 (Attendance)` or `F-007 (Prayer updates)`.
- **Mitigation**: Spatial queries MUST be strictly bounded (`radius <= 50000m`, `limit <= 100`) and use the `GiST` index on coordinates.

### Reality 3: Asymmetric Auth Coupling
- Creating a mosque (`F-004`) has a **soft dependency** on Auth: guests can create mosques (`createdById = null`), while logged-in users get author credit.
- But Verifying a mosque (`F-010`) has a **hard cryptographic dependency** on `F-003 (RBAC)`: only a valid JWT with `role: admin | moderator` can trigger the state machine.
- If Auth fails, public browsing works, but moderation completely halts.

### Reality 4: The Leaflet UI Hydration Trap
`F-009 (Map Discovery UI)` is an aggregation leaf. It depends on `F-004`, `F-005`, and `F-007`.
- **The Gotcha**: Leaflet relies on browser `window` and `navigator`. Because Next.js renders on the server by default, any direct import without `next/dynamic` (`ssr: false`) will crash the entire site.
- **The Invariant**: All map components must remain strictly client-side dynamic wrappers with fallback skeleton loaders.

---

## 4. Parallel Development Matrix (What can be built safely at the same time?)

When working with AI agents or multiple branches, use this matrix to prevent Git merge hell and Prisma schema collisions:

| Feature A | Feature B | Safe to develop in parallel? | Rationale |
| :--- | :--- | :---: | :--- |
| `F-002: Authentication` | `F-004: Mosque Registry` | ✅ **SAFE** | Completely orthogonal domain tables (`User` vs `Mosque`). |
| `F-005: Nearby Search` | `F-007: Prayer Schedules` | ✅ **SAFE** | `Nearby` reads coordinates; `Prayer` mutates waqt times. Zero table overlap. |
| `F-008: Attendance` | `F-006: Suggestions` | ✅ **SAFE** | Different junction tables (`UserMosqueAttendance` vs `MosqueSuggestion`). |
| `F-020: Staff Delegation` | `F-021: Facilities Taxonomy` | ⚠️ **CONFLICT RISK** | Both alter the `Mosque` entity or add migrations. Must coordinate migration timestamp sequence. |
| `F-009: Map UI` | Any Backend Feature | ✅ **SAFE** | Decoupled by REST API contract DTOs. |
| `F-001: DB Migrations` | Any other feature | ❌ **UNSAFE** | Base migrations must be finalized and committed before modifying schema. |

---

## 5. Traceability to Production PRD & Standards

- **PRD Foundation**: [01-PRD-PRODUCTION.md](file:///_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md)
- **System Boundaries & Modular Monolith**: [02-SYSTEM-ARCHITECTURE.md](file:///_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md)
- **Data Model & REST Contracts**: [03-DATA-API-CONTRACTS.md](file:///_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md)
- **Implementation Sequence & Phases**: [IMPLEMENTATION-SEQUENCE.md](file:///_doc/mosque-platform-production-docs/IMPLEMENTATION-SEQUENCE.md)
- **Release Staging**: [07-RELEASE-PLAN.md](file:///_doc/mosque-platform-production-docs/07-RELEASE-PLAN.md)
- **Specs & Proof Directory**: [specs/README.md](file:///_doc/mosque-platform-production-docs/specs/README.md)
