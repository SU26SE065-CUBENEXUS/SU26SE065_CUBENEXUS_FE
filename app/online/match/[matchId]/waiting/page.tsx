'use client';

import React, { useMemo } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { CheckCircle2, User, Loader2, Sparkles, Swords, Activity, HelpCircle } from 'lucide-react';

export default function WaitingOpponentPage() {
  const { state } = useMatchContext();

  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const myState = useMemo(() => {
    if (!state) return null;
    return state.player1.userId === userId ? state.player1 : state.player2;
  }, [state, userId]);

  const opponentState = useMemo(() => {
    if (!state) return null;
    return state.player1.userId === userId ? state.player2 : state.player1;
  }, [state, userId]);

  if (!state || !myState || !opponentState) return null;

  // Determine what opponent is doing
  let oppStatusDesc = 'Preparing battle station...';
  if (opponentState.resultStatus === 'PENDING') {
    oppStatusDesc = 'Currently solving Rubik\'s cube...';
  } else if (opponentState.resultStatus === 'VALID' && opponentState.finishCheckStatus !== 'PASSED') {
    oppStatusDesc = 'Scanning solved Rubik\'s cube faces...';
  }

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full">
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Match State: Waiting
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">WAITING FOR OPPONENT</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          You have successfully completed all stages. Awaiting opponent's submission.
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 rounded-3xl backdrop-blur-md shadow-2xl space-y-6">
        {/* User own completed status */}
        <div className="bg-zinc-950/60 border border-zinc-850 p-5 rounded-2xl flex items-center justify-between">
          <div className="flex items-center gap-3">
            <CheckCircle2 className="h-6 w-6 text-emerald-400" />
            <div>
              <span className="block text-xs font-bold text-white uppercase">Your Status</span>
              <span className="text-[10px] text-zinc-500">
                {myState.resultStatus === 'DNF' ? 'DNF result submitted' : 'VALID solve time verified'}
              </span>
            </div>
          </div>
          <span className="text-sm font-black font-mono text-white">
            {myState.resultStatus === 'DNF' ? 'DNF' : `${((myState.timeMs || 0) / 1000).toFixed(2)}s`}
          </span>
        </div>

        {/* Opponent pending status card */}
        <div className="border border-dashed border-zinc-850 bg-zinc-950/20 p-5 rounded-2xl flex items-center justify-between relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="flex items-center gap-3 relative z-10">
            <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
            <div>
              <span className="block text-xs font-bold text-white uppercase">Opponent Progress</span>
              <span className="text-[10px] text-zinc-400">{oppStatusDesc}</span>
            </div>
          </div>
          <span className="text-[10px] text-zinc-500 font-extrabold uppercase bg-zinc-900 border border-zinc-800 px-3 py-1 rounded-full relative z-10 animate-pulse">
            PENDING
          </span>
        </div>
      </div>

      <div className="text-center">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Activity className="h-3.5 w-3.5 text-orange-500" /> Live camera stream viewing available in sidebar
        </span>
      </div>
    </div>
  );
}
