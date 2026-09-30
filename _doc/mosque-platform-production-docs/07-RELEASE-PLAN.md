# Production Release Plan

Feature phases reduce scope. They do not reduce engineering quality.

Every released feature must meet the production Definition of Done.

## Release 1 — Core production platform

- accounts/authentication
- map/base map
- platform-owned mosque registry
- add mosque via pin
- nearby duplicate detection
- mosque profile
- nearby/search
- PostGIS
- prayer + Jamaat schedule
- schedule history/freshness
- registered-user attendance status
- suggestion/incorrect-information reporting
- admin verification/moderation
- audit log
- observability
- backup/recovery
- production CI/CD

Success criterion:

```text
Map
-> discover/add mosque
-> duplicate check
-> profile
-> prayer information
-> attendance/suggestion
-> moderation/verification
```

operates safely under normal production load and known failure paths.

---

## Release 2 — Verified mosque community roles

- Imam
- Muazzin
- Khadem/Khatib
- committee
- role claims
- role verification
- mosque-scoped permissions
- facilities
- announcements

Production additions:

- richer authorization matrix
- evidence/document handling if required
- new audit events
- notification requirements evaluated

---

## Release 3 — Donations and notifications

- verified donation information (Completed - F-030)
- follow mosque (Completed - F-031)
- notifications (Completed - F-031)

### Explicitly Excluded / Deferred Scope (Do NOT Propose or Implement)
> **Direct Architectural Constraint**: The following items are explicitly out of scope and deferred indefinitely:
> - **Volunteer Roster & Shift Coordination (`F-023`)**: Not needed.
> - **Multiple Jamaat Shifts**: Standard single Jamaat per Waqt (`F-007`) is sufficient.
> - **Jumu'ah Special Schedule Tables**: Covered via announcements or standard Zuhr/Jumu'ah Jamaat.
> - **Ramadan Schedules & Timetables**: Not needed; community announcements (`F-022`) handle ad-hoc notices.
> - **Prayer Reminders & Background Push**: In-app notifications (`F-031`) are sufficient; no BullMQ/Redis push queue is required.

Only introduce:

- BullMQ
- Redis
- Push providers

when a future approved production phase explicitly mandates them.

Donation information receives additional fraud/security review.

---

## Release 4 — Mobile (Deferred — Develop Later)

> [!NOTE]
> **Status**: **Deferred — Develop Later**.
> Mobile application clients (Android/iOS) and mobile-specific client generation are explicitly scheduled for development in a future phase after the web platform reaches complete operational maturity (backups, recovery drills, and browser E2E testing).
> AI agents MUST NOT suggest or initiate mobile development work during current milestones.

When scheduled for future development:
- Use the same versioned NestJS API where appropriate.
- Add Android/iOS clients without moving business authorization/invariants into the mobile application.
- Review mobile token/session handling, push notifications, location permissions, background location policy, and offline/degraded behavior.
