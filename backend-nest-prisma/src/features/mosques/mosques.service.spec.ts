import { Test, TestingModule } from '@nestjs/testing';
import { MosquesService } from './mosques.service';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import { ConflictException } from '@nestjs/common';

describe('MosquesService', () => {
  let service: MosquesService;
  let prisma: any;
  let audit: any;

  beforeEach(async () => {
    prisma = {
      $queryRaw: jest.fn(),
      $transaction: jest.fn((callback) => callback(prisma)),
      mosque: {
        create: jest.fn(),
        findUnique: jest.fn(),
        findMany: jest.fn(),
        count: jest.fn(),
        update: jest.fn(),
      },
      prayerSchedule: {
        create: jest.fn(),
        findMany: jest.fn(),
      },
      prayerScheduleHistory: {
        create: jest.fn(),
      },
      userMosqueAttendance: {
        count: jest.fn().mockResolvedValue(0),
        findUnique: jest.fn().mockResolvedValue(null),
      },
    };

    audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MosquesService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<MosquesService>(MosquesService);
  });

  describe('deriveFreshness', () => {
    it('should return VERY_STALE if updatedAt is null', () => {
      const freshness = service.deriveFreshness(null);
      expect(freshness.level).toBe('VERY_STALE');
      expect(freshness.daysAgo).toBe(999);
    });

    it('should return FRESH for schedule updated within 90 days', () => {
      const tenDaysAgo = new Date(Date.now() - 10 * 24 * 60 * 60 * 1000);
      const freshness = service.deriveFreshness(tenDaysAgo);
      expect(freshness.level).toBe('FRESH');
      expect(freshness.daysAgo).toBe(10);
    });

    it('should return STALE for schedule updated 100 days ago', () => {
      const hundredDaysAgo = new Date(Date.now() - 100 * 24 * 60 * 60 * 1000);
      const freshness = service.deriveFreshness(hundredDaysAgo);
      expect(freshness.level).toBe('STALE');
      expect(freshness.daysAgo).toBe(100);
    });

    it('should return VERY_STALE for schedule updated 200 days ago', () => {
      const twoHundredDaysAgo = new Date(Date.now() - 200 * 24 * 60 * 60 * 1000);
      const freshness = service.deriveFreshness(twoHundredDaysAgo);
      expect(freshness.level).toBe('VERY_STALE');
      expect(freshness.daysAgo).toBe(200);
    });
  });

  describe('create', () => {
    it('should throw ConflictException if duplicate candidate exists within 50m and bypass is false', async () => {
      prisma.$queryRaw.mockResolvedValue([
        { id: 'existing-1', name: 'Nearby Mosque', distance: 25.4 },
      ]);

      await expect(
        service.create({
          name: 'New Mosque',
          latitude: 23.75,
          longitude: 90.39,
          allowDuplicateWarningBypass: false,
        }),
      ).rejects.toThrow(ConflictException);
    });

    it('should create mosque successfully when bypass is true even if candidates exist', async () => {
      const mockCreated = {
        id: 'new-1',
        name: 'New Mosque',
        latitude: 23.75,
        longitude: 90.39,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      prisma.mosque.create.mockResolvedValue(mockCreated);

      const result = await service.create({
        name: 'New Mosque',
        latitude: 23.75,
        longitude: 90.39,
        allowDuplicateWarningBypass: true,
      });

      expect(result.id).toBe('new-1');
      expect(prisma.mosque.create).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalled();
    });
  });
});
