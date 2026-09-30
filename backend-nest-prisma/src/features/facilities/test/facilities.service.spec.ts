import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException, ForbiddenException } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { MosqueStaffRole } from '@prisma/client';
import { FacilitiesService } from '../facilities.service';
import { UpsertFacilityDto } from '../dto/upsert-facility.dto';

describe('FacilitiesService', () => {
  let service: FacilitiesService;
  let prisma: any;

  const mockMosque = {
    id: 'mosque-1',
    name: 'Baitul Mukarram',
    isDeleted: false,
  };

  const mockFacility = {
    id: 'fac-1',
    mosqueId: 'mosque-1',
    totalCapacity: 1500,
    toiletCount: 12,
    hasSeparateWudu: true,
    wuduCapacity: 50,
    hasFemalePrayerSpace: true,
    femaleCapacity: 200,
    hasWheelchairAccess: true,
    hasRamp: true,
    hasAirConditioning: true,
    hasFan: true,
    hasJanazaService: true,
    hasParkingCar: true,
    hasParkingBike: true,
    hasLibraryMaktab: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(async () => {
    prisma = {
      mosque: {
        findUnique: jest.fn(),
        update: jest.fn(),
      },
      mosqueFacility: {
        findUnique: jest.fn(),
        upsert: jest.fn(),
      },
      mosqueStaff: {
        findFirst: jest.fn(),
      },
      auditLog: {
        create: jest.fn(),
      },
      $transaction: jest.fn((callback) => callback(prisma)),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        FacilitiesService,
        { provide: PrismaService, useValue: prisma },
      ],
    }).compile();

    service = module.get<FacilitiesService>(FacilitiesService);
  });

  describe('getFacilities', () => {
    it('should return facility details when mosque and facilities exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(mockMosque);
      prisma.mosqueFacility.findUnique.mockResolvedValue(mockFacility);

      const result = await service.getFacilities('mosque-1');
      expect(result).toEqual(mockFacility);
      expect(prisma.mosque.findUnique).toHaveBeenCalledWith({
        where: { id: 'mosque-1', isDeleted: false },
        select: { id: true },
      });
      expect(prisma.mosqueFacility.findUnique).toHaveBeenCalledWith({
        where: { mosqueId: 'mosque-1' },
      });
    });

    it('should return null when mosque exists but facilities are not yet configured', async () => {
      prisma.mosque.findUnique.mockResolvedValue(mockMosque);
      prisma.mosqueFacility.findUnique.mockResolvedValue(null);

      const result = await service.getFacilities('mosque-1');
      expect(result).toBeNull();
    });

    it('should throw NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(service.getFacilities('invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('upsertFacilities', () => {
    const dto: UpsertFacilityDto = {
      totalCapacity: 2000,
      hasFemalePrayerSpace: true,
      femaleCapacity: 250,
      hasWheelchairAccess: true,
      hasAirConditioning: true,
      hasJanazaService: true,
    };

    const adminActor: any = {
      userId: 'admin-1',
      role: 'admin',
    };

    const mosqueAdminActor: any = {
      userId: 'staff-user-1',
      role: 'user',
    };

    const randomMusalliActor: any = {
      userId: 'musalli-user-2',
      role: 'user',
    };

    it('should allow platform admin to upsert facilities and record audit log', async () => {
      prisma.mosque.findUnique.mockResolvedValue(mockMosque);
      prisma.mosqueFacility.findUnique.mockResolvedValue(mockFacility);
      prisma.mosqueFacility.upsert.mockResolvedValue({
        ...mockFacility,
        totalCapacity: 2000,
      });
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-1' });
      prisma.mosque.update.mockResolvedValue(mockMosque);

      const result = await service.upsertFacilities(
        'mosque-1',
        dto,
        adminActor,
      );

      expect(result.totalCapacity).toBe(2000);
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'UPDATE_MOSQUE_FACILITIES',
            entityType: 'MosqueFacility',
            actorId: 'admin-1',
          }),
        }),
      );
      expect(prisma.mosque.update).toHaveBeenCalled();
    });

    it('should allow verified MOSQUE_ADMIN to upsert facilities', async () => {
      prisma.mosque.findUnique.mockResolvedValue(mockMosque);
      prisma.mosqueStaff.findFirst.mockResolvedValue({
        id: 'staff-rec-1',
        mosqueId: 'mosque-1',
        userId: 'staff-user-1',
        role: MosqueStaffRole.MOSQUE_ADMIN,
        isVerified: true,
      });
      prisma.mosqueFacility.findUnique.mockResolvedValue(null);
      prisma.mosqueFacility.upsert.mockResolvedValue(mockFacility);
      prisma.auditLog.create.mockResolvedValue({ id: 'audit-2' });
      prisma.mosque.update.mockResolvedValue(mockMosque);

      const result = await service.upsertFacilities(
        'mosque-1',
        dto,
        mosqueAdminActor,
      );

      expect(result).toBeDefined();
      expect(prisma.auditLog.create).toHaveBeenCalledWith(
        expect.objectContaining({
          data: expect.objectContaining({
            action: 'CREATE_MOSQUE_FACILITIES',
          }),
        }),
      );
    });

    it('should throw ForbiddenException if actor is not an authorized mosque admin or platform admin', async () => {
      prisma.mosque.findUnique.mockResolvedValue(mockMosque);
      prisma.mosqueStaff.findFirst.mockResolvedValue(null);

      await expect(
        service.upsertFacilities('mosque-1', dto, randomMusalliActor),
      ).rejects.toThrow(ForbiddenException);
    });

    it('should throw NotFoundException if mosque does not exist', async () => {
      prisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.upsertFacilities('nonexistent', dto, adminActor),
      ).rejects.toThrow(NotFoundException);
    });
  });
});
