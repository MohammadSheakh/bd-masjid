import React, { useState, useEffect, useCallback } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  FlatList,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import { MosqueAnnouncement, AnnouncementCategory } from '../types/announcement';
import { ApiClient } from '../lib/apiClient';
import { AnnouncementCard } from './AnnouncementCard';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface AnnouncementsFeedModalProps {
  visible: boolean;
  onClose: () => void;
  onSelectMosque?: (mosqueId: string) => void;
  onOpenCreate?: () => void;
  userLatitude?: number;
  userLongitude?: number;
}

const CATEGORIES: { key: AnnouncementCategory | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All / সব' },
  { key: 'EMERGENCY_ALERT', label: '🚨 Emergency' },
  { key: 'JANAZA', label: '⚰️ Janazah' },
  { key: 'JUMUAH_KHUTBAH', label: "🕌 Jumu'ah" },
  { key: 'RAMADAN', label: '🌙 Ramadan' },
  { key: 'EID', label: '🎉 Eid' },
  { key: 'MAINTENANCE', label: '🔧 Maintenance' },
];

export const AnnouncementsFeedModal: React.FC<AnnouncementsFeedModalProps> = ({
  visible,
  onClose,
  onSelectMosque,
  onOpenCreate,
  userLatitude = 23.8103,
  userLongitude = 90.4125,
}) => {
  const [selectedCategory, setSelectedCategory] = useState<AnnouncementCategory | 'ALL'>('ALL');
  const [bookmarkedOnly, setBookmarkedOnly] = useState(false);
  const [announcements, setAnnouncements] = useState<MosqueAnnouncement[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isRefreshing, setIsRefreshing] = useState(false);

  const fetchFeed = useCallback(async () => {
    try {
      setIsLoading(true);
      const res = await ApiClient.getAnnouncementsFeed({
        lat: userLatitude,
        lng: userLongitude,
        radiusKm: 15,
        category: selectedCategory === 'ALL' ? undefined : selectedCategory,
        bookmarkedOnly,
      });
      setAnnouncements(res.data || []);
    } catch {
      setAnnouncements([]);
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, [selectedCategory, bookmarkedOnly, userLatitude, userLongitude]);

  useEffect(() => {
    if (visible) {
      fetchFeed();
    }
  }, [visible, fetchFeed]);

  const handleRefresh = () => {
    setIsRefreshing(true);
    fetchFeed();
  };

  const handlePressMosque = (mosqueId: string) => {
    onClose();
    if (onSelectMosque) {
      onSelectMosque(mosqueId);
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.overlay}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.title}>Notice Board & Bulletins</Text>
              <Text style={styles.subtitle}>মসিজদের জরুরি নোটিশ ও জানাজা বিজ্ঞপ্তি</Text>
            </View>
            <TouchableOpacity
              style={styles.closeBtn}
              onPress={onClose}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Category Filter Horizontal Scroll */}
          <View style={styles.filterBar}>
            <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoryScroll}>
              {CATEGORIES.map((cat) => {
                const isActive = selectedCategory === cat.key;
                return (
                  <TouchableOpacity
                    key={cat.key}
                    style={[styles.catPill, isActive && styles.catPillActive]}
                    onPress={() => setSelectedCategory(cat.key)}
                  >
                    <Text style={[styles.catPillText, isActive && styles.catPillTextActive]}>
                      {cat.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </ScrollView>
          </View>

          {/* Subfilter Bar */}
          <View style={styles.subfilterRow}>
            <TouchableOpacity
              style={[styles.subfilterPill, bookmarkedOnly && styles.subfilterPillActive]}
              onPress={() => setBookmarkedOnly(!bookmarkedOnly)}
            >
              <Text style={[styles.subfilterText, bookmarkedOnly && styles.subfilterTextActive]}>
                ⭐ Bookmarked Only / অনুসারিত
              </Text>
            </TouchableOpacity>

            {onOpenCreate && (
              <TouchableOpacity style={styles.createNoticeBtn} onPress={onOpenCreate}>
                <Text style={styles.createNoticeBtnText}>+ Post Notice</Text>
              </TouchableOpacity>
            )}
          </View>

          {/* Feed Content */}
          {isLoading && !isRefreshing ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>Loading notices...</Text>
            </View>
          ) : announcements.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>📢</Text>
              <Text style={styles.emptyTitle}>No Active Notices</Text>
              <Text style={styles.emptySubtitle}>
                No announcements posted in this category recently.
              </Text>
            </View>
          ) : (
            <FlatList
              data={announcements}
              keyExtractor={(item) => item.id}
              renderItem={({ item }) => (
                <AnnouncementCard
                  announcement={item}
                  onPressMosque={handlePressMosque}
                />
              )}
              contentContainerStyle={styles.listContent}
              refreshControl={
                <RefreshControl
                  refreshing={isRefreshing}
                  onRefresh={handleRefresh}
                  colors={['#059669']}
                  tintColor="#059669"
                />
              }
            />
          )}
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#fafafa',
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '88%',
    minHeight: '65%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.md,
    paddingTop: ferioSpacing.md,
    paddingBottom: ferioSpacing.xs,
  },
  title: {
    fontSize: 17,
    fontWeight: '800',
    color: ferioColors.primary,
  },
  subtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: ferioRadius.full,
    backgroundColor: '#f4f4f5',
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeBtnText: {
    fontSize: 15,
    fontWeight: '600',
    color: '#6e6e73',
  },
  filterBar: {
    paddingVertical: 8,
    borderBottomWidth: 1,
    borderBottomColor: '#e8e8ea',
  },
  categoryScroll: {
    paddingHorizontal: ferioSpacing.md,
    gap: 6,
  },
  catPill: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: ferioRadius.full,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e8e8ea',
  },
  catPillActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  catPillText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#374151',
  },
  catPillTextActive: {
    color: '#ffffff',
  },
  subfilterRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: 8,
  },
  subfilterPill: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: ferioRadius.full,
    backgroundColor: '#f4f4f5',
  },
  subfilterPillActive: {
    backgroundColor: '#fef3c7',
  },
  subfilterText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#6e6e73',
  },
  subfilterTextActive: {
    color: '#b45309',
  },
  createNoticeBtn: {
    backgroundColor: '#059669',
    paddingHorizontal: 12,
    paddingVertical: 5,
    borderRadius: ferioRadius.full,
  },
  createNoticeBtnText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#ffffff',
  },
  listContent: {
    padding: ferioSpacing.md,
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  loadingText: {
    marginTop: 8,
    fontSize: 12,
    color: ferioColors.muted,
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 15,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  emptySubtitle: {
    fontSize: 12,
    color: ferioColors.muted,
    textAlign: 'center',
    marginTop: 4,
  },
});
