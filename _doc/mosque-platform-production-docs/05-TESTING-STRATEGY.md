# Testing Strategy

## 1. Stack

Recommended backend stack:

- Jest — test runner/assertions
- `@nestjs/testing` — Nest testing container
- Supertest — HTTP E2E
- real disposable PostgreSQL + PostGIS — database integration
- Playwright — browser-critical flows

Mocks are useful for isolated application behavior but must not replace real database
tests where correctness depends on PostgreSQL/PostGIS constraints, transactions, SQL,
or concurrency.

---

## 2. Test layers

### Layer 1 — Pure unit

Location:

```text
src/**/*.spec.ts
```

Test:

- domain calculations
- state transition rules
- freshness calculation
- duplicate decision helpers
- normalization
- policy logic

No Nest/DB/HTTP unless required.

### Layer 2 — Nest/component integration

Location:

```text
test/integration/
```

Test:

- service orchestration
- guards
- authorization boundaries
- module wiring
- application behavior with controlled dependencies

### Layer 3 — Database integration

Location:

```text
test/database/
```

Use real disposable PostgreSQL + PostGIS.

Test:

- spatial queries
- unique/FK/check constraints
- transaction rollback
- raw SQL
- migrations
- concurrent writes
- idempotency
- database defaults
- BigInt/type behavior

### Layer 4 — HTTP E2E

Location:

```text
test/e2e/
```

Boot Nest application and use Supertest.

Test full path:

```text
HTTP
-> validation
-> guards
-> controller
-> service
-> persistence
-> serialization
-> response
```

### Layer 5 — Browser

Location:

```text
test/browser/
```

Playwright tests only the highest-value browser journeys.

---

## 3. Required risk coverage

### Authentication

- valid login
- invalid credentials
- rate-limit behavior
- logout/session behavior
- expired/revoked session behavior
- secure authorization after password/session changes

### Authorization

- guest denied privileged mutation
- user cannot modify another user's scoped resources
- unverified actor cannot perform verified-role operation
- admin-only route protection

### Mosque creation

- valid mosque
- invalid coordinates
- missing name
- duplicate candidate nearby
- concurrent duplicate create attempts
- retry/idempotency behavior
- audit/provenance behavior

### PostGIS

- same-location distance
- within 50 m
- exactly/near boundary
- outside radius
- ordering by distance
- large radius rejected
- spatial index/query plan reviewed separately

### Prayer schedule

- authorized update
- unauthorized update
- invalid schedule
- history created
- transaction rollback
- concurrent edits
- freshness timestamp

### Attendance

- unique user+mosque
- repeated PUT is idempotent
- status change does not duplicate count
- concurrent update behavior

### Suggestions/reports

- anonymous limits
- oversized input rejected
- moderation transitions
- XSS-safe rendering path
- untrusted suggestion cannot directly mutate canonical mosque

### Verification

- valid transition
- invalid transition
- repeated verification behavior
- concurrent moderators
- audit record

---

## 4. Migration testing

CI or dedicated database test flow should prove:

- migrations apply to a clean disposable database
- current application starts against migrated schema
- required PostGIS extension exists
- required constraints/indexes exist
- destructive migrations require explicit review
- forward migration path is reproducible

For complex migrations, test representative existing data.

---

## 5. Failure testing

Test meaningful failures:

- database temporarily unavailable
- transaction conflict/deadlock where relevant
- external provider timeout
- map provider unavailable in browser
- upload failure if uploads exist
- queue/provider failure if async systems exist
- shutdown during bounded work where relevant

Do not require unrealistic chaos engineering before initial launch, but known failure
boundaries should be executable/testable.

---

## 6. Load/performance tests

Before production, establish representative tests for:

- nearby mosque query
- map viewport query
- mosque profile read
- search
- login/auth endpoints
- mosque creation burst
- concurrent duplicate create
- prayer update
- admin queues/lists

Measure:

- p50/p95/p99 latency
- throughput
- DB connections
- CPU/memory
- error rate

Use realistic data size, not only empty/small development DB.

---

## 7. Security-focused tests

Include:

- mass assignment attempts
- unexpected DTO fields
- SQL injection strings
- authorization bypass attempts
- CSRF behavior if cookie-authenticated mutations
- XSS payload handling
- brute-force/rate-limit behavior
- file upload malicious cases when upload exists

---

## 8. CI gates

Recommended CI:

1. install with lockfile
2. typecheck
3. lint
4. unit tests
5. integration tests
6. database tests
7. build
8. migration/schema validation
9. selected E2E
10. selected browser smoke test where practical

Not every expensive browser/load test must run on every commit; define appropriate
pipeline tiers.

---

## 9. Flake policy

A flaky test is a defect.

Do not hide instability with blind retries.

Identify:

- shared state
- clock dependence
- ordering
- race
- unawaited work
- external dependency

Test retries may exist for known infrastructure behavior only when documented.

---

## 10. Definition of tested

A feature is not considered adequately tested because its service file has a spec.

Testing must cover the risks introduced by that feature:

- invariants
- auth
- concurrency
- persistence
- failure
- serialization
- boundaries
