import React, { useState, useMemo } from 'react';
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
import { ContributorAttributionBanner } from './ContributorAttributionBanner';
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
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Form State
  const [name, setName] = useState('');
  const [address, setAddress] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [amenities, setAmenities] = useState({
    ac: true,
    womenSpace: false,
    parking: true,
    wheelchair: false,
  });

  // Duplicate Check (<= 150m)
  const nearbyDuplicate = useMemo(() => {
    for (const m of existingMosques) {
      const dist = calculateDistanceMeters(initialCoords.lat, initialCoords.lng, m.latitude, m.longitude);
      if (dist <= 150) return { mosque: m, distance: Math.round(dist) };
    }
    return null;
  }, [initialCoords, existingMosques]);

  const handleSubmit = async () => {
    if (!name.trim()) {
      Alert.alert('Required Field', 'Please enter the mosque name.');
      return;
    }
    setIsSubmitting(true);
    try {
      const activeUser = AuthService.getUserSync();
      const res = await ApiClient.createMosque({
        name: name.trim(),
        address: address.trim() || undefined,
        city: city.trim() || 'Dhaka',
        latitude: initialCoords.lat,
        longitude: initialCoords.lng,
        hasAirConditioning: amenities.ac,
        hasSeparateWomenSpace: amenities.womenSpace,
        hasParking: amenities.parking,
        hasWheelchairAccess: amenities.wheelchair,
        contributorId: activeUser?.id,
        contributorName: activeUser?.name,
      } as Partial<Mosque>);
      if (res.success && res.mosque) {
        onMosqueCreated(res.mosque);
        Alert.alert('Mosque Submitted', 'Thank you! Your submission is now visible pending community verification.');
        onClose();
        setStep(1);
        setName('');
        setAddress('');
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
            <View>
              <Text style={styles.headerTitle}>Add New Mosque</Text>
              <Text style={styles.headerSubtitle}>Step {step} of 3 • OpenStreetMap Community</Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Contributor Attribution Banner */}
            <ContributorAttributionBanner onOpenAuthModal={onOpenAuthModal} />

            {step === 1 && (
              <View style={styles.stepContent}>
                <View style={styles.coordBox}>
                  <Text style={styles.coordLabel}>Selected Pin Coordinates</Text>
                  <Text style={styles.coordVal}>
                    {initialCoords.lat.toFixed(6)}, {initialCoords.lng.toFixed(6)}
                  </Text>
                </View>

                {nearbyDuplicate ? (
                  <View style={styles.warningBox}>
                    <Text style={styles.warningTitle}>⚠️ Potential Duplicate Detected</Text>
                    <Text style={styles.warningBody}>
                      "{nearbyDuplicate.mosque.name}" is located only {nearbyDuplicate.distance}m away. Please verify if this mosque is already listed.
                    </Text>
                  </View>
                ) : (
                  <View style={styles.successBox}>
                    <Text style={styles.successTitle}>✓ Pin Verified</Text>
                    <Text style={styles.successBody}>No existing mosque found within 150m of this pin.</Text>
                  </View>
                )}

                <Pressable style={styles.primaryBtn} onPress={() => setStep(2)}>
                  <Text style={styles.primaryBtnText}>Proceed to Details →</Text>
                </Pressable>
              </View>
            )}

            {step === 2 && (
              <View style={styles.stepContent}>
                <Text style={styles.fieldLabel}>Mosque Name *</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Baitul Mukarram Jame Masjid"
                  placeholderTextColor="#9ca3af"
                  value={name}
                  onChangeText={setName}
                />

                <Text style={styles.fieldLabel}>Address / Road Name</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Topkhana Road, Paltan"
                  placeholderTextColor="#9ca3af"
                  value={address}
                  onChangeText={setAddress}
                />

                <Text style={styles.fieldLabel}>City / District</Text>
                <TextInput
                  style={styles.input}
                  placeholder="e.g. Dhaka"
                  placeholderTextColor="#9ca3af"
                  value={city}
                  onChangeText={setCity}
                />

                <View style={styles.btnRow}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setStep(1)}>
                    <Text style={styles.secondaryBtnText}>← Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
                    onPress={() => {
                      if (!name.trim()) {
                        Alert.alert('Required Field', 'Please enter mosque name.');
                        return;
                      }
                      setStep(3);
                    }}
                  >
                    <Text style={styles.primaryBtnText}>Next: Facilities →</Text>
                  </Pressable>
                </View>
              </View>
            )}

            {step === 3 && (
              <View style={styles.stepContent}>
                <Text style={styles.sectionHeader}>Available Facilities</Text>
                {[
                  { key: 'ac', label: 'Air Conditioning (AC)', icon: '❄️' },
                  { key: 'womenSpace', label: 'Separate Women Prayer Area', icon: '🧕' },
                  { key: 'parking', label: 'Vehicle Parking Available', icon: '🚗' },
                  { key: 'wheelchair', label: 'Wheelchair Accessible Ramp', icon: '♿' },
                ].map((item) => {
                  const active = (amenities as Record<string, boolean>)[item.key];
                  return (
                    <Pressable
                      key={item.key}
                      style={[styles.amenityChip, active && styles.amenityChipActive]}
                      onPress={() =>
                        setAmenities((prev) => ({
                          ...prev,
                          [item.key]: !prev[item.key as keyof typeof prev],
                        }))
                      }
                    >
                      <Text style={styles.amenityText}>
                        {item.icon} {item.label}
                      </Text>
                      <Text style={[styles.checkText, active && styles.checkTextActive]}>
                        {active ? '✓' : '+'}
                      </Text>
                    </Pressable>
                  );
                })}

                <View style={[styles.btnRow, { marginTop: ferioSpacing.lg }]}>
                  <Pressable style={styles.secondaryBtn} onPress={() => setStep(2)}>
                    <Text style={styles.secondaryBtnText}>← Back</Text>
                  </Pressable>
                  <Pressable
                    style={[styles.primaryBtn, { flex: 1, marginLeft: 8 }]}
                    onPress={handleSubmit}
                    disabled={isSubmitting}
                  >
                    {isSubmitting ? (
                      <ActivityIndicator color="#ffffff" size="small" />
                    ) : (
                      <Text style={styles.primaryBtnText}>Submit Mosque 🚀</Text>
                    )}
                  </Pressable>
                </View>
              </View>
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.surface,
    borderTopLeftRadius: ferioRadius.lg,
    borderTopRightRadius: ferioRadius.lg,
    maxHeight: '85%',
    paddingBottom: ferioSpacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ferioSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  closeBtn: {
    padding: ferioSpacing.xs,
  },
  closeBtnText: {
    fontSize: 16,
    color: ferioColors.muted,
  },
  body: {
    padding: ferioSpacing.lg,
  },
  stepContent: {
    paddingBottom: ferioSpacing.lg,
  },
  coordBox: {
    backgroundColor: ferioColors.canvas,
    padding: ferioSpacing.md,
    borderRadius: ferioRadius.md,
    marginBottom: ferioSpacing.md,
  },
  coordLabel: {
    fontSize: 11,
    color: ferioColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  coordVal: {
    fontSize: 14,
    fontWeight: '600',
    color: ferioColors.primary,
    marginTop: 4,
    fontVariant: ['tabular-nums'],
  },
  warningBox: {
    backgroundColor: '#fef3c7',
    borderWidth: 1,
    borderColor: '#f59e0b',
    padding: ferioSpacing.md,
    borderRadius: ferioRadius.md,
    marginBottom: ferioSpacing.lg,
  },
  warningTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 12,
    color: '#78350f',
    lineHeight: 17,
  },
  successBox: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#10b981',
    padding: ferioSpacing.md,
    borderRadius: ferioRadius.md,
    marginBottom: ferioSpacing.lg,
  },
  successTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#065f46',
    marginBottom: 2,
  },
  successBody: {
    fontSize: 12,
    color: '#047857',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
    marginBottom: ferioSpacing.xs,
    marginTop: ferioSpacing.sm,
  },
  input: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    fontSize: 14,
    color: ferioColors.primary,
    marginBottom: ferioSpacing.xs,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: ferioSpacing.md,
  },
  amenityChip: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: ferioSpacing.md,
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginBottom: ferioSpacing.sm,
  },
  amenityChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  amenityText: {
    fontSize: 13,
    fontWeight: '500',
    color: ferioColors.primary,
  },
  checkText: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.muted,
  },
  checkTextActive: {
    color: '#059669',
  },
  btnRow: {
    flexDirection: 'row',
    marginTop: ferioSpacing.md,
  },
  primaryBtn: {
    backgroundColor: ferioColors.primary,
    paddingVertical: ferioSpacing.md,
    borderRadius: ferioRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ferioSpacing.sm,
  },
  primaryBtnText: {
    color: ferioColors.primaryForeground,
    fontWeight: '600',
    fontSize: 14,
  },
  secondaryBtn: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    paddingVertical: ferioSpacing.md,
    paddingHorizontal: ferioSpacing.lg,
    borderRadius: ferioRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ferioSpacing.sm,
  },
  secondaryBtnText: {
    color: ferioColors.primary,
    fontWeight: '600',
    fontSize: 14,
  },
});
