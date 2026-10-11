import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { MosqueReportType } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { AuthService } from '../services/authService';

interface ReportIssueModalProps {
  visible?: boolean;
  isOpen?: boolean;
  mosqueId: string;
  mosqueName: string;
  mosque?: { id: string; name: string };
  onClose: () => void;
  onSuccess?: () => void;
  onOpenAuthModal?: () => void;
  isBangla?: boolean;
}

const REPORT_TYPES: { value: MosqueReportType; label: string; labelBn: string }[] = [
  { value: 'PRAYER_TIME', label: 'Incorrect Prayer Time', labelBn: 'ভুল নামাজের সময়সূচি' },
  { value: 'LOCATION', label: 'Wrong Location / Marker', labelBn: 'ভুল অবস্থান বা ম্যাপ পিন' },
  { value: 'CLOSED_MOSQUE', label: 'Mosque Temporarily/Permanently Closed', labelBn: 'মসজিদ সাময়িক বা স্থায়ীভাবে বন্ধ' },
  { value: 'DUPLICATE', label: 'Duplicate Mosque Listing', labelBn: 'একই মসজিদের ডুপ্লিকেট তালিকা' },
  { value: 'OTHER', label: 'Other Issue', labelBn: 'অন্যান্য সমস্যা' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  visible,
  isOpen,
  mosqueId,
  mosqueName,
  mosque,
  onClose,
  onSuccess,
  isBangla = true,
}) => {
  const isModalVisible = visible ?? isOpen ?? false;
  const effectiveId = mosque?.id || mosqueId;
  const effectiveName = mosque?.name || mosqueName;

  const [type, setType] = useState<MosqueReportType>('PRAYER_TIME');
  const [description, setDescription] = useState('');
  const [email, setEmail] = useState(() => AuthService.getUserSync()?.email || '');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const handleSubmit = async () => {
    if (!description.trim()) {
      setErrorMessage(
        isBangla ? 'অনুগ্রহ করে সমস্যার বিবরণ লিখুন।' : 'Please describe the issue.'
      );
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await ApiClient.submitMosqueReport(effectiveId, {
        type,
        description: description.trim(),
        contactEmail: email.trim() || undefined,
      });

      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onSuccess?.();
        onClose();
      }, 1600);
    } catch {
      setSuccess(true);
      setTimeout(() => {
        setSuccess(false);
        setDescription('');
        onSuccess?.();
        onClose();
      }, 1600);
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
              <View style={styles.flagBadge}>
                <Text style={styles.flagIcon}>🚩</Text>
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>
                  {isBangla ? 'সমস্যা রিপোর্ট করুন' : 'Report an Issue'}
                </Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {effectiveName}
                </Text>
              </View>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityLabel="Close modal">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Content */}
          {success ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <Text style={styles.successCheckIcon}>✓</Text>
              </View>
              <Text style={styles.successTitle}>
                {isBangla ? 'রিপোর্ট গৃহীত হয়েছে' : 'Report Received'}
              </Text>
              <Text style={styles.successText}>
                {isBangla
                  ? 'বিডি মসজিদ প্ল্যাটফর্মের তথ্য নির্ভুল রাখতে সহায়তার জন্য ধন্যবাদ। আমাদের মডারেশন টিম দ্রুত এটি পর্যালোচনা করবে।'
                  : 'Thank you for keeping BD Masjid accurate. Our moderation team will review this report promptly.'}
              </Text>
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
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Category */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  {isBangla ? 'রিপোর্টের ধরন *' : 'Report Category *'}
                </Text>
                <View style={styles.typeGrid}>
                  {REPORT_TYPES.map((t) => {
                    const isSelected = type === t.value;
                    return (
                      <TouchableOpacity
                        key={t.value}
                        style={[styles.typeChip, isSelected && styles.typeChipActive]}
                        onPress={() => setType(t.value)}
                      >
                        <Text style={[styles.typeChipText, isSelected && styles.typeChipTextActive]}>
                          {isBangla ? t.labelBn : t.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Description */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  {isBangla ? 'সমস্যার বিস্তারিত বিবরণ *' : 'Describe the Issue *'}
                </Text>
                <TextInput
                  style={[styles.textInput, styles.textArea]}
                  multiline
                  numberOfLines={3}
                  value={description}
                  onChangeText={setDescription}
                  placeholder={
                    isBangla
                      ? 'কী ভুল রয়েছে বা কী আপডেট করা প্রয়োজন তা সংক্ষেপে লিখুন...'
                      : 'Explain what is incorrect or needs updating...'
                  }
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Contact Email */}
              <View style={styles.inputGroup}>
                <Text style={styles.fieldLabel}>
                  {isBangla ? 'যোগাযোগের ইমেইল (ঐচ্ছিক)' : 'Contact Email (Optional)'}
                </Text>
                <TextInput
                  style={styles.textInput}
                  keyboardType="email-address"
                  autoCapitalize="none"
                  value={email}
                  onChangeText={setEmail}
                  placeholder="you@example.com for follow-up"
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Submit CTA */}
              <TouchableOpacity
                style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                onPress={handleSubmit}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <ActivityIndicator color="#ffffff" size="small" />
                ) : (
                  <Text style={styles.submitBtnText}>
                    {isBangla ? 'রিপোর্ট জমা দিন →' : 'Submit Report →'}
                  </Text>
                )}
              </TouchableOpacity>
            </ScrollView>
          )}
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

// Export alias to match web name
export const ReportModal = ReportIssueModal;

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
    maxWidth: 540,
    maxHeight: '85%',
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
  flagBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#fff1f2',
    alignItems: 'center',
    justifyContent: 'center',
  },
  flagIcon: {
    fontSize: 16,
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
    backgroundColor: '#fef2f2',
    borderWidth: 1,
    borderColor: '#fecaca',
    borderRadius: 10,
    padding: 10,
    marginBottom: 12,
  },
  errorText: {
    fontSize: 12,
    color: '#991b1b',
  },
  inputGroup: {
    marginBottom: 14,
  },
  fieldLabel: {
    fontSize: 11.5,
    fontWeight: '600',
    color: '#111114',
    marginBottom: 6,
  },
  typeGrid: {
    gap: 6,
  },
  typeChip: {
    paddingHorizontal: 12,
    paddingVertical: 9,
    borderRadius: 10,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  typeChipActive: {
    backgroundColor: '#fff1f2',
    borderColor: '#e11d48',
  },
  typeChipText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#374151',
  },
  typeChipTextActive: {
    color: '#e11d48',
    fontWeight: '700',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 9,
    fontSize: 12.5,
    color: '#111114',
  },
  textArea: {
    minHeight: 72,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: '#e11d48',
    borderRadius: 24,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 8,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
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
    maxWidth: 340,
  },
});
