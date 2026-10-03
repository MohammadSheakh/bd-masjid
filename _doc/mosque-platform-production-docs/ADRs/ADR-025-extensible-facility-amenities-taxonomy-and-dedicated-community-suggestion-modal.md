# ADR-025: Extensible Facility Amenities Taxonomy and Dedicated Community Suggestion Workflow

## Status
**Accepted**

## Date
2026-10-03

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-010 (`F-021`), the platform established an authoritative `MosqueFacility` relational entity in PostgreSQL/PostGIS covering primary architectural and accessibility taxonomy: total capacity, washrooms, separate wudu, women's prayer space, wheelchair accessibility, entrance ramps, air conditioning, fans, janaza staging, parking, and maktab.

However, two critical operational and product design gaps emerged:
1. **Modal Collision & Missing Dedicated Facility Suggestion Workflow**:
   In `MosqueFacilitiesCard` and `MosqueDetailModal`, the CTA button `Suggest Facility Details` erroneously triggered the general `onOpenSuggestion` callback, which opened the "Update Prayer Timetable" modal (`SuggestionModal`). Community visitors attempting to contribute facility details were presented with prayer time inputs instead of facility inputs.
2. **Schema Rigidity & Emergent Amenities**:
   Mosques across Bangladesh frequently offer additional high-impact amenities that were omitted from the fixed relational columns—such as solar power systems, IPS/generators, CCTV security, chilled drinking water filters, elevators/lifts, guest rooms (musafir khana), and dedicated funeral ghusl areas. In ADR-010, the rigid relational schema was acknowledged as a tradeoff. There was no mechanism for mosque administrators or worshippers to select or create novel amenity options dynamically.

---

## Decision

### 1. Dedicated Community Facility Suggestion Modal (`SuggestFacilitiesModal`)
- General worshippers and neighborhood contributors clicking `Suggest Facility Details` or `Suggest Update` on the facilities card are presented with a dedicated Ferio modal mirroring the verified administrative controls.
- The existing "Update Prayer Timetable" form (`SuggestionModal`) remains completely untouched and dedicated exclusively to congregational Jamaat times.
- Suggestions are transmitted via `POST /api/v1/mosques/:id/suggestions` with structured `suggestedFacilities` payload and an optional provenance description.

### 2. Extensible Custom Amenities Array (`customAmenities String[]`)
- We extend `MosqueFacility` in PostgreSQL/Prisma with a native string array: `customAmenities String[] @default([])`.
- Both the admin modal (`EditFacilitiesModal`) and community modal (`SuggestFacilitiesModal`) allow actors to:
  - Select from a curated catalog of common Bangladeshi mosque amenities (e.g. *Solar Power*, *Elevator / Lift*, *CCTV Surveillance*, *Chilled RO Drinking Water*, *Guest Room / Musafir Khana*, *Funeral Bath / Ghusl Khana*, *Emergency Generator / IPS*).
  - Dynamically create new facility options by typing an amenity label and adding it as an active chip.
- Custom amenities are sanitized (trimmed, deduplicated, max length 50 characters per item, max 20 custom items per mosque) to protect against UI distortion and storage abuse.

### 3. Display Governance on Mosque Profile
- In accordance with ADR-025 and F-025 (Available-Only Display Policy), any active `customAmenities` are rendered seamlessly in `MosqueFacilitiesCard` as verified or reported amenity tags with standard Ferio styling (`text-[#111114] bg-[#fafafa] border border-[#e8e8ea]`).

---

## Consequences

### Positive
- **Clear Information Architecture**: Facility suggestions and timetable updates are cleanly separated into dedicated workflows.
- **Dynamic Extensibility Without Database Migration Churn**: Communities can document emerging amenities without requiring a new database schema migration for each new facility type.
- **Ferio Consistency**: Both admin management and community suggestion interfaces share an identical, intuitive design language.

### Negative / Trade-offs
- Custom text strings in `customAmenities` are not indexed with dedicated PostGIS spatial B-trees, unlike first-class columns (`hasFemalePrayerSpace`, `hasWheelchairAccess`). 
- *Mitigation*: Core spatial filters in `api/v1/mosques/nearby` continue to rely on canonical indexed boolean flags; custom amenities serve as rich qualitative profile data and keyword search targets.
