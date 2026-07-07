'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect, useRef } from 'react';
import * as signalR from '@microsoft/signalr';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BadgeCheck, 
  ChevronRight, 
  QrCode, 
  ShieldCheck, 
  Signature, 
  Timer, 
  Award,
  Radio,
  Wifi,
  WifiOff,
  RefreshCw,
  Zap,
  RotateCcw,
  CheckCircle,
  AlertCircle,
  HelpCircle,
  Lock,
  UserCheck,
  Loader2,
  Info
} from 'lucide-react';
import { 
  getPublicTournaments,
  getTournamentById,
} from '@/lib/api/tournaments';
import {
  verifyJudgeStation,
  submitTraditionalResult,
  submitMedleyResult,
  getPenaltyTypes,
  getSolveProgress,
  getStationCompetitorsForSimulation
} from '@/lib/api/operations';
import type { 
  TournamentDetailDto, 
  EventDetailDto,
  VerifyJudgeStationResponseDto,
  SolveProgressDto,
} from '@/lib/api/types';
import { ScrambleDisplay } from '@/components/tournament-manager/ScrambleDisplay';
import { StationStatusBadge, type StationState } from '@/components/tournament-manager/StationStatusBadge';

type PenaltyMode = 'None' | '+2' | 'DNF';

interface MedleySolveState {
  medleyPuzzleId: string;
  puzzleName: string;
  scrambleId: string;
  scrambleSequence: string;
  time: string;
  penalty: PenaltyMode;
}

export default function JudgePage() {
  // ─── Setup States ──────────────────────────────────────────
  const [tournaments, setTournaments] = useState<TournamentDetailDto[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState('');
  const [selectedEventId, setSelectedEventId] = useState('');
  const [roundNumber, setRoundNumber] = useState('1');
  const [stationNumber, setStationNumber] = useState('1');
  
  const [activeTournament, setActiveTournament] = useState<TournamentDetailDto | null>(null);
  const [activeEvent, setActiveEvent] = useState<EventDetailDto | null>(null);
  const [penaltyTypes, setPenaltyTypes] = useState<any[]>([]);

  // ─── SignalR State ─────────────────────────────────────────
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const [isHubConnected, setIsHubConnected] = useState(false);
  const [hubStatus, setHubStatus] = useState('Disconnected');

  // ─── Active Lane / Competitor States ──────────────────────
  const [playerQr, setPlayerQr] = useState('');
  const [status, setStatus] = useState('Configure your lane (Tournament, Event, Round, Station) below and click Register Station.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCompetitor, setVerifiedCompetitor] = useState<VerifyJudgeStationResponseDto | null>(null);
  const [solveProgress, setSolveProgress] = useState<SolveProgressDto | null>(null);

  // Camera QR Scanner states
  const [Html5QrcodeScannerClass, setHtml5QrcodeScannerClass] = useState<any>(null);
  const [isScanning, setIsScanning] = useState(false);
  const [scannerInstance, setScannerInstance] = useState<any>(null);
  const [scanError, setScanError] = useState<string | null>(null);

  // Dev simulation helpers
  const [isDev, setIsDev] = useState(false);
  const [stationCompetitors, setStationCompetitors] = useState<any[]>([]);

  // Traditional Scoring Inputs
  const [stackmat, setStackmat] = useState('');
  const [penalty, setPenalty] = useState<PenaltyMode>('None');
  const [signature, setSignature] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [resultSummary, setResultSummary] = useState<string | null>(null);

  // Medley Scoring Inputs
  const [medleySolves, setMedleySolves] = useState<MedleySolveState[]>([]);

  // Canvas drawing reference for signature
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  // ─── Initial Data Loading ──────────────────────────────────
  useEffect(() => {
    async function loadInitialData() {
      try {
        const [tournList, penalties] = await Promise.all([
          getPublicTournaments(),
          getPenaltyTypes().catch(() => [
            { id: 'ok-uuid', code: 'OK', label: 'OK', timeAdditionMs: 0 },
            { id: 'plus2-uuid', code: 'PLUS_2', label: '+2s', timeAdditionMs: 2000 },
            { id: 'dnf-uuid', code: 'DNF', label: 'DNF', timeAdditionMs: 0 },
          ])
        ]);
        setTournaments(tournList);
        setPenaltyTypes(penalties);
        if (tournList.length > 0) {
          setSelectedTournamentId(tournList[0].id);
        }
      } catch (err) {
        console.error('Failed to load initial data:', err);
      }
    }
    loadInitialData();
  }, []);

  // Dynamic imports and dev checking
  useEffect(() => {
    if (typeof window !== 'undefined') {
      import('html5-qrcode').then((module) => {
        setHtml5QrcodeScannerClass(module.Html5Qrcode);
      });
      setIsDev(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        process.env.NODE_ENV === 'development'
      );
    }
  }, []);

  const loadStationCompetitors = async () => {
    if (!selectedEventId || !roundNumber || !stationNumber) return;
    try {
      const list = await getStationCompetitorsForSimulation(selectedEventId, Number(roundNumber), Number(stationNumber));
      setStationCompetitors(list);
    } catch (e) {
      console.warn('Simulation helper failed to fetch:', e);
    }
  };

  useEffect(() => {
    if (isDev && isHubConnected && selectedEventId && roundNumber && stationNumber) {
      loadStationCompetitors();
    }
  }, [isDev, isHubConnected, selectedEventId, roundNumber, stationNumber]);

  // Camera QR Scanner control methods
  const startCameraScanning = async () => {
    if (!Html5QrcodeScannerClass) {
      setScanError("Camera scanner library is still loading. Please wait a moment.");
      return;
    }
    try {
      setScanError(null);
      setIsScanning(true);

      if (scannerInstance) {
        await scannerInstance.stop().catch(() => undefined);
      }

      const html5Qrcode = new Html5QrcodeScannerClass("reader");
      setScannerInstance(html5Qrcode);

      await html5Qrcode.start(
        { facingMode: "environment" },
        {
          fps: 10,
          qrbox: { width: 250, height: 250 }
        },
        async (decodedText: string) => {
          await html5Qrcode.stop().catch(() => undefined);
          setScannerInstance(null);
          setIsScanning(false);
          setPlayerQr(decodedText);
          await executeVerification(decodedText);
        },
        () => {
          // ignore scan noise
        }
      );
    } catch (err: any) {
      console.error("Camera start error:", err);
      setScanError(err?.message || "Failed to start camera. Please verify permission settings.");
      setIsScanning(false);
    }
  };

  const stopCameraScanning = async () => {
    if (scannerInstance) {
      await scannerInstance.stop().catch(() => undefined);
      setScannerInstance(null);
    }
    setIsScanning(false);
  };

  useEffect(() => {
    return () => {
      if (scannerInstance) {
        scannerInstance.stop().catch(() => undefined);
      }
    };
  }, [scannerInstance]);

  // Update selected tournament detail
  useEffect(() => {
    if (!selectedTournamentId) return;
    async function loadDetail() {
      try {
        const detail = await getTournamentById(selectedTournamentId);
        setActiveTournament(detail);
        if (detail.events.length > 0) {
          setSelectedEventId(detail.events[0].id);
          setActiveEvent(detail.events[0]);
        } else {
          setSelectedEventId('');
          setActiveEvent(null);
        }
      } catch (err) {
        console.error('Error fetching tournament details:', err);
      }
    }
    loadDetail();
  }, [selectedTournamentId]);

  // Update selected event detail
  useEffect(() => {
    if (!selectedEventId || !activeTournament) {
      setActiveEvent(null);
      return;
    }
    const ev = activeTournament.events.find(e => e.id === selectedEventId);
    setActiveEvent(ev || null);
  }, [selectedEventId, activeTournament]);

  // Clear lane state on event/round changes
  useEffect(() => {
    resetLane();
  }, [selectedEventId, roundNumber, stationNumber]);

  // ─── SignalR Hub Lifecycle ──────────────────────────────────
  const connectHub = async () => {
    if (hubConnection) {
      await hubConnection.stop().catch(() => undefined);
      setHubConnection(null);
      setIsHubConnected(false);
    }

    if (!selectedEventId || !roundNumber || !stationNumber) {
      setStatus('Setup incomplete: Please select event, round, and station number.');
      return;
    }

    // Dynamic resolution or fallback proxy route for LAN connection
    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/tournament')
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    connection.on('ReceiveStationCommand', async (payload: { command: string; data?: any }) => {
      console.log('[Hub Station Command RECEIVED]', payload);
      if (payload.command === 'RELOAD_PROGRESS' && verifiedCompetitor?.groupCompetitorId) {
        await fetchProgress(verifiedCompetitor.groupCompetitorId);
      } else if (payload.command === 'LOCK_STATION') {
        setStatus('This lane has been locked by tournament administrators.');
        setVerifiedCompetitor(null);
      }
    });

    connection.on('RoundStarted', (payload: any) => {
      if (payload.eventId === selectedEventId && payload.roundNumber === Number(roundNumber)) {
        setStatus('Round has started! Scan or input competitor QR ticket.');
      }
    });

    connection.on('ResultsLocked', (payload: any) => {
      if (payload.eventId === selectedEventId && payload.roundNumber === Number(roundNumber)) {
        setStatus('Round results locked. No more submissions permitted.');
        setVerifiedCompetitor(null);
      }
    });

    connection.on('RoundCompleted', (payload: any) => {
      if (payload.eventId === selectedEventId && payload.roundNumber === Number(roundNumber)) {
        setStatus('Round completed. Lane is now inactive.');
        setVerifiedCompetitor(null);
      }
    });

    connection.onreconnecting((error) => {
      setIsHubConnected(false);
      setHubStatus('Reconnecting...');
      console.warn('SignalR reconnecting:', error);
    });

    connection.onreconnected(() => {
      setIsHubConnected(true);
      setHubStatus('Connected');
      connection.invoke('RegisterJudgeStation', selectedEventId, Number(roundNumber), Number(stationNumber))
        .catch(console.error);
    });

    connection.onclose(() => {
      setIsHubConnected(false);
      setHubStatus('Disconnected');
    });

    try {
      setHubStatus('Connecting...');
      await connection.start();
      setHubConnection(connection);
      setIsHubConnected(true);
      setHubStatus('Connected');
      
      await connection.invoke('RegisterJudgeStation', selectedEventId, Number(roundNumber), Number(stationNumber));
      setStatus(`Lane ready. Registered at Station ${stationNumber}. Waiting for competitor scan.`);
    } catch (err: any) {
      setHubStatus('Disconnected');
      setIsHubConnected(false);
      setStatus(`SignalR Connection failed. ${err?.message || err}`);
    }
  };

  // Emit station state to hub helper
  const emitStationState = async (state: string, competitorName: string | null = null) => {
    if (hubConnection && isHubConnected) {
      try {
        await hubConnection.invoke('UpdateStationState', selectedEventId, Number(roundNumber), Number(stationNumber), state, competitorName);
      } catch (err) {
        console.error('Failed to emit station state:', err);
      }
    }
  };

  // ─── Verification & Score Logic ─────────────────────────────
  const executeVerification = async (customQr?: string) => {
    const qrToVerify = customQr || playerQr;
    if (!qrToVerify.trim()) {
      setStatus('Please enter or scan a competitor QR code.');
      return;
    }
    if (!selectedEventId || !roundNumber || !stationNumber) {
      setStatus('Setup incomplete: Please ensure Tournament, Event, Round, and Station are set.');
      return;
    }

    setIsVerifying(true);
    setStatus('Verifying competitor details...');
    setResultSummary(null);

    try {
      const res = await verifyJudgeStation({
        qrToken: qrToVerify.trim(),
        eventId: selectedEventId,
        roundNumber: Number(roundNumber),
        stationNumber: Number(stationNumber)
      });

      if (res.success && res.groupCompetitorId) {
        setVerifiedCompetitor(res);
        setStatus(`Verified: ${res.eventName} • Group ${res.groupName} • Ready for attempt.`);
        
        await fetchProgress(res.groupCompetitorId);
        await emitStationState('VERIFIED', res.groupName ? `${res.groupName}` : 'Competitor');
      } else {
        setVerifiedCompetitor(null);
        setStatus(`Verification failed: ${res.message || 'Competitor not assigned or check-in pending.'}`);
      }
    } catch (err: any) {
      setVerifiedCompetitor(null);
      setStatus(`Verification error: ${err.message || err}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const verifyCompetitor = () => executeVerification();

  const fetchProgress = async (groupCompetitorId: string) => {
    try {
      const prog = await getSolveProgress(groupCompetitorId);
      setSolveProgress(prog);
      
      // Initialize medley input structure if medley event format
      if (activeEvent?.eventFormatCode === 'MEDLEY' && activeEvent.medleyPuzzles) {
        const solvesList: MedleySolveState[] = activeEvent.medleyPuzzles.map((p) => ({
          medleyPuzzleId: p.id,
          puzzleName: p.puzzleTypeName,
          scrambleId: '',
          scrambleSequence: 'Scramble sequence loaded dynamically',
          time: '',
          penalty: 'None'
        }));
        setMedleySolves(solvesList);
      }
    } catch (err) {
      console.warn('Failed to load solve progress:', err);
    }
  };

  const resetLane = () => {
    setVerifiedCompetitor(null);
    setSolveProgress(null);
    setStackmat('');
    setPenalty('None');
    setSignature('');
    setHasSignature(false);
    setResultSummary(null);
    setMedleySolves([]);
    if (canvasRef.current) {
      const context = canvasRef.current.getContext('2d');
      if (context) {
        context.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
      }
    }
  };

  // Traditional Adjusted Time display
  const finalTime = useMemo(() => {
    if (penalty === 'DNF') return 'DNF';
    const parsed = Number.parseFloat(stackmat || '0');
    if (Number.isNaN(parsed) || parsed <= 0) return '0.00s';
    const adjusted = penalty === '+2' ? parsed + 2 : parsed;
    return `${adjusted.toFixed(2)}s`;
  }, [penalty, stackmat]);

  // Medley Combined Time display
  const medleyResult = useMemo(() => {
    if (medleySolves.some((s) => s.penalty === 'DNF')) return 'DNF';
    const total = medleySolves.reduce((sum, s) => {
      const p = Number.parseFloat(s.time || '0');
      const pen = s.penalty === '+2' ? 2 : 0;
      return sum + (Number.isNaN(p) ? 0 : p + pen);
    }, 0);
    return `${total.toFixed(2)}s`;
  }, [medleySolves]);

  const submitResult = async () => {
    if (!verifiedCompetitor || !verifiedCompetitor.groupCompetitorId || !solveProgress) {
      setResultSummary('Error: No active competitor verification found.');
      return;
    }

    // Get Signature data
    let esig = signature.trim();
    if (canvasRef.current && hasSignature) {
      esig = canvasRef.current.toDataURL('image/png');
    }

    if (!esig) {
      setResultSummary('Error: Competitor signature/initials required.');
      return;
    }

    setIsSubmitting(true);
    setResultSummary(null);
    await emitStationState('SUBMITTING', verifiedCompetitor.groupName);

    try {
      if (activeEvent?.eventFormatCode === 'MEDLEY') {
        const detailsPayload = medleySolves.map(s => {
          const pType = penaltyTypes.find(pt => pt.code === (s.penalty === '+2' ? 'PLUS_2' : s.penalty === 'DNF' ? 'DNF' : 'OK'));
          return {
            medleyPuzzleId: s.medleyPuzzleId,
            rawTimeMs: Number.parseFloat(s.time) * 1000,
            penaltyTypeId: pType?.id || null,
            scrambleId: s.scrambleId || '00000000-0000-0000-0000-000000000000'
          };
        });

        await submitMedleyResult({
          groupCompetitorId: verifiedCompetitor.groupCompetitorId,
          solveNumber: solveProgress.nextSolveNumber || 1,
          esignatureData: esig,
          details: detailsPayload
        });

        setResultSummary(`Success: Submitted Medley attempt of ${medleyResult}.`);
        await emitStationState('DONE');
        resetLane();
      } else {
        const pType = penaltyTypes.find(pt => pt.code === (penalty === '+2' ? 'PLUS_2' : penalty === 'DNF' ? 'DNF' : 'OK'));
        const scrambleId = verifiedCompetitor.currentScramble?.scrambleId || solveProgress.currentScramble?.scrambleId;

        if (!scrambleId) {
          throw new Error('Scramble reference is missing. Please scan competitor again.');
        }

        const rawTimeMs = penalty === 'DNF' ? 0 : Math.round(Number.parseFloat(stackmat) * 1000);

        const res = await submitTraditionalResult({
          groupCompetitorId: verifiedCompetitor.groupCompetitorId,
          solveNumber: solveProgress.nextSolveNumber || 1,
          rawTimeMs,
          penaltyTypeId: pType?.id || null,
          scrambleId,
          esignatureData: esig
        });

        const displayTime = res.isDnf ? 'DNF' : `${((res.finalTimeMs || 0) / 1000).toFixed(2)}s`;
        setResultSummary(`Success: Submitted Solve ${solveProgress.nextSolveNumber} with time ${displayTime}.`);
        
        // Load next solve info or reset if complete
        if (res.progress && res.progress.canSubmitNext && res.nextScramble) {
          setVerifiedCompetitor(prev => prev ? {
            ...prev,
            nextSolveNumber: res.progress?.nextSolveNumber || undefined,
            currentScramble: res.nextScramble || undefined
          } : null);
          
          await fetchProgress(verifiedCompetitor.groupCompetitorId);
          setStackmat('');
          setPenalty('None');
          setSignature('');
          setHasSignature(false);
          if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          await emitStationState('VERIFIED', verifiedCompetitor.groupName);
        } else {
          setResultSummary(`Success: Completed all ${solveProgress.solveCount} solves for this round!`);
          await emitStationState('DONE');
          resetLane();
        }
      }
    } catch (err: any) {
      setResultSummary(`Error submitting score: ${err.message || err}`);
      await emitStationState('VERIFIED', verifiedCompetitor.groupName);
    } finally {
      setIsSubmitting(false);
    }
  };

  const updateMedleySolve = (index: number, field: keyof MedleySolveState, value: string) => {
    setMedleySolves((cur) => cur.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  // ─── Drawing Pad Handlers ────────────────────────────────────
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = '#f59e0b'; // Premium Gold/Orange line
    ctx.lineWidth = 3;
    ctx.lineCap = 'round';
    
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
    setHasSignature(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing || !canvasRef.current) return;
    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearCanvas = () => {
    if (!canvasRef.current) return;
    const ctx = canvasRef.current.getContext('2d');
    ctx?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
    setSignature('');
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-20 surface-gradient noise-overlay relative">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 relative z-10">
        
        {/* Banner Section */}
        <Card className="glass-card border border-border/80 p-8 rounded-3xl relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.72_0.21_42_/_0.08),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-2">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary flex items-center gap-1.5 animate-pulse-glow">
                  <ShieldCheck className="h-4 w-4" /> JUDGING LANE ACTIVE
                </span>
                <span className="text-muted-foreground text-xs font-semibold flex items-center gap-1">
                  <span className="live-dot" /> Live SignalR
                </span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
                JUDGE STATION
              </h1>
              <p className="text-muted-foreground max-w-2xl text-xs sm:text-sm leading-relaxed">
                Connect your lane directly to the backend to get dynamic WCA scrambles, report live solving status, and upload e-signatures.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2 shrink-0">
              <div className={`flex items-center gap-2 rounded-xl border px-3 py-1.5 text-xs font-bold ${
                isHubConnected ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/8' : 'text-muted-foreground border-border bg-card'
              }`}>
                {isHubConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                <span className="uppercase">{hubStatus}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration Setup Lane */}
        <Card className="p-6 border border-border/60 bg-card/60 backdrop-blur-md rounded-2xl space-y-6 shadow-xl">
          <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="h-4.5 w-4.5" /> 0. Setup Judge Lane Connection
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Tournament</label>
              <select 
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-semibold"
              >
                <option value="">Select Tournament</option>
                {tournaments.map(t => (
                  <option key={t.id} value={t.id}>{t.name}</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Event Format</label>
              <select
                value={selectedEventId}
                onChange={(e) => setSelectedEventId(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-semibold"
              >
                <option value="">Select Event</option>
                {activeTournament?.events.map(e => (
                  <option key={e.id} value={e.id}>{e.puzzleTypeName} ({e.eventFormatCode})</option>
                ))}
              </select>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Round Number</label>
              <input 
                type="number"
                min="1"
                value={roundNumber}
                onChange={(e) => setRoundNumber(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono font-semibold"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Station Number</label>
              <input 
                type="number"
                min="1"
                value={stationNumber}
                onChange={(e) => setStationNumber(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono font-semibold"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={connectHub}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground font-extrabold rounded-xl py-2 text-xs border-none transition-all shadow-lg shadow-primary/20"
              >
                REGISTER STATION
              </Button>
            </div>
          </div>
        </Card>

        {/* Lane Operations Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1: Verification */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="h-4 w-4" /> 1. Verify Competitor
              </h3>

              {/* Camera Scanner View */}
              <div className="space-y-3 pt-2">
                <div className="flex items-center justify-between">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Camera QR Scanner</label>
                  <Button
                    onClick={isScanning ? stopCameraScanning : startCameraScanning}
                    disabled={!isHubConnected}
                    variant={isScanning ? "destructive" : "outline"}
                    className="text-[10px] h-7 px-3 rounded-lg font-bold border-none"
                    style={!isScanning ? { background: 'oklch(0.72 0.21 42 / 0.12)', color: 'oklch(0.72 0.21 42)' } : {}}
                  >
                    {isScanning ? 'STOP CAMERA' : 'START CAMERA SCAN'}
                  </Button>
                </div>

                {isScanning && (
                  <div className="relative border border-border bg-black/60 rounded-xl overflow-hidden p-2">
                    <div id="reader" className="w-full aspect-square max-w-[260px] mx-auto rounded-lg overflow-hidden" />
                    <p className="text-[9px] text-center text-muted-foreground mt-1.5 uppercase font-bold tracking-wider">
                      Align competitor's QR code in frame
                    </p>
                  </div>
                )}

                {scanError && (
                  <p className="text-[10px] text-red-400 font-bold leading-normal bg-red-500/5 border border-red-500/10 p-2 rounded-lg">
                    {scanError}
                  </p>
                )}

                <div className="space-y-1.5 pt-1.5 border-t border-border/40">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Fallback QR Code Input</label>
                  <div className="flex gap-2">
                    <input 
                      value={playerQr} 
                      onChange={(e) => setPlayerQr(e.target.value)} 
                      placeholder="Paste JSON QR ticket"
                      className="flex-1 rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary font-mono text-[10px]" 
                    />
                    <Button 
                      onClick={verifyCompetitor} 
                      disabled={isVerifying || !isHubConnected}
                      className="bg-primary hover:opacity-90 text-primary-foreground font-extrabold rounded-xl text-xs px-4 border-none transition-all"
                    >
                      {isVerifying ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'VERIFY'}
                    </Button>
                  </div>
                </div>
              </div>

              {/* Dev Simulation Desk */}
              {isDev && stationCompetitors.length > 0 && (
                <div className="rounded-xl border border-dashed border-primary/20 bg-primary/5 p-3.5 space-y-2.5 animate-fade-in">
                  <div className="flex items-center justify-between pb-1 border-b border-primary/10">
                    <span className="text-[9px] font-black text-primary uppercase tracking-widest">
                      [Dev Mode] Simulation Desk
                    </span>
                    <span className="text-[8px] px-1.5 py-0.5 rounded bg-primary/10 text-primary font-bold">
                      Station {stationNumber}
                    </span>
                  </div>
                  <div className="space-y-1.5 max-h-[120px] overflow-y-auto pr-1">
                    {stationCompetitors.map((c) => (
                      <div key={c.groupCompetitorId} className="flex items-center justify-between text-[10px] bg-card p-2 rounded-lg border border-border/40">
                        <div className="min-w-0">
                          <p className="font-extrabold text-foreground truncate">{c.competitorName}</p>
                          <p className="text-[8px] text-muted-foreground">{c.groupName} • Status: {c.competitorStatus}</p>
                        </div>
                        <Button
                          onClick={async () => {
                            setPlayerQr(c.qrToken);
                            await executeVerification(c.qrToken);
                          }}
                          disabled={isVerifying}
                          className="h-6 text-[9px] px-2 rounded-md font-bold border-none"
                          style={{ background: 'oklch(0.72 0.21 42)', color: '#fff' }}
                        >
                          Simulate Scan
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {verifiedCompetitor && (
                <div className="rounded-xl border border-border/80 bg-muted/10 p-4 space-y-2 text-xs leading-relaxed animate-fade-in">
                  <div className="flex justify-between items-center pb-1.5 border-b border-border/40">
                    <span className="text-muted-foreground uppercase font-bold text-[9px]">Competitor Name</span>
                    <span className="font-black text-foreground">{verifiedCompetitor.groupName || 'Competitor'}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase font-bold text-[9px]">Round / Group</span>
                    <span className="font-extrabold text-foreground">R{verifiedCompetitor.roundNumber} / {verifiedCompetitor.groupName}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-muted-foreground uppercase font-bold text-[9px]">Solve Index</span>
                    <span className="font-black text-primary">Solve {verifiedCompetitor.nextSolveNumber} of {verifiedCompetitor.solveCount}</span>
                  </div>
                  {verifiedCompetitor.currentScramble && (
                    <div className="pt-2.5 border-t border-border/60">
                      <ScrambleDisplay 
                        sequence={verifiedCompetitor.currentScramble.sequence} 
                        solveNumber={verifiedCompetitor.nextSolveNumber ?? undefined} 
                        compact 
                      />
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3 pt-4">
              <div className="rounded-xl border border-border/80 bg-muted/5 p-3.5 text-[11px] text-muted-foreground leading-relaxed min-h-[50px] flex items-center gap-2">
                <Info className="h-4 w-4 text-primary shrink-0" />
                <span>{status}</span>
              </div>
            </div>
          </Card>

          {/* Card 2: Solve Time Inputs */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="h-4 w-4" /> 2. Stackmat Solve
              </h3>
              
              {activeEvent?.eventFormatCode !== 'MEDLEY' ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Timer Duration (Seconds)</label>
                    <input 
                      value={stackmat} 
                      onChange={(e) => setStackmat(e.target.value)} 
                      disabled={!verifiedCompetitor}
                      placeholder="e.g. 10.42"
                      className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary font-mono font-bold" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">WCA Penalty Adjustments</label>
                    <select 
                      value={penalty} 
                      onChange={(e) => setPenalty(e.target.value as PenaltyMode)} 
                      disabled={!verifiedCompetitor}
                      className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary font-semibold"
                    >
                      <option value="None">None (Clean Solve)</option>
                      <option value="+2">+2 Seconds Penalty</option>
                      <option value="DNF">Did Not Finish (DNF)</option>
                    </select>
                  </div>
                  
                  {verifiedCompetitor && (
                    <div className="flex gap-2 pt-2">
                      <Button 
                        onClick={() => emitStationState('INSPECTING', verifiedCompetitor.groupName)}
                        variant="outline"
                        className="flex-1 text-[10px] py-1 border-primary/30 text-primary hover:bg-primary/10 font-bold"
                      >
                        SIMULATE INSPECT
                      </Button>
                      <Button 
                        onClick={() => emitStationState('SOLVING', verifiedCompetitor.groupName)}
                        variant="outline"
                        className="flex-1 text-[10px] py-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                      >
                        SIMULATE SOLVING
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-primary/5 border border-primary/25 p-4 text-xs text-muted-foreground leading-relaxed">
                  Medley Relay active. Use the special Medley Panel below to enter solve values for each puzzle type.
                </div>
              )}
            </div>

            {activeEvent?.eventFormatCode !== 'MEDLEY' && (
              <div className="rounded-xl border border-border/60 p-4 bg-muted/5 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Adjusted Solved Time</p>
                <p className="mt-1 text-3xl font-black text-primary time-display">{finalTime}</p>
              </div>
            )}
          </Card>

          {/* Card 3: Signatures and submission */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-primary/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Signature className="h-4 w-4" /> 3. Player Auths
              </h3>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Competitor E-Signature</label>
                  <button 
                    onClick={clearCanvas} 
                    className="text-[10px] font-extrabold text-primary uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Clear
                  </button>
                </div>
                
                {/* Signature canvas board */}
                <div className="relative border border-border bg-black/40 rounded-xl overflow-hidden h-[120px] transition-all focus-within:border-primary">
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair block"
                    width={350}
                    height={120}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-40">
                      <Signature className="h-5 w-5 text-muted-foreground mb-1 animate-pulse" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Sign within this box</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Or Type Initials (Fallback)</label>
                  <input 
                    value={signature} 
                    onChange={(e) => setSignature(e.target.value)} 
                    placeholder="Enter competitor initials" 
                    className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary font-bold" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={submitResult}
                disabled={isSubmitting || !verifiedCompetitor}
                className="w-full bg-primary hover:opacity-90 text-primary-foreground font-extrabold rounded-xl py-5 text-xs border-none shadow-lg shadow-primary/10 transition-all"
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {isSubmitting ? 'SUBMITTING ATTEMPT...' : 'SUBMIT ATTEMPT RESULT'}
              </Button>
              {resultSummary && (
                <div className={`rounded-xl border p-3.5 text-[11px] font-bold leading-relaxed flex items-start gap-2 ${
                  resultSummary.includes('Success') 
                    ? 'border-emerald-500/20 bg-emerald-500/8 text-emerald-400' 
                    : 'border-rose-500/20 bg-rose-500/8 text-rose-400'
                }`}>
                  {resultSummary.includes('Success') ? (
                    <CheckCircle className="h-4 w-4 shrink-0 mt-0.5 text-emerald-400" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                  )}
                  <span>{resultSummary}</span>
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Medley panel section (displayed when Medley tournament loaded) */}
        {activeEvent?.eventFormatCode === 'MEDLEY' && verifiedCompetitor && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] animate-fade-in">
            <Card className="p-6 border border-border/60 bg-card rounded-2xl space-y-4 hover:border-primary/20 transition-all duration-300">
              <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5" /> Medley Puzzles Lane Setup
              </h3>
              
              <div className="space-y-3">
                {medleySolves.map((s, i) => (
                  <div key={s.medleyPuzzleId} className="grid gap-3 sm:grid-cols-[1fr_140px_140px] items-center rounded-xl border border-border bg-muted/10 p-3 hover:border-primary/20 transition-all">
                    <div>
                      <p className="text-xs font-black text-foreground">{s.puzzleName}</p>
                    </div>
                    <input 
                      value={s.time} 
                      placeholder="Time in seconds"
                      onChange={(e) => updateMedleySolve(i, 'time', e.target.value)} 
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono font-bold" 
                    />
                    <select 
                      value={s.penalty} 
                      onChange={(e) => updateMedleySolve(i, 'penalty', e.target.value as PenaltyMode)} 
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-semibold"
                    >
                      <option value="None">None</option>
                      <option value="+2">+2s</option>
                      <option value="DNF">DNF</option>
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm hover:border-primary/20 transition-all duration-300">
              <div className="space-y-4">
                <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider">
                  Medley Combined Stats
                </h3>
                <div className="mt-4 rounded-xl bg-primary/5 border border-primary/25 p-4 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Computed Total Duration</p>
                  <p className="mt-1.5 text-3xl font-black text-primary time-display">{medleyResult}</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-border/80 bg-muted/5 p-3.5 text-[10px] text-muted-foreground leading-relaxed mt-4 flex items-start gap-1.5">
                <HelpCircle className="h-4 w-4 text-primary shrink-0" />
                <span>Confirm each puzzle duration has been typed accurately. Total updates dynamically in real-time.</span>
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
