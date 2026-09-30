import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';
import { QueryNotificationsDto } from '../dto';
import { UserPayload } from '@app/common';
import { NotificationType, UserRole } from '@prisma/client';

describe('NotificationsController', () => {
  let controller: NotificationsController;
  let service: jest.Mocked<NotificationsService>;

  const mockUser: UserPayload = {
    userId: 'user-1',
    email: 'user@example.com',
    role: UserRole.MEMBER,
  };

  const mockNotification = {
    id: 'notif-1',
    userId: 'user-1',
    mosqueId: 'mosque-1',
    type: NotificationType.PRAYER_TIME_CHANGE,
    title: 'Prayer time update',
    message: 'Fajr time changed',
    isRead: false,
    createdAt: new Date(),
  };

  beforeEach(() => {
    service = {
      getUserNotifications: jest.fn(),
      getUnreadCount: jest.fn(),
      markAsRead: jest.fn(),
      markAllAsRead: jest.fn(),
      followMosque: jest.fn(),
      unfollowMosque: jest.fn(),
      getFollowStatus: jest.fn(),
      getFollowedMosques: jest.fn(),
    } as unknown as jest.Mocked<NotificationsService>;

    controller = new NotificationsController(service);
  });

  it('should be defined', () => {
    expect(controller).toBeDefined();
  });

  describe('getNotifications', () => {
    it('should retrieve paginated user notifications', async () => {
      const query: QueryNotificationsDto = { page: 1, limit: 10 };
      const response = { notifications: [mockNotification], total: 1 };
      service.getUserNotifications.mockResolvedValue(response as any);

      const result = await controller.getNotifications(mockUser, query);

      expect(service.getUserNotifications).toHaveBeenCalledWith('user-1', query);
      expect(result).toEqual(response);
    });
  });

  describe('getUnreadCount', () => {
    it('should retrieve total unread count for user', async () => {
      service.getUnreadCount.mockResolvedValue(3);

      const result = await controller.getUnreadCount(mockUser);

      expect(service.getUnreadCount).toHaveBeenCalledWith('user-1');
      expect(result).toEqual({ unreadCount: 3 });
    });
  });

  describe('markAsRead', () => {
    it('should mark single notification as read', async () => {
      const readNotif = { ...mockNotification, isRead: true };
      service.markAsRead.mockResolvedValue(readNotif as any);

      const result = await controller.markAsRead(mockUser, 'notif-1');

      expect(service.markAsRead).toHaveBeenCalledWith('user-1', 'notif-1');
      expect(result).toEqual(readNotif);
    });
  });

  describe('markAllAsRead', () => {
    it('should mark all notifications as read', async () => {
      const response = { count: 5 };
      service.markAllAsRead.mockResolvedValue(response as any);

      const result = await controller.markAllAsRead(mockUser);

      expect(service.markAllAsRead).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(response);
    });
  });

  describe('followMosque', () => {
    it('should follow mosque for user', async () => {
      const response = { success: true };
      service.followMosque.mockResolvedValue(response as any);

      const result = await controller.followMosque(mockUser, 'mosque-1');

      expect(service.followMosque).toHaveBeenCalledWith('user-1', 'mosque-1');
      expect(result).toEqual(response);
    });
  });

  describe('unfollowMosque', () => {
    it('should unfollow mosque for user', async () => {
      const response = { success: true };
      service.unfollowMosque.mockResolvedValue(response as any);

      const result = await controller.unfollowMosque(mockUser, 'mosque-1');

      expect(service.unfollowMosque).toHaveBeenCalledWith('user-1', 'mosque-1');
      expect(result).toEqual(response);
    });
  });

  describe('getFollowStatus', () => {
    it('should retrieve follow status for authenticated user', async () => {
      const response = { isFollowing: true, followersCount: 42 };
      service.getFollowStatus.mockResolvedValue(response as any);

      const result = await controller.getFollowStatus('mosque-1', mockUser);

      expect(service.getFollowStatus).toHaveBeenCalledWith('user-1', 'mosque-1');
      expect(result).toEqual(response);
    });

    it('should retrieve follow status for unauthenticated user with null userId', async () => {
      const response = { isFollowing: false, followersCount: 42 };
      service.getFollowStatus.mockResolvedValue(response as any);

      const result = await controller.getFollowStatus('mosque-1', undefined);

      expect(service.getFollowStatus).toHaveBeenCalledWith(null, 'mosque-1');
      expect(result).toEqual(response);
    });
  });

  describe('getFollowedMosques', () => {
    it('should retrieve list of followed mosques for user', async () => {
      const response = [{ id: 'mosque-1', name: 'Baitul Mukarram' }];
      service.getFollowedMosques.mockResolvedValue(response as any);

      const result = await controller.getFollowedMosques(mockUser);

      expect(service.getFollowedMosques).toHaveBeenCalledWith('user-1');
      expect(result).toEqual(response);
    });
  });
});
