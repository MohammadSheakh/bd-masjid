/**
 * Ramadan Division Offsets, Baseline Timetable & Authentic Duas (ADR-061)
 * Islamic Foundation Bangladesh (IFB) standard regional calculations.
 */

import { BangladeshiDivision, DivisionOffset, FastingDua, RamadanDaySchedule } from '../types/ramadan';

export const BANGLADESH_DIVISION_OFFSETS: Record<BangladeshiDivision, DivisionOffset> = {
  DHAKA: {
    division: 'DHAKA',
    nameBangla: 'ঢাকা',
    nameEnglish: 'Dhaka',
    sehriOffsetMinutes: 0,
    iftarOffsetMinutes: 0,
  },
  CHITTAGONG: {
    division: 'CHITTAGONG',
    nameBangla: 'চট্টগ্রাম',
    nameEnglish: 'Chittagong',
    sehriOffsetMinutes: -3,
    iftarOffsetMinutes: -4,
  },
  SYLHET: {
    division: 'SYLHET',
    nameBangla: 'সিলেট',
    nameEnglish: 'Sylhet',
    sehriOffsetMinutes: -5,
    iftarOffsetMinutes: -5,
  },
  RAJSHAHI: {
    division: 'RAJSHAHI',
    nameBangla: 'রাজশাহী',
    nameEnglish: 'Rajshahi',
    sehriOffsetMinutes: 6,
    iftarOffsetMinutes: 6,
  },
  KHULNA: {
    division: 'KHULNA',
    nameBangla: 'খুলনা',
    nameEnglish: 'Khulna',
    sehriOffsetMinutes: 5,
    iftarOffsetMinutes: 4,
  },
  BARISHAL: {
    division: 'BARISHAL',
    nameBangla: 'বরিশাল',
    nameEnglish: 'Barishal',
    sehriOffsetMinutes: 1,
    iftarOffsetMinutes: 0,
  },
  RANGPUR: {
    division: 'RANGPUR',
    nameBangla: 'রংপুর',
    nameEnglish: 'Rangpur',
    sehriOffsetMinutes: 3,
    iftarOffsetMinutes: 5,
  },
  MYMENSINGH: {
    division: 'MYMENSINGH',
    nameBangla: 'ময়মনসিংহ',
    nameEnglish: 'Mymensingh',
    sehriOffsetMinutes: -2,
    iftarOffsetMinutes: -1,
  },
};

export const DHAKA_BASELINE_SCHEDULE: RamadanDaySchedule[] = [
  { dayNumber: 1, hijriDate: '১ রমজান', sehriEndTime: '04:52', iftarTime: '18:12' },
  { dayNumber: 2, hijriDate: '২ রমজান', sehriEndTime: '04:51', iftarTime: '18:12' },
  { dayNumber: 3, hijriDate: '৩ রমজান', sehriEndTime: '04:50', iftarTime: '18:13' },
  { dayNumber: 4, hijriDate: '৪ রমজান', sehriEndTime: '04:49', iftarTime: '18:13' },
  { dayNumber: 5, hijriDate: '৫ রমজান', sehriEndTime: '04:48', iftarTime: '18:14' },
  { dayNumber: 6, hijriDate: '৬ রমজান', sehriEndTime: '04:47', iftarTime: '18:14' },
  { dayNumber: 7, hijriDate: '৭ রমজান', sehriEndTime: '04:46', iftarTime: '18:15' },
  { dayNumber: 8, hijriDate: '৮ রমজান', sehriEndTime: '04:45', iftarTime: '18:15' },
  { dayNumber: 9, hijriDate: '৯ রমজান', sehriEndTime: '04:44', iftarTime: '18:16' },
  { dayNumber: 10, hijriDate: '১০ রমজান', sehriEndTime: '04:43', iftarTime: '18:16' },
];

export const FASTING_DUAS: FastingDua[] = [
  {
    id: 'SEHRI_NIYYAT',
    titleBangla: 'রোজার নিয়ত (সেহরি)',
    titleEnglish: 'Intention for Fasting (Sehri)',
    arabic: 'نَوَيْتُ اَنْ اَصُوْمَ غَدًا مِّنْ شَهْرِ رَمَضَانَ الْمُبَارَكِ فَرْضًا لَكَ يَا اللهُ فَتَقَبَّلْ مِنِّي',
    transliterationBangla: 'নাওয়াইতু আন আসুমা গাদাম মিন শাহরি রামাদানাল মুবারাকি ফারদাল্লাকা ইয়া আল্লাহু ফাতাকাব্বাল মিন্নি।',
    translationBangla: 'হে আল্লাহ! আমি আগামীকাল পবিত্র রমজান মাসের ফরজ রোজা রাখার ইচ্ছা পোষণ করছি, আপনি আমার রোজা কবুল করুন।',
    translationEnglish: 'O Allah! I intend to fast tomorrow for the blessed month of Ramadan as an obligation to You, so please accept it from me.',
  },
  {
    id: 'IFTAR_DUA',
    titleBangla: 'ইফতারের দোয়া',
    titleEnglish: 'Supplication for Breaking Fast (Iftar)',
    arabic: 'اللَّهُمَّ لَكَ صُمْتُ وَعَلَى رِزْقِكَ أَفْطَرْتُ',
    transliterationBangla: 'আল্লাহুম্মা লাকা সুমতু ওয়া আলা রিযক্বিকা আফতারতু।',
    translationBangla: 'হে আল্লাহ! আমি আপনার সন্তুষ্টির জন্য রোজা রেখেছিলাম এবং আপনার প্রদত্ত রিজিক দিয়ে ইফতার করছি।',
    translationEnglish: 'O Allah! For You I have fasted, and with Your provision I have broken my fast.',
  },
];
