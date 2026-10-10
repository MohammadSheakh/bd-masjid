/**
 * Collection Service (ADR-052)
 * Manages categorized mosque bookmarks and custom tagging
 * for Bangladeshi musalli daily routines (Home, Work, Jumu'ah, Saved).
 */

export type MosqueCollectionTag = 'HOME' | 'WORK' | 'JUMUAH' | 'FAVORITE';

export interface CollectionTagMetadata {
  id: MosqueCollectionTag;
  icon: string;
  labelEn: string;
  labelBn: string;
  descriptionEn: string;
  descriptionBn: string;
}

export const COLLECTION_TAGS: CollectionTagMetadata[] = [
  {
    id: 'HOME',
    icon: '🏠',
    labelEn: 'Home',
    labelBn: 'বাসা',
    descriptionEn: 'Neighborhood mosque for Fajr, Maghrib & Isha',
    descriptionBn: 'বাসা বা মহল্লার মসজিদ (ফজর, মাগরিব, ইশা)',
  },
  {
    id: 'WORK',
    icon: '🏢',
    labelEn: 'Work',
    labelBn: 'অফিস',
    descriptionEn: 'Workplace mosque for Zuhr & Asr',
    descriptionBn: 'কর্মক্ষেত্র বা অফিসের নিকটস্থ মসজিদ (যোহর, আসর)',
  },
  {
    id: 'JUMUAH',
    icon: '🕌',
    labelEn: "Jumu'ah",
    labelBn: 'জুমুআ',
    descriptionEn: 'Preferred congregation for Friday sermon',
    descriptionBn: 'শুক্রবার জুমার জামাতের পছন্দের মসজিদ',
  },
  {
    id: 'FAVORITE',
    icon: '⭐',
    labelEn: 'Saved',
    labelBn: 'পছন্দ',
    descriptionEn: 'Bookmarked for travel or reference',
    descriptionBn: 'সংরক্ষিত বা সফরকালীন মসজিদ',
  },
];

export const CollectionService = {
  getTagMeta(tag: MosqueCollectionTag): CollectionTagMetadata {
    return (
      COLLECTION_TAGS.find((t) => t.id === tag) || {
        id: tag,
        icon: '📌',
        labelEn: tag,
        labelBn: tag,
        descriptionEn: '',
        descriptionBn: '',
      }
    );
  },

  getAllTags(): CollectionTagMetadata[] {
    return COLLECTION_TAGS;
  },
};
