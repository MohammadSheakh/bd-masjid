# ADR-018: Production Deployment and Zero-Downtime Rollback Strategy

## Status
Accepted

## Date
2026-09-30

## Context
Deploying updates to a single-tenant mosque community platform requires a predictable, low-risk process. The platform consists of:
- NestJS REST / WebSocket Backend (`bd-masjid-backend`)
- Next.js Frontend with dynamic Leaflet maps (`bd-masjid-frontend`)
- In-memory Redis cache & rate-limiter (`bd-masjid-redis`)
- PostgreSQL with PostGIS database

Key operational risks during deployment include:
1. **Broken deployments**: New containers failing health checks or throwing runtime crashes, leaving community users without prayer schedules or map discovery.
2. **Schema breaking changes**: Destructive database migrations that prevent older application containers from running during a rollback.
3. **Manual human error**: Ad-hoc deployment commands run in SSH terminals without pre-flight validation.

## Decision
1. **Target Topology**: Deploy via `docker-compose.yml` on a dedicated Linux VPS (Ubuntu/Debian) fronted by a reverse proxy (Caddy / Nginx) handling SSL termination via automated Let's Encrypt certificates.
2. **Backward-Compatible Migrations (Expand-and-Contract)**:
   - All Prisma migrations must be purely additive (new tables, new nullable columns, or columns with safe defaults).
   - Column renames or drops must occur across two separate release cycles (Release N: add new column & dual write; Release N+1: drop deprecated column).
   - This ensures that rolling back an application container to the previous git SHA never fails due to database schema incompatibility.
3. **Automated Deployment Suite (`scripts/deploy.sh`)**:
   - Creates a pre-deployment database backup using `scripts/backup-db.sh`.
   - Records current running image tags / git SHAs.
   - Runs `docker compose build --pull` and executes `prisma migrate deploy`.
   - Deploys new containers with rolling restarts.
   - Executes pre-flight HTTP health checks against `/api/v1/health` and the frontend.
   - If health checks fail within 45 seconds, triggers `scripts/rollback.sh` automatically.
4. **Automated Rollback Suite (`scripts/rollback.sh`)**:
   - Restores previous container image tags.
   - Verifies container recovery via health probes.
   - Emits structured operational incident alerts.

## Consequences

### Positive
- Fully reproducible zero-downtime deployments.
- Automatic rollback safety net prevents user-facing outages on faulty builds.
- Preserves database integrity without dangerous down-migration data loss.
- Satisfies launch checklist gates for deployment and rollback strategies.

### Negative / Trade-offs
- Developers must maintain strict discipline around non-breaking schema expansions.
