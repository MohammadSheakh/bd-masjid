import { Test, TestingModule } from '@nestjs/testing';
import {
  NotFoundException,
  ConflictException,
  ForbiddenException,
} from '@nestjs/common';
import {
  RoleClaimStatus,
  MosqueStaffRole,
  DonationMethodType,
} from '@prisma/client';
import { CommunityService } from './community.service';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import type { UserPayload } from '@app/common';

describe('CommunityService', () => {
  let service: CommunityService;

  const mockPrisma = {
    mosque: {
      findUnique: jest.fn(),
    },
    mosqueStaff: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    mosqueRoleClaim: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
    },
    mosqueAnnouncement: {
      findMany: jest.fn(),
      findFirst: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    mosqueDonationMethod: {
      findFirst: jest.fn(),
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    },
    mosqueBookmark: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      create: jest.fn(),
      delete: jest.fn(),
    },
    $transaction: jest.fn((callback: any) => callback(mockPrisma)),
  };

  const mockAudit = {
    record: jest.fn().mockResolvedValue({ id: 'audit-1' }),
  };

  const adminActor: UserPayload = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: 'admin',
  };

  const userActor: UserPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: 'user',
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        CommunityService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: AuditService, useValue: mockAudit },
      ],
    }).compile();

    service = module.get<CommunityService>(CommunityService);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getStaff', () => {
    it('throws NotFoundException if mosque does not exist', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue(null);
      await expect(service.getStaff('nonexistent')).rejects.toThrow(
        NotFoundException,
      );
    });

    it('returns staff members list for valid mosque', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueStaff.findMany.mockResolvedValue([
        {
          id: 'staff-1',
          role: MosqueStaffRole.IMAM,
          name: 'Qari Saiful Islam',
        },
      ]);

      const result = await service.getStaff('mosque-1');
      expect(result).toHaveLength(1);
      expect(result[0].name).toBe('Qari Saiful Islam');
    });
  });

  describe('submitRoleClaim', () => {
    it('throws ConflictException if open claim already exists', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueRoleClaim.findFirst.mockResolvedValue({
        id: 'claim-1',
        status: RoleClaimStatus.OPEN,
      });

      await expect(
        service.submitRoleClaim(
          'mosque-1',
          {
            role: MosqueStaffRole.IMAM,
            evidence: 'I am the appointed imam of this mosque',
          },
          userActor,
        ),
      ).rejects.toThrow(ConflictException);
    });

    it('creates role claim successfully', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueRoleClaim.findFirst.mockResolvedValue(null);
      mockPrisma.mosqueRoleClaim.create.mockResolvedValue({
        id: 'claim-new',
        mosqueId: 'mosque-1',
        userId: userActor.userId,
        role: MosqueStaffRole.IMAM,
        status: RoleClaimStatus.OPEN,
      });

      const claim = await service.submitRoleClaim(
        'mosque-1',
        {
          role: MosqueStaffRole.IMAM,
          evidence: 'Valid appointment resolution copy attached.',
        },
        userActor,
      );

      expect(claim.id).toBe('claim-new');
      expect(mockPrisma.mosqueRoleClaim.create).toHaveBeenCalled();
    });
  });

  describe('reviewRoleClaim', () => {
    it('approves role claim and creates verified staff entry in transaction', async () => {
      const claim = {
        id: 'claim-1',
        mosqueId: 'mosque-1',
        userId: 'user-2',
        role: MosqueStaffRole.IMAM,
        status: RoleClaimStatus.OPEN,
        user: { name: 'Mufti Salman', phoneNumber: '01711223344' },
      };

      mockPrisma.mosqueRoleClaim.findUnique.mockResolvedValue(claim);
      mockPrisma.mosqueRoleClaim.update.mockResolvedValue({
        ...claim,
        status: RoleClaimStatus.APPROVED,
      });
      mockPrisma.mosqueStaff.create.mockResolvedValue({ id: 'staff-created' });

      const result = await service.reviewRoleClaim(
        'claim-1',
        {
          status: RoleClaimStatus.APPROVED,
          resolutionNotes: 'Verified with committee',
        },
        adminActor,
      );

      expect(result.status).toBe(RoleClaimStatus.APPROVED);
      expect(mockPrisma.mosqueStaff.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
            role: MosqueStaffRole.IMAM,
            name: 'Mufti Salman',
          }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });

  describe('addDonationMethod', () => {
    it('creates auto-verified donation method when added by platform admin', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueDonationMethod.create.mockResolvedValue({
        id: 'don-1',
        mosqueId: 'mosque-1',
        methodType: DonationMethodType.BKASH,
        accountNumber: '01712345678',
        isVerified: true,
      });

      const res = await service.addDonationMethod(
        'mosque-1',
        {
          methodType: DonationMethodType.BKASH,
          accountNumber: '01712345678',
          accountType: 'MERCHANT',
        },
        adminActor,
      );

      expect(res.id).toBe('don-1');
      expect(mockPrisma.mosqueDonationMethod.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            isVerified: true,
            accountNumber: '01712345678',
          }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalled();
    });

    it('rejects donation method registration if user is neither admin nor verified staff', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.addDonationMethod(
          'mosque-1',
          {
            methodType: DonationMethodType.NAGAD,
            accountNumber: '01812345678',
          },
          userActor,
        ),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reviewDonationMethod', () => {
    it('throws NotFoundException if donation method does not exist', async () => {
      mockPrisma.mosqueDonationMethod.findUnique.mockResolvedValue(null);

      await expect(
        service.reviewDonationMethod(
          'nonexistent',
          { isVerified: true },
          adminActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('updates donation verification status and records audit event', async () => {
      const existing = {
        id: 'don-1',
        mosqueId: 'mosque-1',
        isVerified: false,
      };
      mockPrisma.mosqueDonationMethod.findUnique.mockResolvedValue(existing);
      mockPrisma.mosqueDonationMethod.update.mockResolvedValue({
        ...existing,
        isVerified: true,
      });

      const updated = await service.reviewDonationMethod(
        'don-1',
        { isVerified: true },
        adminActor,
      );

      expect(updated.isVerified).toBe(true);
      expect(mockPrisma.mosqueDonationMethod.update).toHaveBeenCalledWith(
        expect.objectContaining({
          where: { id: 'don-1' },
          data: expect.objectContaining({ isVerified: true }),
        }),
      );
      expect(mockAudit.record).toHaveBeenCalled();
    });
  });

  describe('toggleBookmark', () => {
    it('throws NotFoundException if mosque does not exist', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.toggleBookmark('nonexistent', 'user-1'),
      ).rejects.toThrow(NotFoundException);
    });

    it('creates bookmark when not yet bookmarked', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueBookmark.findUnique.mockResolvedValue(null);
      mockPrisma.mosqueBookmark.create.mockResolvedValue({
        id: 'bm-1',
        mosqueId: 'mosque-1',
        userId: 'user-1',
      });

      const res = await service.toggleBookmark('mosque-1', 'user-1');

      expect(res.isBookmarked).toBe(true);
      expect(res.mosqueId).toBe('mosque-1');
      expect(mockPrisma.mosqueBookmark.create).toHaveBeenCalledWith({
        data: { mosqueId: 'mosque-1', userId: 'user-1' },
      });
    });

    it('removes bookmark when already bookmarked', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      mockPrisma.mosqueBookmark.findUnique.mockResolvedValue({
        id: 'bm-existing',
        mosqueId: 'mosque-1',
        userId: 'user-1',
      });
      mockPrisma.mosqueBookmark.delete.mockResolvedValue({ id: 'bm-existing' });

      const res = await service.toggleBookmark('mosque-1', 'user-1');

      expect(res.isBookmarked).toBe(false);
      expect(res.mosqueId).toBe('mosque-1');
      expect(mockPrisma.mosqueBookmark.delete).toHaveBeenCalledWith({
        where: { id: 'bm-existing' },
      });
    });
  });

  describe('getUserBookmarks', () => {
    it('returns array of bookmarked mosques', async () => {
      mockPrisma.mosqueBookmark.findMany.mockResolvedValue([
        {
          id: 'bm-1',
          mosque: {
            id: 'mosque-1',
            name: 'Baitul Mukarram',
            prayerSchedule: { fajrJamaat: '05:15' },
          },
        },
      ]);

      const list = await service.getUserBookmarks('user-1');

      expect(list).toHaveLength(1);
      expect(list[0].name).toBe('Baitul Mukarram');
    });
  });
});

