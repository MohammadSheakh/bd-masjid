import request from 'supertest';
import { ValidationPipe } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import { AuthGuard, RolesGuard, SlidingWindowRateLimitGuard, TransformResponseInterceptor, UserPayload } from '@app/common';
import { CommunityController } from '../community.controller';
import { CommunityService } from '../community.service';
import { AddStaffDto } from '../dto/add-staff.dto';
import { CreateRoleClaimDto } from '../dto/create-claim.dto';
import { ReviewRoleClaimDto } from '../dto/review-claim.dto';
import { CreateDonationMethodDto } from '../dto/create-donation.dto';
import { ReviewDonationMethodDto } from '../dto/review-donation.dto';
import {
  DonationMethodType,
  MosqueStaffRole,
  RoleClaimStatus,
  UserRole,
} from '@prisma/client';

describe('CommunityController', () => {
  let controller: CommunityController;
  let service: jest.Mocked<CommunityService>;

  const mockUser: UserPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: UserRole.MEMBER,
  };

  const mockAdmin: UserPayload = {
    userId: 'admin-1',
    email: 'admin@example.com',
    role: UserRole.ADMIN,
  };

  beforeEach(() => {
    service = {
      getStaff: jest.fn(),
      addStaff: jest.fn(),
      removeStaff: jest.fn(),
      updateStaff: jest.fn(),
      submitRoleClaim: jest.fn(),
      getMosqueRoleClaims: jest.fn(),
      getRoleClaims: jest.fn(),
      reviewRoleClaim: jest.fn(),
      getAllDonationMethods: jest.fn(),
      getDonationMethods: jest.fn(),
      addDonationMethod: jest.fn(),
      reviewDonationMethod: jest.fn(),
      deleteDonationMethod: jest.fn(),
      toggleBookmark: jest.fn(),
      getUserBookmarks: jest.fn(),
    } as unknown as jest.Mocked<CommunityService>;

    controller = new CommunityController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('staff endpoints', () => {
    it('getStaff should return staff list', async () => {
      const staffList = [{ id: 'staff-1', role: MosqueStaffRole.IMAM }];
      service.getStaff.mockResolvedValue(staffList as any);

      const result = await controller.getStaff('mosque-1');

      expect(service.getStaff).toHaveBeenCalledWith('mosque-1');
      expect(result).toEqual(staffList);
    });

    it('addStaff should delegate to service', async () => {
      const dto: AddStaffDto = {
        userId: 'user-2',
        role: MosqueStaffRole.MUAZZIN,
      };
      const response = { id: 'staff-2', ...dto };
      service.addStaff.mockResolvedValue(response as any);

      const result = await controller.addStaff('mosque-1', dto, mockAdmin);

      expect(service.addStaff).toHaveBeenCalledWith('mosque-1', dto, mockAdmin);
      expect(result).toEqual(response);
    });

    it('removeStaff should delegate to service', async () => {
      const response = { success: true };
      service.removeStaff.mockResolvedValue(response as any);

      const result = await controller.removeStaff('mosque-1', 'staff-2', mockAdmin);

      expect(service.removeStaff).toHaveBeenCalledWith('mosque-1', 'staff-2', mockAdmin);
      expect(result).toEqual(response);
    });

    it('updateStaff should delegate to service', async () => {
      const dto = { name: 'Updated Imam' };
      const response = { id: 'staff-2', name: 'Updated Imam' };
      service.updateStaff.mockResolvedValue(response as any);

      const result = await controller.updateStaff('mosque-1', 'staff-2', dto, mockAdmin);

      expect(service.updateStaff).toHaveBeenCalledWith('mosque-1', 'staff-2', dto, mockAdmin);
      expect(result).toEqual(response);
    });
  });

  describe('role claims endpoints', () => {
    it('submitRoleClaim should delegate to service', async () => {
      const dto: CreateRoleClaimDto = {
        role: MosqueStaffRole.IMAM,
        description: 'Imam appointment',
      };
      const response = { id: 'claim-1', ...dto };
      service.submitRoleClaim.mockResolvedValue(response as any);

      const result = await controller.submitRoleClaim('mosque-1', dto, mockUser);

      expect(service.submitRoleClaim).toHaveBeenCalledWith('mosque-1', dto, mockUser);
      expect(result).toEqual(response);
    });

    it('getMosqueRoleClaims should delegate with status filter', async () => {
      const claims = [{ id: 'claim-1' }];
      service.getMosqueRoleClaims.mockResolvedValue(claims as any);

      const result = await controller.getMosqueRoleClaims('mosque-1', RoleClaimStatus.PENDING, mockAdmin);

      expect(service.getMosqueRoleClaims).toHaveBeenCalledWith('mosque-1', mockAdmin, RoleClaimStatus.PENDING);
      expect(result).toEqual(claims);
    });

    it('getRoleClaims should delegate to service with pagination', async () => {
      const claims = [{ id: 'claim-1' }];
      service.getRoleClaims.mockResolvedValue(claims as any);

      const result = await controller.getRoleClaims(RoleClaimStatus.PENDING, 'mosque-1', 1, 10);

      expect(service.getRoleClaims).toHaveBeenCalledWith(RoleClaimStatus.PENDING, 'mosque-1', 1, 10);
      expect(result).toEqual(claims);
    });

    it('reviewRoleClaim should delegate to service', async () => {
      const dto: ReviewRoleClaimDto = {
        action: 'APPROVED' as any,
        notes: 'Verified via committee',
      };
      const response = { id: 'claim-1', status: RoleClaimStatus.APPROVED };
      service.reviewRoleClaim.mockResolvedValue(response as any);

      const result = await controller.reviewRoleClaim('claim-1', dto, mockAdmin);

      expect(service.reviewRoleClaim).toHaveBeenCalledWith('claim-1', dto, mockAdmin);
      expect(result).toEqual(response);
    });
  });

  describe('donation methods endpoints', () => {
    it('getAllDonationMethods should return all donation channels for admin', async () => {
      const list = [{ id: 'dm-1' }];
      service.getAllDonationMethods.mockResolvedValue(list as any);

      const result = await controller.getAllDonationMethods();

      expect(service.getAllDonationMethods).toHaveBeenCalled();
      expect(result).toEqual(list);
    });

    it('getDonationMethods should return verified donation methods', async () => {
      const list = [{ id: 'dm-1' }];
      service.getDonationMethods.mockResolvedValue(list as any);

      const result = await controller.getDonationMethods('mosque-1', mockUser);

      expect(service.getDonationMethods).toHaveBeenCalledWith('mosque-1', mockUser);
      expect(result).toEqual(list);
    });

    it('addDonationMethod should delegate to service', async () => {
      const dto: CreateDonationMethodDto = {
        type: DonationMethodType.BKASH,
        accountNumber: '01700000000',
        accountTitle: 'Mosque Fund',
      };
      const response = { id: 'dm-1', ...dto };
      service.addDonationMethod.mockResolvedValue(response as any);

      const result = await controller.addDonationMethod('mosque-1', dto, mockUser);

      expect(service.addDonationMethod).toHaveBeenCalledWith('mosque-1', dto, mockUser);
      expect(result).toEqual(response);
    });

    it('reviewDonationMethod should delegate to service', async () => {
      const dto: ReviewDonationMethodDto = {
        verified: true,
        verificationNote: 'Confirmed with committee',
      };
      const response = { id: 'dm-1', verified: true };
      service.reviewDonationMethod.mockResolvedValue(response as any);

      const result = await controller.reviewDonationMethod('dm-1', dto, mockAdmin);

      expect(service.reviewDonationMethod).toHaveBeenCalledWith('dm-1', dto, mockAdmin);
      expect(result).toEqual(response);
    });

    it('deleteDonationMethod should delegate to service', async () => {
      const response = { success: true };
      service.deleteDonationMethod.mockResolvedValue(response as any);

      const result = await controller.deleteDonationMethod('mosque-1', 'dm-1', mockUser);

      expect(service.deleteDonationMethod).toHaveBeenCalledWith('mosque-1', 'dm-1', mockUser);
      expect(result).toEqual(response);
    });
  });

  describe('bookmark endpoints', () => {
    it('toggleBookmark should toggle bookmark for user', async () => {
      const response = { bookmarked: true };
      service.toggleBookmark.mockResolvedValue(response as any);

      const result = await controller.toggleBookmark('mosque-1', mockUser);

      expect(service.toggleBookmark).toHaveBeenCalledWith('mosque-1', 'user-1');
      expect(result).toEqual(response);
    });

    it('getUserBookmarks should return bookmarks of user', async () => {
      const response = [{ id: 'mosque-1' }];
      service.getUserBookmarks.mockResolvedValue(response as any);

      const result = await controller.getUserBookmarks(mockUser);

      expect(service.getUserBookmarks).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(response);
    });
  });

  describe('HTTP Pipeline & Validation Boundary (Supertest)', () => {
    let app: any;
    let serviceMock: any;

    beforeAll(async () => {
      serviceMock = {
        getStaff: jest.fn().mockResolvedValue([{ id: 'staff-1', role: MosqueStaffRole.IMAM }]),
        submitRoleClaim: jest.fn().mockResolvedValue({ id: 'claim-1', role: MosqueStaffRole.IMAM }),
      };

      const moduleRef = await Test.createTestingModule({
        controllers: [CommunityController],
        providers: [
          { provide: CommunityService, useValue: serviceMock },
        ],
      })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: any) => {
            const reflector = new (require('@nestjs/core').Reflector)();
            const isPublic = reflector.getAllAndOverride(
              require('@app/common').IS_PUBLIC_KEY,
              [context.getHandler(), context.getClass()],
            );
            const req = context.switchToHttp().getRequest();
            const auth = req.headers['authorization'];
            if (auth && auth.startsWith('Bearer valid')) {
              req.user = mockUser;
              return true;
            }
            if (isPublic) {
              return true;
            }
            throw new (require('@nestjs/common').UnauthorizedException)();
          },
        })
        .overrideGuard(RolesGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
      app.useGlobalInterceptors(new TransformResponseInterceptor());
      await app.init();
    });

    afterAll(async () => {
      if (app) {
        await app.close();
      }
    });

    it('publicly returns staff directory on GET /mosques/:id/staff', async () => {
      const res = await request(app.getHttpServer())
        .get('/mosques/mosque-1/staff');

      expect(res.status).toBe(200);
      expect(res.body).toHaveProperty('success', true);
      expect(Array.isArray(res.body.data)).toBe(true);
    });

    it('rejects POST /mosques/:id/role-claims with 401 when no bearer token is supplied', async () => {
      const res = await request(app.getHttpServer())
        .post('/mosques/mosque-1/role-claims')
        .send({ role: MosqueStaffRole.IMAM, description: 'Test claim' });

      expect(res.status).toBe(401);
    });

    it('rejects POST /mosques/:id/role-claims with 400 when role enum is invalid', async () => {
      const res = await request(app.getHttpServer())
        .post('/mosques/mosque-1/role-claims')
        .set('Authorization', 'Bearer valid-token')
        .send({ role: 'INVALID_ROLE', description: 'Test claim' });

      expect(res.status).toBe(400);
      expect(res.body.message).toBeDefined();
    });
  });
});
