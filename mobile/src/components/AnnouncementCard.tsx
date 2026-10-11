import React, { useState } from 'react';
import { View, Text, StyleSheet, Pressable, Share } from 'react-native';
import { MosqueAnnouncement, AnnouncementCategory } from '../types/announcement';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface AnnouncementCardProps {
  announcement: MosqueAnnouncement;
  onPressMosque?: (mosqueId: string) => void;
}

const CATEGORY_STYLES: Record<AnnouncementCategory, { label: string; bg: string; text: string; border: string }> = {
  EMERGENCY_ALERT: { label: '🚨 Emergency / জরুরি', bg: '#fef2f2', text: '#dc2626', border: '#fecaca' },
  JANAZA: { label: '⚰️ Janazah / জানাজা', bg: '#f3f4f6', text: '#374151', border: '#e5e7eb' },
  JUMUAH_KHUTBAH: { label: "🕌 Jumu'ah / জুমা", bg: '#ecfdf5', text: '#059669', border: '#a7f3d0' },
  RAMADAN: { label: '🌙 Ramadan / রমজান', bg: '#eff6ff', text: '#2563eb', border: '#bfdbfe' },
  EID: { label: '🎉 Eid / ঈদ', bg: '#faf5ff', text: '#7c3aed', border: '#e9d5ff' },
  MAINTENANCE: { label: '🔧 Maintenance / সংস্কার', bg: '#fffbeb', text: '#d97706', border: '#fde68a' },
  GENERAL: { label: '📢 Notice / বিজ্ঞপ্তি', bg: '#f4f4f5', text: '#52525b', border: '#e4e4e7' },
};

export const AnnouncementCard: React.FC<AnnouncementCardProps> = ({
  announcement,
  onPressMosque,
}) => {
  const [isExpanded, setIsExpanded] = useState(false);

  const styleConfig = CATEGORY_STYLES[announcement.category] || CATEGORY_STYLES.GENERAL;

  const handleShare = async () => {
    try {
      await Share.share({
        title: announcement.title,
        message: `${announcement.title}\n\n${announcement.content}\n\n— ${announcement.mosqueName || 'Mosque Announcement'} (BD Masjid)`,
      });
    } catch {}
  };

  const formattedDate = new Date(announcement.createdAt).toLocaleDateString('bn-BD', {
    day: 'numeric',
    month: 'short',
  });

  const shouldTruncate = announcement.content.length > 180;
  const displayedContent = shouldTruncate && !isExpanded
    ? `${announcement.content.slice(0, 180)}...`
    : announcement.content;

  return (
    <View style={[styles.card, announcement.isPinned && styles.pinnedCard]}>
      {/* Header Badges */}
      <View style={styles.headerRow}>
        <View style={styles.badgeGroup}>
          <View style={[styles.categoryBadge, { backgroundColor: styleConfig.bg, borderColor: styleConfig.border }]}>
            <Text style={[styles.categoryBadgeText, { color: styleConfig.text }]}>
              {styleConfig.label}
            </Text>
          </View>
          {announcement.isPinned && (
            <View style={styles.pinnedBadge}>
              <Text style={styles.pinnedBadgeText}>📌 Pinned</Text>
            </View>
          )}
        </View>
        <Text style={styles.dateText}>{formattedDate}</Text>
      </View>

      {/* Title */}
      <Text style={styles.title}>{announcement.title}</Text>

      {/* Mosque Provenance */}
      {announcement.mosqueName && (
        <Pressable
          style={styles.mosqueRow}
          onPress={() => onPressMosque && onPressMosque(announcement.mosqueId)}
          disabled={!onPressMosque}
        >
          <Text style={styles.mosqueName}>
            📍 {announcement.mosqueName}
            {announcement.city ? ` • ${announcement.city}` : ''}
          </Text>
        </Pressable>
      )}

      {/* Content */}
      <Text style={styles.content}>{displayedContent}</Text>

      {/* Footer Actions */}
      <View style={styles.footerRow}>
        {shouldTruncate && (
          <Pressable onPress={() => setIsExpanded(!isExpanded)}>
            <Text style={styles.expandBtnText}>
              {isExpanded ? 'Show Less ↑' : 'Read More →'}
            </Text>
          </Pressable>
        )}
        <Pressable style={styles.shareBtn} onPress={handleShare}>
          <Text style={styles.shareBtnText}>Share ↗</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.sm,
  },
  pinnedCard: {
    borderColor: '#fed7aa',
    backgroundColor: '#fffdfa',
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  badgeGroup: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  categoryBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: ferioRadius.full,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  pinnedBadge: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    backgroundColor: '#fef3c7',
  },
  pinnedBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#b45309',
  },
  dateText: {
    fontSize: 11,
    color: ferioColors.muted,
  },
  title: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 4,
    lineHeight: 20,
  },
  mosqueRow: {
    marginBottom: 8,
  },
  mosqueName: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  content: {
    fontSize: 13,
    color: '#374151',
    lineHeight: 18,
    marginBottom: 8,
  },
  footerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 4,
  },
  expandBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
  shareBtn: {
    paddingVertical: 3,
    paddingHorizontal: 8,
    backgroundColor: '#f4f4f5',
    borderRadius: ferioRadius.full,
  },
  shareBtnText: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.muted,
  },
});
