'use client';

import { useEffect, useState, useRef, useCallback } from 'react';
import Link from 'next/link';
import { Bell, BellRing, Sparkles, Plus, CheckCheck, Trash2, X, ShieldAlert, ExternalLink } from 'lucide-react';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL, apiFetch } from '@/lib/api/config';
import { setScrambleMode, generateScrambles, getScrambleSummary, getScrambleMode, type ScrambleMode } from '@/features/admin/api/adminScrambleApi';

export interface ScrambleDepletedNotification {
  id: string;
  competitionMode: string;
  puzzleTypeId: string;
  puzzleCode: string;
  puzzleName: string;
  message: string;
  timestamp: string;
  isRead: boolean;
  source?: 'scramble' | 'tournament' | 'fraud';
  typeCode?: string;
  title?: string;
  reportId?: string;
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

const SUPPORTED_ADMIN_TYPES = new Set(['SCRAMBLE_POOL_EMPTY', 'FRAUD_REPORT_CREATED']);

function mapAdminNotification(item: AdminNotificationDto): ScrambleDepletedNotification | null {
  if (!SUPPORTED_ADMIN_TYPES.has(item.typeCode)) return null;

  let payload: Record<string, unknown> = {};
  try {
    payload = item.payload ? JSON.parse(item.payload) : {};
  } catch {
    // Keep the notification visible even if an old payload is malformed.
  }

  if (item.typeCode === 'FRAUD_REPORT_CREATED') {
    const reportId = String(payload.reportId || '');
    return {
      id: `admin-${item.id}`,
      competitionMode: 'ONLINE_MATCH',
      puzzleTypeId: '',
      puzzleCode: String(payload.fraudType || 'FRAUD'),
      puzzleName: item.title,
      message: item.body || item.title,
      timestamp: item.createdAt,
      isRead: item.isRead,
      source: 'fraud',
      typeCode: item.typeCode,
      title: item.title,
      reportId: reportId || undefined,
    };
  }

  return {
    id: `admin-${item.id}`,
    competitionMode: String(payload.competitionMode || 'ONLINE_MATCH'),
    puzzleTypeId: String(payload.puzzleTypeId || ''),
    puzzleCode: String(payload.puzzleCode || 'UNKNOWN'),
    puzzleName: String(payload.puzzleName || item.title),
    message: item.body || item.title,
    timestamp: item.createdAt,
    isRead: item.isRead,
    source: 'scramble',
    typeCode: item.typeCode,
    title: item.title,
  };
}

function isScrambleSource(n: ScrambleDepletedNotification) {
  return n.source !== 'fraud' && n.source !== 'tournament' && n.typeCode !== 'FRAUD_REPORT_CREATED';
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
      const mapped = serverItems
        .map(mapAdminNotification)
        .filter((item): item is ScrambleDepletedNotification => item != null);
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
      const modesToTrack = ['ONLINE_MATCH', 'OFFLINE', 'ONLINE_ASYNC'] as const;
      const [summaries, ...modeResults] = await Promise.all([
        getScrambleSummary().catch(() => []),
        ...modesToTrack.map((competitionMode) =>
          getScrambleMode(competitionMode).catch(() => ({ competitionMode, mode: 'MANUAL' as const }))
        ),
      ]);
      const manualModes = new Set(modeResults.filter((result) => result.mode === 'MANUAL').map((result) => result.competitionMode));

      setNotifications((prev) => {
        const nonScramble = prev.filter((n) => !isScrambleSource(n));
        const scramblePrev = prev.filter((n) => isScrambleSource(n));

        if (manualModes.size === 0) {
          // All modes AUTO → drop scramble warnings only; keep fraud/tournament
          return nonScramble;
        }

        const activeDepletedKeys = new Set<string>();
        const replenishedKeys = new Set<string>();

        summaries.forEach((s) => {
          const key = `${s.competitionMode}-${s.puzzleCode}`;
          if (s.count === 0 && manualModes.has(s.competitionMode)) {
            activeDepletedKeys.add(key);
          } else {
            replenishedKeys.add(key);
          }
        });

        const activePrev = scramblePrev.filter((n) => {
          const key = `${n.competitionMode}-${n.puzzleCode}`;
          if (replenishedKeys.has(key) || (n.competitionMode && !manualModes.has(n.competitionMode))) {
            return false;
          }
          return true;
        });

        const prevMap = new Map(activePrev.map((n) => [`${n.competitionMode}-${n.puzzleCode}`, n]));
        const updatedScramble: ScrambleDepletedNotification[] = [];

        activeDepletedKeys.forEach((key) => {
          const [mode, puzzleCode] = key.split('-');
          const summaryItem = summaries.find((s) => s.competitionMode === mode && s.puzzleCode === puzzleCode);

          if (prevMap.has(key)) {
            updatedScramble.push(prevMap.get(key)!);
          } else {
            updatedScramble.push({
              id: `api-${mode}-${puzzleCode}`,
              competitionMode: mode,
              puzzleTypeId: summaryItem?.puzzleTypeId || '',
              puzzleCode: puzzleCode,
              puzzleName: `Rubik ${puzzleCode}`,
              message: `Scramble pool for ${mode} (${puzzleCode}) is empty! Please generate scrambles or enable AUTO mode.`,
              timestamp: new Date().toISOString(),
              isRead: false,
              source: 'scramble',
            });
          }
        });

        activePrev.forEach((n) => {
          if (!updatedScramble.some((item) => item.id === n.id)) {
            updatedScramble.push(n);
          }
        });

        return [...nonScramble, ...updatedScramble];
      });
    } catch {
      // Ignore API errors when unauthenticated or offline
    }
  }, []);

  useEffect(() => {
    void syncPoolStatus();
    void loadAdminNotifications();
    const intervalId = setInterval(() => void syncPoolStatus(), 30000);

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
        const existing = prev.find((n) => isScrambleSource(n) && `${n.competitionMode}-${n.puzzleCode}` === key);
        if (existing) {
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

      try {
        const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, audioCtx.currentTime);
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
      if (!SUPPORTED_ADMIN_TYPES.has(data.typeCode)) return;

      // Reload from API so each admin gets their own notification row id for mark-as-read.
      if (data.typeCode === 'FRAUD_REPORT_CREATED') {
        void loadAdminNotifications();
        return;
      }

      const notification = mapAdminNotification({ ...data, isRead: false });
      if (!notification) return;
      setNotifications((previous) =>
        previous.some((item) => item.id === notification.id)
          ? previous
          : [notification, ...previous].slice(0, 100)
      );
    });

    connection
      .start()
      .then(() => console.log('[SignalR Admin Bell] Connected to TournamentHub successfully.'))
      .catch((err) => {
        if (err?.message?.includes('stopped during negotiation')) return;
        console.warn('[SignalR Admin Bell] Connection notice:', err?.message || err);
      });

    connectionRef.current = connection;

    return () => {
      clearInterval(intervalId);
      connection.stop().catch(() => {});
    };
  }, [loadAdminNotifications, syncPoolStatus]);

  const handleToggleAutoMode = useCallback(async (notif: ScrambleDepletedNotification) => {
    setBusyId(notif.id);
    setStatusMessage(null);
    try {
      await setScrambleMode(notif.competitionMode as ScrambleMode, 'AUTO');
      setStatusMessage(`Successfully enabled AUTO for every Rubik type in ${notif.competitionMode}!`);
      setNotifications((prev) =>
        prev.map((n) => (n.competitionMode === notif.competitionMode ? { ...n, isRead: true } : n))
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

  const markNotificationAsRead = (notification: ScrambleDepletedNotification) => {
    setNotifications((prev) => prev.map((n) => (n.id === notification.id ? { ...n, isRead: true } : n)));
    if (notification.id.startsWith('admin-')) {
      void apiFetch(`/api/admin/notifications/${notification.id.slice('admin-'.length)}/read`, {
        method: 'POST',
      }).catch(() => undefined);
    }
  };

  const clearAll = () => {
    setNotifications([]);
  };

  const handleToggleBell = () => {
    setIsOpen((open) => !open);
  };

  const formatNotifTime = (isoString: string) => {
    try {
      const normalized = isoString && !/[zZ]|[+-]\d{2}:?\d{2}$/.test(isoString)
        ? `${isoString}Z`
        : isoString;
      const date = new Date(normalized);
      if (isNaN(date.getTime())) return 'Just now';
      const now = new Date();
      const diffSec = Math.floor((now.getTime() - date.getTime()) / 1000);
      if (diffSec < 0) return 'Just now';
      if (diffSec < 15) return 'Just now';
      if (diffSec < 60) return `${diffSec} seconds ago`;
      if (diffSec < 3600) return `${Math.floor(diffSec / 60)} minutes ago`;
      if (diffSec < 86400) return `${Math.floor(diffSec / 3600)} hours ago`;
      return date.toLocaleString('en-US', {
        day: '2-digit', month: '2-digit', hour: '2-digit', minute: '2-digit',
      });
    } catch {
      return 'Just now';
    }
  };

  const badgeLabel = (n: ScrambleDepletedNotification) => {
    if (n.source === 'fraud' || n.typeCode === 'FRAUD_REPORT_CREATED') return 'FRAUD';
    if (n.source === 'tournament') return 'TOURNAMENT';
    return 'DEPLETED';
  };

  const badgeClass = (n: ScrambleDepletedNotification) => {
    if (n.source === 'fraud' || n.typeCode === 'FRAUD_REPORT_CREATED') return 'bg-amber-600';
    if (n.source === 'tournament') return 'bg-indigo-600';
    return 'bg-rose-600';
  };

  return (
    <div className="relative">
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

      {isOpen && (
        <div className="absolute right-0 top-full mt-2 w-96 rounded-2xl border border-slate-200 bg-white shadow-2xl z-50 overflow-hidden text-left animate-in fade-in zoom-in-95">
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
                    className="inline-flex items-center gap-1 rounded-lg px-2 py-1 text-[10px] font-extrabold text-slate-600 hover:bg-slate-100 hover:text-slate-900 cursor-pointer"
                    title="Mark all as read"
                  >
                    <CheckCheck className="h-3.5 w-3.5" />
                    Mark all as read
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

          {statusMessage && (
            <div className="bg-indigo-50 px-4 py-2 border-b border-indigo-100 text-[11px] font-bold text-indigo-900 flex justify-between items-center">
              <span>{statusMessage}</span>
              <button onClick={() => setStatusMessage(null)} className="text-indigo-400 hover:text-indigo-700">
                ×
              </button>
            </div>
          )}

          <div className="max-h-80 overflow-y-auto divide-y divide-slate-100">
            {notifications.length > 0 ? (
              notifications.map((n) => (
                <div
                  key={n.id}
                  onClick={() => markNotificationAsRead(n)}
                  className={`p-3.5 transition ${
                    n.isRead ? 'bg-white opacity-80' : 'bg-rose-50/50'
                  }`}
                >
                  <div className="flex items-start justify-between gap-2">
                    <div className="flex items-center gap-1.5 flex-wrap">
                      <span className={`rounded-md px-1.5 py-0.5 text-[9px] font-black text-white uppercase ${badgeClass(n)}`}>
                        {badgeLabel(n)}
                      </span>
                      <span className="font-mono text-[11px] font-black text-slate-900">
                        {n.source === 'fraud'
                          ? (n.title || 'Fraud report')
                          : n.source === 'tournament'
                            ? (n.title || 'Status update')
                            : n.puzzleCode}
                      </span>
                      {n.source !== 'fraud' && (
                        <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-extrabold text-slate-600">
                          {n.competitionMode}
                        </span>
                      )}
                    </div>
                    <span className="text-[9px] font-bold text-slate-400 font-mono shrink-0">
                      {formatNotifTime(n.timestamp)}
                    </span>
                  </div>

                  <p className="mt-1.5 text-xs font-semibold text-slate-800 leading-snug">
                    {n.message}
                  </p>

                  {n.source === 'fraud' && n.reportId && (
                    <div className="mt-2.5">
                      <Link
                        href={`/admin/fraud-reports/${n.reportId}`}
                        onClick={(e) => {
                          e.stopPropagation();
                          markNotificationAsRead(n);
                          setIsOpen(false);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-amber-600 hover:bg-amber-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 transition shadow-2xs"
                      >
                        <ShieldAlert className="h-3 w-3" /> Review report
                        <ExternalLink className="h-3 w-3" />
                      </Link>
                    </div>
                  )}

                  {isScrambleSource(n) && (
                    <div className="mt-2.5 flex items-center gap-2">
                      <button
                        disabled={busyId === n.id}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleToggleAutoMode(n);
                        }}
                        className="inline-flex items-center gap-1 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] px-2.5 py-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
                      >
                        <Sparkles className="h-3 w-3" /> Enable AUTO Mode
                      </button>
                      {n.puzzleTypeId && (
                        <button
                          disabled={busyId === n.id}
                          onClick={(e) => {
                            e.stopPropagation();
                            void handleGenerateScramblesEmergency(n);
                          }}
                          className="inline-flex items-center gap-1 rounded-xl border border-indigo-200 bg-white hover:bg-indigo-50 text-indigo-700 font-extrabold text-[10px] px-2.5 py-1.5 transition shadow-2xs cursor-pointer disabled:opacity-50"
                        >
                          <Plus className="h-3 w-3" /> Generate 20 Now
                        </button>
                      )}
                    </div>
                  )}
                </div>
              ))
            ) : (
              <div className="p-8 text-center text-slate-400">
                <Bell className="mx-auto h-8 w-8 text-slate-300 mb-2" />
                <p className="text-xs font-semibold">No new notifications.</p>
                <p className="text-[10px] text-slate-400 mt-0.5">
                  Alerts appear for scramble pool shortages and new online PvP fraud reports.
                </p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
