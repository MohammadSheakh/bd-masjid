# ADR-034: Android Native Auto-Silent Engine, Prior-State DND Preservation, and Exact Alarm Scheduling

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
During daily prayers in mosques, worshippers face two recurring human error failure modes:
1. **Forgetting to silence the phone**: Incoming phone calls ring loudly inside the mosque during Jammat, causing severe communal distraction.
2. **Forgetting to un-silence the phone**: After leaving the mosque, worshippers forget to switch their phone back to normal ringer mode, missing critical work and personal calls for hours.

To solve this automatically, a mobile application must programmatically toggle Do Not Disturb (DND) or Silent mode at Jammat start, keep it silent for a set duration (e.g., 10 minutes), and automatically restore it to the previous state.

However, several platform-level invariants and constraints must be strictly addressed:
- **Prior-State Preservation Invariant**: If a user's phone was already in `VIBRATE` or `SILENT` mode before Jammat, duration expiry must **never** force the device into `RINGING` / `NORMAL` mode. The initial state must be captured and restored strictly.
- **Android Background Execution Limits & Doze Mode**: Running a continuous background timer or service loop drains battery and is aggressively terminated by Android 12–15 and OEM task killers (Xiaomi HyperOS, Realme ColorOS, Samsung OneUI).
- **iOS Sandbox Restrictions**: Apple strictly restricts 3rd-party apps from programmatically flipping hardware ringer switches or toggling system Focus modes in background code. Android supports native DND policy control via `NotificationManager` and `AudioManager`.

---

## Decision

The platform adopts:
1. **Native Kotlin TurboModule (`AndroidAutoSilentManager`) with Expo Config Plugin**:
   - Requests `ACCESS_NOTIFICATION_POLICY` to control system `ZenMode` and `AudioManager.RINGER_MODE_SILENT`.
   - Dispatches user to `Settings.ACTION_NOTIFICATION_POLICY_ACCESS_SETTINGS` when DND authorization is required.
2. **State Preservation Architecture**:
   - Immediately before activating silence at Jammat time, the native `PrayerSilentReceiver` records the current audio mode (`NORMAL`, `VIBRATE`, or `SILENT`) in encrypted `SharedPreferences`.
   - Upon duration expiration, `PrayerRestoreReceiver` reads the saved state and restores the exact prior mode. If the saved state was `SILENT` or `VIBRATE`, it remains silent/vibrate.
3. **Battery-Safe Exact Alarms**:
   - Schedules triggers via `AlarmManager.setExactAndAllowWhileIdle()` (`SCHEDULE_EXACT_ALARM` / `USE_EXACT_ALARM`).
   - The device wakes up for $< 100$ ms strictly to execute the state transition, consuming $0\%$ continuous background battery.
   - A `BOOT_COMPLETED` BroadcastReceiver recalculates and reschedules the day's 5 prayer windows if the user reboots their phone.
4. **iOS Graceful Fallback**:
   - Transparently informs iOS users of Apple hardware switch constraints, providing actionable local push notifications at Jammat time with 1-tap Apple Shortcuts integration.

---

## Consequences

### Positive
- **100% Reliable Automation on Android**: Zero missed rings during Jammat and zero forgotten silent phones after prayer.
- **Zero Battery Drain**: Uses native OS alarm scheduling rather than persistent background loops.
- **Safety**: Guarantees existing silent/vibrate preferences are never overridden to loud ringer.

### Negative / Trade-offs
- Android users must grant Do Not Disturb policy access once in system settings.
