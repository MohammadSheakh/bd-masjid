import React from 'react';
import type { Metadata } from 'next';
import Link from 'next/link';
import { notFound } from 'next/navigation';
import { fetchMosqueById } from '@/lib/api';
import {
  MapPin,
  Clock,
  CheckCircle2,
  Users,
  Navigation,
  ArrowLeft,
  Share2,
  Megaphone,
  Pin,
  CreditCard,
  ShieldCheck,
  Smartphone,
  Building,
  Moon,
} from 'lucide-react';
import { PrayerCountdownBanner } from '@/components/PrayerCountdownBanner';
import { MosqueStaffManager } from '@/components/MosqueStaffManager';
import { MosqueFacilitiesSection } from '@/components/MosqueFacilitiesSection';
import { MosqueAnnouncementsCard } from '@/components/MosqueAnnouncementsCard';
import { MosqueDonationsDirectory } from '@/components/donations/MosqueDonationsDirectory';
import { formatTo12Hour } from '@/lib/time';

interface MosquePageProps {
  params: Promise<{ id: string }>;
}

export async function generateMetadata({ params }: MosquePageProps): Promise<Metadata> {
  const { id } = await params;
  const mosque = await fetchMosqueById(id);

  if (!mosque) {
    return {
      title: 'Mosque Not Found | BD Masjid',
    };
  }

  return {
    title: `${mosque.name} — Prayer Times & Jammat Schedule | BD Masjid`,
    description: `Find verified daily prayer and Jamaat schedule for ${mosque.name} in ${mosque.city || 'Bangladesh'}. Track attendance and join the local community.`,
  };
}

export default async function MosquePage({ params }: MosquePageProps) {
  const { id } = await params;
  const mosque = await fetchMosqueById(id);

  if (!mosque) {
    notFound();
  }

  const schedule = mosque.prayerSchedule;
  const freshness = mosque.freshness || { level: 'FRESH', daysAgo: 0 };
  const freshnessLabel = {
    FRESH: `Verified recently (${freshness.daysAgo}d ago)`,
    STALE: `Updated ${freshness.daysAgo}d ago · May need seasonal check`,
    VERY_STALE: `Updated ${freshness.daysAgo}d ago · Outdated`,
  }[freshness.level || 'FRESH'];

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

  const directionsUrl = `https://www.google.com/maps/dir/?api=1&destination=${mosque.latitude},${mosque.longitude}`;

  return (
    <div className="min-h-screen bg-[#fafafa] text-[#111114]">
      {/* Top Bar */}
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8e8ea] px-4 py-3 flex items-center justify-between">
        <Link
          href="/"
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#111114] hover:text-emerald-700 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Back to Map</span>
        </Link>
        <span className="font-bold text-sm tracking-tight text-[#111114]">BD Masjid</span>
        <span className="w-12" />
      </header>

      {/* Main Container */}
      <main className="max-w-2xl mx-auto p-4 sm:p-6 space-y-6">
        {/* Profile Card */}
        <div className="p-6 rounded-3xl bg-white border border-[#e8e8ea] shadow-sm space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 flex-wrap">
                <h1 className="text-xl sm:text-2xl font-bold tracking-tight text-[#111114]">
                  {mosque.name}
                </h1>
                {mosque.verificationStatus === 'VERIFIED' ? (
                  <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                    <CheckCircle2 className="w-3.5 h-3.5" />
                    Verified
                  </span>
                ) : (
                  <span className="text-xs font-medium px-2 py-0.5 rounded-full bg-zinc-100 text-zinc-600">
                    Unverified
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm text-[#6e6e73] flex items-center gap-1.5 mt-1.5">
                <MapPin className="w-4 h-4 shrink-0 text-zinc-400" />
                <span>{mosque.address || 'Address not listed'}, {mosque.city || 'Bangladesh'}</span>
              </p>
            </div>
          </div>

          {/* Live Next Prayer Countdown & Reminder */}
          <PrayerCountdownBanner schedule={schedule} mosqueName={mosque.name} />

          {/* Freshness Banner */}
          <div className="flex items-center justify-between text-xs px-3.5 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200">
            <span className="flex items-center gap-1.5 text-zinc-700 font-medium">
              <Clock className="w-4 h-4 text-emerald-600" />
              {freshnessLabel}
            </span>
            <Link
              href="/"
              className="text-xs font-semibold text-emerald-700 hover:underline"
            >
              Suggest Update
            </Link>
          </div>

          {/* Timetable Table */}
          <div>
            <h2 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2.5">
              Daily Jamaat Timetable
            </h2>
            <div className="rounded-2xl border border-[#e8e8ea] overflow-hidden bg-white">
              <div className="grid grid-cols-3 text-xs font-semibold text-[#6e6e73] bg-[#fafafa] px-4 py-2.5 border-b border-[#e8e8ea]">
                <span>Prayer</span>
                <span className="text-center">Start Time</span>
                <span className="text-right">Jamaat Time</span>
              </div>
              <div className="divide-y divide-[#f0f0f2]">
                {prayerRows.map((row) => (
                  <div
                    key={row.name}
                    className={`grid grid-cols-3 items-center text-xs sm:text-sm px-4 py-3 ${
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
              <div className="mt-3 p-3.5 rounded-2xl bg-emerald-50/70 border border-emerald-200/80">
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

          {/* Imams & Committee / Staff Governance */}
          <MosqueStaffManager
            mosqueId={mosque.id}
            initialStaff={mosque.staffMembers || []}
          />

          {/* Official Notices & Announcements (F-022) */}
          <MosqueAnnouncementsCard
            mosqueId={mosque.id}
            mosqueName={mosque.name}
            initialAnnouncements={mosque.announcements || []}
          />

          {/* Attendance Overview */}
          {mosque.attendanceSummary && (
            <div className="p-4 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] flex items-center justify-between">
              <div>
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                  Community Attendance
                </h3>
                <p className="text-sm font-semibold text-[#111114] mt-0.5">
                  {mosque.attendanceSummary.regularCount} Regular Attendees
                </p>
              </div>
              <Users className="w-6 h-6 text-zinc-400" />
            </div>
          )}

          {/* Verified Donations (F-030) */}
          <div className="pt-2">
            <MosqueDonationsDirectory mosqueId={mosque.id} mosqueName={mosque.name} />
          </div>

          {/* Actions */}
          <div className="pt-2 flex items-center gap-3">
            <a
              href={directionsUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex-1 py-3 px-4 rounded-full bg-[#111114] hover:bg-[#27272a] text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
            >
              <Navigation className="w-4 h-4 text-emerald-400" />
              <span>Get Directions</span>
            </a>

            <Link
              href="/"
              className="py-3 px-5 rounded-full bg-white border border-[#e8e8ea] hover:bg-zinc-50 text-xs font-semibold text-[#111114] transition-all"
            >
              View on Map
            </Link>
          </div>
        </div>
      </main>
    </div>
  );
}
