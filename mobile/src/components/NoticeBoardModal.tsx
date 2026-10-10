import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  Share,
} from 'react-native';
import { MosqueAnnouncement, MosqueAnnouncementCategory } from '../types/mosque';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface NoticeBoardModalProps {
  visible: boolean;
  mosqueName: string;
  announcements: MosqueAnnouncement[];
  onClose: () => void;
}

const CATEGORY_STYLES: Record<
  MosqueAnnouncementCategory,
  { label: string; icon: string; bg: string; border: string; text: string }
> = {
  JANAZAH: {
    label: 'Janazah',
    icon: '⚰️',
    bg: '#fef2f2',
    border: '#fca5a5',
    text: '#dc2626',
  },
  EID_PRAYER: {
    label: 'Eid Prayer',
    icon: '🌙',
    bg: '#ecfdf5',
    border: '#a7f3d0',
    text: '#059669',
  },
  RAMADAN: {
    label: 'Ramadan',
    icon: '✨',
    bg: '#fffbeb',
    border: '#fde68a',
    text: '#d97706',
  },
  FRIDAY_KHUTBAH: {
    label: 'Khutbah',
    icon: '🕌',
    bg: '#f3f4f6',
    border: '#e5e7eb',
    text: ferioColors.primary,
  },
  GENERAL_NOTICE: {
    label: 'Notice',
    icon: '📢',
    bg: ferioColors.canvas,
    border: ferioColors.border,
    text: ferioColors.primary,
  },
};

export const NoticeBoardModal: React.FC<NoticeBoardModalProps> = ({
  visible,
  mosqueName,
  announcements,
  onClose,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<string>('All');

  const filtered = useMemo(() => {
    if (selectedCategory === 'All') return announcements;
    return announcements.filter((a) => a.category === selectedCategory);
  }, [announcements, selectedCategory]);

  const handleShare = async (announcement: MosqueAnnouncement) => {
    try {
      await Share.share({
        title: `${announcement.title} - ${mosqueName}`,
        message: `📢 [${announcement.title}]\nMosque: ${mosqueName}\n${
          announcement.eventTime ? `Time: ${announcement.eventTime}\n` : ''
        }\n${announcement.body}\n\nShared via BD Masjid`,
      });
    } catch {
      // User cancelled share
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Mosque Notice Board</Text>
              <Text style={styles.headerSubtitle} numberOfLines={1}>
                {mosqueName} • Official Announcements
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          {/* Category Filter Pills */}
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            style={styles.filterRow}
            contentContainerStyle={styles.filterRowContent}
          >
            {['All', 'JANAZAH', 'FRIDAY_KHUTBAH', 'RAMADAN', 'EID_PRAYER'].map((cat) => {
              const isActive = selectedCategory === cat;
              const label = cat === 'All' ? 'All Notices' : CATEGORY_STYLES[cat as MosqueAnnouncementCategory]?.label || cat;
              return (
                <Pressable
                  key={cat}
                  onPress={() => setSelectedCategory(cat)}
                  style={[styles.filterChip, isActive && styles.filterChipActive]}
                >
                  <Text style={[styles.filterText, isActive && styles.filterTextActive]}>
                    {label}
                  </Text>
                </Pressable>
              );
            })}
          </ScrollView>

          {/* Announcements List */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {filtered.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>📋</Text>
                <Text style={styles.emptyTitle}>No active announcements</Text>
                <Text style={styles.emptySub}>
                  No notices found for the selected category.
                </Text>
              </View>
            ) : (
              filtered.map((item) => {
                const styleMeta = CATEGORY_STYLES[item.category] || CATEGORY_STYLES.GENERAL_NOTICE;
                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={[styles.categoryBadge, { backgroundColor: styleMeta.bg, borderColor: styleMeta.border }]}>
                        <Text style={[styles.categoryBadgeText, { color: styleMeta.text }]}>
                          {styleMeta.icon} {styleMeta.label}
                        </Text>
                      </View>

                      {item.priority === 'URGENT' && (
                        <View style={styles.urgentBadge}>
                          <Text style={styles.urgentBadgeText}>🔴 URGENT</Text>
                        </View>
                      )}
                    </View>

                    <Text style={styles.cardTitle}>{item.title}</Text>

                    {item.eventTime && (
                      <View style={styles.eventTimeRow}>
                        <Text style={styles.eventTimeLabel}>
                          🕒 {item.eventDate ? `${item.eventDate} at ` : ''}{item.eventTime}
                        </Text>
                      </View>
                    )}

                    <Text style={styles.cardBody}>{item.body}</Text>

                    <View style={styles.cardFooter}>
                      <Text style={styles.authorText}>
                        {item.authorName ? `Posted by: ${item.authorName}` : 'Mosque Committee'}
                      </Text>
                      <Pressable
                        style={styles.shareBtn}
                        onPress={() => handleShare(item)}
                        hitSlop={8}
                      >
                        <Text style={styles.shareBtnText}>🔗 Share</Text>
                      </Pressable>
                    </View>
                  </View>
                );
              })
            )}
          </ScrollView>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: ferioColors.surface,
    borderTopLeftRadius: ferioRadius.lg,
    borderTopRightRadius: ferioRadius.lg,
    maxHeight: '85%',
    paddingBottom: ferioSpacing.xl,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: ferioSpacing.lg,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  headerTitle: {
    fontSize: 18,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  headerSubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
    maxWidth: 240,
  },
  closeBtn: {
    padding: ferioSpacing.xs,
  },
  closeBtnText: {
    fontSize: 16,
    color: ferioColors.muted,
  },
  filterRow: {
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
    paddingVertical: ferioSpacing.sm,
  },
  filterRowContent: {
    paddingHorizontal: ferioSpacing.lg,
    gap: ferioSpacing.xs,
  },
  filterChip: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginRight: 6,
  },
  filterChipActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  filterText: {
    fontSize: 12,
    fontWeight: '500',
    color: ferioColors.primary,
  },
  filterTextActive: {
    color: ferioColors.primaryForeground,
  },
  body: {
    padding: ferioSpacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: ferioSpacing.xl * 2,
  },
  emptyIcon: {
    fontSize: 36,
    marginBottom: ferioSpacing.sm,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  emptySub: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 4,
  },
  card: {
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    marginBottom: ferioSpacing.md,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: ferioSpacing.xs + 2,
  },
  categoryBadge: {
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.sm,
    borderWidth: 1,
  },
  categoryBadgeText: {
    fontSize: 11,
    fontWeight: '700',
  },
  urgentBadge: {
    backgroundColor: '#fee2e2',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 3,
    borderRadius: ferioRadius.sm,
  },
  urgentBadgeText: {
    fontSize: 10,
    fontWeight: '800',
    color: '#991b1b',
  },
  cardTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 4,
  },
  eventTimeRow: {
    backgroundColor: ferioColors.surface,
    alignSelf: 'flex-start',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.sm,
    borderWidth: 1,
    borderColor: ferioColors.border,
    marginBottom: ferioSpacing.xs + 2,
  },
  eventTimeLabel: {
    fontSize: 11,
    fontWeight: '600',
    color: ferioColors.primary,
    fontVariant: ['tabular-nums'],
  },
  cardBody: {
    fontSize: 13,
    color: ferioColors.primary,
    lineHeight: 19,
    marginBottom: ferioSpacing.md,
  },
  cardFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: ferioColors.border,
    paddingTop: ferioSpacing.sm,
  },
  authorText: {
    fontSize: 11,
    color: ferioColors.muted,
  },
  shareBtn: {
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
  },
  shareBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#059669',
  },
});
