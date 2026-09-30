'use client';

import React from 'react';
import { Mosque, MosqueFacility } from '@/types/mosque';

interface MosqueFacilitiesCardProps {
  mosque: Mosque;
  facility?: MosqueFacility | null;
  canEdit?: boolean;
  onEdit?: () => void;
}

export const MosqueFacilitiesCard: React.FC<MosqueFacilitiesCardProps> = ({
  mosque,
  facility,
  canEdit = false,
  onEdit,
}) => {
  // Coalesce between dedicated facility record and legacy mosque booleans
  const totalCapacity = facility?.totalCapacity ?? mosque.capacity ?? null;
  const toiletCount = facility?.toiletCount ?? null;

  const femaleSpace =
    facility?.hasFemalePrayerSpace !== undefined &&
    facility?.hasFemalePrayerSpace !== null
      ? facility.hasFemalePrayerSpace
      : mosque.hasSeparateWomenSpace !== undefined
        ? mosque.hasSeparateWomenSpace
        : null;

  const femaleCapacity = facility?.femaleCapacity ?? null;

  const separateWudu =
    facility?.hasSeparateWudu !== undefined &&
    facility?.hasSeparateWudu !== null
      ? facility.hasSeparateWudu
      : mosque.hasWuduArea !== undefined
        ? mosque.hasWuduArea
        : null;

  const wuduCapacity = facility?.wuduCapacity ?? null;

  const wheelchair =
    facility?.hasWheelchairAccess !== undefined &&
    facility?.hasWheelchairAccess !== null
      ? facility.hasWheelchairAccess
      : mosque.hasWheelchairAccess !== undefined
        ? mosque.hasWheelchairAccess
        : null;

  const ramp = facility?.hasRamp ?? null;

  const ac =
    facility?.hasAirConditioning !== undefined &&
    facility?.hasAirConditioning !== null
      ? facility.hasAirConditioning
      : mosque.hasAirConditioning !== undefined
        ? mosque.hasAirConditioning
        : null;

  const fan = facility?.hasFan ?? null;

  const janaza =
    facility?.hasJanazaService !== undefined &&
    facility?.hasJanazaService !== null
      ? facility.hasJanazaService
      : mosque.hasJanazaFacility !== undefined
        ? mosque.hasJanazaFacility
        : null;

  const parkingCar = facility?.hasParkingCar ?? (mosque.hasParking ? true : null);
  const parkingBike = facility?.hasParkingBike ?? null;
  const libraryMaktab = facility?.hasLibraryMaktab ?? null;

  const renderStatusBadge = (
    value: boolean | null | undefined,
    detailText?: string | null,
  ) => {
    if (value === null || value === undefined) {
      return (
        <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium bg-neutral-100 text-neutral-500 dark:bg-neutral-800 dark:text-neutral-400">
          Not Reported
        </span>
      );
    }

    if (value) {
      return (
        <div className="flex items-center gap-1.5">
          <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium bg-emerald-50 text-emerald-700 border border-emerald-200 dark:bg-emerald-950/40 dark:text-emerald-400 dark:border-emerald-800/60">
            Available
          </span>
          {detailText && (
            <span className="text-xs text-neutral-500 dark:text-neutral-400">
              ({detailText})
            </span>
          )}
        </div>
      );
    }

    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-[6px] text-xs font-medium bg-neutral-100 text-neutral-600 dark:bg-neutral-800/70 dark:text-neutral-400">
        Not Available
      </span>
    );
  };

  return (
    <section
      aria-labelledby="facilities-heading"
      className="bg-white dark:bg-neutral-900 border border-neutral-200 dark:border-neutral-800 rounded-[10px] p-5 mb-6"
    >
      <div className="flex items-center justify-between border-b border-neutral-100 dark:border-neutral-800 pb-3 mb-4">
        <div>
          <h3
            id="facilities-heading"
            className="text-base font-semibold text-[#111114] dark:text-neutral-100"
          >
            Facilities & Capacity
          </h3>
          <p className="text-xs text-[#6e6e73] dark:text-neutral-400 mt-0.5">
            Verified architectural and accessibility amenities
          </p>
        </div>
        {canEdit && (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-neutral-800 dark:text-neutral-200 bg-neutral-50 dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 border border-neutral-200 dark:border-neutral-700 rounded-[8px] transition-colors"
          >
            <svg
              className="w-3.5 h-3.5"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z"
              />
            </svg>
            Edit Facilities
          </button>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-y-4 gap-x-8">
        {/* Women's Prayer Space */}
        <div className="flex items-center justify-between py-1">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
              Women&apos;s Prayer Space
            </span>
          </div>
          {renderStatusBadge(
            femaleSpace,
            femaleCapacity ? `${femaleCapacity} musallis` : null,
          )}
        </div>

        {/* Wheelchair Accessibility */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Wheelchair Accessible
          </span>
          {renderStatusBadge(wheelchair)}
        </div>

        {/* Access Ramp */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Entrance Ramp
          </span>
          {renderStatusBadge(ramp)}
        </div>

        {/* Air Conditioning */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Air Conditioning (AC)
          </span>
          {renderStatusBadge(ac)}
        </div>

        {/* Electric Fans */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Electric Fans
          </span>
          {renderStatusBadge(fan)}
        </div>

        {/* Separate Wudu Area */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Separate Wudu Area
          </span>
          {renderStatusBadge(
            separateWudu,
            wuduCapacity ? `${wuduCapacity} taps` : null,
          )}
        </div>

        {/* Janaza Staging */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Janaza Funeral Services
          </span>
          {renderStatusBadge(janaza)}
        </div>

        {/* Library / Maktab */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Maktab & Library
          </span>
          {renderStatusBadge(libraryMaktab)}
        </div>

        {/* Car Parking */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Car Parking
          </span>
          {renderStatusBadge(parkingCar)}
        </div>

        {/* Bike / Bicycle Parking */}
        <div className="flex items-center justify-between py-1">
          <span className="text-xs font-medium text-neutral-700 dark:text-neutral-300">
            Motorcycle / Bike Parking
          </span>
          {renderStatusBadge(parkingBike)}
        </div>
      </div>

      {/* Aggregate Capacity Numbers Bar */}
      <div className="mt-5 pt-4 border-t border-neutral-100 dark:border-neutral-800 grid grid-cols-2 sm:grid-cols-4 gap-3 text-center">
        <div className="p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Total Capacity
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {totalCapacity !== null
              ? `${totalCapacity.toLocaleString()} musallis`
              : 'Not Reported'}
          </div>
        </div>

        <div className="p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Women&apos;s Capacity
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {femaleCapacity !== null
              ? `${femaleCapacity.toLocaleString()} musallis`
              : femaleSpace === false
                ? 'N/A'
                : 'Not Reported'}
          </div>
        </div>

        <div className="p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Wudu Taps
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {wuduCapacity !== null ? `${wuduCapacity} taps` : 'Not Reported'}
          </div>
        </div>

        <div className="p-2.5 rounded-[8px] bg-neutral-50 dark:bg-neutral-800/50 border border-neutral-100 dark:border-neutral-800">
          <div className="text-[11px] text-neutral-500 dark:text-neutral-400">
            Washrooms / Toilets
          </div>
          <div className="text-sm font-semibold text-neutral-900 dark:text-neutral-100 mt-0.5">
            {toiletCount !== null ? `${toiletCount} units` : 'Not Reported'}
          </div>
        </div>
      </div>
    </section>
  );
};
