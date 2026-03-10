'use client';

import { useState, useEffect, useRef } from 'react';
import { Bell, X, Check } from 'lucide-react';
import Link from 'next/link';
import clsx from 'clsx';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: string;
  read: boolean;
  link?: string | null;
  createdAt: string;
}

export default function NotificationBell() {
  const [open, setOpen] = useState(false);
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchNotifications = async () => {
    try {
      const res = await fetch('/api/notifications?limit=10');
      const data = await res.json();
      setNotifications(data.data ?? []);
      setUnreadCount(data.unreadCount ?? 0);
    } catch {
      // ignore
    }
  };

  useEffect(() => {
    fetchNotifications();
    const interval = setInterval(fetchNotifications, 30000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const markRead = async (id: string) => {
    await fetch(`/api/notifications/${id}/read`, { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => (n.id === id ? { ...n, read: true } : n)));
    setUnreadCount((c) => Math.max(0, c - 1));
  };

  const markAllRead = async () => {
    await fetch('/api/notifications/read-all', { method: 'PUT' });
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
    setUnreadCount(0);
  };

  const typeColor: Record<string, string> = {
    info: 'text-blue-400',
    warning: 'text-yellow-400',
    error: 'text-red-400',
    success: 'text-green-400',
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setOpen((v) => !v)}
        className="relative p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
        aria-label="Benachrichtigungen"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 w-4 h-4 bg-red-500 rounded-full text-[10px] font-bold text-white flex items-center justify-center">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-slate-900 border border-slate-700 rounded-xl shadow-2xl z-50 overflow-hidden">
          <div className="flex items-center justify-between px-4 py-3 border-b border-slate-800">
            <span className="text-white font-semibold text-sm">Benachrichtigungen</span>
            <div className="flex items-center gap-2">
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="flex items-center gap-1 text-xs text-slate-400 hover:text-white transition-colors"
                >
                  <Check className="w-3 h-3" />
                  Alle lesen
                </button>
              )}
              <button onClick={() => setOpen(false)} className="text-slate-500 hover:text-white">
                <X className="w-4 h-4" />
              </button>
            </div>
          </div>

          <div className="max-h-80 overflow-y-auto">
            {notifications.length === 0 ? (
              <p className="text-slate-500 text-sm text-center py-8">Keine Benachrichtigungen</p>
            ) : (
              notifications.map((n) => {
                const Wrapper = n.link ? Link : 'div';
                return (
                  <Wrapper
                    key={n.id}
                    href={n.link ?? '#'}
                    onClick={() => !n.read && markRead(n.id)}
                    className={clsx(
                      'flex items-start gap-3 px-4 py-3 border-b border-slate-800 hover:bg-slate-800 cursor-pointer transition-colors',
                      !n.read && 'bg-slate-800/50',
                    )}
                  >
                    <span className={clsx('text-lg leading-none mt-0.5', typeColor[n.type] ?? typeColor.info)}>
                      {n.type === 'error' ? '🚨' : n.type === 'warning' ? '⚠️' : n.type === 'success' ? '✅' : 'ℹ️'}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-white text-xs font-medium truncate">{n.title}</p>
                      <p className="text-slate-400 text-xs mt-0.5 line-clamp-2">{n.message}</p>
                      <p className="text-slate-600 text-[10px] mt-1">
                        {new Date(n.createdAt).toLocaleString('de-DE')}
                      </p>
                    </div>
                    {!n.read && <span className="w-2 h-2 bg-blue-500 rounded-full mt-1 flex-shrink-0" />}
                  </Wrapper>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
