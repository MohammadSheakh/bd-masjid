'use client';

import React, { useState, useEffect } from 'react';
import { Mosque, MosqueStaffMember, MosqueFacility } from '@/types/mosque';
import {
  fetchMosqueById,
  fetchMosqueStaff,
  removeMosqueStaff,
  updateMosqueDetails,
  deleteMosque,
  getApiBase,
} from '@/lib/api';
import { AdminStaffModal } from './AdminStaffModal';
import { EditFacilitiesModal } from './EditFacilitiesModal';
import {
  X,
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  MapPin,
  Users,
  Sparkles,
  Calendar,
  AlertTriangle,
  Edit2,
  Trash2,
  Plus,
  Phone,
  Compass,
  ExternalLink,
  Loader2,
  Check,
  Info,
  DollarSign,
  AlertCircle,
  FileText,
} from 'lucide-react';
import { formatTo12Hour } from '@/lib/time';

interface ReportItem {
  id: string;
  mosqueId: string;
  type: string;
  description: string;
  contactEmail: string | null;
  status: string;
  resolutionNotes?: string | null;
  createdAt: string;
}

interface AdminMosqueInspectionModalProps {
  isOpen: boolean;
  onClose: () => void;
  mosqueId: string | null;
  initialTab?: 'overview' | 'staff' | 'facilities' | 'schedule' | 'reports';
  onMosqueUpdated?: (updated: Mosque) => void;
  onMosqueDeleted?: (deletedId: string) => void;
}

export const AdminMosqueInspectionModal: React.FC<AdminMosqueInspectionModalProps> = ({
  isOpen,
  onClose,
  mosqueId,
  initialTab = 'overview',
  onMosqueUpdated,
  onMosqueDeleted,
}) => {
  const [activeTab, setActiveTab] = useState<'overview' | 'staff' | 'facilities' | 'schedule' | 'reports'>('overview');
  const [mosque, setMosque] = useState<Mosque | null>(null);
  const [staffList, setStaffList] = useState<MosqueStaffMember[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Sub-modal states
  const [isStaffModalOpen, setIsStaffModalOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<MosqueStaffMember | null>(null);

  const [isFacilitiesModalOpen, setIsFacilitiesModalOpen] = useState(false);

  const [isEditProfileOpen, setIsEditProfileOpen] = useState(false);
  const [editName, setEditName] = useState('');
  const [editAddress, setEditAddress] = useState('');
  const [editLandmark, setEditLandmark] = useState('');
  const [editCity, setEditCity] = useState('');
  const [editLatitude, setEditLatitude] = useState('');
  const [editLongitude, setEditLongitude] = useState('');
  const [editCapacity, setEditCapacity] = useState('');
  const [editOperationalStatus, setEditOperationalStatus] = useState('OPEN');
  const [editVerificationStatus, setEditVerificationStatus] = useState('VERIFIED');
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isDeletingMosque, setIsDeletingMosque] = useState(false);

  const [deletingStaffId, setDeletingStaffId] = useState<string | null>(null);

  // Report resolution inline state
  const [resolvingReportId, setResolvingReportId] = useState<string | null>(null);
  const [resolutionNotes, setResolutionNotes] = useState('');
  const [isSubmittingReportResolution, setIsSubmittingReportResolution] = useState(false);

  const API_BASE = getApiBase();

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    if (initialTab) {
      setActiveTab(initialTab);
    }
  }, [initialTab, isOpen]);

  useEffect(() => {
    if (isOpen && mosqueId) {
      loadAllMosqueDetails();
    } else {
      setMosque(null);
      setStaffList([]);
      setReports([]);
      setStatusMessage(null);
      setErrorMessage(null);
    }
  }, [isOpen, mosqueId]);

  const loadAllMosqueDetails = async () => {
    if (!mosqueId) return;
    setIsLoading(true);
    setStatusMessage(null);
    setErrorMessage(null);

    try {
      const [mosqueData, staffData] = await Promise.all([
        fetchMosqueById(mosqueId),
        fetchMosqueStaff(mosqueId),
      ]);

      if (mosqueData) {
        setMosque(mosqueData);
        setEditName(mosqueData.name || '');
        setEditAddress(mosqueData.address || '');
        setEditLandmark(mosqueData.landmark || '');
        setEditCity(mosqueData.city || 'Dhaka');
        setEditLatitude(String(mosqueData.latitude ?? ''));
        setEditLongitude(String(mosqueData.longitude ?? ''));
        setEditCapacity(mosqueData.capacity ? String(mosqueData.capacity) : '');
        setEditOperationalStatus(mosqueData.operationalStatus || 'OPEN');
        setEditVerificationStatus(mosqueData.verificationStatus || 'VERIFIED');
      }

      if (Array.isArray(staffData)) {
        setStaffList(staffData);
      }

      // Fetch reports for this mosque
      const repRes = await fetch(`${API_BASE}/admin/reports?mosqueId=${mosqueId}`, {
        headers: getAuthHeaders(),
      }).catch(() => null);

      if (repRes && repRes.ok) {
        const repJson = await repRes.json();
        setReports(repJson.data?.items || repJson.items || []);
      }
    } catch {
      setErrorMessage('Failed to load full mosque profile');
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen) return null;

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!mosqueId) return;

    setIsSavingProfile(true);
    setErrorMessage(null);
    try {
      const payload: any = {
        name: editName.trim(),
        address: editAddress.trim() || null,
        landmark: editLandmark.trim() || null,
        city: editCity.trim(),
        operationalStatus: editOperationalStatus,
        verificationStatus: editVerificationStatus,
      };

      if (editLatitude && editLongitude) {
        payload.latitude = parseFloat(editLatitude);
        payload.longitude = parseFloat(editLongitude);
      }
      if (editCapacity) {
        payload.capacity = parseInt(editCapacity, 10);
      }

      const res = await updateMosqueDetails(mosqueId, payload);
      if (res.success && res.data) {
        setMosque((prev) => (prev ? { ...prev, ...res.data } : res.data));
        if (onMosqueUpdated) onMosqueUpdated(res.data);
        setIsEditProfileOpen(false);
        setStatusMessage('Mosque profile details updated successfully.');
      } else {
        setErrorMessage(res.error || 'Failed to update mosque');
      }
    } catch {
      setErrorMessage('Network error updating profile');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const handleDeleteMosque = async () => {
    if (!mosqueId) return;
    setIsDeletingMosque(true);
    setErrorMessage(null);
    try {
      const res = await deleteMosque(mosqueId);
      if (res.success) {
        if (onMosqueDeleted) onMosqueDeleted(mosqueId);
        setIsDeleteConfirmOpen(false);
        onClose();
      } else {
        setErrorMessage(res.error || 'Failed to delete mosque');
      }
    } catch {
      setErrorMessage('Network error deleting mosque');
    } finally {
      setIsDeletingMosque(false);
    }
  };

  const handleDeleteStaff = async (staffId: string) => {
    if (!mosqueId) return;
    setDeletingStaffId(staffId);
    setErrorMessage(null);
    try {
      const res = await removeMosqueStaff(mosqueId, staffId);
      if (res.success) {
        setStaffList((prev) => prev.filter((s) => s.id !== staffId));
        setStatusMessage('Staff member removed successfully.');
      } else {
        setErrorMessage(res.error || 'Failed to remove staff member');
      }
    } catch {
      setErrorMessage('Network error removing staff member');
    } finally {
      setDeletingStaffId(null);
    }
  };

  const handleResolveReport = async (reportId: string, status: 'RESOLVED' | 'REJECTED') => {
    setIsSubmittingReportResolution(true);
    setErrorMessage(null);
    try {
      const res = await fetch(`${API_BASE}/admin/reports/${reportId}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          ...getAuthHeaders(),
        },
        body: JSON.stringify({
          status,
          resolutionNotes: resolutionNotes.trim() || 'Reviewed and corrected by administrator',
        }),
      });

      if (res.ok) {
        setReports((prev) =>
          prev.map((r) =>
            r.id === reportId
              ? { ...r, status, resolutionNotes: resolutionNotes.trim() || 'Reviewed and corrected' }
              : r,
          ),
        );
        setResolvingReportId(null);
        setResolutionNotes('');
        setStatusMessage(`Report ${status.toLowerCase()} successfully.`);
      } else {
        const err = await res.json().catch(() => ({}));
        setErrorMessage(err.message || 'Failed to resolve report');
      }
    } catch {
      setErrorMessage('Network error updating report');
    } finally {
      setIsSubmittingReportResolution(false);
    }
  };

  const openReportsCount = reports.filter((r) => r.status === 'OPEN').length;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/50"
      role="dialog"
      aria-modal="true"
      aria-labelledby="mosque-detail-title"
      onKeyDown={(e) => {
        if (e.key === 'Escape' && !isStaffModalOpen && !isFacilitiesModalOpen && !isEditProfileOpen && !isDeleteConfirmOpen) {
          onClose();
        }
      }}
    >
      <div className="relative w-full max-w-4xl bg-white rounded-xl border border-[#e8e8ea] flex flex-col max-h-[92vh] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#e8e8ea] bg-white flex items-center justify-between gap-4">
          <div className="flex items-center gap-3 min-w-0">
            <div className="p-2 rounded-lg bg-zinc-100 text-[#111114] flex-shrink-0">
              <Compass className="w-5 h-5" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2 flex-wrap">
                <h2 id="mosque-detail-title" className="text-base font-bold text-[#111114] truncate">
                  {mosque ? mosque.name : 'Loading Mosque...'}
                </h2>
                {mosque && (
                  <span
                    className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      mosque.verificationStatus === 'VERIFIED'
                        ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                        : mosque.verificationStatus === 'REJECTED'
                        ? 'bg-red-50 text-red-800 border border-red-200'
                        : 'bg-amber-50 text-amber-800 border border-amber-200'
                    }`}
                  >
                    {mosque.verificationStatus === 'VERIFIED' && <CheckCircle2 className="w-3 h-3" />}
                    {mosque.verificationStatus === 'REJECTED' && <XCircle className="w-3 h-3" />}
                    {mosque.verificationStatus !== 'VERIFIED' && mosque.verificationStatus !== 'REJECTED' && (
                      <Clock className="w-3 h-3" />
                    )}
                    <span>{mosque.verificationStatus || 'UNVERIFIED'}</span>
                  </span>
                )}
                {mosque && (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-zinc-100 text-[#6e6e73] font-medium">
                    {mosque.operationalStatus || 'OPEN'}
                  </span>
                )}
              </div>
              <p className="text-xs text-[#6e6e73] truncate flex items-center gap-1 mt-0.5">
                <MapPin className="w-3 h-3 flex-shrink-0" />
                <span>{mosque ? `${mosque.address || 'Address unlisted'}, ${mosque.city || 'Bangladesh'}` : '...'}</span>
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={() => setIsEditProfileOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#e8e8ea] text-[#111114] hover:bg-zinc-100 transition-colors"
              title="Edit core mosque info"
            >
              <Edit2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Edit Info</span>
            </button>

            <button
              onClick={() => setIsDeleteConfirmOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-red-200 text-red-700 hover:bg-red-50 transition-colors"
              title="Soft-delete mosque"
            >
              <Trash2 className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Delete</span>
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Global Alerts / Messages */}
        {statusMessage && (
          <div className="px-6 py-2 bg-emerald-50 border-b border-emerald-100 text-xs text-emerald-800 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-600 hover:text-emerald-900 font-bold ml-2">×</button>
          </div>
        )}
        {errorMessage && (
          <div className="px-6 py-2 bg-red-50 border-b border-red-100 text-xs text-red-700 flex items-center justify-between">
            <span>{errorMessage}</span>
            <button onClick={() => setErrorMessage(null)} className="text-red-500 hover:text-red-800 font-bold ml-2">×</button>
          </div>
        )}

        {/* Tabs Navigation */}
        <div className="px-6 border-b border-[#e8e8ea] bg-white flex items-center gap-1 overflow-x-auto">
          <button
            onClick={() => setActiveTab('overview')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'overview'
                ? 'border-[#111114] text-[#111114]'
                : 'border-transparent text-[#6e6e73] hover:text-[#111114]'
            }`}
          >
            <Info className="w-3.5 h-3.5" />
            <span>Overview & Profile</span>
          </button>

          <button
            onClick={() => setActiveTab('staff')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'staff'
                ? 'border-[#111114] text-[#111114]'
                : 'border-transparent text-[#6e6e73] hover:text-[#111114]'
            }`}
          >
            <Users className="w-3.5 h-3.5" />
            <span>Committee & Staff ({staffList.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('facilities')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'facilities'
                ? 'border-[#111114] text-[#111114]'
                : 'border-transparent text-[#6e6e73] hover:text-[#111114]'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Facilities & Amenities</span>
          </button>

          <button
            onClick={() => setActiveTab('schedule')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'schedule'
                ? 'border-[#111114] text-[#111114]'
                : 'border-transparent text-[#6e6e73] hover:text-[#111114]'
            }`}
          >
            <Calendar className="w-3.5 h-3.5" />
            <span>Prayer Schedule</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition-colors whitespace-nowrap flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'border-[#111114] text-[#111114]'
                : 'border-transparent text-[#6e6e73] hover:text-[#111114]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              Issue Reports ({reports.length})
              {openReportsCount > 0 && (
                <span className="ml-1.5 px-1.5 py-0.5 rounded-full text-[10px] bg-red-100 text-red-700 font-bold">
                  {openReportsCount} open
                </span>
              )}
            </span>
          </button>
        </div>

        {/* Tab Body */}
        <div className="flex-1 overflow-y-auto p-6 bg-[#fafafa]">
          {isLoading ? (
            <div className="py-20 flex flex-col items-center justify-center text-[#6e6e73] gap-3">
              <Loader2 className="w-7 h-7 animate-spin text-[#111114]" />
              <p className="text-xs">Loading complete mosque record...</p>
            </div>
          ) : !mosque ? (
            <div className="py-20 text-center text-[#6e6e73]">
              <p className="text-sm font-semibold">Mosque details not found</p>
            </div>
          ) : (
            <>
              {/* TAB 1: OVERVIEW */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* Key Metrics Cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <div className="p-3.5 bg-white rounded-xl border border-[#e8e8ea]">
                      <p className="text-[11px] font-semibold text-[#6e6e73]">City / Area</p>
                      <p className="text-sm font-bold text-[#111114] mt-0.5">{mosque.city || 'Bangladesh'}</p>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-[#e8e8ea]">
                      <p className="text-[11px] font-semibold text-[#6e6e73]">Capacity</p>
                      <p className="text-sm font-bold text-[#111114] mt-0.5">
                        {mosque.capacity ? `${mosque.capacity.toLocaleString()} musallis` : 'Unspecified'}
                      </p>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-[#e8e8ea]">
                      <p className="text-[11px] font-semibold text-[#6e6e73]">Staff Enrolled</p>
                      <p className="text-sm font-bold text-[#111114] mt-0.5">{staffList.length} members</p>
                    </div>
                    <div className="p-3.5 bg-white rounded-xl border border-[#e8e8ea]">
                      <p className="text-[11px] font-semibold text-[#6e6e73]">Open Reports</p>
                      <p className={`text-sm font-bold mt-0.5 ${openReportsCount > 0 ? 'text-red-600' : 'text-emerald-700'}`}>
                        {openReportsCount} issues
                      </p>
                    </div>
                  </div>

                  {/* Core Details Grid */}
                  <div className="bg-white rounded-xl border border-[#e8e8ea] p-5 space-y-4">
                    <div className="flex items-center justify-between pb-3 border-b border-[#e8e8ea]">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                        Geographic & Operational Identity
                      </h3>
                      <button
                        onClick={() => setIsEditProfileOpen(true)}
                        className="text-xs font-semibold text-[#111114] hover:underline flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" />
                        <span>Edit Details</span>
                      </button>
                    </div>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                      <div>
                        <span className="text-[#6e6e73] block mb-0.5">Full Name</span>
                        <span className="font-semibold text-[#111114] text-sm">{mosque.name}</span>
                      </div>
                      <div>
                        <span className="text-[#6e6e73] block mb-0.5">Road & Address</span>
                        <span className="font-medium text-[#111114]">{mosque.address || 'Not specified'}</span>
                      </div>
                      <div>
                        <span className="text-[#6e6e73] block mb-0.5">Prominent Landmark</span>
                        <span className="font-medium text-[#111114]">{mosque.landmark || 'None recorded'}</span>
                      </div>
                      <div>
                        <span className="text-[#6e6e73] block mb-0.5">GPS Coordinates</span>
                        <span className="font-mono text-[#111114]">
                          {mosque.latitude.toFixed(5)}, {mosque.longitude.toFixed(5)}
                        </span>
                        <a
                          href={`https://www.google.com/maps?q=${mosque.latitude},${mosque.longitude}`}
                          target="_blank"
                          rel="noreferrer"
                          className="ml-2 inline-flex items-center gap-0.5 text-blue-600 hover:underline"
                        >
                          <ExternalLink className="w-2.5 h-2.5" />
                          <span>View Map</span>
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Quick Verification Governance */}
                  <div className="bg-white rounded-xl border border-[#e8e8ea] p-5 flex items-center justify-between flex-wrap gap-4">
                    <div>
                      <h4 className="text-xs font-bold text-[#111114]">Moderation & Verification State</h4>
                      <p className="text-xs text-[#6e6e73] mt-0.5">
                        Current status is <strong className="text-[#111114]">{mosque.verificationStatus}</strong>. You can change it anytime.
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      {mosque.verificationStatus !== 'VERIFIED' && (
                        <button
                          onClick={() => {
                            updateMosqueDetails(mosque.id, { verificationStatus: 'VERIFIED' }).then(() => {
                              setMosque((prev) => (prev ? { ...prev, verificationStatus: 'VERIFIED' } : null));
                              setStatusMessage('Mosque marked as officially verified.');
                              if (onMosqueUpdated) onMosqueUpdated({ ...mosque, verificationStatus: 'VERIFIED' });
                            });
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-emerald-800 text-white hover:bg-emerald-900 transition-colors flex items-center gap-1.5"
                        >
                          <Check className="w-3.5 h-3.5" />
                          <span>Approve & Verify</span>
                        </button>
                      )}
                      {mosque.verificationStatus !== 'REJECTED' && (
                        <button
                          onClick={() => {
                            updateMosqueDetails(mosque.id, { verificationStatus: 'REJECTED' }).then(() => {
                              setMosque((prev) => (prev ? { ...prev, verificationStatus: 'REJECTED' } : null));
                              setStatusMessage('Mosque rejected.');
                              if (onMosqueUpdated) onMosqueUpdated({ ...mosque, verificationStatus: 'REJECTED' });
                            });
                          }}
                          className="px-3.5 py-1.5 text-xs font-semibold rounded-full border border-red-300 text-red-700 hover:bg-red-50 transition-colors"
                        >
                          Mark Rejected
                        </button>
                      )}
                      {mosque.verificationStatus !== 'UNVERIFIED' && (
                        <button
                          onClick={() => {
                            updateMosqueDetails(mosque.id, { verificationStatus: 'UNVERIFIED' }).then(() => {
                              setMosque((prev) => (prev ? { ...prev, verificationStatus: 'UNVERIFIED' } : null));
                              setStatusMessage('Mosque returned to unverified queue.');
                              if (onMosqueUpdated) onMosqueUpdated({ ...mosque, verificationStatus: 'UNVERIFIED' });
                            });
                          }}
                          className="px-3.5 py-1.5 text-xs font-medium rounded-full border border-[#e8e8ea] text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
                        >
                          Reset to Unverified
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* TAB 2: COMMITTEE & STAFF ROSTER */}
              {activeTab === 'staff' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e8e8ea]">
                    <div>
                      <h3 className="text-xs font-bold text-[#111114]">Official Personnel & Committee Directory</h3>
                      <p className="text-xs text-[#6e6e73]">
                        Manage appointed Imams, Muazzins, Mutawallis, and Executive Committee members.
                      </p>
                    </div>
                    <button
                      onClick={() => {
                        setSelectedStaff(null);
                        setIsStaffModalOpen(true);
                      }}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#111114] text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add Committee Member</span>
                    </button>
                  </div>

                  {staffList.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#e8e8ea]">
                      <Users className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#111114]">No committee or staff members enrolled yet</p>
                      <p className="text-xs text-[#6e6e73] mt-1 mb-4">
                        Add official Imams or committee leaders directly to establish mosque governance.
                      </p>
                      <button
                        onClick={() => {
                          setSelectedStaff(null);
                          setIsStaffModalOpen(true);
                        }}
                        className="px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#111114] text-white hover:bg-zinc-800 transition-colors"
                      >
                        + Add First Member
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                      {staffList.map((member) => (
                        <div
                          key={member.id}
                          className="p-4 bg-white rounded-xl border border-[#e8e8ea] flex items-start justify-between gap-3"
                        >
                          <div className="flex items-start gap-3 min-w-0">
                            {member.imageUrl ? (
                              <img
                                src={member.imageUrl}
                                alt={member.name}
                                className="w-10 h-10 rounded-full object-cover border border-[#e8e8ea] flex-shrink-0"
                              />
                            ) : (
                              <div className="w-10 h-10 rounded-full bg-zinc-100 text-[#6e6e73] flex items-center justify-center font-bold text-xs flex-shrink-0 border border-[#e8e8ea]">
                                {member.name.charAt(0).toUpperCase()}
                              </div>
                            )}

                            <div className="min-w-0">
                              <div className="flex items-center gap-1.5 flex-wrap">
                                <span className="font-semibold text-xs text-[#111114] truncate">{member.name}</span>
                                {member.isVerified && (
                                  <span title="Verified" className="inline-flex items-center">
                                    <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
                                  </span>
                                )}
                              </div>
                              <p className="text-[11px] font-semibold text-[#6e6e73] mt-0.5">
                                {member.role === 'CUSTOM' && member.customRoleTitle
                                  ? member.customRoleTitle
                                  : member.role.replace('_', ' ')}
                              </p>
                              {member.contactNumber && (
                                <p className="text-[11px] text-[#6e6e73] flex items-center gap-1 mt-1">
                                  <Phone className="w-2.5 h-2.5" />
                                  <span>{member.contactNumber}</span>
                                </p>
                              )}
                              {member.startDate && (
                                <p className="text-[10px] text-zinc-400 mt-0.5">
                                  Since {new Date(member.startDate).toLocaleDateString()}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-1 flex-shrink-0">
                            <button
                              onClick={() => {
                                setSelectedStaff(member);
                                setIsStaffModalOpen(true);
                              }}
                              className="p-1.5 rounded-lg text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
                              title="Edit Member"
                            >
                              <Edit2 className="w-3.5 h-3.5" />
                            </button>
                            <button
                              onClick={() => handleDeleteStaff(member.id)}
                              disabled={deletingStaffId === member.id}
                              className="p-1.5 rounded-lg text-red-500 hover:text-red-700 hover:bg-red-50 transition-colors disabled:opacity-50"
                              title="Remove Member"
                            >
                              {deletingStaffId === member.id ? (
                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                              ) : (
                                <Trash2 className="w-3.5 h-3.5" />
                              )}
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* TAB 3: FACILITIES & AMENITIES */}
              {activeTab === 'facilities' && (
                <div className="space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#e8e8ea]">
                    <div>
                      <h3 className="text-xs font-bold text-[#111114]">Facilities & Amenities Taxonomy</h3>
                      <p className="text-xs text-[#6e6e73]">
                        Review verified conveniences, accessibility options, and prayer hall capacity.
                      </p>
                    </div>
                    <button
                      onClick={() => setIsFacilitiesModalOpen(true)}
                      className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold rounded-full bg-[#111114] text-white hover:bg-zinc-800 transition-colors"
                    >
                      <Edit2 className="w-3.5 h-3.5" />
                      <span>Edit Facilities</span>
                    </button>
                  </div>

                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    <FacilityCard
                      label="Wudu Area"
                      available={mosque.hasWuduArea ?? true}
                      subText={mosque.facility?.wuduCapacity ? `${mosque.facility.wuduCapacity} spots` : undefined}
                    />
                    <FacilityCard
                      label="Separate Women Prayer Hall"
                      available={mosque.hasSeparateWomenSpace ?? false}
                      subText={mosque.facility?.femaleCapacity ? `${mosque.facility.femaleCapacity} capacity` : undefined}
                    />
                    <FacilityCard
                      label="Air Conditioning (AC)"
                      available={mosque.hasAirConditioning ?? false}
                    />
                    <FacilityCard
                      label="Parking Facility"
                      available={mosque.hasParking ?? false}
                      subText={mosque.facility?.hasParkingCar ? 'Car & Bike' : mosque.facility?.hasParkingBike ? 'Bike only' : undefined}
                    />
                    <FacilityCard
                      label="Wheelchair Accessibility & Ramp"
                      available={mosque.hasWheelchairAccess ?? false}
                    />
                    <FacilityCard
                      label="Janaza Facility & Equipment"
                      available={mosque.hasJanazaFacility ?? false}
                    />
                    <FacilityCard
                      label="Islamic Library / Maktab"
                      available={mosque.facility?.hasLibraryMaktab ?? false}
                    />
                    <FacilityCard
                      label="Janaza Ritual Service"
                      available={mosque.facility?.hasJanazaService ?? false}
                    />
                    <FacilityCard
                      label="Ceiling / Wall Fans"
                      available={mosque.facility?.hasFan ?? true}
                    />
                  </div>
                </div>
              )}

              {/* TAB 4: PRAYER SCHEDULE */}
              {activeTab === 'schedule' && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-[#e8e8ea]">
                    <h3 className="text-xs font-bold text-[#111114]">Current Prayer Timetable</h3>
                    <p className="text-xs text-[#6e6e73]">
                      Verified Jamaat congregation times observed at this mosque.
                    </p>
                  </div>

                  {mosque.prayerSchedule ? (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      <PrayerCard waqt="Fajr" jamaat={mosque.prayerSchedule.fajrJamaat} start={mosque.prayerSchedule.fajrStart} />
                      <PrayerCard waqt="Zuhr" jamaat={mosque.prayerSchedule.zuhrJamaat} start={mosque.prayerSchedule.zuhrStart} />
                      <PrayerCard waqt="Asr" jamaat={mosque.prayerSchedule.asrJamaat} start={mosque.prayerSchedule.asrStart} />
                      <PrayerCard waqt="Maghrib" jamaat={mosque.prayerSchedule.maghribJamaat} start={mosque.prayerSchedule.maghribStart} />
                      <PrayerCard waqt="Isha" jamaat={mosque.prayerSchedule.ishaJamaat} start={mosque.prayerSchedule.ishaStart} />
                      <PrayerCard waqt="Jumu'ah" jamaat={mosque.prayerSchedule.jumuahJamaat} highlight />
                    </div>
                  ) : (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#e8e8ea] text-[#6e6e73]">
                      <Calendar className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#111114]">No prayer schedule on record</p>
                      <p className="text-xs text-[#6e6e73] mt-1">
                        Prayer timetable has not yet been registered for this mosque.
                      </p>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 5: ISSUE REPORTS */}
              {activeTab === 'reports' && (
                <div className="space-y-4">
                  <div className="pb-2 border-b border-[#e8e8ea]">
                    <h3 className="text-xs font-bold text-[#111114]">Community Feedback & Inaccuracy Reports</h3>
                    <p className="text-xs text-[#6e6e73]">
                      User-filed issues regarding incorrect committee members, prayer times, wrong location, or closed status.
                    </p>
                  </div>

                  {reports.length === 0 ? (
                    <div className="p-8 text-center bg-white rounded-xl border border-dashed border-[#e8e8ea] text-[#6e6e73]">
                      <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto mb-2" />
                      <p className="text-xs font-semibold text-[#111114]">No issue reports recorded</p>
                      <p className="text-xs text-[#6e6e73] mt-1">This mosque currently has a clean report record.</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {reports.map((report) => (
                        <div
                          key={report.id}
                          className="p-4 bg-white rounded-xl border border-[#e8e8ea] space-y-2.5"
                        >
                          <div className="flex items-center justify-between flex-wrap gap-2">
                            <div className="flex items-center gap-2">
                              <span className="px-2 py-0.5 rounded-full text-[11px] font-bold bg-zinc-100 text-[#111114] border border-[#e8e8ea]">
                                {report.type.replace('_', ' ')}
                              </span>
                              <span
                                className={`text-[11px] font-semibold px-2 py-0.5 rounded-full ${
                                  report.status === 'OPEN'
                                    ? 'bg-amber-50 text-amber-800 border border-amber-200'
                                    : report.status === 'RESOLVED'
                                    ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                                    : 'bg-zinc-100 text-[#6e6e73]'
                                }`}
                              >
                                {report.status}
                              </span>
                            </div>
                            <span className="text-[11px] text-[#6e6e73]">
                              {new Date(report.createdAt).toLocaleDateString()}
                            </span>
                          </div>

                          <p className="text-xs text-[#111114] bg-zinc-50 p-2.5 rounded-lg border border-zinc-100">
                            {report.description}
                          </p>

                          {report.contactEmail && (
                            <p className="text-[11px] text-[#6e6e73]">
                              Reported by: <span className="text-[#111114]">{report.contactEmail}</span>
                            </p>
                          )}

                          {report.resolutionNotes && (
                            <p className="text-[11px] text-emerald-800 bg-emerald-50/50 p-2 rounded border border-emerald-100">
                              Resolution notes: {report.resolutionNotes}
                            </p>
                          )}

                          {report.status === 'OPEN' && (
                            <div className="pt-2 border-t border-[#e8e8ea] flex items-center justify-between flex-wrap gap-2">
                              <div className="flex items-center gap-2">
                                <span className="text-[11px] text-[#6e6e73]">Action guidance:</span>
                                {report.type === 'STAFF_INFO' && (
                                  <button
                                    onClick={() => setActiveTab('staff')}
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                  >
                                    Go to Committee Tab to edit/delete staff →
                                  </button>
                                )}
                                {(report.type === 'LOCATION' || report.type === 'CLOSED_MOSQUE' || report.type === 'CONTACT_INFO') && (
                                  <button
                                    onClick={() => setIsEditProfileOpen(true)}
                                    className="text-xs font-semibold text-blue-600 hover:underline"
                                  >
                                    Open Edit Info form to correct details →
                                  </button>
                                )}
                              </div>

                              <div className="flex items-center gap-2">
                                {resolvingReportId === report.id ? (
                                  <div className="flex items-center gap-2 w-full sm:w-auto">
                                    <input
                                      type="text"
                                      value={resolutionNotes}
                                      onChange={(e) => setResolutionNotes(e.target.value)}
                                      placeholder="Correction note (e.g. Updated committee president)"
                                      className="px-2.5 py-1 text-xs rounded-lg border border-[#e8e8ea] bg-white text-[#111114] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#111114]"
                                    />
                                    <button
                                      onClick={() => handleResolveReport(report.id, 'RESOLVED')}
                                      disabled={isSubmittingReportResolution}
                                      className="px-3 py-1 text-xs font-semibold rounded-full bg-emerald-700 text-white hover:bg-emerald-800 disabled:opacity-50 transition-colors"
                                    >
                                      Confirm Resolve
                                    </button>
                                    <button
                                      onClick={() => setResolvingReportId(null)}
                                      className="px-2 py-1 text-xs text-[#6e6e73] hover:text-[#111114]"
                                    >
                                      Cancel
                                    </button>
                                  </div>
                                ) : (
                                  <>
                                    <button
                                      onClick={() => {
                                        setResolvingReportId(report.id);
                                        setResolutionNotes('');
                                      }}
                                      className="px-3 py-1.5 text-xs font-semibold rounded-full bg-[#111114] text-white hover:bg-zinc-800 transition-colors"
                                    >
                                      Resolve Report
                                    </button>
                                    <button
                                      onClick={() => handleResolveReport(report.id, 'REJECTED')}
                                      className="px-3 py-1.5 text-xs font-medium rounded-full border border-[#e8e8ea] text-[#6e6e73] hover:text-black hover:bg-zinc-100 transition-colors"
                                    >
                                      Dismiss
                                    </button>
                                  </>
                                )}
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-3 border-t border-[#e8e8ea] bg-white flex items-center justify-between text-xs text-[#6e6e73]">
          <span>Mosque ID: <span className="font-mono">{mosque?.id || '...'}</span></span>
          <button
            onClick={onClose}
            className="px-4 py-1.5 rounded-full border border-[#e8e8ea] text-[#111114] font-semibold hover:bg-zinc-100 transition-colors"
          >
            Close Inspector
          </button>
        </div>
      </div>

      {/* SUB-MODAL 1: Admin Staff Modal (Add or Edit) */}
      {mosqueId && (
        <AdminStaffModal
          isOpen={isStaffModalOpen}
          onClose={() => setIsStaffModalOpen(false)}
          mosqueId={mosqueId}
          staffMember={selectedStaff}
          onSuccess={(saved) => {
            if (selectedStaff) {
              setStaffList((prev) => prev.map((s) => (s.id === saved.id ? saved : s)));
              setStatusMessage('Staff member updated successfully.');
            } else {
              setStaffList((prev) => [saved, ...prev]);
              setStatusMessage('Staff member added successfully.');
            }
          }}
        />
      )}

      {/* SUB-MODAL 2: Edit Facilities Modal */}
      {mosqueId && (
        <EditFacilitiesModal
          isOpen={isFacilitiesModalOpen}
          onClose={() => setIsFacilitiesModalOpen(false)}
          mosqueId={mosqueId}
          initialData={mosque?.facility}
          onSaved={(updated) => {
            setMosque((prev) => (prev ? { ...prev, facility: updated } : null));
            setIsFacilitiesModalOpen(false);
            setStatusMessage('Mosque facilities updated successfully.');
            if (onMosqueUpdated && mosque) {
              onMosqueUpdated({ ...mosque, facility: updated });
            }
          }}
        />
      )}

      {/* SUB-MODAL 3: Edit Mosque Profile Modal */}
      {isEditProfileOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-lg bg-white rounded-xl border border-[#e8e8ea] overflow-hidden animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#e8e8ea]">
              <h3 className="text-base font-bold text-[#111114]">Edit Mosque Information</h3>
              <button
                onClick={() => setIsEditProfileOpen(false)}
                className="p-1 rounded-full text-[#6e6e73] hover:text-[#111114]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSaveProfile} className="p-6 space-y-3.5 max-h-[75vh] overflow-y-auto">
              <div>
                <label className="block text-xs font-semibold text-[#111114] mb-1">
                  Mosque Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  required
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111114] mb-1">Road / Street Address</label>
                <input
                  type="text"
                  value={editAddress}
                  onChange={(e) => setEditAddress(e.target.value)}
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111114] mb-1">Landmark</label>
                  <input
                    type="text"
                    value={editLandmark}
                    onChange={(e) => setEditLandmark(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111114] mb-1">City / District</label>
                  <input
                    type="text"
                    value={editCity}
                    onChange={(e) => setEditCity(e.target.value)}
                    required
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111114] mb-1">Latitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editLatitude}
                    onChange={(e) => setEditLatitude(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-[#111114] mb-1">Longitude</label>
                  <input
                    type="number"
                    step="any"
                    value={editLongitude}
                    onChange={(e) => setEditLongitude(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-[#111114] mb-1">Operational Status</label>
                  <select
                    value={editOperationalStatus}
                    onChange={(e) => setEditOperationalStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  >
                    <option value="OPEN">OPEN</option>
                    <option value="TEMPORARILY_CLOSED">TEMPORARILY CLOSED</option>
                    <option value="UNDER_CONSTRUCTION">UNDER CONSTRUCTION</option>
                    <option value="PERMANENTLY_CLOSED">PERMANENTLY CLOSED</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-[#111114] mb-1">Verification Status</label>
                  <select
                    value={editVerificationStatus}
                    onChange={(e) => setEditVerificationStatus(e.target.value)}
                    className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  >
                    <option value="VERIFIED">VERIFIED</option>
                    <option value="UNVERIFIED">UNVERIFIED (Pending)</option>
                    <option value="REJECTED">REJECTED</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-[#111114] mb-1">Total Capacity</label>
                <input
                  type="number"
                  value={editCapacity}
                  onChange={(e) => setEditCapacity(e.target.value)}
                  placeholder="e.g. 1000"
                  className="w-full px-3 py-2 text-sm rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                />
              </div>

              <div className="pt-4 border-t border-[#e8e8ea] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsEditProfileOpen(false)}
                  className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#111114] rounded-full"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSavingProfile}
                  className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-[#111114] text-white hover:bg-zinc-800 disabled:opacity-50"
                >
                  {isSavingProfile ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  <span>Save Updates</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* SUB-MODAL 4: Delete Mosque Confirmation */}
      {isDeleteConfirmOpen && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-red-200 p-6 space-y-4">
            <div className="flex items-center gap-3 text-red-600">
              <div className="p-2.5 rounded-full bg-red-100">
                <AlertTriangle className="w-6 h-6" />
              </div>
              <div>
                <h3 className="text-base font-bold text-[#111114]">Delete Mosque Listing</h3>
                <p className="text-xs text-[#6e6e73]">This will soft-delete the mosque record.</p>
              </div>
            </div>

            <p className="text-xs text-[#6e6e73] leading-relaxed">
              Are you sure you want to delete <strong className="text-[#111114]">{mosque?.name}</strong>? It will no longer appear on public discovery, maps, or nearby queries. Historical audit logs will be preserved.
            </p>

            <div className="pt-3 border-t border-[#e8e8ea] flex items-center justify-end gap-2.5">
              <button
                type="button"
                onClick={() => setIsDeleteConfirmOpen(false)}
                className="px-4 py-2 text-xs font-medium text-[#6e6e73] hover:text-[#111114] rounded-full"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDeleteMosque}
                disabled={isDeletingMosque}
                className="flex items-center gap-1.5 px-5 py-2 text-xs font-semibold rounded-full bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
              >
                {isDeletingMosque ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
                <span>Confirm Delete</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

function FacilityCard({ label, available, subText }: { label: string; available: boolean; subText?: string }) {
  return (
    <div className="p-3 bg-white rounded-xl border border-[#e8e8ea] flex items-start gap-2.5">
      <div className={`mt-0.5 p-1 rounded-full ${available ? 'bg-emerald-100 text-emerald-800' : 'bg-zinc-100 text-zinc-400'}`}>
        {available ? <Check className="w-3 h-3 stroke-[3]" /> : <X className="w-3 h-3 stroke-[2]" />}
      </div>
      <div>
        <p className="text-xs font-semibold text-[#111114]">{label}</p>
        <p className="text-[11px] text-[#6e6e73] mt-0.5">{available ? subText || 'Available' : 'Not available'}</p>
      </div>
    </div>
  );
}

function PrayerCard({ waqt, jamaat, start, highlight }: { waqt: string; jamaat?: string | null; start?: string | null; highlight?: boolean }) {
  return (
    <div className={`p-3.5 rounded-xl border ${highlight ? 'bg-zinc-900 text-white border-zinc-900' : 'bg-white text-[#111114] border-[#e8e8ea]'}`}>
      <div className="flex items-center justify-between">
        <p className={`text-xs font-bold ${highlight ? 'text-zinc-300' : 'text-[#6e6e73]'}`}>{waqt}</p>
        {start && (
          <span className={`text-[10px] ${highlight ? 'text-zinc-400' : 'text-[#6e6e73]'}`}>
            Starts {formatTo12Hour(start)}
          </span>
        )}
      </div>
      <p className="text-base font-extrabold mt-1">
        {jamaat ? formatTo12Hour(jamaat) : 'Not specified'}
      </p>
    </div>
  );
}
