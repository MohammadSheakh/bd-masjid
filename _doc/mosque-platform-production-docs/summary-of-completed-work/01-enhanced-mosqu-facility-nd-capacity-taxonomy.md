Viewed SKILL.md:1-54
Viewed SKILL.md:1-54
Viewed package.json:1-60
Viewed build-prisma-schemaV2.js:1-60
Listed directory schema
Listed directory mosque.module
Viewed mosque.prisma:1-69
Listed directory features
Ran command: `git show 3e65e72 --stat`
Searched for "MOSQUE_ADMIN"
Viewed community.service.ts:60-100
Ran command: `pnpm test`
Ran command: `pnpm run build`
Ran command: `git remote -v && git branch -vv`
Ran command: `git diff _doc/mosque-platform-production-docs/`
Listed directory migrations
Viewed migration.sql:1-11
Ran command: `pnpm run prisma:migrate:status`
Ran command: `docker ps -a`
Viewed docker-compose.yml:1-60
Viewed .env:1-25
Viewed .env:24-40
Ran command: `node -e 'const { Client } = require("pg"); const client = new Client({ connectionString: "postgresql://neondb_owner:npg_d3JEBqQonbh0@ep-empty-king-b3mrbn98-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" }); client.connect().then(() => { console.log("Connected to Neon DB successfully!"); return client.query("SELECT COUNT(*) FROM \"Mosque\";"); }).then(res => { console.log("Mosque count:", res.rows[0]); return client.end(); }).catch(e => { console.error("Error:", e.message); process.exit(1); });'`
Viewed prisma.config.ts:1-13
Ran command: `ls -la .env`
Viewed .env:1-40
Ran command: `DATABASE_URL="postgresql://neondb_owner:npg_d3JEBqQonbh0@ep-empty-king-b3mrbn98-pooler.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require&channel_binding=require" DIRECT_URL="postgresql://neondb_owner:npg_d3JEBqQonbh0@ep-empty-king-b3mrbn98.c-4.ap-southeast-1.aws.neon.tech/neondb?sslmode=require" pnpm prisma migrate status --schema prisma/schema.prisma`
Edited .env
Ran command: `pnpm run prisma:migrate:status`
Created facilities.prisma
Viewed mosque.prisma:50-68
Edited mosque.prisma
Ran command: `pnpm run prisma:schema:build`
Ran command: `pnpm run prisma:generate`
Created migration.sql
Ran command: `pnpm run prisma:migrate:deploy`
Viewed community.controller.ts:1-60
Viewed mosques.controller.ts:1-60
Viewed nearby-mosques.dto.ts:1-51
Viewed mosque-query.dto.ts:1-60
Viewed mosques.service.ts:80-140
Viewed mosques.service.ts:240-320
Viewed mosques.service.ts:320-370
Viewed mosques.service.ts:370-410
Viewed app.module.ts:1-41
Created upsert-facility.dto.ts
Created facilities.service.ts
Created facilities.controller.ts
Created facilities.module.ts
Viewed app.module.ts:1-41
Edited app.module.ts
Viewed nearby-mosques.dto.ts:1-51
Edited nearby-mosques.dto.ts
Viewed mosques.service.ts:240-335
Viewed mosques.service.ts:1-40
Viewed mosques.service.ts:335-355
Edited mosques.service.ts
Created facilities.service.spec.ts
Ran command: `pnpm test`
Viewed mosques.service.spec.ts:1-100
Viewed mosques.service.spec.ts:101-165
Edited mosques.service.spec.ts
Edited mosques.service.spec.ts
Ran command: `pnpm test`
Viewed SKILL.md:1-60
Created README.md
Viewed mosque.ts:1-60
Viewed mosque.ts:61-150
Edited mosque.ts
Viewed api.ts:1-60
Searched for "getNearbyMosques"
Searched for "nearby"
Viewed api.ts:180-220
Viewed api.ts:570-624
Edited api.ts
Edited api.ts
Viewed api.ts:620-652
Edited api.ts
Created MosqueFacilitiesCard.tsx
Created EditFacilitiesModal.tsx
Viewed page.tsx:1-100
Viewed page.tsx:100-250
Viewed page.tsx:240-300
Created MosqueFacilitiesSection.tsx
Viewed page.tsx:230-286
Viewed page.tsx:20-28
Edited page.tsx
Edited page.tsx
Searched for "hasSeparateWomenSpace"
Viewed page.tsx:70-180
Viewed page.tsx:180-260
Viewed page.tsx:50-118
Viewed api.ts:197-240
Viewed api.ts:225-260
Viewed mosque-query.dto.ts:50-100
Edited api.ts
Viewed page.tsx:40-120
Viewed page.tsx:230-265
Edited page.tsx
Viewed page.tsx:240-275
Edited page.tsx
Viewed MosqueDetailModal.tsx:300-350
Viewed MosqueDetailModal.tsx:1-35
Viewed MosqueDetailModal.tsx:290-350
Edited MosqueDetailModal.tsx
Edited MosqueDetailModal.tsx
Ran command: `pnpm run build`
Ran command: `pnpm run build`
Viewed audit.prisma:1-27
Edited facilities.service.ts
Ran command: `pnpm run build`
Ran command: `pnpm test`
Ran command: `pnpm run build`
Viewed facilities-taxonomy.md:1-30
Viewed facilities-taxonomy.md:170-225
Edited facilities-taxonomy.md
Edited facilities-taxonomy.md
Viewed README.md:20-28
Edited README.md
Ran command: `git status --short`
Ran command: `git diff .gitignore`
Ran command: `git diff AGENTS.md`
Ran command: `graft build`
Ran command: `git status --short`
Ran command: `git diff _doc/prompts/pr.md`
Ran command: `git add \
  _doc/mosque-platform-production-docs/ADRs/ \
  _doc/mosque-platform-production-docs/specs/ \
  backend-nest-prisma/prisma/ \
  backend-nest-prisma/src/ \
  frontend/src/`
Ran command: `git status --short`
Ran command: `git add .gitignore AGENTS.md GEMINI.md opencode.json .gemini/`
Viewed .ignore:1-6
Ran command: `git add .ignore _doc/prompts/pr.md`
Ran command: `git status --short`
Ran command: `git commit -m "$(cat <<'EOF'
feat(facilities-taxonomy): implement Release 2 mosque facilities and capacity taxonomy

Implement F-021 full-stack vertical slice:
- Add 1:1 MosqueFacility relational model, composite indexes, and migration to Prisma schema
- Build FacilitiesModule with tiered RBAC mutation governance and transactional audit logging
- Integrate PostGIS spatial nearby radius search with multi-criteria facility filtering
- Build Ferio-designed MosqueFacilitiesCard, EditFacilitiesModal, and map search filter chips
- Register ADR-010 and complete F-021 specification proof matrix

Validated with full NestJS test suite (23/23 suites, 97/97 tests passing), Next.js Turbopack build, and production DB migration deploy.
EOF
)"`
Ran command: `git push origin main`
Ran command: `git status`

### Executive Summary of Completed Work

The full-stack vertical slice for **F-021: Enhanced Mosque Facilities & Capacity Taxonomy** (Release 2) has been implemented, validated against all architectural and security constraints, and pushed to `main`.

---

### 1. Architectural & Database Foundation (PostgreSQL / PostGIS / Prisma)

* **Prisma Schema (`facilities.module/facilities.prisma`)**:
  * Created the dedicated 1:1 [`MosqueFacility`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/prisma/schema/facilities.module/facilities.prisma) entity bound to `Mosque` (`onDelete: Cascade`).
  * Strongly-typed taxonomy covering:
    * **Capacity**: `totalCapacity` (Int, nullable), `toiletCount` (Int, nullable).
    * **Women's Prayer Provisions**: `hasFemalePrayerSpace` (Boolean, default false), `femaleCapacity` (Int, nullable).
    * **Ablution (Wudu)**: `hasSeparateWudu` (Boolean, default false), `wuduCapacity` (Int, nullable).
    * **Accessibility**: `hasWheelchairAccess` (Boolean, default false), `hasRamp` (Boolean, default false).
    * **Climate Controls**: `hasAirConditioning` (Boolean, default false), `hasFan` (Boolean, default true).
    * **Community Amenities**: `hasJanazaService` (Boolean), `hasParkingCar` (Boolean), `hasParkingBike` (Boolean), `hasLibraryMaktab` (Boolean).
  * Added composite B-Tree indexes: `[hasFemalePrayerSpace, hasWheelchairAccess]`, `[hasAirConditioning]`, and `[totalCapacity]`.
* **Database Migration**:
  * Generated and deployed migration [`20260930150000_facilities_taxonomy_release2`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/prisma/migrations/20260930150000_facilities_taxonomy_release2/migration.sql) directly to the active Neon PostgreSQL database.

---

### 2. Backend Feature Module & Tiered RBAC Governance

* **Module, Controller & Service**:
  * Built [`FacilitiesModule`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/facilities/facilities.module.ts), [`FacilitiesController`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/facilities/facilities.controller.ts), and [`FacilitiesService`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/facilities/facilities.service.ts).
  * `GET /api/v1/mosques/:id/facilities`: Public, rate-limited endpoint returning canonical facilities or `null` if unconfigured.
  * `PUT /api/v1/mosques/:id/facilities`: Authenticated endpoint guarded by tiered RBAC:
    * Only verified local mosque staff (`MOSQUE_ADMIN`, `COMMITTEE_PRESIDENT`, `COMMITTEE_SECRETARY`, `COMMITTEE_MEMBER`) or platform `admin`/`moderator` accounts can update facility records.
    * Unverified users or ordinary musallis receive `403 Forbidden`.
  * **Transactional Audit Trail & Sync**:
    * Records immutable `AuditLog` row capturing `previousValue`, `newValue`, `actorId`, and `actorRole` in the same `$transaction`.
    * Synchronizes legacy summary boolean flags on `Mosque` (`hasAirConditioning`, `hasSeparateWomenSpace`, `hasWheelchairAccess`, `capacity`) within the transaction for backwards compatibility.
  * Built architectural feature [`README.md`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/facilities/README.md) with visual Mermaid component flow and sequence diagrams.

---

### 3. High-Performance PostGIS Spatial Search Integration

* **Spherical Radius Filtering (`/api/v1/mosques/nearby`)**:
  * Extended [`NearbyMosquesQueryDto`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/mosques/dto/nearby-mosques.dto.ts) with `hasFemalePrayerSpace`, `hasWheelchairAccess`, `hasAirConditioning`, `hasJanazaService`, and `minCapacity`.
  * Updated [`MosquesService.findNearby`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/mosques/mosques.service.ts) to execute dynamic SQL joins with `MosqueFacility` over PostGIS `ST_DWithin` geographic coordinates without introducing Redis or external search dependencies.
  * Injected `facility` relation into single mosque lookup ([`findById`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/backend-nest-prisma/src/features/mosques/mosques.service.ts#L338)).

---

### 4. Ferio Frontend Design & UI Integration

* **Types & API Client**:
  * Defined [`MosqueFacility`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/types/mosque.ts) and attached `facility?: MosqueFacility | null` to `Mosque`.
  * Implemented `fetchMosqueFacilities` and `upsertMosqueFacilities` in [`frontend/src/lib/api.ts`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/lib/api.ts).
* **Components**:
  * [`MosqueFacilitiesCard.tsx`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/components/MosqueFacilitiesCard.tsx): Follows Ferio design rules (`#111114`, `#6e6e73`, `#e8e8ea`, hairline borders, 10px radii, no decorative gradients). Implements PRD Section 6 *Visible Unknowns* policy where unrecorded values render as "Not Reported" rather than misleading boolean negatives.
  * [`EditFacilitiesModal.tsx`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/components/EditFacilitiesModal.tsx): Accessible dialog with Escape key listeners, managed focus, validation feedback, and integer/boolean inputs.
  * [`MosqueFacilitiesSection.tsx`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/components/MosqueFacilitiesSection.tsx): Client boundary managing staff authorization checks and state mutations.
  * Embedded directly into the standalone Mosque Profile view ([`frontend/src/app/mosques/[id]/page.tsx`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/app/mosques/[id]/page.tsx)) and the interactive detail modal ([`frontend/src/components/MosqueDetailModal.tsx`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/components/MosqueDetailModal.tsx)).
* **Map Discovery Filter Chips**:
  * Added dynamic "Wheelchair" filter chip alongside "Women's Area", "AC", and "Parking" to the main map search bar in [`frontend/src/app/page.tsx`](file:///home/chillpc/MohammadSheakh/projects/26/bd-moshjid/bd-moshjid-project/bd-moshjid-project/frontend/src/app/page.tsx).

---

### 5. Verification & Delivery

* **Backend Unit & Integration Tests**: 23/23 test suites passing (97/97 tests passing).
* **Backend Build**: `nest build && nest build common && nest build database && nest build redis && nest build queue` completed with 0 errors.
* **Frontend Build**: Next.js Turbopack production build completed with 0 TypeScript or lint errors.
* **Graft Graph**: Updated via `graft build` (936 nodes, 2,076 edges).
* **Git Delivery**:
  * Committed as `dd83ae2`: `feat(facilities-taxonomy): implement Release 2 mosque facilities and capacity taxonomy`
  * Pushed to remote: `git@github.com:MohammadSheakh/bd-masjid.git (main -> main)`. Working tree is clean.