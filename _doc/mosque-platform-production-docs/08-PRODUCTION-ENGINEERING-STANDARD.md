# Production Engineering Standard

Implement production-grade software appropriate to the current architecture and scale.

Do not optimize only for the happy path or for demonstration-level functionality.

A feature is not complete merely because it works locally.

## Engineering expectations

Before implementation:

- Inspect the existing architecture, adjacent modules, database schema,
  conventions, tests, and operational patterns.
- Preserve established boundaries and naming conventions.
- Prefer extending existing patterns over introducing parallel architecture.
- Identify business invariants, failure modes, authorization boundaries,
  persistence requirements, and external dependencies before coding.

During implementation:

- Validate all external input at the system boundary.
- Enforce authentication and authorization server-side.
- Preserve domain invariants independently of the UI.
- Use explicit transaction boundaries for atomic multi-step mutations.
- Consider concurrency, duplicate requests, retries, and idempotency where relevant.
- Do not silently swallow errors.
- Do not convert unexpected failures into successful responses.
- Do not use in-memory state for durable business data.
- Do not hardcode secrets, environment-specific URLs, limits, or credentials.
- Validate required environment configuration at startup.
- Use structured application logging for operationally important failures.
- Apply timeouts and bounded retries to external I/O where appropriate.
- Fail safely when external services are unavailable.
- Keep optional integrations optional; core functionality should degrade gracefully.
- Preserve database constraints and referential integrity.
- Create reviewed migrations for schema changes.
- Avoid destructive schema/data operations unless explicitly required.
- Avoid unbounded queries, loops, queues, concurrency, or external requests.
- Use pagination for potentially growing collections.
- Avoid N+1 database access patterns.
- Select only data required by the operation where practical.
- Keep controllers thin and business rules outside transport code.
- Keep framework/infrastructure concerns separate from pure domain logic where
  the complexity justifies it.
- Do not introduce abstractions merely for architectural appearance.
- Do not introduce microservices, queues, repositories, CQRS, event sourcing,
  or additional infrastructure unless the problem requires them.

## Security

Treat security as part of implementation, not a later hardening phase.

Consider where relevant:

- authentication
- authorization / ownership checks
- input validation
- output exposure
- secret management
- injection
- SSRF
- XSS
- CSRF
- rate limiting
- secure cookies
- sensitive logging
- dependency/security implications
- external URL validation

Use least privilege and deny unsafe operations by default.

## Reliability

For operations that can be retried or partially fail:

- define idempotency behavior
- define transaction boundaries
- prevent duplicate side effects
- preserve recoverability
- expose useful failure information without leaking sensitive data

External integrations must have explicit timeout/failure behavior.

## Testing

Test behavior and risk, not files.

Add tests for:

- core business rules
- important invariants
- authorization boundaries
- validation failures
- important edge cases
- transactional behavior where relevant
- regression cases introduced by the change

Use integration tests when correctness depends on boundaries between components.

Do not replace real production behavior with mocks merely to make tests pass.

## Operational readiness

Where relevant, ensure the feature has:

- useful structured logs
- health/readiness implications considered
- safe configuration defaults
- observable external failures
- migration compatibility
- deployment compatibility
- rollback or recovery strategy

## Definition of Done

Before declaring the task complete:

1. Run the repository's relevant typecheck, lint, unit, integration,
   database, and build checks.
2. Review the diff for architecture drift, security issues, accidental
   complexity, and unrelated changes.
3. Verify database migrations and data compatibility if persistence changed.
4. Verify failure paths in addition to the successful path.
5. Confirm no secrets, debug code, placeholders, TODO implementations,
   temporary fallbacks, or fake production behavior remain.
6. Update documentation when architecture, configuration, APIs,
   invariants, or operational behavior changed.

If an item does not apply, do not manufacture unnecessary infrastructure
only to satisfy the checklist.
