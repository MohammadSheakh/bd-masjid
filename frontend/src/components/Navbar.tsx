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
  Building2,
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
          // Ignore parse errors
        }
      }
    }
  }, []);

  // Keyboard navigation: Escape key closes menus
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setIsUserMenuOpen(false);
        setIsNotificationsOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
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
      <header className="sticky top-0 z-30 bg-white border-b border-[#e8e8ea] px-4 py-3 flex items-center justify-between">
        {/* Brand logo & tagline */}
        <Link href="/" className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-full bg-[#111114] text-white flex items-center justify-center font-bold text-xs">
            <MapPin className="w-4 h-4 text-emerald-400" />
          </div>
          <div>
            <div className="flex items-center gap-1.5">
              <span className="font-bold text-base tracking-tight text-[#111114]">BD Masjid</span>
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
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-[#111114] bg-[#fafafa] hover:bg-[#f0f0f2] border border-[#e8e8ea] rounded-full transition-colors active:scale-95 disabled:opacity-50 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114]"
            title="Find mosques near my current GPS location"
          >
            <Compass className={`w-3.5 h-3.5 ${isLocating ? 'animate-spin text-emerald-600' : 'text-[#6e6e73]'}`} />
            <span className="hidden xs:inline">{isLocating ? 'Locating...' : 'Near Me'}</span>
          </button>

          {/* Black primary pill button: Add Mosque */}
          <button
            onClick={onAddMosqueClick}
            className="flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-[#111114] hover:bg-[#27272a] rounded-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114]"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Add Mosque</span>
          </button>

          {/* Notification Bell */}
          <div className="relative">
            <button
              onClick={() => {
                setIsNotificationsOpen(!isNotificationsOpen);
                setIsUserMenuOpen(false);
              }}
              className="relative w-8 h-8 rounded-full border border-[#e8e8ea] bg-[#fafafa] hover:bg-[#f0f0f2] flex items-center justify-center text-[#111114] transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114]"
              aria-label="View notifications"
            >
              <Bell className="w-3.5 h-3.5 text-[#111114]" />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 min-w-[16px] h-4 px-1 rounded-full bg-[#111114] text-white text-[9px] font-bold flex items-center justify-center border border-white leading-none">
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
                onClick={() => {
                  setIsUserMenuOpen(!isUserMenuOpen);
                  setIsNotificationsOpen(false);
                }}
                className="flex items-center gap-1.5 py-1 px-2.5 rounded-full border border-[#e8e8ea] bg-white hover:bg-[#fafafa] transition-colors text-xs font-medium text-[#111114] focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114]"
              >
                <div className="w-6 h-6 rounded-full bg-[#fafafa] border border-[#e8e8ea] text-[#111114] flex items-center justify-center font-bold text-[10px]">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : 'U'}
                </div>
                <span className="max-w-[80px] sm:max-w-[110px] truncate hidden xs:inline">
                  {currentUser.name || currentUser.email}
                </span>
                <ChevronDown className="w-3 h-3 text-[#6e6e73]" />
              </button>

              {isUserMenuOpen && (
                <>
                  <div className="fixed inset-0 z-40" onClick={() => setIsUserMenuOpen(false)} aria-hidden="true" />
                  <div className="absolute right-0 top-full mt-2 w-52 bg-white border border-[#e8e8ea] rounded-[10px] z-50 py-1.5 overflow-hidden text-xs">
                    <div className="px-3.5 py-2 border-b border-[#e8e8ea] bg-[#fafafa]">
                      <p className="font-bold text-[#111114] truncate">{currentUser.name || 'User'}</p>
                      <p className="text-[10px] text-[#6e6e73] truncate">{currentUser.email}</p>
                      {currentUser.role === 'admin' ? (
                        <span className="inline-flex items-center gap-1 mt-1 px-1.5 py-0.5 text-[9px] font-bold rounded bg-[#fafafa] text-[#111114] border border-[#e8e8ea]">
                          <ShieldCheck className="w-2.5 h-2.5 text-[#111114]" /> Platform Admin
                        </span>
                      ) : currentUser.staffRoles && currentUser.staffRoles.length > 0 ? (
                        <div className="mt-1 space-y-0.5">
                          {currentUser.staffRoles.map((s: any) => (
                            <span
                              key={s.id || s.role}
                              className="inline-flex items-center gap-1 px-1.5 py-0.5 text-[9px] font-medium rounded bg-[#fafafa] text-[#111114] border border-[#e8e8ea]"
                            >
                              <Building2 className="w-2.5 h-2.5 text-[#6e6e73]" />
                              {s.role} {s.mosque?.name ? `• ${s.mosque.name}` : ''}
                            </span>
                          ))}
                        </div>
                      ) : (
                        <span className="inline-block mt-1 px-1.5 py-0.5 text-[9px] font-medium rounded bg-[#fafafa] text-[#6e6e73] border border-[#e8e8ea]">
                          Community Member / Visitor
                        </span>
                      )}
                    </div>

                    {currentUser.role === 'admin' && (
                      <Link
                        href="/admin"
                        onClick={() => setIsUserMenuOpen(false)}
                        className="flex items-center gap-2 px-3.5 py-2 text-[#111114] hover:bg-[#fafafa] font-medium transition-colors"
                      >
                        <ShieldCheck className="w-4 h-4 text-[#111114]" />
                        <span>Admin Dashboard</span>
                      </Link>
                    )}

                    <button
                      onClick={handleSignOut}
                      className="w-full text-left flex items-center gap-2 px-3.5 py-2 text-red-700 hover:bg-[#fafafa] font-medium transition-colors border-t border-[#e8e8ea]"
                    >
                      <LogOut className="w-3.5 h-3.5 text-red-600" />
                      <span>Sign Out</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          ) : (
            <button
              onClick={() => setIsAuthModalOpen(true)}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-[#111114] bg-[#fafafa] hover:bg-[#f0f0f2] border border-[#e8e8ea] rounded-full transition-colors active:scale-95 focus-visible:outline-hidden focus-visible:ring-1 focus-visible:ring-[#111114]"
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
