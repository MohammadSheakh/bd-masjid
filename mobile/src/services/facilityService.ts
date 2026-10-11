/**
 * Facility Service (ADR-025, ADR-050 Parity)
 * Manages extensible mosque facilities, curated Bangladeshi amenities catalog,
 * and community facility suggestion payloads.
 */

export interface AmenityCatalogItem {
  id: string;
  nameEn: string;
  nameBn: string;
  icon: string;
}

export const COMMON_BANGLADESH_AMENITIES: AmenityCatalogItem[] = [
  { id: 'solar', nameEn: 'Solar Power System', nameBn: 'সৌর বিদ্যুৎ ব্যবস্থা', icon: '☀️' },
  { id: 'elevator', nameEn: 'Elevator / Lift', nameBn: 'লিফট / এলিভেটর', icon: '🛗' },
  { id: 'cctv', nameEn: 'CCTV Surveillance', nameBn: 'সিসিটিভি ক্যামেরা', icon: '📹' },
  { id: 'ro_water', nameEn: 'Chilled RO Drinking Water', nameBn: 'বিশুদ্ধ শীতল খাবার পানি', icon: '💧' },
  { id: 'generator_ips', nameEn: 'Generator / IPS Backup', nameBn: 'আইপিএস / জেনারেটর', icon: '⚡' },
  { id: 'musafir_khana', nameEn: 'Guest Room / Musafir Khana', nameBn: 'মুসাফিরখানা', icon: '🛏️' },
  { id: 'ghusl_khana', nameEn: 'Funeral Bath / Ghusl Area', nameBn: 'মরদেহের গোসলখানা', icon: '🚿' },
  { id: 'women_wudu', nameEn: 'Separate Women Wudu Area', nameBn: 'মহিলাদের পৃথক অজুখানা', icon: '🧕' },
  { id: 'wheelchair_ramp', nameEn: 'Wheelchair Access Ramp', nameBn: 'হুইলচেয়ার র‍্যাম্প', icon: '♿' },
  { id: 'maktab_library', nameEn: 'Islamic Library & Maktab', nameBn: 'মক্তব ও লাইব্রেরি', icon: '📚' },
];

export interface CanonicalFacilityItem {
  key: string;
  nameEn: string;
  nameBn: string;
  icon: string;
}

export const CANONICAL_FACILITIES: CanonicalFacilityItem[] = [
  { key: 'hasFemalePrayerSpace', nameEn: "Women's Prayer Area", nameBn: 'মহিলাদের নামাজের ব্যবস্থা', icon: '🧕' },
  { key: 'hasAirConditioning', nameEn: 'Air Conditioning', nameBn: 'শীতাতপ নিয়ন্ত্রিত (AC)', icon: '❄️' },
  { key: 'hasSeparateWudu', nameEn: 'Separate Wudu Area', nameBn: 'পৃথক অজুখানা', icon: '💧' },
  { key: 'hasWheelchairAccess', nameEn: 'Wheelchair Accessible', nameBn: 'হুইলচেয়ার চলাচল সুবিধা', icon: '♿' },
  { key: 'hasJanazaService', nameEn: 'Janaza Staging & Gear', nameBn: 'জানাজার সরঞ্জাম / খাটিয়া', icon: '⚰️' },
  { key: 'hasParkingCar', nameEn: 'Vehicle Parking', nameBn: 'গাড়ি / বাইক পার্কিং', icon: '🚗' },
];

export interface SuggestedFacilitiesPayload {
  totalCapacity?: number | null;
  toiletCount?: number | null;
  hasSeparateWudu?: boolean;
  wuduCapacity?: number | null;
  hasFemalePrayerSpace?: boolean;
  femaleCapacity?: number | null;
  hasWheelchairAccess?: boolean;
  hasRamp?: boolean;
  hasAirConditioning?: boolean;
  hasFan?: boolean;
  hasJanazaService?: boolean;
  hasParkingCar?: boolean;
  hasParkingBike?: boolean;
  hasLibraryMaktab?: boolean;
  customAmenities?: string[];
  comment?: string;
  description?: string;
  contributorId?: string;
  contributorName?: string;
}

export const FacilityService = {
  sanitizeCustomAmenities(amenities: string[]): string[] {
    const cleaned = amenities
      .map((s) => s.trim())
      .filter((s) => s.length > 0 && s.length <= 50);

    // Deduplicate and cap at 20 items per ADR-025 invariant
    return Array.from(new Set(cleaned)).slice(0, 20);
  },

  getCatalogItemByName(name: string): AmenityCatalogItem | undefined {
    const lower = name.toLowerCase();
    return COMMON_BANGLADESH_AMENITIES.find(
      (item) =>
        item.nameEn.toLowerCase() === lower ||
        item.nameBn === name ||
        lower.includes(item.id)
    );
  },
};
