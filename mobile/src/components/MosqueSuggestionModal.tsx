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
import { Feather, Ionicons } from '@expo/vector-icons';
import {
  Mosque,
  SuggestionCategory,
  SuggestionUrgency,
  SuggestionVisibility,
} from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';
import { AuthService } from '../services/authService';

interface MosqueSuggestionModalProps {
  mosque: Mosque | null;
  visible?: boolean;
  isOpen?: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: { label: string; value: SuggestionCategory }[] = [
  { label: 'Suggestion', value: 'SUGGESTION' },
  { label: 'Complaint', value: 'COMPLAINT' },
  { label: 'Improvement', value: 'IMPROVEMENT' },
  { label: 'Maintenance', value: 'MAINTENANCE' },
];

const URGENCIES: { label: string; value: SuggestionUrgency }[] = [
  { label: 'Low', value: 'LOW' },
  { label: 'Medium', value: 'MEDIUM' },
  { label: 'Urgent', value: 'HIGH' },
];

const ROLES: { label: string; value: string }[] = [
  { label: 'Imam', value: 'IMAM' },
  { label: 'Khadem', value: 'KHADEM' },
  { label: 'Muazzin', value: 'MUAZZIN' },
  { label: 'Khatib', value: 'KHATIB' },
  { label: 'Committee', value: 'COMMITTEE' },
  { label: 'General', value: 'GENERAL' },
];

export const MosqueSuggestionModal: React.FC<MosqueSuggestionModalProps> = ({
  mosque,
  visible,
  isOpen,
  onClose,
  onSuccess,
}) => {
  const isModalVisible = visible ?? isOpen ?? false;

  const [category, setCategory] = useState<SuggestionCategory>('SUGGESTION');
  const [urgency, setUrgency] = useState<SuggestionUrgency>('MEDIUM');
  const [selectedRoles, setSelectedRoles] = useState<string[]>(['COMMITTEE']);
  const [visibility, setVisibility] = useState<SuggestionVisibility>('COMMITTEE_ONLY');
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    if (isModalVisible) {
      setSuccess(false);
      setErrorMessage(null);
      const user = AuthService.getUserSync();
      if (user?.name && !name) setName(user.name);
      if (user?.phoneNumber && !phone) setPhone(user.phoneNumber);
    }
  }, [isModalVisible]);

  if (!isModalVisible || !mosque) return null;

  const toggleRole = (roleValue: string) => {
    setSelectedRoles((prev) => {
      const exists = prev.includes(roleValue);
      const next = exists ? prev.filter((r) => r !== roleValue) : [...prev, roleValue];
      if (!exists && roleValue === 'GENERAL') {
        setVisibility('PUBLIC');
      }
      return next.length > 0 ? next : [roleValue];
    });
  };

  const handleSubmit = async () => {
    if (description.trim().length < 10) {
      setErrorMessage('Please provide at least 10 characters describing your feedback.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      await ApiClient.submitCommunitySuggestion(mosque.id, {
        type: category,
        urgency,
        visibility,
        targetRoles: selectedRoles,
        submitterName: name.trim() || undefined,
        submitterPhone: phone.trim() || undefined,
        description: description.trim(),
      });

      setSuccess(true);
      setTimeout(() => {
        if (onSuccess) onSuccess();
        onClose();
      }, 1600);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Unable to submit suggestion. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

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
                <Ionicons name="chatbubbles-outline" size={18} color="#111114" />
              </View>
              <View style={styles.headerTextCol}>
                <Text style={styles.title}>Suggest or Complain</Text>
                <Text style={styles.subtitle} numberOfLines={1}>
                  {mosque.name}
                </Text>
              </View>
            </View>
            <TouchableOpacity
              onPress={onClose}
              disabled={isSubmitting}
              style={styles.closeBtn}
              accessibilityLabel="Close dialog"
            >
              <Ionicons name="close" size={18} color={ferioColors.muted} />
            </TouchableOpacity>
          </View>

          {/* Success Screen */}
          {success ? (
            <View style={styles.successContainer}>
              <View style={styles.successIconWrapper}>
                <Feather name="check" size={24} color="#059669" />
              </View>
              <Text style={styles.successTitle}>Feedback Submitted</Text>
              <Text style={styles.successText}>
                {visibility === 'PUBLIC'
                  ? 'Your feedback is submitted and will be visible to both the community and mosque leadership.'
                  : 'Your feedback has been privately routed directly to mosque committee and leadership.'}
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
                  <Feather name="alert-circle" size={16} color="#e11d48" />
                  <Text style={styles.errorText}>{errorMessage}</Text>
                </View>
              )}

              {/* Feedback Type / Category */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Feedback Type</Text>
                <View style={styles.categoryGrid}>
                  {CATEGORIES.map((c) => {
                    const isSelected = category === c.value;
                    return (
                      <TouchableOpacity
                        key={c.value}
                        style={[styles.categoryBtn, isSelected && styles.categoryBtnActive]}
                        onPress={() => setCategory(c.value)}
                      >
                        <Text
                          style={[
                            styles.categoryBtnText,
                            isSelected && styles.categoryBtnTextActive,
                          ]}
                        >
                          {c.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Urgency Selection */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Urgency Level</Text>
                <View style={styles.urgencyGrid}>
                  {URGENCIES.map((u) => {
                    const isSelected = urgency === u.value;
                    const isHigh = u.value === 'HIGH';
                    return (
                      <TouchableOpacity
                        key={u.value}
                        style={[
                          styles.urgencyBtn,
                          isSelected && (isHigh ? styles.urgencyBtnHigh : styles.urgencyBtnActive),
                        ]}
                        onPress={() => setUrgency(u.value)}
                      >
                        <Text
                          style={[
                            styles.urgencyBtnText,
                            isSelected && styles.urgencyBtnTextActive,
                          ]}
                        >
                          {u.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Target Recipient(s) */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.sectionLabel}>Target Recipient(s)</Text>
                  <Text style={styles.sectionHint}>Select one or multiple</Text>
                </View>
                <View style={styles.rolesRow}>
                  {ROLES.map((r) => {
                    const selected = selectedRoles.includes(r.value);
                    return (
                      <TouchableOpacity
                        key={r.value}
                        style={[styles.roleChip, selected && styles.roleChipActive]}
                        onPress={() => toggleRole(r.value)}
                      >
                        <View style={[styles.checkboxSquare, selected && styles.checkboxSquareActive]}>
                          {selected && <Feather name="check" size={10} color="#111114" />}
                        </View>
                        <Text style={[styles.roleChipText, selected && styles.roleChipTextActive]}>
                          {r.label}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>

              {/* Visibility & Audience */}
              <View style={styles.section}>
                <Text style={styles.sectionLabel}>Visibility & Audience</Text>
                <View style={styles.visibilityGrid}>
                  <TouchableOpacity
                    style={[
                      styles.visibilityCard,
                      visibility === 'COMMITTEE_ONLY' && styles.visibilityCardActive,
                    ]}
                    onPress={() => setVisibility('COMMITTEE_ONLY')}
                  >
                    <Feather name="shield" size={16} color="#3f3f46" style={styles.visIcon} />
                    <View style={styles.visTextCol}>
                      <Text style={styles.visTitle}>Committee Only</Text>
                      <Text style={styles.visSub}>Private feedback for mosque administration</Text>
                    </View>
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={[
                      styles.visibilityCard,
                      visibility === 'PUBLIC' && styles.visibilityCardActive,
                    ]}
                    onPress={() => setVisibility('PUBLIC')}
                  >
                    <Feather name="globe" size={16} color="#3f3f46" style={styles.visIcon} />
                    <View style={styles.visTextCol}>
                      <Text style={styles.visTitle}>Public</Text>
                      <Text style={styles.visSub}>Visible to committee & general visitors</Text>
                    </View>
                  </TouchableOpacity>
                </View>
              </View>

              {/* Submitter Details (Optional) */}
              <View style={styles.rowInputs}>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.fieldLabel}>
                    Your Name <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={name}
                    onChangeText={setName}
                    placeholder="e.g. Mohammad"
                    placeholderTextColor="#9ca3af"
                    maxLength={100}
                  />
                </View>
                <View style={[styles.inputGroup, styles.flex1]}>
                  <Text style={styles.fieldLabel}>
                    Phone Number <Text style={styles.optionalText}>(Optional)</Text>
                  </Text>
                  <TextInput
                    style={styles.input}
                    value={phone}
                    onChangeText={setPhone}
                    placeholder="e.g. 017XXXXXXXX"
                    placeholderTextColor="#9ca3af"
                    keyboardType="phone-pad"
                    maxLength={30}
                  />
                </View>
              </View>

              {/* Details Description */}
              <View style={styles.section}>
                <View style={styles.sectionHeaderRow}>
                  <Text style={styles.fieldLabel}>Details *</Text>
                  <Text style={styles.counterText}>{description.length} / 2000</Text>
                </View>
                <TextInput
                  style={[styles.input, styles.textArea]}
                  value={description}
                  onChangeText={setDescription}
                  multiline
                  numberOfLines={4}
                  maxLength={2000}
                  placeholder="Write detailed suggestion, complaint, or feedback..."
                  placeholderTextColor="#9ca3af"
                />
              </View>

              {/* Action Buttons */}
              <View style={styles.actionsFooter}>
                <TouchableOpacity
                  style={styles.cancelBtn}
                  onPress={onClose}
                  disabled={isSubmitting}
                >
                  <Text style={styles.cancelBtnText}>Cancel</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
                  onPress={handleSubmit}
                  disabled={isSubmitting}
                >
                  {isSubmitting ? (
                    <ActivityIndicator color="#ffffff" size="small" />
                  ) : (
                    <Text style={styles.submitBtnText}>Submit Feedback</Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ferioSpacing.md,
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderRadius: 24,
    borderWidth: 1,
    borderColor: '#e8e8ea',
    width: '100%',
    maxWidth: 520,
    maxHeight: '90%',
    overflow: 'hidden',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#fafafa',
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ea',
  },
  headerTitleGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
    flex: 1,
  },
  iconBadge: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTextCol: {
    flex: 1,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111114',
  },
  subtitle: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 1,
  },
  closeBtn: {
    padding: 6,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
  },
  body: {
    flexGrow: 0,
  },
  bodyContent: {
    padding: 20,
    gap: 16,
  },
  errorBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: '#fff1f2',
    borderWidth: 1,
    borderColor: '#fecdd3',
    borderRadius: 12,
    padding: 10,
  },
  errorText: {
    fontSize: 12,
    color: '#e11d48',
    flex: 1,
  },
  section: {
    gap: 6,
  },
  sectionHeaderRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  sectionLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  sectionHint: {
    fontSize: 10,
    color: '#6e6e73',
  },
  fieldLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  optionalText: {
    fontSize: 10,
    fontWeight: '400',
    color: '#6e6e73',
  },
  counterText: {
    fontSize: 10,
    color: '#6e6e73',
  },
  categoryGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  categoryBtn: {
    flexGrow: 1,
    paddingVertical: 7,
    paddingHorizontal: 12,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    alignItems: 'center',
  },
  categoryBtnActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  categoryBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6e6e73',
  },
  categoryBtnTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  urgencyGrid: {
    flexDirection: 'row',
    gap: 6,
  },
  urgencyBtn: {
    flex: 1,
    paddingVertical: 7,
    borderRadius: 12,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    alignItems: 'center',
  },
  urgencyBtnActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  urgencyBtnHigh: {
    backgroundColor: '#e11d48',
    borderColor: '#e11d48',
  },
  urgencyBtnText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#6e6e73',
  },
  urgencyBtnTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  rolesRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  roleChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderRadius: 20,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  roleChipActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  checkboxSquare: {
    width: 14,
    height: 14,
    borderRadius: 3,
    borderWidth: 1,
    borderColor: '#c7c7cc',
    backgroundColor: '#ffffff',
    alignItems: 'center',
    justifyContent: 'center',
  },
  checkboxSquareActive: {
    backgroundColor: '#ffffff',
    borderColor: '#ffffff',
  },
  roleChipText: {
    fontSize: 11,
    fontWeight: '500',
    color: '#6e6e73',
  },
  roleChipTextActive: {
    color: '#ffffff',
    fontWeight: '600',
  },
  visibilityGrid: {
    flexDirection: 'row',
    gap: 8,
  },
  visibilityCard: {
    flex: 1,
    flexDirection: 'row',
    padding: 10,
    borderRadius: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    alignItems: 'flex-start',
    gap: 8,
  },
  visibilityCardActive: {
    backgroundColor: '#f4f4f5',
    borderColor: '#111114',
  },
  visIcon: {
    marginTop: 2,
  },
  visTextCol: {
    flex: 1,
  },
  visTitle: {
    fontSize: 12,
    fontWeight: '600',
    color: '#111114',
  },
  visSub: {
    fontSize: 10,
    color: '#6e6e73',
    marginTop: 2,
    lineHeight: 13,
  },
  rowInputs: {
    flexDirection: 'row',
    gap: 10,
  },
  inputGroup: {
    gap: 4,
  },
  flex1: {
    flex: 1,
  },
  input: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    paddingHorizontal: 12,
    paddingVertical: 8,
    fontSize: 12,
    color: '#111114',
  },
  textArea: {
    minHeight: 80,
    textAlignVertical: 'top',
  },
  actionsFooter: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    alignItems: 'center',
    gap: 10,
    paddingTop: 10,
    borderTopWidth: 1,
    borderTopColor: '#e8e8ea',
  },
  cancelBtn: {
    paddingVertical: 8,
    paddingHorizontal: 16,
    borderRadius: 20,
  },
  cancelBtnText: {
    fontSize: 12,
    color: '#6e6e73',
    fontWeight: '500',
  },
  submitBtn: {
    paddingVertical: 9,
    paddingHorizontal: 20,
    borderRadius: 20,
    backgroundColor: '#111114',
    alignItems: 'center',
    justifyContent: 'center',
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    fontSize: 12,
    color: '#ffffff',
    fontWeight: '600',
  },
  successContainer: {
    padding: 32,
    alignItems: 'center',
    gap: 12,
  },
  successIconWrapper: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: '#d1fae5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  successTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
  },
  successText: {
    fontSize: 12,
    color: '#6e6e73',
    textAlign: 'center',
    lineHeight: 18,
    maxWidth: 320,
  },
});
