import {
  Injectable,
  NotFoundException,
  Logger,
} from '@nestjs/common';
import { Prisma, SuggestionStatus, ReportType } from '@prisma/client';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import type { UserPayload } from '@app/common';
import { CreateSuggestionDto } from './dto/create-suggestion.dto';
import { CreateReportDto } from './dto/create-report.dto';
import { UpdateStatusDto } from './dto/update-status.dto';

@Injectable()
export class SuggestionsService {
  private readonly logger = new Logger(SuggestionsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Submit prayer time or profile suggestion
   */
  async createSuggestion(
    mosqueId: string,
    dto: CreateSuggestionDto,
    userId?: string,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const suggestion = await this.prisma.mosqueSuggestion.create({
      data: {
        mosqueId,
        userId: userId || null,
        suggestedTimes: dto.suggestedTimes ? (dto.suggestedTimes as Prisma.InputJsonValue) : Prisma.JsonNull,
        description: dto.description?.trim() || null,
        status: SuggestionStatus.OPEN,
      },
    });

    this.logger.log(`New suggestion ${suggestion.id} submitted for mosque ${mosqueId}`);
    return suggestion;
  }

  /**
   * Submit issue or discrepancy report
   */
  async createReport(
    mosqueId: string,
    dto: CreateReportDto,
    userId?: string,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const report = await this.prisma.mosqueReport.create({
      data: {
        mosqueId,
        userId: userId || null,
        type: dto.type,
        description: dto.description.trim(),
        contactEmail: dto.contactEmail?.trim() || null,
        status: SuggestionStatus.OPEN,
      },
    });

    this.logger.log(`New report ${report.id} (${report.type}) submitted for mosque ${mosqueId}`);
    return report;
  }

  /**
   * Moderation: Query suggestions
   */
  async getSuggestions(
    status?: SuggestionStatus,
    mosqueId?: string,
    page = 1,
    limit = 20,
  ) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.MosqueSuggestionWhereInput = {};
    if (status) where.status = status;
    if (mosqueId) where.mosqueId = mosqueId;

    const [items, total] = await Promise.all([
      this.prisma.mosqueSuggestion.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          mosque: {
            select: { id: true, name: true, city: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.mosqueSuggestion.count({ where }),
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
   * Moderation: Update suggestion status with resolution notes
   */
  async updateSuggestionStatus(
    id: string,
    dto: UpdateStatusDto,
    actor: UserPayload,
  ) {
    const existing = await this.prisma.mosqueSuggestion.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Suggestion with ID ${id} not found`);
    }

    const updated = await this.prisma.mosqueSuggestion.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes?.trim() || null,
        reviewedById: actor.userId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.record({
      action: 'SUGGESTION_REVIEWED',
      entityType: 'MosqueSuggestion',
      entityId: id,
      actor,
      previousValue: existing,
      newValue: updated,
      metadata: { status: dto.status, notes: dto.resolutionNotes },
    });

    return updated;
  }

  /**
   * Moderation: Query reports
   */
  async getReports(
    status?: SuggestionStatus,
    type?: ReportType,
    mosqueId?: string,
    page = 1,
    limit = 20,
  ) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.MosqueReportWhereInput = {};
    if (status) where.status = status;
    if (type) where.type = type;
    if (mosqueId) where.mosqueId = mosqueId;

    const [items, total] = await Promise.all([
      this.prisma.mosqueReport.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          mosque: {
            select: { id: true, name: true, city: true },
          },
          user: {
            select: { id: true, name: true, email: true },
          },
        },
      }),
      this.prisma.mosqueReport.count({ where }),
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
   * Moderation: Update report status
   */
  async updateReportStatus(
    id: string,
    dto: UpdateStatusDto,
    actor: UserPayload,
  ) {
    const existing = await this.prisma.mosqueReport.findUnique({
      where: { id },
    });

    if (!existing) {
      throw new NotFoundException(`Report with ID ${id} not found`);
    }

    const updated = await this.prisma.mosqueReport.update({
      where: { id },
      data: {
        status: dto.status,
        resolutionNotes: dto.resolutionNotes?.trim() || null,
        reviewedById: actor.userId,
        reviewedAt: new Date(),
      },
    });

    await this.audit.record({
      action: 'REPORT_REVIEWED',
      entityType: 'MosqueReport',
      entityId: id,
      actor,
      previousValue: existing,
      newValue: updated,
      metadata: { status: dto.status, notes: dto.resolutionNotes },
    });

    return updated;
  }
}
