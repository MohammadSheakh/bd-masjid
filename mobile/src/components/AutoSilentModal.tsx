import React, { useState } from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  Switch,
  ScrollView,
} from 'react-native';
import { PrayerAutoSilentSettings } from '../types/mosque';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';
import { PreferencesStorage } from '../lib/storage';
import { OemBatteryWizardModal } from './OemBatteryWizardModal';

interface AutoSilentModalProps {
  visible: boolean;
  onClose: () => void;
  settings: PrayerAutoSilentSettings;
  onUpdateSettings: (updated: Partial<PrayerAutoSilentSettings>) => void;
  onRequestDndPermission?: () => void;
}

const DURATIONS = [5, 10, 15, 20];

export const AutoSilentModal: React.FC<AutoSilentModalProps> = ({
  visible,
  onClose,
  settings,
  onUpdateSettings,
  onRequestDndPermission,
}) => {
  const [showOemWizard, setShowOemWizard] = useState(false);

  const togglePrayer = (waqt: keyof PrayerAutoSilentSettings['enabledPrayers']) => {
    onUpdateSettings({
      enabledPrayers: {
        ...settings.enabledPrayers,
        [waqt]: !settings.enabledPrayers[waqt],
      },
    });
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Prayer Auto-Silent</Text>
              <Text style={styles.subtitle}>Automatic DND & prior-state restoration</Text>
            </View>
            <Pressable onPress={onClose} style={styles.closeButton}>
              <Text style={styles.closeButtonText}>Done</Text>
            </Pressable>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollBody}>
            {/* Master Toggle */}
            <View style={styles.rowCard}>
              <View style={styles.labelCol}>
                <Text style={styles.cardTitle}>Enable Auto-Silent</Text>
                <Text style={styles.cardDesc}>Silences phone at Jammat start</Text>
              </View>
              <Switch
                value={settings.isEnabled}
                onValueChange={(val) => {
                  onUpdateSettings({ isEnabled: val });
                  if (val && !PreferencesStorage.isOemWizardDismissed()) {
                    setShowOemWizard(true);
                  }
                }}
                trackColor={{ false: ferioColors.border, true: ferioColors.primary }}
                thumbColor={ferioColors.surface}
              />
            </View>

            {/* DND Permission Notice on Android */}
            {!settings.hasDndPermission && (
              <View style={styles.permissionCard}>
                <Text style={styles.permTitle}>Do Not Disturb Permission Required</Text>
                <Text style={styles.permDesc}>
                  Android requires permission to silence the phone during prayers.
                </Text>
                <Pressable
                  onPress={onRequestDndPermission}
                  style={({ pressed }) => [styles.permActionPill, pressed && styles.pressed]}
                >
                  <Text style={styles.permActionText}>Grant DND Access</Text>
                </Pressable>
              </View>
            )}

            {/* Duration Selector */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Silent Duration</Text>
              <View style={styles.durationPillRow}>
                {DURATIONS.map((dur) => {
                  const isSelected = settings.durationMinutes === dur;
                  return (
                    <Pressable
                      key={dur}
                      onPress={() => onUpdateSettings({ durationMinutes: dur })}
                      style={[styles.durationPill, isSelected && styles.durationPillSelected]}
                    >
                      <Text
                        style={[
                          styles.durationPillText,
                          isSelected && styles.durationPillTextSelected,
                        ]}
                      >
                        {dur} min
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Per-Waqt Automation */}
            <View style={styles.section}>
              <Text style={styles.sectionHeader}>Enabled Prayers</Text>
              <View style={styles.waqtGrid}>
                {(['fajr', 'zuhr', 'asr', 'maghrib', 'isha', 'jumuah'] as const).map((w) => {
                  const active = settings.enabledPrayers[w];
                  return (
                    <Pressable
                      key={w}
                      onPress={() => togglePrayer(w)}
                      style={[styles.waqtChip, active && styles.waqtChipActive]}
                    >
                      <Text style={[styles.waqtChipText, active && styles.waqtChipTextActive]}>
                        {w.charAt(0).toUpperCase() + w.slice(1)}
                      </Text>
                    </Pressable>
                  );
                })}
              </View>
            </View>

            {/* Safety Guarantee Invariant */}
            <View style={styles.safetyCard}>
              <Text style={styles.safetyTitle}>Prior-State Guarantee</Text>
              <Text style={styles.safetyDesc}>
                If your phone is already on Silent or Vibrate before Jammat, it will NEVER be forced into Ringing mode. It safely restores to your initial sound state.
              </Text>
            </View>

            {/* OEM Battery Killer Optimization Guide */}
            <Pressable
              onPress={() => setShowOemWizard(true)}
              style={styles.oemGuideCard}
              accessibilityRole="button"
              accessibilityLabel="OEM battery optimization settings"
            >
              <View style={styles.oemGuideLeft}>
                <Text style={styles.oemGuideTitle}>⚡ Background Battery Protection</Text>
                <Text style={styles.oemGuideDesc}>
                  Configure Xiaomi/Samsung/Realme to avoid dropping alarms
                </Text>
              </View>
              <Text style={styles.oemGuideArrow}>→</Text>
            </Pressable>
          </ScrollView>
        </View>

        <OemBatteryWizardModal
          visible={showOemWizard}
          onClose={() => setShowOemWizard(false)}
        />
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.surface,
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.md,
    maxHeight: '85%',
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: ferioColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: ferioSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
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
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    backgroundColor: ferioColors.mutedBackground,
    borderRadius: ferioRadius.full,
  },
  closeButtonText: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  scrollBody: {
    paddingVertical: ferioSpacing.md,
  },
  rowCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginBottom: ferioSpacing.md,
  },
  labelCol: {
    flex: 1,
    marginRight: ferioSpacing.md,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  cardDesc: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  permissionCard: {
    backgroundColor: '#fffbeb',
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: '#fef3c7',
    marginBottom: ferioSpacing.md,
  },
  permTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 4,
  },
  permDesc: {
    fontSize: 12,
    color: '#78350f',
    marginBottom: ferioSpacing.sm,
  },
  permActionPill: {
    backgroundColor: '#92400e',
    paddingVertical: ferioSpacing.xs,
    paddingHorizontal: ferioSpacing.md,
    borderRadius: ferioRadius.full,
    alignSelf: 'flex-start',
  },
  permActionText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  section: {
    marginBottom: ferioSpacing.lg,
  },
  sectionHeader: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.muted,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: ferioSpacing.sm,
  },
  durationPillRow: {
    flexDirection: 'row',
    gap: ferioSpacing.sm,
  },
  durationPill: {
    flex: 1,
    paddingVertical: ferioSpacing.sm,
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.full,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  durationPillSelected: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  durationPillText: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  durationPillTextSelected: {
    color: ferioColors.primaryForeground,
  },
  waqtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ferioSpacing.sm,
  },
  waqtChip: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  waqtChipActive: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  waqtChipText: {
    fontSize: 13,
    fontWeight: '500',
    color: ferioColors.muted,
  },
  waqtChipTextActive: {
    color: ferioColors.accent,
    fontWeight: '600',
  },
  safetyCard: {
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginBottom: ferioSpacing.xxl,
  },
  safetyTitle: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
    marginBottom: 2,
  },
  safetyDesc: {
    fontSize: 12,
    color: ferioColors.muted,
    lineHeight: 16,
  },
  oemGuideCard: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.xxl,
  },
  oemGuideLeft: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  oemGuideTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#92400e',
    marginBottom: 2,
  },
  oemGuideDesc: {
    fontSize: 12,
    color: '#b45309',
    lineHeight: 16,
  },
  oemGuideArrow: {
    fontSize: 18,
    fontWeight: '700',
    color: '#92400e',
  },
  pressed: {
    opacity: 0.75,
  },
});
