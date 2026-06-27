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
  RefreshCw
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
  getSolveProgress
} from '@/lib/api/operations';
import type { 
  TournamentDetailDto, 
  EventDetailDto,
  VerifyJudgeStationResponseDto,
  SolveProgressDto,
  ScrambleInfoDto
} from '@/lib/api/types';

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
  const [status, setStatus] = useState('Please select tournament, event, round, station & click Register Station.');
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifiedCompetitor, setVerifiedCompetitor] = useState<VerifyJudgeStationResponseDto | null>(null);
  const [solveProgress, setSolveProgress] = useState<SolveProgressDto | null>(null);

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
      await hubConnection.stop();
      setHubConnection(null);
      setIsHubConnected(false);
    }

    if (!selectedEventId || !roundNumber || !stationNumber) {
      setStatus('Cannot connect: missing event/round/station setup.');
      return;
    }

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('http://localhost:5212/hubs/tournament')
      .withAutomaticReconnect()
      .build();

    connection.on('ReceiveStationCommand', async (payload: { command: string; data?: any }) => {
      console.log('[Hub Station Command RECEIVED]', payload);
      if (payload.command === 'RELOAD_PROGRESS' && verifiedCompetitor?.groupCompetitorId) {
        await fetchProgress(verifiedCompetitor.groupCompetitorId);
      } else if (payload.command === 'LOCK_STATION') {
        setStatus('Lane locked by tournament administrators.');
        setVerifiedCompetitor(null);
      }
    });

    connection.on('RoundStarted', (payload: any) => {
      if (payload.eventId === selectedEventId && payload.roundNumber === Number(roundNumber)) {
        setStatus('Round started! You can now verify competitors.');
      }
    });

    connection.on('ResultsLocked', (payload: any) => {
      if (payload.eventId === selectedEventId && payload.roundNumber === Number(roundNumber)) {
        setStatus('Results for this round are now LOCKED. No further entries allowed.');
        setVerifiedCompetitor(null);
      }
    });

    connection.on('RoundCompleted', (payload: any) => {
      if (payload.eventId === selectedEventId && payload.roundNumber === Number(roundNumber)) {
        setStatus('Round completed! Lanes are now inactive.');
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
      // Re-register station
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
      
      // Register this connection to station group
      await connection.invoke('RegisterJudgeStation', selectedEventId, Number(roundNumber), Number(stationNumber));
      setStatus(`Ready: Registered at Station ${stationNumber}. Scan QR to begin.`);
    } catch (err: any) {
      setHubStatus('Failed');
      setIsHubConnected(false);
      setStatus(`SignalR connection failed: ${err?.message || err}`);
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
  const verifyCompetitor = async () => {
    if (!playerQr.trim()) {
      setStatus('Please enter or scan a competitor QR code.');
      return;
    }
    if (!selectedEventId || !roundNumber || !stationNumber) {
      setStatus('Please ensure Tournament, Event, Round, and Station are selected.');
      return;
    }

    setIsVerifying(true);
    setStatus('Verifying competitor with backend...');
    setResultSummary(null);

    try {
      const res = await verifyJudgeStation({
        qrToken: playerQr.trim(),
        eventId: selectedEventId,
        roundNumber: Number(roundNumber),
        stationNumber: Number(stationNumber)
      });

      if (res.success && res.groupCompetitorId) {
        setVerifiedCompetitor(res);
        setStatus(`Verified: ${res.eventName} - Group ${res.groupName} - Competitor proceeding.`);
        
        await fetchProgress(res.groupCompetitorId);
        await emitStationState('VERIFIED', res.groupName ? `${res.groupName}` : 'Competitor');
      } else {
        setVerifiedCompetitor(null);
        setStatus(`Verification failed: ${res.message || 'Unknown error'}`);
      }
    } catch (err: any) {
      setVerifiedCompetitor(null);
      setStatus(`Verification error: ${err.message || err}`);
    } finally {
      setIsVerifying(false);
    }
  };

  const fetchProgress = async (groupCompetitorId: string) => {
    try {
      const prog = await getSolveProgress(groupCompetitorId);
      setSolveProgress(prog);
      
      // Initialize medley input structure if medley event format
      if (activeEvent?.eventFormatCode === 'MEDLEY' && activeEvent.medleyPuzzles) {
        // Scrambles order list
        const solvesList: MedleySolveState[] = activeEvent.medleyPuzzles.map((p) => ({
          medleyPuzzleId: p.id,
          puzzleName: p.puzzleTypeName,
          scrambleId: '',
          scrambleSequence: 'Generated at execution',
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
      setResultSummary('Error: Competitor signature is required to submit solve.');
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

        const res = await submitMedleyResult({
          groupCompetitorId: verifiedCompetitor.groupCompetitorId,
          solveNumber: solveProgress.nextSolveNumber || 1,
          esignatureData: esig,
          details: detailsPayload
        });

        setResultSummary(`Success: Submitted Medley attempt of ${medleyResult}. Standing updated.`);
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
        setResultSummary(`Success: Submitted solve ${solveProgress.nextSolveNumber} with time ${displayTime}.`);
        
        // Load next solve info or reset if complete
        if (res.progress && res.progress.canSubmitNext && res.nextScramble) {
          // Update competitor parameters for next attempt
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

    ctx.strokeStyle = '#FFFFFF';
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
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Banner Section */}
        <Card className="border border-border bg-card p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> JUDGING LANE ACTIVE
                </span>
                <span className="text-muted-foreground text-xs font-medium">• Live SignalR Connected</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
                JUDGE STATION
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
                Connect your lane directly to the backend to get dynamic WCA scrambles, report live solving status, and upload e-signatures.
              </p>
            </div>
            
            <div className="flex flex-col items-end gap-2">
              <div className="flex items-center gap-2 rounded-xl bg-muted/20 border border-border px-3 py-1.5">
                {isHubConnected ? (
                  <Wifi className="h-4.5 w-4.5 text-emerald-400" />
                ) : (
                  <WifiOff className="h-4.5 w-4.5 text-rose-400" />
                )}
                <span className="text-xs font-extrabold uppercase">{hubStatus}</span>
              </div>
            </div>
          </div>
        </Card>

        {/* Configuration Setup Lane */}
        <Card className="p-6 border border-border bg-card rounded-2xl space-y-6">
          <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
            <Radio className="h-4.5 w-4.5" /> 0. Setup Judge Lane Connection
          </h3>
          
          <div className="grid gap-4 sm:grid-cols-2 md:grid-cols-5">
            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Tournament</label>
              <select 
                value={selectedTournamentId}
                onChange={(e) => setSelectedTournamentId(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs text-foreground outline-none"
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
                className="w-full rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs text-foreground outline-none"
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
                className="w-full rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs text-foreground outline-none"
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Station Number</label>
              <input 
                type="number"
                min="1"
                value={stationNumber}
                onChange={(e) => setStationNumber(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/25 px-3 py-2 text-xs text-foreground outline-none"
              />
            </div>

            <div className="flex items-end">
              <Button 
                onClick={connectHub}
                className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-xl py-2 text-xs border-none"
              >
                REGISTER STATION
              </Button>
            </div>
          </div>
        </Card>

        {/* Lane Operations Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1: Verification */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="h-4 w-4" /> 1. Verify Competitor
              </h3>
              
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Check-in QR Ticket</label>
                <div className="flex gap-2">
                  <input 
                    value={playerQr} 
                    onChange={(e) => setPlayerQr(e.target.value)} 
                    placeholder="Enter Competitor QR Code"
                    className="flex-1 rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                  />
                  <Button 
                    onClick={verifyCompetitor} 
                    disabled={isVerifying || !isHubConnected}
                    className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-xl text-xs px-4 border-none"
                  >
                    {isVerifying ? 'Wait...' : 'VERIFY'}
                  </Button>
                </div>
              </div>

              {verifiedCompetitor && (
                <div className="rounded-xl border border-border/80 bg-muted/15 p-4 space-y-2 text-xs leading-relaxed animate-in fade-in duration-300">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Competitor ID:</span>
                    <span className="font-extrabold text-right">{verifiedCompetitor.groupCompetitorId?.slice(0, 8)}...</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Round / Group:</span>
                    <span className="font-extrabold text-right">R{verifiedCompetitor.roundNumber} / {verifiedCompetitor.groupName}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground uppercase font-bold text-[10px]">Solve Sequence:</span>
                    <span className="font-extrabold text-[#eab308] text-right">Solve {verifiedCompetitor.nextSolveNumber} / {verifiedCompetitor.solveCount}</span>
                  </div>
                  {verifiedCompetitor.currentScramble && (
                    <div className="pt-2 border-t border-border/60">
                      <span className="text-muted-foreground uppercase font-bold text-[10px] block mb-1">Scramble Sequence:</span>
                      <code className="text-[11px] block font-mono bg-black/35 p-2 rounded-lg text-emerald-300 break-words leading-relaxed select-all">
                        {verifiedCompetitor.currentScramble.sequence}
                      </code>
                    </div>
                  )}
                </div>
              )}
            </div>
            
            <div className="space-y-3 pt-4">
              <div className="rounded-xl border border-border/80 bg-muted/10 p-3.5 text-[11px] text-muted-foreground leading-relaxed min-h-[50px] flex items-center">
                {status}
              </div>
            </div>
          </Card>

          {/* Card 2: Solve Time Inputs */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
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
                      className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">WCA Penalty Adjustments</label>
                    <select 
                      value={penalty} 
                      onChange={(e) => setPenalty(e.target.value as PenaltyMode)} 
                      disabled={!verifiedCompetitor}
                      className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]"
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
                        className="flex-1 text-[10px] py-1 border-yellow-500/30 text-[#eab308] hover:bg-[#eab308]/10"
                      >
                        SIMULATE INSPECT
                      </Button>
                      <Button 
                        onClick={() => emitStationState('SOLVING', verifiedCompetitor.groupName)}
                        variant="outline"
                        className="flex-1 text-[10px] py-1 border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10"
                      >
                        SIMULATE SOLVING
                      </Button>
                    </div>
                  )}
                </div>
              ) : (
                <div className="rounded-xl bg-[#eab308]/5 border border-[#eab308]/25 p-4 text-xs text-muted-foreground leading-relaxed">
                  Medley Relay active. Use the special Medley Panel below to enter solve values for each puzzle type.
                </div>
              )}
            </div>

            {activeEvent?.eventFormatCode !== 'MEDLEY' && (
              <div className="rounded-xl border border-border/60 p-4 bg-muted/10 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Adjusted Solved Time</p>
                <p className="mt-1 text-2xl font-black text-[#eab308]">{finalTime}</p>
              </div>
            )}
          </Card>

          {/* Card 3: Signatures and submission */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <Signature className="h-4 w-4" /> 3. Player Auths
              </h3>
              
              <div className="space-y-3 pt-2">
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Competitor E-Signature</label>
                  <button 
                    onClick={clearCanvas} 
                    className="text-[10px] font-extrabold text-[#eab308] uppercase tracking-wider hover:underline"
                  >
                    Clear
                  </button>
                </div>
                
                {/* Signature canvas board */}
                <div className="relative border border-border/80 bg-black/40 rounded-xl overflow-hidden h-[120px]">
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
                      <Signature className="h-6 w-6 text-muted-foreground mb-1" />
                      <span className="text-[10px] font-semibold text-muted-foreground uppercase">Sign within this box</span>
                    </div>
                  )}
                </div>

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold text-muted-foreground uppercase">Or Type Initials (Fallback)</label>
                  <input 
                    value={signature} 
                    onChange={(e) => setSignature(e.target.value)} 
                    placeholder="Enter initials" 
                    className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                  />
                </div>
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button 
                onClick={submitResult}
                disabled={isSubmitting || !verifiedCompetitor}
                className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-xl py-5 text-xs border-none"
              >
                {isSubmitting ? 'SUBMITTING SOLVE...' : 'SUBMIT SOLVE RECORD'}
              </Button>
              {resultSummary && (
                <div className={`rounded-xl border p-3.5 text-[11px] font-semibold leading-relaxed ${
                  resultSummary.includes('Success') 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {resultSummary}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Medley panel section (displayed when Medley tournament loaded) */}
        {activeEvent?.eventFormatCode === 'MEDLEY' && verifiedCompetitor && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] animate-in fade-in duration-300">
            <Card className="p-6 border border-border/60 bg-card rounded-2xl space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5" /> Medley Puzzles Lane Setup
              </h3>
              
              <div className="space-y-3">
                {medleySolves.map((s, i) => (
                  <div key={s.medleyPuzzleId} className="grid gap-3 sm:grid-cols-[1fr_140px_140px] items-center rounded-xl border border-border bg-muted/15 p-3 hover:border-border/80 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-foreground">{s.puzzleName}</p>
                    </div>
                    <input 
                      value={s.time} 
                      placeholder="Time (seconds)"
                      onChange={(e) => updateMedleySolve(i, 'time', e.target.value)} 
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground outline-none focus:border-[#eab308]" 
                    />
                    <select 
                      value={s.penalty} 
                      onChange={(e) => updateMedleySolve(i, 'penalty', e.target.value as PenaltyMode)} 
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground outline-none focus:border-[#eab308]"
                    >
                      <option value="None">None</option>
                      <option value="+2">+2s</option>
                      <option value="DNF">DNF</option>
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm hover:border-[#eab308]/20 transition-all duration-300">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider">
                  Medley Combined Stats
                </h3>
                <div className="mt-4 rounded-xl bg-[#eab308]/5 border border-[#eab308]/25 p-4 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Computed Total duration</p>
                  <p className="mt-1.5 text-3xl font-black text-[#eab308]">{medleyResult}</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-border/80 bg-muted/10 p-3.5 text-[10px] text-muted-foreground leading-relaxed mt-4">
                Make sure all puzzle durations have been typed correctly. The Medley total updates dynamically on value changes.
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
