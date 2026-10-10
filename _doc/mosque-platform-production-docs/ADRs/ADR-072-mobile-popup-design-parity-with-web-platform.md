# ADR-072: Mobile Popup Design & Interaction Parity with Web Platform

## Status
Accepted

## Context
The web application (`frontend/`) has highly polished, accessible modals built with the Ferio design system for key mosque interactions:
1. **Mosque Details Modal** (`MosqueDetailModal.tsx`): Header, prayer times grid, musalli attendance affiliations, action toolbar, staff roster, and facilities.
2. **Add Mosque Modal** (`AddMosqueModal.tsx`): GPS coordinates, reverse geocoding address discovery, duplicate candidate check, and prayer time inputs.
3. **Claim Official Mosque Role Modal** (`RoleClaimModal.tsx`): Role selector (Imam, Khatib, Mutawalli, etc.), applicant details, credential/document upload, and terms.
4. **Donate Modal** (`DonationModal.tsx`): Registered bKash, Nagad, Rocket, and Bank transfer channels with copy buttons and submission form.
5. **Suggest Facilities Modal** (`SuggestFacilitiesModal.tsx`): Structured amenities selector (wudu, female space, ramp, AC, parking, library).

The mobile app (`mobile/`) utilizes the same backend API (`PORT=6733`) but had divergent layout arrangements in its sheets. The user requested 100% visual and functional parity between web and mobile popups, preserving the website untouched.

## Decision
1. **Responsive Modal Container**:
   - On mobile devices, present as a smooth bottom sheet with rounded top corners (`borderTopLeftRadius: 20`, `borderTopRightRadius: 20`), drag handle, and max height `92%`.
   - On tablets or web viewports, scale up to a centered card dialog matching desktop dimensions (`maxWidth: 640`, `borderRadius: 16`).
2. **Exact Visual & Section Parity**:
   - Replicate the exact typography, borders, badges, status colors, and card structures from `frontend/src/components/` into React Native components using Ferio tokens.
3. **Sequenced Delivery**:
   - Step 1: Mosque Details Popup (`MosqueDetailSheet.tsx`) & Add Mosque Popup (`AddMosqueSheet.tsx`).
   - Step 2: Claim Role Popup (`RoleClaimModal.tsx`), Donate Popup (`SuggestDonationMethodModal.tsx`), and Suggest Facilities Popup (`SuggestFacilitiesModal.tsx`).
4. **Backend Invariant Preservation**:
   - Share identical REST endpoints (`POST /mosques`, `POST /mosques/:id/bookmark`, `POST /mosques/:id/attendance`, `POST /claims`, `POST /donations`, `POST /facilities/suggestions`).

## Consequences
- **Positive**: Complete UI consistency across web and mobile platforms with zero code changes required in `frontend/`.
- **Compliance**: Follows Ferio design guidelines and passes low-end mobile memory/render benchmarks.
