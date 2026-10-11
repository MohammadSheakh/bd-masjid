/**
 * Ferio Push Settings Modal (ADR-055)
 * - Master Push Notification toggle with instant hardware sync
 * - Active Registered Device Card with hardware platform badge
 * - Granular alert categories (Janazah, Timetable shifts, Announcements)
 */

import React, { useState, useEffect } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Switch,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { PushDeviceService } from '../services/pushDeviceService';
import { UserDevice } from '../types/device';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface PushSettingsModalProps {
  visible: boolean;
  onClose: () => void;
  isBangla?: boolean;
}

export const PushSettingsModal: React.FC<PushSettingsModalProps> = ({
  visible,
  onClose,
  isBangla = false,
}) => {
  const [isEnabled, setIsEnabled] = useState<boolean>(() =>
    PushDeviceService.isPushEnabledSync()
  );
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [device, setDevice] = useState<UserDevice | null>(() =>
    PushDeviceService.getRegisteredDeviceSync()
  );

  const fingerprint = PushDeviceService.getDeviceFingerprint();

  useEffect(() => {
    if (visible) {
      setIsEnabled(PushDeviceService.isPushEnabledSync());
      setDevice(PushDeviceService.getRegisteredDeviceSync());
    }
  }, [visible]);

  const handleToggleMaster = async (val: boolean) => {
    setIsEnabled(val);
    PushDeviceService.setPushEnabled(val);
    if (val) {
      setIsSyncing(true);
      try {
        const synced = await PushDeviceService.syncDeviceRegistration();
        setDevice(synced);
      } finally {
        setIsSyncing(false);
      }
    }
  };

  const handleManualSync = async () => {
    setIsSyncing(true);
    try {
      const synced = await PushDeviceService.syncDeviceRegistration();
      setDevice(synced);
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      transparent
      onRequestClose={onClose}
    >
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>
                {isBangla ? 'পুশ নোটিফিকেশন সেটিংস' : 'Push Notification Alerts'}
              </Text>
              <Text style={styles.subtitle}>
                {isBangla ? 'মসজিদের জরুরি নোটিশ ব্যাকগ্রাউন্ডে পান' : 'Background broadcast delivery for followed mosques'}
              </Text>
            </View>
            <Pressable
              onPress={onClose}
              style={styles.closeButton}
              hitSlop={12}
              accessibilityLabel="Close push settings"
            >
              <Text style={styles.closeIcon}>✕</Text>
            </Pressable>
          </View>

          <ScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={styles.content}
          >
            {/* Master Toggle Card */}
            <View style={styles.masterCard}>
              <View style={styles.masterTextCol}>
                <Text style={styles.masterTitle}>
                  {isBangla ? 'রিমোট পুশ নোটিফিকেশন' : 'Remote Push Alerts'}
                </Text>
                <Text style={styles.masterDesc}>
                  {isBangla
                    ? 'অ্যাপ বন্ধ থাকলেও জানাজা ও জামাতের জরুরি নোটিশ পান'
                    : 'Receive broadcast alerts when app is backgrounded or device is sleeping'}
                </Text>
              </View>
              <Switch
                value={isEnabled}
                onValueChange={handleToggleMaster}
                trackColor={{ false: ferioColors.border, true: ferioColors.primary }}
                thumbColor={ferioColors.surface}
              />
            </View>

            {/* Active Device Registration Card */}
            <View style={styles.deviceCard}>
              <View style={styles.deviceHeader}>
                <Text style={styles.deviceIcon}>
                  {fingerprint.deviceType === 'ios' ? '🍏' : '🤖'}
                </Text>
                <View style={styles.deviceMeta}>
                  <Text style={styles.deviceName}>{fingerprint.deviceName}</Text>
                  <Text style={styles.deviceOs}>
                    {fingerprint.deviceOsVersion} • BD Masjid v{fingerprint.appVersion}
                  </Text>
                </View>
                <View
                  style={[
                    styles.syncBadge,
                    isEnabled ? styles.syncBadgeActive : styles.syncBadgeInactive,
                  ]}
                >
                  <Text
                    style={[
                      styles.syncBadgeText,
                      isEnabled ? styles.syncBadgeTextActive : styles.syncBadgeTextInactive,
                    ]}
                  >
                    {isEnabled
                      ? isBangla ? '✓ সক্রিয় সিঙ্ক' : '✓ Live Sync'
                      : isBangla ? '○ নিষ্ক্রিয়' : '○ Disabled'}
                  </Text>
                </View>
              </View>
            </View>

            {/* Event Category Preferences */}
            <Text style={styles.sectionHeader}>
              {isBangla ? 'বিজ্ঞপ্তির বিভাগসমূহ' : 'Alert Categories'}
            </Text>

            <View style={styles.categoryList}>
              <View style={styles.categoryRow}>
                <Text style={styles.categoryEmoji}>⚰️</Text>
                <View style={styles.categoryTextCol}>
                  <Text style={styles.categoryName}>
                    {isBangla ? 'জরুরি জানাজার নোটিশ' : 'Namaz-e-Janazah Notices'}
                  </Text>
                  <Text style={styles.categorySub}>
                    {isBangla ? 'সময় ও স্থান সহ অবিলম্বে অ্যালার্ট' : 'Instant broadcast with time and cemetery venue'}
                  </Text>
                </View>
                <Text style={styles.activeCheck}>✓</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryEmoji}>⏱️</Text>
                <View style={styles.categoryTextCol}>
                  <Text style={styles.categoryName}>
                    {isBangla ? 'নামাজের সময় পরিবর্তন' : 'Jammat Timetable Shifts'}
                  </Text>
                  <Text style={styles.categorySub}>
                    {isBangla ? 'ঋতু পরিবর্তন বা আবহাওয়া সংক্রান্ত সমন্বয়' : 'Seasonal twilight changes and weather updates'}
                  </Text>
                </View>
                <Text style={styles.activeCheck}>✓</Text>
              </View>

              <View style={styles.categoryRow}>
                <Text style={styles.categoryEmoji}>📢</Text>
                <View style={styles.categoryTextCol}>
                  <Text style={styles.categoryName}>
                    {isBangla ? 'জুমুআ ও বিশেষ নোটিশ' : "Jumu'ah & Eid Announcements"}
                  </Text>
                  <Text style={styles.categorySub}>
                    {isBangla ? 'খুতবার বিষয়বস্তু এবং ঈদের জামাত তালিকা' : 'Khutbah topics and special holiday notices'}
                  </Text>
                </View>
                <Text style={styles.activeCheck}>✓</Text>
              </View>
            </View>

            {/* Sync Now Button */}
            <Pressable
              onPress={handleManualSync}
              disabled={isSyncing || !isEnabled}
              style={[
                styles.syncButton,
                (!isEnabled || isSyncing) && styles.syncButtonDisabled,
              ]}
            >
              {isSyncing ? (
                <ActivityIndicator size="small" color={ferioColors.primaryForeground} />
              ) : (
                <Text style={styles.syncButtonText}>
                  {isBangla ? 'ডিভাইস টোকেন সিঙ্ক করুন' : 'Sync Device Push Token'}
                </Text>
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
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.surface,
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '85%',
    paddingBottom: ferioSpacing.xxl,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.lg,
    paddingBottom: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  closeButton: {
    width: 32,
    height: 32,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.mutedBackground,
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeIcon: {
    fontSize: 14,
    color: ferioColors.muted,
    fontWeight: '700',
  },
  content: {
    padding: ferioSpacing.lg,
    gap: ferioSpacing.lg,
  },
  masterCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  masterTextCol: {
    flex: 1,
    marginRight: ferioSpacing.md,
  },
  masterTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 2,
  },
  masterDesc: {
    fontSize: 12,
    lineHeight: 16,
    color: ferioColors.muted,
  },
  deviceCard: {
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  deviceHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.sm,
  },
  deviceIcon: {
    fontSize: 24,
  },
  deviceMeta: {
    flex: 1,
  },
  deviceName: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  deviceOs: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  syncBadge: {
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
  },
  syncBadgeActive: {
    backgroundColor: ferioColors.accentMuted,
    borderColor: ferioColors.accent,
  },
  syncBadgeInactive: {
    backgroundColor: ferioColors.mutedBackground,
    borderColor: ferioColors.border,
  },
  syncBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  syncBadgeTextActive: {
    color: ferioColors.accent,
  },
  syncBadgeTextInactive: {
    color: ferioColors.muted,
  },
  sectionHeader: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  categoryList: {
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
    gap: ferioSpacing.sm,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryTextCol: {
    flex: 1,
  },
  categoryName: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  categorySub: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 2,
  },
  activeCheck: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.accent,
  },
  syncButton: {
    backgroundColor: ferioColors.primary,
    borderRadius: ferioRadius.full,
    paddingVertical: ferioSpacing.md,
    alignItems: 'center',
  },
  syncButtonDisabled: {
    opacity: 0.5,
  },
  syncButtonText: {
    fontSize: 13,
    fontWeight: '700',
    color: ferioColors.primaryForeground,
  },
});
