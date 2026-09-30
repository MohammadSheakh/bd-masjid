import request from 'supertest';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import { AttendanceController } from '../attendance.controller';
import { AttendanceService } from '../attendance.service';
import { SetAttendanceDto } from '../dto/set-attendance.dto';
import {
  IS_PUBLIC_KEY,
  AuthGuard,
  SlidingWindowRateLimitGuard,
  UserPayload,
} from '@app/common';
import { AttendanceStatus, UserRole } from '@prisma/client';

describe('AttendanceController', () => {
  let controller: AttendanceController;
  let service: jest.Mocked<AttendanceService>;

  const mockUser: UserPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: UserRole.MEMBER,
  };

  const mockAttendance = {
    id: 'att-1',
    userId: 'user-1',
    mosqueId: 'mosque-1',
    status: AttendanceStatus.REGULAR,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      setAttendance: jest.fn(),
      removeAttendance: jest.fn(),
      getSummary: jest.fn(),
      getMyMosques: jest.fn(),
    } as unknown as jest.Mocked<AttendanceService>;

    controller = new AttendanceController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('setAttendance', () => {
    it('should delegate attendance marking to service', async () => {
      const dto: SetAttendanceDto = { status: AttendanceStatus.REGULAR };
      service.setAttendance.mockResolvedValue(mockAttendance as any);

      const result = await controller.setAttendance('mosque-1', dto, mockUser);

      expect(service.setAttendance).toHaveBeenCalledWith('mosque-1', 'user-1', dto);
      expect(result).toEqual(mockAttendance);
    });
  });

  describe('removeAttendance', () => {
    it('should delegate attendance removal to service', async () => {
      const response = { success: true };
      service.removeAttendance.mockResolvedValue(response as any);

      const result = await controller.removeAttendance('mosque-1', mockUser);

      expect(service.removeAttendance).toHaveBeenCalledWith('mosque-1', 'user-1');
      expect(result).toEqual(response);
    });
  });

  describe('getSummary', () => {
    it('should retrieve attendance summary with user affiliation when authenticated', async () => {
      const summary = { regularCount: 15, occasionalCount: 4, myStatus: AttendanceStatus.REGULAR };
      service.getSummary.mockResolvedValue(summary as any);

      const result = await controller.getSummary('mosque-1', mockUser);

      expect(service.getSummary).toHaveBeenCalledWith('mosque-1', 'user-1');
      expect(result).toEqual(summary);
    });

    it('should retrieve attendance summary without user affiliation when unauthenticated', async () => {
      const summary = { regularCount: 15, occasionalCount: 4, myStatus: null };
      service.getSummary.mockResolvedValue(summary as any);

      const result = await controller.getSummary('mosque-1', undefined);

      expect(service.getSummary).toHaveBeenCalledWith('mosque-1', undefined);
      expect(result).toEqual(summary);
    });
  });

  describe('getMyMosques', () => {
    it('should retrieve mosques attended by user', async () => {
      const attended = [{ mosqueId: 'mosque-1', status: AttendanceStatus.REGULAR }];
      service.getMyMosques.mockResolvedValue(attended as any);

      const result = await controller.getMyMosques(mockUser);

      expect(service.getMyMosques).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(attended);
    });
  });

  describe('HTTP Route Integration (Supertest)', () => {
    let app: INestApplication;
    let mockAttendanceService: {
      setAttendance: jest.Mock;
      removeAttendance: jest.Mock;
      getSummary: jest.Mock;
      getMyMosques: jest.Mock;
    };

    beforeAll(async () => {
      mockAttendanceService = {
        setAttendance: jest.fn().mockResolvedValue(mockAttendance),
        removeAttendance: jest.fn().mockResolvedValue({ success: true }),
        getSummary: jest.fn().mockResolvedValue({ regularCount: 15, occasionalCount: 4, myStatus: null }),
        getMyMosques: jest.fn().mockResolvedValue([{ mosqueId: 'mosque-1', status: AttendanceStatus.REGULAR }]),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [AttendanceController],
        providers: [
          { provide: AttendanceService, useValue: mockAttendanceService },
        ],
      })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const reflector = new Reflector();
            const isPublic = reflector.getAllAndOverride<boolean>(IS_PUBLIC_KEY, [
              context.getHandler(),
              context.getClass(),
            ]);
            if (isPublic) return true;

            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              throw new UnauthorizedException('Authentication token missing or invalid');
            }

            req.user = mockUser;
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /mosques/:id/attendance-summary - allows public access with 200', async () => {
      const res = await request(app.getHttpServer()).get('/mosques/mosque-1/attendance-summary');
      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(data.regularCount).toBe(15);
    });

    it('PUT /mosques/:id/attendance - rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/attendance')
        .send({ status: AttendanceStatus.REGULAR });

      expect(res.status).toBe(401);
    });

    it('PUT /mosques/:id/attendance - rejects invalid status enum with 400', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/attendance')
        .set('Authorization', 'Bearer valid-jwt')
        .send({ status: 'INVALID_ATTENDANCE' });

      expect(res.status).toBe(400);
    });

    it('PUT /mosques/:id/attendance - accepts valid payload with 200 when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/attendance')
        .set('Authorization', 'Bearer valid-jwt')
        .send({ status: AttendanceStatus.REGULAR });

      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(data.status).toBe(AttendanceStatus.REGULAR);
    });

    it('DELETE /mosques/:id/attendance - rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).delete('/mosques/mosque-1/attendance');
      expect(res.status).toBe(401);
    });

    it('DELETE /mosques/:id/attendance - succeeds with 200 when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .delete('/mosques/mosque-1/attendance')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(data.success).toBe(true);
    });

    it('GET /attendance/my-mosques - rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).get('/attendance/my-mosques');
      expect(res.status).toBe(401);
    });

    it('GET /attendance/my-mosques - succeeds with 200 when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/attendance/my-mosques')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(Array.isArray(data)).toBe(true);
      expect(data[0].mosqueId).toBe('mosque-1');
    });
  });
});

