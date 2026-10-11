/**
 * Mosque Crowdsourced Donation Submission Types (ADR-067)
 * Parity with backend CreateDonationChannelDto and Prisma Enums
 */

export type DonationChannelType =
  | 'BKASH'
  | 'NAGAD'
  | 'ROCKET'
  | 'UPAY'
  | 'BANK_TRANSFER';

export type DonationChannelAccountType = 'PERSONAL' | 'MERCHANT' | 'AGENT';

export type DonationPurpose =
  | 'GENERAL_FUND'
  | 'CONSTRUCTION'
  | 'UTILITIES_MAINTENANCE'
  | 'ORPHAN_EDUCATION'
  | 'RAMADAN_IFTAR'
  | 'ZAKAT';

export interface CreateDonationPayload {
  channelType: DonationChannelType;
  accountType?: DonationChannelAccountType;
  purpose?: DonationPurpose;
  accountNumber: string;
  accountTitle: string;
  bankName?: string;
  branchName?: string;
  routingNumber?: string;
  paymentInstructions?: string;
}

export interface DonationSubmissionResponse {
  success: boolean;
  message: string;
  id?: string;
}
