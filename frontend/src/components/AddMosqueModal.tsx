'use client';

import React, { useState, useEffect } from 'react';
import { X, MapPin, AlertCircle, Compass, Check, ArrowRight } from 'lucide-react';
import { DuplicateCandidate } from '@/types/mosque';
import { checkProximityDuplicate, createMosque } from '@/lib/api';

interface AddMosqueModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreated: (newMosque: any) => void;
  defaultCoords?: { lat: number; lng: number } | null;
  onActivatePinDropMode?: () => void;
}

export function AddMosqueModal({
  isOpen,
  onClose,
  onCreated,
  defaultCoords,
  onActivatePinDropMode,
}: AddMosqueModalProps) {
  if (!isOpen) return null;

  const [name, setName] = useState('');
  const [city, setCity] = useState('Dhaka');
  const [address, setAddress] = useState('');
  const [landmark, setLandmark] = useState('');
  const [latitude, setLatitude] = useState<number | ''>(defaultCoords?.lat || 23.75);
  const [longitude, setLongitude] = useState<number | ''>(defaultCoords?.lng || 90.39);

  // Prayer times
  const [fajrJamaat, setFajrJamaat] = useState('05:15');
  const [zuhrJamaat, setZuhrJamaat] = useState('13:30');
  const [asrJamaat, setAsrJamaat] = useState('16:45');
  const [maghribJamaat, setMaghribJamaat] = useState('18:15');
  const [ishaJamaat, setIshaJamaat] = useState('20:00');
  const [jumuahJamaat, setJumuahJamaat] = useState('13:30');

  // Duplicate candidate warning
  const [duplicateCandidates, setDuplicateCandidates] = useState<DuplicateCandidate[]>([]);
  const [allowBypass, setAllowBypass] = useState(false);
  const [isCheckingDuplicate, setIsCheckingDuplicate] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Sync coords from props
  useEffect(() => {
    if (defaultCoords) {
      setLatitude(defaultCoords.lat);
      setLongitude(defaultCoords.lng);
    }
  }, [defaultCoords]);

  // Check duplicate when lat/lng change
  useEffect(() => {
    if (typeof latitude === 'number' && typeof longitude === 'number') {
      setIsCheckingDuplicate(true);
      const timer = setTimeout(async () => {
        try {
          const candidates = await checkProximityDuplicate(latitude, longitude);
          setDuplicateCandidates(candidates);
        } catch {
          setDuplicateCandidates([]);
        } finally {
          setIsCheckingDuplicate(false);
        }
      }, 500);
      return () => clearTimeout(timer);
    }
  }, [latitude, longitude]);

  const handleUseCurrentLocation = () => {
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          setLatitude(pos.coords.latitude);
          setLongitude(pos.coords.longitude);
        },
        (err) => {
          setErrorMsg('Unable to retrieve your GPS location: ' + err.message);
        },
      );
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg(null);

    if (!name.trim()) {
      setErrorMsg('Please enter mosque name.');
      return;
    }

    if (typeof latitude !== 'number' || typeof longitude !== 'number') {
      setErrorMsg('Please specify valid latitude and longitude coordinates.');
      return;
    }

    if (duplicateCandidates.length > 0 && !allowBypass) {
      setErrorMsg('A mosque already exists near this location. Please confirm bypass if this is a distinct prayer hall.');
      return;
    }

    setIsSubmitting(true);
    try {
      const payload = {
        name: name.trim(),
        latitude,
        longitude,
        city: city.trim(),
        address: address.trim() || undefined,
        landmark: landmark.trim() || undefined,
        allowDuplicateWarningBypass: allowBypass,
        fajrJamaat: fajrJamaat || undefined,
        zuhrJamaat: zuhrJamaat || undefined,
        asrJamaat: asrJamaat || undefined,
        maghribJamaat: maghribJamaat || undefined,
        ishaJamaat: ishaJamaat || undefined,
        jumuahJamaat: jumuahJamaat || undefined,
      };

      const res = await createMosque(payload);
      if (!res.success) {
        if (res.candidates && res.candidates.length > 0) {
          setDuplicateCandidates(res.candidates);
        }
        setErrorMsg(res.error || 'Failed to submit mosque.');
        return;
      }

      onCreated(res.data);
      onClose();
    } catch (err: any) {
      setErrorMsg(err.message || 'Error submitting mosque.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-4 bg-black/40 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="relative w-full max-w-lg max-h-[92vh] flex flex-col bg-white rounded-3xl shadow-2xl border border-[#e8e8ea] overflow-hidden">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[#e8e8ea] flex items-center justify-between bg-[#fafafa]">
          <div>
            <h2 className="text-base font-bold text-[#111114]">Submit a Mosque</h2>
            <p className="text-xs text-[#6e6e73]">Register a new prayer hall with verified coordinates</p>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full text-zinc-400 hover:text-zinc-700 hover:bg-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Form */}
        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4">
          {errorMsg && (
            <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 text-xs flex items-start gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
              <span>{errorMsg}</span>
            </div>
          )}

          {/* Mosque Basic Details */}
          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Mosque Name *
            </label>
            <input
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Baitul Aman Jame Mosque"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-2 focus:ring-[#111114]"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                City / District
              </label>
              <input
                type="text"
                value={city}
                onChange={(e) => setCity(e.target.value)}
                placeholder="Dhaka"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-2 focus:ring-[#111114]"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-[#111114] mb-1">
                Landmark
              </label>
              <input
                type="text"
                value={landmark}
                onChange={(e) => setLandmark(e.target.value)}
                placeholder="e.g. Near Central Park"
                className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-2 focus:ring-[#111114]"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-[#111114] mb-1">
              Street Address
            </label>
            <input
              type="text"
              value={address}
              onChange={(e) => setAddress(e.target.value)}
              placeholder="Road 4, Sector 7, Uttara"
              className="w-full px-3.5 py-2 text-sm rounded-xl border border-[#e8e8ea] bg-white focus:outline-none focus:ring-2 focus:ring-[#111114]"
            />
          </div>

          {/* Coordinate Pinning */}
          <div className="p-3.5 rounded-2xl bg-[#fafafa] border border-[#e8e8ea] space-y-2.5">
            <div className="flex items-center justify-between">
              <span className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]">
                Geographic Coordinates
              </span>
              <div className="flex items-center gap-1.5">
                <button
                  type="button"
                  onClick={handleUseCurrentLocation}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-1 rounded-full border border-emerald-200 hover:bg-emerald-100"
                >
                  <Compass className="w-3 h-3" />
                  GPS Pin
                </button>
                {onActivatePinDropMode && (
                  <button
                    type="button"
                    onClick={() => {
                      onActivatePinDropMode();
                      onClose();
                    }}
                    className="inline-flex items-center gap-1 text-[11px] font-semibold text-[#111114] bg-white px-2.5 py-1 rounded-full border border-[#e8e8ea] hover:bg-zinc-50"
                  >
                    <MapPin className="w-3 h-3 text-red-500" />
                    Pick on Map
                  </button>
                )}
              </div>
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#6e6e73]">Latitude</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={latitude}
                  onChange={(e) => setLatitude(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#e8e8ea] bg-white"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Longitude</span>
                <input
                  type="number"
                  step="any"
                  required
                  value={longitude}
                  onChange={(e) => setLongitude(e.target.value ? parseFloat(e.target.value) : '')}
                  className="w-full px-2.5 py-1.5 text-xs font-mono rounded-lg border border-[#e8e8ea] bg-white"
                />
              </div>
            </div>

            {/* Proximity Duplicate Warning Banner */}
            {duplicateCandidates.length > 0 && (
              <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 space-y-2">
                <div className="flex items-start gap-1.5 text-xs font-semibold text-amber-900">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                  <span>Possible Duplicate Mosque Within 50 Meters:</span>
                </div>
                <div className="divide-y divide-amber-200/60 text-xs text-amber-800">
                  {duplicateCandidates.map((c) => (
                    <div key={c.mosqueId} className="py-1 flex items-center justify-between">
                      <span className="font-medium">{c.name}</span>
                      <span className="font-mono text-[11px]">{Math.round(c.distanceMeters)}m away</span>
                    </div>
                  ))}
                </div>
                <label className="flex items-center gap-2 pt-1 text-xs text-amber-950 font-medium cursor-pointer">
                  <input
                    type="checkbox"
                    checked={allowBypass}
                    onChange={(e) => setAllowBypass(e.target.checked)}
                    className="rounded border-amber-400 text-[#111114] focus:ring-0"
                  />
                  <span>Confirm: This is a separate, distinct mosque hall</span>
                </label>
              </div>
            )}
          </div>

          {/* Initial Prayer Timetable */}
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#6e6e73] mb-2">
              Initial Jamaat Times (24h HH:mm)
            </h3>
            <div className="grid grid-cols-3 gap-2 text-xs">
              <div>
                <span className="text-[10px] text-[#6e6e73]">Fajr</span>
                <input
                  type="text"
                  value={fajrJamaat}
                  onChange={(e) => setFajrJamaat(e.target.value)}
                  placeholder="05:15"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Zuhr</span>
                <input
                  type="text"
                  value={zuhrJamaat}
                  onChange={(e) => setZuhrJamaat(e.target.value)}
                  placeholder="13:30"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Asr</span>
                <input
                  type="text"
                  value={asrJamaat}
                  onChange={(e) => setAsrJamaat(e.target.value)}
                  placeholder="16:45"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Maghrib</span>
                <input
                  type="text"
                  value={maghribJamaat}
                  onChange={(e) => setMaghribJamaat(e.target.value)}
                  placeholder="18:15"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Isha</span>
                <input
                  type="text"
                  value={ishaJamaat}
                  onChange={(e) => setIshaJamaat(e.target.value)}
                  placeholder="20:00"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
              <div>
                <span className="text-[10px] text-[#6e6e73]">Jumu'ah</span>
                <input
                  type="text"
                  value={jumuahJamaat}
                  onChange={(e) => setJumuahJamaat(e.target.value)}
                  placeholder="13:30"
                  className="w-full px-2.5 py-1.5 rounded-lg border border-[#e8e8ea]"
                />
              </div>
            </div>
          </div>

          {/* Submit Button */}
          <div className="pt-2">
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full py-3 px-4 rounded-full bg-[#111114] hover:bg-[#27272a] text-white font-semibold text-sm shadow-md transition-all active:scale-[0.98] disabled:opacity-50 flex items-center justify-center gap-2"
            >
              <span>{isSubmitting ? 'Registering Mosque...' : 'Submit Mosque Listing'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
