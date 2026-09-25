import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ConflictException } from '@nestjs/common';
import { RoleClaimStatus, MosqueStaffRole } from '@prisma/client';
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
});
