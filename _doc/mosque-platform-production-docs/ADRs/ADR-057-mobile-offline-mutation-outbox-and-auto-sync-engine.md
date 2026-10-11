# ADR-057: Mobile Offline Mutation Outbox and Automatic Background Sync Engine

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-033 and ADR-038, the mobile client established a Stale-While-Revalidate (SWR) cache and multi-tiered fallback architecture for read operations (`GET /mosques`, `GET /mosques/:id/announcements`, etc.) ensuring instant hydration and offline browsing.

However, Bangladesh mobile environments frequently encounter intermittent connectivity, low-bandwidth edge networks (2G/3G in rural upazilas), or complete network dropouts inside mosque basements and concrete prayer halls. When worshippers submit write actions:
1. Mosque attendance affiliation (`PUT /mosques/:id/attendance`)
2. Immediate timetable updates (`PUT /mosques/:id/prayer-schedule`)
3. New mosque pin-drop submissions (`POST /mosques`)
4. Facility taxonomy suggestions (`POST /mosques/:id/suggestions`)
5. Listing inaccuracy reports (`POST /mosques/:id/reports`)

network timeouts or DNS lookup failures previously led to submission failures and dropped data, frustrating worshippers who took the initiative to contribute.

---

## Decision

### 1. Persistent Outbox Queue Architecture (`OfflineOutboxService`)
We implement an enterprise offline mutation queue:
- **Persistent Outbox Key**: `bd_masjid_offline_outbox` in local storage with in-memory synchronous mirroring.
- **Outbox Mutation Contract (`types/outbox.ts`)**:
  - `id`: Unique UUID or timestamp nonce (`outbox_xxx`).
  - `type`: `'ATTENDANCE' | 'TIMETABLE_UPDATE' | 'CREATE_MOSQUE' | 'SUGGEST_FACILITY' | 'REPORT_ISSUE'`.
  - `endpoint`: Target REST path (e.g. `/mosques/123/attendance`).
  - `method`: `'POST' | 'PUT' | 'DELETE'`.
  - `payload`: Serialized request body.
  - `headers`: Authentication token / contributor headers.
  - `retryCount`: Number of delivery attempts (capped at 5).
  - `status`: `'PENDING' | 'SYNCING' | 'FAILED'`.
  - `createdAt`: ISO 8601 timestamp.

### 2. Automatic Fallback Enqueueing in `ApiClient`
When any write operation in `ApiClient` fails due to network disconnection or timeout:
1. The mutation is automatically enqueued into `OfflineOutboxService`.
2. The caller receives an optimistic success response with `isOfflineQueued: true`.
3. The UI updates optimistically without displaying a blocking error.

### 3. Automatic Reconnection Drain Engine
- Automatically monitors connectivity state.
- Upon reconnecting to WiFi or cellular data:
  1. Drains pending outbox items sequentially (FIFO) to preserve causal order.
  2. Implements exponential backoff ($1\text{s}, 2\text{s}, 4\text{s}, 8\text{s}$) on 5xx server errors.
  3. Drops and logs 4xx unrecoverable client errors (e.g., validation failure) while keeping valid queue items moving.

### 4. Ferio Outbox Sync Visual Feedback (`OutboxSyncBadge.tsx`)
- In `OfflineBanner.tsx` and main navbar:
  - If pending items exist: Shows animated sync indicator (`🔄 Syncing X pending contributions...`).
  - Upon full drain: Displays subtle success toast (`✓ All offline contributions synced to BD Masjid`).
  - Provides a 1-tap manual "Sync Now" button.

---

## Consequences

### Positive
- Zero data loss for community contributions in low-connectivity areas.
- Seamless musalli experience: worshippers can submit edits offline inside the mosque and have them automatically upload when they step outside.
- Memory and cold hydration overhead remains $<0.2$ms and $<5$MB RAM.

### Negative / Trade-offs
- Requires careful FIFO handling so conflicting timetable edits for the same mosque execute in causal order.
