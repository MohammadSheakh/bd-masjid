import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { SuggestionStatus, ReportType } from '@prisma/client';
import { SuggestionsService } from '../suggestions.service';
import { PrismaService } from '@app/database';
import { AuditService } from '../../audit/audit.service';
import { PrayerSchedulesService } from '../../prayer-schedules/prayer-schedules.service';
import type { UserPayload } from '@app/common';

describe('SuggestionsService', () => {
  let service: SuggestionsService;

  const mockPrisma = {
    mosque: {
      findUnique: jest.fn(),
    },
    mosqueSuggestion: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    mosqueReport: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue({ id: 'audit-sugg-1' }),
  };

  const mockPrayerSchedulesService = {
    updateSchedule: jest.fn().mockResolvedValue({ id: 'sched-1' }),
  };

  const adminActor: UserPayload = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        SuggestionsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
        { provide: PrayerSchedulesService, useValue: mockPrayerSchedulesService },
      ],
    }).compile();

    service = module.get<SuggestionsService>(SuggestionsService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('createSuggestion', () => {
    it('throws NotFoundException if mosque does not exist', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.createSuggestion('nonexistent', {
          suggestedTimes: { fajrJamaat: '05:15' },
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('auto-applies schedule and sets status to RESOLVED when suggestedTimes provided', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Test Mosque',
      });
      mockPrisma.mosqueSuggestion.create.mockResolvedValue({
        id: 'sugg-1',
        mosqueId: 'mosque-1',
        suggestedTimes: { fajrJamaat: '05:20' },
        status: SuggestionStatus.RESOLVED,
      });

      const res = await service.createSuggestion(
        'mosque-1',
        {
          suggestedTimes: { fajrJamaat: '05:20' },
          description: 'Summer time change',
        },
        'user-1',
      );

      expect(res.id).toBe('sugg-1');
      expect(mockPrayerSchedulesService.updateSchedule).toHaveBeenCalledWith(
        'mosque-1',
        {
          fajrJamaat: '05:20',
          reason: 'Summer time change',
        },
        undefined,
      );
      expect(mockPrisma.mosqueSuggestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mosqueId: 'mosque-1',
          userId: 'user-1',
          status: SuggestionStatus.RESOLVED,
        }),
      });
    });

    it('creates OPEN suggestion without updating schedule when suggestedTimes is empty', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Test Mosque',
      });
      mockPrisma.mosqueSuggestion.create.mockResolvedValue({
        id: 'sugg-2',
        mosqueId: 'mosque-1',
        status: SuggestionStatus.OPEN,
      });

      const res = await service.createSuggestion(
        'mosque-1',
        {
          description: 'Please add wheelchair ramp',
        },
        'user-1',
      );

      expect(res.id).toBe('sugg-2');
      expect(mockPrayerSchedulesService.updateSchedule).not.toHaveBeenCalled();
      expect(mockPrisma.mosqueSuggestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mosqueId: 'mosque-1',
          userId: 'user-1',
          status: SuggestionStatus.OPEN,
        }),
      });
    });

    it('creates OPEN suggestion with suggestedFacilities payload', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Test Mosque',
      });
      mockPrisma.mosqueSuggestion.create.mockResolvedValue({
        id: 'sugg-3',
        mosqueId: 'mosque-1',
        status: SuggestionStatus.OPEN,
      });

      const res = await service.createSuggestion(
        'mosque-1',
        {
          description: 'Suggesting new facilities',
          suggestedFacilities: {
            hasFemalePrayerSpace: true,
            customAmenities: ['Elevator / Lift', 'Solar Power'],
          },
        },
        'user-1',
      );

      expect(res.id).toBe('sugg-3');
      expect(mockPrisma.mosqueSuggestion.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mosqueId: 'mosque-1',
          userId: 'user-1',
          suggestedFacilities: {
            hasFemalePrayerSpace: true,
            customAmenities: ['Elevator / Lift', 'Solar Power'],
          },
          status: SuggestionStatus.OPEN,
        }),
      });
    });
  });

  describe('createReport', () => {
    it('throws NotFoundException if mosque does not exist', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.createReport('nonexistent', {
          type: ReportType.LOCATION,
          description: 'Pin is 200m off',
        }),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates discrepancy report successfully', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Test Mosque',
      });
      mockPrisma.mosqueReport.create.mockResolvedValue({
        id: 'rep-1',
        mosqueId: 'mosque-1',
        type: ReportType.LOCATION,
        status: SuggestionStatus.OPEN,
      });

      const res = await service.createReport(
        'mosque-1',
        {
          type: ReportType.LOCATION,
          description: 'Pin is 200m off',
          contactEmail: 'reporter@example.com',
        },
        'user-1',
      );

      expect(res.id).toBe('rep-1');
      expect(mockPrisma.mosqueReport.create).toHaveBeenCalledWith({
        data: expect.objectContaining({
          mosqueId: 'mosque-1',
          type: ReportType.LOCATION,
          status: SuggestionStatus.OPEN,
        }),
      });
    });
  });

  describe('updateSuggestionStatus', () => {
    it('throws NotFoundException if suggestion does not exist', async () => {
      mockPrisma.mosqueSuggestion.findUnique.mockResolvedValue(null);

      await expect(
        service.updateSuggestionStatus(
          'nonexistent',
          { status: SuggestionStatus.RESOLVED },
          adminActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates status and logs audit record on approval', async () => {
      const existing = {
        id: 'sugg-1',
        status: SuggestionStatus.OPEN,
      };
      mockPrisma.mosqueSuggestion.findUnique.mockResolvedValue(existing);
      mockPrisma.mosqueSuggestion.update.mockResolvedValue({
        ...existing,
        status: SuggestionStatus.RESOLVED,
      });

      const res = await service.updateSuggestionStatus(
        'sugg-1',
        {
          status: SuggestionStatus.RESOLVED,
          resolutionNotes: 'Applied new Jamaat schedule',
        },
        adminActor,
      );

      expect(res.status).toBe(SuggestionStatus.RESOLVED);
      expect(mockAudit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'SUGGESTION_REVIEWED',
          entityId: 'sugg-1',
        }),
      );
    });
  });
});
