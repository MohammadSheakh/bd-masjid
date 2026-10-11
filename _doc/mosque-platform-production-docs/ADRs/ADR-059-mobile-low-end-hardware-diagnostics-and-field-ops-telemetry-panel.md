# ADR-059: Mobile Low-End Hardware Diagnostics and Field Operations Telemetry Panel

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-040 and ADR-042, the mobile platform established strict performance ceilings for low-end hardware ($\le 3$GB RAM, Walton Primo, Xiaomi Redmi 9A, Realme C11) and privacy-sanitized telemetry.

During field operations, QA verification, and community scout deployments across Bangladesh, engineers and field testers need real-time visibility into runtime metrics:
1. Real-time frame rendering speed (FPS and max frame budget $<16.6$ms).
2. Heap memory utilization vs budget ceiling ($<65$MB idle, $<115$MB active).
3. Cold launch hydration speed ($<1500$ms).
4. Live network round-trip latency and offline outbox status.
5. 1-tap exportable sanitized diagnostic reports (scrubbed of personal data, device identifiers, and credentials) for bug tracking and GitHub issues.

Currently, these metrics are validated via headless scripts (`scripts/benchmark-mobile.js`), but field scouts holding physical hardware in remote areas lacked an in-app visual panel.

---

## Decision

### 1. Hardware Diagnostics Domain Contracts (`types/diagnostics.ts`)
We introduce structured diagnostic metrics:
- `DeviceHardwareMetrics`:
  - `fps`: number (e.g. 59-60)
  - `frameTimeMs`: number (e.g. 16.4)
  - `heapUsedMb`: number (e.g. 4.6)
  - `heapBudgetMb`: number (65)
  - `coldLaunchMs`: number
  - `isMemoryConstrained`: boolean
  - `networkLatencyMs`: number
  - `cacheEntriesCount`: number
  - `outboxPendingCount`: number
  - `osPlatform`: string
- `SanitizedDiagnosticReport`:
  - `timestamp`: ISO 8601
  - `hardwareSummary`: Sanitized device and OS info
  - `performanceMetrics`: Current snapshot
  - `storageMetrics`: Offline cache & outbox state
  - `breadcrumbs`: Last 10 sanitized lifecycle events

### 2. Live Diagnostics Engine (`services/diagnosticsService.ts`)
- Implements a low-overhead, non-intrusive `requestAnimationFrame` sampling window (sampling 60 frames every second when sheet is active; zero overhead when sheet is closed).
- Aggregates memory and outbox metrics synchronously without garbage collection thrashing.
- Generates markdown/JSON diagnostic reports formatted for GitHub issue templates.

### 3. Ferio Diagnostics Sheet (`DiagnosticsTelemetryModal.tsx`)
- High-contrast modal adhering to Ferio design tokens:
  - Header: `⚡ Field Ops & Telemetry` with live FPS badge (`🟢 60 FPS · Smooth`).
  - Progress gauge cards for Frame Time, Heap Memory, and Network.
  - Hardware specs grid (`Android · ARM64 · Low-Memory Mode: Inactive`).
  - Action button: `"📋 Copy Sanitized Report"` with native share/clipboard integration.

### 4. Gestural Developer Trigger in `App.tsx`
- Accessible via long-press (800ms) or triple-tap on the top navbar title (`"BD Masjid"`), ensuring regular worshippers are uninterrupted while engineers and scouts can inspect hardware instantly.

---

## Consequences

### Positive
- Instant on-device diagnosis of frame drops or memory bloat on low-end hardware in Bangladesh.
- 1-tap reproducible diagnostic reports for bug reports and performance regressions.
- Zero CPU/memory overhead when modal is closed.

### Negative / Trade-offs
- Adds a lightweight modal component (~140 lines).
