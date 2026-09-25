import {
  Injectable,
  NotFoundException,
  ConflictException,
  Logger,
} from '@nestjs/common';
import {
  Prisma,
  MosqueOperationalStatus,
  MosqueVerificationStatus,
} from '@prisma/client';
import { PrismaService } from '@app/database';
import { AuditService } from '../audit/audit.service';
import type { UserPayload } from '@app/common';
import { CreateMosqueDto } from './dto/create-mosque.dto';
import { UpdateMosqueDto } from './dto/update-mosque.dto';
import { NearbyMosquesQueryDto } from './dto/nearby-mosques.dto';
import { MosqueQueryDto } from './dto/mosque-query.dto';
import {
  MOSQUE_CONSTANTS,
  FRESHNESS_THRESHOLDS_DAYS,
} from './mosques.constants';

export interface DuplicateCandidate {
  mosqueId: string;
  name: string;
  distanceMeters: number;
}

export type FreshnessLevel = 'FRESH' | 'STALE' | 'VERY_STALE';

export interface FreshnessMetadata {
  level: FreshnessLevel;
  daysAgo: number;
  lastUpdated: Date | null;
}

@Injectable()
export class MosquesService {
  private readonly logger = new Logger(MosquesService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly audit: AuditService,
  ) {}

  /**
   * Derive information freshness from schedule or mosque updated timestamp
   */
  deriveFreshness(updatedAt: Date | null): FreshnessMetadata {
    if (!updatedAt) {
      return { level: 'VERY_STALE', daysAgo: 999, lastUpdated: null };
    }
    const diffMs = Date.now() - updatedAt.getTime();
    const daysAgo = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    let level: FreshnessLevel = 'FRESH';
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
   * Proximity check: finds mosques within threshold distance in meters using Haversine formula
   */
  async findDuplicateCandidates(
    lat: number,
    lng: number,
    thresholdMeters = MOSQUE_CONSTANTS.DUPLICATE_CHECK_RADIUS_METERS,
  ): Promise<DuplicateCandidate[]> {
    // Parameterized spatial distance query (spherical distance in meters)
    const rawResults = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; distance: number }>
    >`
      SELECT 
        id, 
        name,
        ROUND(
          (6371000 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(${lat})) * cos(radians(latitude)) * 
              cos(radians(longitude) - radians(${lng})) + 
              sin(radians(${lat})) * sin(radians(latitude))
            ))
          ))::numeric, 1
        )::double precision AS distance
      FROM "Mosque"
      WHERE "isDeleted" = false
        AND abs(latitude - ${lat}) < (${thresholdMeters} / 111000.0)
        AND abs(longitude - ${lng}) < (${thresholdMeters} / (111000.0 * cos(radians(${lat}))))
      ORDER BY distance ASC
      LIMIT 5
    `;

    return rawResults
      .filter((r) => r.distance <= thresholdMeters)
      .map((r) => ({
        mosqueId: r.id,
        name: r.name,
        distanceMeters: r.distance,
      }));
  }

  /**
   * Create a new mosque
   * - Validates coordinates
   * - Detects proximity duplicates (warns if ~50m)
   * - Creates unverified record
   * - Creates optional initial prayer schedule
   * - Records audit trail
   */
  async create(dto: CreateMosqueDto, actor?: UserPayload) {
    // 1. Proximity check for duplicates
    if (!dto.allowDuplicateWarningBypass) {
      const candidates = await this.findDuplicateCandidates(
        dto.latitude,
        dto.longitude,
      );

      if (candidates.length > 0) {
        throw new ConflictException({
          code: 'MOSQUE_POSSIBLE_DUPLICATE',
          message: 'A mosque already exists very close to this location.',
          candidates,
        });
      }
    }

    // 2. Persist in transaction
    const result = await this.prisma.$transaction(async (tx) => {
      const mosque = await tx.mosque.create({
        data: {
          name: dto.name.trim(),
          latitude: dto.latitude,
          longitude: dto.longitude,
          address: dto.address?.trim() || null,
          landmark: dto.landmark?.trim() || null,
          city: dto.city?.trim() || MOSQUE_CONSTANTS.DEFAULT_CITY,
          country: dto.country?.trim() || MOSQUE_CONSTANTS.DEFAULT_COUNTRY,
          operationalStatus: MosqueOperationalStatus.OPEN,
          verificationStatus: MosqueVerificationStatus.UNVERIFIED,
          createdById: actor?.userId || null,
        },
      });

      // If initial prayer times were supplied, initialize schedule
      const hasTimes =
        dto.fajrJamaat ||
        dto.zuhrJamaat ||
        dto.asrJamaat ||
        dto.maghribJamaat ||
        dto.ishaJamaat ||
        dto.jumuahJamaat;

      let schedule: any = null;
      if (hasTimes) {
        schedule = await tx.prayerSchedule.create({
          data: {
            mosqueId: mosque.id,
            fajrJamaat: dto.fajrJamaat || null,
            zuhrJamaat: dto.zuhrJamaat || null,
            asrJamaat: dto.asrJamaat || null,
            maghribJamaat: dto.maghribJamaat || null,
            ishaJamaat: dto.ishaJamaat || null,
            jumuahJamaat: dto.jumuahJamaat || null,
            timezone: MOSQUE_CONSTANTS.DEFAULT_TIMEZONE,
            updatedById: actor?.userId || null,
          },
        });

        // Record history snapshot
        await tx.prayerScheduleHistory.create({
          data: {
            mosqueId: mosque.id,
            scheduleSnapshot: schedule,
            changedById: actor?.userId || null,
            reason: 'Initial schedule on mosque creation',
          },
        });
      }

      await this.audit.record(
        {
          action: 'MOSQUE_CREATED',
          entityType: 'Mosque',
          entityId: mosque.id,
          actor: actor || {
            userId: 'anonymous',
            email: 'anonymous',
            role: 'user',
            permissions: [],
          },
          newValue: mosque,
          metadata: { bypassWarning: !!dto.allowDuplicateWarningBypass },
        },
        tx,
      );

      return { ...mosque, prayerSchedule: schedule };
    });

    this.logger.log(`Mosque created: ${result.id} (${result.name})`);
    return {
      ...result,
      freshness: this.deriveFreshness(
        result.prayerSchedule?.updatedAt || result.createdAt,
      ),
    };
  }

  /**
   * Find nearby mosques using spatial distance
   */
  async findNearby(query: NearbyMosquesQueryDto) {
    const { lat, lng } = query;
    const radiusMeters =
      query.radiusMeters || MOSQUE_CONSTANTS.DEFAULT_NEARBY_RADIUS_METERS;
    const limit = query.limit || MOSQUE_CONSTANTS.DEFAULT_LIMIT;

    // Bounding box approximation for spatial index scan before exact spherical calculation
    const latDelta = radiusMeters / 111000.0;
    const lngDelta =
      radiusMeters / (111000.0 * Math.cos((lat * Math.PI) / 180));

    const rawMosques = await this.prisma.$queryRaw<
      Array<{
        id: string;
        name: string;
        latitude: number;
        longitude: number;
        address: string | null;
        landmark: string | null;
        city: string | null;
        country: string;
        operationalStatus: MosqueOperationalStatus;
        verificationStatus: MosqueVerificationStatus;
        createdAt: Date;
        updatedAt: Date;
        distanceMeters: number;
      }>
    >`
      SELECT 
        m.id,
        m.name,
        m.latitude,
        m.longitude,
        m.address,
        m.landmark,
        m.city,
        m.country,
        m."operationalStatus",
        m."verificationStatus",
        m."createdAt",
        m."updatedAt",
        ROUND(
          (6371000 * acos(
            LEAST(1.0, GREATEST(-1.0, 
              cos(radians(${lat})) * cos(radians(m.latitude)) * 
              cos(radians(m.longitude) - radians(${lng})) + 
              sin(radians(${lat})) * sin(radians(m.latitude))
            ))
          ))::numeric, 1
        )::double precision AS "distanceMeters"
      FROM "Mosque" m
      WHERE m."isDeleted" = false
        AND m.latitude BETWEEN (${lat} - ${latDelta}) AND (${lat} + ${latDelta})
        AND m.longitude BETWEEN (${lng} - ${lngDelta}) AND (${lng} + ${lngDelta})
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit}
    `;

    // Filter within exact radius
    const filtered = rawMosques.filter((m) => m.distanceMeters <= radiusMeters);

    if (filtered.length === 0) {
      return [];
    }

    // Attach current prayer schedules
    const mosqueIds = filtered.map((m) => m.id);
    const schedules = await this.prisma.prayerSchedule.findMany({
      where: { mosqueId: { in: mosqueIds } },
    });
    const scheduleMap = new Map(schedules.map((s) => [s.mosqueId, s]));

    return filtered.map((mosque) => {
      const schedule = scheduleMap.get(mosque.id) || null;
      return {
        ...mosque,
        prayerSchedule: schedule,
        freshness: this.deriveFreshness(
          schedule?.updatedAt || mosque.updatedAt,
        ),
      };
    });
  }

  /**
   * Find single mosque profile by ID
   */
  async findById(id: string, currentUserId?: string) {
    const mosque = await this.prisma.mosque.findUnique({
      where: { id, isDeleted: false },
      include: {
        prayerSchedule: true,
      },
    });

    if (!mosque) {
      throw new NotFoundException(`Mosque with ID ${id} not found`);
    }

    // Compute attendance aggregates
    const [regularCount, occasionalCount, userAttendance] = await Promise.all([
      this.prisma.userMosqueAttendance.count({
        where: { mosqueId: id, status: 'REGULAR' },
      }),
      this.prisma.userMosqueAttendance.count({
        where: { mosqueId: id, status: 'OCCASIONAL' },
      }),
      currentUserId
        ? this.prisma.userMosqueAttendance.findUnique({
            where: { userId_mosqueId: { userId: currentUserId, mosqueId: id } },
            select: { status: true },
          })
        : null,
    ]);

    const freshness = this.deriveFreshness(
      mosque.prayerSchedule?.updatedAt || mosque.updatedAt,
    );

    return {
      ...mosque,
      attendanceSummary: {
        regularCount,
        occasionalCount,
        userStatus: userAttendance?.status || 'NONE',
      },
      freshness,
    };
  }

  /**
   * Query mosques with pagination and filters
   */
  async findAll(query: MosqueQueryDto) {
    const page = query.page || 1;
    const limit = query.limit || MOSQUE_CONSTANTS.DEFAULT_LIMIT;
    const skip = (page - 1) * limit;

    const where: Prisma.MosqueWhereInput = {
      isDeleted: false,
    };

    if (query.search) {
      where.OR = [
        { name: { contains: query.search.trim(), mode: 'insensitive' } },
        { address: { contains: query.search.trim(), mode: 'insensitive' } },
        { landmark: { contains: query.search.trim(), mode: 'insensitive' } },
      ];
    }

    if (query.operationalStatus) {
      where.operationalStatus = query.operationalStatus;
    }

    if (query.verificationStatus) {
      where.verificationStatus = query.verificationStatus;
    }

    if (query.city) {
      where.city = { equals: query.city.trim(), mode: 'insensitive' };
    }

    const [items, total] = await Promise.all([
      this.prisma.mosque.findMany({
        where,
        skip,
        take: limit,
        orderBy: { name: 'asc' },
        include: {
          prayerSchedule: true,
        },
      }),
      this.prisma.mosque.count({ where }),
    ]);

    return {
      items: items.map((m) => ({
        ...m,
        freshness: this.deriveFreshness(
          m.prayerSchedule?.updatedAt || m.updatedAt,
        ),
      })),
      meta: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    };
  }

  /**
   * Update mosque metadata (name, address, operational status)
   */
  async update(id: string, dto: UpdateMosqueDto, actor: UserPayload) {
    const previous = await this.prisma.mosque.findUnique({
      where: { id, isDeleted: false },
    });

    if (!previous) {
      throw new NotFoundException(`Mosque with ID ${id} not found`);
    }

    const updated = await this.prisma.$transaction(async (tx) => {
      const data: Prisma.MosqueUpdateInput = {};
      if (dto.name) data.name = dto.name.trim();
      if (dto.address !== undefined) data.address = dto.address?.trim() || null;
      if (dto.landmark !== undefined)
        data.landmark = dto.landmark?.trim() || null;
      if (dto.city) data.city = dto.city.trim();
      if (dto.operationalStatus) data.operationalStatus = dto.operationalStatus;

      const saved = await tx.mosque.update({
        where: { id },
        data,
      });

      await this.audit.record(
        {
          action: 'MOSQUE_UPDATED',
          entityType: 'Mosque',
          entityId: id,
          actor,
          previousValue: previous,
          newValue: saved,
        },
        tx,
      );

      return saved;
    });

    return updated;
  }
}
