'use client';

import React, { useState } from 'react';
import {
  Copy,
  Check,
  ShieldCheck,
  AlertTriangle,
  Building,
  Smartphone,
  Flag,
  CheckCircle2,
  XCircle,
} from 'lucide-react';
import {
  DonationChannelType,
  DonationPurpose,
  MosqueDonationChannel,
} from '@/types/donation';

interface DonationChannelCardProps {
  channel: MosqueDonationChannel;
  isStaff?: boolean;
  onVerify?: (channelId: string) => void;
  onReject?: (channelId: string) => void;
  onReport?: (channelId: string) => void;
}

const CHANNEL_CONFIG: Record<
  DonationChannelType,
  { name: string; bgBadge: string; textBadge: string; borderBadge: string; brandHex: string; isMobile: boolean }
> = {
  BKASH: {
    name: 'bKash',
    bgBadge: 'bg-pink-50',
    textBadge: 'text-pink-700',
    borderBadge: 'border-pink-200',
    brandHex: '#D12053',
    isMobile: true,
  },
  NAGAD: {
    name: 'Nagad',
    bgBadge: 'bg-orange-50',
    textBadge: 'text-orange-700',
    borderBadge: 'border-orange-200',
    brandHex: '#F7941D',
    isMobile: true,
  },
  ROCKET: {
    name: 'Rocket',
    bgBadge: 'bg-purple-50',
    textBadge: 'text-purple-700',
    borderBadge: 'border-purple-200',
    brandHex: '#8C3494',
    isMobile: true,
  },
  UPAY: {
    name: 'Upay',
    bgBadge: 'bg-blue-50',
    textBadge: 'text-blue-700',
    borderBadge: 'border-blue-200',
    brandHex: '#005696',
    isMobile: true,
  },
  BANK_TRANSFER: {
    name: 'Bank Transfer',
    bgBadge: 'bg-emerald-50',
    textBadge: 'text-emerald-700',
    borderBadge: 'border-emerald-200',
    brandHex: '#059669',
    isMobile: false,
  },
};

const PURPOSE_LABELS: Record<DonationPurpose, string> = {
  GENERAL_FUND: 'General Mosque Fund',
  CONSTRUCTION_EXPANSION: 'Building & Expansion',
  ORPHAN_MADRASAH: 'Orphan & Madrasah Fund',
  RAMADAN_IFTAR: 'Ramadan Iftar & Sehri',
  ZAKAT_SADAQAH: 'Zakat & Sadaqah',
  JANAZA_FUND: 'Janaza & Burial Fund',
};

export const DonationChannelCard: React.FC<DonationChannelCardProps> = ({
  channel,
  isStaff,
  onVerify,
  onReject,
  onReport,
}) => {
  const [copied, setCopied] = useState(false);
  const config = CHANNEL_CONFIG[channel.channelType] || {
    name: channel.channelType,
    bgBadge: 'bg-gray-50',
    textBadge: 'text-gray-700',
    borderBadge: 'border-gray-200',
    brandHex: '#4B5563',
    isMobile: false,
  };

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(channel.accountNumber);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Fallback
    }
  };

  const isUnderInvestigation = channel.status === 'FLAGGED' || channel.disputeCount > 0;
  const isPending = channel.status === 'PENDING_VERIFICATION';

  return (
    <div
      className={`relative rounded-xl border p-5 transition-all shadow-sm ${
        isUnderInvestigation
          ? 'bg-amber-50/40 border-amber-300'
          : isPending
          ? 'bg-slate-50/70 border-dashed border-slate-300'
          : 'bg-white border-slate-200 hover:border-emerald-300 hover:shadow-md'
      }`}
    >
      {/* Top Banner for Flagged Channels */}
      {isUnderInvestigation && (
        <div className="mb-3 flex items-center gap-2 rounded-lg bg-amber-100/80 px-3 py-2 text-xs font-semibold text-amber-900 border border-amber-300">
          <AlertTriangle className="h-4 w-4 shrink-0 text-amber-700" />
          <span>Under Investigation: Community members reported suspicious activity on this account.</span>
        </div>
      )}

      {/* Header: Channel Brand & Purpose */}
      <div className="flex flex-wrap items-center justify-between gap-2 mb-3">
        <div className="flex items-center gap-2">
          <span
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold border ${config.bgBadge} ${config.textBadge} ${config.borderBadge}`}
          >
            {config.isMobile ? (
              <Smartphone className="h-3.5 w-3.5" />
            ) : (
              <Building className="h-3.5 w-3.5" />
            )}
            {config.name}
          </span>
          <span className="text-xs font-medium text-slate-500 uppercase tracking-wider">
            {channel.accountType}
          </span>
        </div>

        <span className="inline-block text-xs font-medium bg-slate-100 text-slate-700 px-2.5 py-0.5 rounded-full border border-slate-200">
          {PURPOSE_LABELS[channel.purpose] || channel.purpose}
        </span>
      </div>

      {/* Account Info Box */}
      <div className="rounded-lg bg-slate-50/90 border border-slate-200 p-3 mb-3">
        <div className="text-xs text-slate-500 mb-0.5">Beneficiary / Account Title</div>
        <div className="text-sm font-bold text-slate-800 tracking-tight">
          {channel.accountTitle}
        </div>

        <div className="mt-2 flex items-center justify-between">
          <div>
            <div className="text-xs text-slate-500">Account / Mobile Number</div>
            <div className="text-lg font-mono font-bold text-slate-900 tracking-wide select-all">
              {channel.accountNumber}
            </div>
          </div>

          <button
            onClick={handleCopy}
            className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border transition-all ${
              copied
                ? 'bg-emerald-600 text-white border-emerald-600'
                : 'bg-white text-slate-700 border-slate-300 hover:bg-slate-100'
            }`}
            title="Copy Account Number"
          >
            {copied ? (
              <>
                <Check className="h-3.5 w-3.5 text-white" />
                <span>Copied!</span>
              </>
            ) : (
              <>
                <Copy className="h-3.5 w-3.5 text-slate-600" />
                <span>Copy</span>
              </>
            )}
          </button>
        </div>

        {/* Bank Specific Details */}
        {channel.channelType === 'BANK_TRANSFER' && (
          <div className="mt-3 pt-3 border-t border-slate-200/80 text-xs grid grid-cols-2 gap-2 text-slate-600">
            {channel.bankName && (
              <div>
                <span className="text-slate-400 block">Bank:</span>
                <span className="font-semibold text-slate-800">{channel.bankName}</span>
              </div>
            )}
            {channel.branchName && (
              <div>
                <span className="text-slate-400 block">Branch:</span>
                <span className="font-semibold text-slate-800">{channel.branchName}</span>
              </div>
            )}
            {channel.routingNumber && (
              <div className="col-span-2">
                <span className="text-slate-400 block">Routing Number:</span>
                <span className="font-mono font-semibold text-slate-800">{channel.routingNumber}</span>
              </div>
            )}
          </div>
        )}
      </div>

      {/* Instructions */}
      {channel.paymentInstructions && (
        <p className="text-xs text-slate-600 mb-3 italic">
          &ldquo;{channel.paymentInstructions}&rdquo;
        </p>
      )}

      {/* Verification Provenance & Reporting Footer */}
      <div className="pt-2 border-t border-slate-100 flex flex-wrap items-center justify-between gap-2 text-xs">
        {channel.status === 'VERIFIED' ? (
          <div className="flex items-center gap-1.5 text-emerald-700 font-medium">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>
              Verified {channel.verifiedBy?.name ? `by Imam ${channel.verifiedBy.name}` : 'by Mosque Leadership'}
              {channel.verifiedAt ? ` on ${new Date(channel.verifiedAt).toLocaleDateString()}` : ''}
            </span>
          </div>
        ) : isPending ? (
          <div className="flex items-center gap-1.5 text-amber-700 font-medium">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <span>Pending Independent Imam Verification</span>
          </div>
        ) : (
          <div className="text-slate-500">Status: {channel.status}</div>
        )}

        <div className="flex items-center gap-2">
          {onReport && channel.status === 'VERIFIED' && (
            <button
              onClick={() => onReport(channel.id)}
              className="inline-flex items-center gap-1 text-slate-400 hover:text-red-600 transition-colors"
              title="Report suspicious or incorrect account"
            >
              <Flag className="h-3.5 w-3.5" />
              <span>Report</span>
            </button>
          )}

          {isStaff && isPending && (
            <div className="flex items-center gap-1.5">
              {onVerify && (
                <button
                  onClick={() => onVerify(channel.id)}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-semibold rounded bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Verify</span>
                </button>
              )}
              {onReject && (
                <button
                  onClick={() => onReject(channel.id)}
                  className="inline-flex items-center gap-1 px-2 py-1 text-xs font-semibold rounded border border-slate-300 text-slate-700 hover:bg-slate-100"
                >
                  <XCircle className="h-3.5 w-3.5 text-red-500" />
                  <span>Reject</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
