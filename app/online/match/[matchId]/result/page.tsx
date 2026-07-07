'use client';

import React, { useMemo } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { useRouter } from 'next/navigation';
import { Trophy, Swords, ShieldCheck, TrendingUp, TrendingDown, ArrowRight, Home } from 'lucide-react';

export default function ResultPage() {
  const { state } = useMatchContext();
  const router = useRouter();

  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const { mePlayer, opponentPlayer, eloBefore, eloAfter, oppEloBefore, oppEloAfter } = useMemo(() => {
    if (!state) return { mePlayer: null, opponentPlayer: null };
    const isP1 = state.player1.userId === userId;
    return {
      mePlayer: isP1 ? state.player1 : state.player2,
      opponentPlayer: isP1 ? state.player2 : state.player1,
      eloBefore: isP1 ? state.player1EloBefore : state.player2EloBefore,
      eloAfter: isP1 ? state.player1EloAfter : state.player2EloAfter,
      oppEloBefore: isP1 ? state.player2EloBefore : state.player1EloBefore,
      oppEloAfter: isP1 ? state.player2EloAfter : state.player1EloAfter,
    };
  }, [state, userId]);

  if (!state || !mePlayer || !opponentPlayer) return null;

  const isWinner = state.winnerId === userId;
  const isDraw = state.outcome === 'DRAW' || !state.winnerId;

  // Format times helper
  const formatTime = (status: string, ms: number | null) => {
    if (status === 'DNF') return 'DNF';
    return ms !== null ? `${(ms / 1000).toFixed(2)}s` : '—';
  };

  // ELO delta calculation
  const eloDelta = eloAfter !== undefined && eloBefore !== undefined && eloAfter !== null && eloBefore !== null
    ? eloAfter - eloBefore
    : null;

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full text-center">
      {/* Victory/Defeat Banner */}
      <div className="space-y-3">
        {isDraw ? (
          <div className="space-y-2">
            <span className="bg-zinc-800 text-zinc-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase border border-zinc-700/50">
              Draw Match
            </span>
            <h2 className="text-4xl font-black text-white uppercase tracking-wider">DRAW GAME</h2>
          </div>
        ) : isWinner ? (
          <div className="space-y-2">
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase animate-pulse">
              Victory
            </span>
            <h2 className="text-4xl font-black text-amber-400 uppercase tracking-wider drop-shadow-[0_0_15px_oklch(0.72_0.21_42_/_0.2)]">
              VICTORY
            </h2>
          </div>
        ) : (
          <div className="space-y-2">
            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
              Defeat
            </span>
            <h2 className="text-4xl font-black text-rose-500 uppercase tracking-wider">DEFEAT</h2>
          </div>
        )}
      </div>

      {/* Main Results card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-8 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />

        {/* ELO Changes display */}
        {eloDelta !== null && eloAfter !== null && (
          <div className="bg-zinc-950/60 border border-zinc-850 p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 relative">
            <span className="text-[9px] text-zinc-500 font-black tracking-widest uppercase">ELO Rating Impact</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-white">{eloAfter}</span>
              <span className={`flex items-center gap-0.5 text-sm font-extrabold px-2.5 py-0.5 rounded-full ${
                eloDelta >= 0
                  ? 'text-emerald-400 bg-emerald-500/10'
                  : 'text-rose-400 bg-rose-500/10'
              }`}>
                {eloDelta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {eloDelta >= 0 ? `+${eloDelta}` : eloDelta} ELO
              </span>
            </div>
          </div>
        )}

        {/* Duels Comparison Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* You card */}
          <div className={`p-5 rounded-2xl border text-left space-y-3 ${
            isWinner && !isDraw ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-950/60 border-zinc-850'
          }`}>
            <span className="text-[9px] text-zinc-500 font-black tracking-wider uppercase block">You</span>
            <div className="space-y-1">
              <span className="block text-2xl font-black font-mono text-white">
                {formatTime(mePlayer.resultStatus, mePlayer.timeMs)}
              </span>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                mePlayer.resultStatus === 'DNF'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {mePlayer.resultStatus === 'DNF' ? 'DNF' : 'VALID'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold border-t border-zinc-900 pt-2 flex justify-between">
              <span>Finish Check:</span>
              <span className={mePlayer.finishCheckStatus === 'PASSED' || mePlayer.finishCheckStatus === 'NOT_REQUIRED' ? 'text-emerald-400' : 'text-rose-400'}>
                {mePlayer.finishCheckStatus}
              </span>
            </div>
          </div>

          {/* Opponent card */}
          <div className={`p-5 rounded-2xl border text-left space-y-3 ${
            !isWinner && !isDraw ? 'bg-amber-500/5 border-amber-500/20' : 'bg-zinc-950/60 border-zinc-850'
          }`}>
            <span className="text-[9px] text-zinc-500 font-black tracking-wider uppercase block">
              Player_{opponentPlayer.userId.slice(0, 6)}
            </span>
            <div className="space-y-1">
              <span className="block text-2xl font-black font-mono text-white">
                {formatTime(opponentPlayer.resultStatus, opponentPlayer.timeMs)}
              </span>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                opponentPlayer.resultStatus === 'DNF'
                  ? 'text-rose-400 bg-rose-500/10 border-rose-500/20'
                  : 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
              }`}>
                {opponentPlayer.resultStatus === 'DNF' ? 'DNF' : 'VALID'}
              </span>
            </div>
            <div className="text-[10px] text-zinc-500 font-semibold border-t border-zinc-900 pt-2 flex justify-between">
              <span>Finish Check:</span>
              <span className={opponentPlayer.finishCheckStatus === 'PASSED' || opponentPlayer.finishCheckStatus === 'NOT_REQUIRED' ? 'text-emerald-400' : 'text-rose-400'}>
                {opponentPlayer.finishCheckStatus}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Play Again actions */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
        <button
          onClick={() => router.push('/online/matchmaking')}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/15 transition-all uppercase tracking-widest"
        >
          <Swords className="h-4.5 w-4.5" /> Duel Again
        </button>
        <button
          onClick={() => router.push('/online')}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-extrabold text-xs py-4 px-6 rounded-2xl transition-all uppercase tracking-widest"
        >
          <Home className="h-4.5 w-4.5" /> Return Lobby
        </button>
      </div>
    </div>
  );
}
