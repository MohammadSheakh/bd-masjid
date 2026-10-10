/**
 * Mosque Community Leadership & Role Claim Contracts (ADR-003, ADR-019, ADR-064)
 * Parity with backend CreateRoleClaimDto and MosqueStaffRole
 */

export type MosqueStaffRole =
  | 'KHATIB'
  | 'SENIOR_IMAM'
  | 'IMAM'
  | 'MUAZZIN'
  | 'MUTAWALLI'
  | 'PRESIDENT'
  | 'SECRETARY'
  | 'TREASURER'
  | 'COMMITTEE_MEMBER'
  | 'KHADEM'
  | 'CUSTOM';

export interface CreateRoleClaimPayload {
  role: MosqueStaffRole;
  customRoleTitle?: string;
  name: string;
  phoneNumber: string;
  startDate?: string;
  evidence?: string;
  documentUrl?: string;
}

export interface RoleClaimResponse {
  id: string;
  mosqueId: string;
  role: MosqueStaffRole;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  message: string;
}
