'use client';

import React, { useState } from 'react';
import { X, AlertOctagon, CheckCircle, Loader2 } from 'lucide-react';
import { reportDonationChannel } from '@/lib/api/donations';

interface ReportDonationModalProps {
  channelId: string | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
}

export const ReportDonationModal: React.FC<ReportDonationModalProps> = ({
  channelId,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [reason, setReason] = useState('SUSPECTED_FRAUD');
  const [description, setDescription] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !channelId) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!description.trim() || description.trim().length < 5) {
      setError('Please provide a detailed description (at least 5 characters).');
      return;
    }

    setSubmitting(true);
    const res = await reportDonationChannel(channelId, {
      reason,
      description: description.trim(),
    });
    setSubmitting(false);

    if (res.success) {
      onSuccess();
      onClose();
    } else {
      setError(res.error || 'Failed to submit report. Please try again.');
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-xl border border-slate-200">
        <div className="flex items-center justify-between pb-3 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <AlertOctagon className="h-5 w-5 text-red-600" />
            <h3 className="text-base font-bold text-slate-900">Report Donation Account</h3>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-600 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <p className="mt-3 text-xs text-slate-600">
          Help protect worshippers by flagging suspected fraud, personal accounts falsely posing as the mosque, or invalid payment numbers.
        </p>

        {error && (
          <div className="mt-3 rounded-lg bg-red-50 p-2.5 text-xs font-medium text-red-800 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="mt-4 space-y-3">
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Reason for Report
            </label>
            <select
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-red-500 focus:outline-none"
            >
              <option value="SUSPECTED_FRAUD">Suspected Fraud / Scam</option>
              <option value="UNAUTHORIZED_ACCOUNT">Unauthorized Personal Account</option>
              <option value="INCORRECT_NUMBER">Incorrect / Inactive Number</option>
              <option value="OTHER">Other Issue</option>
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Description & Evidence <span className="text-red-500">*</span>
            </label>
            <textarea
              rows={3}
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Explain why this account is invalid or fraudulent..."
              required
              className="w-full rounded-lg border border-slate-300 p-2 text-xs font-medium focus:border-red-500 focus:outline-none"
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
              className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-semibold text-white rounded-lg bg-red-600 hover:bg-red-700 disabled:opacity-50"
            >
              {submitting ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <CheckCircle className="h-4 w-4" />
                  <span>Submit Report</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
