import React from 'react';
import { Mosque } from '@/types/mosque';
import { MapPin, Users, CheckCircle2, Clock, Bookmark, BookmarkCheck, Moon } from 'lucide-react';

interface MosqueCardProps {
  mosque: Mosque;
  isSelected?: boolean;
  isBookmarked?: boolean;
  onSelect: (mosque: Mosque) => void;
  onToggleBookmark?: (e: React.MouseEvent, mosqueId: string) => void;
}

export function MosqueCard({
  mosque,
  isSelected,
  isBookmarked,
  onSelect,
  onToggleBookmark,
}: MosqueCardProps) {
  const schedule = mosque.prayerSchedule;

  // Format distance
  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  // Freshness badge styles
  const freshness = mosque.freshness || { level: 'FRESH', daysAgo: 0 };
  const freshnessConfig = {
    FRESH: {
      label: 'Verified Timetable',
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    },
    STALE: {
      label: `${freshness.daysAgo}d ago (Review needed)`,
      bg: 'bg-amber-50 text-amber-700 border-amber-200',
    },
    VERY_STALE: {
      label: 'Needs update',
      bg: 'bg-rose-50 text-rose-700 border-rose-200',
    },
  }[freshness.level || 'FRESH'];

  const prayers = [
    { name: 'Fajr', time: schedule?.fajrJamaat },
    { name: 'Zuhr', time: schedule?.zuhrJamaat },
    { name: 'Asr', time: schedule?.asrJamaat },
    { name: 'Maghrib', time: schedule?.maghribJamaat },
    { name: 'Isha', time: schedule?.ishaJamaat },
  ];

  return (
    <div
      onClick={() => onSelect(mosque)}
      className={`group relative p-4 rounded-2xl bg-white border transition-all cursor-pointer ${
        isSelected
          ? 'border-[#111114] shadow-md ring-1 ring-[#111114]'
          : 'border-[#e8e8ea] hover:border-zinc-400 hover:shadow-sm'
      }`}
    >
      {/* Top Header: Name, Distance & Status */}
      <div className="flex items-start justify-between gap-3 mb-2">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <h3 className="font-semibold text-base text-[#111114] tracking-tight truncate group-hover:text-emerald-700 transition-colors">
              {mosque.name}
            </h3>
            {mosque.verificationStatus === 'VERIFIED' ? (
              <span title="Verified Mosque Listing" className="inline-flex items-center text-emerald-600">
                <CheckCircle2 className="w-4 h-4 fill-emerald-50" />
              </span>
            ) : (
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-600 font-medium">
                Unverified
              </span>
            )}
          </div>
          <p className="text-xs text-[#6e6e73] truncate flex items-center gap-1 mt-0.5">
            <MapPin className="w-3 h-3 shrink-0 text-zinc-400" />
            <span>{mosque.address || mosque.city || 'Bangladesh'}</span>
          </p>
        </div>

        <div className="flex items-center gap-1.5 shrink-0">
          {mosque.distanceMeters !== undefined && (
            <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-zinc-100 text-[#111114]">
              {formatDistance(mosque.distanceMeters)}
            </span>
          )}
          {onToggleBookmark && (
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                onToggleBookmark(e, mosque.id);
              }}
              title={isBookmarked ? 'Unfollow mosque' : 'Follow mosque'}
              className={`p-1.5 rounded-full transition-colors ${
                isBookmarked
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 fill-emerald-600 text-emerald-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>
          )}
        </div>
      </div>

      {/* Freshness Badge, Ramadan notice & Attendees */}
      <div className="flex items-center justify-between gap-2 text-xs mb-3 flex-wrap">
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium border ${freshnessConfig.bg}`}>
            <Clock className="w-3 h-3" />
            {freshnessConfig.label}
          </span>
          {schedule?.taraweehJamaat && (
            <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-800 border border-emerald-200">
              <Moon className="w-3 h-3 text-emerald-600" />
              Taraweeh {schedule.taraweehJamaat}
            </span>
          )}
        </div>

        {mosque.attendanceSummary && (
          <span className="text-[#6e6e73] text-[11px] flex items-center gap-1 shrink-0">
            <Users className="w-3 h-3 text-zinc-400" />
            <span>{mosque.attendanceSummary.regularCount} regular</span>
          </span>
        )}
      </div>

      {/* Prayer Jamaat Timetable Grid */}
      <div className="grid grid-cols-5 gap-1.5 pt-2 border-t border-[#f0f0f2]">
        {prayers.map((p) => (
          <div
            key={p.name}
            className="flex flex-col items-center py-1.5 px-1 rounded-xl bg-[#fafafa] border border-[#f0f0f2]"
          >
            <span className="text-[10px] font-medium text-[#6e6e73] uppercase tracking-wider">
              {p.name}
            </span>
            <span className="text-xs font-semibold text-[#111114] mt-0.5">
              {p.time || '—'}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
