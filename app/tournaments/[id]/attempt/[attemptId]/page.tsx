'use client';

import { useState, useEffect, useRef, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import { OnlineArenaScannerTestPanel } from '@/features/rubik-scanner-test/components/OnlineArenaScannerTestPanel';
import { ExpectedScramble2DNetVisualizer } from '@/features/rubik-scanner-test/components/ExpectedScramble2DNetVisualizer';
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
    { code: 'U', dir: 'Up (Trên)', colorName: 'Trắng', bg: 'bg-white text-slate-900 border-slate-300' },
    { code: 'D', dir: 'Down (Dưới)', colorName: 'Vàng', bg: 'bg-yellow-400 text-slate-950 border-yellow-300' },
    { code: 'F', dir: 'Front (Trước)', colorName: 'Xanh lá', bg: 'bg-emerald-500 text-white border-emerald-400' },
    { code: 'B', dir: 'Back (Sau)', colorName: 'Xanh dương', bg: 'bg-blue-600 text-white border-blue-400' },
    { code: 'R', dir: 'Right (Phải)', colorName: 'Đỏ', bg: 'bg-red-600 text-white border-red-400' },
    { code: 'L', dir: 'Left (Trái)', colorName: 'Cam', bg: 'bg-orange-500 text-white border-orange-400' },
  ];

  return (
    <div className="rounded-2xl border border-slate-200 bg-slate-50/80 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-slate-700 uppercase tracking-wider">
          Mặt & Màu xuất phát khi xoay Scramble (Solved State)
        </span>
        <span className="text-[10px] font-bold text-slate-400">Chuẩn WCA / CubeNexus</span>
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
        <strong>💡 Hướng cầm khối Rubik khi bắt đầu xoay Scramble:</strong> Cầm khối Rubik sao cho mặt màu <strong>TRẮNG ở phía trên (U)</strong> và mặt màu <strong>XANH LÁ hướng về phía bạn (F)</strong>, sau đó xoay lần lượt các nước đi theo đúng chuỗi Scramble phía trên.
      </div>
    </div>
  );
}

export default function AsyncAttemptFlowPage({ params }: Props) {
  const { id: tournamentId, attemptId } = use(params);
  const router = useRouter();

  const [tournament, setTournament] = useState<OnlineAsyncTournamentDto | null>(null);
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

  // Hand placement / Ready timer
  const [handTimerStart, setHandTimerStart] = useState<number>(0);
  const [handElapsedMs, setHandElapsedMs] = useState<number>(0);

  // Solving timer state
  const [solveStartMs, setSolveStartMs] = useState<number | null>(null);
  const [solveElapsedMs, setSolveElapsedMs] = useState<number>(0);

  // Result state
  const [finalResult, setFinalResult] = useState<FinishAsyncSolveTimerResponse | null>(null);
  const [recordedVideoUrl, setRecordedVideoUrl] = useState<string | null>(null);

  // Track step entry time for 600ms Space keypress cooldown
  const stepEnteredAtRef = useRef<number>(Date.now());

  useEffect(() => {
    stepEnteredAtRef.current = Date.now();
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
        if (attempt.tournamentId !== tournamentId) throw new Error('Attempt không thuộc giải đấu này.');
        setTournament(data);
        if (attempt.attemptDeadlineAt) {
          setAttemptDeadlineAt(attempt.attemptDeadlineAt);
        }
        if (attempt.attemptStatus === 'COMPLETED') {
          setFinalResult(attempt);
          setStep('RESULT');
        } else if (attempt.attemptStatus === 'SCRAMBLE_VERIFIED') {
          setStep('TIMER_READY');
        } else if (attempt.attemptStatus === 'SOLVING') {
          setError('Attempt đang ở bước Solving. Hãy hoàn tất trên phiên đang mở để bảo toàn thời gian.');
          setStep('SOLVING');
        }
      } catch (err: any) {
        setError(err?.message || 'Không thể tải thông tin attempt.');
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
        discardRecording();
        setRecordedVideoUrl(null);
        try {
          const expired = await getOnlineAsyncAttemptState(attemptId);
          setFinalResult({
            ...expired,
            isDnf: true,
            displayResult: 'DNF',
          });
        } catch {
          setFinalResult({
            attemptId,
            status: 'COMPLETED',
            isDnf: true,
            penaltyCode: 'DNF',
            rawTimeMs: 0,
            finalTimeMs: 0,
            displayResult: 'DNF',
          } as any);
        }
        setError('Đã hết thời gian cho phép của lượt thi (Time Remain = 0s). Lượt thi đấu tự động bị đánh DNF.');
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
      if (mediaRecorderRef.current?.state === 'recording') mediaRecorderRef.current.stop();
      setIsRecording(false);
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
    recorder.start(1000);
    mediaRecorderRef.current = recorder;
    setIsRecording(true);
  }, []);

  // Step 2: Ready State (No auto-ticking timer)
  useEffect(() => {
    if (step === 'TIMER_READY') {
      setHandElapsedMs(0);
    }
  }, [step]);

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
      await startAsyncSolveTimer(attemptId, handElapsedMs);
      setSolveStartMs(Date.now());
      setSolveElapsedMs(0);
      setStep('SOLVING');
    } catch (err: any) {
      setError(err?.message || 'Không thể bắt đầu timer.');
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
    const faces = facesToUse || scanFaces;
    if (faces.length !== 5) return;

    setIsProcessing(true);
    setError(null);
    try {
      const result = await verifyAsyncScramble(attemptId, faces);
      if (!result.passed) {
        setError(
          `Xác minh Scramble không khớp (${result.reason || 'Some faces do not match scramble'}). Hệ thống đã tự động Reset session scan. Vui lòng xoay lại Rubik đúng Solved State (Trắng ở U, Xanh lá ở F), sau đó bấm "Start Session" để quét lại 5 mặt.`
        );
        setScanFaces([]);
        setScanResetToken((prev) => prev + 1);
        return;
      }
      setAttemptDeadlineAt(result.attemptDeadlineAt ?? null);
      setScanFaces([]);
      setScanResetToken((prev) => prev + 1);
      setStep('TIMER_READY');
    } catch (err: any) {
      setError(err?.message || 'Scramble check không hợp lệ. Vui lòng thử lại.');
    } finally {
      setIsProcessing(false);
    }
  };

  const captureCameraSnapshot = () => {
    const video = videoRef.current;
    if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
      throw new Error('Camera is not ready. Please allow camera access and try again.');
    }
    const canvas = document.createElement('canvas');
    canvas.width = Math.min(video.videoWidth, 960);
    canvas.height = Math.round(video.videoHeight * (canvas.width / video.videoWidth));
    canvas.getContext('2d')?.drawImage(video, 0, 0, canvas.width, canvas.height);
    return canvas.toDataURL('image/jpeg', 0.9).split(',')[1];
  };

  const stopAndBuildVideo = () => new Promise<Blob>((resolve, reject) => {
    const recorder = mediaRecorderRef.current;
    if (!recorder) return reject(new Error('Recording was not initialized.'));
    if (recorder.state === 'inactive') {
      return resolve(new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' }));
    }
    recorder.onstop = () => resolve(new Blob(recordedChunksRef.current, { type: recorder.mimeType || 'video/webm' }));
    recorder.onerror = () => reject(new Error('Recording failed.'));
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
      setError(err?.message || 'Lỗi khi lưu thời gian solve.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Step 4 -> 5: Confirm Solved Cube & Stop Recording
  const handleConfirmFinish = async (facesToUse?: AsyncScannerFace[]) => {
    const faces = facesToUse || scanFaces;
    if (faces.length !== 5) return;

    setIsProcessing(true);
    setError(null);
    try {
      const res = await verifyAsyncFinish(attemptId, captureCameraSnapshot(), faces);
      if (res.isDnf || res.penaltyCode === 'DNF') {
        discardRecording();
        setRecordedVideoUrl(null);
        setFinalResult(res);
        setStep('RESULT');
        return;
      }
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
      setFinalResult(res);
      setStep('RESULT');
    } catch (err: any) {
      setError(err?.message || 'Lỗi khi xác nhận kết quả.');
    } finally {
      setIsProcessing(false);
    }
  };

  const copyScrambleText = () => {
    const seq = tournament?.scrambleSequence || "R U R' U' R' F R2 U' R' U' R U R' F'";
    navigator.clipboard.writeText(seq);
    setCopiedScramble(true);
    setTimeout(() => setCopiedScramble(false), 2000);
  };

  const scrambleString = tournament?.scrambleSequence || "R U R' U' R' F R2 U' R' U' R U R' F'";
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
            <h1 className="text-lg font-black text-slate-900 tracking-tight">Thi Đấu Online Asynchronous</h1>
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
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-full border text-[11px] transition-all ${
                    isActive
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
          <p className="text-[11px] font-bold uppercase tracking-wider">Thời gian còn lại của attempt</p>
          <p className="font-mono text-2xl font-black">{formatRemaining(remainingMs)}</p>
          <p className="text-xs font-medium">Thời gian tính từ lúc Scramble Verified; hết giờ hệ thống tự đánh DNF.</p>
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
            Đóng
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
                className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold ${
                  isRecording ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-slate-100 text-slate-600'
                }`}
              >
                <span className={`h-2 w-2 rounded-full ${isRecording ? 'bg-red-500 animate-pulse' : 'bg-slate-400'}`} />
                {isRecording ? 'REC LIVE' : 'CAM READY'}
              </span>
            </div>

            {/* AI Scanner Panel in Compact Mode */}
            <div className="overflow-hidden rounded-2xl">
              <OnlineArenaScannerTestPanel
                key={step === 'FINISH_SCAN' ? 'finish-scan' : 'scramble-scan'}
                backendUrl=""
                requiredFaceCount={5}
                compact
                resetToken={scanResetToken}
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
                  Bước 1 / 5 • Scramble & AI Scan
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scramble & AI Scan Cube
                </h2>
                <p className="text-xs text-slate-500">
                  Xoay khối Rubik từ trạng thái Solved State theo đúng chuỗi Scramble dưới đây và đưa trước camera để AI tự động quét 5 mặt.
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
                    {copiedScramble ? 'Đã Copy' : 'Copy'}
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
                    <ShieldCheck className="h-4 w-4 text-indigo-600" /> Tự động xác minh Scramble
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${scanFaces.length === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {scanFaces.length} / 5 mặt
                  </span>
                </div>
                <p className="text-slate-600">
                  {scanFaces.length === 5
                    ? 'Đã nhận đủ 5 mặt. Hệ thống đang tự động xác minh scramble...'
                    : `Hãy lần lượt đưa 5 mặt Rubik khác màu trước camera. Sau khi AI nhận đủ 5 mặt, hệ thống sẽ tự động xác minh và chuyển sang Bước 2.`}
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
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang xác minh scramble...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Xác minh Scramble & Sang Bước 2
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
                  Bước 2 / 5 • Sẵn Sàng Giải Rubik
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Xác Minh Scramble Thành Công!
                </h2>
                <p className="text-xs text-slate-500">
                  Khối Rubik của bạn đã hợp lệ. Hãy đặt khối Rubik xuống bàn và chuẩn bị tư thế sẵn sàng giải.
                </p>
              </div>

              {/* Ready Status Card */}
              <div className="text-center p-8 bg-gradient-to-br from-emerald-50/60 via-white to-indigo-50/60 rounded-3xl border border-slate-200 space-y-3 shadow-sm">
                <div className="inline-flex items-center justify-center w-14 h-14 rounded-full bg-emerald-100 text-emerald-600 mb-1">
                  <CheckCircle className="h-8 w-8" />
                </div>
                <p className="text-lg font-black text-slate-900">
                  Đồng Hồ Đang Ở Trạng Thái Chờ (READY)
                </p>
                <p className="text-xs text-slate-600 max-w-md mx-auto font-medium leading-relaxed">
                  Thời gian giải <strong>CHƯA BẮT ĐẦU TÍNH</strong>. Bạn hoàn toàn làm chủ thời gian. Khi đã đặt Rubik xuống bàn và sẵn sàng, bấm nút bên dưới hoặc nhấn phím <kbd className="px-2 py-0.5 bg-slate-100 border border-slate-300 rounded font-mono font-bold text-slate-900">SPACE</kbd> để bắt đầu tính giờ giải.
                </p>
              </div>

              <div className="text-xs text-slate-600 bg-slate-50 p-4 rounded-2xl border border-slate-200 space-y-1.5">
                <p className="font-extrabold text-slate-900 flex items-center gap-1.5">
                  <Hand className="h-4 w-4 text-indigo-600" /> Hướng dẫn giải Rubik:
                </p>
                <ul className="list-disc pl-5 space-y-1 text-slate-500">
                  <li>Bấm nút <strong>"BẮT ĐẦU TÍNH GIỜ GIẢI"</strong> (hoặc nhấn <strong>SPACE</strong>) để đồng hồ chạy.</li>
                  <li>Giải Rubik thật nhanh (giới hạn tối đa 5 phút).</li>
                  <li>Giải xong → Nhấn phím <strong>SPACE</strong> (hoặc bấm Dừng) để chốt thời gian và sang Bước 4.</li>
                </ul>
              </div>

              <button
                onClick={() => void handleStartSolve()}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-600 via-teal-600 to-emerald-700 hover:brightness-105 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/25 transition cursor-pointer"
              >
                <Play className="h-5 w-5 fill-current" /> BẮT ĐẦU TÍNH GIỜ GIẢI (NHẤN SPACE HOẶC BẤM NÚT NÀY)
              </button>
            </div>
          )}

          {/* STEP 3: SOLVING TIMER */}
          {step === 'SOLVING' && (
            <div className="space-y-8 text-center my-auto">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Bước 3 / 5 • Solving In Progress
                </span>
                <h2 className="text-2xl font-black text-slate-900">SOLVING IN PROGRESS</h2>
                <p className="text-xs text-slate-500 font-medium">
                  Giải khối Rubik thật nhanh. Giới hạn tối đa: 5 phút.
                </p>
              </div>

              {/* Large Solve Timer */}
              <div className="p-8 bg-slate-900 rounded-3xl text-white shadow-xl border border-slate-800 space-y-2">
                <p className="text-xs text-slate-400 font-bold uppercase tracking-wider">Solve Timer</p>
                <p className="text-6xl sm:text-7xl font-mono font-black text-indigo-400 tracking-tight">
                  {(solveElapsedMs / 1000).toFixed(2)}s
                </p>
              </div>

              <p className="text-xs text-slate-500 font-semibold">
                Sau khi hoàn tất giải Rubik, nhấn phím <kbd className="px-2.5 py-1 bg-slate-200 text-slate-900 border border-slate-300 rounded font-mono font-bold">SPACE</kbd> hoặc nút bấm bên dưới để dừng đồng hồ.
              </p>

              <button
                onClick={() => void handleStopSolving(solveElapsedMs)}
                disabled={isProcessing}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 hover:bg-emerald-700 px-6 py-4 text-base font-black text-white shadow-lg shadow-emerald-600/20 transition cursor-pointer"
              >
                <Square className="h-5 w-5 fill-current" /> DỪNG TIMER & QUÉT CUBE ĐÃ GIẢI (SPACE)
              </button>
            </div>
          )}

          {/* STEP 4: FINISH SCAN SOLVED CUBE */}
          {step === 'FINISH_SCAN' && (
            <div className="space-y-6">
              <div className="space-y-1.5">
                <span className="inline-block px-3 py-1 bg-indigo-50 text-indigo-700 border border-indigo-100 rounded-full text-[11px] font-extrabold uppercase tracking-wider">
                  Bước 4 / 5 • Scan Solved Cube
                </span>
                <h2 className="text-xl sm:text-2xl font-black text-slate-900 tracking-tight">
                  Scan Solved Cube & Lưu Recording
                </h2>
                <p className="text-xs text-slate-500">
                  Đưa các mặt khối Rubik đã được giải hoàn chỉnh trước camera lần thứ 2 để AI xác nhận.
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
                    <ShieldCheck className="h-4 w-4 text-emerald-600" /> Tự động lưu video & kết quả
                  </span>
                  <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-black ${scanFaces.length === 5 ? 'bg-emerald-100 text-emerald-800' : 'bg-slate-200 text-slate-700'}`}>
                    {scanFaces.length} / 5 mặt
                  </span>
                </div>
                <p className="text-slate-600">
                  {scanFaces.length === 5
                    ? 'Đã nhận đủ 5 mặt. Hệ thống đang tự động dừng recording, upload video và xác minh kết quả...'
                    : `Hãy đưa 5 mặt Rubik đã giải xong trước camera. Khi đủ 5 mặt, hệ thống sẽ tự động lưu và chuyển sang Bước 5.`}
                </p>
              </div>

              <button
                onClick={() => void handleConfirmFinish()}
                disabled={isProcessing || scanFaces.length !== 5}
                className="w-full flex items-center justify-center gap-2 rounded-2xl bg-emerald-600 px-6 py-3.5 text-sm font-extrabold text-white shadow-md shadow-emerald-600/20 transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-40 cursor-pointer"
              >
                {isProcessing ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang xác minh cube & upload video...
                  </>
                ) : (
                  <>
                    <CheckCircle className="h-4 w-4" /> Xác minh 5 mặt & Hoàn tất Attempt
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
                  Bước 5 / 5 • {finalResult.isDnf ? 'Attempt DNF' : 'Hoàn Tất Attempt'}
                </span>
                <h2 className="text-2xl sm:text-3xl font-black text-slate-900">KẾT QUẢ ATTEMPT</h2>
                <p className="text-xs text-slate-500">
                  {finalResult.isDnf ? 'Attempt bị đánh DNF. Khung hình/Video đã bị hủy tự động và không lưu công khai.' : 'Kết quả hợp lệ đã được lưu và video evidence đang chờ Ban Tổ Chức review.'}
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
                <div className="rounded-3xl border border-slate-200 bg-slate-900 overflow-hidden shadow-lg p-3 space-y-2 text-left">
                  <div className="flex items-center justify-between px-2 py-1 text-xs text-white font-extrabold">
                    <span className="flex items-center gap-2">
                      <Video className="h-4 w-4 text-emerald-400" /> Xem Lại Video Thi Đấu Hợp Lệ
                    </span>
                    <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
                      READY FOR REVIEW
                    </span>
                  </div>
                  <video
                    controls
                    src={recordedVideoUrl}
                    className="w-full aspect-video rounded-2xl bg-black object-contain shadow-inner"
                  />
                  <div className="flex items-center justify-between px-2 pt-1 text-[11px] text-slate-400 font-medium">
                    <span>Lượt giải đã được tự động lưu video evidence.</span>
                    <a
                      href={recordedVideoUrl}
                      download={`attempt-${attemptId}.webm`}
                      className="text-indigo-400 font-bold hover:underline"
                    >
                      Tải video về
                    </a>
                  </div>
                </div>
              ) : finalResult.isDnf ? (
                <div className="rounded-2xl border border-rose-200 bg-rose-50/80 p-5 text-left space-y-2">
                  <div className="flex items-center gap-2 text-rose-800 font-extrabold text-sm">
                    <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
                    Lượt Thi Đấu Đạt Kết Quả DNF (Did Not Finish)
                  </div>
                  <p className="text-xs text-rose-700 leading-relaxed font-medium">
                    Theo quy định WCA & Online Arena, các lượt thi đấu bị đánh <strong>DNF</strong> (do quá giờ khởi động 14s, quá 5 phút giải hoặc không hoàn tất scan) sẽ <strong>tự động bị hủy video recording</strong> và không phát hành video công khai.
                  </p>
                </div>
              ) : null}

              <div className="p-3.5 bg-slate-50 rounded-2xl border border-slate-200 text-xs text-slate-600 font-medium">
                Thí sinh <strong>không cần bấm Submit</strong>. Kết quả đã được tự động ghi nhận an toàn trên hệ thống.
              </div>

              <button
                onClick={() => router.push(`/tournaments/${tournamentId}`)}
                className="w-full flex items-center justify-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-extrabold text-sm py-4 px-6 rounded-2xl shadow-lg transition cursor-pointer"
              >
                Trở Về Màn Hình Giải Đấu <ArrowRight className="h-4 w-4" />
              </button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
