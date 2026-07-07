'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { submitMobileTimerTime } from '@/features/online-arena/api/onlineArenaApi';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { Timer, ArrowRight, Loader2, Sparkles, AlertCircle, Cpu, Clock, Wifi, WifiOff } from 'lucide-react';

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

export default function SolvingPage() {
  const { matchId, state, refetch } = useMatchContext();
  const [elapsed, setElapsed] = useState<number>(0);
  const [isSimulating, setIsSimulating] = useState(false);
  const [simError, setSimError] = useState<string | null>(null);
  const [isDev, setIsDev] = useState(false);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDev(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );
    }
  }, []);

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

  // Run a local visual stopwatch
  useEffect(() => {
    if (myState?.resultStatus !== 'PENDING') return;

    const start = Date.now();
    const interval = setInterval(() => {
      setElapsed(Date.now() - start);
    }, 47);

    return () => clearInterval(interval);
  }, [myState?.resultStatus]);

  const countdownStr = useCountdown(
    state?.solveDeadlineAt ?? null,
    state?.serverNow ?? new Date().toISOString()
  );

  if (!state || !myState) return null;

  const formatTime = (ms: number) => {
    const totalSecs = ms / 1000;
    return `${totalSecs.toFixed(2)}s`;
  };

  // Simulation handler for devs
  const handleSimulateSubmit = async (isDnf: boolean) => {
    if (isSimulating) return;
    setIsSimulating(true);
    setSimError(null);
    try {
      await submitMobileTimerTime({
        matchId,
        mobileTimerSessionId: crypto.randomUUID(),
        deviceSessionToken: state.qrSessionCode || '',
        timeMs: isDnf ? 0 : 11500 + Math.floor(Math.random() * 5000), // Random 11-16s time
        isDnf,
        stoppedAt: new Date().toISOString(),
      });
      await refetch();
    } catch (err: any) {
      console.error(err);
      setSimError(err.message || 'Simulation submission failed.');
    } finally {
      setIsSimulating(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full text-center">
      <div className="space-y-2">
        <span className="bg-green-500/10 border border-green-500/20 text-green-400 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase animate-pulse">
          SOLVING ACTIVE
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">SOLVING</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Solve the scramble on your Stackmat Timer. The solve time will automatically upload.
        </p>
      </div>

      {state.solveDeadlineAt && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${
            parseInt(countdownStr) < 30
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-orange-500/20 bg-orange-500/10 text-orange-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Time limit remaining
          </span>
          <span className="font-mono text-base font-black">{countdownStr}</span>
        </div>
      )}

      {/* Gigantic visual stopwatch */}
      <div className="bg-zinc-900/60 border border-zinc-800/80 p-8 rounded-3xl backdrop-blur-md shadow-2xl space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-2">
          <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest block">
            ESTIMATED ELAPSED TIME
          </span>
          <span className="font-mono text-7xl font-black text-white tracking-tighter block select-none">
            {myState.resultStatus !== 'PENDING' && myState.timeMs !== null
              ? formatTime(myState.timeMs)
              : formatTime(elapsed)}
          </span>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-2xl flex items-center justify-center gap-3">
          <Loader2 className="h-4.5 w-4.5 text-green-400 animate-spin" />
          <span className="text-[10px] font-black text-zinc-400 tracking-wider uppercase">
            Awaiting Mobile Timer Submission...
          </span>
        </div>

        {/* Live stackmat connection indicator */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-zinc-850">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
            myState.timerReady
              ? 'text-emerald-400 border-emerald-500/25 bg-emerald-500/10'
              : 'text-rose-400 border-rose-500/25 bg-rose-500/10'
          }`}>
            {myState.timerReady ? (
              <>
                <Wifi className="h-3.5 w-3.5" /> Stackmat connected
              </>
            ) : (
              <>
                <WifiOff className="h-3.5 w-3.5" /> Stackmat disconnected
              </>
            )}
          </span>
        </div>
      </div>

      {/* Developer simulation controls */}
      {isDev && myState.resultStatus === 'PENDING' && (
        <div className="rounded-3xl border border-dashed border-zinc-800/80 bg-zinc-900/10 p-6 space-y-4 text-left animate-fade-in">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <Cpu className="h-4.5 w-4.5 text-orange-500" />
            <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider">
              [Dev Simulator] Solve Time Submission
            </h4>
          </div>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Simulates a Stackmat Timer stop. Submits automatically to the API matching QR codes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSimulateSubmit(false)}
              disabled={isSimulating}
              className="flex-1 bg-zinc-900 hover:bg-zinc-800 border border-zinc-850 hover:border-zinc-700/60 text-white font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Simulate VALID Stop'}
            </button>
            <button
              onClick={() => handleSimulateSubmit(true)}
              disabled={isSimulating}
              className="flex-1 bg-zinc-950 hover:bg-zinc-900 border border-rose-500/20 text-rose-400 font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2"
            >
              {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Simulate DNF Stop'}
            </button>
          </div>

          {simError && (
            <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/15 p-3 rounded-lg text-rose-400 text-[10px] leading-relaxed font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{simError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

