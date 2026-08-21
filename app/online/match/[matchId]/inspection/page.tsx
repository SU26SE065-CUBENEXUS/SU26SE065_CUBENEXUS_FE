'use client';

import React, { useEffect, useState, useRef } from 'react';
import { useRouter, useParams } from 'next/navigation';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { Timer, AlertCircle } from 'lucide-react';

export default function InspectionPage() {
  const { state, refetch } = useMatchContext();
  const [secondsLeft, setSecondsLeft] = useState<number>(15);
  const router = useRouter();
  const params = useParams();
  const matchId = params?.matchId as string;
  const hasRefetchedRef = useRef(false);

  const skewRef = useRef<number | null>(null);

  const parseUtc = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
    return new Date(hasTimezone ? dateStr : `${dateStr}Z`).getTime();
  };

  useEffect(() => {
    if (!state?.inspectionDeadlineAt || !state?.serverNow) {
      return;
    }

    if (skewRef.current === null) {
      skewRef.current = Date.now() - parseUtc(state.serverNow);
    }

    const targetTime = parseUtc(state.inspectionDeadlineAt);

    const updateTimer = () => {
      const correctedNow = Date.now() - (skewRef.current ?? 0);
      const diff = Math.max(0, Math.ceil((targetTime - correctedNow) / 1000));
      setSecondsLeft(diff);

      if (diff <= 0 && !hasRefetchedRef.current) {
        hasRefetchedRef.current = true;
        refetch();
      }
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);
    return () => clearInterval(interval);
  }, [state?.inspectionDeadlineAt, refetch]);


  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full text-center">
      <div className="space-y-2">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 4 / 4
        </span>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wider">INSPECTION</h2>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          Inspect your Rubik's cube according to the scramble sequence shown below.
        </p>
      </div>

      {/* Gigantic Timer Circle */}
      <div className="relative h-56 w-56 mx-auto flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all ${
          secondsLeft <= 3 ? 'border-rose-500 animate-ping' : 'border-orange-500/40 animate-pulse'
        }`} />

        <div className="h-44 w-44 rounded-full bg-white border border-slate-200 shadow-2xl flex flex-col items-center justify-center">
          <span className={`font-mono font-black text-7xl tracking-tighter ${
            secondsLeft <= 3 ? 'text-rose-500 animate-bounce' : 'text-slate-900'
          }`}>
            {secondsLeft}
          </span>
          <span className="text-[10px] font-bold text-slate-400 tracking-widest uppercase mt-1 flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> SECONDS
          </span>
        </div>
      </div>

      {/* Scramble Display Card */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm space-y-4">
        <span className="block text-[10px] text-orange-500 font-black tracking-widest uppercase">
          Scramble Sequence
        </span>
        <p className="font-mono text-lg sm:text-xl font-bold tracking-wide text-slate-800 leading-relaxed select-all">
          {state?.scrambleSequence || 'U R F2 L B2 D2 R2 ...'}
        </p>
        <span className="block text-[9px] text-slate-400 font-bold">
          * Tip: Triple click the scramble to select and copy.
        </span>
      </div>

      {secondsLeft <= 3 && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-3.5 rounded-2xl flex items-center justify-center gap-2 animate-pulse w-fit mx-auto">
          <AlertCircle className="h-4.5 w-4.5 text-rose-500" />
          <span className="text-[10px] font-black text-rose-500 uppercase tracking-widest">
            Inspection ending. Start solving immediately!
          </span>
        </div>
      )}
    </div>
  );
}
