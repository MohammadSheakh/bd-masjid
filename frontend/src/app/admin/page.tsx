'use client';

import React, { useState, useEffect, useTransition } from 'react';
import Link from 'next/link';
import {
  ShieldCheck,
  CheckCircle2,
  XCircle,
  Clock,
  Flag,
  AlertTriangle,
  ArrowLeft,
  RefreshCw,
  MapPin,
  ExternalLink,
  Activity,
  Database,
  Server,
  FileText,
  AlertCircle,
  Terminal,
  Key,
  Search,
  Compass,
  ChevronLeft,
  ChevronRight,
  ChevronsLeft,
  ChevronsRight,
  SlidersHorizontal,
  Sparkles,
  Users,
  Check,
  Edit2,
  Trash2,
  X,
  Building2,
  Loader2,
  Eye,
  EyeOff,
  Phone,
  CheckCheck,
} from 'lucide-react';
import { formatTo12Hour } from '@/lib/time';
import { AuthModal } from '@/components/AuthModal';
import { AdminMosqueInspectionModal } from '@/components/AdminMosqueInspectionModal';
import { fetchPaginatedMosques, deleteMosque, updateMosqueDetails, toggleMosqueListing, getApiBase } from '@/lib/api';
import { Mosque } from '@/types/mosque';


interface ReportItem {
  id: string;
  mosqueId: string;
  mosque?: { name: string; city: string | null };
  type: string;
  description: string;
  contactEmail: string | null;
  status: string;
  createdAt: string;
}

interface RoleClaimItem {
  id: string;
  mosqueId: string;
  mosque?: { name: string; city: string | null };
  user?: { name: string; email: string; phoneNumber: string | null };
  role: string;
  customRoleTitle?: string | null;
  name?: string;
  phoneNumber?: string;
  startDate?: string | null;
  imageUrl?: string | null;
  evidence: string;
  documentUrl?: string | null;
  status: string;
  createdAt: string;
}

const ROLE_NAMES_BN: Record<string, string> = {
  IMAM: 'ইমাম (Imam)',
  KHATIB: 'খতিব (Chief Khatib)',
  MUAZZIN: 'মুয়াজ্জিন (Muazzin)',
  KHADEM: 'খাদেম (Khadem)',
  MUTAWALLI: 'মুতাওয়াল্লি (Mutawalli)',
  MOSQUE_ADMIN: 'মসজিদ অ্যাডমিন (Moshjid Admin)',
  COMMITTEE_PRESIDENT: 'কমিটি সভাপতি (President)',
  COMMITTEE_VICE_PRESIDENT: 'সহ-সভাপতি (Vice President)',
  COMMITTEE_SECRETARY: 'সাধারণ সম্পাদক (Secretary)',
  COMMITTEE_MEMBER: 'কমিটি সদস্য (Member)',
  CUSTOM: 'কাস্টম পদবী (Custom)',
};

interface DonationChannelItem {
  id: string;
  mosqueId: string;
  mosque?: { name: string; city: string | null };
  methodType: string;
  accountType: string;
  accountNumber: string;
  accountTitle: string | null;
  bankName: string | null;
  branchName: string | null;
  routingNumber: string | null;
  instructions: string | null;
  isVerified: boolean;
  createdAt: string;
}

interface AuditLogItem {
  id: string;
  action: string;
  entityType: string;
  entityId: string;
  actorId: string | null;
  actorRole: string | null;
  source: string;
  metadata?: any;
  createdAt: string;
}

interface SystemHealthData {
  status: 'healthy' | 'degraded' | 'unhealthy';
  timestamp: string;
  dependencies: {
    database: {
      available: boolean;
      latencyMs: number | null;
      detail?: string;
    };
  };
  system: {
    uptimeSeconds: number;
    memoryUsageMb: number;
    nodeVersion: string;
  };
  metrics?: {
    totalRequests?: number;
    errorCount?: number;
    avgLatencyMs?: number;
  };
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<
    'directory' | 'reports' | 'claims' | 'donations' | 'audit' | 'health'
  >('directory');
  const [isLoading, setIsLoading] = useState(false);

  // Enterprise Directory states
  const [directoryMosques, setDirectoryMosques] = useState<Mosque[]>([]);
  const [page, setPage] = useState<number>(1);
  const [limit, setLimit] = useState<number>(25);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [totalPages, setTotalPages] = useState<number>(1);
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [listingFilter, setListingFilter] = useState<'ALL' | 'LISTED' | 'UNLISTED'>('ALL');
  const [operationalFilter, setOperationalFilter] = useState('ALL');
  const [cityFilter, setCityFilter] = useState('');
  const [jumpPageInput, setJumpPageInput] = useState('');

  // Mosque Inspection Modal states
  const [inspectedMosqueId, setInspectedMosqueId] = useState<string | null>(null);
  const [inspectorTab, setInspectorTab] = useState<'overview' | 'staff' | 'facilities' | 'schedule' | 'reports'>('overview');
  const [isInspectorOpen, setIsInspectorOpen] = useState(false);


  const [reports, setReports] = useState<ReportItem[]>([]);
  const [roleClaims, setRoleClaims] = useState<RoleClaimItem[]>([]);
  const [claimsPage, setClaimsPage] = useState<number>(1);
  const [claimsLimit, setClaimsLimit] = useState<number>(10);
  const [claimsTotal, setClaimsTotal] = useState<number>(0);
  const [claimsTotalPages, setClaimsTotalPages] = useState<number>(1);
  const [claimsJumpPageInput, setClaimsJumpPageInput] = useState('');
  const [isApprovingAll, setIsApprovingAll] = useState(false);
  const [donations, setDonations] = useState<DonationChannelItem[]>([]);
  const [auditLogs, setAuditLogs] = useState<AuditLogItem[]>([]);
  const [healthData, setHealthData] = useState<SystemHealthData | null>(null);
  const [liveProbeStatus, setLiveProbeStatus] = useState<string | null>(null);
  const [readyProbeStatus, setReadyProbeStatus] = useState<string | null>(null);

  // Feedback states
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const [authError, setAuthError] = useState<string | null>(null);
  const [tokenInput, setTokenInput] = useState('');
  const [showTokenPrompt, setShowTokenPrompt] = useState(false);
  const [hasToken, setHasToken] = useState(false);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);

  const API_BASE = getApiBase();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('access_token');
      setHasToken(Boolean(stored));
      if (stored) setTokenInput(stored);
    }
  }, []);

  // Debounce search query
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(1);
    }, 350);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const getAuthHeaders = (): Record<string, string> => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSaveToken = (tokenToSave: string) => {
    if (typeof window !== 'undefined') {
      if (tokenToSave.trim()) {
        localStorage.setItem('access_token', tokenToSave.trim());
        setHasToken(true);
      } else {
        localStorage.removeItem('access_token');
        setHasToken(false);
      }
    }
    setShowTokenPrompt(false);
    loadData();
  };

  const handleAuthSuccess = (_user: any) => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('access_token');
      setHasToken(Boolean(stored));
      if (stored) setTokenInput(stored);
    }
    setIsAuthModalOpen(false);
    loadData();
  };

  useEffect(() => {
    loadData();
  }, [activeTab, page, limit, debouncedSearch, listingFilter, operationalFilter, cityFilter, claimsPage, claimsLimit]);

  const loadData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    setAuthError(null);
    const headers = getAuthHeaders();

    try {
      if (activeTab === 'directory') {
        const res = await fetchPaginatedMosques({
          page,
          limit,
          search: debouncedSearch,
          isListed: listingFilter,
          operationalStatus: operationalFilter,
          city: cityFilter,
        });
        setDirectoryMosques(res.items);
        setTotalCount(res.meta.total);
        setTotalPages(res.meta.totalPages);
      } else if (activeTab === 'reports') {
        const res = await fetch(`${API_BASE}/admin/reports?status=OPEN`, { headers });
        if (res.ok) {
          const json = await res.json();
          setReports(json.data?.items || json.items || []);
        } else if (res.status === 401 || res.status === 403) {
          setAuthError('Authentication required: Admin credentials missing or expired (401/403).');
          setReports([]);
        } else {
          setReports([]);
        }
      } else if (activeTab === 'claims') {
        const res = await fetch(
          `${API_BASE}/admin/role-claims?status=OPEN&page=${claimsPage}&limit=${claimsLimit}`,
          { headers },
        );
        if (res.ok) {
          const json = await res.json();
          const items = json.data?.items || json.items || [];
          const meta = json.data?.meta || json.meta || {};
          setRoleClaims(items);
          setClaimsTotal(meta.total ?? items.length);
          setClaimsTotalPages(meta.totalPages ?? 1);
        } else if (res.status === 401 || res.status === 403) {
          setAuthError('Authentication required: Admin credentials missing or expired (401/403).');
          setRoleClaims([]);
          setClaimsTotal(0);
          setClaimsTotalPages(1);
        } else {
          setRoleClaims([]);
          setClaimsTotal(0);
          setClaimsTotalPages(1);
        }
      } else if (activeTab === 'donations') {
        const res = await fetch(`${API_BASE}/admin/donations`, { headers });
        if (res.ok) {
          const json = await res.json();
          setDonations(json.data || json || []);
        } else if (res.status === 401 || res.status === 403) {
          setAuthError('Authentication required: Admin credentials missing or expired (401/403).');
          setDonations([]);
        } else {
          setDonations([]);
        }
      } else if (activeTab === 'audit') {
        const res = await fetch(`${API_BASE}/admin/audit-logs`, { headers });
        if (res.ok) {
          const json = await res.json();
          setAuditLogs(json.data?.items || json.items || []);
        } else if (res.status === 401 || res.status === 403) {
          setAuthError('Authentication required: Admin credentials missing or expired (401/403).');
          setAuditLogs([]);
        } else {
          setAuditLogs([]);
        }
      } else if (activeTab === 'health') {
        const res = await fetch(`${API_BASE}/admin/operations/health`, { headers });
        if (res.ok) {
          const json = await res.json();
          setHealthData(json.data || json);
        } else if (res.status === 401 || res.status === 403) {
          setAuthError('Authentication required for detailed telemetry (401/403). Querying public probes.');
          const liveRes = await fetch(`${API_BASE}/health/live`).catch(() => null);
          const readyRes = await fetch(`${API_BASE}/health/ready`).catch(() => null);
          setHealthData({
            status: readyRes?.ok ? 'healthy' : liveRes?.ok ? 'degraded' : 'unhealthy',
            timestamp: new Date().toISOString(),
            dependencies: {
              database: {
                available: readyRes?.ok ?? false,
                latencyMs: null,
              },
            },
            system: {
              uptimeSeconds: 0,
              memoryUsageMb: 0,
              nodeVersion: 'Node.js',
            },
          });
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Failed to fetch data';
      setStatusMessage(`Error: ${msg}`);
    } finally {
      setIsLoading(false);
    }
  };

  const handleInspectMosque = (id: string, tab: 'overview' | 'staff' | 'facilities' | 'schedule' | 'reports' = 'overview') => {
    setInspectedMosqueId(id);
    setInspectorTab(tab);
    setIsInspectorOpen(true);
  };

  const handleInspectFromReport = (mosqueId: string, reportType: string) => {
    let targetTab: 'overview' | 'staff' | 'facilities' | 'schedule' | 'reports' = 'overview';
    if (reportType === 'STAFF_INFO') targetTab = 'staff';
    else if (reportType === 'PRAYER_TIME') targetTab = 'schedule';
    else if (reportType === 'LOCATION' || reportType === 'CLOSED_MOSQUE' || reportType === 'CONTACT_INFO') targetTab = 'overview';

    handleInspectMosque(mosqueId, targetTab);
  };

  const handleToggleListing = async (id: string, currentListed: boolean) => {
    let reason: string | undefined;
    if (currentListed) {
      const input = window.prompt(
        'Reason for unlisting this mosque from the public map (e.g. Inaccurate location, under review, closed):',
      );
      if (input === null) return;
      reason = input.trim() || 'Unlisted by administrator';
    }
    try {
      const res = await toggleMosqueListing(id, !currentListed, reason);
      if (res.success) {
        setDirectoryMosques((prev) =>
          prev.map((m) =>
            m.id === id
              ? {
                  ...m,
                  isListed: !currentListed,
                  unlistedReason: !currentListed ? null : reason,
                }
              : m,
          ),
        );
        setStatusMessage(
          !currentListed ? 'Mosque relisted on public map.' : 'Mosque unlisted from public map.',
        );
      } else {
        setStatusMessage(`Error: ${res.error}`);
      }
    } catch {
      setStatusMessage('Network error updating listing status.');
    }
  };

  const handleQuickDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to soft-delete "${name}"?`)) return;
    try {
      const res = await deleteMosque(id);
      if (res.success) {
        setDirectoryMosques((prev) => prev.filter((m) => m.id !== id));
        setTotalCount((prev) => Math.max(0, prev - 1));
        setStatusMessage('Mosque soft-deleted successfully.');
      } else {
        setStatusMessage(`Error: ${res.error}`);
      }
    } catch {
      setStatusMessage('Network error deleting mosque.');
    }
  };

  const handleJumpPage = (e: React.FormEvent) => {
    e.preventDefault();
    const p = parseInt(jumpPageInput, 10);
    if (!isNaN(p) && p >= 1 && p <= totalPages) {
      setPage(p);
      setJumpPageInput('');
    }
  };


  const handleApproveClaim = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/role-claims/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'APPROVED', resolutionNotes: 'Verified official role appointment' }),
      });
      if (res.ok) {
        setRoleClaims((prev) => prev.filter((c) => c.id !== id));
        setClaimsTotal((prev) => Math.max(0, prev - 1));
        setStatusMessage('Role claim approved and verified staff provisioned.');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Error: ${err.message || 'Failed to approve claim.'}`);
      }
    } catch {
      setStatusMessage('Network error: Failed to connect to server.');
    }
  };

  const handleApproveAllClaims = async () => {
    if (roleClaims.length === 0) return;
    const countToApprove = claimsTotal || roleClaims.length;
    const confirmed = window.confirm(
      `Are you sure you want to approve all ${countToApprove} open role claim(s) and appoint them as verified staff?`
    );
    if (!confirmed) return;

    setIsApprovingAll(true);
    setStatusMessage(null);

    try {
      const res = await fetch(`${API_BASE}/admin/role-claims/approve-all`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ resolutionNotes: 'Bulk approved by platform administrator' }),
      });
      if (res.ok) {
        const data = await res.json().catch(() => ({}));
        setStatusMessage(data.message || `Successfully approved ${countToApprove} role claim(s).`);
        await loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Error: ${err.message || 'Failed to bulk approve claims.'}`);
      }
    } catch {
      setStatusMessage('Network error: Failed to connect to server.');
    } finally {
      setIsApprovingAll(false);
    }
  };

  const handleRejectClaim = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/role-claims/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'REJECTED', resolutionNotes: 'Insufficient evidence' }),
      });
      if (res.ok) {
        setRoleClaims((prev) => prev.filter((c) => c.id !== id));
        setClaimsTotal((prev) => Math.max(0, prev - 1));
        setStatusMessage('Role claim rejected.');
        loadData();
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Error: ${err.message || 'Failed to reject claim.'}`);
      }
    } catch {
      setStatusMessage('Network error: Failed to connect to server.');
    }
  };


  const handleDismissReport = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Reviewed and closed by administrator' }),
      });
      if (res.ok) {
        setReports((prev) => prev.filter((r) => r.id !== id));
        setStatusMessage('Report marked resolved.');
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Error: ${err.message || 'Failed to resolve report.'}`);
      }
    } catch {
      setStatusMessage('Network error: Failed to connect to server.');
    }
  };

  const handleVerifyDonation = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/donations/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isVerified: true }),
      });
      if (res.ok) {
        setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, isVerified: true } : d)));
        setStatusMessage('Donation destination verified successfully.');
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Error: ${err.message || 'Failed to verify donation.'}`);
      }
    } catch {
      setStatusMessage('Network error: Failed to connect to server.');
    }
  };

  const handleRevokeDonation = async (id: string) => {
    try {
      const res = await fetch(`${API_BASE}/admin/donations/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json', ...getAuthHeaders() },
        body: JSON.stringify({ isVerified: false }),
      });
      if (res.ok) {
        setDonations((prev) => prev.map((d) => (d.id === id ? { ...d, isVerified: false } : d)));
        setStatusMessage('Donation destination revoked.');
      } else {
        const err = await res.json().catch(() => ({}));
        setStatusMessage(`Error: ${err.message || 'Failed to revoke donation.'}`);
      }
    } catch {
      setStatusMessage('Network error: Failed to connect to server.');
    }
  };

  const startRecord = (page - 1) * limit + 1;
  const endRecord = Math.min(page * limit, totalCount);

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111114]">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8e8ea] px-4 sm:px-8 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-full text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-800" />
            <h1 className="text-base font-bold tracking-tight text-[#111114]">
              BD Masjid Enterprise Admin & Moderation Console
            </h1>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsAuthModalOpen(true)}
            className={`flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border transition-colors ${
              hasToken
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800 hover:bg-emerald-100'
                : 'border-zinc-300 bg-[#111114] text-white hover:bg-zinc-800'
            }`}
          >
            <ShieldCheck className="w-3.5 h-3.5" />
            <span>{hasToken ? 'Admin Active' : 'Sign In as Admin'}</span>
          </button>

          <button
            onClick={() => setShowTokenPrompt(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 text-xs font-medium rounded-full border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 transition-colors"
            title="Manual Token Input"
          >
            <Key className="w-3.5 h-3.5" />
          </button>

          <button
            onClick={loadData}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#e8e8ea] hover:bg-zinc-100 transition-colors"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto p-4 sm:p-6 lg:p-8 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e8e8ea] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('directory')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'directory'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            <Building2 className="w-3.5 h-3.5" />
            <span>All Mosques Directory {totalCount > 0 ? `(${totalCount})` : ''}</span>
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'reports'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            <AlertTriangle className="w-3.5 h-3.5" />
            <span>
              Issue Reports ({reports.length})
              {reports.length > 0 && (
                <span className="ml-1 px-1.5 py-0.2 rounded-full text-[10px] bg-red-100 text-red-800 font-bold">
                  Action
                </span>
              )}
            </span>
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'claims'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            Role Claims ({claimsTotal || roleClaims.length})
          </button>


          <button
            onClick={() => setActiveTab('donations')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'donations'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            Donations ({donations.length})
          </button>

          <button
            onClick={() => setActiveTab('audit')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'audit'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>Audit Trail ({auditLogs.length})</span>
          </button>

          <button
            onClick={() => setActiveTab('health')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all flex items-center gap-1.5 ${
              activeTab === 'health'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            <Activity className="w-3.5 h-3.5" />
            <span>System Health</span>
          </button>
        </div>

        {authError && (
          <div className="p-4 rounded-xl border border-amber-200 bg-amber-50 text-amber-900 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-4 h-4 text-amber-700 shrink-0" />
              <div>
                <p className="font-semibold text-amber-950">Authentication / Authorization Required</p>
                <p className="text-amber-800 mt-0.5">{authError}</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setIsAuthModalOpen(true)}
                className="px-3.5 py-1.5 rounded-full bg-[#111114] text-white font-medium hover:bg-zinc-800 transition-colors shrink-0 flex items-center gap-1.5"
              >
                <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
                <span>Sign In as Admin</span>
              </button>
              <button
                onClick={() => setShowTokenPrompt(true)}
                className="px-3 py-1.5 rounded-full border border-amber-300 bg-white text-amber-900 font-medium hover:bg-amber-100 transition-colors shrink-0"
              >
                Token
              </button>
            </div>
          </div>
        )}

        {statusMessage && (
          <div className="p-3.5 rounded-xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800 flex items-center justify-between">
            <span>{statusMessage}</span>
            <button onClick={() => setStatusMessage(null)} className="text-emerald-700 font-bold ml-2">×</button>
          </div>
        )}

        {/* TAB: ALL MOSQUES ENTERPRISE DIRECTORY */}
        {activeTab === 'directory' && (
          <div className="space-y-4">
            {/* Filter and Search Bar */}
            <div className="bg-white rounded-xl border border-[#e8e8ea] p-4 space-y-3.5">
              <div className="flex flex-col md:flex-row items-stretch md:items-center gap-3">
                {/* Search */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-2.5 w-4 h-4 text-[#6e6e73]" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search mosques by name, street address, or city..."
                    className="w-full pl-10 pr-9 py-2 text-xs rounded-lg border border-[#e8e8ea] bg-white text-[#111114] placeholder:text-zinc-400 focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery('')}
                      className="absolute right-3 top-2.5 text-zinc-400 hover:text-black"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>

                {/* Listing Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6e6e73] whitespace-nowrap">Listing Status:</span>
                  <select
                    value={listingFilter}
                    onChange={(e) => {
                      setListingFilter(e.target.value as any);
                      setPage(1);
                    }}
                    className="px-2.5 py-2 text-xs rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  >
                    <option value="ALL">All Statuses</option>
                    <option value="LISTED">Listed on Map</option>
                    <option value="UNLISTED">Unlisted</option>
                  </select>
                </div>

                {/* Operational Status Filter */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6e6e73] whitespace-nowrap">Operational:</span>
                  <select
                    value={operationalFilter}
                    onChange={(e) => {
                      setOperationalFilter(e.target.value);
                      setPage(1);
                    }}
                    className="px-2.5 py-2 text-xs rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  >
                    <option value="ALL">All Operations</option>
                    <option value="OPEN">Open</option>
                    <option value="TEMPORARILY_CLOSED">Temporarily Closed</option>
                    <option value="UNDER_CONSTRUCTION">Under Construction</option>
                    <option value="PERMANENTLY_CLOSED">Permanently Closed</option>
                  </select>
                </div>

                {/* Items Per Page */}
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold text-[#6e6e73] whitespace-nowrap">Per page:</span>
                  <select
                    value={limit}
                    onChange={(e) => {
                      setLimit(parseInt(e.target.value, 10));
                      setPage(1);
                    }}
                    className="px-2.5 py-2 text-xs rounded-lg border border-[#e8e8ea] bg-white text-[#111114] focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  >
                    <option value={10}>10</option>
                    <option value={25}>25</option>
                    <option value={50}>50</option>
                    <option value={100}>100</option>
                  </select>
                </div>
              </div>

              {/* City quick filter pills */}
              <div className="flex items-center gap-1.5 flex-wrap pt-1 text-[11px]">
                <span className="text-[#6e6e73] font-semibold mr-1">Popular Divisions:</span>
                {['Dhaka', 'Chittagong', 'Sylhet', 'Rajshahi', 'Khulna', 'Barisal', 'Rangpur', 'Mymensingh'].map((city) => (
                  <button
                    key={city}
                    onClick={() => {
                      setCityFilter(cityFilter === city ? '' : city);
                      setPage(1);
                    }}
                    className={`px-2.5 py-1 rounded-full border transition-colors ${
                      cityFilter === city
                        ? 'bg-[#111114] text-white border-[#111114]'
                        : 'bg-white text-[#6e6e73] hover:text-[#111114] border-[#e8e8ea]'
                    }`}
                  >
                    {city}
                  </button>
                ))}
                {cityFilter && (
                  <button
                    onClick={() => {
                      setCityFilter('');
                      setPage(1);
                    }}
                    className="text-xs text-red-600 hover:underline ml-2"
                  >
                    Clear city filter
                  </button>
                )}
              </div>
            </div>

            {/* Results Count & Range Indicator */}
            <div className="flex items-center justify-between text-xs text-[#6e6e73] px-1">
              <span>
                {totalCount > 0
                  ? `Showing ${startRecord} to ${endRecord} of ${totalCount.toLocaleString()} mosques`
                  : 'No mosques found'}
              </span>
              <span>Page {page} of {totalPages}</span>
            </div>

            {/* Mosques Table */}
            <div className="bg-white rounded-xl border border-[#e8e8ea] overflow-hidden shadow-sm">
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse text-xs">
                  <thead>
                    <tr className="border-b border-[#e8e8ea] bg-zinc-50/70 text-[#6e6e73] font-semibold">
                      <th className="py-3 px-4">Mosque Name & Identity</th>
                      <th className="py-3 px-4">Location</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4">Key Amenities</th>
                      <th className="py-3 px-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#e8e8ea]">
                    {isLoading ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-[#6e6e73]">
                          <Loader2 className="w-6 h-6 animate-spin mx-auto mb-2 text-[#111114]" />
                          <span>Loading enterprise mosques directory...</span>
                        </td>
                      </tr>
                    ) : directoryMosques.length === 0 ? (
                      <tr>
                        <td colSpan={5} className="py-16 text-center text-[#6e6e73]">
                          <Building2 className="w-8 h-8 text-zinc-300 mx-auto mb-2" />
                          <p className="font-semibold text-[#111114]">No mosques matching your query</p>
                          <p className="text-xs mt-1">Try resetting filters or expanding search terms.</p>
                        </td>
                      </tr>
                    ) : (
                      directoryMosques.map((m) => (
                        <tr key={m.id} className="hover:bg-zinc-50/60 transition-colors">
                          <td className="py-3.5 px-4 font-medium text-[#111114]">
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-xs">{m.name}</span>
                            </div>
                            {m.landmark && (
                              <p className="text-[11px] text-[#6e6e73] mt-0.5 truncate max-w-xs">
                                Landmark: {m.landmark}
                              </p>
                            )}
                          </td>

                          <td className="py-3.5 px-4 text-[#6e6e73]">
                            <div className="flex items-center gap-1 font-medium text-[#111114]">
                              <MapPin className="w-3 h-3 text-[#6e6e73]" />
                              <span>{m.city || 'Dhaka'}</span>
                            </div>
                            <p className="text-[11px] text-[#6e6e73] mt-0.5 truncate max-w-xs">
                              {m.address || 'Address not listed'}
                            </p>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-col gap-1 items-start">
                              {m.isListed !== false ? (
                                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-50 text-emerald-800 border border-emerald-200">
                                  <Eye className="w-2.5 h-2.5" />
                                  <span>LISTED</span>
                                </span>
                              ) : (
                                <span
                                  className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200"
                                  title={m.unlistedReason || 'Unlisted by administrator'}
                                >
                                  <EyeOff className="w-2.5 h-2.5" />
                                  <span>UNLISTED</span>
                                </span>
                              )}

                              <span className="text-[10px] text-[#6e6e73] font-medium">
                                {m.operationalStatus || 'OPEN'}
                              </span>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex items-center gap-1.5 flex-wrap">
                              {m.hasSeparateWomenSpace && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] text-zinc-700 font-medium">
                                  Women space
                                </span>
                              )}
                              {m.hasAirConditioning && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] text-zinc-700 font-medium">
                                  AC
                                </span>
                              )}
                              {m.hasWheelchairAccess && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] text-zinc-700 font-medium">
                                  Wheelchair
                                </span>
                              )}
                              {m.capacity && (
                                <span className="px-1.5 py-0.5 rounded bg-zinc-100 text-[10px] text-zinc-700 font-medium">
                                  Cap: {m.capacity}
                                </span>
                              )}
                              {!m.hasSeparateWomenSpace && !m.hasAirConditioning && !m.hasWheelchairAccess && !m.capacity && (
                                <span className="text-[10px] text-zinc-400">Basic listing</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                onClick={() => handleInspectMosque(m.id, 'overview')}
                                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-[#111114] text-white font-semibold text-xs hover:bg-zinc-800 transition-colors shadow-sm"
                                title="Inspect all related info of this mosque"
                              >
                                <Compass className="w-3.5 h-3.5" />
                                <span>Inspect & Manage</span>
                              </button>

                              {m.isListed !== false ? (
                                <button
                                  onClick={() => handleToggleListing(m.id, true)}
                                  className="p-1.5 rounded-full border border-amber-300 text-amber-800 hover:bg-amber-50 transition-colors"
                                  title="Unlist mosque from public map"
                                >
                                  <EyeOff className="w-3.5 h-3.5" />
                                </button>
                              ) : (
                                <button
                                  onClick={() => handleToggleListing(m.id, false)}
                                  className="p-1.5 rounded-full border border-emerald-300 text-emerald-800 hover:bg-emerald-50 transition-colors"
                                  title="Relist mosque on public map"
                                >
                                  <Eye className="w-3.5 h-3.5" />
                                </button>
                              )}

                              <button
                                onClick={() => handleQuickDelete(m.id, m.name)}
                                className="p-1.5 rounded-full border border-red-200 text-red-600 hover:bg-red-50 transition-colors"
                                title="Soft-delete mosque"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>

              {/* Enterprise Pagination Bar */}
              {totalPages > 1 && (
                <div className="p-4 border-t border-[#e8e8ea] bg-zinc-50/50 flex flex-col sm:flex-row items-center justify-between gap-3">
                  <div className="flex items-center gap-1">
                    {/* First page */}
                    <button
                      onClick={() => setPage(1)}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 disabled:hover:text-[#6e6e73] transition-colors"
                      title="First page"
                    >
                      <ChevronsLeft className="w-4 h-4" />
                    </button>

                    {/* Prev page */}
                    <button
                      onClick={() => setPage((p) => Math.max(1, p - 1))}
                      disabled={page <= 1}
                      className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 disabled:hover:text-[#6e6e73] transition-colors"
                      title="Previous page"
                    >
                      <ChevronLeft className="w-4 h-4" />
                    </button>

                    {/* Page Numbers */}
                    {Array.from({ length: totalPages }, (_, i) => i + 1)
                      .filter((p) => p === 1 || p === totalPages || (p >= page - 2 && p <= page + 2))
                      .map((p, idx, arr) => {
                        const prevPage = arr[idx - 1];
                        const showEllipsis = prevPage && p - prevPage > 1;
                        return (
                          <React.Fragment key={p}>
                            {showEllipsis && <span className="px-1 text-zinc-400 text-xs">...</span>}
                            <button
                              onClick={() => setPage(p)}
                              className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
                                page === p
                                  ? 'bg-[#111114] text-white shadow-sm'
                                  : 'bg-white text-[#6e6e73] hover:text-[#111114] border border-[#e8e8ea]'
                              }`}
                            >
                              {p}
                            </button>
                          </React.Fragment>
                        );
                      })}

                    {/* Next page */}
                    <button
                      onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 disabled:hover:text-[#6e6e73] transition-colors"
                      title="Next page"
                    >
                      <ChevronRight className="w-4 h-4" />
                    </button>

                    {/* Last page */}
                    <button
                      onClick={() => setPage(totalPages)}
                      disabled={page >= totalPages}
                      className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 disabled:hover:text-[#6e6e73] transition-colors"
                      title="Last page"
                    >
                      <ChevronsRight className="w-4 h-4" />
                    </button>
                  </div>

                  {/* Jump To Page Form */}
                  <form onSubmit={handleJumpPage} className="flex items-center gap-1.5 text-xs">
                    <span className="text-[#6e6e73]">Go to page:</span>
                    <input
                      type="number"
                      min={1}
                      max={totalPages}
                      value={jumpPageInput}
                      onChange={(e) => setJumpPageInput(e.target.value)}
                      placeholder={String(page)}
                      className="w-14 px-2 py-1 text-xs rounded-lg border border-[#e8e8ea] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#111114]"
                    />
                    <button
                      type="submit"
                      className="px-3 py-1 text-xs font-semibold rounded-lg border border-[#e8e8ea] bg-white hover:bg-zinc-100 transition-colors"
                    >
                      Go
                    </button>
                  </form>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: ISSUE REPORTS & INLINE CORRECTIONS */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl border border-[#e8e8ea] p-4 flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-[#111114]">User Inaccuracy Reports & Corrections</h2>
                <p className="text-xs text-[#6e6e73]">
                  Inspect flagged mosques, edit or delete wrong committee/staff info, update coordinates or prayer times, and resolve reports.
                </p>
              </div>
              <span className="px-3 py-1 rounded-full text-xs font-bold bg-amber-50 text-amber-800 border border-amber-200">
                {reports.length} Open Issues
              </span>
            </div>

            {reports.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-semibold text-sm text-[#111114]">All reports resolved!</p>
                <p>There are no open community inaccuracy reports awaiting resolution.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {reports.map((r) => (
                  <div
                    key={r.id}
                    className="p-5 rounded-xl bg-white border border-[#e8e8ea] shadow-sm space-y-3"
                  >
                    <div className="flex items-start justify-between flex-wrap gap-2">
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                            {r.type.replace('_', ' ')}
                          </span>
                          <span className="text-xs text-zinc-400">
                            Filed {new Date(r.createdAt).toLocaleDateString()}
                          </span>
                        </div>
                        <h3 className="text-sm font-bold text-[#111114] mt-1.5">
                          {r.mosque?.name || 'Mosque'}
                          {r.mosque?.city && (
                            <span className="text-xs font-normal text-[#6e6e73] ml-1.5">({r.mosque.city})</span>
                          )}
                        </h3>
                      </div>
                      {r.contactEmail && (
                        <span className="text-xs text-zinc-500 font-mono">Contact: {r.contactEmail}</span>
                      )}
                    </div>

                    <div className="text-xs text-[#111114] bg-[#fafafa] p-3 rounded-lg border border-[#e8e8ea]">
                      <p className="font-semibold text-[#6e6e73] text-[10px] uppercase mb-1">User Reported Note:</p>
                      "{r.description}"
                    </div>

                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-[#f0f0f2] flex-wrap">
                      <button
                        onClick={() => handleInspectFromReport(r.mosqueId, r.type)}
                        className="flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-[#111114] text-white text-xs font-semibold hover:bg-zinc-800 transition-colors shadow-sm"
                      >
                        <Compass className="w-3.5 h-3.5" />
                        <span>
                          Inspect Mosque & Correct {r.type === 'STAFF_INFO' ? 'Committee' : r.type === 'LOCATION' ? 'Location' : 'Information'}
                        </span>
                      </button>

                      <button
                        onClick={() => handleDismissReport(r.id)}
                        className="px-4 py-1.5 rounded-full border border-[#e8e8ea] text-[#6e6e73] hover:text-[#111114] hover:bg-zinc-100 text-xs font-semibold transition-colors"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}


        {/* Tab 4: Role Claims */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {/* Header with Total Count, Bulk Approve, and Page Limit */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 bg-white rounded-xl border border-[#e8e8ea] shadow-sm">
              <div>
                <h3 className="text-sm font-bold text-[#111114]">Pending Role Claims</h3>
                <p className="text-xs text-[#6e6e73]">
                  Total {claimsTotal} claim{claimsTotal === 1 ? '' : 's'} awaiting administrative appointment review.
                </p>
              </div>
              <div className="flex items-center gap-2">
                {roleClaims.length > 0 && (
                  <button
                    onClick={handleApproveAllClaims}
                    disabled={isApprovingAll}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm transition-colors disabled:opacity-50"
                  >
                    {isApprovingAll ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <CheckCheck className="w-3.5 h-3.5" />
                    )}
                    <span>{isApprovingAll ? 'Approving All...' : `Approve All (${claimsTotal || roleClaims.length})`}</span>
                  </button>
                )}
                <select
                  value={claimsLimit}
                  onChange={(e) => {
                    setClaimsLimit(Number(e.target.value));
                    setClaimsPage(1);
                  }}
                  className="text-xs border border-[#e8e8ea] rounded-lg px-2.5 py-1.5 bg-white text-[#111114] outline-none"
                >
                  <option value={10}>10 / page</option>
                  <option value={20}>20 / page</option>
                  <option value={50}>50 / page</option>
                </select>
              </div>
            </div>

            {roleClaims.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73]">
                No pending role claims.
              </div>
            ) : (
              roleClaims.map((c) => (
                <div
                  key={c.id}
                  className="p-5 rounded-xl bg-white border border-[#e8e8ea] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                        {ROLE_NAMES_BN[c.role] || `${c.role} Claim`} {c.customRoleTitle ? `(${c.customRoleTitle})` : ''}
                      </span>
                      <h3 className="text-sm font-bold text-[#111114] mt-1.5">
                        {c.mosque?.name || 'Mosque'}
                      </h3>
                      <p className="text-xs text-[#6e6e73] mt-1 flex flex-wrap items-center gap-x-2 gap-y-1">
                        <span>
                          Applicant: <strong className="text-[#111114]">{c.name || c.user?.name || 'Applicant'}</strong> ({c.user?.email || 'No email'})
                        </span>
                        <span className="text-[#e8e8ea]">•</span>
                        <span className="inline-flex items-center gap-1 font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                          <Phone className="w-3 h-3 text-emerald-600" />
                          <span>Phone: {c.phoneNumber || c.user?.phoneNumber || 'N/A'}</span>
                        </span>
                        {c.startDate && (
                          <>
                            <span className="text-[#e8e8ea]">•</span>
                            <span className="text-[11px] text-zinc-600">Serving since: {new Date(c.startDate).toLocaleDateString()}</span>
                          </>
                        )}
                      </p>
                    </div>
                  </div>

                  <div className="text-xs text-[#111114] bg-[#fafafa] p-3 rounded-lg border border-[#e8e8ea] space-y-1">
                    <div className="flex items-center justify-between">
                      <span className="font-semibold text-[#6e6e73]">Appointment Evidence / Verification Details:</span>
                      {c.documentUrl && (
                        <a
                          href={c.documentUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-1 text-[11px] text-blue-600 hover:text-blue-800 hover:underline font-medium"
                        >
                          <ExternalLink className="w-3 h-3" />
                          <span>View Supporting Document</span>
                        </a>
                      )}
                    </div>
                    <p className="text-zinc-700 italic">
                      {c.evidence && c.evidence !== 'No written evidence provided'
                        ? `"${c.evidence}"`
                        : 'No written evidence provided (None)'}
                    </p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f0f2]">
                    <button
                      onClick={() => handleRejectClaim(c.id)}
                      className="px-4 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleApproveClaim(c.id)}
                      className="px-4 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm"
                    >
                      Approve & Appoint Staff
                    </button>
                  </div>
                </div>
              ))
            )}

            {/* Role Claims Pagination */}
            {claimsTotalPages > 1 && (
              <div className="p-4 rounded-xl border border-[#e8e8ea] bg-white flex flex-col sm:flex-row items-center justify-between gap-3 shadow-sm">
                <div className="flex items-center gap-1">
                  {/* First page */}
                  <button
                    onClick={() => setClaimsPage(1)}
                    disabled={claimsPage <= 1}
                    className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 transition-colors"
                    title="First page"
                  >
                    <ChevronsLeft className="w-4 h-4" />
                  </button>
                  {/* Prev page */}
                  <button
                    onClick={() => setClaimsPage((p) => Math.max(1, p - 1))}
                    disabled={claimsPage <= 1}
                    className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 transition-colors"
                    title="Previous page"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>

                  {/* Page Numbers */}
                  {Array.from({ length: claimsTotalPages }, (_, i) => i + 1)
                    .filter((p) => p === 1 || p === claimsTotalPages || (p >= claimsPage - 2 && p <= claimsPage + 2))
                    .map((p, idx, arr) => {
                      const prevPage = arr[idx - 1];
                      const showEllipsis = prevPage && p - prevPage > 1;
                      return (
                        <React.Fragment key={p}>
                          {showEllipsis && <span className="px-1 text-zinc-400 text-xs">...</span>}
                          <button
                            onClick={() => setClaimsPage(p)}
                            className={`w-7 h-7 text-xs font-semibold rounded-lg transition-colors ${
                              claimsPage === p
                                ? 'bg-[#111114] text-white shadow-sm'
                                : 'bg-white text-[#6e6e73] hover:text-[#111114] border border-[#e8e8ea]'
                            }`}
                          >
                            {p}
                          </button>
                        </React.Fragment>
                      );
                    })}

                  {/* Next page */}
                  <button
                    onClick={() => setClaimsPage((p) => Math.min(claimsTotalPages, p + 1))}
                    disabled={claimsPage >= claimsTotalPages}
                    className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 transition-colors"
                    title="Next page"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                  {/* Last page */}
                  <button
                    onClick={() => setClaimsPage(claimsTotalPages)}
                    disabled={claimsPage >= claimsTotalPages}
                    className="p-1.5 rounded-lg border border-[#e8e8ea] bg-white text-[#6e6e73] hover:text-[#111114] disabled:opacity-30 transition-colors"
                    title="Last page"
                  >
                    <ChevronsRight className="w-4 h-4" />
                  </button>
                </div>

                {/* Jump To Page Form */}
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    const p = parseInt(claimsJumpPageInput, 10);
                    if (!isNaN(p) && p >= 1 && p <= claimsTotalPages) {
                      setClaimsPage(p);
                      setClaimsJumpPageInput('');
                    }
                  }}
                  className="flex items-center gap-1.5 text-xs"
                >
                  <span className="text-[#6e6e73]">
                    Page {claimsPage} of {claimsTotalPages} (Total {claimsTotal}) • Go to:
                  </span>
                  <input
                    type="number"
                    min={1}
                    max={claimsTotalPages}
                    value={claimsJumpPageInput}
                    onChange={(e) => setClaimsJumpPageInput(e.target.value)}
                    placeholder={String(claimsPage)}
                    className="w-14 px-2 py-1 text-xs rounded-lg border border-[#e8e8ea] bg-white text-center focus:outline-none focus:ring-1 focus:ring-[#111114]"
                  />
                  <button
                    type="submit"
                    className="px-3 py-1 text-xs font-semibold rounded-lg border border-[#e8e8ea] bg-white hover:bg-zinc-100 transition-colors"
                  >
                    Go
                  </button>
                </form>
              </div>
            )}
          </div>
        )}


        {/* Tab 6: Donations */}
        {activeTab === 'donations' && (
          <div className="space-y-4">
            {donations.length === 0 ? (
              <div className="p-12 text-center rounded-xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73]">
                No donation accounts registered.
              </div>
            ) : (
              donations.map((d) => (
                <div
                  key={d.id}
                  className="p-5 rounded-xl bg-white border border-[#e8e8ea] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {d.methodType}
                      </span>
                      <h3 className="text-sm font-bold text-[#111114] mt-1.5">
                        {d.mosque?.name || 'Mosque'}
                      </h3>
                      <p className="text-xs text-[#6e6e73]">
                        Account: <span className="font-mono font-bold text-[#111114]">{d.accountNumber}</span> ({d.accountType})
                      </p>
                    </div>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold ${
                        d.isVerified
                          ? 'bg-emerald-50 text-emerald-800 border border-emerald-200'
                          : 'bg-amber-50 text-amber-800 border border-amber-200'
                      }`}
                    >
                      {d.isVerified ? 'Verified' : 'Pending Verification'}
                    </span>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-[#f0f0f2]">
                    {d.isVerified ? (
                      <button
                        onClick={() => handleRevokeDonation(d.id)}
                        className="px-4 py-1.5 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold"
                      >
                        Revoke Verification
                      </button>
                    ) : (
                      <button
                        onClick={() => handleVerifyDonation(d.id)}
                        className="px-4 py-1.5 rounded-full bg-emerald-800 hover:bg-emerald-900 text-white text-xs font-semibold shadow-sm"
                      >
                        Verify Account
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 7: Audit Trail */}
        {activeTab === 'audit' && (
          <div className="bg-white rounded-xl border border-[#e8e8ea] overflow-hidden shadow-sm">
            <div className="p-4 border-b border-[#e8e8ea]">
              <h2 className="text-sm font-bold text-[#111114]">Platform Audit Trail</h2>
              <p className="text-xs text-[#6e6e73]">Immutable records of all administrative updates.</p>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-[#e8e8ea] bg-zinc-50 text-[#6e6e73] font-semibold">
                    <th className="py-2.5 px-4">Action</th>
                    <th className="py-2.5 px-4">Entity</th>
                    <th className="py-2.5 px-4">Actor</th>
                    <th className="py-2.5 px-4">Date & Time</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#e8e8ea]">
                  {auditLogs.length === 0 ? (
                    <tr>
                      <td colSpan={4} className="py-8 text-center text-[#6e6e73]">
                        No audit records available.
                      </td>
                    </tr>
                  ) : (
                    auditLogs.map((log) => (
                      <tr key={log.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-4 font-mono font-bold text-zinc-800">{log.action}</td>
                        <td className="py-2.5 px-4 text-zinc-600">
                          {log.entityType} ({log.entityId.slice(0, 8)}...)
                        </td>
                        <td className="py-2.5 px-4 text-zinc-600">
                          {log.actorRole || 'system'} ({log.actorId ? log.actorId.slice(0, 8) : 'anon'})
                        </td>
                        <td className="py-2.5 px-4 text-zinc-500 font-mono">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Tab 8: Health Probes */}
        {activeTab === 'health' && (
          <div className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="p-4 rounded-xl bg-white border border-[#e8e8ea]">
                <p className="text-xs font-semibold text-[#6e6e73]">System Overall Status</p>
                <p className="text-base font-bold text-[#111114] mt-1 capitalize">
                  {healthData?.status || 'Unknown'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#e8e8ea]">
                <p className="text-xs font-semibold text-[#6e6e73]">Database & PostGIS</p>
                <p className="text-base font-bold text-[#111114] mt-1">
                  {healthData?.dependencies?.database?.available ? 'Available' : 'Degraded'}
                </p>
              </div>
              <div className="p-4 rounded-xl bg-white border border-[#e8e8ea]">
                <p className="text-xs font-semibold text-[#6e6e73]">Memory Usage</p>
                <p className="text-base font-bold text-[#111114] mt-1">
                  {healthData?.system?.memoryUsageMb ? `${healthData.system.memoryUsageMb.toFixed(1)} MB` : 'N/A'}
                </p>
              </div>
            </div>
          </div>
        )}
      </main>

      {/* Mosque Detail & Governance Inspection Modal */}
      <AdminMosqueInspectionModal
        isOpen={isInspectorOpen}
        onClose={() => setIsInspectorOpen(false)}
        mosqueId={inspectedMosqueId}
        initialTab={inspectorTab}
        onMosqueUpdated={(updated) => {
          setDirectoryMosques((prev) => prev.map((m) => (m.id === updated.id ? { ...m, ...updated } : m)));
        }}
        onMosqueDeleted={(deletedId) => {
          setDirectoryMosques((prev) => prev.filter((m) => m.id !== deletedId));
          setTotalCount((prev) => Math.max(0, prev - 1));
        }}
      />

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Manual Token Prompt Modal */}
      {showTokenPrompt && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-sm"
          role="dialog"
          aria-modal="true"
        >
          <div className="w-full max-w-md bg-white rounded-xl border border-[#e8e8ea] shadow-xl p-6 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-[#111114]">Set Admin Bearer Token</h3>
              <button onClick={() => setShowTokenPrompt(false)} className="text-[#6e6e73] hover:text-[#111114]">
                <X className="w-4 h-4" />
              </button>
            </div>
            <p className="text-xs text-[#6e6e73]">
              Paste an administrative JWT token or leave empty to clear the active session.
            </p>
            <textarea
              value={tokenInput}
              onChange={(e) => setTokenInput(e.target.value)}
              placeholder="eyJhbGciOiJIUzI1NiIs..."
              className="w-full h-24 p-2.5 text-xs font-mono rounded-lg border border-[#e8e8ea] bg-zinc-50"
            />
            <div className="flex items-center justify-end gap-2">
              <button
                onClick={() => setShowTokenPrompt(false)}
                className="px-3.5 py-1.5 text-xs text-[#6e6e73] hover:text-[#111114]"
              >
                Cancel
              </button>
              <button
                onClick={() => handleSaveToken(tokenInput)}
                className="px-4 py-1.5 rounded-full bg-[#111114] text-white text-xs font-semibold hover:bg-zinc-800"
              >
                Save Token
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
