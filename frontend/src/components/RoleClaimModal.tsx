'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Mosque } from '@/types/mosque';
import { submitRoleClaim, uploadClaimImage } from '@/lib/api';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Send,
  Upload,
  Camera,
  Trash2,
  Calendar,
  User,
  Phone,
  Briefcase,
  FileText,
  Link as LinkIcon,
  Sparkles,
} from 'lucide-react';

interface RoleClaimModalProps {
  mosque: Mosque | null;
  onClose: () => void;
}

export function RoleClaimModal({ mosque, onClose }: RoleClaimModalProps) {
  if (!mosque) return null;

  const [role, setRole] = useState('IMAM');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [name, setName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [isUploadingImage, setIsUploadingImage] = useState(false);
  const [evidence, setEvidence] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const fileInputRef = useRef<HTMLInputElement>(null);
  const firstInputRef = useRef<HTMLInputElement>(null);

  // Keyboard accessibility: Escape to close and autofocus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const timer = setTimeout(() => {
      firstInputRef.current?.focus();
    }, 50);

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      clearTimeout(timer);
    };
  }, [onClose]);

  // Attempt to autofill applicant name & phone from localStorage if stored
  useEffect(() => {
    try {
      const storedUser = localStorage.getItem('user');
      if (storedUser) {
        const parsed = JSON.parse(storedUser);
        if (parsed.name && !name) setName(parsed.name);
        if (parsed.phoneNumber && !phoneNumber) setPhoneNumber(parsed.phoneNumber);
      }
    } catch {
      // Ignore parsing errors
    }
  }, []);

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.type.startsWith('image/')) {
      setErrorMessage('Please select a valid image file (JPEG, PNG, or WebP).');
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setErrorMessage('Image size exceeds 5MB. Please choose a smaller photo.');
      return;
    }

    setErrorMessage(null);
    setIsUploadingImage(true);

    // Create immediate local preview
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setImagePreview(dataUrl);
      setImageUrl(dataUrl);
    };
    reader.readAsDataURL(file);

    // Also attempt server upload for durable URL if token is present
    try {
      const uploadRes = await uploadClaimImage(file);
      if (uploadRes.success && uploadRes.url) {
        setImageUrl(uploadRes.url);
      }
    } catch {
      // Local dataUrl fallback is already assigned
    } finally {
      setIsUploadingImage(false);
    }
  };

  const handleRemoveImage = () => {
    setImageUrl('');
    setImagePreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage('Please enter your full name (minimum 2 characters).');
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setErrorMessage('Please enter a valid contact phone number.');
      return;
    }

    if (role === 'CUSTOM' && (!customRoleTitle.trim() || customRoleTitle.trim().length < 2)) {
      setErrorMessage('Please enter a specific title for your custom role (e.g. Assistant Imam, Treasurer).');
      return;
    }

    if (!evidence.trim() || evidence.trim().length < 15) {
      setErrorMessage('Please provide at least 15 characters of evidence or appointment details.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const res = await submitRoleClaim(mosque.id, {
        role,
        customRoleTitle: role === 'CUSTOM' ? customRoleTitle.trim() : undefined,
        name: name.trim(),
        phoneNumber: phoneNumber.trim(),
        startDate: startDate ? new Date(startDate).toISOString() : undefined,
        imageUrl: imageUrl.trim() || undefined,
        evidence: evidence.trim(),
        documentUrl: documentUrl.trim() || undefined,
      });

      if (res.success) {
        setIsSuccess(true);
        setTimeout(() => {
          setIsSuccess(false);
          onClose();
        }, 2500);
      } else {
        setErrorMessage(res.error || 'Failed to submit claim.');
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Network error occurred while submitting claim.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="claim-role-title"
      className="fixed inset-0 z-[9999] flex items-center justify-center p-3 sm:p-4 bg-black/50 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="bg-white w-full max-w-lg rounded-[12px] border border-[#e8e8ea] overflow-hidden flex flex-col max-h-[90vh] shadow-xl">
        {/* Header */}
        <div className="p-4 px-5 border-b border-[#e8e8ea] flex items-center justify-between bg-[#fafafa] shrink-0">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200/80 flex items-center justify-center text-emerald-700">
              <ShieldCheck className="w-4 h-4" aria-hidden="true" />
            </div>
            <div>
              <h2 id="claim-role-title" className="text-sm font-bold text-[#111114]">
                Claim Official Mosque Role
              </h2>
              <p className="text-[11px] text-[#6e6e73] truncate max-w-[240px] sm:max-w-xs">{mosque.name}</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-8 h-8 rounded-full flex items-center justify-center text-[#6e6e73] hover:text-[#111114] hover:bg-[#fafafa] border border-transparent hover:border-[#e8e8ea] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114]"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        {isSuccess ? (
          <div role="status" aria-live="polite" className="p-8 sm:p-10 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-600 flex items-center justify-center mx-auto mb-2 animate-in zoom-in duration-200">
              <CheckCircle2 className="w-6 h-6" aria-hidden="true" />
            </div>
            <h3 className="text-base font-bold text-[#111114]">Role Claim Submitted</h3>
            <p className="text-xs text-[#6e6e73] max-w-sm mx-auto leading-relaxed">
              Your official role claim and verification credentials have been forwarded to the administration queue. Once verified, your badge and official privileges will be activated.
            </p>
            <div className="pt-2">
              <button
                type="button"
                onClick={onClose}
                className="px-5 py-2 rounded-full bg-[#111114] text-white text-xs font-medium hover:bg-black transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]"
              >
                Close Window
              </button>
            </div>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="p-5 space-y-4 overflow-y-auto">
            {/* Guidance banner */}
            <div className="p-3 bg-amber-50/80 border border-amber-200/90 rounded-[10px] text-[11px] text-amber-900 leading-relaxed flex items-start gap-2">
              <Sparkles className="w-4 h-4 text-amber-700 shrink-0 mt-0.5" aria-hidden="true" />
              <span>
                <strong>Official Appointment Verification:</strong> Both Mosque Admins and Mutawallis hold full institutional governance rights. Please provide authentic identity details, contact numbers, and appointment tenure.
              </span>
            </div>

            {errorMessage && (
              <div
                id="claim-error-notice"
                role="alert"
                aria-live="polite"
                className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-xs text-rose-800 flex items-center gap-2 animate-in fade-in"
              >
                <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" aria-hidden="true" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Photo / Avatar Upload Section */}
            <div>
              <label
                htmlFor="claim-photo-input"
                className="block text-xs font-semibold text-[#111114] mb-1.5"
              >
                Official Photo / Portrait Image (Recommended)
              </label>
              <div className="flex items-center gap-4 p-3 bg-[#fafafa] border border-[#e8e8ea] rounded-[10px]">
                <div className="relative w-14 h-14 rounded-full overflow-hidden bg-zinc-100 border border-[#e8e8ea] shrink-0 flex items-center justify-center text-zinc-400">
                  {imagePreview ? (
                    <img
                      src={imagePreview}
                      alt="Applicant portrait preview"
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-6 h-6 text-zinc-400" aria-hidden="true" />
                  )}
                  {isUploadingImage && (
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center text-white text-[10px] font-bold">
                      ...
                    </div>
                  )}
                </div>

                <div className="flex-1 space-y-1.5">
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-white border border-[#e8e8ea] hover:bg-zinc-50 rounded-[10px] text-xs font-semibold text-[#111114] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114]"
                    >
                      <Camera className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
                      <span>{imagePreview ? 'Change Photo' : 'Upload Photo'}</span>
                    </button>
                    {imagePreview && (
                      <button
                        type="button"
                        onClick={handleRemoveImage}
                        className="p-1.5 text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-[10px] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-600"
                        title="Remove photo"
                        aria-label="Remove uploaded photo"
                      >
                        <Trash2 className="w-3.5 h-3.5" aria-hidden="true" />
                      </button>
                    )}
                  </div>
                  <input
                    id="claim-photo-input"
                    ref={fileInputRef}
                    type="file"
                    accept="image/jpeg,image/png,image/webp"
                    onChange={handleImageFileChange}
                    className="sr-only"
                  />
                  <p className="text-[10px] text-[#6e6e73]">
                    Upload a clear portrait photo (JPG, PNG, WebP up to 5MB) for your verified badge.
                  </p>
                </div>
              </div>
            </div>

            {/* Role Selector & Custom Role */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="claim-role-select"
                  className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
                >
                  <Briefcase className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Official Role *</span>
                </label>
                <select
                  id="claim-role-select"
                  value={role}
                  onChange={(e) => setRole(e.target.value)}
                  className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
                >
                  <option value="MOSQUE_ADMIN">Mosque Administrator (Super Admin)</option>
                  <option value="MUTAWALLI">Mutawalli (Trustee & Super Admin)</option>
                  <option value="IMAM">Imam (Pesh Imam / Senior Imam)</option>
                  <option value="MUAZZIN">Muazzin</option>
                  <option value="KHATIB">Chief Khatib</option>
                  <option value="KHADEM">Khadem / Caretaker</option>
                  <option value="COMMITTEE_PRESIDENT">Managing Committee President</option>
                  <option value="COMMITTEE_SECRETARY">General Secretary</option>
                  <option value="COMMITTEE_MEMBER">Committee Executive Member</option>
                  <option value="CUSTOM">Custom Official Role...</option>
                </select>
              </div>

              {role === 'CUSTOM' ? (
                <div className="animate-in fade-in">
                  <label
                    htmlFor="claim-custom-role"
                    className="block text-xs font-semibold text-[#111114] mb-1.5"
                  >
                    Custom Role Title *
                  </label>
                  <input
                    id="claim-custom-role"
                    type="text"
                    required
                    value={customRoleTitle}
                    onChange={(e) => setCustomRoleTitle(e.target.value)}
                    placeholder="e.g. Assistant Imam, Treasurer"
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
                  />
                </div>
              ) : (
                <div>
                  <label
                    htmlFor="claim-start-date"
                    className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
                  >
                    <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                    <span>Serving Since (Starting Date)</span>
                  </label>
                  <input
                    id="claim-start-date"
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
                  />
                </div>
              )}
            </div>

            {/* If custom role is selected, show date picker here */}
            {role === 'CUSTOM' && (
              <div>
                <label
                  htmlFor="claim-start-date-custom"
                  className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
                >
                  <Calendar className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Serving Since (Starting Date)</span>
                </label>
                <input
                  id="claim-start-date-custom"
                  type="date"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
                />
              </div>
            )}

            {/* Personal Details: Full Name & Phone Number */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label
                  htmlFor="claim-full-name"
                  className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
                >
                  <User className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Full Name *</span>
                </label>
                <input
                  id="claim-full-name"
                  ref={firstInputRef}
                  type="text"
                  required
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. Mawlana Hafiz Ahmed"
                  className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
                />
              </div>

              <div>
                <label
                  htmlFor="claim-phone-number"
                  className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
                >
                  <Phone className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                  <span>Contact Phone Number *</span>
                </label>
                <input
                  id="claim-phone-number"
                  type="tel"
                  required
                  value={phoneNumber}
                  onChange={(e) => setPhoneNumber(e.target.value)}
                  placeholder="e.g. 01712345678"
                  className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
                />
              </div>
            </div>

            {/* Supporting Document Link */}
            <div>
              <label
                htmlFor="claim-document-url"
                className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
              >
                <LinkIcon className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Supporting Document / Appointment Link (Optional)</span>
              </label>
              <input
                id="claim-document-url"
                type="url"
                value={documentUrl}
                onChange={(e) => setDocumentUrl(e.target.value)}
                placeholder="https://example.com/appointment-deed.pdf"
                className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-3 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors"
              />
              <span className="text-[10px] text-[#6e6e73] block mt-1">
                Optional cloud link to appointment resolution scan, waqf deed, or certificate.
              </span>
            </div>

            {/* Evidence & Verification Narrative */}
            <div>
              <label
                htmlFor="claim-evidence"
                className="block text-xs font-semibold text-[#111114] mb-1.5 flex items-center gap-1"
              >
                <FileText className="w-3.5 h-3.5 text-zinc-500" aria-hidden="true" />
                <span>Appointment Evidence / Verification Details *</span>
              </label>
              <textarea
                id="claim-evidence"
                rows={3}
                required
                value={evidence}
                onChange={(e) => setEvidence(e.target.value)}
                placeholder="Mention appointment resolution year, committee members who can verify, or local references..."
                className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] p-3 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114] transition-colors resize-none"
              />
              <div className="flex items-center justify-between text-[10px] text-[#6e6e73] mt-1">
                <span>Minimum 15 characters required.</span>
                <span>{evidence.length} / 1000</span>
              </div>
            </div>

            {/* Actions */}
            <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#e8e8ea]">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#111114] hover:bg-[#fafafa] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114]"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="flex items-center gap-1.5 px-5 py-2.5 bg-[#111114] text-white text-xs font-semibold rounded-full hover:bg-black transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114] focus-visible:ring-offset-1"
              >
                <Send className="w-3.5 h-3.5" aria-hidden="true" />
                <span>{isSubmitting ? 'Submitting Claim...' : 'Submit Official Claim'}</span>
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
