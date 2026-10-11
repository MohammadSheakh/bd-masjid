import React, { useState } from 'react';
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
  Switch,
} from 'react-native';
import { AnnouncementCategory, CreateAnnouncementPayload } from '../types/announcement';
import { ApiClient } from '../lib/apiClient';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface CreateAnnouncementModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const CATEGORIES: { key: AnnouncementCategory; label: string }[] = [
  { key: 'GENERAL', label: '📢 Notice / সাধারণ' },
  { key: 'JANAZA', label: '⚰️ Janazah / জানাজা' },
  { key: 'JUMUAH_KHUTBAH', label: "🕌 Jumu'ah / জুমা" },
  { key: 'RAMADAN', label: '🌙 Ramadan / রমজান' },
  { key: 'EID', label: '🎉 Eid / ঈদ' },
  { key: 'MAINTENANCE', label: '🔧 Maintenance / সংস্কার' },
  { key: 'EMERGENCY_ALERT', label: '🚨 Emergency / জরুরি' },
];

export const CreateAnnouncementModal: React.FC<CreateAnnouncementModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
  onSuccess,
}) => {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<AnnouncementCategory>('GENERAL');
  const [isPinned, setIsPinned] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    if (!title.trim() || title.trim().length < 3) {
      Alert.alert('Validation Error', 'Please enter a title with at least 3 characters.');
      return;
    }
    if (!content.trim() || content.trim().length < 10) {
      Alert.alert('Validation Error', 'Please enter announcement body with at least 10 characters.');
      return;
    }

    try {
      setIsSubmitting(true);
      const payload: CreateAnnouncementPayload = {
        title: title.trim(),
        content: content.trim(),
        category,
        isPinned,
      };

      const res = await ApiClient.createAnnouncement(mosqueId, payload);
      Alert.alert('Success', res.message || 'Announcement posted successfully!');
      setTitle('');
      setContent('');
      setCategory('GENERAL');
      setIsPinned(false);
      onClose();
      if (onSuccess) onSuccess();
    } catch {
      Alert.alert('Submission Error', 'Failed to publish announcement. Please try again.');
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
            <View>
              <Text style={styles.title}>Post Official Notice</Text>
              <Text style={styles.subtitle}>{mosqueName}</Text>
            </View>
            <TouchableOpacity style={styles.closeBtn} onPress={onClose}>
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView contentContainerStyle={styles.scrollContent}>
            {/* Category Selector */}
            <Text style={styles.inputLabel}>Category / বিজ্ঞপ্তির ধরণ</Text>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isActive = category === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setCategory(cat.key)}
                  >
                    <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>

            {/* Title Input */}
            <Text style={styles.inputLabel}>Notice Title / শিরোনাম *</Text>
            <TextInput
              style={styles.textInput}
              placeholder="e.g. জানাজার নামাজের সময়সূচী / Jumu'ah Khutbah"
              placeholderTextColor="#9ca3af"
              value={title}
              onChangeText={setTitle}
              maxLength={160}
            />

            {/* Content Input */}
            <Text style={styles.inputLabel}>Announcement Details / বিস্তারিত বিবরণ *</Text>
            <TextInput
              style={[styles.textInput, styles.textArea]}
              placeholder="Write full details, timings, and contact persons..."
              placeholderTextColor="#9ca3af"
              value={content}
              onChangeText={setContent}
              multiline
              numberOfLines={5}
              maxLength={4000}
            />

            {/* Pinned Switch */}
            <View style={styles.switchRow}>
              <View style={styles.switchTextGroup}>
                <Text style={styles.switchLabel}>📌 Pin to Top / উপরে পিন করুন</Text>
                <Text style={styles.switchDesc}>Keep this notice pinned at top of mosque page</Text>
              </View>
              <Switch
                value={isPinned}
                onValueChange={setIsPinned}
                trackColor={{ false: '#e8e8ea', true: '#a7f3d0' }}
                thumbColor={isPinned ? '#059669' : '#f4f4f5'}
              />
            </View>

            {/* Submit Button */}
            <TouchableOpacity
              style={[styles.submitBtn, isSubmitting && styles.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={isSubmitting}
            >
              {isSubmitting ? (
                <ActivityIndicator color="#ffffff" size="small" />
              ) : (
                <Text style={styles.submitBtnText}>Publish Notice / প্রকাশ করুন</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fafafa',
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.md,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ea',
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: ferioColors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: '#059669',
    fontWeight: '600',
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: ferioRadius.full,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6e6e73',
  },
  scrollContent: {
    padding: ferioSpacing.md,
  },
  inputLabel: {
    fontSize: 12,
    fontWeight: '700',
    color: '#374151',
    marginTop: 10,
    marginBottom: 6,
  },
  categoryScroll: {
    marginBottom: 8,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    marginRight: 6,
  },
  catPillActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  textInput: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.md,
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontSize: 14,
    color: ferioColors.primary,
  },
  textArea: {
    minHeight: 90,
    textAlignVertical: 'top',
  },
  switchRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 16,
    padding: 12,
    backgroundColor: '#ffffff',
    borderRadius: ferioRadius.md,
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  switchTextGroup: {
    flex: 1,
    marginRight: 10,
  },
  switchLabel: {
    fontSize: 13,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  switchDesc: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 2,
  },
  submitBtn: {
    backgroundColor: '#111114',
    borderRadius: ferioRadius.md,
    paddingVertical: 12,
    alignItems: 'center',
    marginTop: 6,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitBtnText: {
    color: '#ffffff',
    fontWeight: '700',
    fontSize: 14,
  },
});
