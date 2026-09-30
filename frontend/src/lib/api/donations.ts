import {
  CreateDonationChannelInput,
  MosqueDonationChannel,
  RejectDonationChannelInput,
  ReportDonationInput,
  VerifyDonationChannelInput,
} from '@/types/donation';

const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6733/api/v1';

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

/**
 * Fetch verified donation channels for a mosque.
 * Authorized staff will also receive pending channels if authenticated.
 */
export async function fetchMosqueDonationChannels(
  mosqueId: string,
  options?: { status?: string; channelType?: string; purpose?: string },
): Promise<MosqueDonationChannel[]> {
  try {
    const params = new URLSearchParams();
    if (options?.status) params.set('status', options.status);
    if (options?.channelType) params.set('channelType', options.channelType);
    if (options?.purpose) params.set('purpose', options.purpose);

    const query = params.toString() ? `?${params.toString()}` : '';
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/donations${query}`, {
      headers: getAuthHeaders(),
    });

    if (!res.ok) return [];
    const json = await res.json();
    return json.data || json || [];
  } catch {
    return [];
  }
}

/**
 * Submit a draft donation channel (Requires verified Mutawalli, Committee, or Admin)
 */
export async function submitMosqueDonationChannel(
  mosqueId: string,
  data: CreateDonationChannelInput,
): Promise<{ success: boolean; data?: MosqueDonationChannel; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/mosques/${mosqueId}/donations`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || 'Failed to submit donation channel',
      };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Verify and approve a donation channel (Requires verified Imam or Admin, cannot self-approve)
 */
export async function verifyDonationChannel(
  channelId: string,
  data?: VerifyDonationChannelInput,
): Promise<{ success: boolean; data?: MosqueDonationChannel; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/donations/${channelId}/verify`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data || {}),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || 'Failed to verify donation channel',
      };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Reject or archive a donation channel
 */
export async function rejectDonationChannel(
  channelId: string,
  data: RejectDonationChannelInput,
): Promise<{ success: boolean; data?: MosqueDonationChannel; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/donations/${channelId}/reject`, {
      method: 'PATCH',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || 'Failed to reject donation channel',
      };
    }
    return { success: true, data: json.data || json };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}

/**
 * Submit community fraud or error report
 */
export async function reportDonationChannel(
  channelId: string,
  data: ReportDonationInput,
): Promise<{ success: boolean; message?: string; error?: string }> {
  try {
    const res = await fetch(`${API_BASE}/donations/${channelId}/report`, {
      method: 'POST',
      headers: getAuthHeaders(),
      body: JSON.stringify(data),
    });

    const json = await res.json();
    if (!res.ok) {
      return {
        success: false,
        error: json.message || 'Failed to submit report',
      };
    }
    return {
      success: true,
      message: json.message || 'Report submitted successfully',
    };
  } catch (err: any) {
    return { success: false, error: err.message || 'Network error' };
  }
}
