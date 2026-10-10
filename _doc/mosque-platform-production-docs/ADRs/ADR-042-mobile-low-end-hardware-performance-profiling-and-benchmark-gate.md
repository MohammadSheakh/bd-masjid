# ADR-042: Mobile Low-End Hardware Performance Profiling and Automated Benchmark Gate

## Status
Accepted

## Date
2026-10-10

## Context
In Bangladesh, a substantial portion of the target user population relies on entry-level Android smartphones with $\le 3$ GB of physical RAM (e.g., Walton Primo, Symphony, Redmi 9A/A2, and Infinix Smart series). These devices feature constrained CPU cores, limited thermal ceilings, and aggressive Low Memory Killer (LMK) operating systems.

If the application introduces memory bloat, unvirtualized lists, or unoptimized map vector drawing:
1. The OS terminates the application in the background, killing prayer auto-silent alarms.
2. The user interface experiences dropped frames and stuttering while musallis scroll through mosques.
3. Cold launch latency exceeds 2–3 seconds, causing immediate user abandonment.

To guarantee production readiness across the lowest tier of hardware, an automated CI/CD performance benchmark gate must enforce strict hardware budgets before release.

## Decision

1. **Strict Performance Budgets**:
   - **Idle Memory Ceiling**: $< 65$ MB RAM usage when idle on home feed.
   - **Active Map Streaming Memory**: $< 115$ MB RAM usage during active coordinate projection and pin clustering.
   - **Scroll Frame Budget**: Sustained 60 FPS target ($\le 16.6$ ms per frame render loop) during virtualized feed scrolling.
   - **Cold Launch Time**: $< 1.5$ seconds from process spawn to interactive UI hydration.

2. **Automated Benchmark Harness (`scripts/benchmark-mobile.js`)**:
   - Executes programmatic stress testing across feed virtualization, spatial calculations, and memory footprint.
   - Emits structured pass/fail metrics with microsecond precision.
   - Fails the build (exits with non-zero exit code `1`) if any performance metric violates the hardware budget.
   - Registered under `npm run benchmark` in `mobile/package.json`.

## Consequences

### Positive
- **Guaranteed Walton / Redmi Compatibility**: Prevents regressions that could freeze low-memory devices.
- **Measurable Engineering Standard**: Replaces subjective smoothness impressions with concrete mathematical verification.
- **Continuous Gate**: Runs in local development and EAS CI/CD pipelines before any release binary is tagged.

### Trade-offs
- Synthetic benchmarks on Node.js / V8 environment measure code algorithmic efficiency and projection latency, which is complemented by manual physical device QA on physical test benches.
