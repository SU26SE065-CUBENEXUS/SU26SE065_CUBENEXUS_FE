'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Swords,
  ShieldCheck,
  Video,
  ChevronRight,
  Filter,
  ArrowUpRight,
  ArrowDownRight,
  Clock,
  Sparkles,
  Loader2,
  RefreshCw,
  Award,
  Zap,
  ShieldAlert,
  ArrowLeft,
} from 'lucide-react';
import { getMyMatchHistory, OnlineMatchHistoryItemDto } from '../api/onlineArenaApi';
import { MatchDetailModal } from './MatchDetailModal';

export function OnlineMatchHistory() {
  const router = useRouter();
  const [matches, setMatches] = useState<OnlineMatchHistoryItemDto[]>([]);
  const [totalCount, setTotalCount] = useState<number>(0);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState<number>(1);
  const [filterResult, setFilterResult] = useState<'ALL' | 'VICTORY' | 'DEFEAT'>('ALL');
  const [selectedMatch, setSelectedMatch] = useState<OnlineMatchHistoryItemDto | null>(null);

  const fetchHistory = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const res = await getMyMatchHistory(undefined, page, 15);
      setMatches(res.matches || []);
      setTotalCount(res.totalCount || 0);
    } catch (err: any) {
      console.error('[MatchHistory] Fetch failed:', err);
      setError(err?.message || 'Failed to load match history.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory();
  }, [page]);

  // Client-side filtering for Victory/Defeat tabs
  const filteredMatches = matches.filter((m) => {
    if (filterResult === 'VICTORY') return m.isWinner;
    if (filterResult === 'DEFEAT') return !m.isWinner && !m.isDraw;
    return true;
  });

  // Calculate summary stats
  const totalWins = matches.filter((m) => m.isWinner).length;
  const winRate = matches.length > 0 ? Math.round((totalWins / matches.length) * 100) : 0;
  const latestElo = matches[0]?.meEloAfter ?? matches[0]?.meEloBefore ?? 1000;

  const formatSolveTime = (ms?: number, isDnf?: boolean) => {
    if (isDnf) return 'DNF';
    if (!ms || ms <= 0) return 'N/A';
    return (ms / 1000).toFixed(2) + 's';
  };

  return (
    <div className="w-full max-w-6xl mx-auto space-y-4 animate-fade-in pb-12 text-foreground">
      {/* Back Button */}
      <div className="flex items-center">
        <button
          onClick={() => router.back()}
          className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-muted-foreground hover:text-foreground hover:bg-muted border border-transparent hover:border-border rounded-xl transition-all cursor-pointer"
        >
          <ArrowLeft className="h-3.5 w-3.5" />
          Quay lại
        </button>
      </div>

      {/* Esports Header Banner (Arena of Valor Inspired) */}
      <div className="bg-gradient-to-r from-card via-background to-card border border-border rounded-3xl p-6 md:p-8 shadow-md relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-orange-500/5 blur-3xl rounded-full pointer-events-none -mr-20 -mt-20" />
        <div className="absolute bottom-0 left-0 w-96 h-96 bg-amber-500/5 blur-3xl rounded-full pointer-events-none -ml-20 -mb-20" />

        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="px-3 py-1 bg-gradient-to-r from-orange-500 to-amber-500 text-white font-black text-[10px] uppercase tracking-widest rounded-full shadow-lg shadow-orange-500/10">
                ESPORTS MATCH RECORD
              </span>
              <span className="text-xs font-bold text-muted-foreground flex items-center gap-1">
                <ShieldCheck className="h-4 w-4 text-emerald-500" /> VERIFIED REPLAYS
              </span>
            </div>
            <h1 className="text-3xl md:text-4xl font-black text-foreground tracking-tight uppercase">
              Online Match <span className="text-orange-500">History</span>
            </h1>
            <p className="text-xs text-muted-foreground max-w-xl">
              Track your ranked speedcube 1v1 battle records, inspect solve times, and watch dual-camera split-screen replays.
            </p>
          </div>

          {/* Quick Stats Widget */}
          <div className="flex items-center gap-3 bg-card/90 border border-border p-3 rounded-2xl backdrop-blur-md">
            <div className="px-4 py-2 text-center border-r border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Matches</span>
              <span className="text-xl font-black text-foreground font-mono">{totalCount}</span>
            </div>
            <div className="px-4 py-2 text-center border-r border-border">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Win Rate</span>
              <span className="text-xl font-black text-emerald-600 font-mono">{winRate}%</span>
            </div>
            <div className="px-4 py-2 text-center">
              <span className="text-[10px] font-bold text-muted-foreground uppercase block">Current ELO</span>
              <span className="text-xl font-black text-amber-500 font-mono flex items-center justify-center gap-1">
                <Zap className="h-4 w-4 fill-amber-500 text-amber-500" /> {latestElo}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Filter Tabs & Toolbar */}
      <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-card/60 border border-border/80 p-3 rounded-2xl">
        <div className="flex items-center gap-2 w-full sm:w-auto">
          {(['ALL', 'VICTORY', 'DEFEAT'] as const).map((type) => (
            <button
              key={type}
              onClick={() => setFilterResult(type)}
              className={`flex-1 sm:flex-initial px-4 py-2 text-xs font-black rounded-xl uppercase tracking-wider transition-all cursor-pointer border ${filterResult === type
                  ? type === 'VICTORY'
                    ? 'bg-emerald-500/10 text-emerald-600 border-emerald-500/25 shadow-md shadow-emerald-500/5'
                    : type === 'DEFEAT'
                      ? 'bg-rose-500/10 text-rose-600 border-rose-500/25 shadow-md shadow-rose-500/5'
                      : 'bg-orange-500 text-white border-orange-500 shadow-md shadow-orange-500/10'
                  : 'bg-muted text-muted-foreground border-border hover:text-foreground hover:bg-muted/80'
                }`}
            >
              {type === 'ALL' ? 'Tất cả' : type === 'VICTORY' ? ' Thắng' : ' Thua'}
            </button>
          ))}
        </div>

        <button
          onClick={fetchHistory}
          disabled={isLoading}
          className="p-2.5 bg-card hover:bg-muted text-muted-foreground hover:text-foreground rounded-xl border border-border transition-all cursor-pointer flex items-center gap-1.5 text-xs font-bold"
        >
          <RefreshCw className={`h-4 w-4 text-orange-500 ${isLoading ? 'animate-spin' : ''}`} />
          Refetch
        </button>
      </div>

      {/* Match Cards List */}
      {isLoading ? (
        <div className="p-16 bg-card border border-border/80 rounded-3xl text-center space-y-3">
          <Loader2 className="h-10 w-10 text-orange-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Match History...</p>
        </div>
      ) : error ? (
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center space-y-2">
          <p className="text-sm font-bold text-rose-500">{error}</p>
          <button
            onClick={fetchHistory}
            className="px-4 py-2 bg-rose-500/20 hover:bg-rose-500/30 text-rose-600 rounded-xl text-xs font-bold transition-all"
          >
            Try Again
          </button>
        </div>
      ) : filteredMatches.length === 0 ? (
        <div className="p-16 bg-card border border-border/80 rounded-3xl text-center space-y-3">
          <Swords className="h-12 w-12 text-muted-foreground/60 mx-auto" />
          <p className="text-sm font-bold text-muted-foreground">No match records found.</p>
          <p className="text-xs text-muted-foreground/80">Play ranked online arena 1v1 matches to build your battle history!</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredMatches.map((match) => {
            const hasReport = !!(match.reportStatus || match.reportVerdictCode || match.reportedByUserId);

            const isGuilty = hasReport && (match.reportVerdictCode === 'GUILTY' || match.outcome === 'GUILTY');
            const isInnocent = hasReport && (match.reportVerdictCode === 'INNOCENT' || match.outcome === 'INNOCENT');
            const isInconclusive = hasReport && (match.reportVerdictCode === 'INCONCLUSIVE' || match.outcome === 'INCONCLUSIVE');
            const isPending = hasReport && match.reportStatus === 'PENDING' && !match.reportVerdictCode;

            const cardBorderStyle = isGuilty
              ? 'border-rose-500/50 bg-gradient-to-r from-rose-500/5 via-card to-card shadow-md shadow-rose-500/5'
              : isInnocent
                ? 'border-emerald-500/50 bg-gradient-to-r from-emerald-500/5 via-card to-card shadow-md shadow-emerald-500/5'
                : isInconclusive
                  ? 'border-amber-500/50 bg-gradient-to-r from-amber-500/5 via-card to-card shadow-md shadow-amber-500/5'
                  : isPending
                    ? 'border-amber-500/40 bg-card shadow-sm'
                    : 'bg-card hover:bg-card/90 border-border/80 hover:border-orange-500/50';

            const barStyle = isGuilty
              ? 'bg-gradient-to-b from-rose-500 via-rose-600 to-rose-700 w-2'
              : isInnocent
                ? 'bg-gradient-to-b from-emerald-400 via-teal-500 to-emerald-600 w-2'
                : isInconclusive
                  ? 'bg-gradient-to-b from-amber-400 via-orange-500 to-amber-600 w-2'
                  : match.isWinner
                    ? 'bg-gradient-to-b from-emerald-400 to-teal-500 w-1.5'
                    : 'bg-gradient-to-b from-rose-500 to-purple-600 w-1.5';

            return (
              <div
                key={match.matchId}
                onClick={() => setSelectedMatch(match)}
                className={`group border rounded-2xl p-4 md:p-5 transition-all duration-200 shadow-md cursor-pointer relative overflow-hidden flex flex-col md:flex-row items-center justify-between gap-4 ${cardBorderStyle}`}
              >
                {/* Left Metallic Accent Indicator Bar */}
                <div className={`absolute top-0 bottom-0 left-0 transition-all ${barStyle}`} />

                {/* Victory/Defeat Badge & ELO Delta */}
                <div className="flex items-center gap-4 w-full md:w-auto">
                  <div
                    className={`w-28 h-12 rounded-xl border text-center font-black text-xs uppercase tracking-wider flex flex-col items-center justify-center gap-0.5 shadow-sm shrink-0 ${match.isWinner
                        ? 'bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-emerald-500/10 text-emerald-600 border-emerald-500/30'
                        : match.isDraw
                          ? 'bg-muted text-muted-foreground border-border'
                          : 'bg-gradient-to-br from-rose-500/10 via-purple-500/5 to-rose-500/10 text-rose-600 border-rose-500/30'
                      }`}
                  >
                    <span className="flex items-center gap-1 font-black">
                      {match.isWinner ? <Trophy className="h-3.5 w-3.5 text-amber-500" /> : null}
                      {match.isWinner ? 'VICTORY' : match.isDraw ? 'DRAW' : 'DEFEAT'}
                    </span>

                    {/* Sub-tag inside fixed outcome box */}
                    {isGuilty ? (
                      <span className="text-[9px] font-black text-rose-500 tracking-wider flex items-center gap-0.5">
                        <ShieldAlert className="h-2.5 w-2.5" /> GIAN LẬN
                      </span>
                    ) : isInnocent ? (
                      <span className="text-[9px] font-black text-emerald-500 tracking-wider flex items-center gap-0.5">
                        <ShieldCheck className="h-2.5 w-2.5" /> HỢP LỆ
                      </span>
                    ) : isInconclusive ? (
                      <span className="text-[9px] font-black text-amber-500 tracking-wider">
                        ĐÃ KIỂM DUYỆT
                      </span>
                    ) : isPending ? (
                      <span className="text-[9px] font-black text-amber-500 tracking-wider animate-pulse flex items-center gap-0.5">
                        ⏳ ĐANG DUYỆT
                      </span>
                    ) : match.eloChange !== 0 ? (() => {
                      const effectiveElo = match.isDraw ? 0 : match.isWinner ? Math.abs(match.eloChange) : -Math.abs(match.eloChange);
                      if (effectiveElo === 0) return null;
                      return (
                        <span
                          className={`text-[11px] font-mono font-bold ${effectiveElo > 0 ? 'text-emerald-600' : 'text-rose-600'
                            }`}
                        >
                          {effectiveElo > 0 ? `+${effectiveElo}` : effectiveElo} ELO
                        </span>
                      );
                    })() : null}
                  </div>

                  {/* Match Mode & Timestamp Info */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="px-2 py-0.5 text-[9px] font-black uppercase tracking-wider bg-muted text-orange-500 border border-border rounded-md">
                        {match.puzzleTypeName}
                      </span>
                      <span className="text-[10px] font-bold text-muted-foreground uppercase">{match.modeName}</span>
                    </div>
                    <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                      <Clock className="h-3 w-3 text-muted-foreground/60" />
                      {new Date(match.createdAt).toLocaleDateString()} {new Date(match.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>
                </div>

                {/* Player vs Opponent Solve Times Comparison */}
                <div className="flex items-center justify-center gap-6 bg-muted/60 border border-border/60 px-5 py-2.5 rounded-xl w-full md:w-auto">
                  {/* Me */}
                  <div className="text-right space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight block">
                      {match.meUsername}
                    </span>
                    <span className="text-sm font-black font-mono text-emerald-600">
                      {formatSolveTime(match.meTimeMs, match.meIsDnf)}
                    </span>
                  </div>

                  <span className="text-xs font-black text-muted-foreground/60 font-mono uppercase">VS</span>

                  {/* Opponent */}
                  <div className="text-left space-y-0.5">
                    <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-tight block">
                      {match.opponentUsername}
                    </span>
                    <span className="text-sm font-black font-mono text-orange-500">
                      {formatSolveTime(match.opponentTimeMs, match.opponentIsDnf)}
                    </span>
                  </div>
                </div>

                {/* Watch Replay & Details Action Button */}
                <div className="flex items-center gap-2 w-full md:w-auto justify-end">
                  <button className="px-4 py-2.5 bg-orange-500 hover:bg-orange-600 group-hover:shadow-lg group-hover:shadow-orange-500/20 text-white font-black text-xs uppercase tracking-wider rounded-xl transition-all flex items-center gap-1.5 cursor-pointer border-none">
                    <Video className="h-3.5 w-3.5" /> Replay & Details
                    <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Match Detail Modal */}
      <MatchDetailModal
        matchItem={selectedMatch}
        isOpen={!!selectedMatch}
        onClose={() => setSelectedMatch(null)}
      />
    </div>
  );
}
