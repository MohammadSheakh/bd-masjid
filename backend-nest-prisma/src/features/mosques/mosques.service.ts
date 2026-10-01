import {
  Injectable,
  NotFoundException,
  ConflictException,
  BadRequestException,
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

export interface ReverseGeocodeResult {
  displayName: string;
  placeName: string;
  road: string;
  suburb: string;
  city: string;
  state: string;
  postcode: string;
  country: string;
  formattedAddress: string;
}

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
    // PostGIS spherical geography distance query (ST_DWithin and ST_Distance on EPSG:4326)
    const rawResults = await this.prisma.$queryRaw<
      Array<{ id: string; name: string; distance: number }>
    >`
      SELECT 
        id, 
        name,
        ROUND(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          )::numeric, 1
        )::double precision AS distance
      FROM "Mosque"
      WHERE "isDeleted" = false
        AND ST_DWithin(
          ST_SetSRID(ST_MakePoint(longitude, latitude), 4326)::geography,
          ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
          ${thresholdMeters}
        )
      ORDER BY distance ASC
      LIMIT 5
    `;

    return rawResults.map((r) => ({
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
          hasWuduArea: dto.hasWuduArea ?? true,
          hasSeparateWomenSpace: dto.hasSeparateWomenSpace ?? false,
          hasAirConditioning: dto.hasAirConditioning ?? false,
          hasParking: dto.hasParking ?? false,
          hasWheelchairAccess: dto.hasWheelchairAccess ?? false,
          hasJanazaFacility: dto.hasJanazaFacility ?? false,
          capacity: dto.capacity || null,
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

    const conditions: Prisma.Sql[] = [
      Prisma.sql`m."isDeleted" = false`,
      Prisma.sql`ST_DWithin(
        ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
        ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography,
        ${radiusMeters}
      )`,
    ];

    if (query.hasFemalePrayerSpace) {
      conditions.push(
        Prisma.sql`(f."hasFemalePrayerSpace" = true OR (f.id IS NULL AND m."hasSeparateWomenSpace" = true))`,
      );
    }
    if (query.hasWheelchairAccess) {
      conditions.push(
        Prisma.sql`(f."hasWheelchairAccess" = true OR (f.id IS NULL AND m."hasWheelchairAccess" = true))`,
      );
    }
    if (query.hasAirConditioning) {
      conditions.push(
        Prisma.sql`(f."hasAirConditioning" = true OR (f.id IS NULL AND m."hasAirConditioning" = true))`,
      );
    }
    if (query.hasJanazaService) {
      conditions.push(
        Prisma.sql`(f."hasJanazaService" = true OR (f.id IS NULL AND m."hasJanazaFacility" = true))`,
      );
    }
    if (query.minCapacity && query.minCapacity > 0) {
      conditions.push(
        Prisma.sql`(COALESCE(f."totalCapacity", m.capacity, 0) >= ${query.minCapacity})`,
      );
    }

    const whereClause = Prisma.sql`WHERE ${Prisma.join(conditions, ' AND ')}`;

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
        hasWuduArea: boolean;
        hasSeparateWomenSpace: boolean;
        hasAirConditioning: boolean;
        hasParking: boolean;
        hasWheelchairAccess: boolean;
        hasJanazaFacility: boolean;
        capacity: number | null;
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
        m."hasWuduArea",
        m."hasSeparateWomenSpace",
        m."hasAirConditioning",
        m."hasParking",
        m."hasWheelchairAccess",
        m."hasJanazaFacility",
        m.capacity,
        m."createdAt",
        m."updatedAt",
        ROUND(
          ST_Distance(
            ST_SetSRID(ST_MakePoint(m.longitude, m.latitude), 4326)::geography,
            ST_SetSRID(ST_MakePoint(${lng}, ${lat}), 4326)::geography
          )::numeric, 1
        )::double precision AS "distanceMeters"
      FROM "Mosque" m
      LEFT JOIN "MosqueFacility" f ON f."mosqueId" = m.id
      ${whereClause}
      ORDER BY "distanceMeters" ASC
      LIMIT ${limit}
    `;

    if (rawMosques.length === 0) {
      return [];
    }

    // Attach current prayer schedules and facilities
    const mosqueIds = rawMosques.map((m) => m.id);
    const [schedules, facilities] = await Promise.all([
      this.prisma.prayerSchedule.findMany({
        where: { mosqueId: { in: mosqueIds } },
      }),
      this.prisma.mosqueFacility.findMany({
        where: { mosqueId: { in: mosqueIds } },
      }),
    ]);
    const scheduleMap = new Map(schedules.map((s) => [s.mosqueId, s]));
    const facilityMap = new Map(facilities.map((f) => [f.mosqueId, f]));

    return rawMosques.map((mosque) => {
      const schedule = scheduleMap.get(mosque.id) || null;
      const facility = facilityMap.get(mosque.id) || null;
      return {
        ...mosque,
        facility,
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
        facility: true,
        prayerSchedule: true,
        staffMembers: {
          where: { isVerified: true },
          select: {
            id: true,
            role: true,
            name: true,
            contactNumber: true,
            isVerified: true,
          },
        },
        announcements: {
          orderBy: [{ isPinned: 'desc' }, { createdAt: 'desc' }],
          take: 10,
          select: {
            id: true,
            title: true,
            content: true,
            isPinned: true,
            createdAt: true,
          },
        },
        donationMethods: {
          where: { isVerified: true },
          select: {
            id: true,
            methodType: true,
            accountType: true,
            accountNumber: true,
            accountTitle: true,
            bankName: true,
            branchName: true,
            routingNumber: true,
            instructions: true,
            isVerified: true,
          },
        },
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

    if (query.hasSeparateWomenSpace !== undefined) {
      where.hasSeparateWomenSpace = query.hasSeparateWomenSpace;
    }

    if (query.hasAirConditioning !== undefined) {
      where.hasAirConditioning = query.hasAirConditioning;
    }

    if (query.hasParking !== undefined) {
      where.hasParking = query.hasParking;
    }

    if (query.hasWheelchairAccess !== undefined) {
      where.hasWheelchairAccess = query.hasWheelchairAccess;
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

  private geocodeCache = new Map<
    string,
    { data: ReverseGeocodeResult; expiresAt: number }
  >();

  /**
   * Reverse geocode coordinates to place name, road, suburb, and city
   * using OpenStreetMap Nominatim with memory caching and timeout fallback.
   */
  async reverseGeocode(
    latitude: number,
    longitude: number,
  ): Promise<ReverseGeocodeResult> {
    if (
      latitude < -90 ||
      latitude > 90 ||
      longitude < -180 ||
      longitude > 180
    ) {
      throw new BadRequestException(
        'Latitude must be between -90 and 90, and longitude between -180 and 180',
      );
    }

    // Cache key rounded to ~4 decimal places (~11m resolution)
    const cacheKey = `${latitude.toFixed(4)},${longitude.toFixed(4)}`;
    const cached = this.geocodeCache.get(cacheKey);
    if (cached && cached.expiresAt > Date.now()) {
      return cached.data;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 4000);

    try {
      const url = `https://nominatim.openstreetmap.org/reverse?format=jsonv2&lat=${latitude}&lon=${longitude}&accept-language=en,bn`;
      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'BD-Masjid-Platform/1.0 (contact: info@bd-masjid.org)',
          Accept: 'application/json',
        },
        signal: controller.signal,
      });

      if (response.ok) {
        const raw = (await response.json()) as any;
        const address = raw.address || {};
        const road =
          address.road ||
          address.pedestrian ||
          address.highway ||
          address.path ||
          '';
        const suburb =
          address.suburb ||
          address.neighbourhood ||
          address.quarter ||
          address.residential ||
          '';
        const city =
          address.city ||
          address.town ||
          address.village ||
          address.state_district ||
          address.county ||
          'Dhaka';
        const state = address.state || address.region || '';
        const postcode = address.postcode || '';
        const country = address.country || 'Bangladesh';
        const placeName =
          raw.name || address.amenity || address.building || '';

        const addressParts = [road, suburb, city].filter(Boolean);
        const formattedAddress =
          addressParts.length > 0
            ? addressParts.join(', ')
            : raw.display_name || '';

        const result: ReverseGeocodeResult = {
          displayName: raw.display_name || formattedAddress,
          placeName,
          road,
          suburb,
          city,
          state,
          postcode,
          country,
          formattedAddress,
        };

        if (this.geocodeCache.size > 1000) {
          this.geocodeCache.clear();
        }
        this.geocodeCache.set(cacheKey, {
          data: result,
          expiresAt: Date.now() + 30 * 60 * 1000,
        });
        return result;
      }
    } catch (err: any) {
      this.logger.warn(
        `Reverse geocode failed for ${latitude},${longitude}: ${err.message}`,
      );
    } finally {
      clearTimeout(timeoutId);
    }

    return {
      displayName: `Location (${latitude.toFixed(5)}, ${longitude.toFixed(5)})`,
      placeName: '',
      road: '',
      suburb: '',
      city: 'Dhaka',
      state: '',
      postcode: '',
      country: 'Bangladesh',
      formattedAddress: '',
    };
  }
}
