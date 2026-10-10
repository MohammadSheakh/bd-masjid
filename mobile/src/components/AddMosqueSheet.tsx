import React, { useState, useEffect, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { Mosque } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';
import { AuthService } from '../services/authService';

interface AddMosqueSheetProps {
  visible: boolean;
  initialCoords: { lat: number; lng: number };
  existingMosques: Mosque[];
  onClose: () => void;
  onMosqueCreated: (mosque: Mosque) => void;
  onOpenAuthModal?: () => void;
}

function calculateDistanceMeters(lat1: number, lon1: number, lat2: number, lon2: number): number {
  const R = 6371e3;
  const p1 = (lat1 * Math.PI) / 180;
  const p2 = (lat2 * Math.PI) / 180;
  const dp = ((lat2 - lat1) * Math.PI) / 180;
  const dl = ((lon2 - lon1) * Math.PI) / 180;
  const a =
    Math.sin(dp / 2) * Math.sin(dp / 2) +
    Math.cos(p1) * Math.cos(p2) * Math.sin(dl / 2) * Math.sin(dl / 2);
  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
}

export const AddMosqueSheet: React.FC<AddMosqueSheetProps> = ({
  visible,
  initialCoords,
  existingMosques,
  onClose,
  onMosqueCreated,
  onOpenAuthModal,
}) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isResolvingAddress, setIsResolvingAddress] = useState(false);

  // Form State matching AddMosqueModal.tsx
  const [name, setName] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [autoResolvedAddress, setAutoResolvedAddress] = useState<string | null>(null);

  // Prayer Timetable State
  const [fajrJamaat, setFajrJamaat] = useState('05:15');
  const [zuhrJamaat, setZuhrJamaat] = useState('13:30');
  const [asrJamaat, setAsrJamaat] = useState('16:45');
  const [maghribJamaat, setMaghribJamaat] = useState('18:15');
  const [ishaJamaat, setIshaJamaat] = useState('20:00');
  const [jumuahJamaat, setJumuahJamaat] = useState('13:30');

  // Amenities State
  const [hasAC, setHasAC] = useState(false);
  const [hasWomenSpace, setHasWomenSpace] = useState(false);
  const [hasParking, setHasParking] = useState(false);
  const [hasWheelchair, setHasWheelchair] = useState(false);

  // Duplicate Bypass
  const [allowBypass, setAllowBypass] = useState(false);

  // Reverse Geocoding Address Resolution on mount
  useEffect(() => {
    if (visible && initialCoords?.lat && initialCoords?.lng) {
      setIsResolvingAddress(true);
      ApiClient.reverseGeocode(initialCoords.lat, initialCoords.lng)
        .then((res) => {
          if (res?.city) setCity(res.city);
          if (res?.road || res?.formattedAddress) {
            const resolved = res.road || res.formattedAddress;
            setAddress(resolved || '');
            setAutoResolvedAddress(resolved || null);
          }
          if (res?.suburb) setLandmark(res.suburb);
        })
        .catch(() => {})
        .finally(() => setIsResolvingAddress(false));
    }
  }, [visible, initialCoords]);

  // Proximity Duplicate Detection (<= 50m)
  const nearbyDuplicate = useMemo(() => {
    if (!initialCoords) return null;
    for (const m of existingMosques) {
      const dist = calculateDistanceMeters(initialCoords.lat, initialCoords.lng, m.latitude, m.longitude);
      if (dist <= 50) return { mosque: m, distance: Math.round(dist) };
    }
    return null;
  }, [initialCoords, existingMosques]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the mosque name.');
      return;
    }

    if (nearbyDuplicate && !allowBypass) {
      Alert.alert(
        'Possible Duplicate',
        `A mosque named "${nearbyDuplicate.mosque.name}" is already registered within ${nearbyDuplicate.distance} meters. Please verify the checkbox below if this is a separate hall.`
      );
      return;
    }

    setIsSubmitting(true);
    try {
      const activeUser = AuthService.getUserSync();
      const res = await ApiClient.createMosque({
        name: name.trim(),
        address: address.trim() || undefined,
        landmark: landmark.trim() || undefined,
        city: city.trim() || 'Dhaka',
        latitude: initialCoords.lat,
        longitude: initialCoords.lng,
        hasAirConditioning: hasAC,
        hasSeparateWomenSpace: hasWomenSpace,
        hasParking: hasParking,
        hasWheelchairAccess: hasWheelchair,
        contributorId: activeUser?.id,
        contributorName: activeUser?.name,
        prayerSchedule: {
          fajrJamaat,
          zuhrJamaat,
          asrJamaat,
          maghribJamaat,
          ishaJamaat,
          jumuahJamaat,
        } as any,
      } as Partial<Mosque>);

      if (res.success && res.mosque) {
        onMosqueCreated(res.mosque);
        Alert.alert('Mosque Created', 'Thank you! The mosque has been registered.');
        onClose();
        setName('');
        setAddress('');
        setLandmark('');
      } else {
        Alert.alert('Submission Error', 'Failed to submit mosque.');
      }
    } catch {
      Alert.alert('Submission Error', 'Failed to submit mosque. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleRow}>
              <View style={styles.headerIconCircle}>
                <Text style={styles.headerIcon}>🕌</Text>
              </View>
              <View>
                <Text style={styles.headerTitle}>Add Mosque</Text>
                <Text style={styles.headerSubtitle}>Community Mosques Registry</Text>
              </View>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* GPS Coordinates & Auto Address Banner */}
            <View style={styles.coordBox}>
              <View style={styles.coordHeader}>
                <Text style={styles.coordTitle}>GEOGRAPHIC COORDINATES</Text>
                <View style={styles.coordBadge}>
                  <Text style={styles.coordBadgeText}>📍 Verified Pin</Text>
                </View>
              </View>

              <Text style={styles.coordVal}>
                {initialCoords.lat.toFixed(5)}, {initialCoords.lng.toFixed(5)}
              </Text>

              {isResolvingAddress ? (
                <View style={styles.resolvingRow}>
                  <ActivityIndicator size="small" color={ferioColors.accent} />
                  <Text style={styles.resolvingText}>Detecting address from OpenStreetMap...</Text>
                </View>
              ) : autoResolvedAddress ? (
                <View style={styles.resolvedRow}>
                  <Text style={styles.resolvedIcon}>✓</Text>
                  <Text style={styles.resolvedText} numberOfLines={2}>
                    Auto-detected: {autoResolvedAddress}
                  </Text>
                </View>
              ) : null}
            </View>

            {/* Proximity Duplicate Warning (ADR-004) */}
            {nearbyDuplicate && (
              <View style={styles.duplicateWarning}>
                <Text style={styles.duplicateTitle}>⚠️ Possible Duplicate Mosque</Text>
                <Text style={styles.duplicateBody}>
                  "{nearbyDuplicate.mosque.name}" is located only {nearbyDuplicate.distance}m away.
                </Text>
                <Pressable
                  onPress={() => setAllowBypass((prev) => !prev)}
                  style={styles.bypassCheckboxRow}
                >
                  <View style={[styles.checkbox, allowBypass && styles.checkboxActive]}>
                    {allowBypass && <Text style={styles.checkboxCheck}>✓</Text>}
                  </View>
                  <Text style={styles.bypassText}>
                    Confirm: This is a separate, distinct mosque hall
                  </Text>
                </Pressable>
              </View>
            )}

            {/* Mosque Name Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Mosque Name *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Dhanmondi Eidgah Shahi Masjid"
                placeholderTextColor={ferioColors.muted}
                value={name}
                onChangeText={setName}
              />
            </View>

            {/* City & Landmark Inputs */}
            <View style={styles.rowFields}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>City / District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="Dhaka"
                  placeholderTextColor={ferioColors.muted}
                  value={city}
                  onChangeText={setCity}
                />
              </View>

              <View style={[styles.fieldGroup, { flex: 1.2 }]}>
                <Text style={styles.fieldLabel}>Landmark / Area</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Near Lake"
                  placeholderTextColor={ferioColors.muted}
                  value={landmark}
                  onChangeText={setLandmark}
                />
              </View>
            </View>

            {/* Street Address Input */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>Full Street Address</Text>
              <TextInput
                style={styles.input}
                placeholder="Road 7, Dhanmondi, Dhaka"
                placeholderTextColor={ferioColors.muted}
                value={address}
                onChangeText={setAddress}
              />
            </View>

            {/* Initial Prayer Timetable (Fajr, Zuhr, Asr, Maghrib, Isha, Jumu'ah) */}
            <View style={styles.timetableSection}>
              <Text style={styles.sectionHeader}>Initial Jamaat Times (12-hour format)</Text>
              <View style={styles.prayerTimesGrid}>
                <View style={styles.prayerTimeCell}>
                  <Text style={styles.prayerTimeLabel}>Fajr</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={fajrJamaat}
                    onChangeText={setFajrJamaat}
                    placeholder="05:15"
                  />
                </View>
                <View style={styles.prayerTimeCell}>
                  <Text style={styles.prayerTimeLabel}>Zuhr</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={zuhrJamaat}
                    onChangeText={setZuhrJamaat}
                    placeholder="13:30"
                  />
                </View>
                <View style={styles.prayerTimeCell}>
                  <Text style={styles.prayerTimeLabel}>Asr</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={asrJamaat}
                    onChangeText={setAsrJamaat}
                    placeholder="16:45"
                  />
                </View>
                <View style={styles.prayerTimeCell}>
                  <Text style={styles.prayerTimeLabel}>Maghrib</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={maghribJamaat}
                    onChangeText={setMaghribJamaat}
                    placeholder="18:15"
                  />
                </View>
                <View style={styles.prayerTimeCell}>
                  <Text style={styles.prayerTimeLabel}>Isha</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={ishaJamaat}
                    onChangeText={setIshaJamaat}
                    placeholder="20:00"
                  />
                </View>
                <View style={styles.prayerTimeCell}>
                  <Text style={styles.prayerTimeLabel}>Jumu'ah</Text>
                  <TextInput
                    style={styles.timeInput}
                    value={jumuahJamaat}
                    onChangeText={setJumuahJamaat}
                    placeholder="13:30"
                  />
                </View>
              </View>
            </View>

            {/* Facilities Checkboxes */}
            <View style={styles.facilitiesSection}>
              <Text style={styles.sectionHeader}>Available Facilities</Text>
              <View style={styles.facilitiesGrid}>
                <Pressable
                  onPress={() => setHasAC((p) => !p)}
                  style={[styles.facilityCard, hasAC && styles.facilityCardActive]}
                >
                  <Text style={styles.facilityIcon}>❄️</Text>
                  <Text style={[styles.facilityText, hasAC && styles.facilityTextActive]}>
                    Air Conditioned
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setHasWomenSpace((p) => !p)}
                  style={[styles.facilityCard, hasWomenSpace && styles.facilityCardActive]}
                >
                  <Text style={styles.facilityIcon}>🧕</Text>
                  <Text style={[styles.facilityText, hasWomenSpace && styles.facilityTextActive]}>
                    Women Space
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setHasParking((p) => !p)}
                  style={[styles.facilityCard, hasParking && styles.facilityCardActive]}
                >
                  <Text style={styles.facilityIcon}>🚗</Text>
                  <Text style={[styles.facilityText, hasParking && styles.facilityTextActive]}>
                    Parking
                  </Text>
                </Pressable>

                <Pressable
                  onPress={() => setHasWheelchair((p) => !p)}
                  style={[styles.facilityCard, hasWheelchair && styles.facilityCardActive]}
                >
                  <Text style={styles.facilityIcon}>♿</Text>
                  <Text style={[styles.facilityText, hasWheelchair && styles.facilityTextActive]}>
                    Wheelchair
                  </Text>
                </Pressable>
              </View>
            </View>

            {/* Submit Action */}
            <Pressable
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
              accessibilityRole="button"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>+ Add Mosque to Platform</Text>
              )}
            </Pressable>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.surface,
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.xl,
    maxHeight: '92%',
    alignSelf: 'center',
    width: '100%',
    maxWidth: 580,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingBottom: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.sm,
  },
  headerIconCircle: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerIcon: {
    fontSize: 18,
  },
  headerTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  headerSubtitle: {
    fontSize: 11,
    color: ferioColors.muted,
  },
  closeBtn: {
    width: 30,
    height: 30,
    borderRadius: 15,
    backgroundColor: ferioColors.canvas,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  closeBtnText: {
    fontSize: 12,
    color: ferioColors.muted,
    fontWeight: '700',
  },
  body: {
    paddingVertical: ferioSpacing.md,
  },
  coordBox: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.md,
  },
  coordHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 4,
  },
  coordTitle: {
    fontSize: 10,
    fontWeight: '700',
    color: ferioColors.muted,
    letterSpacing: 0.5,
  },
  coordBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  coordBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.accent,
  },
  coordVal: {
    fontSize: 13,
    fontWeight: '700',
    color: ferioColors.primary,
    fontFamily: 'monospace',
  },
  resolvingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  resolvingText: {
    fontSize: 11,
    color: '#2563eb',
  },
  resolvedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    marginTop: 6,
  },
  resolvedIcon: {
    fontSize: 12,
    color: ferioColors.accent,
    fontWeight: 'bold',
  },
  resolvedText: {
    fontSize: 11,
    color: ferioColors.muted,
    flex: 1,
  },
  duplicateWarning: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.md,
  },
  duplicateTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  duplicateBody: {
    fontSize: 11,
    color: '#78350f',
    marginBottom: 8,
  },
  bypassCheckboxRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  checkbox: {
    width: 18,
    height: 18,
    borderRadius: 4,
    borderWidth: 1.5,
    borderColor: '#b45309',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#ffffff',
  },
  checkboxActive: {
    backgroundColor: '#b45309',
  },
  checkboxCheck: {
    fontSize: 11,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  bypassText: {
    fontSize: 11,
    color: '#78350f',
    fontWeight: '600',
  },
  fieldGroup: {
    marginBottom: ferioSpacing.sm + 2,
  },
  fieldLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.primary,
    marginBottom: 4,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 13,
    color: ferioColors.primary,
  },
  rowFields: {
    flexDirection: 'row',
    gap: 8,
  },
  timetableSection: {
    marginTop: ferioSpacing.sm,
    marginBottom: ferioSpacing.md,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
  },
  sectionHeader: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ferioSpacing.sm,
  },
  prayerTimesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  prayerTimeCell: {
    width: '31%',
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: 6,
    alignItems: 'center',
  },
  prayerTimeLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.muted,
    marginBottom: 2,
  },
  timeInput: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
    textAlign: 'center',
    padding: 0,
    margin: 0,
  },
  facilitiesSection: {
    marginBottom: ferioSpacing.lg,
  },
  facilitiesGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  facilityCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
    backgroundColor: '#ffffff',
  },
  facilityCardActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  facilityIcon: {
    fontSize: 13,
  },
  facilityText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  facilityTextActive: {
    color: '#ffffff',
  },
  submitBtn: {
    backgroundColor: '#111114',
    borderRadius: ferioRadius.full,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: ferioSpacing.xxl,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
