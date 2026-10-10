import React from 'react';
import { View, Text, StyleSheet, Pressable } from 'react-native';
import { Mosque } from '../types/mosque';
import { FacilityService, CANONICAL_FACILITIES } from '../services/facilityService';

interface FacilitiesCardProps {
  mosque: Mosque;
  language?: 'bn' | 'en';
  onPressSuggest: () => void;
}

export const FacilitiesCard: React.FC<FacilitiesCardProps> = ({
  mosque,
  language = 'en',
  onPressSuggest,
}) => {
  const isBn = language === 'bn';
  const fac = mosque.facility;

  // Resolve values prioritizing explicit facility entity then fallback mosque fields
  const totalCapacity = fac?.totalCapacity ?? mosque.capacity ?? null;
  const wuduCapacity = fac?.wuduCapacity ?? null;
  const customAmenities = fac?.customAmenities ?? [];

  const canonicalStatus: Record<string, boolean> = {
    hasFemalePrayerSpace: Boolean(fac?.hasFemalePrayerSpace ?? mosque.hasSeparateWomenSpace),
    hasAirConditioning: Boolean(fac?.hasAirConditioning ?? mosque.hasAirConditioning),
    hasSeparateWudu: Boolean(fac?.hasSeparateWudu ?? mosque.hasWuduArea),
    hasWheelchairAccess: Boolean(fac?.hasWheelchairAccess ?? mosque.hasWheelchairAccess),
    hasJanazaService: Boolean(fac?.hasJanazaService ?? mosque.hasJanazaFacility),
    hasParkingCar: Boolean(fac?.hasParkingCar ?? mosque.hasParking),
  };

  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <View>
          <Text style={styles.cardTitle}>
            {isBn ? 'সুযোগ-সুবিধা ও সেবা' : 'Facilities & Amenities'}
          </Text>
          <Text style={styles.cardHeaderSub}>
            {isBn ? 'যাচাইকৃত স্থাপত্য ও সেবা' : 'Verified architectural features'}
          </Text>
        </View>
        <Pressable
          onPress={onPressSuggest}
          style={styles.suggestBtn}
          accessibilityRole="button"
          accessibilityLabel="Suggest facility updates"
        >
          <Text style={styles.suggestBtnText}>
            {isBn ? '+ তথ্য দিন' : '+ Suggest'}
          </Text>
        </Pressable>
      </View>

      {/* Capacity & Wudu Highlights */}
      {(totalCapacity || wuduCapacity) ? (
        <View style={styles.metricsRow}>
          {totalCapacity ? (
            <View style={styles.metricPill}>
              <Text style={styles.metricPillText}>
                👥 {isBn ? 'ধারণক্ষমতা: ' : 'Capacity: '}{totalCapacity.toLocaleString()}
              </Text>
            </View>
          ) : null}
          {wuduCapacity ? (
            <View style={styles.metricPill}>
              <Text style={styles.metricPillText}>
                💧 {isBn ? 'অজুখানা: ' : 'Wudu: '}{wuduCapacity} {isBn ? 'টি স্থান' : 'spots'}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {/* Canonical Facilities Grid */}
      <View style={styles.facilityGrid}>
        {CANONICAL_FACILITIES.map((item) => {
          const isAvailable = canonicalStatus[item.key];
          return (
            <View key={item.key} style={styles.facilityItem}>
              <Text style={isAvailable ? styles.iconActive : styles.iconInactive}>
                {isAvailable ? '●' : '○'}
              </Text>
              <Text style={[styles.facilityLabel, !isAvailable && styles.labelInactive]}>
                {item.icon} {isBn ? item.nameBn : item.nameEn}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Custom Community Amenities (ADR-025, ADR-050) */}
      {customAmenities.length > 0 && (
        <View style={styles.customSection}>
          <Text style={styles.customSectionTitle}>
            {isBn ? 'অতিরিক্ত নাগরিক সুবিধাসমূহ' : 'Additional Community Amenities'}
          </Text>
          <View style={styles.tagsContainer}>
            {customAmenities.map((amenity, idx) => {
              const catalogMatch = FacilityService.getCatalogItemByName(amenity);
              return (
                <View key={`${amenity}-${idx}`} style={styles.customTag}>
                  <Text style={styles.customTagText}>
                    {catalogMatch?.icon ?? '✦'} {isBn && catalogMatch ? catalogMatch.nameBn : amenity}
                  </Text>
                </View>
              );
            })}
          </View>
        </View>
      )}
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderRadius: 12,
    padding: 16,
    borderWidth: 1,
    borderColor: '#e8e8ea',
    marginBottom: 16,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
  },
  cardHeaderSub: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 1,
  },
  suggestBtn: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 16,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  suggestBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  metricsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
    marginBottom: 12,
  },
  metricPill: {
    backgroundColor: '#f0fdf4',
    borderColor: '#bbf7d0',
    borderWidth: 1,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 6,
  },
  metricPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#166534',
  },
  facilityGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityItem: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '48%',
    paddingVertical: 4,
  },
  iconActive: {
    color: '#059669',
    marginRight: 6,
    fontSize: 10,
  },
  iconInactive: {
    color: '#d1d5db',
    marginRight: 6,
    fontSize: 10,
  },
  facilityLabel: {
    fontSize: 12,
    color: '#111114',
    flexShrink: 1,
  },
  labelInactive: {
    color: '#9ca3af',
  },
  customSection: {
    marginTop: 14,
    paddingTop: 12,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  customSectionTitle: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6e6e73',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 8,
  },
  tagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  customTag: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
  },
  customTagText: {
    fontSize: 11,
    color: '#111114',
    fontWeight: '500',
  },
});
