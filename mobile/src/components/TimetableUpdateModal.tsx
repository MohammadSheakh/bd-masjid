import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  TextInput,
  Pressable,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { PrayerSchedule } from '../types/mosque';
import { formatTo12Hour } from '../lib/time';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

type WaqtKey = 'fajrJamaat' | 'zuhrJamaat' | 'asrJamaat' | 'maghribJamaat' | 'ishaJamaat' | 'jumuahJamaat';

interface WaqtOption {
  key: WaqtKey;
  label: string;
}

const WAQT_OPTIONS: WaqtOption[] = [
  { key: 'fajrJamaat', label: 'Fajr' },
  { key: 'zuhrJamaat', label: 'Zuhr' },
  { key: 'asrJamaat', label: 'Asr' },
  { key: 'maghribJamaat', label: 'Maghrib' },
  { key: 'ishaJamaat', label: 'Isha' },
  { key: 'jumuahJamaat', label: "Jumu'ah" },
];

interface TimetableUpdateModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  currentSchedule?: PrayerSchedule | null;
  onClose: () => void;
  onScheduleUpdated?: (updatedSchedule: Partial<PrayerSchedule>) => void;
}

export const TimetableUpdateModal: React.FC<TimetableUpdateModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  currentSchedule,
  onClose,
  onScheduleUpdated,
}) => {
  const [activeTab, setActiveTab] = useState<'TIMETABLE' | 'FEEDBACK'>('TIMETABLE');
  const [selectedWaqt, setSelectedWaqt] = useState<WaqtKey>('asrJamaat');
  const [newTime, setNewTime] = useState<string>('');
  const [reason, setReason] = useState<string>('');
  const [feedbackCategory, setFeedbackCategory] = useState<'SUGGESTION' | 'COMPLAINT' | 'MAINTENANCE'>('SUGGESTION');
  const [feedbackDetails, setFeedbackDetails] = useState<string>('');
  const [targetRole, setTargetRole] = useState<'IMAM' | 'MUAZZIN' | 'KHADEM' | 'COMMITTEE'>('COMMITTEE');
  const [submittedStatus, setSubmittedStatus] = useState<string | null>(null);

  const activeWaqtLabel = WAQT_OPTIONS.find((w) => w.key === selectedWaqt)?.label ?? 'Prayer';
  const currentTimeVal = currentSchedule ? currentSchedule[selectedWaqt] : null;

  const handleSubmitTimetable = async () => {
    if (!newTime.trim()) return;

    const partialUpdate: Partial<PrayerSchedule> = {
      [selectedWaqt]: newTime.trim(),
    };

    // Optimistically update caller state immediately
    onScheduleUpdated?.(partialUpdate);
    setSubmittedStatus('✓ Jamaat time updated immediately');

    // Async background dispatch
    ApiClient.updatePrayerSchedule(mosqueId, partialUpdate, reason.trim()).catch(() => {});

    setTimeout(() => {
      setSubmittedStatus(null);
      setNewTime('');
      setReason('');
      onClose();
    }, 1200);
  };

  const handleSubmitFeedback = async () => {
    if (!feedbackDetails.trim()) return;

    setSubmittedStatus('✓ Feedback submitted to mosque committee');

    ApiClient.submitSuggestion(mosqueId, {
      type: feedbackCategory,
      details: feedbackDetails.trim(),
      targetRoles: [targetRole],
    }).catch(() => {});

    setTimeout(() => {
      setSubmittedStatus(null);
      setFeedbackDetails('');
      onClose();
    }, 1200);
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={onClose}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        style={styles.backdrop}
      >
        <View style={styles.modalCard}>
          {/* Header */}
          <View style={styles.headerRow}>
            <View style={styles.titleColumn}>
              <Text style={styles.title}>Update & Feedback</Text>
              <Text style={styles.subtitle} numberOfLines={1}>{mosqueName}</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Mode Selector Tabs */}
          <View style={styles.tabBar}>
            <Pressable
              onPress={() => setActiveTab('TIMETABLE')}
              style={[styles.tabBtn, activeTab === 'TIMETABLE' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'TIMETABLE' && styles.tabBtnTextActive]}>
                Timetable Update
              </Text>
            </Pressable>
            <Pressable
              onPress={() => setActiveTab('FEEDBACK')}
              style={[styles.tabBtn, activeTab === 'FEEDBACK' && styles.tabBtnActive]}
            >
              <Text style={[styles.tabBtnText, activeTab === 'FEEDBACK' && styles.tabBtnTextActive]}>
                Community Feedback
              </Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            {submittedStatus ? (
              <View style={styles.successToast}>
                <Text style={styles.successToastText}>{submittedStatus}</Text>
              </View>
            ) : null}

            {activeTab === 'TIMETABLE' ? (
              <>
                <Text style={styles.sectionLabel}>Select Prayer Waqt</Text>
                <View style={styles.waqtPillsRow}>
                  {WAQT_OPTIONS.map((opt) => (
                    <Pressable
                      key={opt.key}
                      onPress={() => {
                        setSelectedWaqt(opt.key);
                        setNewTime('');
                      }}
                      style={[
                        styles.waqtPill,
                        selectedWaqt === opt.key && styles.waqtPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.waqtPillText,
                          selectedWaqt === opt.key && styles.waqtPillTextActive,
                        ]}
                      >
                        {opt.label}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <View style={styles.currentInfoBox}>
                  <Text style={styles.currentInfoLabel}>Current {activeWaqtLabel} Jamaat:</Text>
                  <Text style={styles.currentInfoValue}>
                    {formatTo12Hour(currentTimeVal, 'Not set')}
                  </Text>
                </View>

                <Text style={styles.sectionLabel}>New Jamaat Time (24h or 12h, e.g. 16:45)</Text>
                <TextInput
                  value={newTime}
                  onChangeText={setNewTime}
                  placeholder="e.g. 16:45 or 04:45"
                  placeholderTextColor={ferioColors.muted}
                  style={styles.textInput}
                  autoCapitalize="none"
                />

                <Text style={styles.sectionLabel}>Announcement Note (Optional)</Text>
                <TextInput
                  value={reason}
                  onChangeText={setReason}
                  placeholder="e.g. Winter timing announced by committee"
                  placeholderTextColor={ferioColors.muted}
                  style={styles.textInput}
                />

                <Pressable
                  onPress={handleSubmitTimetable}
                  style={[styles.submitBtn, !newTime.trim() && styles.submitBtnDisabled]}
                  disabled={!newTime.trim()}
                >
                  <Text style={styles.submitBtnText}>Submit Jamaat Update</Text>
                </Pressable>
              </>
            ) : (
              <>
                <Text style={styles.sectionLabel}>Category</Text>
                <View style={styles.waqtPillsRow}>
                  {(['SUGGESTION', 'COMPLAINT', 'MAINTENANCE'] as const).map((cat) => (
                    <Pressable
                      key={cat}
                      onPress={() => setFeedbackCategory(cat)}
                      style={[
                        styles.waqtPill,
                        feedbackCategory === cat && styles.waqtPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.waqtPillText,
                          feedbackCategory === cat && styles.waqtPillTextActive,
                        ]}
                      >
                        {cat}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Target Mosque Role</Text>
                <View style={styles.waqtPillsRow}>
                  {(['COMMITTEE', 'IMAM', 'MUAZZIN', 'KHADEM'] as const).map((role) => (
                    <Pressable
                      key={role}
                      onPress={() => setTargetRole(role)}
                      style={[
                        styles.waqtPill,
                        targetRole === role && styles.waqtPillActive,
                      ]}
                    >
                      <Text
                        style={[
                          styles.waqtPillText,
                          targetRole === role && styles.waqtPillTextActive,
                        ]}
                      >
                        {role}
                      </Text>
                    </Pressable>
                  ))}
                </View>

                <Text style={styles.sectionLabel}>Feedback Details</Text>
                <TextInput
                  value={feedbackDetails}
                  onChangeText={setFeedbackDetails}
                  placeholder="Describe your community suggestion or maintenance note..."
                  placeholderTextColor={ferioColors.muted}
                  multiline
                  numberOfLines={4}
                  style={[styles.textInput, styles.textArea]}
                />

                <Pressable
                  onPress={handleSubmitFeedback}
                  style={[
                    styles.submitBtn,
                    !feedbackDetails.trim() && styles.submitBtnDisabled,
                  ]}
                  disabled={!feedbackDetails.trim()}
                >
                  <Text style={styles.submitBtnText}>Submit Feedback</Text>
                </Pressable>
              </>
            )}
          </ScrollView>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ferioSpacing.lg,
  },
  modalCard: {
    width: '100%',
    maxHeight: '85%',
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.lg,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ferioSpacing.md,
  },
  titleColumn: {
    flex: 1,
  },
  title: {
    fontSize: 17,
    fontWeight: '700',
    color: ferioColors.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 28,
    height: 28,
    borderRadius: ferioRadius.full,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: ferioColors.muted,
    fontWeight: '700',
  },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: '#f4f4f5',
    borderRadius: ferioRadius.full,
    padding: 3,
    marginBottom: ferioSpacing.md,
  },
  tabBtn: {
    flex: 1,
    paddingVertical: 7,
    alignItems: 'center',
    borderRadius: ferioRadius.full,
  },
  tabBtnActive: {
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  tabBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  tabBtnTextActive: {
    color: ferioColors.primary,
  },
  body: {
    paddingBottom: ferioSpacing.sm,
  },
  successToast: {
    backgroundColor: '#ecfdf5',
    padding: ferioSpacing.sm,
    borderRadius: ferioRadius.md,
    borderWidth: 1,
    borderColor: '#a7f3d0',
    marginBottom: ferioSpacing.md,
  },
  successToastText: {
    color: ferioColors.accent,
    fontSize: 13,
    fontWeight: '600',
    textAlign: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
    marginBottom: ferioSpacing.xs,
    marginTop: ferioSpacing.sm,
  },
  waqtPillsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ferioSpacing.xs,
    marginBottom: ferioSpacing.xs,
  },
  waqtPill: {
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    backgroundColor: '#f4f4f5',
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  waqtPillActive: {
    backgroundColor: ferioColors.accent,
    borderColor: ferioColors.accent,
  },
  waqtPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  waqtPillTextActive: {
    color: ferioColors.surface,
  },
  currentInfoBox: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: '#f8fafc',
    padding: ferioSpacing.sm,
    borderRadius: ferioRadius.md,
    marginVertical: ferioSpacing.xs,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  currentInfoLabel: {
    fontSize: 12,
    color: ferioColors.muted,
  },
  currentInfoValue: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  textInput: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: 10,
    fontSize: 14,
    color: ferioColors.primary,
    marginBottom: ferioSpacing.xs,
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  submitBtn: {
    backgroundColor: ferioColors.primary,
    paddingVertical: 12,
    borderRadius: ferioRadius.full,
    alignItems: 'center',
    marginTop: ferioSpacing.md,
  },
  submitBtnDisabled: {
    opacity: 0.45,
  },
  submitBtnText: {
    color: ferioColors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
});
