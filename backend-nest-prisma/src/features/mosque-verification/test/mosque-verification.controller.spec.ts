import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import {
  AuthGuard,
  RolesGuard,
  SlidingWindowRateLimitGuard,
  TransformResponseInterceptor,
  UserPayload,
} from '@app/common';
import { MosqueVerificationController } from '../mosque-verification.controller';
import { MosqueVerificationService } from '../mosque-verification.service';
import { VerifyMosqueDto, RejectMosqueDto } from '../dto/verification.dto';
import { MosqueVerificationStatus, UserRole } from '@prisma/client';

describe('MosqueVerificationController', () => {
  let controller: MosqueVerificationController;
  let service: jest.Mocked<MosqueVerificationService>;

  const mockAdmin: UserPayload = {
    userId: 'admin-1',
    email: 'admin@platform.org',
    role: UserRole.ADMIN,
  };

  const mockMosque = {
    id: 'mosque-1',
    name: 'Baitul Mukarram',
    verificationStatus: MosqueVerificationStatus.VERIFIED,
  };

  beforeEach(() => {
    service = {
      getPendingMosques: jest.fn(),
      verifyMosque: jest.fn(),
      rejectMosque: jest.fn(),
    } as unknown as jest.Mocked<MosqueVerificationService>;

    controller = new MosqueVerificationController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPendingMosques', () => {
    it('should retrieve pending mosques with pagination', async () => {
      const pending = { items: [mockMosque], total: 1, page: 1, limit: 20 };
      service.getPendingMosques.mockResolvedValue(pending as any);

      const result = await controller.getPendingMosques(1, 20);

      expect(service.getPendingMosques).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(pending);
    });
  });

  describe('verifyMosque', () => {
    it('should verify mosque with audit logging and actor context', async () => {
      const dto: VerifyMosqueDto = {
        notes: 'Verified via municipal committee register',
      };
      service.verifyMosque.mockResolvedValue(mockMosque as any);

      const result = await controller.verifyMosque('mosque-1', dto, mockAdmin);

      expect(service.verifyMosque).toHaveBeenCalledWith(
        'mosque-1',
        dto,
        mockAdmin,
      );
      expect(result).toEqual(mockMosque);
    });
  });

  describe('rejectMosque', () => {
    it('should reject mosque with required reason and actor context', async () => {
      const dto: RejectMosqueDto = {
        reason: 'Duplicate building structure and incorrect coordinates',
      };
      const rejectedMosque = {
        ...mockMosque,
        verificationStatus: MosqueVerificationStatus.REJECTED,
      };
      service.rejectMosque.mockResolvedValue(rejectedMosque as any);

      const result = await controller.rejectMosque('mosque-1', dto, mockAdmin);

      expect(service.rejectMosque).toHaveBeenCalledWith(
        'mosque-1',
        dto,
        mockAdmin,
      );
      expect(result).toEqual(rejectedMosque);
    });
  });

  describe('HTTP Pipeline & Validation Boundary (Supertest)', () => {
    let app: any;
    let serviceMock: any;

    beforeAll(async () => {
      serviceMock = {
        getPendingMosques: jest
          .fn()
          .mockResolvedValue({ items: [mockMosque], total: 1 }),
        verifyMosque: jest.fn().mockResolvedValue(mockMosque),
        rejectMosque: jest.fn().mockResolvedValue(mockMosque),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [MosqueVerificationController],
        providers: [
          { provide: MosqueVerificationService, useValue: serviceMock },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: any) => {
            const req = context.switchToHttp().getRequest();
            const auth = req.headers['authorization'];
            if (auth && auth.startsWith('Bearer valid-admin')) {
              req.user = mockAdmin;
              return true;
            }
            throw new (require('@nestjs/common').UnauthorizedException)();
          },
        })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
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

    it('rejects GET /admin/mosques/pending-verification with 401 when no token is provided', async () => {
      const res = await request(app.getHttpServer()).get(
        '/admin/mosques/pending-verification',
      );

      expect(res.status).toBe(401);
    });

    it('returns 200 and wrapped list on GET /admin/mosques/pending-verification with admin token', async () => {
      const res = await request(app.getHttpServer())
        .get('/admin/mosques/pending-verification')
        .set('Authorization', 'Bearer valid-admin-token');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.items).toBeDefined();
    });

    it('rejects POST /admin/mosques/:id/reject with 400 when reason is missing', async () => {
      const res = await request(app.getHttpServer())
        .post('/admin/mosques/mosque-1/reject')
        .set('Authorization', 'Bearer valid-admin-token')
        .send({});

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });
});
