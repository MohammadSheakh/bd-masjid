# ADR-037: Mobile OEM Battery Optimization Mitigation Wizard Architecture

## Status
Accepted

## Date
2026-10-10

## Context
Aggressive Android Original Equipment Manufacturer (OEM) battery management—most notably Xiaomi (MIUI / HyperOS), Samsung (OneUI / Device Care), and Realme / Oppo / OnePlus (ColorOS / OxygenOS)—frequently terminates background processes and delays or suppresses exact alarms scheduled via `AlarmManager` when the device enters deep sleep (Doze mode).

For the BD Masjid mobile application, users rely on timely 5-daily prayer **Auto-Silent automation** and pre-Jamaat notifications. If an OEM battery killer suppresses the silent or restore alarms:
1. The user's phone may ring during congregational prayer in the mosque, causing public disruption.
2. The restore alarm may fail to fire, leaving the user's phone stuck in silent mode after prayer.

Because standard stock Android behavior differs significantly from OEM skins, users require clear, manufacturer-specific guidance with direct 1-tap deep links into system battery and autostart settings.

## Decision

1. **Automatic OEM Manufacturer Detection**:
   - Detect device brand via `Platform.constants['Brand']` or `Platform.constants['Manufacturer']` (`xiaomi`, `redmi`, `samsung`, `realme`, `oppo`, `vivo`, `huawei`).
   - Map each brand to tailored, actionable guidance:
     - **Xiaomi / Redmi (HyperOS / MIUI)**: Set battery saver to *"No restrictions"* and enable *"Autostart"*.
     - **Samsung (OneUI)**: Add BD Masjid to *"Never sleeping apps"* and disable battery optimization.
     - **Realme / Oppo / OnePlus (ColorOS)**: Allow *"Background activity"* and toggle off *"Deep optimization"*.
     - **Generic Android**: Direct link to `Settings.ACTION_IGNORE_BATTERY_OPTIMIZATION_SETTINGS` or Application Details.

2. **Direct Intent Dispatch (`oemBatteryService.ts`)**:
   - Provide direct 1-tap action button launching `Intent` to the manufacturer's exact battery settings page (or falling back safely to app settings `android.settings.APPLICATION_DETAILS_SETTINGS` via React Native `Linking.openSettings()`).

3. **Contextual Educational Trigger (`OemBatteryWizardModal.tsx`)**:
   - Display modal contextually when the worshipper first enables Auto-Silent or prayer reminders.
   - Persist flag `bd_masjid_oem_wizard_dismissed` in `PreferencesStorage` so the wizard is shown only once and does not annoy users.
   - Ferio Visual System styling: Clean dark badge, manufacturer icon, step-by-step checklist, and high-contrast pill actions.

## Consequences

### Positive
- **Guaranteed Alarm Reliability**: Prevents OEM task killers from dropping background silent/restore alarms.
- **Empowered Users**: Clear, step-by-step guidance tailored to their specific phone brand rather than generic instructions.
- **Enterprise Polish**: Seamless integration adhering to Ferio visual tokens.

### Trade-offs
- OEM settings paths can vary between OS sub-versions (e.g. MIUI 14 vs HyperOS 2.0); robust fallback to standard App Info settings prevents any crashing.
