---
id: F-072
name: Mobile Popup Design & Interaction Parity
phase: 2
status: completed

depends_on:
  - F-004
  - F-071

blocks: []

parallel_with: []

source:
  - 01-PRD-PRODUCTION.md#interactive-map
  - 01-PRD-PRODUCTION.md#core-mosque-registry
  - 03-DATA-API-CONTRACTS.md#mosque-endpoints
  - 06-IMPLEMENTATION-CHECKLIST.md#v-mobile-popup-design-parity
---

# Feature Specification: Mobile Popup Design & Interaction Parity

## 1. Overview
Translate the exact visual hierarchy, component layout, and interactive states of the web platform's popups (Mosque Details, Add Mosque, Claim Role, Donate, and Suggest Facilities) into the mobile Expo application without modifying the website.

## 2. Invariants
1. **Unmodified Web Application**: `frontend/` source code must remain 100% intact.
2. **Unified Data Schema**: Mobile forms must submit identical data structures to backend REST endpoints.
3. **Responsive Presentation**: Modals appear as bottom sheets on phones and centered dialogs on wider viewports.
4. **Accessible Elements**: Form inputs include labels, placeholder contrasts, and clear tap feedback.

## 3. Implementation Matrix
| Popup Name | Web Component Reference | Mobile Target Component | Status |
| :--- | :--- | :--- | :--- |
| **Mosque Details** | `frontend/src/components/MosqueDetailModal.tsx` | `mobile/src/components/MosqueDetailSheet.tsx` | Completed |
| **Add Mosque** | `frontend/src/components/AddMosqueModal.tsx` | `mobile/src/components/AddMosqueSheet.tsx` | Completed |
| **Claim Role** | `frontend/src/components/RoleClaimModal.tsx` | `mobile/src/components/RoleClaimModal.tsx` | Completed |
| **Donate** | `frontend/src/components/DonationModal.tsx` | `mobile/src/components/SuggestDonationMethodModal.tsx` | Completed |
| **Suggest Facilities** | `frontend/src/components/SuggestFacilitiesModal.tsx` | `mobile/src/components/SuggestFacilitiesModal.tsx` | Completed |
