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
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2.5">
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

          {/* Imams & Committee */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2.5">
              Imams & Managing Committee
            </h3>
            <div className="p-3.5 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl divide-y divide-[#ececed] text-xs">
              {mosque.staffMembers && mosque.staffMembers.length > 0 ? (
                mosque.staffMembers.map((staff) => (
                  <div key={staff.id} className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-semibold text-[#111114] block">
                        {staff.name}
                      </span>
                      <span className="text-[11px] text-[#6e6e73]">
                        {staff.role.replace(/_/g, ' ')}
                      </span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                ))
              ) : (
                <>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-semibold text-[#111114] block">Pesh Imam</span>
                      <span className="text-[11px] text-[#6e6e73]">Appointed Religious Scholar</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                  <div className="flex items-center justify-between py-2">
                    <div>
                      <span className="font-semibold text-[#111114] block">Muazzin</span>
                      <span className="text-[11px] text-[#6e6e73]">Regular Caller to Prayer</span>
                    </div>
                    <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                      Verified
                    </span>
                  </div>
                </>
              )}
            </div>
          </div>

          {/* Community Notices & Announcements */}
          {mosque.announcements && mosque.announcements.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <Megaphone className="w-3.5 h-3.5 text-amber-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                  Community Notices
                </h3>
              </div>
              <div className="space-y-2.5">
                {mosque.announcements.map((item) => (
                  <div
                    key={item.id}
                    className={`p-3.5 rounded-2xl border ${
                      item.isPinned
                        ? 'bg-amber-50/40 border-amber-200'
                        : 'bg-[#fafafa] border-[#e8e8ea]'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-1.5">
                        {item.isPinned && (
                          <span className="inline-flex items-center gap-0.5 text-[9px] font-bold text-amber-800 bg-amber-100/80 px-1.5 py-0.5 rounded-full">
                            <Pin className="w-2.5 h-2.5" />
                            Pinned
                          </span>
                        )}
                        <h4 className="text-xs font-bold text-[#111114]">{item.title}</h4>
                      </div>
                      <span className="text-[10px] text-[#6e6e73] font-mono">
                        {new Date(item.createdAt).toLocaleDateString()}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-700 leading-relaxed whitespace-pre-line">
                      {item.content}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

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

          {/* Verified Donations (Release 3) */}
          {mosque.donationMethods && mosque.donationMethods.length > 0 && (
            <div>
              <div className="flex items-center gap-1.5 mb-2.5">
                <CreditCard className="w-3.5 h-3.5 text-emerald-600" />
                <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                  Verified Donation Channels
                </h3>
              </div>
              <div className="space-y-2">
                {mosque.donationMethods.map((method) => (
                  <div
                    key={method.id}
                    className="p-3 bg-[#fafafa] border border-[#e8e8ea] rounded-2xl text-xs space-y-1"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-1.5 font-bold text-[#111114]">
                        {method.methodType === 'BANK_TRANSFER' ? (
                          <Building className="w-3.5 h-3.5 text-blue-600" />
                        ) : (
                          <Smartphone className="w-3.5 h-3.5 text-pink-600" />
                        )}
                        <span>{method.methodType.replace(/_/g, ' ')}</span>
                        <span className="text-[10px] font-normal text-[#6e6e73]">
                          ({method.accountType.replace(/_/g, ' ')})
                        </span>
                      </div>
                      <span className="text-[10px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                        Verified
                      </span>
                    </div>

                    <div className="font-mono font-bold text-sm text-zinc-900 pt-0.5">
                      {method.accountNumber}
                    </div>

                    {method.accountTitle && (
                      <div className="text-[11px] text-[#6e6e73]">
                        Beneficiary: <strong className="text-zinc-800">{method.accountTitle}</strong>
                      </div>
                    )}

                    {method.instructions && (
                      <div className="text-[10px] text-zinc-500 pt-0.5">
                        {method.instructions}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

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
