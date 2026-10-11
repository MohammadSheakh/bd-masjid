# ADR-061: Mobile Ramadan & Iftar / Sehri Fasting Countdown and Division Timetable Hub

## Status
Accepted

## Date
2026-10-10

## Context
During the holy month of Ramadan and voluntary fasting days (Sunnah / Ayyam al-Beed), millions of Bangladeshi worshippers rely on precise times for:
1. **Sehri (Suhoor)** ending time (Imsak / Fajr boundary).
2. **Iftar** time (Maghrib sunset boundary).
3. **Taraweeh** prayer jamat times and rak'ah schedules.
4. **Fasting Duas**: Authentic Sehri intention and Iftar breaking supplications in Arabic with Bangla phonetic transcription and meaning.

Geographically, Bangladesh spans approximately $4.5^\circ$ of longitude from eastern Sylhet/Chittagong to western Rajshahi/Khulna. Consequently, sunset and sunrise times vary across the 8 administrative divisions by up to $\pm 10$ minutes relative to the Dhaka Standard Time published by Islamic Foundation Bangladesh (ইসলামিক ফাউন্ডেশন বাংলাদেশ).

Musallis in rural or mobile environments experience cellular network dropouts during evening Iftar gatherings and pre-dawn Sehri hours. The mobile app must compute and display accurate fasting schedules and countdowns purely on-device without network dependency.

## Decision
We introduce a dedicated **Ramadan & Iftar / Sehri Fasting Countdown Hub** adhering to the following architectural contracts:

1. **Division Offset Matrix & Solar Geodesic Mapping**:
   - Canonical Dhaka baseline timetable for the 30 days of Ramadan.
   - Synchronous division delta offsets relative to Dhaka:
     - Sylhet: Sehri $-5$ min, Iftar $-5$ min
     - Chittagong: Sehri $-3$ min, Iftar $-4$ min
     - Mymensingh: Sehri $-2$ min, Iftar $-1$ min
     - Barishal: Sehri $+1$ min, Iftar $+0$ min
     - Khulna: Sehri $+5$ min, Iftar $+4$ min
     - Rajshahi: Sehri $+6$ min, Iftar $+6$ min
     - Rangpur: Sehri $+3$ min, Iftar $+5$ min
2. **Synchronous Fasting Countdown Engine (`RamadanService`)**:
   - Calculates real-time countdown to nearest target (Sehri end before dawn, or Iftar sunset during the day).
   - Provides synchronous zero-latency state for UI renders (`getFastingStatusSync()`).
   - Stores selected division preference in `PreferencesStorage` (`ramadan_selected_division`).
3. **Ferio Visual Aesthetics (`RamadanFastingModal.tsx`)**:
   - Dark hero countdown card (`#111114`) with emerald progress ring and amber fasting badges.
   - 8-Division selection pill selector.
   - Dua cards with tab toggle (Sehri Niyyat vs Iftar Dua) featuring Arabic calligraphy font, Bangla pronunciation, and Bengali translation.
   - 30-Day Ramadan timetable accordion table.
4. **Navbar & Feed Entry Point**:
   - Quick "🌙 রোজা / Iftar" trigger pill in the top action row of `App.tsx`.

## Consequences
- **Positive**: Provides instantaneous fasting countdowns for all 8 divisions in Bangladesh with 100% offline availability.
- **Positive**: Zero latency and zero background network calls during high-traffic pre-sunset hours.
- **Negative**: Division offsets represent mean regional averages; micro-subdivision adjustments require continuous synchronization when online.
