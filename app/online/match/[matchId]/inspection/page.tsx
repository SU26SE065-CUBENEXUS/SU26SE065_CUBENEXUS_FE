'use client';

import React, { useEffect, useState } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { Timer, AlertCircle } from 'lucide-react';

export default function InspectionPage() {
  const { state } = useMatchContext();
  const [secondsLeft, setSecondsLeft] = useState<number>(15);

  useEffect(() => {
    if (!state?.inspectionDeadlineAt) {
      setSecondsLeft(15);
      return;
    }

    const serverSkew = Date.now() - new Date(state.serverNow).getTime();
    const targetTime = new Date(state.inspectionDeadlineAt).getTime();

    const updateTimer = () => {
      const correctedNow = Date.now() - serverSkew;
      const diff = Math.max(0, Math.ceil((targetTime - correctedNow) / 1000));
      setSecondsLeft(diff);
    };

    updateTimer();
    const interval = setInterval(updateTimer, 200);

    return () => clearInterval(interval);
  }, [state?.inspectionDeadlineAt, state?.serverNow]);

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full text-center">
      <div className="space-y-2">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 4 / 4
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">INSPECTION</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Inspect your Rubik's cube according to the scramble sequence shown below.
        </p>
      </div>

      {/* Gigantic Timer Circle */}
      <div className="relative h-56 w-56 mx-auto flex items-center justify-center">
        <div className={`absolute inset-0 rounded-full border-4 border-dashed transition-all ${
          secondsLeft <= 3 ? 'border-rose-500 animate-ping' : 'border-orange-500/40 animate-pulse'
        }`} />

        <div className="h-44 w-44 rounded-full bg-zinc-900 border border-zinc-800 shadow-2xl flex flex-col items-center justify-center">
          <span className={`font-mono font-black text-7xl tracking-tighter ${
            secondsLeft <= 3 ? 'text-rose-500 animate-bounce' : 'text-white'
          }`}>
            {secondsLeft}
          </span>
          <span className="text-[10px] font-bold text-zinc-500 tracking-widest uppercase mt-1 flex items-center gap-1">
            <Timer className="h-3.5 w-3.5" /> SECONDS
          </span>
        </div>
      </div>

      {/* Scramble Display Card */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-6 backdrop-blur-md shadow-xl space-y-4">
        <span className="block text-[10px] text-orange-500 font-black tracking-widest uppercase">
          Scramble Sequence
        </span>
        <p className="font-mono text-lg sm:text-xl font-bold tracking-wide text-white leading-relaxed select-all">
          {state?.scrambleSequence || 'U R F2 L B2 D2 R2 ...'}
        </p>
        <span className="block text-[9px] text-zinc-500 font-bold">
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
