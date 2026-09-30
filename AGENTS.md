# Mosque Information & Community Platform agent instructions

Applies across this repository; read the nearest scoped instructions for touched files.
The platform implementation is NestJS/Prisma ([backend-nest-prisma/](backend-nest-prisma/AGENTS.md)) and Next.js ([frontend/](frontend/AGENTS.md)). This is a single-tenant application; PostgreSQL/PostGIS is the durable source of truth.

## Production Documentation Authority

Always consult the production documentation in [_doc/mosque-platform-production-docs/](_doc/mosque-platform-production-docs/README.md) before making architectural or implementation decisions. Use the documents in this order of precedence:

1. [01-PRD-PRODUCTION.md](_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md) — Product requirements, user flows, and release scope
2. [02-SYSTEM-ARCHITECTURE.md](_doc/mosque-platform-production-docs/02-SYSTEM-ARCHITECTURE.md) — System boundaries, domain modularity, and architecture decisions
3. [03-DATA-API-CONTRACTS.md](_doc/mosque-platform-production-docs/03-DATA-API-CONTRACTS.md) — Domain invariants, data model, and REST API contracts
4. [04-SECURITY-RELIABILITY-OPERATIONS.md](_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md) — Security baseline, reliability, and operations
5. [05-TESTING-STRATEGY.md](_doc/mosque-platform-production-docs/05-TESTING-STRATEGY.md) — Testing layers, PostGIS tests, and risk coverage
6. [06-IMPLEMENTATION-CHECKLIST.md](_doc/mosque-platform-production-docs/06-IMPLEMENTATION-CHECKLIST.md) — Implementation sequence and production readiness gates
7. [07-RELEASE-PLAN.md](_doc/mosque-platform-production-docs/07-RELEASE-PLAN.md) — Staged feature delivery (Release 1 to Release 4)
8. [08-PRODUCTION-ENGINEERING-STANDARD.md](_doc/mosque-platform-production-docs/08-PRODUCTION-ENGINEERING-STANDARD.md) — Reusable engineering quality bar and Definition of Done
9. [IMPLEMENTATION-SEQUENCE.md](_doc/mosque-platform-production-docs/IMPLEMENTATION-SEQUENCE.md) — Phased execution plan, parallel tracks, and stage gates

## Load context for the task

1. Read the request and `git status --short`; preserve unrelated work.
2. For backend, frontend, or Prisma changes, read the respective scoped instructions:
   - Backend: [backend-nest-prisma/AGENTS.md](backend-nest-prisma/AGENTS.md)
   - Frontend: [frontend/AGENTS.md](frontend/AGENTS.md)
   - Prisma: [backend-nest-prisma/prisma/AGENTS.md](backend-nest-prisma/prisma/AGENTS.md)
3. Load linked rules/skills only for the concern being changed:
   - Backend API rules: [.agents/rules/backend-api.md](.agents/rules/backend-api.md)
   - Database rules: [.agents/rules/backend-database.md](.agents/rules/backend-database.md)
   - Multi-tenant rules (if applicable): [.agents/rules/backend-database-multi-tenant.md](.agents/rules/backend-database-multi-tenant.md)
   - Transaction rules: [.agents/rules/backend-transactions.md](.agents/rules/backend-transactions.md)
   - Capacity rules: [.agents/rules/reliability-capacity.md](.agents/rules/reliability-capacity.md)
   - Frontend architecture rules: [.agents/rules/frontend-architecture.md](.agents/rules/frontend-architecture.md)
   - Frontend security rules: [.agents/rules/frontend-security.md](.agents/rules/frontend-security.md)
   - NestJS Best Practices: [.agents/skills/nestjs-best-practices/SKILL.md](.agents/skills/nestjs-best-practices/SKILL.md)
   - Feature Spec Metadata skill: [.agents/skills/feature-spec-metadata/SKILL.md](.agents/skills/feature-spec-metadata/SKILL.md)
   - Implementation Sequence skill: [.agents/skills/implementation-sequence/SKILL.md](.agents/skills/implementation-sequence/SKILL.md)
   - Delivery skill: [.agents/skills/git-commit-push/SKILL.md](.agents/skills/git-commit-push/SKILL.md)
4. Trace the affected caller, authorization, persistence, and consumers. Inspect installed versions and package scripts before using external examples.

Explicit user constraints take precedence over repository guidance. Scoped files refine this root; project contracts take precedence over generic templates.

## Local gotchas

- OpenStreetMap is the base map and geographic context only. The platform owns its mosque registry in PostgreSQL/PostGIS.
- Do not introduce infrastructure (Redis, BullMQ, Socket.io, queues) without a concrete, measured requirement.
- Preserve API/schema compatibility and update coupled consumers deliberately.
- Keep credentials out of logs, commits, and client bundles. Treat user and crawler content as untrusted input.

## Verification and delivery

Use relevant package scripts in `backend-nest-prisma/` and `frontend/`. For substantial reliability/capacity work, load [capacity rules](.agents/rules/reliability-capacity.md) and [04-SECURITY-RELIABILITY-OPERATIONS.md](_doc/mosque-platform-production-docs/04-SECURITY-RELIABILITY-OPERATIONS.md). Commit/push when authorized using [delivery skill](.agents/skills/git-commit-push/SKILL.md).

<!-- graft:start -->
## Graft — repo context graph

This repo is indexed in `graft/`: small linked markdown nodes that explain each
system and carry exact file:line spans, kept in sync with the code through git.

For ANY task here — understanding how something works, finding where code lives,
or scoping a change — get context from the graph before grepping or opening
source files. Re-ask freely (it's cheap) and reuse literal identifiers you
already have (symbol, error string, file name) as the query. New to this repo?
Run `graft map` first — a token-budgeted orientation (dir clusters, hubs,
hotspots), no LLM, no key.

- Run `graft ask "<your question>" --source` → ranked nodes with the relevant
  code spans inlined (each hit's ≤8-line crux by default; `--full` for whole
  definitions when the crux isn't enough). Match the tool to the task shape:
  for understanding or editing, the top node IS the answer — cite its
  `covers:` file:line spans and edit straight from `--source`. For
  exhaustive tasks ("every occurrence / every caller of this pattern"), ranked
  results are top-N, not complete — run `graft grep "<literal>"` instead
  (exhaustive over indexed files, grouped by enclosing symbol), falling back
  to raw `grep -rn` only for unindexed files.
- `graft skeleton <file>` → every definition's signature + span, ~10× cheaper
  than reading the file; use it to skim an API surface.
- `graft callers <symbol>` gives precomputed, exact edges — who calls this.
  Add `--direction out` for what it calls, or `--depth N` to walk
  transitively for the full blast radius. For structural questions, skip
  ranking and use this directly.
- Or browse: `graft/INDEX.md` lists every node; follow the links.
- Monorepos and folders of multiple repos rank fairly across sub-projects —
  hits carry `[scope/]` labels naming which one they're from. Narrow with
  `graft ask "<task>" --in <scope>/` once you know where you're working.

If a returned span is truncated ("+N more lines"), open the file at that exact
range before finalizing. Only open source files when a node genuinely lacks a
needed detail, and then at the exact file:line the node points to — never
re-read whole files.

After big code changes, refresh the graph with `graft build` (deterministic,
no API key, $0).
<!-- graft:end -->
