---
id: F-025
name: Mosque Facilities & Capacity Available-Only Display & Ferio Governance
phase: 2
status: completed
depends_on:
  - F-004
  - F-021
blocks: []
parallel_with:
  - F-024
source:
  - 01-PRD-PRODUCTION.md#facilities-and-accessibility-taxonomy
  - 02-SYSTEM-ARCHITECTURE.md#facilities-domain
  - 03-DATA-API-CONTRACTS.md#facilities-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#facilities-taxonomy
---

# Feature Specification: Mosque Facilities & Capacity Available-Only Display & Ferio Governance

## 1. Overview

In initial versions of the mosque facilities display, freshly created mosques (which had no user-submitted facility record yet) suffered from two major usability and truthfulness issues:
1. **Misleading Schema Defaults**: Legacy columns on the `Mosque` table defaulted `hasWuduArea` to `true` and other amenities (`hasSeparateWomenSpace`, `hasAirConditioning`, `hasWheelchairAccess`, `hasJanazaFacility`) to `false`. These Postgres table defaults were treated as factual data, causing newly created mosques to display a false "Available" badge for Separate Wudu and false "Not Available" badges for other amenities.
2. **Clutter & Incongruous Dark Box**: A 10-item checklist rendered mostly as "Not Available" / "Not Reported", along with 4 capacity boxes displaying "Not Reported" and "N/A". In addition, dark theme classes (`dark:bg-neutral-900`) caused an aggressive pitch-black box inside the light Ferio modal.

This specification governs the **Available-Only Display Policy** and the **Ferio Empty State Governance** for facilities and capacity:
- Only capacity metrics that have actual positive numbers (`> 0`) reported are displayed. Unreported capacity fields are completely omitted rather than displaying "Not Reported" or "N/A".
- Only facility amenities that have been explicitly confirmed available (`true`) by a mosque admin, imam, committee member, or contributor are displayed. Unverified or absent amenities are not rendered as a negative checklist.
- When no facility or capacity information has been submitted for a mosque yet, an honest, single-card Ferio empty state is rendered with contextual actions: `Add Facilities & Capacity` for authorized staff, or `Suggest Facility Details` for general visitors.
- The design strictly adheres to the Ferio visual system: `#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`, white, hairline borders, and zero decorative gradients or pitch-black container clashes.

---

## 2. Business Invariants

1. **Zero False Positives or False Negatives**:
   - Schema column defaults on `Mosque` (`hasWuduArea @default(true)`, `hasSeparateWomenSpace @default(false)`) must never be used to declare amenities available or unavailable on mosques where no facility record has been submitted.
   - Authoritative facility state is sourced from the dedicated 1:1 `MosqueFacility` record (`mosque.facility`).

2. **Available-Only Filtering**:
   - **Capacity**: Total Musalli Capacity, Women's Capacity, Wudu Taps, and Washrooms are rendered if and only if their reported integer value is strictly `> 0`.
   - **Amenities**: An amenity is rendered if and only if its boolean value in `MosqueFacility` is strictly `true`.
   - If an amenity is `null`, `undefined`, or `false`, it is omitted from the available amenities list.

3. **Honest Empty State Governance**:
   - If both `capacityItems` and `availableAmenities` evaluate to empty (e.g. freshly created mosque), the UI must NOT show empty placeholders or checklists with "Not Available" / "Not Reported".
   - The UI must render a unified Ferio empty state card explaining that facilities have not been reported yet.
   - The empty state must provide an actionable path to contribute:
     - Mosque Admin / Staff (`canEdit`): `Add Facilities & Capacity` button opening `EditFacilitiesModal`.
     - General Viewer (`onOpenSuggestion`): `Suggest Facility Details` button opening `SuggestionModal`.

4. **Ferio Visual Compliance**:
   - Colors: `#111114` (text/primary), `#6e6e73` (subtext/muted), `#e8e8ea` (borders), `#fafafa` (light surface background), white (`#ffffff`).
   - Radii: `rounded-2xl` for containers, `rounded-xl` for inner metric tiles, `rounded-lg` for action buttons.
   - Status indicators: `text-emerald-700 bg-emerald-50 border border-emerald-200` with the `Check` icon.
   - Zero drop-shadows, zero glassmorphism, zero pitch-black container clashes inside the modal.

---

## 3. UI / Component Architecture

### Component Hierarchy

```
MosqueDetailModal (or standalone /mosques/[id]/page)
  └─ MosqueFacilitiesSection
       ├─ MosqueFacilitiesCard
       │    ├─ [When Empty]: Ferio Empty State Card + CTA (Edit or Suggest)
       │    └─ [When Populated]:
       │         ├─ Header (Title, Subtext, Edit / Suggest action)
       │         ├─ Capacity Grid (Only items > 0)
       │         └─ Available Amenities Grid (Only true amenities)
       └─ EditFacilitiesModal (Ferio-compliant dialog for staff)
```

### Affected Files

- `frontend/src/components/MosqueFacilitiesCard.tsx`
- `frontend/src/components/MosqueFacilitiesSection.tsx`
- `frontend/src/components/MosqueDetailModal.tsx`
- `frontend/src/components/EditFacilitiesModal.tsx`

---

## 4. Extracted Implementation Checklist

- [x] Eliminate legacy Prisma schema default fallback in `MosqueFacilitiesCard.tsx`.
- [x] Filter capacity items to only include positive numbers (`totalCapacity > 0`, `femaleCapacity > 0`, `wuduCapacity > 0`, `toiletCount > 0`).
- [x] Filter amenities to only render confirmed available items (`hasFemalePrayerSpace`, `hasSeparateWudu`, `hasAirConditioning`, `hasFan`, `hasWheelchairAccess`, `hasRamp`, `hasJanazaService`, `hasLibraryMaktab`, `hasParkingCar`, `hasParkingBike`).
- [x] Implement Ferio-standard empty state with `Building2` icon and role-aware CTA (`Add Facilities & Capacity` vs `Suggest Facility Details`).
- [x] Wire `onOpenSuggestion` prop from `MosqueDetailModal` through `MosqueFacilitiesSection` to `MosqueFacilitiesCard`.
- [x] Clean `EditFacilitiesModal.tsx` styling to strictly adhere to Ferio tokens (`#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`), removing outdated dark container classes.
- [x] Verify Next.js production build (`pnpm --dir frontend run build`) compiles with 0 errors.
- [x] Rebuild and verify Docker frontend container.

---

## 5. Implementation Slices & Proof of Completion

### TK-FAC-DISPLAY-01: Available-Only Facilities & Capacity Filter and Ferio Empty State
- **Status**: `[x] Completed`
- **Priority**: High
- **Files**:
  - `frontend/src/components/MosqueFacilitiesCard.tsx`
  - `frontend/src/components/MosqueFacilitiesSection.tsx`
  - `frontend/src/components/MosqueDetailModal.tsx`
  - `frontend/src/components/EditFacilitiesModal.tsx`
- **Verification Proof**:
  - Unreported freshly created mosques display the honest, single-card Ferio empty state.
  - No false "Available" wudu badge or false "Not Available" badges appear on new mosques.
  - Confirmed available facilities render cleanly with emerald status badges and detail strings (e.g. musalli / tap counts).
  - Next.js production build finished successfully with 0 TypeScript/Turbopack errors.
  - Rebuilt Docker frontend container (`docker compose up -d --build frontend`) healthy.
  - Verified live at `https://masjid.sheakh.qzz.io/`.
