import { MosqueVerificationController } from '../mosque-verification.controller';
import { MosqueVerificationService } from '../mosque-verification.service';
import { VerifyMosqueDto, RejectMosqueDto } from '../dto/verification.dto';
import { UserPayload } from '@app/common';
import { MosqueVerificationStatus, UserRole } from '@prisma/client';

describe('MosqueVerificationController', () => {
  let controller: MosqueVerificationController;
  let service: jest.Mocked<MosqueVerificationService>;

  const mockAdmin: UserPayload = {
    userId: 'admin-1',
    email: 'admin@platform.org',
    role: UserRole.ADMIN,
  };

  const mockMosque = {
    id: 'mosque-1',
    name: 'Baitul Mukarram',
    verificationStatus: MosqueVerificationStatus.VERIFIED,
  };

  beforeEach(() => {
    service = {
      getPendingMosques: jest.fn(),
      verifyMosque: jest.fn(),
      rejectMosque: jest.fn(),
    } as unknown as jest.Mocked<MosqueVerificationService>;

    controller = new MosqueVerificationController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getPendingMosques', () => {
    it('should retrieve pending mosques with pagination', async () => {
      const pending = { items: [mockMosque], total: 1, page: 1, limit: 20 };
      service.getPendingMosques.mockResolvedValue(pending as any);

      const result = await controller.getPendingMosques(1, 20);

      expect(service.getPendingMosques).toHaveBeenCalledWith(1, 20);
      expect(result).toEqual(pending);
    });
  });

  describe('verifyMosque', () => {
    it('should verify mosque with audit logging and actor context', async () => {
      const dto: VerifyMosqueDto = {
        notes: 'Verified via municipal committee register',
      };
      service.verifyMosque.mockResolvedValue(mockMosque as any);

      const result = await controller.verifyMosque('mosque-1', dto, mockAdmin);

      expect(service.verifyMosque).toHaveBeenCalledWith('mosque-1', dto, mockAdmin);
      expect(result).toEqual(mockMosque);
    });
  });

  describe('rejectMosque', () => {
    it('should reject mosque with required reason and actor context', async () => {
      const dto: RejectMosqueDto = {
        reason: 'Duplicate building structure and incorrect coordinates',
      };
      const rejectedMosque = {
        ...mockMosque,
        verificationStatus: MosqueVerificationStatus.REJECTED,
      };
      service.rejectMosque.mockResolvedValue(rejectedMosque as any);

      const result = await controller.rejectMosque('mosque-1', dto, mockAdmin);

      expect(service.rejectMosque).toHaveBeenCalledWith('mosque-1', dto, mockAdmin);
      expect(result).toEqual(rejectedMosque);
    });
  });
});
