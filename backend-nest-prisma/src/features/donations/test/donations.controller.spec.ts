import { DonationsController } from '../donations.controller';
import { DonationsService } from '../donations.service';
import {
  CreateDonationChannelDto,
  QueryDonationsDto,
  RejectDonationChannelDto,
  ReportDonationDto,
  VerifyDonationChannelDto,
} from '../dto';
import { UserPayload } from '@app/common';
import {
  DonationChannelAccountType,
  DonationChannelStatus,
  DonationChannelType,
  DonationPurpose,
  UserRole,
} from '@prisma/client';

describe('DonationsController', () => {
  let controller: DonationsController;
  let service: jest.Mocked<DonationsService>;

  const mockUser: UserPayload = {
    userId: 'user-mutawalli-1',
    email: 'mutawalli@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockChannel = {
    id: 'channel-1',
    mosqueId: 'mosque-1',
    channelType: DonationChannelType.BKASH_MERCHANT,
    accountType: DonationChannelAccountType.MERCHANT,
    accountNumber: '01700000000',
    purpose: DonationPurpose.GENERAL_FUND,
    status: DonationChannelStatus.VERIFIED,
    createdById: 'user-mutawalli-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      submitDonationChannel: jest.fn(),
      getMosqueDonationChannels: jest.fn(),
      getDonationChannelById: jest.fn(),
      verifyDonationChannel: jest.fn(),
      rejectDonationChannel: jest.fn(),
      reportDonationChannel: jest.fn(),
    } as unknown as jest.Mocked<DonationsService>;

    controller = new DonationsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('submitDonation', () => {
    it('should delegate donation channel creation to service', async () => {
      const dto: CreateDonationChannelDto = {
        channelType: DonationChannelType.BKASH_MERCHANT,
        accountType: DonationChannelAccountType.MERCHANT,
        accountNumber: '01700000000',
        accountTitle: 'Baitul Mukarram General Fund',
        purpose: DonationPurpose.GENERAL_FUND,
      };
      service.submitDonationChannel.mockResolvedValue(mockChannel as any);

      const result = await controller.submitDonation('mosque-1', dto, mockUser);

      expect(service.submitDonationChannel).toHaveBeenCalledWith('mosque-1', dto, mockUser);
      expect(result).toEqual(mockChannel);
    });
  });

  describe('getMosqueDonations', () => {
    it('should query donation channels for mosque', async () => {
      const query: QueryDonationsDto = { status: DonationChannelStatus.VERIFIED };
      const list = [mockChannel];
      service.getMosqueDonationChannels.mockResolvedValue(list as any);

      const result = await controller.getMosqueDonations('mosque-1', query, mockUser);

      expect(service.getMosqueDonationChannels).toHaveBeenCalledWith('mosque-1', query, mockUser);
      expect(result).toEqual(list);
    });
  });

  describe('getDonationById', () => {
    it('should retrieve single donation channel with provenance', async () => {
      service.getDonationChannelById.mockResolvedValue(mockChannel as any);

      const result = await controller.getDonationById('channel-1', mockUser);

      expect(service.getDonationChannelById).toHaveBeenCalledWith('channel-1', mockUser);
      expect(result).toEqual(mockChannel);
    });
  });

  describe('verifyDonation', () => {
    it('should approve channel through two-person verification', async () => {
      const dto: VerifyDonationChannelDto = { verificationNotes: 'Account details verified with bank passbook' };
      service.verifyDonationChannel.mockResolvedValue(mockChannel as any);

      const result = await controller.verifyDonation('channel-1', dto, mockUser);

      expect(service.verifyDonationChannel).toHaveBeenCalledWith('channel-1', dto, mockUser);
      expect(result).toEqual(mockChannel);
    });
  });

  describe('rejectDonation', () => {
    it('should delegate rejection or archival to service', async () => {
      const dto: RejectDonationChannelDto = { rejectionReason: 'Incorrect account title' };
      const rejectedChannel = { ...mockChannel, status: DonationChannelStatus.REJECTED };
      service.rejectDonationChannel.mockResolvedValue(rejectedChannel as any);

      const result = await controller.rejectDonation('channel-1', dto, mockUser);

      expect(service.rejectDonationChannel).toHaveBeenCalledWith('channel-1', dto, mockUser);
      expect(result).toEqual(rejectedChannel);
    });
  });

  describe('reportDonation', () => {
    it('should log community fraud report', async () => {
      const dto: ReportDonationDto = {
        reason: 'SUSPECTED_FRAUD',
        description: 'Personal number posing as mosque fund',
      };
      const reportResponse = { id: 'report-1', status: 'PENDING_REVIEW' };
      service.reportDonationChannel.mockResolvedValue(reportResponse as any);

      const result = await controller.reportDonation('channel-1', dto, mockUser);

      expect(service.reportDonationChannel).toHaveBeenCalledWith('channel-1', dto, mockUser);
      expect(result).toEqual(reportResponse);
    });
  });
});
