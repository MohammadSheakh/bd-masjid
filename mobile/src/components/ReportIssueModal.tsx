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
} from 'react-native';
import { MosqueReportType } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface ReportIssueModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
}

const REPORT_OPTIONS: { type: MosqueReportType; label: string; icon: string }[] = [
  { type: 'PRAYER_TIME', label: 'Incorrect Prayer Time', icon: '🕒' },
  { type: 'LOCATION', label: 'Wrong Map Pin / Address', icon: '📍' },
  { type: 'CLOSED_MOSQUE', label: 'Permanently / Temporarily Closed', icon: '🚫' },
  { type: 'DUPLICATE', label: 'Duplicate Mosque Listing', icon: '👥' },
  { type: 'OTHER', label: 'Other Data Inaccuracy', icon: '💬' },
];

export const ReportIssueModal: React.FC<ReportIssueModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
}) => {
  const [selectedType, setSelectedType] = useState<MosqueReportType>('PRAYER_TIME');
  const [description, setDescription] = useState('');
  const [contactEmail, setContactEmail] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!description.trim()) {
      Alert.alert('Required Field', 'Please provide a brief explanation of the issue.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await ApiClient.submitMosqueReport(mosqueId, {
        type: selectedType,
        description: description.trim(),
        contactEmail: contactEmail.trim() || undefined,
      });

      Alert.alert('Report Received', res.message || 'Thank you for helping keep BD Masjid accurate.');
      setDescription('');
      setContactEmail('');
      onClose();
    } catch {
      Alert.alert('Submission Error', 'Failed to submit report. Please check your network connection.');
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
              <Text style={styles.headerTitle}>Report an Issue</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {mosqueName} • Community Moderation
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            <Text style={styles.sectionTitle}>What is incorrect?</Text>

            {/* Type selector */}
            {REPORT_OPTIONS.map((opt) => {
              const isSelected = selectedType === opt.type;
              return (
                <Pressable
                  key={opt.type}
                  style={[styles.optionRow, isSelected && styles.optionRowActive]}
                  onPress={() => setSelectedType(opt.type)}
                >
                  <Text style={styles.optionIcon}>{opt.icon}</Text>
                  <Text style={[styles.optionLabel, isSelected && styles.optionLabelActive]}>
                    {opt.label}
                  </Text>
                  <Text style={[styles.radioCircle, isSelected && styles.radioCircleActive]}>
                    {isSelected ? '●' : '○'}
                  </Text>
                </Pressable>
              );
            })}

            {/* Description input */}
            <Text style={styles.fieldLabel}>Details / Explanation *</Text>
            <TextInput
              style={styles.textArea}
              placeholder="e.g. Asr Jamaat was changed to 4:30 PM last week..."
              placeholderTextColor="#9ca3af"
              multiline
              numberOfLines={3}
              value={description}
              onChangeText={setDescription}
            />

            {/* Contact Email input */}
            <Text style={styles.fieldLabel}>Contact Email (Optional)</Text>
            <TextInput
              style={styles.input}
              placeholder="For moderator verification updates"
              placeholderTextColor="#9ca3af"
              keyboardType="email-address"
              autoCapitalize="none"
              value={contactEmail}
              onChangeText={setContactEmail}
            />

            {/* Submit button */}
            <Pressable
              style={styles.submitBtn}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Submit Issue Report 🚩</Text>
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
    maxWidth: 240,
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
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: ferioSpacing.sm,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ferioSpacing.md,
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginBottom: ferioSpacing.xs + 2,
  },
  optionRowActive: {
    backgroundColor: '#fef2f2',
    borderColor: '#fca5a5',
  },
  optionIcon: {
    fontSize: 18,
    marginRight: ferioSpacing.sm,
  },
  optionLabel: {
    fontSize: 13,
    fontWeight: '500',
    color: ferioColors.primary,
    flex: 1,
  },
  optionLabelActive: {
    color: '#991b1b',
    fontWeight: '600',
  },
  radioCircle: {
    fontSize: 16,
    color: ferioColors.muted,
  },
  radioCircleActive: {
    color: '#dc2626',
  },
  fieldLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
    marginTop: ferioSpacing.md,
    marginBottom: ferioSpacing.xs,
  },
  textArea: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    fontSize: 13,
    color: ferioColors.primary,
    minHeight: 70,
    textAlignVertical: 'top',
  },
  input: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    fontSize: 13,
    color: ferioColors.primary,
  },
  submitBtn: {
    backgroundColor: '#dc2626',
    paddingVertical: ferioSpacing.md,
    borderRadius: ferioRadius.md,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: ferioSpacing.lg,
    marginBottom: ferioSpacing.xl,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
