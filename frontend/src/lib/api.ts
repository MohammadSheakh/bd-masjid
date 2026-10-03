import {
  Mosque,
  MosqueFacility,
  MosqueAnnouncement,
  AnnouncementCategory,
  DuplicateCandidate,
  AttendanceSummary,
  MosqueRoleClaim,
  MosqueStaffMember,
} from '@/types/mosque';

export function getApiBase(): string {
  if (typeof window !== 'undefined') {
    const envUrl = process.env.NEXT_PUBLIC_API_URL;
    // If explicitly configured with https://, use it directly
    if (envUrl && envUrl.startsWith('https://')) {
      return envUrl.replace(/\/$/, '');
    }
    // Prevent Mixed Content blocking if page was loaded over HTTPS
    if (window.location.protocol === 'https:' && (!envUrl || envUrl.startsWith('http://'))) {
      return '/api/v1';
    }
    return (envUrl || '/api/v1').replace(/\/$/, '');
  }
  // Server-side execution in Node.js (SSR / Next.js container)
  const serverUrl =
    process.env.INTERNAL_API_URL ||
    process.env.NEXT_PUBLIC_API_URL ||
    'http://backend:6733/api/v1';
  return serverUrl.replace(/\/$/, '');
}

export const API_BASE = {
  toString: () => getApiBase(),
  valueOf: () => getApiBase(),
};

function getAuthHeaders(): HeadersInit {
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
  };
  if (typeof window !== 'undefined') {
    const token = localStorage.getItem('access_token') || localStorage.getItem('token');
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
  }
  return headers;
}

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
  facilityFilters?: {
    hasFemalePrayerSpace?: boolean;
    hasWheelchairAccess?: boolean;
    hasAirConditioning?: boolean;
    hasJanazaService?: boolean;
    minCapacity?: number;
  },
): Promise<Mosque[]> {
  try {
    const params = new URLSearchParams({
      lat: String(lat),
      lng: String(lng),
      radiusMeters: String(radiusMeters),
    });
    if (facilityFilters?.hasFemalePrayerSpace) {
      params.append('hasFemalePrayerSpace', 'true');
    }
    if (facilityFilters?.hasWheelchairAccess) {
      params.append('hasWheelchairAccess', 'true');
    }
    if (facilityFilters?.hasAirConditioning) {
      params.append('hasAirConditioning', 'true');
    }
    if (facilityFilters?.hasJanazaService) {
      params.append('hasJanazaService', 'true');
    }
    if (facilityFilters?.minCapacity) {
      params.append('minCapacity', String(facilityFilters.minCapacity));
    }

    const res = await fetch(`${API_BASE}/mosques/nearby?${params.toString()}`, {
      next: { revalidate: 60 },
    });
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
    hasWheelchairAccess?: boolean;
  },
): Promise<Mosque[]> {
  try {
    const params = new URLSearchParams();
    if (search) params.append('search', search);
    if (city && city !== 'All') params.append('city', city);
    if (filters?.hasSeparateWomenSpace) params.append('hasSeparateWomenSpace', 'true');
    if (filters?.hasAirConditioning) params.append('hasAirConditioning', 'true');
    if (filters?.hasParking) params.append('hasParking', 'true');
    if (filters?.hasWheelchairAccess) params.append('hasWheelchairAccess', 'true');

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

export async function fetchPaginatedMosques(params: {
  page?: number;
  limit?: number;
  search?: string;
  isListed?: boolean | 'ALL' | 'LISTED' | 'UNLISTED';
  verificationStatus?: string;
  operationalStatus?: string;
  city?: string;
}): Promise<{
  items: Mosque[];
  meta: { page: number; limit: number; total: number; totalPages: number };
}> {
  const query = new URLSearchParams();
  if (params.page) query.append('page', String(params.page));
  if (params.limit) query.append('limit', String(params.limit));
  if (params.search?.trim()) query.append('search', params.search.trim());
  if (params.isListed !== undefined && params.isListed !== 'ALL') {
    if (params.isListed === true || params.isListed === 'LISTED') {
      query.append('isListed', 'true');
    } else if (params.isListed === false || params.isListed === 'UNLISTED') {
      query.append('isListed', 'false');
    }
  }
  if (params.verificationStatus && params.verificationStatus !== 'ALL') {
    query.append('verificationStatus', params.verificationStatus);
  }
  if (params.operationalStatus && params.operationalStatus !== 'ALL') {
    query.append('operationalStatus', params.operationalStatus);
  }
  if (params.city && params.city !== 'ALL') {
    query.append('city', params.city);
  }

  const res = await fetch(`${API_BASE}/mosques?${query.toString()}`, {
    headers: getAuthHeaders(),
  });
  if (!res.ok) {
    throw new Error('Failed to fetch mosques');
  }
  const json = await res.json();
  const data = json.data || json;
  return {
    items: data.items || [],
    meta: data.meta || {
      page: params.page || 1,
      limit: params.limit || 20,
      total: data.items?.length || 0,
      totalPages: 1,
    },
  };
}

export async function toggleMosqueListing(id: string, isListed: boolean, reason?: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${id}/listing`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify({ isListed, reason }),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to update listing status' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateMosqueDetails(id: string, data: any) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${id}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to update mosque details' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteMosque(id: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${id}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to delete mosque' };
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
  data: { suggestedTimes: Record<string, string | undefined>; description?: string },
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
  data: {
    role: string;
    customRoleTitle?: string;
    name: string;
    phoneNumber: string;
    startDate?: string;
    imageUrl?: string;
    evidence: string;
    documentUrl?: string;
  },
) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/role-claims`, {
      method: 'POST',
      headers: getAuthHeaders(),
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

export async function uploadClaimImage(
  file: File,
): Promise<{ success: boolean; url?: string; error?: string }> {
  try {
    const formData = new FormData();
    formData.append('image', file);
    const token = typeof window !== 'undefined' ? localStorage.getItem('token') || '' : '';
    const headers: Record<string, string> = {};
    if (token) {
      headers['Authorization'] = `Bearer ${token}`;
    }
    const res = await fetch(`${API_BASE}/community/upload-image`, {
      method: 'POST',
      headers,
      body: formData,
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to upload image' };
    }
    const url = json.data?.url || json.url;
    return { success: true, url };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network upload error' };
  }
}

export async function fetchMosqueRoleClaims(
  mosqueId: string,
  status?: string,
): Promise<MosqueRoleClaim[]> {
  try {
    const query = status ? `?status=${status}` : '';
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/role-claims${query}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

export async function reviewRoleClaim(
  claimId: string,
  data: { status: string; resolutionNotes?: string },
) {
  try {
    const res = await fetch(`${API_BASE}/community/role-claims/${claimId}/review`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to review role claim' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function removeMosqueStaff(mosqueId: string, staffId: string) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/staff/${staffId}`, {
      method: 'DELETE',
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to remove staff member' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function addMosqueStaff(
  mosqueId: string,
  data: {
    role: string;
    customRoleTitle?: string;
    name: string;
    contactNumber?: string;
    startDate?: string;
    imageUrl?: string;
    userId?: string;
  },
) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/staff`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to add staff member' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function updateMosqueStaff(
  mosqueId: string,
  staffId: string,
  data: {
    role?: string;
    customRoleTitle?: string;
    name?: string;
    contactNumber?: string;
    startDate?: string;
    imageUrl?: string;
    isVerified?: boolean;
  },
) {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/staff/${staffId}`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to update staff member' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function fetchMosqueAnnouncements(
  mosqueId: string,
  options?: { category?: string; includeExpired?: boolean },
): Promise<MosqueAnnouncement[]> {
  try {
    const params = new URLSearchParams();
    if (options?.category) params.set('category', options.category);
    if (options?.includeExpired) params.set('includeExpired', 'true');
    const queryString = params.toString() ? `?${params.toString()}` : '';

    const headers: Record<string, string> = {};
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/announcements${queryString}`, {
      headers,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

export async function createMosqueAnnouncement(
  mosqueId: string,
  data: {
    title: string;
    content: string;
    category?: AnnouncementCategory;
    isPinned?: boolean;
    expiresAt?: string;
  },
  token?: string,
): Promise<{ success: boolean; data?: MosqueAnnouncement; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null);
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/announcements`, {
      method: 'POST',
      headers,
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

export async function updateMosqueAnnouncement(
  announcementId: string,
  data: {
    title?: string;
    content?: string;
    category?: AnnouncementCategory;
    isPinned?: boolean;
    expiresAt?: string | null;
  },
  token?: string,
): Promise<{ success: boolean; data?: MosqueAnnouncement; error?: string }> {
  try {
    const headers: Record<string, string> = { 'Content-Type': 'application/json' };
    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null);
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${API_BASE}/announcements/${announcementId}`, {
      method: 'PATCH',
      headers,
      body: JSON.stringify(data),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, error: json.message || 'Failed to update announcement' };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

export async function deleteMosqueAnnouncement(
  mosqueId: string,
  announcementId: string,
  token?: string,
): Promise<boolean> {
  try {
    const headers: Record<string, string> = {};
    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null);
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const res = await fetch(
      `${API_BASE}/announcements/${announcementId}`,
      { method: 'DELETE', headers },
    );
    return res.ok;
  } catch {
    return false;
  }
}

export async function fetchAnnouncementsFeed(options?: {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: AnnouncementCategory;
  emergencyOnly?: boolean;
  bookmarkedOnly?: boolean;
}): Promise<MosqueAnnouncement[]> {
  try {
    const params = new URLSearchParams();
    if (options?.lat !== undefined) params.set('lat', options.lat.toString());
    if (options?.lng !== undefined) params.set('lng', options.lng.toString());
    if (options?.radiusKm !== undefined) params.set('radiusKm', options.radiusKm.toString());
    if (options?.category) params.set('category', options.category);
    if (options?.emergencyOnly) params.set('emergencyOnly', 'true');
    if (options?.bookmarkedOnly) params.set('bookmarkedOnly', 'true');

    const headers: Record<string, string> = {};
    const token =
      typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const res = await fetch(`${API_BASE}/announcements/feed?${params.toString()}`, {
      headers,
    });
    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
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

export function getLocalBookmarks(): string[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem('bd_masjid_bookmarks');
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

export async function toggleMosqueBookmark(mosqueId: string): Promise<{ isBookmarked: boolean }> {
  let isBookmarked = false;
  if (typeof window !== 'undefined') {
    try {
      const current = getLocalBookmarks();
      if (current.includes(mosqueId)) {
        const next = current.filter((id) => id !== mosqueId);
        localStorage.setItem('bd_masjid_bookmarks', JSON.stringify(next));
        isBookmarked = false;
      } else {
        const next = [...current, mosqueId];
        localStorage.setItem('bd_masjid_bookmarks', JSON.stringify(next));
        isBookmarked = true;
      }
    } catch {
      // ignore local storage errors
    }
  }

  // Also attempt backend sync if token exists
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      const res = await fetch(`${API_BASE}/mosques/${mosqueId}/bookmark`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
      });
      if (res.ok) {
        const json = await res.json();
        const serverState = json.data?.isBookmarked ?? json.isBookmarked;
        if (typeof serverState === 'boolean') {
          isBookmarked = serverState;
        }
      }
    }
  } catch {
    // Return optimistic local state if network or backend fails
  }

  return { isBookmarked };
}

export async function fetchUserBookmarks(): Promise<string[]> {
  try {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (token) {
      const res = await fetch(`${API_BASE}/users/me/bookmarks`, {
        headers: {
          'Authorization': `Bearer ${token}`,
        },
      });
      if (res.ok) {
        const json = await res.json();
        const mosques = json.data || json || [];
        if (Array.isArray(mosques)) {
          const ids = mosques.map((m: any) => m.id);
          if (typeof window !== 'undefined') {
            localStorage.setItem('bd_masjid_bookmarks', JSON.stringify(ids));
          }
          return ids;
        }
      }
    }
  } catch {
    // Fall back to local
  }
  return getLocalBookmarks();
}

export async function fetchMosqueFacilities(
  mosqueId: string,
): Promise<MosqueFacility | null> {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/facilities`, {
      headers: getAuthHeaders(),
      cache: 'no-store',
    });
    if (!res.ok) {
      if (res.status === 404) return null;
      throw new Error(`Failed to fetch facilities: ${res.statusText}`);
    }
    const json = await res.json();
    return json.data ?? json;
  } catch (err) {
    console.warn(`Error fetching facilities for mosque ${mosqueId}:`, err);
    return null;
  }
}

export async function upsertMosqueFacilities(
  mosqueId: string,
  data: Partial<MosqueFacility>,
  token?: string,
): Promise<{ success: boolean; data?: MosqueFacility; error?: string }> {
  try {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    const activeToken =
      token ||
      (typeof window !== 'undefined'
        ? localStorage.getItem('access_token') || localStorage.getItem('token')
        : null);
    if (activeToken) {
      headers['Authorization'] = `Bearer ${activeToken}`;
    }

    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/facilities`, {
      method: 'PUT',
      headers,
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || json.error || 'Failed to update facilities',
      };
    }

    return {
      success: true,
      data: json.data ?? json,
    };
  } catch (err: any) {
    return {
      success: false,
      error: err.message || 'Network error updating facilities',
    };
  }
}

export * from './api/donations';

export interface UserNotificationItem {
  id: string;
  userId: string;
  mosqueId: string;
  type: 'ANNOUNCEMENT' | 'SCHEDULE_CHANGE' | 'DONATION_UPDATE' | 'PRAYER_REMINDER';
  title: string;
  body: string;
  entityId?: string | null;
  isRead: boolean;
  readAt?: string | null;
  createdAt: string;
  mosque?: { id: string; name: string; city: string | null };
}

export async function fetchFollowStatus(mosqueId: string): Promise<{ isFollowing: boolean; followersCount: number }> {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/follow-status`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { isFollowing: false, followersCount: 0 };
    const json = await res.json();
    return json.data || json || { isFollowing: false, followersCount: 0 };
  } catch {
    return { isFollowing: false, followersCount: 0 };
  }
}

export async function toggleFollowMosque(
  mosqueId: string,
  isFollowing: boolean,
): Promise<{ success: boolean; isFollowing: boolean; followersCount: number; error?: string }> {
  try {
    const method = isFollowing ? 'DELETE' : 'POST';
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/follow`, {
      method,
      headers: getAuthHeaders(),
    });
    const json = await res.json();
    if (!res.ok) {
      return { success: false, isFollowing, followersCount: 0, error: json.message || 'Action failed' };
    }
    const data = json.data || json;
    return { success: true, isFollowing: data.isFollowing, followersCount: data.followersCount };
  } catch (err: any) {
    return { success: false, isFollowing, followersCount: 0, error: err.message || 'Network error' };
  }
}

export async function fetchNotifications(query?: { isRead?: boolean; page?: number; limit?: number }) {
  try {
    const params = new URLSearchParams();
    if (query?.isRead !== undefined) params.set('isRead', String(query.isRead));
    if (query?.page) params.set('page', String(query.page));
    if (query?.limit) params.set('limit', String(query.limit));

    const res = await fetch(`${API_BASE}/notifications?${params.toString()}`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return { items: [], unreadCount: 0, total: 0 };
    const json = await res.json();
    return json.data || json || { items: [], unreadCount: 0, total: 0 };
  } catch {
    return { items: [], unreadCount: 0, total: 0 };
  }
}

export async function fetchUnreadCount(): Promise<number> {
  try {
    const res = await fetch(`${API_BASE}/notifications/unread-count`, {
      headers: getAuthHeaders(),
    });
    if (!res.ok) return 0;
    const json = await res.json();
    return (json.data?.unreadCount ?? json.unreadCount) || 0;
  } catch {
    return 0;
  }
}

export async function markNotificationAsRead(id: string) {
  try {
    await fetch(`${API_BASE}/notifications/${id}/read`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  } catch {
    // Ignore error
  }
}

export async function markAllNotificationsAsRead() {
  try {
    await fetch(`${API_BASE}/notifications/read-all`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
    });
  } catch {
    // Ignore error
  }
}

export async function loginUser(email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Failed to login');
  }
  return json.data || json;
}

export async function registerUser(name: string, email: string, password: string) {
  const res = await fetch(`${API_BASE}/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ name, email, password }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Failed to register');
  }
  return json.data || json;
}

export async function getOAuthConfig(): Promise<{ googleClientId: string | null }> {
  try {
    const res = await fetch(`${API_BASE}/auth/oauth/config`);
    if (!res.ok) return { googleClientId: null };
    const json = await res.json();
    return json.data || json;
  } catch {
    return { googleClientId: null };
  }
}

export async function oauthLogin(provider: string, idToken: string) {
  const res = await fetch(`${API_BASE}/auth/oauth`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ provider, idToken }),
  });
  const json = await res.json();
  if (!res.ok) {
    throw new Error(json.message || json.error || 'Google authentication failed');
  }
  return json.data || json;
}


