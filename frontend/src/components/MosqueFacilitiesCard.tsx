'use client';

import React from 'react';
import { Mosque, MosqueFacility } from '@/types/mosque';
import { Building2, Check, Pencil, Sparkles } from 'lucide-react';

interface MosqueFacilitiesCardProps {
  mosque: Mosque;
  facility?: MosqueFacility | null;
  canEdit?: boolean;
  onEdit?: () => void;
  onOpenSuggestion?: () => void;
}

export const MosqueFacilitiesCard: React.FC<MosqueFacilitiesCardProps> = ({
  mosque,
  facility,
  canEdit = false,
  onEdit,
  onOpenSuggestion,
}) => {
  // Only display capacity metrics that have actual numbers (> 0) reported
  const capacityItems: { label: string; value: string }[] = [];

  const totalCap =
    facility?.totalCapacity ??
    (mosque.capacity && mosque.capacity > 0 ? mosque.capacity : null);
  if (totalCap && totalCap > 0) {
    capacityItems.push({
      label: 'Total Capacity',
      value: `${totalCap.toLocaleString()} musallis`,
    });
  }

  if (facility?.femaleCapacity && facility.femaleCapacity > 0) {
    capacityItems.push({
      label: "Women's Capacity",
      value: `${facility.femaleCapacity.toLocaleString()} musallis`,
    });
  }

  if (facility?.wuduCapacity && facility.wuduCapacity > 0) {
    capacityItems.push({
      label: 'Wudu Taps',
      value: `${facility.wuduCapacity} taps`,
    });
  }

  if (facility?.toiletCount && facility.toiletCount > 0) {
    capacityItems.push({
      label: 'Washrooms',
      value: `${facility.toiletCount} units`,
    });
  }

  // Only display facility amenities that have been confirmed available (true)
  interface AvailableAmenity {
    id: string;
    label: string;
    detailText?: string;
  }

  const availableAmenities: AvailableAmenity[] = [];

  if (facility?.hasFemalePrayerSpace) {
    availableAmenities.push({
      id: 'female-prayer-space',
      label: "Women's Prayer Space",
      detailText: facility.femaleCapacity
        ? `${facility.femaleCapacity.toLocaleString()} musallis`
        : 'Dedicated area',
    });
  }

  if (facility?.hasSeparateWudu) {
    availableAmenities.push({
      id: 'separate-wudu',
      label: 'Separate Wudu Area',
      detailText: facility.wuduCapacity ? `${facility.wuduCapacity} taps` : undefined,
    });
  }

  if (facility?.hasAirConditioning) {
    availableAmenities.push({
      id: 'air-conditioning',
      label: 'Air Conditioning (AC)',
    });
  }

  if (facility?.hasFan) {
    availableAmenities.push({
      id: 'electric-fans',
      label: 'Electric Fans',
    });
  }

  if (facility?.hasWheelchairAccess) {
    availableAmenities.push({
      id: 'wheelchair-access',
      label: 'Wheelchair Accessible',
    });
  }

  if (facility?.hasRamp) {
    availableAmenities.push({
      id: 'entrance-ramp',
      label: 'Entrance Ramp',
    });
  }

  if (facility?.hasJanazaService) {
    availableAmenities.push({
      id: 'janaza-service',
      label: 'Janaza Funeral Services',
    });
  }

  if (facility?.hasLibraryMaktab) {
    availableAmenities.push({
      id: 'library-maktab',
      label: 'Maktab & Library',
    });
  }

  if (facility?.hasParkingCar) {
    availableAmenities.push({
      id: 'parking-car',
      label: 'Car Parking',
    });
  }

  if (facility?.hasParkingBike) {
    availableAmenities.push({
      id: 'parking-bike',
      label: 'Motorcycle & Bike Parking',
    });
  }

  const hasAnyInformation =
    capacityItems.length > 0 || availableAmenities.length > 0;

  // Empty state: No facility or capacity information has been reported for this mosque yet
  if (!hasAnyInformation) {
    return (
      <section
        aria-labelledby="facilities-heading"
        className="bg-white border border-[#e8e8ea] rounded-2xl p-4 sm:p-5 mb-4"
      >
        <div className="flex items-center justify-between pb-3 border-b border-[#e8e8ea] mb-3">
          <div>
            <h3
              id="facilities-heading"
              className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]"
            >
              Facilities & Capacity
            </h3>
            <p className="text-xs text-[#111114] font-medium mt-0.5">
              Amenities & accessibility details
            </p>
          </div>
        </div>

        <div className="text-center py-6 px-4 bg-[#fafafa] rounded-xl border border-dashed border-[#e8e8ea]">
          <div className="w-10 h-10 mx-auto mb-2.5 rounded-full bg-white border border-[#e8e8ea] flex items-center justify-center text-[#6e6e73]">
            <Building2 className="w-5 h-5" />
          </div>
          <h4 className="text-xs font-semibold text-[#111114]">
            No facility details reported yet
          </h4>
          <p className="text-[11px] text-[#6e6e73] max-w-sm mx-auto mt-1 mb-3.5 leading-relaxed">
            Capacity, separate wudu, women&apos;s prayer space, and accessibility provisions have not been submitted for this mosque.
          </p>
          {canEdit ? (
            <button
              type="button"
              onClick={onEdit}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#111114] hover:bg-neutral-800 rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#111114] focus:outline-none"
            >
              <Pencil className="w-3.5 h-3.5" />
              Add Facilities & Capacity
            </button>
          ) : onOpenSuggestion ? (
            <button
              type="button"
              onClick={onOpenSuggestion}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-[#111114] bg-white hover:bg-neutral-50 border border-[#e8e8ea] rounded-lg transition-colors focus-visible:ring-2 focus-visible:ring-[#111114] focus:outline-none"
            >
              <Sparkles className="w-3.5 h-3.5 text-emerald-600" />
              Suggest Facility Details
            </button>
          ) : null}
        </div>
      </section>
    );
  }

  // Populated state: Only show verified / reported facilities and capacities
  return (
    <section
      aria-labelledby="facilities-heading"
      className="bg-white border border-[#e8e8ea] rounded-2xl p-4 sm:p-5 mb-4"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-3 border-b border-[#e8e8ea] mb-3.5">
        <div>
          <h3
            id="facilities-heading"
            className="text-xs font-bold uppercase tracking-wider text-[#6e6e73]"
          >
            Facilities & Capacity
          </h3>
          <p className="text-xs text-[#111114] font-medium mt-0.5">
            Verified architectural and accessibility amenities
          </p>
        </div>
        {canEdit ? (
          <button
            type="button"
            onClick={onEdit}
            className="inline-flex items-center gap-1 text-xs font-semibold text-[#111114] hover:text-neutral-700 transition-colors focus-visible:ring-2 focus-visible:ring-[#111114] focus:outline-none"
          >
            <Pencil className="w-3.5 h-3.5" />
            Edit
          </button>
        ) : onOpenSuggestion ? (
          <button
            type="button"
            onClick={onOpenSuggestion}
            className="inline-flex items-center gap-1 text-xs font-medium text-[#6e6e73] hover:text-[#111114] transition-colors focus-visible:ring-2 focus-visible:ring-[#111114] focus:outline-none"
          >
            Suggest Update
          </button>
        ) : null}
      </div>

      {/* Aggregate Capacity Numbers (Only reported metrics > 0) */}
      {capacityItems.length > 0 && (
        <div
          className={`grid gap-2 mb-3.5 ${
            capacityItems.length === 1
              ? 'grid-cols-1'
              : capacityItems.length === 2
                ? 'grid-cols-2'
                : capacityItems.length === 3
                  ? 'grid-cols-3'
                  : 'grid-cols-2 sm:grid-cols-4'
          }`}
        >
          {capacityItems.map((item) => (
            <div
              key={item.label}
              className="p-2.5 rounded-xl bg-[#fafafa] border border-[#e8e8ea] text-center"
            >
              <div className="text-[11px] font-medium text-[#6e6e73]">
                {item.label}
              </div>
              <div className="text-sm font-bold text-[#111114] mt-0.5">
                {item.value}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Available Amenities List */}
      {availableAmenities.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
          {availableAmenities.map((amenity) => (
            <div
              key={amenity.id}
              className="flex items-center justify-between p-2.5 rounded-xl bg-[#fafafa] border border-[#e8e8ea]"
            >
              <div className="flex items-center gap-2">
                <span className="flex items-center justify-center w-5 h-5 rounded-md bg-emerald-50 text-emerald-700 border border-emerald-200 shrink-0">
                  <Check className="w-3.5 h-3.5" />
                </span>
                <span className="text-xs font-semibold text-[#111114]">
                  {amenity.label}
                </span>
              </div>
              <div className="flex items-center gap-1.5 shrink-0">
                {amenity.detailText && (
                  <span className="text-[11px] text-[#6e6e73]">
                    {amenity.detailText}
                  </span>
                )}
                <span className="inline-flex items-center px-1.5 py-0.5 rounded text-[10px] font-medium bg-emerald-50 text-emerald-700 border border-emerald-200">
                  Available
                </span>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="pt-2 text-[11px] text-[#6e6e73]">
          No specific amenities have been confirmed yet.
        </div>
      )}
    </section>
  );
};
