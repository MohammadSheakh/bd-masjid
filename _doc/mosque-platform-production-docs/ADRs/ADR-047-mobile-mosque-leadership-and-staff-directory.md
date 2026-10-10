# ADR-047: Mobile Mosque Leadership & Staff Directory

## Status
Accepted

## Context
Under ADR-009 and ADR-019, the BD Masjid backend and web application maintain structured mosque leadership rosters (`MosqueStaff` model, `GET /api/v1/mosques/:id/staff`). Community members need transparency into the verified officials who administer the mosque and lead congregation prayers:
1. **Religious Leadership**: Khatib (Friday sermons), Senior Pesh Imam (daily prayers), and Moazzin (Azan & Iqamah).
2. **Administrative Committee**: Mutawalli, President, and General Secretary.
3. **Contact Access**: Ability for congregants to directly contact mosque leadership for Nikah, Janaazah coordination, or emergency queries.

The mobile client requires an accessible Ferio component presenting verified staff cards with direct phone dialer actions (`Linking.openURL`), role categorization, and verified badges.

## Decision
1. **Domain & Role Taxonomy**:
   - Role classifications:
     - **Spiritual Leads**: `Khatib`, `Senior Pesh Imam`, `Imam` (Emerald badge `#ecfdf5` / `#059669`).
     - **Administrative Governance**: `Mutawalli`, `President`, `General Secretary` (Slate badge `#f3f4f6` / `#111114`).
     - **Call to Prayer**: `Moazzin` (Amber badge `#fffbeb` / `#d97706`).
   - Verified Staff Flag: Displays `✓ Verified` green badge only when corroborated by committee credentials.
2. **Interactive Dialing & Privacy Governance**:
   - For staff members with public contact numbers, render a 1-tap call button launching native phone dialer (`tel:${number}`).
   - Numbers are formatted clearly (e.g. `+880 1711-000001`).
3. **Component Architecture (`LeadershipRosterCard.tsx`)**:
   - Integrated directly into the `MosqueDetailSheet.tsx` scroll view.
   - Expandable card displaying staff list, tenure, roles, and quick-contact dialer pills.

## Consequences
- **Positive**: Immediate community transparency and trust for congregants.
- **Positive**: Direct 1-tap dialer simplifies Janaazah, Nikah, and Taraweeh scheduling inquiries.
- **Compliance**: Adheres strictly to Ferio design tokens with low memory overhead.
