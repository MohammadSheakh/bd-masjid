/**
 * Enterprise Notification Inbox Service (ADR-013, ADR-053)
 * - Fast synchronous cached unread badge management (< 1ms access)
 * - Category taxonomy filtering (ALL, ANNOUNCEMENT, SCHEDULE_CHANGE, DONATION_UPDATE)
 * - Optimistic read/unread status mutations with pub/sub listener dispatch
 */

import { ApiClient } from '../lib/apiClient';
import { NotificationType, UserNotification } from '../types/mosque';
import { BANGLADESH_NOTIFICATION_FIXTURES } from '../data/notificationFixtures';

export type NotificationCategoryFilter = 'ALL' | NotificationType;

export interface NotificationCategoryMeta {
  key: NotificationCategoryFilter;
  labelEn: string;
  labelBn: string;
  icon: string;
}

export const NOTIFICATION_CATEGORIES: NotificationCategoryMeta[] = [
  { key: 'ALL', labelEn: 'All', labelBn: 'সকল', icon: '📬' },
  { key: 'ANNOUNCEMENT', labelEn: 'Notices', labelBn: 'নোটিশ', icon: '📢' },
  { key: 'SCHEDULE_CHANGE', labelEn: 'Prayer Times', labelBn: 'নামাজের সময়', icon: '⏱️' },
  { key: 'DONATION_UPDATE', labelEn: 'Donations', labelBn: 'অনুদান', icon: '💳' },
];

let cachedUnreadCount: number = BANGLADESH_NOTIFICATION_FIXTURES.filter((n) => !n.isRead).length;
let localNotificationItems: UserNotification[] = [...BANGLADESH_NOTIFICATION_FIXTURES];
const unreadListeners = new Set<(count: number) => void>();

function notifyUnreadListeners(count: number): void {
  cachedUnreadCount = count;
  unreadListeners.forEach((fn) => {
    try {
      fn(count);
    } catch {}
  });
}

export const NotificationInboxService = {
  getUnreadCountSync(): number {
    return cachedUnreadCount;
  },

  subscribeUnreadCount(listener: (count: number) => void): () => void {
    unreadListeners.add(listener);
    listener(cachedUnreadCount);
    return () => {
      unreadListeners.delete(listener);
    };
  },

  async syncUnreadCount(): Promise<number> {
    try {
      const count = await ApiClient.fetchUnreadNotificationCount();
      notifyUnreadListeners(count);
      return count;
    } catch {
      return cachedUnreadCount;
    }
  },

  async getNotifications(category: NotificationCategoryFilter = 'ALL'): Promise<UserNotification[]> {
    try {
      const res = await ApiClient.fetchUserNotifications(1, 50);
      localNotificationItems = res.items;
      notifyUnreadListeners(res.unreadCount);
    } catch {
      // Fallback preserves memory state
    }

    if (category === 'ALL') {
      return localNotificationItems;
    }
    return localNotificationItems.filter((item) => item.type === category);
  },

  async markAsRead(id: string): Promise<void> {
    const item = localNotificationItems.find((n) => n.id === id);
    if (item && !item.isRead) {
      item.isRead = true;
      item.readAt = new Date().toISOString();
      const newCount = Math.max(0, cachedUnreadCount - 1);
      notifyUnreadListeners(newCount);
    }
    try {
      await ApiClient.markNotificationAsRead(id);
    } catch {}
  },

  async markAllAsRead(): Promise<void> {
    localNotificationItems.forEach((n) => {
      n.isRead = true;
      n.readAt = new Date().toISOString();
    });
    notifyUnreadListeners(0);
    try {
      await ApiClient.markAllNotificationsAsRead();
    } catch {}
  },

  formatRelativeTime(isoString: string, isBangla: boolean = false): string {
    const elapsedMs = Math.max(0, Date.now() - new Date(isoString).getTime());
    const mins = Math.floor(elapsedMs / (1000 * 60));
    const hours = Math.floor(mins / 60);
    const days = Math.floor(hours / 24);

    if (mins < 1) return isBangla ? 'এইমাত্র' : 'Just now';
    if (mins < 60) return isBangla ? `${mins} মি. আগে` : `${mins}m ago`;
    if (hours < 24) return isBangla ? `${hours} ঘণ্টা আগে` : `${hours}h ago`;
    return isBangla ? `${days} দিন আগে` : `${days}d ago`;
  },
};
