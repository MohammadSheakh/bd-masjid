# Production-Grade Implementation Checklist

This checklist reflects the implementation progress against production requirements.

## A. Foundation

- [x] Monorepo/repository structure finalized
- [x] Next.js app builds in production mode
- [x] NestJS app builds in production mode
- [x] environment configuration validated at startup
- [x] development/test/staging/production separated
- [x] PostgreSQL provisioned
- [x] PostGIS enabled through controlled setup/migration
- [x] Prisma/application database client configured
- [x] application-scoped DB client/pool only
- [x] graceful shutdown implemented
- [x] `/api/v1` prefix
- [x] global validation
- [x] consistent error response
- [x] structured logging + request ID
- [x] `/health/live`
- [x] `/health/ready`
- [x] OpenAPI/Swagger for API development

## B. Database and migrations

- [x] migration workflow established
- [x] migrations replay on disposable PostgreSQL/PostGIS
- [x] no `db push` production repair workflow
- [x] Mosque schema
- [x] User schema
- [x] PrayerSchedule schema
- [x] PrayerScheduleHistory schema
- [x] UserMosqueAttendance schema
- [x] Suggestion/report schema
- [x] Verification schema
- [x] AuditLog schema
- [x] FK/delete semantics reviewed
- [x] unique constraints reviewed
- [x] indexes based on actual queries
- [x] spatial index verified
- [x] backup policy defined
- [x] restore procedure tested before launch

## C. Authentication

- [x] registration if required
- [x] login
- [x] password hashing
- [x] session/token expiry
- [x] logout semantics
- [x] revocation strategy
- [x] secure cookies if used
- [x] CSRF strategy if needed
- [x] auth rate limiting
- [x] credential logging prohibited
- [x] authentication tests

## D. Authorization

- [x] guest/user/admin policy
- [x] server-side authorization
- [x] actor identity derived from trusted auth context
- [x] no privileged role/state accepted directly from client
- [x] default-deny privileged operations
- [x] authorization matrix tests

## E. Map

- [x] MapLibre or Leaflet selected
- [x] production tile/provider policy reviewed
- [x] attribution correct
- [x] OSM used as base map only
- [x] browser geolocation optional
- [x] denial/error state
- [x] viewport requests bounded
- [x] markers come from platform API
- [x] map unavailable/degraded UI

## F. Mosque creation vertical slice

- [x] Add Mosque UI
- [x] movable pin
- [x] name required
- [x] coordinate validation
- [x] optional address
- [x] create API
- [x] server derives actor
- [x] PostGIS duplicate proximity query
- [x] nearby duplicate warning
- [x] repeated request behavior defined
- [x] concurrent duplicate creation tested
- [x] new mosque defaults unverified
- [x] audit/provenance
- [x] created mosque marker visible
- [x] created mosque profile accessible
- [x] HTTP E2E
- [x] browser E2E

## G. Nearby/search

- [x] nearby endpoint
- [x] radius capped
- [x] result limit capped
- [x] stable ordering
- [x] distance included
- [x] PostGIS query
- [x] no Node full-table distance filtering
- [x] search endpoint
- [x] pagination
- [x] index/query-plan review
- [x] representative load test

## H. Mosque profile

- [x] public profile endpoint
- [x] explicit response projection
- [x] verification status
- [x] operational status
- [x] location
- [x] current prayer schedule
- [x] last update/freshness
- [x] attendance aggregates where allowed
- [x] unknown data displayed as unknown
- [x] direct URL works without map dependency

## I. Prayer schedules

- [x] prayer start and Jamaat stored separately
- [x] timezone semantics documented
- [x] read endpoint
- [x] authorized mutation endpoint
- [x] current + history atomic update
- [x] updatedBy/updatedAt
- [x] concurrency strategy
- [x] invalid transition/data rejection
- [x] freshness derived
- [x] rollback test
- [x] concurrency test
- [x] authorization test

## J. Attendance

- [x] unique `(userId, mosqueId)`
- [x] PUT/idempotent update
- [x] remove/reset behavior
- [x] aggregates correct
- [x] repeated retries do not inflate
- [x] privacy exposure reviewed
- [x] concurrent tests

## K. Suggestions/reports

- [x] suggestion endpoint
- [x] incorrect-information report endpoint
- [x] anonymous policy decided
- [ ] CAPTCHA if anonymous and justified
- [x] rate limit
- [x] payload length limits
- [x] moderation states
- [x] canonical data not directly overwritten
- [x] XSS-safe rendering
- [x] admin moderation
- [x] audit resolution

## L. Verification/admin

- [x] pending verification list
- [x] verify
- [x] reject
- [x] authorization
- [x] transition validation
- [x] idempotent/repeated action behavior
- [x] concurrent moderator behavior
- [x] reason/evidence policy
- [x] audit
- [x] bounded admin queries
- [x] admin UI

## M. Security

- [x] CORS allowlist
- [x] security headers
- [x] secure cookies
- [x] CSRF evaluated
- [x] SQL injection protections
- [x] XSS protections
- [x] mass assignment prevented
- [x] request body size limits
- [x] auth brute-force controls
- [x] anonymous abuse controls
- [x] secret management
- [ ] dependency scanning/update process
- [x] least-privilege DB user where practical
- [x] admin surface reviewed

## N. Observability

- [x] structured logs
- [x] request/correlation ID
- [x] API latency metrics
- [x] 4xx/5xx metrics
- [x] auth failure metrics
- [x] rate-limit metrics
- [x] DB pool/connection metrics
- [x] query latency visibility
- [x] PostGIS query latency
- [ ] alert thresholds
- [x] sensitive-data logging review

## O. Reliability/failure handling

- [x] external I/O timeouts
- [x] bounded retries only where safe
- [x] no external calls inside DB transactions
- [x] degraded behavior for optional dependencies
- [x] no infinite retries
- [x] partial-failure behavior documented
- [x] idempotency defined for retryable mutations
- [x] shutdown behavior tested
- [x] DB unavailable behavior understood
- [x] DB pool saturation behavior tested

## P. Testing

- [x] Jest
- [x] `@nestjs/testing`
- [x] Supertest
- [x] real disposable PostgreSQL/PostGIS
- [x] Playwright
- [x] unit
- [x] integration
- [x] database
- [x] HTTP E2E
- [x] browser E2E
- [x] migration tests
- [x] authorization tests
- [x] concurrency tests
- [x] rollback tests
- [x] idempotency tests
- [x] failure tests
- [x] load/performance baseline

## Q. CI/CD

- [x] deterministic install using lockfile
- [x] typecheck
- [x] lint
- [x] unit tests
- [x] integration tests
- [x] database tests
- [x] build
- [x] migration validation
- [x] selected E2E
- [x] deploy strategy
- [x] smoke test
- [x] rollback strategy
- [x] old/new app schema compatibility considered

## R. Backup/recovery

- [x] automated backups
- [x] retention defined
- [x] restore procedure
- [x] restore exercise completed
- [x] RPO defined
- [x] RTO defined
- [x] production incident runbook

## S. Launch gate

Before first production release:

- [x] no placeholder routes/pages presented as production
- [x] no hardcoded secrets/environment URLs
- [x] no fake/mock production behavior
- [x] no unbounded growing API
- [x] no known unauthorized mutation path
- [x] migrations reviewed
- [x] backup restore tested
- [x] failure paths tested
- [x] operational logs/metrics exist
- [x] health/readiness configured
- [x] rollback documented
- [x] production smoke test passes

## T. Definition of Done for every feature

- [x] business invariant identified
- [x] authorization identified
- [x] validation complete
- [x] transaction boundary defined
- [x] concurrency considered
- [x] retry/idempotency considered
- [x] failure behavior defined
- [x] logs/metrics considered
- [x] migration/data compatibility considered
- [x] tests cover risk
- [x] relevant checks pass
- [x] documentation updated

## U. Mobile Interactive Full-Page Map & Database Synchronization

- [x] smart API base URL resolution for mobile web browser runtime
- [x] 404 response offline false alarm prevention
- [x] database mosque discovery on initial mount (`loadInitialMosques`)
- [x] full-screen interactive Leaflet 1.9.4 map component
- [x] smooth multi-directional pan and zoom controls (`+`/`-`)
- [x] custom mosque pins matching web app styles (`.custom-mosque-pin`)
- [x] floating search bar and locate GPS overlay in full-page map mode
- [x] mosque details bottom sheet parity with web app upon pin click

## V. Mobile Popup Design Parity with Web Platform

- [x] Mosque Details Popup (`MosqueDetailSheet.tsx`) visual & functional parity
- [x] Add Mosque Popup (`AddMosqueSheet.tsx`) reverse geocoding & duplicate check parity
- [x] Claim Role Popup (`RoleClaimModal.tsx`) exact form fields & photo upload parity
- [x] Donate Popup (`SuggestDonationMethodModal.tsx`) payment channels & copy action parity
- [x] Suggest Facilities Popup (`SuggestFacilitiesModal.tsx`) amenities selector parity



