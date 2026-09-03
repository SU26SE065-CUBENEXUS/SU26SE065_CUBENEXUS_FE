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

  // Evidence photo state
  const [evidencePhoto, setEvidencePhoto] = useState<string | null>(null); // base64 data URL
  const evidenceInputRef = useRef<HTMLInputElement | null>(null);

  const handleEvidencePhotoChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      setEvidencePhoto(ev.target?.result as string);
    };
    reader.readAsDataURL(file);
  };

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
    setEvidencePhoto(null);
    if (evidenceInputRef.current) evidenceInputRef.current.value = '';
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
        // Sub-puzzles come from activeEvent — ScrambleInfoDto does not carry medleyPuzzles
        const subPuzzles: any[] = (activeEvent.medleyPuzzles && activeEvent.medleyPuzzles.length > 0)
          ? activeEvent.medleyPuzzles
          : [];

        const rawTimeMs = penalty === 'DNF' ? 0 : Math.round(Number.parseFloat(stackmat) * 1000);
        const pType = penaltyTypes.find(pt => pt.code === (penalty === '+2' ? 'PLUS_2' : penalty === 'DNF' ? 'DNF' : 'OK'));

        // currentScramble is typed as ScrambleInfoDto which doesn't have subScrambles;
        // cast to any to allow dynamic fields that the API may return
        const currentScrAny = verifiedCompetitor.currentScramble as any;

        const detailsPayload = (subPuzzles.length > 0 ? subPuzzles : [{ id: '00000000-0000-0000-0000-000000000000' }]).map((p: any, idx: number) => {
          const matchingScramble = currentScrAny?.subScrambles?.find(
            (s: any) => s.puzzleTypeId === p.puzzleTypeId
          );
          const scrambleId = matchingScramble?.scrambleId
            || currentScrAny?.scrambleId
            || '00000000-0000-0000-0000-000000000000';

          return {
            medleyPuzzleId: p.id || p.medleyPuzzleId || '00000000-0000-0000-0000-000000000000',
            rawTimeMs: idx === 0 ? rawTimeMs : 0,
            penaltyTypeId: idx === 0 ? (pType?.id || null) : null,
            scrambleId
          };
        });

        await submitMedleyResult({
          groupCompetitorId: verifiedCompetitor.groupCompetitorId,
          solveNumber: solveProgress.nextSolveNumber || 1,
          esignatureData: esig,
          evidencePhotoData: evidencePhoto,
          details: detailsPayload
        });

        const displayTime = penalty === 'DNF' ? 'DNF' : `${finalTime}`;
        setResultSummary(`✓ Đã lưu Medley lượt ${solveProgress.nextSolveNumber} — Thời gian: ${displayTime}.`);

        // Reload progress to check for next solve (multi-solve Medley like Traditional)
        const freshProgress = await getSolveProgress(verifiedCompetitor.groupCompetitorId);
        setSolveProgress(freshProgress);

        if (freshProgress.canSubmit && freshProgress.nextSolveNumber) {
          // More solves remaining — stay on competitor, advance to next solve
          setVerifiedCompetitor(prev => prev ? {
            ...prev,
            nextSolveNumber: freshProgress.nextSolveNumber ?? undefined,
            currentScramble: freshProgress.currentScramble as any ?? prev.currentScramble
          } : null);
          // Reset inputs for next attempt
          setStackmat('');
          setPenalty('None');
          setSignature('');
          setHasSignature(false);
          setEvidencePhoto(null);
          if (evidenceInputRef.current) evidenceInputRef.current.value = '';
          if (canvasRef.current) {
            const context = canvasRef.current.getContext('2d');
            context?.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
          }
          await emitStationState('VERIFIED', verifiedCompetitor.groupName);
        } else {
          // All solves complete
          if (freshProgress.isCutoffReached) {
            setResultSummary('Thí sinh dừng thi do không đạt mốc Cutoff Time. Phần thi hoàn tất.');
          } else {
            setResultSummary(`✓ Đã hoàn tất tất cả ${solveProgress.solveCount} lượt thi Medley!`);
          }
          await emitStationState('DONE');
          resetLane();
        }
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
          esignatureData: esig,
          evidencePhotoData: evidencePhoto
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
          if (res.progress?.isCutoffReached) {
            setResultSummary(`Thí sinh dừng thi do không đạt mốc Cutoff Time. Phần thi hoàn tất.`);
          } else {
            setResultSummary(`Success: Completed all ${solveProgress.solveCount} solves for this round!`);
          }
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

          {/* Card 2: Solve Time + Evidence Photo */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col gap-5 shadow-sm hover:border-primary/20 transition-all duration-300">
            {/* ── Step 1: Enter Time + Penalty ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: 'oklch(0.72 0.21 42)', color: '#fff' }}>1</div>
                <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Timer className="h-4 w-4" /> Nhập Kết Quả
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                {activeEvent?.eventFormatCode === 'MEDLEY' && (
                  <div className="rounded-xl bg-amber-500/10 border border-amber-500/30 p-2.5 text-xs text-amber-500 font-semibold flex items-center gap-1.5">
                    <span>⚡ Hạng mục Medley: Chỉ cần nhập 1 TỔNG THỜI GIAN duy nhất cho toàn bộ các khối.</span>
                  </div>
                )}

                {activeEvent?.eventFormatCode === 'MEDLEY' && solveProgress && (
                  <div className="rounded-xl border p-3 flex items-center justify-between"
                    style={{ background: 'oklch(0.72 0.21 42 / 0.08)', borderColor: 'oklch(0.72 0.21 42 / 0.25)' }}>
                    <div className="space-y-1 flex-1">
                      <p className="text-[9px] font-black uppercase tracking-widest" style={{ color: 'oklch(0.72 0.21 42)' }}>
                        Tiến Trình Medley
                      </p>
                      <p className="text-sm font-black" style={{ color: 'oklch(0.72 0.21 42)' }}>
                        Lượt {solveProgress.nextSolveNumber ?? (solveProgress.submittedCount + 1)} / {solveProgress.solveCount}
                      </p>
                      <div className="flex gap-1 mt-1">
                        {Array.from({ length: solveProgress.solveCount }).map((_, i) => (
                          <div key={i} className="h-1.5 flex-1 rounded-full transition-all"
                            style={{
                              background: i < solveProgress.submittedCount
                                ? 'oklch(0.70 0.19 145)'
                                : i === solveProgress.submittedCount
                                  ? 'oklch(0.72 0.21 42)'
                                  : 'oklch(0.24 0.02 256)'
                            }} />
                        ))}
                      </div>
                    </div>
                    <div className="ml-3 text-right">
                      <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground">Đã hoàn tất</p>
                      <p className="text-xl font-black" style={{ color: 'oklch(0.70 0.19 145)' }}>{solveProgress.submittedCount}</p>
                    </div>
                  </div>
                )}

                {/* Time input row */}
                <div className="flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">
                      {activeEvent?.eventFormatCode === 'MEDLEY' ? 'Tổng Thời Gian Medley (giây)' : 'Thời Gian (giây)'}
                    </label>
                    <input
                      value={stackmat}
                      onChange={(e) => setStackmat(e.target.value.replace(/,/g, '.'))}
                      disabled={!verifiedCompetitor}
                      placeholder="Vd: 45.20"
                      className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary font-mono font-bold"
                    />
                  </div>
                  {/* Quick penalty buttons */}
                  <div className="flex gap-1 pb-0.5">
                    {(['None', '+2', 'DNF'] as PenaltyMode[]).map((p) => (
                      <button
                        key={p}
                        disabled={!verifiedCompetitor}
                        onClick={() => setPenalty(p)}
                        className="px-3 py-2.5 rounded-xl text-[11px] font-black uppercase transition-all border"
                        style={penalty === p ? {
                          background: p === 'DNF' ? 'oklch(0.55 0.22 25)' : p === '+2' ? 'oklch(0.72 0.21 42)' : 'oklch(0.70 0.19 145)',
                          borderColor: 'transparent',
                          color: '#fff',
                          boxShadow: '0 0 12px currentColor'
                        } : {
                          background: 'oklch(0.15 0.018 255)',
                          borderColor: 'oklch(0.24 0.02 256)',
                          color: 'oklch(0.55 0.02 256)'
                        }}
                      >
                        {p === 'None' ? 'OK' : p}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Live result display */}
                <div className="rounded-2xl p-4 text-center relative overflow-hidden"
                  style={{
                    background: penalty === 'DNF' ? 'oklch(0.55 0.22 25 / 0.1)' : 'oklch(0.70 0.19 145 / 0.06)',
                    border: `1px solid ${penalty === 'DNF' ? 'oklch(0.55 0.22 25 / 0.35)' : 'oklch(0.70 0.19 145 / 0.25)'}`
                  }}
                >
                  <p className="text-[9px] font-black uppercase tracking-widest text-muted-foreground mb-1">Kết Quả Sau Penalty</p>
                  <p className="text-5xl font-black leading-none time-display"
                    style={{ color: penalty === 'DNF' ? 'oklch(0.65 0.22 25)' : 'oklch(0.70 0.19 145)', textShadow: '0 0 30px currentColor' }}
                  >
                    {finalTime}
                  </p>
                  {penalty !== 'None' && penalty !== 'DNF' && (
                    <p className="text-[10px] text-muted-foreground mt-1">{stackmat || '0'}s + 2s penalty = <strong>{finalTime}</strong></p>
                  )}
                </div>

                {verifiedCompetitor && (
                  <div className="flex gap-2">
                    <Button
                      onClick={() => emitStationState('INSPECTING', verifiedCompetitor.groupName)}
                      variant="outline"
                      className="flex-1 text-[10px] py-1 border-primary/30 text-primary hover:bg-primary/10 font-bold"
                    >
                      INSPECT
                    </Button>
                    <Button
                      onClick={() => emitStationState('SOLVING', verifiedCompetitor.groupName)}
                      variant="outline"
                      className="flex-1 text-[10px] py-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10 font-bold"
                    >
                      SOLVING
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* ── Step 2: Evidence Photo ── */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: 'oklch(0.62 0.19 265)', color: '#fff' }}>2</div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: 'oklch(0.72 0.19 265)' }}>
                  Đính Kèm Ảnh Bằng Chứng
                </h3>
              </div>

              <input
                ref={evidenceInputRef}
                type="file"
                accept="image/*"
                capture="environment"
                className="hidden"
                onChange={handleEvidencePhotoChange}
              />

              {!evidencePhoto ? (
                <button
                  disabled={!verifiedCompetitor}
                  onClick={() => evidenceInputRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed py-5 text-xs font-bold transition-all"
                  style={{
                    borderColor: verifiedCompetitor ? 'oklch(0.62 0.19 265 / 0.5)' : 'oklch(0.24 0.02 256)',
                    color: verifiedCompetitor ? 'oklch(0.72 0.19 265)' : 'oklch(0.45 0.02 256)',
                    background: verifiedCompetitor ? 'oklch(0.62 0.19 265 / 0.05)' : 'transparent'
                  }}
                >
                  <span className="text-xl">📷</span>
                  <span>Chụp hoặc chọn ảnh bằng chứng</span>
                  <span className="text-[10px] font-normal text-muted-foreground">Camera · Thư viện ảnh</span>
                </button>
              ) : (
                <div className="relative rounded-xl overflow-hidden border" style={{ borderColor: 'oklch(0.62 0.19 265 / 0.4)' }}>
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={evidencePhoto} alt="Evidence" className="w-full max-h-36 object-cover" />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent" />
                  <div className="absolute bottom-2 left-2 right-2 flex items-center justify-between">
                    <span className="text-[10px] text-white font-bold">✓ Ảnh đã đính kèm</span>
                    <button
                      onClick={() => { setEvidencePhoto(null); if (evidenceInputRef.current) evidenceInputRef.current.value = ''; }}
                      className="text-[10px] text-white/80 hover:text-white font-bold px-2 py-0.5 rounded bg-black/40"
                    >
                      Xóa
                    </button>
                  </div>
                </div>
              )}
            </div>
          </Card>

          {/* Card 3: Step 3 – Signature + Step 4 – Submit */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col gap-5 shadow-sm hover:border-primary/20 transition-all duration-300">

            {/* ── Step 3: Player Signature ── */}
            <div className="space-y-3">
              <div className="flex items-center gap-2 pb-2 border-b border-border/40">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: 'oklch(0.72 0.21 42)', color: '#fff' }}>3</div>
                <h3 className="font-extrabold text-xs text-primary uppercase tracking-wider flex items-center gap-1.5">
                  <Signature className="h-4 w-4" /> Player Ký Xác Nhận
                </h3>
              </div>

              <div className="space-y-3 pt-1">
                <div className="flex justify-between items-center">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Chữ Ký Điện Tử</label>
                  <button
                    onClick={clearCanvas}
                    className="text-[10px] font-extrabold text-primary uppercase tracking-wider hover:underline flex items-center gap-1"
                  >
                    <RotateCcw className="h-3 w-3" /> Xóa
                  </button>
                </div>

                {/* Signature canvas */}
                <div className="relative border-2 bg-black/40 rounded-xl overflow-hidden h-[130px] transition-all"
                  style={{ borderColor: hasSignature ? 'oklch(0.72 0.21 42 / 0.6)' : 'oklch(0.24 0.02 256)' }}
                >
                  <canvas
                    ref={canvasRef}
                    onMouseDown={startDrawing}
                    onMouseMove={draw}
                    onMouseUp={stopDrawing}
                    onMouseLeave={stopDrawing}
                    onTouchStart={startDrawing}
                    onTouchMove={draw}
                    onTouchEnd={stopDrawing}
                    className="w-full h-full cursor-crosshair block touch-none"
                    width={350}
                    height={130}
                  />
                  {!hasSignature && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none opacity-35">
                      <Signature className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">Player ký vào đây</span>
                    </div>
                  )}
                  {hasSignature && (
                    <div className="absolute top-1.5 right-1.5 px-1.5 py-0.5 rounded text-[9px] font-black"
                      style={{ background: 'oklch(0.72 0.21 42 / 0.15)', color: 'oklch(0.72 0.21 42)' }}
                    >
                      ✓ Đã ký
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Hoặc gõ tên viết tắt (Dự phòng)</label>
                  <input
                    value={signature}
                    onChange={(e) => setSignature(e.target.value)}
                    placeholder="Nhập chữ viết tắt"
                    className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary font-bold"
                  />
                </div>
              </div>
            </div>

            {/* ── Step 4: Submit ── */}
            <div className="space-y-3 pt-3 border-t border-border/40">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-black"
                  style={{ background: 'oklch(0.70 0.19 145)', color: '#fff' }}>4</div>
                <h3 className="font-extrabold text-xs uppercase tracking-wider" style={{ color: 'oklch(0.70 0.19 145)' }}>
                  Lưu Kết Quả
                </h3>
              </div>

              {/* Checklist summary before submit */}
              <div className="rounded-xl p-3 space-y-1.5 text-[10px] font-semibold"
                style={{ background: 'oklch(0.155 0.018 255)', border: '1px solid oklch(0.22 0.02 256)' }}
              >
                {[
                  { label: 'Competitor đã xác minh', done: !!verifiedCompetitor },
                  { label: 'Thời gian đã nhập', done: !!stackmat || penalty === 'DNF' || activeEvent?.eventFormatCode === 'MEDLEY' },
                  { label: 'Ảnh bằng chứng', done: !!evidencePhoto, optional: true },
                  { label: 'Player đã ký', done: hasSignature || !!signature.trim() },
                ].map(({ label, done, optional }) => (
                  <div key={label} className="flex items-center gap-2">
                    <span className="text-base leading-none" style={{ color: done ? 'oklch(0.70 0.19 145)' : optional ? 'oklch(0.72 0.21 42 / 0.5)' : 'oklch(0.45 0.02 256)' }}>
                      {done ? '✓' : optional ? '○' : '○'}
                    </span>
                    <span style={{ color: done ? 'oklch(0.75 0.02 256)' : 'oklch(0.45 0.02 256)' }}>
                      {label}{optional && !done ? <span className="text-[9px] ml-1 opacity-60">(tùy chọn)</span> : ''}
                    </span>
                  </div>
                ))}
              </div>

              <Button
                onClick={submitResult}
                disabled={isSubmitting || !verifiedCompetitor}
                className="w-full font-extrabold rounded-xl py-5 text-xs border-none shadow-lg transition-all"
                style={{
                  background: !verifiedCompetitor ? 'oklch(0.24 0.02 256)' : 'oklch(0.70 0.19 145)',
                  color: !verifiedCompetitor ? 'oklch(0.45 0.02 256)' : '#fff',
                  boxShadow: verifiedCompetitor ? '0 4px 20px oklch(0.70 0.19 145 / 0.3)' : 'none'
                }}
              >
                {isSubmitting ? <Loader2 className="h-3.5 w-3.5 animate-spin mr-1.5" /> : null}
                {isSubmitting ? 'ĐANG LƯU KẾT QUẢ...' : '✓ XÁC NHẬN & LƯU KẾT QUẢ'}
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


      </div>
    </main>
  );
}
