import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AuthGuard,
  SlidingWindowRateLimitGuard,
  TransformResponseInterceptor,
  UserPayload,
} from '@app/common';
import { FacilitiesController } from '../facilities.controller';
import { FacilitiesService } from '../facilities.service';
import { UpsertFacilityDto } from '../dto/upsert-facility.dto';
import { UserRole } from '@prisma/client';

describe('FacilitiesController', () => {
  let controller: FacilitiesController;
  let service: jest.Mocked<FacilitiesService>;

  const mockAdminActor: UserPayload = {
    userId: 'user-admin-1',
    email: 'admin@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockFacilities = {
    id: 'fac-1',
    mosqueId: 'mosque-1',
    hasWudu: true,
    hasSeparateWomenSpace: true,
    capacity: 2500,
    isWheelchairAccessible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      getFacilities: jest.fn(),
      upsertFacilities: jest.fn(),
    } as unknown as jest.Mocked<FacilitiesService>;

    controller = new FacilitiesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFacilities', () => {
    it('should return facilities taxonomy for given mosque', async () => {
      service.getFacilities.mockResolvedValue(mockFacilities as any);

      const result = await controller.getFacilities('mosque-1');

      expect(service.getFacilities).toHaveBeenCalledWith('mosque-1');
      expect(result).toEqual(mockFacilities);
    });
  });

  describe('upsertFacilities', () => {
    it('should delegate upsert to service with actor and dto', async () => {
      const dto: UpsertFacilityDto = {
        hasWudu: true,
        hasSeparateWomenSpace: true,
        capacity: 3000,
        isWheelchairAccessible: true,
      };
      const updated = { ...mockFacilities, capacity: 3000 };
      service.upsertFacilities.mockResolvedValue(updated as any);

      const result = await controller.upsertFacilities(
        'mosque-1',
        dto,
        mockAdminActor,
      );

      expect(service.upsertFacilities).toHaveBeenCalledWith(
        'mosque-1',
        dto,
        mockAdminActor,
      );
      expect(result).toEqual(updated);
    });
  });

  describe('HTTP Pipeline & Validation Boundary (Supertest)', () => {
    let app: any;
    let serviceMock: any;

    beforeAll(async () => {
      serviceMock = {
        getFacilities: jest.fn().mockResolvedValue(mockFacilities),
        upsertFacilities: jest.fn().mockResolvedValue(mockFacilities),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [FacilitiesController],
        providers: [{ provide: FacilitiesService, useValue: serviceMock }],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: any) => {
            const reflector = new (require('@nestjs/core').Reflector)();
            const isPublic = reflector.getAllAndOverride(
              require('@app/common').IS_PUBLIC_KEY,
              [context.getHandler(), context.getClass()],
            );
            const req = context.switchToHttp().getRequest();
            const auth = req.headers['authorization'];
            if (auth && auth.startsWith('Bearer valid')) {
              req.user = mockAdminActor;
              return true;
            }
            if (isPublic) {
              return true;
            }
            throw new (require('@nestjs/common').UnauthorizedException)();
          },
        })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({ whitelist: true, transform: true }),
      );
      app.useGlobalInterceptors(new TransformResponseInterceptor());
      await app.init();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('publicly returns 200 and wrapped data on GET /mosques/:id/facilities', async () => {
      const res = await request(app.getHttpServer()).get(
        '/mosques/mosque-1/facilities',
      );

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.id).toBe('fac-1');
    });

    it('rejects PUT /mosques/:id/facilities with 401 when no bearer token is supplied', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/facilities')
        .send({ capacity: 500 });

      expect(res.status).toBe(401);
    });

    it('accepts authorized PUT /mosques/:id/facilities and updates taxonomy', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/facilities')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({
          capacity: 3500,
          hasWudu: true,
          hasSeparateWomenSpace: true,
        });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(serviceMock.upsertFacilities).toHaveBeenCalled();
    });
  });
});
