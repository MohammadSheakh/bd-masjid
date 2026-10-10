# ADR-052: Mobile Categorized Mosque Collections and Custom Bookmarks

## Status
**Accepted**

## Date
2026-10-10

## Deciders
Antigravity Platform Engineering Team, Mohammad Sheakh

---

## Context
In Bangladeshi daily life, worshippers commonly interact with several distinct mosques depending on their routine:
1. **Home / Neighborhood Mosque** (*বাসা / মহল্লা*): Where Fajr, Maghrib, and Isha are performed.
2. **Workplace / Office Mosque** (*কর্মক্ষেত্র / অফিস*): Where Zuhr and Asr are prayed on workdays.
3. **Friday Jumu'ah Mosque** (*জুমুআ*): Frequented for Friday khutbah and large congregational prayer.
4. **Frequented / Saved Mosques** (*পছন্দের তালিকা*): Highway halts, historical mosques, or travel stations.

The mobile app previously only supported a single monolithic boolean follow state (`isFollowed: boolean`). Users had no way to categorize saved mosques, filter their feed by context (e.g. "Show only my Office mosques"), or quickly switch countdown context between their Home and Workplace prayer schedules.

---

## Decision

### 1. Categorized Collections Data Model (`collectionService.ts`)
We introduce structured collection tags:
- `HOME`: "Home / Neighborhood" (`বাসার মসজিদ`) — Icon 🏠
- `WORK`: "Workplace / Office" (`অফিসের মসজিদ`) — Icon 🏢
- `JUMUAH`: "Friday Jumu'ah" (`জুমুআর মসজিদ`) — Icon 🕌
- `FAVORITE`: "General Saved" (`সংরক্ষিত`) — Icon ⭐

### 2. Fast Synchronous Storage (`CollectionStorage`)
- Persisted locally in `syncKvCache` / MMKV under key `bd_masjid_collections_v1`.
- Serialized schema: `Record<string, MosqueCollectionTag[]>` mapping `mosqueId -> tags[]`.
- Synchronous reads guarantee zero hydration flash when opening the app.
- Backward compatibility: Existing `followedMosques` are automatically backfilled as `[FAVORITE]`.

### 3. Contextual Filter Bar (`CollectionFilterBar.tsx`)
- Placed beneath the search input in `App.tsx`:
  - `[All (সব)]` | `[🏠 Home]` | `[🏢 Work]` | `[🕌 Jumu'ah]` | `[⭐ Saved]`
- Tap activates instantaneous client-side list filtering without triggering network re-fetches.
- Active pill styled with Ferio emerald accent (`bg-[#ecfdf5] border-[#059669] text-[#059669]`).

### 4. Interactive Tag Assignment (`CollectionTagModal.tsx`)
- Accessible from both `MosqueCard` bookmark action and `MosqueDetailSheet`.
- Multi-select checkbox sheet allowing a single mosque to belong to multiple categories (e.g., both Home and Jumu'ah).
- Instant optimistic feedback and haptic confirmation.

---

## Consequences

### Positive
- **Real-World Musalli Alignment**: Perfectly matches the lived routine of commuting Bangladeshi worshippers.
- **Instantaneous Filtering**: Zero API latency for category switching.
- **Low-End Memory Compliant**: Tiny JSON payload (<2KB) preserved in memory, keeping idle footprint below 65MB.
- **Ferio Consistency**: Follows Ferio color tokens, micro-interactions, and accessible tap targets.

### Negative / Trade-offs
- Custom tags assigned on one mobile device remain local until synced to the user profile.
- *Mitigation*: Falls back to local storage and syncs to `POST /mosques/:id/follow` when authenticated.
