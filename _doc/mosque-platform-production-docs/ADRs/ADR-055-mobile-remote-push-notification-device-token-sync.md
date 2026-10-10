# ADR-055: Mobile Remote Push Notification Device Token Sync & Background Delivery Pipeline

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-013 (`F-031`) and ADR-053, the platform established in-app notifications and inbox persistence in PostgreSQL for followed mosque events (urgent Janazah notices, Ramadan schedules, Jammat shift alerts, verified donations).

While `PrayerNotificationService` schedules deterministic local alarms on device using `@notifee/react-native`, external broadcast events initiated by mosque committees (e.g. sudden Janazah announcement or unexpected weather-related Jamaat postponement) occur asynchronously on the server. When the mobile app is backgrounded or terminated, worshippers cannot receive these updates without remote Push Notifications (Firebase Cloud Messaging on Android, Apple Push Notification service on iOS).

The backend NestJS service provides full device registration infrastructure at:
- `POST /users/devices/register`: Registers or updates FCM/APNs push tokens with device metadata (`fcmToken`, `deviceType`, `deviceName`, `deviceOsVersion`, `appVersion`).
- `GET /users/devices`: Returns active registered push devices for the authenticated session.
- `PUT /users/devices/:deviceId/push`: Toggles push alert reception for specific hardware.

---

## Decision

### 1. Push Registration Contract & Types (`types/device.ts`)
We introduce mobile domain types matching `backend-nest-prisma/src/features/user-management/userDevices/`:
- `DeviceType`: `'android' | 'ios' | 'web' | 'desktop'`.
- `RegisterDevicePayload`:
  - `fcmToken`: string
  - `deviceType`: DeviceType
  - `deviceName`: string
  - `deviceOsVersion`?: string
  - `appVersion`?: string
- `UserDevice`: `id`, `fcmToken`, `deviceType`, `deviceName`, `isActive`, `createdAt`.

### 2. Transport & Smart Fallback in `ApiClient`
- `registerUserDevice(payload: RegisterDevicePayload): Promise<UserDevice>`
- `fetchUserDevices(): Promise<UserDevice[]>`
- Outgoing calls attach Bearer JWT if user is authenticated; if guest, token is persisted locally until account creation/login, then seamlessly synchronized.

### 3. Dedicated `PushDeviceService` (`pushDeviceService.ts`)
- Manages hardware token retrieval and device hardware fingerprinting.
- Synchronous state cache in `syncKvCache` for registered status.
- Registers device token automatically whenever:
  1. The app boots with active connectivity.
  2. The worshipper logs in or registers via `AuthSessionModal`.
  3. The worshipper follows their first mosque or enables prayer notifications.

### 4. Ferio Notification Settings Sheet (`PushSettingsModal.tsx`)
- High-contrast modal sheet following Ferio visual tokens:
  - Master Push Notification toggle (`Enabled / Disabled`).
  - Active Device Card with hardware platform icon (🤖 Android / 🍏 iOS), device name, and push status green badge (`✓ Live Push Sync Active`).
  - Event Subscription toggles:
    - Urgent Janazah Notices (`Urgent Alerts`).
    - Jammat Time Changes (`Schedule Adjustments`).
    - Mosque Announcements & Eid Notices (`Community Updates`).

---

## Consequences

### Positive
- **Real-Time Critical Broadcasts**: Musallis receive Janazah notices and timetable changes immediately even when the app is completely closed.
- **Enterprise Traceability**: Exact hardware registration linked to the backend `userDevices` table with zero duplicate tokens.
- **Battery Efficient**: Eliminates wasteful client polling intervals.

### Verification Criteria
- TypeScript compiles cleanly (`npx tsc --noEmit`).
- Automated low-end hardware benchmark gate passes: Cold launch $< 1500$ ms, Heap $< 65$ MB, 60 FPS.
