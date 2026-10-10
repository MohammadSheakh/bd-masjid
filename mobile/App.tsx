import React, { useState } from 'react';
import { StatusBar } from 'expo-status-bar';
import {
  SafeAreaView,
  StyleSheet,
  Text,
  View,
  ScrollView,
  Pressable,
} from 'react-native';
import { PrayerSchedule, PrayerAutoSilentSettings } from './src/types/mosque';
import { PrayerCountdownBanner } from './src/components/PrayerCountdownBanner';
import { AutoSilentModal } from './src/components/AutoSilentModal';
import { ferioColors, ferioRadius, ferioSpacing } from './src/theme/tokens';

const DEMO_SCHEDULE: PrayerSchedule = {
  fajrJamaat: '05:15',
  zuhrJamaat: '13:30',
  asrJamaat: '16:45',
  maghribJamaat: '18:15',
  ishaJamaat: '20:00',
  jumuahJamaat: '13:30',
};

const FILTER_TAGS = ['All Mosques', 'Women Area', 'Air Conditioned', 'Parking Space', 'Following'];

export default function App() {
  const [selectedTag, setSelectedTag] = useState('All Mosques');
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [autoSilentSettings, setAutoSilentSettings] = useState<PrayerAutoSilentSettings>({
    isEnabled: true,
    durationMinutes: 10,
    leadOffsetMinutes: 0,
    enabledPrayers: {
      fajr: true,
      zuhr: true,
      asr: true,
      maghrib: true,
      isha: true,
      jumuah: true,
    },
    hasDndPermission: true,
    activeSilenceExpiry: null,
  });

  return (
    <SafeAreaView style={styles.safeArea}>
      <StatusBar style="dark" />

      {/* Ferio Top Navigation Bar */}
      <View style={styles.topNavbar}>
        <View>
          <Text style={styles.brandTitle}>BD Masjid</Text>
          <Text style={styles.brandSubtitle}>National Mosque Platform</Text>
        </View>

        <Pressable
          onPress={() => setIsModalOpen(true)}
          style={({ pressed }) => [styles.silentToggleBtn, pressed && styles.pressed]}
          accessibilityRole="button"
          accessibilityLabel="Auto-Silent Settings"
        >
          <Text style={styles.silentToggleText}>
            {autoSilentSettings.isEnabled ? '🔕 Auto-Silent' : '🔔 Silent Off'}
          </Text>
        </Pressable>
      </View>

      <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={styles.scrollContent}>
        {/* Live Jammat Countdown Banner */}
        <PrayerCountdownBanner
          schedule={DEMO_SCHEDULE}
          autoSilentSettings={autoSilentSettings}
          onPressAutoSilentSettings={() => setIsModalOpen(true)}
        />

        {/* Filter Chips Horizontal Bar */}
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.filterChipRow}
        >
          {FILTER_TAGS.map((tag) => {
            const active = selectedTag === tag;
            return (
              <Pressable
                key={tag}
                onPress={() => setSelectedTag(tag)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{tag}</Text>
              </Pressable>
            );
          })}
        </ScrollView>

        {/* Status Callout */}
        <View style={styles.infoCard}>
          <Text style={styles.infoTitle}>Baitul Mukarram National Mosque</Text>
          <Text style={styles.infoSubtitle}>Topkhana Road, Motijheel, Dhaka • 450m</Text>

          <View style={styles.timetableGrid}>
            {[
              { name: 'Fajr', time: '05:15 AM' },
              { name: 'Zuhr', time: '01:30 PM' },
              { name: 'Asr', time: '04:45 PM' },
              { name: 'Maghrib', time: '06:15 PM' },
              { name: 'Isha', time: '08:00 PM' },
            ].map((p) => (
              <View key={p.name} style={styles.timetableCell}>
                <Text style={styles.waqtName}>{p.name}</Text>
                <Text style={styles.waqtTime}>{p.time}</Text>
              </View>
            ))}
          </View>
        </View>
      </ScrollView>

      {/* Auto-Silent DND Configuration Modal */}
      <AutoSilentModal
        visible={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        settings={autoSilentSettings}
        onUpdateSettings={(updated) =>
          setAutoSilentSettings((prev) => ({ ...prev, ...updated }))
        }
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: ferioColors.canvas,
  },
  topNavbar: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.sm,
    backgroundColor: ferioColors.canvas,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  brandTitle: {
    fontSize: 20,
    fontWeight: '700',
    color: ferioColors.primary,
    letterSpacing: -0.3,
  },
  brandSubtitle: {
    fontSize: 11,
    fontWeight: '500',
    color: ferioColors.muted,
  },
  silentToggleBtn: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  silentToggleText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  scrollContent: {
    paddingBottom: ferioSpacing.xxl,
  },
  filterChipRow: {
    paddingHorizontal: ferioSpacing.lg,
    paddingVertical: ferioSpacing.md,
    gap: ferioSpacing.sm,
  },
  chip: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  chipActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  chipText: {
    fontSize: 12,
    fontWeight: '500',
    color: ferioColors.muted,
  },
  chipTextActive: {
    color: ferioColors.primaryForeground,
    fontWeight: '600',
  },
  infoCard: {
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.lg,
    marginHorizontal: ferioSpacing.lg,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  infoTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  infoSubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
    marginBottom: ferioSpacing.md,
  },
  timetableGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.sm,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  timetableCell: {
    alignItems: 'center',
    flex: 1,
  },
  waqtName: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.muted,
    marginBottom: 2,
  },
  waqtTime: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.primary,
    fontVariant: ['tabular-nums'],
  },
  pressed: {
    opacity: 0.8,
  },
});
