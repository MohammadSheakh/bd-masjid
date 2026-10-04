'use client';

import React, { useState, useEffect } from 'react';
import { MosqueStaffMember, MosqueRoleClaim } from '@/types/mosque';
import {
  fetchMosqueStaff,
  fetchMosqueRoleClaims,
  reviewRoleClaim,
  removeMosqueStaff,
  addMosqueStaff,
} from '@/lib/api';
import {
  ShieldCheck,
  UserCheck,
  UserX,
  FileText,
  ExternalLink,
  Plus,
  Clock,
  AlertCircle,
  Check,
  X,
  User,
  Calendar,
  Phone,
  Briefcase,
} from 'lucide-react';

interface MosqueStaffManagerProps {
  mosqueId: string;
  initialStaff?: MosqueStaffMember[];
  onOpenClaimModal?: () => void;
}

export function MosqueStaffManager({
  mosqueId,
  initialStaff = [],
  onOpenClaimModal,
}: MosqueStaffManagerProps) {
  const [staffList, setStaffList] = useState<MosqueStaffMember[]>(initialStaff);
  const [claims, setClaims] = useState<MosqueRoleClaim[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isAdminMode, setIsAdminMode] = useState(false);
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [isProcessing, setIsProcessing] = useState(false);

  // New staff form state
  const [newStaffRole, setNewStaffRole] = useState('IMAM');
  const [newStaffCustomTitle, setNewStaffCustomTitle] = useState('');
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffContact, setNewStaffContact] = useState('');
  const [newStaffStartDate, setNewStaffStartDate] = useState('');

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [fetchedStaff, fetchedClaims] = await Promise.all([
        fetchMosqueStaff(mosqueId),
        fetchMosqueRoleClaims(mosqueId),
      ]);
      if (Array.isArray(fetchedStaff)) {
        setStaffList(fetchedStaff);
      }
      if (Array.isArray(fetchedClaims)) {
        setClaims(fetchedClaims);
        if (fetchedClaims.length > 0) {
          setIsAdminMode(true);
        }
      }
    } catch {
      // Graceful fallback to initial
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [mosqueId]);

  const handleReviewClaim = async (
    claimId: string,
    status: 'APPROVED' | 'REJECTED',
  ) => {
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await reviewRoleClaim(claimId, {
        status,
        resolutionNotes:
          status === 'APPROVED'
            ? 'Approved by Mosque Administration'
            : 'Rejected by Mosque Administration',
      });
      if (res.success) {
        setActionSuccess(
          `Claim ${status === 'APPROVED' ? 'approved' : 'rejected'} successfully.`,
        );
        await loadData();
      } else {
        setActionError(res.error || 'Failed to review claim.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while reviewing claim.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleRemoveStaff = async (staffId: string, staffName: string) => {
    if (
      !confirm(
        `Are you sure you want to remove ${staffName} from the active staff directory?`,
      )
    ) {
      return;
    }
    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await removeMosqueStaff(mosqueId, staffId);
      if (res.success) {
        setActionSuccess(`Removed ${staffName} from staff roster.`);
        await loadData();
      } else {
        setActionError(res.error || 'Failed to remove staff member.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while removing staff.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffName.trim()) return;

    if (newStaffRole === 'CUSTOM' && !newStaffCustomTitle.trim()) {
      setActionError('Please specify a title for the custom role.');
      return;
    }

    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await addMosqueStaff(mosqueId, {
        role: newStaffRole,
        customRoleTitle: newStaffRole === 'CUSTOM' ? newStaffCustomTitle.trim() : undefined,
        name: newStaffName.trim(),
        contactNumber: newStaffContact.trim() || undefined,
        startDate: newStaffStartDate ? new Date(newStaffStartDate).toISOString() : undefined,
      });
      if (res.success) {
        setActionSuccess(`Added ${newStaffName} to staff directory.`);
        setNewStaffName('');
        setNewStaffContact('');
        setNewStaffCustomTitle('');
        setNewStaffStartDate('');
        setShowAddForm(false);
        await loadData();
      } else {
        setActionError(res.error || 'Failed to add staff member.');
      }
    } catch (err: any) {
      setActionError(err.message || 'Error occurred while adding staff.');
    } finally {
      setIsProcessing(false);
    }
  };

  const formatRoleLabel = (role: string, customTitle?: string | null) => {
    switch (role) {
      case 'MOSQUE_ADMIN':
        return 'Mosque Administrator';
      case 'MUTAWALLI':
        return 'Mutawalli';
      case 'CUSTOM':
        return customTitle ? `${customTitle} (Custom)` : 'Custom Official Role';
      case 'IMAM':
        return 'Pesh Imam';
      case 'MUAZZIN':
        return 'Muazzin';
      case 'KHATIB':
        return 'Chief Khatib';
      case 'KHADEM':
        return 'Khadem';
      case 'COMMITTEE_PRESIDENT':
        return 'Committee President (সভাপতি)';
      case 'COMMITTEE_VICE_PRESIDENT':
        return 'Vice President (সহ-সভাপতি)';
      case 'COMMITTEE_SECRETARY':
        return 'General Secretary';
      case 'COMMITTEE_MEMBER':
        return 'Committee Member';
      default:
        return role.replace(/_/g, ' ');
    }
  };

  const pendingClaims = claims.filter((c) => c.status === 'OPEN' || c.status === 'UNDER_REVIEW');

  return (
    <div className="space-y-4">
      {/* Action alerts */}
      {actionSuccess && (
        <div
          role="status"
          aria-live="polite"
          className="p-3 bg-emerald-50 border border-emerald-200 rounded-[10px] text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in"
        >
          <Check className="w-4 h-4 text-emerald-600 shrink-0" aria-hidden="true" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div
          role="alert"
          aria-live="polite"
          className="p-3 bg-rose-50 border border-rose-200 rounded-[10px] text-xs text-rose-800 flex items-center gap-2 animate-in fade-in"
        >
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" aria-hidden="true" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" aria-hidden="true" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
            Verified Personnel & Governance
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onOpenClaimModal && (
            <button
              onClick={onOpenClaimModal}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-3 py-1 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-600"
            >
              + Claim Role
            </button>
          )}
        </div>
      </div>

      {/* Pending Role Claims Review Queue */}
      {isAdminMode && pendingClaims.length > 0 && (
        <div className="p-3.5 sm:p-4 bg-amber-50/50 border border-amber-200/90 rounded-[12px] space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Clock className="w-3.5 h-3.5 text-amber-700" aria-hidden="true" />
              <span>Pending Role Claims ({pendingClaims.length})</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium">
              Review and verify appointments
            </span>
          </div>

          <div className="space-y-3">
            {pendingClaims.map((claim) => {
              const displayName = claim.name || claim.user?.name || 'Applicant';
              const displayPhone = claim.phoneNumber || claim.user?.phoneNumber;
              const displayImage = claim.imageUrl || claim.user?.profileImageUrl;

              return (
                <div
                  key={claim.id}
                  className="p-3.5 bg-white border border-[#e8e8ea] rounded-[10px] text-xs space-y-2.5 shadow-xs"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      {/* Avatar preview */}
                      <div className="w-10 h-10 rounded-full bg-zinc-100 border border-[#e8e8ea] shrink-0 overflow-hidden flex items-center justify-center text-zinc-400">
                        {displayImage ? (
                          <img
                            src={displayImage}
                            alt={displayName}
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <User className="w-5 h-5 text-zinc-400" aria-hidden="true" />
                        )}
                      </div>

                      <div>
                        <span className="font-bold text-[#111114] text-sm block">
                          {displayName}
                        </span>
                        <div className="flex items-center gap-2 flex-wrap mt-0.5">
                          <span className="text-[11px] text-emerald-800 font-semibold bg-emerald-50 px-2 py-0.5 rounded-[6px] border border-emerald-200">
                            {formatRoleLabel(claim.role, claim.customRoleTitle)}
                          </span>
                          {displayPhone && (
                            <span className="text-[10px] text-[#6e6e73] flex items-center gap-1">
                              <Phone className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                              <span>{displayPhone}</span>
                            </span>
                          )}
                        </div>
                        {claim.startDate && (
                          <span className="text-[10px] text-[#6e6e73] flex items-center gap-1 mt-1">
                            <Calendar className="w-3 h-3 text-zinc-400" aria-hidden="true" />
                            <span>Serving since {new Date(claim.startDate).toLocaleDateString()}</span>
                          </span>
                        )}
                      </div>
                    </div>

                    <span className="text-[10px] font-mono text-zinc-400 shrink-0">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-[8px] border border-zinc-100 whitespace-pre-line leading-relaxed">
                    {claim.evidence}
                  </p>

                  {claim.documentUrl && (
                    <a
                      href={claim.documentUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                    >
                      <FileText className="w-3 h-3" aria-hidden="true" />
                      <span>View Supporting Document</span>
                      <ExternalLink className="w-2.5 h-2.5" aria-hidden="true" />
                    </a>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-zinc-100">
                    <button
                      disabled={isProcessing}
                      onClick={() => handleReviewClaim(claim.id, 'REJECTED')}
                      className="px-3.5 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                    >
                      Reject
                    </button>
                    <button
                      disabled={isProcessing}
                      onClick={() => handleReviewClaim(claim.id, 'APPROVED')}
                      className="flex items-center gap-1 px-4 py-1 text-[11px] font-semibold text-white bg-emerald-700 hover:bg-emerald-800 rounded-full transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-emerald-700"
                    >
                      <UserCheck className="w-3 h-3" aria-hidden="true" />
                      <span>Approve Appointment</span>
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Staff Roster List */}
      <div className="divide-y divide-[#e8e8ea] rounded-[12px] border border-[#e8e8ea] bg-[#fafafa] px-3.5 py-1 text-xs">
        {staffList.length > 0 ? (
          staffList.map((staff) => (
            <div
              key={staff.id}
              className="flex items-center justify-between py-2.5 gap-2"
            >
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 rounded-full bg-zinc-100 border border-[#e8e8ea] shrink-0 overflow-hidden flex items-center justify-center text-zinc-400">
                  {staff.imageUrl ? (
                    <img
                      src={staff.imageUrl}
                      alt={staff.name}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <User className="w-4 h-4 text-zinc-400" aria-hidden="true" />
                  )}
                </div>
                <div>
                  <span className="font-semibold text-[#111114] block">
                    {staff.name}
                  </span>
                  <span className="text-[11px] text-[#6e6e73]">
                    {formatRoleLabel(staff.role, staff.customRoleTitle)}
                    {staff.contactNumber && ` · ${staff.contactNumber}`}
                  </span>
                  {staff.startDate && (
                    <span className="text-[10px] text-zinc-400 block">
                      Tenure: since {new Date(staff.startDate).toLocaleDateString()}
                    </span>
                  )}
                </div>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" aria-hidden="true" />
                  Verified
                </span>
                {isAdminMode && (
                  <button
                    onClick={() => handleRemoveStaff(staff.id, staff.name)}
                    disabled={isProcessing}
                    title="Remove staff member"
                    aria-label={`Remove ${staff.name} from staff roster`}
                    className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-rose-500"
                  >
                    <UserX className="w-3.5 h-3.5" aria-hidden="true" />
                  </button>
                )}
              </div>
            </div>
          ))
        ) : (
          <div className="py-4 text-center text-[#6e6e73] text-[11px]">
            No verified personnel listed yet. Use the Claim Role button above to verify official staff.
          </div>
        )}
      </div>

      {/* Add Staff Directly (For Mosque Admin & Mutawalli) */}
      {isAdminMode && (
        <div className="pt-1">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-semibold text-[#111114] hover:text-black flex items-center gap-1.5 py-1 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114] rounded-sm"
            >
              <Plus className="w-3.5 h-3.5" aria-hidden="true" />
              <span>Directly Add Staff Member</span>
            </button>
          ) : (
            <form
              onSubmit={handleAddStaff}
              className="p-3.5 bg-white border border-[#e8e8ea] rounded-[12px] space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111114]">Direct Staff Assignment</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-6 h-6 rounded-full flex items-center justify-center text-zinc-400 hover:text-zinc-600 hover:bg-zinc-100 transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114]"
                  aria-label="Cancel adding staff"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="direct-staff-role" className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Role
                  </label>
                  <select
                    id="direct-staff-role"
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-2.5 py-2 text-[#111114] outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
                  >
                    <option value="IMAM">Imam (Pesh Imam)</option>
                    <option value="MUAZZIN">Muazzin</option>
                    <option value="KHATIB">Chief Khatib</option>
                    <option value="KHADEM">Khadem</option>
                    <option value="COMMITTEE_MEMBER">Committee Executive</option>
                    <option value="CUSTOM">Custom Role...</option>
                  </select>
                </div>
                <div>
                  <label htmlFor="direct-staff-name" className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Full Name
                  </label>
                  <input
                    id="direct-staff-name"
                    type="text"
                    required
                    placeholder="e.g. Mawlana Tariq"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-2.5 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
                  />
                </div>
              </div>

              {newStaffRole === 'CUSTOM' && (
                <div>
                  <label htmlFor="direct-staff-custom-role" className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Custom Role Title *
                  </label>
                  <input
                    id="direct-staff-custom-role"
                    type="text"
                    required
                    placeholder="e.g. Assistant Imam, Treasurer"
                    value={newStaffCustomTitle}
                    onChange={(e) => setNewStaffCustomTitle(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-2.5 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
                  />
                </div>
              )}

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label htmlFor="direct-staff-contact" className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Contact Number (Optional)
                  </label>
                  <input
                    id="direct-staff-contact"
                    type="text"
                    placeholder="017XXXXXXXX"
                    value={newStaffContact}
                    onChange={(e) => setNewStaffContact(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-2.5 py-2 text-[#111114] placeholder:text-[#6e6e73]/60 outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
                  />
                </div>
                <div>
                  <label htmlFor="direct-staff-start-date" className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Tenure Start Date (Optional)
                  </label>
                  <input
                    id="direct-staff-start-date"
                    type="date"
                    value={newStaffStartDate}
                    onChange={(e) => setNewStaffStartDate(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-[10px] px-2.5 py-2 text-[#111114] outline-none focus:bg-white focus:border-[#111114] focus-visible:ring-1 focus-visible:ring-[#111114]"
                  />
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#e8e8ea]">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-[#6e6e73] hover:text-[#111114] hover:bg-[#fafafa] rounded-full transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-[#111114] text-white text-xs font-semibold rounded-full hover:bg-black transition-colors disabled:opacity-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#111114]"
                >
                  {isProcessing ? 'Saving...' : 'Add to Roster'}
                </button>
              </div>
            </form>
          )}
        </div>
      )}
    </div>
  );
}
