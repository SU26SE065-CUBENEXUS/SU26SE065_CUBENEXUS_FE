'use client';

import React, { useMemo, useState, useEffect } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';

import { submitMobileTimerTime, mockFinishPass } from '@/features/online-arena/api/onlineArenaApi';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { Timer, ArrowRight, Loader2, Sparkles, AlertCircle, Cpu, Clock, Wifi, WifiOff } from 'lucide-react';

function useCountdown(deadlineIso: string | null, serverNowIso: string): string {
  const skewRef = React.useRef<number | null>(null);

  const parseUtc = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
    return new Date(hasTimezone ? dateStr : `${dateStr}Z`).getTime();
  };

  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadlineIso) return 0;
    const skew = Date.now() - parseUtc(serverNowIso);
    skewRef.current = skew;
    return Math.max(0, Math.floor((parseUtc(deadlineIso) - Date.now() + skew) / 1000));
  });

  useEffect(() => {
    if (!deadlineIso) return;

    if (skewRef.current === null) {
      skewRef.current = Date.now() - parseUtc(serverNowIso);
    }
    const stableSkew = skewRef.current;

    const tick = () => {
      const secs = Math.max(0, Math.floor((parseUtc(deadlineIso) - Date.now() + stableSkew) / 1000));
      setRemaining(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export default function SolvingPage() {
  const { matchId, state, refetch } = useMatchContext();
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


  // NOTE: Recording is intentionally NOT stopped here after solve submission.
  // The player still needs to scan the solved cube (Finish Check) before recording stops.
  // Recording will stop in finish/page.tsx after the Finish Check scan passes,
  // OR in waiting/page.tsx as a safety net if the player skips somehow.

  const countdownStr = useCountdown(
    state?.solveDeadlineAt ?? null,
    state?.serverNow ?? new Date().toISOString()
  );

  if (!state || !myState) return null;

  const formatTime = (ms: number) => {
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
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
      setSimError(err.message || 'Simulation submission failed. Session IDs must match paired mobile session.');
    } finally {
      setIsSimulating(false);
    }
  };

  const [isMockingFinish, setIsMockingFinish] = useState(false);
  const handleMockFinish = async () => {
    if (isMockingFinish) return;
    setIsMockingFinish(true);
    setSimError(null);
    try {
      await mockFinishPass(matchId);
      await refetch();
    } catch (err: any) {
      console.error(err);
      setSimError(err.message || 'Mock finish submission failed.');
    } finally {
      setIsMockingFinish(false);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full text-center">
      <div className="space-y-2">
        <span className="bg-green-500/10 border border-green-500/20 text-green-600 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase animate-pulse">
          SOLVING ACTIVE
        </span>
        <h2 className="text-3xl font-black text-foreground uppercase tracking-wider">SOLVING</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Solve the scramble on your Stackmat Timer. The solve time will automatically upload.
        </p>
      </div>

      {state.solveDeadlineAt && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${
            parseInt(countdownStr) < 30
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-600'
              : 'border-orange-500/20 bg-orange-500/10 text-orange-500'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Time limit remaining
          </span>
          <span className="font-mono text-base font-black">{countdownStr}</span>
        </div>
      )}

      {/* Visual status panel */}
      <div className="bg-card/60 border border-border/80 p-8 rounded-3xl backdrop-blur-md shadow-md space-y-6 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-b from-green-500/5 via-transparent to-transparent pointer-events-none" />

        <div className="space-y-2">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">
            {myState.resultStatus !== 'PENDING' ? 'OFFICIAL SOLVE TIME' : 'SOLVE TIME'}
          </span>
          {myState.resultStatus !== 'PENDING' && myState.timeMs !== null ? (
            <span className="font-mono text-7xl font-black text-emerald-600 tracking-tighter block select-none animate-fade-in">
              {formatTime(myState.timeMs)}
            </span>
          ) : (
            <div className="py-2 flex flex-col items-center justify-center gap-1">
              <span className="font-mono text-7xl font-black text-muted-foreground/30 tracking-tighter block select-none animate-pulse">
                --.--
              </span>
              <span className="text-[9px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full uppercase tracking-wider animate-pulse">
                Awaiting Mobile Timer
              </span>
            </div>
          )}
        </div>

        <div className="bg-background/60 border border-border p-4 rounded-2xl flex items-center justify-center gap-3">
          <Loader2 className="h-4.5 w-4.5 text-green-500 animate-spin" />
          <span className="text-[10px] font-black text-muted-foreground tracking-wider uppercase">
            Awaiting Mobile Timer Submission...
          </span>
        </div>

        {/* Live stackmat connection indicator */}
        <div className="flex items-center justify-center gap-2 pt-2 border-t border-border">
          <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-[10px] font-black uppercase border ${
            myState.timerReady
              ? 'text-emerald-600 border-emerald-500/25 bg-emerald-500/10'
              : 'text-rose-600 border-rose-500/25 bg-rose-500/10'
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
        <div className="rounded-3xl border border-dashed border-border bg-card/10 p-6 space-y-4 text-left animate-fade-in">
          <div className="flex items-center gap-2 border-b border-border/80 pb-3">
            <Cpu className="h-4.5 w-4.5 text-orange-500" />
            <h4 className="text-xs font-black text-foreground uppercase tracking-wider">
              [Dev Simulator] Solve Time Submission
            </h4>
          </div>
          <p className="text-[11px] text-muted-foreground leading-normal">
            Simulates a Stackmat Timer stop. Submits automatically to the API matching QR codes.
          </p>

          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => handleSimulateSubmit(false)}
              disabled={isSimulating}
              className="flex-1 bg-card hover:bg-muted border border-border hover:border-border text-foreground font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Simulate VALID Stop'}
            </button>
            <button
              onClick={() => handleSimulateSubmit(true)}
              disabled={isSimulating}
              className="flex-1 bg-muted hover:bg-muted/80 border border-rose-500/20 text-rose-600 font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
            >
              {isSimulating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Simulate DNF Stop'}
            </button>
          </div>

          <button
            onClick={handleMockFinish}
            disabled={isMockingFinish}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {isMockingFinish ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Dev: Mock Finish Solve'}
          </button>

          {simError && (
            <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/25 p-3 rounded-lg text-rose-500 text-[10px] leading-relaxed font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{simError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

