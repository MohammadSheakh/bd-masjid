# ADR-049: Mobile Daily Authentic Hadith & Prayer Reflection Digest

## Status
Accepted

## Context
Community musallis frequent the BD Masjid mobile application multiple times a day to check upcoming Jamaat times, Qibla direction, and mosque notices. Presenting an authentic, uplifting Hadith or prayer reflection strengthens the spiritual purpose of the application.

To preserve theological authenticity and high trust:
1. **Strict Sahih / Hasan Sourcing**: Only rigorously authenticated Hadiths from primary canonical collections (Sahih al-Bukhari, Sahih Muslim, Sunan Abi Dawud, Jami` at-Tirmidhi, Riyad as-Salihin) are presented, complete with exact book and number citations.
2. **Bilingual Accessibility**: Every reflection includes clear Arabic script, Bengali translation (for Bangladeshi musallis), and English translation.
3. **Feed Performance & Ergonomics**: The card must be lightweight, work 100% offline without network roundtrips, support collapsible minimization for users seeking a compact view, and remember collapse preference in `PreferencesStorage`.

## Decision
1. **Deterministic Daily Rotation Algorithm**:
   - Instead of randomized loading, the daily Hadith is selected deterministically from the calendar day of the year (`dayOfYear % hadithCollection.length`).
   - Ensures all users across Bangladesh read the same authentic Hadith on any given day.
2. **Ferio Visual Aesthetics (`DailyHadithCard.tsx`)**:
   - Bordered surface card placed cleanly below the Prayer Countdown Banner in the feed header.
   - Arabic calligraphy text styling with elegant typography.
   - Bangla & English translations matching the active language preference (`LocalizationService.getLanguage()`).
   - Authentic citation badge (`Sahih al-Bukhari 645`, `Sahih Muslim 654`).
   - 1-tap native share button (`🔗 Share Hadith`).
3. **Collapsible State Memory**:
   - Users can collapse the card to a 1-line strip (`📖 আজকের হাদিস / Daily Hadith • Tap to expand`).
   - Collapse preference persists in synchronous tiered storage.

## Consequences
- **Positive**: Enriching daily spiritual experience for congregants without network data consumption.
- **Positive**: Strict canonical citations ensure theological accuracy and community trust.
- **Compliance**: Integrates seamlessly with Ferio visual system and bilingual localization engine.
