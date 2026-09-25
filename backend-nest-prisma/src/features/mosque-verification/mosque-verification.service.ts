import { Injectable, NotFoundException, Logger } from '@nestjs/common';
import { MosqueVerificationStatus } from '@prisma/client';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import type { UserPayload } from '@app/common';
import { VerifyMosqueDto, RejectMosqueDto } from './dto/verification.dto';

@Injectable()
export class MosqueVerificationService {
  private readonly logger = new Logger(MosqueVerificationService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * List mosques pending verification or disputed
   */
  async getPendingMosques(page = 1, limit = 20) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (page - 1) * safeLimit;

    const where = {
      isDeleted: false,
      verificationStatus: {
        in: [
          MosqueVerificationStatus.UNVERIFIED,
          MosqueVerificationStatus.PENDING_VERIFICATION,
        ],
      },
    };

    const [items, total] = await Promise.all([
      this.prisma.mosque.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          prayerSchedule: true,
          creator: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.mosque.count({ where }),
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

  /**
   * Approve and verify mosque
   */
  async verifyMosque(
    mosqueId: string,
    dto: VerifyMosqueDto,
    actor: UserPayload,
  ) {
    const existing = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const mosque = await tx.mosque.update({
        where: { id: mosqueId },
        data: {
          verificationStatus: MosqueVerificationStatus.VERIFIED,
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_VERIFIED',
          entityType: 'Mosque',
          entityId: mosqueId,
          actor,
          previousValue: existing,
          newValue: mosque,
          metadata: { notes: dto.notes },
        },
        tx,
      );

      return mosque;
    });

    this.logger.log(`Mosque ${mosqueId} verified by ${actor.userId}`);
    return updated;
  }

  /**
   * Reject mosque listing
   */
  async rejectMosque(
    mosqueId: string,
    dto: RejectMosqueDto,
    actor: UserPayload,
  ) {
    const existing = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!existing) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const mosque = await tx.mosque.update({
        where: { id: mosqueId },
        data: {
          verificationStatus: MosqueVerificationStatus.REJECTED,
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_REJECTED',
          entityType: 'Mosque',
          entityId: mosqueId,
          actor,
          previousValue: existing,
          newValue: mosque,
          metadata: { reason: dto.reason },
        },
        tx,
      );

      return mosque;
    });

    this.logger.log(
      `Mosque ${mosqueId} rejected by ${actor.userId} (Reason: ${dto.reason})`,
    );
    return updated;
  }
}
