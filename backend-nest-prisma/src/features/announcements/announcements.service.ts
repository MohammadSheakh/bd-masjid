import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';
import { AnnouncementCategory, Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import type { UserPayload } from '@app/common';
import { AuditService } from '../audit/audit.service';
import {
  CreateAnnouncementDto,
  FeedAnnouncementsDto,
  QueryAnnouncementsDto,
  UpdateAnnouncementDto,
} from './dto';

@Injectable()
export class AnnouncementsService {
  private readonly logger = new Logger(AnnouncementsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * List announcements for a specific mosque with category & expiration filtering
   */
  async getMosqueAnnouncements(
    mosqueId: string,
    query: QueryAnnouncementsDto,
    user?: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    let allowExpired = false;
    if (query.includeExpired && user) {
      if (user.role === 'admin' || user.role === 'moderator') {
        allowExpired = true;
      } else {
        const staff = await this.prisma.mosqueStaff.findFirst({
          where: {
            mosqueId,
            userId: user.userId,
            isVerified: true,
          },
        });
        if (staff) {
          allowExpired = true;
        }
      }
    }

    const where: Prisma.MosqueAnnouncementWhereInput = {
      mosqueId,
      ...(query.category ? { category: query.category } : {}),
      ...(allowExpired
        ? {}
        : {
            OR: [
              { expiresAt: null },
              { expiresAt: { gt: new Date() } },
            ],
          }),
    };

    const limit = query.limit ?? 20;
    const offset = query.offset ?? 0;

    const [items, total] = await Promise.all([
      this.prisma.mosqueAnnouncement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.mosqueAnnouncement.count({ where }),
    ]);

    return {
      success: true,
      data: items,
      total,
      limit,
      offset,
    };
  }

  /**
   * Create an announcement for a mosque
   * - Enforces staff verification / admin role
   * - Enforces EMERGENCY_ALERT restriction to MOSQUE_ADMIN, COMMITTEE_PRESIDENT, or global admin
   * - Enforces max 3 pinned announcements ceiling
   * - Captures authorRole snapshot
   * - Writes immutable AuditLog inside atomic transaction
   */
  async createAnnouncement(
    mosqueId: string,
    dto: CreateAnnouncementDto,
    actor: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    let authorRoleSnapshot: string = 'STAFF';

    if (actor.role === 'admin' || actor.role === 'moderator') {
      authorRoleSnapshot = actor.role.toUpperCase();
    } else {
      const staff = await this.prisma.mosqueStaff.findFirst({
        where: {
          mosqueId,
          userId: actor.userId,
          isVerified: true,
        },
      });

      if (!staff) {
        throw new ForbiddenException(
          'Only verified mosque staff, committee members, or admins can post announcements',
        );
      }

      authorRoleSnapshot = staff.role;

      if (dto.category === AnnouncementCategory.EMERGENCY_ALERT) {
        if (
          staff.role !== 'MOSQUE_ADMIN' &&
          staff.role !== 'COMMITTEE_PRESIDENT'
        ) {
          throw new ForbiddenException(
            'EMERGENCY_ALERT announcements require Mosque Admin or Committee President authorization',
          );
        }
      }
    }

    if (dto.expiresAt) {
      const expiryDate = new Date(dto.expiresAt);
      if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        throw new BadRequestException('Expiration date must be a valid future timestamp');
      }
    }

    if (dto.isPinned) {
      const pinnedCount = await this.prisma.mosqueAnnouncement.count({
        where: {
          mosqueId,
          isPinned: true,
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (pinnedCount >= 3) {
        throw new BadRequestException(
          'A maximum of 3 active announcements can be pinned simultaneously for a mosque',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const announcement = await tx.mosqueAnnouncement.create({
        data: {
          mosqueId,
          title: dto.title.trim(),
          content: dto.content.trim(),
          category: dto.category ?? AnnouncementCategory.GENERAL,
          isPinned: dto.isPinned ?? false,
          expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null,
          authorId: actor.userId,
          authorRole: authorRoleSnapshot,
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_ANNOUNCEMENT_CREATED',
          entityType: 'MosqueAnnouncement',
          entityId: announcement.id,
          actor,
          newValue: announcement,
          metadata: {
            mosqueId,
            category: announcement.category,
            isPinned: announcement.isPinned,
          },
        },
        tx,
      );

      return announcement;
    });
  }

  /**
   * Update an existing announcement
   * - Enforces author, MOSQUE_ADMIN, COMMITTEE_PRESIDENT, or global admin authorization
   * - Enforces EMERGENCY_ALERT restriction
   * - Enforces max 3 pinned announcements ceiling on pin toggles
   * - Writes atomic AuditLog
   */
  async updateAnnouncement(
    announcementId: string,
    dto: UpdateAnnouncementDto,
    actor: UserPayload,
  ) {
    const announcement = await this.prisma.mosqueAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    await this.assertMutationPermission(announcement, actor, dto.category);

    if (dto.expiresAt !== undefined && dto.expiresAt !== null) {
      const expiryDate = new Date(dto.expiresAt);
      if (isNaN(expiryDate.getTime()) || expiryDate <= new Date()) {
        throw new BadRequestException('Expiration date must be a valid future timestamp');
      }
    }

    if (dto.isPinned === true && !announcement.isPinned) {
      const pinnedCount = await this.prisma.mosqueAnnouncement.count({
        where: {
          mosqueId: announcement.mosqueId,
          isPinned: true,
          id: { not: announcementId },
          OR: [{ expiresAt: null }, { expiresAt: { gt: new Date() } }],
        },
      });

      if (pinnedCount >= 3) {
        throw new BadRequestException(
          'A maximum of 3 active announcements can be pinned simultaneously for a mosque',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.mosqueAnnouncement.update({
        where: { id: announcementId },
        data: {
          ...(dto.title !== undefined ? { title: dto.title.trim() } : {}),
          ...(dto.content !== undefined ? { content: dto.content.trim() } : {}),
          ...(dto.category !== undefined ? { category: dto.category } : {}),
          ...(dto.isPinned !== undefined ? { isPinned: dto.isPinned } : {}),
          ...(dto.expiresAt !== undefined
            ? { expiresAt: dto.expiresAt ? new Date(dto.expiresAt) : null }
            : {}),
        },
        include: {
          author: {
            select: { id: true, name: true },
          },
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_ANNOUNCEMENT_UPDATED',
          entityType: 'MosqueAnnouncement',
          entityId: announcementId,
          actor,
          previousValue: announcement,
          newValue: updated,
          metadata: { mosqueId: announcement.mosqueId },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Delete an announcement
   * - Enforces author, MOSQUE_ADMIN, COMMITTEE_PRESIDENT, or global admin
   * - Writes atomic AuditLog
   */
  async deleteAnnouncement(announcementId: string, actor: UserPayload) {
    const announcement = await this.prisma.mosqueAnnouncement.findUnique({
      where: { id: announcementId },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement with ID ${announcementId} not found`);
    }

    await this.assertMutationPermission(announcement, actor);

    return this.prisma.$transaction(async (tx) => {
      await tx.mosqueAnnouncement.delete({
        where: { id: announcementId },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_ANNOUNCEMENT_DELETED',
          entityType: 'MosqueAnnouncement',
          entityId: announcementId,
          actor,
          previousValue: announcement,
          metadata: { mosqueId: announcement.mosqueId },
        },
        tx,
      );

      return { success: true, deleted: true, announcementId };
    });
  }

  /**
   * Discovery feed across nearby mosques (via PostGIS ST_DWithin) or bookmarked mosques
   */
  async getAnnouncementsFeed(dto: FeedAnnouncementsDto, user?: UserPayload) {
    const limit = dto.limit ?? 20;
    const offset = dto.offset ?? 0;
    const now = new Date();

    if (dto.bookmarkedOnly) {
      if (!user) {
        throw new UnauthorizedException(
          'Authentication required to fetch bookmarked mosque announcements',
        );
      }

      const bookmarks = await this.prisma.mosqueBookmark.findMany({
        where: { userId: user.userId },
        select: { mosqueId: true },
      });
      const bookmarkedIds = bookmarks.map((b) => b.mosqueId);

      if (bookmarkedIds.length === 0) {
        return { success: true, data: [], total: 0, limit, offset };
      }

      const where: Prisma.MosqueAnnouncementWhereInput = {
        mosqueId: { in: bookmarkedIds },
        mosque: { isDeleted: false },
        OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
        ...(dto.emergencyOnly
          ? { category: AnnouncementCategory.EMERGENCY_ALERT }
          : dto.category
          ? { category: dto.category }
          : {}),
      };

      const [items, total] = await Promise.all([
        this.prisma.mosqueAnnouncement.findMany({
          where,
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: limit,
          skip: offset,
          include: {
            mosque: { select: { id: true, name: true, city: true } },
            author: { select: { id: true, name: true } },
          },
        }),
        this.prisma.mosqueAnnouncement.count({ where }),
      ]);

      return { success: true, data: items, total, limit, offset };
    }

    if (dto.lat !== undefined && dto.lng !== undefined) {
      const radiusMeters = (dto.radiusKm ?? 5.0) * 1000;
      const categoryClause = dto.emergencyOnly
        ? Prisma.sql`AND a."category" = 'EMERGENCY_ALERT'::"AnnouncementCategory"`
        : dto.category
        ? Prisma.sql`AND a."category" = ${dto.category}::"AnnouncementCategory"`
        : Prisma.empty;

      const rawAnnouncements = await this.prisma.$queryRaw<
        Array<{
          id: string;
          mosqueId: string;
          mosqueName: string;
          city: string;
          distanceMeters: number;
          title: string;
          content: string;
          category: string;
          isPinned: boolean;
          expiresAt: Date | null;
          authorId: string;
          authorName: string;
          authorRole: string | null;
          createdAt: Date;
          updatedAt: Date;
        }>
      >`
        SELECT 
          a.id,
          a."mosqueId",
          m.name AS "mosqueName",
          m.city,
          ROUND(
            ST_Distance(
              ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
              ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography
            )::numeric, 1
          )::double precision AS "distanceMeters",
          a.title,
          a.content,
          a.category::text AS category,
          a."isPinned",
          a."expiresAt",
          a."authorId",
          u.name AS "authorName",
          a."authorRole",
          a."createdAt",
          a."updatedAt"
        FROM "MosqueAnnouncement" a
        JOIN "Mosque" m ON a."mosqueId" = m.id
        JOIN "User" u ON a."authorId" = u.id
        WHERE m."isDeleted" = false
          AND (a."expiresAt" IS NULL OR a."expiresAt" > ${now})
          AND ST_DWithin(
            ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${dto.lng}, ${dto.lat}), 4326)::geography,
            ${radiusMeters}
          )
          ${categoryClause}
        ORDER BY a."isPinned" DESC, "distanceMeters" ASC, a."createdAt" DESC
        LIMIT ${limit} OFFSET ${offset}
      `;

      return {
        success: true,
        data: rawAnnouncements,
        total: rawAnnouncements.length,
        limit,
        offset,
      };
    }

    const where: Prisma.MosqueAnnouncementWhereInput = {
      mosque: { isDeleted: false },
      OR: [{ expiresAt: null }, { expiresAt: { gt: now } }],
      ...(dto.emergencyOnly
        ? { category: AnnouncementCategory.EMERGENCY_ALERT }
        : dto.category
        ? { category: dto.category }
        : {}),
    };

    const [items, total] = await Promise.all([
      this.prisma.mosqueAnnouncement.findMany({
        where,
        orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
        take: limit,
        skip: offset,
        include: {
          mosque: { select: { id: true, name: true, city: true } },
          author: { select: { id: true, name: true } },
        },
      }),
      this.prisma.mosqueAnnouncement.count({ where }),
    ]);

    return { success: true, data: items, total, limit, offset };
  }

  /**
   * Helper: check mutation authority (author, MOSQUE_ADMIN, COMMITTEE_PRESIDENT, or platform admin)
   */
  private async assertMutationPermission(
    announcement: { mosqueId: string; authorId: string },
    actor: UserPayload,
    newCategory?: AnnouncementCategory,
  ) {
    if (actor.role === 'admin' || actor.role === 'moderator') {
      return;
    }

    let isAuthorized = false;
    let isExecutive = false;

    if (announcement.authorId === actor.userId) {
      isAuthorized = true;
    }

    const staff = await this.prisma.mosqueStaff.findFirst({
      where: {
        mosqueId: announcement.mosqueId,
        userId: actor.userId,
        isVerified: true,
      },
    });

    if (
      staff &&
      (staff.role === 'MOSQUE_ADMIN' || staff.role === 'COMMITTEE_PRESIDENT')
    ) {
      isAuthorized = true;
      isExecutive = true;
    }

    if (!isAuthorized) {
      throw new ForbiddenException(
        'You do not have permission to modify this announcement',
      );
    }

    if (newCategory === AnnouncementCategory.EMERGENCY_ALERT && !isExecutive) {
      throw new ForbiddenException(
        'EMERGENCY_ALERT category requires Mosque Admin or Committee President authorization',
      );
    }
  }
}
