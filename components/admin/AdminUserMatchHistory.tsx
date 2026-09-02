'use client';

import React, { useCallback, useEffect, useState } from 'react';
import {
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Clock,
  Eye,
  Loader2,
  RefreshCw,
  ShieldAlert,
  Swords,
  Trophy,
} from 'lucide-react';
import { getAdminUserOnlineMatches } from '@/features/admin/api/adminUserApi';
import type { OnlineMatchHistoryItemDto } from '@/features/online-arena/api/onlineArenaApi';
import { MatchDetailModal } from '@/features/online-arena/components/MatchDetailModal';

interface AdminUserMatchHistoryProps {
  userId: string;
}

const PAGE_SIZE = 5;

function formatSolveTime(ms?: number, isDnf?: boolean) {
  if (isDnf) return 'DNF';
  if (!ms || ms <= 0) return 'N/A';
  return `${(ms / 1000).toFixed(2)}s`;
}

function getOutcome(match: OnlineMatchHistoryItemDto) {
  const status = match.statusCode?.toUpperCase();
  if (status === 'CANCELLED') {
    return { label: 'CANCELLED', style: 'border-slate-200 bg-slate-50 text-slate-600' };
  }
  if (status !== 'COMPLETED' && status !== 'DRAW') {
    return { label: 'IN PROGRESS', style: 'border-blue-200 bg-blue-50 text-blue-700' };
  }
  if (match.isWinner) {
    return { label: 'WIN', style: 'border-emerald-200 bg-emerald-50 text-emerald-700' };
  }
  if (match.isDraw) {
    return { label: 'DRAW', style: 'border-slate-200 bg-slate-50 text-slate-600' };
  }
  return { label: 'LOSS', style: 'border-rose-200 bg-rose-50 text-rose-700' };
}

export function AdminUserMatchHistory({ userId }: AdminUserMatchHistoryProps) {
  const [matches, setMatches] = useState<OnlineMatchHistoryItemDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedMatch, setSelectedMatch] = useState<OnlineMatchHistoryItemDto | null>(null);

  const loadHistory = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await getAdminUserOnlineMatches(userId, page, PAGE_SIZE);
      setMatches(result.matches ?? []);
      setTotalCount(result.totalCount ?? 0);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Unable to load online match history.');
    } finally {
      setLoading(false);
    }
  }, [page, userId]);

  useEffect(() => {
    setPage(1);
  }, [userId]);

  useEffect(() => {
    void loadHistory();
  }, [loadHistory]);

  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));

  if (loading) {
    return (
      <div className="flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 py-12 text-xs font-semibold text-slate-500">
        <Loader2 className="h-4 w-4 animate-spin text-indigo-600" /> Loading online match history...
      </div>
    );
  }

  if (error) {
    return (
      <div className="rounded-xl border border-rose-200 bg-rose-50 p-5 text-center">
        <AlertCircle className="mx-auto mb-2 h-5 w-5 text-rose-600" />
        <p className="text-xs font-semibold text-rose-700">{error}</p>
        <button onClick={() => void loadHistory()} className="mt-3 inline-flex items-center gap-1 rounded-lg border border-rose-200 bg-white px-3 py-1.5 text-xs font-bold text-rose-700 hover:bg-rose-100">
          <RefreshCw className="h-3 w-3" /> Try again
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-bold text-slate-800">Ranked 1v1 records</p>
          <p className="text-[11px] text-slate-500">{totalCount} match{totalCount === 1 ? '' : 'es'} recorded</p>
        </div>
        <button onClick={() => void loadHistory()} className="rounded-lg border border-slate-200 p-2 text-slate-500 hover:bg-slate-50" title="Refresh history">
          <RefreshCw className="h-3.5 w-3.5" />
        </button>
      </div>

      {matches.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-slate-50 py-10 text-center">
          <Swords className="mx-auto mb-2 h-7 w-7 text-slate-300" />
          <p className="text-xs font-semibold text-slate-500">This competitor has no online matches yet.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {matches.map((match) => {
            const outcome = getOutcome(match);
            return <button
              key={match.matchId}
              onClick={() => setSelectedMatch(match)}
              className="grid w-full grid-cols-[86px_1fr_auto] items-center gap-3 rounded-xl border border-slate-200 bg-white p-3 text-left transition hover:border-indigo-300 hover:bg-indigo-50/30"
            >
              <span className={`inline-flex justify-center rounded-lg border px-2 py-1.5 text-[10px] font-extrabold ${outcome.style}`}>
                {outcome.label === 'WIN' && <Trophy className="mr-1 h-3 w-3" />}
                {outcome.label}
              </span>

              <span className="min-w-0">
                <span className="flex items-center gap-2">
                  <span className="truncate text-xs font-bold text-slate-800">vs {match.opponentUsername}</span>
                  {match.reportStatus && <ShieldAlert className="h-3.5 w-3.5 shrink-0 text-amber-500" />}
                </span>
                <span className="mt-1 flex flex-wrap items-center gap-x-3 gap-y-1 text-[10px] text-slate-500">
                  <span>{match.puzzleTypeName}</span>
                  <span className="font-mono font-bold text-slate-700">{formatSolveTime(match.meTimeMs, match.meIsDnf)} vs {formatSolveTime(match.opponentTimeMs, match.opponentIsDnf)}</span>
                  <span className="flex items-center gap-1"><Clock className="h-3 w-3" />{new Date(match.createdAt).toLocaleString()}</span>
                </span>
              </span>

              <span className="flex items-center gap-2">
                <span className={`text-xs font-bold ${match.eloChange >= 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                  {match.eloChange > 0 ? '+' : ''}{match.eloChange} ELO
                </span>
                <Eye className="h-4 w-4 text-indigo-600" />
              </span>
            </button>;
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-between border-t border-slate-100 pt-3">
          <span className="text-[11px] text-slate-500">Page {page} of {totalPages}</span>
          <div className="flex gap-1">
            <button disabled={page === 1} onClick={() => setPage((value) => value - 1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 disabled:opacity-40"><ChevronLeft className="h-4 w-4" /></button>
            <button disabled={page === totalPages} onClick={() => setPage((value) => value + 1)} className="rounded-lg border border-slate-200 p-1.5 text-slate-600 disabled:opacity-40"><ChevronRight className="h-4 w-4" /></button>
          </div>
        </div>
      )}

      <MatchDetailModal
        matchItem={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
        allowReport={false}
      />
    </div>
  );
}
