# ADR-023: Map Viewport All Listed Mosques with Differentiated Followed Marker Hierarchy

## Status
Accepted

## Date
2026-10-03

## Context
In ADR-022, the homepage list feed was prioritized to display followed/bookmarked mosques by default while switching to search results upon query or filter activation.

However, spatial map browsing serves an exploratory geographical context where users need to perceive the complete mosque landscape around them. Restricting the map canvas exclusively to followed mosques artificially hides nearby mosques in the neighborhood and disrupts geographic discovery. 

Simultaneously, users must be able to visually distinguish mosques they actively attend and follow from general listed mosques without cluttering the map.

## Decision
We establish a **Unified Map Coverage with Differentiated Marker Visual Hierarchy**:

1. **Comprehensive Spatial Presence**:
   - The interactive map (`MosqueMap`) displays **all listed mosques** in the active spatial query / viewport, ensuring full geographic visibility.
   - Any followed mosques outside the immediate proximity bounds are also merged into the map dataset so that followed venues remain accessible.

2. **Differentiated Marker Hierarchy**:
   - **Followed Mosques (Regular Size)**: Rendered at regular size (34px × 34px, 14px mosque glyph), dark `#111114` rounded pill with white border, and higher `zIndexOffset` (50) to elevate them above general pins.
   - **Non-Followed Mosques (Smaller Size)**: Rendered at a compact, smaller size (22px × 22px, 9px mosque glyph), `#27272a` zinc tone with clean border, and standard `zIndexOffset` (10).
   - **Selected / Active Mosque**: Highlighted in emerald green (`#059669`) with active focus elevation (`zIndexOffset` 1000).

3. **Instant Reactive Sizing**:
   - Following or unfollowing a mosque updates `bookmarkedIds` in client state, immediately toggling the marker between regular and smaller size without requiring map reload.

4. **Preserved Feed and Controls Invariants**:
   - The list feed behavior (followed mosques default with search fallback) and all UI controls (search input, city pills, facility chips) remain unchanged.

## Consequences

### Positive
- **Optimal Spatial Discovery**: Users see the entire mosque ecosystem in their neighborhood while retaining strong visual cues for their followed mosques.
- **Visual Clarity**: Smaller non-followed markers prevent map overcrowding in dense metropolitan zones like Dhaka and Chattogram.
- **Zero Confusion**: Clear distinction between personal followed mosques and community listings.

### Negative / Trade-offs
- Rendering all listed markers introduces more DOM nodes in Leaflet, which is kept performant using lightweight `L.divIcon` HTML elements and clean LayerGroups.
