/**
 * Type-Safe Bilingual Localization Engine conforming to ADR-048
 * Full Bengali (বাংলা) & English translations with authentic Musalli terminology
 */
import { PreferencesStorage } from '../lib/storage';

export type Language = 'bn' | 'en';

const BANGLA_DIGITS: Record<string, string> = {
  '0': '০',
  '1': '১',
  '2': '২',
  '3': '৩',
  '4': '৪',
  '5': '৫',
  '6': '৬',
  '7': '৭',
  '8': '৮',
  '9': '৯',
};

export function toBanglaDigits(input: string | number): string {
  return String(input).replace(/[0-9]/g, (digit) => BANGLA_DIGITS[digit] || digit);
}

const STRINGS = {
  // Brand & Navigation
  brandTitle: { bn: 'বিডি মসজিদ', en: 'BD Masjid' },
  brandSubtitle: { bn: 'মসজিদ ও নামাজের সময়সূচি', en: 'Mosque & Prayer Platform' },
  autoSilentOn: { bn: '🔕 অটো-সাইলেন্ট', en: '🔕 Auto-Silent' },
  autoSilentOff: { bn: '🔔 সাইলেন্ট বন্ধ', en: '🔔 Silent Off' },
  qiblaCompass: { bn: '🧭 কিবলা', en: '🧭 Qibla' },

  // Search & Filter
  searchPlaceholder: {
    bn: 'মসজিদের নাম বা এলাকা খুঁজুন...',
    en: 'Search by mosque name, area, or city...',
  },
  filterAll: { bn: 'সব', en: 'All' },
  filterWomenSpace: { bn: 'মহিলাদের স্থান', en: 'Women Space' },
  filterAirConditioned: { bn: 'শীতাতপ নিয়ন্ত্রিত (AC)', en: 'Air Conditioned' },
  filterParking: { bn: 'গাড়ি পার্কিং', en: 'Parking' },
  filterFollowing: { bn: 'অনুসরণকৃত', en: 'Following' },

  // Prayer Waqts
  fajr: { bn: 'ফজর', en: 'Fajr' },
  zuhr: { bn: 'যোহর', en: 'Zuhr' },
  asr: { bn: 'আসর', en: 'Asr' },
  maghrib: { bn: 'মাগরিব', en: 'Maghrib' },
  isha: { bn: 'এশা', en: 'Isha' },
  jumuah: { bn: "জুমু'আ", en: "Jumu'ah" },
  taraweeh: { bn: 'তারাবীহ', en: 'Taraweeh' },

  // Jammat & Countdown
  nextJamaat: { bn: 'পরবর্তী জামাত', en: 'Next Jamaat' },
  startsIn: { bn: 'শুরু হতে বাকি', en: 'Starts in' },
  mins: { bn: 'মিনিট', en: 'mins' },
  hours: { bn: 'ঘণ্টা', en: 'hrs' },

  // Detail Sheet Actions
  follow: { bn: '+ অনুসরণ', en: '+ Follow' },
  followingBtn: { bn: 'অনুসরণ করছেন', en: 'Following' },
  dailyTimetable: { bn: 'দৈনিক জামাত সময়সূচি', en: 'Daily Jammat Timetable' },
  updateTimetable: { bn: '+ সংশোধন', en: '+ Update' },
  verifiedDonations: { bn: 'যাচাইকৃত অনুদান ফান্ড', en: 'Verified Donations' },
  leadership: { bn: 'মসজিদ পরিচালনা ও খতিব', en: 'Mosque Leadership & Staff' },
  facilities: { bn: 'সুযোগ-সুবিধা সমূহ', en: 'Facilities & Amenities' },
  reportIssue: { bn: '🚩 তথ্য সংশোধন / অভিযোগ', en: '🚩 Report an issue / incorrect info' },
  noticeBoard: { bn: 'নোটিশ বোর্ড', en: 'Notice Board' },
} as const;

type TranslationKey = keyof typeof STRINGS;

let currentLanguage: Language = PreferencesStorage.getLanguagePreference();
const languageListeners = new Set<(lang: Language) => void>();

export const LocalizationService = {
  getLanguage(): Language {
    return currentLanguage;
  },

  setLanguage(lang: Language): void {
    currentLanguage = lang;
    PreferencesStorage.setLanguagePreference(lang);
    languageListeners.forEach((listener) => listener(lang));
  },

  toggleLanguage(): Language {
    const nextLang: Language = currentLanguage === 'bn' ? 'en' : 'bn';
    this.setLanguage(nextLang);
    return nextLang;
  },

  t(key: TranslationKey): string {
    const entry = STRINGS[key];
    if (!entry) return String(key);
    return entry[currentLanguage] || entry.bn;
  },

  formatNumber(val: number | string): string {
    if (currentLanguage === 'bn') {
      return toBanglaDigits(val);
    }
    return String(val);
  },

  onLanguageChange(listener: (lang: Language) => void): () => void {
    languageListeners.add(listener);
    return () => {
      languageListeners.delete(listener);
    };
  },
};
