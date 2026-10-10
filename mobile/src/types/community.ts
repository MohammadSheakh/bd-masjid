/**
 * Mosque Community Leadership & Role Claim Contracts (ADR-003, ADR-019, ADR-064)
 * Parity with backend CreateRoleClaimDto and MosqueStaffRole
 */

export type MosqueStaffRole =
  | 'IMAM'
  | 'SENIOR_IMAM'
  | 'KHATIB'
  | 'MUAZZIN'
  | 'KHADEM'
  | 'MUTAWALLI'
  | 'MOSQUE_ADMIN'
  | 'PRESIDENT'
  | 'SECRETARY'
  | 'TREASURER'
  | 'COMMITTEE_PRESIDENT'
  | 'COMMITTEE_VICE_PRESIDENT'
  | 'COMMITTEE_SECRETARY'
  | 'COMMITTEE_MEMBER'
  | 'CUSTOM';

export interface CreateRoleClaimPayload {
  role: MosqueStaffRole | string;
  customRoleTitle?: string;
  name: string;
  phoneNumber: string;
  startDate?: string;
  imageUrl?: string;
  evidence?: string;
  documentUrl?: string;
}

export interface RoleClaimResponse {
  id: string;
  mosqueId: string;
  role: MosqueStaffRole | string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
}
