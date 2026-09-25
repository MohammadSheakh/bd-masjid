import { Test, TestingModule } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { App } from 'supertest/types';
import { AppModule } from './../src/app.module';

describe('Mosque Platform Endpoints (e2e)', () => {
  let app: INestApplication<App>;

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
  });

  describe('/api/v1/health/live (GET)', () => {
    it('returns status ok and timestamp', () => {
      return request(app.getHttpServer())
        .get('/api/v1/health/live')
        .expect(200)
        .expect(({ body }) => {
          expect(body.status).toBe('ok');
          expect(body.timestamp).toBeDefined();
        });
    });
  });

  describe('/api/v1/mosques (POST) validation', () => {
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
          latitude: 999, // out of range [-90, 90]
          longitude: 999,
        })
        .expect(400);
    });
  });

  afterAll(async () => {
    await app.close();
  });
});
