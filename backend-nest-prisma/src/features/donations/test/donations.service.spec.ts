import { Test, TestingModule } from '@nestjs/testing';
import {
  BadRequestException,
  ForbiddenException,
  NotFoundException,
} from '@nestjs/common';
import {
  DonationChannelAccountType,
  DonationChannelStatus,
  DonationChannelType,
  DonationPurpose,
  MosqueStaffRole,
} from '@prisma/client';
import { PrismaService } from '@app/database';
import { UserPayload } from '@app/common';
import { AuditService } from '../../audit/audit.service';
import { DonationsService } from '../donations.service';

describe('DonationsService', () => {
  let service: DonationsService;
  let prisma: any;
  let audit: any;

  const mockAdminUser: UserPayload = {
    userId: 'admin-1',
    role: 'admin',
    email: 'admin@platform.com',
  };

  const mockMutawalliUser: UserPayload = {
    userId: 'mutawalli-1',
    role: 'user',
    email: 'mutawalli@mosque.com',
  };

  const mockImamUser: UserPayload = {
    userId: 'imam-1',
    role: 'user',
    email: 'imam@mosque.com',
  };

  const mockMusalliUser: UserPayload = {
    userId: 'musalli-1',
    role: 'user',
    email: 'musalli@gmail.com',
  };

  beforeEach(async () => {
    prisma = {
      mosque: {
        findUnique: jest.fn(),
      },
      mosqueStaff: {
        findFirst: jest.fn(),
      },
      mosqueDonationChannel: {
        findUnique: jest.fn(),
        findMany: jest.fn(),
        create: jest.fn(),
        update: jest.fn(),
      },
      donationReport: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    audit = {
      record: jest.fn().mockResolvedValue({ id: 'audit-log-1' }),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        DonationsService,
        { provide: PrismaService, useValue: prisma },
        { provide: AuditService, useValue: audit },
      ],
    }).compile();

    service = module.get<DonationsService>(DonationsService);
  });

  describe('submitDonationChannel', () => {
    it('should submit a donation channel in VERIFIED status with creator provenance for verified President', async () => {
      prisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Baitul Mukarram',
      });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-1',
        name: 'Mohammad Sheakh',
        imageUrl: '/uploads/staff/sheakh.jpg',
        mosqueId: 'mosque-1',
        userId: mockMutawalliUser.userId,
        role: MosqueStaffRole.COMMITTEE_PRESIDENT,
        isVerified: true,
      });

      const mockCreated = {
        id: 'channel-1',
        mosqueId: 'mosque-1',
        channelType: DonationChannelType.BKASH,
        accountNumber: '01711000000',
        accountTitle: 'Baitul Mukarram General Fund',
        status: DonationChannelStatus.VERIFIED,
        createdById: mockMutawalliUser.userId,
        creatorName: 'Mohammad Sheakh',
        creatorRole: MosqueStaffRole.COMMITTEE_PRESIDENT,
        creatorImageUrl: '/uploads/staff/sheakh.jpg',
        verifiedRoles: [MosqueStaffRole.COMMITTEE_PRESIDENT],
      };
      prisma.mosqueDonationChannel.create.mockResolvedValue(mockCreated);

      const result = await service.submitDonationChannel(
        'mosque-1',
        {
          channelType: DonationChannelType.BKASH,
          accountType: DonationChannelAccountType.PERSONAL,
          purpose: DonationPurpose.GENERAL_FUND,
          accountNumber: '01711000000',
          accountTitle: 'Baitul Mukarram General Fund',
        },
        mockMutawalliUser,
      );

      expect(result.status).toBe(DonationChannelStatus.VERIFIED);
      expect(result.creatorName).toBe('Mohammad Sheakh');
      expect(prisma.mosqueDonationChannel.create).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOSQUE_DONATION_CHANNEL_SUBMITTED',
          entityType: 'MosqueDonationChannel',
        }),
        prisma,
      );
    });

    it('should throw ForbiddenException if ordinary user tries to submit', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.submitDonationChannel(
          'mosque-1',
          {
            channelType: DonationChannelType.BKASH,
            accountNumber: '01711000000',
            accountTitle: 'Random Fund',
          },
          mockMusalliUser,
        ),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw BadRequestException if BANK_TRANSFER is selected without bankName', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-1',
        role: MosqueStaffRole.MOSQUE_ADMIN,
        isVerified: true,
      });

      await expect(
        service.submitDonationChannel(
          'mosque-1',
          {
            channelType: DonationChannelType.BANK_TRANSFER,
            accountNumber: '123456789',
            accountTitle: 'Mosque Account',
          },
          mockMutawalliUser,
        ),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('verifyDonationChannel (Two-Person Verification Rule)', () => {
    const pendingChannel = {
      id: 'channel-1',
      mosqueId: 'mosque-1',
      createdById: mockMutawalliUser.userId,
      status: DonationChannelStatus.PENDING_VERIFICATION,
    };

    it('should verify channel when verified Imam approves it', async () => {
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(pendingChannel);
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-imam',
        mosqueId: 'mosque-1',
        userId: mockImamUser.userId,
        role: MosqueStaffRole.IMAM,
        isVerified: true,
      });

      const updated = {
        ...pendingChannel,
        status: DonationChannelStatus.VERIFIED,
        verifiedById: mockImamUser.userId,
      };
      prisma.mosqueDonationChannel.update.mockResolvedValue(updated);

      const result = await service.verifyDonationChannel(
        'channel-1',
        { notes: 'Checked bank documentation' },
        mockImamUser,
      );

      expect(result.status).toBe(DonationChannelStatus.VERIFIED);
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOSQUE_DONATION_CHANNEL_VERIFIED',
        }),
        prisma,
      );
    });

    it('should throw ForbiddenException if creator attempts to verify own submission (Anti-Collusion Invariant)', async () => {
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(pendingChannel);

      await expect(
        service.verifyDonationChannel('channel-1', {}, mockMutawalliUser),
      ).rejects.toThrow(
        expect.objectContaining({
          message: expect.stringContaining('CANNOT_APPROVE_OWN_SUBMISSION'),
        }),
      );
    });

    it('should throw ForbiddenException if an unauthorized staff member tries to verify', async () => {
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(pendingChannel);
      prisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.verifyDonationChannel('channel-1', {}, mockMusalliUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('attestDonationChannel (Multi-Signatory Governance)', () => {
    const verifiedChannel = {
      id: 'channel-1',
      mosqueId: 'mosque-1',
      createdById: mockMutawalliUser.userId,
      creatorName: 'Mohammad Sheakh',
      creatorRole: MosqueStaffRole.COMMITTEE_PRESIDENT,
      status: DonationChannelStatus.VERIFIED,
      verifiedRoles: [MosqueStaffRole.COMMITTEE_PRESIDENT],
      roleAttestations: [
        {
          role: MosqueStaffRole.COMMITTEE_PRESIDENT,
          userId: mockMutawalliUser.userId,
          name: 'Mohammad Sheakh',
        },
      ],
    };

    const mockSecretaryUser: UserPayload = {
      userId: 'secretary-1',
      role: 'user',
      email: 'sec@mosque.com',
    };

    it('should successfully co-verify channel when General Secretary attests', async () => {
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(verifiedChannel);
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-sec',
        mosqueId: 'mosque-1',
        userId: mockSecretaryUser.userId,
        role: MosqueStaffRole.COMMITTEE_SECRETARY,
        name: 'Secretary Rahman',
        imageUrl: null,
        isVerified: true,
      });

      const updated = {
        ...verifiedChannel,
        verifiedRoles: [
          MosqueStaffRole.COMMITTEE_PRESIDENT,
          MosqueStaffRole.COMMITTEE_SECRETARY,
        ],
      };
      prisma.mosqueDonationChannel.update.mockResolvedValue(updated);

      const result = await service.attestDonationChannel(
        'channel-1',
        mockSecretaryUser,
      );

      expect(result.verifiedRoles).toContain(
        MosqueStaffRole.COMMITTEE_SECRETARY,
      );
      expect(prisma.mosqueDonationChannel.update).toHaveBeenCalled();
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOSQUE_DONATION_CHANNEL_ATTESTED',
          entityType: 'MosqueDonationChannel',
        }),
        prisma,
      );
    });

    it('should throw BadRequestException if same user tries to attest twice', async () => {
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(verifiedChannel);
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-pres',
        mosqueId: 'mosque-1',
        userId: mockMutawalliUser.userId,
        role: MosqueStaffRole.COMMITTEE_PRESIDENT,
        name: 'Mohammad Sheakh',
        isVerified: true,
      });

      await expect(
        service.attestDonationChannel('channel-1', mockMutawalliUser),
      ).rejects.toThrow(BadRequestException);
    });

    it('should throw ForbiddenException if ordinary user tries to attest', async () => {
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(verifiedChannel);
      prisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.attestDonationChannel('channel-1', mockMusalliUser),
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe('reportDonationChannel (Anti-Griefing Invariant)', () => {
    it('should increment disputeCount, create DonationReport, and not delete channel', async () => {
      const channel = {
        id: 'channel-1',
        mosqueId: 'mosque-1',
        status: DonationChannelStatus.VERIFIED,
        disputeCount: 0,
      };
      prisma.mosqueDonationChannel.findUnique.mockResolvedValue(channel);
      prisma.donationReport.create.mockResolvedValue({ id: 'report-1' });
      prisma.mosqueDonationChannel.update.mockResolvedValue({
        ...channel,
        disputeCount: 1,
      });

      const result = await service.reportDonationChannel(
        'channel-1',
        {
          reason: 'SUSPECTED_FRAUD',
          description: 'This is a personal number, not belonging to mosque.',
        },
        mockMusalliUser,
      );

      expect(result.reportId).toBe('report-1');
      expect(prisma.donationReport.create).toHaveBeenCalled();
      expect(prisma.mosqueDonationChannel.update).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            disputeCount: { increment: 1 },
          }),
        }),
      );
      expect(audit.record).toHaveBeenCalledWith(
        expect.objectContaining({
          action: 'MOSQUE_DONATION_CHANNEL_REPORTED',
        }),
        prisma,
      );
    });
  });

  describe('getMosqueDonationChannels', () => {
    it('should filter only VERIFIED channels for unauthenticated / public users', async () => {
      prisma.mosque.findUnique.mockResolvedValue({ id: 'mosque-1' });
      prisma.mosqueDonationChannel.findMany.mockResolvedValue([]);

      await service.getMosqueDonationChannels('mosque-1', {});

      expect(prisma.mosqueDonationChannel.findMany).toHaveBeenCalledWith(
        expect.objectContaining({
          where: expect.objectContaining({
            status: DonationChannelStatus.VERIFIED,
          }),
        }),
      );
    });
  });
});
