'use client';

import React, { useState } from 'react';
import { Plus, X, Check } from 'lucide-react';

interface CustomAmenitiesSelectorProps {
  selectedAmenities: string[];
  onChange: (updated: string[]) => void;
  disabled?: boolean;
}

const PRESET_OPTIONS = [
  'Solar Power / IPS',
  'Elevator / Lift',
  'CCTV Surveillance',
  'Filtered Cold Drinking Water',
  'Guest Room (Musafir Khana)',
  'Funeral Ghusl Khana',
  'Emergency Generator',
  'Free Wi-Fi for Musallis',
];

export const CustomAmenitiesSelector: React.FC<CustomAmenitiesSelectorProps> = ({
  selectedAmenities,
  onChange,
  disabled = false,
}) => {
  const [newOptionText, setNewOptionText] = useState('');
  const [inputError, setInputError] = useState<string | null>(null);

  const togglePreset = (amenity: string) => {
    if (disabled) return;
    if (selectedAmenities.includes(amenity)) {
      onChange(selectedAmenities.filter((item) => item !== amenity));
    } else {
      if (selectedAmenities.length >= 20) {
        setInputError('Maximum 20 custom amenities allowed');
        return;
      }
      setInputError(null);
      onChange([...selectedAmenities, amenity]);
    }
  };

  const handleAddNewOption = (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (disabled) return;

    const trimmed = newOptionText.trim();
    if (!trimmed) return;

    if (trimmed.length > 50) {
      setInputError('Option name must be 50 characters or less');
      return;
    }

    if (
      selectedAmenities.some(
        (item) => item.toLowerCase() === trimmed.toLowerCase(),
      )
    ) {
      setInputError('This option is already selected');
      return;
    }

    if (selectedAmenities.length >= 20) {
      setInputError('Maximum 20 custom amenities allowed');
      return;
    }

    setInputError(null);
    onChange([...selectedAmenities, trimmed]);
    setNewOptionText('');
  };

  const removeAmenity = (amenityToRemove: string) => {
    if (disabled) return;
    onChange(selectedAmenities.filter((item) => item !== amenityToRemove));
  };

  return (
    <div className="space-y-3">
      <div>
        <label className="block text-xs font-semibold text-[#111114] mb-1">
          Select Existing Amenities
        </label>
        <p className="text-[11px] text-[#6e6e73] mb-2.5">
          Tap common additional facilities to toggle them on or off:
        </p>

        <div className="flex flex-wrap gap-2">
          {PRESET_OPTIONS.map((preset) => {
            const isSelected = selectedAmenities.includes(preset);
            return (
              <button
                key={preset}
                type="button"
                onClick={() => togglePreset(preset)}
                disabled={disabled}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                  isSelected
                    ? 'bg-[#111114] text-white shadow-sm'
                    : 'bg-[#fafafa] hover:bg-neutral-100 text-[#111114] border border-[#e8e8ea]'
                } disabled:opacity-50`}
              >
                {isSelected ? (
                  <Check className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                ) : (
                  <Plus className="w-3.5 h-3.5 text-[#6e6e73] shrink-0" />
                )}
                <span>{preset}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="pt-2">
        <label
          htmlFor="custom-amenity-input"
          className="block text-xs font-semibold text-[#111114] mb-1"
        >
          Or Create New Option
        </label>
        <div className="flex items-center gap-2">
          <input
            id="custom-amenity-input"
            type="text"
            value={newOptionText}
            onChange={(e) => {
              setNewOptionText(e.target.value);
              if (inputError) setInputError(null);
            }}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault();
                handleAddNewOption();
              }
            }}
            placeholder="e.g. Rooftop open prayer shade, Shoe rack attendant"
            maxLength={50}
            disabled={disabled}
            className="flex-1 text-xs px-3 py-2 bg-[#fafafa] border border-[#e8e8ea] text-[#111114] rounded-xl focus:outline-none focus:ring-1 focus:ring-[#111114] placeholder-[#8e8e93]"
          />
          <button
            type="button"
            onClick={() => handleAddNewOption()}
            disabled={disabled || !newOptionText.trim()}
            className="inline-flex items-center gap-1 px-3.5 py-2 text-xs font-semibold text-white bg-[#111114] hover:bg-neutral-800 disabled:bg-neutral-200 disabled:text-neutral-400 rounded-xl transition-colors focus-visible:ring-2 focus-visible:ring-[#111114] focus:outline-none shrink-0"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>Add</span>
          </button>
        </div>
        {inputError && (
          <p className="text-[11px] text-red-600 mt-1">{inputError}</p>
        )}
      </div>

      {selectedAmenities.length > 0 && (
        <div className="pt-2 border-t border-[#e8e8ea]">
          <span className="block text-[11px] font-semibold uppercase tracking-wider text-[#6e6e73] mb-2">
            Selected Additional Amenities ({selectedAmenities.length})
          </span>
          <div className="flex flex-wrap gap-1.5">
            {selectedAmenities.map((item) => (
              <span
                key={item}
                className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-medium bg-neutral-100 text-[#111114] border border-[#e8e8ea]"
              >
                <span>{item}</span>
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeAmenity(item)}
                    aria-label={`Remove ${item}`}
                    className="p-0.5 hover:text-red-600 transition-colors rounded"
                  >
                    <X className="w-3 h-3" />
                  </button>
                )}
              </span>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};
