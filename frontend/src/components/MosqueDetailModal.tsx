'use client';

import React, { useState } from 'react';
import { Mosque, AttendanceStatus } from '@/types/mosque';
import {
  X,
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Navigation,
  Edit3,
  Flag,
  Share2,
  Check,
  Megaphone,
  Pin,
  CreditCard,
  Bookmark,
  BookmarkCheck,
  Moon,
} from 'lucide-react';
import { toggleAttendance, toggleMosqueBookmark, getLocalBookmarks } from '@/lib/api';

interface MosqueDetailModalProps {
  mosque: Mosque | null;
  onClose: () => void;
  onOpenSuggestion: (mosque: Mosque) => void;
  onOpenReport: (mosque: Mosque) => void;
  onOpenRoleClaim?: (mosque: Mosque) => void;
  onOpenAnnouncements?: (mosque: Mosque) => void;
  onOpenDonations?: (mosque: Mosque) => void;
  onAttendanceChanged?: (mosqueId: string, status: AttendanceStatus) => void;
  onBookmarkChange?: (mosqueId: string, isBookmarked: boolean) => void;
}

export function MosqueDetailModal({
  mosque,
  onClose,
  onOpenSuggestion,
  onOpenReport,
  onOpenRoleClaim,
  onOpenAnnouncements,
  onOpenDonations,
  onAttendanceChanged,
  onBookmarkChange,
}: MosqueDetailModalProps) {
  if (!mosque) return null;

  const [isBookmarked, setIsBookmarked] = useState<boolean>(() => {
    if (mosque.isBookmarked !== undefined) return mosque.isBookmarked;
    return typeof window !== 'undefined' ? getLocalBookmarks().includes(mosque.id) : false;
  });
  const [isTogglingBookmark, setIsTogglingBookmark] = useState(false);

  const [currentAttendance, setCurrentAttendance] = useState<AttendanceStatus>(
    mosque.attendanceSummary?.userStatus || 'NONE',
  );
  const [regularCount, setRegularCount] = useState<number>(
    mosque.attendanceSummary?.regularCount || 0,
  );
  const [occasionalCount, setOccasionalCount] = useState<number>(
    mosque.attendanceSummary?.occasionalCount || 0,
  );
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  const schedule = mosque.prayerSchedule;

  const handleAttendance = async (newStatus: AttendanceStatus) => {
    setIsUpdatingAttendance(true);
    try {
      const summary = await toggleAttendance(mosque.id, newStatus);
      if (summary) {
        setCurrentAttendance(newStatus);
        setRegularCount(summary.regularCount);
        setOccasionalCount(summary.occasionalCount);
      } else {
        // Fallback optimistic update
        setCurrentAttendance(newStatus);
        if (newStatus === 'REGULAR') setRegularCount((c) => c + 1);
        if (newStatus === 'OCCASIONAL') setOccasionalCount((c) => c + 1);
      }
      if (onAttendanceChanged) {
        onAttendanceChanged(mosque.id, newStatus);
      }
    } finally {
      setIsUpdatingAttendance(false);
    }
  };

  const handleShare = () => {
    if (navigator.clipboard) {
      navigator.clipboard.writeText(window.location.href);
      setCopiedShare(true);
      setTimeout(() => setCopiedShare(false), 2000);
    }
  };

  // Timetable entries
  const prayerRows = [
    { name: 'Fajr', start: schedule?.fajrStart, jamaat: schedule?.fajrJamaat },
    { name: 'Sunrise', start: schedule?.sunrise, jamaat: null, isSunrise: true },
    { name: 'Zuhr', start: schedule?.zuhrStart, jamaat: schedule?.zuhrJamaat },
    { name: 'Asr', start: schedule?.asrStart, jamaat: schedule?.asrJamaat },
    { name: 'Maghrib', start: schedule?.maghribStart, jamaat: schedule?.maghribJamaat },
    { name: 'Isha', start: schedule?.ishaStart, jamaat: schedule?.ishaJamaat },
    {
      name: 'Jumu\'ah (Friday)',
      start: schedule?.jumuahSecondJamaat ? `2nd: ${schedule.jumuahSecondJamaat}` : null,
      jamaat: schedule?.jumuahJamaat || '13:30',
      isFriday: true,
    },
  ];

  const freshness = mosque.freshness || { level: 'FRESH', daysAgo: 0 };
  const freshnessLabel = {
    FRESH: `Verified recently (${freshness.daysAgo}d ago)`,
    STALE: `Updated ${freshness.daysAgo}d ago · May need seasonal check`,
    VERY_STALE: `Updated ${freshness.daysAgo}d ago · Outdated`,
  }[freshness.level || 'FRESH'];

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;

  return (
    <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-t-3xl sm:rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-start justify-between gap-3 bg-[#fafafa]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 className="text-lg font-bold text-[#111114] tracking-tight">
                {mosque.name}
              </h2>
              {mosque.verificationStatus === 'VERIFIED' ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  Verified
                </span>
              ) : (
                <span className="text-[11px] font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                  Unverified
                </span>
              )}
            </div>

            <p className="text-xs text-[#6e6e73] flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" />
              <span>{mosque.address || 'Address unlisted'}, {mosque.city || 'Dhaka'}</span>
            </p>
          </div>

          <div className="flex items-center gap-1">
            <button
              onClick={async () => {
                setIsTogglingBookmark(true);
                const res = await toggleMosqueBookmark(mosque.id);
                setIsBookmarked(res.isBookmarked);
                onBookmarkChange?.(mosque.id, res.isBookmarked);
                setIsTogglingBookmark(false);
              }}
              disabled={isTogglingBookmark}
              title={isBookmarked ? 'Following Mosque (Click to unfollow)' : 'Follow Mosque for prayer alerts'}
              className={`p-2 rounded-full transition-colors ${
                isBookmarked
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-5 h-5 text-emerald-600 fill-emerald-600" />
              ) : (
                <Bookmark className="w-5 h-5" />
              )}
            </button>

            <button
              onClick={onClose}
              className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-5">
          {/* Freshness banner */}
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="flex items-center gap-1.5 text-zinc-700 font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              {freshnessLabel}
            </span>
            <button
              onClick={() => onOpenSuggestion(mosque)}
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Update Times
            </button>
          </div>

          {/* Daily Prayer Timetable Table */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2.5">
              Daily Jamaat Timetable
            </h3>
            <div className="rounded-2xl border border-[#e8e8ea] overflow-hidden bg-white">
              <div className="grid grid-cols-3 text-xs font-semibold text-[#6e6e73] bg-[#fafafa] px-3.5 py-2 border-b border-[#e8e8ea]">
                <span>Prayer</span>
                <span className="text-center">Start Time</span>
                <span className="text-right">Jamaat Time</span>
              </div>
              <div className="divide-y divide-[#f0f0f2]">
                {prayerRows.map((row) => (
                  <div
                    key={row.name}
                    className={`grid grid-cols-3 items-center text-xs px-3.5 py-2.5 ${
                      row.isFriday ? 'bg-emerald-50/50 font-medium' : ''
                    }`}
                  >
                    <span className="font-semibold text-[#111114]">
                      {row.name}
                    </span>
                    <span className="text-center text-[#6e6e73]">
                      {row.start || '—'}
                    </span>
                    <span className="text-right font-bold text-base text-[#111114]">
                      {row.jamaat || (row.isSunrise ? 'Sunrise' : '—')}
                    </span>
                  </div>
                ))}
              </div>
            </div>

            {/* Holy Month of Ramadan Timings */}
            {(schedule?.taraweehJamaat || schedule?.sahriEnd || schedule?.iftarStart) && (
              <div className="mt-3 p-3 rounded-2xl bg-emerald-50/70 border border-emerald-200/80 animate-in fade-in duration-200">
                <div className="flex items-center gap-1.5 text-xs font-bold text-emerald-950 mb-2">
                  <Moon className="w-3.5 h-3.5 text-emerald-700" />
                  <span>Holy Month of Ramadan Timings</span>
                </div>
                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="block text-[10px] text-[#6e6e73]">Sahri End</span>
                    <span className="font-bold text-sm text-[#111114]">
                      {schedule.sahriEnd || '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="block text-[10px] text-[#6e6e73]">Iftar Start</span>
                    <span className="font-bold text-sm text-[#111114]">
                      {schedule.iftarStart || '—'}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="block text-[10px] text-[#6e6e73]">Taraweeh</span>
                    <span className="font-bold text-sm text-emerald-700">
                      {schedule.taraweehJamaat || '—'}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Facilities Available */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2">
              Facilities Available
            </h3>
            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="flex items-center gap-2 p-2.5 bg-[#fafafa] border border-[#e8e8ea] rounded-xl text-zinc-700">
                <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                <span>Dedicated Wudu Area</span>
              </div>
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  mosque.hasSeparateWomenSpace
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                    : 'bg-[#fafafa] border-[#e8e8ea] text-[#6e6e73]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mosque.hasSeparateWomenSpace ? 'bg-emerald-500' : 'bg-zinc-300'
                  }`}
                ></span>
                <span>Women's Prayer Space</span>
              </div>
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  mosque.hasAirConditioning
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                    : 'bg-[#fafafa] border-[#e8e8ea] text-[#6e6e73]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mosque.hasAirConditioning ? 'bg-emerald-500' : 'bg-zinc-300'
                  }`}
                ></span>
                <span>Air Conditioned</span>
              </div>
              <div
                className={`flex items-center gap-2 p-2.5 rounded-xl border ${
                  mosque.hasParking
                    ? 'bg-emerald-50/50 border-emerald-200 text-emerald-800'
                    : 'bg-[#fafafa] border-[#e8e8ea] text-[#6e6e73]'
                }`}
              >
                <span
                  className={`w-2 h-2 rounded-full ${
                    mosque.hasParking ? 'bg-emerald-500' : 'bg-zinc-300'
                  }`}
                ></span>
                <span>Parking Available</span>
              </div>
            </div>
          </div>

          {/* Staff & Committee */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Imams & Committee
              </h3>
              {onOpenRoleClaim && (
                <button
                  onClick={() => onOpenRoleClaim(mosque)}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline"
                >
                  Claim Official Role
                </button>
              )}
            </div>

            <div className="p-3 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl divide-y divide-[#ececed] text-xs">
              <div className="flex items-center justify-between py-1.5">
                <div>
                  <span className="font-semibold text-[#111114] block">Pesh Imam</span>
                  <span className="text-[11px] text-[#6e6e73]">Appointed Islamic Scholar</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
              <div className="flex items-center justify-between py-1.5">
                <div>
                  <span className="font-semibold text-[#111114] block">Muazzin</span>
                  <span className="text-[11px] text-[#6e6e73]">Regular Caller to Prayer</span>
                </div>
                <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                  Verified
                </span>
              </div>
            </div>
          </div>

          {/* Community Notices & Announcements */}
          <div className="p-3.5 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                  Community Notices
                </h3>
              </div>
              {onOpenAnnouncements && (
                <button
                  onClick={() => onOpenAnnouncements(mosque)}
                  className="text-[11px] font-semibold text-emerald-700 hover:underline"
                >
                  View / Post Notice
                </button>
              )}
            </div>

            {mosque.announcements && mosque.announcements.length > 0 ? (
              <div className="space-y-2">
                {mosque.announcements.slice(0, 2).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white border border-[#e8e8ea] rounded-xl text-xs"
                  >
                    <div className="flex items-center gap-1.5 font-semibold text-[#111114]">
                      {item.isPinned && <Pin className="w-3 h-3 text-amber-600 shrink-0" />}
                      <span className="truncate">{item.title}</span>
                    </div>
                    <p className="text-[11px] text-[#6e6e73] mt-0.5 line-clamp-2">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6e6e73]">
                No urgent notices published. Check regular Jammat times above.
              </p>
            )}
          </div>

          {/* Community Attendance Tracking */}
          <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e8e8ea]">
            <div className="flex items-center justify-between mb-3">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Community Attendance
              </h3>
              <span className="text-xs font-medium text-zinc-600 flex items-center gap-1">
                <Users className="w-3.5 h-3.5" />
                {regularCount} regular attendees
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              <button
                disabled={isUpdatingAttendance}
                onClick={() =>
                  handleAttendance(currentAttendance === 'REGULAR' ? 'NONE' : 'REGULAR')
                }
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  currentAttendance === 'REGULAR'
                    ? 'bg-[#111114] text-white border-[#111114] shadow-sm'
                    : 'bg-white text-[#111114] border-[#e8e8ea] hover:bg-zinc-50'
                }`}
              >
                {currentAttendance === 'REGULAR' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                <span>I pray here regularly</span>
              </button>

              <button
                disabled={isUpdatingAttendance}
                onClick={() =>
                  handleAttendance(currentAttendance === 'OCCASIONAL' ? 'NONE' : 'OCCASIONAL')
                }
                className={`flex items-center justify-center gap-1.5 py-2.5 px-3 rounded-xl text-xs font-semibold border transition-all active:scale-95 ${
                  currentAttendance === 'OCCASIONAL'
                    ? 'bg-[#111114] text-white border-[#111114] shadow-sm'
                    : 'bg-white text-[#111114] border-[#e8e8ea] hover:bg-zinc-50'
                }`}
              >
                {currentAttendance === 'OCCASIONAL' && <Check className="w-3.5 h-3.5 text-emerald-400" />}
                <span>Occasional attendee</span>
              </button>
            </div>
          </div>

          {/* Quick Actions (Directions, Donate, Suggestion, Report) */}
          <div className="grid grid-cols-4 gap-2 pt-1">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#e8e8ea] hover:bg-zinc-50 text-[#111114] transition-colors"
            >
              <Navigation className="w-4 h-4 mb-1 text-emerald-600" />
              <span className="text-[10px] font-semibold">Directions</span>
            </a>

            <button
              onClick={() => onOpenDonations && onOpenDonations(mosque)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#e8e8ea] hover:bg-zinc-50 text-[#111114] transition-colors"
            >
              <CreditCard className="w-4 h-4 mb-1 text-emerald-600" />
              <span className="text-[10px] font-semibold">Donate</span>
            </button>

            <button
              onClick={() => onOpenSuggestion(mosque)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#e8e8ea] hover:bg-zinc-50 text-[#111114] transition-colors"
            >
              <Edit3 className="w-4 h-4 mb-1 text-blue-600" />
              <span className="text-[10px] font-semibold">Suggest</span>
            </button>

            <button
              onClick={() => onOpenReport(mosque)}
              className="flex flex-col items-center justify-center p-2.5 rounded-2xl bg-white border border-[#e8e8ea] hover:bg-zinc-50 text-[#111114] transition-colors"
            >
              <Flag className="w-4 h-4 mb-1 text-rose-600" />
              <span className="text-[10px] font-semibold">Report</span>
            </button>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="p-3 border-t border-[#e8e8ea] flex items-center justify-between text-xs text-[#6e6e73] bg-[#fafafa]">
          <span>ID: {mosque.id.slice(0, 10)}...</span>
          <button
            onClick={handleShare}
            className="flex items-center gap-1 font-semibold text-[#111114] hover:underline"
          >
            <Share2 className="w-3.5 h-3.5" />
            <span>{copiedShare ? 'Link Copied!' : 'Share'}</span>
          </button>
        </div>
      </div>
    </div>
  );
}
