import { FacilitiesController } from '../facilities.controller';
import { FacilitiesService } from '../facilities.service';
import { UpsertFacilityDto } from '../dto/upsert-facility.dto';
import { UserPayload } from '@app/common';
import { UserRole } from '@prisma/client';

describe('FacilitiesController', () => {
  let controller: FacilitiesController;
  let service: jest.Mocked<FacilitiesService>;

  const mockAdminActor: UserPayload = {
    userId: 'user-admin-1',
    email: 'admin@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockFacilities = {
    id: 'fac-1',
    mosqueId: 'mosque-1',
    hasWudu: true,
    hasSeparateWomenSpace: true,
    capacity: 2500,
    isWheelchairAccessible: true,
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      getFacilities: jest.fn(),
      upsertFacilities: jest.fn(),
    } as unknown as jest.Mocked<FacilitiesService>;

    controller = new FacilitiesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFacilities', () => {
    it('should return facilities taxonomy for given mosque', async () => {
      service.getFacilities.mockResolvedValue(mockFacilities as any);

      const result = await controller.getFacilities('mosque-1');

      expect(service.getFacilities).toHaveBeenCalledWith('mosque-1');
      expect(result).toEqual(mockFacilities);
    });
  });

  describe('upsertFacilities', () => {
    it('should delegate upsert to service with actor and dto', async () => {
      const dto: UpsertFacilityDto = {
        hasWudu: true,
        hasSeparateWomenSpace: true,
        capacity: 3000,
        isWheelchairAccessible: true,
      };
      const updated = { ...mockFacilities, capacity: 3000 };
      service.upsertFacilities.mockResolvedValue(updated as any);

      const result = await controller.upsertFacilities('mosque-1', dto, mockAdminActor);

      expect(service.upsertFacilities).toHaveBeenCalledWith('mosque-1', dto, mockAdminActor);
      expect(result).toEqual(updated);
    });
  });
});
