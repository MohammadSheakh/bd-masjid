'use client';

import React, { useState, useEffect } from 'react';
import {
  HeartHandshake,
  Plus,
  ShieldCheck,
  AlertCircle,
  Filter,
} from 'lucide-react';
import {
  DonationPurpose,
  MosqueDonationChannel,
} from '@/types/donation';
import {
  fetchMosqueDonationChannels,
  verifyDonationChannel,
  rejectDonationChannel,
  attestDonationChannel,
} from '@/lib/api/donations';
import { DonationChannelCard } from './DonationChannelCard';
import { AddDonationModal } from './AddDonationModal';
import { ReportDonationModal } from './ReportDonationModal';

interface MosqueDonationsDirectoryProps {
  mosqueId: string;
  mosqueName: string;
  isStaff?: boolean;
}

const PURPOSE_FILTERS: { key: string; label: string }[] = [
  { key: 'ALL', label: 'All Funds' },
  { key: 'GENERAL_FUND', label: 'General Fund' },
  { key: 'CONSTRUCTION_EXPANSION', label: 'Building & Construction' },
  { key: 'ORPHAN_MADRASAH', label: 'Orphan & Madrasah' },
  { key: 'RAMADAN_IFTAR', label: 'Ramadan Iftar' },
  { key: 'ZAKAT_SADAQAH', label: 'Zakat & Sadaqah' },
  { key: 'JANAZA_FUND', label: 'Janaza Fund' },
];

export const MosqueDonationsDirectory: React.FC<MosqueDonationsDirectoryProps> = ({
  mosqueId,
  mosqueName,
  isStaff = false,
}) => {
  const [channels, setChannels] = useState<MosqueDonationChannel[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedPurpose, setSelectedPurpose] = useState('ALL');
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [reportingChannelId, setReportingChannelId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const loadChannels = async () => {
    setLoading(true);
    const data = await fetchMosqueDonationChannels(mosqueId);
    setChannels(data);
    setLoading(false);
  };

  useEffect(() => {
    loadChannels();
  }, [mosqueId]);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleAttest = async (channelId: string) => {
    const res = await attestDonationChannel(channelId);
    if (res.success) {
      showToast('Donation channel attested with your leadership signature!');
      loadChannels();
    } else {
      showToast(res.error || 'Failed to attest channel.');
    }
  };

  const handleVerify = async (channelId: string) => {
    const res = await verifyDonationChannel(channelId);
    if (res.success) {
      showToast('Donation channel successfully verified and published!');
      loadChannels();
    } else {
      showToast(res.error || 'Verification failed. Self-approval is strictly forbidden.');
    }
  };

  const handleReject = async (channelId: string) => {
    const reason = window.prompt('Please provide a reason for rejecting this account:');
    if (!reason) return;

    const res = await rejectDonationChannel(channelId, { reason });
    if (res.success) {
      showToast('Donation channel rejected.');
      loadChannels();
    } else {
      showToast(res.error || 'Failed to reject channel.');
    }
  };

  const filteredChannels = channels.filter((c) => {
    if (selectedPurpose !== 'ALL' && c.purpose !== selectedPurpose) {
      return false;
    }
    return true;
  });

  const verifiedChannels = filteredChannels.filter((c) => c.status === 'VERIFIED');
  const pendingChannels = filteredChannels.filter((c) => c.status === 'PENDING_VERIFICATION');

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div className="fixed bottom-5 right-5 z-50 rounded-xl bg-slate-900 px-4 py-3 text-xs font-semibold text-white shadow-xl flex items-center gap-2 border border-slate-700 animate-fade-in">
          <ShieldCheck className="h-4 w-4 text-emerald-400" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header & Submission Action */}
      <div className="flex flex-wrap items-center justify-between gap-3 bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
        <div>
          <div className="flex items-center gap-2">
            <HeartHandshake className="h-6 w-6 text-emerald-600" />
            <h2 className="text-xl font-bold text-slate-900">Verified Donation Channels</h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Official financial collection accounts for {mosqueName}. Verified directly by executive mosque leadership (Mutawalli, President, Vice President, General Secretary).
          </p>
        </div>

        {isStaff && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="inline-flex items-center gap-2 px-4 py-2 text-xs font-semibold text-white bg-emerald-600 rounded-xl hover:bg-emerald-700 transition shadow-sm"
          >
            <Plus className="h-4 w-4" />
            <span>Add Donation Account</span>
          </button>
        )}
      </div>

      {/* Purpose Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
        <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0 ml-1 mr-1" />
        {PURPOSE_FILTERS.map((f) => (
          <button
            key={f.key}
            onClick={() => setSelectedPurpose(f.key)}
            className={`px-3 py-1.5 rounded-full font-medium transition-all whitespace-nowrap ${
              selectedPurpose === f.key
                ? 'bg-emerald-600 text-white shadow-sm'
                : 'bg-white text-slate-600 border border-slate-200 hover:bg-slate-50'
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Pending Verification Notice (Visible to Staff) */}
      {isStaff && pendingChannels.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50/70 p-4">
          <div className="flex items-center gap-2 text-xs font-bold text-amber-900 mb-3">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>Pending Review ({pendingChannels.length})</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {pendingChannels.map((channel) => (
              <DonationChannelCard
                key={channel.id}
                channel={channel}
                isStaff={isStaff}
                canAttest={isStaff}
                onAttest={handleAttest}
                onVerify={handleVerify}
                onReject={handleReject}
              />
            ))}
          </div>
        </div>
      )}

      {/* Public Verified Channels Grid */}
      {loading ? (
        <div className="py-12 text-center text-xs text-slate-400">Loading donation channels...</div>
      ) : verifiedChannels.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-slate-50/50 p-12 text-center">
          <HeartHandshake className="mx-auto h-10 w-10 text-slate-300 mb-2" />
          <p className="text-sm font-semibold text-slate-700">No verified donation accounts listed</p>
          <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
            This mosque has not published official digital or banking channels yet.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {verifiedChannels.map((channel) => (
            <DonationChannelCard
              key={channel.id}
              channel={channel}
              isStaff={isStaff}
              canAttest={isStaff}
              onAttest={handleAttest}
              onReport={(id) => setReportingChannelId(id)}
            />
          ))}
        </div>
      )}

      {/* Modals */}
      <AddDonationModal
        mosqueId={mosqueId}
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onSuccess={() => {
          showToast('Donation channel created and verified by leadership!');
          loadChannels();
        }}
      />

      <ReportDonationModal
        channelId={reportingChannelId}
        isOpen={!!reportingChannelId}
        onClose={() => setReportingChannelId(null)}
        onSuccess={() => {
          showToast('Report submitted. Mosque administration has been notified.');
          loadChannels();
        }}
      />
    </div>
  );
};
