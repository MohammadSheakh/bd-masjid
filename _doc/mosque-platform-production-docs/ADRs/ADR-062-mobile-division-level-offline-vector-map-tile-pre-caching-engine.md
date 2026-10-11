# ADR-062: Mobile Division-Level Offline Vector Map Tile Pre-Caching Engine

## Status
Accepted

## Date
2026-10-10

## Context
Across Bangladesh, cellular coverage is frequently degraded during storms, load shedding, and inter-district highway travel. When worshippers travel to village ancestral homes or rural prayer grounds, interactive OpenStreetMap rendering suffers:
1. Blank, unrendered map tiles appear when connectivity is lost.
2. Background cellular network retries drain battery on budget low-end Android devices.
3. Musallis incur metered mobile data charges for repetitive map tile downloads.

To guarantee zero-latency map rendering in disconnected field operations, the mobile client requires a dedicated **Division-Level Offline Vector Map Tile Pre-Caching Engine**.

## Decision
We implement a division-bounded offline tile management pipeline conforming to:

1. **Bounding Box Taxonomy (`types/offlineMap.ts`)**:
   - Curated coordinate bounding boxes for all 8 Bangladeshi administrative divisions in WGS-84 coordinates:
     - Dhaka: `[89.70, 23.30, 90.90, 24.50]` (~18.4 MB)
     - Chittagong: `[91.30, 21.40, 92.70, 23.80]` (~24.2 MB)
     - Sylhet: `[91.20, 24.10, 92.50, 25.20]` (~14.1 MB)
     - Rajshahi: `[88.00, 24.10, 89.40, 25.10]` (~16.8 MB)
     - Khulna: `[88.90, 21.60, 89.90, 23.90]` (~17.5 MB)
     - Barishal: `[89.90, 21.80, 90.80, 23.10]` (~12.6 MB)
     - Rangpur: `[88.40, 25.20, 89.80, 26.60]` (~15.3 MB)
     - Mymensingh: `[89.60, 24.20, 90.80, 25.30]` (~11.9 MB)
2. **Synchronous Region Cache Engine (`OfflineMapRegionService`)**:
   - Synchronous inspection of cached divisions (`isRegionCachedSync(division)`) with zero UI render delay.
   - Storage usage tracking (total storage cap budget: 150 MB).
   - Resilient chunked tile download loop with exponential backoff on retry.
   - Persistent downloaded region state saved to `PreferencesStorage`.
3. **Ferio OfflineMapRegionsModal Sheet**:
   - Total offline cache storage gauge (`45.2 MB / 150 MB used`).
   - 8-Division cards with download button, animated progress bar, size badges, and 1-tap purge action.
   - 1-Tap entry point from `MosqueMapView.tsx` (offline map cache pill).

## Consequences
- **Positive**: 100% offline map panning and zooming across downloaded Bangladeshi divisions.
- **Positive**: Zero network consumption and fast hardware rendering on low-end Walton and Redmi handsets.
- **Negative**: Pre-caching requires user storage allocation (~12-25MB per division); strict 150MB budget ceiling prevents device storage exhaustion.
