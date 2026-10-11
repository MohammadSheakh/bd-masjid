# ADR-063: Mobile Live GPS Proximity Radar and Nearest Mosque Sorting Engine

## Status
Accepted

## Date
2026-10-10

## Context
When worshippers in Bangladesh arrive in unfamiliar areas (e.g. business districts, transit hubs like Farmgate, Motijheel, or unfamiliar upazilas) as prayer time approaches, their primary need is finding the physically nearest mosque for Jamaat before Iqamah starts.

Currently, the mobile feed displays mosques based on default catalog order or tag filters. While coordinates exist on each `Mosque` entity, worshippers do not see real-time walking/driving distances (e.g. `180m`, `1.4 km`) relative to their current GPS fix.

Calculating distances dynamically on every frame could cause battery drain and frame drops on budget handsets ($\le 3$GB RAM). The distance calculation must be optimized using the Haversine geodesic algorithm with distance memoization, threshold throttling, and a 1-tap "📍 Nearest / নিকটবর্তী" feed sort toggle.

## Decision
We implement a zero-latency proximity calculation and sorting engine adhering to:

1. **Haversine Geodesic Math (`services/locationRadarService.ts`)**:
   - Computes Great-Circle distance using Haversine formula:
     $$\Delta\sigma = 2 \arcsin \sqrt{\sin^2\left(\frac{\Delta\phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta\lambda}{2}\right)}$$
     $$d = R \cdot \Delta\sigma \quad (R = 6,371\text{ km})$$
   - Formats human-friendly bilingual distance tags:
     - Under $1,000$ meters: `180m` / `১৮০ মি.`
     - $1.0\text{ km}$ and above: `1.4 km` / `১.৪ কি.মি.`
2. **Synchronous Distance Provider (`LocationRadarService`)**:
   - Manages simulated/current user coordinate fix (`lat: 23.7314, lng: 90.4126` default Dhaka center).
   - Memoizes distances per mosque ID with coordinate change threshold gating ($\Delta > 20$ meters before recalculating).
   - Provides `getDistanceToMosqueSync(mosque: Mosque): number` ($< 0.01$ms lookup).
   - Sort helper: `sortMosquesByProximity(mosques: Mosque[]): Mosque[]`.
3. **Ferio Visual Tokens**:
   - `MosqueCard.tsx`: Emerald proximity badge (`📍 350m` / `📍 ৩৫০ মি.`) next to the mosque name.
   - `CollectionFilterBar.tsx` / Filter row: `📍 Nearest / নিকটবর্তী` toggle chip for instant feed sorting.

## Consequences
- **Positive**: Musallis can instantly locate the closest prayer space in seconds with clear walking distance cues.
- **Positive**: Memoized Haversine math executes in $< 0.05$ms for 100 mosques, maintaining 60 FPS scrolling on budget devices.
- **Negative**: Haversine measures straight-line distance ("as the crow flies") rather than street-level road turn-by-turn routing.
