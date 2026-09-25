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
}

export function MosqueMap({
  mosques,
  selectedMosque,
  onSelectMosque,
  userLocation,
  isPinDropMode,
  pinLocation,
  onPinDrop,
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

    // OpenStreetMap tile layer
    L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
      maxZoom: 19,
      attribution:
        '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);

    const markersLayer = L.layerGroup().addTo(map);
    markersLayerRef.current = markersLayer;
    mapInstanceRef.current = map;

    return () => {
      map.remove();
      mapInstanceRef.current = null;
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

  // Update User GPS Marker
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
  }, [userLocation]);

  // Update Mosque Markers
  useEffect(() => {
    const markersLayer = markersLayerRef.current;
    if (!markersLayer) return;

    markersLayer.clearLayers();

    mosques.forEach((mosque) => {
      const isSelected = selectedMosque?.id === mosque.id;

      const icon = L.divIcon({
        className: 'mosque-pin-container',
        html: `
          <div class="custom-mosque-pin ${isSelected ? 'active' : ''}">
            <span style="font-size: 14px;">🕌</span>
          </div>
        `,
        iconSize: [34, 34],
        iconAnchor: [17, 17],
      });

      const marker = L.marker([mosque.latitude, mosque.longitude], { icon });

      marker.bindTooltip(
        `<strong>${mosque.name}</strong><br/><span style="color: #6e6e73; font-size: 11px;">${mosque.city || 'Dhaka'}</span>`,
        { direction: 'top', offset: [0, -10] },
      );

      marker.on('click', () => {
        onSelectMosque(mosque);
      });

      markersLayer.addLayer(marker);
    });
  }, [mosques, selectedMosque, onSelectMosque]);

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
    <div className="relative w-full h-full bg-[#f4f4f5] overflow-hidden">
      <div ref={mapContainerRef} className="w-full h-full" />

      {/* Pin drop instructional badge */}
      {isPinDropMode && (
        <div className="absolute top-4 left-1/2 -translate-x-1/2 z-[400] bg-[#111114] text-white px-4 py-2 rounded-full text-xs font-semibold shadow-lg flex items-center gap-2 animate-bounce">
          <span>📍 Click on map to place mosque pin</span>
        </div>
      )}
    </div>
  );
}
