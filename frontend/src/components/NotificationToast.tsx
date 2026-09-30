'use client';

import React from 'react';
import { X, Megaphone, Clock, HeartHandshake, Bell } from 'lucide-react';

interface NotificationToastProps {
  alert: {
    id: string;
    title: string;
    body: string;
    mosqueName?: string;
    type: string;
  } | null;
  onDismiss: () => void;
}

export function NotificationToast({ alert, onDismiss }: NotificationToastProps) {
  if (!alert) return null;

  const getIcon = (type: string) => {
    switch (type) {
      case 'ANNOUNCEMENT':
        return <Megaphone className="w-4 h-4 text-blue-600" />;
      case 'SCHEDULE_CHANGE':
        return <Clock className="w-4 h-4 text-amber-600" />;
      case 'DONATION_UPDATE':
        return <HeartHandshake className="w-4 h-4 text-emerald-600" />;
      default:
        return <Bell className="w-4 h-4 text-emerald-600" />;
    }
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 max-w-sm w-full animate-in slide-in-from-bottom-4 duration-200">
      <div className="bg-white border border-[#e8e8ea] rounded-2xl shadow-xl p-3.5 flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-emerald-50 border border-emerald-200 flex items-center justify-center shrink-0 mt-0.5">
          {getIcon(alert.type)}
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-1.5">
            <span className="text-[10px] font-bold uppercase tracking-wider text-emerald-700 bg-emerald-50 px-1.5 py-0.5 rounded">
              Live Alert
            </span>
            {alert.mosqueName && (
              <span className="text-[11px] font-medium text-[#6e6e73] truncate">
                • {alert.mosqueName}
              </span>
            )}
          </div>

          <h4 className="text-xs font-bold text-[#111114] mt-1">{alert.title}</h4>
          <p className="text-[11px] text-[#6e6e73] line-clamp-2 mt-0.5">{alert.body}</p>
        </div>

        <button
          onClick={onDismiss}
          className="text-[#6e6e73] hover:text-[#111114] p-1 rounded-full hover:bg-[#fafafa] transition-colors"
          aria-label="Dismiss notification"
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>
    </div>
  );
}
