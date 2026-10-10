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
| [ADR-034](ADR-034-android-native-auto-silent-engine-and-prior-state-dnd.md) | Android Native Auto-Silent Engine, Prior-State DND Preservation, and Exact Alarm Scheduling | Accepted | 2026-10-10 | Auto-Silent, Android DND, Prior-State Invariant & AlarmManager |
| [ADR-035](ADR-035-mobile-attendance-affiliation-and-dual-count-transparency.md) | Mobile Community Attendance Affiliation, Dual-Count Transparency, and Optimistic Sync Architecture | Accepted | 2026-10-10 | Attendance Affiliation, Dual Metrics, Optimistic Sync & ADR-024 Parity |
| [ADR-036](ADR-036-mobile-community-timetable-update-and-feedback-modal.md) | Mobile Community Timetable Update & Feedback Modal Architecture | Accepted | 2026-10-10 | Timetable Updates, Community Corrections, ADR-021 & ADR-027 Parity |
| [ADR-037](ADR-037-mobile-oem-battery-optimization-mitigation-wizard.md) | Mobile OEM Battery Optimization Mitigation Wizard Architecture | Accepted | 2026-10-10 | OEM Battery Killers, Xiaomi/Samsung/Realme, Exact Alarms & Reliability |
| [ADR-038](ADR-038-mobile-offline-resilience-and-stale-while-revalidate-cache.md) | Mobile Offline Resilience, Stale-While-Revalidate Cache, and Offline Status Banner | Accepted | 2026-10-10 | Offline Resilience, SWR Cache, Offline Banner & Network Hydration |
| [ADR-039](ADR-039-mobile-battery-safe-exact-prayer-alarms-and-notifications.md) | Mobile Battery-Safe Exact Prayer Alarms and Actionable Notifications | Accepted | 2026-10-10 | Exact Alarms, 10m Pre-Jamaat Alerts, Actionable Pills & Battery Safety |
| [ADR-040](ADR-040-mobile-enterprise-telemetry-and-privacy-sanitization.md) | Mobile Enterprise Telemetry, Crash Reporting, and Privacy Data Scrubbing | Accepted | 2026-10-10 | Telemetry, Sentry, PII Scrubbing, Breadcrumb Sanitization & Observability |
| [ADR-041](ADR-041-mobile-eas-production-build-pipeline-and-app-bundle-optimization.md) | Mobile EAS Production Build Pipeline and App Bundle Optimization | Accepted | 2026-10-10 | EAS Build, Production AAB, Hermes Bytecode, ProGuard & Release Gates |
| [ADR-042](ADR-042-mobile-low-end-hardware-performance-profiling-and-benchmark-gate.md) | Mobile Low-End Hardware Performance Profiling and Automated Benchmark Gate | Accepted | 2026-10-10 | Low-End Hardware, $\le 3$GB RAM, Memory Ceilings, 60 FPS & Benchmark Harness |
| [ADR-043](ADR-043-mobile-contributor-pin-drop-and-add-mosque-flow.md) | Mobile Contributor Pin-Drop, Duplicate Prevention, and Add Mosque Sheet Architecture | Accepted | 2026-10-10 | Contributor Mapping, Pin-Drop, Duplicate Check & Multi-Step Sheet |
| [ADR-044](ADR-044-mobile-mosque-notice-board-and-announcements-hub.md) | Mobile Mosque Notice Board, Announcements Hub, and Priority Alerts | Accepted | 2026-10-10 | Notice Board, Janaazah/Eid/Ramadan Alerts, Priority Badging & Offline Cache |
| [ADR-045](ADR-045-mobile-crowdsourced-issue-reporting-and-delisting-protection.md) | Mobile Crowdsourced Issue Reporting and Delisting Protection | Accepted | 2026-10-10 | ADR-020, MosqueReport, Delisting Safeguards & Ferio Report Modal |
| [ADR-046](ADR-046-mobile-sensor-fused-qibla-compass.md) | Mobile Real-Time Sensor-Fused Qibla Compass | Accepted | 2026-10-10 | Qibla Compass, Great-Circle Kaaba Bearing, Ferio Dial & Alignment Feedback |
| [ADR-047](ADR-047-mobile-mosque-leadership-and-staff-directory.md) | Mobile Mosque Leadership & Staff Directory | Accepted | 2026-10-10 | MosqueStaff, Khatib/Imam/Mutawalli Roles, Verified Badges & Direct Dialing |
| [ADR-048](ADR-048-mobile-bilingual-localization-and-musalli-terminology.md) | Mobile Bilingual Localization & Musalli Terminology | Accepted | 2026-10-10 | Bangla/English i18n, Musalli Terminology, 1-Tap Toggle Pill & Fast Synchronous Engine |
| [ADR-049](ADR-049-mobile-daily-authentic-hadith-and-prayer-reflection-digest.md) | Mobile Daily Authentic Hadith & Prayer Reflection Digest | Accepted | 2026-10-10 | Daily Hadith, Sahih Bukhari/Muslim Citations, Collapsible Card & Native Share |
| [ADR-050](ADR-050-mobile-extensible-facilities-taxonomy-and-community-suggestion-modal.md) | Mobile Extensible Facilities Taxonomy & Dedicated Community Suggestion Modal | Accepted | 2026-10-10 | Facilities Taxonomy, Custom Amenities, ADR-025 Parity & Suggest Facilities Modal |
| [ADR-051](ADR-051-mobile-donation-channels-governance-and-multi-signatory-verification.md) | Mobile Mosque Donation Channels Hub, Multi-Signatory Badges & Financial Governance | Accepted | 2026-10-10 | Donations Hub, bKash/Nagad Brands, Multi-Signatory Badges & Fraud Safeguards |
| [ADR-052](ADR-052-mobile-categorized-collections-and-custom-bookmarks.md) | Mobile Categorized Mosque Collections & Custom Bookmarks | Accepted | 2026-10-10 | Mosque Collections, Home/Work/Jumu'ah Tags, Quick Filtering & Feed Switcher |
| [ADR-053](ADR-053-mobile-in-app-notification-inbox-and-unread-badge.md) | Mobile In-App Notification Inbox, Unread Counter Badge & F-031 Parity | Accepted | 2026-10-10 | Notification Inbox, Unread Count Badge, Read Lifecycle & F-031 Backend Parity |
| [ADR-054](ADR-054-mobile-user-authentication-and-contributor-session-management.md) | Mobile User Authentication, Contributor Identity & Secure Session Management | Accepted | 2026-10-10 | Auth Session, SecureTokenStorage, Contributor Identity & Ferio Auth Modal |
| [ADR-055](ADR-055-mobile-remote-push-notification-device-token-sync.md) | Mobile Remote Push Notification Device Token Sync & Background Delivery Pipeline | Accepted | 2026-10-10 | Device Token Sync, POST /users/devices, FCM/APNs & Push Settings Modal |
| [ADR-056](ADR-056-mobile-contributor-attribution-and-submission-provenance.md) | Mobile Contributor Attribution and Submission Provenance Across Crowdsourced Sheets | Accepted | 2026-10-10 | Contributor Provenance, Scout Rep, Anonymous Attribution Banner & Sheet Integrations |
| [ADR-057](ADR-057-mobile-offline-mutation-outbox-and-auto-sync-engine.md) | Mobile Offline Mutation Outbox and Automatic Background Sync Engine | Accepted | 2026-10-10 | Offline Outbox, FIFO Mutation Queue, Exponential Backoff, Auto-Sync & Reconnect Drain |
| [ADR-058](ADR-058-mobile-community-moderator-and-scout-review-sheet.md) | Mobile Community Moderator and Scout Review Sheet Architecture | Accepted | 2026-10-10 | Moderation Queue, RBAC Role Gate, Pending Mosques, Duplicate Triage & Review Sheet |
| [ADR-059](ADR-059-mobile-low-end-hardware-diagnostics-and-field-ops-telemetry-panel.md) | Mobile Low-End Hardware Diagnostics and Field Operations Telemetry Panel | Accepted | 2026-10-10 | Diagnostics Panel, Live FPS Gauge, Heap Memory Profiler, 1-Tap Sanitized Report |
| [ADR-060](ADR-060-mobile-contributor-activity-and-scout-reputation-console.md) | Mobile Contributor Activity and Scout Reputation Console Architecture | Accepted | 2026-10-10 | Scout Reputation, Contributor Tiers, Submission Moderation History & Activity Modal |
| [ADR-061](ADR-061-mobile-ramadan-and-iftar-sehri-fasting-countdown-and-division-timetable-hub.md) | Mobile Ramadan & Iftar / Sehri Fasting Countdown and Division Timetable Hub | Accepted | 2026-10-10 | Ramadan Fasting, Sehri/Iftar Countdown, 8 Division Offsets, Duas & Timetable |
| [ADR-062](ADR-062-mobile-division-level-offline-vector-map-tile-pre-caching-engine.md) | Mobile Division-Level Offline Vector Map Tile Pre-Caching Engine | Accepted | 2026-10-10 | Offline Vector Map Tiles, Division Bounding Boxes, 150MB Storage Budget & Cache Hub |
| [ADR-063](ADR-063-mobile-live-gps-proximity-radar-and-nearest-mosque-sorting-engine.md) | Mobile Live GPS Proximity Radar and Nearest Mosque Sorting Engine | Accepted | 2026-10-10 | Geodesic Haversine Math, Memoized Distance Badging, 60 FPS Gate & Sort by Nearest |
| [ADR-064](ADR-064-mobile-mosque-leadership-role-claim-and-staff-verification-sheet.md) | Mobile Mosque Leadership Role Claim and Staff Verification Sheet | Accepted | 2026-10-10 | Role Claims, Imam/Muazzin Onboarding, POST /community/:id/claims & Verification Sheet |
| [ADR-065](ADR-065-mobile-community-announcements-and-janazah-emergency-bulletin-feed.md) | Mobile Community Announcements and Janazah / Emergency Bulletin Feed | Accepted | 2026-10-10 | Announcements Feed, Janazah Notices, Spatial Query, Ferio Bulletin Sheet & ADR-065 |


---

## When to write a new ADR
Create a new ADR when introducing or changing:
1. Data storage technologies or schema partitioning strategies.
2. Cross-module communication or external third-party integrations (e.g. SMS gateways, Push notifications).
3. Authorization policies or cryptographic standards.
4. Infrastructure primitives (e.g., adding Redis, BullMQ, or Object Storage).
