/**
 * Donation Service (ADR-028, ADR-051 Parity)
 * Manages Bangladeshi mobile banking brands, multi-signatory committee attestation,
 * USSD dialer hints, and donor fraud protection disclosures.
 */

import { DonationAccountType, DonationMethodType } from '../types/mosque';

export interface PaymentBrandConfig {
  name: string;
  brandColor: string;
  badgeBg: string;
  badgeBorder: string;
  ussdCode?: string;
  icon: string;
}

export const PAYMENT_BRANDS: Record<DonationMethodType, PaymentBrandConfig> = {
  BKASH: {
    name: 'bKash',
    brandColor: '#e2136e',
    badgeBg: '#fdf2f8',
    badgeBorder: '#fbcfe8',
    ussdCode: '*247#',
    icon: '📱',
  },
  NAGAD: {
    name: 'Nagad',
    brandColor: '#ea580c',
    badgeBg: '#fff7ed',
    badgeBorder: '#fed7aa',
    ussdCode: '*167#',
    icon: '📱',
  },
  ROCKET: {
    name: 'Rocket',
    brandColor: '#7c3aed',
    badgeBg: '#f5f3ff',
    badgeBorder: '#ddd6fe',
    ussdCode: '*322#',
    icon: '🚀',
  },
  UPAY: {
    name: 'upay',
    brandColor: '#0284c7',
    badgeBg: '#f0f9ff',
    badgeBorder: '#bae6fd',
    ussdCode: '*268#',
    icon: '📲',
  },
  BANK_TRANSFER: {
    name: 'Bank Transfer',
    brandColor: '#0f766e',
    badgeBg: '#f0fdfa',
    badgeBorder: '#99f6e4',
    icon: '🏛️',
  },
};

export interface RoleAttestation {
  roleKey: string;
  labelEn: string;
  labelBn: string;
  isAttested: boolean;
}

export const CORE_GOVERNANCE_PILLARS = [
  { roleKey: 'PRESIDENT', labelEn: 'President', labelBn: 'সভাপতি' },
  { roleKey: 'GENERAL_SECRETARY', labelEn: 'Gen. Secretary', labelBn: 'সাধারণ সম্পাদক' },
  { roleKey: 'MUTAWALLI', labelEn: 'Mutawalli', labelBn: 'মোতাওয়াল্লী' },
  { roleKey: 'VICE_PRESIDENT', labelEn: 'Vice President', labelBn: 'সহ-সভাপতি' },
];

export const DonationService = {
  getBrandConfig(methodType: DonationMethodType): PaymentBrandConfig {
    return PAYMENT_BRANDS[methodType] || {
      name: methodType,
      brandColor: '#4b5563',
      badgeBg: '#f3f4f6',
      badgeBorder: '#e5e7eb',
      icon: '💳',
    };
  },

  getAttestationMatrix(verifiedRoles: string[] = []): RoleAttestation[] {
    const upperRoles = verifiedRoles.map((r) => r.toUpperCase());
    return CORE_GOVERNANCE_PILLARS.map((pillar) => ({
      ...pillar,
      isAttested: upperRoles.includes(pillar.roleKey),
    }));
  },

  isPersonalAccount(accountType: DonationAccountType): boolean {
    return accountType === 'PERSONAL';
  },

  getAccountTypeLabel(accountType: DonationAccountType, language: 'bn' | 'en' = 'en'): string {
    const isBn = language === 'bn';
    switch (accountType) {
      case 'MERCHANT':
        return isBn ? 'অফিসিয়াল মার্চেন্ট' : 'Official Merchant';
      case 'PERSONAL':
        return isBn ? 'ব্যক্তিগত নম্বর (সতর্কতা)' : 'Personal Account';
      case 'BANK_ACCOUNT':
        return isBn ? 'অফিসিয়াল ব্যাংক হিসাব' : 'Official Bank Account';
      default:
        return accountType;
    }
  },
};
