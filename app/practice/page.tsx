'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState, useEffect, useRef, useCallback, useMemo } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useOnlineArenaSignalR } from '@/features/online-arena/hooks/useOnlineArenaSignalR';
import { getPuzzleTypes } from '@/lib/api/tournaments';
import {
  startPracticeSession,
  endPracticeSession,
  createPracticeAttempt,
  getCurrentPracticeAttempt,
  abortPracticeAttempt,
  getMyPracticeSessions,
  getPracticeSessionDetail,
} from '@/lib/api/practice';
import type {
  PuzzleTypeResponseDto,
  PracticeSessionResponseDto,
  PracticeAttemptResponseDto,
  PracticeSessionSummaryDto,
  PracticeSolveResponseDto,
} from '@/lib/api/types';
import { toast } from 'sonner';
import {
  Clock,
  Zap,
  Target,
  BookOpen,
  Timer,
  Play,
  RotateCcw,
  Sparkles,
  Award,
  BookMarked,
  LoaderCircle,
  XCircle,
  Info,
  ChevronDown,
  ChevronUp,
  Smartphone,
  QrCode,
  Wifi,
  WifiOff,
} from 'lucide-react';

export default function PracticePage() {
  const { isAuthenticated, isLoading: authLoading } = useAuth();
  const router = useRouter();

  // Settings & Lists
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [selectedMode, setSelectedMode] = useState('timing');
  const [puzzleTypes, setPuzzleTypes] = useState<PuzzleTypeResponseDto[]>([]);
  const [selectedPuzzleType, setSelectedPuzzleType] = useState<PuzzleTypeResponseDto | null>(null);
  const [isLoadingPuzzles, setIsLoadingPuzzles] = useState(true);

  // WCA Options (display only)
  const [useInspection, setUseInspection] = useState(true);

  // Collapsible sections
  const [showCheatSheet, setShowCheatSheet] = useState(false);

  // Practice Session States
  const [activeSession, setActiveSession] = useState<PracticeSessionResponseDto | null>(null);
  const [sessionSummary, setSessionSummary] = useState<PracticeSessionSummaryDto | null>(null);
  const [currentAttempt, setCurrentAttempt] = useState<PracticeAttemptResponseDto | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(false);
  const [solvesList, setSolvesList] = useState<PracticeSolveResponseDto[]>([]);

  // Mobile Timer Syncing States
  const [mobileConnected, setMobileConnected] = useState(false);
  const [isQrModalOpen, setIsQrModalOpen] = useState(false);

  // Live Timer Sync: Web mirrors Mobile's running timer
  const [liveTimeMs, setLiveTimeMs] = useState<number | null>(null);
  // frozenTimeMs: stores the last known live time when Mobile stopped, shown until new solve starts
  const [frozenTimeMs, setFrozenTimeMs] = useState<number | null>(null);
  const liveTimerRef = useRef<NodeJS.Timeout | null>(null);
  const liveStartTimeRef = useRef<number | null>(null);
  const currentAttemptRef = useRef<PracticeAttemptResponseDto | null>(null);
  const mobileConnectedToastedRef = useRef(false);

  const startLiveTimer = useCallback((serverStartedAt?: string) => {
    if (liveTimerRef.current) return;
    setFrozenTimeMs(null);

    // Compute baseline: match local client time with server's startedAt
    const startTime = serverStartedAt ? new Date(serverStartedAt).getTime() : Date.now();
    // In case of clock skew where server timestamp is in future vs local time, fallback to Date.now()
    liveStartTimeRef.current = (startTime > Date.now() || Date.now() - startTime > 3600000) ? Date.now() : startTime;

    liveTimerRef.current = setInterval(() => {
      if (liveStartTimeRef.current) {
        const elapsed = Math.max(0, Date.now() - liveStartTimeRef.current);
        setLiveTimeMs(elapsed);
      }
    }, 30);
  }, []);

  const stopLiveTimer = useCallback((exactFinalMs?: number | null) => {
    if (liveTimerRef.current) {
      clearInterval(liveTimerRef.current);
      liveTimerRef.current = null;
    }
    liveStartTimeRef.current = null;
    setLiveTimeMs(null);
    if (exactFinalMs !== undefined && exactFinalMs !== null && exactFinalMs > 0) {
      setFrozenTimeMs(exactFinalMs);
    }
  }, []);

  const syncHistory = useCallback(async (sessionId: string) => {
    try {
      const details = await getPracticeSessionDetail(sessionId);
      if (details?.solves) {
        setSessionSummary(details);
        setSolvesList(details.solves);
      }
    } catch (_) { }
  }, []);

  // ── SignalR Instant Real-time Synchronization ──
  useOnlineArenaSignalR(undefined, {
    onPracticeMobileConnected: (payload) => {
      console.log('[Practice SignalR] Mobile connected:', payload);
      setMobileConnected(true);
      setIsQrModalOpen(false);
      if (!mobileConnectedToastedRef.current) {
        mobileConnectedToastedRef.current = true;
        toast.success('📱 Mobile connected successfully!');
      }
    },
    onPracticeMobileDisconnected: () => {
      console.log('[Practice SignalR] Mobile disconnected');
      setMobileConnected(false);
      mobileConnectedToastedRef.current = false;
      toast.info('📱 Mobile timer disconnected');
    },
    onPracticeSessionEnded: () => {
      console.log('[Practice SignalR] Practice Session Ended');
      setMobileConnected(false);
      mobileConnectedToastedRef.current = false;
    },
    onPracticeAttemptUpdated: async (attempt: PracticeAttemptResponseDto) => {
      console.log('[Practice SignalR] Attempt updated:', attempt);

      const stateName = attempt.state;
      const activeTouchStates = ['HoldingHands', 'Ready', 'Solving'];
      if (activeTouchStates.includes(stateName)) {
        setMobileConnected(true);
        setIsQrModalOpen(false);
        if (!mobileConnectedToastedRef.current) {
          mobileConnectedToastedRef.current = true;
          toast.success('📱 Mobile connected successfully!');
        }
      }

      setCurrentAttempt(attempt);
      currentAttemptRef.current = attempt;

      if (stateName === 'Solving') {
        startLiveTimer(attempt.startedAt || undefined);
      } else {
        const exactTimeMs = attempt.displayTimeMs ?? attempt.timeMs ?? (attempt.stoppedAt && attempt.startedAt ? new Date(attempt.stoppedAt).getTime() - new Date(attempt.startedAt).getTime() : null);
        stopLiveTimer(exactTimeMs);

        if (stateName === 'Completed' || stateName === 'Finalized') {
          if (activeSession?.id) {
            await syncHistory(activeSession.id);
          }
        } else if (stateName === 'Scrambled' || stateName === 'HoldingHands' || stateName === 'Ready') {
          setFrozenTimeMs(null);
        }
      }
    },
  });

  // Setup Backup Polling / Syncing for active Practice Session
  useEffect(() => {
    if (!activeSession) {
      setMobileConnected(false);
      mobileConnectedToastedRef.current = false;
      stopLiveTimer();
      return;
    }

    const interval = setInterval(async () => {
      let attempt: any = null;
      try {
        attempt = await getCurrentPracticeAttempt(activeSession.id);
      } catch (_) {
        return;
      }

      if (!attempt) {
        return;
      }

      const currentState: string = attempt.state;

      // Update attempt state if changed
      if (!currentAttemptRef.current || currentAttemptRef.current.id !== attempt.id || currentAttemptRef.current.state !== currentState) {
        setCurrentAttempt(attempt);
        currentAttemptRef.current = attempt;
      }

      const activeStates = ['HoldingHands', 'Ready', 'Solving'];
      if (activeStates.includes(currentState)) {
        setMobileConnected(true);
        if (!mobileConnectedToastedRef.current) {
          mobileConnectedToastedRef.current = true;
          setIsQrModalOpen(false);
          toast.success('📱 Mobile connected! Ready to time.');
        }
      }

      if (currentState === 'Solving') {
        if (!liveTimerRef.current) {
          startLiveTimer(attempt.startedAt || undefined);
        }
      } else {
        if (liveTimerRef.current) {
          const exactTimeMs = attempt.displayTimeMs ?? attempt.timeMs ?? null;
          stopLiveTimer(exactTimeMs);
        }
        if (currentState === 'Completed' || currentState === 'Finalized') {
          await syncHistory(activeSession.id);
        } else if (currentState === 'Scrambled' || currentState === 'HoldingHands' || currentState === 'Ready') {
          setFrozenTimeMs(null);
        }
      }
    }, 2000);

    return () => {
      clearInterval(interval);
      if (liveTimerRef.current) {
        clearInterval(liveTimerRef.current);
        liveTimerRef.current = null;
      }
    };
  }, [activeSession?.id, startLiveTimer, stopLiveTimer, syncHistory]);

  // Fetch puzzle types and look for active session
  useEffect(() => {
    if (!isAuthenticated) return;

    const initPractice = async () => {
      try {
        setIsLoadingPuzzles(true);
        const types = await getPuzzleTypes();
        const activeTypes = types.filter(t => t.isActive);
        setPuzzleTypes(activeTypes);

        if (activeTypes.length > 0) {
          const defaultType = activeTypes.find(t => t.code === '333') || activeTypes[0];
          setSelectedPuzzleType(defaultType);
          await checkAndLoadActiveSession(defaultType.id);
        }
      } catch (err: any) {
        toast.error('Failed to load puzzle types. Please check your connection.');
      } finally {
        setIsLoadingPuzzles(false);
      }
    };

    initPractice();
  }, [isAuthenticated]);

  // Check if there is an active session for the selected puzzle type
  const checkAndLoadActiveSession = async (puzzleTypeId: string) => {
    try {
      setIsLoadingSession(true);
      const sessions = await getMyPracticeSessions(puzzleTypeId, 1, 5);
      const active = sessions.find(s => !s.endedAt);
      if (active) {
        setActiveSession(active);
        const details = await getPracticeSessionDetail(active.id);
        setSessionSummary(details);
        setSolvesList(details.solves || []);

        // Check for pending current attempt; if none, create one to show scramble
        let attempt: any = null;
        try {
          attempt = await getCurrentPracticeAttempt(active.id);
        } catch (_) { }

        if (attempt) {
          setCurrentAttempt(attempt);
        } else {
          // Auto-create so scramble is visible on web immediately
          const newAttempt = await createPracticeAttempt(active.id);
          setCurrentAttempt(newAttempt);
        }
      } else {
        setActiveSession(null);
        setSessionSummary(null);
        setSolvesList([]);
        setCurrentAttempt(null);
      }
    } catch (err: any) {
      console.error('Error loading session:', err);
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Web is display-only — no local clock or inspection logic needed.

  // Handle puzzle type change
  const handlePuzzleTypeChange = async (puzzleType: PuzzleTypeResponseDto) => {
    setSelectedPuzzleType(puzzleType);
    await checkAndLoadActiveSession(puzzleType.id);
  };

  // Start Practice Session
  const handleStartSession = async () => {
    if (!selectedPuzzleType) return;
    try {
      setIsLoadingSession(true);
      setMobileConnected(false);
      mobileConnectedToastedRef.current = false;
      const session = await startPracticeSession({ puzzleTypeId: selectedPuzzleType.id });
      setActiveSession(session);
      const details = await getPracticeSessionDetail(session.id);
      setSessionSummary(details);
      setSolvesList([]);
      // Create first attempt immediately so scramble shows on web right away
      const attempt = await createPracticeAttempt(session.id);
      setCurrentAttempt(attempt);
      toast.success(`Started practice session for ${selectedPuzzleType.name}!`);
    } catch (err: any) {
      toast.error('Could not start practice session. Please try again.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // End Practice Session
  const handleEndSession = async () => {
    if (!activeSession) return;
    try {
      setIsLoadingSession(true);
      setMobileConnected(false);
      mobileConnectedToastedRef.current = false;
      stopLiveTimer();
      if (currentAttempt && currentAttempt.state !== 'Completed' && currentAttempt.state !== 'Aborted') {
        await abortPracticeAttempt(currentAttempt.id, { reason: 'SESSION_END' });
      }
      const summary = await endPracticeSession(activeSession.id);
      setSessionSummary(summary);
      setActiveSession(null);
      setCurrentAttempt(null);
      toast.info('Practice session ended.');
    } catch (err: any) {
      toast.error('Could not end session. Please try again.');
    } finally {
      setIsLoadingSession(false);
    }
  };

  // Web is display-only. All timing is done via Mobile app.
  // No keyboard timer logic needed.

  // Auth Protection
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [authLoading, isAuthenticated, router]);

  const formatTime = (ms: number) => {
    if (ms === -1) return 'DNF';
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  // Dynamically compute session statistics from solve history
  const computedStats = useMemo(() => {
    const total = solvesList.length;
    if (total === 0) {
      return {
        total: sessionSummary?.totalSolves || 0,
        mean: sessionSummary?.meanMs ? formatTime(sessionSummary.meanMs) : '0.00s',
        best: sessionSummary?.bestMs ? formatTime(sessionSummary.bestMs) : '0.00s',
        bestAo5: sessionSummary?.bestAo5Ms ? formatTime(sessionSummary.bestAo5Ms) : 'N/A',
      };
    }
    const times = solvesList.map(s => s.displayTimeMs).filter(t => t > 0);
    const meanMs = times.length > 0 ? Math.round(times.reduce((a, b) => a + b, 0) / times.length) : 0;
    const bestMs = times.length > 0 ? Math.min(...times) : 0;

    let bestAo5Ms: number | null = null;
    if (solvesList.length >= 5) {
      for (let i = 0; i <= solvesList.length - 5; i++) {
        const window = solvesList.slice(i, i + 5).map(s => s.displayTimeMs);
        const sorted = [...window].sort((a, b) => a - b);
        const mid3 = sorted.slice(1, 4);
        const avg = Math.round(mid3.reduce((a, b) => a + b, 0) / 3);
        if (bestAo5Ms === null || avg < bestAo5Ms) {
          bestAo5Ms = avg;
        }
      }
    }

    return {
      total,
      mean: meanMs > 0 ? formatTime(meanMs) : (sessionSummary?.meanMs ? formatTime(sessionSummary.meanMs) : '0.00s'),
      best: bestMs > 0 ? formatTime(bestMs) : (sessionSummary?.bestMs ? formatTime(sessionSummary.bestMs) : '0.00s'),
      bestAo5: bestAo5Ms ? formatTime(bestAo5Ms) : (sessionSummary?.bestAo5Ms ? formatTime(sessionSummary.bestAo5Ms) : 'N/A'),
    };
  }, [solvesList, sessionSummary]);

  // Helper values for simple trend SVG graph
  const validSolves = solvesList.filter(s => s.displayTimeMs > 0);
  const chartHeight = 100;
  const chartWidth = 500;
  const times = validSolves.map(s => s.displayTimeMs);
  const maxTime = times.length > 0 ? Math.max(...times) : 1;
  const minTime = times.length > 0 ? Math.min(...times) : 0;
  const range = maxTime - minTime || 1;

  const points = validSolves
    .map((solve, index) => {
      const x = (index / (validSolves.length - 1 || 1)) * (chartWidth - 40) + 20;
      const y = chartHeight - ((solve.displayTimeMs - minTime) / range) * (chartHeight - 30) - 15;
      return `${x},${y}`;
    })
    .join(' ');

  if (authLoading || !mounted) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#eab308]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
        {/* Banner Section */}
        <Card className="border border-border/80 bg-card p-6 rounded-2xl relative overflow-hidden shadow-sm">
          <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div className="space-y-1.5">
              <div className="flex items-center gap-2 text-xs font-semibold text-[#ca8a04]">
                <Timer className="h-4 w-4 text-[#eab308]" />
                <span>Speedcubing Practice</span>
              </div>
              <h1 className="text-2xl font-black tracking-tight text-foreground sm:text-3xl uppercase">
                PRACTICE TIMER
              </h1>
              <p className="text-muted-foreground max-w-xl text-xs sm:text-sm leading-relaxed">
                WCA standard speedcubing timer. Connect with your Mobile App for wireless remote timing.
              </p>
            </div>

            {/* Puzzle & Option Selector */}
            <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
              <div className="bg-muted/40 border border-border rounded-xl p-3 flex flex-col gap-1.5 min-w-[180px]">
                <span className="text-[10px] font-black text-muted-foreground uppercase tracking-wider">Select Puzzle</span>
                <select
                  value={selectedPuzzleType?.id || ''}
                  onChange={(e) => {
                    const pt = puzzleTypes.find(t => t.id === e.target.value);
                    if (pt) handlePuzzleTypeChange(pt);
                  }}
                  disabled={!!activeSession || isLoadingPuzzles}
                  className="bg-background text-foreground border border-border rounded-lg px-2.5 py-1.5 text-xs font-semibold focus:outline-none focus:border-[#eab308] transition disabled:opacity-50"
                >
                  {puzzleTypes.length === 0 ? (
                    <option value="">Loading puzzles...</option>
                  ) : (
                    puzzleTypes.map((type) => (
                      <option key={type.id} value={type.id}>
                        {type.name} ({type.code})
                      </option>
                    ))
                  )}
                </select>
              </div>

            </div>
          </div>
        </Card>

        {/* Mobile Timer Pairing Banner - always visible when session active */}
        {activeSession && (
          <Card className="border border-amber-500/30 bg-amber-500/5 p-4 rounded-2xl flex flex-col sm:flex-row items-center justify-between gap-4 shadow-sm">
            <div className="flex items-center gap-3">
              <div className="p-3 bg-amber-500/10 rounded-xl text-amber-500 shrink-0">
                <Smartphone className="h-6 w-6" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <h4 className="text-sm font-bold text-foreground">Mobile Timer Connection</h4>
                  {mobileConnected ? (
                    <span className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1">
                      <Wifi className="h-3 w-3" /> Mobile Connected
                    </span>
                  ) : (
                    <span className="bg-amber-500/10 text-amber-600 border border-amber-500/20 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold flex items-center gap-1 animate-pulse">
                      <WifiOff className="h-3 w-3" /> Ready to Pair
                    </span>
                  )}
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Open the Mobile App and scan this QR code to turn your phone into a wireless timer.
                </p>
              </div>
            </div>

            {/* Interactive QR Code Button */}
            <button
              onClick={() => setIsQrModalOpen(true)}
              className="flex items-center gap-3 bg-background hover:bg-muted/50 border border-border p-2 rounded-xl transition shadow-sm group cursor-pointer"
              title="Click to enlarge QR code"
            >
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`CUBENEXUS_PRACTICE:${activeSession.id}`)}`}
                alt="Mobile Timer QR Code"
                className="w-14 h-14 rounded-lg bg-white p-1 group-hover:scale-105 transition"
              />
              <div className="text-left text-xs pr-2">
                <span className="font-bold text-foreground block group-hover:text-amber-500 transition flex items-center gap-1">
                  <QrCode className="h-3.5 w-3.5" /> Pair Mobile
                </span>
                <span className="text-[10px] text-muted-foreground">Click to enlarge</span>
              </div>
            </button>
          </Card>
        )}

        {activeSession ? (
          <div className="grid gap-6 lg:grid-cols-3">
            {/* Interactive Timer Block */}
            <div className="lg:col-span-2 space-y-6">
              <Card className="border border-border/80 bg-card p-6 sm:p-8 rounded-2xl flex flex-col items-center justify-center min-h-[400px] relative overflow-hidden shadow-sm">
                <div className="absolute inset-0 bg-gradient-to-b from-[#eab308]/2 to-transparent pointer-events-none" />

                {/* Scramble Display */}
                <div className="w-full text-center space-y-2 relative z-10 mb-6">
                  <div className="flex justify-between items-center px-2">
                    <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1">
                      <Target className="h-3.5 w-3.5 text-[#ca8a04]" /> WCA SCRAMBLE
                    </span>
                  </div>
                  <div className="bg-muted/30 border border-border/60 rounded-xl p-3.5 font-mono text-xs sm:text-sm text-foreground tracking-wide leading-relaxed shadow-sm">
                    {currentAttempt?.scrambleSequence || (
                      <span className="text-muted-foreground/60 italic">
                        Scan QR code on Mobile to start solve
                      </span>
                    )}
                  </div>
                </div>

                {/* Display-only: show attempt state synchronized with mobile */}
                <div className="flex flex-col items-center justify-center flex-grow py-6 relative z-10 w-full gap-3">
                  {/* Badge for latest solve if previous solves completed and waiting for new solve */}
                  {solvesList.length > 0 && currentAttempt?.state === 'Scrambled' && (
                    <div className="bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-3.5 py-1 rounded-full text-xs font-bold flex items-center gap-1.5 animate-fade-in shadow-xs">
                      <span className="text-emerald-500 font-extrabold">✓</span> Solved #{solvesList.length}: {formatTime(solvesList[solvesList.length - 1].displayTimeMs)}
                    </div>
                  )}

                  {/* Timer Display */}
                  <div
                    style={{
                      color:
                        currentAttempt?.state === 'Solving'
                          ? '#06d6a0'
                          : currentAttempt?.state === 'Ready'
                            ? '#06d6a0'
                            : currentAttempt?.state === 'HoldingHands'
                              ? '#ef4444'
                              : (currentAttempt?.state === 'Completed' || currentAttempt?.state === 'Stopped' || (frozenTimeMs !== null && currentAttempt?.state !== 'Scrambled'))
                                ? '#06d6a0'
                                : '#ca8a04',
                    }}
                    className={`font-mono text-6xl sm:text-8xl font-black transition-all duration-150 select-none ${currentAttempt?.state === 'Ready' ? 'animate-pulse' : ''
                      }`}
                  >
                    {currentAttempt?.state === 'Solving' && liveTimeMs !== null
                      ? formatTime(liveTimeMs)
                      : currentAttempt?.state === 'Solving'
                        ? '0.00s'
                        : (currentAttempt?.state === 'HoldingHands' || currentAttempt?.state === 'Ready' || currentAttempt?.state === 'Scrambled')
                          ? '0.00s'
                          : (currentAttempt?.state === 'Completed' || currentAttempt?.state === 'Stopped' || frozenTimeMs !== null)
                            ? formatTime(currentAttempt?.displayTimeMs ?? currentAttempt?.timeMs ?? frozenTimeMs ?? (solvesList.length > 0 ? solvesList[solvesList.length - 1].displayTimeMs : 0))
                            : '0.00s'}
                  </div>

                  {/* Mobile state instruction banner */}
                  <div className="flex flex-col items-center gap-1.5 mt-2">
                    {currentAttempt?.state === 'Solving' ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-2 rounded-full text-[11px] font-semibold">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#06d6a0] animate-ping" />
                        Timer Running... Tap Mobile screen to stop
                      </div>
                    ) : currentAttempt?.state === 'Ready' ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-2 rounded-full text-[11px] font-semibold animate-pulse">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#06d6a0]" />
                        🟢 Ready! Release hands on Mobile to start solving!
                      </div>
                    ) : currentAttempt?.state === 'HoldingHands' ? (
                      <div className="flex items-center gap-2 bg-red-500/10 border border-red-500/20 text-red-600 px-4 py-2 rounded-full text-[11px] font-semibold">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#ef4444] animate-pulse" />
                        ⏳ Holding... Wait for green light
                      </div>
                    ) : (currentAttempt?.state === 'Completed' || currentAttempt?.state === 'Stopped' || (frozenTimeMs !== null && currentAttempt?.state !== 'Scrambled')) ? (
                      <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 px-4 py-2 rounded-full text-[11px] font-semibold">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#06d6a0]" />
                        ✓ Solve Completed! Tap Mobile to start next solve (reset to 0)
                      </div>
                    ) : (
                      <div className="flex items-center gap-2 bg-muted/60 border border-border text-muted-foreground px-4 py-2 rounded-full text-[11px] font-semibold">
                        <span className="inline-block w-2 h-2 rounded-full bg-[#eab308] animate-pulse" />
                        Touch & Hold on Mobile to start new solve
                      </div>
                    )}
                    <span className="text-[10px] text-muted-foreground">
                      Attempt State:{' '}
                      <strong className="text-foreground">{currentAttempt?.state || 'Waiting for Mobile'}</strong>
                    </span>
                  </div>
                </div>

                {/* Session controls */}
                <div className="w-full flex justify-end items-center border-t border-border pt-4 mt-6 relative z-10 text-xs">
                  <Button
                    onClick={handleEndSession}
                    variant="outline"
                    className="border-border text-xs px-3 py-1.5 h-auto text-muted-foreground hover:text-red-500 hover:border-red-200 hover:bg-red-50/50 flex items-center gap-1.5 bg-transparent rounded-lg"
                  >
                    <XCircle className="h-3.5 w-3.5" /> End Practice
                  </Button>
                </div>
              </Card>

              {/* Statistics overview cards grid */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                {[
                  { label: 'Total Solves', value: computedStats.total },
                  { label: 'Mean', value: computedStats.mean },
                  { label: 'Best Single', value: computedStats.best },
                  { label: 'Best Ao5', value: computedStats.bestAo5 },
                ].map((stat) => (
                  <Card key={stat.label} className="border border-border/80 bg-card p-4 rounded-xl text-center shadow-sm">
                    <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                    <p className="text-lg font-black text-foreground mt-1">{stat.value}</p>
                  </Card>
                ))}
              </div>
            </div>

            {/* Session log detail column */}
            <div className="space-y-6">
              <Card className="border border-border/80 bg-card p-5 rounded-2xl flex flex-col justify-between shadow-sm min-h-[400px]">
                <div className="space-y-4">
                  <div className="flex justify-between items-center border-b border-border pb-3">
                    <h3 className="text-xs font-black uppercase tracking-wider text-[#ca8a04] flex items-center gap-1.5">
                      <Award className="h-4.5 w-4.5" /> RECENT SOLVES
                    </h3>
                    <span className="text-[10px] font-bold text-muted-foreground">
                      {(sessionSummary?.totalSolves || solvesList.length)} solves
                    </span>
                  </div>

                  {solvesList.length > 0 ? (
                    <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1">
                      {[...solvesList]
                        .map((solve, idx) => ({ ...solve, solveNumber: idx + 1 }))
                        .reverse()
                        .map((solve) => (
                          <div
                            key={solve.id || solve.solveNumber}
                            className="flex justify-between items-center rounded-xl bg-muted/30 border border-border/50 p-2.5 hover:border-[#eab308]/30 transition-all duration-200"
                          >
                            <div className="flex flex-col min-w-0">
                              <span className="text-[9px] font-bold text-muted-foreground">#{solve.solveNumber}</span>
                              <span className="text-[10px] text-muted-foreground truncate max-w-[130px] font-mono" title={solve.scrambleSequence}>
                                {solve.scrambleSequence}
                              </span>
                            </div>
                            <div className="text-right flex-shrink-0">
                              <span
                                className={`text-xs font-black block ${solve.penaltyCode === 'DNF' ? 'text-red-500' : 'text-foreground'
                                  }`}
                              >
                                {solve.penaltyCode === 'DNF' ? 'DNF' : formatTime(solve.displayTimeMs)}
                              </span>
                              {solve.penaltyCode && solve.penaltyCode !== 'OK' && (
                                <span className="text-[8px] font-bold text-amber-600 block">
                                  ({solve.penaltyCode})
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  ) : (
                    <div className="py-16 text-center text-xs text-muted-foreground/60 border border-dashed border-border rounded-xl">
                      <Timer className="h-8 w-8 mx-auto text-muted-foreground/30 mb-2" />
                      No solves recorded yet in this session.
                    </div>
                  )}
                </div>
              </Card>

              {/* Progress trend graph block */}
              {validSolves.length > 1 && (
                <Card className="border border-border/80 bg-card p-4 rounded-2xl shadow-sm">
                  <h3 className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider mb-2 flex items-center gap-1">
                    <Zap className="h-3.5 w-3.5 text-amber-500" /> Solve Trend (Time Progression)
                  </h3>
                  <div className="pt-2">
                    <svg viewBox={`0 0 ${chartWidth} ${chartHeight}`} className="w-full h-24 overflow-visible">
                      <polyline
                        fill="none"
                        stroke="#ca8a04"
                        strokeWidth="3"
                        points={points}
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      {/* Dots on points */}
                      {validSolves.map((solve, idx) => {
                        const x = (idx / (validSolves.length - 1 || 1)) * (chartWidth - 40) + 20;
                        const y = chartHeight - ((solve.displayTimeMs - minTime) / range) * (chartHeight - 30) - 15;
                        return (
                          <circle
                            key={idx}
                            cx={x}
                            cy={y}
                            r="4"
                            className="fill-white stroke-[#ca8a04] stroke-2 cursor-pointer hover:r-6 transition-all"
                          >
                            <title>{`Solve #${idx + 1}: ${formatTime(solve.displayTimeMs)}`}</title>
                          </circle>
                        );
                      })}
                    </svg>
                    <div className="flex justify-between text-[8px] text-muted-foreground mt-1 px-2 font-bold uppercase">
                      <span>First</span>
                      <span>Latest</span>
                    </div>
                  </div>
                </Card>
              )}
            </div>
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center py-20 border border-dashed border-border rounded-3xl bg-card shadow-sm">
            <Timer className="h-12 w-12 text-[#eab308] mb-3 animate-pulse" />
            <h2 className="text-lg font-bold mb-1">No Active Practice Session</h2>
            <p className="text-xs text-muted-foreground mb-6 max-w-sm text-center">
              Select a puzzle type from the selector above, then click the button below to start practicing.
            </p>
            <Button
              onClick={handleStartSession}
              disabled={!selectedPuzzleType}
              className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold px-6 py-2.5 rounded-xl text-xs shadow-sm border border-amber-300"
            >
              Start New Practice Session
            </Button>
          </div>
        )}

        {/* Display previous session summary if session just ended */}
        {!activeSession && sessionSummary && (
          <Card className="border border-border/80 bg-card p-6 rounded-2xl space-y-4 shadow-sm">
            <div>
              <h2 className="text-base font-black text-foreground uppercase tracking-wider">
                Previous Session Summary ({sessionSummary.puzzleTypeCode})
              </h2>
              <p className="text-[10px] text-muted-foreground mt-0.5">
                Time: {new Date(sessionSummary.startedAt).toLocaleTimeString()} - {new Date(sessionSummary.endedAt || '').toLocaleTimeString()}
              </p>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-muted/30 p-3.5 rounded-xl text-center border border-border/40">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Total Solves</span>
                <p className="text-lg font-black mt-0.5 text-foreground">{sessionSummary.totalSolves}</p>
              </div>
              <div className="bg-muted/30 p-3.5 rounded-xl text-center border border-border/40">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">DNF Count</span>
                <p className="text-lg font-black mt-0.5 text-red-500">{sessionSummary.dnfCount}</p>
              </div>
              <div className="bg-muted/30 p-3.5 rounded-xl text-center border border-border/40">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Best Single</span>
                <p className="text-lg font-black mt-0.5 text-green-600">
                  {sessionSummary.bestMs ? formatTime(sessionSummary.bestMs) : 'N/A'}
                </p>
              </div>
              <div className="bg-muted/30 p-3.5 rounded-xl text-center border border-border/40">
                <span className="text-[9px] text-muted-foreground uppercase font-bold">Mean</span>
                <p className="text-lg font-black mt-0.5 text-[#ca8a04]">
                  {sessionSummary.meanMs ? formatTime(sessionSummary.meanMs) : 'N/A'}
                </p>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-xs font-bold text-muted-foreground uppercase tracking-wider">Detailed Solves Breakdown</h3>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-[200px] overflow-y-auto pr-1">
                {sessionSummary.solves?.map((solve, idx) => (
                  <div key={idx} className="flex justify-between items-center rounded-xl bg-muted/20 border border-border/50 p-2.5 text-[11px]">
                    <span className="font-semibold text-muted-foreground">Solve #{idx + 1}</span>
                    <span className="font-mono text-muted-foreground truncate max-w-[130px]" title={solve.scrambleSequence}>
                      {solve.scrambleSequence}
                    </span>
                    <span className="font-black">{solve.penaltyCode === 'DNF' ? 'DNF' : formatTime(solve.displayTimeMs)}</span>
                  </div>
                ))}
              </div>
            </div>
          </Card>
        )}
      </div>

      {/* QR Code Enlarged Modal */}
      {isQrModalOpen && activeSession && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-xs p-4 animate-fade-in">
          <Card className="bg-card border border-border p-6 rounded-3xl max-w-sm w-full flex flex-col items-center text-center space-y-4 shadow-2xl relative">
            <button
              onClick={() => setIsQrModalOpen(false)}
              className="absolute top-4 right-4 p-1 rounded-full hover:bg-muted text-muted-foreground hover:text-foreground transition"
            >
              <XCircle className="h-5 w-5" />
            </button>
            <div className="p-3 bg-amber-500/10 rounded-2xl text-amber-500">
              <QrCode className="h-8 w-8" />
            </div>
            <div>
              <h3 className="text-base font-bold text-foreground">Scan QR to Pair Mobile</h3>
              <p className="text-xs text-muted-foreground mt-1">
                Use your Mobile App to scan this QR code and start timing remotely.
              </p>
            </div>
            <div className="bg-white p-4 rounded-2xl shadow-inner border border-zinc-200">
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(`CUBENEXUS_PRACTICE:${activeSession.id}`)}`}
                alt="Enlarged Mobile Timer QR Code"
                className="w-56 h-56 rounded-lg"
              />
            </div>
            <Button
              onClick={() => setIsQrModalOpen(false)}
              className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs py-2.5 rounded-xl shadow-sm"
            >
              Close
            </Button>
          </Card>
        </div>
      )}
    </main>
  );
}
