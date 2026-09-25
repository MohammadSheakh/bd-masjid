import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { AttendanceStatus } from '@prisma/client';
import { PrismaService } from '@app/database';
import { SetAttendanceDto } from './dto/set-attendance.dto';

@Injectable()
export class AttendanceService {
  private readonly logger = new Logger(AttendanceService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Idempotently upsert attendance status for a user at a mosque
   */
  async setAttendance(mosqueId: string, userId: string, dto: SetAttendanceDto) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const record = await this.prisma.userMosqueAttendance.upsert({
      where: {
        userId_mosqueId: {
          userId,
          mosqueId,
        },
      },
      create: {
        userId,
        mosqueId,
        status: dto.status,
      },
      update: {
        status: dto.status,
      },
    });

    this.logger.log(`User ${userId} marked ${dto.status} at mosque ${mosqueId}`);

    const summary = await this.getSummary(mosqueId, userId);
    return {
      record,
      summary,
    };
  }

  /**
   * Idempotently remove attendance status
   */
  async removeAttendance(mosqueId: string, userId: string) {
    const existing = await this.prisma.userMosqueAttendance.findUnique({
      where: {
        userId_mosqueId: {
          userId,
          mosqueId,
        },
      },
    });

    if (existing) {
      await this.prisma.userMosqueAttendance.delete({
        where: { id: existing.id },
      });
      this.logger.log(`User ${userId} cleared attendance at mosque ${mosqueId}`);
    }

    const summary = await this.getSummary(mosqueId, userId);
    return {
      cleared: true,
      summary,
    };
  }

  /**
   * Get attendance aggregate counts and user's personal status
   */
  async getSummary(mosqueId: string, currentUserId?: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const [regularCount, occasionalCount, userAttendance] = await Promise.all([
      this.prisma.userMosqueAttendance.count({
        where: { mosqueId, status: AttendanceStatus.REGULAR },
      }),
      this.prisma.userMosqueAttendance.count({
        where: { mosqueId, status: AttendanceStatus.OCCASIONAL },
      }),
      currentUserId
        ? this.prisma.userMosqueAttendance.findUnique({
            where: { userId_mosqueId: { userId: currentUserId, mosqueId } },
            select: { status: true },
          })
        : null,
    ]);

    return {
      mosqueId,
      regularCount,
      occasionalCount,
      totalCount: regularCount + occasionalCount,
      userStatus: userAttendance?.status || 'NONE',
    };
  }

  /**
   * Get all mosques attended by the authenticated user
   */
  async getMyMosques(userId: string) {
    const attendances = await this.prisma.userMosqueAttendance.findMany({
      where: {
        userId,
        mosque: { isDeleted: false },
      },
      include: {
        mosque: {
          include: {
            prayerSchedule: true,
          },
        },
      },
      orderBy: { updatedAt: 'desc' },
    });

    return attendances.map((a) => ({
      status: a.status,
      updatedAt: a.updatedAt,
      mosque: a.mosque,
    }));
  }
}
