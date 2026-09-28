# ADR-008: Infrastructure Retentions (Redis, BullMQ, Cloudinary, Firebase Admin) and Complete Removal of Mongoose

## Status
**Accepted**

## Date
2026-09-28

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
During the initial project scaffolding and migration from earlier template code, multiple data persistence and infrastructure technologies coexisted:
1. **Mongoose / MongoDB remnants**: Legacy schemas and pipes designed for MongoDB ObjectIds and Mongoose document models.
2. **Infrastructure dependencies**: Redis (used for sliding-window rate limiting and BullMQ connection), BullMQ (async job processing for email and notification delivery), Cloudinary (cloud media upload strategy), and Firebase Admin (authentication / push delivery).
3. **Database source of truth**: PostgreSQL with PostGIS extension for typed persistence and geospatial spatial queries.

The presence of Mongoose created confusion regarding the platform's durable source of truth, bloated dependencies, and introduced conflicting types (e.g. `Types.ObjectId` vs CUID/UUID strings). Conversely, Redis, BullMQ, Cloudinary, and Firebase Admin serve essential, active production roles for rate limiting, asynchronous worker queues, media uploads, and authentication integrations.

## Decision
1. **Remove Mongoose Completely**:
   - Uninstall `@nestjs/mongoose` and `mongoose`.
   - Remove all legacy Mongoose schema definitions, filters, and ObjectId parsing pipes.
   - Standardize all models, relations, and entity management exclusively on PostgreSQL via Prisma.
2. **Retain and Standardize Supporting Infrastructure**:
   - **Redis (`ioredis` / `@app/redis`)**: Retained for distributed sliding-window rate limiting and BullMQ backing. The rate limit guard is enhanced to fail open gracefully if Redis is momentarily unavailable without polluting logs with stream errors.
   - **BullMQ (`@nestjs/bullmq`)**: Retained for asynchronous job execution (such as transactional email/OTP delivery via `EmailProcessor` and background tasks).
   - **Cloudinary (`cloudinary`)**: Retained as the default cloud media upload strategy within the attachments module.
   - **Firebase Admin (`firebase-admin`)**: Retained for push notification dispatch and mobile client authentication federation.
3. **Native PostGIS Spatial Operations**:
   - Standardize geospatial proximity checks (`ST_DWithin`) and distance calculations (`ST_Distance`) on PostGIS WGS84 spherical geography (`geography(Point, 4326)`).
   - Initialize PostGIS via `CREATE EXTENSION IF NOT EXISTS postgis;` in the baseline database migration.

## Consequences

### Positive
- **Single Source of Truth**: Eliminates dual-database confusion; PostgreSQL/PostGIS is the sole authoritative persistence layer.
- **Dependency Reduction**: Removes unnecessary MongoDB driver runtime memory overhead and version conflicts.
- **Asynchronous Resilience**: Retaining BullMQ and Redis decouples user-facing HTTP request-response cycles from slower third-party I/O (email sending, image processing).
- **Graceful Fault Tolerance**: Rate limiting fails open when Redis is in transient disconnect states, preventing cascading application outages.

### Tradeoffs & Mitigations
- **Operational Footprint**: Retaining Redis and BullMQ requires running a Redis instance in production environments alongside PostgreSQL.
- *Mitigation*: Docker Compose config provides local Redis on port 6379, and standard hosted Redis (Upstash, AWS ElastiCache, or Redis Cloud) is cost-effective and low-maintenance.
