# System Architecture — Mosque Information & Community Platform

## 1. System context

```text
Browser
  |
  v
Next.js Web Application
  |
  | HTTPS / REST API
  v
NestJS Backend
  |
  +----------------------+-----------------------+
  |                      |                       |
  v                      v                       v
PostgreSQL + PostGIS   Optional Infra        Object Storage
(source of truth)      only if required      only if required
```

OpenStreetMap-compatible tiles provide map context to the web client. Platform mosque
markers come from NestJS/PostgreSQL, not from an OSM mosque synchronization pipeline.

---

## 2. Architectural principles

- Modular monolith by default.
- One authoritative NestJS backend.
- PostgreSQL/PostGIS is the durable source of truth.
- Keep business invariants server-side.
- Keep controllers thin.
- Keep domain logic separate from transport/infrastructure when complexity justifies.
- Prefer existing architecture over parallel frameworks.
- Do not introduce microservices, event sourcing, CQRS, queues, caches, or Redis unless
  a concrete problem requires them.
- External integrations must not be inside database transactions.
- All potentially growing operations are bounded.

---

## 3. Frontend boundary

Next.js owns:

- rendering
- routing
- map UI
- forms
- interaction states
- client-side cache
- accessibility/responsiveness

Next.js does **not** own:

- authorization decisions
- canonical validation
- uniqueness/invariants
- verification state authority
- audit authority

Client-side validation improves UX but does not replace backend validation.

---

## 4. Backend boundary

NestJS owns:

- authentication
- authorization
- business use cases
- validation at API boundaries
- persistence orchestration
- transactions
- audit creation
- moderation
- safe exposure/serialization
- operational health/readiness

Recommended feature modules:

```text
auth/
users/
mosques/
mosque-verification/
prayer-schedules/
attendance/
suggestions/
reports/
search/
admin/
audit/
common/
```

Later releases may add:

```text
mosque-roles/
committees/
facilities/
announcements/
donations/
notifications/
uploads/
```

---

## 5. Persistence architecture

Primary store:

- PostgreSQL
- PostGIS
- Prisma for typed application persistence
- parameterized SQL where PostGIS/query requirements cannot be reasonably expressed
  through the ORM

The application should use one application-scoped Prisma/database client and bounded
connection pooling.

No per-request Prisma clients.

---

## 6. Geospatial architecture

Canonical mosque position is a PostGIS point.

Recommended database representation:

```text
geography(Point, 4326)
```

API boundary may expose:

```json
{
  "latitude": 23.810123,
  "longitude": 90.412345
}
```

Use spatial indexes appropriate to the chosen column type.

Use database-side distance/radius operations for:

- nearby mosques
- duplicate candidate detection
- map viewport searches

Do not load all mosques into Node.js merely to filter by distance.

---

## 7. Transactions

Use transactions only for atomic business invariants.

Examples that may require transactions:

- mosque creation + required audit metadata
- prayer schedule update + history row
- verification transition + audit row
- duplicate merge + relationship reassignment
- privileged state transitions involving multiple rows

Do not perform:

- HTTP calls
- map provider calls
- email
- push delivery
- file upload
- queue waits
- arbitrary sleeps

inside a database transaction.

---

## 8. Concurrency

Explicitly design for:

- two users creating the same mosque concurrently
- repeated client submission/retry
- simultaneous prayer schedule updates
- duplicate moderation actions
- attendance state races
- admin merge operations

Use the simplest correct mechanism for each invariant:

- unique constraints
- conditional updates
- optimistic version checks
- row locks/advisory locks where justified
- transactions

Do not assume `read -> check -> write` is atomic.

---

## 9. Idempotency

Define idempotency for retryable mutations.

Candidates:

- mosque creation
- admin verification
- prayer schedule mutation
- duplicate merge
- notification/background job creation if later introduced

Do not use idempotency infrastructure globally unless the operation requires it.

---

## 10. Optional infrastructure

### Redis

Introduce only for a concrete need such as:

- distributed rate limiting
- demonstrated cache requirement
- distributed coordination

If introduced, define:

- key ownership
- TTL
- invalidation
- outage behavior
- data sensitivity

### BullMQ

Introduce only for durable asynchronous work such as:

- notification delivery
- media processing
- long-running moderation/enrichment tasks

If introduced, define:

- job idempotency
- retry policy
- timeout
- max attempts
- failure/dead-letter behavior
- observability
- shutdown/drain behavior

### Socket.io

Introduce only when true realtime updates are a product requirement. Polling or query
invalidation may be sufficient for many screens.

---

## 11. Map provider failure

Map tile failure should degrade map visualization, not corrupt canonical mosque data.

Where practical:

- direct mosque profile URLs remain available
- text search remains available
- stored prayer/community information remains available

---

## 12. Object storage

Do not add object storage until photos/evidence uploads are implemented.

When added:

- signed/controlled upload path
- size limits
- MIME/content validation
- randomized object keys
- authorization
- cleanup of orphaned uploads
- failure consistency between DB and object storage

---

## 13. Deployment architecture

Initial production can remain a modular monolith:

```text
Next.js deployment
NestJS deployment
PostgreSQL/PostGIS
```

Scale vertically/horizontally based on measured requirements.

Do not split services solely because individual NestJS modules exist.

---

## 14. Architecture decisions requiring explicit review

Before implementation finalize:

- auth/session strategy
- production map/tile provider
- PostGIS migration approach with Prisma
- ID type
- multi-region requirement, if any
- hosting/runtime
- backup provider
- whether Release 1 needs any distributed rate-limit store

Record high-impact decisions as ADRs.
