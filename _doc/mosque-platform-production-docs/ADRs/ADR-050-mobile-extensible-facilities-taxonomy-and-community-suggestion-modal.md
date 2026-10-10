# ADR-050: Mobile Extensible Facilities Taxonomy and Dedicated Community Suggestion Modal

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In ADR-025, the platform established an extensible facility amenities taxonomy and a dedicated community facility suggestion workflow (`SuggestFacilitiesModal`) to avoid modal collision with prayer timetable corrections.

In the mobile client (`mobile-app-expo`), `MosqueDetailSheet` currently renders only a rudimentary 5-boolean facility grid with no visibility into:
1. Canonical accessibility & capacity parameters: total capacity, washroom count, separate wudu area, female capacity, wheelchair ramp, maktab.
2. Extensible `customAmenities String[]` (e.g. *Solar Power*, *Elevator / Lift*, *CCTV Surveillance*, *Chilled RO Drinking Water*, *Emergency Generator / IPS*, *Musafir Khana*, *Funeral Bath*).
3. A dedicated community suggestion mechanism for worshippers to contribute or update facility details directly from the mobile app without hijacking the prayer time update form.

---

## Decision

### 1. Extensible Facilities Taxonomy Service (`facilityService.ts`)
We establish a standardized mobile taxonomy service providing:
- A curated catalog of common Bangladeshi mosque amenities:
  - *Solar Power System*
  - *Elevator / Lift*
  - *CCTV Surveillance*
  - *Chilled RO Drinking Water*
  - *Emergency Generator / IPS*
  - *Guest Room / Musafir Khana*
  - *Funeral Bath / Ghusl Khana*
  - *Separate Women Wudu Area*
  - *Wheelchair Ramp*
  - *Islamic Library / Maktab*
- Canonical facility definitions with bilingual labels (Bangla / English) and accessibility icons.
- Payload sanitization and deduplication adhering to ADR-025 constraints ($\le 20$ custom items, max 50 chars each).

### 2. Ferio `FacilitiesCard` (`FacilitiesCard.tsx`)
We implement a dedicated, modular Ferio card for `MosqueDetailSheet`:
- **Header**: "Facilities & Amenities" title, capacity badge (`Capacity: 2,500`), and a "+ Suggest" action pill.
- **Canonical Grid**: Badges for separate wudu, female prayer space, wheelchair accessibility, air conditioning, parking, janaza services.
- **Custom Amenities Tags**: Subtle, elegant chip badges (`bg-[#fafafa] border-[#e8e8ea] text-[#111114]`) displaying active custom amenities.
- **Empty State**: Clear prompt inviting neighborhood contributors to add facility details.

### 3. Dedicated `SuggestFacilitiesModal` (`SuggestFacilitiesModal.tsx`)
- Separate bottom-sheet/modal dialog dedicated exclusively to facilities.
- Toggle switches for canonical amenities (Women's section, AC, Wheelchair, Separate Wudu, Generator/Solar, etc.).
- Tap-to-select catalog chips for popular Bangladeshi amenities.
- Dynamic custom tag entry allowing users to type and add emergent facilities.
- Submits payload to `POST /mosques/:id/suggestions` with `suggestedFacilities` object matching backend schema.
- Instant optimistic feedback and offline queueing.

---

## Consequences

### Positive
- **ADR-025 Parity**: Mobile users have 100% feature parity with the web platform's facilities catalog and suggestion flow.
- **Clean Information Architecture**: Prevents confusion between timetable updates and facility contributions.
- **Ferio Aesthetic**: Complies with typography, color tokens (`#111114`, `#059669`, `#fafafa`, `#e8e8ea`), and responsive touch targets ($\ge 44$pt).
- **Zero Heavy Dependencies**: Pure React Native components without extra bloat, staying well within low-end device memory limits ($< 65$MB idle).

### Negative / Trade-offs
- Network requests for suggestions require backend handling or fallback offline queueing when disconnected.
- *Mitigation*: The mobile `ApiClient` simulates immediate optimistic confirmation when in offline demo mode.
