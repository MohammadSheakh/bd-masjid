import {
  Injectable,
  NotFoundException,
  ForbiddenException,
  Logger,
} from '@nestjs/common';
import { PrismaService } from '@app/database';
import { UserPayload } from '@app/common';
import { MosqueStaffRole } from '@prisma/client';
import { UpsertFacilityDto } from './dto/upsert-facility.dto';

@Injectable()
export class FacilitiesService {
  private readonly logger = new Logger(FacilitiesService.name);

  constructor(private readonly prisma: PrismaService) {}

  /**
   * Retrieve facilities taxonomy for a specific mosque
   */
  async getFacilities(mosqueId: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    const facility = await this.prisma.mosqueFacility.findUnique({
      where: { mosqueId },
    });

    return facility;
  }

  /**
   * Create or update facilities record with role authorization and audit trail
   */
  async upsertFacilities(
    mosqueId: string,
    dto: UpsertFacilityDto,
    actor: UserPayload,
  ) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id: mosqueId, isDeleted: false },
      select: { id: true, name: true },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${mosqueId} not found`);
    }

    // Authorization check: platform admin/moderator OR verified local mosque admin/committee
    const isPlatformAdmin =
      actor.role === 'admin' || actor.role === 'moderator';

    if (!isPlatformAdmin) {
      const staffMember = await this.prisma.mosqueStaff.findFirst({
        where: {
          mosqueId,
          userId: actor.userId,
          isVerified: true,
          role: {
            in: [
              MosqueStaffRole.MOSQUE_ADMIN,
              MosqueStaffRole.MUTAWALLI,
              MosqueStaffRole.COMMITTEE_PRESIDENT,
              MosqueStaffRole.COMMITTEE_SECRETARY,
              MosqueStaffRole.COMMITTEE_MEMBER,
            ],
          },
        },
      });

      if (!staffMember) {
        throw new ForbiddenException(
          'Only verified mosque administrators, committee leaders, or platform admins can update mosque facilities',
        );
      }
    }

    return this.prisma.$transaction(async (tx) => {
      const existing = await tx.mosqueFacility.findUnique({
        where: { mosqueId },
      });

      const facility = await tx.mosqueFacility.upsert({
        where: { mosqueId },
        create: {
          mosqueId,
          totalCapacity: dto.totalCapacity,
          toiletCount: dto.toiletCount,
          hasSeparateWudu: dto.hasSeparateWudu,
          wuduCapacity: dto.wuduCapacity,
          hasFemalePrayerSpace: dto.hasFemalePrayerSpace,
          femaleCapacity: dto.femaleCapacity,
          hasWheelchairAccess: dto.hasWheelchairAccess,
          hasRamp: dto.hasRamp,
          hasAirConditioning: dto.hasAirConditioning,
          hasFan: dto.hasFan,
          hasJanazaService: dto.hasJanazaService,
          hasParkingCar: dto.hasParkingCar,
          hasParkingBike: dto.hasParkingBike,
          hasLibraryMaktab: dto.hasLibraryMaktab,
          customAmenities: dto.customAmenities
            ? Array.from(new Set(dto.customAmenities.map((s) => s.trim()).filter(Boolean)))
            : [],
        },
        update: {
          ...(dto.totalCapacity !== undefined && {
            totalCapacity: dto.totalCapacity,
          }),
          ...(dto.toiletCount !== undefined && {
            toiletCount: dto.toiletCount,
          }),
          ...(dto.hasSeparateWudu !== undefined && {
            hasSeparateWudu: dto.hasSeparateWudu,
          }),
          ...(dto.wuduCapacity !== undefined && {
            wuduCapacity: dto.wuduCapacity,
          }),
          ...(dto.hasFemalePrayerSpace !== undefined && {
            hasFemalePrayerSpace: dto.hasFemalePrayerSpace,
          }),
          ...(dto.femaleCapacity !== undefined && {
            femaleCapacity: dto.femaleCapacity,
          }),
          ...(dto.hasWheelchairAccess !== undefined && {
            hasWheelchairAccess: dto.hasWheelchairAccess,
          }),
          ...(dto.hasRamp !== undefined && {
            hasRamp: dto.hasRamp,
          }),
          ...(dto.hasAirConditioning !== undefined && {
            hasAirConditioning: dto.hasAirConditioning,
          }),
          ...(dto.hasFan !== undefined && {
            hasFan: dto.hasFan,
          }),
          ...(dto.hasJanazaService !== undefined && {
            hasJanazaService: dto.hasJanazaService,
          }),
          ...(dto.hasParkingCar !== undefined && {
            hasParkingCar: dto.hasParkingCar,
          }),
          ...(dto.hasParkingBike !== undefined && {
            hasParkingBike: dto.hasParkingBike,
          }),
          ...(dto.hasLibraryMaktab !== undefined && {
            hasLibraryMaktab: dto.hasLibraryMaktab,
          }),
          ...(dto.customAmenities !== undefined && {
            customAmenities: Array.from(
              new Set(dto.customAmenities.map((s) => s.trim()).filter(Boolean)),
            ),
          }),
        },
      });

      // Immutable audit log recording previous and next state
      await tx.auditLog.create({
        data: {
          action: existing
            ? 'UPDATE_MOSQUE_FACILITIES'
            : 'CREATE_MOSQUE_FACILITIES',
          entityType: 'MosqueFacility',
          entityId: facility.id,
          actorId: actor.userId,
          actorRole: actor.role,
          previousValue: existing ? (existing as any) : undefined,
          newValue: facility as any,
        },
      });

      // Maintain backwards compatibility with legacy summary flags on Mosque
      await tx.mosque.update({
        where: { id: mosqueId },
        data: {
          ...(facility.totalCapacity !== null && {
            capacity: facility.totalCapacity,
          }),
          ...(facility.hasFemalePrayerSpace !== null && {
            hasSeparateWomenSpace: facility.hasFemalePrayerSpace,
          }),
          ...(facility.hasAirConditioning !== null && {
            hasAirConditioning: facility.hasAirConditioning,
          }),
          ...(facility.hasWheelchairAccess !== null && {
            hasWheelchairAccess: facility.hasWheelchairAccess,
          }),
          ...(facility.hasJanazaService !== null && {
            hasJanazaFacility: facility.hasJanazaService,
          }),
          ...(facility.hasSeparateWudu !== null && {
            hasWuduArea:
              facility.hasSeparateWudu ||
              (facility.wuduCapacity !== null && facility.wuduCapacity > 0),
          }),
          ...((facility.hasParkingCar !== null ||
            facility.hasParkingBike !== null) && {
            hasParking: Boolean(
              facility.hasParkingCar || facility.hasParkingBike,
            ),
          }),
        },
      });

      this.logger.log(
        `Facilities updated for mosque ${mosqueId} (${mosque.name}) by actor ${actor.userId}`,
      );

      return facility;
    });
  }
}
