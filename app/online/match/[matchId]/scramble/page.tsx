'use client';

import React, { useState, useEffect } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { OnlineMatchScanner } from '@/features/online-arena/components/OnlineMatchScanner';
import { Radio, Clock } from 'lucide-react';

function useCountdown(deadlineIso: string | null, serverNowIso: string): string {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadlineIso) return 0;
    const skew = Date.now() - new Date(serverNowIso).getTime();
    return Math.max(0, Math.floor((new Date(deadlineIso).getTime() - Date.now() + skew) / 1000));
  });

  useEffect(() => {
    if (!deadlineIso) return;
    const skew = Date.now() - new Date(serverNowIso).getTime();
    const tick = () => {
      const secs = Math.max(0, Math.floor((new Date(deadlineIso).getTime() - Date.now() + skew) / 1000));
      setRemaining(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso, serverNowIso]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function ScrambleCheckPage() {
  const { matchId, state, refetch } = useMatchContext();

  const handleSuccess = async () => {
    console.log('Scramble Scan completed successfully! Refetching state...');
    await refetch();
  };

  const countdownStr = useCountdown(
    state?.setupDeadlineAt ?? null,
    state?.serverNow ?? new Date().toISOString()
  );

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full">
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 2 / 4
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">SCRAMBLE CHECK</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Align each of the 6 scramble faces to calibrate the AI computer vision state.
        </p>
      </div>

      {state?.setupDeadlineAt && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${
            parseInt(countdownStr) < 60
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-orange-500/20 bg-orange-500/10 text-orange-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Setup deadline remaining
          </span>
          <span className="font-mono text-base font-black">{countdownStr}</span>
        </div>
      )}

      <OnlineMatchScanner
        matchId={matchId}
        validationType="SCRAMBLE"
        onSuccess={handleSuccess}
      />

      <div className="text-center">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" /> Auto-evaluating grid alignment
        </span>
      </div>
    </div>
  );
}

