import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from '@nestjs/common';
import {
  DonationChannelStatus,
  DonationChannelType,
  MosqueStaffRole,
  Prisma,
} from '@prisma/client';
import { PrismaService } from '@app/database';
import type { UserPayload } from '@app/common';
import { AuditService } from '../audit/audit.service';
import {
  CreateDonationChannelDto,
  QueryDonationsDto,
  RejectDonationChannelDto,
  ReportDonationDto,
  VerifyDonationChannelDto,
} from './dto';

@Injectable()
export class DonationsService {
  private readonly logger = new Logger(DonationsService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Submit a new verified donation channel for a mosque
   * Created directly in VERIFIED status by verified mosque leadership:
   * Mutawalli, President, Vice President, General Secretary (or Mosque Admin).
   */
  async submitDonationChannel(
    mosqueId: string,
    dto: CreateDonationChannelDto,
    actor: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const leadership = await this.getCreatorLeadershipStaff(mosqueId, actor);

    if (
      dto.channelType === DonationChannelType.BANK_TRANSFER &&
      !dto.bankName
    ) {
      throw new BadRequestException(
        'bankName is required when channelType is BANK_TRANSFER',
      );
    }

    const now = new Date();
    const initialAttestation = {
      role: leadership.role,
      userId: actor.userId,
      name: leadership.name,
      imageUrl: leadership.imageUrl,
      attestedAt: now.toISOString(),
    };

    return this.prisma.$transaction(async (tx) => {
      const channel = await tx.mosqueDonationChannel.create({
        data: {
          mosqueId,
          channelType: dto.channelType,
          accountType: dto.accountType,
          purpose: dto.purpose,
          accountNumber: dto.accountNumber.trim(),
          accountTitle: dto.accountTitle.trim(),
          bankName: dto.bankName?.trim() ?? null,
          branchName: dto.branchName?.trim() ?? null,
          routingNumber: dto.routingNumber?.trim() ?? null,
          paymentInstructions: dto.paymentInstructions?.trim() ?? null,
          qrCodeImageUrl: dto.qrCodeImageUrl?.trim() ?? null,
          status: DonationChannelStatus.VERIFIED,
          createdById: actor.userId,
          creatorName: leadership.name,
          creatorRole: leadership.role,
          creatorImageUrl: leadership.imageUrl,
          verifiedRoles: [leadership.role],
          roleAttestations: [initialAttestation],
          verifiedById: actor.userId,
          verifiedAt: now,
        },
        include: {
          createdBy: {
            select: { id: true, name: true, role: true },
          },
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_DONATION_CHANNEL_SUBMITTED',
          entityType: 'MosqueDonationChannel',
          entityId: channel.id,
          actor,
          newValue: channel,
          metadata: {
            mosqueId,
            channelType: dto.channelType,
            verifiedRoles: channel.verifiedRoles,
            creatorRole: leadership.role,
          },
        },
        tx,
      );

      return channel;
    });
  }

  /**
   * List donation channels for a mosque
   * - Public callers see only VERIFIED channels
   * - Authorized mosque staff can view PENDING_VERIFICATION and other statuses
   */
  async getMosqueDonationChannels(
    mosqueId: string,
    query: QueryDonationsDto,
    actor?: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const isStaff = actor
      ? await this.isAuthorizedStaff(mosqueId, actor)
      : false;

    const where: Prisma.MosqueDonationChannelWhereInput = {
      mosqueId,
      ...(query.channelType ? { channelType: query.channelType } : {}),
      ...(query.purpose ? { purpose: query.purpose } : {}),
    };

    if (isStaff && query.status) {
      where.status = query.status;
    } else if (isStaff) {
      where.status = {
        in: [
          DonationChannelStatus.VERIFIED,
          DonationChannelStatus.PENDING_VERIFICATION,
          DonationChannelStatus.FLAGGED,
        ],
      };
    } else {
      where.status = DonationChannelStatus.VERIFIED;
    }

    return this.prisma.mosqueDonationChannel.findMany({
      where,
      orderBy: [{ status: 'asc' }, { createdAt: 'desc' }],
      include: {
        createdBy: {
          select: { id: true, name: true },
        },
        verifiedBy: {
          select: { id: true, name: true },
        },
      },
    });
  }

  /**
   * Get single donation channel by ID
   */
  async getDonationChannelById(id: string, actor?: UserPayload) {
    const channel = await this.prisma.mosqueDonationChannel.findUnique({
      where: { id },
      include: {
        createdBy: { select: { id: true, name: true } },
        verifiedBy: { select: { id: true, name: true } },
        mosque: { select: { id: true, name: true, city: true } },
      },
    });

    if (!channel) {
      throw new NotFoundException(`Donation channel with ID ${id} not found`);
    }

    if (channel.status !== DonationChannelStatus.VERIFIED) {
      const isStaff = actor
        ? await this.isAuthorizedStaff(channel.mosqueId, actor)
        : false;
      if (!isStaff) {
        throw new NotFoundException(`Donation channel with ID ${id} not found`);
      }
    }

    return channel;
  }

  /**
   * Verify and approve a donation channel (Legacy/Pending channel verification)
   * Enforces two-person verification rule: verifiedById !== createdById
   */
  async verifyDonationChannel(
    channelId: string,
    dto: VerifyDonationChannelDto,
    actor: UserPayload,
  ) {
    const channel = await this.prisma.mosqueDonationChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(
        `Donation channel with ID ${channelId} not found`,
      );
    }

    if (channel.status === DonationChannelStatus.VERIFIED) {
      throw new BadRequestException('Donation channel is already verified');
    }

    await this.assertCanVerify(channel.mosqueId, channel.createdById, actor);

    const staff = await this.prisma.mosqueStaff.findFirst({
      where: {
        mosqueId: channel.mosqueId,
        userId: actor.userId,
        isVerified: true,
      },
    });

    const now = new Date();
    const verifierRole = staff?.role ?? MosqueStaffRole.MOSQUE_ADMIN;
    const currentRoles: string[] = Array.isArray(channel.verifiedRoles)
      ? channel.verifiedRoles
      : [];
    const updatedRoles = Array.from(new Set([...currentRoles, verifierRole]));

    const existingAttestations: any[] = Array.isArray(channel.roleAttestations)
      ? (channel.roleAttestations as any[])
      : [];
    const updatedAttestations = [
      ...existingAttestations,
      {
        role: verifierRole,
        userId: actor.userId,
        name: staff?.name ?? 'Mosque Verifier',
        imageUrl: staff?.imageUrl ?? null,
        attestedAt: now.toISOString(),
      },
    ];

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.mosqueDonationChannel.update({
        where: { id: channelId },
        data: {
          status: DonationChannelStatus.VERIFIED,
          verifiedById: actor.userId,
          verifiedAt: now,
          rejectionReason: null,
          verifiedRoles: updatedRoles,
          roleAttestations: updatedAttestations,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_DONATION_CHANNEL_VERIFIED',
          entityType: 'MosqueDonationChannel',
          entityId: channelId,
          actor,
          previousValue: channel,
          newValue: updated,
          metadata: {
            mosqueId: channel.mosqueId,
            notes: dto.notes,
            verifierRole,
          },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Multi-signatory leadership attestation
   * President, Vice President, General Secretary, or Mutawalli adds their verification stamp.
   */
  async attestDonationChannel(channelId: string, actor: UserPayload) {
    const channel = await this.prisma.mosqueDonationChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(
        `Donation channel with ID ${channelId} not found`,
      );
    }

    const leadership = await this.getCreatorLeadershipStaff(channel.mosqueId, actor);

    const existingAttestations: any[] = Array.isArray(channel.roleAttestations)
      ? (channel.roleAttestations as any[])
      : [];

    if (existingAttestations.some((att) => att.userId === actor.userId)) {
      throw new BadRequestException(
        'You have already attested this donation channel',
      );
    }

    const now = new Date();
    const newAttestation = {
      role: leadership.role,
      userId: actor.userId,
      name: leadership.name,
      imageUrl: leadership.imageUrl,
      attestedAt: now.toISOString(),
    };

    const currentRoles: string[] = Array.isArray(channel.verifiedRoles)
      ? channel.verifiedRoles
      : [];
    const updatedRoles = Array.from(new Set([...currentRoles, leadership.role]));
    const updatedAttestations = [...existingAttestations, newAttestation];

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.mosqueDonationChannel.update({
        where: { id: channelId },
        data: {
          status: DonationChannelStatus.VERIFIED,
          verifiedRoles: updatedRoles,
          roleAttestations: updatedAttestations,
          verifiedById: channel.verifiedById ?? actor.userId,
          verifiedAt: channel.verifiedAt ?? now,
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_DONATION_CHANNEL_ATTESTED',
          entityType: 'MosqueDonationChannel',
          entityId: channelId,
          actor,
          newValue: updated,
          metadata: {
            attestedRole: leadership.role,
            totalAttestations: updatedAttestations.length,
            verifiedRoles: updatedRoles,
          },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Reject or archive a donation channel
   */
  async rejectDonationChannel(
    channelId: string,
    dto: RejectDonationChannelDto,
    actor: UserPayload,
  ) {
    const channel = await this.prisma.mosqueDonationChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(
        `Donation channel with ID ${channelId} not found`,
      );
    }

    await this.assertCanReject(channel.mosqueId, channel.createdById, actor);

    return this.prisma.$transaction(async (tx) => {
      const updated = await tx.mosqueDonationChannel.update({
        where: { id: channelId },
        data: {
          status: DonationChannelStatus.REJECTED,
          rejectionReason: dto.reason.trim(),
        },
        include: {
          createdBy: { select: { id: true, name: true } },
          verifiedBy: { select: { id: true, name: true } },
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_DONATION_CHANNEL_REJECTED',
          entityType: 'MosqueDonationChannel',
          entityId: channelId,
          actor,
          previousValue: channel,
          newValue: updated,
          metadata: { mosqueId: channel.mosqueId, reason: dto.reason },
        },
        tx,
      );

      return updated;
    });
  }

  /**
   * Submit a community fraud or error report
   * Anti-griefing invariant: Increments dispute count without deleting channel
   */
  async reportDonationChannel(
    channelId: string,
    dto: ReportDonationDto,
    actor: UserPayload,
  ) {
    const channel = await this.prisma.mosqueDonationChannel.findUnique({
      where: { id: channelId },
    });

    if (!channel) {
      throw new NotFoundException(
        `Donation channel with ID ${channelId} not found`,
      );
    }

    return this.prisma.$transaction(async (tx) => {
      const report = await tx.donationReport.create({
        data: {
          channelId,
          reportedById: actor.userId,
          reason: dto.reason.trim(),
          description: dto.description.trim(),
          status: 'OPEN',
        },
      });

      const updated = await tx.mosqueDonationChannel.update({
        where: { id: channelId },
        data: {
          disputeCount: { increment: 1 },
          ...(channel.disputeCount + 1 >= 3 &&
          channel.status === DonationChannelStatus.VERIFIED
            ? { status: DonationChannelStatus.FLAGGED }
            : {}),
        },
      });

      await this.audit.record(
        {
          action: 'MOSQUE_DONATION_CHANNEL_REPORTED',
          entityType: 'MosqueDonationChannel',
          entityId: channelId,
          actor,
          newValue: { reportId: report.id, disputeCount: updated.disputeCount },
          metadata: { mosqueId: channel.mosqueId, reason: dto.reason },
        },
        tx,
      );

      return {
        message:
          'Report submitted successfully. Mosque administration has been notified.',
        reportId: report.id,
      };
    });
  }

  /**
   * Helper: Check and retrieve verified mosque leadership staff
   * Mutawalli, President, Vice President, General Secretary, or Mosque Admin.
   */
  private async getCreatorLeadershipStaff(
    mosqueId: string,
    actor: UserPayload,
  ): Promise<{ role: MosqueStaffRole; name: string; imageUrl: string | null }> {
    if (actor.role === 'admin') {
      const user = await this.prisma.user.findUnique({
        where: { id: actor.userId },
        select: { id: true, name: true, profileImageUrl: true },
      });
      return {
        role: MosqueStaffRole.MOSQUE_ADMIN,
        name: user?.name ?? 'Platform Admin',
        imageUrl: user?.profileImageUrl ?? null,
      };
    }

    const staff = await this.prisma.mosqueStaff.findFirst({
      where: {
        mosqueId,
        userId: actor.userId,
        isVerified: true,
        role: {
          in: [
            MosqueStaffRole.MUTAWALLI,
            MosqueStaffRole.COMMITTEE_PRESIDENT,
            MosqueStaffRole.COMMITTEE_VICE_PRESIDENT,
            MosqueStaffRole.COMMITTEE_SECRETARY,
            MosqueStaffRole.MOSQUE_ADMIN,
          ],
        },
      },
      include: {
        user: {
          select: { profileImageUrl: true },
        },
      },
    });

    if (!staff) {
      throw new ForbiddenException(
        'Only verified Mutawalli, Committee President, Vice President, General Secretary, or Mosque Admin can create or attest verified donation channels',
      );
    }

    return {
      role: staff.role,
      name: staff.name,
      imageUrl: staff.imageUrl || staff.user?.profileImageUrl || null,
    };
  }

  /**
   * Helper: Enforce two-person verification rule
   */
  private async assertCanVerify(
    mosqueId: string,
    createdById: string,
    actor: UserPayload,
  ) {
    if (actor.userId === createdById) {
      throw new ForbiddenException(
        'CANNOT_APPROVE_OWN_SUBMISSION: Two-person verification requires an independent verifier',
      );
    }

    if (actor.role === 'admin') {
      return;
    }

    const staff = await this.prisma.mosqueStaff.findFirst({
      where: {
        mosqueId,
        userId: actor.userId,
        isVerified: true,
        role: {
          in: [
            MosqueStaffRole.MOSQUE_ADMIN,
            MosqueStaffRole.MUTAWALLI,
            MosqueStaffRole.IMAM,
          ],
        },
      },
    });

    if (!staff) {
      throw new ForbiddenException(
        'Only a verified Imam or Mosque Admin can verify donation channels',
      );
    }
  }

  /**
   * Helper: Check if actor can reject/archive donation channel
   */
  private async assertCanReject(
    mosqueId: string,
    createdById: string,
    actor: UserPayload,
  ) {
    if (actor.role === 'admin' || actor.userId === createdById) {
      return;
    }

    const staff = await this.prisma.mosqueStaff.findFirst({
      where: {
        mosqueId,
        userId: actor.userId,
        isVerified: true,
        role: {
          in: [
            MosqueStaffRole.MOSQUE_ADMIN,
            MosqueStaffRole.MUTAWALLI,
            MosqueStaffRole.IMAM,
            MosqueStaffRole.COMMITTEE_PRESIDENT,
            MosqueStaffRole.COMMITTEE_VICE_PRESIDENT,
          ],
        },
      },
    });

    if (!staff) {
      throw new ForbiddenException(
        'Only the submitter, Imam, Committee President, or Mosque Admin can reject this channel',
      );
    }
  }

  /**
   * Helper: Check if user is verified staff for a mosque
   */
  private async isAuthorizedStaff(
    mosqueId: string,
    actor: UserPayload,
  ): Promise<boolean> {
    if (actor.role === 'admin' || actor.role === 'moderator') {
      return true;
    }

    const staff = await this.prisma.mosqueStaff.findFirst({
      where: {
        mosqueId,
        userId: actor.userId,
        isVerified: true,
      },
    });

    return !!staff;
  }
}
