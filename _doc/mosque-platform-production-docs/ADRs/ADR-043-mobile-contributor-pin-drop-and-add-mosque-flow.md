# ADR-043: Mobile Contributor Pin-Drop, Duplicate Prevention, and Add Mosque Sheet Architecture

## Status
Accepted

## Date
2026-10-10

## Context
Crowdsourced mosque discovery across Bangladesh requires enabling worshippers, travelers, and community volunteers to map unlisted mosques directly from their smartphones.

However, uncoordinated crowdsourcing introduces data quality hazards:
1. **Accidental Duplicate Mosque Listings**: Users standing in front of an existing mosque might create a second duplicate record rather than updating the timetable, polluting the spatial index.
2. **High Interaction Friction**: Mobile forms with dozens of simultaneous fields cause high drop-off rates on touchscreen devices.
3. **Inaccurate Geolocation Coordinates**: Manual latitude/longitude text entry is error-prone; coordinates must be visually confirmed on the map canvas.

## Decision

1. **Multi-Step Guided Sheet (`AddMosqueSheet.tsx`)**:
   - Step 1: **Location Confirmation & Proximity Duplicate Check**:
     - Visual coordinate display derived directly from the user's tapped map pin or current GPS location.
     - Real-time client-side proximity check against nearby listed mosques. If any existing mosque lies within 150 meters, display an alert badge: *"A mosque already exists within 150m. Verify you are not creating a duplicate."*
   - Step 2: **Identity & Congregational Schedule**:
     - Mosque name (required), street address, city, and initial 5 Jammat times (Fajr, Zuhr, Asr, Maghrib, Isha, Jumu'ah).
   - Step 3: **Facilities & Submission**:
     - Facility toggle chips: *Air Conditioned*, *Dedicated Women's Area*, *Parking*, *Wheelchair Access*.
     - Final preview and "Submit Mosque" action.

2. **Optimistic Local Ingestion & Backend POST**:
   - Submitting immediately inserts the newly created mosque into local fixtures/cache so the contributor instantly sees their dropped pin highlighted on the map.
   - Dispatches `ApiClient.createMosque(payload)` to `POST /api/v1/mosques` with Bearer auth token if authenticated.

3. **Ferio Visual Aesthetics**:
   - Multi-step progress indicator (`Step 1 of 3`).
   - Clean 12px card borders (`#e8e8ea`), emerald accent buttons (`#059669`), and 44px touch targets conforming to `.agents/skills/ferio-frontend-design/SKILL.md`.

## Consequences

### Positive
- **High Contributor Engagement**: Intuitive 3-step progressive disclosure minimizes cognitive load.
- **Zero Duplicate Clutter**: Proximity detection prevents duplicate entries before they touch the server.
- **Immediate Spatial Gratification**: Worshippers see their newly mapped mosque on the map immediately.

### Trade-offs
- Offline submissions queue in local cache until cellular connection is restored.
