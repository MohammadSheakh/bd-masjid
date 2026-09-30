import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard, SlidingWindowRateLimitGuard, TransformResponseInterceptor, UserPayload } from '@app/common';
import { PrayerSchedulesController } from '../prayer-schedules.controller';
import { PrayerSchedulesService } from '../prayer-schedules.service';
import { UpdatePrayerScheduleDto } from '../dto/update-prayer-schedule.dto';
import { UserRole } from '@prisma/client';

describe('PrayerSchedulesController', () => {
  let controller: PrayerSchedulesController;
  let service: jest.Mocked<PrayerSchedulesService>;

  const mockActor: UserPayload = {
    userId: 'user-imam-1',
    email: 'imam@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockSchedule = {
    id: 'schedule-1',
    mosqueId: 'mosque-1',
    fajrAzan: '05:00',
    fajrIqamah: '05:15',
    dhuhrAzan: '12:30',
    dhuhrIqamah: '13:00',
    asrAzan: '16:15',
    asrIqamah: '16:30',
    maghribAzan: '18:10',
    maghribIqamah: '18:15',
    ishaAzan: '19:45',
    ishaIqamah: '20:00',
    jummahAzan: '12:30',
    jummahIqamah: '13:15',
    effectiveDate: new Date(),
  };

  beforeEach(() => {
    service = {
      getCurrentSchedule: jest.fn(),
      updateSchedule: jest.fn(),
      getHistory: jest.fn(),
    } as unknown as jest.Mocked<PrayerSchedulesService>;

    controller = new PrayerSchedulesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getCurrent', () => {
    it('should retrieve current active timetable and freshness level', async () => {
      const response = { schedule: mockSchedule, freshness: 'FRESH' };
      service.getCurrentSchedule.mockResolvedValue(response as any);

      const result = await controller.getCurrent('mosque-1');

      expect(service.getCurrentSchedule).toHaveBeenCalledWith('mosque-1');
      expect(result).toEqual(response);
    });
  });

  describe('updateSchedule', () => {
    it('should delegate schedule update to service with actor and snapshot audit', async () => {
      const dto: UpdatePrayerScheduleDto = {
        fajrAzan: '05:05',
        fajrIqamah: '05:20',
      };
      const updatedSchedule = { ...mockSchedule, ...dto };
      service.updateSchedule.mockResolvedValue(updatedSchedule as any);

      const result = await controller.updateSchedule('mosque-1', dto, mockActor);

      expect(service.updateSchedule).toHaveBeenCalledWith('mosque-1', dto, mockActor);
      expect(result).toEqual(updatedSchedule);
    });
  });

  describe('getHistory', () => {
    it('should query paginated historical snapshots', async () => {
      const history = { snapshots: [mockSchedule], total: 1 };
      service.getHistory.mockResolvedValue(history as any);

      const result = await controller.getHistory('mosque-1', 1, 10);

      expect(service.getHistory).toHaveBeenCalledWith('mosque-1', 1, 10);
      expect(result).toEqual(history);
    });
  });

  describe('HTTP Pipeline & Validation Boundary (Supertest)', () => {
    let app: any;
    let serviceMock: any;

    beforeAll(async () => {
      serviceMock = {
        getCurrentSchedule: jest.fn().mockResolvedValue({ schedule: mockSchedule, freshness: 'FRESH' }),
        updateSchedule: jest.fn().mockResolvedValue(mockSchedule),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [PrayerSchedulesController],
        providers: [
          { provide: PrayerSchedulesService, useValue: serviceMock },
        ],
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
              req.user = mockActor;
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
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      app.useGlobalInterceptors(new TransformResponseInterceptor());
      await app.init();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('publicly returns current schedule with 200 on GET /mosques/:id/prayer-schedule', async () => {
      const res = await request(app.getHttpServer())
        .get('/mosques/mosque-1/prayer-schedule');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(res.body.data.freshness).toBe('FRESH');
    });

    it('rejects PUT /mosques/:id/prayer-schedule with 401 when no bearer token is supplied', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/prayer-schedule')
        .send({ fajrAzan: '05:05' });

      expect(res.status).toBe(401);
    });

    it('accepts authorized PUT /mosques/:id/prayer-schedule and returns updated timetable', async () => {
      const res = await request(app.getHttpServer())
        .put('/mosques/mosque-1/prayer-schedule')
        .set('Authorization', 'Bearer valid-imam-token')
        .send({ fajrAzan: '05:05' });

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(serviceMock.updateSchedule).toHaveBeenCalled();
    });
  });
});
