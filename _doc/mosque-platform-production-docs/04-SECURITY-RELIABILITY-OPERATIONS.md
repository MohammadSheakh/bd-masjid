# Security, Reliability and Operations

## 1. Security baseline

Security is part of implementation.

Required considerations:

- authentication
- authorization
- ownership/scope checks
- input validation
- output exposure
- secret management
- SQL injection
- XSS
- CSRF
- SSRF when external URLs are introduced
- rate limiting
- secure cookies
- dependency risk
- sensitive logging
- upload safety
- admin surface protection

Default-deny privileged operations.

---

## 2. Authentication

The exact token/session mechanism is an architecture decision, but production behavior
must include:

- secure password hashing
- credential brute-force resistance
- logout semantics
- session/token expiry
- session revocation strategy where required
- password-change session behavior
- secure transport
- cookie security when cookies are used
- no credentials in logs

If refresh tokens are used, define rotation/reuse detection or other revocation model.

---

## 3. Authorization

Authorization is server-side.

Required tests:

- unauthenticated user cannot mutate privileged data
- user cannot act as another user by changing request IDs
- user cannot modify another mosque without role/permission
- candidate moderator/admin boundaries cannot be crossed
- verified role scope is mosque-specific
- admin-only operations remain admin-only

---

## 4. Rate limiting

Define separate policies for:

- login/auth
- account recovery/OTP if introduced
- anonymous suggestions
- reports
- mosque creation
- expensive geospatial search
- admin authentication

Do not assume one global rate limit is appropriate.

If multiple backend replicas require coordinated limits, evaluate distributed storage;
do not add Redis before that need exists.

---

## 5. Validation

At external boundaries:

- reject unknown/unexpected properties where feasible
- enforce maximum lengths
- validate coordinates
- validate enumerations/state transitions
- validate content types and sizes for uploads
- normalize/validate IDs
- reject malformed pagination/radius parameters

Client-side validation never replaces backend validation.

---

## 6. Failure semantics

Unexpected failures:

- are logged with correlation/request ID
- return stable sanitized error responses
- are not converted to success
- do not leak stack traces or credentials

External dependency failures have explicit timeout and degradation behavior.

---

## 7. Reliability

For retryable/partial-failure operations define:

- transaction boundary
- idempotency
- duplicate side-effect prevention
- retry limits
- recovery behavior
- operator visibility

Do not create infinite retry loops.

---

## 8. Structured logging

Production logs should be structured.

Recommended fields where appropriate:

- timestamp
- severity
- service
- environment
- requestId/correlationId
- operation
- route
- actor/resource identifiers when safe
- duration
- outcome
- stable error code

Never log:

- passwords
- access/refresh tokens
- secret keys
- unredacted sensitive financial data
- raw private evidence unless explicitly required and protected

---

## 9. Metrics

Monitor at minimum:

- request rate
- response latency
- 4xx/5xx rate
- authentication failures
- rate-limit rejections
- database connection utilization
- database/query latency
- PostGIS nearby-query latency
- migration/deployment failures
- background queue metrics if queues are later introduced
- external integration failure rate if integrations exist

Alerts must correspond to actionable operational conditions.

---

## 10. Health/readiness

Expose distinct semantics:

```text
/health/live
/health/ready
```

Liveness:

- process is alive

Readiness:

- process can serve required application traffic

Do not make optional integrations mandatory for readiness unless the product truly
cannot serve safely without them.

---

## 11. Graceful shutdown

Handle SIGTERM/SIGINT appropriately:

- stop accepting new work
- finish/abort bounded in-flight work according to policy
- close DB pools
- drain/stop workers if introduced
- release dedicated locks/connections
- exit deterministically

Test shutdown behavior.

---

## 12. Database backups

Define:

- automated backup mechanism
- retention
- encryption/access
- restore procedure
- RPO/RTO

Periodically perform a real restore exercise.

A backup that has never been restored is not sufficient evidence of recoverability.

---

## 13. Schema deployment safety

Deployment sequencing must consider old/new application compatibility.

Do not deploy code that requires a column before the column exists.

For removals:

1. deploy compatible schema
2. migrate readers/writers
3. verify
4. remove old schema in a later release

Application rollback strategy must account for schema compatibility.

---

## 14. Map availability

Map provider failure:

- should be observable
- should show a user-friendly degraded state
- should not corrupt mosque data
- should not make direct mosque profile data disappear where avoidable

---

## 15. Operational tooling

Admin/operator tooling should support, as features exist:

- pending mosque verification
- duplicate review
- merge
- suggestion/report review
- user abuse/suspension actions
- audit lookup
- failed async job inspection/retry if queues are introduced

Operator actions are themselves authorized and audited.

---

## 16. Incident readiness

Maintain runbooks for:

- elevated 5xx
- database unavailable
- DB pool exhaustion
- PostGIS query latency spike
- auth abuse/brute force
- accidental bad deployment
- failed migration
- map provider outage
- compromised credential/secret
- restore from backup

Runbooks should identify:

- detection
- immediate containment
- recovery
- rollback
- validation after recovery

---

## 17. Deployment

Production deployment requires:

- reproducible build
- pinned dependency lockfile
- environment validation
- secrets provisioned outside repository
- migration step
- application deployment
- health checks
- smoke test
- rollback plan

Avoid manual undocumented production mutation.

---

## 18. Privacy

Collect only user/location data needed for product behavior.

Do not store continuous location history merely because the app has map access.

Explicitly define retention/exposure for:

- phone numbers
- role evidence
- attendance
- reports
- audit information
- donation information

---

## 19. Dependency failure

Core product should degrade safely when optional systems are unavailable.

Examples:

- notification provider down -> canonical prayer update can still succeed if delivery
  is designed as optional/durable follow-up
- map tiles down -> stored mosque profile remains available
- optional cache down -> fall back to source of truth when safe

Do not make optional infrastructure a hidden single point of failure.
