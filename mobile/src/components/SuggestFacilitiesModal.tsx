import React, { useState } from 'react';
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
  Switch,
} from 'react-native';
import { MosqueFacility } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import {
  FacilityService,
  COMMON_BANGLADESH_AMENITIES,
  CANONICAL_FACILITIES,
  SuggestedFacilitiesPayload,
} from '../services/facilityService';
import { ferioColors } from '../theme/tokens';

interface SuggestFacilitiesModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  initialFacilities?: MosqueFacility | null;
  language?: 'bn' | 'en';
  onClose: () => void;
  onSuccess?: (suggested: SuggestedFacilitiesPayload) => void;
}

export const SuggestFacilitiesModal: React.FC<SuggestFacilitiesModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  initialFacilities,
  language = 'en',
  onClose,
  onSuccess,
}) => {
  const isBn = language === 'bn';

  // Canonical switches state
  const [canonical, setCanonical] = useState<Record<string, boolean>>({
    hasFemalePrayerSpace: Boolean(initialFacilities?.hasFemalePrayerSpace),
    hasAirConditioning: Boolean(initialFacilities?.hasAirConditioning),
    hasSeparateWudu: Boolean(initialFacilities?.hasSeparateWudu),
    hasWheelchairAccess: Boolean(initialFacilities?.hasWheelchairAccess),
    hasJanazaService: Boolean(initialFacilities?.hasJanazaService),
    hasParkingCar: Boolean(initialFacilities?.hasParkingCar),
  });

  const [capacity, setCapacity] = useState(
    initialFacilities?.totalCapacity ? String(initialFacilities.totalCapacity) : ''
  );
  const [selectedCustom, setSelectedCustom] = useState<string[]>(
    initialFacilities?.customAmenities ?? []
  );
  const [newCustomInput, setNewCustomInput] = useState('');
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const toggleCanonical = (key: string) => {
    setCanonical((prev) => ({ ...prev, [key]: !prev[key] }));
  };

  const toggleAmenity = (name: string) => {
    setSelectedCustom((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAddCustom = () => {
    const trimmed = newCustomInput.trim();
    if (!trimmed) return;
    if (selectedCustom.includes(trimmed)) {
      Alert.alert(isBn ? 'বিদ্যমান' : 'Already Added', isBn ? 'এই সুবিধাটি আগেই তালিকায় রয়েছে।' : 'This amenity is already in the list.');
      return;
    }
    if (selectedCustom.length >= 20) {
      Alert.alert(isBn ? 'সীমা পূর্ণ' : 'Limit Reached', isBn ? 'সর্বোচ্চ ২০টি সুবিধা যোগ করা যাবে।' : 'Maximum 20 amenities allowed.');
      return;
    }
    setSelectedCustom((prev) => [...prev, trimmed]);
    setNewCustomInput('');
  };

  const handleRemoveCustom = (name: string) => {
    setSelectedCustom((prev) => prev.filter((a) => a !== name));
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    const payload: SuggestedFacilitiesPayload = {
      hasFemalePrayerSpace: canonical.hasFemalePrayerSpace,
      hasAirConditioning: canonical.hasAirConditioning,
      hasSeparateWudu: canonical.hasSeparateWudu,
      hasWheelchairAccess: canonical.hasWheelchairAccess,
      hasJanazaService: canonical.hasJanazaService,
      hasParkingCar: canonical.hasParkingCar,
      totalCapacity: capacity ? parseInt(capacity, 10) || undefined : undefined,
      customAmenities: selectedCustom,
      comment: comment.trim() || undefined,
    };

    try {
      const res = await ApiClient.submitFacilitySuggestion(mosqueId, payload);
      Alert.alert(
        isBn ? 'তথ্য গৃহীত হয়েছে' : 'Facility Update Submitted',
        res.message || (isBn ? 'আপনার অবদানের জন্য ধন্যবাদ।' : 'Thank you for keeping mosque facilities up to date.')
      );
      onSuccess?.(payload);
      onClose();
    } catch {
      Alert.alert(
        isBn ? 'ত্রুটি' : 'Submission Failed',
        isBn ? 'তথ্য পাঠানো সম্ভব হয়নি। পুনরায় চেষ্টা করুন।' : 'Failed to submit facility details. Please try again.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={{ flex: 1 }}>
              <Text style={styles.headerTitle}>
                {isBn ? 'সুযোগ-সুবিধার তথ্য দিন' : 'Suggest Facility Details'}
              </Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {mosqueName}
              </Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.scrollArea} contentContainerStyle={styles.scrollContent}>
            {/* Canonical Facilities Switches */}
            <Text style={styles.sectionTitle}>
              {isBn ? '১. প্রধান সুযোগ-সুবিধাসমূহ' : '1. Core Architectural Facilities'}
            </Text>
            <View style={styles.switchGroup}>
              {CANONICAL_FACILITIES.map((item) => (
                <View key={item.key} style={styles.switchRow}>
                  <Text style={styles.switchLabel}>
                    {item.icon} {isBn ? item.nameBn : item.nameEn}
                  </Text>
                  <Switch
                    value={canonical[item.key]}
                    onValueChange={() => toggleCanonical(item.key)}
                    trackColor={{ false: '#e5e7eb', true: '#a7f3d0' }}
                    thumbColor={canonical[item.key] ? '#059669' : '#9ca3af'}
                  />
                </View>
              ))}
            </View>

            {/* Estimated Capacity */}
            <Text style={styles.sectionTitle}>
              {isBn ? '২. আনুমানিক ধারণক্ষমতা' : '2. Estimated Total Capacity'}
            </Text>
            <TextInput
              style={styles.textInput}
              placeholder={isBn ? 'যেমন: ১৫০০' : 'e.g. 1500 worshippers'}
              placeholderTextColor="#9ca3af"
              keyboardType="numeric"
              value={capacity}
              onChangeText={setCapacity}
            />

            {/* Curated Amenity Chips Catalog */}
            <Text style={styles.sectionTitle}>
              {isBn ? '৩. সাধারণ সুবিধাসমূহ (ট্যাপ করে নির্বাচন করুন)' : '3. Common Amenities Catalog (Tap to Toggle)'}
            </Text>
            <View style={styles.chipCatalog}>
              {COMMON_BANGLADESH_AMENITIES.map((amenity) => {
                const isSelected = selectedCustom.includes(amenity.nameEn);
                return (
                  <Pressable
                    key={amenity.id}
                    onPress={() => toggleAmenity(amenity.nameEn)}
                    style={[styles.catalogChip, isSelected && styles.catalogChipSelected]}
                    accessibilityRole="checkbox"
                    accessibilityState={{ checked: isSelected }}
                  >
                    <Text style={[styles.catalogChipText, isSelected && styles.catalogChipTextSelected]}>
                      {amenity.icon} {isBn ? amenity.nameBn : amenity.nameEn}
                    </Text>
                  </Pressable>
                );
              })}
            </View>

            {/* Dynamic Custom Amenity Entry */}
            <Text style={styles.sectionTitle}>
              {isBn ? '৪. অন্যান্য সুবিধা যোগ করুন' : '4. Add Custom Amenity Tag'}
            </Text>
            <View style={styles.addTagRow}>
              <TextInput
                style={[styles.textInput, { flex: 1, marginBottom: 0 }]}
                placeholder={isBn ? 'অন্য কোনো সুবিধা লিখুন...' : 'Type another facility...'}
                placeholderTextColor="#9ca3af"
                value={newCustomInput}
                onChangeText={setNewCustomInput}
                maxLength={50}
              />
              <Pressable
                onPress={handleAddCustom}
                style={styles.addTagBtn}
                accessibilityRole="button"
                accessibilityLabel="Add custom tag"
              >
                <Text style={styles.addTagBtnText}>{isBn ? '+ যোগ করুন' : '+ Add'}</Text>
              </Pressable>
            </View>

            {/* Active Custom Tags */}
            {selectedCustom.length > 0 && (
              <View style={styles.activeTagsWrap}>
                {selectedCustom.map((item, idx) => (
                  <Pressable
                    key={`${item}-${idx}`}
                    onPress={() => handleRemoveCustom(item)}
                    style={styles.activeTagBadge}
                  >
                    <Text style={styles.activeTagBadgeText}>{item} ✕</Text>
                  </Pressable>
                ))}
              </View>
            )}

            {/* Optional Context Note */}
            <Text style={styles.sectionTitle}>
              {isBn ? '৫. অতিরিক্ত মন্তব্য (ঐচ্ছিক)' : '5. Additional Context Note (Optional)'}
            </Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder={isBn ? 'সুবিধা সম্পর্কিত বিশেষ তথ্য বা বর্ণনা...' : 'Specific floor details, accessibility entrance note...'}
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={comment}
              onChangeText={setComment}
            />
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleSubmit}
              disabled={isSubmitting}
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              accessibilityRole="button"
              accessibilityLabel="Submit facility suggestions"
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isBn ? 'তথ্য নিশ্চিত করুন' : 'Submit Facility Updates'}
                </Text>
              )}
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '90%',
    paddingBottom: 20,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#111114',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f3f4f6',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '600',
  },
  scrollArea: {
    maxHeight: 520,
  },
  scrollContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111114',
    marginTop: 14,
    marginBottom: 8,
  },
  switchGroup: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 6,
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 9,
    borderBottomWidth: 1,
    borderBottomColor: '#f3f4f6',
  },
  switchLabel: {
    fontSize: 13,
    color: '#111114',
    fontWeight: '500',
  },
  textInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: '#111114',
  },
  textArea: {
    height: 72,
    textAlignVertical: 'top',
  },
  chipCatalog: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  catalogChip: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 20,
    paddingHorizontal: 12,
    paddingVertical: 6,
  },
  catalogChipSelected: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  catalogChipText: {
    fontSize: 12,
    color: '#4b5563',
  },
  catalogChipTextSelected: {
    color: '#059669',
    fontWeight: '600',
  },
  addTagRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
  },
  addTagBtn: {
    backgroundColor: '#111114',
    borderRadius: 8,
    paddingHorizontal: 14,
    paddingVertical: 12,
    justifyContent: 'center',
  },
  addTagBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '600',
  },
  activeTagsWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  activeTagBadge: {
    backgroundColor: '#f3f4f6',
    borderWidth: 1,
    borderColor: '#e5e7eb',
    borderRadius: 16,
    paddingHorizontal: 10,
    paddingVertical: 4,
  },
  activeTagBadgeText: {
    fontSize: 11,
    color: '#374151',
    fontWeight: '500',
  },
  footer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#f3f4f6',
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 15,
    fontWeight: '600',
  },
});
