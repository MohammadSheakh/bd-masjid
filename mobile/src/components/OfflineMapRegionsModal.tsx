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
import { OfflineMapRegion, OfflineStorageSummary } from '../types/offlineMap';
import { OfflineMapRegionService } from '../services/offlineMapRegionService';

interface OfflineMapRegionsModalProps {
  visible: boolean;
  onClose: () => void;
  isBangla?: boolean;
}

export const OfflineMapRegionsModal: React.FC<OfflineMapRegionsModalProps> = ({
  visible,
  onClose,
  isBangla = true,
}) => {
  const [regions, setRegions] = useState<OfflineMapRegion[]>(() =>
    OfflineMapRegionService.getRegionsSync()
  );
  const [summary, setSummary] = useState<OfflineStorageSummary>(() =>
    OfflineMapRegionService.getStorageSummarySync()
  );

  useEffect(() => {
    if (!visible) return;
    const unsub = OfflineMapRegionService.subscribe((updatedRegions, updatedSummary) => {
      setRegions(updatedRegions);
      setSummary(updatedSummary);
    });
    return unsub;
  }, [visible]);

  const handleDownload = (regionId: string) => {
    OfflineMapRegionService.downloadRegion(regionId);
  };

  const handleDelete = (regionId: string) => {
    OfflineMapRegionService.deleteRegion(regionId);
  };

  const usagePercent = Math.min(
    100,
    Math.round((summary.usedMb / summary.budgetMb) * 100)
  );

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.titleRow}>
                <Text style={styles.titleIcon}>🗺️</Text>
                <Text style={styles.title}>
                  {isBangla ? 'অফলাইন ম্যাপ অঞ্চল' : 'Offline Map Regions'}
                </Text>
              </View>
              <Text style={styles.subtitle}>
                {isBangla
                  ? 'লোডশেডিং ও নেটওয়ার্কবিহীন অবস্থায় ব্যবহারের জন্য প্রাক-ডাউনলোড'
                  : 'Pre-cache regional map vector tiles for disconnected field ops'}
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* Storage Usage Card */}
            <View style={styles.storageCard}>
              <View style={styles.storageHeader}>
                <Text style={styles.storageLabel}>
                  {isBangla ? 'ডিভাইস স্টোরেজ ব্যবহার' : 'Device Storage Usage'}
                </Text>
                <Text style={styles.storageValue}>
                  {summary.usedMb} MB / {summary.budgetMb} MB
                </Text>
              </View>
              <View style={styles.progressBarTrack}>
                <View style={[styles.progressBarFill, { width: `${usagePercent}%` }]} />
              </View>
              <Text style={styles.storageHint}>
                {isBangla
                  ? `${summary.downloadedRegionsCount}টি বিভাগ অফলাইনে উপলব্ধ · সর্বোচ্চ সীমা ১৫০ মেগাবাইট`
                  : `${summary.downloadedRegionsCount} divisions cached offline · 150 MB ceiling`}
              </Text>
            </View>

            {/* Region List */}
            <Text style={styles.sectionTitle}>
              {isBangla ? 'বাংলাদেশ প্রশাসনিক বিভাগসমূহ' : 'Bangladeshi Administrative Divisions'}
            </Text>

            {regions.map((reg) => (
              <View key={reg.id} style={styles.regionCard}>
                <View style={styles.regionMeta}>
                  <Text style={styles.regionName}>
                    {isBangla ? reg.nameBangla : reg.nameEnglish}
                  </Text>
                  <Text style={styles.regionStats}>
                    {reg.sizeMb} MB · ~{reg.estimatedTiles.toLocaleString()} {isBangla ? 'টাইলস' : 'tiles'}
                  </Text>
                  {reg.status === 'DOWNLOADING' && (
                    <View style={styles.downloadProgressTrack}>
                      <View style={[styles.downloadProgressFill, { width: `${reg.progressPercent}%` }]} />
                    </View>
                  )}
                </View>

                <View style={styles.regionActionCol}>
                  {reg.status === 'DOWNLOADED' ? (
                    <View style={styles.downloadedActions}>
                      <Text style={styles.cachedBadge}>✓ {isBangla ? 'সংরক্ষিত' : 'Cached'}</Text>
                      <TouchableOpacity
                        onPress={() => handleDelete(reg.id)}
                        hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                      >
                        <Text style={styles.deleteBtnText}>{isBangla ? 'মুছুন' : 'Delete'}</Text>
                      </TouchableOpacity>
                    </View>
                  ) : reg.status === 'DOWNLOADING' ? (
                    <View style={styles.downloadingCol}>
                      <ActivityIndicator size="small" color="#059669" />
                      <Text style={styles.downloadingText}>{reg.progressPercent}%</Text>
                    </View>
                  ) : (
                    <TouchableOpacity
                      style={styles.downloadBtn}
                      onPress={() => handleDownload(reg.id)}
                    >
                      <Text style={styles.downloadBtnText}>⬇ {isBangla ? 'ডাউনলোড' : 'Download'}</Text>
                    </TouchableOpacity>
                  )}
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
  storageCard: {
    backgroundColor: '#fafafa',
    borderWidth: 1,
    borderColor: '#e8e8ea',
    borderRadius: 12,
    padding: 14,
    marginBottom: 16,
  },
  storageHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  storageLabel: {
    fontSize: 13,
    fontWeight: '600',
    color: '#111114',
  },
  storageValue: {
    fontSize: 13,
    fontWeight: '700',
    color: '#059669',
  },
  progressBarTrack: {
    height: 6,
    backgroundColor: '#e4e4e7',
    borderRadius: 3,
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    backgroundColor: '#059669',
    borderRadius: 3,
  },
  storageHint: {
    fontSize: 11,
    color: '#71717a',
    marginTop: 6,
  },
  sectionTitle: {
    fontSize: 12,
    fontWeight: '700',
    color: '#111114',
    marginBottom: 10,
    textTransform: 'uppercase',
    letterSpacing: 0.4,
  },
  regionCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 12,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f4f4f5',
  },
  regionMeta: {
    flex: 1,
    paddingRight: 10,
  },
  regionName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#111114',
  },
  regionStats: {
    fontSize: 11,
    color: '#6e6e73',
    marginTop: 2,
  },
  downloadProgressTrack: {
    height: 4,
    backgroundColor: '#e4e4e7',
    borderRadius: 2,
    marginTop: 6,
    overflow: 'hidden',
  },
  downloadProgressFill: {
    height: '100%',
    backgroundColor: '#059669',
  },
  regionActionCol: {
    alignItems: 'flex-end',
  },
  downloadedActions: {
    alignItems: 'flex-end',
    gap: 4,
  },
  cachedBadge: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
  },
  deleteBtnText: {
    fontSize: 11,
    color: '#dc2626',
    fontWeight: '500',
  },
  downloadingCol: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  downloadingText: {
    fontSize: 11,
    fontWeight: '700',
    color: '#059669',
  },
  downloadBtn: {
    backgroundColor: '#111114',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 6,
  },
  downloadBtnText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
