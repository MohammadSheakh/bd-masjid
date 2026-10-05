'use client';

import React, { useEffect, useRef } from 'react';
import { Mosque } from '@/types/mosque';
import L from 'leaflet';

interface MosqueMapProps {
  mosques: Mosque[];
  selectedMosque: Mosque | null;
  onSelectMosque: (mosque: Mosque) => void;
  userLocation: { lat: number; lng: number } | null;
  isPinDropMode?: boolean;
  pinLocation?: { lat: number; lng: number } | null;
  onPinDrop?: (coords: { lat: number; lng: number }) => void;
  bookmarkedIds?: string[];
  isVisible?: boolean;
}

export function MosqueMap({
  mosques,
  selectedMosque,
  onSelectMosque,
  userLocation,
  isPinDropMode,
  pinLocation,
  onPinDrop,
  bookmarkedIds = [],
  isVisible = true,
}: MosqueMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const markersLayerRef = useRef<L.LayerGroup | null>(null);
  const pinMarkerRef = useRef<L.Marker | null>(null);
  const userMarkerRef = useRef<L.Marker | null>(null);

  // Default center: Dhaka, Bangladesh
  const defaultCenter: [number, number] = [23.75, 90.39];

  // Initialize Map
  useEffect(() => {
    if (!mapContainerRef.current || mapInstanceRef.current) return;

    const initialCenter = userLocation
      ? [userLocation.lat, userLocation.lng] as [number, number]
      : defaultCenter;

    const map = L.map(mapContainerRef.current, {
      center: initialCenter,
      zoom: 13,
      zoomControl: false,
    });

    // Add zoom controls to top-right
    L.control.zoom({ position: 'topright' }).addTo(map);

    // OpenStreetMap tile layer with subdomain sharding (a, b, c) for mobile connection concurrency
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      subdomains: ['a', 'b', 'c'],
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    // Trigger initial size check after mount in case container had zero or delayed dimensions
    requestAnimationFrame(() => {
      if (mapInstanceRef.current && mapContainerRef.current) {
        if (mapContainerRef.current.clientWidth > 0 && mapContainerRef.current.clientHeight > 0) {
          mapInstanceRef.current.invalidateSize({ pan: false });
        }
      }
    });

    return () => {
      map.remove();
      mapInstanceRef.current = null;
    };
  }, []);

  // Invalidate map size when tab visibility transitions
  useEffect(() => {
    if (!isVisible) return;
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    const triggerResize = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        map.invalidateSize({ pan: false });
      }
    };

    const rafId = requestAnimationFrame(triggerResize);
    const timerId = setTimeout(triggerResize, 150);

    return () => {
      cancelAnimationFrame(rafId);
      clearTimeout(timerId);
    };
  }, [isVisible]);

  // Observe container dimensions for mobile orientation changes, tab switching, and viewport resizes
  useEffect(() => {
    const map = mapInstanceRef.current;
    const container = mapContainerRef.current;
    if (!map || !container) return;

    let resizeRaf: number | null = null;
    const handleResize = () => {
      if (container.clientWidth > 0 && container.clientHeight > 0) {
        if (resizeRaf) cancelAnimationFrame(resizeRaf);
        resizeRaf = requestAnimationFrame(() => {
          map.invalidateSize({ pan: false });
        });
      }
    };

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== 'undefined') {
      observer = new ResizeObserver((entries) => {
        for (const entry of entries) {
          if (entry.contentRect.width > 0 && entry.contentRect.height > 0) {
            handleResize();
          }
        }
      });
      observer.observe(container);
    }

    window.addEventListener('resize', handleResize);
    window.addEventListener('orientationchange', handleResize);

    return () => {
      if (resizeRaf) cancelAnimationFrame(resizeRaf);
      if (observer) observer.disconnect();
      window.removeEventListener('resize', handleResize);
      window.removeEventListener('orientationchange', handleResize);
    };
  }, []);

  // Handle map click in pin-drop mode
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    const handleClick = (e: L.LeafletMouseEvent) => {
      if (isPinDropMode && onPinDrop) {
        onPinDrop({ lat: e.latlng.lat, lng: e.latlng.lng });
      }
    };

    map.on('click', handleClick);
    return () => {
      map.off('click', handleClick);
    };
  }, [isPinDropMode, onPinDrop]);

  // Update Pin Drop Marker
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map) return;

    if (pinMarkerRef.current) {
      pinMarkerRef.current.remove();
      pinMarkerRef.current = null;
    }

    if (isPinDropMode && pinLocation) {
      const pinIcon = L.divIcon({
        className: 'custom-pin-marker',
        html: `
          <div style="
            background: #ef4444; 
            color: white; 
            width: 32px; 
            height: 32px; 
            border-radius: 50% 50% 50% 0; 
            transform: rotate(-45deg); 
            display: flex; 
            align-items: center; 
            justify-content: center; 
            box-shadow: 0 4px 10px rgba(0,0,0,0.3);
            border: 2px solid white;
          ">
            <span style="transform: rotate(45deg); font-weight: bold; font-size: 14px;">📍</span>
          </div>
        `,
        iconSize: [32, 32],
        iconAnchor: [16, 32],
      });

      const marker = L.marker([pinLocation.lat, pinLocation.lng], {
        icon: pinIcon,
        draggable: true,
      }).addTo(map);

      marker.on('dragend', (e) => {
        const pos = e.target.getLatLng();
        if (onPinDrop) onPinDrop({ lat: pos.lat, lng: pos.lng });
      });

      pinMarkerRef.current = marker;
      map.panTo([pinLocation.lat, pinLocation.lng]);
    }
  }, [isPinDropMode, pinLocation, onPinDrop]);

  // Update User GPS Marker and pan to location
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !userLocation) return;

    if (userMarkerRef.current) {
      userMarkerRef.current.setLatLng([userLocation.lat, userLocation.lng]);
    } else {
      const userIcon = L.divIcon({
        className: 'user-gps-marker',
        html: `
          <div style="
            width: 16px; 
            height: 16px; 
            background: #2563eb; 
            border: 3px solid white; 
            border-radius: 50%; 
            box-shadow: 0 0 0 6px rgba(37, 99, 235, 0.25);
          "></div>
        `,
        iconSize: [16, 16],
        iconAnchor: [8, 8],
      });

      userMarkerRef.current = L.marker([userLocation.lat, userLocation.lng], {
        icon: userIcon,
        zIndexOffset: 1000,
      }).addTo(map);
    }

    map.panTo([userLocation.lat, userLocation.lng], {
      animate: true,
      duration: 0.6,
    });
  }, [userLocation]);

  // Update Mosque Markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    const followedSet = new Set(bookmarkedIds);

    mosques.forEach((mosque) => {
      const isSelected = selectedMosque?.id === mosque.id;
      const isFollowed = followedSet.has(mosque.id);

      const iconSize: [number, number] = isFollowed ? [34, 34] : [22, 22];
      const iconAnchor: [number, number] = isFollowed ? [17, 17] : [11, 11];

      const icon = L.divIcon({
        className: 'mosque-pin-container',
        html: `
          <div class="custom-mosque-pin ${isFollowed ? 'followed' : 'unfollowed'} ${isSelected ? 'active' : ''}">
            <span style="font-size: ${isFollowed ? '14px' : '9px'}; line-height: 1;">🕌</span>
          </div>
        `,
        iconSize,
        iconAnchor,
      });

      const marker = L.marker([mosque.latitude, mosque.longitude], {
        icon,
        zIndexOffset: isSelected ? 1000 : (isFollowed ? 50 : 10),
      });

      marker.bindTooltip(
        `<strong>${mosque.name}</strong>${isFollowed ? ' <span style="color: #059669; font-size: 11px;">(Followed)</span>' : ''}<br/><span style="color: #6e6e73; font-size: 11px;">${mosque.city || 'Dhaka'}</span>`,
        { direction: 'top', offset: [0, -10] },
      );

      marker.on('click', () => {
        onSelectMosque(mosque);
      });

      markersLayer.addLayer(marker);
    });
  }, [mosques, selectedMosque, onSelectMosque, bookmarkedIds]);

  // Pan to selected mosque when selected externally
  useEffect(() => {
    const map = mapInstanceRef.current;
    if (!map || !selectedMosque) return;

    map.panTo([selectedMosque.latitude, selectedMosque.longitude], {
      animate: true,
      duration: 0.6,
    });
  }, [selectedMosque]);

  return (
    <div
      className="relative w-full h-full min-h-0 min-w-0 bg-[#f4f4f5] overflow-hidden z-0 isolate"
      style={{ height: '100%', minHeight: '100%' }}
    >
      <div
        ref={mapContainerRef}
        className="w-full h-full min-h-full"
        style={{ height: '100%', minHeight: '100%' }}
      />

      {/* Pin drop instructional badge */}
      {isPinDropMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-[#111114] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <span>📍 Click on map to place pin & detect address</span>
        </div>
      )}
    </div>
  );
}
