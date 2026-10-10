import React, { useEffect, useState } from 'react';
import {
  Modal,
  StyleSheet,
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  Alert,
} from 'react-native';
import { DeviceHardwareMetrics } from '../types/diagnostics';
import { DiagnosticsService } from '../services/diagnosticsService';

interface DiagnosticsTelemetryModalProps {
  visible: boolean;
  onClose: () => void;
}

export const DiagnosticsTelemetryModal: React.FC<DiagnosticsTelemetryModalProps> = ({
  visible,
  onClose,
}) => {
  const [metrics, setMetrics] = useState<DeviceHardwareMetrics>(() =>
    DiagnosticsService.getMetricsSnapshot()
  );

  useEffect(() => {
    if (!visible) return;
    const stopSampling = DiagnosticsService.startFrameSampling((updated) => {
      setMetrics(updated);
    });
    return stopSampling;
  }, [visible]);

  const handleCopyReport = () => {
    const report = DiagnosticsService.generateSanitizedReport();
    const markdown = DiagnosticsService.formatReportMarkdown(report);
    Alert.alert(
      'Sanitized Diagnostics Report',
      `${markdown}\n\n[Report ready to attach to GitHub Issue]`,
      [{ text: 'OK' }]
    );
  };

  const framePercent = Math.min(100, Math.round((metrics.frameTimeMs / 16.6) * 100));
  const heapPercent = Math.min(100, Math.round((metrics.heapUsedMb / metrics.heapBudgetMb) * 100));

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <View style={styles.headerTitleRow}>
                <Text style={styles.boltIcon}>⚡</Text>
                <Text style={styles.headerTitle}>Hardware Diagnostics</Text>
              </View>
              <Text style={styles.headerSubtitle}>
                Low-End Hardware Profiler · Walton / Redmi Budget
              </Text>
            </View>
            <TouchableOpacity onPress={onClose} hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}>
              <Text style={styles.closeBtn}>✕</Text>
            </TouchableOpacity>
          </View>

          <ScrollView style={styles.body} showsVerticalScrollIndicator={false}>
            {/* FPS Badge & Frame Time Gauge */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View>
                  <Text style={styles.metricLabel}>Render Frame Rate</Text>
                  <Text style={styles.metricValue}>
                    {metrics.fps} FPS <Text style={styles.metricSub}>({metrics.frameTimeMs}ms)</Text>
                  </Text>
                </View>
                <View style={[styles.fpsBadge, metrics.fps >= 55 ? styles.fpsGood : styles.fpsWarn]}>
                  <Text style={styles.fpsBadgeText}>{metrics.fps >= 55 ? '🟢 60 FPS Smooth' : '🟡 Dropped'}</Text>
                </View>
              </View>
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeFill, { width: `${framePercent}%` }]} />
              </View>
              <Text style={styles.gaugeNote}>{metrics.frameTimeMs}ms of 16.6ms max budget (60 FPS gate)</Text>
            </View>

            {/* Heap Memory Gauge */}
            <View style={styles.metricCard}>
              <View style={styles.metricCardHeader}>
                <View>
                  <Text style={styles.metricLabel}>Heap Memory Usage</Text>
                  <Text style={styles.metricValue}>
                    {metrics.heapUsedMb} MB <Text style={styles.metricSub}>/ {metrics.heapBudgetMb} MB budget</Text>
                  </Text>
                </View>
                <View style={styles.memBadge}>
                  <Text style={styles.memBadgeText}>✓ RAM Safe</Text>
                </View>
              </View>
              <View style={styles.gaugeTrack}>
                <View style={[styles.gaugeFill, styles.gaugeFillGreen, { width: `${heapPercent}%` }]} />
              </View>
              <Text style={styles.gaugeNote}>
                {heapPercent}% of low-end hardware ceiling utilized
              </Text>
            </View>

            {/* Hardware & Network Grid */}
            <View style={styles.gridRow}>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Cold Hydration</Text>
                <Text style={styles.gridVal}>{metrics.coldLaunchMs}ms</Text>
                <Text style={styles.gridSub}>Budget: &lt;1500ms</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Roundtrip Latency</Text>
                <Text style={styles.gridVal}>{metrics.networkLatencyMs}ms</Text>
                <Text style={styles.gridSub}>Fast 4G / Local</Text>
              </View>
            </View>

            <View style={styles.gridRow}>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Offline Outbox</Text>
                <Text style={styles.gridVal}>{metrics.outboxPendingCount}</Text>
                <Text style={styles.gridSub}>Queued Mutations</Text>
              </View>
              <View style={styles.gridBox}>
                <Text style={styles.gridLabel}>Platform Spec</Text>
                <Text style={styles.gridVal} numberOfLines={1}>{metrics.osPlatform}</Text>
                <Text style={styles.gridSub}>Low-Mem Profile: ✓</Text>
              </View>
            </View>

            {/* Export Diagnostic Report Action */}
            <TouchableOpacity style={styles.exportBtn} onPress={handleCopyReport} activeOpacity={0.8}>
              <Text style={styles.exportBtnText}>📋 View Sanitized Diagnostic Report</Text>
            </TouchableOpacity>
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
  boltIcon: {
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
  body: {
    paddingHorizontal: 16,
    paddingTop: 8,
  },
  metricCard: {
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 12,
    padding: 14,
    marginTop: 10,
  },
  metricCardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 8,
  },
  metricLabel: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  metricValue: {
    fontSize: 18,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 2,
  },
  metricSub: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '500',
  },
  fpsBadge: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  fpsGood: {
    backgroundColor: '#ecfdf5',
  },
  fpsWarn: {
    backgroundColor: '#fffbeb',
  },
  fpsBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  memBadge: {
    backgroundColor: '#ecfdf5',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
  },
  memBadgeText: {
    fontSize: 10,
    fontWeight: '700',
    color: '#059669',
  },
  gaugeTrack: {
    height: 6,
    backgroundColor: '#f1f5f9',
    borderRadius: 3,
    overflow: 'hidden',
    marginTop: 4,
  },
  gaugeFill: {
    height: '100%',
    backgroundColor: '#0284c7',
  },
  gaugeFillGreen: {
    backgroundColor: '#059669',
  },
  gaugeNote: {
    fontSize: 11,
    color: '#94a3b8',
    marginTop: 6,
  },
  gridRow: {
    flexDirection: 'row',
    gap: 10,
    marginTop: 10,
  },
  gridBox: {
    flex: 1,
    backgroundColor: '#f8fafc',
    borderWidth: 1,
    borderColor: '#e2e8f0',
    borderRadius: 10,
    padding: 12,
  },
  gridLabel: {
    fontSize: 11,
    color: '#64748b',
    fontWeight: '600',
  },
  gridVal: {
    fontSize: 15,
    fontWeight: '700',
    color: '#0f172a',
    marginTop: 3,
  },
  gridSub: {
    fontSize: 10,
    color: '#94a3b8',
    marginTop: 2,
  },
  exportBtn: {
    backgroundColor: '#0f172a',
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: 'center',
    marginTop: 14,
    marginBottom: 8,
  },
  exportBtnText: {
    color: '#ffffff',
    fontSize: 13,
    fontWeight: '700',
  },
});
