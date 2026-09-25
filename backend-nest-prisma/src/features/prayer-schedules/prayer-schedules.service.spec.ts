import { Test, TestingModule } from '@nestjs/testing';
import { PrayerSchedulesService } from './prayer-schedules.service';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import { NotFoundException } from '@nestjs/common';

describe('PrayerSchedulesService', () => {
  let service: PrayerSchedulesService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      mosque: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      prayerSchedule: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      prayerScheduleHistory: {
        create: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
      },
    };

    audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        PrayerSchedulesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<PrayerSchedulesService>(PrayerSchedulesService);
  });

  describe('updateSchedule', () => {
    it('should throw NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSchedule('invalid-id', { fajrJamaat: '05:15' }, {
          userId: 'user-1',
          email: 'u@example.com',
          role: 'user',
          permissions: [],
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('should atomically update schedule, create history snapshot, and touch mosque', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      const mockSchedule = {
        id: 'sched-1',
        mosqueId: 'mosque-1',
        fajrJamaat: '05:15',
        updatedAt: new Date(),
      };
      prisma.prayerSchedule.upsert.mockResolvedValue(mockSchedule);

      const result = await service.updateSchedule(
        'mosque-1',
        { fajrJamaat: '05:15', reason: 'Summer adjustment' },
        { userId: 'user-1', email: 'u@example.com', role: 'user', permissions: [] },
      );

      expect(result.id).toBe('sched-1');
      expect(prisma.prayerSchedule.upsert).toHaveBeenCalled();
      expect(prisma.prayerScheduleHistory.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            mosqueId: 'mosque-1',
            reason: 'Summer adjustment',
          }),
        }),
      );
      expect(prisma.mosque.update).toHaveBeenCalledWith(
        expect.objectContaining({ where: { id: 'mosque-1' } }),
      );
      expect(audit.record).toHaveBeenCalled();
    });
  });
});
