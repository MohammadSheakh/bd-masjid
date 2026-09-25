import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import type { UserPayload } from '@app/common';
import { UpdatePrayerScheduleDto } from './dto/update-prayer-schedule.dto';
import { FRESHNESS_THRESHOLDS_DAYS } from '../mosques/mosques.constants';

@Injectable()
export class PrayerSchedulesService {
  private readonly logger = new Logger(PrayerSchedulesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Derive freshness from schedule updated timestamp
   */
  deriveFreshness(updatedAt: Date | null) {
    if (!updatedAt) {
      return { level: 'VERY_STALE' as const, daysAgo: 999, lastUpdated: null };
    }
    const diffMs = Date.now() - updatedAt.getTime();
    const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let level: 'FRESH' | 'STALE' | 'VERY_STALE' = 'FRESH';
    if (daysAgo >= FRESHNESS_THRESHOLDS_DAYS.VERY_STALE) {
      level = 'VERY_STALE';
    } else if (daysAgo >= FRESHNESS_THRESHOLDS_DAYS.FRESH) {
      level = 'STALE';
    }

    return {
      level,
      daysAgo,
      lastUpdated: updatedAt,
    };
  }

  /**
   * Get current prayer schedule for a mosque
   */
  async getCurrentSchedule(mosqueId: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true, operationalStatus: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const schedule = await this.prisma.prayerSchedule.findUnique({
      where: { mosqueId },
      include: {
        updatedBy: {
          select: { id: true, name: true },
        },
      },
    });

    return {
      mosque,
      schedule: schedule || null,
      freshness: this.deriveFreshness(schedule?.updatedAt || null),
    };
  }

  /**
   * Update or initialize prayer schedule for a mosque
   * Atomic operation with history snapshot and audit trail
   */
  async updateSchedule(
    mosqueId: string,
    dto: UpdatePrayerScheduleDto,
    actor: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const { reason, ...scheduleFields } = dto;

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Upsert prayer schedule
      const updatedSchedule = await tx.prayerSchedule.upsert({
        where: { mosqueId },
        create: {
          mosqueId,
          ...scheduleFields,
          updatedById: actor.userId,
        },
        update: {
          ...scheduleFields,
          updatedById: actor.userId,
        },
      });

      // 2. Insert immutable history snapshot
      await tx.prayerScheduleHistory.create({
        data: {
          mosqueId,
          scheduleSnapshot: updatedSchedule,
          changedById: actor.userId,
          reason: reason?.trim() || null,
        },
      });

      // 3. Touch mosque updated timestamp for freshness ordering
      await tx.mosque.update({
        where: { id: mosqueId },
        data: { updatedAt: new Date() },
      });

      // 4. Record audit event
      await this.audit.record(
        {
          action: 'PRAYER_SCHEDULE_UPDATED',
          entityType: 'PrayerSchedule',
          entityId: updatedSchedule.id,
          actor,
          newValue: updatedSchedule,
          metadata: { mosqueId, reason },
        },
        tx,
      );

      return updatedSchedule;
    });

    this.logger.log(
      `Prayer schedule updated for mosque ${mosqueId} by user ${actor.userId}`,
    );

    return {
      ...result,
      freshness: this.deriveFreshness(result.updatedAt),
    };
  }

  /**
   * Retrieve versioned schedule history
   */
  async getHistory(mosqueId: string, page = 1, limit = 20) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (page - 1) * safeLimit;

    const [items, total] = await Promise.all([
      this.prisma.prayerScheduleHistory.findMany({
        where: { mosqueId },
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          changedBy: {
            select: { id: true, name: true },
          },
        },
      }),
      this.prisma.prayerScheduleHistory.count({
        where: { mosqueId },
      }),
    ]);

    return {
      items,
      meta: {
        page,
        limit: safeLimit,
        total,
        totalPages: Math.ceil(total / safeLimit),
      },
    };
  }
}
