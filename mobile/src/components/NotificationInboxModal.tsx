/**
 * Ferio Notification Inbox Modal (ADR-013, ADR-053)
 * Full modal sheet displaying recent mosque notices, prayer time shifts,
 * and verified donation updates with category tabs and unread state management.
 */

import React, { useState, useEffect, useCallback } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { UserNotification } from '../types/mosque';
import {
  NotificationCategoryFilter,
  NotificationInboxService,
  NOTIFICATION_CATEGORIES,
} from '../services/notificationInboxService';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface NotificationInboxModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMosque?: (mosqueId: string) => void;
  isBangla?: boolean;
}

export const NotificationInboxModal: React.FC<NotificationInboxModalProps> = ({
  visible,
  onClose,
  onSelectMosque,
  isBangla = false,
}) => {
  const [activeCategory, setActiveCategory] = useState<NotificationCategoryFilter>('ALL');
  const [notifications, setNotifications] = useState<UserNotification[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);

  const loadData = useCallback(async (cat: NotificationCategoryFilter) => {
    setIsLoading(true);
    try {
      const items = await NotificationInboxService.getNotifications(cat);
      setNotifications(items);
      setUnreadCount(NotificationInboxService.getUnreadCountSync());
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (visible) {
      loadData(activeCategory);
      const unsubscribe = NotificationInboxService.subscribeUnreadCount((count) => {
        setUnreadCount(count);
      });
      return unsubscribe;
    }
  }, [visible, activeCategory, loadData]);

  const handleMarkItemRead = async (item: UserNotification) => {
    if (!item.isRead) {
      await NotificationInboxService.markAsRead(item.id);
      setNotifications((prev) =>
        prev.map((n) => (n.id === item.id ? { ...n, isRead: true } : n))
      );
    }
    if (onSelectMosque && item.mosqueId) {
      onClose();
      onSelectMosque(item.mosqueId);
    }
  };

  const handleMarkAllRead = async () => {
    await NotificationInboxService.markAllAsRead();
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
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
            <View style={styles.titleRow}>
              <Text style={styles.title}>
                {isBangla ? 'বিজ্ঞপ্তি ও আপডেট' : 'Notifications'}
              </Text>
              {unreadCount > 0 && (
                <View style={styles.unreadBadge}>
                  <Text style={styles.unreadBadgeText}>
                    {unreadCount} {isBangla ? 'নতুন' : 'new'}
                  </Text>
                </View>
              )}
            </View>
            <View style={styles.headerActions}>
              {unreadCount > 0 && (
                <Pressable
                  onPress={handleMarkAllRead}
                  style={styles.markAllButton}
                  hitSlop={8}
                >
                  <Text style={styles.markAllButtonText}>
                    {isBangla ? 'সব পড়া হয়েছে' : 'Mark all read'}
                  </Text>
                </Pressable>
              )}
              <Pressable
                onPress={onClose}
                style={styles.closeButton}
                hitSlop={12}
                accessibilityLabel="Close notification inbox"
              >
                <Text style={styles.closeIcon}>✕</Text>
              </Pressable>
            </View>
          </View>

          {/* Category Filter Pills */}
          <View style={styles.filterBar}>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              contentContainerStyle={styles.filterScroll}
            >
              {NOTIFICATION_CATEGORIES.map((cat) => {
                const isSelected = activeCategory === cat.key;
                const label = isBangla ? cat.labelBn : cat.labelEn;
                return (
                  <Pressable
                    key={cat.key}
                    onPress={() => {
                      setActiveCategory(cat.key);
                      loadData(cat.key);
                    }}
                    style={[
                      styles.filterPill,
                      isSelected && styles.filterPillActive,
                    ]}
                  >
                    <Text style={styles.filterIcon}>{cat.icon}</Text>
                    <Text
                      style={[
                        styles.filterLabel,
                        isSelected && styles.filterLabelActive,
                      ]}
                    >
                      {label}
                    </Text>
                  </Pressable>
                );
              })}
            </ScrollView>
          </View>

          {/* Notification List */}
          {isLoading ? (
            <View style={styles.loaderContainer}>
              <ActivityIndicator size="small" color={ferioColors.accent} />
            </View>
          ) : notifications.length === 0 ? (
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyIcon}>📭</Text>
              <Text style={styles.emptyText}>
                {isBangla
                  ? 'এই বিভাগে কোনো নতুন বিজ্ঞপ্তি নেই'
                  : 'No notifications in this category'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.list}
              contentContainerStyle={styles.listContent}
              showsVerticalScrollIndicator={false}
            >
              {notifications.map((item) => (
                <Pressable
                  key={item.id}
                  onPress={() => handleMarkItemRead(item)}
                  style={[
                    styles.itemCard,
                    !item.isRead && styles.itemCardUnread,
                  ]}
                >
                  <View style={styles.itemHeader}>
                    <View style={styles.itemMosqueRow}>
                      {!item.isRead && <View style={styles.unreadDot} />}
                      <Text style={styles.itemMosqueName} numberOfLines={1}>
                        {item.mosque?.name || 'Mosque Update'}
                      </Text>
                    </View>
                    <Text style={styles.itemTime}>
                      {NotificationInboxService.formatRelativeTime(
                        item.createdAt,
                        isBangla
                      )}
                    </Text>
                  </View>
                  <Text style={styles.itemTitle}>{item.title}</Text>
                  <Text style={styles.itemBody} numberOfLines={3}>
                    {item.body}
                  </Text>
                </Pressable>
              ))}
            </ScrollView>
          )}
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
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.sm,
  },
  title: {
    fontSize: 18,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  unreadBadge: {
    backgroundColor: ferioColors.accentMuted,
    borderRadius: ferioRadius.full,
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderWidth: 1,
    borderColor: ferioColors.accent,
  },
  unreadBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.accent,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: ferioSpacing.md,
  },
  markAllButton: {
    paddingVertical: ferioSpacing.xs,
    paddingHorizontal: ferioSpacing.sm,
  },
  markAllButtonText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.accent,
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
  filterBar: {
    paddingVertical: ferioSpacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  filterScroll: {
    paddingHorizontal: ferioSpacing.lg,
    gap: ferioSpacing.sm,
  },
  filterPill: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.mutedBackground,
    borderWidth: 1,
    borderColor: 'transparent',
    gap: 4,
  },
  filterPillActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  filterIcon: {
    fontSize: 12,
  },
  filterLabel: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.muted,
  },
  filterLabelActive: {
    color: ferioColors.primaryForeground,
  },
  list: {
    flexGrow: 1,
  },
  listContent: {
    padding: ferioSpacing.lg,
    gap: ferioSpacing.md,
  },
  loaderContainer: {
    padding: ferioSpacing.xxxl,
    alignItems: 'center',
  },
  emptyContainer: {
    padding: ferioSpacing.xxxl,
    alignItems: 'center',
    gap: ferioSpacing.sm,
  },
  emptyIcon: {
    fontSize: 32,
  },
  emptyText: {
    fontSize: 14,
    color: ferioColors.muted,
  },
  itemCard: {
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.lg,
    padding: ferioSpacing.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
    gap: 4,
  },
  itemCardUnread: {
    backgroundColor: ferioColors.surface,
    borderColor: ferioColors.accent,
    borderLeftWidth: 3,
  },
  itemHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 2,
  },
  itemMosqueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
    gap: 6,
  },
  unreadDot: {
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: ferioColors.accent,
  },
  itemMosqueName: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.muted,
    flex: 1,
  },
  itemTime: {
    fontSize: 11,
    color: ferioColors.muted,
  },
  itemTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  itemBody: {
    fontSize: 13,
    lineHeight: 18,
    color: ferioColors.muted,
  },
});
