# Data and API Contracts

This document defines implementation-level domain invariants and API conventions.
Exact field names may be refined during schema design, but invariants should not be
changed accidentally.

## 1. Core entities

### User

Responsibilities:

- authentication identity
- profile/account state
- actor for submissions and privileged changes

Never expose password hashes, refresh-token secrets, or internal credential material.

### Mosque

Minimum concepts:

- identifier
- name
- operational status
- verification status
- location
- optional address/landmark
- created by / provenance where applicable
- created/updated timestamps

### PrayerSchedule

Represents current mosque prayer information.

Must distinguish prayer start time from Jamaat/Iqamah time.

### PrayerScheduleHistory

Immutable/history-oriented representation sufficient to answer:

- what changed
- who changed it
- when

### UserMosqueAttendance

Invariant:

```text
unique(userId, mosqueId)
```

### MosqueSuggestion / IncorrectInformationReport

Untrusted community input. Must not be treated as canonical mosque data before an
authorized workflow accepts/applies it.

### MosqueVerification

Tracks verification state/provenance or provides the data needed to audit it.

### AuditLog

Records security/business-relevant privileged changes.

---

## 2. Suggested state machines

### Mosque verification

```text
UNVERIFIED
  -> PENDING_VERIFICATION
  -> VERIFIED

PENDING_VERIFICATION
  -> REJECTED

REJECTED
  -> PENDING_VERIFICATION  (if resubmission is allowed)
```

Transitions must be authorized and validated.

### Suggestion/report

```text
OPEN
  -> UNDER_REVIEW
  -> RESOLVED

OPEN
  -> REJECTED

UNDER_REVIEW
  -> REJECTED
```

### Mosque operational state

```text
OPEN
TEMPORARILY_CLOSED
PERMANENTLY_CLOSED
UNDER_CONSTRUCTION
UNKNOWN
```

Operational status and verification status are separate dimensions.

---

## 3. API conventions

Base path:

```text
/api/v1
```

Recommended envelope behavior:

- use standard HTTP status codes
- do not return `200 OK` for unexpected failures
- expose stable application error codes where useful
- do not leak stack traces or sensitive internals

Example error:

```json
{
  "code": "MOSQUE_POSSIBLE_DUPLICATE",
  "message": "A mosque already exists nearby.",
  "requestId": "..."
}
```

Exact error schema should be globally consistent.

---

## 4. Core mosque endpoints

Recommended:

```http
POST   /api/v1/mosques
GET    /api/v1/mosques/:id
GET    /api/v1/mosques
GET    /api/v1/mosques/nearby
PATCH  /api/v1/mosques/:id
```

Do not expose unrestricted update permissions through `PATCH`.

### Create mosque

Example:

```json
{
  "name": "Baitul Aman Jame Mosque",
  "latitude": 23.810123,
  "longitude": 90.412345,
  "address": "optional"
}
```

Server responsibilities:

1. validate payload
2. derive actor from authenticated context when applicable
3. validate coordinates
4. run proximity duplicate search
5. apply duplicate policy
6. create unverified record
7. persist audit/provenance where required
8. return serialized public contract

Repeated/retried requests must have defined duplicate/idempotency behavior.

---

## 5. Nearby endpoint

Example:

```http
GET /api/v1/mosques/nearby?lat=23.81&lng=90.41&radiusMeters=2000&limit=50
```

Requirements:

- coordinate validation
- server-enforced maximum radius
- server-enforced maximum limit
- stable ordering
- distance returned
- PostGIS-backed filtering
- bounded response

Do not allow an unbounded world-scale query.

---

## 6. Duplicate-check contract

Creation may respond with a conflict/warning contract before final submission.

Possible candidates contain only required information:

```json
{
  "candidates": [
    {
      "mosqueId": "123",
      "name": "Baitul Aman Jame Mosque",
      "distanceMeters": 42.7
    }
  ]
}
```

If "Add anyway" is supported, the server must enforce who may bypass the warning and
what additional evidence/flag is recorded.

---

## 7. Prayer endpoints

Recommended:

```http
GET   /api/v1/mosques/:id/prayer-schedule
POST  /api/v1/mosques/:id/prayer-schedule
PATCH /api/v1/mosques/:id/prayer-schedule/:scheduleId
GET   /api/v1/mosques/:id/prayer-schedule/history
```

Mutation requirements:

- authorization
- validation
- current schedule + history atomicity
- actor/timestamp
- concurrency behavior
- audit where required

---

## 8. Attendance endpoints

Recommended:

```http
PUT    /api/v1/mosques/:id/attendance
DELETE /api/v1/mosques/:id/attendance
GET    /api/v1/mosques/:id/attendance-summary
```

`PUT` should be naturally idempotent for a chosen status.

---

## 9. Suggestion/report endpoints

Recommended:

```http
POST /api/v1/mosques/:id/suggestions
POST /api/v1/mosques/:id/reports
```

Moderation:

```http
GET   /api/v1/admin/suggestions
PATCH /api/v1/admin/suggestions/:id/status

GET   /api/v1/admin/reports
PATCH /api/v1/admin/reports/:id/status
```

Anonymous endpoints require abuse controls.

---

## 10. Verification endpoints

Recommended:

```http
GET  /api/v1/admin/mosques/pending-verification
POST /api/v1/admin/mosques/:id/verify
POST /api/v1/admin/mosques/:id/reject
```

Requirements:

- admin authorization
- idempotent same-state behavior or explicit conflict
- reason/evidence as policy requires
- audit log
- concurrent moderation handling

---

## 11. Pagination

Every potentially growing collection must be bounded.

Prefer cursor/keyset pagination for long/live datasets.

Responses should include enough information for safe continuation, e.g.:

```json
{
  "items": [],
  "nextCursor": "..."
}
```

---

## 12. Data exposure

Default to explicit projection.

Do not return full ORM models as API contracts by convenience.

Protect:

- credential fields
- private phone numbers
- moderation metadata
- internal audit details
- private evidence/uploads

---

## 13. Date/time semantics

Define explicitly for each field whether it is:

- a date-only value
- a local mosque schedule time
- an absolute instant/timestamp
- an elapsed duration

Do not use server local timezone implicitly.

---

## 14. Raw SQL / PostGIS

Use parameterized/tagged SQL only when Prisma cannot reasonably express required
PostGIS behavior or measured performance requires it.

Never concatenate user-provided values into SQL.

Dynamic identifiers/sort fields must be allowlisted.

---

## 15. Schema evolution

All production schema changes require reviewed migrations.

For risky existing-data changes prefer:

```text
expand
-> bounded backfill
-> validate
-> contract
```

Never use destructive reset/db-push behavior against shared production data as a
migration repair mechanism.
