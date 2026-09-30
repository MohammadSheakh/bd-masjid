export type DonationChannelType =
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'UPAY'
  | 'BANK_TRANSFER';

export type DonationChannelAccountType = 'MERCHANT' | 'PERSONAL' | 'AGENT';

export type DonationPurpose =
  | 'GENERAL_FUND'
  | 'CONSTRUCTION_EXPANSION'
  | 'ORPHAN_MADRASAH'
  | 'RAMADAN_IFTAR'
  | 'ZAKAT_SADAQAH'
  | 'JANAZA_FUND';

export type DonationChannelStatus =
  | 'PENDING_VERIFICATION'
  | 'VERIFIED'
  | 'REJECTED'
  | 'FLAGGED'
  | 'ARCHIVED';

export interface MosqueDonationChannel {
  id: string;
  mosqueId: string;
  channelType: DonationChannelType;
  accountType: DonationChannelAccountType;
  purpose: DonationPurpose;
  accountNumber: string;
  accountTitle: string;
  bankName?: string | null;
  branchName?: string | null;
  routingNumber?: string | null;
  paymentInstructions?: string | null;
  qrCodeImageUrl?: string | null;
  status: DonationChannelStatus;
  disputeCount: number;
  createdById: string;
  verifiedById?: string | null;
  verifiedAt?: string | null;
  rejectionReason?: string | null;
  createdAt: string;
  updatedAt: string;
  createdBy?: { id: string; name: string };
  verifiedBy?: { id: string; name: string };
}

export interface CreateDonationChannelInput {
  channelType: DonationChannelType;
  accountType?: DonationChannelAccountType;
  purpose?: DonationPurpose;
  accountNumber: string;
  accountTitle: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  paymentInstructions?: string;
  qrCodeImageUrl?: string;
}

export interface VerifyDonationChannelInput {
  notes?: string;
}

export interface RejectDonationChannelInput {
  reason: string;
}

export interface ReportDonationInput {
  reason: string;
  description: string;
}
