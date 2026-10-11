import React, { useEffect, useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { OfflineOutboxService } from '../services/offlineOutboxService';

export const OutboxSyncBadge: React.FC = () => {
  const [pendingCount, setPendingCount] = useState<number>(() => OfflineOutboxService.getPendingCount());
  const [isSyncing, setIsSyncing] = useState<boolean>(false);

  useEffect(() => {
    return OfflineOutboxService.subscribe((count) => {
      setPendingCount(count);
    });
  }, []);

  if (pendingCount === 0) {
    return null;
  }

  const handleManualSync = async () => {
    if (isSyncing) return;
    setIsSyncing(true);
    try {
      await OfflineOutboxService.drainOutbox();
    } finally {
      setIsSyncing(false);
    }
  };

  return (
    <TouchableOpacity
      style={styles.container}
      onPress={handleManualSync}
      activeOpacity={0.8}
      accessibilityRole="button"
      accessibilityLabel={`Sync ${pendingCount} offline contributions`}
    >
      <View style={styles.content}>
        {isSyncing ? (
          <ActivityIndicator size="small" color="#0369a1" style={styles.spinner} />
        ) : (
          <Text style={styles.icon}>🔄</Text>
        )}
        <Text style={styles.text}>
          {isSyncing
            ? 'Syncing offline edits to BD Masjid...'
            : `${pendingCount} contribution${pendingCount > 1 ? 's' : ''} queued offline · Tap to sync`}
        </Text>
      </View>
      <View style={styles.badgePill}>
        <Text style={styles.badgeText}>{pendingCount}</Text>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#f0f9ff',
    borderColor: '#bae6fd',
    borderWidth: 1,
    borderRadius: 8,
    marginHorizontal: 16,
    marginTop: 6,
    marginBottom: 4,
    paddingHorizontal: 12,
    paddingVertical: 7,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  spinner: {
    marginRight: 8,
  },
  icon: {
    fontSize: 13,
    marginRight: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '600',
    color: '#0369a1',
    flex: 1,
  },
  badgePill: {
    backgroundColor: '#0284c7',
    paddingHorizontal: 7,
    paddingVertical: 2,
    borderRadius: 10,
    marginLeft: 8,
  },
  badgeText: {
    color: '#ffffff',
    fontSize: 11,
    fontWeight: '700',
  },
});
