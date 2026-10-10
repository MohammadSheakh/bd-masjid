/**
 * Authentic Hadith & Reflection Service conforming to ADR-049
 * Rigorously authenticated canonical Hadiths (Bukhari, Muslim, Tirmidhi)
 * Deterministic daily rotation for uniform national reflection
 */

export interface AuthenticHadith {
  id: string;
  narratorBn: string;
  narratorEn: string;
  arabicText: string;
  banglaText: string;
  englishText: string;
  sourceBook: string;
  hadithNumber: string;
  topicBn: string;
  topicEn: string;
}

export const AUTHENTIC_HADITH_POOL: AuthenticHadith[] = [
  {
    id: 'hadith-congregation-27x',
    narratorBn: 'ইবনে উমর (রা.) থেকে বর্ণিত',
    narratorEn: 'Narrated by Ibn Umar (RA)',
    arabicText: 'صَلَاةُ الْجَمَاعَةِ تَفْضُلُ صَلَاةَ الْفَذِّ بِسَبْعٍ وَعِشْرِينَ دَرَجَةً',
    banglaText: 'জামাতে সালাত আদায় একাকী সালাত আদায় করার চেয়ে সাতাশ (২৭) গুণ বেশি মর্যাদাপূর্ণ।',
    englishText: 'Prayer in congregation is twenty-seven times more rewarding than prayer performed alone.',
    sourceBook: 'Sahih al-Bukhari',
    hadithNumber: '645',
    topicBn: 'জামাতের ফজিলত',
    topicEn: 'Virtue of Congregation',
  },
  {
    id: 'hadith-walking-to-mosque',
    narratorBn: 'আবু হুরায়রা (রা.) থেকে বর্ণিত',
    narratorEn: 'Narrated by Abu Hurairah (RA)',
    arabicText: 'مَنْ غَدَا إِلَى الْمَسْجِدِ أَوْ رَاحَ، أَعَدَّ اللَّهُ لَهُ نُزُلَهُ مِنَ الْجَنَّةِ كُلَّمَا غَدَا أَوْ رَاحَ',
    banglaText: 'যে ব্যক্তি সকাল-সন্ধ্যায় মসজিদে গমন করে, আল্লাহ তাআলা তার জন্য জান্নাতে আতিথেয়তার ব্যবস্থা করেন প্রতিবার তার গমনের জন্য।',
    englishText: 'Whoever goes to the mosque in the morning or evening, Allah prepares for him a hospitality in Paradise every time he goes.',
    sourceBook: 'Sahih al-Bukhari',
    hadithNumber: '662',
    topicBn: 'মসজিদে গমনের সওয়াব',
    topicEn: 'Walking to the Mosque',
  },
  {
    id: 'hadith-five-prayers-river',
    narratorBn: 'আবু হুরায়রা (রা.) থেকে বর্ণিত',
    narratorEn: 'Narrated by Abu Hurairah (RA)',
    arabicText: 'أَرَأَيْتُمْ لَوْ أَنَّ نَهْرًا بِبَابِ أَحَدِكُمْ يَغْتَسِلُ فِيهِ كُلَّ يَوْمٍ خَمْسًا، مَا تَقُولُ ذَلِكَ يُبْقِي مِنْ دَرَنِهِ؟ قَالُوا: لَا يُبْقِي مِنْ دَرَنِهِ شَيْئًا. قَالَ: فَذَلِكَ مِثْلُ الصَّلَوَاتِ الْخَمْسِ',
    banglaText: 'পাঁচ ওয়াক্ত সালাতের দৃষ্টান্ত প্রবহমান নদীর মতো, যাতে একজন দৈনিক পাঁচবার গোসল করে। ফলে তার শরীরে কোনো ময়লা থাকে না।',
    englishText: 'The five daily prayers are like a running river at the door of one of you in which he washes himself five times daily; no dirt remains on him.',
    sourceBook: 'Sahih Muslim',
    hadithNumber: '667',
    topicBn: 'পাঁচ ওয়াক্ত সালাত',
    topicEn: 'Five Daily Prayers',
  },
  {
    id: 'hadith-smile-charity',
    narratorBn: 'আবু যার (রা.) থেকে বর্ণিত',
    narratorEn: 'Narrated by Abu Dharr (RA)',
    arabicText: 'تَبَسُّمُكَ فِي وَجْهِ أَخِيكَ لَكَ صَدَقَةٌ',
    banglaText: 'তোমার দ্বীনি ভাইয়ের মুখের দিকে তাকিয়ে তোমার মুচকি হাসিও একটি সদকা (পুণ্যময় দান)।',
    englishText: 'Your smiling in the face of your brother is charity for you.',
    sourceBook: "Jami' at-Tirmidhi",
    hadithNumber: '1956',
    topicBn: 'সদকা ও উত্তম চরিত্র',
    topicEn: 'Charity & Good Character',
  },
  {
    id: 'hadith-beloved-words',
    narratorBn: 'সামুরা ইবনে জুনদুব (রা.) থেকে বর্ণিত',
    narratorEn: 'Narrated by Samurah ibn Jundub (RA)',
    arabicText: 'أَحَبُّ الْكَلَامِ إِلَى اللَّهِ أَرْبَعٌ: سُبْحَانَ اللَّهِ، وَالْحَمْدُ لِلَّهِ، وَلَا إِلَهَ إِلَّا اللَّهُ، وَاللَّهُ أَكْبَرُ',
    banglaText: 'আল্লাহর নিকট সর্বাধিক প্রিয় বাক্য চারটি: সুবহানাল্লাহ, আলহামদুলিল্লাহ, লা ইলাহা ইল্লাল্লাহ এবং আল্লাহু আকবার।',
    englishText: 'The most beloved words to Allah are four: SubhanAllah, Alhamdulillah, La ilaha illa Allah, and Allahu Akbar.',
    sourceBook: 'Sahih Muslim',
    hadithNumber: '2137',
    topicBn: 'উত্তম জিকির',
    topicEn: 'Beloved Words to Allah',
  },
];

export const HadithService = {
  /**
   * Deterministically returns the authentic Hadith of the day based on the calendar date
   */
  getDailyHadith(date: Date = new Date()): AuthenticHadith {
    const startOfYear = new Date(date.getFullYear(), 0, 1);
    const dayOfYear = Math.floor((date.getTime() - startOfYear.getTime()) / (1000 * 60 * 60 * 24));
    const index = Math.abs(dayOfYear) % AUTHENTIC_HADITH_POOL.length;
    return AUTHENTIC_HADITH_POOL[index];
  },
};
