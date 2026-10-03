import { Test, TestingModule } from '@nestjs/testing';
import { MosqueVerificationService } from '../mosque-verification.service';
import { PrismaService } from '@app/database';
import { AuditService } from '../../audit/audit.service';
import { NotFoundException } from '@nestjs/common';
import { MosqueVerificationStatus } from '@prisma/client';

describe('MosqueVerificationService', () => {
  let service: MosqueVerificationService;
  let prisma: any;
  let audit: any;

  const mockActor = {
    userId: 'admin-1',
    email: 'admin@platform.org',
    role: 'admin',
    permissions: [],
  };

  beforeEach(async () => {
    prisma = {
      $transaction: jest.fn((callback) => callback(prisma)),
      mosque: {
        findMany: jest.fn(),
        count: jest.fn(),
        findUnique: jest.fn(),
        update: jest.fn(),
      },
    };

    audit = {
      record: jest.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        MosqueVerificationService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<MosqueVerificationService>(MosqueVerificationService);
  });

  describe('getPendingMosques', () => {
    it('should paginate pending and unverified mosques', async () => {
      const mockItems = [
        {
          id: 'm-1',
          name: 'Pending Mosque',
          verificationStatus: MosqueVerificationStatus.UNVERIFIED,
        },
      ];
      prisma.mosque.findMany.mockResolvedValue(mockItems);
      prisma.mosque.count.mockResolvedValue(1);

      const result = await service.getPendingMosques(1, 10);

      expect(result.items).toEqual(mockItems);
      expect(result.meta.total).toBe(1);
      expect(result.meta.page).toBe(1);
      expect(result.meta.totalPages).toBe(1);
      expect(prisma.mosque.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          skip: 0,
          take: 10,
          where: expect.objectContaining({
            isDeleted: false,
            verificationStatus: {
              in: [
                MosqueVerificationStatus.UNVERIFIED,
                MosqueVerificationStatus.PENDING_VERIFICATION,
              ],
            },
          }),
        }),
      );
    });
  });

  describe('verifyMosque', () => {
    it('should throw NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.verifyMosque(
          'nonexistent-id',
          { notes: 'Verified physically' },
          mockActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should atomically verify mosque and record audit log', async () => {
      const existingMosque = {
        id: 'm-1',
        name: 'Baitul Aman',
        verificationStatus: MosqueVerificationStatus.UNVERIFIED,
      };
      const verifiedMosque = {
        ...existingMosque,
        verificationStatus: MosqueVerificationStatus.VERIFIED,
      };

      prisma.mosque.findUnique.mockResolvedValue(existingMosque);
      prisma.mosque.update.mockResolvedValue(verifiedMosque);

      const result = await service.verifyMosque(
        'm-1',
        { notes: 'Checked with committee' },
        mockActor,
      );

      expect(result.verificationStatus).toBe(MosqueVerificationStatus.VERIFIED);
      expect(prisma.mosque.update).toHaveBeenCalledWith({
        where: { id: 'm-1' },
        data: { verificationStatus: MosqueVerificationStatus.VERIFIED },
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOSQUE_VERIFIED',
          entityType: 'Mosque',
          entityId: 'm-1',
          actor: mockActor,
        }),
        prisma,
      );
    });
  });

  describe('rejectMosque', () => {
    it('should throw NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.rejectMosque(
          'nonexistent-id',
          { reason: 'Duplicate coordinates' },
          mockActor,
        ),
      ).rejects.toThrow(NotFoundException);
    });

    it('should atomically reject mosque and record audit log', async () => {
      const existingMosque = {
        id: 'm-1',
        name: 'Invalid Entry',
        verificationStatus: MosqueVerificationStatus.UNVERIFIED,
      };
      const rejectedMosque = {
        ...existingMosque,
        verificationStatus: MosqueVerificationStatus.REJECTED,
      };

      prisma.mosque.findUnique.mockResolvedValue(existingMosque);
      prisma.mosque.update.mockResolvedValue(rejectedMosque);

      const result = await service.rejectMosque(
        'm-1',
        { reason: 'Duplicate coordinates found' },
        mockActor,
      );

      expect(result.verificationStatus).toBe(MosqueVerificationStatus.REJECTED);
      expect(prisma.mosque.update).toHaveBeenCalledWith({
        where: { id: 'm-1' },
        data: { verificationStatus: MosqueVerificationStatus.REJECTED },
      });
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOSQUE_REJECTED',
          entityType: 'Mosque',
          entityId: 'm-1',
          actor: mockActor,
          metadata: { reason: 'Duplicate coordinates found' },
        }),
        prisma,
      );
    });
  });
});
