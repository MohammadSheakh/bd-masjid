import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';
import { PrismaService } from '@app/database';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';

describe('Mosque Platform Endpoints & Lifecycle (e2e)', () => {
  let app: INestApplication<App>;
  let prisma: PrismaService;
  let jwtService: JwtService;
  let configService: ConfigService;

  let regularUserToken: string;
  let adminUserToken: string;

  const testRunId = `e2e_${Date.now()}`;
  const testMosqueName = `${testRunId} Baitul Aman Test Mosque`;
  let createdMosqueId: string;

  let testRegularUserId: string;
  let testAdminUserId: string;

  beforeAll(async () => {
    const moduleFixture: TestingModule = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = moduleFixture.createNestApplication();
    app.useGlobalPipes(
      new ValidationPipe({
        whitelist: true,
        forbidNonWhitelisted: true,
        transform: true,
      }),
    );
    app.setGlobalPrefix('api/v1');
    await app.init();

    prisma = app.get(PrismaService);
    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);

    // Create real database users to satisfy Postgres Foreign Key constraints
    const regularUser = await prisma.user.create({
      data: {
        name: 'Regular Lifecycle User',
        email: `${testRunId}_regular@example.com`,
        role: 'user',
      },
    });
    testRegularUserId = regularUser.id;

    const adminUser = await prisma.user.create({
      data: {
        name: 'Admin Lifecycle User',
        email: `${testRunId}_admin@example.com`,
        role: 'admin',
      },
    });
    testAdminUserId = adminUser.id;

    const jwtSecret =
      configService.get<string>('JWT_ACCESS_SECRET') || 'test-secret';

    regularUserToken = jwtService.sign(
      {
        userId: testRegularUserId,
        email: regularUser.email,
        role: 'user',
        permissions: [],
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    adminUserToken = jwtService.sign(
      {
        userId: testAdminUserId,
        email: adminUser.email,
        role: 'admin',
        permissions: ['*'],
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    try {
      if (createdMosqueId) {
        await prisma.userMosqueAttendance.deleteMany({
          where: { mosqueId: createdMosqueId },
        });
        await prisma.prayerScheduleHistory.deleteMany({
          where: { mosqueId: createdMosqueId },
        });
        await prisma.prayerSchedule.deleteMany({
          where: { mosqueId: createdMosqueId },
        });
        await prisma.mosque.deleteMany({
          where: { id: createdMosqueId },
        });
      }
      if (testRegularUserId || testAdminUserId) {
        await prisma.user.deleteMany({
          where: {
            id: { in: [testRegularUserId, testAdminUserId].filter(Boolean) },
          },
        });
      }
    } catch {
      // Best-effort teardown
    } finally {
      if (app) {
        await app.close();
      }
    }
  });

  describe('1. Parameter Validation & Security Gate', () => {
    it('rejects mosque creation without mandatory name', () => {
      return request(app.getHttpServer())
        .post('/api/v1/mosques')
        .send({
          latitude: 23.8103,
          longitude: 90.4125,
        })
        .expect(400);
    });

    it('rejects invalid coordinate parameters', () => {
      return request(app.getHttpServer())
        .post('/api/v1/mosques')
        .send({
          name: 'Invalid Coords Mosque',
          latitude: 999,
          longitude: 999,
        })
        .expect(400);
    });
  });

  describe('2. Mosque Submission & Retrieval Lifecycle', () => {
    it('creates a new mosque with default unverified status', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/mosques')
        .send({
          name: testMosqueName,
          latitude: 23.8103,
          longitude: 90.4125,
          city: 'Dhaka',
          hasWuduArea: true,
        })
        .expect(201);

      expect(response.body).toBeDefined();
      const payload = response.body.data || response.body;
      expect(payload.id).toBeDefined();
      expect(payload.name).toBe(testMosqueName);
      expect(payload.verificationStatus).toBe('UNVERIFIED');
      expect(payload.operationalStatus).toBe('OPEN');
      expect(payload.freshness).toBeDefined();

      createdMosqueId = payload.id;
    });

    it('retrieves the created mosque profile by ID with freshness derivation', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/mosques/${createdMosqueId}`)
        .expect(200);

      const payload = response.body.data || response.body;
      expect(payload.id).toBe(createdMosqueId);
      expect(payload.name).toBe(testMosqueName);
      expect(payload.freshness).toBeDefined();
    });

    it('returns 404 when querying a non-existent mosque ID', () => {
      return request(app.getHttpServer())
        .get('/api/v1/mosques/non-existent-mosque-cuid-9999')
        .expect(404);
    });
  });

  describe('3. PostGIS Radial Discovery & Duplicate Candidate Check', () => {
    it('finds created mosque within nearby radial query', async () => {
      const response = await request(app.getHttpServer())
        .get('/api/v1/mosques/nearby?lat=23.8103&lng=90.4125&radiusMeters=5000')
        .expect(200);

      const payload = response.body.data || response.body;
      expect(Array.isArray(payload)).toBe(true);
      const found = payload.find((m: any) => m.id === createdMosqueId);
      expect(found).toBeDefined();
      expect(found.distanceMeters).toBeLessThan(50);
    });

    it('pre-flight duplicate check detects created mosque at proximity coordinates', async () => {
      const response = await request(app.getHttpServer())
        .post('/api/v1/mosques/check-duplicate')
        .send({
          latitude: 23.8103,
          longitude: 90.4125,
        })
        .expect(200);

      const payload = response.body.data || response.body;
      expect(payload.candidates).toBeDefined();
      expect(Array.isArray(payload.candidates)).toBe(true);
      const isCandidate = payload.candidates.some(
        (c: any) => c.mosqueId === createdMosqueId || c.name === testMosqueName,
      );
      expect(isCandidate).toBe(true);
    });
  });

  describe('4. Prayer Schedule Management & Audit History', () => {
    it('denies unprivileged user from modifying prayer schedule (403 Forbidden)', () => {
      return request(app.getHttpServer())
        .put(`/api/v1/mosques/${createdMosqueId}/prayer-schedule`)
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          fajrJamaat: '05:25',
          zuhrJamaat: '13:15',
          reason: 'Unauthorized change attempt',
        })
        .expect(403);
    });

    it('updates prayer timetable with authorized token and touches freshness metadata', async () => {
      const response = await request(app.getHttpServer())
        .put(`/api/v1/mosques/${createdMosqueId}/prayer-schedule`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          fajrStart: '05:00',
          fajrJamaat: '05:25',
          zuhrStart: '12:05',
          zuhrJamaat: '13:15',
          asrStart: '16:30',
          asrJamaat: '16:45',
          maghribStart: '18:10',
          maghribJamaat: '18:15',
          ishaStart: '19:30',
          ishaJamaat: '20:00',
          reason: 'Winter timetable adjustment',
        })
        .expect(200);

      const payload = response.body.data || response.body;
      expect(payload.fajrJamaat).toBe('05:25');
      expect(payload.zuhrJamaat).toBe('13:15');
    });

    it('creates immutable historical snapshot entry in prayer schedule history', async () => {
      const response = await request(app.getHttpServer())
        .get(`/api/v1/mosques/${createdMosqueId}/prayer-schedule/history`)
        .expect(200);

      const payload = response.body.data || response.body;
      const historyList = Array.isArray(payload)
        ? payload
        : payload.items || [];
      expect(historyList.length).toBeGreaterThan(0);
      const latest = historyList[0];
      expect(latest.mosqueId).toBe(createdMosqueId);
    });
  });

  describe('5. Admin Mosque Verification State Machine', () => {
    it('transitions mosque status from UNVERIFIED to VERIFIED via admin endpoint', async () => {
      const response = await request(app.getHttpServer())
        .post(`/api/v1/admin/mosques/${createdMosqueId}/verify`)
        .set('Authorization', `Bearer ${adminUserToken}`)
        .send({
          notes: 'Verified via on-ground community elder contact',
        });

      expect([200, 201]).toContain(response.status);
      const payload = response.body.data || response.body;
      expect(payload.verificationStatus).toBe('VERIFIED');

      // Verify persistence directly on public GET route
      const getRes = await request(app.getHttpServer())
        .get(`/api/v1/mosques/${createdMosqueId}`)
        .expect(200);

      const getPayload = getRes.body.data || getRes.body;
      expect(getPayload.verificationStatus).toBe('VERIFIED');
    });
  });
});
