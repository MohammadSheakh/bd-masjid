---
id: F-015
name: Browser End-to-End Smoke Test Suite (Playwright)
phase: 1
status: completed

depends_on:
  - F-004
  - F-009
  - F-011
  - F-013

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#19-production-acceptance
  - 05-TESTING-STRATEGY.md#risk-matrix-and-mitigation
  - 06-IMPLEMENTATION-CHECKLIST.md#f-mosque-creation-vertical-slice
  - 06-IMPLEMENTATION-CHECKLIST.md#p-testing
  - 06-IMPLEMENTATION-CHECKLIST.md#s-launch-gate
  - ADRs/ADR-016-browser-end-to-end-testing-with-playwright.md
---

# Feature Specification: Browser End-to-End Smoke Test Suite (F-015)

## 1. Overview & Operational Intent

While backend unit and integration tests guarantee API contracts and transactional boundaries, they cannot catch frontend client errors such as SSR hydration mismatches with Leaflet, broken React hooks, or failing DOM modal event listeners.

**F-015** introduces an automated **Playwright Browser End-to-End Smoke Suite**:
1. Installs `@playwright/test` inside `frontend/` to run isolated browser sessions.
2. Automates tests against real headless Chromium.
3. Tests the primary critical path user journey from Home Page Discovery through Authentication, Pin-Drop Mosque Creation, Standalone Profile inspection, and Notification interactions.
4. Provides deterministic regression gatekeeping for production releases.

---

## 2. Invariants & Acceptance Gates

1. **Zero Hydration Errors**: Next.js SSR-safe dynamic map loading must complete without throwing unhandled `window is not defined` or React hydration errors.
2. **Sub-Minute Execution**: The baseline smoke suite must execute in under 45 seconds on standard machines (actual: 4.0s).
3. **Decoupled Architecture**: Browser test scripts reside in `frontend/e2e/` without leaking into NestJS backend dependencies.
4. **Deterministic Mocking / Interception**: API network requests can be intercepted or validated against live services cleanly.

---

## 3. Implementation Slices & Proof of Completion

### TK-E2E-01: Playwright Installation & Configuration in Frontend
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Add `@playwright/test` devDependency to `frontend/package.json`, create `frontend/playwright.config.ts` configuring Chromium runner and base URL.
- **Acceptance Criteria**:
  - [x] `@playwright/test` installed in `frontend/`.
  - [x] `frontend/playwright.config.ts` created with headless Chromium project.
  - [x] Script `"test:e2e": "playwright test"` added to `frontend/package.json`.
- **Implementation Files**:
  - Config: `frontend/playwright.config.ts`
  - Package: `frontend/package.json`

### TK-E2E-02: Critical Path Smoke Suite Implementation
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Create `frontend/e2e/smoke.spec.ts` covering map rendering, auth modal toggling, pin-drop mosque modal, profile view, and notifications.
- **Acceptance Criteria**:
  - [x] `frontend/e2e/smoke.spec.ts` created.
  - [x] Test 1: Home page loads with navbar, title, search input, and map container.
  - [x] Test 2: AuthModal opens on "Sign In" click and switches between Login and Register tabs.
  - [x] Test 3: Add Mosque modal opens and renders pin-drop helper text and form fields.
  - [x] Test 4: Standalone mosque profile/admin route loads without 500 error page.
  - [x] Test 5: Notifications popover opens on bell click.
- **Implementation Files**:
  - Test Suite: `frontend/e2e/smoke.spec.ts`

### TK-E2E-03: Verification Execution & Checklist Gate Sign-Off
- **Status**: `[x] Completed` | **Priority**: Critical
- **Description**: Run the Playwright test suite, verify clean execution, and check off launch readiness in `06-IMPLEMENTATION-CHECKLIST.md`.
- **Acceptance Criteria**:
  - [x] `npm run test:e2e` passes in headless Chromium (5 passed in 4.0s).
  - [x] Checked off browser E2E items in `06-IMPLEMENTATION-CHECKLIST.md`.
- **Implementation Files**:
  - Checklist: `_doc/mosque-platform-production-docs/06-IMPLEMENTATION-CHECKLIST.md`
