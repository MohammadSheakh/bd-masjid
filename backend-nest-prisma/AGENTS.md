# Backend scope

Read [root instructions](../AGENTS.md) first. This file applies to `backend-nest-prisma/`.

## Production Documentation Authority

Consult the production documentation in `_doc/mosque-platform-production-docs/` before making architectural or API changes:

- [01-PRD-PRODUCTION.md](../_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md): Product requirements and core flows
- [02-SYSTEM-ARCHITECTURE.md](../_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md): System boundaries, modular monolith design, and PostGIS architecture
- [03-DATA-API-CONTRACTS.md](../_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md): Route specifications, DTOs, domain models, and API errors
- [04-SECURITY-RELIABILITY-OPERATIONS.md](../_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md): Authentication, rate limiting, and failure semantics
- [05-TESTING-STRATEGY.md](../_doc/mosque-platform-production-docs/05-TESTING-STRATEGY.md): Unit, integration, PostGIS database, and E2E testing
- [06-IMPLEMENTATION-CHECKLIST.md](../_doc/mosque-platform-production-docs/06-IMPLEMENTATION-CHECKLIST.md): Readiness checklist and Definition of Done
- [07-RELEASE-PLAN.md](../_doc/mosque-platform-production-docs/07-RELEASE-PLAN.md): Feature scope across releases
- [08-PRODUCTION-ENGINEERING-STANDARD.md](../_doc/mosque-platform-production-docs/08-PRODUCTION-ENGINEERING-STANDARD.md): Engineering quality bar

## Load only the affected concern

- [NestJS Best Practices](../.agents/skills/nestjs-best-practices/SKILL.md): architecture, DI, validation, error handling.
- [Backend Feature README generator](../.agents/skills/backend-feature-readme/SKILL.md): module READMEs and Mermaid architecture diagrams.
- [API rules](../.agents/rules/backend-api.md): routes, guards, DTOs, consumers.
- [Database rules](../.agents/rules/backend-database.md): queries, repositories, schema.
- [Transaction rules](../.agents/rules/backend-transactions.md): multi-write boundaries and atomicity.
- [Prisma scope](prisma/AGENTS.md): schema fragments, generation, seed, or migration edit.
- [Capacity rules](../.agents/rules/reliability-capacity.md): workers, external I/O, or scaling decisions.

## Local architecture and gotchas

Use strict TypeScript and constructor injection with the installed Nest/Prisma
PostgreSQL adapter and class-validator/class-transformer boundaries. Preserve
`/api/v1` and documented consumer contracts. There is no platform database, tenant
context, Drizzle layer, global ErrorService, or required queue runtime for Release 1.
Do not introduce those implicitly from a generic skill.

Controllers handle transport; services own use cases; pure domain helpers own
business calculation/validation policy. Services query Prisma directly. For complex PostGIS
SQL, reusable persistence, or connection ownership, use a focused repository and keep
that use case's database access there. Repositories return domain data or typed failures;
services map them to HTTP errors where relevant.

Export shared feature providers through modules; import those modules rather
than registering duplicate providers. Keep dependency direction explicit and
avoid circular imports. Existing regression suites live in `test/`.

## Verification

From the repository root or `backend-nest-prisma`:
- Typecheck: `pnpm --dir backend-nest-prisma run build` (or `nest build`)
- Lint: `pnpm --dir backend-nest-prisma run lint`
- Tests: `pnpm --dir backend-nest-prisma test`
- Integration: `pnpm --dir backend-nest-prisma run test:integration`
- Database/E2E: `pnpm --dir backend-nest-prisma run test:e2e`
