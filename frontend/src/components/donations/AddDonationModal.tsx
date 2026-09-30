'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, CheckCircle, Loader2 } from 'lucide-react';
import {
  CreateDonationChannelInput,
  DonationChannelAccountType,
  DonationChannelType,
  DonationPurpose,
  MosqueDonationChannel,
} from '@/types/donation';
import { submitMosqueDonationChannel } from '@/lib/api/donations';

interface AddDonationModalProps {
  mosqueId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: (channel: MosqueDonationChannel) => void;
}

export const AddDonationModal: React.FC<AddDonationModalProps> = ({
  mosqueId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [channelType, setChannelType] = useState<DonationChannelType>('BKASH');
  const [accountType, setAccountType] = useState<DonationChannelAccountType>('PERSONAL');
  const [purpose, setPurpose] = useState<DonationPurpose>('GENERAL_FUND');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [paymentInstructions, setPaymentInstructions] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!accountNumber.trim() || !accountTitle.trim()) {
      setError('Account Number and Account Title are required.');
      return;
    }

    if (channelType === 'BANK_TRANSFER' && !bankName.trim()) {
      setError('Bank name is required for bank transfer channels.');
      return;
    }

    setSubmitting(true);
    const input: CreateDonationChannelInput = {
      channelType,
      accountType,
      purpose,
      accountNumber: accountNumber.trim(),
      accountTitle: accountTitle.trim(),
      ...(channelType === 'BANK_TRANSFER'
        ? {
            bankName: bankName.trim(),
            branchName: branchName.trim() || undefined,
            routingNumber: routingNumber.trim() || undefined,
          }
        : {}),
      paymentInstructions: paymentInstructions.trim() || undefined,
    };

    const res = await submitMosqueDonationChannel(mosqueId, input);
    setSubmitting(false);

    if (res.success && res.data) {
      onSuccess(res.data);
      onClose();
    } else {
      setError(res.error || 'Failed to submit donation channel.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4 overflow-y-auto">
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl border border-slate-200 my-8">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div>
            <h3 className="text-lg font-bold text-slate-900">Add Mosque Donation Channel</h3>
            <p className="text-xs text-slate-500">Official collection accounts for musalli contributions</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Two-Person Governance Notice */}
        <div className="mt-4 flex items-start gap-2.5 rounded-xl bg-blue-50/80 p-3 text-xs text-blue-900 border border-blue-200">
          <ShieldAlert className="h-4 w-4 shrink-0 text-blue-700 mt-0.5" />
          <div>
            <span className="font-semibold">Two-Person Verification Required:</span> This account will be created as a draft and hidden until an independent Imam or Mosque Admin verifies the account details.
          </div>
        </div>

        {error && (
          <div className="mt-4 rounded-lg bg-red-50 p-3 text-xs font-medium text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-4">
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Channel Type
              </label>
              <select
                value={channelType}
                onChange={(e) => setChannelType(e.target.value as DonationChannelType)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="BKASH">bKash</option>
                <option value="NAGAD">Nagad</option>
                <option value="ROCKET">Rocket</option>
                <option value="UPAY">Upay</option>
                <option value="BANK_TRANSFER">Bank Transfer</option>
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Account Type
              </label>
              <select
                value={accountType}
                onChange={(e) => setAccountType(e.target.value as DonationChannelAccountType)}
                className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
              >
                <option value="PERSONAL">Personal</option>
                <option value="MERCHANT">Merchant</option>
                <option value="AGENT">Agent</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Designated Fund Purpose
            </label>
            <select
              value={purpose}
              onChange={(e) => setPurpose(e.target.value as DonationPurpose)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
            >
              <option value="GENERAL_FUND">General Mosque Fund</option>
              <option value="CONSTRUCTION_EXPANSION">Mosque Construction & Expansion</option>
              <option value="ORPHAN_MADRASAH">Orphan & Madrasah Fund</option>
              <option value="RAMADAN_IFTAR">Ramadan Iftar & Community Meals</option>
              <option value="ZAKAT_SADAQAH">Zakat & Sadaqah Disbursement</option>
              <option value="JANAZA_FUND">Janaza & Cemetery Care</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Account / Phone Number <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountNumber}
              onChange={(e) => setAccountNumber(e.target.value)}
              placeholder={channelType === 'BANK_TRANSFER' ? 'e.g. 20501234567890' : 'e.g. 01711000000'}
              required
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Beneficiary Name / Account Title <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={accountTitle}
              onChange={(e) => setAccountTitle(e.target.value)}
              placeholder="e.g. Baitul Mukarram Mosque Fund"
              required
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          {channelType === 'BANK_TRANSFER' && (
            <div className="space-y-3 rounded-xl bg-slate-50 p-3 border border-slate-200">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Bank Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={bankName}
                  onChange={(e) => setBankName(e.target.value)}
                  placeholder="e.g. Islami Bank Bangladesh PLC"
                  className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Branch Name
                  </label>
                  <input
                    type="text"
                    value={branchName}
                    onChange={(e) => setBranchName(e.target.value)}
                    placeholder="e.g. Motijheel Branch"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Routing Number
                  </label>
                  <input
                    type="text"
                    value={routingNumber}
                    onChange={(e) => setRoutingNumber(e.target.value)}
                    placeholder="e.g. 125271829"
                    className="w-full rounded-lg border border-slate-300 p-2 text-xs font-mono font-medium focus:border-emerald-500 focus:outline-none"
                  />
                </div>
              </div>
            </div>
          )}

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Payment Instructions / Reference Note
            </label>
            <textarea
              rows={2}
              value={paymentInstructions}
              onChange={(e) => setPaymentInstructions(e.target.value)}
              placeholder="e.g. Use 'Donation' or your name as reference."
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 rounded-lg border border-slate-300 hover:bg-slate-100"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Submit for Verification</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
