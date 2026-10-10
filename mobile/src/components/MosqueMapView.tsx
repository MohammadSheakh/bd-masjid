import React, { useState } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Dimensions,
  Image,
} from 'react-native';
import { Mosque } from '../types/mosque';
import { MosquePin } from './MosquePin';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface MosqueMapViewProps {
  mosques: Mosque[];
  followedIds: string[];
  selectedMosqueId?: string | null;
  onSelectMosque: (mosque: Mosque) => void;
  onLocateMe?: () => void;
  onPinDropped?: (coords: { lat: number; lng: number }) => void;
  onOpenOfflineRegions?: () => void;
}

// Bounding box for Bangladesh urban focus (Dhaka center)
const CENTER_LAT = 23.7314;
const CENTER_LNG = 90.4126;
const LAT_DELTA = 0.05;
const LNG_DELTA = 0.05;
const OSM_HEADERS = { 'User-Agent': 'BDMasjidMobile/1.0' };

export const MosqueMapView: React.FC<MosqueMapViewProps> = ({
  mosques,
  followedIds,
  selectedMosqueId,
  onSelectMosque,
  onLocateMe,
  onPinDropped,
  onOpenOfflineRegions,
}) => {
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [crosshairCoords, setCrosshairCoords] = useState({
    lat: CENTER_LAT,
    lng: CENTER_LNG,
  });

  const mapHeight = 440;

  // Convert GPS lat/lng to canvas x/y offset
  const projectCoords = (lat: number, lng: number) => {
    const x = ((lng - (CENTER_LNG - LNG_DELTA / 2)) / LNG_DELTA) * SCREEN_WIDTH;
    const y = ((CENTER_LAT + LAT_DELTA / 2 - lat) / LAT_DELTA) * mapHeight;
    return {
      x: Math.max(20, Math.min(SCREEN_WIDTH - 50, x)),
      y: Math.max(30, Math.min(mapHeight - 60, y)),
    };
  };

  return (
    <View style={styles.container}>
      {/* Map Canvas with OpenStreetMap Tiles */}
      <View style={[styles.canvas, { height: mapHeight }]}>
        {/* OpenStreetMap Tile Layer (OpenStreetMap France - Free, No Block, No API Key) */}
        <View style={styles.tileGrid} pointerEvents="none">
          <View style={styles.tileRow}>
            <Image
              source={{ uri: 'https://a.tile.openstreetmap.fr/osmfr/13/6152/3567.png', headers: OSM_HEADERS }}
              style={styles.mapTile}
              resizeMode="cover"
            />
            <Image
              source={{ uri: 'https://b.tile.openstreetmap.fr/osmfr/13/6153/3567.png', headers: OSM_HEADERS }}
              style={styles.mapTile}
              resizeMode="cover"
            />
          </View>
          <View style={styles.tileRow}>
            <Image
              source={{ uri: 'https://c.tile.openstreetmap.fr/osmfr/13/6152/3568.png', headers: OSM_HEADERS }}
              style={styles.mapTile}
              resizeMode="cover"
            />
            <Image
              source={{ uri: 'https://a.tile.openstreetmap.fr/osmfr/13/6153/3568.png', headers: OSM_HEADERS }}
              style={styles.mapTile}
              resizeMode="cover"
            />
          </View>
        </View>

        {/* OpenStreetMap Attribution Pill */}
        <View style={styles.attributionPill} pointerEvents="none">
          <Text style={styles.mapAttribution}>© OpenStreetMap contributors</Text>
        </View>

        {/* Render Mosque Pins */}
        {mosques.map((mosque) => {
          const { x, y } = projectCoords(mosque.latitude, mosque.longitude);
          const isFollowed = followedIds.includes(mosque.id);
          const isSelected = selectedMosqueId === mosque.id;

          return (
            <View
              key={mosque.id}
              style={[styles.pinWrapper, { left: x, top: y }]}
            >
              <MosquePin
                mosque={mosque}
                isFollowed={isFollowed}
                isSelected={isSelected}
                onPress={onSelectMosque}
              />
            </View>
          );
        })}

        {/* Contributor Pin Drop Crosshair Target */}
        {isPinDropMode && (
          <View style={styles.crosshairOverlay} pointerEvents="none">
            <View style={styles.crosshairCenter} />
            <View style={styles.crosshairPill}>
              <Text style={styles.crosshairText}>
                {crosshairCoords.lat.toFixed(4)}, {crosshairCoords.lng.toFixed(4)}
              </Text>
            </View>
          </View>
        )}
      </View>

      {/* Floating Control Buttons */}
      <View style={styles.controlsRow}>
        <Pressable
          onPress={() => {
            if (isPinDropMode && onPinDropped) {
              onPinDropped(crosshairCoords);
              setIsPinDropMode(false);
            } else {
              setIsPinDropMode(true);
            }
          }}
          style={[styles.actionPill, isPinDropMode && styles.actionPillActive]}
          accessibilityRole="button"
          accessibilityLabel={isPinDropMode ? 'Confirm and Add Mosque at Pin' : 'Toggle Contributor Pin Drop Mode'}
        >
          <Text style={[styles.actionText, isPinDropMode && styles.actionTextActive]}>
            {isPinDropMode ? '✓ Add Mosque at Pin' : '+ Drop Mosque Pin'}
          </Text>
        </Pressable>

        {isPinDropMode && (
          <Pressable
            onPress={() => setIsPinDropMode(false)}
            style={styles.actionPill}
            accessibilityRole="button"
            accessibilityLabel="Cancel Pin Drop"
          >
            <Text style={styles.actionText}>✕ Cancel</Text>
          </Pressable>
        )}

        <Pressable
          onPress={onLocateMe}
          style={styles.actionPill}
          accessibilityRole="button"
          accessibilityLabel="Center map on current GPS location"
        >
          <Text style={styles.actionText}>⌖ Locate Me</Text>
        </Pressable>

        {onOpenOfflineRegions && (
          <Pressable
            onPress={onOpenOfflineRegions}
            style={styles.actionPill}
            accessibilityRole="button"
            accessibilityLabel="Open Offline Map Regions Manager"
          >
            <Text style={styles.actionText}>🗺️ Offline Maps</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: ferioColors.canvas,
  },
  canvas: {
    width: '100%',
    backgroundColor: '#e5e7eb',
    position: 'relative',
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: ferioColors.border,
  },
  tileGrid: {
    ...StyleSheet.absoluteFill,
    overflow: 'hidden',
  },
  tileRow: {
    flexDirection: 'row',
  },
  mapTile: {
    width: 256,
    height: 256,
  },
  attributionPill: {
    position: 'absolute',
    bottom: 6,
    right: 8,
    backgroundColor: 'rgba(255, 255, 255, 0.85)',
    paddingHorizontal: 6,
    paddingVertical: 2,
    borderRadius: 4,
    zIndex: 15,
  },
  mapAttribution: {
    fontSize: 10,
    color: '#6e6e73',
    fontWeight: '500',
  },
  pinWrapper: {
    position: 'absolute',
    transform: [{ translateX: -22 }, { translateY: -22 }],
    zIndex: 10,
  },
  crosshairOverlay: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 20,
  },
  crosshairCenter: {
    width: 24,
    height: 24,
    borderRadius: 12,
    borderWidth: 2,
    borderColor: ferioColors.primary,
    backgroundColor: 'rgba(17, 17, 20, 0.2)',
  },
  crosshairPill: {
    marginTop: ferioSpacing.xs,
    backgroundColor: ferioColors.primary,
    paddingHorizontal: ferioSpacing.sm,
    paddingVertical: 2,
    borderRadius: ferioRadius.full,
  },
  crosshairText: {
    color: '#ffffff',
    fontSize: 10,
    fontWeight: '600',
    fontVariant: ['tabular-nums'],
  },
  controlsRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: ferioSpacing.lg,
    paddingVertical: ferioSpacing.sm,
    backgroundColor: ferioColors.canvas,
  },
  actionPill: {
    paddingHorizontal: ferioSpacing.md,
    paddingVertical: ferioSpacing.xs + 2,
    borderRadius: ferioRadius.full,
    backgroundColor: ferioColors.surface,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  actionPillActive: {
    backgroundColor: ferioColors.primary,
    borderColor: ferioColors.primary,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  actionTextActive: {
    color: ferioColors.primaryForeground,
  },
});
