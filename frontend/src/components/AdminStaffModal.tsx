'use client';

import React, { useState, useEffect } from 'react';
import { MosqueStaffMember } from '@/types/mosque';
import { addMosqueStaff, updateMosqueStaff, uploadClaimImage } from '@/lib/api';
import { X, User, Briefcase, Phone, Calendar, Upload, Loader2, Check } from 'lucide-react';

interface AdminStaffModalProps {
  isOpen: boolean;
  onClose: () => void;
  mosqueId: string;
  staffMember?: MosqueStaffMember | null; // If provided, edit mode; otherwise, create mode
  onSuccess: (savedStaff: MosqueStaffMember) => void;
}

export const AdminStaffModal: React.FC<AdminStaffModalProps> = ({
  isOpen,
  onClose,
  mosqueId,
  staffMember,
  onSuccess,
}) => {
  const isEdit = Boolean(staffMember);

  const [role, setRole] = useState<string>('IMAM');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [name, setName] = useState('');
  const [contactNumber, setContactNumber] = useState('');
  const [startDate, setStartDate] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [isVerified, setIsVerified] = useState(true);

  const [isUploading, setIsUploading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (staffMember) {
      setRole(staffMember.role || 'IMAM');
      setCustomRoleTitle(staffMember.customRoleTitle || '');
      setName(staffMember.name || '');
      setContactNumber(staffMember.contactNumber || '');
      setStartDate(
        staffMember.startDate
          ? new Date(staffMember.startDate).toISOString().split('T')[0]
          : '',
      );
      setImageUrl(staffMember.imageUrl || '');
      setIsVerified(staffMember.isVerified ?? true);
    } else {
      setRole('IMAM');
      setCustomRoleTitle('');
      setName('');
      setContactNumber('');
      setStartDate('');
      setImageUrl('');
      setIsVerified(true);
    }
    setError(null);
  }, [staffMember, isOpen]);

  if (!isOpen) return null;

  const handleImageFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.size > 5 * 1024 * 1024) {
      setError('Image must be under 5MB');
      return;
    }

    setIsUploading(true);
    setError(null);
    try {
      const res = await uploadClaimImage(file);
      if (res.success && res.url) {
        setImageUrl(res.url);
      } else {
        setError(res.error || 'Failed to upload photo');
      }
    } catch {
      setError('Network error uploading image');
    } finally {
      setIsUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Staff member name is required');
      return;
    }
    if (role === 'CUSTOM' && !customRoleTitle.trim()) {
      setError('Custom role requires a specific title');
      return;
    }

    setIsSaving(true);
    setError(null);

    try {
      if (isEdit && staffMember) {
        const res = await updateMosqueStaff(mosqueId, staffMember.id, {
          name: name.trim(),
          role,
          customRoleTitle: role === 'CUSTOM' ? customRoleTitle.trim() : undefined,
          contactNumber: contactNumber.trim() || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          imageUrl: imageUrl.trim() || undefined,
          isVerified,
        });

        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to update staff member');
        }
      } else {
        const res = await addMosqueStaff(mosqueId, {
          name: name.trim(),
          role,
          customRoleTitle: role === 'CUSTOM' ? customRoleTitle.trim() : undefined,
          contactNumber: contactNumber.trim() || undefined,
          startDate: startDate ? new Date(startDate).toISOString() : undefined,
          imageUrl: imageUrl.trim() || undefined,
        });

        if (res.success && res.data) {
          onSuccess(res.data);
          onClose();
        } else {
          setError(res.error || 'Failed to add staff member');
        }
      }
    } catch {
      setError('Unexpected error occurred. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="staff-modal-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape') onClose();
      }}
    >
      <div className="relative w-full max-w-lg bg-white rounded-xl border border-[#e8e8ea] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8ea] bg-white">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-lg bg-zinc-100 text-[#111114]">
              <Briefcase className="w-5 h-5" />
            </div>
            <div>
              <h2 id="staff-modal-title" className="text-base font-semibold text-[#111114]">
                {isEdit ? 'Edit Committee / Staff Member' : 'Add Committee / Staff Member'}
              </h2>
              <p className="text-xs text-[#6e6e73]">
                {isEdit ? 'Correct details or update appointment' : 'Appoint a verified mosque official'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 max-h-[80vh] overflow-y-auto">
          {error && (
            <div className="p-3 text-xs rounded-lg border border-red-200 bg-red-50 text-red-700">
              {error}
            </div>
          )}

          {/* Role Selection */}
          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Designation / Role <span className="text-red-500">*</span>
            </label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
            >
              <option value="IMAM">Imam</option>
              <option value="MUAZZIN">Muazzin</option>
              <option value="KHATEEB">Khateeb</option>
              <option value="COMMITTEE_PRESIDENT">Committee President</option>
              <option value="COMMITTEE_SECRETARY">Committee General Secretary</option>
              <option value="COMMITTEE_MEMBER">Committee Executive Member</option>
              <option value="MUTAWALLI">Mutawalli (Waqf Trustee)</option>
              <option value="MOSQUE_ADMIN">Mosque Administrator</option>
              <option value="CUSTOM">Custom Role / Other</option>
            </select>
          </div>

          {/* Custom Role Title */}
          {role === 'CUSTOM' && (
            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Custom Designation Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={customRoleTitle}
                onChange={(e) => setCustomRoleTitle(e.target.value)}
                placeholder="e.g. Treasurer, Cashier, Advisory Member"
                className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#111114]"
              />
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Full Name <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <User className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="e.g. Maulana Mufti Abdullah"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#111114]"
              />
            </div>
          </div>

          {/* Contact Phone */}
          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Official Contact Phone
            </label>
            <div className="relative">
              <Phone className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="tel"
                value={contactNumber}
                onChange={(e) => setContactNumber(e.target.value)}
                placeholder="e.g. +8801711223344"
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#111114]"
              />
            </div>
          </div>

          {/* Start Date */}
          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Service / Appointment Start Date
            </label>
            <div className="relative">
              <Calendar className="absolute left-3 top-2.5 w-4 h-4 text-zinc-400" />
              <input
                type="date"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full pl-9 pr-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
              />
            </div>
          </div>

          {/* Photo Upload */}
          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Photo / Avatar
            </label>
            <div className="flex items-center gap-3">
              {imageUrl ? (
                <div className="relative w-12 h-12 rounded-full overflow-hidden border border-[#e8e8ea] bg-zinc-100 flex-shrink-0">
                  <img src={imageUrl} alt={name || 'Photo'} className="w-full h-full object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl('')}
                    className="absolute inset-0 bg-black/40 text-white flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity"
                    title="Remove photo"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <div className="w-12 h-12 rounded-full border border-dashed border-[#e8e8ea] bg-zinc-50 flex items-center justify-center text-zinc-400 flex-shrink-0">
                  <User className="w-6 h-6" />
                </div>
              )}

              <div className="flex-1">
                <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#e8e8ea] bg-white text-[#111114] hover:bg-zinc-50 cursor-pointer transition-colors">
                  {isUploading ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Uploading...</span>
                    </>
                  ) : (
                    <>
                      <Upload className="w-3.5 h-3.5" />
                      <span>Upload Photo</span>
                    </>
                  )}
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageFileChange}
                    className="hidden"
                    disabled={isUploading}
                  />
                </label>
                <p className="text-[11px] text-[#6e6e73] mt-1">JPEG, PNG, or WebP up to 5MB</p>
              </div>
            </div>
          </div>

          {/* Verification Status Toggle for Edit Mode */}
          {isEdit && (
            <div className="pt-2 border-t border-[#e8e8ea]">
              <label className="flex items-center gap-2.5 cursor-pointer">
                <input
                  type="checkbox"
                  checked={isVerified}
                  onChange={(e) => setIsVerified(e.target.checked)}
                  className="w-4 h-4 rounded border-[#e8e8ea] text-[#111114] focus:ring-1 focus:ring-[#111114]"
                />
                <span className="text-xs font-semibold text-[#111114]">
                  Officially Verified Appointment
                </span>
              </label>
              <p className="text-[11px] text-[#6e6e73] ml-6 mt-0.5">
                Verified members appear on the public mosque profile with official badges.
              </p>
            </div>
          )}

          {/* Footer Actions */}
          <div className="pt-4 border-t border-[#e8e8ea] flex items-center justify-end gap-2.5">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 rounded-full transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSaving || isUploading}
              className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-[#111114] text-white hover:bg-zinc-800 disabled:opacity-50 transition-colors"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Saving...</span>
                </>
              ) : (
                <>
                  <Check className="w-3.5 h-3.5" />
                  <span>{isEdit ? 'Save Changes' : 'Appoint Staff'}</span>
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
