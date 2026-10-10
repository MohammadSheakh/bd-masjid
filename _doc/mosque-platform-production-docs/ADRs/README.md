# Architecture Decision Records (ADRs)

This directory contains the foundational Architecture Decision Records for the **Mosque Information & Community Platform**. Each record documents a critical architectural choice, its context, consequences, and compliance requirements.

## Index of Architecture Decision Records

| ADR ID | Title | Status | Date | Primary Scope |
| :--- | :--- | :--- | :--- | :--- |
| [ADR-001](ADR-001-modular-monolith-architecture.md) | Modular Monolith Architecture with NestJS and Next.js | Accepted | 2026-09-28 | System Architecture & Boundaries |
| [ADR-002](ADR-002-postgresql-postgis-geospatial-registry.md) | PostgreSQL with PostGIS as Authoritative Geospatial Registry | Accepted | 2026-09-28 | Geospatial & Persistence |
| [ADR-003](ADR-003-server-side-actor-derivation-and-rbac.md) | Role-Based Access Control and Server-Side Actor Derivation | Accepted | 2026-09-28 | Authentication & Authorization |
| [ADR-004](ADR-004-prayer-schedule-temporal-modeling.md) | Prayer Schedule Temporal Modeling and Atomic History Snapshots | Accepted | 2026-09-28 | Prayer Times & Transactions |
| [ADR-005](ADR-005-spatial-duplicate-detection.md) | Two-Tier Spatial Proximity Duplicate Detection at Mosque Creation | Accepted | 2026-09-28 | Mosque Creation & Validation |
| [ADR-006](ADR-006-crowdsourced-data-moderation-and-verification.md) | Crowdsourced Suggestions, Reports, and Mosque Verification Workflow | Accepted | 2026-09-28 | Community & Moderation |
| [ADR-007](ADR-007-uniform-error-contract-and-observability.md) | Uniform API Error Contract, Correlation Tracking, and Logging Sanitization | Accepted | 2026-09-28 | Security & Observability |
| [ADR-008](ADR-008-infrastructure-stack-and-mongoose-removal.md) | Infrastructure Retentions (Redis, BullMQ, Cloudinary, Firebase Admin) and Complete Removal of Mongoose | Accepted | 2026-09-28 | Infrastructure & Persistence |
| [ADR-009](ADR-009-staff-delegation.md) | Mosque Staff Delegation & Tiered Role Claim Governance | Accepted | 2026-09-29 | Authorization & Staff Governance |
| [ADR-010](ADR-010-facilities-taxonomy.md) | Mosque Facilities & Accessibility Taxonomy | Accepted | 2026-09-30 | Domain Model & Spatial Search Filters |
| [ADR-011](ADR-011-announcements.md) | Official Mosque Announcements Channel & Broadcast Governance | Accepted | 2026-09-30 | Community Broadcasts & Expiration |
| [ADR-012](ADR-012-mosque-donations.md) | Verified Mosque Donation Information & Fraud Prevention | Accepted | 2026-09-30 | Finance & Two-Person Verification |
| [ADR-013](ADR-013-mosque-follows-and-realtime-notifications.md) | Mosque Follow Subscriptions and Real-Time In-App Notifications | Accepted | 2026-09-30 | Subscriptions, Notifications & WebSockets |
| [ADR-014](ADR-014-production-ci-cd-and-disposable-migration-replay.md) | Production CI/CD Pipeline and Disposable Migration Replay | Accepted | 2026-09-30 | CI/CD, PostGIS Replay & Production Gates |
| [ADR-015](ADR-015-database-backup-retention-and-disaster-recovery.md) | Database Backup, Retention Policy, and Disaster Recovery Architecture | Accepted | 2026-09-30 | Backups, Disaster Recovery, RPO/RTO & Drills |
| [ADR-016](ADR-016-browser-end-to-end-testing-with-playwright.md) | Browser End-to-End Testing with Playwright | Accepted | 2026-09-30 | Testing, Browser Automation & Playwright |
| [ADR-017](ADR-017-spatial-search-and-api-performance-baseline.md) | PostGIS Spatial Search and API Load Performance Baseline | Accepted | 2026-09-30 | Performance, Load Testing & PostGIS Baseline |
| [ADR-018](ADR-018-production-deployment-and-zero-downtime-rollback.md) | Production Deployment and Zero-Downtime Rollback Strategy | Accepted | 2026-09-30 | Operations, Deployments, Docker & Rollback |
| [ADR-019](ADR-019-mosque-admin-mutawalli-governance-and-custom-role-claims.md) | Mosque Admin & Mutawalli Dual Super-Role Governance, Custom Roles, and Identity Verification Claims | Accepted | 2026-10-01 | Governance, RBAC & Role Claims |
| [ADR-020](ADR-020-elimination-of-verification-states-in-favor-of-listing-and-moderated-delisting.md) | Elimination of Mosque Verification States in Favor of Sovereign Listing and Moderated Delisting | Accepted | 2026-10-03 | Moderation, Discovery & UI Governance |
| [ADR-021](ADR-021-immediate-community-timetable-updates-in-place-of-moderation-bottleneck.md) | Immediate Community Timetable Updates in Place of Suggestion Review Bottleneck | Accepted | 2026-10-03 | Timetable Governance & Community Edits |
| [ADR-022](ADR-022-followed-mosques-first-feed-with-search-fallback.md) | Followed Mosques First Feed with Dynamic Discovery and Search Fallback | Accepted | 2026-10-03 | Personalization, Feed & Search Fallback |
| [ADR-023](ADR-023-map-all-listed-mosques-with-differentiated-marker-hierarchy.md) | Map Viewport All Listed Mosques with Differentiated Followed Marker Hierarchy | Accepted | 2026-10-03 | Interactive Map, Geospatial Discovery & Pin Hierarchy |
| [ADR-024](ADR-024-one-time-community-attendance-affiliation-and-dual-count-transparency.md) | One-Time Community Attendance Affiliation and Dual Count Transparency | Accepted | 2026-10-03 | Community Affiliation, Attendance Tracking & Metrics |
| [ADR-025](ADR-025-extensible-facility-amenities-taxonomy-and-dedicated-community-suggestion-modal.md) | Extensible Facility Amenities Taxonomy and Dedicated Community Suggestion Workflow | Accepted | 2026-10-03 | Facilities, Extensibility & Community Suggestions |
| [ADR-026](ADR-026-dynamic-system-audit-trail-toggle-and-storage-governance.md) | Dynamic System Audit Trail Toggle and Storage Capacity Governance | Accepted | 2026-10-04 | Audit Trail, Storage Governance & Admin Controls |
| [ADR-027](ADR-027-community-suggestions-and-role-targeted-feedback-governance.md) | Community Mosque Suggestions, Complaints & Targeted Role Feedback Governance | Accepted | 2026-10-04 | Community Feedback, Role Routing & Privacy |
| [ADR-028](ADR-028-mosque-donation-channel-leadership-verification-and-creator-provenance.md) | Mosque Donation Channel Leadership Verification and Creator Provenance Governance | Accepted | 2026-10-04 | Mosque Donations, Provenance & Multi-Role Verification |
| [ADR-029](ADR-029-cross-platform-mobile-client-react-native-expo.md) | Cross-Platform Mobile Application Architecture with React Native and Expo | Accepted | 2026-10-05 | Mobile Client, React Native, Expo & Ferio Parity |
| [ADR-030](ADR-030-mobile-dual-viewport-and-feed-virtualization.md) | Mobile Dual-Viewport Navigation, List Virtualization, and Hybrid Offline Fixture Architecture | Accepted | 2026-10-10 | Mobile Viewport, Feed Virtualization & Offline Fixtures |
| [ADR-031](ADR-031-mobile-gesture-bottom-sheet-and-governance-cards.md) | Mobile Gesture-Driven Mosque Detail Bottom Sheet and Governance Cards Architecture | Accepted | 2026-10-10 | Detail Bottom Sheet, Staff Roster & Donation Governance |
| [ADR-032](ADR-032-mobile-interactive-map-viewport-and-pin-hierarchy.md) | Mobile Interactive Map Viewport, Custom Pin Hierarchy, and Direct Detail Navigation | Accepted | 2026-10-10 | Interactive Map, Pin Hierarchy & Direct Navigation |
| [ADR-033](ADR-033-mobile-tiered-storage-and-smart-api-client.md) | Mobile Tiered Storage Architecture, Hardware Token Encryption, and Smart Localhost API Client | Accepted | 2026-10-10 | Tiered Storage, Hardware KeyStore & Smart API Client |


---

## When to write a new ADR
Create a new ADR when introducing or changing:
1. Data storage technologies or schema partitioning strategies.
2. Cross-module communication or external third-party integrations (e.g. SMS gateways, Push notifications).
3. Authorization policies or cryptographic standards.
4. Infrastructure primitives (e.g., adding Redis, BullMQ, or Object Storage).
