import React, { useEffect, useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { PrayerSchedule, PrayerAutoSilentSettings } from '../types/mosque';
import { getNextJamaatInfo, formatSecondsToCountdown, NextJamaatResult } from '../lib/time';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface PrayerCountdownBannerProps {
  schedule?: PrayerSchedule | null;
  autoSilentSettings?: PrayerAutoSilentSettings;
  onPressAutoSilentSettings?: () => void;
}

export const PrayerCountdownBanner: React.FC<PrayerCountdownBannerProps> = ({
  schedule,
  autoSilentSettings,
  onPressAutoSilentSettings,
}) => {
  const [nextInfo, setNextInfo] = useState<NextJamaatResult | null>(null);

  useEffect(() => {
    const update = () => {
      const duration = autoSilentSettings?.durationMinutes ?? 10;
      setNextInfo(getNextJamaatInfo(schedule, new Date(), duration));
    };

    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [schedule, autoSilentSettings?.durationMinutes]);

  if (!schedule || !nextInfo) {
    return (
      <View style={styles.container}>
        <Text style={styles.prayerLabel}>Daily Jammat Schedules</Text>
        <Text style={styles.fallbackSubtext}>Select or follow a mosque to track live Jammat times</Text>
      </View>
    );
  }

  const { prayerName, prayerTime12h, secondsRemaining, isInSilenceWindow, activeSilenceRemainingSeconds } = nextInfo;

  return (
    <View style={styles.container}>
      <View style={styles.headerRow}>
        <View style={styles.statusPill}>
          <View style={[styles.statusDot, isInSilenceWindow && styles.statusDotActive]} />
          <Text style={styles.statusPillText}>
            {isInSilenceWindow ? 'Jammat in Progress' : 'Next Jammat'}
          </Text>
        </View>

        {autoSilentSettings?.isEnabled && (
          <Pressable
            onPress={onPressAutoSilentSettings}
            style={({ pressed }) => [styles.silentBadge, pressed && styles.pressed]}
            accessibilityRole="button"
            accessibilityLabel="Configure Auto-Silent"
          >
            <Text style={styles.silentBadgeText}>
              {isInSilenceWindow ? '🔕 Auto-Silent Active' : '🔔 Auto-Silent Armed'}
            </Text>
          </Pressable>
        )}
      </View>

      <View style={styles.mainRow}>
        <View>
          <Text style={styles.prayerTitle}>
            {prayerName} <Text style={styles.prayerTime}>({prayerTime12h})</Text>
          </Text>
          <Text style={styles.countdownText}>
            {isInSilenceWindow
              ? `Un-muting in ${formatSecondsToCountdown(activeSilenceRemainingSeconds)}`
              : formatSecondsToCountdown(secondsRemaining)}
          </Text>
        </View>

        {!autoSilentSettings?.isEnabled && onPressAutoSilentSettings && (
          <Pressable
            onPress={onPressAutoSilentSettings}
            style={({ pressed }) => [styles.setupPill, pressed && styles.pressed]}
          >
            <Text style={styles.setupPillText}>Auto-Silent</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: ferioColors.primary,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.lg,
    marginHorizontal: ferioSpacing.lg,
    marginVertical: ferioSpacing.sm,
  },
  headerRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: ferioSpacing.sm,
  },
  statusPill: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
  },
  statusDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: ferioColors.muted,
    marginRight: 6,
  },
  statusDotActive: {
    backgroundColor: ferioColors.accent,
  },
  statusPillText: {
    color: ferioColors.primaryForeground,
    fontSize: 11,
    fontWeight: '600',
    letterSpacing: 0.3,
    textTransform: 'uppercase',
  },
  silentBadge: {
    backgroundColor: 'rgba(5, 150, 105, 0.18)',
    borderWidth: 1,
    borderColor: 'rgba(5, 150, 105, 0.35)',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
  },
  silentBadgeText: {
    color: '#34d399',
    fontSize: 11,
    fontWeight: '600',
  },
  mainRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  prayerTitle: {
    color: 'rgba(255, 255, 255, 0.75)',
    fontSize: 13,
    fontWeight: '500',
    marginBottom: 2,
  },
  prayerTime: {
    color: 'rgba(255, 255, 255, 0.95)',
    fontWeight: '600',
  },
  countdownText: {
    color: ferioColors.primaryForeground,
    fontSize: 24,
    fontWeight: '700',
    fontVariant: ['tabular-nums'],
    letterSpacing: -0.5,
  },
  setupPill: {
    backgroundColor: ferioColors.surface,
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
  },
  setupPillText: {
    color: ferioColors.primary,
    fontSize: 12,
    fontWeight: '600',
  },
  prayerLabel: {
    color: ferioColors.primaryForeground,
    fontSize: 15,
    fontWeight: '600',
    marginBottom: 4,
  },
  fallbackSubtext: {
    color: ferioColors.muted,
    fontSize: 12,
  },
  pressed: {
    opacity: 0.8,
  },
});
