# Mosque Information & Community Platform — Production PRD

## 1. Product vision

Build a web-first community platform that helps users discover nearby mosques and
access trustworthy, current mosque information, especially prayer and Jamaat times.

The platform should grow into a community-maintained mosque information system rather
than only a map.

Core product value:

> Find a mosque, know when the next Jamaat is, understand how current the information
> is, and see trustworthy community information about that mosque.

The same NestJS backend should remain suitable for a future Android/iOS client.

---

## 2. Product principles

- OpenStreetMap provides the base map and geographic context.
- The platform owns its mosque registry.
- Mosque data is stored in PostgreSQL/PostGIS.
- A user may add a mosque by placing a pin and submitting its basic information.
- New community-created mosques are not automatically trusted.
- Canonical mosque data and untrusted suggestions are separate concepts.
- Important changes are auditable.
- Security and operational reliability are part of each feature, not later hardening.
- Do not introduce infrastructure merely because it is common in production systems.

---

## 3. User types

### Guest

May:

- browse the map
- search mosques
- view mosque profiles
- view prayer and Jamaat times
- get directions
- view verification/freshness information
- submit allowed suggestions or incorrect-information reports subject to abuse controls

### Registered user

Guest capabilities plus:

- maintain an account
- mark regular/occasional attendance where enabled
- follow a mosque when the feature is released
- view their submissions
- submit role claims when the feature is released

### Verified mosque roles

Future production releases may include:

- Imam
- Muazzin
- Khadem/Khatib
- Committee member
- Mosque administrator

Permissions must be mosque-scoped and server-enforced.

### Platform administrator

May perform authorized moderation and operational actions such as:

- mosque verification/rejection
- duplicate review/merge
- report/suggestion moderation
- privileged data review
- role verification
- audit inspection

---

## 4. Core user flows

### 4.1 Discover mosque

User opens map -> map obtains location permission if granted -> API loads platform
mosques for the relevant viewport/radius -> user selects a marker -> mosque profile.

Map provider failure must not make stored mosque records unavailable through direct
profile/search routes where practical.

### 4.2 Add mosque

User selects "Add Mosque" -> places/moves a map pin -> enters mosque name and optional
metadata -> backend validates coordinates and payload -> backend performs proximity
duplicate check -> user is warned about likely nearby duplicates -> valid submission
creates an unverified mosque -> profile becomes available -> moderation/verification
may occur later.

### 4.3 Update prayer information

Authorized actor opens mosque profile -> submits prayer/Jamaat schedule -> backend
validates authorization and schedule -> current schedule and history are updated
atomically -> freshness metadata changes -> audit event is recorded.

### 4.4 Community suggestion

Guest/registered user submits suggestion -> abuse controls apply -> suggestion enters
moderation workflow -> approved change is applied by an authorized workflow -> action
is auditable.

### 4.5 Verification

Authorized moderator reviews evidence/context -> transitions verification status ->
records reason/actor/time -> operation is idempotent and audited.

---

## 5. OpenStreetMap policy

OSM is **not** the mosque database for this product.

Use OSM-compatible map tiles/base mapping for:

- roads
- neighborhoods
- buildings
- landmarks
- geographic context

Mosque markers displayed by the application come from the platform API and database.

Do not implement nationwide OSM mosque import/synchronization as a core requirement.
It may be evaluated later as an optional enrichment project with separate data-quality
and licensing review.

Production deployment must respect map/tile provider usage and attribution policies.
Do not assume the public OSM tile service is an unlimited production CDN.

---

## 6. Mosque profile

A mosque profile should support, as features are released:

- mosque name
- location
- optional address/landmark
- verification status
- open/closed status
- prayer start times
- Jamaat/Iqamah times
- last updated information
- information freshness
- regular/occasional attendance aggregates
- Imam/Muazzin/Khadem
- committee information
- facilities
- announcements
- donation information
- suggestions/reports
- audit-backed update provenance where appropriate

Unknown data must remain visibly unknown. Do not manufacture defaults that appear
authoritative.

---

## 7. Mosque status

Recommended operational states:

- `OPEN`
- `TEMPORARILY_CLOSED`
- `PERMANENTLY_CLOSED`
- `UNDER_CONSTRUCTION`
- `UNKNOWN`

Verification is separate from operational status.

Recommended verification states:

- `UNVERIFIED`
- `PENDING_VERIFICATION`
- `VERIFIED`
- `REJECTED`

State transitions must be explicit and server-enforced.

---

## 8. Prayer information

Prayer start time and Jamaat/Iqamah time are separate concepts and must remain
separate in the domain model.

Support:

- Fajr
- Sunrise
- Zuhr
- Asr
- Maghrib
- Isha

Architecture must not prevent later support for:

- multiple Jamaat times
- Jumu'ah sessions
- Ramadan-specific schedules

Time-zone semantics must be explicit. Store timestamps as instants where appropriate;
treat mosque-local schedule values deliberately rather than relying on server-local time.

---

## 9. Freshness

Information freshness is derived from update timestamps, not stored as a UI color.

Example policy:

- recent -> green presentation
- 90+ days -> stale/yellow presentation
- 180+ days -> very stale/red presentation

Exact thresholds are product policy and should be configurable or centrally defined.

Freshness and verification are independent:

- verified but stale
- unverified but recent

are both possible.

---

## 10. Duplicate detection

The system must detect possible duplicates using geospatial proximity.

Initial product policy may use approximately 50 meters as a warning radius, but
distance alone must not automatically prove that two records are duplicates.

Duplicate review should consider:

- distance
- normalized names
- address/landmark
- submitted evidence
- existing community data

A future merge operation must preserve dependent data and audit history.

---

## 11. Attendance

If attendance is enabled:

- one registered user has at most one active attendance status per mosque
- supported states may be `REGULAR`, `OCCASIONAL`, `NONE`
- aggregate counts are public only if privacy requirements permit
- individual attendee identity is not public by default
- repeated retries must not inflate counts

Anonymous attendance should not be introduced without a clear identity/abuse model.

---

## 12. Suggestions and incorrect-information reports

Allow users to report:

- incorrect prayer time
- incorrect location
- permanently closed mosque
- duplicate mosque
- incorrect phone/contact
- incorrect staff information
- incorrect donation information
- other issue

Untrusted reports must not directly mutate canonical data.

Suggested moderation states:

- `OPEN`
- `UNDER_REVIEW`
- `RESOLVED`
- `REJECTED`

Anonymous submissions require appropriate CAPTCHA/rate-limit/abuse controls.

---

## 13. Mosque roles and ownership

Do not model a mosque as being "owned" by one platform user.

Model authorized management/roles scoped to a mosque.

Role claims require verification before privileged permissions are granted.

All privileged updates are auditable.

---

## 14. Donation information

Donation information is a high-risk feature because incorrect payment information can
cause real financial harm.

When released:

- ordinary users cannot directly publish canonical donation destinations
- verified/authorized role is required
- changes are audited
- verification provenance is visible
- reports can flag suspected fraud
- exposure of sensitive account details is deliberate

No actual payment processing is required unless separately specified.

---

## 15. Search

Production search should support:

- mosque name
- nearby/radius search
- verification filter
- facilities filters when released
- freshness filter
- open/closed status

All result sets must be bounded and paginated/limited where growth is possible.

---

## 16. Directions

"Get Directions" may hand off to the user's selected navigation provider.

The application should not require storing continuous user movement merely to provide
directions.

---

## 17. Release 1 scope

Release 1 is intentionally smaller than the final product, but all released features
must meet the production engineering standard.

Release 1:

- OSM-compatible base map
- platform-owned mosque markers
- map search/nearby
- mosque profile
- user-created mosque with pin
- proximity duplicate warning
- mosque verification/moderation
- user account/authentication
- prayer schedule + Jamaat time
- prayer schedule history
- freshness/stale display
- regular/occasional attendance for registered users
- suggestion/incorrect-information workflow
- admin moderation dashboard
- audit log for privileged mutations

Not required for Release 1 unless implementation demonstrates a need:

- Redis
- BullMQ
- Socket.io
- nationwide OSM import
- mobile app
- donation
- role claims
- committee management
- push notifications

---

## 18. Non-functional requirements

Before production release define measurable values for:

- availability target
- p95/p99 API latency targets
- expected concurrent traffic
- expected database size/growth
- RPO
- RTO
- backup retention
- audit retention
- log retention
- rate-limit policies
- maximum API payload sizes
- maximum map query radius/result count

A requirement without a measurable operational expectation should be treated as
incomplete when it materially affects reliability/capacity.

---

## 19. Production acceptance

Release 1 is accepted only when:

- core flows work end-to-end
- authorization boundaries are verified
- database invariants are enforced
- concurrency-sensitive writes are tested
- migrations are replayable on a clean disposable environment
- failure paths are tested
- required logs/metrics/health endpoints exist
- backup/restore procedure exists and has been exercised
- deployment and rollback are documented
- no debug/placeholder/fake production behavior remains
- relevant CI checks pass
