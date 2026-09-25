'use client';

import React, { useState, useEffect } from 'react';
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
} from 'lucide-react';

interface PendingMosque {
  id: string;
  name: string;
  city: string | null;
  address: string | null;
  latitude: number;
  longitude: number;
  createdAt: string;
  prayerSchedule?: any;
}

interface SuggestionItem {
  id: string;
  mosqueId: string;
  mosque?: { name: string; city: string | null };
  suggestedTimes: any;
  description: string | null;
  status: string;
  createdAt: string;
}

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
  evidence: string;
  status: string;
  createdAt: string;
}

export default function AdminPage() {
  const [activeTab, setActiveTab] = useState<'verifications' | 'suggestions' | 'reports' | 'claims'>('verifications');
  const [isLoading, setIsLoading] = useState(false);

  // Data states
  const [pendingMosques, setPendingMosques] = useState<PendingMosque[]>([]);
  const [suggestions, setSuggestions] = useState<SuggestionItem[]>([]);
  const [reports, setReports] = useState<ReportItem[]>([]);
  const [roleClaims, setRoleClaims] = useState<RoleClaimItem[]>([]);

  // Action modal / feedback states
  const [rejectId, setRejectId] = useState<string | null>(null);
  const [rejectReason, setRejectReason] = useState('');
  const [statusMessage, setStatusMessage] = useState<string | null>(null);

  const API_BASE = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6733/api/v1';

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setIsLoading(true);
    setStatusMessage(null);
    try {
      if (activeTab === 'verifications') {
        const res = await fetch(`${API_BASE}/admin/mosques/pending-verification`);
        if (res.ok) {
          const json = await res.json();
          setPendingMosques(json.data?.items || json.items || []);
        } else {
          // Mock data for preview if auth/db offline
          setPendingMosques([
            {
              id: 'pending-1',
              name: 'Baitul Aman Central Mosque',
              city: 'Dhaka',
              address: 'Ring Road, Mohammadpur',
              latitude: 23.7554,
              longitude: 90.3621,
              createdAt: new Date().toISOString(),
              prayerSchedule: {
                fajrJamaat: '05:15',
                zuhrJamaat: '13:30',
                asrJamaat: '16:45',
                maghribJamaat: '18:15',
                ishaJamaat: '20:00',
              },
            },
          ]);
        }
      } else if (activeTab === 'suggestions') {
        const res = await fetch(`${API_BASE}/admin/suggestions?status=OPEN`);
        if (res.ok) {
          const json = await res.json();
          setSuggestions(json.data?.items || json.items || []);
        } else {
          setSuggestions([
            {
              id: 'sugg-1',
              mosqueId: 'mosque-1',
              mosque: { name: 'Baitul Mukarram National Mosque', city: 'Dhaka' },
              suggestedTimes: { asrJamaat: '16:40', ishaJamaat: '20:10' },
              description: 'Updated after committee meeting on Wednesday.',
              status: 'OPEN',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } else if (activeTab === 'reports') {
        const res = await fetch(`${API_BASE}/admin/reports?status=OPEN`);
        if (res.ok) {
          const json = await res.json();
          setReports(json.data?.items || json.items || []);
        } else {
          setReports([
            {
              id: 'rep-1',
              mosqueId: 'mosque-3',
              mosque: { name: 'Gulshan Society Jame Masjid', city: 'Dhaka' },
              type: 'PRAYER_TIME',
              description: 'Isha Jamaat is 20:15, not 20:00.',
              contactEmail: 'musalli@example.com',
              status: 'OPEN',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      } else if (activeTab === 'claims') {
        const res = await fetch(`${API_BASE}/admin/role-claims?status=OPEN`);
        if (res.ok) {
          const json = await res.json();
          setRoleClaims(json.data?.items || json.items || []);
        } else {
          setRoleClaims([
            {
              id: 'claim-1',
              mosqueId: 'mosque-1',
              mosque: { name: 'Baitul Mukarram National Mosque', city: 'Dhaka' },
              user: { name: 'Qari Saiful Islam', email: 'saiful@example.com', phoneNumber: '01711223344' },
              role: 'IMAM',
              evidence: 'Appointed pesh imam by Ministry / Islamic Foundation since 2021.',
              status: 'OPEN',
              createdAt: new Date().toISOString(),
            },
          ]);
        }
      }
    } catch {
      // Fallback preview
    } finally {
      setIsLoading(false);
    }
  };

  const handleApproveClaim = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/role-claims/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'APPROVED', resolutionNotes: 'Verified official role appointment' }),
      });
      setRoleClaims((prev) => prev.filter((c) => c.id !== id));
      setStatusMessage('Role claim approved and verified staff provisioned.');
    } catch {
      setRoleClaims((prev) => prev.filter((c) => c.id !== id));
      setStatusMessage('Mock: Role claim approved.');
    }
  };

  const handleRejectClaim = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/role-claims/${id}/review`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'REJECTED', resolutionNotes: 'Insufficient evidence' }),
      });
      setRoleClaims((prev) => prev.filter((c) => c.id !== id));
      setStatusMessage('Role claim rejected.');
    } catch {
      setRoleClaims((prev) => prev.filter((c) => c.id !== id));
      setStatusMessage('Mock: Role claim rejected.');
    }
  };

  const handleVerifyMosque = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/mosques/${id}/verify`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ notes: 'Verified via moderation console' }),
      });
      setPendingMosques((prev) => prev.filter((m) => m.id !== id));
      setStatusMessage('Mosque verified and approved successfully.');
    } catch {
      setPendingMosques((prev) => prev.filter((m) => m.id !== id));
      setStatusMessage('Mock: Mosque verified.');
    }
  };

  const handleRejectMosque = async (id: string) => {
    if (!rejectReason.trim()) return;
    try {
      await fetch(`${API_BASE}/admin/mosques/${id}/reject`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ reason: rejectReason }),
      });
      setPendingMosques((prev) => prev.filter((m) => m.id !== id));
      setRejectId(null);
      setRejectReason('');
      setStatusMessage('Mosque rejected.');
    } catch {
      setPendingMosques((prev) => prev.filter((m) => m.id !== id));
      setRejectId(null);
      setRejectReason('');
      setStatusMessage('Mock: Mosque rejected.');
    }
  };

  const handleResolveSuggestion = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/suggestions/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Applied by moderator' }),
      });
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      setStatusMessage('Suggestion resolved.');
    } catch {
      setSuggestions((prev) => prev.filter((s) => s.id !== id));
      setStatusMessage('Mock: Suggestion resolved.');
    }
  };

  const handleDismissReport = async (id: string) => {
    try {
      await fetch(`${API_BASE}/admin/reports/${id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: 'RESOLVED', resolutionNotes: 'Reviewed and closed' }),
      });
      setReports((prev) => prev.filter((r) => r.id !== id));
      setStatusMessage('Report resolved.');
    } catch {
      setReports((prev) => prev.filter((r) => r.id !== id));
      setStatusMessage('Mock: Report resolved.');
    }
  };

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111114]">
      {/* Admin Header */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8e8ea] px-4 sm:px-6 py-3.5 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <Link
            href="/"
            className="p-1.5 rounded-full text-zinc-500 hover:text-black hover:bg-zinc-100 transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-emerald-700" />
            <h1 className="text-base font-bold tracking-tight text-[#111114]">
              BD Masjid Moderation Console
            </h1>
          </div>
        </div>

        <button
          onClick={loadData}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-full border border-[#e8e8ea] hover:bg-zinc-100 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Refresh</span>
        </button>
      </header>

      {/* Main Container */}
      <main className="max-w-4xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Navigation Tabs */}
        <div className="flex items-center gap-2 border-b border-[#e8e8ea] pb-2 overflow-x-auto">
          <button
            onClick={() => setActiveTab('verifications')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'verifications'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            Pending Mosques ({pendingMosques.length})
          </button>

          <button
            onClick={() => setActiveTab('suggestions')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'suggestions'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            Schedule Suggestions ({suggestions.length})
          </button>

          <button
            onClick={() => setActiveTab('reports')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'reports'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            Issue Reports ({reports.length})
          </button>

          <button
            onClick={() => setActiveTab('claims')}
            className={`px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              activeTab === 'claims'
                ? 'bg-[#111114] text-white shadow-sm'
                : 'bg-white text-[#6e6e73] hover:text-black border border-[#e8e8ea]'
            }`}
          >
            Role Claims ({roleClaims.length})
          </button>
        </div>

        {statusMessage && (
          <div className="p-3.5 rounded-2xl bg-emerald-50 border border-emerald-200 text-xs font-semibold text-emerald-800">
            {statusMessage}
          </div>
        )}

        {/* Tab 1: Pending Verifications */}
        {activeTab === 'verifications' && (
          <div className="space-y-4">
            {isLoading ? (
              <div className="p-12 text-center text-xs text-[#6e6e73]">Loading pending mosques...</div>
            ) : pendingMosques.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73] space-y-2">
                <CheckCircle2 className="w-8 h-8 text-emerald-600 mx-auto" />
                <p className="font-semibold text-sm text-[#111114]">All caught up!</p>
                <p>There are no unverified mosques awaiting moderation.</p>
              </div>
            ) : (
              pendingMosques.map((m) => (
                <div
                  key={m.id}
                  className="p-5 rounded-3xl bg-white border border-[#e8e8ea] shadow-sm space-y-4"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <h2 className="text-base font-bold text-[#111114]">{m.name}</h2>
                      <p className="text-xs text-[#6e6e73] flex items-center gap-1 mt-1">
                        <MapPin className="w-3.5 h-3.5 text-zinc-400" />
                        <span>{m.address || 'Address unlisted'}, {m.city || 'Bangladesh'}</span>
                      </p>
                      <p className="text-[11px] font-mono text-zinc-400 mt-0.5">
                        Coords: {m.latitude.toFixed(5)}, {m.longitude.toFixed(5)}
                      </p>
                    </div>

                    <a
                      href={`https://www.google.com/maps?q=${m.latitude},${m.longitude}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="p-2 rounded-full bg-zinc-50 border border-zinc-200 text-zinc-600 hover:text-black"
                      title="Inspect coordinates on map"
                    >
                      <ExternalLink className="w-4 h-4" />
                    </a>
                  </div>

                  {/* Initial prayer times preview */}
                  {m.prayerSchedule && (
                    <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] grid grid-cols-5 gap-2 text-center text-xs">
                      <div>
                        <span className="text-[10px] text-[#6e6e73]">Fajr</span>
                        <p className="font-semibold">{m.prayerSchedule.fajrJamaat || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6e6e73]">Zuhr</span>
                        <p className="font-semibold">{m.prayerSchedule.zuhrJamaat || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6e6e73]">Asr</span>
                        <p className="font-semibold">{m.prayerSchedule.asrJamaat || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6e6e73]">Maghrib</span>
                        <p className="font-semibold">{m.prayerSchedule.maghribJamaat || '—'}</p>
                      </div>
                      <div>
                        <span className="text-[10px] text-[#6e6e73]">Isha</span>
                        <p className="font-semibold">{m.prayerSchedule.ishaJamaat || '—'}</p>
                      </div>
                    </div>
                  )}

                  {/* Action buttons */}
                  <div className="pt-2 flex items-center justify-end gap-2 border-t border-[#f0f0f2]">
                    <button
                      onClick={() => setRejectId(m.id)}
                      className="px-4 py-2 rounded-full border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-semibold transition-all"
                    >
                      Reject
                    </button>
                    <button
                      onClick={() => handleVerifyMosque(m.id)}
                      className="px-5 py-2 rounded-full bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-semibold shadow-sm transition-all"
                    >
                      Approve & Verify
                    </button>
                  </div>

                  {/* Rejection input dialog */}
                  {rejectId === m.id && (
                    <div className="p-3 rounded-2xl bg-rose-50 border border-rose-200 space-y-2">
                      <label className="block text-xs font-semibold text-rose-900">
                        Reason for rejection (mandatory):
                      </label>
                      <input
                        type="text"
                        value={rejectReason}
                        onChange={(e) => setRejectReason(e.target.value)}
                        placeholder="e.g. Duplicate of existing mosque 30m away."
                        className="w-full px-3 py-1.5 text-xs rounded-xl border border-rose-300 bg-white"
                      />
                      <div className="flex justify-end gap-2 pt-1">
                        <button
                          onClick={() => setRejectId(null)}
                          className="px-3 py-1 text-xs text-zinc-600"
                        >
                          Cancel
                        </button>
                        <button
                          onClick={() => handleRejectMosque(m.id)}
                          disabled={!rejectReason.trim()}
                          className="px-3 py-1 text-xs font-semibold rounded-full bg-rose-600 text-white disabled:opacity-50"
                        >
                          Confirm Rejection
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 2: Schedule Suggestions */}
        {activeTab === 'suggestions' && (
          <div className="space-y-4">
            {suggestions.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73]">
                No pending suggestions.
              </div>
            ) : (
              suggestions.map((s) => (
                <div
                  key={s.id}
                  className="p-5 rounded-3xl bg-white border border-[#e8e8ea] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <h2 className="text-sm font-bold text-[#111114]">
                        {s.mosque?.name || 'Unknown Mosque'}
                      </h2>
                      <p className="text-xs text-[#6e6e73]">{s.description || 'No additional note'}</p>
                    </div>
                    <span className="text-[11px] px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 font-semibold">
                      {s.status}
                    </span>
                  </div>

                  {s.suggestedTimes && (
                    <div className="p-3 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] flex items-center gap-4 text-xs font-mono">
                      {Object.entries(s.suggestedTimes).map(([k, v]) => (
                        <div key={k}>
                          <span className="text-[10px] uppercase text-[#6e6e73] block">{k}</span>
                          <span className="font-bold">{String(v)}</span>
                        </div>
                      ))}
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0f0f2]">
                    <button
                      onClick={() => handleResolveSuggestion(s.id)}
                      className="px-4 py-1.5 rounded-full bg-[#111114] text-white text-xs font-semibold hover:bg-zinc-800"
                    >
                      Apply & Resolve
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 3: Reports */}
        {activeTab === 'reports' && (
          <div className="space-y-4">
            {reports.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73]">
                No pending issue reports.
              </div>
            ) : (
              reports.map((r) => (
                <div
                  key={r.id}
                  className="p-5 rounded-3xl bg-white border border-[#e8e8ea] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-rose-50 text-rose-700 border border-rose-200">
                        {r.type}
                      </span>
                      <h2 className="text-sm font-bold text-[#111114] mt-1.5">
                        {r.mosque?.name || 'Mosque'}
                      </h2>
                    </div>
                    {r.contactEmail && (
                      <span className="text-xs text-zinc-500 font-mono">{r.contactEmail}</span>
                    )}
                  </div>

                  <p className="text-xs text-zinc-800 bg-[#fafafa] p-3 rounded-2xl border border-[#e8e8ea]">
                    "{r.description}"
                  </p>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0f0f2]">
                    <button
                      onClick={() => handleDismissReport(r.id)}
                      className="px-4 py-1.5 rounded-full bg-zinc-900 text-white text-xs font-semibold hover:bg-black"
                    >
                      Resolve & Dismiss
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}

        {/* Tab 4: Role Claims */}
        {activeTab === 'claims' && (
          <div className="space-y-4">
            {roleClaims.length === 0 ? (
              <div className="p-12 text-center rounded-3xl bg-white border border-[#e8e8ea] text-xs text-[#6e6e73]">
                No pending official role claims.
              </div>
            ) : (
              roleClaims.map((claim) => (
                <div
                  key={claim.id}
                  className="p-5 rounded-3xl bg-white border border-[#e8e8ea] shadow-sm space-y-3"
                >
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded bg-emerald-50 text-emerald-800 border border-emerald-200">
                        {claim.role}
                      </span>
                      <h2 className="text-sm font-bold text-[#111114] mt-1.5">
                        {claim.mosque?.name || 'Mosque'}
                      </h2>
                      <div className="text-xs text-[#6e6e73] mt-0.5">
                        Submitted by: <strong className="text-zinc-800">{claim.user?.name || 'Musalli'}</strong>{' '}
                        {claim.user?.phoneNumber && `(${claim.user.phoneNumber})`}
                      </div>
                    </div>
                    <span className="text-[11px] text-zinc-400 font-mono">
                      {new Date(claim.createdAt).toLocaleDateString()}
                    </span>
                  </div>

                  <div className="bg-[#fafafa] p-3 rounded-2xl border border-[#e8e8ea] text-xs text-zinc-800">
                    <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] block mb-1">
                      Submitted Evidence
                    </span>
                    <p className="leading-relaxed">"{claim.evidence}"</p>
                  </div>

                  <div className="flex items-center justify-end gap-2 pt-1 border-t border-[#f0f0f2]">
                    <button
                      onClick={() => handleRejectClaim(claim.id)}
                      className="px-4 py-1.5 rounded-full border border-rose-200 text-rose-700 text-xs font-semibold hover:bg-rose-50 transition-colors"
                    >
                      Reject Claim
                    </button>
                    <button
                      onClick={() => handleApproveClaim(claim.id)}
                      className="px-4 py-1.5 rounded-full bg-emerald-700 text-white text-xs font-semibold hover:bg-emerald-800 transition-colors"
                    >
                      Approve & Verify Staff
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        )}
      </main>
    </div>
  );
}
