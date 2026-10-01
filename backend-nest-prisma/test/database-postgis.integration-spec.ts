import { Test, TestingModule } from '@nestjs/testing';
import { PrismaModule, PrismaService } from '@app/database';
import { ConfigModule } from '@nestjs/config';
import { AttendanceStatus } from '@prisma/client';

describe('PostgreSQL / PostGIS Database Integration Tests', () => {
  let prisma: PrismaService;
  let module: TestingModule;

  const testRunId = `test_${Date.now()}`;
  const createdMosqueIds: string[] = [];
  const createdUserIds: string[] = [];

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [
        ConfigModule.forRoot({
          isGlobal: true,
          envFilePath: ['.env.test', '.env'],
        }),
        PrismaModule,
      ],
    }).compile();

    prisma = module.get<PrismaService>(PrismaService);
    await prisma.$connect();
  });

  afterAll(async () => {
    try {
      if (createdMosqueIds.length > 0) {
        await prisma.userMosqueAttendance.deleteMany({
          where: { mosqueId: { in: createdMosqueIds } },
        });
        await prisma.mosque.deleteMany({
          where: { id: { in: createdMosqueIds } },
        });
      }
      if (createdUserIds.length > 0) {
        await prisma.user.deleteMany({
          where: { id: { in: createdUserIds } },
        });
      }
    } catch {
      // Best-effort cleanup
    } finally {
      if (prisma) {
        await prisma.$disconnect();
      }
      if (module) {
        await module.close();
      }
    }
  });

  describe('PostGIS Extension & Geometry Engine', () => {
    it('1. PostGIS extension is installed and operational', async () => {
      const result = await prisma.$queryRaw<Array<{ postgis_version: string }>>`
        SELECT PostGIS_Version() as postgis_version;
      `;
      expect(result).toBeDefined();
      expect(result.length).toBeGreaterThan(0);
      expect(result[0].postgis_version).toBeDefined();
    });

    it('2. Spherical geography distance calculations return correct metric values', async () => {
      // Baitul Mukarram (23.7297, 90.4125) to Gulshan Mosque (23.7925, 90.4172) ~ 6.98 km
      const result = await prisma.$queryRaw<Array<{ distance_meters: number }>>`
        SELECT ROUND(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
            ST_SetSRID(ST_MakePoint(90.4172, 23.7925), 4326)::geography
          )::numeric, 1
        )::double precision AS distance_meters;
      `;

      expect(result[0].distance_meters).toBeGreaterThan(6800);
      expect(result[0].distance_meters).toBeLessThan(7200);
    });

    it('3. ST_DWithin radial containment filter correctly isolates locations within radius', async () => {
      const within5km = await prisma.$queryRaw<Array<{ is_within: boolean }>>`
        SELECT ST_DWithin(
          ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
          ST_SetSRID(ST_MakePoint(90.4172, 23.7925), 4326)::geography,
          5000
        ) AS is_within;
      `;
      expect(within5km[0].is_within).toBe(false);

      const within10km = await prisma.$queryRaw<Array<{ is_within: boolean }>>`
        SELECT ST_DWithin(
          ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
          ST_SetSRID(ST_MakePoint(90.4172, 23.7925), 4326)::geography,
          10000
        ) AS is_within;
      `;
      expect(within10km[0].is_within).toBe(true);
    });
  });

  describe('Real-Table PostGIS Spatial Search & Duplicate Detection', () => {
    let mosqueCentralId: string;
    let mosqueNearDuplicateId: string;
    let mosqueFarId: string;

    beforeAll(async () => {
      // 1. Central mosque: Baitul Mukarram
      const central = await prisma.mosque.create({
        data: {
          name: `${testRunId}_Central_Mosque`,
          latitude: 23.7297,
          longitude: 90.4125,
          operationalStatus: 'OPEN',
          verificationStatus: 'VERIFIED',
        },
      });
      mosqueCentralId = central.id;
      createdMosqueIds.push(central.id);

      // 2. Near duplicate: ~30 meters away (0.0003 deg longitude offset at lat 23.7 is ~30.6 meters)
      const near = await prisma.mosque.create({
        data: {
          name: `${testRunId}_Near_Duplicate_Mosque`,
          latitude: 23.7297,
          longitude: 90.4128,
          operationalStatus: 'OPEN',
          verificationStatus: 'UNVERIFIED',
        },
      });
      mosqueNearDuplicateId = near.id;
      createdMosqueIds.push(near.id);

      // 3. Far mosque: ~7 km away (Gulshan)
      const far = await prisma.mosque.create({
        data: {
          name: `${testRunId}_Far_Gulshan_Mosque`,
          latitude: 23.7925,
          longitude: 90.4172,
          operationalStatus: 'OPEN',
          verificationStatus: 'VERIFIED',
        },
      });
      mosqueFarId = far.id;
      createdMosqueIds.push(far.id);
    });

    it('5. ST_DWithin on Mosque table returns nearby mosques and excludes outside radius', async () => {
      // Query within 1000 meters of Central Mosque
      const nearby = await prisma.$queryRaw<
        Array<{ id: string; name: string; distance_meters: number }>
      >`
        SELECT
          m.id,
          m.name,
          ROUND(
            ST_Distance(
              ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography
            )::numeric, 1
          )::double precision AS distance_meters
        FROM "Mosque" m
        WHERE m."isDeleted" = false
          AND m.id IN (${mosqueCentralId}, ${mosqueNearDuplicateId}, ${mosqueFarId})
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
            1000
          )
        ORDER BY distance_meters ASC;
      `;

      expect(nearby.length).toBe(2);
      expect(nearby[0].id).toBe(mosqueCentralId);
      expect(nearby[0].distance_meters).toBeLessThan(1);
      expect(nearby[1].id).toBe(mosqueNearDuplicateId);
      expect(nearby[1].distance_meters).toBeLessThan(50);
      expect(nearby.some((m) => m.id === mosqueFarId)).toBe(false);
    });

    it('6. Proximity duplicate detection flags candidates within 50m threshold', async () => {
      // Proximity check at Baitul Mukarram coords with 50m threshold
      const duplicates = await prisma.$queryRaw<
        Array<{ id: string; name: string; distance_meters: number }>
      >`
        SELECT
          m.id,
          m.name,
          ST_Distance(
            ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography
          )::double precision AS distance_meters
        FROM "Mosque" m
        WHERE m."isDeleted" = false
          AND m.id IN (${mosqueCentralId}, ${mosqueNearDuplicateId}, ${mosqueFarId})
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(90.4125, 23.7297), 4326)::geography,
            50
          );
      `;

      // Both central and near duplicate fall within 50m
      expect(duplicates.length).toBe(2);
      const duplicateIds = duplicates.map((d) => d.id);
      expect(duplicateIds).toContain(mosqueCentralId);
      expect(duplicateIds).toContain(mosqueNearDuplicateId);
      expect(duplicateIds).not.toContain(mosqueFarId);
    });
  });

  describe('Database Invariants & Compound Constraints', () => {
    let testUserId: string;
    let testMosqueId: string;

    beforeAll(async () => {
      const user = await prisma.user.create({
        data: {
          name: 'Integration Test User',
          email: `${testRunId}_user@example.com`,
          role: 'user',
        },
      });
      testUserId = user.id;
      createdUserIds.push(user.id);

      const mosque = await prisma.mosque.create({
        data: {
          name: `${testRunId}_Attendance_Mosque`,
          latitude: 23.75,
          longitude: 90.38,
        },
      });
      testMosqueId = mosque.id;
      createdMosqueIds.push(mosque.id);
    });

    it('7. Idempotent upsert correctly modifies attendance without creating duplicates', async () => {
      // First upsert to REGULAR
      const first = await prisma.userMosqueAttendance.upsert({
        where: {
          userId_mosqueId: { userId: testUserId, mosqueId: testMosqueId },
        },
        create: {
          userId: testUserId,
          mosqueId: testMosqueId,
          status: AttendanceStatus.REGULAR,
        },
        update: {
          status: AttendanceStatus.REGULAR,
        },
      });
      expect(first.status).toBe(AttendanceStatus.REGULAR);

      // Second upsert to OCCASIONAL
      const second = await prisma.userMosqueAttendance.upsert({
        where: {
          userId_mosqueId: { userId: testUserId, mosqueId: testMosqueId },
        },
        create: {
          userId: testUserId,
          mosqueId: testMosqueId,
          status: AttendanceStatus.OCCASIONAL,
        },
        update: {
          status: AttendanceStatus.OCCASIONAL,
        },
      });
      expect(second.id).toBe(first.id);
      expect(second.status).toBe(AttendanceStatus.OCCASIONAL);

      // Verify exact count in database is 1
      const count = await prisma.userMosqueAttendance.count({
        where: { userId: testUserId, mosqueId: testMosqueId },
      });
      expect(count).toBe(1);
    });

    it('8. Database unique constraint prevents duplicate user-mosque pair', async () => {
      // Direct duplicate insert must be rejected by Prisma/PostgreSQL P2002 constraint
      await expect(
        prisma.userMosqueAttendance.create({
          data: {
            userId: testUserId,
            mosqueId: testMosqueId,
            status: AttendanceStatus.REGULAR,
          },
        }),
      ).rejects.toThrow();
    });

    it('9. Concurrency test: simultaneous upserts resolve safely without race condition', async () => {
      const statuses = [
        AttendanceStatus.REGULAR,
        AttendanceStatus.OCCASIONAL,
        AttendanceStatus.REGULAR,
        AttendanceStatus.OCCASIONAL,
        AttendanceStatus.REGULAR,
      ];

      // Execute 5 concurrent upserts on the exact same compound key
      const results = await Promise.all(
        statuses.map((status) =>
          prisma.userMosqueAttendance.upsert({
            where: {
              userId_mosqueId: { userId: testUserId, mosqueId: testMosqueId },
            },
            create: {
              userId: testUserId,
              mosqueId: testMosqueId,
              status,
            },
            update: {
              status,
            },
          }),
        ),
      );

      // All 5 must have resolved to the same record ID
      const recordIds = new Set(results.map((r) => r.id));
      expect(recordIds.size).toBe(1);

      // Record count remains exactly 1
      const totalCount = await prisma.userMosqueAttendance.count({
        where: { userId: testUserId, mosqueId: testMosqueId },
      });
      expect(totalCount).toBe(1);
    });
  });

  describe('Transaction Atomicity & Failure Rollback', () => {
    it('10. Atomic transaction boundary rolls back completely upon error', async () => {
      const rollbackMosqueName = `${testRunId}_Rollback_Mosque`;

      await expect(
        prisma.$transaction(async (tx) => {
          await tx.mosque.create({
            data: {
              name: rollbackMosqueName,
              latitude: 23.7777,
              longitude: 90.3999,
              operationalStatus: 'OPEN',
              verificationStatus: 'UNVERIFIED',
            },
          });

          // Intentional failure inside transaction
          throw new Error('SIMULATED_TRANSACTION_FAILURE');
        }),
      ).rejects.toThrow('SIMULATED_TRANSACTION_FAILURE');

      // Verify record was rolled back and does not exist
      const persisted = await prisma.mosque.findFirst({
        where: { name: rollbackMosqueName },
      });
      expect(persisted).toBeNull();
    });
  });
});
