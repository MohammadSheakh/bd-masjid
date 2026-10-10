import React from 'react';
import {
  Modal,
  StyleSheet,
  Text,
  View,
  Pressable,
  ScrollView,
} from 'react-native';
import {
  detectDeviceBrand,
  getOemGuidance,
  openOemBatterySettings,
} from '../services/oemBatteryService';
import { PreferencesStorage } from '../lib/storage';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface OemBatteryWizardModalProps {
  visible: boolean;
  onClose: () => void;
}

export const OemBatteryWizardModal: React.FC<OemBatteryWizardModalProps> = ({
  visible,
  onClose,
}) => {
  const brand = detectDeviceBrand();
  const guidance = getOemGuidance(brand);

  const handleDismiss = () => {
    PreferencesStorage.setOemWizardDismissed();
    onClose();
  };

  const handleOpenSettings = async () => {
    PreferencesStorage.setOemWizardDismissed();
    await openOemBatterySettings();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="fade" transparent onRequestClose={handleDismiss}>
      <View style={styles.backdrop}>
        <View style={styles.container}>
          {/* Header */}
          <View style={styles.header}>
            <View style={styles.brandBadge}>
              <Text style={styles.brandBadgeText}>{guidance.osSkin}</Text>
            </View>
            <Text style={styles.title}>Battery Optimization Alert</Text>
            <Text style={styles.subtitle}>{guidance.displayName}</Text>
          </View>

          <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.body}>
            <View style={styles.warningCard}>
              <Text style={styles.warningTitle}>Why this is necessary:</Text>
              <Text style={styles.warningBody}>{guidance.warningNote}</Text>
            </View>

            <Text style={styles.stepsHeading}>Required Steps:</Text>
            <View style={styles.stepsList}>
              {guidance.steps.map((step, idx) => (
                <View key={step} style={styles.stepRow}>
                  <View style={styles.stepNumberBadge}>
                    <Text style={styles.stepNumberText}>{idx + 1}</Text>
                  </View>
                  <Text style={styles.stepText}>{step}</Text>
                </View>
              ))}
            </View>
          </ScrollView>

          {/* Footer Actions */}
          <View style={styles.footer}>
            <Pressable
              onPress={handleOpenSettings}
              style={styles.primaryBtn}
              accessibilityRole="button"
              accessibilityLabel={guidance.actionLabel}
            >
              <Text style={styles.primaryBtnText}>{guidance.actionLabel}</Text>
            </Pressable>

            <Pressable
              onPress={handleDismiss}
              style={styles.secondaryBtn}
              accessibilityRole="button"
              accessibilityLabel="Dismiss optimization guide"
            >
              <Text style={styles.secondaryBtnText}>I've already configured this</Text>
            </Pressable>
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
    padding: ferioSpacing.lg,
  },
  container: {
    width: '100%',
    maxHeight: '82%',
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.lg,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  header: {
    alignItems: 'center',
    marginBottom: ferioSpacing.md,
  },
  brandBadge: {
    backgroundColor: '#fef3c7',
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: '#fde68a',
    marginBottom: ferioSpacing.xs,
  },
  brandBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#92400e',
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ferioColors.primary,
    letterSpacing: -0.3,
  },
  subtitle: {
    fontSize: 13,
    color: ferioColors.muted,
    marginTop: 2,
  },
  body: {
    paddingVertical: ferioSpacing.xs,
  },
  warningCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.md,
  },
  warningTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 4,
  },
  warningBody: {
    fontSize: 12,
    lineHeight: 18,
    color: ferioColors.muted,
  },
  stepsHeading: {
    fontSize: 13,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: ferioSpacing.sm,
  },
  stepsList: {
    gap: ferioSpacing.sm,
    marginBottom: ferioSpacing.md,
  },
  stepRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: ferioSpacing.sm,
  },
  stepNumberBadge: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: ferioColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    marginTop: 1,
  },
  stepNumberText: {
    color: ferioColors.surface,
    fontSize: 11,
    fontWeight: '700',
  },
  stepText: {
    flex: 1,
    fontSize: 13,
    lineHeight: 18,
    color: ferioColors.primary,
    fontWeight: '500',
  },
  footer: {
    marginTop: ferioSpacing.sm,
    gap: ferioSpacing.xs,
  },
  primaryBtn: {
    backgroundColor: ferioColors.primary,
    paddingVertical: 12,
    borderRadius: ferioRadius.full,
    alignItems: 'center',
  },
  primaryBtnText: {
    color: ferioColors.surface,
    fontSize: 13,
    fontWeight: '700',
  },
  secondaryBtn: {
    paddingVertical: 10,
    alignItems: 'center',
  },
  secondaryBtnText: {
    color: ferioColors.muted,
    fontSize: 12,
    fontWeight: '600',
  },
});
