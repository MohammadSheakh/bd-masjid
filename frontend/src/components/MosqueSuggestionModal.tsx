'use client';

import React, { useState, useEffect } from 'react';
import { X, Check, AlertCircle, MessageSquarePlus, Shield, Globe } from 'lucide-react';
import { Mosque, SuggestionCategory, SuggestionUrgency, SuggestionVisibility } from '@/types/mosque';
import { submitCommunitySuggestion } from '@/lib/api';

interface MosqueSuggestionModalProps {
  mosque: Mosque | null;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: { label: string; value: SuggestionCategory }[] = [
  { label: 'Suggestion', value: 'SUGGESTION' },
  { label: 'Complaint', value: 'COMPLAINT' },
  { label: 'Improvement', value: 'IMPROVEMENT' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

const URGENCIES: { label: string; value: SuggestionUrgency }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Urgent', value: 'HIGH' },
];

const ROLES: { label: string; value: string }[] = [
  { label: 'Imam', value: 'IMAM' },
  { label: 'Khadem', value: 'KHADEM' },
  { label: 'Muazzin', value: 'MUAZZIN' },
  { label: 'Khatib', value: 'KHATIB' },
  { label: 'Committee', value: 'COMMITTEE' },
  { label: 'General', value: 'GENERAL' },
];

export const MosqueSuggestionModal: React.FC<MosqueSuggestionModalProps> = ({
  mosque,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const [category, setCategory] = useState<SuggestionCategory>('SUGGESTION');
  const [urgency, setUrgency] = useState<SuggestionUrgency>('MEDIUM');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['COMMITTEE']);
  const [visibility, setVisibility] = useState<SuggestionVisibility>('COMMITTEE_ONLY');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen && !isSubmitting) {
        onClose();
      }
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, isSubmitting, onClose]);

  if (!isOpen || !mosque) return null;

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((prev) => {
      const exists = prev.includes(roleValue);
      const next = exists ? prev.filter((r) => r !== roleValue) : [...prev, roleValue];
      // If user selected GENERAL, default visibility to PUBLIC
      if (!exists && roleValue === 'GENERAL') {
        setVisibility('PUBLIC');
      }
      return next.length > 0 ? next : [roleValue];
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (description.trim().length < 10) {
      setErrorMessage('Please provide at least 10 characters describing your feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await submitCommunitySuggestion(mosque.id, {
        type: category,
        urgency,
        visibility,
        targetRoles: selectedRoles,
        submitterName: name.trim() || undefined,
        submitterPhone: phone.trim() || undefined,
        description: description.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err.message || 'Unable to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="suggestion-modal-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200"
    >
      <div className="relative w-full max-w-lg bg-white rounded-3xl border border-[#e8e8ea] shadow-2xl flex flex-col max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-[#fafafa]">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-full bg-zinc-100 text-[#111114] flex items-center justify-center">
              <MessageSquarePlus className="w-4 h-4 text-[#111114]" />
            </div>
            <div>
              <h2 id="suggestion-modal-title" className="text-sm font-bold text-[#111114]">
                Suggest or Complain
              </h2>
              <p className="text-[11px] text-[#6e6e73] truncate max-w-[240px] sm:max-w-xs">
                {mosque.name}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isSubmitting}
            aria-label="Close dialog"
            className="p-1 rounded-full text-[#6e6e73] hover:text-[#111114] hover:bg-[#e8e8ea] transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body / Success Banner */}
        {success ? (
          <div className="p-8 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-700 mx-auto flex items-center justify-center">
              <Check className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-base text-[#111114]">Feedback Submitted</h3>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto">
              {visibility === 'PUBLIC'
                ? 'Your feedback is submitted and will be visible to both the community and mosque leadership.'
                : 'Your feedback has been privately routed directly to mosque committee and leadership.'}
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-4 sm:p-6 overflow-y-auto space-y-4 text-xs">
            {errorMessage && (
              <div
                role="alert"
                className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-700 flex items-start gap-2"
              >
                <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Category selection */}
            <div>
              <label className="block font-semibold text-[#111114] mb-1.5">
                Feedback Type
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-1.5">
                {CATEGORIES.map((c) => (
                  <button
                    key={c.value}
                    type="button"
                    onClick={() => setCategory(c.value)}
                    className={`py-1.5 px-3 rounded-xl text-center font-medium border transition-colors ${
                      category === c.value
                        ? 'bg-[#111114] text-white border-[#111114]'
                        : 'bg-[#fafafa] text-[#6e6e73] border-[#e8e8ea] hover:bg-zinc-100'
                    }`}
                  >
                    {c.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Urgency selection */}
            <div>
              <label className="block font-semibold text-[#111114] mb-1.5">
                Urgency Level
              </label>
              <div className="grid grid-cols-3 gap-1.5">
                {URGENCIES.map((u) => (
                  <button
                    key={u.value}
                    type="button"
                    onClick={() => setUrgency(u.value)}
                    className={`py-1.5 px-3 rounded-xl text-center font-medium border transition-colors ${
                      urgency === u.value
                        ? u.value === 'HIGH'
                          ? 'bg-rose-600 text-white border-rose-600'
                          : 'bg-[#111114] text-white border-[#111114]'
                        : 'bg-[#fafafa] text-[#6e6e73] border-[#e8e8ea] hover:bg-zinc-100'
                    }`}
                  >
                    {u.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Target Role multi-selection */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <label className="font-semibold text-[#111114]">
                  Target Recipient(s)
                </label>
                <span className="text-[10px] text-[#6e6e73]">Select one or multiple</span>
              </div>
              <div className="flex flex-wrap gap-1.5">
                {ROLES.map((r) => {
                  const selected = selectedRoles.includes(r.value);
                  return (
                    <button
                      key={r.value}
                      type="button"
                      onClick={() => toggleRole(r.value)}
                      className={`py-1 px-3 rounded-full text-xs font-medium border transition-colors ${
                        selected
                          ? 'bg-[#111114] text-white border-[#111114]'
                          : 'bg-[#fafafa] text-[#6e6e73] border-[#e8e8ea] hover:bg-zinc-100'
                      }`}
                    >
                      {r.label}
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Visibility selection */}
            <div>
              <label className="block font-semibold text-[#111114] mb-1.5">
                Visibility & Audience
              </label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => setVisibility('COMMITTEE_ONLY')}
                  className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-colors ${
                    visibility === 'COMMITTEE_ONLY'
                      ? 'bg-zinc-100 border-[#111114] text-[#111114]'
                      : 'bg-white border-[#e8e8ea] text-[#6e6e73] hover:bg-zinc-50'
                  }`}
                >
                  <Shield className="w-4 h-4 shrink-0 mt-0.5 text-zinc-700" />
                  <div>
                    <div className="font-semibold text-[#111114]">Committee Only</div>
                    <div className="text-[10px] leading-tight text-[#6e6e73]">
                      Private feedback for mosque administration
                    </div>
                  </div>
                </button>

                <button
                  type="button"
                  onClick={() => setVisibility('PUBLIC')}
                  className={`p-2.5 rounded-2xl border text-left flex items-start gap-2 transition-colors ${
                    visibility === 'PUBLIC'
                      ? 'bg-zinc-100 border-[#111114] text-[#111114]'
                      : 'bg-white border-[#e8e8ea] text-[#6e6e73] hover:bg-zinc-50'
                  }`}
                >
                  <Globe className="w-4 h-4 shrink-0 mt-0.5 text-zinc-700" />
                  <div>
                    <div className="font-semibold text-[#111114]">Public</div>
                    <div className="text-[10px] leading-tight text-[#6e6e73]">
                      Visible to committee & general visitors
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Submitter details (Optional) */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              <div>
                <label htmlFor="submitter-name" className="block font-semibold text-[#111114] mb-1">
                  Your Name <span className="text-[10px] font-normal text-[#6e6e73]">(Optional)</span>
                </label>
                <input
                  id="submitter-name"
                  type="text"
                  maxLength={100}
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mohammad"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e8ea] text-[#111114] placeholder-[#6e6e73] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                />
              </div>

              <div>
                <label htmlFor="submitter-phone" className="block font-semibold text-[#111114] mb-1">
                  Phone Number <span className="text-[10px] font-normal text-[#6e6e73]">(Optional)</span>
                </label>
                <input
                  id="submitter-phone"
                  type="tel"
                  maxLength={30}
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="e.g. 01700000000"
                  className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e8ea] text-[#111114] placeholder-[#6e6e73] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                />
              </div>
            </div>

            {/* Details Description */}
            <div>
              <div className="flex items-center justify-between mb-1">
                <label htmlFor="suggestion-details" className="font-semibold text-[#111114]">
                  Details
                </label>
                <span className="text-[10px] text-[#6e6e73]">
                  {description.length} / 2000
                </span>
              </div>
              <textarea
                id="suggestion-details"
                rows={4}
                maxLength={2000}
                required
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write detailed suggestion, complaint, or feedback..."
                className="w-full px-3 py-2 rounded-xl bg-white border border-[#e8e8ea] text-[#111114] placeholder-[#6e6e73] focus:outline-none focus:ring-1 focus:ring-[#111114] resize-none"
              />
            </div>

            {/* Form Footer */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e8e8ea]">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="px-4 py-2 rounded-full font-medium text-xs text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-full bg-[#111114] text-white hover:bg-black font-medium text-xs transition-colors disabled:opacity-50"
              >
                {isSubmitting ? 'Submitting...' : 'Submit Feedback'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
};
