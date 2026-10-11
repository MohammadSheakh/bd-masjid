/**
 * Community Announcements & Janazah / Emergency Bulletin Types (ADR-065)
 * Strict parity with backend announcements feature contracts
 */

export type AnnouncementCategory =
  | 'GENERAL'
  | 'JUMUAH_KHUTBAH'
  | 'EMERGENCY_ALERT'
  | 'RAMADAN'
  | 'JANAZA'
  | 'EID'
  | 'MAINTENANCE';

export interface MosqueAnnouncement {
  id: string;
  mosqueId: string;
  mosqueName?: string;
  city?: string;
  distanceMeters?: number;
  title: string;
  content: string;
  category: AnnouncementCategory;
  isPinned: boolean;
  expiresAt?: string | null;
  authorId?: string;
  authorName?: string;
  authorRole?: string | null;
  createdAt: string;
  updatedAt?: string;
}

export interface FeedAnnouncementsParams {
  lat?: number;
  lng?: number;
  radiusKm?: number;
  category?: AnnouncementCategory;
  emergencyOnly?: boolean;
  bookmarkedOnly?: boolean;
  limit?: number;
  offset?: number;
}

export interface CreateAnnouncementPayload {
  title: string;
  content: string;
  category?: AnnouncementCategory;
  isPinned?: boolean;
  expiresAt?: string;
}

export interface AnnouncementsFeedResponse {
  success: boolean;
  data: MosqueAnnouncement[];
  total: number;
  limit: number;
  offset: number;
}
