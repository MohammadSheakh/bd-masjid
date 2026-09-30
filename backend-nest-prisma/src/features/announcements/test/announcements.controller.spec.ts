import { AnnouncementsController } from '../announcements.controller';
import { AnnouncementsService } from '../announcements.service';
import {
  CreateAnnouncementDto,
  FeedAnnouncementsDto,
  QueryAnnouncementsDto,
  UpdateAnnouncementDto,
} from '../dto';
import { UserPayload } from '@app/common';
import { AnnouncementCategory, UserRole } from '@prisma/client';

describe('AnnouncementsController', () => {
  let controller: AnnouncementsController;
  let service: jest.Mocked<AnnouncementsService>;

  const mockUser: UserPayload = {
    userId: 'user-staff-1',
    email: 'staff@mosque.org',
    role: UserRole.MEMBER,
  };

  const mockAnnouncement = {
    id: 'ann-1',
    mosqueId: 'mosque-1',
    title: 'Eid Prayer Timings',
    content: 'First Jamaat at 7:00 AM, Second Jamaat at 8:30 AM',
    category: AnnouncementCategory.GENERAL_ANNOUNCEMENT,
    isPinned: false,
    authorUserId: 'user-staff-1',
    createdAt: new Date(),
    updatedAt: new Date(),
  };

  beforeEach(() => {
    service = {
      getAnnouncementsFeed: jest.fn(),
      getMosqueAnnouncements: jest.fn(),
      createAnnouncement: jest.fn(),
      updateAnnouncement: jest.fn(),
      deleteAnnouncement: jest.fn(),
    } as unknown as jest.Mocked<AnnouncementsService>;

    controller = new AnnouncementsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getFeed', () => {
    it('should retrieve discovery feed with query dto and user context', async () => {
      const dto: FeedAnnouncementsDto = { latitude: 23.75, longitude: 90.39, radius: 5000 };
      const feed = [mockAnnouncement];
      service.getAnnouncementsFeed.mockResolvedValue(feed as any);

      const result = await controller.getFeed(dto, mockUser);

      expect(service.getAnnouncementsFeed).toHaveBeenCalledWith(dto, mockUser);
      expect(result).toEqual(feed);
    });
  });

  describe('getMosqueAnnouncements', () => {
    it('should query announcements for specific mosque', async () => {
      const query: QueryAnnouncementsDto = { page: 1, limit: 10 };
      const list = { announcements: [mockAnnouncement], total: 1 };
      service.getMosqueAnnouncements.mockResolvedValue(list as any);

      const result = await controller.getMosqueAnnouncements('mosque-1', query, mockUser);

      expect(service.getMosqueAnnouncements).toHaveBeenCalledWith('mosque-1', query, mockUser);
      expect(result).toEqual(list);
    });
  });

  describe('createAnnouncement', () => {
    it('should delegate creation to service with mosqueId, dto, and actor', async () => {
      const dto: CreateAnnouncementDto = {
        title: 'Eid Timings',
        content: 'Eid Jamaat details',
        category: AnnouncementCategory.GENERAL_ANNOUNCEMENT,
      };
      service.createAnnouncement.mockResolvedValue(mockAnnouncement as any);

      const result = await controller.createAnnouncement('mosque-1', dto, mockUser);

      expect(service.createAnnouncement).toHaveBeenCalledWith('mosque-1', dto, mockUser);
      expect(result).toEqual(mockAnnouncement);
    });
  });

  describe('updateAnnouncement', () => {
    it('should delegate update to service with announcementId, dto, and actor', async () => {
      const dto: UpdateAnnouncementDto = { title: 'Updated Eid Timings' };
      const updated = { ...mockAnnouncement, title: 'Updated Eid Timings' };
      service.updateAnnouncement.mockResolvedValue(updated as any);

      const result = await controller.updateAnnouncement('ann-1', dto, mockUser);

      expect(service.updateAnnouncement).toHaveBeenCalledWith('ann-1', dto, mockUser);
      expect(result).toEqual(updated);
    });
  });

  describe('deleteAnnouncement', () => {
    it('should delegate deletion to service with announcementId and actor', async () => {
      const deleteResponse = { success: true };
      service.deleteAnnouncement.mockResolvedValue(deleteResponse as any);

      const result = await controller.deleteAnnouncement('ann-1', mockUser);

      expect(service.deleteAnnouncement).toHaveBeenCalledWith('ann-1', mockUser);
      expect(result).toEqual(deleteResponse);
    });
  });
});
