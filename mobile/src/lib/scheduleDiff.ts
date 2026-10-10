import { PrayerScheduleSnapshot } from '../types/prayerScheduleAudit';

export interface WaqtDiffItem {
  key: string;
  nameEn: string;
  nameBn: string;
  oldTime: string | null;
  newTime: string;
  diffMinutes: number | null;
  diffBadge: string | null;
  isChanged: boolean;
}

export function parseMinutesFromTimeString(timeStr?: string | null): number | null {
  if (!timeStr) return null;
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return null;
  const hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return null;
  return hours * 60 + minutes;
}

export function formatTime12h(timeStr?: string | null): string {
  if (!timeStr) return '—';
  const parts = timeStr.trim().split(':');
  if (parts.length < 2) return timeStr;
  let hours = parseInt(parts[0], 10);
  const minutes = parseInt(parts[1], 10);
  if (isNaN(hours) || isNaN(minutes)) return timeStr;
  const period = hours >= 12 ? 'PM' : 'AM';
  hours = hours % 12;
  if (hours === 0) hours = 12;
  const minPad = minutes < 10 ? `0${minutes}` : `${minutes}`;
  return `${hours}:${minPad} ${period}`;
}

const WAQT_CONFIG = [
  { key: 'fajrJamaat', nameEn: 'Fajr', nameBn: 'ফজর' },
  { key: 'zuhrJamaat', nameEn: 'Zuhr', nameBn: 'যোহর' },
  { key: 'asrJamaat', nameEn: 'Asr', nameBn: 'আসর' },
  { key: 'maghribJamaat', nameEn: 'Maghrib', nameBn: 'মাগরিব' },
  { key: 'ishaJamaat', nameEn: 'Isha', nameBn: 'ইশা' },
  { key: 'jumuahJamaat', nameEn: "Jumu'ah", nameBn: 'জুমা' },
] as const;

export function computeScheduleDiff(
  current: PrayerScheduleSnapshot,
  previous?: PrayerScheduleSnapshot | null
): WaqtDiffItem[] {
  return WAQT_CONFIG.map((cfg) => {
    const newTime = (current as Record<string, any>)[cfg.key] || '—';
    const oldTime = previous ? (previous as Record<string, any>)[cfg.key] || null : null;

    let diffMinutes: number | null = null;
    let diffBadge: string | null = null;
    let isChanged = false;

    if (oldTime && newTime !== '—') {
      const newMins = parseMinutesFromTimeString(newTime);
      const oldMins = parseMinutesFromTimeString(oldTime);

      if (newMins !== null && oldMins !== null) {
        diffMinutes = newMins - oldMins;
        if (diffMinutes !== 0) {
          isChanged = true;
          const sign = diffMinutes > 0 ? '+' : '';
          diffBadge = `${sign}${diffMinutes}m`;
        }
      }
    }

    return {
      key: cfg.key,
      nameEn: cfg.nameEn,
      nameBn: cfg.nameBn,
      oldTime,
      newTime,
      diffMinutes,
      diffBadge,
      isChanged,
    };
  });
}
