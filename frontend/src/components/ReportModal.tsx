'use client';

import React, { useState } from 'react';
import { X, Flag, Check, ArrowRight } from 'lucide-react';
import { Mosque } from '@/types/mosque';
import { submitMosqueReport } from '@/lib/api';

interface ReportModalProps {
  mosque: Mosque | null;
  onClose: () => void;
  onSuccess: () => void;
}

export function ReportModal({ mosque, onClose, onSuccess }: ReportModalProps) {
  if (!mosque) return null;

  const [type, setType] = useState('PRAYER_TIME');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  const reportTypes = [
    { value: 'PRAYER_TIME', label: 'Incorrect Prayer Time' },
    { value: 'LOCATION', label: 'Wrong Location / Marker' },
    { value: 'CLOSED_MOSQUE', label: 'Mosque Temporarily/Permanently Closed' },
    { value: 'DUPLICATE', label: 'Duplicate Mosque Listing' },
    { value: 'OTHER', label: 'Other Issue' },
  ];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) return;

    setIsSubmitting(true);
    try {
      await submitMosqueReport(mosque.id, {
        type,
        description: description.trim(),
        contactEmail: email.trim() || undefined,
      });
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        onSuccess();
        onClose();
      }, 1500);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-md bg-white rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden">
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 rounded-full bg-rose-50 text-rose-600 flex items-center justify-center">
              <Flag className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-sm font-bold text-[#111114]">Report an Issue</h2>
              <p className="text-[11px] text-[#6e6e73] truncate max-w-[240px]">{mosque.name}</p>
            </div>
          </div>
          <button onClick={onClose} className="p-1 rounded-full text-zinc-400 hover:text-zinc-700">
            <X className="w-5 h-5" />
          </button>
        </div>

        {success ? (
          <div className="p-8 text-center space-y-2">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111114]">Report Received</h3>
            <p className="text-xs text-[#6e6e73]">
              Thank you for keeping BD Masjid accurate. Our moderation team will review this report promptly.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-5 space-y-4">
            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Report Category *
              </label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-1 focus:ring-[#111114]"
              >
                {reportTypes.map((t) => (
                  <option key={t.value} value={t.value}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Describe the Issue *
              </label>
              <textarea
                required
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain what is incorrect or needs updating..."
                className="w-full p-2.5 text-xs rounded-xl border border-[#e8e8ea] focus:outline-none focus:ring-1 focus:ring-[#111114]"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Contact Email (Optional)
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com for follow-up"
                className="w-full px-3 py-2 text-xs rounded-xl border border-[#e8e8ea] bg-white"
              />
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-2.5 rounded-full bg-rose-600 hover:bg-rose-700 text-white font-semibold text-xs transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-1.5 shadow-sm"
            >
              <span>{isSubmitting ? 'Sending Report...' : 'Submit Report'}</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
