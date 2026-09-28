# Feature Specifications & Implementation Tickets

This directory contains the feature-wise specifications extracted from the [Production PRD](../01-PRD-PRODUCTION.md) and [Implementation Checklist](../06-IMPLEMENTATION-CHECKLIST.md). Each feature folder contains a detailed feature specification (`<feature>.md`) and a `tickets/` directory containing actionable, reviewable tickets.

## Master Feature & Ticket Index

| Feature ID & Name | Specification | Active Tickets | Status |
| :--- | :--- | :--- | :--- |
| **01. Mosque Registry** | [mosques-registry.md](mosques-registry/mosques-registry.md) | [TK-MOSQ-01](mosques-registry/tickets/TK-MOSQ-01-schema-and-indexing.md), [TK-MOSQ-02](mosques-registry/tickets/TK-MOSQ-02-creation-and-duplicate-api.md), [TK-MOSQ-03](mosques-registry/tickets/TK-MOSQ-03-profile-endpoint-and-page.md), [TK-MOSQ-04](mosques-registry/tickets/TK-MOSQ-04-add-mosque-modal-ui.md) | `[x] Implemented` |
| **02. Nearby & Search** | [nearby-search.md](nearby-search/nearby-search.md) | [TK-SRCH-01](nearby-search/tickets/TK-SRCH-01-postgis-radial-search-api.md), [TK-SRCH-02](nearby-search/tickets/TK-SRCH-02-text-search-and-filtering.md), [TK-SRCH-03](nearby-search/tickets/TK-SRCH-03-frontend-search-and-filter.md) | `[x] Implemented` |
| **03. Prayer Schedules** | [prayer-schedules.md](prayer-schedules/prayer-schedules.md) | [TK-PRAY-01](prayer-schedules/tickets/TK-PRAY-01-schema-and-history.md), [TK-PRAY-02](prayer-schedules/tickets/TK-PRAY-02-atomic-update-api.md), [TK-PRAY-03](prayer-schedules/tickets/TK-PRAY-03-live-countdown-banner.md) | `[x] Implemented` |
| **04. Attendance Tracking** | [attendance-tracking.md](attendance-tracking/attendance-tracking.md) | [TK-ATTN-01](attendance-tracking/tickets/TK-ATTN-01-schema-and-idempotent-service.md), [TK-ATTN-02](attendance-tracking/tickets/TK-ATTN-02-attendance-ui-and-counts.md) | `[x] Implemented` |
| **05. Suggestions & Reports** | [suggestions-reports.md](suggestions-reports/suggestions-reports.md) | [TK-SUGG-01](suggestions-reports/tickets/TK-SUGG-01-persistence-and-api.md), [TK-SUGG-02](suggestions-reports/tickets/TK-SUGG-02-frontend-modals.md) | `[x] Implemented` |
| **06. Mosque Verification** | [mosque-verification.md](mosque-verification/mosque-verification.md) | [TK-VERF-01](mosque-verification/tickets/TK-VERF-01-service-and-state-machine.md), [TK-VERF-02](mosque-verification/tickets/TK-VERF-02-admin-dashboard-view.md) | `[x] Implemented` |
| **07. Authentication & Security** | [authentication-security.md](authentication-security/authentication-security.md) | [TK-AUTH-01](authentication-security/tickets/TK-AUTH-01-auth-service-and-jwt.md), [TK-AUTH-02](authentication-security/tickets/TK-AUTH-02-2fa-and-lockout-defense.md) | `[x] Implemented` |
| **08. Authorization & RBAC** | [authorization-rbac.md](authorization-rbac/authorization-rbac.md) | [TK-RBAC-01](authorization-rbac/tickets/TK-RBAC-01-guards-and-derivation.md) | `[x] Implemented` |
| **09. Map Discovery UI** | [map-discovery-ui.md](map-discovery-ui/map-discovery-ui.md) | [TK-MAP-01](map-discovery-ui/tickets/TK-MAP-01-leaflet-dynamic-integration.md), [TK-MAP-02](map-discovery-ui/tickets/TK-MAP-02-geolocation-and-viewport.md) | `[x] Implemented` |
| **10. Community Engagement** | [community-engagement.md](community-engagement/community-engagement.md) | [TK-COMM-01](community-engagement/tickets/TK-COMM-01-backend-service-and-schemas.md), [TK-COMM-02](community-engagement/tickets/TK-COMM-02-engagement-frontend-modals.md) | `[x] Implemented` |
| **11. Observability & Health** | [observability-health.md](observability-health/observability-health.md) | [TK-OBS-01](observability-health/tickets/TK-OBS-01-structured-logging-and-tracing.md), [TK-OBS-02](observability-health/tickets/TK-OBS-02-health-probes-and-metrics.md) | `[x] Implemented` |
| **12. Database & Migrations** | [database-migrations.md](database-migrations/database-migrations.md) | [TK-DB-01](database-migrations/tickets/TK-DB-01-schema-builder-and-migrations.md) | `[x] Implemented` |

---

## Ticket Structure Standard
Every ticket file in a feature's `tickets/` folder adheres to this standard template:
1. **Spec Link**: Pointer to parent feature spec.
2. **Status**: `[x] Completed` or `[ ] Pending`.
3. **Priority**: Critical / High / Medium / Low.
4. **Description**: Concise summary of ticket purpose.
5. **Acceptance Criteria**: Verifiable checkboxes matching implementation requirements.
6. **Implementation Files**: Concrete paths in the codebase implementing this ticket.
