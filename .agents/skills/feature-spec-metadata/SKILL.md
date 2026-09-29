---
name: feature-spec-metadata
description: Create, maintain, or validate feature specifications with agentic YAML frontmatter metadata (id, name, phase, status, depends_on, blocks, parallel_with, source) and embedded implementation proof matrices for the Mosque Platform.
---

# Feature Specification & Agentic Metadata Skill

This skill defines the standard for authoring, updating, and navigating feature specifications across `_doc/mosque-platform-production-docs/specs/`. It provides machine-readable Directed Acyclic Graph (DAG) metadata that enables AI agents to resolve dependencies, schedule parallel tasks, prevent broken state transitions, and maintain immutable implementation proof.

---

## 1. Why Agentic Metadata is Powerful

When building complex software with AI agents, unstructured markdown leads to:
- Agents attempting to build features whose prerequisite database tables don't exist yet.
- Uncoordinated schema migrations that cause merge conflicts.
- Lost traceability between PRD requirements and actual code files.

By enforcing structured YAML frontmatter metadata at the top of every `<feature>.md`:
1. **Automated Dependency Resolution (`depends_on`)**: The agent inspects prerequisite feature IDs and confirms they are `completed` before writing code.
2. **Parallel Scheduling (`parallel_with`)**: Identifies features with orthogonal database schemas and module boundaries that can be safely developed concurrently.
3. **Downstream Impact Analysis (`blocks`)**: Alerts the agent to which upcoming features depend on this slice.
4. **Zero-Day Traceability (`source`)**: Direct markdown anchors pointing to the exact PRD requirements, architecture sections, and checklists.

---

## 2. Frontmatter Specification & Schema

Every specification in `_doc/mosque-platform-production-docs/specs/<feature-name>/<feature-name>.md` MUST begin with this exact frontmatter block:

```yaml
---
id: F-020                                      # Unique feature ID (F-001..F-019 for R1, F-020+ for R2)
name: Mosque Staff Delegation & Governance     # Canonical feature name
phase: 2                                       # Release Phase (1, 2, 3, 4)
status: planned                                # planned | in-progress | completed | blocked

depends_on:                                    # Prerequisites that MUST be completed first
  - F-001
  - F-002
  - F-003
  - F-004

blocks:                                        # Downstream features waiting on this feature
  - F-022

parallel_with:                                 # Slices that can execute concurrently without conflicts
  - F-021

source:                                        # Traceability anchors in production docs
  - 01-PRD-PRODUCTION.md#community-and-staff
  - 02-SYSTEM-ARCHITECTURE.md#authorization-model
  - 03-DATA-API-CONTRACTS.md#staff-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#d-authorization
---
```

### Field Definitions

| Field | Type | Allowed Values / Format | Description |
| :--- | :--- | :--- | :--- |
| `id` | `string` | `F-###` (e.g. `F-001`, `F-020`) | Global, immutable identifier for the feature slice. |
| `name` | `string` | Human-readable string | Formal name matching the PRD. |
| `phase` | `integer` | `1`, `2`, `3`, `4` | Target release number per `07-RELEASE-PLAN.md`. |
| `status` | `string` | `planned`, `in-progress`, `completed`, `blocked` | Real-time lifecycle state of this feature. |
| `depends_on` | `string[]` | List of `F-###` IDs (or `[]` if root) | Prerequisite features that must be completed. |
| `blocks` | `string[]` | List of `F-###` IDs (or `[]`) | Features whose implementation is gated by this feature. |
| `parallel_with` | `string[]` | List of `F-###` IDs (or `[]`) | Features in the same phase with no mutual dependencies. |
| `source` | `string[]` | List of relative doc links with anchors | Traceability links back to production documentation. |

---

## 3. Full Feature Spec File Structure

Every feature spec file must adhere to this unified layout:

```markdown
---
id: F-020
name: Mosque Staff Delegation & Role Claim Governance
phase: 2
status: in-progress
depends_on: [F-001, F-002, F-003, F-004]
blocks: []
parallel_with: [F-021]
source:
  - 01-PRD-PRODUCTION.md#verified-mosque-community-roles
  - 06-IMPLEMENTATION-CHECKLIST.md#d-authorization
---

# Feature Specification: Mosque Staff Delegation & Role Claim Governance

## 1. Overview
[Concise executive overview of the feature slice and business intent]

## 2. Business Invariants
1. [Invariant 1: Authorization, state machine rules, validation bounds]
2. [Invariant 2: Zero extra infrastructure rules, idempotency rules]

## 3. Data Model Reference
[Prisma schema models, fields, enums, relations, composite indexes]

## 4. REST API Contracts
- `POST /api/v1/...` — [Description and DTO reference]
- `GET /api/v1/...` — [Description]

## 5. Extracted Implementation Checklist
- [ ] [Capability 1]
- [ ] [Capability 2]

---

## 6. Implementation Slices & Proof of Completion

### TK-STF-01: Staff Roster Database Schema & Role Claims API
- **Status**: `[ ] Pending` | **Priority**: Critical
- **Description**: [Summary of the slice]
- **Acceptance Criteria**:
  - [ ] [Verifiable acceptance criterion 1]
  - [ ] [Verifiable acceptance criterion 2]
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema.prisma`
  - Service: `backend-nest-prisma/src/features/staff/staff.service.ts`
  - Controller: `backend-nest-prisma/src/features/staff/staff.controller.ts`
  - Tests: `backend-nest-prisma/src/features/staff/staff.service.spec.ts`

### TK-STF-02: Mosque Staff Management & Verification UI
- **Status**: `[ ] Pending` | **Priority**: High
- **Description**: [Frontend slice summary]
- **Acceptance Criteria**:
  - [ ] [UI criterion 1]
  - [ ] [UI criterion 2]
- **Implementation Files**:
  - Page: `frontend/src/app/mosques/[id]/staff/page.tsx`
  - Component: `frontend/src/components/StaffDirectory.tsx`
```

---

## 4. Agent Execution Guidelines

When working as an AI agent in this repository:

### Step 1: Pre-Execution Dependency Check
Before implementing any feature:
1. Read the target spec's frontmatter.
2. For each ID in `depends_on`, verify that the referenced spec file has `status: completed`.
3. If any dependency is `planned`, `in-progress`, or `blocked`, **HALT** and alert the user with the missing prerequisite.

### Step 2: Transitioning to In-Progress
When beginning implementation:
1. Update `status: in-progress` in the target spec's frontmatter.
2. Ensure no conflicting migrations are running in `parallel_with` slices.

### Step 3: Recording Proof of Completion
When code passes tests:
1. Check off the acceptance criteria in the spec (`[x]`).
2. Populate the concrete implementation file paths.
3. Update `status: completed` in the frontmatter.
4. Update `specs/README.md` to reflect the completed state.

---

## 5. Release 2 Feature ID Registry

For all upcoming Release 2 work, use the following reserved ID sequence:

| ID | Feature Name | Slug | Depends On | Phase |
| :--- | :--- | :--- | :--- | :--- |
| **F-020** | Mosque Staff Delegation & Role Claim Governance | `staff-delegation` | `F-001, F-002, F-003, F-004` | 2 |
| **F-021** | Enhanced Mosque Facilities & Capacity Taxonomy | `facility-taxonomy` | `F-001, F-004` | 2 |
| **F-022** | Mosque Official Announcements Channel | `announcements` | `F-001, F-003, F-004, F-020` | 2 |
| **F-023** | Volunteer Roster & Event Coordination | `volunteer-roster` | `F-001, F-004, F-020` | 2 |
