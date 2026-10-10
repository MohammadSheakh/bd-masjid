/**
 * Domain contracts for Mosque Committee Verification and Proof Documents
 * Conforming to backend CommunityController (ADR-009, ADR-019, ADR-069)
 */

import { MosqueStaffRole } from './community';

export type VerificationDocumentType =
  | 'COMMITTEE_RESOLUTION'
  | 'NID_CARD'
  | 'KHATIB_CERTIFICATE'
  | 'UTILITY_BILL';

export type VerificationClaimStatus = 'PENDING' | 'APPROVED' | 'REJECTED';

export interface SubmitVerificationPayload {
  role: MosqueStaffRole;
  phone: string;
  documentType: VerificationDocumentType;
  documentUrl?: string;
  documentName?: string;
  notes?: string;
}

export interface VerificationProofUploadResponse {
  success: boolean;
  url: string;
  filename: string;
  size: number;
  mimeType: string;
}

export interface VerificationClaimItem {
  id: string;
  mosqueId: string;
  userId?: string;
  role: string;
  status: VerificationClaimStatus;
  documentType?: VerificationDocumentType;
  documentUrl?: string;
  documentName?: string;
  notes?: string;
  createdAt: string;
  reviewedAt?: string;
}
