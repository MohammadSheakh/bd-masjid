import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  TextInput,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MosqueStaffRole } from '../types/community';
import {
  VerificationDocumentType,
  VerificationClaimItem,
  SubmitVerificationPayload,
} from '../types/verification';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface CommitteeVerificationModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
  onSuccess?: () => void;
  isBangla?: boolean;
}

const DOCUMENT_TYPES: { type: VerificationDocumentType; labelBn: string; labelEn: string; icon: string }[] = [
  { type: 'COMMITTEE_RESOLUTION', labelBn: 'কমিটি রেজুলেশন কপি', labelEn: 'Committee Resolution Copy', icon: '📜' },
  { type: 'NID_CARD', labelBn: 'জাতীয় পরিচয়পত্র (NID)', labelEn: 'National ID Card', icon: '🪪' },
  { type: 'KHATIB_CERTIFICATE', labelBn: 'খতিব/মুয়াজ্জিন সনদ', labelEn: 'Imam / Khatib Certificate', icon: '🎓' },
  { type: 'UTILITY_BILL', labelBn: 'মসজিদ বিদ্যুৎ/গ্যাস বিল', labelEn: 'Mosque Utility Bill', icon: '⚡' },
];

const ROLES: { role: MosqueStaffRole; labelBn: string; labelEn: string }[] = [
  { role: 'MUTAWALLI', labelBn: 'মোতাওয়াল্লী / ওয়াকফ প্রশাসক', labelEn: 'Mutawalli / Waqf Lead' },
  { role: 'PRESIDENT', labelBn: 'সভাপতি (কমিটি)', labelEn: 'Committee President' },
  { role: 'SECRETARY', labelBn: 'সাধারণ সম্পাদক', labelEn: 'General Secretary' },
  { role: 'KHATIB', labelBn: 'খতিব', labelEn: 'Khatib' },
  { role: 'IMAM', labelBn: 'ইমাম', labelEn: 'Imam' },
  { role: 'MUAZZIN', labelBn: 'মুয়াজ্জিন', labelEn: 'Muazzin' },
  { role: 'COMMITTEE_MEMBER', labelBn: 'কমিটি সদস্য', labelEn: 'Committee Member' },
];

export const CommitteeVerificationModal: React.FC<CommitteeVerificationModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
  onSuccess,
  isBangla = false,
}) => {
  const [selectedRole, setSelectedRole] = useState<MosqueStaffRole>('MUTAWALLI');
  const [selectedDocType, setSelectedDocType] = useState<VerificationDocumentType>('COMMITTEE_RESOLUTION');
  const [phone, setPhone] = useState('');
  const [notes, setNotes] = useState('');
  const [attachedFileName, setAttachedFileName] = useState<string | null>(null);
  const [attachedDocUrl, setAttachedDocUrl] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [existingClaims, setExistingClaims] = useState<VerificationClaimItem[]>([]);
  const [fetchingClaims, setFetchingClaims] = useState(true);

  useEffect(() => {
    if (!visible || !mosqueId) return;

    let isMounted = true;
    setFetchingClaims(true);
    ApiClient.getMosqueVerificationClaims(mosqueId)
      .then((claims) => {
        if (isMounted) {
          setExistingClaims(claims || []);
          setFetchingClaims(false);
        }
      })
      .catch(() => {
        if (isMounted) setFetchingClaims(false);
      });

    return () => {
      isMounted = false;
    };
  }, [visible, mosqueId]);

  const handleSimulateAttach = () => {
    // Standard cross-platform file attachment mock conforming to low-end device offline capability
    const sampleFiles: Record<VerificationDocumentType, { name: string; url: string }> = {
      COMMITTEE_RESOLUTION: { name: 'resolution_signed_2026.pdf', url: 'https://storage.bdmasjid.org/proof/resolution.pdf' },
      NID_CARD: { name: 'nid_front_back_scan.jpg', url: 'https://storage.bdmasjid.org/proof/nid_scan.jpg' },
      KHATIB_CERTIFICATE: { name: 'islamic_foundation_sanad.pdf', url: 'https://storage.bdmasjid.org/proof/sanad.pdf' },
      UTILITY_BILL: { name: 'desco_electricity_mosque.pdf', url: 'https://storage.bdmasjid.org/proof/desco_bill.pdf' },
    };
    const chosen = sampleFiles[selectedDocType];
    setAttachedFileName(chosen.name);
    setAttachedDocUrl(chosen.url);
  };

  const handleSubmit = async () => {
    if (!phone.trim()) {
      Alert.alert(
        isBangla ? 'ফোন নম্বর প্রয়োজন' : 'Phone Required',
        isBangla ? 'অনুগ্রহ করে দায়িত্বশীল প্রতিনিধির ফোন নম্বর প্রদান করুন।' : 'Please provide the representative contact phone number.'
      );
      return;
    }

    if (!attachedDocUrl) {
      Alert.alert(
        isBangla ? 'দলিল বা প্রমাণপত্র যুক্ত করুন' : 'Proof Document Required',
        isBangla ? 'কমিটি যাচাইকরণের জন্য রেজুলেশন বা সনদের কপি সংযুক্ত করুন।' : 'Please attach a document or photo proof for verification.'
      );
      return;
    }

    setLoading(true);

    try {
      const payload: SubmitVerificationPayload = {
        role: selectedRole,
        phone: phone.trim(),
        documentType: selectedDocType,
        documentUrl: attachedDocUrl,
        documentName: attachedFileName || undefined,
        notes: notes.trim() || undefined,
      };

      const res = await ApiClient.submitCommitteeVerification(mosqueId, payload);

      setLoading(false);
      Alert.alert(
        isBangla ? 'যাচাইকরণ আবেদন সফল' : 'Verification Submitted',
        isBangla
          ? 'মসজিদ কমিটি যাচাইকরণ নথি সফলভাবে জমা হয়েছে। অ্যাডমিন বা প্ল্যাটফর্ম মডারেটর যাচাই শেষে অবহিত করা হবে।'
          : res.message || 'Official committee credentials submitted. You will be notified upon verification.',
        [
          {
            text: isBangla ? 'ঠিক আছে' : 'OK',
            onPress: () => {
              onSuccess?.();
              onClose();
            },
          },
        ]
      );
    } catch (err: any) {
      setLoading(false);
      Alert.alert(
        isBangla ? 'ত্রুটি' : 'Submission Failed',
        err.message || (isBangla ? 'আবেদন পাঠাতে সমস্যা হয়েছে।' : 'Failed to submit committee verification.')
      );
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.title}>
                {isBangla ? 'মসজিদ কমিটি ও নেতৃত্ব যাচাইকরণ' : 'Official Committee Verification'}
              </Text>
              <Text style={styles.subtitle} numberOfLines={1}>
                {mosqueName}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} style={styles.closeBtn} accessibilityRole="button">
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.scrollArea} showsVerticalScrollIndicator={false}>
            {/* Existing Claims Status Tracking */}
            {existingClaims.length > 0 && (
              <View style={styles.existingSection}>
                <Text style={styles.sectionLabel}>
                  {isBangla ? 'পূর্ববর্তী আবেদনের অবস্থা' : 'Submitted Verification Status'}
                </Text>
                {existingClaims.map((claim) => (
                  <View key={claim.id} style={styles.claimStatusRow}>
                    <Text style={styles.claimRoleText}>{claim.role}</Text>
                    <View
                      style={[
                        styles.statusBadge,
                        claim.status === 'APPROVED'
                          ? styles.statusApproved
                          : claim.status === 'REJECTED'
                          ? styles.statusRejected
                          : styles.statusPending,
                      ]}
                    >
                      <Text style={styles.statusBadgeText}>{claim.status}</Text>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {/* Advisory Callout */}
            <View style={styles.advisoryCard}>
              <Text style={styles.advisoryIcon}>🛡️</Text>
              <Text style={styles.advisoryText}>
                {isBangla
                  ? 'ওয়াকফ প্রশাসন, সভাপতি বা ইমাম হিসেবে যাচাইকৃত হলে আপনি সময়সূচী অনুমোদন ও অনুদান চ্যানেল সরাসরি পরিচালনা করতে পারবেন।'
                  : 'Verified committee leads gain direct authority over congregation timetables and official donation accounts.'}
              </Text>
            </View>

            {/* Role Selector */}
            <Text style={styles.sectionLabel}>
              {isBangla ? '১. আপনার পদবী নির্বাচন করুন' : '1. Select Your Committee Role'}
            </Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.pillRow}>
              {ROLES.map((r) => (
                <TouchableOpacity
                  key={r.role}
                  style={[styles.pill, selectedRole === r.role && styles.pillActive]}
                  onPress={() => setSelectedRole(r.role)}
                >
                  <Text style={[styles.pillText, selectedRole === r.role && styles.pillTextActive]}>
                    {isBangla ? r.labelBn : r.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </ScrollView>

            {/* Document Type Selector */}
            <Text style={styles.sectionLabel}>
              {isBangla ? '২. যাচাইকরণ দলিলের ধরণ' : '2. Verification Document Type'}
            </Text>
            <View style={styles.docGrid}>
              {DOCUMENT_TYPES.map((doc) => (
                <TouchableOpacity
                  key={doc.type}
                  style={[styles.docCard, selectedDocType === doc.type && styles.docCardActive]}
                  onPress={() => setSelectedDocType(doc.type)}
                >
                  <Text style={styles.docIcon}>{doc.icon}</Text>
                  <Text style={[styles.docLabel, selectedDocType === doc.type && styles.docLabelActive]}>
                    {isBangla ? doc.labelBn : doc.labelEn}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>

            {/* Document Attachment Picker Card */}
            <Text style={styles.sectionLabel}>
              {isBangla ? '৩. প্রমাণপত্র আপলোড / সংযুক্তি' : '3. Attach Proof Document'}
            </Text>
            <View style={styles.attachmentBox}>
              {attachedFileName ? (
                <View style={styles.attachedRow}>
                  <Text style={styles.attachedFileIcon}>📄</Text>
                  <View style={styles.attachedMeta}>
                    <Text style={styles.attachedName}>{attachedFileName}</Text>
                    <Text style={styles.attachedReady}>
                      {isBangla ? 'সংযুক্ত হয়েছে ✓' : 'Attached & Ready ✓'}
                    </Text>
                  </View>
                  <TouchableOpacity onPress={() => setAttachedFileName(null)}>
                    <Text style={styles.removeAttached}>✕</Text>
                  </TouchableOpacity>
                </View>
              ) : (
                <TouchableOpacity style={styles.uploadTrigger} onPress={handleSimulateAttach}>
                  <Text style={styles.uploadIcon}>📎</Text>
                  <Text style={styles.uploadPrompt}>
                    {isBangla ? '+ দলিল বা ছবি নির্বাচন করুন' : '+ Select Document or Photo'}
                  </Text>
                  <Text style={styles.uploadSub}>PDF, JPG, PNG (Max 5MB)</Text>
                </TouchableOpacity>
              )}
            </View>

            {/* Contact Phone */}
            <Text style={styles.sectionLabel}>
              {isBangla ? '৪. প্রতিনিধির ফোন নম্বর' : '4. Official Contact Phone'}
            </Text>
            <TextInput
              style={styles.input}
              placeholder="017XXXXXXXX"
              placeholderTextColor="#9ca3af"
              value={phone}
              onChangeText={setPhone}
              keyboardType="phone-pad"
            />

            {/* Optional Notes */}
            <Text style={styles.sectionLabel}>
              {isBangla ? '৫. অতিরিক্ত বিবরণ (ঐচ্ছিক)' : '5. Additional Details (Optional)'}
            </Text>
            <TextInput
              style={[styles.input, styles.textArea]}
              placeholder={isBangla ? 'কমিটি বা মসজিদ সংক্রান্ত প্রাসঙ্গিক তথ্য...' : 'Relevant context or registration memo...'}
              placeholderTextColor="#9ca3af"
              value={notes}
              onChangeText={setNotes}
              multiline
              numberOfLines={3}
            />

            <View style={{ height: 20 }} />
          </ScrollView>

          {/* Footer Submit */}
          <View style={styles.footer}>
            <TouchableOpacity
              style={[styles.submitBtn, loading && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={loading}
              accessibilityRole="button"
            >
              {loading ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>
                  {isBangla ? '🛡️ ভেরিফিকেশন জমা দিন' : '🛡️ Submit Official Verification'}
                </Text>
              )}
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '88%',
    paddingBottom: 24,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: ferioColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: ferioSpacing.sm,
    marginBottom: ferioSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.lg,
    paddingBottom: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f2',
  },
  headerTextGroup: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: ferioColors.muted,
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
    fontSize: 13,
    color: ferioColors.muted,
  },
  scrollArea: {
    paddingHorizontal: ferioSpacing.lg,
    maxHeight: 460,
  },
  existingSection: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.md,
    padding: 10,
    marginTop: 12,
  },
  claimStatusRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 6,
  },
  claimRoleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  statusBadge: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 6,
  },
  statusPending: {
    backgroundColor: '#fef3c7',
  },
  statusApproved: {
    backgroundColor: '#ecfdf5',
  },
  statusRejected: {
    backgroundColor: '#fef2f2',
  },
  statusBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  advisoryCard: {
    flexDirection: 'row',
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    borderRadius: ferioRadius.md,
    padding: 10,
    marginTop: 12,
    alignItems: 'center',
  },
  advisoryIcon: {
    fontSize: 18,
    marginRight: 8,
  },
  advisoryText: {
    flex: 1,
    fontSize: 11,
    lineHeight: 16,
    color: '#065f46',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
    marginTop: 14,
    marginBottom: 6,
  },
  pillRow: {
    flexDirection: 'row',
    marginBottom: 4,
  },
  pill: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    marginRight: 8,
    borderWidth: 1,
    borderColor: '#e4e4e7',
  },
  pillActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  pillText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  pillTextActive: {
    color: '#ffffff',
  },
  docGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },
  docCard: {
    flexBasis: '48%',
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 8,
    padding: 10,
    alignItems: 'center',
  },
  docCardActive: {
    borderColor: '#059669',
    backgroundColor: '#ecfdf5',
  },
  docIcon: {
    fontSize: 20,
    marginBottom: 4,
  },
  docLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.muted,
    textAlign: 'center',
  },
  docLabelActive: {
    color: '#059669',
  },
  attachmentBox: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderStyle: 'dashed',
    borderRadius: 8,
    padding: 14,
    alignItems: 'center',
  },
  uploadTrigger: {
    alignItems: 'center',
  },
  uploadIcon: {
    fontSize: 22,
    marginBottom: 2,
  },
  uploadPrompt: {
    fontSize: 12,
    fontWeight: '700',
    color: '#059669',
  },
  uploadSub: {
    fontSize: 10,
    color: ferioColors.muted,
    marginTop: 2,
  },
  attachedRow: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
  },
  attachedFileIcon: {
    fontSize: 24,
    marginRight: 8,
  },
  attachedMeta: {
    flex: 1,
  },
  attachedName: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  attachedReady: {
    fontSize: 10,
    color: '#059669',
    fontWeight: '600',
  },
  removeAttached: {
    fontSize: 16,
    color: '#ef4444',
    padding: 4,
  },
  input: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 13,
    color: ferioColors.primary,
  },
  textArea: {
    minHeight: 60,
    textAlignVertical: 'top',
  },
  footer: {
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.sm,
  },
  submitBtn: {
    backgroundColor: '#059669',
    borderRadius: ferioRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
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
