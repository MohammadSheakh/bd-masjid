import React, { useState, useEffect, useRef, useMemo } from 'react';
import {
  StyleSheet,
  View,
  Text,
  Pressable,
  Platform,
} from 'react-native';
import { Mosque } from '../types/mosque';
import { ferioColors, ferioRadius, ferioSpacing } from '../theme/tokens';

interface MosqueMapViewProps {
  mosques: Mosque[];
  followedIds: string[];
  selectedMosqueId?: string | null;
  onSelectMosque: (mosque: Mosque) => void;
  onLocateMe?: () => void;
  onPinDropped?: (coords: { lat: number; lng: number }) => void;
}

export const MosqueMapView: React.FC<MosqueMapViewProps> = ({
  mosques,
  followedIds,
  selectedMosqueId,
  onSelectMosque,
  onLocateMe,
  onPinDropped,
}) => {
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [pinnedCoords, setPinnedCoords] = useState<{ lat: number; lng: number } | null>(null);
  const iframeRef = useRef<any>(null);

  // Listen for iframe events (marker click, pin drop)
  useEffect(() => {
    if (Platform.OS !== 'web' || typeof window === 'undefined') return;

    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SELECT_MOSQUE') {
        const found = mosques.find((m) => m.id === event.data.id);
        if (found) {
          onSelectMosque(found);
        }
      } else if (event.data?.type === 'PIN_DROPPED') {
        const coords = { lat: event.data.lat, lng: event.data.lng };
        setPinnedCoords(coords);
        onPinDropped?.(coords);
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [mosques, onSelectMosque, onPinDropped]);

  // Handle GPS Locate Me action
  const handleLocateMe = () => {
    if (typeof navigator !== 'undefined' && navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          const lat = pos.coords.latitude;
          const lng = pos.coords.longitude;
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'LOCATE_USER', lat, lng },
            '*'
          );
          onLocateMe?.();
        },
        () => {
          // Fallback to central Dhaka
          iframeRef.current?.contentWindow?.postMessage(
            { type: 'LOCATE_USER', lat: 23.75, lng: 90.39 },
            '*'
          );
          onLocateMe?.();
        },
        { timeout: 8000 }
      );
    } else {
      onLocateMe?.();
    }
  };

  // Generate interactive Leaflet HTML with OpenStreetMap tiles
  const leafletHtml = useMemo(() => {
    const serializedMosques = JSON.stringify(
      mosques.map((m) => ({
        id: m.id,
        name: m.name,
        lat: m.latitude,
        lng: m.longitude,
        city: m.city || 'Dhaka',
        isFollowed: followedIds.includes(m.id),
        isSelected: selectedMosqueId === m.id,
      }))
    );

    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no" />
  <link rel="stylesheet" href="https://unpkg.com/leaflet@1.9.4/dist/leaflet.css" />
  <script src="https://unpkg.com/leaflet@1.9.4/dist/leaflet.js"></script>
  <style>
    html, body, #map {
      width: 100%;
      height: 100%;
      margin: 0;
      padding: 0;
      background-color: #f4f4f5;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      touch-action: pan-x pan-y;
    }
    .custom-mosque-pin {
      display: flex;
      align-items: center;
      justify-content: center;
      background-color: #111114;
      color: white;
      border-radius: 9999px;
      border: 2px solid white;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.25);
      cursor: pointer;
      transition: transform 0.15s ease, background-color 0.15s ease;
    }
    .custom-mosque-pin.followed {
      width: 34px;
      height: 34px;
    }
    .custom-mosque-pin.unfollowed {
      width: 22px;
      height: 22px;
      background-color: #27272a;
      border: 1.5px solid #f4f4f5;
    }
    .custom-mosque-pin.active {
      background-color: #059669;
      border-color: #ecfdf5;
      transform: scale(1.18);
    }
    .leaflet-popup-content-wrapper {
      border-radius: 12px;
      box-shadow: 0 8px 24px rgba(0, 0, 0, 0.15);
      padding: 4px;
    }
    .leaflet-popup-content {
      margin: 10px 12px;
      font-size: 13px;
      line-height: 1.4;
    }
    .user-gps-marker {
      width: 16px;
      height: 16px;
      background: #2563eb;
      border: 3px solid white;
      border-radius: 50%;
      box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.25);
    }
  </style>
</head>
<body>
  <div id="map"></div>
  <script>
    var mosques = ${serializedMosques};
    var isPinDropMode = ${isPinDropMode ? 'true' : 'false'};
    var defaultCenter = [23.75, 90.39];

    var map = L.map('map', {
      center: defaultCenter,
      zoom: 13,
      zoomControl: false,
    });

    L.control.zoom({ position: 'topright' }).addTo(map);

    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution: '&copy; OpenStreetMap contributors'
    }).addTo(map);

    var markersLayer = L.layerGroup().addTo(map);
    var userMarker = null;
    var dropMarker = null;

    mosques.forEach(function(m) {
      var icon = L.divIcon({
        className: 'mosque-pin-container',
        html: '<div class="custom-mosque-pin ' + (m.isFollowed ? 'followed' : 'unfollowed') + (m.isSelected ? ' active' : '') + '">' +
              '<span style="font-size:' + (m.isFollowed ? '14px' : '9px') + ';line-height:1;">🕌</span>' +
              '</div>',
        iconSize: m.isFollowed ? [34, 34] : [22, 22],
        iconAnchor: m.isFollowed ? [17, 17] : [11, 11]
      });

      var marker = L.marker([m.lat, m.lng], {
        icon: icon,
        zIndexOffset: m.isSelected ? 1000 : (m.isFollowed ? 50 : 10)
      });

      marker.bindTooltip(
        '<strong>' + m.name + '</strong>' + (m.isFollowed ? ' <span style="color:#059669;font-size:11px;">(Followed)</span>' : '') + '<br/><span style="color:#6e6e73;font-size:11px;">' + m.city + '</span>',
        { direction: 'top', offset: [0, -10] }
      );

      marker.on('click', function() {
        window.parent.postMessage({ type: 'SELECT_MOSQUE', id: m.id }, '*');
      });

      markersLayer.addLayer(marker);
    });

    map.on('click', function(e) {
      if (isPinDropMode) {
        if (dropMarker) {
          dropMarker.setLatLng(e.latlng);
        } else {
          var pinIcon = L.divIcon({
            html: '<div style="background:#ef4444;color:white;width:30px;height:30px;border-radius:50% 50% 50% 0;transform:rotate(-45deg);display:flex;align-items:center;justify-content:center;box-shadow:0 4px 10px rgba(0,0,0,0.3);border:2px solid white;"><span style="transform:rotate(45deg);font-size:14px;">📍</span></div>',
            iconSize: [30, 30],
            iconAnchor: [15, 30]
          });
          dropMarker = L.marker(e.latlng, { icon: pinIcon, draggable: true }).addTo(map);
          dropMarker.on('dragend', function(ev) {
            var pos = ev.target.getLatLng();
            window.parent.postMessage({ type: 'PIN_DROPPED', lat: pos.lat, lng: pos.lng }, '*');
          });
        }
        window.parent.postMessage({ type: 'PIN_DROPPED', lat: e.latlng.lat, lng: e.latlng.lng }, '*');
      }
    });

    window.addEventListener('message', function(ev) {
      if (!ev.data) return;
      if (ev.data.type === 'LOCATE_USER') {
        var pos = [ev.data.lat, ev.data.lng];
        if (!userMarker) {
          var userIcon = L.divIcon({
            html: '<div class="user-gps-marker"></div>',
            iconSize: [16, 16],
            iconAnchor: [8, 8]
          });
          userMarker = L.marker(pos, { icon: userIcon, zIndexOffset: 2000 }).addTo(map);
        } else {
          userMarker.setLatLng(pos);
        }
        map.setView(pos, 15, { animate: true });
      }
    });
  </script>
</body>
</html>`;
  }, [mosques, followedIds, selectedMosqueId, isPinDropMode]);

  return (
    <View style={styles.container}>
      {/* Full-Page Interactive Leaflet Map */}
      {Platform.OS === 'web' ? (
        <iframe
          ref={iframeRef}
          srcDoc={leafletHtml}
          style={styles.iframeMap as any}
          title="BD Mosque Interactive OpenStreetMap"
        />
      ) : (
        <View style={styles.fallbackCanvas}>
          <Text style={styles.fallbackText}>Interactive Map Active</Text>
        </View>
      )}

      {/* Pin Drop Active Instruction Badge */}
      {isPinDropMode && (
        <View style={styles.pinDropNotice}>
          <Text style={styles.pinDropNoticeText}>
            📍 Tap anywhere on map to drop mosque pin
          </Text>
        </View>
      )}

      {/* Floating Bottom Control Actions */}
      <View style={styles.floatingControls}>
        <Pressable
          style={[styles.floatingBtn, isPinDropMode && styles.floatingBtnActive]}
          onPress={() => setIsPinDropMode((prev) => !prev)}
          accessibilityRole="button"
        >
          <Text style={[styles.floatingBtnText, isPinDropMode && styles.floatingBtnTextActive]}>
            {isPinDropMode ? '✕ Cancel Pin' : '+ Drop Mosque Pin'}
          </Text>
        </Pressable>

        <Pressable
          style={styles.floatingBtn}
          onPress={handleLocateMe}
          accessibilityRole="button"
        >
          <Text style={styles.floatingBtnText}>🎯 Locate Me</Text>
        </Pressable>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    width: '100%',
    height: '100%',
    position: 'relative',
    backgroundColor: ferioColors.surface,
  },
  iframeMap: {
    width: '100%',
    height: '100%',
    borderWidth: 0,
    margin: 0,
    padding: 0,
    flex: 1,
  },
  fallbackCanvas: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
  },
  fallbackText: {
    fontSize: 14,
    color: ferioColors.muted,
  },
  pinDropNotice: {
    position: 'absolute',
    top: 76,
    alignSelf: 'center',
    zIndex: 900,
    backgroundColor: '#111114',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: ferioRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  pinDropNoticeText: {
    color: '#ffffff',
    fontSize: 12,
    fontWeight: '600',
  },
  floatingControls: {
    position: 'absolute',
    bottom: 84,
    left: ferioSpacing.md,
    right: ferioSpacing.md,
    flexDirection: 'row',
    justifyContent: 'space-between',
    zIndex: 800,
    pointerEvents: 'box-none',
  },
  floatingBtn: {
    backgroundColor: '#ffffff',
    paddingHorizontal: 16,
    paddingVertical: 10,
    borderRadius: ferioRadius.full,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.15,
    shadowRadius: 6,
    elevation: 5,
    borderWidth: 1,
    borderColor: ferioColors.border,
  },
  floatingBtnActive: {
    backgroundColor: '#111114',
    borderColor: '#111114',
  },
  floatingBtnText: {
    fontSize: 13,
    fontWeight: '600',
    color: ferioColors.primary,
  },
  floatingBtnTextActive: {
    color: '#ffffff',
  },
});
