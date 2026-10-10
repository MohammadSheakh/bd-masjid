import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { ModerationAction, ModerationQueueItem, ModerationType } from '../types/moderation';
import { ModeratorService } from '../services/moderatorService';

interface ModeratorReviewModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ModeratorReviewModal: React.FC<ModeratorReviewModalProps> = ({
  visible,
  onClose,
}) => {
  const [queue, setQueue] = useState<ModerationQueueItem[]>(() => ModeratorService.getCachedQueueSync());
  const [filter, setFilter] = useState<'ALL' | ModerationType>('ALL');
  const [isLoading, setIsLoading] = useState(false);
  const [resolvingId, setResolvingId] = useState<string | null>(null);

  useEffect(() => {
    if (visible) {
      setIsLoading(true);
      ModeratorService.loadModerationQueue().then((items) => {
        setQueue(items);
        setIsLoading(false);
      });
    }
  }, [visible]);

  const filteredQueue = queue.filter((item) => {
    if (filter === 'ALL') return true;
    return item.type === filter;
  });

  const handleAction = async (item: ModerationQueueItem, action: ModerationAction) => {
    setResolvingId(item.id);
    try {
      const res = await ModeratorService.resolveItem(item.id, action);
      setQueue((prev) => prev.filter((i) => i.id !== item.id));
      Alert.alert(
        action === 'APPROVE' ? 'Listing Approved' : 'Submission Rejected',
        res.message || `Decision recorded for ${item.targetName}`
      );
    } catch {
      Alert.alert('Error', 'Failed to resolve moderation item. Please retry.');
    } finally {
      setResolvingId(null);
    }
  };

  const getBadgeStyle = (type: ModerationType) => {
    switch (type) {
      case 'MOSQUE_VERIFICATION':
        return { bg: '#ecfdf5', text: '#059669', label: 'New Mosque' };
      case 'DUPLICATE_FLAG':
        return { bg: '#fffbeb', text: '#d97706', label: 'Duplicate Check' };
      case 'ISSUE_REPORT':
        return { bg: '#fff1f2', text: '#e11d48', label: 'Issue Report' };
    }
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerTitleRow}>
                <Text style={styles.shieldIcon}>🛡️</Text>
                <Text style={styles.headerTitle}>Moderator Console</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                {queue.length} pending community contribution{queue.length !== 1 ? 's' : ''}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          {/* Filter Pills */}
          <View style={styles.filterRow}>
            {(['ALL', 'MOSQUE_VERIFICATION', 'DUPLICATE_FLAG', 'ISSUE_REPORT'] as const).map((tab) => {
              const active = filter === tab;
              const label =
                tab === 'ALL'
                  ? `All (${queue.length})`
                  : tab === 'MOSQUE_VERIFICATION'
                  ? 'Mosques'
                  : tab === 'DUPLICATE_FLAG'
                  ? 'Duplicates'
                  : 'Reports';
              return (
                <TouchableOpacity
                  key={tab}
                  style={[styles.filterChip, active && styles.filterChipActive]}
                  onPress={() => setFilter(tab)}
                >
                  <Text style={[styles.filterChipText, active && styles.filterChipTextActive]}>
                    {label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Queue Body */}
          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {isLoading ? (
              <ActivityIndicator size="large" color="#059669" style={styles.loader} />
            ) : filteredQueue.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyIcon}>✓</Text>
                <Text style={styles.emptyTitle}>Queue Clear</Text>
                <Text style={styles.emptySub}>No pending submissions requiring moderator review.</Text>
              </View>
            ) : (
              filteredQueue.map((item) => {
                const badge = getBadgeStyle(item.type);
                const isResolving = resolvingId === item.id;

                return (
                  <View key={item.id} style={styles.card}>
                    <View style={styles.cardHeader}>
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardTitle}>{item.targetName}</Text>
                        <Text style={styles.cardLocation}>{item.location}</Text>
                      </View>
                      <View style={[styles.badge, { backgroundColor: badge.bg }]}>
                        <Text style={[styles.badgeText, { color: badge.text }]}>{badge.label}</Text>
                      </View>
                    </View>

                    <Text style={styles.cardDetails}>{item.details}</Text>

                    {item.distanceMeters && item.duplicateWith ? (
                      <View style={styles.dupAlert}>
                        <Text style={styles.dupAlertText}>
                          ⚠️ {item.distanceMeters}m from "{item.duplicateWith}"
                        </Text>
                      </View>
                    ) : null}

                    <View style={styles.attributionRow}>
                      <Text style={styles.attributionText}>
                        👤 {item.contributorName} · {item.contributorRole}
                      </Text>
                    </View>

                    <View style={styles.actionRow}>
                      <TouchableOpacity
                        style={[styles.actionBtn, styles.approveBtn]}
                        disabled={isResolving}
                        onPress={() => handleAction(item, 'APPROVE')}
                      >
                        <Text style={styles.approveBtnText}>
                          {isResolving ? 'Processing...' : '✓ Approve & List'}
                        </Text>
                      </TouchableOpacity>

                      <TouchableOpacity
                        style={[styles.actionBtn, styles.rejectBtn]}
                        disabled={isResolving}
                        onPress={() => handleAction(item, 'REJECT')}
                      >
                        <Text style={styles.rejectBtnText}>✕ Reject</Text>
                      </TouchableOpacity>
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
    backgroundColor: 'rgba(0, 0, 0, 0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#f4f4f5',
  },
  headerTitleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  shieldIcon: {
    fontSize: 16,
  },
  headerTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  headerSubtitle: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 18,
    color: '#94a3b8',
    fontWeight: '700',
  },
  filterRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 10,
    gap: 8,
  },
  filterChip: {
    paddingHorizontal: 10,
    paddingVertical: 5,
    borderRadius: 6,
    backgroundColor: '#f1f5f9',
  },
  filterChipActive: {
    backgroundColor: '#0f172a',
  },
  filterChipText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#475569',
  },
  filterChipTextActive: {
    color: '#ffffff',
  },
  body: {
    paddingHorizontal: 16,
  },
  loader: {
    marginTop: 40,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
  },
  emptyIcon: {
    fontSize: 32,
    color: '#059669',
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
  },
  emptySub: {
    fontSize: 12,
    color: '#64748b',
    marginTop: 4,
    textAlign: 'center',
  },
  card: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 6,
  },
  cardTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: '#0f172a',
  },
  cardLocation: {
    fontSize: 11,
    color: '#64748b',
    marginTop: 2,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  badgeText: {
    fontSize: 10,
    fontWeight: '700',
  },
  cardDetails: {
    fontSize: 12,
    color: '#334155',
    lineHeight: 17,
    marginTop: 4,
  },
  dupAlert: {
    backgroundColor: '#fffbeb',
    borderColor: '#fef3c7',
    borderWidth: 1,
    borderRadius: 6,
    padding: 8,
    marginTop: 8,
  },
  dupAlertText: {
    fontSize: 11,
    color: '#b45309',
    fontWeight: '600',
  },
  attributionRow: {
    marginTop: 10,
    paddingTop: 8,
    borderTopWidth: 1,
    borderTopColor: '#f1f5f9',
  },
  attributionText: {
    fontSize: 11,
    color: '#64748b',
  },
  actionRow: {
    flexDirection: 'row',
    gap: 8,
    marginTop: 10,
  },
  actionBtn: {
    flex: 1,
    paddingVertical: 8,
    borderRadius: 8,
    alignItems: 'center',
  },
  approveBtn: {
    backgroundColor: '#059669',
  },
  approveBtnText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '700',
  },
  rejectBtn: {
    backgroundColor: '#f1f5f9',
  },
  rejectBtnText: {
    color: '#dc2626',
    fontSize: 12,
    fontWeight: '600',
  },
});
