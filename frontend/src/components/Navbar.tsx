'use client';

import React from 'react';
import { MapPin, Plus, Compass } from 'lucide-react';

interface NavbarProps {
  onAddMosqueClick: () => void;
  onLocateMe: () => void;
  isLocating?: boolean;
}

export function Navbar({ onAddMosqueClick, onLocateMe, isLocating }: NavbarProps) {
  return (
    <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8e8ea] px-4 py-3 flex items-center justify-between">
      {/* Brand logo & tagline */}
      <div className="flex items-center gap-2.5">
        <div className="w-9 h-9 rounded-full bg-[#111114] text-white flex items-center justify-center font-bold text-sm shadow-sm">
          <MapPin className="w-5 h-5 text-emerald-400" />
        </div>
        <div>
          <div className="flex items-center gap-1.5">
            <span className="font-bold text-base tracking-tight text-[#111114]">BD Masjid</span>
            <span className="text-[10px] font-semibold uppercase tracking-wider px-1.5 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200">
              Verified
            </span>
          </div>
          <p className="text-xs text-[#6e6e73] hidden sm:block">Community Mosques & Prayer Timetables</p>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex items-center gap-2">
        <button
          onClick={onLocateMe}
          disabled={isLocating}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111114] bg-[#fafafa] hover:bg-[#f0f0f2] border border-[#e8e8ea] rounded-full transition-colors active:scale-95 disabled:opacity-50"
          title="Find mosques near my current GPS location"
        >
          <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-[#6e6e73]'}`} />
          <span className="hidden xs:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
        </button>

        <button
          onClick={onAddMosqueClick}
          className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#111114] hover:bg-[#27272a] rounded-full shadow-sm transition-all active:scale-95"
        >
          <Plus className="w-3.5 h-3.5" />
          <span>Add Mosque</span>
        </button>
      </div>
    </header>
  );
}
