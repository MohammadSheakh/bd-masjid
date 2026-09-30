import {
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { NotificationType, Prisma } from '@prisma/client';
import { NotificationsGateway } from './notifications.gateway';
import { QueryNotificationsDto } from './dto';

@Injectable()
export class NotificationsService {
  private readonly logger = new Logger(NotificationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly gateway: NotificationsGateway,
  ) {}

  /**
   * Get paginated notifications for authenticated user
   */
  async getUserNotifications(userId: string, query: QueryNotificationsDto) {
    const { isRead, type, page = 1, limit = 20 } = query;
    const skip = (page - 1) * limit;

    const where: Prisma.UserNotificationWhereInput = {
      userId,
      ...(isRead !== undefined ? { isRead } : {}),
      ...(type ? { type } : {}),
    };

    const [items, total, unreadCount] = await Promise.all([
      this.prisma.userNotification.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
        include: {
          mosque: {
            select: { id: true, name: true, city: true },
          },
        },
      }),
      this.prisma.userNotification.count({ where }),
      this.getUnreadCount(userId),
    ]);

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit) || 1,
      unreadCount,
    };
  }

  /**
   * Fast unread notification counter
   */
  async getUnreadCount(userId: string): Promise<number> {
    return this.prisma.userNotification.count({
      where: { userId, isRead: false },
    });
  }

  /**
   * Mark a single notification as read
   */
  async markAsRead(userId: string, notificationId: string) {
    const notification = await this.prisma.userNotification.findFirst({
      where: { id: notificationId, userId },
    });

    if (!notification) {
      throw new NotFoundException('Notification not found');
    }

    const updated = await this.prisma.userNotification.update({
      where: { id: notificationId },
      data: { isRead: true, readAt: new Date() },
    });

    const unreadCount = await this.getUnreadCount(userId);
    this.gateway.sendToUser(userId, 'notification:unread_count', { unreadCount });

    return updated;
  }

  /**
   * Mark all unread notifications as read
   */
  async markAllAsRead(userId: string) {
    const result = await this.prisma.userNotification.updateMany({
      where: { userId, isRead: false },
      data: { isRead: true, readAt: new Date() },
    });

    this.gateway.sendToUser(userId, 'notification:unread_count', { unreadCount: 0 });

    return { success: true, updatedCount: result.count };
  }

  /**
   * Follow a mosque (idempotent)
   */
  async followMosque(userId: string, mosqueId: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException('Mosque not found');
    }

    await this.prisma.mosqueFollower.upsert({
      where: {
        userId_mosqueId: { userId, mosqueId },
      },
      create: { userId, mosqueId },
      update: {},
    });

    const followersCount = await this.prisma.mosqueFollower.count({
      where: { mosqueId },
    });

    return { success: true, isFollowing: true, followersCount };
  }

  /**
   * Unfollow a mosque (idempotent)
   */
  async unfollowMosque(userId: string, mosqueId: string) {
    await this.prisma.mosqueFollower.deleteMany({
      where: { userId, mosqueId },
    });

    const followersCount = await this.prisma.mosqueFollower.count({
      where: { mosqueId },
    });

    return { success: true, isFollowing: false, followersCount };
  }

  /**
   * Query follow status for a user and mosque
   */
  async getFollowStatus(userId: string | null, mosqueId: string) {
    const [isFollowing, followersCount] = await Promise.all([
      userId
        ? this.prisma.mosqueFollower.findUnique({
            where: { userId_mosqueId: { userId, mosqueId } },
          }).then(Boolean)
        : Promise.resolve(false),
      this.prisma.mosqueFollower.count({ where: { mosqueId } }),
    ]);

    return { isFollowing, followersCount };
  }

  /**
   * Get all mosques followed by a user
   */
  async getFollowedMosques(userId: string) {
    const followers = await this.prisma.mosqueFollower.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        mosque: {
          include: {
            facility: true,
            prayerSchedule: true,
          },
        },
      },
    });

    return { items: followers.map((f) => f.mosque) };
  }

  /**
   * Core Fan-Out Engine: Batch inserts user notifications and emits real-time WebSocket events
   */
  async fanOutMosqueNotification(
    mosqueId: string,
    payload: {
      type: NotificationType;
      title: string;
      body: string;
      entityId?: string;
    },
  ) {
    try {
      const [followers, mosque] = await Promise.all([
        this.prisma.mosqueFollower.findMany({
          where: { mosqueId },
          select: { userId: true },
        }),
        this.prisma.mosque.findUnique({
          where: { id: mosqueId },
          select: { name: true },
        }),
      ]);

      if (!followers.length) {
        return { deliveredCount: 0 };
      }

      const rows = followers.map((f) => ({
        userId: f.userId,
        mosqueId,
        type: payload.type,
        title: payload.title,
        body: payload.body,
        entityId: payload.entityId,
      }));

      // Bounded chunked batch insertion (1,000 per chunk)
      const chunkSize = 1000;
      for (let i = 0; i < rows.length; i += chunkSize) {
        await this.prisma.userNotification.createMany({
          data: rows.slice(i, i + chunkSize),
        });
      }

      // Real-time broadcast to mosque room
      const broadcastPayload = {
        mosqueId,
        mosqueName: mosque?.name || 'Mosque',
        type: payload.type,
        title: payload.title,
        body: payload.body,
        entityId: payload.entityId,
        createdAt: new Date().toISOString(),
      };

      this.gateway.sendToMosque(mosqueId, 'notification:new', broadcastPayload);

      // Notify individual user rooms for instant badge increment
      for (const follower of followers) {
        this.gateway.sendToUser(follower.userId, 'notification:new', broadcastPayload);
      }

      this.logger.log(
        `Fan-out completed for mosque ${mosqueId}: ${followers.length} notifications dispatched`,
      );

      return { deliveredCount: followers.length };
    } catch (err: any) {
      this.logger.error(`Fan-out notification failed for mosque ${mosqueId}: ${err?.message}`);
      return { deliveredCount: 0 };
    }
  }
}
