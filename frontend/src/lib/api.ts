import { Mosque, DuplicateCandidate, AttendanceSummary } from '@/types/mosque';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6733/api/v1';

// Seed fallback data for graceful degradation or offline state
export const FALLBACK_MOSQUES: Mosque[] = [
  {
    id: 'mosque-1',
    name: 'Baitul Mukarram National Mosque',
    latitude: 23.7289,
    longitude: 90.4125,
    address: 'Topkhana Road, Paltan',
    landmark: 'Opposite Stadium Gate',
    city: 'Dhaka',
    country: 'Bangladesh',
    operationalStatus: 'OPEN',
    verificationStatus: 'VERIFIED',
    distanceMeters: 450,
    freshness: { level: 'FRESH', daysAgo: 4, lastUpdated: new Date().toISOString() },
    attendanceSummary: { regularCount: 1420, occasionalCount: 680, totalCount: 2100, userStatus: 'NONE' },
    prayerSchedule: {
      fajrStart: '04:45',
      fajrJamaat: '05:15',
      sunrise: '06:02',
      zuhrStart: '12:05',
      zuhrJamaat: '13:30',
      asrStart: '16:15',
      asrJamaat: '16:45',
      maghribStart: '18:10',
      maghribJamaat: '18:15',
      ishaStart: '19:25',
      ishaJamaat: '20:00',
      jumuahJamaat: '13:30',
      timezone: 'Asia/Dhaka',
    },
  },
  {
    id: 'mosque-2',
    name: 'Star Mosque (Tara Masjid)',
    latitude: 23.7153,
    longitude: 90.4017,
    address: 'Armanitola, Old Dhaka',
    landmark: 'Near Armanitola Government High School',
    city: 'Dhaka',
    country: 'Bangladesh',
    operationalStatus: 'OPEN',
    verificationStatus: 'VERIFIED',
    distanceMeters: 1200,
    freshness: { level: 'FRESH', daysAgo: 12, lastUpdated: new Date().toISOString() },
    attendanceSummary: { regularCount: 520, occasionalCount: 210, totalCount: 730, userStatus: 'NONE' },
    prayerSchedule: {
      fajrStart: '04:45',
      fajrJamaat: '05:15',
      sunrise: '06:03',
      zuhrStart: '12:05',
      zuhrJamaat: '13:15',
      asrStart: '16:15',
      asrJamaat: '16:40',
      maghribStart: '18:10',
      maghribJamaat: '18:15',
      ishaStart: '19:25',
      ishaJamaat: '19:50',
      jumuahJamaat: '13:30',
      timezone: 'Asia/Dhaka',
    },
  },
  {
    id: 'mosque-3',
    name: 'Gulshan Society Jame Masjid',
    latitude: 23.7925,
    longitude: 90.4172,
    address: 'Road 63, Gulshan-2',
    landmark: 'Beside Gulshan Central Park',
    city: 'Dhaka',
    country: 'Bangladesh',
    operationalStatus: 'OPEN',
    verificationStatus: 'VERIFIED',
    distanceMeters: 3800,
    freshness: { level: 'FRESH', daysAgo: 2, lastUpdated: new Date().toISOString() },
    attendanceSummary: { regularCount: 980, occasionalCount: 450, totalCount: 1430, userStatus: 'NONE' },
    prayerSchedule: {
      fajrStart: '04:45',
      fajrJamaat: '05:20',
      sunrise: '06:02',
      zuhrStart: '12:05',
      zuhrJamaat: '13:30',
      asrStart: '16:15',
      asrJamaat: '16:45',
      maghribStart: '18:10',
      maghribJamaat: '18:16',
      ishaStart: '19:25',
      ishaJamaat: '20:15',
      jumuahJamaat: '13:30',
      timezone: 'Asia/Dhaka',
    },
  },
  {
    id: 'mosque-4',
    name: 'Dhanmondi Shahi Eidgah & Jame Masjid',
    latitude: 23.7461,
    longitude: 90.3742,
    address: 'Road 7, Dhanmondi',
    landmark: 'Near Dhanmondi Lake & Rabindra Sarobar',
    city: 'Dhaka',
    country: 'Bangladesh',
    operationalStatus: 'OPEN',
    verificationStatus: 'VERIFIED',
    distanceMeters: 4200,
    freshness: { level: 'STALE', daysAgo: 95, lastUpdated: new Date(Date.now() - 95 * 86400000).toISOString() },
    attendanceSummary: { regularCount: 740, occasionalCount: 320, totalCount: 1060, userStatus: 'NONE' },
    prayerSchedule: {
      fajrStart: '04:45',
      fajrJamaat: '05:15',
      sunrise: '06:03',
      zuhrStart: '12:05',
      zuhrJamaat: '13:20',
      asrStart: '16:15',
      asrJamaat: '16:45',
      maghribStart: '18:10',
      maghribJamaat: '18:15',
      ishaStart: '19:25',
      ishaJamaat: '20:00',
      jumuahJamaat: '13:30',
      timezone: 'Asia/Dhaka',
    },
  },
  {
    id: 'mosque-5',
    name: 'Lalbagh Fort Mosque',
    latitude: 23.7188,
    longitude: 90.3881,
    address: 'Lalbagh Road, Lalbagh',
    landmark: 'Inside Lalbagh Fort Complex',
    city: 'Dhaka',
    country: 'Bangladesh',
    operationalStatus: 'OPEN',
    verificationStatus: 'VERIFIED',
    distanceMeters: 2100,
    freshness: { level: 'FRESH', daysAgo: 24, lastUpdated: new Date().toISOString() },
    attendanceSummary: { regularCount: 310, occasionalCount: 190, totalCount: 500, userStatus: 'NONE' },
    prayerSchedule: {
      fajrStart: '04:45',
      fajrJamaat: '05:15',
      sunrise: '06:03',
      zuhrStart: '12:05',
      zuhrJamaat: '13:15',
      asrStart: '16:15',
      asrJamaat: '16:35',
      maghribStart: '18:10',
      maghribJamaat: '18:15',
      ishaStart: '19:25',
      ishaJamaat: '19:50',
      jumuahJamaat: '13:30',
      timezone: 'Asia/Dhaka',
    },
  },
];

export async function fetchNearbyMosques(
  lat: number,
  lng: number,
  radiusMeters = 5000,
): Promise<Mosque[]> {
  try {
    const res = await fetch(
      `${API_BASE}/mosques/nearby?lat=${lat}&lng=${lng}&radiusMeters=${radiusMeters}`,
      { next: { revalidate: 60 } },
    );
    if (!res.ok) throw new Error('Failed to fetch nearby mosques');
    const json = await res.json();
    return json.data || json;
  } catch (err) {
    console.warn('API unavailable, returning fallback mosques:', err);
    return FALLBACK_MOSQUES;
  }
}

export async function searchMosques(
  search?: string,
  city?: string,
  filters?: {
    hasSeparateWomenSpace?: boolean;
    hasAirConditioning?: boolean;
    hasParking?: boolean;
  },
): Promise<Mosque[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (city && city !== 'All') params.append('city', city);
    if (filters?.hasSeparateWomenSpace) params.append('hasSeparateWomenSpace', 'true');
    if (filters?.hasAirConditioning) params.append('hasAirConditioning', 'true');
    if (filters?.hasParking) params.append('hasParking', 'true');

    const res = await fetch(`${API_BASE}/mosques?${params.toString()}`);
    if (!res.ok) throw new Error('Failed to search mosques');
    const json = await res.json();
    return json.data?.items || json.items || [];
  } catch (err) {
    console.warn('API search failed, filtering fallback:', err);
    let list = [...FALLBACK_MOSQUES];
    if (search) {
      const q = search.toLowerCase();
      list = list.filter(
        (m) =>
          m.name.toLowerCase().includes(q) ||
          m.address?.toLowerCase().includes(q) ||
          m.city?.toLowerCase().includes(q),
      );
    }
    if (city && city !== 'All') {
      list = list.filter((m) => m.city?.toLowerCase() === city.toLowerCase());
    }
    if (filters?.hasSeparateWomenSpace) {
      list = list.filter((m) => m.hasSeparateWomenSpace);
    }
    if (filters?.hasAirConditioning) {
      list = list.filter((m) => m.hasAirConditioning);
    }
    if (filters?.hasParking) {
      list = list.filter((m) => m.hasParking);
    }
    return list;
  }
}

export async function fetchMosqueById(id: string): Promise<Mosque | null> {
  try {
    const res = await fetch(`${API_BASE}/mosques/${id}`);
    if (!res.ok) throw new Error('Failed to fetch mosque');
    const json = await res.json();
    return json.data || json;
  } catch {
    const found = FALLBACK_MOSQUES.find((m) => m.id === id);
    return found || null;
  }
}

export async function checkProximityDuplicate(
  latitude: number,
  longitude: number,
): Promise<DuplicateCandidate[]> {
  try {
    const res = await fetch(`${API_BASE}/mosques/check-duplicate`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ latitude, longitude }),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data?.candidates || json.candidates || [];
  } catch {
    return [];
  }
}

export async function createMosque(data: any): Promise<{ success: boolean; data?: any; error?: string; candidates?: DuplicateCandidate[] }> {
  try {
    const res = await fetch(`${API_BASE}/mosques`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (res.status === 409) {
      return {
        success: false,
        error: json.message || 'Possible duplicate mosque exists nearby.',
        candidates: json.candidates || [],
      };
    }
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to submit mosque.' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function toggleAttendance(
  mosqueId: string,
  status: 'REGULAR' | 'OCCASIONAL' | 'NONE',
): Promise<AttendanceSummary | null> {
  try {
    if (status === 'NONE') {
      const res = await fetch(`${API_BASE}/mosques/${mosqueId}/attendance`, {
        method: 'DELETE',
      });
      const json = await res.json();
      return json.data?.summary || json.summary || null;
    } else {
      const res = await fetch(`${API_BASE}/mosques/${mosqueId}/attendance`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      return json.data?.summary || json.summary || null;
    }
  } catch {
    return null;
  }
}

export async function submitScheduleSuggestion(
  mosqueId: string,
  data: { suggestedTimes: Record<string, string>; description?: string },
) {
  const res = await fetch(`${API_BASE}/mosques/${mosqueId}/suggestions`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function submitMosqueReport(
  mosqueId: string,
  data: { type: string; description: string; contactEmail?: string },
) {
  const res = await fetch(`${API_BASE}/mosques/${mosqueId}/reports`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return res.json();
}

export async function fetchMosqueStaff(mosqueId: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/staff`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

export async function submitRoleClaim(
  mosqueId: string,
  data: { role: string; evidence: string },
) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/role-claims`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to submit role claim' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function fetchMosqueAnnouncements(mosqueId: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/announcements`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

export async function createMosqueAnnouncement(
  mosqueId: string,
  data: { title: string; content: string; isPinned?: boolean },
) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/announcements`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to post announcement' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteMosqueAnnouncement(
  mosqueId: string,
  announcementId: string,
) {
  try {
    const res = await fetch(
      `${API_BASE}/mosques/${mosqueId}/announcements/${announcementId}`,
      { method: 'DELETE' },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchMosqueDonations(mosqueId: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/donations`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

export async function createMosqueDonation(
  mosqueId: string,
  data: {
    methodType: string;
    accountType?: string;
    accountNumber: string;
    accountTitle?: string;
    bankName?: string;
    branchName?: string;
    routingNumber?: string;
    instructions?: string;
  },
) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/donations`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || 'Failed to add donation destination',
      };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function toggleMosqueBookmark(mosqueId: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/bookmark`, {
      method: 'POST',
    });
    const json = await res.json();
    return json.data || json || { isBookmarked: false };
  } catch {
    return { isBookmarked: false };
  }
}

export async function fetchUserBookmarks() {
  try {
    const res = await fetch(`${API_BASE}/users/me/bookmarks`);
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

