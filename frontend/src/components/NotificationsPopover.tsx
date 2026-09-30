'use client';

import React from 'react';
import Link from 'next/link';
import {
  Bell,
  Megaphone,
  Clock,
  HeartHandshake,
  CheckCheck,
  ChevronRight,
  ExternalLink,
} from 'lucide-react';
import { UserNotificationItem } from '@/lib/api';

interface NotificationsPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  notifications: UserNotificationItem[];
  unreadCount: number;
  onMarkAsRead: (id: string) => void;
  onMarkAllAsRead: () => void;
}

export function NotificationsPopover({
  isOpen,
  onClose,
  notifications,
  unreadCount,
  onMarkAsRead,
  onMarkAllAsRead,
}: NotificationsPopoverProps) {
  if (!isOpen) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-3.5 h-3.5 text-blue-600" />;
      case 'SCHEDULE_CHANGE':
        return <Clock className="w-3.5 h-3.5 text-amber-600" />;
      case 'DONATION_UPDATE':
        return <HeartHandshake className="w-3.5 h-3.5 text-emerald-600" />;
      default:
        return <Bell className="w-3.5 h-3.5 text-indigo-600" />;
    }
  };

  const formatTime = (iso: string) => {
    try {
      const diffSec = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
      if (diffSec < 60) return 'Just now';
      const diffMin = Math.floor(diffSec / 60);
      if (diffMin < 60) return `${diffMin}m ago`;
      const diffHr = Math.floor(diffMin / 60);
      if (diffHr < 24) return `${diffHr}h ago`;
      const diffDay = Math.floor(diffHr / 24);
      return `${diffDay}d ago`;
    } catch {
      return '';
    }
  };

  return (
    <>
      {/* Invisible backdrop */}
      <div className="fixed inset-0 z-40" onClick={onClose} />

      <div className="absolute right-0 top-full mt-2 w-80 sm:w-96 bg-white border border-[#e8e8ea] rounded-2xl shadow-xl z-50 overflow-hidden animate-in fade-in zoom-in-95 duration-100">
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-3 border-b border-[#e8e8ea] bg-[#fafafa]">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-[#111114]">Notifications</span>
            {unreadCount > 0 && (
              <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-600 text-white leading-none">
                {unreadCount}
              </span>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={onMarkAllAsRead}
              className="text-[11px] font-semibold text-emerald-700 hover:text-emerald-800 flex items-center gap-1 transition-colors"
            >
              <CheckCheck className="w-3 h-3" />
              <span>Mark all read</span>
            </button>
          )}
        </div>

        {/* List */}
        <div className="max-h-[380px] overflow-y-auto divide-y divide-[#e8e8ea]">
          {notifications.length === 0 ? (
            <div className="py-10 text-center px-4">
              <div className="w-9 h-9 mx-auto rounded-full bg-[#fafafa] border border-[#e8e8ea] flex items-center justify-center text-[#6e6e73] mb-2">
                <Bell className="w-4 h-4 text-[#6e6e73]" />
              </div>
              <p className="text-xs font-medium text-[#111114]">No notifications yet</p>
              <p className="text-[11px] text-[#6e6e73] mt-0.5">
                Follow mosques to get live alerts for prayer timetables & announcements.
              </p>
            </div>
          ) : (
            notifications.map((n) => (
              <div
                key={n.id}
                onClick={() => !n.isRead && onMarkAsRead(n.id)}
                className={`p-3.5 flex items-start gap-3 transition-colors cursor-pointer ${
                  n.isRead ? 'bg-white hover:bg-[#fafafa]' : 'bg-emerald-50/40 hover:bg-emerald-50/70'
                }`}
              >
                <div className="w-7 h-7 rounded-full bg-white border border-[#e8e8ea] shadow-2xs flex items-center justify-center shrink-0 mt-0.5">
                  {getIcon(n.type)}
                </div>

                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="text-xs font-semibold text-[#111114] truncate">
                      {n.title}
                    </p>
                    <span className="text-[10px] text-[#6e6e73] shrink-0">
                      {formatTime(n.createdAt)}
                    </span>
                  </div>

                  <p className="text-[11px] text-[#6e6e73] line-clamp-2 mt-0.5">
                    {n.body}
                  </p>

                  {n.mosque?.id && (
                    <Link
                      href={`/mosques/${n.mosque.id}`}
                      onClick={onClose}
                      className="inline-flex items-center gap-1 text-[11px] font-medium text-emerald-700 hover:underline mt-1.5"
                    >
                      <span>{n.mosque.name}</span>
                      <ChevronRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {!n.isRead && (
                  <span className="w-2 h-2 rounded-full bg-emerald-600 shrink-0 mt-1.5" />
                )}
              </div>
            ))
          )}
        </div>
      </div>
    </>
  );
}
