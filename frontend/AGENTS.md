# Frontend scope

Read [root instructions](../AGENTS.md) first. This file applies to `frontend/`.

## Production Documentation Authority

Consult the production documentation in `_doc/mosque-platform-production-docs/` before making frontend architectural, routing, or UI design changes:

- [01-PRD-PRODUCTION.md](../_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md): Product requirements, user flows, and core UI features
- [02-SYSTEM-ARCHITECTURE.md](../_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md): Frontend boundary, map architecture, and provider failure degradation
- [03-DATA-API-CONTRACTS.md](../_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md): Backend REST endpoints (`/api/v1`), DTOs, and error envelopes
- [04-SECURITY-RELIABILITY-OPERATIONS.md](../_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md): Client security, session tokens, and input sanitization
- [05-TESTING-STRATEGY.md](../_doc/mosque-platform-production-docs/05-TESTING-STRATEGY.md): Browser and E2E testing (Playwright)
- [06-IMPLEMENTATION-CHECKLIST.md](../_doc/mosque-platform-production-docs/06-IMPLEMENTATION-CHECKLIST.md): Frontend checklist items (Map, Mosque creation, Profile, Search)
- [07-RELEASE-PLAN.md](../_doc/mosque-platform-production-docs/07-RELEASE-PLAN.md): Feature delivery phases (Release 1 to Release 4)
- [08-PRODUCTION-ENGINEERING-STANDARD.md](../_doc/mosque-platform-production-docs/08-PRODUCTION-ENGINEERING-STANDARD.md): Engineering standards and Definition of Done

## Applicable Rules & Skills

- [Frontend Architecture rules](../.agents/rules/frontend-architecture.md): Next.js App Router rules, server/client components, state management
- [Frontend Security rules](../.agents/rules/frontend-security.md): token storage, XSS prevention, public/private boundary
- [Ferio Frontend Design skill](../.agents/skills/ferio-frontend-design/SKILL.md): design system, accessibility, responsive patterns

## Local Architecture and Gotchas

- OpenStreetMap is the base map and geographic context only (tiles). Mosque markers are fetched from the NestJS platform API (`/api/v1/mosques/nearby`, `/api/v1/mosques`).
- Next.js owns rendering, routing, client state, and map display. It does not own authorization or business invariants.
- Degraded map state: If map tiles fail to load, direct URLs to mosque profiles and text search must remain functional.
- Unknown data must be presented as unknown; do not fabricate defaults for prayer times or verification.
