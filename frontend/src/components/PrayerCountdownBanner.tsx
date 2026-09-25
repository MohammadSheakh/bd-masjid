'use client';

import React, { useState, useEffect } from 'react';
import { PrayerSchedule } from '@/types/mosque';
import { Clock, Bell, BellRing, Moon } from 'lucide-react';

interface PrayerCountdownBannerProps {
  schedule?: PrayerSchedule | null;
  mosqueName?: string;
}

interface UpcomingPrayer {
  name: string;
  time: string;
  diffMinutes: number;
  isRamadanIftar?: boolean;
  isRamadanSahri?: boolean;
}

export function PrayerCountdownBanner({ schedule, mosqueName }: PrayerCountdownBannerProps) {
  const [upcoming, setUpcoming] = useState<UpcomingPrayer | null>(null);
  const [hasNotificationPermission, setHasNotificationPermission] = useState<boolean>(false);
  const [isAlertActive, setIsAlertActive] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      setHasNotificationPermission(Notification.permission === 'granted');
    }
  }, []);

  useEffect(() => {
    const calculateNextPrayer = () => {
      // Current Bangladesh time (Asia/Dhaka)
      const now = new Date();
      const dhakaTimeStr = now.toLocaleTimeString('en-US', {
        timeZone: 'Asia/Dhaka',
        hour12: false,
        hour: '2-digit',
        minute: '2-digit',
      });
      const [currH, currM] = dhakaTimeStr.split(':').map(Number);
      const currTotal = currH * 60 + currM;

      // Day of week in Dhaka (5 is Friday)
      const dayOfWeek = new Intl.DateTimeFormat('en-US', {
        timeZone: 'Asia/Dhaka',
        weekday: 'short',
      }).format(now);
      const isFriday = dayOfWeek === 'Fri';

      // Candidate prayers in chronological order
      const candidates: Array<{ name: string; time?: string | null; isIftar?: boolean; isSahri?: boolean }> = [
        { name: 'Sahri End', time: schedule?.sahriEnd, isSahri: true },
        { name: 'Fajr', time: schedule?.fajrJamaat || '05:15' },
        isFriday
          ? { name: "Jumu'ah", time: schedule?.jumuahJamaat || '13:30' }
          : { name: 'Zuhr', time: schedule?.zuhrJamaat || '13:30' },
        { name: 'Asr', time: schedule?.asrJamaat || '16:45' },
        { name: 'Iftar', time: schedule?.iftarStart, isIftar: true },
        { name: 'Maghrib', time: schedule?.maghribJamaat || '18:15' },
        { name: 'Isha', time: schedule?.ishaJamaat || '20:00' },
        { name: 'Taraweeh', time: schedule?.taraweehJamaat },
      ];

      // Parse and find next upcoming
      const validCandidates = candidates.filter(
        (c): c is { name: string; time: string; isIftar?: boolean; isSahri?: boolean } =>
          Boolean(c.time && /^\d{2}:\d{2}$/.test(c.time)),
      );

      for (const item of validCandidates) {
        const [h, m] = item.time.split(':').map(Number);
        const itemTotal = h * 60 + m;
        if (itemTotal > currTotal) {
          setUpcoming({
            name: item.name,
            time: item.time,
            diffMinutes: itemTotal - currTotal,
            isRamadanIftar: item.isIftar,
            isRamadanSahri: item.isSahri,
          });
          return;
        }
      }

      // If all passed for today, next is tomorrow's Fajr
      const fajrTime = schedule?.fajrJamaat || '05:15';
      const [fH, fM] = fajrTime.split(':').map(Number);
      const fajrTotalTomorrow = 24 * 60 + (fH * 60 + fM);
      setUpcoming({
        name: 'Fajr (Tomorrow)',
        time: fajrTime,
        diffMinutes: fajrTotalTomorrow - currTotal,
      });
    };

    calculateNextPrayer();
    const interval = setInterval(calculateNextPrayer, 30000); // refresh every 30s
    return () => clearInterval(interval);
  }, [schedule]);

  const handleToggleReminder = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert('Browser notifications are not supported on this device.');
      return;
    }

    if (Notification.permission !== 'granted') {
      const permission = await Notification.requestPermission();
      if (permission === 'granted') {
        setHasNotificationPermission(true);
        setIsAlertActive(true);
        new Notification('BD Masjid Reminder Activated', {
          body: `You will be alerted before ${upcoming?.name || 'the next prayer'} (${upcoming?.time})`,
          icon: '/favicon.ico',
        });
      }
    } else {
      const nextState = !isAlertActive;
      setIsAlertActive(nextState);
      if (nextState && upcoming) {
        new Notification('BD Masjid Reminder Set', {
          body: `Alert scheduled for ${upcoming.name} Jamaat at ${upcoming.time}`,
          icon: '/favicon.ico',
        });
      }
    }
  };

  if (!upcoming) return null;

  const formatCountdown = (mins: number) => {
    if (mins < 60) return `in ${mins} min${mins === 1 ? '' : 's'}`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return `in ${h}h ${m > 0 ? `${m}m` : ''}`;
  };

  return (
    <div className="relative overflow-hidden bg-gradient-to-r from-emerald-950 via-[#111114] to-emerald-950 text-white px-3.5 py-2.5 rounded-2xl border border-emerald-900/40 shadow-sm flex items-center justify-between gap-3 animate-in fade-in duration-200">
      <div className="flex items-center gap-2.5 min-w-0">
        <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 border border-emerald-500/30">
          {upcoming.isRamadanIftar || upcoming.isRamadanSahri ? (
            <Moon className="w-4 h-4 text-amber-300" />
          ) : (
            <Clock className="w-4 h-4 text-emerald-400" />
          )}
        </div>
        <div className="min-w-0">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span className="text-[11px] font-semibold text-emerald-300 uppercase tracking-wider">
                Next: {upcoming.name}
              </span>
            </span>
            <span className="text-xs font-bold text-white tracking-tight">
              {upcoming.time}
            </span>
            <span className="text-[11px] text-zinc-400 font-medium">
              ({formatCountdown(upcoming.diffMinutes)})
            </span>
          </div>
          <p className="text-[10px] text-zinc-400 truncate">
            {mosqueName ? `${mosqueName} · ` : ''}Bangladesh Standard Time
          </p>
        </div>
      </div>

      <button
        onClick={handleToggleReminder}
        className={`flex items-center gap-1 px-2.5 py-1 rounded-full text-[11px] font-semibold transition-all shrink-0 active:scale-95 border ${
          isAlertActive
            ? 'bg-emerald-600 text-white border-emerald-500 shadow-sm'
            : 'bg-white/10 hover:bg-white/15 text-zinc-300 border-white/10'
        }`}
        title={isAlertActive ? 'Prayer alert active' : 'Click to enable prayer alert'}
      >
        {isAlertActive ? (
          <>
            <BellRing className="w-3.5 h-3.5 text-emerald-300 animate-bounce" />
            <span className="hidden sm:inline">Alert Set</span>
          </>
        ) : (
          <>
            <Bell className="w-3.5 h-3.5 text-zinc-400" />
            <span className="hidden sm:inline">Alert Me</span>
          </>
        )}
      </button>
    </div>
  );
}
