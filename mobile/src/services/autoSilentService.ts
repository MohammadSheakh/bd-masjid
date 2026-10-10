/**
 * Auto-Silent Service bridging React Native to the native Android Kotlin TurboModule
 * Conforming to ADR-029 and ADR-034
 */
import { NativeModules, Platform } from 'react-native';
import { PrayerSchedule, PrayerAutoSilentSettings } from '../types/mosque';
import { convertTo24Hour } from '../lib/time';

const { AndroidAutoSilentManager } = NativeModules;

export const AutoSilentService = {
  isSupported(): boolean {
    return Platform.OS === 'android';
  },

  async checkDndPermission(): Promise<boolean> {
    if (!this.isSupported() || !AndroidAutoSilentManager?.checkDndPermission) {
      return false;
    }
    try {
      return await AndroidAutoSilentManager.checkDndPermission();
    } catch {
      return false;
    }
  },

  requestDndPermission(): void {
    if (this.isSupported() && AndroidAutoSilentManager?.requestDndPermission) {
      AndroidAutoSilentManager.requestDndPermission();
    }
  },

  async syncDailyPrayerAlarms(
    schedule: PrayerSchedule,
    settings: PrayerAutoSilentSettings
  ): Promise<void> {
    if (!this.isSupported() || !settings.isEnabled || !AndroidAutoSilentManager) {
      return;
    }

    const prayers = [
      { name: 'Fajr', key: 'fajr' as const, time: schedule.fajrJamaat },
      { name: 'Zuhr', key: 'zuhr' as const, time: schedule.zuhrJamaat },
      { name: 'Asr', key: 'asr' as const, time: schedule.asrJamaat },
      { name: 'Maghrib', key: 'maghrib' as const, time: schedule.maghribJamaat },
      { name: 'Isha', key: 'isha' as const, time: schedule.ishaJamaat },
    ];

    const now = new Date();

    for (const p of prayers) {
      if (!p.time || !settings.enabledPrayers[p.key]) continue;

      const time24 = convertTo24Hour(p.time);
      const [h, m] = time24.split(':').map(Number);
      if (isNaN(h) || isNaN(m)) continue;

      const trigger = new Date(now);
      trigger.setHours(h, m, 0, 0);

      // If today's Jammat is still upcoming, schedule it
      if (trigger.getTime() > now.getTime()) {
        try {
          await AndroidAutoSilentManager.schedulePrayerSilence(
            p.name,
            trigger.getTime(),
            settings.durationMinutes
          );
        } catch {
          // Fallback or dev client mock
        }
      }
    }
  },
};
