'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { toast } from '@/lib/toast';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import { StatusBadge } from './StatusBadge';
import { Play, Lock, Video, CheckCircle, Globe, AlertTriangle, UserCheck, Unlock, UserPlus, Send } from 'lucide-react';
import { ImageLightboxModal } from '@/components/ui/ImageLightboxModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatEventLabel } from '@/lib/utils/eventFormatter';

interface TournamentTableProps {
  tournaments: (TournamentDetailDto & { puzzleTypeName?: string })[];
  onRefresh?: () => void;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('en-US', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function TournamentTable({ tournaments, onRefresh }: TournamentTableProps) {
  const router = useRouter();
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [targetTourToPublish, setTargetTourToPublish] = useState<TournamentDetailDto | null>(null);
  const [targetTourToOpenReg, setTargetTourToOpenReg] = useState<TournamentDetailDto | null>(null);
  const [targetTourToClose, setTargetTourToClose] = useState<TournamentDetailDto | null>(null);
  const [targetTourToStart, setTargetTourToStart] = useState<TournamentDetailDto | null>(null);
  const [targetTourToComplete, setTargetTourToComplete] = useState<TournamentDetailDto | null>(null);
  const [targetTourToCheckIn, setTargetTourToCheckIn] = useState<TournamentDetailDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Validate Judge existence before opening Check-in
  const handleOpenCheckInClick = async (t: TournamentDetailDto) => {
    setErrorMessage(null);
    setIsProcessing(true);
    try {
      const { getTournamentJudges } = await import('@/lib/api/tournaments');
      const judges = await getTournamentJudges(t.id).catch(() => []);
      if (!judges || judges.length === 0) {
        toast.error(
          'No Judges Found',
          'You must create judge accounts for this tournament before opening Check-in. Redirecting to judge management...'
        );
        router.push(`/managertournaments/${t.id}/judges`);
        return;
      }
      setTargetTourToCheckIn(t);
    } catch (err: any) {
      toast.error('Validation Error', err?.message || 'Failed to verify tournament judges.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Publish Tournament (DRAFT -> PUBLISHED)
  const executePublishTournament = async () => {
    if (!targetTourToPublish) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');
      await updateAdminTournamentStatus(targetTourToPublish.id, 'PUBLISHED');
      targetTourToPublish.statusCode = 'published' as any;
      setTargetTourToPublish(null);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to publish tournament.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Open Registration
  const executeOpenRegistration = async () => {
    if (!targetTourToOpenReg) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');
      await updateAdminTournamentStatus(targetTourToOpenReg.id, 'REGISTRATION_OPEN');
      targetTourToOpenReg.statusCode = 'registration_open' as any;
      setTargetTourToOpenReg(null);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open tournament registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Open Check-in with fallback & exact error reporting
  const executeOpenCheckIn = async () => {
    if (!targetTourToCheckIn) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');
      await updateAdminTournamentStatus(targetTourToCheckIn.id, 'CHECKING_IN');
      targetTourToCheckIn.statusCode = 'checking_in' as any;
      setTargetTourToCheckIn(null);
      if (onRefresh) onRefresh();
      else window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to open check-in.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Close Registration with fallback & exact error reporting
  const executeCloseRegistration = async () => {
    if (!targetTourToClose) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { closeRegistration } = await import('@/lib/api/tournaments');
      const { closeOnlineAsyncRegistration, updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');

      let lastErr: any = null;
      try {
        if (targetTourToClose.isOnlineAsync) {
          await closeOnlineAsyncRegistration(targetTourToClose.id);
        } else {
          await closeRegistration(targetTourToClose.id);
        }
        targetTourToClose.statusCode = 'registration_closed' as any;
        setTargetTourToClose(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e1) {
        lastErr = e1;
      }

      try {
        await updateAdminTournamentStatus(targetTourToClose.id, 'REGISTRATION_CLOSED');
        targetTourToClose.statusCode = 'registration_closed' as any;
        setTargetTourToClose(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e2) {
        lastErr = e2;
      }

      setErrorMessage(`Backend Error: ${lastErr?.message || 'Failed to close registration.'}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to close registration.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Force Start Tournament with fallback & exact error reporting
  const executeForceStart = async () => {
    if (!targetTourToStart) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { forceStartOnlineAsyncTournament, updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');

      let lastErr: any = null;
      try {
        await forceStartOnlineAsyncTournament(targetTourToStart.id);
        targetTourToStart.statusCode = 'ongoing' as any;
        setTargetTourToStart(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e1) {
        lastErr = e1;
      }

      try {
        await updateAdminTournamentStatus(targetTourToStart.id, 'ONGOING');
        targetTourToStart.statusCode = 'ongoing' as any;
        setTargetTourToStart(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e2) {
        lastErr = e2;
      }

      setErrorMessage(`Backend Error: ${lastErr?.message || 'Failed to force start tournament.'}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to force start tournament.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Complete Tournament with fallback & exact error reporting
  const executeCompleteTournament = async () => {
    if (!targetTourToComplete) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { completeTournament } = await import('@/lib/api/tournaments');
      const { updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');

      let lastErr: any = null;

      try {
        await completeTournament(targetTourToComplete.id);
        targetTourToComplete.statusCode = 'completed' as any;
        setTargetTourToComplete(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e1: any) {
        lastErr = e1;
      }

      try {
        await updateAdminTournamentStatus(targetTourToComplete.id, 'COMPLETED');
        targetTourToComplete.statusCode = 'completed' as any;
        setTargetTourToComplete(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e2: any) {
        lastErr = e2;
      }

      const detail = lastErr?.message || lastErr?.detail || 'Server refused status update to COMPLETED.';
      setErrorMessage(`Backend Error: ${detail}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Failed to complete tournament.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      {/* Count Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
          Found {tournaments.length} tournaments
        </p>
      </div>

      {/* Error Banner if any action failed */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-rose-900 font-extrabold hover:bg-rose-100 transition cursor-pointer"
          >
            Close
          </button>
        </div>
      )}

      {/* Clean Modern Light Table (Desktop) */}
      <div className="hidden xl:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse text-slate-800">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">TOURNAMENT</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">STATUS</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">DATES</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">LOCATION</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">EVENTS</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">ACTIONS</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tournaments.map((t) => {
                const st = (t.statusCode || '').toUpperCase();
                const isOngoing = st === 'ONGOING';
                const isCompleted = st === 'COMPLETED';

                // Publish (DRAFT / DISABLED -> PUBLISHED) - Only for Offline tournaments
                const canPublish = !t.isOnlineAsync && (st === 'DRAFT' || st === 'DISABLED');

                // Open Registration
                const canOpenRegistration = st === 'DRAFT' || st === 'PUBLISHED' || st === 'REGISTRATION_CLOSED' || st === 'DISABLED';

                // Lock Registration
                const canLockRegistration = st === 'REGISTRATION_OPEN';

                // Check-in (Offline tournaments only when registration closed)
                const canOpenCheckIn = !t.isOnlineAsync && st === 'REGISTRATION_CLOSED';

                // Force Start:
                const canForceStart = t.isOnlineAsync
                  ? (st === 'REGISTRATION_OPEN' || st === 'REGISTRATION_CLOSED' || st === 'PUBLISHED' || st === 'DRAFT')
                  : (st === 'CHECKING_IN');

                const canComplete = isOngoing || (!t.isOnlineAsync && st === 'CHECKING_IN');

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group align-middle">
                    {/* Tournament Name & Banner */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {t.bannerUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: t.bannerUrl!, name: t.name })}
                            className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative cursor-pointer hover:border-indigo-500 transition shadow-2xs"
                            title="Click to view banner"
                          >
                            <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${t.isOnlineAsync ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition">
                            {t.name}
                          </p>
                          {t.isOnlineAsync ? (
                            <span className="inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 whitespace-nowrap">
                              Async A01 Single
                            </span>
                          ) : t.maxParticipants ? (
                            <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                              Max {t.maxParticipants} competitors
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={t.statusCode as TournamentStatusCode} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap font-mono font-semibold">
                      {formatDateRange(t.startDate, t.endDate)}
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-[180px]">
                      {t.isOnlineAsync ? (
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                          <Globe className="h-3.5 w-3.5" /> Online Competition
                        </span>
                      ) : (
                        <p className="line-clamp-1 truncate font-medium">{t.location ?? '—'}</p>
                      )}
                    </td>

                    {/* Category/Events */}
                    <td className="px-5 py-4">
                      {t.isOnlineAsync ? (
                        <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200/80">
                          {t.puzzleTypeName || '3x3x3 Cube'} (A01)
                        </span>
                      ) : t.events && t.events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.events.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 border border-slate-200/80 whitespace-nowrap"
                            >
                              {formatEventLabel(e)}
                            </span>
                          ))}
                          {t.events.length > 3 && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500 border border-slate-200/80">
                              +{t.events.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal italic">
                          No events created
                        </span>
                      )}
                    </td>

                    {/* Action Buttons Matching Custom Pill Styles */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/* Publish Button (Sky Blue) */}
                        {canPublish && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToPublish(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                            title="Publish tournament (PUBLISHED)"
                          >
                            <Send className="h-3.5 w-3.5" /> Publish
                          </button>
                        )}
                        {/* Open Registration (Emerald) */}
                        {canOpenRegistration && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToOpenReg(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                            title="Open tournament registration (REGISTRATION_OPEN)"
                          >
                            <Unlock className="h-3.5 w-3.5" /> Open Reg
                          </button>
                        )}

                        {/* Lock Registration (Amber) */}
                        {canLockRegistration && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToClose(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-extrabold text-xs transition cursor-pointer"
                            title="Close registration immediately"
                          >
                            <Lock className="h-3.5 w-3.5 text-amber-700" /> Close Reg
                          </button>
                        )}

                        {/* Force Start (Indigo) */}
                        {canForceStart && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToStart(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                            title={t.isOnlineAsync ? "Start Async competition immediately (ONGOING)" : "Start tournament (ONGOING)"}
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> Force Start
                          </button>
                        )}

                        {/* Open Check-in (Offline only) */}
                        {canOpenCheckIn && (
                          <button
                            onClick={() => handleOpenCheckInClick(t)}
                            disabled={isProcessing}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer disabled:opacity-50"
                            title="Open offline check-in desk"
                          >
                            <UserCheck className="h-3.5 w-3.5" /> Open Check-in
                          </button>
                        )}

                        {/* Complete Tournament Button */}
                        {canComplete && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToComplete(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                            title="Conclude / complete tournament"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Complete
                          </button>
                        )}

                        {/* Review A01 (for Async) */}
                        {t.isOnlineAsync && (
                          <Link
                            href={`/managertournaments/${t.id}/review`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-extrabold text-xs transition shadow-2xs"
                            title="Review video attempt A01"
                          >
                            <Video className="h-3.5 w-3.5" /> Review A01
                          </Link>
                        )}

                        {/* Details Link */}
                        <Link
                          href={t.isOnlineAsync ? `/tournaments/${t.id}` : `/managertournaments/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-slate-900 hover:bg-slate-50 transition font-extrabold text-xs cursor-pointer shadow-2xs"
                          title={t.isOnlineAsync ? 'View Async Leaderboard' : 'Manage Tournament Settings'}
                        >
                          Details
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tournaments.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm font-semibold">
              No tournaments found in the list.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="xl:hidden space-y-4">
        {tournaments.map((t) => {
          const st = (t.statusCode || '').toUpperCase();
          const isOngoing = st === 'ONGOING';
          const isCompleted = st === 'COMPLETED';

          // Publish (DRAFT / DISABLED -> PUBLISHED) - Only for Offline tournaments
          const canPublish = !t.isOnlineAsync && (st === 'DRAFT' || st === 'DISABLED');

          // Open Registration
          const canOpenRegistration = st === 'DRAFT' || st === 'PUBLISHED' || st === 'REGISTRATION_CLOSED' || st === 'DISABLED';

          // Lock Registration
          const canLockRegistration = st === 'REGISTRATION_OPEN';

          // Check-in (Offline only)
          const canOpenCheckIn = !t.isOnlineAsync && st === 'REGISTRATION_CLOSED';

          // Force Start:
          const canForceStart = t.isOnlineAsync
            ? (st === 'REGISTRATION_OPEN' || st === 'REGISTRATION_CLOSED' || st === 'PUBLISHED' || st === 'DRAFT')
            : (st === 'CHECKING_IN');

          const canComplete = isOngoing || (!t.isOnlineAsync && st === 'CHECKING_IN');

          return (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              {/* Header Info: Name, Status Badge, Type */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {t.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.isOnlineAsync ? (
                      <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 whitespace-nowrap">
                        Async A01 Single
                      </span>
                    ) : t.maxParticipants ? (
                      <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                        Max {t.maxParticipants} competitors
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={t.statusCode as TournamentStatusCode} />
                </div>
              </div>

              {/* Details: Date, Location, Events */}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Dates:</span>
                  <span className="font-mono font-semibold text-[11px] text-slate-700">
                    {formatDateRange(t.startDate, t.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Location:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">
                    {t.isOnlineAsync ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        <Globe className="h-3 w-3" /> Online Competition
                      </span>
                    ) : (
                      t.location ?? '—'
                    )}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 font-medium shrink-0">Events:</span>
                  <div className="text-right">
                    {t.isOnlineAsync ? (
                      <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700 border border-indigo-200/80">
                        {t.puzzleTypeName || '3x3x3 Cube'} (A01)
                      </span>
                    ) : t.events && t.events.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {t.events.map((e) => (
                          <span
                            key={e.id}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-700 border border-slate-200/80 whitespace-nowrap"
                          >
                            {formatEventLabel(e)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal italic">
                        No events created
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 justify-end">
                {/* Publish Button (Sky Blue) */}
                {canPublish && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToPublish(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-sky-600 hover:bg-sky-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none"
                    title="Publish tournament (PUBLISHED)"
                  >
                    <Send className="h-3 w-3" /> Publish
                  </button>
                )}

                {/* Open Registration */}
                {canOpenRegistration && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToOpenReg(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none"
                  >
                    <Unlock className="h-3 w-3" /> Open Reg
                  </button>
                )}

                {/* Close Registration */}
                {canLockRegistration && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToClose(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-extrabold text-[10px] transition cursor-pointer"
                  >
                    <Lock className="h-3 w-3 text-amber-700" /> Close Reg
                  </button>
                )}

                {/* Force Start */}
                {canForceStart && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToStart(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none"
                  >
                    <Play className="h-3 w-3 fill-current" /> Force Start
                  </button>
                )}

                {/* Open Check-in (Offline only) */}
                {canOpenCheckIn && (
                  <button
                    onClick={() => handleOpenCheckInClick(t)}
                    disabled={isProcessing}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-purple-600 hover:bg-purple-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none disabled:opacity-50"
                  >
                    <UserCheck className="h-3 w-3" /> Open Check-in
                  </button>
                )}

                {/* Complete Tournament */}
                {canComplete && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToComplete(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none"
                  >
                    <CheckCircle className="h-3 w-3" /> Complete
                  </button>
                )}

                {/* Review A01 (for Async) */}
                {t.isOnlineAsync && (
                  <Link
                    href={`/managertournaments/${t.id}/review`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 font-extrabold text-[10px] transition"
                  >
                    <Video className="h-3 w-3" /> Review A01
                  </Link>
                )}

                {/* Details */}
                <Link
                  href={t.isOnlineAsync ? `/tournaments/${t.id}` : `/managertournaments/${t.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-slate-900 hover:bg-slate-50 transition font-extrabold text-[10px]"
                >
                  Details
                </Link>
              </div>
            </div>
          );
        })}

        {tournaments.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm font-semibold bg-white rounded-2xl border border-slate-200 shadow-2xs">
            No tournaments found in the list.
          </div>
        )}
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage?.url || null}
        title={previewImage ? `Poster Banner — ${previewImage.name}` : undefined}
        onClose={() => setPreviewImage(null)}
      />

      {/* Confirmation Modal for Publish Tournament */}
      <ConfirmModal
        isOpen={Boolean(targetTourToPublish)}
        title="Publish Tournament"
        description={
          errorMessage
            ? errorMessage
            : `Are you sure you want to publish tournament "${targetTourToPublish?.name}"? Once published, the status will become PUBLISHED and the tournament will be publicly visible.`
        }
        confirmText="Publish Now"
        cancelText="Cancel"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executePublishTournament}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToPublish(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Open Registration */}
      <ConfirmModal
        isOpen={Boolean(targetTourToOpenReg)}
        title="Open Tournament Registration"
        description={
          errorMessage
            ? errorMessage
            : `Are you sure you want to open registration for "${targetTourToOpenReg?.name}"? Competitors will be able to register for events.`
        }
        confirmText="Open Registration"
        cancelText="Cancel"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executeOpenRegistration}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToOpenReg(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Lock Registration */}
      <ConfirmModal
        isOpen={Boolean(targetTourToClose)}
        title="Close Tournament Registration"
        description={
          errorMessage
            ? errorMessage
            : `Are you sure you want to close registration for "${targetTourToClose?.name}" immediately? No more competitors will be able to register.`
        }
        confirmText="Close Registration"
        cancelText="Cancel"
        variant="warning"
        isLoading={isProcessing}
        onConfirm={executeCloseRegistration}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToClose(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Force Start Tournament */}
      <ConfirmModal
        isOpen={Boolean(targetTourToStart)}
        title="Force Start Tournament"
        description={
          errorMessage
            ? errorMessage
            : `Are you sure you want to start tournament "${targetTourToStart?.name}" immediately? Status will change to ONGOING.`
        }
        confirmText="Start Now"
        cancelText="Cancel"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executeForceStart}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToStart(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Complete Tournament */}
      <ConfirmModal
        isOpen={Boolean(targetTourToComplete)}
        title="Complete Tournament"
        description={
          errorMessage
            ? errorMessage
            : `Are you sure you want to complete tournament "${targetTourToComplete?.name}"? Status will change to COMPLETED.`
        }
        confirmText="Confirm Complete"
        cancelText="Cancel"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executeCompleteTournament}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToComplete(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Open Check-in */}
      <ConfirmModal
        isOpen={Boolean(targetTourToCheckIn)}
        title="Open Tournament Check-in"
        description={
          errorMessage
            ? errorMessage
            : `Are you sure you want to open check-in for "${targetTourToCheckIn?.name}"? Tournament judges and on-site check-in desks will be activated.`
        }
        confirmText="Open Check-in"
        cancelText="Cancel"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executeOpenCheckIn}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToCheckIn(null);
            setErrorMessage(null);
          }
        }}
      />
    </div>
  );
}
