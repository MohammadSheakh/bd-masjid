'use client';

import React, { useState, useEffect, useMemo } from 'react';
import dynamic from 'next/dynamic';
import { Mosque } from '@/types/mosque';
import { fetchNearbyMosques, searchMosques } from '@/lib/api';
import { Navbar } from '@/components/Navbar';
import { MosqueCard } from '@/components/MosqueCard';
import { MosqueDetailModal } from '@/components/MosqueDetailModal';
import { AddMosqueModal } from '@/components/AddMosqueModal';
import { SuggestionModal } from '@/components/SuggestionModal';
import { ReportModal } from '@/components/ReportModal';
import { RoleClaimModal } from '@/components/RoleClaimModal';
import { AnnouncementModal } from '@/components/AnnouncementModal';
import { DonationModal } from '@/components/DonationModal';
import { Search, Map as MapIcon, List, Compass, Filter, RefreshCw, Check } from 'lucide-react';

// Dynamically import Leaflet map (client-side only to prevent SSR window issues)
const MosqueMap = dynamic(
  () => import('@/components/MosqueMap').then((mod) => mod.MosqueMap),
  {
    ssr: false,
    loading: () => (
      <div className="w-full h-full flex items-center justify-center bg-[#f4f4f5] text-xs text-[#6e6e73]">
        <div className="flex items-center gap-2">
          <RefreshCw className="w-4 h-4 animate-spin text-emerald-600" />
          <span>Loading OpenStreetMap tiles...</span>
        </div>
      </div>
    ),
  },
);

export default function HomePage() {
  const [mosques, setMosques] = useState<Mosque[]>([]);
  const [selectedMosque, setSelectedMosque] = useState<Mosque | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCity, setSelectedCity] = useState('All');
  const [filterWomen, setFilterWomen] = useState(false);
  const [filterAC, setFilterAC] = useState(false);
  const [filterParking, setFilterParking] = useState(false);
  const [mobileTab, setMobileTab] = useState<'map' | 'list'>('list');

  // GPS user location
  const [userLocation, setUserLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [isLocating, setIsLocating] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isPinDropMode, setIsPinDropMode] = useState(false);
  const [droppedPin, setDroppedPin] = useState<{ lat: number; lng: number } | null>(null);
  const [suggestionMosque, setSuggestionMosque] = useState<Mosque | null>(null);
  const [reportMosque, setReportMosque] = useState<Mosque | null>(null);
  const [roleClaimMosque, setRoleClaimMosque] = useState<Mosque | null>(null);
  const [announcementMosque, setAnnouncementMosque] = useState<Mosque | null>(null);
  const [donationMosque, setDonationMosque] = useState<Mosque | null>(null);

  // Available cities for filtering
  const cities = ['All', 'Dhaka', 'Chattogram', 'Sylhet'];

  // Initial Load: Try geolocation or fallback to central Dhaka
  useEffect(() => {
    loadInitialMosques();
  }, []);

  const loadInitialMosques = async (customLat?: number, customLng?: number) => {
    setIsLoading(true);
    const lat = customLat || 23.75;
    const lng = customLng || 90.39;
    try {
      const data = await fetchNearbyMosques(lat, lng, 10000);
      setMosques(data);
    } finally {
      setIsLoading(false);
    }
  };

  // Search filter
  useEffect(() => {
    const timer = setTimeout(async () => {
      if (
        searchQuery.trim() ||
        selectedCity !== 'All' ||
        filterWomen ||
        filterAC ||
        filterParking
      ) {
        setIsLoading(true);
        try {
          const results = await searchMosques(
            searchQuery.trim() || undefined,
            selectedCity !== 'All' ? selectedCity : undefined,
            {
              hasSeparateWomenSpace: filterWomen || undefined,
              hasAirConditioning: filterAC || undefined,
              hasParking: filterParking || undefined,
            },
          );
          setMosques(results);
        } finally {
          setIsLoading(false);
        }
      } else {
        loadInitialMosques(userLocation?.lat, userLocation?.lng);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery, selectedCity, filterWomen, filterAC, filterParking]);

  // Handle GPS Locate Me
  const handleLocateMe = () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }
    setIsLocating(true);
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        const coords = { lat: pos.coords.latitude, lng: pos.coords.longitude };
        setUserLocation(coords);
        loadInitialMosques(coords.lat, coords.lng);
        setIsLocating(false);
      },
      (err) => {
        console.warn('Geolocation failed:', err.message);
        setIsLocating(false);
      },
      { timeout: 10000 },
    );
  };

  // Handle dropped pin from map click
  const handleMapPinDrop = (coords: { lat: number; lng: number }) => {
    setDroppedPin(coords);
    setIsPinDropMode(false);
    setIsAddModalOpen(true);
  };

  // Mosque added callback
  const handleMosqueCreated = (newMosque: Mosque) => {
    setMosques((prev) => [newMosque, ...prev]);
    setSelectedMosque(newMosque);
  };

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-[#fafafa]">
      {/* Top Navigation */}
      <Navbar
        onAddMosqueClick={() => setIsAddModalOpen(true)}
        onLocateMe={handleLocateMe}
        isLocating={isLocating}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col md:flex-row h-[calc(100vh-61px)] overflow-hidden relative">
        {/* Left Panel: Search, Filter, and Mosque List */}
        <div
          className={`flex-1 md:w-[420px] md:max-w-[420px] md:flex-none flex flex-col h-full bg-white border-r border-[#e8e8ea] z-10 ${
            mobileTab === 'list' ? 'flex' : 'hidden md:flex'
          }`}
        >
          {/* Search & City Filter Bar */}
          <div className="p-3 sm:p-4 border-b border-[#e8e8ea] space-y-2.5 bg-white">
            <div className="relative">
              <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-[#6e6e73]" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search mosque name, street, or area..."
                className="w-full pl-9 pr-4 py-2 text-xs sm:text-sm rounded-full border border-[#e8e8ea] bg-[#fafafa] focus:bg-white focus:outline-none focus:ring-2 focus:ring-[#111114] transition-all"
              />
            </div>

            {/* City Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
              {cities.map((city) => (
                <button
                  key={city}
                  onClick={() => setSelectedCity(city)}
                  className={`px-3 py-1 rounded-full text-xs font-semibold whitespace-nowrap transition-colors ${
                    selectedCity === city
                      ? 'bg-[#111114] text-white shadow-sm'
                      : 'bg-[#fafafa] text-[#6e6e73] hover:bg-zinc-100 border border-[#e8e8ea]'
                  }`}
                >
                  {city}
                </button>
              ))}
            </div>

            {/* Facility Filter Pills */}
            <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none pt-0.5 border-t border-[#f0f0f2]">
              <span className="text-[10px] font-bold uppercase tracking-wider text-[#6e6e73] pr-1">
                Facilities:
              </span>
              <button
                onClick={() => setFilterWomen(!filterWomen)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  filterWomen
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-[#fafafa] text-[#6e6e73] hover:bg-zinc-100 border border-[#e8e8ea]'
                }`}
              >
                {filterWomen && <Check className="w-3 h-3" />}
                Women's Area
              </button>
              <button
                onClick={() => setFilterAC(!filterAC)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  filterAC
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-[#fafafa] text-[#6e6e73] hover:bg-zinc-100 border border-[#e8e8ea]'
                }`}
              >
                {filterAC && <Check className="w-3 h-3" />}
                AC
              </button>
              <button
                onClick={() => setFilterParking(!filterParking)}
                className={`px-2.5 py-1 rounded-full text-[11px] font-semibold whitespace-nowrap transition-colors flex items-center gap-1 ${
                  filterParking
                    ? 'bg-emerald-700 text-white shadow-sm'
                    : 'bg-[#fafafa] text-[#6e6e73] hover:bg-zinc-100 border border-[#e8e8ea]'
                }`}
              >
                {filterParking && <Check className="w-3 h-3" />}
                Parking
              </button>
            </div>
          </div>

          {/* Mosque List Header / Counter */}
          <div className="px-4 py-2 bg-[#fafafa] border-b border-[#f0f0f2] flex items-center justify-between text-xs text-[#6e6e73]">
            <span>
              {isLoading ? 'Searching...' : `${mosques.length} mosques discovered`}
            </span>
            <span className="text-[11px] font-medium text-emerald-700">Live Jammat times</span>
          </div>

          {/* Mosque Cards List */}
          <div className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-3">
            {isLoading && mosques.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e6e73] flex flex-col items-center justify-center space-y-2">
                <RefreshCw className="w-5 h-5 animate-spin text-zinc-400" />
                <span>Loading mosques...</span>
              </div>
            ) : mosques.length === 0 ? (
              <div className="p-8 text-center text-xs text-[#6e6e73] space-y-2">
                <p className="font-semibold text-sm text-[#111114]">No mosques found</p>
                <p>Try searching for a different area or add a new mosque.</p>
                <button
                  onClick={() => setIsAddModalOpen(true)}
                  className="mt-2 px-4 py-2 rounded-full bg-[#111114] text-white text-xs font-semibold"
                >
                  Add This Mosque
                </button>
              </div>
            ) : (
              mosques.map((mosque) => (
                <MosqueCard
                  key={mosque.id}
                  mosque={mosque}
                  isSelected={selectedMosque?.id === mosque.id}
                  onSelect={(m) => {
                    setSelectedMosque(m);
                    // On mobile, keep list or open modal
                  }}
                />
              ))
            )}
          </div>
        </div>

        {/* Right Panel: Interactive Map */}
        <div
          className={`flex-1 h-full relative ${
            mobileTab === 'map' ? 'flex' : 'hidden md:flex'
          }`}
        >
          <MosqueMap
            mosques={mosques}
            selectedMosque={selectedMosque}
            onSelectMosque={(m) => setSelectedMosque(m)}
            userLocation={userLocation}
            isPinDropMode={isPinDropMode}
            pinLocation={droppedPin}
            onPinDrop={handleMapPinDrop}
          />
        </div>

        {/* Mobile View Toggle Bar (Fixed at bottom for mobile) */}
        <div className="md:hidden fixed bottom-5 left-1/2 -translate-x-1/2 z-20 bg-[#111114] text-white rounded-full p-1 shadow-2xl flex items-center gap-1 border border-zinc-700">
          <button
            onClick={() => setMobileTab('list')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              mobileTab === 'list'
                ? 'bg-white text-[#111114] shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <List className="w-3.5 h-3.5" />
            <span>List ({mosques.length})</span>
          </button>
          <button
            onClick={() => setMobileTab('map')}
            className={`flex items-center gap-1.5 px-4 py-2 rounded-full text-xs font-semibold transition-all ${
              mobileTab === 'map'
                ? 'bg-white text-[#111114] shadow'
                : 'text-zinc-400 hover:text-white'
            }`}
          >
            <MapIcon className="w-3.5 h-3.5" />
            <span>Map</span>
          </button>
        </div>
      </div>

      {/* Mosque Full Details Modal */}
      {selectedMosque && (
        <MosqueDetailModal
          mosque={selectedMosque}
          onClose={() => setSelectedMosque(null)}
          onOpenSuggestion={(m) => setSuggestionMosque(m)}
          onOpenReport={(m) => setReportMosque(m)}
          onOpenRoleClaim={(m) => setRoleClaimMosque(m)}
          onOpenAnnouncements={(m) => setAnnouncementMosque(m)}
          onOpenDonations={(m) => setDonationMosque(m)}
        />
      )}

      {/* Add Mosque Modal */}
      <AddMosqueModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        onCreated={handleMosqueCreated}
        defaultCoords={droppedPin || userLocation}
        onActivatePinDropMode={() => {
          setIsPinDropMode(true);
          setMobileTab('map');
        }}
      />

      {/* Suggestion Modal */}
      {suggestionMosque && (
        <SuggestionModal
          mosque={suggestionMosque}
          onClose={() => setSuggestionMosque(null)}
          onSuccess={() => {}}
        />
      )}

      {/* Report Modal */}
      {reportMosque && (
        <ReportModal
          mosque={reportMosque}
          onClose={() => setReportMosque(null)}
          onSuccess={() => {}}
        />
      )}

      {/* Role Claim Modal */}
      {roleClaimMosque && (
        <RoleClaimModal
          mosque={roleClaimMosque}
          onClose={() => setRoleClaimMosque(null)}
        />
      )}

      {/* Announcement & Notices Modal */}
      {announcementMosque && (
        <AnnouncementModal
          isOpen={!!announcementMosque}
          mosque={announcementMosque}
          onClose={() => setAnnouncementMosque(null)}
          onAnnouncementCreated={(newNotice) => {
            if (selectedMosque && selectedMosque.id === announcementMosque.id) {
              setSelectedMosque({
                ...selectedMosque,
                announcements: [newNotice, ...(selectedMosque.announcements || [])],
              });
            }
          }}
        />
      )}

      {/* Verified Donation Modal */}
      {donationMosque && (
        <DonationModal
          isOpen={!!donationMosque}
          mosque={donationMosque}
          onClose={() => setDonationMosque(null)}
          onDonationAdded={(newMethod) => {
            if (selectedMosque && selectedMosque.id === donationMosque.id) {
              setSelectedMosque({
                ...selectedMosque,
                donationMethods: [
                  ...(selectedMosque.donationMethods || []),
                  newMethod,
                ],
              });
            }
          }}
        />
      )}
    </div>
  );
}
