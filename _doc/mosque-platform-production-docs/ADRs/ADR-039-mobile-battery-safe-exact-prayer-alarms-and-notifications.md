# ADR-039: Mobile Battery-Safe Exact Prayer Alarms and Actionable Notifications

## Status
Accepted

## Date
2026-10-10

## Context
Worshippers who follow local neighbourhood mosques need timely notifications before congregational prayer (Jamaat) begins so they have sufficient lead time to perform ablution (Wudu) and walk to the mosque before the opening Takbir (Takbeer-e-Tahreema).

However, scheduling notifications on mobile devices requires careful architectural considerations:
1. **Battery Consumption & Doze Mode Safety**: Scheduling alarms that keep the CPU awake continuously drains device battery. Notifications must use exact, wake-on-time triggers (`AlarmManager.setExactAndAllowWhileIdle` or platform notification channels) that consume 0% background battery when idle.
2. **Actionable Micro-Interactions**: Rather than passive alerts, notifications must offer 1-tap quick actions:
   - `View Timetable`: Opens the mosque detail bottom sheet directly to the daily timetable.
   - `Dismiss`: Immediately clears the notification without opening the application.
3. **Followed Mosque Scope**: Notifications are generated for the worshipper's followed mosques (`followedMosqueIds`) to avoid spamming alerts from unrelated venues.

## Decision

1. **10-Minute Pre-Jamaat Notification Offset**:
   - Notifications are calculated and scheduled 10 minutes prior to each of the 5 daily prayer Jamaats (Fajr, Zuhr, Asr, Maghrib, Isha) and Friday Jumu'ah.
   - The notification title highlights the mosque and waqt: e.g. *"Asr Jamaat in 10 minutes • Baitul Mukarram"*.
   - Body copy displays the exact Iqamah time: e.g. *"Jamaat starts at 4:45 PM. Make wudu and head to the prayer hall."*

2. **Interactive Action Pills**:
   - Action 1: `VIEW_TIMETABLE` (`"View Timetable"`) → deep-links to launch or focus the app and displays the target `MosqueDetailSheet`.
   - Action 2: `DISMISS` (`"Dismiss"`) → cleanly cancels the active notification.

3. **Notification Service Architecture (`prayerNotificationService.ts`)**:
   - Computes trigger timestamps using `parseTimeToMinutes` and today's date.
   - Reschedules the 24-hour cycle when schedules update or followed mosques change.
   - Cleanly coordinates with `autoSilentService.ts` so the pre-prayer alert fires 10 minutes prior, and the Auto-Silent engine silences the ringer right as Jamaat commences.

## Consequences

### Positive
- **High Utility for Musallis**: Provides punctual reminders so worshippers never arrive late for congregational prayers.
- **Zero Battery Waste**: Relies exclusively on platform-native exact triggers without long-running background tasks.
- **Ferio Visual Parity**: Notification text and action titles align with the platform's professional, respectful tone.

### Trade-offs
- Android 12+ requires `SCHEDULE_EXACT_ALARM` or user notification permission, which is gracefully requested on first toggle.
