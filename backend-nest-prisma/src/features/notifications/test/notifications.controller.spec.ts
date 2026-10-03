import request from 'supertest';
import {
  INestApplication,
  ValidationPipe,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Test, TestingModule } from '@nestjs/testing';
import { Reflector } from '@nestjs/core';
import {
  IS_PUBLIC_KEY,
  AuthGuard,
  SlidingWindowRateLimitGuard,
  UserPayload,
} from '@app/common';
import { NotificationType, UserRole } from '@prisma/client';
import { NotificationsController } from '../notifications.controller';
import { NotificationsService } from '../notifications.service';
import { QueryNotificationsDto } from '../dto';

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

      expect(service.getUserNotifications).toHaveBeenCalledWith(
        'user-1',
        query,
      );
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
      service.getFollowStatus.mockResolvedValue(response);

      const result = await controller.getFollowStatus('mosque-1', mockUser);

      expect(service.getFollowStatus).toHaveBeenCalledWith(
        'user-1',
        'mosque-1',
      );
      expect(result).toEqual(response);
    });

    it('should retrieve follow status for unauthenticated user with null userId', async () => {
      const response = { isFollowing: false, followersCount: 42 };
      service.getFollowStatus.mockResolvedValue(response);

      const result = await controller.getFollowStatus('mosque-1', undefined);

      expect(service.getFollowStatus).toHaveBeenCalledWith(null, 'mosque-1');
      expect(result).toEqual(response);
    });
  });

  describe('HTTP Route Integration (Supertest)', () => {
    let app: INestApplication;
    let mockNotificationsService: {
      getUserNotifications: jest.Mock;
      getUnreadCount: jest.Mock;
      markAsRead: jest.Mock;
      markAllAsRead: jest.Mock;
      followMosque: jest.Mock;
      unfollowMosque: jest.Mock;
      getFollowStatus: jest.Mock;
      getFollowedMosques: jest.Mock;
    };

    beforeAll(async () => {
      mockNotificationsService = {
        getUserNotifications: jest
          .fn()
          .mockResolvedValue({ notifications: [mockNotification], total: 1 }),
        getUnreadCount: jest.fn().mockResolvedValue(3),
        markAsRead: jest
          .fn()
          .mockResolvedValue({ ...mockNotification, isRead: true }),
        markAllAsRead: jest.fn().mockResolvedValue({ count: 1 }),
        followMosque: jest.fn().mockResolvedValue({ success: true }),
        unfollowMosque: jest.fn().mockResolvedValue({ success: true }),
        getFollowStatus: jest
          .fn()
          .mockResolvedValue({ isFollowing: false, followersCount: 10 }),
        getFollowedMosques: jest
          .fn()
          .mockResolvedValue([{ id: 'mosque-1', name: 'Test Mosque' }]),
      };

      const moduleRef: TestingModule = await Test.createTestingModule({
        controllers: [NotificationsController],
        providers: [
          { provide: NotificationsService, useValue: mockNotificationsService },
        ],
      })
        .overrideGuard(SlidingWindowRateLimitGuard)
        .useValue({ canActivate: () => true })
        .overrideGuard(AuthGuard)
        .useValue({
          canActivate: (context: ExecutionContext) => {
            const req = context.switchToHttp().getRequest();
            const reflector = new Reflector();
            const isPublic = reflector.getAllAndOverride<boolean>(
              IS_PUBLIC_KEY,
              [context.getHandler(), context.getClass()],
            );
            if (isPublic) return true;

            const authHeader = req.headers['authorization'];
            if (!authHeader || !authHeader.startsWith('Bearer ')) {
              throw new UnauthorizedException(
                'Authentication token missing or invalid',
              );
            }

            req.user = mockUser;
            return true;
          },
        })
        .compile();

      app = moduleRef.createNestApplication();
      app.useGlobalPipes(
        new ValidationPipe({
          whitelist: true,
          transform: true,
          forbidNonWhitelisted: true,
        }),
      );
      await app.init();
    });

    afterAll(async () => {
      await app.close();
    });

    it('GET /notifications - rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).get('/notifications');
      expect(res.status).toBe(401);
    });

    it('GET /notifications - accepts authenticated requests with 200', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications?page=1&limit=10')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(data.total).toBe(1);
    });

    it('GET /notifications/unread-count - returns 401 when unauthorized', async () => {
      const res = await request(app.getHttpServer()).get(
        '/notifications/unread-count',
      );
      expect(res.status).toBe(401);
    });

    it('GET /notifications/unread-count - returns unread count with 200 when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .get('/notifications/unread-count')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(data.unreadCount).toBe(3);
    });

    it('GET /mosques/:id/follow-status - allows public access with 200', async () => {
      const res = await request(app.getHttpServer()).get(
        '/mosques/mosque-1/follow-status',
      );
      expect(res.status).toBe(200);
      const data = res.body.data ?? res.body;
      expect(data.followersCount).toBe(10);
    });

    it('POST /mosques/:id/follow - rejects unauthenticated requests with 401', async () => {
      const res = await request(app.getHttpServer()).post(
        '/mosques/mosque-1/follow',
      );
      expect(res.status).toBe(401);
    });

    it('POST /mosques/:id/follow - succeeds with 201 when authenticated', async () => {
      const res = await request(app.getHttpServer())
        .post('/mosques/mosque-1/follow')
        .set('Authorization', 'Bearer valid-jwt');

      expect(res.status).toBe(201);
      const data = res.body.data ?? res.body;
      expect(data.success).toBe(true);
    });
  });
});
