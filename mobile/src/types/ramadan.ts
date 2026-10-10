/**
 * Ramadan & Fasting Domain Models and Taxonomy (ADR-061)
 */

export type BangladeshiDivision =
  | 'DHAKA'
  | 'CHITTAGONG'
  | 'SYLHET'
  | 'RAJSHAHI'
  | 'KHULNA'
  | 'BARISHAL'
  | 'RANGPUR'
  | 'MYMENSINGH';

export interface DivisionOffset {
  division: BangladeshiDivision;
  nameBangla: string;
  nameEnglish: string;
  sehriOffsetMinutes: number;
  iftarOffsetMinutes: number;
}

export type FastingTarget = 'SEHRI' | 'IFTAR';

export interface FastingCountdownState {
  target: FastingTarget;
  targetTime: string;
  hoursLeft: number;
  minutesLeft: number;
  secondsLeft: number;
  progressPercent: number;
  isFastingActive: boolean;
  selectedDivision: BangladeshiDivision;
}

export interface RamadanDaySchedule {
  dayNumber: number;
  hijriDate: string;
  sehriEndTime: string;
  iftarTime: string;
}

export interface FastingDua {
  id: 'SEHRI_NIYYAT' | 'IFTAR_DUA';
  titleBangla: string;
  titleEnglish: string;
  arabic: string;
  transliterationBangla: string;
  translationBangla: string;
  translationEnglish: string;
}
