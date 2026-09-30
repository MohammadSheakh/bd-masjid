import { BadRequestException } from '@nestjs/common';
import { MosquesController } from '../mosques.controller';
import { MosquesService } from '../mosques.service';
import { CreateMosqueDto } from '../dto/create-mosque.dto';
import { UpdateMosqueDto } from '../dto/update-mosque.dto';
import { NearbyMosquesQueryDto } from '../dto/nearby-mosques.dto';
import { MosqueQueryDto } from '../dto/mosque-query.dto';
import { UserPayload } from '@app/common';
import { UserRole } from '@prisma/client';

describe('MosquesController', () => {
  let controller: MosquesController;
  let service: jest.Mocked<MosquesService>;

  const mockUser: UserPayload = {
    userId: 'user-123',
    email: 'test@example.com',
    role: UserRole.MEMBER,
  };

  const mockMosque = {
    id: 'mosque-uuid-1',
    name: 'Baitul Mukarram National Mosque',
    latitude: 23.75,
    longitude: 90.39,
    address: 'Topkhana Road, Dhaka',
    verified: true,
  };

  beforeEach(() => {
    service = {
      create: jest.fn(),
      findNearby: jest.fn(),
      findDuplicateCandidates: jest.fn(),
      reverseGeocode: jest.fn(),
      findById: jest.fn(),
      findAll: jest.fn(),
      update: jest.fn(),
    } as unknown as jest.Mocked<MosquesService>;

    controller = new MosquesController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('create', () => {
    it('should delegate creation to MosquesService with actor context', async () => {
      const dto: CreateMosqueDto = {
        name: 'Baitul Mukarram',
        latitude: 23.75,
        longitude: 90.39,
        address: 'Dhaka',
      };
      service.create.mockResolvedValue(mockMosque as any);

      const result = await controller.create(dto, mockUser);

      expect(service.create).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(mockMosque);
    });
  });

  describe('findNearby', () => {
    it('should query nearby mosques via MosquesService', async () => {
      const query: NearbyMosquesQueryDto = {
        latitude: 23.75,
        longitude: 90.39,
        radius: 1000,
        limit: 10,
      };
      const nearbyList = [{ mosque: mockMosque, distanceMeters: 120 }];
      service.findNearby.mockResolvedValue(nearbyList as any);

      const result = await controller.findNearby(query);

      expect(service.findNearby).toHaveBeenCalledWith(query);
      expect(result).toEqual(nearbyList);
    });
  });

  describe('checkDuplicate', () => {
    it('should query duplicate candidates by coordinates', async () => {
      const candidates = [mockMosque];
      service.findDuplicateCandidates.mockResolvedValue(candidates as any);

      const result = await controller.checkDuplicate({
        latitude: 23.75,
        longitude: 90.39,
      });

      expect(service.findDuplicateCandidates).toHaveBeenCalledWith(23.75, 90.39);
      expect(result).toEqual({ candidates });
    });
  });

  describe('reverseGeocode', () => {
    it('should parse coordinates and delegate to service', async () => {
      const geocodeResult = {
        name: 'Dhanmondi Shahi Masjid',
        suburb: 'Dhanmondi',
        city: 'Dhaka',
      };
      service.reverseGeocode.mockResolvedValue(geocodeResult as any);

      const result = await controller.reverseGeocode('23.75', '90.39');

      expect(service.reverseGeocode).toHaveBeenCalledWith(23.75, 90.39);
      expect(result).toEqual(geocodeResult);
    });

    it('should throw BadRequestException if coordinates are not numbers', async () => {
      await expect(
        controller.reverseGeocode('invalid-lat', '90.39'),
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe('findById', () => {
    it('should retrieve mosque by ID passing user ID when authenticated', async () => {
      service.findById.mockResolvedValue(mockMosque as any);

      const result = await controller.findById('mosque-uuid-1', mockUser);

      expect(service.findById).toHaveBeenCalledWith('mosque-uuid-1', 'user-123');
      expect(result).toEqual(mockMosque);
    });

    it('should retrieve mosque by ID passing undefined user ID when unauthenticated', async () => {
      service.findById.mockResolvedValue(mockMosque as any);

      const result = await controller.findById('mosque-uuid-1', undefined);

      expect(service.findById).toHaveBeenCalledWith('mosque-uuid-1', undefined);
      expect(result).toEqual(mockMosque);
    });
  });

  describe('findAll', () => {
    it('should query paginated mosques', async () => {
      const query: MosqueQueryDto = { search: 'Baitul', page: 1, limit: 10 };
      const paginatedResult = { items: [mockMosque], total: 1, page: 1, limit: 10 };
      service.findAll.mockResolvedValue(paginatedResult as any);

      const result = await controller.findAll(query);

      expect(service.findAll).toHaveBeenCalledWith(query);
      expect(result).toEqual(paginatedResult);
    });
  });

  describe('update', () => {
    it('should delegate update to service with actor context', async () => {
      const updateDto: UpdateMosqueDto = { address: 'New Address' };
      const updatedMosque = { ...mockMosque, address: 'New Address' };
      service.update.mockResolvedValue(updatedMosque as any);

      const result = await controller.update('mosque-uuid-1', updateDto, mockUser);

      expect(service.update).toHaveBeenCalledWith('mosque-uuid-1', updateDto, mockUser);
      expect(result).toEqual(updatedMosque);
    });
  });
});
