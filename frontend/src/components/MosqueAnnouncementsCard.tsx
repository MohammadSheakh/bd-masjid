'use client';

import React, { useState, useEffect } from 'react';
import {
  Megaphone,
  Pin,
  AlertTriangle,
  Calendar,
  Clock,
  UserCheck,
  Plus,
  Filter,
} from 'lucide-react';
import { MosqueAnnouncement, AnnouncementCategory } from '@/types/mosque';
import { fetchMosqueAnnouncements } from '@/lib/api';
import { AnnouncementModal } from './AnnouncementModal';

interface MosqueAnnouncementsCardProps {
  mosqueId: string;
  mosqueName: string;
  initialAnnouncements?: MosqueAnnouncement[];
}

const CATEGORY_CONFIG: Record<
  AnnouncementCategory,
  { label: string; badgeClass: string; bgClass: string; borderClass: string }
> = {
  EMERGENCY_ALERT: {
    label: 'Emergency Alert',
    badgeClass: 'bg-red-100 text-red-800 border-red-200',
    bgClass: 'bg-red-50/70',
    borderClass: 'border-red-200',
  },
  JUMUAH_KHUTBAH: {
    label: 'Jumu\'ah Khutbah',
    badgeClass: 'bg-emerald-100 text-emerald-800 border-emerald-200',
    bgClass: 'bg-emerald-50/40',
    borderClass: 'border-emerald-200',
  },
  JANAZA: {
    label: 'Janaza Prayer',
    badgeClass: 'bg-slate-200 text-slate-800 border-slate-300',
    bgClass: 'bg-slate-50',
    borderClass: 'border-slate-200',
  },
  RAMADAN: {
    label: 'Ramadan Notice',
    badgeClass: 'bg-amber-100 text-amber-800 border-amber-200',
    bgClass: 'bg-amber-50/40',
    borderClass: 'border-amber-200',
  },
  EID: {
    label: 'Eid Prayer',
    badgeClass: 'bg-purple-100 text-purple-800 border-purple-200',
    bgClass: 'bg-purple-50/40',
    borderClass: 'border-purple-200',
  },
  MAINTENANCE: {
    label: 'Maintenance',
    badgeClass: 'bg-orange-100 text-orange-800 border-orange-200',
    bgClass: 'bg-orange-50/40',
    borderClass: 'border-orange-200',
  },
  GENERAL: {
    label: 'General Notice',
    badgeClass: 'bg-zinc-100 text-zinc-700 border-zinc-200',
    bgClass: 'bg-white',
    borderClass: 'border-[#e8e8ea]',
  },
};

export function MosqueAnnouncementsCard({
  mosqueId,
  mosqueName,
  initialAnnouncements = [],
}: MosqueAnnouncementsCardProps) {
  const [announcements, setAnnouncements] =
    useState<MosqueAnnouncement[]>(initialAnnouncements);
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    async function loadData() {
      setLoading(true);
      const data = await fetchMosqueAnnouncements(mosqueId, {
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
      });
      setAnnouncements(data);
      setLoading(false);
    }

    loadData();
  }, [mosqueId, selectedCategory]);

  const emergencyAlerts = announcements.filter(
    (a) => a.category === 'EMERGENCY_ALERT',
  );

  const displayedAnnouncements =
    selectedCategory === 'ALL'
      ? announcements
      : announcements.filter((a) => a.category === selectedCategory);

  const categoriesWithCounts = [
    { key: 'ALL', label: 'All Notices', count: announcements.length },
    {
      key: 'EMERGENCY_ALERT',
      label: 'Emergency',
      count: announcements.filter((a) => a.category === 'EMERGENCY_ALERT').length,
    },
    {
      key: 'JUMUAH_KHUTBAH',
      label: 'Jumu\'ah',
      count: announcements.filter((a) => a.category === 'JUMUAH_KHUTBAH').length,
    },
    {
      key: 'JANAZA',
      label: 'Janaza',
      count: announcements.filter((a) => a.category === 'JANAZA').length,
    },
    {
      key: 'RAMADAN',
      label: 'Ramadan/Eid',
      count: announcements.filter(
        (a) => a.category === 'RAMADAN' || a.category === 'EID',
      ).length,
    },
  ];

  return (
    <div className="rounded-3xl border border-[#e5e5ea] bg-white p-5 shadow-xs transition-all">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-amber-50 text-amber-700 border border-amber-100">
            <Megaphone className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-[#111114]">Official Notices & Announcements</h3>
            <p className="text-xs text-[#6e6e73]">Verified broadcasts from Mosque Leadership</p>
          </div>
        </div>

        <button
          onClick={() => setIsModalOpen(true)}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111114] bg-[#f5f5f7] hover:bg-[#e8e8ed] rounded-xl border border-[#d2d2d7] transition-all cursor-pointer"
        >
          <Plus className="w-3.5 h-3.5 text-emerald-600" />
          <span>Post / Manage</span>
        </button>
      </div>

      {/* High-Visibility Emergency Banner */}
      {emergencyAlerts.length > 0 && selectedCategory === 'ALL' && (
        <div className="mb-4 p-4 rounded-2xl bg-red-50 border border-red-200/90 shadow-2xs">
          <div className="flex items-start gap-2.5">
            <span className="relative flex h-3 w-3 mt-0.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-3 w-3 bg-red-600" />
            </span>
            <div className="flex-1">
              <div className="flex items-center gap-2">
                <span className="text-[10px] font-black uppercase tracking-wider text-red-800 bg-red-200/70 px-2 py-0.5 rounded-full">
                  Urgent Emergency Advisory
                </span>
                <span className="text-[10px] text-red-700/80 font-mono">
                  {new Date(emergencyAlerts[0].createdAt).toLocaleDateString()}
                </span>
              </div>
              <h4 className="text-xs font-bold text-red-950 mt-1">
                {emergencyAlerts[0].title}
              </h4>
              <p className="text-xs text-red-900/90 mt-1 whitespace-pre-line leading-relaxed">
                {emergencyAlerts[0].content}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Category Filter Chips */}
      <div className="flex items-center gap-1.5 overflow-x-auto pb-2 mb-3 scrollbar-none">
        <Filter className="w-3.5 h-3.5 text-[#86868b] shrink-0 mr-0.5" />
        {categoriesWithCounts.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setSelectedCategory(tab.key)}
            className={`px-2.5 py-1 text-[11px] font-medium rounded-full transition-all shrink-0 cursor-pointer ${
              selectedCategory === tab.key
                ? 'bg-[#1d1d1f] text-white shadow-2xs'
                : 'bg-[#f5f5f7] text-[#6e6e73] hover:bg-[#e8e8ed]'
            }`}
          >
            {tab.label} {tab.count > 0 && <span className="opacity-70 font-mono">({tab.count})</span>}
          </button>
        ))}
      </div>

      {/* Announcements Timeline List */}
      <div className="space-y-3">
        {loading ? (
          <div className="p-8 text-center text-xs text-[#86868b]">Loading notices...</div>
        ) : displayedAnnouncements.length === 0 ? (
          <div className="p-6 text-center rounded-2xl bg-[#fafafc] border border-dashed border-[#e5e5ea]">
            <Megaphone className="w-5 h-5 text-[#86868b] mx-auto mb-1.5 opacity-60" />
            <p className="text-xs font-medium text-[#6e6e73]">
              No active announcements found for this filter.
            </p>
          </div>
        ) : (
          displayedAnnouncements.map((item) => {
            const config =
              CATEGORY_CONFIG[item.category] || CATEGORY_CONFIG.GENERAL;

            return (
              <div
                key={item.id}
                className={`p-4 rounded-2xl border transition-all ${
                  item.isPinned
                    ? 'bg-amber-50/30 border-amber-200/90 shadow-2xs'
                    : `${config.bgClass} ${config.borderClass}`
                }`}
              >
                {/* Meta Row: Pinned, Category, Role Snapshot, Date */}
                <div className="flex items-center justify-between gap-2 mb-2 flex-wrap">
                  <div className="flex items-center gap-1.5 flex-wrap">
                    {item.isPinned && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-bold text-amber-900 bg-amber-100/90 px-2 py-0.5 rounded-full border border-amber-200">
                        <Pin className="w-2.5 h-2.5" />
                        Pinned
                      </span>
                    )}

                    <span
                      className={`inline-flex items-center text-[9px] font-bold px-2 py-0.5 rounded-full border ${config.badgeClass}`}
                    >
                      {config.label}
                    </span>

                    {item.authorRole && (
                      <span className="inline-flex items-center gap-1 text-[9px] font-semibold text-emerald-800 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                        <UserCheck className="w-2.5 h-2.5" />
                        {item.authorRole.replace('_', ' ')}
                      </span>
                    )}
                  </div>

                  <div className="flex items-center gap-2 text-[10px] text-[#6e6e73] font-mono">
                    <span className="flex items-center gap-1">
                      <Calendar className="w-3 h-3 text-[#86868b]" />
                      {new Date(item.createdAt).toLocaleDateString()}
                    </span>

                    {item.expiresAt && (
                      <span className="flex items-center gap-1 text-zinc-500">
                        <Clock className="w-3 h-3 text-[#86868b]" />
                        Until {new Date(item.expiresAt).toLocaleDateString()}
                      </span>
                    )}
                  </div>
                </div>

                {/* Content */}
                <h4 className="text-xs font-bold text-[#111114] mb-1">
                  {item.title}
                </h4>
                <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                  {item.content}
                </p>

                {item.author?.name && (
                  <p className="text-[10px] text-[#86868b] mt-2 italic">
                    Posted by {item.author.name}
                  </p>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Management Modal */}
      {isModalOpen && (
        <AnnouncementModal
          mosque={{ id: mosqueId, name: mosqueName } as any}
          onClose={() => setIsModalOpen(false)}
          onAnnouncementCreated={(newAnn) => {
            setAnnouncements((prev) => [newAnn, ...prev]);
          }}
        />
      )}
    </div>
  );
}
