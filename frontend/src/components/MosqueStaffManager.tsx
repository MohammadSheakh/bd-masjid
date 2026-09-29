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
  ChevronDown,
  ChevronUp,
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
  const [newStaffName, setNewStaffName] = useState('');
  const [newStaffContact, setNewStaffContact] = useState('');

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

    setIsProcessing(true);
    setActionError(null);
    setActionSuccess(null);
    try {
      const res = await addMosqueStaff(mosqueId, {
        role: newStaffRole,
        name: newStaffName.trim(),
        contactNumber: newStaffContact.trim() || undefined,
      });
      if (res.success) {
        setActionSuccess(`Added ${newStaffName} to staff directory.`);
        setNewStaffName('');
        setNewStaffContact('');
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

  const formatRoleLabel = (role: string) => {
    switch (role) {
      case 'MOSQUE_ADMIN':
        return 'Mosque Administrator (Mutawalli)';
      case 'IMAM':
        return 'Pesh Imam';
      case 'MUAZZIN':
        return 'Muazzin';
      case 'KHATIB':
        return 'Chief Khatib';
      case 'KHADEM':
        return 'Khadem';
      case 'COMMITTEE_PRESIDENT':
        return 'Committee President';
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
        <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-2xl text-xs text-emerald-800 flex items-center gap-2 animate-in fade-in">
          <Check className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>{actionSuccess}</span>
        </div>
      )}
      {actionError && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-2xl text-xs text-rose-800 flex items-center gap-2 animate-in fade-in">
          <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
          <span>{actionError}</span>
        </div>
      )}

      {/* Header & Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 text-emerald-600" />
          <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
            Verified Personnel & Governance
          </h3>
        </div>
        <div className="flex items-center gap-2">
          {onOpenClaimModal && (
            <button
              onClick={onOpenClaimModal}
              className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 hover:bg-emerald-100 border border-emerald-200/80 px-2.5 py-1 rounded-full transition-colors"
            >
              + Claim Role
            </button>
          )}
          {claims.length > 0 && (
            <button
              onClick={() => setIsAdminMode(!isAdminMode)}
              className="text-[11px] font-medium text-[#6e6e73] hover:text-[#111114] bg-[#fafafa] border border-[#e8e8ea] px-2.5 py-1 rounded-full transition-colors flex items-center gap-1"
            >
              <span>{isAdminMode ? 'Hide Admin' : 'Admin View'}</span>
              {pendingClaims.length > 0 && (
                <span className="w-4 h-4 rounded-full bg-amber-500 text-white text-[9px] font-bold flex items-center justify-center">
                  {pendingClaims.length}
                </span>
              )}
            </button>
          )}
        </div>
      </div>

      {/* Pending Role Claims Queue (For Admins) */}
      {isAdminMode && pendingClaims.length > 0 && (
        <div className="p-4 bg-amber-50/60 border border-amber-200 rounded-3xl space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-1.5 text-xs font-bold text-amber-900">
              <Clock className="w-3.5 h-3.5 text-amber-700" />
              <span>Pending Role Claims ({pendingClaims.length})</span>
            </div>
            <span className="text-[10px] text-amber-700 font-medium">
              Review and verify appointments
            </span>
          </div>

          <div className="space-y-2.5">
            {pendingClaims.map((claim) => (
              <div
                key={claim.id}
                className="p-3 bg-white border border-amber-200/80 rounded-2xl text-xs space-y-2 shadow-sm"
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <span className="font-bold text-[#111114] block">
                      {claim.user?.name || 'Applicant'}
                    </span>
                    <span className="text-[11px] text-emerald-700 font-semibold">
                      Claiming: {formatRoleLabel(claim.role)}
                    </span>
                    {claim.user?.phoneNumber && (
                      <span className="text-[10px] text-[#6e6e73] block mt-0.5">
                        Phone: {claim.user.phoneNumber}
                      </span>
                    )}
                  </div>
                  <span className="text-[10px] font-mono text-zinc-400">
                    {new Date(claim.createdAt).toLocaleDateString()}
                  </span>
                </div>

                <p className="text-[11px] text-zinc-600 bg-zinc-50 p-2.5 rounded-xl border border-zinc-100 whitespace-pre-line leading-relaxed">
                  {claim.evidence}
                </p>

                {claim.documentUrl && (
                  <a
                    href={claim.documentUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-600 hover:underline"
                  >
                    <FileText className="w-3 h-3" />
                    <span>View Supporting Document</span>
                    <ExternalLink className="w-2.5 h-2.5" />
                  </a>
                )}

                <div className="flex items-center justify-end gap-2 pt-1">
                  <button
                    disabled={isProcessing}
                    onClick={() => handleReviewClaim(claim.id, 'REJECTED')}
                    className="px-3 py-1 text-[11px] font-semibold text-rose-700 hover:bg-rose-50 border border-rose-200 rounded-lg transition-colors disabled:opacity-50"
                  >
                    Reject
                  </button>
                  <button
                    disabled={isProcessing}
                    onClick={() => handleReviewClaim(claim.id, 'APPROVED')}
                    className="flex items-center gap-1 px-3.5 py-1 text-[11px] font-semibold text-white bg-emerald-600 hover:bg-emerald-700 rounded-lg transition-colors disabled:opacity-50 shadow-sm"
                  >
                    <UserCheck className="w-3 h-3" />
                    <span>Approve Appointment</span>
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Staff Roster List */}
      <div className="divide-y divide-[#e8e8ea] rounded-2xl border border-[#e8e8ea] bg-[#fafafa] px-3.5 py-1 text-xs">
        {staffList.length > 0 ? (
          staffList.map((staff) => (
            <div
              key={staff.id}
              className="flex items-center justify-between py-2.5 gap-2"
            >
              <div>
                <span className="font-semibold text-[#111114] block">
                  {staff.name}
                </span>
                <span className="text-[11px] text-[#6e6e73]">
                  {formatRoleLabel(staff.role)}
                  {staff.contactNumber && ` · ${staff.contactNumber}`}
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Check className="w-2.5 h-2.5" />
                  Verified
                </span>
                {isAdminMode && (
                  <button
                    onClick={() => handleRemoveStaff(staff.id, staff.name)}
                    disabled={isProcessing}
                    title="Remove staff member"
                    className="p-1 text-zinc-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                  >
                    <UserX className="w-3.5 h-3.5" />
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

      {/* Add Staff Directly (For Mosque Admin) */}
      {isAdminMode && (
        <div className="pt-1">
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="text-xs font-semibold text-zinc-700 hover:text-zinc-900 flex items-center gap-1.5 py-1 transition-colors"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Directly Add Staff Member</span>
            </button>
          ) : (
            <form
              onSubmit={handleAddStaff}
              className="p-3.5 bg-white border border-[#e8e8ea] rounded-2xl space-y-3 animate-in fade-in"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-xs font-bold text-[#111114]">Direct Staff Assignment</h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-zinc-400 hover:text-zinc-600"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <div>
                  <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Role
                  </label>
                  <select
                    value={newStaffRole}
                    onChange={(e) => setNewStaffRole(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-xl px-2.5 py-2 outline-none"
                  >
                    <option value="IMAM">Imam (Pesh Imam)</option>
                    <option value="MUAZZIN">Muazzin</option>
                    <option value="KHATIB">Chief Khatib</option>
                    <option value="KHADEM">Khadem</option>
                    <option value="COMMITTEE_MEMBER">Committee Executive</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                    Full Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Mawlana Tariq"
                    value={newStaffName}
                    onChange={(e) => setNewStaffName(e.target.value)}
                    className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-xl px-2.5 py-2 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[11px] font-medium text-[#6e6e73] mb-1">
                  Contact Number (Optional)
                </label>
                <input
                  type="text"
                  placeholder="017XXXXXXXX"
                  value={newStaffContact}
                  onChange={(e) => setNewStaffContact(e.target.value)}
                  className="w-full text-xs bg-[#fafafa] border border-[#e8e8ea] rounded-xl px-2.5 py-2 outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="px-3 py-1.5 text-xs text-[#6e6e73] hover:text-[#111114]"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isProcessing}
                  className="px-4 py-1.5 bg-[#111114] text-white text-xs font-semibold rounded-xl hover:bg-zinc-800 disabled:opacity-50"
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
