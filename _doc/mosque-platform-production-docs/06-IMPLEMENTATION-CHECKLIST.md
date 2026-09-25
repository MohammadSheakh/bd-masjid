# Production-Grade Implementation Checklist

This checklist assumes a limited initial release but production-grade implementation.

## A. Foundation

- [ ] Monorepo/repository structure finalized
- [ ] Next.js app builds in production mode
- [ ] NestJS app builds in production mode
- [ ] environment configuration validated at startup
- [ ] development/test/staging/production separated
- [ ] PostgreSQL provisioned
- [ ] PostGIS enabled through controlled setup/migration
- [ ] Prisma/application database client configured
- [ ] application-scoped DB client/pool only
- [ ] graceful shutdown implemented
- [ ] `/api/v1` prefix
- [ ] global validation
- [ ] consistent error response
- [ ] structured logging + request ID
- [ ] `/health/live`
- [ ] `/health/ready`
- [ ] OpenAPI/Swagger for API development

## B. Database and migrations

- [ ] migration workflow established
- [ ] migrations replay on disposable PostgreSQL/PostGIS
- [ ] no `db push` production repair workflow
- [ ] Mosque schema
- [ ] User schema
- [ ] PrayerSchedule schema
- [ ] PrayerScheduleHistory schema
- [ ] UserMosqueAttendance schema
- [ ] Suggestion/report schema
- [ ] Verification schema
- [ ] AuditLog schema
- [ ] FK/delete semantics reviewed
- [ ] unique constraints reviewed
- [ ] indexes based on actual queries
- [ ] spatial index verified
- [ ] backup policy defined
- [ ] restore procedure tested before launch

## C. Authentication

- [ ] registration if required
- [ ] login
- [ ] password hashing
- [ ] session/token expiry
- [ ] logout semantics
- [ ] revocation strategy
- [ ] secure cookies if used
- [ ] CSRF strategy if needed
- [ ] auth rate limiting
- [ ] credential logging prohibited
- [ ] authentication tests

## D. Authorization

- [ ] guest/user/admin policy
- [ ] server-side authorization
- [ ] actor identity derived from trusted auth context
- [ ] no privileged role/state accepted directly from client
- [ ] default-deny privileged operations
- [ ] authorization matrix tests

## E. Map

- [ ] MapLibre or Leaflet selected
- [ ] production tile/provider policy reviewed
- [ ] attribution correct
- [ ] OSM used as base map only
- [ ] browser geolocation optional
- [ ] denial/error state
- [ ] viewport requests bounded
- [ ] markers come from platform API
- [ ] map unavailable/degraded UI

## F. Mosque creation vertical slice

- [ ] Add Mosque UI
- [ ] movable pin
- [ ] name required
- [ ] coordinate validation
- [ ] optional address
- [ ] create API
- [ ] server derives actor
- [ ] PostGIS duplicate proximity query
- [ ] nearby duplicate warning
- [ ] repeated request behavior defined
- [ ] concurrent duplicate creation tested
- [ ] new mosque defaults unverified
- [ ] audit/provenance
- [ ] created mosque marker visible
- [ ] created mosque profile accessible
- [ ] HTTP E2E
- [ ] browser E2E

## G. Nearby/search

- [ ] nearby endpoint
- [ ] radius capped
- [ ] result limit capped
- [ ] stable ordering
- [ ] distance included
- [ ] PostGIS query
- [ ] no Node full-table distance filtering
- [ ] search endpoint
- [ ] pagination
- [ ] index/query-plan review
- [ ] representative load test

## H. Mosque profile

- [ ] public profile endpoint
- [ ] explicit response projection
- [ ] verification status
- [ ] operational status
- [ ] location
- [ ] current prayer schedule
- [ ] last update/freshness
- [ ] attendance aggregates where allowed
- [ ] unknown data displayed as unknown
- [ ] direct URL works without map dependency

## I. Prayer schedules

- [ ] prayer start and Jamaat stored separately
- [ ] timezone semantics documented
- [ ] read endpoint
- [ ] authorized mutation endpoint
- [ ] current + history atomic update
- [ ] updatedBy/updatedAt
- [ ] concurrency strategy
- [ ] invalid transition/data rejection
- [ ] freshness derived
- [ ] rollback test
- [ ] concurrency test
- [ ] authorization test

## J. Attendance

- [ ] unique `(userId, mosqueId)`
- [ ] PUT/idempotent update
- [ ] remove/reset behavior
- [ ] aggregates correct
- [ ] repeated retries do not inflate
- [ ] privacy exposure reviewed
- [ ] concurrent tests

## K. Suggestions/reports

- [ ] suggestion endpoint
- [ ] incorrect-information report endpoint
- [ ] anonymous policy decided
- [ ] CAPTCHA if anonymous and justified
- [ ] rate limit
- [ ] payload length limits
- [ ] moderation states
- [ ] canonical data not directly overwritten
- [ ] XSS-safe rendering
- [ ] admin moderation
- [ ] audit resolution

## L. Verification/admin

- [ ] pending verification list
- [ ] verify
- [ ] reject
- [ ] authorization
- [ ] transition validation
- [ ] idempotent/repeated action behavior
- [ ] concurrent moderator behavior
- [ ] reason/evidence policy
- [ ] audit
- [ ] bounded admin queries
- [ ] admin UI

## M. Security

- [ ] CORS allowlist
- [ ] security headers
- [ ] secure cookies
- [ ] CSRF evaluated
- [ ] SQL injection protections
- [ ] XSS protections
- [ ] mass assignment prevented
- [ ] request body size limits
- [ ] auth brute-force controls
- [ ] anonymous abuse controls
- [ ] secret management
- [ ] dependency scanning/update process
- [ ] least-privilege DB user where practical
- [ ] admin surface reviewed

## N. Observability

- [ ] structured logs
- [ ] request/correlation ID
- [ ] API latency metrics
- [ ] 4xx/5xx metrics
- [ ] auth failure metrics
- [ ] rate-limit metrics
- [ ] DB pool/connection metrics
- [ ] query latency visibility
- [ ] PostGIS query latency
- [ ] alert thresholds
- [ ] sensitive-data logging review

## O. Reliability/failure handling

- [ ] external I/O timeouts
- [ ] bounded retries only where safe
- [ ] no external calls inside DB transactions
- [ ] degraded behavior for optional dependencies
- [ ] no infinite retries
- [ ] partial-failure behavior documented
- [ ] idempotency defined for retryable mutations
- [ ] shutdown behavior tested
- [ ] DB unavailable behavior understood
- [ ] DB pool saturation behavior tested

## P. Testing

- [ ] Jest
- [ ] `@nestjs/testing`
- [ ] Supertest
- [ ] real disposable PostgreSQL/PostGIS
- [ ] Playwright
- [ ] unit
- [ ] integration
- [ ] database
- [ ] HTTP E2E
- [ ] browser E2E
- [ ] migration tests
- [ ] authorization tests
- [ ] concurrency tests
- [ ] rollback tests
- [ ] idempotency tests
- [ ] failure tests
- [ ] load/performance baseline

## Q. CI/CD

- [ ] deterministic install using lockfile
- [ ] typecheck
- [ ] lint
- [ ] unit tests
- [ ] integration tests
- [ ] database tests
- [ ] build
- [ ] migration validation
- [ ] selected E2E
- [ ] deploy strategy
- [ ] smoke test
- [ ] rollback strategy
- [ ] old/new app schema compatibility considered

## R. Backup/recovery

- [ ] automated backups
- [ ] retention defined
- [ ] restore procedure
- [ ] restore exercise completed
- [ ] RPO defined
- [ ] RTO defined
- [ ] production incident runbook

## S. Launch gate

Before first production release:

- [ ] no placeholder routes/pages presented as production
- [ ] no hardcoded secrets/environment URLs
- [ ] no fake/mock production behavior
- [ ] no unbounded growing API
- [ ] no known unauthorized mutation path
- [ ] migrations reviewed
- [ ] backup restore tested
- [ ] failure paths tested
- [ ] operational logs/metrics exist
- [ ] health/readiness configured
- [ ] rollback documented
- [ ] production smoke test passes

## T. Definition of Done for every feature

- [ ] business invariant identified
- [ ] authorization identified
- [ ] validation complete
- [ ] transaction boundary defined
- [ ] concurrency considered
- [ ] retry/idempotency considered
- [ ] failure behavior defined
- [ ] logs/metrics considered
- [ ] migration/data compatibility considered
- [ ] tests cover risk
- [ ] relevant checks pass
- [ ] documentation updated
