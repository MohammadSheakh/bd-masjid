import React, { useState, useEffect } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MosqueFacility } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { SuggestedFacilitiesPayload, COMMON_BANGLADESH_AMENITIES } from '../services/facilityService';
import { AuthService } from '../services/authService';

interface SuggestFacilitiesModalProps {
  visible?: boolean;
  isOpen?: boolean;
  mosqueId: string;
  mosqueName: string;
  initialFacilities?: MosqueFacility | null;
  initialData?: MosqueFacility | null;
  language?: 'bn' | 'en';
  isBangla?: boolean;
  onClose: () => void;
  onSuccess?: (updated?: SuggestedFacilitiesPayload) => void;
  onOpenAuthModal?: () => void;
}

export const SuggestFacilitiesModal: React.FC<SuggestFacilitiesModalProps> = ({
  visible,
  isOpen,
  mosqueId,
  mosqueName,
  initialFacilities,
  initialData,
  language,
  isBangla = true,
  onClose,
  onSuccess,
}) => {
  const isModalVisible = visible ?? isOpen ?? false;
  const isBn = language ? language === 'bn' : isBangla;
  const effectiveInitial = initialFacilities || initialData;

  // Capacity & Sanitation
  const [totalCapacity, setTotalCapacity] = useState<string>('');
  const [toiletCount, setToiletCount] = useState<string>('');

  // Women & Wudu
  const [hasFemalePrayerSpace, setHasFemalePrayerSpace] = useState<boolean>(false);
  const [femaleCapacity, setFemaleCapacity] = useState<string>('');
  const [hasSeparateWudu, setHasSeparateWudu] = useState<boolean>(false);
  const [wuduCapacity, setWuduCapacity] = useState<string>('');

  // Accessibility & Climate
  const [hasWheelchairAccess, setHasWheelchairAccess] = useState<boolean>(false);
  const [hasRamp, setHasRamp] = useState<boolean>(false);
  const [hasAirConditioning, setHasAirConditioning] = useState<boolean>(false);
  const [hasFan, setHasFan] = useState<boolean>(true);

  // Services & Parking
  const [hasJanazaService, setHasJanazaService] = useState<boolean>(false);
  const [hasLibraryMaktab, setHasLibraryMaktab] = useState<boolean>(false);
  const [hasParkingCar, setHasParkingCar] = useState<boolean>(false);
  const [hasParkingBike, setHasParkingBike] = useState<boolean>(false);

  // Custom Amenities & Description
  const [customAmenities, setCustomAmenities] = useState<string[]>([]);
  const [newAmenityInput, setNewAmenityInput] = useState<string>('');
  const [description, setDescription] = useState<string>('');

  // Status
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (effectiveInitial) {
      setTotalCapacity(
        effectiveInitial.totalCapacity !== null && effectiveInitial.totalCapacity !== undefined
          ? String(effectiveInitial.totalCapacity)
          : ''
      );
      setToiletCount(
        effectiveInitial.toiletCount !== null && effectiveInitial.toiletCount !== undefined
          ? String(effectiveInitial.toiletCount)
          : ''
      );
      setHasFemalePrayerSpace(Boolean(effectiveInitial.hasFemalePrayerSpace));
      setFemaleCapacity(
        effectiveInitial.femaleCapacity !== null && effectiveInitial.femaleCapacity !== undefined
          ? String(effectiveInitial.femaleCapacity)
          : ''
      );
      setHasSeparateWudu(Boolean(effectiveInitial.hasSeparateWudu));
      setWuduCapacity(
        effectiveInitial.wuduCapacity !== null && effectiveInitial.wuduCapacity !== undefined
          ? String(effectiveInitial.wuduCapacity)
          : ''
      );
      setHasWheelchairAccess(Boolean(effectiveInitial.hasWheelchairAccess));
      setHasRamp(Boolean(effectiveInitial.hasRamp));
      setHasAirConditioning(Boolean(effectiveInitial.hasAirConditioning));
      setHasFan(effectiveInitial.hasFan ?? true);
      setHasJanazaService(Boolean(effectiveInitial.hasJanazaService));
      setHasLibraryMaktab(Boolean(effectiveInitial.hasLibraryMaktab));
      setHasParkingCar(Boolean(effectiveInitial.hasParkingCar));
      setHasParkingBike(Boolean(effectiveInitial.hasParkingBike));
      setCustomAmenities(
        Array.isArray(effectiveInitial.customAmenities) ? effectiveInitial.customAmenities : []
      );
    }
  }, [effectiveInitial, isModalVisible]);

  const toggleCustomAmenity = (name: string) => {
    setCustomAmenities((prev) =>
      prev.includes(name) ? prev.filter((a) => a !== name) : [...prev, name]
    );
  };

  const handleAddCustom = () => {
    const trimmed = newAmenityInput.trim();
    if (!trimmed) return;
    if (customAmenities.includes(trimmed)) return;
    if (customAmenities.length >= 25) return;
    setCustomAmenities((prev) => [...prev, trimmed]);
    setNewAmenityInput('');
  };

  const handleSubmit = async () => {
    setIsSubmitting(true);
    setErrorMessage(null);

    const activeUser = AuthService.getUserSync();
    const payload: SuggestedFacilitiesPayload = {
      totalCapacity: totalCapacity ? parseInt(totalCapacity, 10) : null,
      toiletCount: toiletCount ? parseInt(toiletCount, 10) : null,
      hasFemalePrayerSpace,
      femaleCapacity: femaleCapacity ? parseInt(femaleCapacity, 10) : null,
      hasSeparateWudu,
      wuduCapacity: wuduCapacity ? parseInt(wuduCapacity, 10) : null,
      hasWheelchairAccess,
      hasRamp,
      hasAirConditioning,
      hasFan,
      hasJanazaService,
      hasLibraryMaktab,
      hasParkingCar,
      hasParkingBike,
      customAmenities,
      description: description.trim() || undefined,
      comment: description.trim() || undefined,
      contributorId: activeUser?.id,
      contributorName: activeUser?.name,
    };

    try {
      await ApiClient.submitFacilitySuggestion(mosqueId, payload);
      setIsSuccess(true);
      if (onSuccess) onSuccess(payload);
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isBn ? 'তথ্য পাঠানো সম্ভব হয়নি। পুনরায় চেষ্টা করুন।' : 'Failed to submit facility suggestion.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!isModalVisible) return null;

  return (
    <Modal visible={isModalVisible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.iconBadge}>
                <Text style={styles.iconBadgeText}>🏛️</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>
                  {isBn ? 'মসজিদের সুবিধা ও সেবা প্রস্তাব' : 'Suggest Mosque Facilities & Amenities'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {mosqueName} &bull; {isBn ? 'গণতদারকি তথ্য' : 'Community crowdsourced'}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Success Screen */}
          {isSuccess ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <Text style={styles.successCheckIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>
                {isBn ? 'সুবিধা বিবরণ সফলভাবে জমা হয়েছে' : 'Facility Details Suggested Successfully'}
              </Text>
              <Text style={styles.successText}>
                {isBn
                  ? 'জাযাকাল্লাহ খাইরান! আপনার অবদান দূর-দূরান্তের মুসাফির, মা-বোন ও প্রবীণ মুসল্লিদের সঠিক সুবিধা খুঁজে পেতে সহায়তা করবে।'
                  : 'JazakAllah Khair! Your contribution assists travelers, women, and elderly worshippers finding verified amenities.'}
              </Text>
              <TouchableOpacity style={styles.closeWindowBtn} onPress={onClose}>
                <Text style={styles.closeWindowBtnText}>
                  {isBn ? 'উইন্ডো বন্ধ করুন' : 'Close Window'}
                </Text>
              </TouchableOpacity>
            </View>
          ) : (
            <ScrollView
              style={styles.body}
              contentContainerStyle={styles.bodyContent}
              showsVerticalScrollIndicator={false}
              keyboardShouldPersistTaps="handled"
            >
              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Section 1: Capacity & Washrooms */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>
                  {isBn ? 'মুসল্লি ও ওজুখানা ধারণক্ষমতা' : 'Musalli & Washroom Capacity'}
                </Text>
                <View style={styles.twoColRow}>
                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>
                      {isBn ? 'মোট মুসল্লি ধারণক্ষমতা' : 'Total Musalli Capacity'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={totalCapacity}
                      onChangeText={setTotalCapacity}
                      keyboardType="numeric"
                      placeholder="e.g. 1500"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                  <View style={[styles.inputGroup, styles.flex1]}>
                    <Text style={styles.fieldLabel}>
                      {isBn ? 'টয়লেট / ওয়াশরুম সংখ্যা' : 'Toilet / Washroom Count'}
                    </Text>
                    <TextInput
                      style={styles.textInput}
                      value={toiletCount}
                      onChangeText={setToiletCount}
                      keyboardType="numeric"
                      placeholder="e.g. 12"
                      placeholderTextColor="#9ca3af"
                    />
                  </View>
                </View>
              </View>

              {/* Section 2: Women's Area & Wudu Provisions */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>
                  {isBn ? "মহিলাদের নামাজের জায়গা ও ওজু" : "Women's Area & Wudu Provisions"}
                </Text>

                {/* Female Space */}
                <TouchableOpacity
                  style={[styles.checkboxCard, hasFemalePrayerSpace && styles.checkboxCardActive]}
                  onPress={() => setHasFemalePrayerSpace(!hasFemalePrayerSpace)}
                >
                  <View style={styles.checkboxRow}>
                    <View style={[styles.checkboxSquare, hasFemalePrayerSpace && styles.checkboxSquareActive]}>
                      {hasFemalePrayerSpace ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.checkboxTitle}>
                        {isBn ? 'মহিলাদের জন্য নির্ধারিত নামাজের জায়গা' : "Dedicated Secluded Women's Prayer Space"}
                      </Text>
                      <Text style={styles.checkboxSubtitle}>
                        {isBn
                          ? 'পৃথক প্রবেশদ্বারসহ আলাদা হল বা পার্টিশন ব্যবস্থা'
                          : 'Separate hall or partitioned section with dedicated entrance'}
                      </Text>
                    </View>
                  </View>
                  {hasFemalePrayerSpace && (
                    <View style={styles.subInputContainer}>
                      <Text style={styles.subInputLabel}>
                        {isBn ? 'মহিলাদের সেকশন ধারণক্ষমতা' : "Women's Section Capacity"}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={femaleCapacity}
                        onChangeText={setFemaleCapacity}
                        keyboardType="numeric"
                        placeholder="e.g. 200"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  )}
                </TouchableOpacity>

                {/* Dedicated Wudu Area */}
                <TouchableOpacity
                  style={[styles.checkboxCard, hasSeparateWudu && styles.checkboxCardActive]}
                  onPress={() => setHasSeparateWudu(!hasSeparateWudu)}
                >
                  <View style={styles.checkboxRow}>
                    <View style={[styles.checkboxSquare, hasSeparateWudu && styles.checkboxSquareActive]}>
                      {hasSeparateWudu ? <Text style={styles.checkMark}>✓</Text> : null}
                    </View>
                    <View style={styles.flex1}>
                      <Text style={styles.checkboxTitle}>
                        {isBn ? 'নির্ধারিত আলাদা ওজুখানা' : 'Dedicated Ablution (Wudu) Area'}
                      </Text>
                      <Text style={styles.checkboxSubtitle}>
                        {isBn
                          ? 'মূল নামাজ কক্ষের বাইরে ট্যাপ বা হাউস ওজু ব্যবস্থা'
                          : 'Continuous tap or tank setup separated from main hall'}
                      </Text>
                    </View>
                  </View>
                  {hasSeparateWudu && (
                    <View style={styles.subInputContainer}>
                      <Text style={styles.subInputLabel}>
                        {isBn ? 'মোট ওজুর ট্যাপ / পানির কল সংখ্যা' : 'Total Wudu Faucet / Tap Count'}
                      </Text>
                      <TextInput
                        style={styles.textInput}
                        value={wuduCapacity}
                        onChangeText={setWuduCapacity}
                        keyboardType="numeric"
                        placeholder="e.g. 40"
                        placeholderTextColor="#9ca3af"
                      />
                    </View>
                  )}
                </TouchableOpacity>
              </View>

              {/* Section 3: Accessibility & Climate */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>
                  {isBn ? 'চলাচল সুবিধা ও তাপমাত্রা নিয়ন্ত্রণ' : 'Accessibility & Climate Controls'}
                </Text>
                <View style={styles.gridTwo}>
                  <TouchableOpacity
                    style={[styles.chipSelect, hasWheelchairAccess && styles.chipSelectActive]}
                    onPress={() => setHasWheelchairAccess(!hasWheelchairAccess)}
                  >
                    <Text style={[styles.chipSelectText, hasWheelchairAccess && styles.chipSelectTextActive]}>
                      ♿ {isBn ? 'হুইলচেয়ার বান্ধব' : 'Wheelchair Accessible'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipSelect, hasRamp && styles.chipSelectActive]}
                    onPress={() => setHasRamp(!hasRamp)}
                  >
                    <Text style={[styles.chipSelectText, hasRamp && styles.chipSelectTextActive]}>
                      📐 {isBn ? 'প্রবেশমুখে র‍্যাম্প' : 'Entrance Ramp Available'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipSelect, hasAirConditioning && styles.chipSelectActive]}
                    onPress={() => setHasAirConditioning(!hasAirConditioning)}
                  >
                    <Text style={[styles.chipSelectText, hasAirConditioning && styles.chipSelectTextActive]}>
                      ❄️ {isBn ? 'শীতাতপ নিয়ন্ত্রিত (AC)' : 'Air Conditioning (AC)'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipSelect, hasFan && styles.chipSelectActive]}
                    onPress={() => setHasFan(!hasFan)}
                  >
                    <Text style={[styles.chipSelectText, hasFan && styles.chipSelectTextActive]}>
                      🌀 {isBn ? 'বৈদ্যুতিক ফ্যান' : 'Electric Fans'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 4: Community Services & Parking */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>
                  {isBn ? 'সমাজসেবা ও পার্কিং' : 'Community Services & Parking'}
                </Text>
                <View style={styles.gridTwo}>
                  <TouchableOpacity
                    style={[styles.chipSelect, hasJanazaService && styles.chipSelectActive]}
                    onPress={() => setHasJanazaService(!hasJanazaService)}
                  >
                    <Text style={[styles.chipSelectText, hasJanazaService && styles.chipSelectTextActive]}>
                      ⚰️ {isBn ? 'জানাজার সামগ্রী / খাটিয়া' : 'Janaza Staging & Service'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipSelect, hasLibraryMaktab && styles.chipSelectActive]}
                    onPress={() => setHasLibraryMaktab(!hasLibraryMaktab)}
                  >
                    <Text style={[styles.chipSelectText, hasLibraryMaktab && styles.chipSelectTextActive]}>
                      📚 {isBn ? 'মক্তব / ইসলামি লাইব্রেরি' : 'Maktab / Islamic Library'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipSelect, hasParkingCar && styles.chipSelectActive]}
                    onPress={() => setHasParkingCar(!hasParkingCar)}
                  >
                    <Text style={[styles.chipSelectText, hasParkingCar && styles.chipSelectTextActive]}>
                      🚗 {isBn ? 'গাড়ি পার্কিং ব্যবস্থা' : 'Car Parking Space'}
                    </Text>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[styles.chipSelect, hasParkingBike && styles.chipSelectActive]}
                    onPress={() => setHasParkingBike(!hasParkingBike)}
                  >
                    <Text style={[styles.chipSelectText, hasParkingBike && styles.chipSelectTextActive]}>
                      🏍️ {isBn ? 'মোটরসাইকেল / বাইক পার্কিং' : 'Motorcycle / Bike Parking'}
                    </Text>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Section 5: Additional Amenities & Custom Options */}
              <View style={styles.sectionBlock}>
                <Text style={styles.sectionHeading}>
                  {isBn ? 'অতিরিক্ত সুবিধা ও ক্যাটালগ' : 'Additional Amenities & Custom Options'}
                </Text>
                <View style={styles.amenityChipCloud}>
                  {COMMON_BANGLADESH_AMENITIES.map((item) => {
                    const isSelected = customAmenities.includes(item.nameEn);
                    return (
                      <TouchableOpacity
                        key={item.id}
                        style={[styles.amenityCloudChip, isSelected && styles.amenityCloudChipActive]}
                        onPress={() => toggleCustomAmenity(item.nameEn)}
                      >
                        <Text style={[styles.amenityCloudText, isSelected && styles.amenityCloudTextActive]}>
                          {item.icon} {isBn ? item.nameBn : item.nameEn}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>

                {/* Add Custom Tag */}
                <View style={styles.addCustomRow}>
                  <TextInput
                    style={[styles.textInput, styles.flex1]}
                    value={newAmenityInput}
                    onChangeText={setNewAmenityInput}
                    placeholder={isBn ? 'অন্য কোনো বিশেষ সুবিধা লিখুন...' : 'Add another amenity...'}
                    placeholderTextColor="#9ca3af"
                  />
                  <TouchableOpacity style={styles.addCustomBtn} onPress={handleAddCustom}>
                    <Text style={styles.addCustomBtnText}>{isBn ? '+ যোগ' : '+ Add'}</Text>
                  </TouchableOpacity>
                </View>

                {customAmenities.length > 0 && (
                  <View style={styles.selectedTagsContainer}>
                    {customAmenities.map((tag) => (
                      <View key={tag} style={styles.selectedTagPill}>
                        <Text style={styles.selectedTagText}>{tag}</Text>
                        <TouchableOpacity onPress={() => toggleCustomAmenity(tag)}>
                          <Text style={styles.removeTagText}>✕</Text>
                        </TouchableOpacity>
                      </View>
                    ))}
                  </View>
                )}
              </View>

              {/* Section 6: Additional Information */}
              <View style={styles.sectionBlock}>
                <Text style={styles.fieldLabel}>
                  {isBn ? 'অতিরিক্ত তথ্য বা সূত্রের বিবরণ (ঐচ্ছিক)' : 'Additional Information or Source (Optional)'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={2}
                  placeholder={
                    isBn
                      ? 'উদা: সম্প্রতি ২য় তলায় মহিলাদের নামাজের স্থান নির্মাণ সম্পন্ন, সোলার ইনভার্টার সক্রিয়।'
                      : 'e.g. Recently completed female prayer section on 2nd floor, solar inverter active.'
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Actions Footer */}
              <View style={styles.actionsFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
                  <Text style={styles.cancelBtnText}>{isBn ? 'বাতিল' : 'Cancel'}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>
                      {isBn ? 'সুবিধা প্রস্তাব জমা দিন →' : 'Submit Facility Suggestion →'}
                    </Text>
                  )}
                </TouchableOpacity>
              </View>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
    alignItems: 'center',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    width: '100%',
    maxWidth: 580,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 14,
    backgroundColor: '#fafafa',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8ea',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 12,
    flex: 1,
    paddingRight: 8,
  },
  iconBadge: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  iconBadgeText: {
    fontSize: 18,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 14.5,
    fontWeight: '700',
    color: '#111114',
  },
  subtitle: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 14,
    color: '#6e6e73',
    fontWeight: '600',
  },
  body: {
    flex: 1,
  },
  bodyContent: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 28,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 12,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorIcon: {
    fontSize: 14,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
  },
  sectionBlock: {
    marginBottom: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f4f4f5',
  },
  sectionHeading: {
    fontSize: 11,
    fontWeight: '700',
    textTransform: 'uppercase',
    letterSpacing: 0.6,
    color: '#6e6e73',
    marginBottom: 10,
  },
  twoColRow: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  inputGroup: {
    marginBottom: 10,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#111114',
    marginBottom: 5,
  },
  textInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12.5,
    color: '#111114',
  },
  textArea: {
    minHeight: 56,
    textAlignVertical: 'top',
  },
  checkboxCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    padding: 12,
    marginBottom: 10,
  },
  checkboxCardActive: {
    borderColor: '#111114',
    backgroundColor: '#ffffff',
  },
  checkboxRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 10,
  },
  checkboxSquare: {
    width: 20,
    height: 20,
    borderRadius: 5,
    borderWidth: 1.5,
    borderColor: '#d1d5db',
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 2,
  },
  checkboxSquareActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  checkMark: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: 'bold',
  },
  checkboxTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  checkboxSubtitle: {
    fontSize: 10.5,
    color: '#6e6e73',
    marginTop: 2,
    lineHeight: 14,
  },
  subInputContainer: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8ea',
  },
  subInputLabel: {
    fontSize: 10.5,
    fontWeight: '600',
    color: '#6e6e73',
    marginBottom: 4,
  },
  gridTwo: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  chipSelect: {
    width: '48.5%',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingVertical: 10,
    paddingHorizontal: 10,
  },
  chipSelectActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  chipSelectText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  chipSelectTextActive: {
    color: '#ffffff',
  },
  amenityChipCloud: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 10,
  },
  amenityCloudChip: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  amenityCloudChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#059669',
  },
  amenityCloudText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#4b5563',
  },
  amenityCloudTextActive: {
    color: '#059669',
  },
  addCustomRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 4,
  },
  addCustomBtn: {
    paddingHorizontal: 14,
    borderRadius: 10,
    backgroundColor: '#111114',
    alignItems: 'center',
    justifyContent: 'center',
  },
  addCustomBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  selectedTagsContainer: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginTop: 10,
  },
  selectedTagPill: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 6,
    backgroundColor: '#f4f4f5',
  },
  selectedTagText: {
    fontSize: 11,
    color: '#111114',
    fontWeight: '500',
  },
  removeTagText: {
    fontSize: 11,
    color: '#9ca3af',
    fontWeight: 'bold',
  },
  actionsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 12,
    marginTop: 8,
    paddingTop: 12,
  },
  cancelBtn: {
    paddingHorizontal: 14,
    paddingVertical: 9,
  },
  cancelBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#6e6e73',
  },
  submitBtn: {
    paddingHorizontal: 18,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111114',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 12,
    fontWeight: '700',
    color: '#ffffff',
  },
  successContainer: {
    padding: 32,
    alignItems: 'center',
  },
  successIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 14,
  },
  successCheckIcon: {
    fontSize: 22,
    color: '#059669',
    fontWeight: 'bold',
  },
  successTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 8,
    textAlign: 'center',
  },
  successText: {
    fontSize: 12,
    color: '#6e6e73',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 380,
    marginBottom: 20,
  },
  closeWindowBtn: {
    paddingHorizontal: 22,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#111114',
  },
  closeWindowBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
  },
});
