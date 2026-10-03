---
id: F-036
name: Extensible Mosque Facility Amenities & Dedicated Community Suggestion Workflow
phase: 2
status: completed
depends_on:
  - F-004
  - F-006
  - F-021
  - F-025
blocks: []
parallel_with: []
source:
  - 01-PRD-PRODUCTION.md#6-mosque-profile
  - 02-SYSTEM-ARCHITECTURE.md#facilities-domain
  - 03-DATA-API-CONTRACTS.md#facilities-endpoints
  - 08-PRODUCTION-ENGINEERING-STANDARD.md#definition-of-done
  - ADRs/ADR-025-extensible-facility-amenities-taxonomy-and-dedicated-community-suggestion-modal.md
---

# Feature Specification: Extensible Mosque Facility Amenities & Dedicated Community Suggestion Workflow (F-036)

## 1. Overview

In previous platform releases, the mosque profile allowed viewing and editing standard facilities (capacity, women's prayer space, wudu, accessibility, AC/fans, janaza, parking, maktab). However:
1. **Suggestion Flow Collision**: Clicking `Suggest Facility Details` in `MosqueFacilitiesCard` incorrectly triggered the general timetable update modal (`SuggestionModal`), blocking musallis from submitting facility corrections.
2. **Fixed Taxonomy Limitation**: Mosques offering prominent modern or regional facilities (e.g. Solar Power/IPS, Elevator/Lift, CCTV surveillance, Chilled Filtered Water, Musafir Khana/Guest Rooms, Mortuary/Ghusl Khana) could not capture them.
3. **Dual Administrative & Community Parity**: The form for suggesting facility details should match the administrative facilities editor in structure, clarity, and visual aesthetics, while providing interactive controls to select existing amenities and dynamically create new custom options.

**F-026** delivers:
- Dedicated **`SuggestFacilitiesModal`** matching the Ferio administrative controls (`EditFacilitiesModal`).
- Extensible custom amenities (`customAmenities String[]`) in PostgreSQL/Prisma.
- Interactive multi-select and dynamic creation for additional amenities with chip management.
- Backend DTO validation and persistence for both administrative upsert and crowdsourced suggestions.
- Available-only profile presentation in `MosqueFacilitiesCard` for all confirmed custom amenities.

---

## 2. Business Invariants & Invariant Rules

1. **Dedicated Workflow Separation**:
   - The "Update Prayer Timetable" form (`SuggestionModal`) remains dedicated solely to prayer schedules.
   - Facility interactions (`Suggest Facility Details`, `Add Facilities & Capacity`, `Edit`) strictly route to facility-specific dialogs (`SuggestFacilitiesModal` for general users, `EditFacilitiesModal` for verified staff/admins).
2. **Sanitization of Custom Amenities**:
   - Each custom amenity string must be trimmed, non-empty, and limited to a maximum length of 50 characters.
   - Max 20 custom amenities per mosque to prevent UI overflow or malicious payload bloating.
   - Duplicates within a mosque record are deduplicated case-insensitively.
3. **Data Provenance & Authorization**:
   - Verified mosque administrators and platform staff write directly to canonical `MosqueFacility` via `PUT /api/v1/mosques/:id/facilities`.
   - General visitors submit suggestions via `POST /api/v1/mosques/:id/suggestions` with `suggestedFacilities` payload. If the submitting user is an authenticated verified administrator of that mosque, changes can be saved immediately.
4. **Ferio Visual Compliance**:
   - Strictly utilizes the Ferio palette (`#111114`, `#6e6e73`, `#e8e8ea`, `#fafafa`, white).
   - Custom amenity chips feature active and dismissible states with accessible keyboard navigation.

---

## 3. Data Model Reference

### 3.1 Prisma Schema (`MosqueFacility`)
```prisma
model MosqueFacility {
  // ... existing fields
  customAmenities       String[]  @default([])
  // ...
}
```

### 3.2 Prisma Schema (`MosqueSuggestion`)
```prisma
model MosqueSuggestion {
  // ... existing fields
  suggestedFacilities  Json?
  // ...
}
```

---

## 4. Implementation Slices & Proof of Completion

### TK-FAC-01: Backend Schema & DTO Extension
- **Status**: `[x] Completed`
- **Description**: Add `customAmenities` to `MosqueFacility` and `suggestedFacilities` to `MosqueSuggestion`. Update DTOs, service logic, and unit tests.
- **Implementation Files**:
  - Schema: `backend-nest-prisma/prisma/schema/facilities.module/facilities.prisma`
  - DTOs: `backend-nest-prisma/src/features/facilities/dto/upsert-facility.dto.ts`
  - Service: `backend-nest-prisma/src/features/facilities/facilities.service.ts`
  - Tests: `backend-nest-prisma/src/features/facilities/test/facilities.service.spec.ts`

### TK-FAC-02: Frontend Facility Suggestion & Custom Amenity Selector
- **Status**: `[x] Completed`
- **Description**: Build `SuggestFacilitiesModal` matching admin structure with existing checklist and "create new option" support. Update `EditFacilitiesModal` and `MosqueFacilitiesCard`.
- **Implementation Files**:
  - Modal: `frontend/src/components/SuggestFacilitiesModal.tsx`
  - Selector: `frontend/src/components/CustomAmenitiesSelector.tsx`
  - Modal: `frontend/src/components/EditFacilitiesModal.tsx`
  - Card: `frontend/src/components/MosqueFacilitiesCard.tsx`
  - Section: `frontend/src/components/MosqueFacilitiesSection.tsx`
  - Section: `frontend/src/components/MosqueFacilitiesSection.tsx`
