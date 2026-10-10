# ADR-031: Mobile Gesture-Driven Mosque Detail Bottom Sheet and Governance Cards Architecture

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
When exploring mosques on mobile via the list feed or the interactive OpenStreetMap canvas, users require detailed information on demand:
1. **Full 5-Prayer Timetable + Seasonal Prayers**: Fajr, Sunrise, Zuhr, Asr, Maghrib, Isha, Jumu'ah, and Taraweeh/Tahajjud notices.
2. **Verified Staff Roster (ADR-009, ADR-024)**: Names, official positions (Imam, Khatib, Mutawalli, President), contact phone numbers, and verified green checkmarks.
3. **Verified Donation Channels (ADR-028)**: Direct mobile banking accounts (bKash, Nagad, Rocket, Bank accounts) with multi-signatory committee verification ticks (President, Secretary, Mutawalli) and 1-tap copy to clipboard.
4. **Mobile Usability & Context Preservation**: Navigating away to a completely separate full screen causes context loss (users lose their position on the map or list). A gesture-driven modal bottom sheet sliding over the existing viewport (`50%` and `90%` snap points) preserves context and enables fluid swipe-to-dismiss.

---

## Decision

The platform adopts:
1. **Gesture-Driven Detail Bottom Sheet**:
   - Modal bottom sheet with smooth drag handle and dual snap points: `50%` (compact timetable overview) and `90%` (expanded governance, staff roster, and donation channels).
   - Allows users to inspect details without destroying the underlying list scroll position or map camera state.
2. **Multi-Card Governance Layout**:
   - Avoids tab-switching friction by organizing information into spacious, vertical Ferio cards:
     - Card A: **Full Timetable Grid & Freshness Metadata**
     - Card B: **Verified Donation Channels with 1-Tap Copy & Provenance Ticks** (ADR-028)
     - Card C: **Verified Mosque Staff Roster** (ADR-024)
     - Card D: **Facilities & Capacity Summary** (ADR-025)
3. **Visual Parity**:
   - Strictly conforms to the Ferio visual language: `#111114` dark text/buttons, `#6e6e73` muted metadata, `#fafafa` interior cards, `#059669` emerald verified badges, and hairline borders.

---

## Consequences

### Positive
- **Fluid User Experience**: Natural native swipe gestures with zero screen transition lag.
- **Immediate Actionability**: 1-tap copy of bKash/Nagad donation numbers with native toast feedback increases community contributions.
- **Fraud Prevention**: Prominently highlights executive committee endorsement ticks for donation accounts, preventing donation fraud.

### Negative / Trade-offs
- Requires managing scroll lock between internal bottom sheet content and outer gesture pan handling.
