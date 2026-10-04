'use client';

import React, { useState, useEffect } from 'react';
import {
  Mosque,
  AttendanceStatus,
  MosqueStaffMember,
  MosqueSuggestionItem,
} from '@/types/mosque';
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
  Loader2,
  User,
  MessageSquare,
} from 'lucide-react';
import {
  toggleAttendance,
  fetchAttendanceSummary,
  toggleMosqueBookmark,
  getLocalBookmarks,
  fetchMosqueStaff,
  fetchPublicMosqueSuggestions,
} from '@/lib/api';
import { formatTo12Hour } from '@/lib/time';
import { MosqueFacilitiesSection } from './MosqueFacilitiesSection';

interface MosqueDetailModalProps {
  mosque: Mosque | null;
  onClose: () => void;
  onOpenSuggestion: (mosque: Mosque) => void;
  onOpenTimetable?: (mosque: Mosque) => void;
  onOpenReport: (mosque: Mosque) => void;
  onOpenRoleClaim?: (mosque: Mosque) => void;
  onOpenAnnouncements?: (mosque: Mosque) => void;
  onOpenDonations?: (mosque: Mosque) => void;
  onAttendanceChanged?: (
    mosqueId: string,
    status: AttendanceStatus,
    regularCount?: number,
    occasionalCount?: number,
  ) => void;
  onBookmarkChange?: (mosqueId: string, isBookmarked: boolean) => void;
}

export function MosqueDetailModal({
  mosque,
  onClose,
  onOpenSuggestion,
  onOpenTimetable,
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

  const [currentAttendance, setCurrentAttendance] = useState<AttendanceStatus>(() => {
    if (mosque.attendanceSummary?.userStatus && mosque.attendanceSummary.userStatus !== 'NONE') {
      return mosque.attendanceSummary.userStatus;
    }
    if (typeof window !== 'undefined') {
      const local = localStorage.getItem(`bd_masjid_attendance_${mosque.id}`);
      if (local === 'REGULAR' || local === 'OCCASIONAL') return local;
    }
    return 'NONE';
  });
  const [regularCount, setRegularCount] = useState<number>(
    mosque.attendanceSummary?.regularCount || 0,
  );
  const [occasionalCount, setOccasionalCount] = useState<number>(
    mosque.attendanceSummary?.occasionalCount || 0,
  );
  const [isUpdatingAttendance, setIsUpdatingAttendance] = useState(false);
  const [copiedShare, setCopiedShare] = useState(false);

  // Dynamic verified staff roster
  const [staffList, setStaffList] = useState<MosqueStaffMember[]>(() => {
    if (mosque.staffMembers && Array.isArray(mosque.staffMembers)) {
      return mosque.staffMembers.filter((s) => s.isVerified);
    }
    return [];
  });
  const [isLoadingStaff, setIsLoadingStaff] = useState(false);

  // Fetch fresh attendance summary from server on mount
  useEffect(() => {
    let isMounted = true;
    fetchAttendanceSummary(mosque.id).then((summary) => {
      if (!isMounted || !summary) return;
      setRegularCount(summary.regularCount ?? 0);
      setOccasionalCount(summary.occasionalCount ?? 0);
      if (summary.userStatus && summary.userStatus !== 'NONE') {
        setCurrentAttendance(summary.userStatus);
      }
    });
    return () => {
      isMounted = false;
    };
  }, [mosque.id]);

  // Public suggestions and community feedback
  const [publicSuggestions, setPublicSuggestions] = useState<MosqueSuggestionItem[]>([]);
  const [isLoadingSuggestions, setIsLoadingSuggestions] = useState(false);

  useEffect(() => {
    let isMounted = true;
    if (mosque.id) {
      setIsLoadingSuggestions(true);
      fetchPublicMosqueSuggestions(mosque.id, 1, 5)
        .then((res) => {
          if (isMounted && res?.items) {
            setPublicSuggestions(res.items);
          }
        })
        .catch(() => {
          if (isMounted) setPublicSuggestions([]);
        })
        .finally(() => {
          if (isMounted) setIsLoadingSuggestions(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [mosque.id]);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        onClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => {
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [onClose]);

  useEffect(() => {
    let isMounted = true;
    if (mosque.staffMembers && Array.isArray(mosque.staffMembers)) {
      setStaffList(mosque.staffMembers.filter((s) => s.isVerified));
    } else {
      setIsLoadingStaff(true);
      fetchMosqueStaff(mosque.id)
        .then((data) => {
          if (isMounted && Array.isArray(data)) {
            setStaffList(data.filter((s: MosqueStaffMember) => s.isVerified));
          }
        })
        .catch(() => {
          if (isMounted) setStaffList([]);
        })
        .finally(() => {
          if (isMounted) setIsLoadingStaff(false);
        });
    }
    return () => {
      isMounted = false;
    };
  }, [mosque.id, mosque.staffMembers]);

  const formatStaffRole = (role: string, customTitle?: string | null) => {
    switch (role) {
      case 'MOSQUE_ADMIN':
        return { title: 'Mosque Administrator', subtitle: 'Executive Leadership & Admin' };
      case 'MUTAWALLI':
        return { title: 'Mutawalli', subtitle: 'Mosque Trustee & Custodian' };
      case 'CUSTOM':
        return { title: customTitle || 'Special Officer', subtitle: 'Verified Mosque Personnel' };
      case 'IMAM':
        return { title: 'Pesh Imam', subtitle: 'Appointed Islamic Scholar' };
      case 'MUAZZIN':
        return { title: 'Muazzin', subtitle: 'Regular Caller to Prayer' };
      case 'KHATIB':
        return { title: 'Chief Khatib', subtitle: 'Friday Khutbah Speaker' };
      case 'KHADEM':
        return { title: 'Khadem', subtitle: 'Mosque Caretaker' };
      case 'COMMITTEE_PRESIDENT':
        return { title: 'Committee President (সভাপতি)', subtitle: 'Executive Leadership' };
      case 'COMMITTEE_VICE_PRESIDENT':
        return { title: 'Vice President (সহ-সভাপতি)', subtitle: 'Executive Leadership' };
      case 'COMMITTEE_SECRETARY':
        return { title: 'General Secretary', subtitle: 'Administrative Leadership' };
      case 'COMMITTEE_MEMBER':
        return { title: 'Committee Member', subtitle: 'Management Committee' };
      default:
        return { title: role.replace(/_/g, ' '), subtitle: 'Verified Mosque Personnel' };
    }
  };

  const schedule = mosque.prayerSchedule;

  const handleAttendance = async (newStatus: AttendanceStatus) => {
    setIsUpdatingAttendance(true);
    const prevStatus = currentAttendance;
    try {
      // Optimistic update
      setCurrentAttendance(newStatus);
      if (prevStatus === 'REGULAR') setRegularCount((c) => Math.max(0, c - 1));
      if (prevStatus === 'OCCASIONAL') setOccasionalCount((c) => Math.max(0, c - 1));
      if (newStatus === 'REGULAR') setRegularCount((c) => c + 1);
      if (newStatus === 'OCCASIONAL') setOccasionalCount((c) => c + 1);

      const summary = await toggleAttendance(mosque.id, newStatus);
      if (summary) {
        setRegularCount(summary.regularCount);
        setOccasionalCount(summary.occasionalCount);
        if (summary.userStatus) {
          setCurrentAttendance(summary.userStatus);
        }
        if (onAttendanceChanged) {
          onAttendanceChanged(mosque.id, newStatus, summary.regularCount, summary.occasionalCount);
        }
      } else {
        if (onAttendanceChanged) {
          onAttendanceChanged(mosque.id, newStatus);
        }
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
    {
      name: 'Fajr',
      start: schedule?.fajrStart ? formatTo12Hour(schedule.fajrStart) : null,
      jamaat: schedule?.fajrJamaat ? formatTo12Hour(schedule.fajrJamaat) : null,
    },
    {
      name: 'Sunrise',
      start: schedule?.sunrise ? formatTo12Hour(schedule.sunrise) : null,
      jamaat: null,
      isSunrise: true,
    },
    {
      name: 'Zuhr',
      start: schedule?.zuhrStart ? formatTo12Hour(schedule.zuhrStart) : null,
      jamaat: schedule?.zuhrJamaat ? formatTo12Hour(schedule.zuhrJamaat) : null,
    },
    {
      name: 'Asr',
      start: schedule?.asrStart ? formatTo12Hour(schedule.asrStart) : null,
      jamaat: schedule?.asrJamaat ? formatTo12Hour(schedule.asrJamaat) : null,
    },
    {
      name: 'Maghrib',
      start: schedule?.maghribStart ? formatTo12Hour(schedule.maghribStart) : null,
      jamaat: schedule?.maghribJamaat ? formatTo12Hour(schedule.maghribJamaat) : null,
    },
    {
      name: 'Isha',
      start: schedule?.ishaStart ? formatTo12Hour(schedule.ishaStart) : null,
      jamaat: schedule?.ishaJamaat ? formatTo12Hour(schedule.ishaJamaat) : null,
    },
    {
      name: 'Jumu\'ah (Friday)',
      start: schedule?.jumuahSecondJamaat
        ? `2nd: ${formatTo12Hour(schedule.jumuahSecondJamaat)}`
        : null,
      jamaat: formatTo12Hour(schedule?.jumuahJamaat || '13:30'),
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
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="mosque-detail-title"
      className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-0 sm:p-4 bg-black/50 animate-in fade-in duration-150"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col bg-white rounded-t-[14px] sm:rounded-[12px] shadow-xl border border-[#e8e8ea] overflow-hidden">
        {/* Modal Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-start justify-between gap-3 bg-[#fafafa]">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h2 id="mosque-detail-title" className="text-lg font-bold text-[#111114] tracking-tight">
                {mosque.name}
              </h2>
              {mosque.isListed === false && (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[11px] font-medium bg-amber-50 text-amber-800 border border-amber-200">
                  Unlisted
                </span>
              )}
            </div>

            <p className="text-xs text-[#6e6e73] flex items-center gap-1 mt-1">
              <MapPin className="w-3.5 h-3.5 shrink-0 text-zinc-400" aria-hidden="true" />
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
              aria-label={isBookmarked ? 'Unfollow Mosque' : 'Follow Mosque for prayer alerts'}
              className={`w-8 h-8 rounded-full flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114] ${
                isBookmarked
                  ? 'text-emerald-700 bg-emerald-50 hover:bg-emerald-100'
                  : 'text-zinc-400 hover:text-zinc-700 hover:bg-zinc-100'
              }`}
            >
              {isBookmarked ? (
                <BookmarkCheck className="w-4 h-4 text-emerald-600 fill-emerald-600" />
              ) : (
                <Bookmark className="w-4 h-4" />
              )}
            </button>

            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full flex items-center justify-center text-[#6e6e73] hover:text-[#111114] hover:bg-[#fafafa] border border-transparent hover:border-[#e8e8ea] transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-[#111114]"
              aria-label="Close modal"
            >
              <X className="w-4 h-4" />
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
              onClick={() =>
                onOpenTimetable ? onOpenTimetable(mosque) : onOpenSuggestion(mosque)
              }
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
                      {formatTo12Hour(schedule.sahriEnd)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="block text-[10px] text-[#6e6e73]">Iftar Start</span>
                    <span className="font-bold text-sm text-[#111114]">
                      {formatTo12Hour(schedule.iftarStart)}
                    </span>
                  </div>
                  <div className="p-2 rounded-xl bg-white border border-emerald-100 shadow-2xs">
                    <span className="block text-[10px] text-[#6e6e73]">Taraweeh</span>
                    <span className="font-bold text-sm text-emerald-700">
                      {formatTo12Hour(schedule.taraweehJamaat)}
                    </span>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Facilities & Accessibility Taxonomy */}
          <MosqueFacilitiesSection
            mosque={mosque}
            initialFacility={mosque.facility}
          />

          {/* Staff & Committee */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Imams & Committee
              </h3>
              {onOpenRoleClaim && (
                <button
                  type="button"
                  onClick={() => onOpenRoleClaim(mosque)}
                  className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 transition-colors focus-visible:ring-2 focus-visible:ring-[#111114] focus-visible:ring-offset-1 focus:outline-none rounded"
                >
                  Claim Official Role
                </button>
              )}
            </div>

            {isLoadingStaff ? (
              <div
                aria-live="polite"
                className="p-3.5 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl flex items-center justify-center gap-2 text-xs text-[#6e6e73]"
              >
                <Loader2 className="w-3.5 h-3.5 animate-spin text-[#6e6e73]" aria-hidden="true" />
                <span>Loading verified personnel...</span>
              </div>
            ) : staffList.length > 0 ? (
              <div className="p-3 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl divide-y divide-[#ececed] text-xs">
                {staffList.map((member) => {
                  const roleMeta = formatStaffRole(member.role, member.customRoleTitle);
                  return (
                    <div key={member.id} className="flex items-center justify-between py-2 gap-2">
                      <div className="flex items-center gap-2.5">
                        <div className="w-8 h-8 rounded-full bg-zinc-100 border border-[#e8e8ea] shrink-0 overflow-hidden flex items-center justify-center text-zinc-400">
                          {member.imageUrl ? (
                            <img
                              src={member.imageUrl}
                              alt={member.name}
                              className="w-full h-full object-cover"
                            />
                          ) : (
                            <User className="w-4 h-4 text-zinc-500" />
                          )}
                        </div>
                        <div>
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <span className="font-semibold text-[#111114]">{member.name}</span>
                            <span className="text-[10px] font-medium text-[#111114] bg-[#f4f4f5] px-1.5 py-0.5 rounded border border-[#e8e8ea]">
                              {roleMeta.title}
                            </span>
                          </div>
                          <span className="text-[11px] text-[#6e6e73] block mt-0.5">
                            {roleMeta.subtitle}
                            {member.startDate ? ` · Since ${new Date(member.startDate).toLocaleDateString()}` : ''}
                            {member.contactNumber ? ` · ${member.contactNumber}` : ''}
                          </span>
                        </div>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full flex items-center gap-1 shrink-0">
                        <Check className="w-2.5 h-2.5" aria-hidden="true" />
                        Verified
                      </span>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div className="p-4 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl text-center">
                <Users className="w-4 h-4 text-[#6e6e73] mx-auto mb-1.5 opacity-60" aria-hidden="true" />
                <p className="text-xs font-medium text-[#6e6e73]">
                  No appointed Imams or committee members verified yet.
                </p>
                {onOpenRoleClaim && (
                  <p className="text-[11px] text-[#6e6e73] mt-1.5">
                    Are you the Imam, Muazzin, or a committee member?{' '}
                    <button
                      type="button"
                      onClick={() => onOpenRoleClaim(mosque)}
                      className="font-semibold text-emerald-700 hover:text-emerald-800 hover:underline focus-visible:ring-2 focus-visible:ring-[#111114] focus:outline-none rounded"
                    >
                      Claim official role
                    </button>
                  </p>
                )}
              </div>
            )}
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
            <div className="flex items-center justify-between mb-2">
              <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Community Attendance
              </h3>
              <div className="text-xs font-medium text-zinc-600 flex items-center gap-2">
                <span className="flex items-center gap-1" title="Regular worshippers">
                  <Users className="w-3.5 h-3.5 text-emerald-600" />
                  <strong className="text-zinc-900 font-semibold">{regularCount}</strong> regular
                </span>
                <span className="text-zinc-300">•</span>
                <span title="Occasional attendees">
                  <strong className="text-zinc-900 font-semibold">{occasionalCount}</strong> occasional
                </span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 mt-2">
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
            <p className="text-[11px] text-[#8e8e93] mt-2 text-center">
              One-time selection • Declare your attendance affiliation with this mosque
            </p>
          </div>

          {/* Community Suggestions & Feedback */}
          <div className="p-3.5 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-1.5">
                <MessageSquare className="w-3.5 h-3.5 text-blue-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                  Community Feedback
                </h3>
              </div>
              <button
                type="button"
                onClick={() => onOpenSuggestion(mosque)}
                className="text-[11px] font-semibold text-blue-700 hover:underline"
              >
                + Suggest / Complain
              </button>
            </div>

            {publicSuggestions.length > 0 ? (
              <div className="space-y-2">
                {publicSuggestions.slice(0, 3).map((item) => (
                  <div
                    key={item.id}
                    className="p-2.5 bg-white border border-[#e8e8ea] rounded-xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between gap-1 flex-wrap">
                      <div className="flex items-center gap-1.5">
                        <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-zinc-100 text-[#111114]">
                          {item.type}
                        </span>
                        {item.urgency === 'HIGH' && (
                          <span className="px-1.5 py-0.5 rounded text-[10px] font-semibold bg-rose-50 text-rose-700">
                            Urgent
                          </span>
                        )}
                        {item.targetRoles && item.targetRoles.length > 0 && (
                          <span className="text-[10px] text-[#6e6e73]">
                            To: {item.targetRoles.join(', ')}
                          </span>
                        )}
                      </div>
                      <span
                        className={`text-[10px] font-medium ${
                          item.status === 'RESOLVED'
                            ? 'text-emerald-600'
                            : 'text-[#6e6e73]'
                        }`}
                      >
                        {item.status}
                      </span>
                    </div>
                    <p className="text-[11px] text-[#111114] leading-relaxed">
                      {item.description}
                    </p>
                    {item.resolutionNotes && (
                      <div className="text-[10px] text-emerald-800 bg-emerald-50 rounded p-1.5 mt-1 border border-emerald-100">
                        <span className="font-semibold">Committee response: </span>
                        {item.resolutionNotes}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-[#6e6e73]">
                No public suggestions posted yet. Click Suggest below to submit feedback for the Imam or Committee.
              </p>
            )}
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
