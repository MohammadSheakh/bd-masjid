import { Test, TestingModule } from '@nestjs/testing';
import { NotFoundException } from '@nestjs/common';
import { NotificationsService } from '../notifications.service';
import { NotificationsGateway } from '../notifications.gateway';
import { PrismaService } from '@app/database';
import { NotificationType } from '@prisma/client';

describe('NotificationsService', () => {
  let service: NotificationsService;
  let prisma: any;
  let gateway: any;

  const mockPrisma = {
    userNotification: {
      findMany: jest.fn(),
      count: jest.fn(),
      findFirst: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
      createMany: jest.fn(),
    },
    mosqueFollower: {
      findUnique: jest.fn(),
      findMany: jest.fn(),
      count: jest.fn(),
      upsert: jest.fn(),
      deleteMany: jest.fn(),
    },
    mosque: {
      findUnique: jest.fn(),
    },
  };

  const mockGateway = {
    sendToUser: jest.fn(),
    sendToMosque: jest.fn(),
  };

  beforeEach(async () => {
    jest.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        NotificationsService,
        { provide: PrismaService, useValue: mockPrisma },
        { provide: NotificationsGateway, useValue: mockGateway },
      ],
    }).compile();

    service = module.get<NotificationsService>(NotificationsService);
    prisma = module.get<PrismaService>(PrismaService);
    gateway = module.get<NotificationsGateway>(NotificationsGateway);
  });

  it('should be defined', () => {
    expect(service).toBeDefined();
  });

  describe('getUserNotifications', () => {
    it('should return paginated notifications and total unread count', async () => {
      const mockNotifications = [
        { id: 'notif-1', title: 'Schedule Update', isRead: false },
      ];
      mockPrisma.userNotification.findMany.mockResolvedValue(mockNotifications);
      mockPrisma.userNotification.count
        .mockResolvedValueOnce(1) // total
        .mockResolvedValueOnce(1); // unreadCount

      const res = await service.getUserNotifications('user-1', {
        page: 1,
        limit: 20,
      });

      expect(res.items).toHaveLength(1);
      expect(res.total).toBe(1);
      expect(res.unreadCount).toBe(1);
    });
  });

  describe('markAsRead', () => {
    it('should update notification and emit updated count', async () => {
      mockPrisma.userNotification.findFirst.mockResolvedValue({
        id: 'notif-1',
        userId: 'user-1',
      });
      mockPrisma.userNotification.update.mockResolvedValue({
        id: 'notif-1',
        isRead: true,
      });
      mockPrisma.userNotification.count.mockResolvedValue(0);

      const res = await service.markAsRead('user-1', 'notif-1');

      expect(res.isRead).toBe(true);
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:unread_count',
        {
          unreadCount: 0,
        },
      );
    });

    it('should throw NotFoundException if notification does not belong to user', async () => {
      mockPrisma.userNotification.findFirst.mockResolvedValue(null);

      await expect(service.markAsRead('user-1', 'invalid-id')).rejects.toThrow(
        NotFoundException,
      );
    });
  });

  describe('markAllAsRead', () => {
    it('should update all unread notifications for the user', async () => {
      mockPrisma.userNotification.updateMany.mockResolvedValue({ count: 5 });

      const res = await service.markAllAsRead('user-1');

      expect(res.updatedCount).toBe(5);
      expect(mockGateway.sendToUser).toHaveBeenCalledWith(
        'user-1',
        'notification:unread_count',
        {
          unreadCount: 0,
        },
      );
    });
  });

  describe('followMosque', () => {
    it('should upsert follower and return updated count', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue({
        id: 'mosque-1',
        name: 'Baitul Mukarram',
      });
      mockPrisma.mosqueFollower.upsert.mockResolvedValue({});
      mockPrisma.mosqueFollower.count.mockResolvedValue(42);

      const res = await service.followMosque('user-1', 'mosque-1');

      expect(res.isFollowing).toBe(true);
      expect(res.followersCount).toBe(42);
      expect(mockPrisma.mosqueFollower.upsert).toHaveBeenCalledWith({
        where: { userId_mosqueId: { userId: 'user-1', mosqueId: 'mosque-1' } },
        create: { userId: 'user-1', mosqueId: 'mosque-1' },
        update: {},
      });
    });

    it('should throw NotFoundException if mosque does not exist', async () => {
      mockPrisma.mosque.findUnique.mockResolvedValue(null);

      await expect(
        service.followMosque('user-1', 'nonexistent'),
      ).rejects.toThrow(NotFoundException);
    });
  });

  describe('unfollowMosque', () => {
    it('should delete follower record and return updated count', async () => {
      mockPrisma.mosqueFollower.deleteMany.mockResolvedValue({ count: 1 });
      mockPrisma.mosqueFollower.count.mockResolvedValue(41);

      const res = await service.unfollowMosque('user-1', 'mosque-1');

      expect(res.isFollowing).toBe(false);
      expect(res.followersCount).toBe(41);
    });
  });

  describe('fanOutMosqueNotification', () => {
    it('should batch insert notifications and emit real-time events to all followers', async () => {
      mockPrisma.mosqueFollower.findMany.mockResolvedValue([
        { userId: 'user-1' },
        { userId: 'user-2' },
      ]);
      mockPrisma.mosque.findUnique.mockResolvedValue({
        name: 'Central Mosque',
      });
      mockPrisma.userNotification.createMany.mockResolvedValue({ count: 2 });

      const res = await service.fanOutMosqueNotification('mosque-1', {
        type: NotificationType.ANNOUNCEMENT,
        title: 'Emergency Advisory',
        body: 'Severe weather alert in effect.',
      });

      expect(res.deliveredCount).toBe(2);
      expect(mockPrisma.userNotification.createMany).toHaveBeenCalled();
      expect(mockGateway.sendToMosque).toHaveBeenCalledWith(
        'mosque-1',
        'notification:new',
        expect.objectContaining({ title: 'Emergency Advisory' }),
      );
      expect(mockGateway.sendToUser).toHaveBeenCalledTimes(2);
    });

    it('should return 0 deliveredCount if mosque has no followers', async () => {
      mockPrisma.mosqueFollower.findMany.mockResolvedValue([]);
      mockPrisma.mosque.findUnique.mockResolvedValue({
        name: 'Central Mosque',
      });

      const res = await service.fanOutMosqueNotification('mosque-1', {
        type: NotificationType.ANNOUNCEMENT,
        title: 'Notice',
        body: 'Testing',
      });

      expect(res.deliveredCount).toBe(0);
      expect(mockPrisma.userNotification.createMany).not.toHaveBeenCalled();
    });
  });
});
