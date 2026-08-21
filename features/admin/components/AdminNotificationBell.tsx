'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import { Bell, BellRing, Sparkles, Plus, CheckCheck, Trash2, X } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, apiFetch } from '@/lib/api/config';
import { setScrambleMode, generateScrambles, getScrambleSummary, getScrambleMode } from '@/features/admin/api/adminScrambleApi';

export interface ScrambleDepletedNotification {
  id: string;
  competitionMode: string;
  puzzleTypeId: string;
  puzzleCode: string;
  puzzleName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  source?: 'scramble' | 'tournament';
  typeCode?: string;
  title?: string;
}

interface AdminNotificationDto {
  id: string;
  typeCode: string;
  title: string;
  body?: string | null;
  payload?: string | null;
  isRead: boolean;
  createdAt: string;
}

export default function AdminNotificationBell() {
  const [notifications, setNotifications] = useState<ScrambleDepletedNotification[]>(() => {
    if (typeof window !== 'undefined') {
      try {
        const stored = localStorage.getItem('admin_scramble_notifications');
        return stored ? JSON.parse(stored) : [];
      } catch {
        return [];
      }
    }
    return [];
  });
  const [isOpen, setIsOpen] = useState(false);
  const [busyId, setBusyId] = useState<string | null>(null);
  const [statusMessage, setStatusMessage] = useState<string | null>(null);
  const connectionRef = useRef<signalR.HubConnection | null>(null);

  const unreadCount = notifications.filter((n) => !n.isRead).length;

  const loadAdminNotifications = useCallback(async () => {
    try {
      const serverItems = await apiFetch<AdminNotificationDto[]>('/api/admin/notifications?limit=50');
      const mapped = serverItems.map((item) => ({
        id: `admin-${item.id}`,
        competitionMode: 'TOURNAMENT',
        puzzleTypeId: '',
        puzzleCode: 'STATUS',
        puzzleName: item.title,
        message: item.body || item.title,
        timestamp: item.createdAt,
        isRead: item.isRead,
        source: 'tournament' as const,
        typeCode: item.typeCode,
        title: item.title,
      }));
      setNotifications((previous) => [
        ...mapped,
        ...previous.filter((item) => !item.id.startsWith('admin-')),
      ].slice(0, 100));
    } catch {
      // Keep scramble notifications available when the notification table is not migrated yet.
    }
  }, []);

  // Persist notifications to localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      try {
        localStorage.setItem('admin_scramble_notifications', JSON.stringify(notifications));
      } catch {
        // Ignore localStorage quota errors
      }
    }
  }, [notifications]);

  // Sync scramble pool status from backend API (catches notifications even if Admin was offline)
  const syncPoolStatus = useCallback(async () => {
    if (typeof window === 'undefined') return;
    const token = localStorage.getItem('access_token') || localStorage.getItem('mobile_access_token');
    if (!token) return;

    try {
      const [summaries, modeRes] = await Promise.all([
        getScrambleSummary().catch(() => []),
        getScrambleMode().catch(() => ({ mode: 'MANUAL' as const })),
      ]);

      if (modeRes.mode === 'MANUAL') {
        // Track modes for puzzle types actively used in tournaments or online matches
        const modesToTrack = ['ONLINE_MATCH', 'OFFLINE', 'ONLINE_ASYNC'];
        const activeDepletedKeys = new Set<string>();

        summaries.forEach((s) => {
          if (s.status === 'AVAILABLE' && s.count === 0 && modesToTrack.includes(s.competitionMode)) {
            activeDepletedKeys.add(`${s.competitionMode}-${s.puzzleCode}`);
          }
        });

        setNotifications((prev) => {
          const prevMap = new Map(prev.map((n) => [`${n.competitionMode}-${n.puzzleCode}`, n]));
          const updatedList: ScrambleDepletedNotification[] = [];

          // Process each currently depleted pool for active competition modes
          activeDepletedKeys.forEach((key) => {
            const [mode, puzzleCode] = key.split('-');
            const summaryItem = summaries.find((s) => s.competitionMode === mode && s.puzzleCode === puzzleCode);

            if (prevMap.has(key)) {
              // Preserve existing notification with its ORIGINAL timestamp and ORIGINAL isRead status!
              updatedList.push(prevMap.get(key)!);
            } else {
              // Brand new notification: set initial timestamp and mark as unread
              updatedList.push({
                id: `api-${mode}-${puzzleCode}`,
                competitionMode: mode,
                puzzleTypeId: summaryItem?.puzzleTypeId || '',
                puzzleCode: puzzleCode,
                puzzleName: `Rubik ${puzzleCode}`,
                message: `Scramble pool for ${mode} (${puzzleCode}) is empty! Please generate scrambles or enable AUTO mode.`,
                timestamp: new Date().toISOString(),
                isRead: false,
              });
            }
          });

          // Keep non-API notifications (SignalR alerts) that haven't been resolved
          prev.forEach((n) => {
            if (!n.id.startsWith('api-') && !updatedList.some((item) => item.id === n.id)) {
              updatedList.push(n);
            }
          });

          return updatedList;
        });
      } else {
        // If mode is AUTO, all manual pool warnings are resolved! Clear API notifications.
        setNotifications((prev) => prev.filter((n) => !n.id.startsWith('api-')));
      }
    } catch {
      // Ignore API errors when unauthenticated or offline
    }
  }, []);

  useEffect(() => {
    // 1. Initial API sync to catch notifications that occurred while Admin was offline
    void syncPoolStatus();
    void loadAdminNotifications();
    const intervalId = setInterval(() => void syncPoolStatus(), 30000);

    // 2. Build SignalR Hub Connection only if token exists
    const token = typeof window !== 'undefined' ? (localStorage.getItem('access_token') || localStorage.getItem('mobile_access_token')) : '';
    if (!token) {
      return () => clearInterval(intervalId);
    }

    const hubUrl = `${API_BASE_URL.replace(/\/+$/, '')}/hubs/tournament`;
    const connection = new signalR.HubConnectionBuilder()
      .withUrl(hubUrl, {
        accessTokenFactory: () => {
          if (typeof window !== 'undefined') {
            return localStorage.getItem('access_token') || localStorage.getItem('mobile_access_token') || '';
          }
          return '';
        },
      })
      .configureLogging(signalR.LogLevel.None)
      .withAutomaticReconnect()
      .build();

    connection.on('ScramblePoolDepleted', (data: any) => {
      console.log('[SignalR Admin Bell] Received ScramblePoolDepleted event:', data);
      const mode = data.competitionMode || data.CompetitionMode || 'ONLINE_MATCH';
      const puzzleCode = data.puzzleCode || data.PuzzleCode || '3x3x3';
      const key = `${mode}-${puzzleCode}`;

      setNotifications((prev) => {
        const existing = prev.find((n) => `${n.competitionMode}-${n.puzzleCode}` === key);
        if (existing) {
          // If notification already exists for this pool, do NOT overwrite its timestamp or isRead status
          return prev;
        }
        const newNotif: ScrambleDepletedNotification = {
          id: `sr-${Date.now()}-${Math.random()}`,
          competitionMode: mode,
          puzzleTypeId: data.puzzleTypeId || data.PuzzleTypeId || '',
          puzzleCode: puzzleCode,
          puzzleName: data.puzzleName || data.PuzzleName || `Rubik ${puzzleCode}`,
          message: data.message || data.Message || `Scramble pool for ${mode} (${puzzleCode}) is empty!`,
          timestamp: data.timestamp || data.Timestamp || new Date().toISOString(),
          isRead: false,
          source: 'scramble',
        };
        return [newNotif, ...prev];
      });

      // Play subtle audio alert if possible
      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime); // A5 note
        gain.gain.setValueAtTime(0.1, audioCtx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + 0.4);
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.4);
      } catch {
        // Audio playback restricted or unsupported
      }
    });

    connection.on('AdminNotificationCreated', (data: AdminNotificationDto) => {
      const notification = {
        id: `admin-${data.id}`,
        competitionMode: 'TOURNAMENT',
        puzzleTypeId: '',
        puzzleCode: 'STATUS',
        puzzleName: data.title,
        message: data.body || data.title,
        timestamp: data.createdAt,
        isRead: false,
        source: 'tournament' as const,
        typeCode: data.typeCode,
        title: data.title,
      };
      setNotifications((previous) => previous.some((item) => item.id === notification.id)
        ? previous
        : [notification, ...previous].slice(0, 100));
    });

    connection
      .start()
      .then(() => console.log('[SignalR Admin Bell] Connected to TournamentHub successfully.'))
      .catch((err) => {
        // Gracefully handle negotiation stop errors when unauthenticated or during logout
        if (err?.message?.includes('stopped during negotiation')) return;
        console.warn('[SignalR Admin Bell] Connection notice:', err?.message || err);
      });

    connectionRef.current = connection;

    return () => {
      clearInterval(intervalId);
      connection.stop().catch(() => {});
    };
  }, [loadAdminNotifications, syncPoolStatus]);

  const handleToggleAutoMode = useCallback(async (notifId: string) => {
    setBusyId(notifId);
    setStatusMessage(null);
    try {
      await setScrambleMode('AUTO');
      setStatusMessage('Successfully switched to AUTO scramble generation mode!');
      setNotifications((prev) =>
        prev.map((n) => (n.id === notifId ? { ...n, isRead: true } : n))
      );
    } catch (err: any) {
      setStatusMessage(`Error: ${err?.message || 'Failed to switch generation mode'}`);
    } finally {
      setBusyId(null);
    }
  }, []);

  const handleGenerateScramblesEmergency = useCallback(
    async (notif: ScrambleDepletedNotification) => {
      setBusyId(notif.id);
      setStatusMessage(null);
      try {
        await generateScrambles({
          competitionMode: notif.competitionMode as any,
          puzzleTypeId: notif.puzzleTypeId,
          count: 20,
          notes: 'Emergency 20 scrambles generated from SignalR alert',
          autoApprove: true,
        });
        setStatusMessage(`Emergency generated 20 AVAILABLE scrambles for ${notif.puzzleCode}!`);
        setNotifications((prev) =>
          prev.map((n) => (n.id === notif.id ? { ...n, isRead: true } : n))
        );
      } catch (err: any) {
        setStatusMessage(`Error: ${err?.message || 'Failed to emergency generate scrambles'}`);
      } finally {
        setBusyId(null);
      }
    },
    []
  );

  const markAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isRead: true })));
    void apiFetch('/api/admin/notifications/read-all', { method: 'POST' }).catch(() => undefined);
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleToggleBell = () => {
    setIsOpen((prev) => {
      const nextState = !prev;
      return nextState;
    });
  };

  const formatNotifTime = (isoString: string) => {
    try {
      const normalized = isoString && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(isoString)
        ? `${isoString}Z`
        : isoString;
      const date = new Date(normalized);
      if (isNaN(date.getTime())) return 'Vừa xong';
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 0) return 'Vừa xong';
      if (diffSec < 15) return 'Vừa xong';
      if (diffSec < 60) return `${diffSec} giây trước`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} phút trước`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} giờ trước`;
      return date.toLocaleString('vi-VN', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'Vừa xong';
    }
  };

  return (
    <div className="relative">
      {/* Bell Button */}
      <button
        onClick={handleToggleBell}
        className="relative flex h-9 w-9 items-center justify-center rounded-xl border border-slate-200 bg-white hover:bg-slate-50 transition shadow-2xs text-slate-700 cursor-pointer"
        title="System Notifications"
      >
        {unreadCount > 0 ? (
          <BellRing className="h-4 w-4 text-rose-600 animate-bounce" />
        ) : (
          <Bell className="h-4 w-4 text-slate-600" />
        )}
        {unreadCount > 0 && (
          <span className="absolute -top-1 -right-1 flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white shadow-xs">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Popover Menu */}
      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95">
          {/* Popover Header */}
          <div className="flex items-center justify-between border-b border-slate-100 bg-slate-50/80 px-4 py-3">
            <div className="flex items-center gap-2">
              <Bell className="h-4 w-4 text-indigo-600" />
              <span className="text-xs font-black text-slate-900">System Notifications</span>
              {unreadCount > 0 && (
                <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-extrabold text-rose-700">
                  {unreadCount} new
                </span>
              )}
            </div>
            <div className="flex items-center gap-1">
              {notifications.length > 0 && (
                <>
                  <button
                    onClick={markAllAsRead}
                    className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                  </button>
                  <button
                    onClick={clearAll}
                    className="p-1 text-slate-400 hover:text-rose-600 cursor-pointer"
                    title="Clear all notifications"
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </button>
                </>
              )}
              <button
                onClick={() => setIsOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 cursor-pointer"
              >
                <X className="h-3.5 w-3.5" />
              </button>
            </div>
          </div>

          {/* Toast/Status Feedback */}
          {statusMessage && (
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 text-[11px] font-bold text-indigo-900 flex justify-between items-center">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-indigo-700">
                ×
              </button>
            </div>
          )}

          {/* List of Notifications */}
          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  className={`p-3.5 transition ${
                    n.isRead ? 'bg-white opacity-80' : 'bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black text-white uppercase ${n.source === 'tournament' ? 'bg-indigo-600' : 'bg-rose-600'}`}>
                        {n.source === 'tournament' ? 'TOURNAMENT' : 'DEPLETED'}
                      </span>
                      <span className="font-mono text-[11px] font-black text-slate-900">
                        {n.source === 'tournament' ? (n.title || 'Status update') : n.puzzleCode}
                      </span>
                      <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                        {n.competitionMode}
                      </span>
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono">
                      {formatNotifTime(n.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-slate-800 leading-snug">
                    {n.message}
                  </p>

                  {/* Quick Action Buttons */}
                  {n.source !== 'tournament' && <div className="mt-2.5 flex items-center gap-2">
                    <button
                      disabled={busyId === n.id}
                      onClick={() => void handleToggleAutoMode(n.id)}
                      className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
                    >
                      <Sparkles className="h-3 w-3" /> Enable AUTO Mode
                    </button>
                    {n.puzzleTypeId && (
                      <button
                        disabled={busyId === n.id}
                        onClick={() => void handleGenerateScramblesEmergency(n)}
                        className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Plus className="h-3 w-3" /> Generate 20 Now
                      </button>
                    )}
                  </div>}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No new notifications.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  SignalR alerts broadcast automatically when MANUAL mode runs low on scrambles.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
