# ADR-013: Mosque Follow Subscriptions and Real-Time In-App Notifications

## Status
**Accepted**

## Date
2026-09-30

## Deciders
Mohammad Sheakh, Antigravity Platform Engineering Team

---

## Context
In accordance with [01-PRD-PRODUCTION.md](../01-PRD-PRODUCTION.md) (Section 3 & Release 3 Scope) and [07-RELEASE-PLAN.md](../07-RELEASE-PLAN.md), congregants require the capability to **Follow** (subscribe to) their local neighborhood or frequented mosques. 

When a followed mosque experiences high-impact operational events—specifically:
1. **Official Announcements** (`EMERGENCY_ALERT`, `GENERAL`, `JUMUAH_KHUTBAH`, `JANAZA_NOTICE`) posted by verified mosque staff (`F-022`).
2. **Prayer Schedule Adjustments** (updates to Waqt or daily Jamaat timings) (`F-007`).
3. **Verified Donation Channel Updates** (approval of verified bKash, Nagad, or Bank channels) (`F-030`).
4. **Upcoming Jamaat Countdown Reminders** (daily prayer notifications before Jamaat).

Followers must receive:
- **Durable In-App Notifications**: Stored in PostgreSQL with individual read/unread tracking, counter badges, and historical inbox retention.
- **Production-Grade Real-Time Delivery**: Instant WebSocket push to active browser tabs without requiring manual page refreshes or polling.

---

## Decision

### 1. Data Modeling & Fan-Out Architecture in PostgreSQL
1. **`MosqueFollower` Model**:
   - Represents the explicit subscription relation between an authenticated `User` and a `Mosque`.
   - Primary uniqueness constraint: `@@unique([userId, mosqueId])`.
   - Indexed on `[userId, createdAt]` and `[mosqueId, createdAt]` for sub-millisecond follower lookups and profile subscriber counts.
   - Deletion semantics: `Cascade` on Mosque deletion, `Cascade` on User deletion.

2. **Durable `UserNotification` Model (Fan-Out on Write)**:
   - Contains: `id`, `userId`, `mosqueId`, `type` (`ANNOUNCEMENT`, `SCHEDULE_CHANGE`, `DONATION_UPDATE`, `REMINDER`), `title`, `body`, `entityId`, `isRead` (boolean, default false), `readAt`, and `createdAt`.
   - Indexed on `[userId, isRead, createdAt]` to ensure `GET /notifications/unread-count` and `GET /notifications` execute in `< 5ms`.
   - Fan-out on write: When an event occurs at a mosque, the system queries all follower user IDs and batch-inserts (`prisma.userNotification.createMany`) individual notification rows within a single transactional boundary or bounded async task.

### 2. Real-Time Transport: NestJS WebSocket Gateway (Socket.io)
1. **Gateway Boundary**:
   - Implemented via `@nestjs/websockets` and `@nestjs/platform-socket.io` in `features/notifications/notifications.gateway.ts`.
   - Bound to namespace `/notifications`.
   - Handshake authentication: Client transmits Bearer JWT token in the connection handshake (`auth: { token: '...' }`). Unauthenticated connections are rejected with `UnauthorizedException`.
2. **Room Subscription Topology**:
   - **User Room (`user:<userId>`)**: On connection, the gateway automatically joins the client socket to `user:<userId>`. Direct notifications, unread count updates, and inbox events are pushed directly to this room.
   - **Mosque Rooms (`mosque:<mosqueId>`)**: For active broadcasts (e.g. emergency alerts), sockets join rooms corresponding to their followed mosques.
3. **Graceful Fallback**:
   - Socket.io engine supports standard HTTP long-polling fallback if WebSocket upgrades are blocked by client corporate firewalls.
   - All notifications are persisted in PostgreSQL first; if a socket is disconnected, the notification is delivered to the inbox upon the user's next visit.

### 3. REST API Contract & Unread Lifecycle
1. `POST /api/v1/mosques/:id/follow`: Idempotent follow/unfollow toggle or explicit subscribe.
2. `DELETE /api/v1/mosques/:id/follow`: Unfollow a mosque.
3. `GET /api/v1/mosques/followed`: Retrieve all mosques followed by the authenticated user.
4. `GET /api/v1/notifications`: Paginated list of user notifications.
5. `GET /api/v1/notifications/unread-count`: Returns `{ count: number }` for the Navbar badge.
6. `PATCH /api/v1/notifications/:id/read`: Marks a specific notification as read (`isRead: true, readAt: NOW`).
7. `PATCH /api/v1/notifications/read-all`: Batch updates all unread notifications for the user to read.

### 4. Client-Side Presentation (Ferio Design Standard)
1. **Navbar Notification Indicator**:
   - Bell icon with reactive unread badge (`bg-[#111114]` or red indicator).
   - Clicking opens the Ferio Notification Popover with 1-click "Mark all read" and links to the relevant mosque/announcement.
2. **Real-Time Toast Alert**:
   - Active users receive an unobtrusive toast notification when an announcement or schedule update is pushed via WebSocket.
3. **Follow CTA on Mosque Cards & Profile**:
   - Ferio pill button: `[+ Follow]` / `[✓ Following]` with follower count.
   - If an unauthenticated guest clicks, it triggers the `AuthModal` rather than failing silently.

---

## Consequences

### Positive
- **Instant Community Reach**: Announcements, emergency notices, and schedule updates are pushed in sub-second time to all active followers.
- **Reliable Offline Invariant**: Because notifications are durably stored in PostgreSQL before or concurrent with socket emission, offline users never miss alerts.
- **Zero Polling Load**: Eliminates periodic `setInterval` HTTP polling from client browsers, reducing database read pressure.
- **Production-Grade Isolation**: The Notifications module acts as an observer/subscriber to mosque events without tightly coupling into mosque domain logic.

### Tradeoffs & Mitigations
- **Large Fan-Out Latency**: If a national mosque has tens of thousands of followers, inserting rows synchronously could slow down the HTTP response of posting an announcement.
  - *Mitigation*: Fan-out writes are executed in chunked batches (batches of 1,000 via `prisma.userNotification.createMany`), keeping DB transaction locks minimal.
- **Stateful Socket Connections**: WebSockets maintain persistent TCP connections.
  - *Mitigation*: The gateway is lightweight, authenticated at handshake, and uses standard heartbeat ping/pong to prune zombie sockets.

---

## References
- Production PRD: `_doc/mosque-platform-production-docs/01-PRD-PRODUCTION.md` (Section 3 & 17)
- Release Plan: `_doc/mosque-platform-production-docs/07-RELEASE-PLAN.md` (Release 3)
- Announcements ADR: `_doc/mosque-platform-production-docs/ADRs/ADR-011-announcements.md`
- Donations ADR: `_doc/mosque-platform-production-docs/ADRs/ADR-012-mosque-donations.md`
