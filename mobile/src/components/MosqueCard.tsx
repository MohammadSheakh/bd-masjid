import React from 'react';
import { StyleSheet, Text, View, Pressable } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Mosque } from '../types/mosque';
import { formatTo12Hour } from '../lib/time';
import { LocationRadarService } from '../services/locationRadarService';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface MosqueCardProps {
  mosque: Mosque;
  isSelected?: boolean;
  isFollowed?: boolean;
  isBookmarked?: boolean;
  onToggleFollow?: (mosqueId: string) => void;
  onToggleBookmark?: (mosqueId: string) => void;
  onPress?: (mosque: Mosque) => void;
  onSelect?: (mosque: Mosque) => void;
}

export const MosqueCard: React.FC<MosqueCardProps> = ({
  mosque,
  isSelected = false,
  isFollowed,
  isBookmarked,
  onToggleFollow,
  onToggleBookmark,
  onPress,
  onSelect,
}) => {
  const schedule = mosque.prayerSchedule;
  const isMarked = isBookmarked ?? isFollowed ?? false;
  const handleToggle = onToggleBookmark ?? onToggleFollow;
  const handleSelect = onSelect ?? onPress;

  // Format distance matching web logic
  const formatDistance = (meters?: number) => {
    if (meters === undefined || meters === null) return null;
    if (meters < 1000) return `${Math.round(meters)} m`;
    return `${(meters / 1000).toFixed(1)} km`;
  };

  const proximity = LocationRadarService.getDistanceToMosqueSync(mosque);
  const distanceText =
    mosque.distanceMeters !== undefined
      ? formatDistance(mosque.distanceMeters)
      : proximity.formattedEnglish;

  // Dynamic freshness badge matching web config
  const freshness = mosque.freshness || { level: 'FRESH', daysAgo: 0 };
  const freshnessConfig = {
    FRESH: {
      label: 'Verified Timetable',
      bg: '#ecfdf5',
      text: '#047857',
      border: '#a7f3d0',
    },
    STALE: {
      label: `${freshness.daysAgo}d ago (Review needed)`,
      bg: '#fffbeb',
      text: '#b45309',
      border: '#fde68a',
    },
    VERY_STALE: {
      label: 'Needs update',
      bg: '#fff1f2',
      text: '#be123c',
      border: '#fecdd3',
    },
  }[freshness.level || 'FRESH'];

  const prayers = [
    { name: 'Fajr', time: formatTo12Hour(schedule?.fajrJamaat) },
    { name: 'Zuhr', time: formatTo12Hour(schedule?.zuhrJamaat) },
    { name: 'Asr', time: formatTo12Hour(schedule?.asrJamaat) },
    { name: 'Maghrib', time: formatTo12Hour(schedule?.maghribJamaat) },
    { name: 'Isha', time: formatTo12Hour(schedule?.ishaJamaat) },
  ];

  return (
    <Pressable
      onPress={() => handleSelect?.(mosque)}
      style={({ pressed }) => [
        styles.card,
        isSelected && styles.cardSelected,
        pressed && styles.cardPressed,
      ]}
      accessibilityLabel={`Mosque ${mosque.name}`}
    >
      {/* Top Header: Name, Distance & Bookmark */}
      <View style={styles.topRow}>
        <View style={styles.nameBlock}>
          <View style={styles.titleRow}>
            <Text style={styles.mosqueName} numberOfLines={1}>
              {mosque.name}
            </Text>
            {mosque.isListed === false && (
              <View style={styles.unlistedBadge}>
                <Text style={styles.unlistedText}>Unlisted</Text>
              </View>
            )}
          </View>
          <View style={styles.addressRow}>
            <Feather name="map-pin" size={11} color="#9ca3af" style={styles.pinIcon} />
            <Text style={styles.addressText} numberOfLines={1}>
              {mosque.address || `${mosque.city || 'Bangladesh'}`}
            </Text>
          </View>
        </View>

        <View style={styles.headerActions}>
          {distanceText ? (
            <View style={styles.distanceBadge}>
              <Text style={styles.distanceText}>{distanceText}</Text>
            </View>
          ) : null}

          {handleToggle && (
            <Pressable
              onPress={(e) => {
                e.stopPropagation();
                handleToggle(mosque.id);
              }}
              style={({ pressed }) => [
                styles.bookmarkBtn,
                isMarked && styles.bookmarkBtnActive,
                pressed && styles.bookmarkBtnPressed,
              ]}
              accessibilityRole="button"
              accessibilityLabel={isMarked ? 'Unfollow mosque' : 'Follow mosque'}
            >
              <Feather
                name="bookmark"
                size={15}
                color={isMarked ? '#047857' : '#9ca3af'}
              />
            </Pressable>
          )}
        </View>
      </View>

      {/* Freshness Badge, Ramadan notice & Attendees */}
      <View style={styles.metaRow}>
        <View style={styles.metaLeft}>
          <View
            style={[
              styles.freshnessBadge,
              { backgroundColor: freshnessConfig.bg, borderColor: freshnessConfig.border },
            ]}
          >
            <Feather name="clock" size={11} color={freshnessConfig.text} />
            <Text style={[styles.freshnessText, { color: freshnessConfig.text }]}>
              {freshnessConfig.label}
            </Text>
          </View>

          {schedule?.taraweehJamaat ? (
            <View style={styles.taraweehBadge}>
              <Feather name="moon" size={11} color="#047857" />
              <Text style={styles.taraweehText}>
                Taraweeh {formatTo12Hour(schedule.taraweehJamaat)}
              </Text>
            </View>
          ) : null}
        </View>

        {mosque.attendanceSummary ? (
          <View style={styles.attendanceRow}>
            <Feather name="users" size={11} color="#9ca3af" />
            <Text style={styles.attendanceText}>
              {mosque.attendanceSummary.regularCount} regular •{' '}
              {mosque.attendanceSummary.occasionalCount} occasional
            </Text>
          </View>
        ) : null}
      </View>

      {/* Prayer Jamaat Timetable Grid */}
      <View style={styles.scheduleGrid}>
        {prayers.map((p) => (
          <View key={p.name} style={styles.scheduleCell}>
            <Text style={styles.cellWaqt}>{p.name}</Text>
            <Text style={styles.cellTime}>{p.time}</Text>
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
    borderColor: '#e8e8ea',
  },
  cardSelected: {
    borderColor: '#111114',
    borderWidth: 1.5,
  },
  cardPressed: {
    opacity: 0.95,
    borderColor: '#a1a1aa',
  },
  topRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: ferioSpacing.sm,
    marginBottom: ferioSpacing.xs + 2,
  },
  nameBlock: {
    flex: 1,
    minWidth: 0,
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  mosqueName: {
    fontSize: 15,
    fontWeight: '700',
    color: '#111114',
    letterSpacing: -0.2,
  },
  unlistedBadge: {
    backgroundColor: '#fffbeb',
    borderWidth: 1,
    borderColor: '#fde68a',
    borderRadius: 4,
    paddingHorizontal: 5,
    paddingVertical: 1,
  },
  unlistedText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#92400e',
  },
  addressRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 2,
  },
  pinIcon: {
    marginRight: 3,
  },
  addressText: {
    fontSize: 12,
    color: '#6e6e73',
    flex: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexShrink: 0,
  },
  distanceBadge: {
    backgroundColor: '#f4f4f5',
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
  },
  distanceText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#111114',
  },
  bookmarkBtn: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  bookmarkBtnActive: {
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
  },
  bookmarkBtnPressed: {
    opacity: 0.75,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    flexWrap: 'wrap',
    gap: ferioSpacing.xs,
    marginBottom: ferioSpacing.sm,
  },
  metaLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    flexWrap: 'wrap',
  },
  freshnessBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
  },
  freshnessText: {
    fontSize: 10,
    fontWeight: '600',
  },
  taraweehBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: '#ecfdf5',
    borderWidth: 1,
    borderColor: '#a7f3d0',
    paddingHorizontal: 8,
    paddingVertical: 2.5,
    borderRadius: ferioRadius.full,
  },
  taraweehText: {
    fontSize: 10,
    fontWeight: '600',
    color: '#065f46',
  },
  attendanceRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  attendanceText: {
    fontSize: 10,
    color: '#6e6e73',
  },
  scheduleGrid: {
    flexDirection: 'row',
    gap: 6,
    paddingTop: ferioSpacing.xs + 2,
    borderTopWidth: 1,
    borderTopColor: '#f0f0f2',
  },
  scheduleCell: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: 6,
    paddingHorizontal: 2,
    borderRadius: ferioRadius.md,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#f0f0f2',
  },
  cellWaqt: {
    fontSize: 9,
    fontWeight: '600',
    color: '#6e6e73',
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginBottom: 2,
  },
  cellTime: {
    fontSize: 11,
    fontWeight: '700',
    color: '#111114',
    fontVariant: ['tabular-nums'],
  },
});

