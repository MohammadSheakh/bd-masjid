import { Test, TestingModule } from '@nestjs/testing';
import { MosquesService } from '../mosques.service';
import { PrismaService } from '@app/database';
import { AuditService } from '../../audit/audit.service';
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
      mosqueFacility: {
        findMany: jest.fn().mockResolvedValue([]),
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
      const twoHundredDaysAgo = new Date(
        Date.now() - 200 * 24 * 60 * 60 * 1000,
      );
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

  describe('reverseGeocode', () => {
    it('should throw BadRequestException if latitude is out of bounds', async () => {
      await expect(service.reverseGeocode(95, 90)).rejects.toThrow();
    });

    it('should return location details when Nominatim responds', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockResolvedValue({
        ok: true,
        json: async () => ({
          name: 'Central Mosque',
          display_name: 'Central Mosque, Dhanmondi, Dhaka, Bangladesh',
          address: {
            road: 'Road 27',
            suburb: 'Dhanmondi',
            city: 'Dhaka',
            country: 'Bangladesh',
          },
        }),
      } as any);

      const result = await service.reverseGeocode(23.7465, 90.376);
      expect(result.road).toBe('Road 27');
      expect(result.suburb).toBe('Dhanmondi');
      expect(result.city).toBe('Dhaka');
      expect(result.placeName).toBe('Central Mosque');

      global.fetch = originalFetch;
    });

    it('should return fallback object gracefully if fetch throws', async () => {
      const originalFetch = global.fetch;
      global.fetch = jest.fn().mockRejectedValue(new Error('Network error'));

      const result = await service.reverseGeocode(23.75, 90.39);
      expect(result.city).toBe('Dhaka');
      expect(result.country).toBe('Bangladesh');

      global.fetch = originalFetch;
    });
  });

  describe('findNearby', () => {
    it('should query nearby mosques and attach facilities and prayer schedules', async () => {
      const mockRawMosque = {
        id: 'mosque-1',
        name: 'Dhanmondi Shahi Masjid',
        latitude: 23.74,
        longitude: 90.38,
        address: 'Road 7',
        landmark: null,
        city: 'Dhaka',
        country: 'Bangladesh',
        operationalStatus: 'OPEN',
        verificationStatus: 'VERIFIED',
        hasWuduArea: true,
        hasSeparateWomenSpace: true,
        hasAirConditioning: true,
        hasParking: true,
        hasWheelchairAccess: true,
        hasJanazaFacility: false,
        capacity: 1000,
        createdAt: new Date(),
        updatedAt: new Date(),
        distanceMeters: 450.5,
      };

      const mockFacility = {
        id: 'fac-1',
        mosqueId: 'mosque-1',
        hasFemalePrayerSpace: true,
        hasWheelchairAccess: true,
        hasAirConditioning: true,
        totalCapacity: 1200,
      };

      prisma.$queryRaw.mockResolvedValue([mockRawMosque]);
      prisma.prayerSchedule.findMany.mockResolvedValue([]);
      prisma.mosqueFacility.findMany.mockResolvedValue([mockFacility]);

      const results = await service.findNearby({
        lat: 23.74,
        lng: 90.38,
        hasFemalePrayerSpace: true,
        hasAirConditioning: true,
        minCapacity: 500,
      });

      expect(results).toHaveLength(1);
      expect(results[0].id).toBe('mosque-1');
      expect(results[0].facility).toEqual(mockFacility);
      expect(results[0].distanceMeters).toBe(450.5);
      expect(prisma.$queryRaw).toHaveBeenCalled();
    });
  });

  describe('softDelete', () => {
    it('should mark mosque as deleted and record audit event', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1', isDeleted: false });
      prisma.mosque.update.mockResolvedValue({ id: 'mosque-1', isDeleted: true });

      const actor: any = { userId: 'admin-1', role: 'admin' };
      const res = await service.softDelete('mosque-1', actor);

      expect(res.deleted).toBe(true);
      expect(prisma.mosque.update).toHaveBeenCalledWith({
        where: { id: 'mosque-1' },
        data: { isDeleted: true },
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({ action: 'MOSQUE_DELETED' }),
      );
    });
  });
});


