# Mosque Facilities & Accessibility Taxonomy

## Purpose
Manages canonical physical infrastructure, Musalli capacity, ablution provisions, accessibility accommodations, and climate controls for mosques. Enforces strict single-tenant spatial indexing, tiered mutation governance, and transactional audit tracking.

## Component Architecture

```mermaid
flowchart TD
    Client["HTTP Client / Browser<br/>(Next.js App)"]

    subgraph Security ["Security & Traffic Ingress"]
        Guard["AuthGuard & SlidingWindowRateLimitGuard<br/>(@app/common)"]
        Interceptor["TransformResponseInterceptor<br/>(@app/common)"]
    end

    subgraph FacilitiesModule ["Facilities Module"]
        Controller["FacilitiesController<br/>(/api/v1/mosques/:id/facilities)"]
        Service["FacilitiesService<br/>(Upsert & Query Logic)"]
    end

    subgraph Governance ["Governance & Cross-Module Dependencies"]
        StaffCheck["MosqueStaff Delegation Check<br/>(MOSQUE_ADMIN, Mutawalli)"]
        AuditLogWriter["AuditService / AuditLog<br/>(State Diffs)"]
    end

    subgraph Storage ["PostgreSQL / PostGIS Durable Store"]
        MosqueFacilityTbl[("MosqueFacility Table<br/>(1:1 Mosque Relation)")]
        MosqueTbl[("Mosque Table<br/>(Legacy Summary Flags)")]
        AuditTbl[("AuditLog Table<br/>(Immutable Record)")]
    end

    Client --> Guard
    Guard --> Interceptor
    Interceptor --> Controller
    Controller --> Service
    Service --> StaffCheck
    Service --> AuditLogWriter
    Service --> MosqueFacilityTbl
    Service --> MosqueTbl
    Service --> AuditTbl
```

## Business Invariants & Rules

1. **Strict 1:1 Cardinality**: Every `Mosque` entity can have at most one associated `MosqueFacility` record. Deleting a mosque cascades to delete its facility record (`onDelete: Cascade`).
2. **Tiered Mutation Governance**: Only verified `MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`, `COMMITTEE_MEMBER`, `MUTAWALLI` of that specific mosque, or global platform `admin`/`moderator` accounts can modify facility data. General Musallis submit amendments via the crowdsourced suggestion pipeline (`F-006`).
3. **Atomic Audit Logging**: Every create or update operation must record an immutable `AuditLog` row capturing actor, previous state, and updated state inside an atomic PostgreSQL `$transaction`.
4. **Visible Unknowns Policy**: Unreported integer and boolean attributes remain `null` rather than artificially defaulted to `false` or `0`.
5. **Backwards Compatibility**: Updating `MosqueFacility` automatically updates the legacy summary booleans on `Mosque` (`hasAirConditioning`, `hasSeparateWomenSpace`, `hasWheelchairAccess`, `capacity`) within the same transaction.

## Database Ownership

| Model / Table | Access Mode | Description |
| :--- | :--- | :--- |
| `MosqueFacility` | **Owner (Read/Write)** | Primary canonical facilities, capacity, accessibility, and climate record |
| `Mosque` | Read / Update | Read mosque existence; sync legacy boolean summary flags |
| `MosqueStaff` | Read | Verify local administrative permissions (`MOSQUE_ADMIN`, committee) |
| `AuditLog` | Append-Only | Record full state transition diffs on upsert |

## Request Sequence: Facility Upsert

```mermaid
sequenceDiagram
    autonumber
    actor Staff as Verified Mosque Admin
    participant Ctrl as FacilitiesController
    participant Svc as FacilitiesService
    participant DB as PostgreSQL ($transaction)

    Staff->>Ctrl: PUT /api/v1/mosques/:id/facilities (Bearer Token + DTO)
    Ctrl->>Svc: upsertFacilities(mosqueId, dto, actor)
    Svc->>DB: Check Mosque existence & active status
    Svc->>DB: Query MosqueStaff for actor verified role
    alt Unauthorized actor
        Svc-->>Ctrl: 403 Forbidden
        Ctrl-->>Staff: Error: Only verified admins can update facilities
    else Authorized actor
        Svc->>DB: BEGIN TRANSACTION
        Svc->>DB: Fetch existing MosqueFacility (for diff)
        Svc->>DB: Upsert MosqueFacility record
        Svc->>DB: Insert AuditLog entry (previous vs new state)
        Svc->>DB: Update legacy flags on Mosque table
        Svc->>DB: COMMIT TRANSACTION
        Svc-->>Ctrl: Updated MosqueFacility
        Ctrl-->>Staff: 200 OK (Clean Response Envelope)
    end
```
