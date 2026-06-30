'use client';

import { useEffect, useState, use, useRef } from 'react';
import Link from 'next/link';
import { getTournamentById } from '@/lib/api/tournaments';
import {
  checkIn,
  submitTraditionalResult,
  submitMedleyResult,
  verifyJudgeStation,
  getLiveBoardState,
  getGroupScrambles,
  getPenaltyTypes,
} from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import {
  ChevronRight,
  ChevronDown,
  Trophy,
  Radio,
  QrCode,
  AlertCircle,
  CheckCircle,
  Loader2,
  Scan,
  ClipboardEdit,
  TimerIcon,
  Users,
  Settings,
  ShieldCheck,
  Check,
  RefreshCw,
  Camera,
} from 'lucide-react';


export default function LiveOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // ─── Global States ──────────────────────────────────────────
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [penaltyTypes, setPenaltyTypes] = useState<
    Array<{ id: string; code: string; label: string; timeAdditionMs: number }>
  >([]);
  const [activeTab, setActiveTab] = useState<'checkin' | 'traditional' | 'medley' | 'verify'>('checkin');
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [errorMain, setErrorMain] = useState<string | null>(null);

  // ─── Check-In Panel States ─────────────────────────────────
  const [qrInput, setQrInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{
    success: boolean;
    message: string;
    displayName?: string;
  } | null>(null);

  // ─── Traditional Scoring States ────────────────────────────
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

  // Canvas signature for Traditional
  const tradCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTradDrawing, setIsTradDrawing] = useState(false);
  const [tradHasSignature, setTradHasSignature] = useState(false);

  // ─── Medley Scoring States ─────────────────────────────────
  const [medleyEventId, setMedleyEventId] = useState('');
  const [medleyRoundNumber, setMedleyRoundNumber] = useState('1');
  const [medleyLiveState, setMedleyLiveState] = useState<any>(null);
  const [isLoadingMedleyLive, setIsLoadingMedleyLive] = useState(false);

  const [medleyGroupId, setMedleyGroupId] = useState('');
  const [medleyScrambles, setMedleyScrambles] = useState<any[]>([]);
  const [isLoadingMedleyScrambles, setIsLoadingMedleyScrambles] = useState(false);

  const [medleyCompetitorId, setMedleyCompetitorId] = useState('');
  const [medleyAttemptNumber, setMedleyAttemptNumber] = useState('1');
  const [medleyTimes, setMedleyTimes] = useState<Record<string, string>>({}); // medleyPuzzleId -> rawTimeMs
  const [medleyPenalties, setMedleyPenalties] = useState<Record<string, string>>({}); // medleyPuzzleId -> penaltyTypeId
  const [isSubmittingMedley, setIsSubmittingMedley] = useState(false);
  const [submitMedleyResultStatus, setSubmitMedleyResultStatus] = useState<{ ok: boolean; message: string } | null>(null);

  // Canvas signature for Medley
  const medleyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMedleyDrawing, setIsMedleyDrawing] = useState(false);
  const [medleyHasSignature, setMedleyHasSignature] = useState(false);

  // ─── Verify Station States ──────────────────────────────────
  const [verifyForm, setVerifyForm] = useState({
    qrToken: '',
    eventId: '',
    roundNumber: '1',
    groupId: '',
    stationNumber: '1',
  });
  const [verifyGroups, setVerifyGroups] = useState<any[]>([]);
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // ─── Initialize Data ───────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoadingMain(true);
      setErrorMain(null);
      try {
        const [tournData, penalties] = await Promise.all([
          getTournamentById(id),
          getPenaltyTypes().catch((err) => {
            console.warn('Could not fetch penalty types from API, using defaults:', err);
            return [
              { id: 'ok-uuid', code: 'OK', label: 'OK', timeAdditionMs: 0 },
              { id: 'plus2-uuid', code: 'PLUS_2', label: '+2s', timeAdditionMs: 2000 },
              { id: 'dnf-uuid', code: 'DNF', label: 'DNF', timeAdditionMs: 0 },
            ];
          }),
        ]);
        setTournament(tournData);
        setPenaltyTypes(penalties);

        // Pre-select first event
        if (tournData.events.length > 0) {
          const tradEvents = tournData.events.filter((e) => e.eventFormatCode === 'TRADITIONAL');
          const medEvents = tournData.events.filter((e) => e.eventFormatCode === 'MEDLEY');
          if (tradEvents.length > 0) setSelectedEventId(tradEvents[0].id);
          if (medEvents.length > 0) setMedleyEventId(medEvents[0].id);
          setVerifyForm((prev) => ({ ...prev, eventId: tournData.events[0].id }));
        }
      } catch (err) {
        setErrorMain(err instanceof Error ? err.message : 'Failed to load tournament data');
      } finally {
        setIsLoadingMain(false);
      }
    }
    loadData();
  }, [id]);

  // ─── Traditional scoring side-effects ─────────────────────
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
        if (state.groups.length > 0) {
          setSelectedGroupId(state.groups[0].groupId);
        }
      } catch (err) {
        console.warn('Failed to fetch live board state:', err);
      } finally {
        setIsLoadingLiveState(false);
      }
    }
    fetchLive();
  }, [selectedEventId, roundNumber]);

  useEffect(() => {
    if (!selectedGroupId) {
      setGroupScrambles([]);
      return;
    }
    async function fetchScrambles() {
      setIsLoadingScrambles(true);
      try {
        const scrambles = await getGroupScrambles(selectedGroupId);
        setGroupScrambles(scrambles);
      } catch (err) {
        console.warn('Failed to fetch scrambles for group:', err);
        setGroupScrambles([]);
      } finally {
        setIsLoadingScrambles(false);
      }
    }
    fetchScrambles();
  }, [selectedGroupId]);

  // Set default attempt number based on selected competitor's completed solves
  useEffect(() => {
    if (!selectedGroupCompetitorId || !liveState) return;
    const compObj = liveState.competitors.find((c: any) => c.groupCompetitorId === selectedGroupCompetitorId);
    if (compObj) {
      const next = compObj.completedSolves + 1;
      setAttemptNumber(String(next > liveState.solveCount ? liveState.solveCount : next));
    }
  }, [selectedGroupCompetitorId, liveState]);

  // ─── Medley scoring side-effects ───────────────────────────
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
        if (state.groups.length > 0) {
          setMedleyGroupId(state.groups[0].groupId);
        }
      } catch (err) {
        console.warn('Failed to fetch live board state for Medley:', err);
      } finally {
        setIsLoadingMedleyLive(false);
      }
    }
    fetchMedleyLive();
  }, [medleyEventId, medleyRoundNumber]);

  useEffect(() => {
    if (!medleyGroupId) {
      setMedleyScrambles([]);
      return;
    }
    async function fetchMedleyScrambles() {
      setIsLoadingMedleyScrambles(true);
      try {
        const scrambles = await getGroupScrambles(medleyGroupId);
        setMedleyScrambles(scrambles);
      } catch (err) {
        console.warn('Failed to fetch medley scrambles:', err);
        setMedleyScrambles([]);
      } finally {
        setIsLoadingMedleyScrambles(false);
      }
    }
    fetchMedleyScrambles();
  }, [medleyGroupId]);

  // ─── Verify Station group loading ──────────────────────────
  useEffect(() => {
    if (!verifyForm.eventId) return;
    getLiveBoardState(verifyForm.eventId, Number(verifyForm.roundNumber))
      .then((state) => {
        setVerifyGroups(state.groups);
        if (state.groups.length > 0) {
          setVerifyForm((prev) => ({ ...prev, groupId: state.groups[0].groupId }));
        } else {
          setVerifyForm((prev) => ({ ...prev, groupId: '' }));
        }
      })
      .catch(() => setVerifyGroups([]));
  }, [verifyForm.eventId, verifyForm.roundNumber]);

  // ─── Check-In Action ───────────────────────────────────────
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setIsCheckingIn(true);
    setCheckInResult(null);
    try {
      const result = await checkIn({ qrToken: qrInput.trim() });
      setCheckInResult({
        success: result.success,
        message: result.message,
        displayName: result.displayName,
      });
      if (result.success) setQrInput('');
    } catch (err) {
      setCheckInResult({
        success: false,
        message: err instanceof Error ? err.message : 'Check-in failed',
      });
    } finally {
      setIsCheckingIn(false);
    }
  };

  // ─── Traditional Scoring Action ───────────────────────────
  const startTradDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = tradCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#3b82f6';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsTradDrawing(true);
  };

  const drawTrad = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTradDrawing) return;
    const canvas = tradCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setTradHasSignature(true);
  };

  const clearTradSignature = () => {
    const canvas = tradCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setTradHasSignature(false);
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitTradResult(null);

    if (!selectedGroupCompetitorId) {
      setSubmitTradResult({ ok: false, message: 'Please select a competitor.' });
      return;
    }
    if (!rawTimeMs) {
      setSubmitTradResult({ ok: false, message: 'Solve Time is required.' });
      return;
    }

    const solveNum = Number(attemptNumber);
    // Find matching scramble
    const matchingScramble = groupScrambles.find((s) => s.solveNumber === solveNum);
    if (!matchingScramble) {
      setSubmitTradResult({
        ok: false,
        message: `No scramble found generated for Solve #${solveNum} in this group. Ensure scrambles are generated.`,
      });
      return;
    }

    setIsSubmittingTrad(true);
    try {
      const sigData = tradHasSignature ? tradCanvasRef.current?.toDataURL() : undefined;
      const penaltyTypeId = selectedPenaltyId !== 'none' ? selectedPenaltyId : undefined;

      const dto = {
        groupCompetitorId: selectedGroupCompetitorId,
        solveNumber: solveNum,
        rawTimeMs: Number(rawTimeMs),
        penaltyTypeId,
        scrambleId: matchingScramble.id,
        esignatureData: sigData,
      };

      await submitTraditionalResult(dto);
      setSubmitTradResult({ ok: true, message: 'Result submitted successfully!' });

      // Reset form fields
      setRawTimeMs('');
      setSelectedPenaltyId('none');
      clearTradSignature();

      // Refresh live state
      const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
      setLiveState(state);
    } catch (err) {
      setSubmitTradResult({
        ok: false,
        message: err instanceof Error ? err.message : 'Result submission failed',
      });
    } finally {
      setIsSubmittingTrad(false);
    }
  };

  // ─── Medley Scoring Action ─────────────────────────────────
  const startMedleyDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = medleyCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5;
    ctx.lineCap = 'round';
    ctx.strokeStyle = '#8b5cf6';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsMedleyDrawing(true);
  };

  const drawMedley = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMedleyDrawing) return;
    const canvas = medleyCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
    setMedleyHasSignature(true);
  };

  const clearMedleySignature = () => {
    const canvas = medleyCanvasRef.current;
    const ctx = canvas?.getContext('2d');
    if (canvas && ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
    }
    setMedleyHasSignature(false);
  };

  const handleMedleySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMedleyResultStatus(null);

    if (!medleyCompetitorId) {
      setSubmitMedleyResultStatus({ ok: false, message: 'Please select a competitor.' });
      return;
    }

    const activeEvent = tournament?.events.find((ev) => ev.id === medleyEventId);
    if (!activeEvent) return;

    // Validate details
    const detailsList = [];
    const solveNum = Number(medleyAttemptNumber);

    for (const puzzle of activeEvent.medleyPuzzles) {
      const timeStr = medleyTimes[puzzle.id];
      if (!timeStr) {
        setSubmitMedleyResultStatus({
          ok: false,
          message: `Please fill in solve time for ${puzzle.puzzleTypeName}.`,
        });
        return;
      }

      // Look up correct scramble matching solveNum and puzzleTypeId
      const matchingScramble = medleyScrambles.find(
        (s) => s.solveNumber === solveNum && s.puzzleTypeId === puzzle.puzzleTypeId
      );

      if (!matchingScramble) {
        setSubmitMedleyResultStatus({
          ok: false,
          message: `No scramble found for solve #${solveNum} (${puzzle.puzzleTypeName}) in this group.`,
        });
        return;
      }

      const penVal = medleyPenalties[puzzle.id];
      const penaltyTypeId = penVal && penVal !== 'none' ? penVal : undefined;

      detailsList.push({
        medleyPuzzleId: puzzle.id, // MedleyEventPuzzle ID
        rawTimeMs: Number(timeStr),
        penaltyTypeId,
        scrambleId: matchingScramble.id,
      });
    }

    setIsSubmittingMedley(true);
    try {
      const sigData = medleyHasSignature ? medleyCanvasRef.current?.toDataURL() : undefined;

      const dto = {
        groupCompetitorId: medleyCompetitorId,
        solveNumber: solveNum,
        esignatureData: sigData,
        details: detailsList,
      };

      await submitMedleyResult(dto);
      setSubmitMedleyResultStatus({ ok: true, message: 'Medley results submitted successfully!' });

      // Reset
      setMedleyTimes({});
      setMedleyPenalties({});
      clearMedleySignature();

      // Refresh
      const state = await getLiveBoardState(medleyEventId, Number(medleyRoundNumber));
      setMedleyLiveState(state);
    } catch (err) {
      setSubmitMedleyResultStatus({
        ok: false,
        message: err instanceof Error ? err.message : 'Medley submission failed',
      });
    } finally {
      setIsSubmittingMedley(false);
    }
  };

  // ─── Verify Judge Station Action ───────────────────────────
  const handleVerifyStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForm.qrToken.trim() || !verifyForm.groupId) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      const result: any = await verifyJudgeStation({
        qrToken: verifyForm.qrToken.trim(),
        eventId: verifyForm.eventId,
        roundNumber: Number(verifyForm.roundNumber),
        stationNumber: Number(verifyForm.stationNumber),
      });
      setVerifyResult({ success: true, ...result });
    } catch (err) {
      setVerifyResult({
        success: false,
        message: err instanceof Error ? err.message : 'Verification failed',
      });
    } finally {
      setIsVerifying(false);
    }
  };

  // ─── Loading / Error Main ──────────────────────────────────
  if (isLoadingMain) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (errorMain || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{errorMain ?? 'Tournament not found'}</p>
        </div>
      </div>
    );
  }

  // Filter lists
  const traditionalEvents = tournament.events.filter((e) => e.eventFormatCode === 'TRADITIONAL');
  const medleyEvents = tournament.events.filter((e) => e.eventFormatCode === 'MEDLEY');

  // Competitors filtering
  const filteredTradCompetitors =
    liveState?.competitors.filter((c: any) => c.groupId === selectedGroupId) || [];
  const filteredMedleyCompetitors =
    medleyLiveState?.competitors.filter((c: any) => c.groupId === medleyGroupId) || [];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-7 flex-wrap">
        <Trophy className="h-3.5 w-3.5" />
        <Link href="/managertournaments" className="hover:text-foreground transition-colors">
          Tournaments
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/managertournaments/${id}`} className="hover:text-foreground transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold">Live Operations</span>
      </div>

      {/* Page Header */}
      <div className="mb-8 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-3 mb-1">
            <span className="h-2.5 w-2.5 rounded-full bg-emerald-500 animate-pulse" />
            <h1 className="text-2xl font-black text-foreground tracking-tight">Live Operations</h1>
          </div>
          <p className="text-sm text-muted-foreground ml-5">
            Check-in competitors, input live scores, and verify judge stations.
          </p>
        </div>
        <span className="rounded-xl border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-semibold text-primary">
          {tournament.name}
        </span>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-border mb-6 overflow-x-auto scrollbar-thin">
        {[
          { id: 'checkin', label: 'Check-In', icon: QrCode },
          { id: 'traditional', label: 'Traditional Score', icon: ClipboardEdit },
          { id: 'medley', label: 'Medley Relay Score', icon: TimerIcon },
          { id: 'verify', label: 'Verify Judge Station', icon: ShieldCheck },
        ].map((tab) => {
          const Icon = tab.icon;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-5 py-3 border-b-2 text-xs font-bold uppercase tracking-wider transition-all -mb-[2px] whitespace-nowrap ${
                activeTab === tab.id
                  ? 'border-primary text-primary font-black'
                  : 'border-transparent text-muted-foreground hover:text-foreground'
              }`}
            >
              <Icon className="h-4 w-4" />
              {tab.label}
            </button>
          );
        })}
      </div>

      <div className="grid grid-cols-1 gap-6">
        {/* ─── TAB 1: CHECK-IN ──────────────────────────────────── */}
        {activeTab === 'checkin' && (
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 max-w-2xl mx-auto w-full">
            <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" /> Competitor Check-In
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Enter or scan the competitor's QR token to check them in as physically present at the tournament.
            </p>
            <form onSubmit={handleCheckIn} className="space-y-4">
              <div className="flex gap-2">
                <div className="relative flex-1">
                  <Scan className="absolute h-5 w-5 text-muted-foreground" style={{ left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={qrInput}
                    onChange={(e) => setQrInput(e.target.value)}
                    placeholder="Scan or paste the competitor's QR token..."
                    className="w-full rounded-xl border border-border bg-card pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition"
                    style={{ paddingLeft: '2.75rem' }}
                    autoFocus
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={isCheckingIn || !qrInput.trim()}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition shadow-lg shadow-primary/10 disabled:opacity-60"
              >
                {isCheckingIn ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <Check className="h-4 w-4" />
                )}
                {isCheckingIn ? 'Processing...' : 'Confirm Check-In'}
              </button>
            </form>

            {checkInResult && (
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  checkInResult.success
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
                }`}
              >
                {checkInResult.success ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  {checkInResult.displayName && (
                    <p className="font-extrabold text-foreground">{checkInResult.displayName}</p>
                  )}
                  <p className="font-semibold text-xs mt-0.5">{checkInResult.message}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* ─── TAB 2: TRADITIONAL SCORE ────────────────────────── */}
        {activeTab === 'traditional' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6">
              <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                <ClipboardEdit className="h-5 w-5 text-primary" /> Input Traditional Result
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                Submit raw times for traditional solve events. Values are automatically mapped to active scrambles.
              </p>

              {traditionalEvents.length === 0 ? (
                <p className="text-center py-10 text-xs text-muted-foreground">
                  No Traditional events configured in this tournament.
                </p>
              ) : (
                <form onSubmit={handleTraditionalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Event
                      </label>
                      <div className="relative">
                        <select
                          value={selectedEventId}
                          onChange={(e) => setSelectedEventId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary transition-colors"
                          style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                        >
                          {traditionalEvents.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.puzzleTypeName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Round Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={roundNumber}
                        onChange={(e) => setRoundNumber(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Group
                      </label>
                      {isLoadingLiveState ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Loading groups...
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={selectedGroupId}
                            onChange={(e) => setSelectedGroupId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary transition-colors"
                            style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                          >
                            <option value="">-- Choose Group --</option>
                            {liveState?.groups.map((g: any) => (
                              <option key={g.groupId} value={g.groupId}>
                                {g.groupName} ({g.statusCode})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Competitor
                      </label>
                      <div className="relative">
                        <select
                          value={selectedGroupCompetitorId}
                          onChange={(e) => setSelectedGroupCompetitorId(e.target.value)}
                          disabled={!selectedGroupId}
                          className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary disabled:opacity-50 transition-colors"
                          style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                        >
                          <option value="">-- Choose Competitor --</option>
                          {filteredTradCompetitors.map((c: any) => (
                            <option key={c.groupCompetitorId} value={c.groupCompetitorId}>
                              {c.competitorName} (Station {c.stationNumber ?? '—'})
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>
                  </div>

                  {selectedGroupCompetitorId && (
                    <div className="bg-muted/10 border border-border p-4 rounded-xl space-y-4">
                      {/* Competitor status details */}
                      {(() => {
                        const compObj = liveState?.competitors.find(
                          (c: any) => c.groupCompetitorId === selectedGroupCompetitorId
                        );
                        return (
                          compObj && (
                            <div className="flex flex-wrap gap-x-6 gap-y-1 text-xs text-muted-foreground">
                              <span>
                                Competitor Status:{' '}
                                <strong className="text-foreground">{compObj.competitorStatus}</strong>
                              </span>
                              <span>
                                Solves Completed:{' '}
                                <strong className="text-primary">
                                  {compObj.completedSolves} / {liveState?.solveCount}
                                </strong>
                              </span>
                            </div>
                          )
                        );
                      })()}

                      {/* Solve params */}
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Solve / Attempt #
                          </label>
                          <select
                            value={attemptNumber}
                            onChange={(e) => setAttemptNumber(e.target.value)}
                            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                          >
                            {[...Array(liveState?.solveCount || 5)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>
                                Solve {i + 1}
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Time (milliseconds)
                          </label>
                          <input
                            type="number"
                            value={rawTimeMs}
                            onChange={(e) => setRawTimeMs(e.target.value)}
                            placeholder="e.g. 10250 for 10.25s"
                            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                            Penalty
                          </label>
                          <select
                            value={selectedPenaltyId}
                            onChange={(e) => setSelectedPenaltyId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                          >
                            <option value="none">No penalty (OK)</option>
                            {penaltyTypes
                              .filter((p) => p.code !== 'OK')
                              .map((p) => (
                                <option key={p.id} value={p.id}>
                                  {p.label}
                                </option>
                              ))}
                          </select>
                        </div>
                      </div>

                      {/* Scramble hint */}
                      {(() => {
                        const scramble = groupScrambles.find((s) => s.solveNumber === Number(attemptNumber));
                        return (
                          scramble && (
                            <div className="rounded-lg border border-primary/20 bg-primary/5 p-3 text-xs">
                              <p className="font-extrabold text-primary mb-1">Scramble for Solve #{attemptNumber}:</p>
                              <code className="text-foreground font-mono select-all block leading-tight break-words">
                                {scramble.sequence}
                              </code>
                            </div>
                          )
                        );
                      })()}

                      {/* Signature Draw */}
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Competitor Signature
                        </label>
                        <div className="flex flex-col gap-2">
                          <canvas
                            ref={tradCanvasRef}
                            width={300}
                            height={100}
                            onMouseDown={startTradDrawing}
                            onMouseMove={drawTrad}
                            onMouseUp={() => setIsTradDrawing(false)}
                            onMouseLeave={() => setIsTradDrawing(false)}
                            className="bg-card border border-border rounded-xl cursor-crosshair max-w-full"
                          />
                          <button
                            type="button"
                            onClick={clearTradSignature}
                            className="w-fit text-[10px] text-red-500 font-bold uppercase hover:underline"
                          >
                            Clear Signature
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingTrad || !selectedGroupCompetitorId}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-3 text-sm font-bold text-primary-foreground hover:bg-primary/95 transition shadow-lg disabled:opacity-60"
                  >
                    {isSubmittingTrad ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <ClipboardEdit className="h-4 w-4" />
                    )}
                    {isSubmittingTrad ? 'Submitting Solve...' : 'Submit Solve Result'}
                  </button>
                </form>
              )}

              {submitTradResult && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                    submitTradResult.ok
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                      : 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
                  }`}
                >
                  {submitTradResult.ok ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {submitTradResult.message}
                </div>
              )}
            </div>

            {/* Quick Status Sidebar */}
            <div className="rounded-2xl border border-border bg-card p-6 h-fit">
              <h3 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">
                Group Results Monitor
              </h3>
              {isLoadingLiveState ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredTradCompetitors.length === 0 ? (
                <p className="text-xs text-muted-foreground">Select an active group to view results.</p>
              ) : (
                <div className="space-y-3">
                  {filteredTradCompetitors.map((c: any) => (
                    <div key={c.groupCompetitorId} className="border-b border-border/60 pb-2 last:border-0">
                      <div className="flex items-center justify-between text-xs mb-1">
                        <span className="font-bold text-foreground truncate mr-2">{c.competitorName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {c.completedSolves} solves
                        </span>
                      </div>
                      {/* Show solve times dot row */}
                      <div className="flex gap-1">
                        {c.results.map((r: any) => (
                          <span
                            key={r.resultId}
                            className={`h-2.5 rounded-full px-1.5 text-[8px] font-bold font-mono leading-none flex items-center ${
                              r.isDnf
                                ? 'bg-red-500/10 text-red-600 border border-red-500/20'
                                : r.penaltyCode !== 'NONE'
                                ? 'bg-orange-500/10 text-orange-600 border border-orange-500/20'
                                : 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/20'
                            }`}
                            title={`Solve ${r.solveNumber}: ${
                              r.isDnf ? 'DNF' : `${(r.finalTimeMs / 1000).toFixed(2)}s`
                            }`}
                          >
                            {r.isDnf ? 'DNF' : `${(r.finalTimeMs / 1000).toFixed(1)}`}
                          </span>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 3: MEDLEY SCORE ─────────────────────────────── */}
        {activeTab === 'medley' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-2xl border border-border bg-card shadow-sm p-6">
              <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
                <TimerIcon className="h-5 w-5 text-primary" /> Input Medley Relay Result
              </h2>
              <p className="text-xs text-muted-foreground mb-5">
                Submit medley relay results where a single attempt contains times for multiple puzzle formats.
              </p>

              {medleyEvents.length === 0 ? (
                <p className="text-center py-10 text-xs text-muted-foreground">
                  No Medley Relay events configured in this tournament.
                </p>
              ) : (
                <form onSubmit={handleMedleySubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Medley Event
                      </label>
                      <div className="relative">
                        <select
                          value={medleyEventId}
                          onChange={(e) => setMedleyEventId(e.target.value)}
                          className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary transition-colors"
                          style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                        >
                          {medleyEvents.map((e) => (
                            <option key={e.id} value={e.id}>
                              {e.puzzleTypeName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Round Number
                      </label>
                      <input
                        type="number"
                        min="1"
                        value={medleyRoundNumber}
                        onChange={(e) => setMedleyRoundNumber(e.target.value)}
                        className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Group
                      </label>
                      {isLoadingMedleyLive ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-muted-foreground">
                          <Loader2 className="h-3 w-3 animate-spin" /> Loading groups...
                        </div>
                      ) : (
                        <div className="relative">
                          <select
                            value={medleyGroupId}
                            onChange={(e) => setMedleyGroupId(e.target.value)}
                            className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary transition-colors"
                            style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                          >
                            <option value="">-- Choose Group --</option>
                            {medleyLiveState?.groups.map((g: any) => (
                              <option key={g.groupId} value={g.groupId}>
                                {g.groupName} ({g.statusCode})
                              </option>
                            ))}
                          </select>
                          <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      )}
                    </div>

                    <div>
                      <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                        Competitor Team / Player
                      </label>
                      <div className="relative">
                        <select
                          value={medleyCompetitorId}
                          onChange={(e) => setMedleyCompetitorId(e.target.value)}
                          disabled={!medleyGroupId}
                          className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary disabled:opacity-50 transition-colors"
                          style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                        >
                          <option value="">-- Choose Competitor --</option>
                          {filteredMedleyCompetitors.map((c: any) => (
                            <option key={c.groupCompetitorId} value={c.groupCompetitorId}>
                              {c.competitorName}
                            </option>
                          ))}
                        </select>
                        <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                      </div>
                    </div>
                  </div>

                  {medleyCompetitorId && (
                    <div className="bg-muted/10 border border-border p-4 rounded-xl space-y-4">
                      {/* Solve select */}
                      <div className="w-1/2">
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Attempt #
                        </label>
                        <div className="relative">
                          <select
                            value={medleyAttemptNumber}
                            onChange={(e) => setMedleyAttemptNumber(e.target.value)}
                            className="w-full rounded-xl border border-border bg-card text-xs text-foreground outline-none focus:border-primary transition-colors"
                            style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                          >
                            <option value="1">Attempt 1 (Standard Relay)</option>
                          </select>
                          <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                        </div>
                      </div>

                      {/* Medley details list */}
                      <div className="space-y-4">
                        <p className="text-[10px] font-extrabold text-muted-foreground uppercase tracking-wider border-b border-border pb-1">
                          Solve Times Per Puzzle
                        </p>
                        {(() => {
                          const activeEvent = tournament.events.find((ev) => ev.id === medleyEventId);
                          return activeEvent?.medleyPuzzles.map((puzzle) => {
                            const solveNum = Number(medleyAttemptNumber);
                            const scramble = medleyScrambles.find(
                              (s) => s.solveNumber === solveNum && s.puzzleTypeId === puzzle.puzzleTypeId
                            );

                            return (
                              <div
                                key={puzzle.id}
                                className="flex flex-col md:flex-row gap-3 items-start md:items-center bg-card p-3 rounded-xl border border-border/80"
                              >
                                <div className="md:w-1/3 shrink-0">
                                  <p className="text-xs font-extrabold text-foreground">
                                    {puzzle.puzzleTypeName}
                                  </p>
                                  <p className="text-[10px] text-muted-foreground">Order: {puzzle.sortOrder}</p>
                                </div>

                                <div className="flex-1 w-full grid grid-cols-2 gap-3">
                                  <div>
                                    <input
                                      type="number"
                                      value={medleyTimes[puzzle.id] || ''}
                                      onChange={(e) =>
                                        setMedleyTimes((prev) => ({ ...prev, [puzzle.id]: e.target.value }))
                                      }
                                      placeholder="Time (ms) e.g. 5240"
                                      className="w-full rounded-lg border border-border bg-muted/20 px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary font-mono"
                                    />
                                  </div>
                                  <div>
                                    <div className="relative">
                                      <select
                                        value={medleyPenalties[puzzle.id] || 'none'}
                                        onChange={(e) =>
                                          setMedleyPenalties((prev) => ({
                                            ...prev,
                                            [puzzle.id]: e.target.value,
                                          }))
                                        }
                                        className="w-full appearance-none rounded-lg border border-border bg-muted/20 pl-2 pr-8 py-1.5 text-xs text-foreground outline-none focus:border-primary transition-colors"
                                      >
                                        <option value="none">No penalty (OK)</option>
                                        {penaltyTypes
                                          .filter((p) => p.code !== 'OK')
                                          .map((p) => (
                                            <option key={p.id} value={p.id}>
                                              {p.label}
                                            </option>
                                          ))}
                                      </select>
                                      <ChevronDown className="absolute right-2 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground pointer-events-none" />
                                    </div>
                                  </div>
                                </div>

                                {scramble && (
                                  <div className="w-full md:w-auto shrink-0 md:ml-3 bg-muted/30 px-2 py-1 rounded text-[10px] text-muted-foreground font-mono">
                                    Scramble: {scramble.sequence.slice(0, 15)}...
                                  </div>
                                )}
                              </div>
                            );
                          });
                        })()}
                      </div>

                      {/* Signature Draw */}
                      <div>
                        <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                          Representative Signature
                        </label>
                        <div className="flex flex-col gap-2">
                          <canvas
                            ref={medleyCanvasRef}
                            width={300}
                            height={100}
                            onMouseDown={startMedleyDrawing}
                            onMouseMove={drawMedley}
                            onMouseUp={() => setIsMedleyDrawing(false)}
                            onMouseLeave={() => setIsMedleyDrawing(false)}
                            className="bg-card border border-border rounded-xl cursor-crosshair max-w-full"
                          />
                          <button
                            type="button"
                            onClick={clearMedleySignature}
                            className="w-fit text-[10px] text-red-500 font-bold uppercase hover:underline"
                          >
                            Clear Signature
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={isSubmittingMedley || !medleyCompetitorId}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-purple-600 py-3 text-sm font-bold text-white hover:bg-purple-500 transition shadow-lg disabled:opacity-60"
                  >
                    {isSubmittingMedley ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <TimerIcon className="h-4 w-4" />
                    )}
                    {isSubmittingMedley ? 'Submitting Medley...' : 'Submit Medley Result'}
                  </button>
                </form>
              )}

              {submitMedleyResultStatus && (
                <div
                  className={`mt-4 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
                    submitMedleyResultStatus.ok
                      ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                      : 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
                  }`}
                >
                  {submitMedleyResultStatus.ok ? (
                    <CheckCircle className="h-4 w-4 shrink-0" />
                  ) : (
                    <AlertCircle className="h-4 w-4 shrink-0" />
                  )}
                  {submitMedleyResultStatus.message}
                </div>
              )}
            </div>

            {/* Medley monitor */}
            <div className="rounded-2xl border border-border bg-card p-6 h-fit">
              <h3 className="font-bold text-sm text-foreground mb-4 uppercase tracking-wider">
                Medley Results Monitor
              </h3>
              {isLoadingMedleyLive ? (
                <div className="flex justify-center py-6">
                  <Loader2 className="h-6 w-6 animate-spin text-primary" />
                </div>
              ) : filteredMedleyCompetitors.length === 0 ? (
                <p className="text-xs text-muted-foreground">Select an active medley group.</p>
              ) : (
                <div className="space-y-3">
                  {filteredMedleyCompetitors.map((c: any) => (
                    <div key={c.groupCompetitorId} className="border-b border-border/60 pb-2 last:border-0">
                      <div className="flex items-center justify-between text-xs">
                        <span className="font-bold text-foreground truncate mr-2">{c.competitorName}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">
                          {c.completedSolves > 0 ? (
                            <span className="text-emerald-500 font-bold">COMPLETED</span>
                          ) : (
                            <span className="text-muted-foreground font-semibold">PENDING</span>
                          )}
                        </span>
                      </div>
                      {c.results.length > 0 && (
                        <p className="text-[10px] font-mono text-muted-foreground mt-1">
                          Final Time:{' '}
                          <span className="text-foreground font-extrabold">
                            {c.results[0].isDnf ? 'DNF' : `${(c.results[0].finalTimeMs / 1000).toFixed(2)}s`}
                          </span>
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ─── TAB 4: VERIFY STATION ───────────────────────────── */}
        {activeTab === 'verify' && (
          <div className="rounded-2xl border border-border bg-card shadow-sm p-6 max-w-2xl mx-auto w-full">
            <h2 className="text-lg font-bold text-foreground mb-1 flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-emerald-500" /> Verify Judge Station QR
            </h2>
            <p className="text-xs text-muted-foreground mb-5">
              Simulate judge station QR verification to ensure the competitor is registered, checked in, and assigned.
            </p>
            <form onSubmit={handleVerifyStation} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Event
                  </label>
                  <div className="relative">
                    <select
                      value={verifyForm.eventId}
                      onChange={(e) => setVerifyForm((v) => ({ ...v, eventId: e.target.value }))}
                      className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary transition-colors"
                      style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                    >
                      {tournament.events.map((e) => (
                        <option key={e.id} value={e.id}>
                          {e.puzzleTypeName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Round Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={verifyForm.roundNumber}
                    onChange={(e) => setVerifyForm((v) => ({ ...v, roundNumber: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Group
                  </label>
                  <div className="relative">
                    <select
                      value={verifyForm.groupId}
                      onChange={(e) => setVerifyForm((v) => ({ ...v, groupId: e.target.value }))}
                      disabled={verifyGroups.length === 0}
                      className="w-full rounded-xl border border-border bg-card text-xs text-foreground font-semibold outline-none focus:border-primary disabled:opacity-50 transition-colors"
                      style={{ paddingLeft: '0.75rem', paddingRight: '2.5rem', appearance: 'none', WebkitAppearance: 'none', height: '2.5rem' }}
                    >
                      <option value="">-- Select Group --</option>
                      {verifyGroups.map((g) => (
                        <option key={g.groupId} value={g.groupId}>
                          {g.groupName}
                        </option>
                      ))}
                    </select>
                    <ChevronDown className="absolute h-4 w-4 text-muted-foreground pointer-events-none" style={{ right: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Station Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={verifyForm.stationNumber}
                    onChange={(e) => setVerifyForm((v) => ({ ...v, stationNumber: e.target.value }))}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                  Competitor QR Token
                </label>
                <div className="relative">
                  <Scan className="absolute h-5 w-5 text-muted-foreground" style={{ left: '0.875rem', top: '50%', transform: 'translateY(-50%)' }} />
                  <input
                    type="text"
                    value={verifyForm.qrToken}
                    onChange={(e) => setVerifyForm((v) => ({ ...v, qrToken: e.target.value }))}
                    placeholder="Enter competitor's QR token..."
                    className="w-full rounded-xl border border-border bg-card pr-4 py-3 text-sm text-foreground outline-none focus:border-primary transition"
                    style={{ paddingLeft: '2.75rem' }}
                  />
                </div>
              </div>

              <button
                type="submit"
                disabled={isVerifying || !verifyForm.qrToken.trim() || !verifyForm.groupId}
                className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 py-3 text-sm font-bold text-white hover:bg-emerald-500 transition shadow-lg disabled:opacity-60"
              >
                {isVerifying ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <ShieldCheck className="h-4 w-4" />
                )}
                {isVerifying ? 'Verifying Station...' : 'Verify Competitor Assignment'}
              </button>
            </form>

            {verifyResult && (
              <div
                className={`mt-5 flex items-start gap-3 rounded-xl border p-4 text-sm ${
                  verifyResult.success && verifyResult.canSubmit
                    ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
                    : 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
                }`}
              >
                {verifyResult.success && verifyResult.canSubmit ? (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                ) : (
                  <AlertCircle className="h-5 w-5 text-red-500 shrink-0 mt-0.5" />
                )}
                <div>
                  <p className="font-extrabold text-foreground">{verifyResult.message}</p>
                  {verifyResult.success && (
                    <div className="mt-2 space-y-1 text-xs text-muted-foreground">
                      <p>
                        Competitor Group ID:{' '}
                        <strong className="text-foreground font-mono">{verifyResult.groupCompetitorId}</strong>
                      </p>
                      <p>
                        Event Name:{' '}
                        <strong className="text-foreground">{verifyResult.eventName}</strong>
                      </p>
                      <p>
                        Group / Station:{' '}
                        <strong className="text-foreground">
                          {verifyResult.groupName} / Station {verifyResult.stationNumber}
                        </strong>
                      </p>
                      <p>
                        Next Solve Attempt:{' '}
                        <strong className="text-primary font-black">
                          Solve #{verifyResult.nextSolveNumber} of {verifyResult.solveCount}
                        </strong>
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
