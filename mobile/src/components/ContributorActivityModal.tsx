import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
} from 'react-native';
import { ContributorActivityItem, ContributorReputationSummary } from '../types/contributor';
import { ContributorService } from '../services/contributorService';

interface ContributorActivityModalProps {
  visible: boolean;
  onClose: () => void;
}

export const ContributorActivityModal: React.FC<ContributorActivityModalProps> = ({
  visible,
  onClose,
}) => {
  const [summary, setSummary] = useState<ContributorReputationSummary>(() =>
    ContributorService.getReputationSync()
  );
  const [history, setHistory] = useState<ContributorActivityItem[]>(() =>
    ContributorService.getActivityHistorySync()
  );

  useEffect(() => {
    if (!visible) return;
    const unsub = ContributorService.subscribe((s) => {
      setSummary(s);
      setHistory(ContributorService.getActivityHistorySync());
    });
    ContributorService.loadReputation().catch(() => {});
    return unsub;
  }, [visible]);

  const progressPercent = Math.min(100, Math.round((summary.scoutPoints / summary.nextTierPoints) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>🏅</Text>
                <Text style={styles.title}>Scout Reputation Console</Text>
              </View>
              <Text style={styles.subtitle}>Verified Musalli Contributions & Points</Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Scout Tier Card */}
            <View style={styles.heroCard}>
              <View style={styles.heroHeader}>
                <View style={styles.tierPill}>
                  <Text style={styles.tierPillText}>★ {summary.scoutTier} SCOUT</Text>
                </View>
                <Text style={styles.pointsText}>{summary.scoutPoints} Pts</Text>
              </View>
              <Text style={styles.rankTitle}>{summary.rankTitle}</Text>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${progressPercent}%` }]} />
              </View>
              <Text style={styles.progressLabel}>
                {summary.scoutPoints} / {summary.nextTierPoints} Pts to next tier
              </Text>
            </View>

            {/* 4-Box Metric Grid */}
            <View style={styles.grid}>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{summary.verifiedMosquesCount}</Text>
                <Text style={styles.statLabel}>Mosques</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{summary.scheduleUpdatesCount}</Text>
                <Text style={styles.statLabel}>Timetables</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{summary.facilitySuggestionsCount}</Text>
                <Text style={styles.statLabel}>Facilities</Text>
              </View>
              <View style={styles.statBox}>
                <Text style={styles.statNumber}>{summary.issueReportsCount}</Text>
                <Text style={styles.statLabel}>Reports</Text>
              </View>
            </View>

            {/* Activity History */}
            <Text style={styles.sectionTitle}>Submission Provenance History</Text>
            {history.map((item) => (
              <View key={item.id} style={styles.historyCard}>
                <View style={styles.historyMain}>
                  <Text style={styles.historyTarget} numberOfLines={1}>
                    {item.targetName}
                  </Text>
                  <Text style={styles.historyLocation}>{item.location}</Text>
                </View>
                <View style={styles.historyBadgeCol}>
                  <View
                    style={[
                      styles.statusPill,
                      item.status === 'APPROVED' && styles.statusApproved,
                      item.status === 'PENDING' && styles.statusPending,
                      item.status === 'REJECTED' && styles.statusRejected,
                    ]}
                  >
                    <Text
                      style={[
                        styles.statusText,
                        item.status === 'APPROVED' && styles.statusTextApproved,
                        item.status === 'PENDING' && styles.statusTextPending,
                        item.status === 'REJECTED' && styles.statusTextRejected,
                      ]}
                    >
                      {item.status}
                    </Text>
                  </View>
                  <Text style={styles.pointsEarned}>+{item.pointsEarned} Pts</Text>
                </View>
              </View>
            ))}
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
    paddingHorizontal: 20,
    paddingTop: 18,
    paddingBottom: 14,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e8e8ea',
  },
  titleRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  titleIcon: {
    fontSize: 18,
  },
  title: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
  },
  subtitle: {
    fontSize: 12,
    color: '#6e6e73',
    marginTop: 2,
  },
  closeBtn: {
    fontSize: 18,
    color: '#6e6e73',
    fontWeight: '600',
    padding: 4,
  },
  body: {
    paddingHorizontal: 20,
    paddingTop: 14,
  },
  heroCard: {
    backgroundColor: '#111114',
    borderRadius: 14,
    padding: 16,
    marginBottom: 14,
  },
  heroHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  tierPill: {
    backgroundColor: '#d97706',
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 3,
  },
  tierPillText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '800',
    letterSpacing: 0.5,
  },
  pointsText: {
    color: '#10b981',
    fontSize: 18,
    fontWeight: '800',
  },
  rankTitle: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
    marginTop: 8,
    marginBottom: 10,
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#10b981',
    borderRadius: 3,
  },
  progressLabel: {
    color: '#9ca3af',
    fontSize: 11,
    marginTop: 6,
  },
  grid: {
    flexDirection: 'row',
    gap: 8,
    marginBottom: 16,
  },
  statBox: {
    flex: 1,
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: 'center',
  },
  statNumber: {
    fontSize: 16,
    fontWeight: '700',
    color: '#111114',
  },
  statLabel: {
    fontSize: 10,
    color: '#6e6e73',
    marginTop: 2,
    fontWeight: '500',
  },
  sectionTitle: {
    fontSize: 13,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  historyCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 10,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f4f4f5',
  },
  historyMain: {
    flex: 1,
    paddingRight: 10,
  },
  historyTarget: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111114',
  },
  historyLocation: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 2,
  },
  historyBadgeCol: {
    alignItems: 'flex-end',
    gap: 3,
  },
  statusPill: {
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    backgroundColor: '#f4f4f5',
  },
  statusApproved: {
    backgroundColor: '#ecfdf5',
  },
  statusPending: {
    backgroundColor: '#fffbeb',
  },
  statusRejected: {
    backgroundColor: '#fef2f2',
  },
  statusText: {
    fontSize: 9,
    fontWeight: '700',
  },
  statusTextApproved: {
    color: '#059669',
  },
  statusTextPending: {
    color: '#d97706',
  },
  statusTextRejected: {
    color: '#dc2626',
  },
  pointsEarned: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
});
