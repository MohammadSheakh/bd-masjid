'use client';

import React, { useState, useEffect } from 'react';
import { MosqueFacility } from '@/types/mosque';
import { upsertMosqueFacilities } from '@/lib/api';

interface EditFacilitiesModalProps {
  isOpen: boolean;
  onClose: () => void;
  mosqueId: string;
  initialData?: MosqueFacility | null;
  onSaved: (updated: MosqueFacility) => void;
}

export const EditFacilitiesModal: React.FC<EditFacilitiesModalProps> = ({
  isOpen,
  onClose,
  mosqueId,
  initialData,
  onSaved,
}) => {
  const [totalCapacity, setTotalCapacity] = useState<string>('');
  const [toiletCount, setToiletCount] = useState<string>('');
  const [hasSeparateWudu, setHasSeparateWudu] = useState<boolean>(false);
  const [wuduCapacity, setWuduCapacity] = useState<string>('');
  const [hasFemalePrayerSpace, setHasFemalePrayerSpace] =
    useState<boolean>(false);
  const [femaleCapacity, setFemaleCapacity] = useState<string>('');
  const [hasWheelchairAccess, setHasWheelchairAccess] =
    useState<boolean>(false);
  const [hasRamp, setHasRamp] = useState<boolean>(false);
  const [hasAirConditioning, setHasAirConditioning] = useState<boolean>(false);
  const [hasFan, setHasFan] = useState<boolean>(true);
  const [hasJanazaService, setHasJanazaService] = useState<boolean>(false);
  const [hasParkingCar, setHasParkingCar] = useState<boolean>(false);
  const [hasParkingBike, setHasParkingBike] = useState<boolean>(false);
  const [hasLibraryMaktab, setHasLibraryMaktab] = useState<boolean>(false);

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (initialData) {
      setTotalCapacity(
        initialData.totalCapacity !== null &&
          initialData.totalCapacity !== undefined
          ? String(initialData.totalCapacity)
          : '',
      );
      setToiletCount(
        initialData.toiletCount !== null &&
          initialData.toiletCount !== undefined
          ? String(initialData.toiletCount)
          : '',
      );
      setHasSeparateWudu(Boolean(initialData.hasSeparateWudu));
      setWuduCapacity(
        initialData.wuduCapacity !== null &&
          initialData.wuduCapacity !== undefined
          ? String(initialData.wuduCapacity)
          : '',
      );
      setHasFemalePrayerSpace(Boolean(initialData.hasFemalePrayerSpace));
      setFemaleCapacity(
        initialData.femaleCapacity !== null &&
          initialData.femaleCapacity !== undefined
          ? String(initialData.femaleCapacity)
          : '',
      );
      setHasWheelchairAccess(Boolean(initialData.hasWheelchairAccess));
      setHasRamp(Boolean(initialData.hasRamp));
      setHasAirConditioning(Boolean(initialData.hasAirConditioning));
      setHasFan(initialData.hasFan ?? true);
      setHasJanazaService(Boolean(initialData.hasJanazaService));
      setHasParkingCar(Boolean(initialData.hasParkingCar));
      setHasParkingBike(Boolean(initialData.hasParkingBike));
      setHasLibraryMaktab(Boolean(initialData.hasLibraryMaktab));
    }
  }, [initialData, isOpen]);

  // Handle Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const payload: Partial<MosqueFacility> = {
      totalCapacity: totalCapacity ? parseInt(totalCapacity, 10) : null,
      toiletCount: toiletCount ? parseInt(toiletCount, 10) : null,
      hasSeparateWudu,
      wuduCapacity: wuduCapacity ? parseInt(wuduCapacity, 10) : null,
      hasFemalePrayerSpace,
      femaleCapacity: femaleCapacity ? parseInt(femaleCapacity, 10) : null,
      hasWheelchairAccess,
      hasRamp,
      hasAirConditioning,
      hasFan,
      hasJanazaService,
      hasParkingCar,
      hasParkingBike,
      hasLibraryMaktab,
    };

    const res = await upsertMosqueFacilities(mosqueId, payload);
    setLoading(false);

    if (res.success && res.data) {
      onSaved(res.data);
      onClose();
    } else {
      setError(res.error || 'Failed to save facilities. Please check permissions.');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="edit-facilities-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 overflow-y-auto"
    >
      <div className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[10px] w-full max-w-xl my-8 overflow-hidden shadow-xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-100 dark:border-neutral-800">
          <div>
            <h2
              id="edit-facilities-title"
              className="text-base font-semibold text-[#111114] dark:text-neutral-100"
            >
              Update Mosque Facilities & Capacity
            </h2>
            <p className="text-xs text-[#6e6e73] dark:text-neutral-400 mt-0.5">
              Specify verified architectural, accessibility, and community amenities
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close modal"
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
          >
            <svg
              className="w-5 h-5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M6 18L18 6M6 6l12 12"
              />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 max-h-[75vh] overflow-y-auto">
          {error && (
            <div className="mb-4 p-3 rounded-[8px] bg-red-50 text-red-700 text-xs border border-red-200 dark:bg-red-950/40 dark:text-red-400 dark:border-red-900">
              {error}
            </div>
          )}

          {/* Capacity Section */}
          <div className="mb-6">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
              Musalli & Washroom Capacity
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Total Musalli Capacity
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 1500"
                  value={totalCapacity}
                  onChange={(e) => setTotalCapacity(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1">
                  Toilet / Washroom Count
                </label>
                <input
                  type="number"
                  min="0"
                  placeholder="e.g. 12"
                  value={toiletCount}
                  onChange={(e) => setToiletCount(e.target.value)}
                  className="w-full text-xs px-3 py-2 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[8px] focus:outline-none focus:ring-1 focus:ring-neutral-900 dark:focus:ring-white"
                />
              </div>
            </div>
          </div>

          {/* Women & Wudu Section */}
          <div className="mb-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
              Women&apos;s Area & Wudu Provisions
            </h3>
            <div className="space-y-4">
              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hasFemalePrayerSpace"
                  checked={hasFemalePrayerSpace}
                  onChange={(e) => setHasFemalePrayerSpace(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <div className="flex-1">
                  <label
                    htmlFor="hasFemalePrayerSpace"
                    className="text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    Dedicated Secluded Women&apos;s Prayer Space
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Separate hall or partitioned section with dedicated entrance
                  </p>
                  {hasFemalePrayerSpace && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Women&apos;s Section Musalli Capacity
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 200"
                        value={femaleCapacity}
                        onChange={(e) => setFemaleCapacity(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[8px]"
                      />
                    </div>
                  )}
                </div>
              </div>

              <div className="flex items-start gap-3">
                <input
                  type="checkbox"
                  id="hasSeparateWudu"
                  checked={hasSeparateWudu}
                  onChange={(e) => setHasSeparateWudu(e.target.checked)}
                  className="mt-0.5 rounded border-neutral-300 text-neutral-900 focus:ring-neutral-900"
                />
                <div className="flex-1">
                  <label
                    htmlFor="hasSeparateWudu"
                    className="text-xs font-medium text-neutral-800 dark:text-neutral-200 cursor-pointer"
                  >
                    Dedicated Ablution (Wudu) Area
                  </label>
                  <p className="text-[11px] text-neutral-500">
                    Continuous tap or tank setup separated from main hall
                  </p>
                  {hasSeparateWudu && (
                    <div className="mt-2">
                      <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-400 mb-1">
                        Total Wudu Faucet / Tap Count
                      </label>
                      <input
                        type="number"
                        min="0"
                        placeholder="e.g. 40"
                        value={wuduCapacity}
                        onChange={(e) => setWuduCapacity(e.target.value)}
                        className="w-full text-xs px-3 py-1.5 bg-neutral-50 dark:bg-neutral-800 border border-neutral-200 dark:border-neutral-700 rounded-[8px]"
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Accessibility & Climate */}
          <div className="mb-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
              Accessibility & Climate Controls
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasWheelchairAccess}
                  onChange={(e) => setHasWheelchairAccess(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Wheelchair Accessible
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasRamp}
                  onChange={(e) => setHasRamp(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Entrance Ramp Available
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasAirConditioning}
                  onChange={(e) => setHasAirConditioning(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Air Conditioning (AC)
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasFan}
                  onChange={(e) => setHasFan(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Electric Fans
                </span>
              </label>
            </div>
          </div>

          {/* Community Amenities */}
          <div className="mb-6 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <h3 className="text-xs font-semibold text-neutral-900 dark:text-neutral-100 uppercase tracking-wider mb-3">
              Community Services & Parking
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasJanazaService}
                  onChange={(e) => setHasJanazaService(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Janaza Staging & Service
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasLibraryMaktab}
                  onChange={(e) => setHasLibraryMaktab(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Maktab / Islamic Library
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasParkingCar}
                  onChange={(e) => setHasParkingCar(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Car Parking Space
                </span>
              </label>

              <label className="flex items-center gap-2 p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/40 border border-neutral-200/60 dark:border-neutral-800 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={hasParkingBike}
                  onChange={(e) => setHasParkingBike(e.target.checked)}
                  className="rounded text-neutral-900"
                />
                <span className="font-medium text-neutral-800 dark:text-neutral-200">
                  Motorcycle / Bike Parking
                </span>
              </label>
            </div>
          </div>

          <div className="flex items-center justify-end gap-3 pt-4 border-t border-neutral-100 dark:border-neutral-800">
            <button
              type="button"
              onClick={onClose}
              disabled={loading}
              className="px-4 py-2 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading}
              className="px-5 py-2 text-xs font-medium text-white bg-[#111114] hover:bg-neutral-800 dark:bg-white dark:text-black dark:hover:bg-neutral-200 rounded-[10px] transition-colors disabled:opacity-50"
            >
              {loading ? 'Saving...' : 'Save Facilities'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
