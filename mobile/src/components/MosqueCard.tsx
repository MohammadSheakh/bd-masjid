import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Mosque } from '../types/mosque';
import { formatTo12Hour } from '../lib/time';
import { LocationRadarService } from '../services/locationRadarService';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface MosqueCardProps {
  mosque: Mosque;
  isFollowed?: boolean;
  onToggleFollow?: (mosqueId: string) => void;
  onPress?: (mosque: Mosque) => void;
}

export const MosqueCard: React.FC<MosqueCardProps> = ({
  mosque,
  isFollowed = false,
  onToggleFollow,
  onPress,
}) => {
  const schedule = mosque.prayerSchedule;

  const prayers = [
    { name: 'Fajr', time: schedule?.fajrJamaat },
    { name: 'Zuhr', time: schedule?.zuhrJamaat },
    { name: 'Asr', time: schedule?.asrJamaat },
    { name: 'Maghr', time: schedule?.maghribJamaat },
    { name: 'Isha', time: schedule?.ishaJamaat },
  ];

  const proximity = LocationRadarService.getDistanceToMosqueSync(mosque);
  const distanceText = proximity.formattedEnglish;

  return (
    <Pressable
      onPress={() => onPress?.(mosque)}
      style={({ pressed }) => [styles.card, pressed && styles.cardPressed]}
      accessibilityRole="button"
      accessibilityLabel={`Mosque ${mosque.name}`}
    >
      {/* Top Header: Name, Distance, Follow Button */}
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <Text style={styles.mosqueName} numberOfLines={1}>
            {mosque.name}
          </Text>
          <Text style={styles.addressText} numberOfLines={1}>
            {mosque.address || `${mosque.city || 'Bangladesh'}`}
            {distanceText ? ` • ${distanceText}` : ''}
          </Text>
        </View>

        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            onToggleFollow?.(mosque.id);
          }}
          style={({ pressed }) => [
            styles.followBtn,
            isFollowed && styles.followBtnActive,
            pressed && styles.followBtnPressed,
          ]}
          accessibilityRole="button"
          accessibilityLabel={isFollowed ? 'Unfollow Mosque' : 'Follow Mosque'}
        >
          <Text style={[styles.followBtnText, isFollowed && styles.followBtnTextActive]}>
            {isFollowed ? 'Following' : '+ Follow'}
          </Text>
        </Pressable>
      </View>

      {/* Verified Status & Freshness Badge */}
      <View style={styles.metaRow}>
        <View style={[styles.proximityBadge, proximity.isWalkingDistance && styles.walkingBadge]}>
          <Text style={[styles.proximityText, proximity.isWalkingDistance && styles.walkingText]}>
            📍 {proximity.formattedEnglish}
          </Text>
        </View>
        <View style={styles.verifiedBadge}>
          <Text style={styles.verifiedText}>Verified Timetable</Text>
        </View>
        {mosque.attendanceSummary && (
          <View style={styles.attendanceBadge}>
            <Text style={styles.attendanceBadgeText}>
              👥 {mosque.attendanceSummary.regularCount} reg • {mosque.attendanceSummary.occasionalCount} occ
            </Text>
          </View>
        )}
        {mosque.hasAirConditioning && (
          <View style={styles.amenityBadge}>
            <Text style={styles.amenityText}>AC</Text>
          </View>
        )}
        {mosque.hasSeparateWomenSpace && (
          <View style={styles.amenityBadge}>
            <Text style={styles.amenityText}>Women Space</Text>
          </View>
        )}
        {mosque.hasParking && (
          <View style={styles.amenityBadge}>
            <Text style={styles.amenityText}>Parking</Text>
          </View>
        )}
      </View>

      {/* 5-Column Prayer Schedule Grid */}
      <View style={styles.scheduleGrid}>
        {prayers.map((p) => (
          <View key={p.name} style={styles.scheduleCell}>
            <Text style={styles.cellWaqt}>{p.name}</Text>
            <Text style={styles.cellTime}>{formatTo12Hour(p.time, '—')}</Text>
          </View>
        ))}
      </View>
    </Pressable>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: ferioColors.surface,
    borderRadius: ferioRadius.xl,
    padding: ferioSpacing.md,
    marginHorizontal: ferioSpacing.lg,
    marginVertical: ferioSpacing.xs,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  cardPressed: {
    opacity: 0.95,
    borderColor: '#d4d4d8',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: ferioSpacing.sm,
  },
  nameBlock: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  mosqueName: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
    letterSpacing: -0.2,
  },
  addressText: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  followBtn: {
    paddingHorizontal: ferioSpacing.sm + 2,
    paddingVertical: ferioSpacing.xs - 1,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  followBtnActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  followBtnPressed: {
    opacity: 0.75,
  },
  followBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  followBtnTextActive: {
    color: ferioColors.primaryForeground,
  },
  metaRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: ferioSpacing.xs,
    marginBottom: ferioSpacing.sm,
  },
  verifiedBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  verifiedText: {
    color: ferioColors.accent,
    fontSize: 10,
    fontWeight: '600',
  },
  proximityBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  walkingBadge: {
    backgroundColor: '#ecfdf5',
    borderColor: '#a7f3d0',
  },
  proximityText: {
    color: ferioColors.muted,
    fontSize: 10,
    fontWeight: '700',
  },
  walkingText: {
    color: '#059669',
  },
  attendanceBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  attendanceBadgeText: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  amenityBadge: {
    backgroundColor: ferioColors.canvas,
    paddingHorizontal: ferioSpacing.xs + 2,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  amenityText: {
    color: ferioColors.muted,
    fontSize: 10,
    fontWeight: '500',
  },
  scheduleGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    paddingVertical: ferioSpacing.xs + 2,
    paddingHorizontal: ferioSpacing.xs,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  scheduleCell: {
    flex: 1,
    alignItems: 'center',
  },
  cellWaqt: {
    fontSize: 10,
    fontWeight: '600',
    color: ferioColors.muted,
    marginBottom: 2,
    textTransform: 'uppercase',
  },
  cellTime: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.primary,
    fontVariant: ['tabular-nums'],
  },
});
