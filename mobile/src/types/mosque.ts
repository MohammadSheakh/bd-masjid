export type MosqueOperationalStatus =
  | 'OPEN'
  | 'TEMPORARILY_CLOSED'
  | 'PERMANENTLY_CLOSED'
  | 'UNDER_CONSTRUCTION'
  | 'UNKNOWN';

export type MosqueVerificationStatus =
  | 'UNVERIFIED'
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED';

export type FreshnessLevel = 'FRESH' | 'STALE' | 'VERY_STALE';

export interface FreshnessMetadata {
  level: FreshnessLevel;
  daysAgo: number;
  lastUpdated: string | null;
}

export interface PrayerSchedule {
  id?: string;
  mosqueId?: string;
  fajrStart?: string | null;
  fajrJamaat?: string | null;
  sunrise?: string | null;
  zuhrStart?: string | null;
  zuhrJamaat?: string | null;
  asrStart?: string | null;
  asrJamaat?: string | null;
  maghribStart?: string | null;
  maghribJamaat?: string | null;
  ishaStart?: string | null;
  ishaJamaat?: string | null;
  jumuahJamaat?: string | null;
  jumuahSecondJamaat?: string | null;
  taraweehJamaat?: string | null;
  sahriEnd?: string | null;
  iftarStart?: string | null;
  timezone?: string;
  updatedAt?: string;
}

export type AttendanceStatus = 'REGULAR' | 'OCCASIONAL' | 'NONE';

export interface AttendanceSummary {
  regularCount: number;
  occasionalCount: number;
  totalCount?: number;
  userStatus: AttendanceStatus;
}

export interface MosqueStaffMember {
  id: string;
  mosqueId?: string;
  userId?: string | null;
  role: string;
  customRoleTitle?: string | null;
  name: string;
  contactNumber?: string | null;
  startDate?: string | null;
  imageUrl?: string | null;
  isVerified: boolean;
  verifiedAt?: string | null;
}

export interface MosqueFacility {
  id?: string;
  mosqueId?: string;
  totalCapacity?: number | null;
  toiletCount?: number | null;
  hasSeparateWudu?: boolean | null;
  wuduCapacity?: number | null;
  hasFemalePrayerSpace?: boolean | null;
  femaleCapacity?: number | null;
  hasWheelchairAccess?: boolean | null;
  hasRamp?: boolean | null;
  hasAirConditioning?: boolean | null;
  hasFan?: boolean | null;
  hasJanazaService?: boolean | null;
  hasParkingCar?: boolean | null;
  hasParkingBike?: boolean | null;
  hasLibraryMaktab?: boolean | null;
  customAmenities?: string[] | null;
  createdAt?: string;
  updatedAt?: string;
}

export type DonationMethodType =
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'UPAY'
  | 'BANK_TRANSFER';

export type DonationAccountType = 'MERCHANT' | 'PERSONAL' | 'BANK_ACCOUNT';

export interface MosqueDonationMethod {
  id: string;
  mosqueId?: string;
  methodType: DonationMethodType;
  accountType: DonationAccountType;
  accountNumber: string;
  accountTitle?: string | null;
  bankName?: string | null;
  instructions?: string | null;
  isVerified: boolean;
  verifiedByRoles?: string[];
}

export interface Mosque {
  id: string;
  name: string;
  latitude: number;
  longitude: number;
  address?: string | null;
  landmark?: string | null;
  city?: string | null;
  country?: string;
  operationalStatus: MosqueOperationalStatus;
  verificationStatus?: MosqueVerificationStatus;
  isListed?: boolean;
  unlistedReason?: string | null;
  unlistedAt?: string | null;
  unlistedById?: string | null;
  distanceMeters?: number;
  facility?: MosqueFacility | null;
  prayerSchedule?: PrayerSchedule | null;
  freshness?: FreshnessMetadata;
  attendanceSummary?: AttendanceSummary;
  hasWuduArea?: boolean;
  hasSeparateWomenSpace?: boolean;
  hasAirConditioning?: boolean;
  hasParking?: boolean;
  hasWheelchairAccess?: boolean;
  hasJanazaFacility?: boolean;
  capacity?: number | null;
  staffMembers?: MosqueStaffMember[];
  donationMethods?: MosqueDonationMethod[];
  announcements?: MosqueAnnouncement[];
  isBookmarked?: boolean;
  createdAt?: string;
  updatedAt?: string;
}

export type MosqueAnnouncementCategory =
  | 'JANAZAH'
  | 'EID_PRAYER'
  | 'RAMADAN'
  | 'FRIDAY_KHUTBAH'
  | 'GENERAL_NOTICE';

export type MosqueAnnouncementPriority = 'URGENT' | 'NORMAL';

export interface MosqueAnnouncement {
  id: string;
  mosqueId: string;
  category: MosqueAnnouncementCategory;
  priority: MosqueAnnouncementPriority;
  title: string;
  body: string;
  authorName?: string;
  eventDate?: string | null;
  eventTime?: string | null;
  expiresAt?: string | null;
  createdAt: string;
}

export type PrayerName = 'fajr' | 'zuhr' | 'asr' | 'maghrib' | 'isha';

export interface PrayerAutoSilentSettings {
  isEnabled: boolean;
  durationMinutes: number; // 5, 10, 15, 20 (default: 10)
  leadOffsetMinutes: number; // 0, 1, 2 mins prior
  enabledPrayers: {
    fajr: boolean;
    zuhr: boolean;
    asr: boolean;
    maghrib: boolean;
    isha: boolean;
    jumuah: boolean;
  };
  hasDndPermission: boolean;
  activeSilenceExpiry: string | null; // ISO timestamp if active right now
}
