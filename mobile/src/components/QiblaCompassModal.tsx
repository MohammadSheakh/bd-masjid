import React, { useState, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Modal,
  Pressable,
  Dimensions,
} from 'react-native';
import { QiblaService, BANGLADESH_DEFAULT_COORDS } from '../services/qiblaService';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');
const DIAL_SIZE = Math.min(SCREEN_WIDTH - 64, 280);

interface QiblaCompassModalProps {
  visible: boolean;
  userCoords?: { latitude: number; longitude: number };
  onClose: () => void;
}

export const QiblaCompassModal: React.FC<QiblaCompassModalProps> = ({
  visible,
  userCoords = BANGLADESH_DEFAULT_COORDS,
  onClose,
}) => {
  const [deviceHeading, setDeviceHeading] = useState(0);

  const qiblaBearing = useMemo(() => {
    return Math.round(
      QiblaService.calculateQiblaBearing(userCoords.latitude, userCoords.longitude) * 10
    ) / 10;
  }, [userCoords.latitude, userCoords.longitude]);

  const distanceKm = useMemo(() => {
    return QiblaService.calculateDistanceToKaabaKm(userCoords.latitude, userCoords.longitude);
  }, [userCoords.latitude, userCoords.longitude]);

  const isAligned = useMemo(() => {
    return QiblaService.isQiblaAligned(deviceHeading, qiblaBearing, 3.5);
  }, [deviceHeading, qiblaBearing]);

  const relativeKaabaAngle = useMemo(() => {
    return QiblaService.getRelativeKaabaAngle(deviceHeading, qiblaBearing);
  }, [deviceHeading, qiblaBearing]);

  const rotateBy = (delta: number) => {
    setDeviceHeading((prev) => (prev + delta + 360) % 360);
  };

  return (
    <Modal visible={visible} animationType="slide" transparent onRequestClose={onClose}>
      <View style={styles.backdrop}>
        <View style={styles.sheetContainer}>
          {/* Header */}
          <View style={styles.header}>
            <View>
              <Text style={styles.headerTitle}>Qibla Compass</Text>
              <Text style={styles.headerSubtitle}>
                Kaaba Azimuth: {qiblaBearing}° (WNW) • {distanceKm.toLocaleString()} km
              </Text>
            </View>
            <Pressable onPress={onClose} hitSlop={12} style={styles.closeBtn}>
              <Text style={styles.closeBtnText}>✕</Text>
            </Pressable>
          </View>

          <View style={styles.body}>
            {/* Alignment Status Banner */}
            <View style={[styles.statusBox, isAligned && styles.statusBoxAligned]}>
              <Text style={styles.statusIcon}>{isAligned ? '🕋' : '🧭'}</Text>
              <View style={{ flex: 1 }}>
                <Text style={[styles.statusTitle, isAligned && styles.statusTitleAligned]}>
                  {isAligned ? 'Facing Kaaba (Qibla Aligned)' : 'Aligning Qibla Direction'}
                </Text>
                <Text style={styles.statusSub}>
                  {isAligned
                    ? 'Perfect alignment! You may establish prayer.'
                    : `Rotate device to ${qiblaBearing}° (Current heading: ${Math.round(deviceHeading)}°)`}
                </Text>
              </View>
            </View>

            {/* Circular Compass Dial */}
            <View style={styles.compassContainer}>
              <View
                style={[
                  styles.dialOuter,
                  isAligned && styles.dialOuterAligned,
                  { transform: [{ rotate: `-${deviceHeading}deg` }] },
                ]}
              >
                {/* Cardinal Points */}
                <Text style={[styles.cardinalText, styles.north]}>N</Text>
                <Text style={[styles.cardinalText, styles.east]}>E</Text>
                <Text style={[styles.cardinalText, styles.south]}>S</Text>
                <Text style={[styles.cardinalText, styles.west]}>W</Text>

                {/* Kaaba Direction Marker on Dial */}
                <View
                  style={[
                    styles.kaabaMarkerWrapper,
                    { transform: [{ rotate: `${qiblaBearing}deg` }] },
                  ]}
                >
                  <View style={styles.kaabaPill}>
                    <Text style={styles.kaabaPillText}>🕋 Qibla</Text>
                  </View>
                </View>
              </View>

              {/* Fixed Center Pointer Needle */}
              <View style={styles.centerNeedleWrapper} pointerEvents="none">
                <View
                  style={[
                    styles.needlePointer,
                    { transform: [{ rotate: `${relativeKaabaAngle}deg` }] },
                  ]}
                >
                  <View style={[styles.needleTip, isAligned && styles.needleTipAligned]} />
                  <View style={styles.needleShaft} />
                </View>
                <View style={[styles.needleCenterDot, isAligned && styles.needleCenterDotAligned]} />
              </View>
            </View>

            {/* Heading Calibration & Rotation Controls */}
            <View style={styles.calibrationRow}>
              <Pressable
                style={styles.calibBtn}
                onPress={() => rotateBy(-15)}
                accessibilityRole="button"
                accessibilityLabel="Rotate compass left 15 degrees"
              >
                <Text style={styles.calibBtnText}>↺ -15°</Text>
              </Pressable>

              <Pressable
                style={[styles.calibBtn, styles.calibBtnPrimary]}
                onPress={() => setDeviceHeading(Math.round(qiblaBearing))}
                accessibilityRole="button"
                accessibilityLabel="Align exactly with Qibla"
              >
                <Text style={styles.calibBtnTextPrimary}>🎯 Snap to Qibla</Text>
              </Pressable>

              <Pressable
                style={styles.calibBtn}
                onPress={() => rotateBy(15)}
                accessibilityRole="button"
                accessibilityLabel="Rotate compass right 15 degrees"
              >
                <Text style={styles.calibBtnText}>+15° ↻</Text>
              </Pressable>
            </View>

            {/* Subtitle Footnote */}
            <Text style={styles.footerNote}>
              Great-Circle Bearing based on GPS {userCoords.latitude.toFixed(2)}°N, {userCoords.longitude.toFixed(2)}°E.
            </Text>
          </View>
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
    maxHeight: '88%',
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
  },
  closeBtn: {
    padding: ferioSpacing.xs,
  },
  closeBtnText: {
    fontSize: 16,
    color: ferioColors.muted,
  },
  body: {
    padding: ferioSpacing.lg,
    alignItems: 'center',
  },
  statusBox: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: ferioColors.canvas,
    borderWidth: 1,
    borderColor: ferioColors.border,
    borderRadius: ferioRadius.md,
    padding: ferioSpacing.md,
    width: '100%',
    marginBottom: ferioSpacing.lg,
  },
  statusBoxAligned: {
    backgroundColor: '#ecfdf5',
    borderColor: '#10b981',
  },
  statusIcon: {
    fontSize: 24,
    marginRight: ferioSpacing.md,
  },
  statusTitle: {
    fontSize: 14,
    fontWeight: '700',
    color: ferioColors.primary,
  },
  statusTitleAligned: {
    color: '#065f46',
  },
  statusSub: {
    fontSize: 11,
    color: ferioColors.muted,
    marginTop: 2,
  },
  compassContainer: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
    marginVertical: ferioSpacing.md,
  },
  dialOuter: {
    width: DIAL_SIZE,
    height: DIAL_SIZE,
    borderRadius: DIAL_SIZE / 2,
    backgroundColor: ferioColors.canvas,
    borderWidth: 3,
    borderColor: ferioColors.border,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'relative',
  },
  dialOuterAligned: {
    borderColor: '#10b981',
    backgroundColor: '#f0fdf4',
  },
  cardinalText: {
    position: 'absolute',
    fontSize: 13,
    fontWeight: '800',
    color: ferioColors.primary,
  },
  north: {
    top: 8,
    color: '#dc2626',
  },
  east: {
    right: 12,
  },
  south: {
    bottom: 8,
  },
  west: {
    left: 12,
  },
  kaabaMarkerWrapper: {
    position: 'absolute',
    width: '100%',
    height: '100%',
    alignItems: 'center',
  },
  kaabaPill: {
    backgroundColor: '#059669',
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
    top: 2,
  },
  kaabaPillText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '700',
  },
  centerNeedleWrapper: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
  },
  needlePointer: {
    width: 6,
    height: DIAL_SIZE * 0.72,
    alignItems: 'center',
  },
  needleTip: {
    width: 0,
    height: 0,
    borderLeftWidth: 8,
    borderRightWidth: 8,
    borderBottomWidth: 32,
    borderLeftColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: '#111114',
  },
  needleTipAligned: {
    borderBottomColor: '#059669',
  },
  needleShaft: {
    width: 3,
    flex: 1,
    backgroundColor: '#d1d5db',
  },
  needleCenterDot: {
    position: 'absolute',
    width: 14,
    height: 14,
    borderRadius: 7,
    backgroundColor: ferioColors.primary,
    borderWidth: 2,
    borderColor: '#ffffff',
  },
  needleCenterDotAligned: {
    backgroundColor: '#059669',
  },
  calibrationRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    width: '100%',
    marginTop: ferioSpacing.md,
  },
  calibBtn: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.sm,
    backgroundColor: ferioColors.canvas,
    borderRadius: ferioRadius.md,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  calibBtnPrimary: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  calibBtnText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  calibBtnTextPrimary: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primaryForeground,
  },
  footerNote: {
    fontSize: 10,
    color: ferioColors.muted,
    textAlign: 'center',
    marginTop: ferioSpacing.md,
  },
});
