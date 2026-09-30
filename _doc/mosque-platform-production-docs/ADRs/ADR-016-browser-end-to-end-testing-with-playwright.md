# ADR-016: Browser End-to-End Testing with Playwright

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Mohammad Sheakh, Antigravity Platform Engineering Team

---

## Context
Per [01-PRD-PRODUCTION.md](../01-PRD-PRODUCTION.md) (Section 19), [05-TESTING-STRATEGY.md](../05-TESTING-STRATEGY.md), and [06-IMPLEMENTATION-CHECKLIST.md](../06-IMPLEMENTATION-CHECKLIST.md) (§F, §P, §S), while unit and API integration tests verify contracts in isolation, they cannot detect browser-level failure modes:
1. **SSR Hydration Mismatches**: Leaflet map components, dynamic modals, and client-only hooks can crash in real browser engines if server-rendered components touch `window` or `document`.
2. **Interactive UI Workflows**: Multi-step workflows (e.g. Opening Auth modal -> Pin-dropping a mosque marker -> Viewing Standalone profile -> Follow & Real-time Notification toast) must be validated end-to-end.
3. **Responsive Presentation**: Ensuring UI elements, navigation bars, and search filters operate without visual or DOM breakage.

---

## Decision

### 1. Test Runner Selection: Playwright
We select **Playwright** (`@playwright/test`) located directly in `frontend/` (`frontend/e2e/`).
- Why Playwright over Cypress or Puppeteer:
  - Native support for modern Next.js architectures with zero Webpack/Turbopack wrapping overhead.
  - Built-in headless Chromium runner with automated tracing, video, and screenshot artifacts on failure.
  - Clean `webServer` lifecycle configuration that seamlessly attaches to existing running dev or production servers.
  - Decoupled from the backend repository while allowing full HTTP route interception and mocking when simulating network edge cases.

### 2. Critical Path Smoke Suite Scope (`frontend/e2e/smoke.spec.ts`)
The baseline smoke test suite will validate the core user journeys:
1. **Interactive Discovery**: Home page (`/`) loads with map container, navbar, search bar, and mosque cards without console errors or hydration breaks.
2. **Authentication Modals**: Opening the Auth modal from navbar, toggling between Login and Registration views.
3. **Mosque Creation Pin Drop**: Opening the Add Mosque modal, placing a pin, and asserting coordinate inputs are captured.
4. **Standalone Mosque Profile**: Navigating to `/mosques/[id]` directly and asserting prayer schedule times, facilities badges, and verified donation cards render.
5. **Real-Time Notification & Follow Interactivity**: Validating notification bell toggle and empty-state / live toast display.

### 3. CI and Local Execution
- Local command: `npm run test:e2e` in `frontend/`.
- Configured with headless Chromium by default for sub-minute test execution.

---

## Consequences

### Positive
- **Guaranteed Production Integrity**: Catches browser hydration crashes before code reaches end users.
- **Fast Feedback**: Headless Chromium smoke suite executes in < 30 seconds.
- **Reproducible Artifacts**: Automatically captures failure screenshots and traces in `frontend/test-results/`.

### Negative / Trade-offs
- Requires Playwright browser binary download (`npx playwright install chromium`).
