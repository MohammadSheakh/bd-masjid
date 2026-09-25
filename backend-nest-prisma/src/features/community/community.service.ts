import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import { RoleClaimStatus, Prisma } from '@prisma/client';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import type { UserPayload } from '@app/common';
import { AddStaffDto } from './dto/add-staff.dto';
import { CreateRoleClaimDto } from './dto/create-claim.dto';
import { ReviewRoleClaimDto } from './dto/review-claim.dto';
import { CreateAnnouncementDto } from './dto/create-announcement.dto';
import { CreateDonationMethodDto } from './dto/create-donation.dto';
import { ReviewDonationMethodDto } from './dto/review-donation.dto';

@Injectable()
export class CommunityService {
  private readonly logger = new Logger(CommunityService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  // ──────────────────────────────────────────────────────────────────────────
  // Staff & Committee Management
  // ──────────────────────────────────────────────────────────────────────────

  async getStaff(mosqueId: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    return this.prisma.mosqueStaff.findMany({
      where: { mosqueId },
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'asc' }],
      include: {
        user: {
          select: { id: true, name: true, profileImageUrl: true },
        },
      },
    });
  }

  async addStaff(mosqueId: string, dto: AddStaffDto, actor: UserPayload) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const staff = await this.prisma.mosqueStaff.create({
      data: {
        mosqueId,
        role: dto.role,
        name: dto.name.trim(),
        userId: dto.userId || null,
        contactNumber: dto.contactNumber?.trim() || null,
        isVerified: actor.role === 'admin' || actor.role === 'moderator',
        verifiedAt:
          actor.role === 'admin' || actor.role === 'moderator'
            ? new Date()
            : null,
        verifiedById:
          actor.role === 'admin' || actor.role === 'moderator'
            ? actor.userId
            : null,
      },
    });

    await this.audit.record({
      action: 'MOSQUE_STAFF_ADDED',
      entityType: 'MosqueStaff',
      entityId: staff.id,
      actor,
      newValue: staff,
      metadata: { mosqueId, role: dto.role },
    });

    return staff;
  }

  async removeStaff(mosqueId: string, staffId: string, actor: UserPayload) {
    const staff = await this.prisma.mosqueStaff.findFirst({
      where: { id: staffId, mosqueId },
    });

    if (!staff) {
      throw new NotFoundException(
        `Staff member not found for mosque ${mosqueId}`,
      );
    }

    await this.prisma.mosqueStaff.delete({
      where: { id: staffId },
    });

    await this.audit.record({
      action: 'MOSQUE_STAFF_REMOVED',
      entityType: 'MosqueStaff',
      entityId: staffId,
      actor,
      previousValue: staff,
      metadata: { mosqueId },
    });

    return { removed: true, staffId };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Role Claims & Moderation
  // ──────────────────────────────────────────────────────────────────────────

  async submitRoleClaim(
    mosqueId: string,
    dto: CreateRoleClaimDto,
    actor: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    // Check for open duplicate claim
    const existing = await this.prisma.mosqueRoleClaim.findFirst({
      where: {
        mosqueId,
        userId: actor.userId,
        role: dto.role,
        status: { in: [RoleClaimStatus.OPEN, RoleClaimStatus.UNDER_REVIEW] },
      },
    });

    if (existing) {
      throw new ConflictException(
        'You already have an open claim for this role at this mosque',
      );
    }

    const claim = await this.prisma.mosqueRoleClaim.create({
      data: {
        mosqueId,
        userId: actor.userId,
        role: dto.role,
        evidence: dto.evidence.trim(),
        status: RoleClaimStatus.OPEN,
      },
    });

    this.logger.log(
      `Role claim ${claim.id} submitted for mosque ${mosqueId} by user ${actor.userId}`,
    );
    return claim;
  }

  async getRoleClaims(
    status?: RoleClaimStatus,
    mosqueId?: string,
    page = 1,
    limit = 20,
  ) {
    const safeLimit = Math.min(Math.max(1, limit), 50);
    const skip = (page - 1) * safeLimit;

    const where: Prisma.MosqueRoleClaimWhereInput = {};
    if (status) where.status = status;
    if (mosqueId) where.mosqueId = mosqueId;

    const [items, total] = await Promise.all([
      this.prisma.mosqueRoleClaim.findMany({
        where,
        skip,
        take: safeLimit,
        orderBy: { createdAt: 'desc' },
        include: {
          mosque: { select: { id: true, name: true, city: true } },
          user: {
            select: { id: true, name: true, email: true, phoneNumber: true },
          },
        },
      }),
      this.prisma.mosqueRoleClaim.count({ where }),
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

  async reviewRoleClaim(
    claimId: string,
    dto: ReviewRoleClaimDto,
    actor: UserPayload,
  ) {
    const claim = await this.prisma.mosqueRoleClaim.findUnique({
      where: { id: claimId },
      include: { user: true },
    });

    if (!claim) {
      throw new NotFoundException(`Role claim with ID ${claimId} not found`);
    }

    const result = await this.prisma.$transaction(async (tx) => {
      // 1. Update claim status
      const updatedClaim = await tx.mosqueRoleClaim.update({
        where: { id: claimId },
        data: {
          status: dto.status,
          resolutionNotes: dto.resolutionNotes?.trim() || null,
          reviewedById: actor.userId,
          reviewedAt: new Date(),
        },
      });

      // 2. If approved, upsert verified MosqueStaff entry
      if (dto.status === RoleClaimStatus.APPROVED) {
        await tx.mosqueStaff.create({
          data: {
            mosqueId: claim.mosqueId,
            userId: claim.userId,
            role: claim.role,
            name: claim.user.name,
            contactNumber: claim.user.phoneNumber,
            isVerified: true,
            verifiedAt: new Date(),
            verifiedById: actor.userId,
          },
        });
      }

      // 3. Audit trail
      await this.audit.record(
        {
          action: 'ROLE_CLAIM_REVIEWED',
          entityType: 'MosqueRoleClaim',
          entityId: claimId,
          actor,
          previousValue: claim,
          newValue: updatedClaim,
          metadata: { status: dto.status, notes: dto.resolutionNotes },
        },
        tx,
      );

      return updatedClaim;
    });

    return result;
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Announcements
  // ──────────────────────────────────────────────────────────────────────────

  async getAnnouncements(mosqueId: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    return this.prisma.mosqueAnnouncement.findMany({
      where: { mosqueId },
      orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
      include: {
        author: {
          select: { id: true, name: true },
        },
      },
    });
  }

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

    // Authorization: Admin, Moderator, or Verified Staff for this mosque
    if (actor.role !== 'admin' && actor.role !== 'moderator') {
      const isStaff = await this.prisma.mosqueStaff.findFirst({
        where: {
          mosqueId,
          userId: actor.userId,
          isVerified: true,
        },
      });

      if (!isStaff) {
        throw new ForbiddenException(
          'Only verified mosque staff, committee, or admins can post announcements',
        );
      }
    }

    const announcement = await this.prisma.mosqueAnnouncement.create({
      data: {
        mosqueId,
        title: dto.title.trim(),
        content: dto.content.trim(),
        isPinned: dto.isPinned || false,
        authorId: actor.userId,
      },
    });

    await this.audit.record({
      action: 'MOSQUE_ANNOUNCEMENT_CREATED',
      entityType: 'MosqueAnnouncement',
      entityId: announcement.id,
      actor,
      newValue: announcement,
      metadata: { mosqueId, isPinned: dto.isPinned },
    });

    return announcement;
  }

  async deleteAnnouncement(
    mosqueId: string,
    announcementId: string,
    actor: UserPayload,
  ) {
    const announcement = await this.prisma.mosqueAnnouncement.findFirst({
      where: { id: announcementId, mosqueId },
    });

    if (!announcement) {
      throw new NotFoundException(`Announcement not found`);
    }

    if (
      actor.role !== 'admin' &&
      actor.role !== 'moderator' &&
      announcement.authorId !== actor.userId
    ) {
      throw new ForbiddenException(
        'You do not have permission to delete this announcement',
      );
    }

    await this.prisma.mosqueAnnouncement.delete({
      where: { id: announcementId },
    });

    await this.audit.record({
      action: 'MOSQUE_ANNOUNCEMENT_DELETED',
      entityType: 'MosqueAnnouncement',
      entityId: announcementId,
      actor,
      previousValue: announcement,
      metadata: { mosqueId },
    });

    return { deleted: true, announcementId };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Verified Mosque Donation Information (Release 3 / PRD Section 14)
  // ──────────────────────────────────────────────────────────────────────────

  async getDonationMethods(mosqueId: string, actor?: UserPayload) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const isAdmin = actor?.role === 'admin' || actor?.role === 'moderator';

    return this.prisma.mosqueDonationMethod.findMany({
      where: {
        mosqueId,
        ...(isAdmin ? {} : { isVerified: true }),
      },
      orderBy: [{ isVerified: 'desc' }, { createdAt: 'asc' }],
    });
  }

  async addDonationMethod(
    mosqueId: string,
    dto: CreateDonationMethodDto,
    actor: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const isAdmin = actor.role === 'admin' || actor.role === 'moderator';

    // Must be admin or verified staff
    if (!isAdmin) {
      const staffMember = await this.prisma.mosqueStaff.findFirst({
        where: {
          mosqueId,
          userId: actor.userId,
          isVerified: true,
        },
      });

      if (!staffMember) {
        throw new ForbiddenException(
          'Only verified mosque staff, committee members, or platform admins can register donation methods',
        );
      }
    }

    const method = await this.prisma.mosqueDonationMethod.create({
      data: {
        mosqueId,
        methodType: dto.methodType,
        accountType: dto.accountType || 'MERCHANT',
        accountNumber: dto.accountNumber.trim(),
        accountTitle: dto.accountTitle?.trim() || null,
        bankName: dto.bankName?.trim() || null,
        branchName: dto.branchName?.trim() || null,
        routingNumber: dto.routingNumber?.trim() || null,
        instructions: dto.instructions?.trim() || null,
        isVerified: isAdmin,
        verifiedById: isAdmin ? actor.userId : null,
        verifiedAt: isAdmin ? new Date() : null,
        createdById: actor.userId,
      },
    });

    await this.audit.record({
      action: 'MOSQUE_DONATION_METHOD_ADDED',
      entityType: 'MosqueDonationMethod',
      entityId: method.id,
      actor,
      newValue: method,
      metadata: { mosqueId, methodType: dto.methodType },
    });

    return method;
  }

  async reviewDonationMethod(
    donationMethodId: string,
    dto: ReviewDonationMethodDto,
    actor: UserPayload,
  ) {
    const method = await this.prisma.mosqueDonationMethod.findUnique({
      where: { id: donationMethodId },
    });

    if (!method) {
      throw new NotFoundException(`Donation method with ID ${donationMethodId} not found`);
    }

    const updated = await this.prisma.mosqueDonationMethod.update({
      where: { id: donationMethodId },
      data: {
        isVerified: dto.isVerified,
        verifiedById: actor.userId,
        verifiedAt: new Date(),
      },
    });

    await this.audit.record({
      action: 'MOSQUE_DONATION_METHOD_REVIEWED',
      entityType: 'MosqueDonationMethod',
      entityId: donationMethodId,
      actor,
      previousValue: method,
      newValue: updated,
      metadata: { isVerified: dto.isVerified },
    });

    return updated;
  }

  async deleteDonationMethod(
    mosqueId: string,
    donationMethodId: string,
    actor: UserPayload,
  ) {
    const method = await this.prisma.mosqueDonationMethod.findFirst({
      where: { id: donationMethodId, mosqueId },
    });

    if (!method) {
      throw new NotFoundException(`Donation method not found`);
    }

    const isAdmin = actor.role === 'admin' || actor.role === 'moderator';
    if (!isAdmin && method.createdById !== actor.userId) {
      throw new ForbiddenException(
        'You do not have permission to delete this donation destination',
      );
    }

    await this.prisma.mosqueDonationMethod.delete({
      where: { id: donationMethodId },
    });

    await this.audit.record({
      action: 'MOSQUE_DONATION_METHOD_DELETED',
      entityType: 'MosqueDonationMethod',
      entityId: donationMethodId,
      actor,
      previousValue: method,
      metadata: { mosqueId },
    });

    return { deleted: true, donationMethodId };
  }

  // ──────────────────────────────────────────────────────────────────────────
  // Follow / Bookmark Mosque (Release 3)
  // ──────────────────────────────────────────────────────────────────────────

  async toggleBookmark(mosqueId: string, userId: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const existing = await this.prisma.mosqueBookmark.findUnique({
      where: {
        mosqueId_userId: {
          mosqueId,
          userId,
        },
      },
    });

    if (existing) {
      await this.prisma.mosqueBookmark.delete({
        where: { id: existing.id },
      });
      return { isBookmarked: false, mosqueId };
    } else {
      await this.prisma.mosqueBookmark.create({
        data: {
          mosqueId,
          userId,
        },
      });
      return { isBookmarked: true, mosqueId };
    }
  }

  async getUserBookmarks(userId: string) {
    const bookmarks = await this.prisma.mosqueBookmark.findMany({
      where: { userId },
      orderBy: { createdAt: 'desc' },
      include: {
        mosque: {
          include: {
            prayerSchedule: true,
          },
        },
      },
    });

    return bookmarks.map((b) => b.mosque);
  }
}
