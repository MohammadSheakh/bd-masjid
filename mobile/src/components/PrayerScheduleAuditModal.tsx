import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
} from 'react-native';
import { PrayerScheduleHistoryItem } from '../types/prayerScheduleAudit';
import { ApiClient } from '../lib/apiClient';
import { computeScheduleDiff, formatTime12h } from '../lib/scheduleDiff';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface PrayerScheduleAuditModalProps {
  visible: boolean;
  mosqueId: string;
  mosqueName: string;
  onClose: () => void;
  onReportDiscrepancy?: () => void;
  isBangla?: boolean;
}

export const PrayerScheduleAuditModal: React.FC<PrayerScheduleAuditModalProps> = ({
  visible,
  mosqueId,
  mosqueName,
  onClose,
  onReportDiscrepancy,
  isBangla = false,
}) => {
  const [historyItems, setHistoryItems] = useState<PrayerScheduleHistoryItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible || !mosqueId) return;

    let isMounted = true;
    setLoading(true);
    setError(null);

    ApiClient.getPrayerScheduleHistory(mosqueId, 1, 20)
      .then((res) => {
        if (isMounted) {
          setHistoryItems(res.items || []);
          setLoading(false);
        }
      })
      .catch((err) => {
        if (isMounted) {
          setError(err.message || 'Failed to load schedule history');
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [visible, mosqueId]);

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          <View style={styles.dragIndicator} />

          {/* Header */}
          <View style={styles.header}>
            <View style={styles.headerTextGroup}>
              <Text style={styles.sheetTitle}>
                {isBangla ? 'নামাজের সময়সূচী পরিবর্তনের ইতিহাস' : 'Schedule Revision History'}
              </Text>
              <Text style={styles.sheetSub} numberOfLines={1}>
                {mosqueName}
              </Text>
            </View>
            <TouchableOpacity
              onPress={onClose}
              style={styles.closeBtn}
              accessibilityRole="button"
              accessibilityLabel="Close"
            >
              <Text style={styles.closeBtnText}>✕</Text>
            </TouchableOpacity>
          </View>

          {loading ? (
            <View style={styles.centerContainer}>
              <ActivityIndicator size="small" color="#059669" />
              <Text style={styles.loadingText}>
                {isBangla ? 'ইতিহাস লোড হচ্ছে...' : 'Loading audit history...'}
              </Text>
            </View>
          ) : error ? (
            <View style={styles.centerContainer}>
              <Text style={styles.errorText}>{error}</Text>
            </View>
          ) : historyItems.length === 0 ? (
            <View style={styles.centerContainer}>
              <Text style={styles.emptyIcon}>🕒</Text>
              <Text style={styles.emptyTitle}>
                {isBangla ? 'কোনো পূর্ববর্তী পরিবর্তন নেই' : 'No revisions recorded yet'}
              </Text>
              <Text style={styles.emptySub}>
                {isBangla
                  ? 'বর্তমান সময়সূচীটি অপরিবর্তিত রয়েছে।'
                  : 'The current timetable represents the initial verified schedule.'}
              </Text>
            </View>
          ) : (
            <ScrollView
              style={styles.scrollArea}
              contentContainerStyle={styles.scrollContent}
              showsVerticalScrollIndicator={false}
            >
              {historyItems.map((item, index) => {
                const nextItem = historyItems[index + 1];
                const diffItems = computeScheduleDiff(
                  item.scheduleSnapshot,
                  nextItem?.scheduleSnapshot
                );
                const dateStr = new Date(item.createdAt).toLocaleDateString(
                  isBangla ? 'bn-BD' : 'en-US',
                  {
                    day: 'numeric',
                    month: 'short',
                    year: 'numeric',
                  }
                );

                return (
                  <View key={item.id} style={styles.historyCard}>
                    {/* Card Meta Header */}
                    <View style={styles.cardMetaRow}>
                      <View style={styles.dateBadge}>
                        <Text style={styles.dateBadgeText}>{dateStr}</Text>
                      </View>
                      <View style={styles.editorBadge}>
                        <Text style={styles.editorBadgeText}>
                          {item.changedBy?.name || (isBangla ? 'যাচাইকৃত প্রতিনিধি' : 'Verified Lead')}
                        </Text>
                      </View>
                    </View>

                    {item.reason ? (
                      <Text style={styles.reasonText}>
                        "{item.reason}"
                      </Text>
                    ) : null}

                    {/* Waqt Diffs Grid */}
                    <View style={styles.waqtGrid}>
                      {diffItems.map((diff) => (
                        <View key={diff.key} style={styles.waqtPill}>
                          <Text style={styles.waqtName}>
                            {isBangla ? diff.nameBn : diff.nameEn}
                          </Text>
                          <Text style={styles.waqtTime}>
                            {formatTime12h(diff.newTime)}
                          </Text>
                          {diff.diffBadge && (
                            <View
                              style={[
                                styles.diffBadge,
                                (diff.diffMinutes ?? 0) > 0 ? styles.diffPositive : styles.diffNegative,
                              ]}
                            >
                              <Text style={styles.diffBadgeText}>{diff.diffBadge}</Text>
                            </View>
                          )}
                        </View>
                      ))}
                    </View>
                  </View>
                );
              })}
            </ScrollView>
          )}

          {/* Bottom Actions */}
          <View style={styles.footer}>
            {onReportDiscrepancy && (
              <TouchableOpacity
                style={styles.discrepancyBtn}
                onPress={() => {
                  onClose();
                  onReportDiscrepancy();
                }}
                accessibilityRole="button"
                accessibilityLabel="Report Schedule Discrepancy"
              >
                <Text style={styles.discrepancyBtnText}>
                  {isBangla ? '🚩 সময়সূচীতে অমিল রিপোর্ট করুন' : '🚩 Report Schedule Discrepancy'}
                </Text>
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  sheetContainer: {
    backgroundColor: '#ffffff',
    borderTopLeftRadius: ferioRadius.xl,
    borderTopRightRadius: ferioRadius.xl,
    maxHeight: '85%',
    paddingBottom: 24,
  },
  dragIndicator: {
    width: 36,
    height: 4,
    backgroundColor: ferioColors.border,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: ferioSpacing.sm,
    marginBottom: ferioSpacing.sm,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: ferioSpacing.lg,
    paddingBottom: ferioSpacing.md,
    borderBottomWidth: 1,
    borderBottomColor: '#f0f0f2',
  },
  headerTextGroup: {
    flex: 1,
    marginRight: ferioSpacing.sm,
  },
  sheetTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  sheetSub: {
    fontSize: 12,
    color: ferioColors.muted,
    marginTop: 2,
  },
  closeBtn: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#f4f4f5',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtnText: {
    fontSize: 13,
    color: ferioColors.muted,
  },
  centerContainer: {
    padding: 32,
    alignItems: 'center',
    justifyContent: 'center',
  },
  loadingText: {
    marginTop: 10,
    fontSize: 12,
    color: ferioColors.muted,
  },
  errorText: {
    fontSize: 13,
    color: '#dc2626',
    textAlign: 'center',
  },
  emptyIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  emptyTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
    marginBottom: 4,
  },
  emptySub: {
    fontSize: 12,
    color: ferioColors.muted,
    textAlign: 'center',
    paddingHorizontal: 20,
  },
  scrollArea: {
    maxHeight: 400,
  },
  scrollContent: {
    padding: ferioSpacing.lg,
    gap: 12,
  },
  historyCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.lg,
    padding: 12,
  },
  cardMetaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 8,
  },
  dateBadge: {
    backgroundColor: '#e4e4e7',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  dateBadgeText: {
    fontSize: 11,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  editorBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  editorBadgeText: {
    fontSize: 11,
    fontWeight: '600',
    color: '#059669',
  },
  reasonText: {
    fontSize: 12,
    fontStyle: 'italic',
    color: ferioColors.muted,
    marginBottom: 10,
  },
  waqtGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 6,
  },
  waqtPill: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#f0f0f2',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    minWidth: '30%',
    flex: 1,
  },
  waqtName: {
    fontSize: 10,
    color: ferioColors.muted,
    textTransform: 'uppercase',
  },
  waqtTime: {
    fontSize: 12,
    fontWeight: '700',
    color: ferioColors.primary,
    marginTop: 1,
  },
  diffBadge: {
    marginTop: 2,
    borderRadius: 4,
    paddingHorizontal: 4,
    paddingVertical: 1,
    alignSelf: 'flex-start',
  },
  diffPositive: {
    backgroundColor: '#fef3c7',
  },
  diffNegative: {
    backgroundColor: '#e0f2fe',
  },
  diffBadgeText: {
    fontSize: 9,
    fontWeight: '700',
    color: '#92400e',
  },
  footer: {
    paddingHorizontal: ferioSpacing.lg,
    paddingTop: ferioSpacing.sm,
  },
  discrepancyBtn: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: ferioRadius.md,
    paddingVertical: 10,
    alignItems: 'center',
  },
  discrepancyBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#dc2626',
  },
});
