'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  MapPin,
  Plus,
  Compass,
  Bell,
  User as UserIcon,
  LogOut,
  ShieldCheck,
  ChevronDown,
} from 'lucide-react';
import { useNotifications } from '@/hooks/useNotifications';
import { NotificationsPopover } from './NotificationsPopover';
import { NotificationToast } from './NotificationToast';
import { AuthModal } from './AuthModal';

interface NavbarProps {
  onAddMosqueClick: () => void;
  onLocateMe: () => void;
  isLocating?: boolean;
}

export function Navbar({ onAddMosqueClick, onLocateMe, isLocating }: NavbarProps) {
  const [currentUser, setCurrentUser] = useState<any>(null);
  const [isAuthModalOpen, setIsAuthModalOpen] = useState(false);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isUserMenuOpen, setIsUserMenuOpen] = useState(false);

  const {
    notifications,
    unreadCount,
    toastAlert,
    markAsRead,
    markAllAsRead,
    dismissToast,
    refresh: refreshNotifications,
  } = useNotifications();

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const stored = localStorage.getItem('user_profile');
      if (stored) {
        try {
          setCurrentUser(JSON.parse(stored));
        } catch {
          // Ignore
        }
      }
    }
  }, []);

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('access_token');
      localStorage.removeItem('user_profile');
    }
    setCurrentUser(null);
    setIsUserMenuOpen(false);
    refreshNotifications();
  };

  const handleAuthSuccess = (user: any) => {
    setCurrentUser(user);
    refreshNotifications();
  };

  return (
    <>
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-md border-b border-[#e8e8ea] px-4 py-3 flex items-center justify-between">
        {/* Brand logo & tagline */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-9 h-9 rounded-full bg-[#111114] text-white flex items-center justify-center font-bold text-sm shadow-xs">
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
        </Link>

        {/* Action Controls */}
        <div className="flex items-center gap-2">
          {/* Near Me GPS */}
          <button
            onClick={onLocateMe}
            disabled={isLocating}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111114] bg-[#fafafa] hover:bg-[#f0f0f2] border border-[#e8e8ea] rounded-full transition-colors active:scale-95 disabled:opacity-50"
            title="Find mosques near my current GPS location"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-[#6e6e73]'}`} />
            <span className="hidden xs:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>

          {/* Add Mosque */}
          <button
            onClick={onAddMosqueClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#111114] hover:bg-[#27272a] rounded-full shadow-xs transition-all active:scale-95"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Mosque</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
              className="relative w-8 h-8 rounded-full border border-[#e8e8ea] bg-[#fafafa] hover:bg-[#f0f0f2] flex items-center justify-center text-[#111114] transition-colors active:scale-95"
              aria-label="View notifications"
            >
              <Bell className="w-4 h-4 text-[#6e6e73]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-red-600 text-white text-[9px] font-bold flex items-center justify-center border-2 border-white leading-none">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>

            <NotificationsPopover
              isOpen={isNotificationsOpen}
              onClose={() => setIsNotificationsOpen(false)}
              notifications={notifications}
              unreadCount={unreadCount}
              onMarkAsRead={markAsRead}
              onMarkAllAsRead={markAllAsRead}
            />
          </div>

          {/* User Account / Sign In */}
          {currentUser ? (
            <div className="relative">
              <button
                onClick={() => setIsUserMenuOpen(!isUserMenuOpen)}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-full border border-[#e8e8ea] bg-white hover:bg-[#fafafa] transition-colors text-xs font-medium text-[#111114]"
              >
                <div className="w-6 h-6 rounded-full bg-emerald-100 text-emerald-800 flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline">
                  {currentUser.name || currentUser.email}
                </span>
                <ChevronDown className="w-3 h-3 text-[#6e6e73]" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e8e8ea] rounded-2xl shadow-xl z-50 py-1.5 overflow-hidden text-xs">
                    <div className="px-3.5 py-2 border-b border-[#e8e8ea] bg-[#fafafa]">
                      <p className="font-bold text-[#111114] truncate">{currentUser.name || 'User'}</p>
                      <p className="text-[10px] text-[#6e6e73] truncate">{currentUser.email}</p>
                      {currentUser.role === 'admin' && (
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-purple-50 text-purple-700 border border-purple-200">
                          Platform Admin
                        </span>
                      )}
                    </div>

                    {currentUser.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-[#111114] hover:bg-[#fafafa] font-medium transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-purple-600" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-red-600 hover:bg-red-50 font-medium transition-colors border-t border-[#e8e8ea]"
                    >
                      <LogOut className="w-3.5 h-3.5" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111114] bg-[#fafafa] hover:bg-[#f0f0f2] border border-[#e8e8ea] rounded-full transition-colors active:scale-95"
            >
              <UserIcon className="w-3.5 h-3.5 text-[#6e6e73]" />
              <span>Sign In</span>
            </button>
          )}
        </div>
      </header>

      {/* Auth Modal */}
      <AuthModal
        isOpen={isAuthModalOpen}
        onClose={() => setIsAuthModalOpen(false)}
        onSuccess={handleAuthSuccess}
      />

      {/* Real-time Socket Toast Alert */}
      <NotificationToast alert={toastAlert} onDismiss={dismissToast} />
    </>
  );
}
