'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { OnlineArenaScannerTestPanel } from '@/features/rubik-scanner-test/components/OnlineArenaScannerTestPanel';
import { captureScannerSnapshot } from '@/features/rubik-scanner-test/camera/scannerCamera';
import { ExpectedScramble2DNetVisualizer } from '@/features/rubik-scanner-test/components/ExpectedScramble2DNetVisualizer';
import { SingleVideoReplayPlayer } from '@/features/online-arena/components/SingleVideoReplayPlayer';
import { fixWebmDuration } from '@/features/online-arena/utils/fixWebmDuration';
import {
  CheckCircle,
  AlertTriangle,
  Play,
  Square,
  ShieldCheck,
  Video,
  Clock,
  Sparkles,
  ArrowRight,
  RefreshCw,
  Hand,
  Shuffle,
  ChevronRight,
  Copy,
  Check,
  Loader2,
} from 'lucide-react';
import {
  verifyAsyncScramble,
  startAsyncSolveTimer,
  finishAsyncSolveTimer,
  verifyAsyncFinish,
  uploadAsyncAttemptVideo,
  getOnlineAsyncAttemptState,
  type AsyncScannerFace,
  getOnlineAsyncTournamentById,
  type OnlineAsyncTournamentDto,
  type FinishAsyncSolveTimerResponse,
} from '@/lib/api/online-async';

interface Props {
  params: Promise<{ id: string; attemptId: string }>;
}

function ScrambleMovePills({ sequence }: { sequence: string }) {
  const moves = sequence.trim().split(/\s+/).filter(Boolean);

  const getMoveStyle = (move: string) => {
    const face = move[0]?.toUpperCase();
    const styles: Record<string, string> = {
      U: 'border-slate-300 bg-slate-100 text-slate-900',
      D: 'border-amber-300 bg-amber-50 text-amber-900',
      F: 'border-emerald-300 bg-emerald-50 text-emerald-900',
      B: 'border-blue-300 bg-blue-50 text-blue-900',
      R: 'border-red-300 bg-red-50 text-red-900',
      L: 'border-orange-300 bg-orange-50 text-orange-900',
    };
    return styles[face] ?? 'border-slate-200 bg-slate-100 text-slate-800';
  };

  return (
    <div className="flex flex-wrap gap-2">
      {moves.map((move, i) => (
        <span
          key={i}
          className={`inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1.5 rounded-xl border font-mono text-sm font-black tracking-wider shadow-2xs ${getMoveStyle(move)}`}
        >
          {move}
        </span>
      ))}
    </div>
  );
}

function ColorSchemeGuide() {
  const scheme = [
    { code: 'U', dir: 'Up (Top)', colorName: 'White', bg: 'bg-white text-slate-900 border-slate-300' },
    { code: 'D', dir: 'Down (Bottom)', colorName: 'Yellow', bg: 'bg-yellow-400 text-slate-950 border-yellow-300' },
    { code: 'F', dir: 'Front', colorName: 'Green', bg: 'bg-emerald-500 text-white border-emerald-400' },
    { code: 'B', dir: 'Back', colorName: 'Blue', bg: 'bg-blue-600 text-white border-blue-400' },
    { code: 'R', dir: 'Right', colorName: 'Red', bg: 'bg-red-600 text-white border-red-400' },
    { code: 'L', dir: 'Left', colorName: 'Orange', bg: 'bg-orange-500 text-white border-orange-400' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Starting Faces & Colors for Scramble (Solved State)
        </span>
        <span className="text-[10px] font-bold text-slate-400">WCA / CubeNexus Standard</span>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-6 gap-2">
        {scheme.map((item) => (
          <div
            key={item.code}
            className="flex flex-col items-center p-2.5 rounded-xl bg-white border border-slate-200/80 text-center space-y-1 shadow-2xs"
          >
            <div className={`w-7 h-7 rounded-md border font-black text-xs flex items-center justify-center shadow-xs ${item.bg}`}>
              {item.code}
            </div>
            <span className="text-[11px] font-extrabold text-slate-900">{item.colorName}</span>
            <span className="text-[9px] font-medium text-slate-500">{item.dir}</span>
          </div>
        ))}
      </div>

      <div className="p-3 bg-amber-50 rounded-xl border border-amber-200/80 text-[11px] text-amber-900 font-medium leading-relaxed">
        <strong>💡 Orientation when starting scramble:</strong> Hold the Rubik's cube with <strong>WHITE on top (U)</strong> and <strong>GREEN facing you (F)</strong>, then perform the scramble moves sequence above in order.
      </div>
    </div>
  );
}

export default function AsyncAttemptFlowPage({ params }: Props) {
  const { id: tournamentId, attemptId } = use(params);
  const router = useRouter();

  const [tournament, setTournament] = useState<OnlineAsyncTournamentDto | null>(null);
  const [attemptScramble, setAttemptScramble] = useState<string>('');
  const [step, setStep] = useState<'SCRAMBLE_SCAN' | 'TIMER_READY' | 'SOLVING' | 'FINISH_SCAN' | 'RESULT'>('SCRAMBLE_SCAN');
  const [error, setError] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [scanFaces, setScanFaces] = useState<AsyncScannerFace[]>([]);
  const [copiedScramble, setCopiedScramble] = useState(false);
  const [scanResetToken, setScanResetToken] = useState<number>(0);
  const [attemptDeadlineAt, setAttemptDeadlineAt] = useState<string | null>(null);
  const [remainingMs, setRemainingMs] = useState<number | null>(null);
  const hasExpiredRef = useRef(false);

  // Video recording & webcam feed state
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [isRecording, setIsRecording] = useState(false);
  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const cameraStreamRef = useRef<MediaStream | null>(null);
  const recordingStartedAtRef = useRef<number>(0);
  const recordingInterruptedRef = useRef(false);
  const scrambleSubmitInFlightRef = useRef(false);
  const finishSubmitInFlightRef = useRef(false);

  // Hand placement / Ready timer
  const [handTimerStart, setHandTimerStart] = useState<number>(0);
  const [handElapsedMs, setHandElapsedMs] = useState<number>(0);

  // Solving timer state
  const [solveStartMs, setSolveStartMs] = useState<number | null>(null);
  const [solveElapsedMs, setSolveElapsedMs] = useState<number>(0);
  const [activePenaltyCode, setActivePenaltyCode] = useState<'NONE' | 'PLUS2'>('NONE');

  // Result state
  const [finalResult, setFinalResult] = useState<FinishAsyncSolveTimerResponse | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);
  const [recordingInterrupted, setRecordingInterrupted] = useState(false);

  // Track step entry time for 600ms Space keypress cooldown
  const stepEnteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
    if (step === 'TIMER_READY') {
      setHandTimerStart(Date.now());
      setHandElapsedMs(0);
    }
    if (step === 'FINISH_SCAN') {
      setScanFaces([]);
      setScanResetToken((prev) => prev + 1);
    }
  }, [step]);

  // 1. Load tournament details
  useEffect(() => {
    async function init() {
      try {
        const [data, attempt] = await Promise.all([
          getOnlineAsyncTournamentById(tournamentId),
          getOnlineAsyncAttemptState(attemptId),
        ]);
        if (attempt.tournamentId !== tournamentId) throw new Error('Attempt does not belong to this tournament.');
        setTournament(data);
        setAttemptScramble(attempt.scrambleSequence);
        if (attempt.attemptDeadlineAt) {
          setAttemptDeadlineAt(attempt.attemptDeadlineAt);
        }
        if (attempt.penaltyCode === 'PLUS2') {
          setActivePenaltyCode('PLUS2');
        }
        if (attempt.attemptStatus === 'COMPLETED' && (attempt.finishCheckStatus !== 'PENDING' || attempt.isDnf)) {
          setFinalResult(attempt);
          setStep('RESULT');
        } else if (attempt.attemptStatus === 'SCRAMBLE_VERIFIED') {
          setHandTimerStart(Date.now());
          setHandElapsedMs(0);
          setStep('TIMER_READY');
        } else if (attempt.attemptStatus === 'SOLVING') {
          if (attempt.solveStartedAt) {
            setSolveStartMs(new Date(attempt.solveStartedAt).getTime());
          }
          setStep('SOLVING');
        } else if (attempt.attemptStatus === 'FINISH_PENDING' || (attempt.attemptStatus === 'COMPLETED' && attempt.finishCheckStatus === 'PENDING')) {
          setFinalResult(attempt);
          setStep('FINISH_SCAN');
        }
      } catch (err: any) {
        setError(err?.message || 'Unable to load attempt details.');
      }
    }
    init();
  }, [tournamentId, attemptId]);

  useEffect(() => {
    if (!attemptDeadlineAt || step === 'RESULT') return;
    const update = async () => {
      const left = new Date(attemptDeadlineAt).getTime() - Date.now();
      setRemainingMs(Math.max(0, left));
      if (left <= 0) {
        if (hasExpiredRef.current) return;
        hasExpiredRef.current = true;
        try {
          const expired = await getOnlineAsyncAttemptState(attemptId);
          // Only the server decides whether the attempt expired. A finish scan
          // that passed before the deadline remains valid while video uploads.
          setFinalResult(expired);
          if (expired.isDnf || expired.penaltyCode === 'DNF') {
            discardRecording();
            setRecordedVideoUrl(null);
            setError('Attempt time limit exceeded (Time Remain = 0s). Attempt marked as DNF automatically.');
          } else {
            setError(null);
          }
        } catch {
          hasExpiredRef.current = false;
          setError('Time Remain reached 0 but could not confirm result with server. Retrying...');
          return;
        }
        setStep('RESULT');
      }
    };
    void update();
    const timer = window.setInterval(() => void update(), 250);
    return () => window.clearInterval(timer);
  }, [attemptDeadlineAt, attemptId, step]);

  useEffect(() => {
    return () => {
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
    };
  }, []);

  const handleScannerCamera = useCallback((stream: MediaStream | null) => {
    if (!stream) {
      if (recordingStartedAtRef.current > 0 && mediaRecorderRef.current?.state === 'recording') {
        recordingInterruptedRef.current = true;
        setRecordingInterrupted(true);
        setError('Camera disconnected during attempt. Video recording is interrupted; please keep camera enabled until finish scan is complete.');
        mediaRecorderRef.current.stop();
      }
      setIsRecording(false);
      return;
    }
    if (recordingInterruptedRef.current) {
      setError('Cannot resume recording after camera was disconnected during attempt.');
      return;
    }
    if (cameraStreamRef.current === stream) return;
    cameraStreamRef.current = stream;
    if (videoRef.current) videoRef.current.srcObject = stream;
    if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
    const recorder = new MediaRecorder(stream, MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus') ? { mimeType: 'video/webm;codecs=vp9,opus' } : undefined);
    recordedChunksRef.current = [];
    recorder.ondataavailable = (event) => {
      if (event.data.size > 0) recordedChunksRef.current.push(event.data);
    };
    recorder.onstart = () => {
      recordingStartedAtRef.current = Date.now();
    };
    recorder.onerror = () => {
      setIsRecording(false);
      setError('Browser error during video recording. Please check camera permissions.');
    };
    recorder.start(1000);
    const videoTrack = stream.getVideoTracks()[0];
    if (videoTrack) {
      videoTrack.addEventListener('ended', () => {
        if (recordingStartedAtRef.current <= 0 || recorder.state === 'inactive') return;
        recordingInterruptedRef.current = true;
        setRecordingInterrupted(true);
        setIsRecording(false);
        setError('Camera track ended during attempt. Video evidence recording interrupted.');
      }, { once: true });
    }
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  // Step 2: the penalty timer starts after scramble verification. The server
  // remains authoritative; this interval is only the live UI display.
  useEffect(() => {
    if (step !== 'TIMER_READY' || !handTimerStart) return;
    const update = () => setHandElapsedMs(Math.max(0, Date.now() - handTimerStart));
    update();
    const interval = window.setInterval(update, 25);
    return () => window.clearInterval(interval);
  }, [step, handTimerStart]);

  // Solving Timer interval (Step 3) - 5 minutes time limit
  useEffect(() => {
    if (step !== 'SOLVING' || !solveStartMs) return;
    const limitMs = tournament?.attemptTimeLimitMs || 300000;

    const interval = setInterval(() => {
      const elapsed = Date.now() - solveStartMs;
      setSolveElapsedMs(elapsed);

      if (elapsed >= limitMs) {
        clearInterval(interval);
        handleStopSolving(elapsed);
      }
    }, 10);

    return () => clearInterval(interval);
  }, [step, solveStartMs, tournament]);

  const handleStartSolve = async () => {
    if (isProcessing) return;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await startAsyncSolveTimer(attemptId, handElapsedMs);
      if (result.isDnf || result.penaltyCode === 'DNF') {
        discardRecording();
        setRecordedVideoUrl(null);
        const state = await getOnlineAsyncAttemptState(attemptId);
        setFinalResult(state);
        setStep('RESULT');
        return;
      }
      setActivePenaltyCode(result.penaltyCode === 'PLUS2' ? 'PLUS2' : 'NONE');
      setSolveStartMs(Date.now());
      setSolveElapsedMs(0);
      setStep('SOLVING');
    } catch (err: any) {
      setError(err?.message || 'Could not start solve timer.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle Space key presses for timer start/stop
  const handleKeyDown = useCallback(
    async (e: KeyboardEvent) => {
      if (e.code !== 'Space' && e.key !== ' ') return;
      e.preventDefault();

      // Prevent accidental timer trigger within 200ms of entering a new step
      if (Date.now() - stepEnteredAtRef.current < 200) return;

      if (step === 'TIMER_READY' && !isProcessing) {
        void handleStartSolve();
      } else if (step === 'SOLVING' && !isProcessing) {
        void handleStopSolving(solveElapsedMs);
      }
    },
    [step, handElapsedMs, solveElapsedMs, isProcessing, attemptId]
  );

  useEffect(() => {
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleKeyDown]);

  // Step 1: Confirm Scramble Scan
  const handleConfirmScramble = async (facesToUse?: AsyncScannerFace[]) => {
    if (scrambleSubmitInFlightRef.current) return;
    const faces = facesToUse || scanFaces;
    if (faces.length !== 5) return;

    scrambleSubmitInFlightRef.current = true;
    setIsProcessing(true);
    setError(null);
    try {
      const result = await verifyAsyncScramble(attemptId, faces);
      if (!result.passed) {
        setError(
          `Scramble verification mismatch (${result.reason || 'Some faces do not match scramble'}). System automatically reset the scan session. Please hold the Rubik's cube in solved state (White at U, Green at F), then click "Start Session" to scan 5 faces again.`
        );
        setScanFaces([]);
        setScanResetToken((prev) => prev + 1);
        return;
      }
      setAttemptDeadlineAt(result.attemptDeadlineAt ?? null);
      setHandTimerStart(Date.now());
      setHandElapsedMs(0);
      setScanFaces([]);
      setStep('TIMER_READY');
    } catch (err: any) {
      setError(err?.message || 'Invalid scramble check. Please try again.');
    } finally {
      // Scanner completion can be emitted more than once in React development
      // mode. Keep the synchronous guard briefly after the request settles.
      window.setTimeout(() => { scrambleSubmitInFlightRef.current = false; }, 500);
      setIsProcessing(false);
    }
  };

  const captureCameraSnapshot = async () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Camera is not ready. Please allow camera access and try again.');
    }
    const blob = await captureScannerSnapshot(video);
    const dataUrl = await new Promise<string>((resolve, reject) => {
      const reader = new FileReader();
      reader.onloadend = () => resolve(String(reader.result ?? ''));
      reader.onerror = () => reject(new Error('Failed to encode camera snapshot.'));
      reader.readAsDataURL(blob);
    });
    return dataUrl.split(',')[1] ?? '';
  };

  const stopAndBuildVideo = () => new Promise<Blob>((resolve, reject) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return reject(new Error('Recording was not initialized.'));
    const buildBlob = async () => {
      const mimeType = recorder.mimeType || 'video/webm';
      const rawBlob = new Blob(recordedChunksRef.current, { type: mimeType });
      if (rawBlob.size === 0) throw new Error('Recording is empty.');
      if (!mimeType.includes('webm')) return rawBlob;
      const durationMs = Math.max(1, Date.now() - recordingStartedAtRef.current);
      return fixWebmDuration(rawBlob, durationMs);
    };
    if (recorder.state === 'inactive') {
      void buildBlob().then(resolve, reject);
      return;
    }
    recorder.onstop = () => void buildBlob().then(resolve, reject);
    recorder.onerror = () => reject(new Error('Recording failed.'));
    recorder.requestData();
    recorder.stop();
  });

  const discardRecording = () => {
    const recorder = mediaRecorderRef.current;
    if (recorder?.state === 'recording') {
      recorder.onstop = () => { recordedChunksRef.current = []; };
      recorder.stop();
    }
    recordedChunksRef.current = [];
    setIsRecording(false);
  };

  // Step 3 -> 4: Stop Solving Timer
  const handleStopSolving = async (elapsed: number) => {
    setIsProcessing(true);
    try {
      const res = await finishAsyncSolveTimer(attemptId, elapsed);
      setFinalResult(res);
      setScanFaces([]);
      setStep('FINISH_SCAN');
    } catch (err: any) {
      setError(err?.message || 'Error saving solve time.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4 -> 5: Confirm Solved Cube & Stop Recording
  const handleConfirmFinish = async (facesToUse?: AsyncScannerFace[]) => {
    if (finishSubmitInFlightRef.current) return;
    if (recordingInterruptedRef.current || recordingInterrupted || mediaRecorderRef.current?.state !== 'recording') {
      setError('Cannot verify result: camera/recording was interrupted before finish scan completed.');
      return;
    }
    const faces = facesToUse || scanFaces;
    if (faces.length !== 5) return;

    finishSubmitInFlightRef.current = true;
    setIsProcessing(true);
    setError(null);
    try {
      const res = await verifyAsyncFinish(attemptId, await captureCameraSnapshot(), faces);
      if (res.isDnf || res.penaltyCode === 'DNF') {
        discardRecording();
        setRecordedVideoUrl(null);
        setFinalResult(res);
        setStep('RESULT');
        return;
      }
      // The solve result is finalized before evidence upload. If upload fails,
      // keep it available and allow the user to retry without risking a DNF.
      setFinalResult(res);
      const video = await stopAndBuildVideo();
      setIsRecording(false);
      if (video.size === 0) throw new Error('Recording is empty; the valid attempt cannot be sent for review.');
      await uploadAsyncAttemptVideo(attemptId, video);
      try {
        const url = URL.createObjectURL(video);
        setRecordedVideoUrl(url);
      } catch (err) {
        setRecordedVideoUrl(null);
      }
      setStep('RESULT');
    } catch (err: any) {
      setError(err?.message || 'Error verifying result.');
    } finally {
      window.setTimeout(() => { finishSubmitInFlightRef.current = false; }, 500);
      setIsProcessing(false);
    }
  };

  const copyScrambleText = () => {
    const seq = tournament?.scrambleSequence || "R U R' U' R' F R2 U' R' U' R U R' F'";
    navigator.clipboard.writeText(seq);
    setCopiedScramble(true);
    setTimeout(() => setCopiedScramble(false), 2000);
  };

  const scrambleString = attemptScramble;
  const formatRemaining = (ms: number) => {
    const totalSeconds = Math.ceil(ms / 1000);
    return `${String(Math.floor(totalSeconds / 60)).padStart(2, '0')}:${String(totalSeconds % 60).padStart(2, '0')}`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-6 md:p-8 space-y-6">
      {/* Hidden recorder video tag attached to camera stream */}
      <video ref={videoRef} autoPlay playsInline muted className="hidden" />

      {/* Header Stepper Bar (White Mode) */}
      <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-sm flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="p-2.5 bg-indigo-50 rounded-2xl border border-indigo-100">
            <Sparkles className="h-5 w-5 text-indigo-600" />
          </div>
          <div>
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Online Asynchronous Match</h1>
            <p className="text-xs text-slate-500 font-medium">Attempt Flow • {tournament?.name || 'Tournament Arena'}</p>
          </div>
        </div>

        {/* 5 Steps Indicator */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 md:pb-0 text-xs font-extrabold">
          {[
            { key: 'SCRAMBLE_SCAN', num: '1', label: 'Scan Scramble' },
            { key: 'TIMER_READY', num: '2', label: 'Hand Timer' },
            { key: 'SOLVING', num: '3', label: 'Solving' },
            { key: 'FINISH_SCAN', num: '4', label: 'Scan Solved' },
            { key: 'RESULT', num: '5', label: 'Result' },
          ].map((s, idx) => {
            const isActive = step === s.key;
            const isPassed =
              (s.key === 'SCRAMBLE_SCAN' && step !== 'SCRAMBLE_SCAN') ||
              (s.key === 'TIMER_READY' && ['SOLVING', 'FINISH_SCAN', 'RESULT'].includes(step)) ||
              (s.key === 'SOLVING' && ['FINISH_SCAN', 'RESULT'].includes(step)) ||
              (s.key === 'FINISH_SCAN' && step === 'RESULT');

            return (
              <div key={s.key} className="flex items-center gap-1.5 shrink-0">
                <span
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition-all ${isActive
                      ? 'bg-indigo-600 text-white border-indigo-600 shadow-sm shadow-indigo-600/20 font-extrabold'
                      : isPassed
                        ? 'bg-emerald-50 text-emerald-700 border-emerald-200 font-bold'
                        : 'bg-slate-100 text-slate-400 border-slate-200 font-medium'
                    }`}
                >
                  {isPassed ? <CheckCircle className="h-3.5 w-3.5" /> : `${s.num}.`} {s.label}
                </span>
                {idx < 4 && <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />}
              </div>
            );
          })}
        </div>
      </div>

      {remainingMs !== null && step !== 'RESULT' && (
        <div className={`rounded-2xl border px-4 py-3 text-center shadow-sm ${remainingMs <= 60_000 ? 'border-red-200 bg-red-50 text-red-700' : 'border-indigo-200 bg-indigo-50 text-indigo-800'}`}>
          <p className="text-[11px] font-bold uppercase tracking-wider">Attempt Time Remaining</p>
          <p className="font-mono text-2xl font-black">{formatRemaining(remainingMs)}</p>
          <p className="text-xs font-medium">Total time from attempt start including both scan steps. Reaching 0 results in an automatic DNF.</p>
        </div>
      )}

      {/* Alert Error Message */}
      {error && (
        <div className="rounded-2xl bg-red-50 p-4 text-xs font-bold text-red-700 border border-red-200 flex items-center justify-between shadow-2xs">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={() => setError(null)}
            className="text-red-500 hover:text-red-800 font-extrabold text-xs px-2 py-1"
          >
            Close
          </button>
        </div>
      )}

      {/* Main Single Screen Layout (2 Columns) */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (5 cols): Camera Scanner View */}
        <div className="lg:col-span-5 space-y-4">
          <div className="bg-white rounded-3xl p-4 border border-slate-200 shadow-sm space-y-3">
            <div className="flex items-center justify-between border-b border-slate-100 pb-2">
              <span className="text-xs font-extrabold text-slate-900 flex items-center gap-1.5">
                <Video className="h-4 w-4 text-indigo-600" /> Camera & AI Scanner
              </span>
              <span
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${isRecording ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                  }`}
              >
                <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                {isRecording ? 'REC LIVE' : 'CAM READY'}
              </span>
            </div>

            {/* AI Scanner Panel in Compact Mode */}
            <div className="overflow-hidden rounded-2xl">
              <OnlineArenaScannerTestPanel
                backendUrl=""
                requiredFaceCount={5}
                compact
                resetToken={scanResetToken}
                allowCameraStop={step === 'RESULT'}
                onCameraStreamChange={handleScannerCamera}
                onScanCompleted={(session) => {
                  const faces = session.faces.map((face) => ({
                    centerColor: face.centerColor,
                    grid3x3: face.grid3x3,
                  }));
                  setScanFaces(faces);
                  setError(null);

                  // Auto-transition logic upon completing 5 faces scan
                  if (step === 'SCRAMBLE_SCAN' && faces.length === 5 && !isProcessing) {
                    void handleConfirmScramble(faces);
                  } else if (step === 'FINISH_SCAN' && faces.length === 5 && !isProcessing) {
                    void handleConfirmFinish(faces);
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* Right Column (7 cols): Active Step Action Workspace */}
        <div className="lg:col-span-7 bg-white rounded-3xl p-6 sm:p-8 border border-slate-200 shadow-sm space-y-6 flex flex-col justify-between min-h-[500px]">
          {/* STEP 1: SCRAMBLE SCAN */}
          {step === 'SCRAMBLE_SCAN' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Step 1 / 5 • Scramble & AI Scan
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scramble & AI Scan Cube
                </h2>
                <p className="text-xs text-slate-500">
                  Scramble your Rubik's cube from solved state according to the sequence below, then present 5 faces to the camera for AI scanning.
                </p>
              </div>

              {/* Scramble Sequence Display Box */}
              <div className="rounded-2xl border border-indigo-100 bg-gradient-to-br from-indigo-50/50 via-white to-slate-50 p-5 space-y-3 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Shuffle className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-black text-indigo-900 uppercase tracking-wider">
                      Tournament Scramble Sequence
                    </span>
                  </div>
                  <button
                    onClick={copyScrambleText}
                    className="flex items-center gap-1 px-3 py-1 rounded-xl bg-white border border-slate-200 text-xs font-bold text-slate-700 hover:bg-slate-50 shadow-2xs transition"
                  >
                    {copiedScramble ? <Check className="h-3.5 w-3.5 text-emerald-600" /> : <Copy className="h-3.5 w-3.5" />}
                    {copiedScramble ? 'Copied' : 'Copy'}
                  </button>
                </div>

                <ScrambleMovePills sequence={scrambleString} />
              </div>

              {/* Color Scheme Guide */}
              <ColorSchemeGuide />

              {/* Expected Scramble 2D Net Visualizer */}
              <ExpectedScramble2DNetVisualizer scrambleSequence={scrambleString} />

              {/* Auto-transition status info */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-indigo-600" /> Automatic Scramble Verification
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${scanFaces.length === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {scanFaces.length} / 5 faces
                  </span>
                </div>
                <p className="text-slate-600">
                  {scanFaces.length === 5
                    ? 'Captured 5 faces. System is automatically verifying scramble...'
                    : `Present 5 different faces of the cube to the camera. Once all 5 faces are detected, the system will verify and proceed to Step 2.`}
                </p>
              </div>

              {/* Fallback button if user wants to manually click verify */}
              <button
                onClick={() => void handleConfirmScramble()}
                disabled={isProcessing || scanFaces.length !== 5}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-indigo-600/20 transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying scramble...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Verify Scramble & Proceed to Step 2
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 2: READY TO SOLVE */}
          {step === 'TIMER_READY' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Step 2 / 5 • Inspection & Preparation Timer
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scramble Verified Successfully!
                </h2>
                <p className="text-xs text-slate-500">
                  Your scramble is valid. Place the cube down, inspect, and prepare to start solving.
                </p>
              </div>

              {/* Inspection Countdown & Penalty Status Card */}
              <div className={`rounded-3xl border p-6 text-center shadow-sm space-y-3 transition-colors ${handElapsedMs > 14_000
                  ? 'border-rose-300 bg-rose-50/80 text-rose-950'
                  : handElapsedMs > 6_000
                    ? 'border-amber-300 bg-amber-50/80 text-amber-950'
                    : 'border-emerald-300 bg-emerald-50/80 text-emerald-950'
                }`}>
                <div className="flex items-center justify-between px-2">
                  <span className="text-[11px] font-black uppercase tracking-wider text-slate-500 font-mono">
                    Inspection / Preparation Time
                  </span>
                  <span className={`text-[11px] font-black px-2.5 py-0.5 rounded-full uppercase border ${handElapsedMs > 14_000
                      ? 'bg-rose-200 text-rose-800 border-rose-300 animate-pulse'
                      : handElapsedMs > 6_000
                        ? 'bg-amber-200 text-amber-800 border-amber-300'
                        : 'bg-emerald-200 text-emerald-800 border-emerald-300'
                    }`}>
                    {handElapsedMs > 14_000 ? 'DNF (Exceeded 14s)' : handElapsedMs > 6_000 ? '+2s Penalty (Exceeded 6s)' : 'Valid (No Penalty)'}
                  </span>
                </div>

                <div className="py-2">
                  <p className={`font-mono text-5xl sm:text-6xl font-black tracking-tight ${handElapsedMs > 14_000 ? 'text-rose-700' : handElapsedMs > 6_000 ? 'text-amber-700' : 'text-emerald-700'
                    }`}>
                    {(handElapsedMs / 1000).toFixed(2)}s
                  </p>
                  <p className="mt-1.5 text-xs font-bold text-slate-600">
                    {handElapsedMs > 14_000
                      ? 'Exceeded 14s inspection — Attempt marked as DNF!'
                      : handElapsedMs > 6_000
                        ? 'Exceeded 6s inspection — +2.00s penalty will be added to your result.'
                        : 'Click START or press SPACE now to avoid time penalties!'}
                  </p>
                </div>

                {/* Regulation helper pills */}
                <div className="pt-3 border-t border-slate-200/80 text-left space-y-2">
                  <p className="text-[10px] font-extrabold uppercase tracking-wider text-slate-500 font-mono">
                    Inspection Time Regulations:
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2 text-[10px] font-bold">
                    <div className={`p-2.5 rounded-xl border transition-all ${handElapsedMs <= 6_000
                        ? 'bg-emerald-100 border-emerald-400 text-emerald-950 font-black shadow-xs ring-1 ring-emerald-400'
                        : 'bg-white/70 border-slate-200 text-slate-400'
                      }`}>
                      <p className="uppercase text-[11px] font-extrabold">🟢 0.00s – 6.00s</p>
                      <p className="font-semibold text-[10px] mt-0.5 text-emerald-850">Valid Inspection (No Penalty)</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all ${handElapsedMs > 6_000 && handElapsedMs <= 14_000
                        ? 'bg-amber-100 border-amber-400 text-amber-950 font-black shadow-xs ring-1 ring-amber-400'
                        : 'bg-white/70 border-slate-200 text-slate-400'
                      }`}>
                      <p className="uppercase text-[11px] font-extrabold">🟡 6.01s – 14.00s</p>
                      <p className="font-semibold text-[10px] mt-0.5 text-amber-850">Penalty +2 seconds (+2s)</p>
                    </div>
                    <div className={`p-2.5 rounded-xl border transition-all ${handElapsedMs > 14_000
                        ? 'bg-rose-100 border-rose-400 text-rose-950 font-black shadow-xs ring-1 ring-rose-400'
                        : 'bg-white/70 border-slate-200 text-slate-400'
                      }`}>
                      <p className="uppercase text-[11px] font-extrabold">🔴 &gt; 14.00s</p>
                      <p className="font-semibold text-[10px] mt-0.5 text-rose-850">Over Limit: Disqualified (DNF)</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Ready notice */}
              <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Hand className="h-4 w-4 text-indigo-600" /> Important Notes:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>Official solve timer has <strong>NOT STARTED YET</strong>.</li>
                  <li>When you click below or press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-900 font-mono font-bold rounded">SPACE</kbd>, the <strong>Solve Timer will begin from 0.00s</strong>.</li>
                  <li>After solving the cube $\rightarrow$ Press <kbd className="px-1.5 py-0.5 bg-slate-200 text-slate-900 font-mono font-bold rounded">SPACE</kbd> (or click Stop) to finish the solve timer.</li>
                </ul>
              </div>

              <button
                onClick={() => void handleStartSolve()}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-105 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <Play className="h-5 w-5 fill-current" /> START SOLVE TIMER (PRESS SPACE OR CLICK HERE)
              </button>
            </div>
          )}

          {/* STEP 3: SOLVING TIMER */}
          {step === 'SOLVING' && (
            <div className="space-y-8 text-center my-auto">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Step 3 / 5 • Solve Timer In Progress
                </span>
                <h2 className="text-2xl font-black text-slate-900">SOLVING IN PROGRESS</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Solve the Rubik's cube as fast as possible and stop timer before remaining time reaches 0.
                </p>
                <p className={`inline-flex rounded-full px-3 py-1 text-[11px] font-extrabold ${activePenaltyCode === 'PLUS2' ? 'bg-amber-100 text-amber-800 border border-amber-200' : 'bg-emerald-100 text-emerald-800 border border-emerald-200'}`}>
                  {activePenaltyCode === 'PLUS2' ? '⚠️ Inspection Penalty: +2.00 seconds' : '✅ Valid Inspection: No Penalty (+0s)'}
                </p>
              </div>

              {/* Large Solve Timer (Runs starting from 0.00s) */}
              <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider font-mono">Solve Time</p>
                <p className="text-6xl sm:text-7xl font-mono font-black text-indigo-400 tracking-tight">
                  {(solveElapsedMs / 1000).toFixed(2)}s
                </p>
              </div>

              <p className="text-xs text-slate-500 font-semibold">
                When you finish solving the cube, press <kbd className="px-2.5 py-1 bg-slate-200 text-slate-900 border border-slate-300 rounded font-mono font-bold">SPACE</kbd> or click the button below to stop the timer.
              </p>

              <button
                onClick={() => void handleStopSolving(solveElapsedMs)}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <Square className="h-5 w-5 fill-current" /> STOP TIMER & SCAN SOLVED CUBE (SPACE)
              </button>
            </div>
          )}

          {/* STEP 4: FINISH SCAN SOLVED CUBE */}
          {step === 'FINISH_SCAN' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Step 4 / 5 • Scan Solved Cube
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scan Solved Cube & Save Recording
                </h2>
                <p className="text-xs text-slate-500">
                  Present the 5 faces of your solved cube to the camera for AI verification.
                </p>
              </div>

              {/* Raw Solve Time Box */}
              <div className="rounded-2xl bg-slate-50 p-5 border border-slate-200 text-center space-y-1 shadow-2xs">
                <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Raw Solve Time</p>
                <p className="text-4xl font-mono font-black text-slate-900">
                  {finalResult?.rawTimeMs ? `${(finalResult.rawTimeMs / 1000).toFixed(2)}s` : '-'}
                </p>
              </div>

              {/* Auto-transition status */}
              <div className="rounded-2xl border border-slate-200 bg-slate-50 p-4 text-xs space-y-2">
                <div className="flex items-center justify-between">
                  <span className="font-extrabold text-slate-800 flex items-center gap-2">
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Automatic Video & Result Saving
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${scanFaces.length === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {scanFaces.length} / 5 faces
                  </span>
                </div>
                <p className="text-slate-600">
                  {scanFaces.length === 5
                    ? 'Captured 5 faces. Stopping recording, uploading video, and verifying result...'
                    : `Present 5 solved cube faces to camera. System will save and proceed to Step 5.`}
                </p>
              </div>

              <button
                onClick={() => void handleConfirmFinish()}
                disabled={isProcessing || scanFaces.length !== 5}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Verifying cube & uploading video...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Verify 5 Faces & Complete Attempt
                  </>
                )}
              </button>
            </div>
          )}

          {/* STEP 5: INSTANT RESULT DISPLAY */}
          {step === 'RESULT' && finalResult && (
            <div className="space-y-6 text-center my-auto">
              <div className="space-y-1.5">
                <span className={`inline-block px-3 py-1 rounded-full text-[11px] font-extrabold uppercase tracking-wider border ${finalResult.isDnf ? 'bg-rose-100 text-rose-800 border-rose-200' : 'bg-emerald-100 text-emerald-800 border-emerald-200'}`}>
                  Step 5 / 5 • {finalResult.isDnf ? 'Attempt DNF' : 'Attempt Complete'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">ATTEMPT RESULT</h2>
                <p className="text-xs text-slate-500">
                  {finalResult.isDnf ? 'Attempt marked DNF. Recording discarded automatically and not published.' : 'Valid result saved. Video evidence queued for Organizer review.'}
                </p>
              </div>

              {/* Result Summary Card */}
              <div className="p-6 bg-gradient-to-br from-indigo-50/60 via-white to-emerald-50/60 rounded-3xl border border-slate-200 shadow-md space-y-4">
                <div className="grid grid-cols-3 gap-3 text-xs">
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                    <p className="text-slate-400 font-extrabold uppercase text-[10px]">Solve Time</p>
                    <p className="text-lg font-mono font-extrabold text-slate-900 mt-1">
                      {(finalResult.rawTimeMs / 1000).toFixed(2)}s
                    </p>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                    <p className="text-slate-400 font-extrabold uppercase text-[10px]">Penalty</p>
                    <p className="text-lg font-mono font-extrabold text-amber-700 mt-1">
                      {finalResult.penaltyCode === 'PLUS2' ? '+2s' : finalResult.isDnf ? 'DNF' : '+0s'}
                    </p>
                  </div>
                  <div className="bg-white p-3.5 rounded-2xl border border-slate-100 shadow-2xs">
                    <p className="text-slate-400 font-extrabold uppercase text-[10px]">Status</p>
                    <p className={`text-xs font-extrabold mt-2 ${finalResult.isDnf ? 'text-rose-600' : 'text-indigo-600'}`}>{finalResult.isDnf ? 'DNF · Discarded' : 'Pending Review'}</p>
                  </div>
                </div>

                <div className="pt-2">
                  <p className="text-xs text-slate-400 font-extrabold uppercase tracking-wider">Final Result</p>
                  <p className="text-5xl font-mono font-black text-indigo-600 mt-1 tracking-tight">
                    {finalResult.displayResult}
                  </p>
                </div>
              </div>

              {/* VIDEO PLAYER DISPLAY OR DNF NOTICE */}
              {!finalResult.isDnf && recordedVideoUrl ? (
                <SingleVideoReplayPlayer
                  videoUrl={recordedVideoUrl}
                  title="View Valid Competition Video Recording"
                  downloadFilename={`attempt-${attemptId}.webm`}
                />
              ) : finalResult.isDnf ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-left space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                    Attempt Result: DNF (Did Not Finish)
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Under WCA &amp; Online Arena rules, attempts marked <strong>DNF</strong> (due to 14s inspection timeout, exceeding 5 minutes, or incomplete scan) will <strong>have their video recording automatically deleted</strong> and will not be publicly released.
                  </p>
                </div>
              ) : null}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
                Competitors do <strong>not need to click Submit</strong>. Your result has been automatically and securely recorded on the system.
              </div>

              <button
                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg transition cursor-pointer"
              >
                Return to Tournament <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
