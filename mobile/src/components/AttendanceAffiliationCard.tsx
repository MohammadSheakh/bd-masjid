import React, { useState } from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { AttendanceStatus, AttendanceSummary } from '../types/mosque';
import { ApiClient } from '../lib/apiClient';
import { PreferencesStorage } from '../lib/storage';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface AttendanceAffiliationCardProps {
  mosqueId: string;
  summary?: AttendanceSummary;
  onAttendanceChange?: (updatedSummary: AttendanceSummary) => void;
}

export const AttendanceAffiliationCard: React.FC<AttendanceAffiliationCardProps> = ({
  mosqueId,
  summary,
  onAttendanceChange,
}) => {
  // Read initial selection from synchronous storage or prop summary
  const storedStatus = PreferencesStorage.getUserAttendance(mosqueId);
  const [currentStatus, setCurrentStatus] = useState<AttendanceStatus>(
    storedStatus !== 'NONE' ? storedStatus : summary?.userStatus ?? 'NONE'
  );
  const [regularCount, setRegularCount] = useState<number>(summary?.regularCount ?? 0);
  const [occasionalCount, setOccasionalCount] = useState<number>(summary?.occasionalCount ?? 0);

  const handleSelect = async (selected: AttendanceStatus) => {
    // If clicking the already selected status, toggle it off to NONE
    const nextStatus: AttendanceStatus = currentStatus === selected ? 'NONE' : selected;

    // Optimistic delta computation
    let nextReg = regularCount;
    let nextOcc = occasionalCount;

    if (currentStatus === 'REGULAR') nextReg = Math.max(0, nextReg - 1);
    if (currentStatus === 'OCCASIONAL') nextOcc = Math.max(0, nextOcc - 1);

    if (nextStatus === 'REGULAR') nextReg += 1;
    if (nextStatus === 'OCCASIONAL') nextOcc += 1;

    // Apply immediate local state update (< 1ms)
    setCurrentStatus(nextStatus);
    setRegularCount(nextReg);
    setOccasionalCount(nextOcc);

    const updatedSummary: AttendanceSummary = {
      regularCount: nextReg,
      occasionalCount: nextOcc,
      userStatus: nextStatus,
    };
    onAttendanceChange?.(updatedSummary);

    // Asynchronously dispatch to API (handles local storage persistence internally)
    try {
      await ApiClient.setAttendance(mosqueId, nextStatus);
    } catch {
      // Retain optimistic value; syncs on subsequent refresh
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.headerRow}>
        <View style={styles.titleColumn}>
          <Text style={styles.cardTitle}>Community Attendance</Text>
          <Text style={styles.microcopy}>Enduring affiliation, not a daily check-in</Text>
        </View>

        <View style={styles.metricsBadge}>
          <Text style={styles.metricsText}>
            {regularCount} regular • {occasionalCount} occasional
          </Text>
        </View>
      </View>

      <View style={styles.buttonRow}>
        <Pressable
          onPress={() => handleSelect('REGULAR')}
          style={({ pressed }) => [
            styles.affiliationPill,
            currentStatus === 'REGULAR' && styles.regularPillActive,
            pressed && styles.pillPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="I pray here regularly"
        >
          <Text
            style={[
              styles.pillText,
              currentStatus === 'REGULAR' && styles.regularPillTextActive,
            ]}
          >
            {currentStatus === 'REGULAR' ? '✓ Regular Attendee' : 'I pray here regularly'}
          </Text>
        </Pressable>

        <Pressable
          onPress={() => handleSelect('OCCASIONAL')}
          style={({ pressed }) => [
            styles.affiliationPill,
            currentStatus === 'OCCASIONAL' && styles.occasionalPillActive,
            pressed && styles.pillPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Occasional attendee"
        >
          <Text
            style={[
              styles.pillText,
              currentStatus === 'OCCASIONAL' && styles.occasionalPillTextActive,
            ]}
          >
            {currentStatus === 'OCCASIONAL' ? '✓ Occasional' : 'Occasional attendee'}
          </Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginBottom: ferioSpacing.md,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ferioSpacing.md,
  },
  titleColumn: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
    letterSpacing: -0.2,
  },
  microcopy: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  metricsBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 4,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  metricsText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.accent,
  },
  buttonRow: {
    flexDirection: 'row',
    gap: ferioSpacing.sm,
  },
  affiliationPill: {
    flex: 1,
    paddingVertical: 10,
    paddingHorizontal: ferioSpacing.sm,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 42,
  },
  pillPressed: {
    opacity: 0.85,
  },
  regularPillActive: {
    backgroundColor: ferioColors.accent,
    borderColor: ferioColors.accent,
  },
  occasionalPillActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  pillText: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  regularPillTextActive: {
    color: ferioColors.surface,
  },
  occasionalPillTextActive: {
    color: ferioColors.surface,
  },
});
