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
import { MosqueStaffRole, CreateRoleClaimPayload } from '../types/community';
import { ApiClient } from '../lib/apiClient';
import { ContributorService } from '../services/contributorService';
import { AuthService } from '../services/authService';

interface RoleClaimModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
  isBangla?: boolean;
}

interface RoleOption {
  role: MosqueStaffRole;
  labelBn: string;
  labelEn: string;
}

const AVAILABLE_ROLES: RoleOption[] = [
  { role: 'IMAM', labelBn: 'ইমাম (পেশ ইমাম / সিনিয়র ইমাম)', labelEn: 'Imam' },
  { role: 'KHATIB', labelBn: 'খতিব (প্রধান খতিব)', labelEn: 'Chief Khatib' },
  { role: 'MUAZZIN', labelBn: 'মুয়াজ্জিন', labelEn: 'Muazzin' },
  { role: 'KHADEM', labelBn: 'খাদেম / কেয়ারটেকার', labelEn: 'Khadem' },
  { role: 'MUTAWALLI', labelBn: 'মুতাওয়াল্লি (ট্রাস্টি ও মসজিদ প্রধান)', labelEn: 'Mutawalli' },
  { role: 'MOSQUE_ADMIN', labelBn: 'মসজিদ অ্যাডমিন', labelEn: 'Moshjid Admin' },
  { role: 'COMMITTEE_PRESIDENT', labelBn: 'পরিচালনা কমিটির সভাপতি', labelEn: 'President' },
  { role: 'COMMITTEE_VICE_PRESIDENT', labelBn: 'সহ-সভাপতি', labelEn: 'Vice President' },
  { role: 'COMMITTEE_SECRETARY', labelBn: 'সাধারণ সম্পাদক', labelEn: 'General Secretary' },
  { role: 'COMMITTEE_MEMBER', labelBn: 'কমিটি কার্যনির্বাহী সদস্য', labelEn: 'Member' },
  { role: 'CUSTOM', labelBn: 'অন্যান্য কাস্টম পদবী...', labelEn: 'Custom Official Role' },
];

export const RoleClaimModal: React.FC<RoleClaimModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
  isBangla = true,
}) => {
  const user = AuthService.getUserSync();
  const [selectedRole, setSelectedRole] = useState<MosqueStaffRole>('IMAM');
  const [customRoleTitle, setCustomRoleTitle] = useState('');
  const [name, setName] = useState(user?.name || '');
  const [phoneNumber, setPhoneNumber] = useState(user?.phoneNumber || '');
  const [startDate, setStartDate] = useState('');
  const [documentUrl, setDocumentUrl] = useState('');
  const [evidence, setEvidence] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setIsSuccess(false);
      setErrorMessage(null);
      if (!name && user?.name) setName(user.name);
      if (!phoneNumber && user?.phoneNumber) setPhoneNumber(user.phoneNumber);
    }
  }, [visible]);

  const handleSubmit = async () => {
    if (!name.trim() || name.trim().length < 2) {
      setErrorMessage(
        isBangla
          ? 'অনুগ্রহ করে আপনার পূর্ণ নাম লিখুন (কমপক্ষে ২ অক্ষর)।'
          : 'Please enter your full name (minimum 2 characters).'
      );
      return;
    }

    if (!phoneNumber.trim() || phoneNumber.trim().length < 8) {
      setErrorMessage(
        isBangla
          ? 'অনুগ্রহ করে সঠিক যোগাযোগের মোবাইল নম্বর দিন।'
          : 'Please enter a valid contact phone number.'
      );
      return;
    }

    if (selectedRole === 'CUSTOM' && (!customRoleTitle.trim() || customRoleTitle.trim().length < 2)) {
      setErrorMessage(
        isBangla
          ? 'কাস্টম পদবীর নির্দিষ্ট শিরোনাম দিন (যেমন: সহকারী ইমাম, কোষাধ্যক্ষ)।'
          : 'Please enter a specific title for your custom role (e.g. Assistant Imam, Treasurer).'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const payload: CreateRoleClaimPayload = {
      role: selectedRole,
      customRoleTitle: selectedRole === 'CUSTOM' ? customRoleTitle.trim() : undefined,
      name: name.trim(),
      phoneNumber: phoneNumber.trim(),
      startDate: startDate.trim() || undefined,
      documentUrl: documentUrl.trim() || undefined,
      evidence: evidence.trim() || undefined,
    };

    try {
      await ApiClient.submitRoleClaim(mosqueId, payload);
      ContributorService.awardOptimisticPoints(50, `Role claim: ${selectedRole}`);
      setIsSuccess(true);
    } catch (err: any) {
      setErrorMessage(
        err?.message || (isBangla ? 'দাবি জমা ব্যর্থ হয়েছে।' : 'Failed to submit claim.')
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={styles.backdrop}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTitleGroup}>
              <View style={styles.shieldBadge}>
                <Text style={styles.shieldIcon}>🛡️</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>
                  {isBangla ? 'মসজিদের অফিসিয়াল দায়িত্ব দাবি করুন' : 'Claim Official Mosque Role'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {mosqueName}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityLabel="Close dialog"
            >
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
                {isBangla ? 'দায়িত্ব দাবি জমা হয়েছে' : 'Role Claim Submitted'}
              </Text>
              <Text style={styles.successText}>
                {isBangla
                  ? 'আপনার অফিসিয়াল দায়িত্ব দাবি এবং তথ্য প্রশাসন রিভিউ কিউতে পাঠানো হয়েছে। যাচাইকরণ সম্পন্ন হলে আপনার ব্যাজ ও প্রশাসনিক সুবিধা সক্রিয় করা হবে।'
                  : 'Your official role claim and verification credentials have been forwarded to the administration queue. Once verified, your badge and official privileges will be activated.'}
              </Text>
              <TouchableOpacity style={styles.closeWindowBtn} onPress={onClose}>
                <Text style={styles.closeWindowBtnText}>
                  {isBangla ? 'উইন্ডো বন্ধ করুন' : 'Close Window'}
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
              {/* Guidance banner matching web */}
              <View style={styles.guidanceBanner}>
                <Text style={styles.guidanceIcon}>✨</Text>
                <Text style={styles.guidanceText}>
                  <Text style={styles.boldText}>
                    {isBangla ? 'অফিসিয়াল নিয়োগ যাচাইকরণ: ' : 'Official Appointment Verification: '}
                  </Text>
                  {isBangla
                    ? 'মসজিদ অ্যাডমিন এবং মুতাওয়াল্লি উভয়েরই সম্পূর্ণ প্রাতিষ্ঠানিক পরিচালনা অধিকার থাকে। অনুগ্রহ করে সঠিক পরিচয়, যোগাযোগের নম্বর এবং নিয়োগের সময়কাল প্রদান করুন।'
                    : 'Both Mosque Admins and Mutawallis hold full institutional governance rights. Please provide authentic identity details, contact numbers, and appointment tenure.'}
                </Text>
              </View>

              {errorMessage && (
                <View style={styles.errorBox}>
                  <Text style={styles.errorIcon}>⚠️</Text>
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Role Selection */}
              <Text style={styles.sectionLabel}>
                💼 {isBangla ? 'অফিসিয়াল দায়িত্ব / পদবী *' : 'Official Role *'}
              </Text>
              <View style={styles.roleGrid}>
                {AVAILABLE_ROLES.map((r) => {
                  const isSelected = selectedRole === r.role;
                  return (
                    <TouchableOpacity
                      key={r.role}
                      style={[styles.roleChip, isSelected && styles.roleChipActive]}
                      onPress={() => setSelectedRole(r.role)}
                    >
                      <Text style={[styles.roleChipText, isSelected && styles.roleChipTextActive]}>
                        {isBangla ? r.labelBn : r.labelEn}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
              </View>

              {/* Custom Role Title */}
              {selectedRole === 'CUSTOM' && (
                <View style={styles.inputGroup}>
                  <Text style={styles.fieldLabel}>
                    {isBangla ? 'কাস্টম পদবীর নাম *' : 'Custom Role Title *'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={customRoleTitle}
                    onChangeText={setCustomRoleTitle}
                    placeholder={
                      isBangla ? 'উদা: সহকারী ইমাম, কোষাধ্যক্ষ' : 'e.g. Assistant Imam, Treasurer'
                    }
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              )}

              {/* Serving Since (Start Date) */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  📅 {isBangla ? 'নিয়োগ শুরুর তারিখ' : 'Serving Since (Starting Date)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={startDate}
                  onChangeText={setStartDate}
                  placeholder="YYYY-MM-DD (e.g. 2023-01-15)"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Applicant Name & Phone */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.fieldLabel}>
                    👤 {isBangla ? 'পূর্ণ নাম *' : 'Full Name *'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder={isBangla ? 'মাওলানা / হাফেজ...' : 'e.g. Mawlana Hafiz Ahmed'}
                    placeholderTextColor="#9ca3af"
                  />
                </View>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.fieldLabel}>
                    📞 {isBangla ? 'মোবাইল নম্বর *' : 'Contact Phone Number *'}
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={phoneNumber}
                    onChangeText={setPhoneNumber}
                    keyboardType="phone-pad"
                    placeholder="017XXXXXXXX"
                    placeholderTextColor="#9ca3af"
                  />
                </View>
              </View>

              {/* Supporting Document / Appointment Deed Link */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  🔗 {isBangla ? 'নিয়োগপত্র বা দলিলের লিংক (ঐচ্ছিক)' : 'Supporting Document / Deed Link (Optional)'}
                </Text>
                <TextInput
                  style={styles.input}
                  value={documentUrl}
                  onChangeText={setDocumentUrl}
                  keyboardType="url"
                  autoCapitalize="none"
                  placeholder="https://example.com/appointment-deed.pdf"
                  placeholderTextColor="#9ca3af"
                />
                <Text style={styles.hintText}>
                  {isBangla
                    ? 'নিয়োগ রেজোলিউশন স্ক্যান, ওয়াকফ দলিল বা প্রত্যয়নপত্রের অনলাইন লিংক।'
                    : 'Optional cloud link to appointment resolution scan, waqf deed, or certificate.'}
                </Text>
              </View>

              {/* Verification Narrative */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  📄 {isBangla ? 'নিয়োগের বিবরণ / প্রমাণ (ঐচ্ছিক)' : 'Appointment Evidence / Verification Details (Optional)'}
                </Text>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={evidence}
                  onChangeText={setEvidence}
                  multiline
                  numberOfLines={3}
                  maxLength={1000}
                  placeholder={
                    isBangla
                      ? 'নিয়োগ রেজোলিউশন বছর, সভাপতি বা কমিটির রেফারেন্স...'
                      : 'Mention appointment resolution year, committee members who can verify, or local references...'
                  }
                  placeholderTextColor="#9ca3af"
                />
                <View style={styles.counterRow}>
                  <Text style={styles.counterHint}>
                    {isBangla ? 'ঐচ্ছিক পটভূমি তথ্য' : 'Optional background verification info'}
                  </Text>
                  <Text style={styles.counterText}>{evidence.length} / 1000</Text>
                </View>
              </View>

              {/* Actions Footer */}
              <View style={styles.actionsFooter}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose} disabled={isSubmitting}>
                  <Text style={styles.cancelBtnText}>{isBangla ? 'বাতিল' : 'Cancel'}</Text>
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
                      {isBangla ? 'অফিসিয়াল দাবি জমা দিন' : 'Submit Official Claim'}
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
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
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
  shieldBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    alignItems: 'center',
    justifyContent: 'center',
  },
  shieldIcon: {
    fontSize: 16,
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 14,
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
  guidanceBanner: {
    flexDirection: 'row',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 10,
    padding: 12,
    marginBottom: 14,
    gap: 8,
    alignItems: 'flex-start',
  },
  guidanceIcon: {
    fontSize: 14,
    marginTop: 1,
  },
  guidanceText: {
    flex: 1,
    fontSize: 11,
    color: '#78350f',
    lineHeight: 16,
  },
  boldText: {
    fontWeight: '700',
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 14,
    gap: 8,
  },
  errorIcon: {
    fontSize: 13,
  },
  errorText: {
    flex: 1,
    fontSize: 12,
    color: '#991b1b',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 8,
  },
  roleGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
    marginBottom: 14,
  },
  roleChip: {
    paddingHorizontal: 10,
    paddingVertical: 7,
    borderRadius: 8,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  roleChipActive: {
    backgroundColor: '#059669',
    borderColor: '#059669',
  },
  roleChipText: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#374151',
  },
  roleChipTextActive: {
    color: '#ffffff',
  },
  inputGroup: {
    marginBottom: 12,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  flex1: {
    flex: 1,
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
    marginBottom: 5,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#111114',
  },
  textArea: {
    minHeight: 76,
    textAlignVertical: 'top',
  },
  hintText: {
    fontSize: 10,
    color: '#6e6e73',
    marginTop: 4,
  },
  counterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  counterHint: {
    fontSize: 10,
    color: '#6e6e73',
  },
  counterText: {
    fontSize: 10,
    color: '#6e6e73',
  },
  actionsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    marginTop: 14,
    paddingTop: 14,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e8e8ea',
  },
  cancelBtn: {
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: 20,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
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
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 8,
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
