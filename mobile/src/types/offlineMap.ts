/**
 * Division-Level Offline Vector Map Region Domain Contracts (ADR-062)
 */

export type RegionDownloadStatus =
  | 'NOT_DOWNLOADED'
  | 'DOWNLOADING'
  | 'DOWNLOADED'
  | 'FAILED';

export interface RegionBoundingBox {
  minLng: number;
  minLat: number;
  maxLng: number;
  maxLat: number;
}

export interface OfflineMapRegion {
  id: string;
  divisionCode: string;
  nameBangla: string;
  nameEnglish: string;
  sizeMb: number;
  estimatedTiles: number;
  boundingBox: RegionBoundingBox;
  status: RegionDownloadStatus;
  progressPercent: number;
  lastDownloadedAt?: string;
}

export interface OfflineStorageSummary {
  usedMb: number;
  budgetMb: number;
  downloadedRegionsCount: number;
}
