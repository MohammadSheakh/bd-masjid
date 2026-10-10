# ADR-048: Mobile Bilingual Localization & Musalli Terminology

## Status
Accepted

## Context
The overwhelming majority of musallis and mosque attendees in Bangladesh communicate in Bengali (বাংলা). Standard English UI labels ("Auto-Silent", "Prayer Countdown", "Air Conditioned", "Khatib") can present friction for community congregants, particularly elderly worshipers.

Furthermore, prayer schedules and Islamic community features in Bangladesh have deep cultural and religious conventions:
- **Waqt Names**: ফজর (Fajr), যোহর (Zuhr), আসর (Asr), মাগরিব (Maghrib), এশা (Isha), জুমু'আ (Jumu'ah).
- **Prayer Timetable Concepts**: জামাত (Jamaat), ওয়াক্ত শুরু (Start Time), সেহরি শেষ (Sehri End), ইফতার (Iftar).
- **Core Platform Modules**: অটো-সাইলেন্ট (Auto-Silent), কিবলা কম্পাস (Qibla Compass), অনুদান (Donations), নোটিশ বোর্ড (Notice Board), নেতৃত্ব ও ইমাম (Leadership & Imams).

The mobile client requires a zero-latency, offline-first bilingual localization engine supporting instantaneous toggling between English and Bangla without app reload or network dependency.

## Decision
1. **Type-Safe In-Memory Localization Dictionary (`localizationService.ts`)**:
   - Centralized dictionary covering all UI labels, prayer waqts, error strings, and status chips.
   - Synchronous fallback: Default to Bangla (`'bn'`) for Bangladesh locale, with 1-tap English (`'en'`) override.
2. **Instant 1-Tap Toggle Pill in Top Navbar**:
   - Compact Ferio pill (`বাং | EN`) directly in the header of `App.tsx`.
   - Persists synchronously to `PreferencesStorage` (`bd_masjid_lang_pref`).
   - Re-renders all screens instantaneously without restarting the Hermes JavaScript runtime.
3. **Bangla Numeral & Time Adaptation**:
   - Provides optional Bangla numeral converter (`123` $\to$ `১২৩`) for timetable hours, minutes, and distance metrics.

## Consequences
- **Positive**: Immediate accessibility for hundreds of thousands of native Bengali speakers across all Bangladesh districts.
- **Positive**: Zero performance penalty; operates in-memory with $< 10\text{ KB}$ dictionary size.
- **Compliance**: Follows Ferio design typography and tabular-num layout guidelines.
