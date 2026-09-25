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

- verified donation information
- follow mosque
- notifications
- multiple Jamaat
- Jumu'ah
- Ramadan schedules
- prayer reminders

Only introduce:

- BullMQ
- Redis
- Socket.io/push provider

when the chosen delivery model actually requires them.

Donation information receives additional fraud/security review.

---

## Release 4 — Mobile

Use the same versioned NestJS API where appropriate.

Add Android/iOS clients without moving business authorization/invariants into the
mobile application.

Review:

- mobile token/session handling
- push notifications
- location permissions
- background location policy
- offline/degraded behavior
