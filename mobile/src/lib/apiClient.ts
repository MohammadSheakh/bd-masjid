/**
 * Enterprise API Client conforming to ADR-003, ADR-007, and ADR-033
 * - Smart localhost resolution (Android 10.0.2.2 vs iOS localhost:4000)
 * - Automatic Bearer JWT authentication header injection
 * - Resilient offline fallback to structured Bangladeshi fixtures
 */
import { Platform } from 'react-native';
import { AttendanceStatus, AttendanceSummary, AttendedMosqueItem, Mosque, MosqueAnnouncement, MosqueReportPayload, MosqueStaffMember, PaginatedNotifications, PrayerSchedule, UserNotification } from '../types/mosque';
import { AuthResponse, LoginPayload, RegisterPayload, UserProfile } from '../types/auth';
import { RegisterDevicePayload, UserDevice } from '../types/device';
import { BANGLADESH_MOSQUES_FIXTURES } from '../data/mosqueFixtures';
import { BANGLADESH_NOTIFICATION_FIXTURES } from '../data/notificationFixtures';
import { PreferencesStorage, SecureTokenStorage } from './storage';
import { FacilityService, SuggestedFacilitiesPayload } from '../services/facilityService';
import { OfflineOutboxService } from '../services/offlineOutboxService';
import { OutboxMutationType } from '../types/outbox';
import { ModerationAction, ModerationQueueItem, ResolveModerationPayload } from '../types/moderation';
import { ContributorActivityItem, ContributorReputationSummary } from '../types/contributor';
import { CreateRoleClaimPayload, RoleClaimResponse } from '../types/community';
import {
  AnnouncementsFeedResponse,
  CreateAnnouncementPayload,
  FeedAnnouncementsParams,
  MosqueAnnouncement as DomainAnnouncement,
} from '../types/announcement';
import { CreateDonationPayload, DonationSubmissionResponse } from '../types/donation';
import { PrayerScheduleHistoryResponse } from '../types/prayerScheduleAudit';

export function getApiBaseUrl(): string {
  if (process.env.EXPO_PUBLIC_API_URL) {
    return process.env.EXPO_PUBLIC_API_URL;
  }
  // Android emulator routes host machine loopback to 10.0.2.2
  if (Platform.OS === 'android') {
    return 'http://10.0.2.2:4000/api/v1';
  }
  return 'http://localhost:4000/api/v1';
}

let isCurrentlyOffline = false;
const offlineListeners = new Set<(isOffline: boolean) => void>();

function notifyOfflineStatus(isOffline: boolean) {
  if (isCurrentlyOffline !== isOffline) {
    isCurrentlyOffline = isOffline;
    offlineListeners.forEach((fn) => {
      try {
        fn(isOffline);
      } catch {}
    });
  }
}

async function fetchWithFallback<T>(
  endpoint: string,
  options: RequestInit = {},
  fallbackData: T
): Promise<T> {
  const url = `${getApiBaseUrl()}${endpoint}`;
  try {
    const token = await SecureTokenStorage.getAccessToken();
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
      Accept: 'application/json',
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
      ...((options.headers as Record<string, string>) || {}),
    };

    const res = await fetch(url, { ...options, headers });
    if (!res.ok) {
      throw new Error(`API error ${res.status}: ${res.statusText}`);
    }
    const data = await res.json();
    notifyOfflineStatus(false);
    return (data.data ?? data) as T;
  } catch (error) {
    // Graceful offline fallback: flag offline status and return fixture
    notifyOfflineStatus(true);

    // If this was a mutation (POST/PUT/DELETE/PATCH), queue in offline outbox for automatic sync
    if (options.method && options.method !== 'GET') {
      let mutationType: OutboxMutationType = 'REPORT_ISSUE';
      if (endpoint.includes('/attendance')) mutationType = 'ATTENDANCE';
      else if (endpoint.includes('/prayer-schedule')) mutationType = 'TIMETABLE_UPDATE';
      else if (endpoint === '/mosques') mutationType = 'CREATE_MOSQUE';
      else if (endpoint.includes('/suggestions')) mutationType = 'SUGGEST_FACILITY';

      try {
        const payload = options.body ? JSON.parse(options.body as string) : null;
        OfflineOutboxService.enqueueMutation(
          mutationType,
          endpoint,
          options.method as any,
          payload
        ).catch(() => {});
      } catch {}
    }

    return fallbackData;
  }
}

export const ApiClient = {
  async getNearbyMosques(lat: number, lng: number, radiusMeters: number = 10000): Promise<Mosque[]> {
    return fetchWithFallback<Mosque[]>(
      `/mosques/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`,
      { method: 'GET' },
      BANGLADESH_MOSQUES_FIXTURES
    );
  },

  async searchMosques(query: string = '', city?: string): Promise<Mosque[]> {
    const params = new URLSearchParams();
    if (query) params.append('q', query);
    if (city) params.append('city', city);

    const fallback = BANGLADESH_MOSQUES_FIXTURES.filter((m) => {
      const matchQ = !query || m.name.toLowerCase().includes(query.toLowerCase());
      const matchC = !city || m.city?.toLowerCase() === city.toLowerCase();
      return matchQ && matchC;
    });

    return fetchWithFallback<Mosque[]>(
      `/mosques/search?${params.toString()}`,
      { method: 'GET' },
      fallback
    );
  },

  async getMosqueById(id: string): Promise<Mosque | null> {
    const fallback = BANGLADESH_MOSQUES_FIXTURES.find((m) => m.id === id) ?? null;
    return fetchWithFallback<Mosque | null>(
      `/mosques/${id}`,
      { method: 'GET' },
      fallback
    );
  },

  async toggleFollowMosque(id: string): Promise<{ success: boolean; isFollowed: boolean }> {
    return fetchWithFallback<{ success: boolean; isFollowed: boolean }>(
      `/mosques/${id}/follow`,
      { method: 'POST' },
      { success: true, isFollowed: true }
    );
  },

  async setAttendance(
    mosqueId: string,
    status: AttendanceStatus
  ): Promise<AttendanceSummary> {
    // Synchronously update local preferences for instant UI hydration
    PreferencesStorage.setUserAttendance(mosqueId, status);

    const isDelete = status === 'NONE';
    const endpoint = `/mosques/${mosqueId}/attendance`;
    const options: RequestInit = isDelete
      ? { method: 'DELETE' }
      : { method: 'PUT', body: JSON.stringify({ status }) };

    const fallback: AttendanceSummary = {
      regularCount: status === 'REGULAR' ? 42 : 41,
      occasionalCount: status === 'OCCASIONAL' ? 19 : 18,
      userStatus: status,
    };

    return fetchWithFallback<AttendanceSummary>(endpoint, options, fallback);
  },

  async getAttendanceSummary(mosqueId: string): Promise<AttendanceSummary> {
    const userStatus = PreferencesStorage.getUserAttendance(mosqueId);
    const fallback: AttendanceSummary = {
      regularCount: userStatus === 'REGULAR' ? 42 : 41,
      occasionalCount: userStatus === 'OCCASIONAL' ? 19 : 18,
      userStatus,
    };
    return fetchWithFallback<AttendanceSummary>(
      `/mosques/${mosqueId}/attendance-summary`,
      { method: 'GET' },
      fallback
    );
  },

  async getMyAttendedMosques(): Promise<AttendedMosqueItem[]> {
    const fallbackItems: AttendedMosqueItem[] = BANGLADESH_MOSQUES_FIXTURES
      .filter((m) => PreferencesStorage.getUserAttendance(m.id) !== 'NONE')
      .map((m) => ({
        mosqueId: m.id,
        mosqueName: m.name,
        city: m.city || 'Dhaka',
        status: PreferencesStorage.getUserAttendance(m.id),
        updatedAt: new Date().toISOString(),
      }));

    return fetchWithFallback<AttendedMosqueItem[]>(
      '/attendance/my-mosques',
      { method: 'GET' },
      fallbackItems
    );
  },

  async updatePrayerSchedule(
    mosqueId: string,
    schedule: Partial<PrayerSchedule>,
    note?: string
  ): Promise<{ success: boolean; schedule?: PrayerSchedule }> {
    return fetchWithFallback<{ success: boolean; schedule?: PrayerSchedule }>(
      `/mosques/${mosqueId}/prayer-schedule`,
      {
        method: 'PUT',
        body: JSON.stringify({ ...schedule, reason: note }),
      },
      { success: true }
    );
  },

  async submitSuggestion(
    mosqueId: string,
    payload: {
      type: string;
      details: string;
      urgency?: string;
      targetRoles?: string[];
      submitterName?: string;
      submitterPhone?: string;
    }
  ): Promise<{ success: boolean }> {
    return fetchWithFallback<{ success: boolean }>(
      `/mosques/${mosqueId}/suggestions`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { success: true }
    );
  },

  getIsOffline(): boolean {
    return isCurrentlyOffline;
  },

  onOfflineStatusChange(listener: (isOffline: boolean) => void): () => void {
    offlineListeners.add(listener);
    return () => {
      offlineListeners.delete(listener);
    };
  },

  async createMosque(
    payload: Partial<Mosque>
  ): Promise<{ success: boolean; mosque: Mosque }> {
    const fallbackMosque: Mosque = {
      id: `mosque-${Date.now()}`,
      name: payload.name || 'New Community Mosque',
      latitude: payload.latitude || 23.8103,
      longitude: payload.longitude || 90.4125,
      address: payload.address || '',
      city: payload.city || 'Dhaka',
      country: 'Bangladesh',
      operationalStatus: 'OPEN',
      verificationStatus: 'PENDING_VERIFICATION',
      prayerSchedule: payload.prayerSchedule,
      hasAirConditioning: payload.hasAirConditioning,
      hasSeparateWomenSpace: payload.hasSeparateWomenSpace,
      hasParking: payload.hasParking,
      hasWheelchairAccess: payload.hasWheelchairAccess,
    };

    return fetchWithFallback<{ success: boolean; mosque: Mosque }>(
      '/mosques',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      { success: true, mosque: fallbackMosque }
    );
  },

  async getMosqueAnnouncements(
    mosqueId: string
  ): Promise<MosqueAnnouncement[]> {
    const fixture = BANGLADESH_MOSQUES_FIXTURES.find((m) => m.id === mosqueId);
    const fallbackAnnouncements = fixture?.announcements || [];

    return fetchWithFallback<MosqueAnnouncement[]>(
      `/mosques/${mosqueId}/announcements`,
      { method: 'GET' },
      fallbackAnnouncements
    );
  },

  async getAnnouncementsFeed(
    params: FeedAnnouncementsParams = {}
  ): Promise<AnnouncementsFeedResponse> {
    const query = new URLSearchParams();
    if (params.lat !== undefined) query.append('lat', params.lat.toString());
    if (params.lng !== undefined) query.append('lng', params.lng.toString());
    if (params.radiusKm !== undefined) query.append('radiusKm', params.radiusKm.toString());
    if (params.category) query.append('category', params.category);
    if (params.emergencyOnly) query.append('emergencyOnly', 'true');
    if (params.bookmarkedOnly) query.append('bookmarkedOnly', 'true');
    if (params.limit !== undefined) query.append('limit', params.limit.toString());
    if (params.offset !== undefined) query.append('offset', params.offset.toString());

    const queryString = query.toString() ? `?${query.toString()}` : '';

    const fallbackData: DomainAnnouncement[] = BANGLADESH_MOSQUES_FIXTURES.flatMap((m) =>
      (m.announcements || []).map((a) => ({
        id: a.id,
        mosqueId: m.id,
        mosqueName: m.name,
        city: m.city || 'Dhaka',
        title: a.title,
        content: a.body || '',
        category: (a.category as any) || 'GENERAL',
        isPinned: a.priority === 'URGENT',
        createdAt: a.createdAt,
      }))
    );

    return fetchWithFallback<AnnouncementsFeedResponse>(
      `/announcements/feed${queryString}`,
      { method: 'GET' },
      {
        success: true,
        data: fallbackData,
        total: fallbackData.length,
        limit: params.limit || 20,
        offset: params.offset || 0,
      }
    );
  },

  async createAnnouncement(
    mosqueId: string,
    payload: CreateAnnouncementPayload
  ): Promise<{ success: boolean; message: string; data?: any }> {
    return fetchWithFallback<{ success: boolean; message: string; data?: any }>(
      `/mosques/${mosqueId}/announcements`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      {
        success: true,
        message: 'Announcement posted successfully.',
      }
    );
  },

  async submitMosqueReport(
    mosqueId: string,
    payload: MosqueReportPayload
  ): Promise<{ success: boolean; message: string }> {
    return fetchWithFallback<{ success: boolean; message: string }>(
      `/mosques/${mosqueId}/reports`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      {
        success: true,
        message: 'Thank you! Your report has been submitted to community moderators for inspection.',
      }
    );
  },

  async fetchMosqueStaff(
    mosqueId: string
  ): Promise<MosqueStaffMember[]> {
    const fixture = BANGLADESH_MOSQUES_FIXTURES.find((m) => m.id === mosqueId);
    const fallbackStaff = fixture?.staffMembers || [];

    return fetchWithFallback<MosqueStaffMember[]>(
      `/mosques/${mosqueId}/staff`,
      { method: 'GET' },
      fallbackStaff
    );
  },

  async submitFacilitySuggestion(
    mosqueId: string,
    payload: SuggestedFacilitiesPayload
  ): Promise<{ success: boolean; message: string }> {
    const sanitizedCustom = payload.customAmenities
      ? FacilityService.sanitizeCustomAmenities(payload.customAmenities)
      : [];

    return fetchWithFallback<{ success: boolean; message: string }>(
      `/mosques/${mosqueId}/suggestions`,
      {
        method: 'POST',
        body: JSON.stringify({
          type: 'SUGGESTION',
          suggestedFacilities: {
            ...payload,
            customAmenities: sanitizedCustom,
          },
          comment: payload.comment || 'Facility details suggestion submitted via mobile app',
        }),
      },
      {
        success: true,
        message: 'Facility details submitted! Community moderators will review your contribution.',
      }
    );
  },

  async fetchUserNotifications(
    page: number = 1,
    limit: number = 20
  ): Promise<PaginatedNotifications> {
    const unreadCount = BANGLADESH_NOTIFICATION_FIXTURES.filter((n) => !n.isRead).length;
    const fallback: PaginatedNotifications = {
      items: BANGLADESH_NOTIFICATION_FIXTURES,
      total: BANGLADESH_NOTIFICATION_FIXTURES.length,
      page,
      limit,
      totalPages: Math.ceil(BANGLADESH_NOTIFICATION_FIXTURES.length / limit),
      unreadCount,
    };

    return fetchWithFallback<PaginatedNotifications>(
      `/notifications?page=${page}&limit=${limit}`,
      { method: 'GET' },
      fallback
    );
  },

  async fetchUnreadNotificationCount(): Promise<number> {
    const fallbackCount = BANGLADESH_NOTIFICATION_FIXTURES.filter((n) => !n.isRead).length;
    const res = await fetchWithFallback<{ unreadCount: number }>(
      '/notifications/unread-count',
      { method: 'GET' },
      { unreadCount: fallbackCount }
    );
    return res.unreadCount;
  },

  async markNotificationAsRead(id: string): Promise<UserNotification> {
    const item = BANGLADESH_NOTIFICATION_FIXTURES.find((n) => n.id === id);
    const fallback: UserNotification = item
      ? { ...item, isRead: true, readAt: new Date().toISOString() }
      : {
          id,
          mosqueId: '',
          type: 'ANNOUNCEMENT',
          title: '',
          body: '',
          isRead: true,
          readAt: new Date().toISOString(),
          createdAt: new Date().toISOString(),
        };

    return fetchWithFallback<UserNotification>(
      `/notifications/${id}/read`,
      { method: 'PATCH' },
      fallback
    );
  },

  async markAllNotificationsAsRead(): Promise<{ success: boolean; count: number }> {
    return fetchWithFallback<{ success: boolean; count: number }>(
      '/notifications/read-all',
      { method: 'PATCH' },
      { success: true, count: BANGLADESH_NOTIFICATION_FIXTURES.length }
    );
  },

  async loginUser(payload: LoginPayload): Promise<AuthResponse> {
    const fallbackUser: UserProfile = {
      id: 'user-bangladesh-demo',
      name: payload.email.split('@')[0],
      email: payload.email,
      role: 'CONTRIBUTOR',
      phoneNumber: '01711223344',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };
    const fallbackResponse: AuthResponse = {
      user: fallbackUser,
      accessToken: 'demo_access_token_jwt_preview',
      refreshToken: 'demo_refresh_token_jwt_preview',
    };

    const res = await fetchWithFallback<AuthResponse>(
      '/auth/login',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackResponse
    );

    if (res.accessToken) {
      await SecureTokenStorage.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  async registerUser(payload: RegisterPayload): Promise<AuthResponse> {
    const fallbackUser: UserProfile = {
      id: 'user-bangladesh-demo',
      name: payload.name,
      email: payload.email,
      role: 'CONTRIBUTOR',
      phoneNumber: payload.phoneNumber || null,
      isEmailVerified: false,
      createdAt: new Date().toISOString(),
    };
    const fallbackResponse: AuthResponse = {
      user: fallbackUser,
      accessToken: 'demo_access_token_jwt_preview',
      refreshToken: 'demo_refresh_token_jwt_preview',
    };

    const res = await fetchWithFallback<AuthResponse>(
      '/auth/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackResponse
    );

    if (res.accessToken) {
      await SecureTokenStorage.setTokens(res.accessToken, res.refreshToken);
    }
    return res;
  },

  async fetchCurrentUserSession(): Promise<UserProfile | null> {
    const token = await SecureTokenStorage.getAccessToken();
    if (!token) return null;

    const fallbackUser: UserProfile = {
      id: 'user-bangladesh-demo',
      name: 'Mohammad Musalli',
      email: 'musalli@bdmasjid.org',
      role: 'CONTRIBUTOR',
      phoneNumber: '01711223344',
      isEmailVerified: true,
      createdAt: new Date().toISOString(),
    };

    return fetchWithFallback<UserProfile | null>(
      '/auth/session',
      { method: 'GET' },
      fallbackUser
    );
  },

  async logoutUser(): Promise<void> {
    try {
      await fetchWithFallback(
        '/auth/logout',
        { method: 'POST' },
        { success: true }
      );
    } finally {
      await SecureTokenStorage.clearTokens();
    }
  },

  async registerUserDevice(payload: RegisterDevicePayload): Promise<UserDevice> {
    const fallbackDevice: UserDevice = {
      id: 'device-bd-masjid-local',
      fcmToken: payload.fcmToken,
      deviceType: payload.deviceType,
      deviceName: payload.deviceName || 'Android Mobile Device',
      deviceOsVersion: payload.deviceOsVersion || 'Android 14',
      appVersion: payload.appVersion || '1.0.0',
      isPushEnabled: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return fetchWithFallback<UserDevice>(
      '/users/devices/register',
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackDevice
    );
  },

  async fetchUserDevices(): Promise<UserDevice[]> {
    const fallbackDevice: UserDevice = {
      id: 'device-bd-masjid-local',
      fcmToken: 'fcm-token-preview-cached',
      deviceType: Platform.OS === 'ios' ? 'ios' : 'android',
      deviceName: Platform.OS === 'ios' ? 'Apple iPhone' : 'Android Mobile Device',
      isPushEnabled: true,
      lastActiveAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
    };

    return fetchWithFallback<UserDevice[]>(
      '/users/devices',
      { method: 'GET' },
      [fallbackDevice]
    );
  },

  async fetchModerationQueue(): Promise<ModerationQueueItem[]> {
    const fallbackQueue: ModerationQueueItem[] = [
      {
        id: 'mod-uttara-baitun-noor',
        type: 'MOSQUE_VERIFICATION',
        targetId: 'mosque-pending-1',
        targetName: 'Baitun Noor Jame Masjid',
        location: 'Sector 11, Uttara, Dhaka',
        coordinates: { lat: 23.8732, lng: 90.3951 },
        details: 'Newly constructed 3-story neighborhood mosque, 5 times jamaat with AC and female prayer section.',
        contributorName: 'Tariqul Islam (Scout)',
        contributorRole: 'CONTRIBUTOR',
        createdAt: new Date(Date.now() - 3600000 * 2).toISOString(),
        status: 'PENDING',
      },
      {
        id: 'mod-dhanmondi-duplicate',
        type: 'DUPLICATE_FLAG',
        targetId: 'mosque-pending-2',
        targetName: 'Dhanmondi Central Masjid',
        location: 'Road 27, Dhanmondi, Dhaka',
        coordinates: { lat: 23.7461, lng: 90.3752 },
        distanceMeters: 85,
        duplicateWith: 'Masjid-ut-Taqwa Dhanmondi',
        details: 'Proximity alert: Located 85m from listed Masjid-ut-Taqwa. Verify if duplicate or independent prayer space.',
        contributorName: 'Rafiqul Hasan',
        contributorRole: 'USER',
        createdAt: new Date(Date.now() - 3600000 * 5).toISOString(),
        status: 'PENDING',
      },
      {
        id: 'mod-gulshan-isha-timing',
        type: 'ISSUE_REPORT',
        targetId: 'mosque-dhaka-gulshan-society',
        targetName: 'Gulshan Society Jame Masjid',
        location: 'Gulshan 2, Dhaka',
        details: 'Isha Jamaat time shifted from 8:30 PM to 8:45 PM for summer schedule.',
        contributorName: 'Anonymous Musalli',
        contributorRole: 'USER',
        createdAt: new Date(Date.now() - 3600000 * 12).toISOString(),
        status: 'PENDING',
      },
    ];

    return fetchWithFallback<ModerationQueueItem[]>(
      '/moderation/queue',
      { method: 'GET' },
      fallbackQueue
    );
  },

  async resolveModerationItem(
    itemId: string,
    action: ModerationAction,
    notes?: string
  ): Promise<{ success: boolean; message: string }> {
    return fetchWithFallback<{ success: boolean; message: string }>(
      `/moderation/queue/${itemId}/resolve`,
      {
        method: 'POST',
        body: JSON.stringify({ action, notes }),
      },
      { success: true, message: `Item ${action.toLowerCase()}d successfully` }
    );
  },

  async fetchContributorReputation(userId?: string): Promise<ContributorReputationSummary> {
    const fallbackSummary: ContributorReputationSummary = {
      userId: userId || 'usr-scout-dhaka',
      scoutPoints: 450,
      scoutTier: 'GOLD',
      verifiedMosquesCount: 12,
      scheduleUpdatesCount: 34,
      facilitySuggestionsCount: 19,
      issueReportsCount: 7,
      rankTitle: 'Chief Musalli Scout (ঢাকা)',
      nextTierPoints: 600,
    };
    return fetchWithFallback<ContributorReputationSummary>(
      userId ? `/contributors/${userId}/reputation` : '/contributors/me/reputation',
      { method: 'GET' },
      fallbackSummary
    );
  },

  async fetchContributorHistory(userId?: string): Promise<ContributorActivityItem[]> {
    const fallbackHistory: ContributorActivityItem[] = [
      {
        id: 'act-1',
        type: 'MOSQUE_CREATED',
        targetName: 'Baitul Mukarram National Mosque',
        location: 'Paltan, Dhaka',
        status: 'APPROVED',
        pointsEarned: 100,
        createdAt: new Date(Date.now() - 86400000 * 2).toISOString(),
      },
      {
        id: 'act-2',
        type: 'SCHEDULE_UPDATED',
        targetName: 'Gulshan Society Jame Masjid',
        location: 'Gulshan 2, Dhaka',
        status: 'APPROVED',
        pointsEarned: 25,
        createdAt: new Date(Date.now() - 86400000 * 5).toISOString(),
      },
      {
        id: 'act-3',
        type: 'FACILITY_SUGGESTED',
        targetName: 'Dhanmondi Eidgah Masjid',
        location: 'Road 6, Dhanmondi',
        status: 'PENDING',
        pointsEarned: 10,
        createdAt: new Date(Date.now() - 86400000 * 7).toISOString(),
      },
      {
        id: 'act-4',
        type: 'REPORT_SUBMITTED',
        targetName: 'Chawkbazar Shahi Masjid',
        location: 'Old Dhaka',
        status: 'APPROVED',
        pointsEarned: 15,
        createdAt: new Date(Date.now() - 86400000 * 12).toISOString(),
      },
    ];
    return fetchWithFallback<ContributorActivityItem[]>(
      userId ? `/contributors/${userId}/activity` : '/contributors/me/activity',
      { method: 'GET' },
      fallbackHistory
    );
  },

  async submitRoleClaim(
    mosqueId: string,
    payload: CreateRoleClaimPayload
  ): Promise<RoleClaimResponse> {
    const fallbackResponse: RoleClaimResponse = {
      id: `claim-${Date.now()}`,
      mosqueId,
      role: payload.role,
      status: 'PENDING',
      message: 'Role claim submitted successfully. Awaiting verification.',
    };

    return fetchWithFallback<RoleClaimResponse>(
      `/community/${mosqueId}/claims`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackResponse
    );
  },

  async submitDonationChannel(
    mosqueId: string,
    payload: CreateDonationPayload
  ): Promise<DonationSubmissionResponse> {
    const fallbackResponse: DonationSubmissionResponse = {
      id: `donation-${Date.now()}`,
      success: true,
      message: 'Donation channel draft submitted for multi-signatory committee review.',
    };

    return fetchWithFallback<DonationSubmissionResponse>(
      `/mosques/${mosqueId}/donations`,
      {
        method: 'POST',
        body: JSON.stringify(payload),
      },
      fallbackResponse
    );
  },

  async getPrayerScheduleHistory(
    mosqueId: string,
    page: number = 1,
    limit: number = 20
  ): Promise<PrayerScheduleHistoryResponse> {
    const fallbackResponse: PrayerScheduleHistoryResponse = {
      items: [
        {
          id: `hist-latest-${mosqueId}`,
          mosqueId,
          scheduleSnapshot: {
            fajrJamaat: '05:30',
            fajrStart: '04:45',
            zuhrJamaat: '13:15',
            zuhrStart: '12:00',
            asrJamaat: '16:30',
            asrStart: '15:15',
            maghribJamaat: '18:05',
            maghribStart: '18:00',
            ishaJamaat: '19:45',
            ishaStart: '19:15',
            jumuahJamaat: '13:30',
            effectiveDate: new Date().toISOString(),
            freshnessLevel: 'HIGH',
          },
          changedById: 'user-lead-1',
          changedBy: {
            id: 'user-lead-1',
            name: 'Khatib & Committee',
          },
          reason: 'Seasonal sunset & dawn shift adjustment',
          createdAt: new Date().toISOString(),
        },
      ],
      meta: {
        page,
        limit,
        total: 1,
        totalPages: 1,
      },
    };

    return fetchWithFallback<PrayerScheduleHistoryResponse>(
      `/mosques/${mosqueId}/prayer-schedule/history?page=${page}&limit=${limit}`,
      { method: 'GET' },
      fallbackResponse
    );
  },
};
