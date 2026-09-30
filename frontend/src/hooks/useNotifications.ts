'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import {
  fetchNotifications,
  fetchUnreadCount,
  markNotificationAsRead,
  markAllNotificationsAsRead,
  UserNotificationItem,
} from '@/lib/api';

export function useNotifications() {
  const [notifications, setNotifications] = useState<UserNotificationItem[]>([]);
  const [unreadCount, setUnreadCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [toastAlert, setToastAlert] = useState<{
    id: string;
    title: string;
    body: string;
    mosqueName?: string;
    type: string;
  } | null>(null);

  const socketRef = useRef<Socket | null>(null);

  const loadInitialData = useCallback(async () => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('access_token') : null;
    if (!token) {
      setNotifications([]);
      setUnreadCount(0);
      return;
    }

    setIsLoading(true);
    try {
      const [notifsData, count] = await Promise.all([
        fetchNotifications({ limit: 15 }),
        fetchUnreadCount(),
      ]);
      setNotifications(notifsData.items || []);
      setUnreadCount(count || 0);
    } catch {
      // Graceful fallback
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    loadInitialData();

    if (typeof window === 'undefined') return;

    const token = localStorage.getItem('access_token');
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:6733/api/v1';
    const socketUrl = apiBase.replace('/api/v1', '');

    const socket = io(`${socketUrl}/notifications`, {
      auth: { token: token ? `Bearer ${token}` : undefined },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
    });

    socketRef.current = socket;

    socket.on('notification:new', (payload: any) => {
      // Add incoming to state
      setNotifications((prev) => [
        {
          id: payload.id || `notif-${Date.now()}`,
          userId: '',
          mosqueId: payload.mosqueId,
          type: payload.type,
          title: payload.title,
          body: payload.body,
          entityId: payload.entityId,
          isRead: false,
          createdAt: payload.createdAt || new Date().toISOString(),
          mosque: { id: payload.mosqueId, name: payload.mosqueName, city: null },
        },
        ...prev,
      ]);

      setUnreadCount((prev) => prev + 1);

      // Trigger pop-in toast alert
      setToastAlert({
        id: String(Date.now()),
        title: payload.title,
        body: payload.body,
        mosqueName: payload.mosqueName,
        type: payload.type,
      });

      // Auto dismiss toast after 6 seconds
      setTimeout(() => {
        setToastAlert(null);
      }, 6000);
    });

    socket.on('notification:unread_count', (data: { unreadCount: number }) => {
      setUnreadCount(data.unreadCount);
    });

    return () => {
      socket.disconnect();
    };
  }, [loadInitialData]);

  const handleMarkRead = async (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, isRead: true } : n)),
    );
    setUnreadCount((prev) => Math.max(0, prev - 1));
    await markNotificationAsRead(id);
  };

  const handleMarkAllRead = async () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    setUnreadCount(0);
    await markAllNotificationsAsRead();
  };

  const dismissToast = () => setToastAlert(null);

  return {
    notifications,
    unreadCount,
    isLoading,
    toastAlert,
    markAsRead: handleMarkRead,
    markAllAsRead: handleMarkAllRead,
    dismissToast,
    refresh: loadInitialData,
  };
}
