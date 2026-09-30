# Feature Specifications & Implementation Proof Matrix

This directory contains the feature-wise specifications extracted from the [Production PRD](../01-PRD-PRODUCTION.md) and [Implementation Checklist](../06-IMPLEMENTATION-CHECKLIST.md).

Each feature has a dedicated, self-contained specification file (`<feature>.md`) that embeds agentic frontmatter metadata, business invariants, API contracts, and **Implementation Slices & Proof of Completion** (acceptance criteria, concrete code file links, and verification status) in one unified place.

## Master Feature & Proof Index

| ID | Feature Name | Specification | Embedded Work Slices / Proof | Depends On | Phase | Status |
| :--- | :--- | :--- | :--- | :--- | :--- | :--- |
| **F-001** | Database Architecture & Migrations | [database-migrations.md](database-migrations/database-migrations.md) | [TK-DB-01](database-migrations/database-migrations.md#tk-db-01-modular-prisma-schema-builder--postgis-migrations) | *(None)* | 1 | `[x] Completed` |
| **F-002** | Authentication & Credential Security | [authentication-security.md](authentication-security/authentication-security.md) | [TK-AUTH-01](authentication-security/authentication-security.md#tk-auth-01-authentication-service--jwt-tokens), [TK-AUTH-02](authentication-security/authentication-security.md#tk-auth-02-2fa--brute-force-lockout-defense) | `F-001` | 1 | `[x] Completed` |
| **F-003** | Authorization & RBAC | [authorization-rbac.md](authorization-rbac/authorization-rbac.md) | [TK-RBAC-01](authorization-rbac/authorization-rbac.md#tk-rbac-01-permissions-guard--server-actor-derivation) | `F-001, F-002` | 1 | `[x] Completed` |
| **F-004** | Mosque Registry & Creation | [mosques-registry.md](mosques-registry/mosques-registry.md) | [TK-MOSQ-01](mosques-registry/mosques-registry.md#tk-mosq-01-mosque-database-schema--spatial-indexing), [TK-MOSQ-02](mosques-registry/mosques-registry.md#tk-mosq-02-mosque-creation--duplicate-detection-api), [TK-MOSQ-03](mosques-registry/mosques-registry.md#tk-mosq-03-mosque-profile-endpoint--standalone-page), [TK-MOSQ-04](mosques-registry/mosques-registry.md#tk-mosq-04-add-mosque-modal--pin-drop-ui) | `F-001` | 1 | `[x] Completed` |
| **F-005** | Nearby Discovery & Search | [nearby-search.md](nearby-search/nearby-search.md) | [TK-SRCH-01](nearby-search/nearby-search.md#tk-srch-01-postgis-spherical-radial-search-api), [TK-SRCH-02](nearby-search/nearby-search.md#tk-srch-02-text-search--multi-criteria-filtering), [TK-SRCH-03](nearby-search/nearby-search.md#tk-srch-03-frontend-search-bar--realtime-filtering) | `F-001, F-004` | 1 | `[x] Completed` |
| **F-006** | Crowdsourced Suggestions & Reports | [suggestions-reports.md](suggestions-reports/suggestions-reports.md) | [TK-SUGG-01](suggestions-reports/suggestions-reports.md#tk-sugg-01-suggestions--reports-persistence-api), [TK-SUGG-02](suggestions-reports/suggestions-reports.md#tk-sugg-02-suggestion--report-frontend-modals) | `F-001, F-004` | 1 | `[x] Completed` |
| **F-007** | Prayer Schedules & History | [prayer-schedules.md](prayer-schedules/prayer-schedules.md) | [TK-PRAY-01](prayer-schedules/prayer-schedules.md#tk-pray-01-prayer-schedule-schema--history-tracking), [TK-PRAY-02](prayer-schedules/prayer-schedules.md#tk-pray-02-atomic-update--rollback-service-api), [TK-PRAY-03](prayer-schedules/prayer-schedules.md#tk-pray-03-live-prayer-countdown--display-banner) | `F-001, F-004` | 1 | `[x] Completed` |
| **F-008** | Mosque Attendance Tracking | [attendance-tracking.md](attendance-tracking/attendance-tracking.md) | [TK-ATTN-01](attendance-tracking/attendance-tracking.md#tk-attn-01-attendance-schema--idempotent-service), [TK-ATTN-02](attendance-tracking/attendance-tracking.md#tk-attn-02-attendance-ui-toggle--aggregate-badge) | `F-001, F-002, F-004` | 1 | `[x] Completed` |
| **F-009** | Interactive Map Discovery UI | [map-discovery-ui.md](map-discovery-ui/map-discovery-ui.md) | [TK-MAP-01](map-discovery-ui/map-discovery-ui.md#tk-map-01-leaflet-integration--dynamic-ssr-handling), [TK-MAP-02](map-discovery-ui/map-discovery-ui.md#tk-map-02-geolocation--responsive-viewport-controller) | `F-004, F-005, F-007` | 1 | `[x] Completed` |
| **F-010** | Mosque Verification & Moderation | [mosque-verification.md](mosque-verification/mosque-verification.md) | [TK-VERF-01](mosque-verification/mosque-verification.md#tk-verf-01-verification-service--state-machine), [TK-VERF-02](mosque-verification/mosque-verification.md#tk-verf-02-admin-moderation-dashboard-view) | `F-001, F-002, F-003, F-004, F-006` | 1 | `[x] Completed` |
| **F-011** | Observability, Health & Reliability | [observability-health.md](observability-health/observability-health.md) | [TK-OBS-01](observability-health/observability-health.md#tk-obs-01-structured-logging--correlation-tracing), [TK-OBS-02](observability-health/observability-health.md#tk-obs-02-health-probes--operational-metrics) | *(None)* | 1 | `[x] Completed` |
| **F-012** | Community Engagement & Operations | [community-engagement.md](community-engagement/community-engagement.md) | [TK-COMM-01](community-engagement/community-engagement.md#tk-comm-01-community-backend-service--schemas), [TK-COMM-02](community-engagement/community-engagement.md#tk-comm-02-community-engagement-frontend-modals) | `F-001, F-002, F-004` | 1 | `[x] Completed` |
| **F-020** | Mosque Staff Delegation & Role Claim Governance | [staff-delegation.md](staff-delegation/staff-delegation.md) | [TK-STF-01](staff-delegation/staff-delegation.md#tk-stf-01-backend-staff-delegation-service-tiered-rbac--approval-pipeline), [TK-STF-02](staff-delegation/staff-delegation.md#tk-stf-02-mosque-staff-management-console--claim-review-ui) | `F-001, F-002, F-003, F-004` | 2 | `[x] Completed` |
| **F-021** | Enhanced Mosque Facilities & Capacity Taxonomy | [facilities-taxonomy.md](facilities-taxonomy/facilities-taxonomy.md) | [TK-FAC-01](facilities-taxonomy/facilities-taxonomy.md#tk-fac-01-facilities-backend-schema-service-rbac--spatial-search-integration), [TK-FAC-02](facilities-taxonomy/facilities-taxonomy.md#tk-fac-02-ferio-frontend-amenities-card-admin-edit-modal--search-filter-chips) | `F-001, F-004` | 2 | `[x] Completed` |
| **F-022** | Official Mosque Announcements Channel | [announcements.md](announcements/announcements.md) | [TK-ANN-01](announcements/announcements.md#tk-ann-01-announcements-backend-domain-schema-rbac--geospatial-feed), [TK-ANN-02](announcements/announcements.md#tk-ann-02-ferio-frontend-announcements-feed-emergency-banner--staff-modal) | `F-001, F-003, F-004, F-020` | 2 | `[ ] Planned` |

---

## Unified Feature Specification Standard
Every feature specification in this directory adheres to this unified agentic standard:
1. **Frontmatter Metadata**: Machine-readable DAG dependencies, lifecycle status, release phase, and PRD/Architecture source anchors.
2. **Overview & Business Invariants**: Core rules, state transitions, and constraints.
3. **REST API Contracts**: Methods, routes, DTOs, and error envelopes.
4. **Extracted Implementation Checklist**: High-level capability checklist.
5. **Implementation Slices & Proof of Completion**:
   - Ticket ID & Title
   - Status & Priority
   - Description
   - Acceptance Criteria (verifiable checkboxes)
   - Concrete Implementation Files (exact paths in `backend-nest-prisma` and `frontend`)
