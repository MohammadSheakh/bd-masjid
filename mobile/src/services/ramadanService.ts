/**
 * Ramadan & Fasting Service (ADR-061)
 * - Synchronous real-time Sehri / Iftar countdown engine (< 1ms access)
 * - 8-Division offset calculator relative to Islamic Foundation Bangladesh Dhaka baseline
 * - Authentic Fasting Duas and 30-Day schedule generator
 */

import { BangladeshiDivision, DivisionOffset, FastingCountdownState, FastingDua, RamadanDaySchedule } from '../types/ramadan';
import { BANGLADESH_DIVISION_OFFSETS, DHAKA_BASELINE_SCHEDULE, FASTING_DUAS } from '../data/ramadanFixtures';
import { PreferencesStorage } from '../lib/storage';

let currentDivision: BangladeshiDivision = 'DHAKA';
const listeners = new Set<(state: FastingCountdownState) => void>();

function parseTimeToMinutes(timeStr: string): number {
  const [h, m] = timeStr.split(':').map(Number);
  return h * 60 + m;
}

function formatMinutesToTime(totalMinutes: number): string {
  const norm = ((totalMinutes % 1440) + 1440) % 1440;
  const h = Math.floor(norm / 60);
  const m = norm % 60;
  return `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
}

export const RamadanService = {
  init(): void {
    currentDivision = PreferencesStorage.getRamadanDivision() as BangladeshiDivision;
  },

  getSelectedDivisionSync(): BangladeshiDivision {
    return currentDivision;
  },

  setSelectedDivision(division: BangladeshiDivision): void {
    currentDivision = division;
    PreferencesStorage.setRamadanDivision(division);
    notifyListeners();
  },

  getDivisionOffsetSync(division: BangladeshiDivision = currentDivision): DivisionOffset {
    return BANGLADESH_DIVISION_OFFSETS[division] || BANGLADESH_DIVISION_OFFSETS.DHAKA;
  },

  getAllDivisions(): DivisionOffset[] {
    return Object.values(BANGLADESH_DIVISION_OFFSETS);
  },

  getDuas(): FastingDua[] {
    return FASTING_DUAS;
  },

  getDailyScheduleSync(dayIndex: number = 0): RamadanDaySchedule {
    const baseline = DHAKA_BASELINE_SCHEDULE[dayIndex % DHAKA_BASELINE_SCHEDULE.length];
    const offset = this.getDivisionOffsetSync();
    const sehriMins = parseTimeToMinutes(baseline.sehriEndTime) + offset.sehriOffsetMinutes;
    const iftarMins = parseTimeToMinutes(baseline.iftarTime) + offset.iftarOffsetMinutes;

    return {
      dayNumber: baseline.dayNumber,
      hijriDate: baseline.hijriDate,
      sehriEndTime: formatMinutesToTime(sehriMins),
      iftarTime: formatMinutesToTime(iftarMins),
    };
  },

  getFullScheduleSync(): RamadanDaySchedule[] {
    return DHAKA_BASELINE_SCHEDULE.map((_, idx) => this.getDailyScheduleSync(idx));
  },

  getFastingCountdownStateSync(): FastingCountdownState {
    const now = new Date();
    const currentMins = now.getHours() * 60 + now.getMinutes();
    const currentSecs = currentMins * 60 + now.getSeconds();

    const today = this.getDailyScheduleSync(0);
    const sehriEndSecs = parseTimeToMinutes(today.sehriEndTime) * 60;
    const iftarSecs = parseTimeToMinutes(today.iftarTime) * 60;

    let target: 'SEHRI' | 'IFTAR';
    let targetSecs: number;
    let targetTimeStr: string;
    let isFastingActive: boolean;

    if (currentSecs >= sehriEndSecs && currentSecs < iftarSecs) {
      target = 'IFTAR';
      targetSecs = iftarSecs;
      targetTimeStr = today.iftarTime;
      isFastingActive = true;
    } else {
      target = 'SEHRI';
      targetSecs = currentSecs < sehriEndSecs ? sehriEndSecs : sehriEndSecs + 86400;
      targetTimeStr = today.sehriEndTime;
      isFastingActive = false;
    }

    const diffSecs = Math.max(0, targetSecs - currentSecs);
    const hoursLeft = Math.floor(diffSecs / 3600);
    const minutesLeft = Math.floor((diffSecs % 3600) / 60);
    const secondsLeft = diffSecs % 60;

    const totalWindowSecs = target === 'IFTAR' ? (iftarSecs - sehriEndSecs) : (86400 - (iftarSecs - sehriEndSecs));
    const elapsedSecs = totalWindowSecs - diffSecs;
    const progressPercent = Math.min(100, Math.max(0, Math.round((elapsedSecs / totalWindowSecs) * 100)));

    return {
      target,
      targetTime: targetTimeStr,
      hoursLeft,
      minutesLeft,
      secondsLeft,
      progressPercent,
      isFastingActive,
      selectedDivision: currentDivision,
    };
  },

  subscribe(listener: (state: FastingCountdownState) => void): () => void {
    listeners.add(listener);
    listener(this.getFastingCountdownStateSync());
    return () => {
      listeners.delete(listener);
    };
  },
};

function notifyListeners(): void {
  const state = RamadanService.getFastingCountdownStateSync();
  listeners.forEach((fn) => {
    try {
      fn(state);
    } catch {}
  });
}
