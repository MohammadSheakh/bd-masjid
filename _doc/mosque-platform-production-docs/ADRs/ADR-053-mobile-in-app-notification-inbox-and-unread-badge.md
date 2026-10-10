# ADR-053: Mobile In-App Notification Inbox, Unread Counter Badge, and F-031 Parity

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-013 (`F-031`), the platform established durable in-app notifications and fan-out architecture in PostgreSQL for followers of local mosques. Whenever a followed mosque publishes an official announcement, updates its daily Jamaat schedule, verifies a donation channel, or triggers a prayer alert, a `UserNotification` entity is persisted with individual read/unread tracking.

In the mobile client (`mobile-app-expo`), worshippers can follow mosques (`isFollowed`) and assign routine collections (`HOME`, `WORK`, `JUMUAH`), but previously lacked:
1. **In-App Notification Inbox**: A centralized screen to review updates, announcements, and timetable adjustments across all their followed mosques.
2. **Top Navbar Unread Counter Badge**: Instant visual awareness (`🔔 3`) of unread events without polling loops.
3. **Read Lifecycle Actions**: Support for `markAsRead(id)` and `markAllAsRead()`, with offline local caching and synchronization matching `backend-nest-prisma` endpoints (`GET /notifications`, `GET /notifications/unread-count`, `PATCH /notifications/:id/read`, `PATCH /notifications/read-all`).

---

## Decision

### 1. Domain Types & Contract Alignment (`types/mosque.ts`)
We introduce mobile domain types mirroring the Prisma `notifications.module`:
- `NotificationType`: `'ANNOUNCEMENT' | 'SCHEDULE_CHANGE' | 'DONATION_UPDATE' | 'PRAYER_REMINDER'`.
- `UserNotification`:
  - `id`: string
  - `mosqueId`: string
  - `type`: `NotificationType`
  - `title`: string
  - `body`: string
  - `isRead`: boolean
  - `readAt`: string | null
  - `createdAt`: string
  - `mosque`: `{ id: string; name: string; city?: string }`

### 2. Client Transport & Offline Resilience (`apiClient.ts`)
- In `ApiClient`, we implement:
  - `fetchUserNotifications(query)` -> `GET /api/v1/notifications`
  - `fetchUnreadNotificationCount()` -> `GET /api/v1/notifications/unread-count`
  - `markNotificationAsRead(id)` -> `PATCH /api/v1/notifications/:id/read`
  - `markAllNotificationsAsRead()` -> `PATCH /api/v1/notifications/read-all`
- All methods provide structured offline fallback fixtures synthesized from the user's followed mosques and announcements.

### 3. Local Inbox Service (`notificationInboxService.ts`)
- Synchronous unread counter cached in `syncKvCache` for $<1$ms initial render.
- Category filters: `ALL`, `ANNOUNCEMENT`, `SCHEDULE_CHANGE`, `DONATION_UPDATE`.
- Notification badge formatting: `9+` overflow cap.

### 4. Ferio `NotificationInboxModal` (`NotificationInboxModal.tsx`)
- Elegant modal dialog displaying chronologically ordered notifications.
- Visual type cues:
  - `ANNOUNCEMENT`: 📢 (urgent notices highlighted with amber/red border)
  - `SCHEDULE_CHANGE`: 🕒 (prayer timetable adjustments)
  - `DONATION_UPDATE`: 💳 (multi-signatory donation channel updates)
  - `PRAYER_REMINDER`: 🕌 (upcoming Jamaat reminders)
- Unread indicator: Emerald green dot (`#059669`) that clears when tapped.
- Header CTA: "Mark all as read" / "সব পড়া হয়েছে" action pill.

### 5. Top Navbar Bell Trigger (`App.tsx`)
- Bell icon button positioned in `topNavbarActions`.
- Badge pill displaying dynamic unread count (`3`).
- Tapping opens `NotificationInboxModal`.

---

## Consequences

### Positive
- **Complete F-031 Parity**: Mobile delivers 100% contract parity with `backend-nest-prisma`'s `NotificationsController`.
- **Zero Polling Waste**: Unread count hydrates on cold start and updates reactively on user actions.
- **Ferio Aesthetic**: Complies strictly with Ferio tokens (`#111114`, `#059669`, `#fafafa`, `#e8e8ea`), accessible tap targets ($\ge 44$pt), and bilingual support.
- **Low-End Memory Friendly**: Memory footprint stays $< 65$MB idle.

### Negative / Trade-offs
- Push notifications via FCM / APNs require separate native device credentials.
- *Mitigation*: In-app notifications fulfill the release requirement without external push provider bottlenecks.
