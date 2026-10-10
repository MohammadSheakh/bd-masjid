/**
 * Enterprise API Client conforming to ADR-003, ADR-007, and ADR-033
 * - Smart localhost resolution (Android 10.0.2.2 vs iOS localhost:4000)
 * - Automatic Bearer JWT authentication header injection
 * - Resilient offline fallback to structured Bangladeshi fixtures
 */
import { Platform } from 'react-native';
import { AttendanceStatus, AttendanceSummary, Mosque, PrayerSchedule } from '../types/mosque';
import { BANGLADESH_MOSQUES_FIXTURES } from '../data/mosqueFixtures';
import { PreferencesStorage, SecureTokenStorage } from './storage';

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
};
