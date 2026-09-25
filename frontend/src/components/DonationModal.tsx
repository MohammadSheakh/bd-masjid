'use client';

import React, { useState, useEffect } from 'react';
import { Mosque, MosqueDonationMethod } from '@/types/mosque';
import { fetchMosqueDonations, createMosqueDonation } from '@/lib/api';
import {
  X,
  CreditCard,
  Copy,
  Check,
  Plus,
  ShieldCheck,
  AlertTriangle,
  Building,
  Smartphone,
  CheckCircle2,
} from 'lucide-react';

interface DonationModalProps {
  isOpen: boolean;
  onClose: () => void;
  mosque: Mosque;
  onDonationAdded?: (method: MosqueDonationMethod) => void;
}

export function DonationModal({
  isOpen,
  onClose,
  mosque,
  onDonationAdded,
}: DonationModalProps) {
  const [methods, setMethods] = useState<MosqueDonationMethod[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [showAddForm, setShowAddForm] = useState(false);
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // Form state
  const [methodType, setMethodType] = useState<'BKASH' | 'NAGAD' | 'ROCKET' | 'BANK_TRANSFER'>('BKASH');
  const [accountType, setAccountType] = useState<'MERCHANT' | 'PERSONAL' | 'BANK_ACCOUNT'>('MERCHANT');
  const [accountNumber, setAccountNumber] = useState('');
  const [accountTitle, setAccountTitle] = useState('');
  const [bankName, setBankName] = useState('');
  const [branchName, setBranchName] = useState('');
  const [routingNumber, setRoutingNumber] = useState('');
  const [instructions, setInstructions] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [statusMessage, setStatusMessage] = useState<{
    type: 'success' | 'error';
    text: string;
  } | null>(null);

  useEffect(() => {
    if (isOpen && mosque.id) {
      loadDonations();
    }
  }, [isOpen, mosque.id]);

  const loadDonations = async () => {
    setIsLoading(true);
    try {
      const data = await fetchMosqueDonations(mosque.id);
      setMethods(data);
    } catch {
      setMethods([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!accountNumber.trim()) return;

    setIsSubmitting(true);
    setStatusMessage(null);

    const result = await createMosqueDonation(mosque.id, {
      methodType,
      accountType: methodType === 'BANK_TRANSFER' ? 'BANK_ACCOUNT' : accountType,
      accountNumber: accountNumber.trim(),
      accountTitle: accountTitle.trim() || undefined,
      bankName: methodType === 'BANK_TRANSFER' ? bankName.trim() : undefined,
      branchName: methodType === 'BANK_TRANSFER' ? branchName.trim() : undefined,
      routingNumber: methodType === 'BANK_TRANSFER' ? routingNumber.trim() : undefined,
      instructions: instructions.trim() || undefined,
    });

    setIsSubmitting(false);

    if (result.success && result.data) {
      setStatusMessage({
        type: 'success',
        text: 'Donation destination submitted for verification.',
      });
      setMethods((prev) => [...prev, result.data]);
      if (onDonationAdded) onDonationAdded(result.data);
      setShowAddForm(false);
      setAccountNumber('');
      setAccountTitle('');
      setInstructions('');
    } else {
      setStatusMessage({
        type: 'error',
        text: result.error || 'Failed to submit donation destination.',
      });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg bg-white rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden flex flex-col max-h-[85vh]">
        {/* Header */}
        <div className="p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-white sticky top-0 z-10">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-emerald-50 border border-emerald-200 flex items-center justify-center text-emerald-700">
              <CreditCard className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-bold text-[#111114]">Mosque Donations</h2>
              <p className="text-xs text-[#6e6e73] truncate max-w-[280px]">
                {mosque.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-zinc-100 text-[#6e6e73] transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {/* Security & Verification Banner */}
          <div className="p-3.5 rounded-2xl bg-emerald-50/60 border border-emerald-200/70 flex items-start gap-2.5 text-xs text-emerald-900">
            <ShieldCheck className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5">
              <span className="font-semibold block">Official Mosque Accounts</span>
              <p className="text-[11px] text-emerald-800 leading-relaxed">
                Only verified accounts managed by the mosque committee are listed. Always ensure the account title matches before confirming payment.
              </p>
            </div>
          </div>

          {statusMessage && (
            <div
              className={`p-3 rounded-2xl flex items-center gap-2 text-xs ${
                statusMessage.type === 'success'
                  ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                  : 'bg-rose-50 text-rose-800 border border-rose-200'
              }`}
            >
              {statusMessage.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              ) : (
                <AlertTriangle className="w-4 h-4 text-rose-600" />
              )}
              <span>{statusMessage.text}</span>
            </div>
          )}

          {/* Toggle between viewing and registering */}
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
              Verified Channels ({methods.length})
            </span>
            <button
              onClick={() => setShowAddForm(!showAddForm)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-emerald-700 hover:text-emerald-800 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{showAddForm ? 'View Accounts' : 'Register Account'}</span>
            </button>
          </div>

          {/* Add Account Form */}
          {showAddForm ? (
            <form onSubmit={handleSubmit} className="p-4 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] space-y-3.5">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                    Channel Type *
                  </label>
                  <select
                    value={methodType}
                    onChange={(e) => setMethodType(e.target.value as any)}
                    className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                  >
                    <option value="BKASH">bKash</option>
                    <option value="NAGAD">Nagad</option>
                    <option value="ROCKET">Rocket</option>
                    <option value="BANK_TRANSFER">Bank Transfer</option>
                  </select>
                </div>

                {methodType !== 'BANK_TRANSFER' && (
                  <div>
                    <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                      Account Type *
                    </label>
                    <select
                      value={accountType}
                      onChange={(e) => setAccountType(e.target.value as any)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                    >
                      <option value="MERCHANT">Merchant (Payment)</option>
                      <option value="PERSONAL">Personal (Send Money)</option>
                    </select>
                  </div>
                )}
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                  {methodType === 'BANK_TRANSFER' ? 'Account Number *' : 'Wallet Number *'}
                </label>
                <input
                  type="text"
                  required
                  placeholder={methodType === 'BANK_TRANSFER' ? '2050XXXXXXXXX' : '017XXXXXXXX'}
                  value={accountNumber}
                  onChange={(e) => setAccountNumber(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                />
              </div>

              <div>
                <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                  Official Account Title / Beneficiary *
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Baitul Aman Jame Masjid Fund"
                  value={accountTitle}
                  onChange={(e) => setAccountTitle(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                />
              </div>

              {methodType === 'BANK_TRANSFER' && (
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                      Bank Name
                    </label>
                    <input
                      type="text"
                      placeholder="Islami Bank PLC"
                      value={bankName}
                      onChange={(e) => setBankName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                    />
                  </div>
                  <div>
                    <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                      Branch Name
                    </label>
                    <input
                      type="text"
                      placeholder="Dhanmondi Branch"
                      value={branchName}
                      onChange={(e) => setBranchName(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="text-[11px] font-semibold text-[#111114] block mb-1">
                  Payment Instructions
                </label>
                <input
                  type="text"
                  placeholder="e.g. Use reference: DONATION or Counter: 01"
                  value={instructions}
                  onChange={(e) => setInstructions(e.target.value)}
                  className="w-full px-3.5 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:ring-2 focus:ring-[#111114]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3.5 py-1.5 rounded-full border border-[#e8e8ea] text-xs font-semibold text-[#6e6e73]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="px-4 py-1.5 rounded-full bg-[#111114] text-white text-xs font-semibold hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSubmitting ? 'Registering...' : 'Register Channel'}
                </button>
              </div>
            </form>
          ) : (
            /* Donation Methods List */
            <div className="space-y-3">
              {isLoading ? (
                <div className="p-8 text-center text-xs text-[#6e6e73]">
                  Loading donation accounts...
                </div>
              ) : methods.length === 0 ? (
                <div className="p-8 text-center rounded-2xl bg-[#fafafa] border border-[#e8e8ea] text-xs text-[#6e6e73] space-y-1">
                  <p className="font-semibold text-zinc-700">No verified donation accounts</p>
                  <p className="text-[11px]">
                    Verified committee members or imams can register an account above.
                  </p>
                </div>
              ) : (
                methods.map((method) => (
                  <div
                    key={method.id}
                    className="p-4 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] space-y-2 hover:border-zinc-300 transition-colors"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-2">
                        {method.methodType === 'BANK_TRANSFER' ? (
                          <div className="w-8 h-8 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700">
                            <Building className="w-4 h-4" />
                          </div>
                        ) : (
                          <div className="w-8 h-8 rounded-xl bg-pink-50 border border-pink-200 flex items-center justify-center text-pink-700">
                            <Smartphone className="w-4 h-4" />
                          </div>
                        )}
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="font-bold text-xs text-[#111114]">
                              {method.methodType.replace(/_/g, ' ')}
                            </span>
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                              {method.accountType.replace(/_/g, ' ')}
                            </span>
                          </div>
                          {method.accountTitle && (
                            <span className="text-[11px] font-medium text-emerald-800 block">
                              {method.accountTitle}
                            </span>
                          )}
                        </div>
                      </div>

                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" />
                        Verified
                      </span>
                    </div>

                    {/* Account Number Box */}
                    <div className="flex items-center justify-between p-2.5 rounded-xl bg-white border border-[#e8e8ea]">
                      <div className="font-mono text-sm font-bold text-[#111114] tracking-wider">
                        {method.accountNumber}
                      </div>
                      <button
                        onClick={() => handleCopy(method.accountNumber, method.id)}
                        className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-semibold bg-zinc-100 hover:bg-zinc-200 text-[#111114] transition-colors"
                      >
                        {copiedId === method.id ? (
                          <>
                            <Check className="w-3 h-3 text-emerald-600" />
                            <span className="text-emerald-700">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3 h-3 text-zinc-500" />
                            <span>Copy</span>
                          </>
                        )}
                      </button>
                    </div>

                    {method.bankName && (
                      <div className="text-[11px] text-[#6e6e73]">
                        Bank: <strong className="text-zinc-800">{method.bankName}</strong>{' '}
                        {method.branchName && `(${method.branchName})`}{' '}
                        {method.routingNumber && `| Routing: ${method.routingNumber}`}
                      </div>
                    )}

                    {method.instructions && (
                      <p className="text-[11px] text-[#6e6e73] bg-white p-2 rounded-xl border border-[#f0f0f2]">
                        Note: {method.instructions}
                      </p>
                    )}
                  </div>
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
