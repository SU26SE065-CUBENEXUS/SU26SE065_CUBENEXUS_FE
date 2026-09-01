'use client';

import { useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  fetchScannerTestHealth,
  observeScannerTestFrame,
  resetScannerTestSession,
  retryScannerTestFace,
  startScannerTestSession,
} from '../api/onlineScannerTestApi';
import { useCameraStream } from '../camera/useCameraStream';
import { captureScannerSnapshot } from '../camera/scannerCamera';
import { runScannerBurst } from '../utils/scanBurstControl';
import { resolveBackendUrl } from '../utils/resolveBackendUrl';
import type {
  AiRubikHealthResponse,
  AiRubikScannerFace,
  AiRubikScannerPreviewResponse,
  AiRubikScannerSessionResponse,
} from '../types';
import { Play, RotateCcw, RefreshCw, StopCircle, CheckCircle, AlertTriangle } from 'lucide-react';

type Props = {
  backendUrl: string;
  onScanCompleted?: (session: AiRubikScannerSessionResponse) => void;
  requiredFaceCount?: 5 | 6;
  compact?: boolean;
  onCameraStreamChange?: (stream: MediaStream | null) => void;
  resetToken?: number;
  allowCameraStop?: boolean;
};

const CAPTURE_INTERVAL_MS = 220;
const MAX_SCAN_BURST_MS = 7500;  // 7.5s — đủ cho AI scan 1 mặt, không loop tự động nhiều lần

const COLOR_STYLE: Record<string, string> = {
  white: '#f8fafc',
  yellow: '#facc15',
  red: '#ef4444',
  orange: '#fb923c',
  blue: '#3b82f6',
  green: '#22c55e',
  unknown: '#4b5563', // gray-600
};

const COLOR_NAME_EN: Record<string, string> = {
  white: 'White',
  yellow: 'Yellow',
  red: 'Red',
  orange: 'Orange',
  blue: 'Blue',
  green: 'Green',
};

const UI_MESSAGE: Record<string, string> = {
  POSITION_FACE: 'Position 1 face in the center of the scan frame.',
  SCANNING: 'AI is analyzing current face. Please hold still.',
  STABLE: 'Cube face detected. Hold steady for stability check.',
  ACCEPTED: 'Face accepted. Rotate to a face with a different center color.',
  DUPLICATE_FACE: 'This face was already captured. Please switch to another face.',
  RETRY: 'Detection unstable. Adjust the Rubik cube and click Retry Face.',
  AI_BUSY: 'AI is busy. Please wait a moment and try again.',
  AI_UNAVAILABLE: 'AI service unavailable. Check connection and try again.',
  CAMERA_ERROR: 'Camera not ready. Please enable camera access.',
};

export const OnlineArenaScannerTestPanel = memo(function OnlineArenaScannerTestPanel({
  backendUrl: backendUrlProp,
  onScanCompleted,
  requiredFaceCount = 6,
  compact = false,
  onCameraStreamChange,
  resetToken,
  allowCameraStop = true,
}: Props) {
  const camera = useCameraStream();
  // Tự resolve URL trực tiếp: khi local → http://localhost:5212 (bypass Next.js proxy)
  // Khi prod → '' (relative URL qua Nginx)
  const backendUrl = useMemo(() => resolveBackendUrl(backendUrlProp), [backendUrlProp]);
  const [scanMode, setScanMode] = useState<'scramble' | 'finish'>('scramble');
  const [aiHealth, setAiHealth] = useState<AiRubikHealthResponse | null>(null);
  const [session, setSession] = useState<AiRubikScannerSessionResponse | null>(null);
  const [observation, setObservation] = useState<AiRubikScannerPreviewResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<AiRubikScannerPreviewResponse['scannerState'] | AiRubikScannerSessionResponse['scannerState']>('POSITION_FACE');
  const [statusMessage, setStatusMessage] = useState('Bấm Start Camera, sau đó Start Scan Session để test AI trực tiếp.');
  const [isCheckingHealth, setIsCheckingHealth] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(false);
  const [isScanningFace, setIsScanningFace] = useState(false);

  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const activeScanAbortRef = useRef<AbortController | null>(null);
  const activeScanIdentityRef = useRef<{ scanSessionId: string; scanGeneration: number; targetFaceIndex: number } | null>(null);
  const scanGenerationRef = useRef(0);

  // Periodic health check
  useEffect(() => {
    void refreshHealth();
    const timer = window.setInterval(() => void refreshHealth(), 15000);
    return () => {
      window.clearInterval(timer);
      abortActiveScan();
    };
  }, [backendUrl]);

  // Handle external resetToken trigger
  useEffect(() => {
    if (resetToken && resetToken > 0) {
      void resetSession();
    }
  }, [resetToken]);

  // Stop scanning if camera is stopped/disconnected
  useEffect(() => {
    if (camera.status !== 'ready') {
      abortActiveScan();
    }
  }, [camera.status]);

  useEffect(() => {
    onCameraStreamChange?.(camera.status === 'ready' ? camera.getStream() : null);
  }, [camera.status, onCameraStreamChange]);

  // Draw overlay outlines on video frame
  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    const video = camera.videoRef.current;
    if (!canvas || !video) {
      return;
    }

    canvas.width = video.videoWidth || 640;
    canvas.height = video.videoHeight || 480;
    const context = canvas.getContext('2d');
    if (!context) {
      return;
    }

    const width = canvas.width;
    const height = canvas.height;
    const inset = Math.round(Math.min(width, height) * 0.08);

    context.clearRect(0, 0, width, height);
    
    // Draw guide frame
    context.strokeStyle = 'rgba(249, 115, 22, 0.85)'; // Orange border
    context.lineWidth = 3;
    context.setLineDash([10, 8]);
    context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
    context.setLineDash([]);

    // Draw detected stickers
    observation?.stickers.forEach((sticker, index) => {
      const [x1, y1, x2, y2] = sticker.bbox;
      context.strokeStyle = '#facc15'; // yellow border for detected boxes
      context.lineWidth = 2;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      
      context.fillStyle = 'rgba(15, 23, 42, 0.85)';
      context.fillRect(x1, Math.max(0, y1 - 20), 108, 18);
      
      context.fillStyle = '#f8fafc';
      context.font = 'bold 11px sans-serif';
      const colorEn = COLOR_NAME_EN[sticker.color] || sticker.color;
      context.fillText(`${index + 1}. ${colorEn}`, x1 + 4, Math.max(12, y1 - 7));
    });
  }, [camera.videoRef, observation, session]);

  // Handle scan mode changes
  useEffect(() => {
    abortActiveScan();
    setSession(null);
    setObservation(null);
    setError(null);
    setScannerState('POSITION_FACE');
    setStatusMessage(`Đang ở chế độ ${scanMode === 'scramble' ? 'Scramble' : 'Finish'}. Bấm Start Scan Session để bắt đầu.`);
  }, [scanMode]);

  async function refreshHealth() {
    setIsCheckingHealth(true);
    try {
      setAiHealth(await fetchScannerTestHealth(backendUrl));
      setError(null);
    } catch (err) {
      setAiHealth(null);
      setError(err instanceof Error ? err.message : String(err));
    } finally {
      setIsCheckingHealth(false);
    }
  }

  async function startScanSession() {
    abortActiveScan();
    setIsPreparingSession(true);
    try {
      const created = await startScannerTestSession(backendUrl);
      scanGenerationRef.current = created.scanGeneration;
      setSession(created);
      setObservation(null);
      setScannerState(created.scannerState);
      setStatusMessage('Session đã sẵn sàng. Giữ một mặt ổn định rồi bấm Scan / Accept Next Face.');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
      setScannerState('AI_UNAVAILABLE');
      setStatusMessage(UI_MESSAGE.AI_UNAVAILABLE);
    } finally {
      setIsPreparingSession(false);
    }
  }

  async function scanCurrentFace() {
    if (camera.status !== 'ready') {
      setError('Hãy bật camera trước khi scan.');
      setScannerState('CAMERA_ERROR');
      setStatusMessage(UI_MESSAGE.CAMERA_ERROR);
      return;
    }

    const currentSession = session ?? await startScannerTestSession(backendUrl);
    if (!session) {
      scanGenerationRef.current = currentSession.scanGeneration;
      setSession(currentSession);
    }

    const targetFaceIndex = currentSession.requestedFaceIndex;
    const scanGeneration = currentSession.scanGeneration;
    scanGenerationRef.current = scanGeneration;
    
    const scanIdentity = {
      scanSessionId: currentSession.sessionId,
      scanGeneration,
      targetFaceIndex,
    };

    abortActiveScan();
    const abortController = new AbortController();
    activeScanAbortRef.current = abortController;
    activeScanIdentityRef.current = scanIdentity;
    
    setIsScanningFace(true);
    setObservation(null);
    setScannerState('SCANNING');
    setStatusMessage(`Đang scan ${currentSession.requestedFaceLabel}. Giữ yên cube để AI khóa mặt.`);
    setError(null);

    try {
      const result = await runScannerBurst({
        capture: captureSnapshot,
        observe: async (snapshot) => observeScannerTestFrame({
          backendUrl,
          sessionId: currentSession.sessionId,
          snapshot,
          ...scanIdentity,
          requestId: createRequestId(),
          signal: abortController.signal,
        }),
        onObservation: (nextObservation) => {
          if (!isObservationCurrent(nextObservation, scanIdentity)) {
            return;
          }

          setObservation(nextObservation);
          setScannerState(nextObservation.scannerState);
          setStatusMessage(nextObservation.reason || UI_MESSAGE[nextObservation.scannerState]);

          if (nextObservation.scannerState === 'ACCEPTED') {
            setSession((current) => {
              const updated = applyAcceptedObservation(current, nextObservation, scanIdentity.scanGeneration, requiredFaceCount);
              if (updated && (updated.status === 'COMPLETED' || updated.capturedFaceCount >= requiredFaceCount) && onScanCompleted) {
                const sessionToPass = updated;
                queueMicrotask(() => {
                  onScanCompleted(sessionToPass);
                });
              }
              return updated;
            });
          }
        },
        shouldStop: (nextObservation) => (
          nextObservation.scannerState === 'ACCEPTED'
          || nextObservation.scannerState === 'DUPLICATE_FACE'
          || nextObservation.scannerState === 'RETRY'
          || nextObservation.scannerState === 'AI_UNAVAILABLE'
          || nextObservation.scannerState === 'CAMERA_ERROR'
        ),
        shouldAbort: () => abortController.signal.aborted,
        maxBurstMs: MAX_SCAN_BURST_MS,
        sampleIntervalMs: CAPTURE_INTERVAL_MS,
        delay,
        now: () => performance.now(),
      });

      if (result.reason === 'timeout' && !abortController.signal.aborted) {
        setScannerState('RETRY');
        setStatusMessage('AI chưa đủ frame ổn định. Giữ thẳng hơn, bớt chói sáng, rồi bấm scan lại.');
      }
    } catch (err) {
      if (abortController.signal.aborted) {
        return;
      }

      setError(err instanceof Error ? err.message : String(err));
      setScannerState('AI_UNAVAILABLE');
      setStatusMessage(UI_MESSAGE.AI_UNAVAILABLE);
    } finally {
      if (activeScanAbortRef.current === abortController) {
        activeScanAbortRef.current = null;
      }
      if (activeScanIdentityRef.current?.scanGeneration === scanIdentity.scanGeneration) {
        activeScanIdentityRef.current = null;
      }
      setIsScanningFace(false);
    }
  }

  async function retryFace() {
    abortActiveScan();
    if (!session) {
      return;
    }

    try {
      const updated = await retryScannerTestFace({ backendUrl, sessionId: session.sessionId });
      scanGenerationRef.current = updated.scanGeneration;
      setSession(updated);
      setObservation(null);
      setScannerState(updated.scannerState);
      setStatusMessage('Đã xóa trạng thái mặt hiện tại. Canh lại đúng mặt đó rồi scan tiếp.');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  async function resetSession() {
    abortActiveScan();
    if (!session) {
      await startScanSession();
      return;
    }

    try {
      const updated = await resetScannerTestSession({ backendUrl, sessionId: session.sessionId });
      scanGenerationRef.current = updated.scanGeneration;
      setSession(updated);
      setObservation(null);
      setScannerState(updated.scannerState);
      setStatusMessage('Session đã reset. Bạn có thể scan lại từ đầu ngay bây giờ.');
      setError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err));
    }
  }

  function abortActiveScan() {
    activeScanAbortRef.current?.abort();
    activeScanAbortRef.current = null;
    activeScanIdentityRef.current = null;
    setIsScanningFace(false);
  }

  async function captureSnapshot(): Promise<Blob> {
    const video = camera.videoRef.current;
    if (!video) {
      throw new Error('Camera preview is not ready.');
    }
    return captureScannerSnapshot(video, captureCanvasRef);
  }

  const faceSlots = session?.faces ?? [];
  const observedCenterText = observation?.centerColor ? observation.centerColor.toUpperCase() : '-';
  const remainingCenters = getRemainingCenterColors(session).map(capitalize);
  const progressText = `${session?.capturedFaceCount ?? 0} / ${requiredFaceCount}`;
  const stableText = observation ? `${observation.stableObservationCount} / ${observation.requiredStableObservations}` : '0 / 3';

  if (compact) {
    const isComplete = session?.status === 'COMPLETED';
    return (
      <section className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm">
        <div className="mb-3 flex items-center justify-between">
          <div>
            <p className="text-sm font-bold text-slate-900">Quét cube với AI</p>
            <p className="text-xs text-slate-500">Quét lần lượt {requiredFaceCount} mặt có tâm màu khác nhau.</p>
          </div>
          <span className={`rounded-full px-3 py-1 text-xs font-bold ${isComplete ? 'bg-emerald-100 text-emerald-700' : 'bg-indigo-50 text-indigo-700'}`}>{progressText}</span>
        </div>
        <div className="relative mb-3 aspect-video overflow-hidden rounded-xl bg-slate-950">
          <video ref={camera.videoRef} muted playsInline className="h-full w-full object-cover" />
          <canvas ref={overlayCanvasRef} className="pointer-events-none absolute inset-0 h-full w-full object-cover" />
          <span className="absolute left-3 top-3 rounded-full bg-slate-900/75 px-2.5 py-1 text-[11px] font-bold text-white">{camera.status === 'ready' ? 'CAMERA READY' : 'CAMERA OFF'}</span>
        </div>
        {(camera.error || error) && <p className="mb-3 rounded-lg bg-red-50 p-2 text-xs font-medium text-red-700">{camera.error || error}</p>}
        <p className="mb-3 rounded-lg bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-800">{statusMessage}</p>
        <button onClick={() => void scanCurrentFace()} disabled={camera.status !== 'ready' || isScanningFace || isPreparingSession || isComplete} className="flex w-full items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition hover:brightness-105 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer">
          {isScanningFace ? 'Scanning... Hold Still' : isComplete ? 'All Faces Captured' : 'Scan / Accept Next Face'}
        </button>
        <div className="mt-2 grid grid-cols-2 gap-2.5">
          <button onClick={camera.start} disabled={camera.status === 'starting' || isScanningFace} className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">Start Camera</button>
          <button onClick={() => void startScanSession()} disabled={isPreparingSession || isScanningFace} className="rounded-xl border border-emerald-200 bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-700 hover:bg-emerald-100 disabled:opacity-50 cursor-pointer">{isPreparingSession ? 'Preparing...' : 'Start Session'}</button>
          <button onClick={() => void retryFace()} disabled={!session || isScanningFace || isComplete} className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">Retry Face</button>
          <button onClick={() => void resetSession()} disabled={isScanningFace} className="rounded-xl border border-slate-200 bg-white px-3.5 py-3 text-xs font-bold text-slate-700 hover:bg-slate-50 disabled:opacity-50 cursor-pointer">Reset Session</button>
          <button
            onClick={() => {
              if (!allowCameraStop) return;
              abortActiveScan();
              camera.stop();
              onCameraStreamChange?.(null);
            }}
            disabled={!allowCameraStop}
            className="col-span-2 rounded-xl border border-rose-200 bg-rose-50 px-3.5 py-3 text-xs font-bold text-rose-700 hover:bg-rose-100 disabled:cursor-not-allowed disabled:opacity-50 cursor-pointer"
          >
            {allowCameraStop ? 'Stop Camera' : 'Camera phải bật trong suốt lượt thi'}
          </button>
        </div>

        <div className="mt-3 space-y-2">
          <div className="flex items-center justify-between text-[11px] font-bold">
            <span className="text-slate-500">Remaining center colors:</span>
            <span className="text-indigo-600 font-extrabold">
              {remainingCenters.length ? remainingCenters.map(c => COLOR_NAME_EN[c.toLowerCase()] || c).join(', ') : 'All faces scanned'}
            </span>
          </div>

          <div className="grid grid-cols-5 gap-1.5">
            {Array.from({ length: requiredFaceCount }).map((_, index) => {
              const face = faceSlots[index];
              const active = session?.requestedFaceIndex === index + 1;
              const centerEn = face?.centerColor ? COLOR_NAME_EN[face.centerColor.toLowerCase()] || face.centerColor : null;
              return (
                <div
                  key={index}
                  className={`rounded-xl border p-1.5 flex flex-col items-center gap-1 transition-all ${
                    face
                      ? 'border-emerald-300 bg-emerald-50/80 text-emerald-800'
                      : active
                      ? 'border-indigo-400 bg-indigo-50/80 text-indigo-700 ring-2 ring-indigo-400/30'
                      : 'border-slate-200 bg-slate-50 text-slate-400'
                  }`}
                >
                  <div className="text-[10px] font-extrabold truncate max-w-full text-center">
                    {face ? (
                      <span className="flex items-center justify-center gap-0.5">
                        <span
                          className="w-2 h-2 rounded-full inline-block border border-black/20 shrink-0"
                          style={{ backgroundColor: COLOR_STYLE[face.centerColor.toLowerCase()] || COLOR_STYLE.unknown }}
                        />
                        <span className="truncate">{centerEn}</span>
                      </span>
                    ) : (
                      `Face ${index + 1}`
                    )}
                  </div>

                  {/* Mini 3x3 Grid */}
                  <div className="grid grid-cols-3 gap-[1px] w-full max-w-[36px] aspect-square bg-slate-300 p-[1px] rounded border border-slate-300">
                    {Array.from({ length: 9 }).map((_, cellIndex) => {
                      const color = face?.grid3x3?.[Math.floor(cellIndex / 3)]?.[cellIndex % 3] ?? 'unknown';
                      return (
                        <span
                          key={cellIndex}
                          className="w-full aspect-square rounded-[0.5px]"
                          style={{ background: COLOR_STYLE[color] ?? COLOR_STYLE.unknown }}
                        />
                      );
                    })}
                  </div>

                  <span className="text-[9px] font-black">
                    {face ? '✓' : active ? 'Active' : 'Pending'}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      </section>
    );
  }

  return (
    <div className="grid grid-cols-1 lg:grid-cols-[1.1fr_0.9fr] gap-6 items-start">
      {/* LEFT COLUMN: CAMERA AND STREAM SCREEN */}
      <div className="flex flex-col gap-4">
        {/* Premium Status Header */}
        <div className="grid grid-cols-2 gap-3 bg-zinc-900/50 backdrop-blur-md border border-zinc-800/80 p-3 rounded-xl text-xs font-mono">
          <div className="flex items-center justify-between bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-wider">Observed Center</span>
            <strong className="text-white text-xs font-black flex items-center gap-1.5">
              <span
                className="w-2.5 h-2.5 rounded-full inline-block border border-black/40"
                style={{ backgroundColor: COLOR_STYLE[observedCenterText.toLowerCase()] || COLOR_STYLE.unknown }}
              />
              {observedCenterText || 'WAITING'}
            </strong>
          </div>
          <div className="flex items-center justify-between bg-zinc-950/60 p-2.5 rounded-lg border border-zinc-800/60">
            <span className="text-zinc-500 font-bold text-[9px] uppercase tracking-wider">Target Face</span>
            <strong className="text-orange-500 text-xs font-black">
              {session ? session.requestedFaceLabel : 'Face 1 of 6'}
            </strong>
          </div>
        </div>

        <div className="relative overflow-hidden bg-zinc-950 border border-zinc-800 rounded-2xl aspect-[4/3] w-full shadow-2xl glow-border-orange">
          <video
            ref={camera.videoRef}
            muted
            playsInline
            className="absolute inset-0 w-full h-full object-cover"
          />
          <canvas
            ref={overlayCanvasRef}
            className="absolute inset-0 w-full h-full pointer-events-none z-10 object-cover"
          />
        </div>

        {/* Action Status Message Alert */}
        <div className="p-4 rounded-xl border border-orange-500/20 bg-orange-500/5 text-zinc-300 text-xs font-bold leading-relaxed flex items-start gap-2.5">
          <div className="w-1.5 h-1.5 rounded-full bg-orange-500 mt-1.5 animate-pulse" />
          <div>{statusMessage}</div>
        </div>
      </div>

      {/* RIGHT COLUMN: CONTROLS AND DETAILS */}
      <div className="flex flex-col gap-6 bg-zinc-900/30 border border-zinc-800/80 p-6 rounded-2xl shadow-xl">
        <header className="space-y-1">
          <h2 className="text-xl font-black text-white uppercase tracking-wider">OnlineArena AI Scanner Test</h2>
          <p className="text-zinc-400 text-xs">
            Phiên bản sandbox này bỏ qua match và JWT để bạn test luồng AI hoàn chỉnh trước.
          </p>
        </header>

        {/* SCAN MODE BUTTONS */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-1.5 rounded-xl border border-zinc-800">
          <button
            type="button"
            className={`py-2 px-3 text-xs font-black uppercase rounded-lg tracking-wider transition-all duration-200 ${
              scanMode === 'scramble'
                ? 'bg-zinc-800 text-orange-500 border border-orange-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setScanMode('scramble')}
          >
            Scramble Mode
          </button>
          <button
            type="button"
            className={`py-2 px-3 text-xs font-black uppercase rounded-lg tracking-wider transition-all duration-200 ${
              scanMode === 'finish'
                ? 'bg-zinc-800 text-orange-500 border border-orange-500/30'
                : 'text-zinc-500 hover:text-zinc-300'
            }`}
            onClick={() => setScanMode('finish')}
          >
            Finish Mode
          </button>
        </div>

        {/* API / DEVICE STATUS */}
        <div className="grid grid-cols-3 gap-2 bg-zinc-950/60 p-3 rounded-xl border border-zinc-800/80 text-[10px] uppercase font-mono tracking-wider font-bold">
          <div className="flex flex-col">
            <span className="text-zinc-600">Camera</span>
            <span className={`text-xs font-black ${camera.status === 'ready' ? 'text-green-400' : 'text-zinc-400'}`}>
              {camera.status}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-600">AI Health</span>
            <span className={`text-xs font-black ${aiHealth?.status === 'healthy' ? 'text-green-400' : 'text-rose-400'}`}>
              {aiHealth?.status ?? 'unknown'}
            </span>
          </div>
          <div className="flex flex-col">
            <span className="text-zinc-600">Model</span>
            <span className="text-xs font-black text-white truncate max-w-full">
              {aiHealth?.modelVersion ?? '-'}
            </span>
          </div>
        </div>

        {camera.error && <p className="text-rose-500 text-xs font-bold font-mono">Camera: {camera.error}</p>}
        {error && <p className="text-rose-500 text-xs font-bold font-mono">Error: {error}</p>}

        {/* OPERATIONS CONTROL ROW */}
        <div className="flex flex-col gap-2">
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={camera.start}
              disabled={camera.status === 'starting' || isScanningFace}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-black uppercase bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <Play className="w-3.5 h-3.5" /> Start Camera
            </button>
            <button
              onClick={() => void startScanSession()}
              disabled={isPreparingSession || isScanningFace}
              className="flex items-center justify-center gap-1.5 py-2.5 px-4 text-xs font-black uppercase bg-zinc-800 hover:bg-zinc-700 text-white rounded-xl border border-zinc-700 disabled:opacity-40 disabled:cursor-not-allowed transition-all duration-200"
            >
              <RefreshCw className="w-3.5 h-3.5" /> Start Scan Session
            </button>
          </div>

          <button
            onClick={() => void scanCurrentFace()}
            disabled={camera.status !== 'ready' || isScanningFace || isPreparingSession}
            className="flex items-center justify-center gap-2 py-3 px-6 text-sm font-black uppercase bg-orange-500 hover:bg-orange-600 text-black rounded-xl disabled:opacity-40 disabled:cursor-not-allowed shadow-[0_4px_12px_rgba(249,115,22,0.2)] transition-all duration-200"
          >
            {isScanningFace ? (
              <>
                <span className="w-4 h-4 border-2 border-black border-t-transparent rounded-full animate-spin" />
                Scanning...
              </>
            ) : (
              'Scan / Accept Next Face'
            )}
          </button>

          <div className="grid grid-cols-3 gap-2 mt-1">
            <button
              onClick={() => void retryFace()}
              disabled={!session || isScanningFace}
              className="py-2 px-3 text-[10px] font-black uppercase bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 disabled:opacity-40 transition-all"
            >
              Retry Face
            </button>
            <button
              onClick={() => void resetSession()}
              disabled={isScanningFace}
              className="py-2 px-3 text-[10px] font-black uppercase bg-zinc-800/50 hover:bg-zinc-800 text-zinc-300 rounded-lg border border-zinc-800 disabled:opacity-40 transition-all"
            >
              Reset Session
            </button>
            <button
              onClick={() => {
                if (!allowCameraStop) return;
                abortActiveScan();
                camera.stop();
              }}
              disabled={!allowCameraStop}
              className="py-2 px-3 text-[10px] font-black uppercase bg-rose-950/20 hover:bg-rose-950/40 text-rose-400 border border-rose-900/30 rounded-lg transition-all disabled:cursor-not-allowed disabled:opacity-40"
            >
              {allowCameraStop ? 'Stop Camera' : 'Camera Locked'}
            </button>
          </div>
        </div>

        {/* RUNTIME SCANNING METRICS */}
        <div className="grid grid-cols-2 gap-2 bg-zinc-950 p-4 rounded-xl border border-zinc-800/80 font-mono text-xs text-zinc-400">
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">Stability Check</span>
            <strong className="text-white text-sm font-black">{stableText} Matches</strong>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">AI Infer Time</span>
            <strong className="text-white text-sm font-black">
              {observation ? `${observation.inferMs.toFixed(0)} ms` : '-'}
            </strong>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">State</span>
            <strong className="text-orange-500 font-black">{scannerState}</strong>
          </div>
          <div className="flex flex-col gap-1">
            <span className="text-[10px] text-zinc-600 font-bold uppercase">Stickers</span>
            <strong className="text-white text-sm font-black">
              {observation?.detectedStickers ?? 0} / 9
            </strong>
          </div>
        </div>

        {/* REMAINING COLORS INFO BOX */}
        <div className="p-4 bg-zinc-950 rounded-xl border border-zinc-800 flex flex-col gap-2">
          <div className="flex justify-between items-center text-xs font-bold border-b border-zinc-800 pb-2">
            <span className="text-zinc-400 font-mono">Remaining Colors</span>
            <span className="text-orange-500 font-mono">
              {remainingCenters.length ? `${remainingCenters.length} left` : 'Completed'}
            </span>
          </div>
          <p className="text-xs text-white font-mono uppercase tracking-wide">
            {remainingCenters.length ? remainingCenters.join(', ') : 'All 6 center colors captured.'}
          </p>
          <p className="text-[10px] text-zinc-500 leading-normal">
            Chế độ test này không ép mặt đơn sắc. Chỉ cần AI thấy đủ 9 stickers và tâm màu chưa bị trùng là có thể nhận mặt.
          </p>
        </div>

        {/* CAPTURED FACE SLOTS */}
        <div className="grid grid-cols-3 gap-2">
          {Array.from({ length: 6 }).map((_, index) => (
            <FaceSlot
              key={index}
              index={index}
              face={faceSlots[index]}
              active={session?.requestedFaceIndex === index + 1}
            />
          ))}
        </div>

        {/* RAW JSON SESSION DUMP */}
        {session ? (
          <div className="border border-zinc-800 rounded-xl bg-zinc-950 p-4 font-mono text-[10px]">
            <header className="flex justify-between items-center border-b border-zinc-800 pb-2 mb-2 text-zinc-500 font-bold">
              <span>{session.status}</span>
              <span>{new Date(session.startedAt).toLocaleTimeString()}</span>
            </header>
            <pre className="max-h-[160px] overflow-auto text-zinc-400 scrollbar-thin">
              {JSON.stringify(session, null, 2)}
            </pre>
          </div>
        ) : null}
      </div>
    </div>
  );
});

function FaceSlot({ index, face, active }: { index: number; face?: AiRubikScannerFace; active: boolean }) {
  return (
    <article
      className={`p-2.5 rounded-xl bg-zinc-950 border flex flex-col gap-2 transition-all ${
        active ? 'border-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.15)]' : 'border-zinc-800'
      }`}
    >
      <header className="flex justify-between items-center text-[10px] font-bold text-zinc-500 font-mono">
        <span>F{index + 1}</span>
        <span className="uppercase text-white truncate max-w-[50px]">
          {face?.centerColor ? COLOR_NAME_EN[face.centerColor.toLowerCase()] || face.centerColor : 'pending'}
        </span>
      </header>
      <div className="grid grid-cols-3 gap-0.5 max-w-[48px] w-full mx-auto aspect-square bg-zinc-900 p-0.5 rounded border border-zinc-800">
        {Array.from({ length: 9 }).map((_, cellIndex) => {
          const color = face?.grid3x3?.[Math.floor(cellIndex / 3)]?.[cellIndex % 3] ?? 'unknown';
          return (
            <span
              key={cellIndex}
              className="w-full aspect-square rounded-[1px] border border-black/20"
              style={{ background: COLOR_STYLE[color] ?? COLOR_STYLE.unknown }}
            />
          );
        })}
      </div>
    </article>
  );
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

function createRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

function isObservationCurrent(
  observation: AiRubikScannerPreviewResponse,
  expected: { scanSessionId: string; scanGeneration: number; targetFaceIndex: number },
) {
  return observation.scanSessionId === expected.scanSessionId
    && observation.scanGeneration === expected.scanGeneration
    && observation.targetFaceIndex === expected.targetFaceIndex;
}

function applyAcceptedObservation(
  current: AiRubikScannerSessionResponse | null,
  observation: AiRubikScannerPreviewResponse,
  scanGeneration: number,
  requiredFaceCount: number = 6,
): AiRubikScannerSessionResponse | null {
  if (
    !current
    || !observation.grid3x3
    || !observation.centerColor
    || observation.scanSessionId !== current.sessionId
    || observation.targetFaceIndex !== current.requestedFaceIndex
  ) {
    return current;
  }

  const face: AiRubikScannerFace = {
    centerColor: observation.centerColor,
    grid3x3: observation.grid3x3,
    stickers: observation.stickers,
    overallConfidence: observation.confidence,
    validFrames: observation.requiredStableObservations,
    capturedAt: new Date().toISOString(),
  };

  const nextFaces = [...current.faces];
  nextFaces[observation.targetFaceIndex - 1] = face;
  const faces = nextFaces.slice(0, requiredFaceCount);
  const rawStickerState = faces.flatMap((savedFace) => savedFace.grid3x3.flat());
  const capturedFaceCount = faces.length;
  const completed = capturedFaceCount >= requiredFaceCount;

  return {
    ...current,
    scanGeneration,
    faces,
    capturedFaceCount,
    rawStickerCount: rawStickerState.length,
    rawStickerState,
    lastFaceScan: face,
    lastScanStatus: 'ACCEPTED',
    lastScanReason: null,
    scannerState: 'ACCEPTED',
    requestedFaceIndex: Math.min(capturedFaceCount + 1, requiredFaceCount),
    requestedFaceLabel: `Face ${Math.min(capturedFaceCount + 1, requiredFaceCount)} of ${requiredFaceCount}`,
    status: completed ? 'COMPLETED' : current.status,
    message: completed ? `${requiredFaceCount}-face scan completed.` : 'Face accepted. Rotate to a different center color.',
    completedAt: completed ? new Date().toISOString() : current.completedAt,
  };
}

function getRemainingCenterColors(session: AiRubikScannerSessionResponse | null) {
  const allCenters = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
  const captured = new Set((session?.faces ?? []).map((face) => face.centerColor.toLowerCase()));
  return allCenters.filter((color) => !captured.has(color));
}

function capitalize(value: string) {
  return value ? `${value[0].toUpperCase()}${value.slice(1)}` : value;
}
