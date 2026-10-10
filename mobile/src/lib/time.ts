/**
 * Time utility functions for 12-hour / 24-hour prayer time formatting,
 * next Jammat calculations, and Auto-Silent window verification.
 */
import { PrayerSchedule } from '../types/mosque';

export function formatTo12Hour(time?: string | null, fallback: string = '—'): string {
  if (!time || !time.trim()) return fallback;
  const trimmed = time.trim();

  const ampmMatch = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (ampmMatch) {
    const h = parseInt(ampmMatch[1], 10);
    const m = ampmMatch[2];
    const period = ampmMatch[3].toUpperCase();
    return `${h}:${m} ${period}`;
  }

  if (trimmed.toLowerCase().startsWith('2nd:')) {
    const rest = trimmed.slice(4).trim();
    return `2nd: ${formatTo12Hour(rest, rest)}`;
  }

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const hours24 = parseInt(match24[1], 10);
    const minutes = match24[2];
    if (hours24 >= 0 && hours24 <= 23) {
      const period = hours24 >= 12 ? 'PM' : 'AM';
      const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
      return `${hours12}:${minutes} ${period}`;
    }
  }

  return trimmed;
}

export function convertTo24Hour(timeStr?: string | null): string {
  if (!timeStr || !timeStr.trim()) return '';
  const trimmed = timeStr.trim();

  const match12 = trimmed.match(/^(\d{1,2}):(\d{2})\s*(AM|PM|am|pm)$/i);
  if (match12) {
    let h = parseInt(match12[1], 10);
    const m = match12[2];
    const period = match12[3].toUpperCase();
    if (period === 'PM' && h < 12) h += 12;
    if (period === 'AM' && h === 12) h = 0;
    return `${String(h).padStart(2, '0')}:${m}`;
  }

  const match24 = trimmed.match(/^(\d{1,2}):(\d{2})$/);
  if (match24) {
    const h = parseInt(match24[1], 10);
    const m = match24[2];
    if (h >= 0 && h <= 23) {
      return `${String(h).padStart(2, '0')}:${m}`;
    }
  }

  return trimmed;
}

export interface NextJamaatResult {
  prayerName: string;
  prayerTime12h: string;
  secondsRemaining: number;
  targetDate: Date;
  isInSilenceWindow: boolean;
  activeSilenceRemainingSeconds: number;
}

export function getNextJamaatInfo(
  schedule?: PrayerSchedule | null,
  now: Date = new Date(),
  silenceDurationMinutes: number = 10
): NextJamaatResult | null {
  if (!schedule) return null;

  const prayers: Array<{ key: string; name: string; rawTime: string | null | undefined }> = [
    { key: 'fajr', name: 'Fajr', rawTime: schedule.fajrJamaat },
    { key: 'zuhr', name: 'Zuhr', rawTime: schedule.zuhrJamaat },
    { key: 'asr', name: 'Asr', rawTime: schedule.asrJamaat },
    { key: 'maghrib', name: 'Maghrib', rawTime: schedule.maghribJamaat },
    { key: 'isha', name: 'Isha', rawTime: schedule.ishaJamaat },
  ];

  const nowMs = now.getTime();
  const silenceWindowMs = silenceDurationMinutes * 60 * 1000;

  // Check if currently inside any prayer's silence window [jammat, jammat + silenceDuration]
  for (const p of prayers) {
    if (!p.rawTime) continue;
    const time24 = convertTo24Hour(p.rawTime);
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    const prayerToday = new Date(now);
    prayerToday.setHours(h, m, 0, 0);
    const prayerMs = prayerToday.getTime();

    if (nowMs >= prayerMs && nowMs <= prayerMs + silenceWindowMs) {
      const remainingSec = Math.max(0, Math.floor((prayerMs + silenceWindowMs - nowMs) / 1000));
      return {
        prayerName: p.name,
        prayerTime12h: formatTo12Hour(p.rawTime),
        secondsRemaining: 0,
        targetDate: prayerToday,
        isInSilenceWindow: true,
        activeSilenceRemainingSeconds: remainingSec,
      };
    }
  }

  // Look for next upcoming prayer today
  for (const p of prayers) {
    if (!p.rawTime) continue;
    const time24 = convertTo24Hour(p.rawTime);
    const [h, m] = time24.split(':').map(Number);
    if (isNaN(h) || isNaN(m)) continue;

    const prayerToday = new Date(now);
    prayerToday.setHours(h, m, 0, 0);

    if (prayerToday.getTime() > nowMs) {
      const secondsRemaining = Math.floor((prayerToday.getTime() - nowMs) / 1000);
      return {
        prayerName: p.name,
        prayerTime12h: formatTo12Hour(p.rawTime),
        secondsRemaining,
        targetDate: prayerToday,
        isInSilenceWindow: false,
        activeSilenceRemainingSeconds: 0,
      };
    }
  }

  // If all prayers today have passed, target tomorrow's Fajr
  const fajr = prayers[0];
  if (fajr?.rawTime) {
    const time24 = convertTo24Hour(fajr.rawTime);
    const [h, m] = time24.split(':').map(Number);
    if (!isNaN(h) && !isNaN(m)) {
      const tomorrowFajr = new Date(now);
      tomorrowFajr.setDate(tomorrowFajr.getDate() + 1);
      tomorrowFajr.setHours(h, m, 0, 0);
      const secondsRemaining = Math.floor((tomorrowFajr.getTime() - nowMs) / 1000);
      return {
        prayerName: 'Fajr',
        prayerTime12h: formatTo12Hour(fajr.rawTime),
        secondsRemaining,
        targetDate: tomorrowFajr,
        isInSilenceWindow: false,
        activeSilenceRemainingSeconds: 0,
      };
    }
  }

  return null;
}

export function formatSecondsToCountdown(totalSeconds: number): string {
  if (totalSeconds <= 0) return '00:00:00';
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;

  const pad = (n: number) => String(n).padStart(2, '0');
  if (hours > 0) {
    return `${pad(hours)}h ${pad(minutes)}m ${pad(seconds)}s`;
  }
  return `${pad(minutes)}m ${pad(seconds)}s`;
}
