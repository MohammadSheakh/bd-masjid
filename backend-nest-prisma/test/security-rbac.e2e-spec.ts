import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { JwtService } from '@nestjs/jwt';
import { ConfigService } from '@nestjs/config';
import { AppModule } from './../src/app.module';

describe('Security, RBAC & Parameter Integrity (e2e)', () => {
  let app: INestApplication<App>;
  let jwtService: JwtService;
  let configService: ConfigService;

  let regularUserToken: string;
  let adminUserToken: string;

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

    jwtService = app.get(JwtService);
    configService = app.get(ConfigService);

    const jwtSecret =
      configService.get<string>('JWT_ACCESS_SECRET') || 'test-secret';

    // Generate authenticated test tokens
    regularUserToken = jwtService.sign(
      {
        userId: 'test-user-id-regular',
        email: 'regular@example.com',
        role: 'user',
        permissions: [],
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );

    adminUserToken = jwtService.sign(
      {
        userId: 'test-user-id-admin',
        email: 'admin@example.com',
        role: 'admin',
        permissions: ['*'],
      },
      { secret: jwtSecret, expiresIn: '1h' },
    );
  });

  afterAll(async () => {
    if (app) {
      await app.close();
    }
  });

  describe('1. Unauthenticated Caller Defense (401 Unauthorized)', () => {
    it('rejects access to admin pending verification queue without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/mosques/pending-verification')
        .expect(401);
    });

    it('rejects access to audit logs without token', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .expect(401);
    });

    it('rejects attendance modification without token', () => {
      return request(app.getHttpServer())
        .put('/api/v1/mosques/some-mosque-id/attendance')
        .send({ status: 'REGULAR' })
        .expect(401);
    });
  });

  describe('2. Role-Based Access Control (403 Forbidden)', () => {
    it('denies standard user access to admin pending verification queue', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/mosques/pending-verification')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('denies standard user access to security audit log records', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/audit-logs')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .expect(403);
    });

    it('allows admin access to admin verification queue', () => {
      return request(app.getHttpServer())
        .get('/api/v1/admin/mosques/pending-verification')
        .set('Authorization', `Bearer ${adminUserToken}`)
        .expect(200);
    });
  });

  describe('3. Mass Assignment & Strict DTO Whitelisting', () => {
    it('rejects payload containing unwhitelisted or privilege-escalating properties', () => {
      return request(app.getHttpServer())
        .post('/api/v1/mosques')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          name: 'Security Test Mosque',
          latitude: 23.75,
          longitude: 90.38,
          // Malicious rogue properties intended for mass-assignment privilege escalation
          role: 'admin',
          verificationStatus: 'VERIFIED',
          isAdmin: true,
          hackedProperty: 'malicious',
        })
        .expect(400)
        .expect(({ body }) => {
          // Confirm forbidNonWhitelisted actively blocked the rogue property
          const message = JSON.stringify(body);
          expect(message).toContain('should not exist');
        });
    });

    it('rejects coordinates out of valid geographical boundaries', () => {
      return request(app.getHttpServer())
        .post('/api/v1/mosques')
        .set('Authorization', `Bearer ${regularUserToken}`)
        .send({
          name: 'Out of Bounds Mosque',
          latitude: 91.5, // Latitude must be between -90 and 90
          longitude: 90.38,
        })
        .expect(400);
    });
  });

  describe('4. Operational Health & Live Monitoring', () => {
    it('allows unauthenticated health liveness probes', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe('ok');
          expect(body.timestamp).toBeDefined();
        });
    });

    it('allows unauthenticated health readiness probe', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/ready')
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe('ready');
        });
    });
  });
});
