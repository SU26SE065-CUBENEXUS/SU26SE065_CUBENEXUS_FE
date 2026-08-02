'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import * as signalR from '@microsoft/signalr';
import { getTournamentById } from '@/lib/api/tournaments';
import {
  checkIn,
  submitTraditionalResult,
  submitMedleyResult,
  verifyJudgeStation,
  getLiveBoardState,
  getGroupScrambles,
  getPenaltyTypes,
  startRound,
  lockRoundResults,
  completeRound,
  advanceRound,
  completeEvent,
  correctResult,
  formatEvidencePhotoUrl,
} from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import { StationStatusBadge, type StationState } from '@/components/tournament-manager/StationStatusBadge';
import { ScrambleDisplay } from '@/components/tournament-manager/ScrambleDisplay';
import { formatMs } from '@/components/tournament-manager/TimerDisplay';
import {
  ChevronRight,
  Trophy,
  Radio,
  QrCode,
  AlertCircle,
  CheckCircle,
  Loader2,
  Scan,
  ClipboardEdit,
  TimerIcon,
  ShieldCheck,
  Check,
  RefreshCw,
  Play,
  Lock,
  Wifi,
  WifiOff,
  Monitor,
  ArrowRight,
  Zap,
} from 'lucide-react';

// ─── Station grid entry ──────────────────────────────────────
interface StationEntry {
  stationNumber: number;
  state: StationState;
  competitorName?: string;
  updatedAt: number;
}

// ─── Main Page ───────────────────────────────────────────────
export default function LiveOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Helper to validate GUID formats
  const isValidGuid = (guid: string | null | undefined): boolean => {
    if (!guid) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guid);
  };

  // ─── Core States ─────────────────────────────────────────
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [penaltyTypes, setPenaltyTypes] = useState<
    Array<{ id: string; code: string; label: string; timeAdditionMs: number }>
  >([]);
  const [activeTab, setActiveTab] = useState<'stations' | 'checkin' | 'traditional' | 'medley' | 'verify' | 'round'>('traditional');
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [errorMain, setErrorMain] = useState<string | null>(null);

  // ─── SignalR Hub ─────────────────────────────────────────
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const [isHubConnected, setIsHubConnected] = useState(false);
  const [hubStatus, setHubStatus] = useState<'Disconnected' | 'Connecting...' | 'Connected' | 'Reconnecting...'>('Disconnected');
  const [stations, setStations] = useState<StationEntry[]>([]);
  const [hubEventId, setHubEventId] = useState('');
  const [hubRound, setHubRound] = useState('1');
  const [stationCount, setStationCount] = useState('4');

  // ─── Check-In ────────────────────────────────────────────
  const [qrInput, setQrInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ success: boolean; message: string; displayName?: string } | null>(null);

  // ─── Traditional Scoring ─────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState('');
  const [roundNumber, setRoundNumber] = useState('1');
  const [liveState, setLiveState] = useState<any>(null);
  const [isLoadingLiveState, setIsLoadingLiveState] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupScrambles, setGroupScrambles] = useState<any[]>([]);
  const [isLoadingScrambles, setIsLoadingScrambles] = useState(false);
  const [selectedGroupCompetitorId, setSelectedGroupCompetitorId] = useState('');
  const [attemptNumber, setAttemptNumber] = useState('1');
  const [rawTimeMs, setRawTimeMs] = useState('');
  const [selectedPenaltyId, setSelectedPenaltyId] = useState('none');
  const [isSubmittingTrad, setIsSubmittingTrad] = useState(false);
  const [submitTradResult, setSubmitTradResult] = useState<{ ok: boolean; message: string } | null>(null);
  const tradCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTradDrawing, setIsTradDrawing] = useState(false);
  const [tradHasSignature, setTradHasSignature] = useState(false);

  // ─── Medley Scoring ──────────────────────────────────────
  const [medleyEventId, setMedleyEventId] = useState('');
  const [medleyRoundNumber, setMedleyRoundNumber] = useState('1');
  const [medleyLiveState, setMedleyLiveState] = useState<any>(null);
  const [isLoadingMedleyLive, setIsLoadingMedleyLive] = useState(false);
  const [medleyGroupId, setMedleyGroupId] = useState('');
  const [medleyScrambles, setMedleyScrambles] = useState<any[]>([]);
  const [isLoadingMedleyScrambles, setIsLoadingMedleyScrambles] = useState(false);
  const [medleyCompetitorId, setMedleyCompetitorId] = useState('');
  const [medleyAttemptNumber, setMedleyAttemptNumber] = useState('1');
  const [medleyTimes, setMedleyTimes] = useState<Record<string, string>>({});
  const [medleyPenalties, setMedleyPenalties] = useState<Record<string, string>>({});
  const [isSubmittingMedley, setIsSubmittingMedley] = useState(false);
  const [submitMedleyResultStatus, setSubmitMedleyResultStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const medleyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMedleyDrawing, setIsMedleyDrawing] = useState(false);
  const [medleyHasSignature, setMedleyHasSignature] = useState(false);

  // ─── Verify Station ──────────────────────────────────────
  const [verifyForm, setVerifyForm] = useState({ qrToken: '', eventId: '', roundNumber: '1', stationNumber: '1' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // ─── Round Management ────────────────────────────────────
  const [roundMgmtEventId, setRoundMgmtEventId] = useState('');
  const [roundMgmtRound, setRoundMgmtRound] = useState('1');
  const [isRoundAction, setIsRoundAction] = useState(false);
  const [roundActionResult, setRoundActionResult] = useState<{ ok: boolean; message: string } | null>(null);
  const [roundState, setRoundState] = useState<any>(null);
  const [isLoadingRoundState, setIsLoadingRoundState] = useState(false);

  // ─── Result Correction Modal States ──────────────────────
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [editingResultTime, setEditingResultTime] = useState('');
  const [editingResultPenalty, setEditingResultPenalty] = useState('none');
  const [editingResultReason, setEditingResultReason] = useState('');
  const [isCorrectingSubmit, setIsCorrectingSubmit] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // ─── Inline Result Correction Form States ─────────────────
  const [isCorrectingMode, setIsCorrectingMode] = useState(false);
  const [targetCorrectionResultId, setTargetCorrectionResultId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Detect if selected solve already has a result to activate Correction Mode
  useEffect(() => {
    if (!selectedGroupCompetitorId || !attemptNumber || !liveState) {
      setIsCorrectingMode(false);
      setTargetCorrectionResultId(null);
      return;
    }
    const competitorObj = liveState.competitors?.find(
      (c: any) => c.groupCompetitorId === selectedGroupCompetitorId
    );
    const existing = competitorObj?.results?.find(
      (r: any) => r.solveNumber === Number(attemptNumber)
    );
    if (existing) {
      setIsCorrectingMode(true);
      setTargetCorrectionResultId(existing.resultId);
      // Pre-fill time in seconds (converting from finalTimeMs or rawTimeMs)
      const secVal = ((existing.rawTimeMs || existing.finalTimeMs) / 1000).toString();
      setRawTimeMs(secVal);
      const match = penaltyTypes.find((p) => p.code === existing.penaltyCode);
      setSelectedPenaltyId(match?.id || 'none');
      setCorrectionReason('');
    } else {
      setIsCorrectingMode(false);
      setTargetCorrectionResultId(null);
      setRawTimeMs('');
      setSelectedPenaltyId('none');
      setCorrectionReason('');
    }
  }, [selectedGroupCompetitorId, attemptNumber, liveState, penaltyTypes]);

  // Sync state values when editingResult is loaded
  useEffect(() => {
    if (editingResult) {
      const seconds = (editingResult.rawTimeMs / 1000).toFixed(2);
      setEditingResultTime(seconds);
      
      // Locate matching penalty ID in penaltyTypes
      const match = penaltyTypes.find(p => p.code === editingResult.penaltyCode);
      setEditingResultPenalty(match?.id || 'none');
      setEditingResultReason('');
      setCorrectionError(null);
    }
  }, [editingResult, penaltyTypes]);

  // ─── Initialize ──────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoadingMain(true);
      setErrorMain(null);
      try {
        const [tournData, penalties] = await Promise.all([
          getTournamentById(id),
          getPenaltyTypes().catch(() => [
            { id: 'ok-uuid', code: 'OK', label: 'OK', timeAdditionMs: 0 },
            { id: 'plus2-uuid', code: 'PLUS_2', label: '+2s', timeAdditionMs: 2000 },
            { id: 'dnf-uuid', code: 'DNF', label: 'DNF', timeAdditionMs: 0 },
          ]),
        ]);
        setTournament(tournData);
        setPenaltyTypes(penalties);
        if (tournData.events.length > 0) {
          const tradEvents = tournData.events.filter((e) => e.eventFormatCode === 'TRADITIONAL');
          const medEvents = tournData.events.filter((e) => e.eventFormatCode === 'MEDLEY');
          if (tradEvents.length > 0) setSelectedEventId(tradEvents[0].id);
          if (medEvents.length > 0) setMedleyEventId(medEvents[0].id);
          setVerifyForm((prev) => ({ ...prev, eventId: tournData.events[0].id }));
          setHubEventId(tournData.events[0].id);
          setRoundMgmtEventId(tournData.events[0].id);
        }
      } catch (err) {
        setErrorMain(err instanceof Error ? err.message : 'Failed to load tournament data');
      } finally {
        setIsLoadingMain(false);
      }
    }
    loadData();
  }, [id]);

  // ─── SignalR Hub connection ──────────────────────────────
  const connectHub = useCallback(async () => {
    if (hubConnection) {
      await hubConnection.stop().catch(() => undefined);
      setHubConnection(null);
      setIsHubConnected(false);
    }
    if (!hubEventId || !hubRound || !stationCount) return;

    const count = Number(stationCount);
    // Init station grid
    setStations(
      Array.from({ length: count }, (_, i) => ({
        stationNumber: i + 1,
        state: 'EMPTY' as StationState,
        updatedAt: Date.now(),
      }))
    );

    const connection = new signalR.HubConnectionBuilder()
      .withUrl('/hubs/tournament')
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    connection.on('StationStateUpdated', (payload: {
      eventId: string; roundNumber: number; stationNumber: number; state: string; competitorName?: string;
    }) => {
      if (payload.eventId !== hubEventId || payload.roundNumber !== Number(hubRound)) return;
      setStations((prev) =>
        prev.map((s) =>
          s.stationNumber === payload.stationNumber
            ? { ...s, state: (payload.state as StationState) || 'EMPTY', competitorName: payload.competitorName, updatedAt: Date.now() }
            : s
        )
      );
    });

    connection.on('ResultSubmittedEvent', (payload: { eventId: string; roundNumber: number }) => {
      if (payload.eventId === hubEventId && payload.roundNumber === Number(hubRound)) {
        // Refresh live state when a result is submitted
        getLiveBoardState(selectedEventId || hubEventId, Number(hubRound))
          .then(setLiveState)
          .catch(() => undefined);
      }
    });

    connection.on('ResultCorrected', (payload: { eventId: string; roundNumber: number }) => {
      if (payload.eventId === hubEventId && payload.roundNumber === Number(hubRound)) {
        getLiveBoardState(selectedEventId || hubEventId, Number(hubRound))
          .then(setLiveState)
          .catch(() => undefined);
      }
    });

    connection.on('RoundStarted', (payload: any) => {
      setRoundActionResult({ ok: true, message: `Round ${payload.roundNumber} started!` });
    });

    connection.on('ResultsLocked', (payload: any) => {
      setRoundActionResult({ ok: true, message: `Round ${payload.roundNumber} results locked.` });
    });

    connection.on('RoundCompleted', (payload: any) => {
      setRoundActionResult({ ok: true, message: `Round ${payload.roundNumber} completed.` });
    });

    connection.onreconnecting(() => {
      setIsHubConnected(false);
      setHubStatus('Reconnecting...');
    });

    connection.onreconnected(async () => {
      setIsHubConnected(true);
      setHubStatus('Connected');
      try {
        await connection.invoke('RegisterManagerHub', hubEventId, Number(hubRound));
      } catch {}
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
      await connection.invoke('RegisterManagerHub', hubEventId, Number(hubRound)).catch(() => undefined);
    } catch (err: any) {
      setHubStatus('Disconnected');
      setIsHubConnected(false);
      console.error('SignalR connection failed:', err);
    }
  }, [hubEventId, hubRound, stationCount]);

  useEffect(() => {
    return () => {
      hubConnection?.stop().catch(() => undefined);
    };
  }, [hubConnection]);

  // ─── Traditional scoring side-effects ────────────────────
  useEffect(() => {
    if (!selectedEventId) return;
    async function fetchLive() {
      setIsLoadingLiveState(true);
      setLiveState(null);
      setSelectedGroupId('');
      setSelectedGroupCompetitorId('');
      try {
        const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
        setLiveState(state);
        if (state.groups.length > 0) setSelectedGroupId(state.groups[0].groupId);
      } catch {}
      finally { setIsLoadingLiveState(false); }
    }
    fetchLive();
  }, [selectedEventId, roundNumber]);

  useEffect(() => {
    if (!selectedGroupId) { setGroupScrambles([]); return; }
    async function fetchScrambles() {
      setIsLoadingScrambles(true);
      try {
        const scrambles = await getGroupScrambles(selectedGroupId);
        setGroupScrambles(scrambles);
      } catch { setGroupScrambles([]); }
      finally { setIsLoadingScrambles(false); }
    }
    fetchScrambles();
  }, [selectedGroupId]);
  useEffect(() => {
    if (!selectedGroupCompetitorId || !liveState) return;
    const compObj = liveState.competitors.find((c: any) => c.groupCompetitorId === selectedGroupCompetitorId);
    if (compObj) {
      const next = compObj.completedSolves + 1;
      setAttemptNumber(String(Math.min(next, liveState.solveCount)));
    }
  }, [selectedGroupCompetitorId, liveState]);

  // Load round management state dynamically
  useEffect(() => {
    if (!roundMgmtEventId || !roundMgmtRound) {
      setRoundState(null);
      return;
    }
    let active = true;
    async function fetchRoundStatus() {
      setIsLoadingRoundState(true);
      try {
        const state = await getLiveBoardState(roundMgmtEventId, Number(roundMgmtRound));
        if (active) setRoundState(state);
      } catch (err) {
        if (active) setRoundState(null);
      } finally {
        if (active) setIsLoadingRoundState(false);
      }
    }
    fetchRoundStatus();
    return () => { active = false; };
  }, [roundMgmtEventId, roundMgmtRound]);

  // ─── Medley side-effects ─────────────────────────────────
  useEffect(() => {
    if (!medleyEventId) return;
    async function fetchMedleyLive() {
      setIsLoadingMedleyLive(true);
      setMedleyLiveState(null);
      setMedleyGroupId('');
      setMedleyCompetitorId('');
      try {
        const state = await getLiveBoardState(medleyEventId, Number(medleyRoundNumber));
        setMedleyLiveState(state);
        if (state.groups.length > 0) setMedleyGroupId(state.groups[0].groupId);
      } catch {}
      finally { setIsLoadingMedleyLive(false); }
    }
    fetchMedleyLive();
  }, [medleyEventId, medleyRoundNumber]);

  useEffect(() => {
    if (!medleyGroupId) { setMedleyScrambles([]); return; }
    async function fetchMedleyScrambles() {
      setIsLoadingMedleyScrambles(true);
      try {
        const scrambles = await getGroupScrambles(medleyGroupId);
        setMedleyScrambles(scrambles);
      } catch { setMedleyScrambles([]); }
      finally { setIsLoadingMedleyScrambles(false); }
    }
    fetchMedleyScrambles();
  }, [medleyGroupId]);

  // ─── Actions ─────────────────────────────────────────────
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setIsCheckingIn(true);
    setCheckInResult(null);
    try {
      const result = await checkIn({ qrToken: qrInput.trim() });
      setCheckInResult({ success: result.success, message: result.message, displayName: result.displayName });
      if (result.success) setQrInput('');
    } catch (err) {
      setCheckInResult({ success: false, message: err instanceof Error ? err.message : 'Check-in failed' });
    } finally { setIsCheckingIn(false); }
  };

  // Canvas helpers — Traditional
  const startTradDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = tradCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = 'oklch(0.72 0.21 42)';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsTradDrawing(true);
  };
  const drawTrad = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTradDrawing) return;
    const canvas = tradCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
    setTradHasSignature(true);
  };
  const clearTradSignature = () => {
    const canvas = tradCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTradHasSignature(false);
  };

  // Canvas helpers — Medley
  const startMedleyDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = medleyCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = 'oklch(0.68 0.20 310)';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsMedleyDrawing(true);
  };
  const drawMedley = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMedleyDrawing) return;
    const canvas = medleyCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
    setMedleyHasSignature(true);
  };
  const clearMedleySignature = () => {
    const canvas = medleyCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMedleyHasSignature(false);
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitTradResult(null);
    if (!selectedGroupCompetitorId) { setSubmitTradResult({ ok: false, message: 'Please select a competitor.' }); return; }
    if (!rawTimeMs) { setSubmitTradResult({ ok: false, message: 'Solve Time is required.' }); return; }
    const solveNum = Number(attemptNumber);

    // If in Correction Mode, call the correction endpoint instead of submit
    if (isCorrectingMode && targetCorrectionResultId) {
      if (!correctionReason.trim()) {
        setSubmitTradResult({ ok: false, message: 'Lý do sửa đổi (Correction Reason) là bắt buộc.' });
        return;
      }
      setIsSubmittingTrad(true);
      try {
        const penaltyTypeId = isValidGuid(selectedPenaltyId) ? selectedPenaltyId : undefined;
        await correctResult(targetCorrectionResultId, {
          rawTimeMs: Math.round(parseFloat(rawTimeMs) * 1000),
          penaltyTypeId,
          reason: correctionReason.trim(),
        });
        setSubmitTradResult({ ok: true, message: `✓ Đã sửa điểm Solve #${solveNum} thành ${rawTimeMs}s!` });
        setCorrectionReason('');
        // Refresh live state
        const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
        setLiveState(state);
      } catch (err) {
        setSubmitTradResult({ ok: false, message: err instanceof Error ? err.message : 'Correction failed' });
      } finally {
        setIsSubmittingTrad(false);
      }
      return;
    }

    const matchingScramble = groupScrambles.find((s) => s.solveNumber === solveNum);
    if (!matchingScramble) {
      setSubmitTradResult({ ok: false, message: `No scramble for Solve #${solveNum}. Generate scrambles first.` });
      return;
    }
    setIsSubmittingTrad(true);
    try {
      const sigData = tradHasSignature ? tradCanvasRef.current?.toDataURL() : undefined;
      const penaltyTypeId = isValidGuid(selectedPenaltyId) ? selectedPenaltyId : undefined;
      await submitTraditionalResult({
        groupCompetitorId: selectedGroupCompetitorId,
        solveNumber: solveNum,
        rawTimeMs: Math.round(Number(rawTimeMs) * 1000),
        penaltyTypeId,
        scrambleId: matchingScramble.id,
        esignatureData: sigData,
      });
      setSubmitTradResult({ ok: true, message: `✓ Solve #${solveNum} submitted — ${formatMs(Math.round(Number(rawTimeMs) * 1000))}s` });
      setRawTimeMs(''); setSelectedPenaltyId('none'); clearTradSignature();
      const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
      setLiveState(state);
    } catch (err) {
      setSubmitTradResult({ ok: false, message: err instanceof Error ? err.message : 'Submission failed' });
    } finally { setIsSubmittingTrad(false); }
  };

  const handleMedleySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMedleyResultStatus(null);
    if (!medleyCompetitorId) { setSubmitMedleyResultStatus({ ok: false, message: 'Please select a competitor.' }); return; }
    const activeEvent = tournament?.events.find((ev) => ev.id === medleyEventId);
    if (!activeEvent) return;
    const detailsList = [];
    const solveNum = Number(medleyAttemptNumber);
    for (const puzzle of activeEvent.medleyPuzzles) {
      const timeStr = medleyTimes[puzzle.id];
      if (!timeStr) { setSubmitMedleyResultStatus({ ok: false, message: `Fill time for ${puzzle.puzzleTypeName}.` }); return; }
      const matchingScramble = medleyScrambles.find(
        (s) => s.solveNumber === solveNum && s.puzzleTypeId === puzzle.puzzleTypeId
      );
      if (!matchingScramble) {
        setSubmitMedleyResultStatus({ ok: false, message: `No scramble for solve #${solveNum} (${puzzle.puzzleTypeName}).` });
        return;
      }
      const penVal = medleyPenalties[puzzle.id];
      detailsList.push({ 
        medleyPuzzleId: puzzle.id, 
        rawTimeMs: Math.round(Number(timeStr) * 1000), 
        penaltyTypeId: isValidGuid(penVal) ? penVal : undefined, 
        scrambleId: matchingScramble.id 
      });
    }
    setIsSubmittingMedley(true);
    try {
      const sigData = medleyHasSignature ? medleyCanvasRef.current?.toDataURL() : undefined;
      await submitMedleyResult({ groupCompetitorId: medleyCompetitorId, solveNumber: solveNum, esignatureData: sigData, details: detailsList });
      setSubmitMedleyResultStatus({ ok: true, message: '✓ Medley results submitted successfully!' });
      setMedleyTimes({}); setMedleyPenalties({}); clearMedleySignature();
      const state = await getLiveBoardState(medleyEventId, Number(medleyRoundNumber));
      setMedleyLiveState(state);
    } catch (err) {
      setSubmitMedleyResultStatus({ ok: false, message: err instanceof Error ? err.message : 'Submission failed' });
    } finally { setIsSubmittingMedley(false); }
  };

  const handleVerifyStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForm.qrToken.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      // FIX: Use stationNumber (not groupId)
      const result = await verifyJudgeStation({
        qrToken: verifyForm.qrToken.trim(),
        eventId: verifyForm.eventId,
        roundNumber: Number(verifyForm.roundNumber),
        stationNumber: Number(verifyForm.stationNumber),
      });
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult({ success: false, message: err instanceof Error ? err.message : 'Verification failed' });
    } finally { setIsVerifying(false); }
  };

  const handleRoundAction = async (action: 'start' | 'lock' | 'complete' | 'complete_event') => {
    if (!roundMgmtEventId) return;
    setIsRoundAction(true);
    setRoundActionResult(null);
    try {
      if (action === 'start') {
        await startRound(roundMgmtEventId, Number(roundMgmtRound));
        setRoundActionResult({ ok: true, message: `Round ${roundMgmtRound} started! Trạm trọng tài đã mở để bắt đầu thi đấu.` });
      } else if (action === 'lock') {
        await lockRoundResults(roundMgmtEventId, Number(roundMgmtRound));
        setRoundActionResult({ ok: true, message: `Đã khóa kết quả Vòng ${roundMgmtRound}. Tất cả các trạm không thể gửi thêm điểm.` });
      } else if (action === 'complete') {
        await completeRound(roundMgmtEventId, Number(roundMgmtRound));
        setRoundActionResult({ ok: true, message: `Vòng ${roundMgmtRound} đã hoàn thành. Điểm số đã chốt và xếp hạng đã được tạo.` });
      } else if (action === 'complete_event') {
        await completeEvent(roundMgmtEventId);
        setRoundActionResult({ ok: true, message: `Hạng mục thi đấu đã được Hoàn thành và chốt giải thành công!` });
      }

      // Refresh round state after action
      const state = await getLiveBoardState(roundMgmtEventId, Number(roundMgmtRound));
      setRoundState(state);
    } catch (err) {
      setRoundActionResult({ ok: false, message: err instanceof Error ? err.message : 'Thực hiện thao tác thất bại.' });
    } finally {
      setIsRoundAction(false);
    }
  };

  const handleCorrectSubmit = async () => {
    if (!editingResult) return;
    setIsCorrectingSubmit(true);
    setCorrectionError(null);
    try {
      const penaltyTypeId = isValidGuid(editingResultPenalty) ? editingResultPenalty : undefined;
      await correctResult(editingResult.resultId, {
        rawTimeMs: Math.round(parseFloat(editingResultTime) * 1000),
        penaltyTypeId,
        reason: editingResultReason.trim(),
      });
      setEditingResult(null);
      // Refresh live board states
      const state = await getLiveBoardState(selectedEventId || hubEventId, Number(roundNumber || hubRound));
      setLiveState(state);
    } catch (err) {
      setCorrectionError(err instanceof Error ? err.message : 'Correction failed');
    } finally {
      setIsCorrectingSubmit(false);
    }
  };

  if (isLoadingMain) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (errorMain || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{errorMain ?? 'Không tìm thấy giải đấu'}</p>
        </div>
      </div>
    );
  }

  const traditionalEvents = tournament.events.filter((e) => e.eventFormatCode === 'TRADITIONAL');
  const medleyEvents = tournament.events.filter((e) => e.eventFormatCode === 'MEDLEY');
  const filteredTradCompetitors = liveState?.competitors.filter((c: any) => c.groupId === selectedGroupId) || [];
  const filteredMedleyCompetitors = medleyLiveState?.competitors.filter((c: any) => c.groupId === medleyGroupId) || [];

  const TABS = [
    { id: 'traditional', label: 'Bảng Xếp Hạng & Nhập Điểm', icon: ClipboardEdit },
    { id: 'stations', label: 'Trạm Bàn Thi', icon: Monitor },
    { id: 'checkin', label: 'Check-In Thí Sinh', icon: QrCode },
    { id: 'medley', label: 'Thi Đấu Medley', icon: TimerIcon },
    { id: 'verify', label: 'Xác Nhận QR', icon: ShieldCheck },
    { id: 'round', label: 'Điều Hành Vòng Thi', icon: Play },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">Giải Đấu</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors">{tournament.name}</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Điều Hành Trực Tiếp (Live)</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Điều Hành Trực Tiếp</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạm bàn thi, check-in thí sinh, nhập điểm và điều hành tiến trình vòng thi thời gian thực.
          </p>
        </div>

        {/* SignalR Status */}
        <div className="flex items-center gap-2 shrink-0">
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border ${
            isHubConnected
              ? 'text-emerald-700 border-emerald-200 bg-emerald-50'
              : 'text-slate-600 border-slate-200 bg-slate-50'
          }`}>
            {isHubConnected ? <Wifi className="h-3.5 w-3.5" /> : <WifiOff className="h-3.5 w-3.5" />}
            <span>Hub: {hubStatus}</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${
                isActive
                  ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50 rounded-t-lg'
                  : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
              }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 0: STATION GRID ─────────────────────────────── */}
      {activeTab === 'stations' && (
        <div className="space-y-6">
          {/* Hub Setup Card */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs text-slate-900">
            <h2 className="text-sm font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Radio className="h-4 w-4 text-indigo-600" />
              Kết Nối SignalR Hub Trực Tiếp
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Môn Thi</label>
                <select
                  value={hubEventId}
                  onChange={(e) => setHubEventId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="">Chọn Môn Thi</option>
                  {tournament.events.map((ev) => (
                    <option key={ev.id} value={ev.id}>{ev.puzzleTypeName} ({ev.eventFormatCode})</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Vòng Thi (Round)</label>
                <input
                  type="number" min="1" value={hubRound}
                  onChange={(e) => setHubRound(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Số Trạm Bàn Thi</label>
                <input
                  type="number" min="1" max="20" value={stationCount}
                  onChange={(e) => setStationCount(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
              <div className="flex items-end">
                <button
                  onClick={connectHub}
                  className={`w-full py-2 rounded-lg text-xs font-semibold text-white transition ${
                    isHubConnected ? 'bg-emerald-600 hover:bg-emerald-700' : 'bg-indigo-600 hover:bg-indigo-700'
                  }`}
                >
                  {isHubConnected ? '✓ Kết Nối Lại Hub' : 'Kết Nối Hub'}
                </button>
              </div>
            </div>
          </div>

          {/* Station Grid */}
          {stations.length > 0 ? (
            <div>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-sm font-bold text-slate-900 uppercase tracking-wider flex items-center gap-2">
                  <Monitor className="h-4 w-4 text-indigo-600" />
                  Trạm Trọng Tài — Round {hubRound}
                </h2>
                <div className="flex items-center gap-3">
                  {['EMPTY', 'VERIFIED', 'INSPECTING', 'SOLVING', 'SUBMITTING', 'DONE'].map((s) => (
                    <StationStatusBadge key={s} state={s as StationState} size="sm" />
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
                {stations.map((station) => (
                  <div
                    key={station.stationNumber}
                    className={`relative rounded-xl border-2 p-4 transition-all duration-500 ${
                      station.state === 'EMPTY' ? 'station-empty' :
                      station.state === 'VERIFIED' ? 'station-verified' :
                      station.state === 'INSPECTING' ? 'station-inspecting' :
                      station.state === 'SOLVING' ? 'station-solving' :
                      station.state === 'SUBMITTING' ? 'station-submitting' :
                      station.state === 'DONE' ? 'station-done' : 'station-empty'
                    }`}
                  >
                    <div className="text-center">
                      <p className="text-[10px] font-bold uppercase tracking-widest text-slate-500 mb-1">Trạm</p>
                      <p className="text-3xl font-black text-slate-900 mb-2">{station.stationNumber}</p>
                      <StationStatusBadge state={station.state} size="sm" />
                      {station.competitorName && (
                        <p className="mt-2 text-[10px] font-semibold text-slate-900 truncate" title={station.competitorName}>
                          {station.competitorName}
                        </p>
                      )}
                    </div>
                    {station.state === 'SOLVING' && (
                      <div className="absolute top-1.5 right-1.5">
                        <Zap className="h-3 w-3 text-amber-500 animate-pulse" />
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center bg-white">
              <Monitor className="h-10 w-10 text-slate-300 mx-auto mb-3" />
              <p className="text-xs font-semibold text-slate-600">Kết nối SignalR Hub để theo dõi trạng thái trạm bàn thi trực tiếp</p>
              <p className="text-[10px] text-slate-400 mt-1">Chọn môn thi, số vòng và số lượng bàn thi ở trên</p>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 1: CHECK-IN ──────────────────────────────────── */}
      {activeTab === 'checkin' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-xl mx-auto w-full shadow-2xs text-slate-900">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-indigo-600" /> Check-In Thí Sinh Sảnh Đấu
          </h2>
          <p className="text-xs text-slate-500 mb-5">Nhập hoặc quét mã QR thí sinh để xác nhận sự có mặt tại giải đấu.</p>
          <form onSubmit={handleCheckIn} className="space-y-3">
            <div className="relative">
              <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text" value={qrInput} onChange={(e) => setQrInput(e.target.value)}
                placeholder="Quét mã hoặc nhập mã QR token thí sinh..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                autoFocus
              />
            </div>
            <button
              type="submit" disabled={isCheckingIn || !qrInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
            >
              {isCheckingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isCheckingIn ? 'Đang xác nhận...' : 'Xác Nhận Check-In'}
            </button>
          </form>
          {checkInResult && (
            <div className={`mt-4 flex items-start gap-3 rounded-lg border p-3.5 text-xs ${
              checkInResult.success
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {checkInResult.success ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <div>
                {checkInResult.displayName && <p className="font-bold text-slate-900">{checkInResult.displayName}</p>}
                <p className="text-xs mt-0.5">{checkInResult.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 1: TRADITIONAL LEADERBOARD & SCORE ────────────────────────── */}
      {activeTab === 'traditional' && (
        <div className="space-y-6">
          {/* Full-width Live Leaderboard & Evidence Inspection Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs text-slate-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  Bảng Xếp Hạng Trực Tiếp & Đối Soát Tờ Ghi Điểm Minh Chứng
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm vào kết quả bất kỳ (Lượt 1…5) hoặc biểu tượng 📸 Ảnh Minh Chứng để mở tờ ghi điểm và điều chỉnh điểm.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                >
                  {traditionalEvents.map((e) => (
                    <option key={e.id} value={e.id}>{e.puzzleTypeName}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Round</span>
                  <input
                    type="number" min="1" value={roundNumber}
                    onChange={(e) => setRoundNumber(e.target.value)}
                    className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-900 text-center outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  onClick={() => {
                    if (selectedEventId) {
                      getLiveBoardState(selectedEventId, Number(roundNumber)).then(setLiveState);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                  title="Làm mới bảng điểm"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Table */}
            {isLoadingLiveState ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : !liveState || !liveState.competitors || liveState.competitors.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                Chưa có dữ liệu bảng điểm trực tiếp cho hạng mục và round này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center w-10">Hạng</th>
                      <th className="px-3 py-2 font-bold uppercase text-slate-500">Thí Sinh</th>
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center">Nhóm</th>
                      {Array.from({ length: liveState.solveCount || 5 }, (_, i) => (
                        <th key={i} className="px-2 py-2 font-bold uppercase text-slate-500 text-center">
                          Solve #{i + 1}
                        </th>
                      ))}
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center">Best</th>
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {liveState.competitors.map((c: any) => {
                      const compGroup = liveState.groups?.find((g: any) => g.groupId === c.groupId);
                      return (
                        <tr key={c.groupCompetitorId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-center font-bold">
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${
                              c.rank === 1 ? 'bg-amber-100 text-amber-900 font-bold' :
                              c.rank === 2 ? 'bg-slate-200 text-slate-800 font-bold' :
                              c.rank === 3 ? 'bg-amber-800 text-white font-bold' : 'text-slate-500'
                            }`}>
                              {c.rank || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-sans font-bold text-slate-900">
                            <div>
                              <span>{c.competitorName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block font-normal">{c.competitorUserCode}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-sans">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-600 uppercase">
                              {compGroup?.groupName || 'Group'}
                            </span>
                          </td>
                          {Array.from({ length: liveState.solveCount || 5 }, (_, i) => {
                            const attempt = c.results?.find((r: any) => r.solveNumber === i + 1);
                            const isDnf = attempt?.isDnf || attempt?.penaltyCode === 'DNF';
                            const val = attempt ? (isDnf ? 'DNF' : formatMs(attempt.finalTimeMs)) : '—';
                            const hasPhoto = Boolean(attempt?.evidencePhotoUrl);

                            return (
                              <td key={i} className="px-2 py-2.5 text-center">
                                <button
                                  type="button"
                                  disabled={!attempt}
                                  onClick={() => {
                                    if (attempt) {
                                      setEditingResult({
                                        resultId: attempt.resultId,
                                        competitorName: c.competitorName,
                                        solveNumber: i + 1,
                                        rawTimeMs: attempt.rawTimeMs || attempt.finalTimeMs,
                                        penaltyTypeId: attempt.penaltyTypeId || 'none',
                                        isDnf: attempt.isDnf,
                                        penaltyCode: attempt.penaltyCode || 'OK',
                                        evidencePhotoUrl: attempt.evidencePhotoUrl,
                                        esignatureData: attempt.esignatureData,
                                      });
                                    }
                                  }}
                                  className={`px-2 py-1 rounded transition font-semibold ${
                                    attempt
                                      ? (isDnf ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100')
                                      : 'text-slate-300 cursor-default'
                                  }`}
                                  title={
                                    attempt
                                      ? `Solve #${i + 1}: ${val} ${hasPhoto ? '(Bấm để mở ảnh tờ ghi điểm R2)' : '(Bấm để sửa điểm)'}`
                                      : 'Chưa thi đấu'
                                  }
                                >
                                  <span>{val}</span>
                                  {attempt?.penaltyCode === 'PLUS_2' && <span className="text-[9px] text-amber-600 ml-0.5">+2</span>}
                                  {hasPhoto && <span className="text-[10px] ml-1" title="Có ảnh R2">📸</span>}
                                </button>
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-center font-bold text-slate-900">
                            {c.bestTimeMs ? formatMs(c.bestTimeMs) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-indigo-600">
                            {c.averageTimeMs ? formatMs(c.averageTimeMs) : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-slate-900">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <ClipboardEdit className="h-4 w-4 text-indigo-600" /> Nhập Điểm Trực Tiếp (Traditional Result Entry)
            </h2>
            <p className="text-xs text-slate-500 mb-5">Nhập kết quả các lượt giải thi đấu truyền thống.</p>

            {traditionalEvents.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">Không có hạng mục thi đấu truyền thống.</p>
            ) : (
              <form onSubmit={handleTraditionalSubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Môn Thi</label>
                    <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                    >
                      {traditionalEvents.map((e) => <option key={e.id} value={e.id}>{e.puzzleTypeName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Round</label>
                    <input type="number" min="1" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nhóm (Group)</label>
                    {isLoadingLiveState ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Đang tải...</div>
                    ) : (
                      <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                      >
                        <option value="">-- Chọn Nhóm Thi --</option>
                        {liveState?.groups.map((g: any) => (
                          <option key={g.groupId} value={g.groupId}>{g.groupName} ({g.statusCode})</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Thí Sinh</label>
                    <select value={selectedGroupCompetitorId} onChange={(e) => setSelectedGroupCompetitorId(e.target.value)}
                      disabled={!selectedGroupId}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 disabled:opacity-50"
                    >
                      <option value="">-- Chọn Thí Sinh --</option>
                      {filteredTradCompetitors.map((c: any) => (
                        <option key={c.groupCompetitorId} value={c.groupCompetitorId}>{c.competitorName} (Trạm {c.stationNumber ?? '—'})</option>
                      ))}
                    </select>
                  </div>
                </div>

                {selectedGroupCompetitorId && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Lượt Solve #</label>
                        <select value={attemptNumber} onChange={(e) => setAttemptNumber(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                        >
                          {[...Array(liveState?.solveCount || 5)].map((_, i) => (
                            <option key={i + 1} value={i + 1}>Solve {i + 1}</option>
                          ))}
                        </select>
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">
                          {isCorrectingMode ? 'Thời Gian Sửa (Giây)' : 'Thời Gian Solve (Giây)'}
                        </label>
                        <input type="number" step="0.01" value={rawTimeMs} onChange={(e) => setRawTimeMs(e.target.value)}
                          placeholder="Ví dụ: 10.25"
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-mono"
                        />
                      </div>
                      <div>
                        <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Hình Phạt (Penalty)</label>
                        <select value={selectedPenaltyId} onChange={(e) => setSelectedPenaltyId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                        >
                          <option value="none">OK (Hợp lệ)</option>
                          {penaltyTypes.filter((p) => p.code !== 'OK').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                        </select>
                      </div>
                    </div>

                    {isCorrectingMode ? (
                      /* Correction Reason Input (Audit Trail) */
                      <div className="space-y-1.5 animate-in fade-in duration-200">
                        <label className="block text-[10px] font-bold text-amber-600 uppercase font-mono">Lý Do Đổi Điểm (Bắt buộc)</label>
                        <textarea
                          value={correctionReason}
                          onChange={(e) => setCorrectionReason(e.target.value)}
                          placeholder="Ví dụ: Trọng tài ghi nhầm giây trên scorecard giấy..."
                          rows={2}
                          className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                        />
                      </div>
                    ) : (
                      /* Standard Scramble & Signature Requirements */
                      <>
                        {/* Scramble for this solve */}
                        {(() => {
                          const scramble = groupScrambles.find((s) => s.solveNumber === Number(attemptNumber));
                          return scramble && (
                            <ScrambleDisplay sequence={scramble.sequence} solveNumber={Number(attemptNumber)} />
                          );
                        })()}

                        {/* Signature */}
                        <div>
                          <div className="flex items-center justify-between mb-1.5">
                            <label className="text-[10px] font-bold text-slate-500 uppercase">Chữ Ký Thí Sinh</label>
                            <button type="button" onClick={clearTradSignature} className="text-[10px] font-bold text-red-600 hover:underline">Xóa chữ ký</button>
                          </div>
                          <canvas
                            ref={tradCanvasRef} width={400} height={80}
                            onMouseDown={startTradDrawing} onMouseMove={drawTrad}
                            onMouseUp={() => setIsTradDrawing(false)} onMouseLeave={() => setIsTradDrawing(false)}
                            className="w-full rounded-lg border border-slate-200 cursor-crosshair block bg-white"
                            style={{ height: '80px' }}
                          />
                        </div>
                      </>
                    )}
                  </div>
                )}

                {isCorrectingMode && !isHubConnected && (
                  <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 animate-in fade-in duration-200">
                    <AlertCircle className="h-4 w-4 shrink-0" />
                    <span>Yêu cầu kết nối Hub (Connected) hoạt động mới được phép sửa điểm.</span>
                  </div>
                )}

                <button type="submit" 
                  disabled={isSubmittingTrad || !selectedGroupCompetitorId || (isCorrectingMode && !isHubConnected)}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
                >
                  {isSubmittingTrad ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : isCorrectingMode ? (
                    <Check className="h-4 w-4" />
                  ) : (
                    <ClipboardEdit className="h-4 w-4" />
                  )}
                  {isSubmittingTrad ? 'Đang gửi...' : isCorrectingMode ? 'Cập Nhật Điều Chỉnh Điểm' : 'Gửi Kết Quả Thi'}
                </button>
              </form>
            )}

            {submitTradResult && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${
                submitTradResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
              }`}>
                {submitTradResult.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                {submitTradResult.message}
              </div>
            )}
          </div>

          {/* Results Monitor sidebar */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit shadow-2xs text-slate-900">
            <h3 className="font-bold text-xs text-slate-700 mb-4 uppercase tracking-wider">Tiến Độ Nhóm</h3>
            {isLoadingLiveState ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : filteredTradCompetitors.length === 0 ? (
              <p className="text-xs text-slate-400">Chọn nhóm thi để xem danh sách thí sinh.</p>
            ) : (
              <div className="space-y-3">
                {filteredTradCompetitors.map((c: any) => (
                  <div key={c.groupCompetitorId} className="border-b border-slate-100 pb-2.5 last:border-0">
                    <div className="flex items-center justify-between text-xs mb-1.5">
                      <span className="font-bold text-slate-900 truncate mr-2">{c.competitorName}</span>
                      <span className="text-[10px] text-slate-500 font-mono shrink-0">
                        {c.completedSolves}/{liveState?.solveCount}
                      </span>
                    </div>
                    <div className="flex gap-1 flex-wrap">
                      {Array.from({ length: liveState?.solveCount || 5 }, (_, i) => {
                        const result = c.results?.find((r: any) => r.solveNumber === i + 1);
                        return (
                          <button key={i}
                            type="button"
                            disabled={!result}
                            onClick={() => {
                              if (result) {
                                setEditingResult({
                                  resultId: result.resultId,
                                  competitorName: c.competitorName,
                                  solveNumber: i + 1,
                                  rawTimeMs: result.rawTimeMs || result.finalTimeMs,
                                  penaltyTypeId: result.penaltyTypeId || 'none',
                                  isDnf: result.isDnf,
                                  penaltyCode: result.penaltyCode || 'OK',
                                  evidencePhotoUrl: result.evidencePhotoUrl,
                                  esignatureData: result.esignatureData,
                                });
                                setEditingResultTime(result.rawTimeMs ? (result.rawTimeMs / 1000).toString() : (result.finalTimeMs / 1000).toString());
                                setEditingResultPenalty(result.penaltyTypeId || 'none');
                                setEditingResultReason('');
                                setCorrectionError(null);
                              }
                            }}
                            className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-all ${
                              result ? (
                                result.isLocked 
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : result.isDnf 
                                    ? 'bg-red-50 text-red-700 border border-red-200' 
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              ) : 'bg-slate-100 text-slate-400 cursor-default'
                            }`}
                            title={result ? "Bấm để xem ảnh minh chứng / Sửa điểm" : "Lượt thi chưa hoàn thành"}
                          >
                            {result ? (result.isDnf ? 'DNF' : `${(result.finalTimeMs / 1000).toFixed(2)}`) : `S${i + 1}`}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
        </div>
      )}

      {/* ─── TAB 3: MEDLEY SCORE ─────────────────────────────── */}
      {activeTab === 'medley' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-slate-900">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <TimerIcon className="h-4 w-4 text-indigo-600" /> Nhập Điểm Medley Relay
            </h2>
            <p className="text-xs text-slate-500 mb-5">Nhập kết quả thi đấu đồng đội liên hoàn theo từng loại Rubik.</p>

            {medleyEvents.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">Chưa cấu hình môn thi Medley.</p>
            ) : (
              <form onSubmit={handleMedleySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Môn Thi Medley</label>
                    <select value={medleyEventId} onChange={(e) => setMedleyEventId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                    >
                      {medleyEvents.map((e) => <option key={e.id} value={e.id}>{e.puzzleTypeName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Round</label>
                    <input type="number" min="1" value={medleyRoundNumber} onChange={(e) => setMedleyRoundNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nhóm</label>
                    {isLoadingMedleyLive ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Đang tải...</div>
                    ) : (
                      <select value={medleyGroupId} onChange={(e) => setMedleyGroupId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                      >
                        <option value="">-- Chọn Nhóm --</option>
                        {medleyLiveState?.groups.map((g: any) => (
                          <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Thí Sinh</label>
                    <select value={medleyCompetitorId} onChange={(e) => setMedleyCompetitorId(e.target.value)}
                      disabled={!medleyGroupId}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 disabled:opacity-50"
                    >
                      <option value="">-- Chọn Thí Sinh --</option>
                      {filteredMedleyCompetitors.map((c: any) => (
                        <option key={c.groupCompetitorId} value={c.groupCompetitorId}>{c.competitorName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {medleyCompetitorId && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="space-y-3">
                      <p className="text-[10px] font-bold text-slate-500 uppercase border-b border-slate-200 pb-2">Thời Gian Chi Tiết Chuỗi Rubik</p>
                      {tournament.events.find((ev) => ev.id === medleyEventId)?.medleyPuzzles.map((puzzle) => {
                        const solveNum = Number(medleyAttemptNumber);
                        const scramble = medleyScrambles.find(
                          (s) => s.solveNumber === solveNum && s.puzzleTypeId === puzzle.puzzleTypeId
                        );
                        return (
                          <div key={puzzle.id} className="rounded-lg border border-slate-200 bg-white p-3 space-y-2">
                            <div className="flex items-center justify-between">
                              <div>
                                <p className="text-xs font-bold text-slate-900">{puzzle.puzzleTypeName}</p>
                                <p className="text-[10px] text-slate-500">Lượt thi: #{puzzle.sortOrder}</p>
                              </div>
                              <select value={medleyPenalties[puzzle.id] || 'none'}
                                onChange={(e) => setMedleyPenalties((prev) => ({ ...prev, [puzzle.id]: e.target.value }))}
                                className="rounded-lg border border-slate-200 bg-slate-50 px-2 py-1 text-[10px] text-slate-900 outline-none"
                              >
                                <option value="none">OK</option>
                                {penaltyTypes.filter((p) => p.code !== 'OK').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                              </select>
                            </div>
                            <input type="number" value={medleyTimes[puzzle.id] || ''}
                              onChange={(e) => setMedleyTimes((prev) => ({ ...prev, [puzzle.id]: e.target.value }))}
                              placeholder="Thời gian ms (VD: 5240)"
                              className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none font-mono"
                            />
                            {medleyTimes[puzzle.id] && (
                              <p className="text-[10px] text-slate-500 font-mono">{formatMs(Number(medleyTimes[puzzle.id]))}s</p>
                            )}
                            {scramble && <ScrambleDisplay sequence={scramble.sequence} compact />}
                          </div>
                        );
                      })}
                    </div>

                    {/* Signature */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Chữ Ký Thí Sinh</label>
                        <button type="button" onClick={clearMedleySignature} className="text-[10px] font-bold text-red-600 hover:underline">Xóa chữ ký</button>
                      </div>
                      <canvas
                        ref={medleyCanvasRef} width={400} height={80}
                        onMouseDown={startMedleyDrawing} onMouseMove={drawMedley}
                        onMouseUp={() => setIsMedleyDrawing(false)} onMouseLeave={() => setIsMedleyDrawing(false)}
                        className="w-full rounded-lg border border-slate-200 cursor-crosshair block bg-white"
                        style={{ height: '80px' }}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isSubmittingMedley || !medleyCompetitorId}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
                >
                  {isSubmittingMedley ? <Loader2 className="h-4 w-4 animate-spin" /> : <TimerIcon className="h-4 w-4" />}
                  {isSubmittingMedley ? 'Đang gửi...' : 'Gửi Kết Quả Medley'}
                </button>
              </form>
            )}

            {submitMedleyResultStatus && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${
                submitMedleyResultStatus.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
              }`}>
                {submitMedleyResultStatus.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {submitMedleyResultStatus.message}
              </div>
            )}
          </div>

          {/* Medley Monitor */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit shadow-2xs text-slate-900">
            <h3 className="font-bold text-xs text-slate-700 mb-4 uppercase tracking-wider">Tiến Độ Medley</h3>
            {isLoadingMedleyLive ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : filteredMedleyCompetitors.length === 0 ? (
              <p className="text-xs text-slate-400">Chọn nhóm thi Medley.</p>
            ) : (
              <div className="space-y-3">
                {filteredMedleyCompetitors.map((c: any) => (
                  <div key={c.groupCompetitorId} className="border-b border-slate-100 pb-2.5 last:border-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate mr-2">{c.competitorName}</span>
                      <span className={`text-[10px] font-bold ${c.completedSolves > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {c.completedSolves > 0 ? 'HOÀN THÀNH' : 'ĐANG THI'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: VERIFY QR ─────────────────────────────────── */}
      {activeTab === 'verify' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-2xl mx-auto w-full shadow-2xs text-slate-900">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Xác Nhận QR Trạm Trọng Tài
          </h2>
          <p className="text-xs text-slate-500 mb-5">Kiểm tra thông tin thẻ QR thí sinh tại trạm bàn thi cụ thể.</p>
          <form onSubmit={handleVerifyStation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Môn Thi</label>
                <select value={verifyForm.eventId} onChange={(e) => setVerifyForm((v) => ({ ...v, eventId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                >
                  {tournament.events.map((e) => <option key={e.id} value={e.id}>{e.puzzleTypeName} ({e.eventFormatCode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Round</label>
                <input type="number" min="1" value={verifyForm.roundNumber}
                  onChange={(e) => setVerifyForm((v) => ({ ...v, roundNumber: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Số Trạm Bàn Thi</label>
              <input type="number" min="1" value={verifyForm.stationNumber}
                onChange={(e) => setVerifyForm((v) => ({ ...v, stationNumber: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">QR Token Thí Sinh</label>
              <div className="relative">
                <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" value={verifyForm.qrToken}
                  onChange={(e) => setVerifyForm((v) => ({ ...v, qrToken: e.target.value }))}
                  placeholder="Nhập mã QR token..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
            </div>
            <button type="submit" disabled={isVerifying || !verifyForm.qrToken.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
            >
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isVerifying ? 'Đang xác thực...' : 'Xác Thực Trạm Thi'}
            </button>
          </form>

          {verifyResult && (
            <div className={`mt-5 flex items-start gap-3 rounded-lg border p-4 text-xs ${
              verifyResult.success && verifyResult.canSubmit
                ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
                : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {verifyResult.success && verifyResult.canSubmit ? (
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-slate-900">{verifyResult.message}</p>
                {verifyResult.success && (
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>Group Competitor ID: <strong className="text-slate-900 font-mono">{verifyResult.groupCompetitorId}</strong></p>
                    <p>Event: <strong className="text-slate-900">{verifyResult.eventName}</strong></p>
                    <p>Group / Station: <strong className="text-slate-900">{verifyResult.groupName} / Trạm {verifyResult.stationNumber}</strong></p>
                    <p>Lượt tiếp theo: <strong className="font-bold text-indigo-600">#{verifyResult.nextSolveNumber} / {verifyResult.solveCount}</strong></p>
                    {verifyResult.currentScramble && (
                      <ScrambleDisplay sequence={verifyResult.currentScramble.sequence} solveNumber={verifyResult.nextSolveNumber} className="mt-2" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: ROUND CONTROL ─────────────────────────────── */}
      {activeTab === 'round' && (
        <div className="space-y-6 max-w-4xl mx-auto w-full">
          {/* Header & Selection */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-slate-900">
            <h2 className="text-base font-bold text-slate-900 mb-4 flex items-center gap-2">
              <Play className="h-5 w-5 text-indigo-600" />
              Điều Hành Tiến Trình Vòng Thi (Round Lifecycle)
            </h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Chọn Môn Thi</label>
                <select value={roundMgmtEventId} onChange={(e) => setRoundMgmtEventId(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="">Chọn Môn Thi</option>
                  {tournament.events.map((e) => <option key={e.id} value={e.id}>{e.puzzleTypeName} ({e.eventFormatCode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Số Vòng Thi (Round)</label>
                <input type="number" min="1" value={roundMgmtRound} onChange={(e) => setRoundMgmtRound(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>
          </div>

          {/* Round State Dashboard */}
          {roundMgmtEventId && (
            isLoadingRoundState ? (
              <div className="rounded-xl border border-slate-200 bg-white p-8 flex justify-center items-center">
                <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
                <span className="text-xs text-slate-500 ml-2">Đang tải chỉ số vòng thi...</span>
              </div>
            ) : roundState ? (
              <div className="rounded-xl border border-slate-200 bg-white overflow-hidden shadow-2xs text-slate-900">
                {/* Dashboard Banner */}
                <div className="p-6 border-b border-slate-100 bg-slate-50/50 flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div>
                    <span className="text-[10px] font-bold tracking-widest text-indigo-600 uppercase font-mono">ACTIVE DASHBOARD</span>
                    <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-tight">
                      {roundState.eventName} — Vòng {roundState.roundNumber}
                    </h3>
                    <p className="text-xs text-slate-500 mt-0.5">
                      Tiến trình lượt giải của toàn bộ đấu thủ được cập nhật trực tiếp.
                    </p>
                  </div>
                  <div className="shrink-0 flex items-center gap-2">
                    <span className="text-[10px] font-bold text-slate-500 uppercase font-mono">Trạng thái:</span>
                    <span className={`px-2.5 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                      roundState.roundStatus === 'ONGOING' ? 'bg-blue-50 text-blue-700 border border-blue-200' :
                      roundState.roundStatus === 'LOCKED' ? 'bg-amber-50 text-amber-700 border border-amber-200' :
                      roundState.roundStatus === 'COMPLETED' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' :
                      'bg-slate-100 border border-slate-200 text-slate-600'
                    }`}>
                      {roundState.roundStatus === 'DRAFT' || roundState.roundStatus === 'None' || !roundState.roundStatus ? 'Chưa Bắt Đầu' : roundState.roundStatus}
                    </span>
                  </div>
                </div>

                {/* Metrics Grid */}
                {(() => {
                  const totalCompetitors = roundState.competitors?.length || 0;
                  const completedCompetitors = roundState.competitors?.filter((c: any) => c.competitorStatus === 'COMPLETED' || c.competitorStatus === 'NO_SHOW' || c.completedSolves === roundState.solveCount).length || 0;
                  const totalSolvesExpected = totalCompetitors * (roundState.solveCount || 5);
                  const completedSolves = roundState.competitors?.reduce((sum: number, c: any) => sum + (c.completedSolves || 0), 0) || 0;
                  const solvePercentage = totalSolvesExpected > 0 ? Math.round((completedSolves / totalSolvesExpected) * 100) : 0;
                  const roundStatus = roundState.roundStatus || 'DRAFT';

                  return (
                    <>
                      <div className="grid grid-cols-2 md:grid-cols-4 border-b border-slate-100 divide-x divide-slate-100">
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Thí Sinh</p>
                          <p className="text-xl font-bold text-slate-900 mt-1">{totalCompetitors}</p>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Lượt Solve Đã Thi</p>
                          <p className="text-xl font-bold text-slate-900 mt-1">
                            {completedSolves} <span className="text-xs text-slate-400 font-normal">/ {totalSolvesExpected}</span>
                          </p>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Đã Hoàn Thành</p>
                          <p className="text-xl font-bold text-slate-900 mt-1">
                            {completedCompetitors} <span className="text-xs text-slate-400 font-normal">/ {totalCompetitors}</span>
                          </p>
                        </div>
                        <div className="p-4">
                          <p className="text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">Tiến Độ Vòng Thi</p>
                          <p className="text-xl font-bold text-indigo-600 mt-1">{solvePercentage}%</p>
                        </div>
                      </div>

                      {/* Active control flow steps */}
                      <div className="p-6 space-y-3">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono mb-2">QUY TRÌNH ĐIỀU HÀNH VÒNG THI</h4>
                        
                        {/* Step 1: Start Round */}
                        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all ${
                          (roundStatus === 'DRAFT' || roundStatus === 'None') 
                            ? 'border-indigo-200 bg-indigo-50/50' 
                            : 'border-slate-200 bg-white opacity-60'
                        }`}>
                          <div className="mb-3 sm:mb-0 max-w-md">
                            <span className="text-[10px] font-bold font-mono text-indigo-600">BƯỚC 1</span>
                            <h5 className="font-bold text-xs text-slate-900">Khai mạc vòng đấu (Start Round)</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Mở trạm trọng tài để bắt đầu quét mã QR và submit điểm thi đấu trực tiếp.
                            </p>
                          </div>
                          <button
                            onClick={() => handleRoundAction('start')}
                            disabled={isRoundAction || (roundStatus !== 'DRAFT' && roundStatus !== 'None')}
                            className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
                          >
                            <Play className="h-3.5 w-3.5" /> Start Round
                          </button>
                        </div>

                        {/* Step 2: Lock Results */}
                        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all ${
                          roundStatus === 'ONGOING' 
                            ? 'border-amber-200 bg-amber-50/50' 
                            : 'border-slate-200 bg-white opacity-60'
                        }`}>
                          <div className="mb-3 sm:mb-0 max-w-md">
                            <span className="text-[10px] font-bold font-mono text-amber-600">BƯỚC 2</span>
                            <h5 className="font-bold text-xs text-slate-900">Khóa bảng điểm (Lock Results)</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Khóa không cho các trạm gửi thêm điểm. Cho phép Manager chỉnh sửa lỗi nhập điểm của trọng tài trước khi chốt vòng.
                            </p>
                          </div>
                          <button
                            onClick={() => handleRoundAction('lock')}
                            disabled={isRoundAction || roundStatus !== 'ONGOING'}
                            className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50 transition shadow-2xs"
                          >
                            <Lock className="h-3.5 w-3.5" /> Lock Results
                          </button>
                        </div>

                        {/* Step 3: Complete Round */}
                        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all ${
                          roundStatus === 'LOCKED' 
                            ? 'border-purple-200 bg-purple-50/50' 
                            : 'border-slate-200 bg-white opacity-60'
                        }`}>
                          <div className="mb-3 sm:mb-0 max-w-md">
                            <span className="text-[10px] font-bold font-mono text-purple-600">BƯỚC 3</span>
                            <h5 className="font-bold text-xs text-slate-900">Hoàn tất vòng thi (Complete Round)</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Chốt thứ hạng chính thức của vòng đấu. Thăng hạng (Advance) cho các đấu thủ top đầu vào vòng tiếp theo.
                            </p>
                          </div>
                          <button
                            onClick={() => handleRoundAction('complete')}
                            disabled={isRoundAction || roundStatus !== 'LOCKED'}
                            className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-white bg-purple-600 hover:bg-purple-700 disabled:opacity-50 transition shadow-2xs"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Complete Round
                          </button>
                        </div>

                        {/* Step 4: Complete Event */}
                        <div className={`flex flex-col sm:flex-row items-start sm:items-center justify-between p-4 rounded-xl border transition-all ${
                          roundStatus === 'COMPLETED' 
                            ? 'border-emerald-200 bg-emerald-50/50' 
                            : 'border-slate-200 bg-white opacity-60'
                        }`}>
                          <div className="mb-3 sm:mb-0 max-w-md">
                            <span className="text-[10px] font-bold font-mono text-emerald-600">BƯỚC 4</span>
                            <h5 className="font-bold text-xs text-slate-900">Hoàn tất hạng mục đấu (Complete Event)</h5>
                            <p className="text-[11px] text-slate-500 mt-0.5 leading-snug">
                              Chốt Podium trao giải và hoàn thành hạng mục thi đấu (3x3x3, 2x2x2, Medley...) của giải.
                            </p>
                          </div>
                          <button
                            onClick={() => handleRoundAction('complete_event')}
                            disabled={isRoundAction || roundStatus !== 'COMPLETED'}
                            className="inline-flex items-center gap-1 rounded-lg px-3.5 py-2 text-xs font-semibold text-white bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 transition shadow-2xs"
                          >
                            <Trophy className="h-3.5 w-3.5" /> Complete Event
                          </button>
                        </div>
                      </div>
                    </>
                  );
                })()}
              </div>
            ) : (
              <div className="rounded-xl border border-dashed border-slate-200 py-16 text-center bg-white">
                <AlertCircle className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                <p className="text-xs font-semibold text-slate-600">Không tìm thấy thông tin vòng đấu</p>
                <p className="text-[10px] text-slate-400 mt-1">Vui lòng kiểm tra lại cấu hình sự kiện và số vòng thi.</p>
              </div>
            )
          )}

          {isRoundAction && (
            <div className="mt-4 flex items-center gap-2 text-slate-500 text-xs">
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
              Đang thực hiện thao tác...
            </div>
          )}

          {roundActionResult && (
            <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${
              roundActionResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
            }`}>
              {roundActionResult.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
              {roundActionResult.message}
            </div>
          )}
        </div>
      )}

      {/* Result Correction Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-slate-900">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">BÀN ĐIỀU CHỈNH ĐIỂM</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-tight">
                Sửa điểm {editingResult.competitorName} — Solve #{editingResult.solveNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sửa đổi điểm thi trực tiếp của đấu thủ. Thao tác này sẽ ghi nhận lại điểm số trên Live Leaderboard.
              </p>
            </div>

            {/* Evidence Photo / Scorecard Attachment */}
            {(() => {
              const formattedUrl = formatEvidencePhotoUrl(editingResult.evidencePhotoUrl);
              return formattedUrl ? (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">📸 Ảnh Minh Chứng / Tờ Ghi Điểm</span>
                    <button
                      type="button"
                      onClick={() => window.open(formattedUrl, '_blank')}
                      className="text-[10px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      Mở Tab Mới ↗
                    </button>
                  </div>
                  <div 
                    onClick={() => window.open(formattedUrl, '_blank')}
                    className="block group relative overflow-hidden rounded-lg border border-slate-200 cursor-pointer min-h-[120px] bg-slate-100 flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img 
                      src={formattedUrl} 
                      alt="Evidence photo" 
                      className="max-h-48 w-full object-contain transition group-hover:scale-105"
                    />
                  </div>
                </div>
              ) : null;
            })()}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Thời Gian Sửa (Giây)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingResultTime}
                  onChange={(e) => setEditingResultTime(e.target.value)}
                  placeholder="Ví dụ: 12.34"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Hình Phạt (Penalty)</label>
                <select
                  value={editingResultPenalty}
                  onChange={(e) => setEditingResultPenalty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="none">OK (Hợp lệ)</option>
                  {penaltyTypes.filter((p) => p.code !== 'OK').map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Lý Do Đổi Điểm</label>
                <textarea
                  value={editingResultReason}
                  onChange={(e) => setEditingResultReason(e.target.value)}
                  placeholder="Ví dụ: Trọng tài nhập sai hàng chục, đối sánh với scorecard giấy..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Error display */}
            {correctionError && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleCorrectSubmit}
                disabled={isCorrectingSubmit || !editingResultTime || !editingResultReason.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
              >
                {isCorrectingSubmit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Xác Nhận Đổi Điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
