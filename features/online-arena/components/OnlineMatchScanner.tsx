'use client';

import React, { useEffect, useMemo, useRef, useState, memo } from 'react';
import {
  startScanner,
  getScannerSession,
  retryScannerFace,
  resetScanner,
  completeScannerSession,
  submitScrambleBatch,
} from '../api/onlineArenaApi';
import { observeScannerTestFrame, resetScannerTestSession } from '../../rubik-scanner-test/api/onlineScannerTestApi';
import { resolveBackendUrl } from '../../rubik-scanner-test/utils/resolveBackendUrl';
import { RefreshCw, AlertTriangle, Loader2, Play, Camera, Square, FolderOpen, RotateCcw } from 'lucide-react';

interface OnlineMatchScannerProps {
  matchId: string;
  validationType: 'SCRAMBLE' | 'FINISH';
  onSuccess?: (data: any) => void;
}

export interface ScannerAcceptedFaceDto {
  faceIndex: number;
  faceCode: string;
  expectedCenterColor: string;
  observedCenterColor?: string | null;
  grid3x3?: string[][] | null;
  acceptedAt: string;
}

export interface ScannerStickerDto {
  color: string;
  confidence: number;
  bbox: number[];
}

export interface CubeScanStickerMismatchDto {
  face: string;
  row: number;
  column: number;
  expected: string;
  observed: string;
}

export interface ScannerValidationDto {
  status: string;
  matched: boolean;
  matchedStickerCount: number;
  mismatchedStickerCount: number;
  playerStatus: string;
  mismatches: CubeScanStickerMismatchDto[];
}

export interface ScannerSessionDto {
  message: string;
  matchId: string;
  playerId: string;
  validationType: string;
  scanSessionId: string;
  aiSessionId: string;
  scanGeneration: number;
  scanStatus: string;
  scannerState: string;
  matchStatus: string;
  requestedFaceIndex: number;
  requestedFaceCode: string;
  requestedFaceLabel: string;
  requestedCenterColor: string;
  capturedFaceCount: number;
  requestId?: string | null;
  stableObservationCount: number;
  requiredStableObservations: number;
  detectedStickers: number;
  confidence: number;
  inferMs: number;
  decodeMs: number;
  preprocessMs: number;
  postprocessMs: number;
  totalMs: number;
  modelVersion: string;
  reason?: string | null;
  observedCenterColor?: string | null;
  grid3x3?: string[][] | null;
  stickers: ScannerStickerDto[];
  faces: ScannerAcceptedFaceDto[];
  validation?: ScannerValidationDto | null;
}

interface ScannerPreviewDto {
  scannerState: string;
  stableObservationCount: number;
  requiredStableObservations: number;
  detectedStickers: number;
  inferMs: number;
  modelVersion: string;
  reason?: string | null;
  observedCenterColor?: string | null;
  stickers: ScannerStickerDto[];
}

interface ScannerObservationDto {
  status: string;
  scannerState: string;
  scanSessionId: string;
  scanGeneration: number;
  requestId?: string | null;
  targetFaceIndex: number;
  requestedFaceIndex: number;
  requestedFaceLabel: string;
  centerColor?: string | null;
  grid3x3?: string[][] | null;
  stickers: ScannerStickerDto[];
  detectedStickers: number;
  confidence: number;
  inferMs: number;
  decodeMs: number;
  preprocessMs: number;
  postprocessMs: number;
  totalMs: number;
  stableObservationCount: number;
  requiredStableObservations: number;
  modelVersion: string;
  reason?: string | null;
}

const SLOT_FACE_CODES = ['U', 'R', 'F', 'D', 'L', 'B'];

const COLOR_STYLE: Record<string, string> = {
  white: '#f8fafc',
  yellow: '#facc15',
  red: '#ef4444',
  orange: '#fb923c',
  blue: '#3b82f6',
  green: '#22c55e',
  unknown: '#27272a',
};

const UI_MESSAGE: Record<string, string> = {
  POSITION_FACE: 'Show one full cube face inside the guide. In scramble mode, any unscanned center color is valid.',
  SCANNING: 'Keep all 9 stickers inside the guide and hold still.',
  STABLE: 'AI is tracking the face. Keep holding steady.',
  ACCEPTED: 'Face accepted. Rotate to the next face.',
  DUPLICATE_FACE: 'This center color has already been scanned. Rotate to an unscanned face.',
  RETRY: 'Detection unstable. Adjust the cube position and click Scan / Accept Next Face to try again.',
  AI_BUSY: 'AI service is currently busy. Please wait a moment.',
  AI_UNAVAILABLE: 'AI service is unavailable. Please check the backend connection.',
  CAMERA_ERROR: 'Unable to read camera frame. Restart camera and retry.',
};

// ─── Stability Progress Bar ─────────────────────────────────────────────────
function StabilityBar({
  stable,
  required,
  detectedStickers,
  isScanning,
}: {
  stable: number;
  required: number;
  detectedStickers: number;
  isScanning: boolean;
}) {
  if (!isScanning) return null;

  const pct = Math.min(100, Math.round((stable / Math.max(required, 1)) * 100));
  const missingStickers = detectedStickers > 0 && detectedStickers < 9;
  const noStickers = isScanning && detectedStickers === 0;

  return (
    <div className="space-y-1.5">
      {/* Stability label + count */}
      <div className="flex items-center justify-between text-[10px] font-bold">
        <span className="text-zinc-400 uppercase tracking-widest">Stability</span>
        <span
          className={`font-mono font-black ${stable >= required ? 'text-emerald-400' : stable > 0 ? 'text-orange-400' : 'text-zinc-500'
            }`}
        >
          {stable} / {required}
        </span>
      </div>

      {/* Progress bar */}
      <div className="h-2 w-full rounded-full bg-zinc-800 overflow-hidden">
        <div
          className={`h-full rounded-full transition-all duration-200 ${stable >= required ? 'bg-emerald-500' : stable > 0 ? 'bg-orange-500' : 'bg-zinc-600'
            }`}
          style={{ width: `${pct}%` }}
        />
      </div>

      {/* Dot indicators */}
      <div className="flex gap-1.5">
        {Array.from({ length: required }).map((_, i) => (
          <div
            key={i}
            className={`h-2 flex-1 rounded-full transition-all duration-150 ${i < stable
                ? stable >= required
                  ? 'bg-emerald-500'
                  : 'bg-orange-500'
                : 'bg-zinc-700'
              }`}
          />
        ))}
      </div>

      {/* Warnings */}
      {missingStickers && (
        <div className="flex items-center gap-1.5 rounded-xl border border-yellow-500/30 bg-yellow-500/10 px-3 py-1.5">
          <AlertTriangle className="h-3 w-3 text-yellow-400 shrink-0" />
          <span className="text-[10px] font-bold text-yellow-300">
            Chỉ thấy {detectedStickers}/9 sticker — nhích nhẹ khối Rubik hoặc giảm chói sáng
          </span>
        </div>
      )}
      {noStickers && (
        <div className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-1.5">
          <AlertTriangle className="h-3 w-3 text-rose-400 shrink-0" />
          <span className="text-[10px] font-bold text-rose-300">
            AI chưa thấy mặt nào — đặt toàn bộ 9 ô vào trong khung viền cam
          </span>
        </div>
      )}
    </div>
  );
}

const OVERLAY_INSET_RATIO = 0.08;
const SNAPSHOT_MAX_WIDTH = 800;
const SNAPSHOT_QUALITY = 0.82;
const MAX_SCAN_BURST_MS = 7500;  // 7.5s — đủ cho AI scan 1 mặt, không tự động loop kéo dài
const CAPTURE_INTERVAL_MS = 220;
// RETRY cũng là terminal — burst dừng ngay, không tự retry liên tục
const TERMINAL_SCANNER_STATES = new Set(['ACCEPTED', 'DUPLICATE_FACE', 'RETRY', 'AI_UNAVAILABLE', 'CAMERA_ERROR']);

function createRequestId() {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }

  return `req-${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
}

// buildScannerRequestFormData removed — observe calls now go directly to Python AI service
// via the C# Dev proxy (same as Sandbox), bypassing the production match proxy entirely.

/**
 * Update session state ngay tại client khi nhận ACCEPTED observation.
 * Không cần chờ commitScannerObservation round-trip để hiển thị face slot.
 * Port từ applyAcceptedObservation() trong test-client-vite.
 */
function applyAcceptedObservationClientSide(
  current: ScannerSessionDto | null,
  observation: ScannerObservationDto,
  targetCount: number = 6,
): ScannerSessionDto | null {
  if (
    !current
    || !observation.grid3x3
    || !observation.centerColor
    || observation.targetFaceIndex !== current.requestedFaceIndex
  ) {
    return current;
  }

  const newFace: ScannerAcceptedFaceDto = {
    faceIndex: observation.targetFaceIndex,
    faceCode: current.requestedFaceCode,
    expectedCenterColor: current.requestedCenterColor,
    observedCenterColor: observation.centerColor,
    grid3x3: observation.grid3x3,
    acceptedAt: new Date().toISOString(),
  };

  // Check if face with same center color already exists
  const existingByCenter = current.faces.findIndex(
    (f) => (f.observedCenterColor || '').toLowerCase() === observation.centerColor!.toLowerCase()
  );

  const nextFaces = [...current.faces];
  if (existingByCenter >= 0) {
    nextFaces[existingByCenter] = newFace;
  } else {
    const existingFaceIdx = current.faces.findIndex((f) => f.faceIndex === newFace.faceIndex);
    if (existingFaceIdx >= 0) {
      nextFaces[existingFaceIdx] = newFace;
    } else {
      nextFaces.push(newFace);
    }
  }

  const capturedFaceCount = nextFaces.length;
  const completed = capturedFaceCount >= targetCount;
  const nextFaceIndex = Math.min(capturedFaceCount + 1, targetCount);

  return {
    ...current,
    faces: nextFaces,
    capturedFaceCount,
    scannerState: 'ACCEPTED',
    scanStatus: completed ? 'COMPLETED' : current.scanStatus,
    requestedFaceIndex: nextFaceIndex,
    requestedFaceLabel: `Face ${nextFaceIndex} of ${targetCount}`,
    observedCenterColor: observation.centerColor,
    message: completed ? `All ${targetCount} faces captured.` : 'Face accepted. Rotate to a different center color.',
  };
}

function getSessionFingerprint(session: ScannerSessionDto | null) {
  if (!session) return 'empty';

  return JSON.stringify({
    scanGeneration: session.scanGeneration,
    scanStatus: session.scanStatus,
    scannerState: session.scannerState,
    requestedFaceIndex: session.requestedFaceIndex,
    capturedFaceCount: session.capturedFaceCount,
    stableObservationCount: session.stableObservationCount,
    requiredStableObservations: session.requiredStableObservations,
    detectedStickers: session.detectedStickers,
    reason: session.reason,
    observedCenterColor: session.observedCenterColor,
    faces: session.faces.map((face) => ({
      faceIndex: face.faceIndex,
      observedCenterColor: face.observedCenterColor,
      acceptedAt: face.acceptedAt,
    })),
    validation: session.validation
      ? {
        status: session.validation.status,
        matched: session.validation.matched,
        mismatchedStickerCount: session.validation.mismatchedStickerCount,
      }
      : null,
  });
}

function extractPreview(session: ScannerSessionDto | null): ScannerPreviewDto | null {
  if (!session) {
    return null;
  }

  return {
    scannerState: session.scannerState,
    stableObservationCount: session.stableObservationCount,
    requiredStableObservations: session.requiredStableObservations,
    detectedStickers: session.detectedStickers,
    inferMs: session.inferMs,
    modelVersion: session.modelVersion,
    reason: session.reason,
    observedCenterColor: session.observedCenterColor,
    stickers: session.stickers ?? [],
  };
}

function extractPreviewFromObservation(observation: ScannerObservationDto): ScannerPreviewDto {
  return {
    scannerState: observation.scannerState,
    stableObservationCount: observation.stableObservationCount,
    requiredStableObservations: observation.requiredStableObservations,
    detectedStickers: observation.detectedStickers,
    inferMs: observation.inferMs,
    modelVersion: observation.modelVersion,
    reason: observation.reason,
    observedCenterColor: observation.centerColor,
    stickers: observation.stickers ?? [],
  };
}

function createScanningPreview(modelVersion: string): ScannerPreviewDto {
  return {
    scannerState: 'SCANNING',
    stableObservationCount: 0,
    requiredStableObservations: 3,
    detectedStickers: 0,
    inferMs: 0,
    modelVersion,
    reason: null,
    observedCenterColor: null,
    stickers: [],
  };
}

function getRemainingCenterColors(session: ScannerSessionDto | null) {
  const allCenters = ['white', 'red', 'green', 'yellow', 'orange', 'blue'];
  const captured = new Set((session?.faces ?? []).map((face) => (face.observedCenterColor || face.expectedCenterColor || '').toLowerCase()));
  return allCenters.filter((color) => !captured.has(color));
}

function getColorLabel(color: string) {
  return color.charAt(0).toUpperCase() + color.slice(1);
}

function getScannerGuidance(session: ScannerSessionDto | null, validationType: 'SCRAMBLE' | 'FINISH') {
  if (!session) {
    return validationType === 'SCRAMBLE'
      ? 'Scramble mode scans any face whose center color has not been accepted yet.'
      : 'Finish mode scans all six faces of the solved cube.';
  }

  const remaining = getRemainingCenterColors(session);
  if (session.scanStatus === 'COMPLETED') {
    return validationType === 'SCRAMBLE'
      ? 'All six center colors were captured. The backend is now comparing the observed cube state with your assigned scramble.'
      : 'All six faces were captured. The backend is now checking whether the cube is solved.';
  }

  if (validationType === 'SCRAMBLE') {
    return remaining.length > 0
      ? `Scan any remaining face with one of these center colors: ${remaining.map(getColorLabel).join(', ')}. The stickers on that face may be mixed because the cube is scrambled.`
      : 'All center colors appear to be captured.';
  }

  return 'Scan any face that has not been accepted yet and keep the full 3x3 grid visible.';
}

interface ManualFocusRange {
  min: number;
  max: number;
  step: number;
}

interface ExposureRange {
  min: number;
  max: number;
  step: number;
  type?: 'exposureCompensation' | 'brightness';
}

async function captureSnapshot(
  video: HTMLVideoElement | null,
  canvasRef: React.MutableRefObject<HTMLCanvasElement | null>,
): Promise<Blob> {
  if (!video || video.videoWidth === 0 || video.videoHeight === 0) {
    throw new Error('Camera preview is not ready.');
  }

  const sourceWidth = video.videoWidth;
  const sourceHeight = video.videoHeight;
  const width = Math.min(SNAPSHOT_MAX_WIDTH, sourceWidth);
  const height = Math.round((sourceHeight / sourceWidth) * width);

  const canvas = canvasRef.current ?? document.createElement('canvas');
  canvasRef.current = canvas;
  if (canvas.width !== width || canvas.height !== height) {
    canvas.width = width;
    canvas.height = height;
  }

  const context = canvas.getContext('2d');
  if (!context) {
    throw new Error('Canvas 2D context is not available.');
  }

  context.imageSmoothingEnabled = true;
  context.drawImage(video, 0, 0, width, height);
  const blob = await new Promise<Blob | null>((resolve) => {
    canvas.toBlob(resolve, 'image/jpeg', SNAPSHOT_QUALITY);
  });

  if (!blob) {
    throw new Error('Failed to capture a camera snapshot.');
  }

  return blob;
}

function delay(ms: number) {
  return new Promise((resolve) => window.setTimeout(resolve, ms));
}

async function runScannerBurst<TObservation>({
  capture,
  observe,
  onObservation,
  shouldStop,
  shouldAbort,
  maxBurstMs,
  sampleIntervalMs,
}: {
  capture: () => Promise<Blob>;
  observe: (snapshot: Blob) => Promise<TObservation>;
  onObservation?: (observation: TObservation) => void;
  shouldStop: (observation: TObservation) => boolean;
  shouldAbort: () => boolean;
  maxBurstMs: number;
  sampleIntervalMs: number;
}): Promise<{ reason: 'terminal' | 'timeout' | 'aborted'; observation?: TObservation | null }> {
  const startedAt = performance.now();
  let lastObservation: TObservation | null = null;

  while (performance.now() - startedAt < maxBurstMs) {
    if (shouldAbort()) {
      return { reason: 'aborted', observation: lastObservation };
    }

    const snapshot = await capture();
    const tickStartedAt = performance.now();
    lastObservation = await observe(snapshot);
    const duration = performance.now() - tickStartedAt;

    onObservation?.(lastObservation);

    if (shouldStop(lastObservation)) {
      return { reason: 'terminal', observation: lastObservation };
    }

    if (shouldAbort()) {
      return { reason: 'aborted', observation: lastObservation };
    }

    // Không dùng adaptive delay — AI inference đã đồng bộ (await observe()),
    // mỗi vòng lặp đã tự chờ AI xong mới tiếp tục. Chỉ cần khoảng nghỉ tối thiểu
    // để tránh spam quá nhanh nếu AI trả về ngay lập tức.
    await delay(sampleIntervalMs);
  }

  return { reason: 'timeout', observation: lastObservation };
}

function isScannerSessionResponse(value: any): value is ScannerSessionDto {
  return !!value && typeof value.scanSessionId === 'string' && typeof value.scanStatus === 'string';
}

/** ObserveFinishFrameResponseDto khi backend yêu cầu scan lại từ đầu (màu không khớp) */
function isRetryScanResponse(value: any): boolean {
  return !!value && value.nextUiState === 'RETRY_SCAN';
}

function isCurrentScannerSession(
  response: ScannerSessionDto,
  expected: { scanSessionId: string; scanGeneration: number; targetFaceIndex: number },
) {
  return response.scanSessionId === expected.scanSessionId
    && response.scanGeneration >= expected.scanGeneration
    && (
      response.requestedFaceIndex === expected.targetFaceIndex
      || response.requestedFaceIndex === expected.targetFaceIndex + 1
      || response.capturedFaceCount >= expected.targetFaceIndex
    );
}

function isCurrentObservation(
  observation: ScannerObservationDto,
  expected: { scanSessionId: string; scanGeneration: number; targetFaceIndex: number },
) {
  return observation.scanSessionId === expected.scanSessionId
    && observation.scanGeneration === expected.scanGeneration
    && observation.targetFaceIndex === expected.targetFaceIndex;
}

export const OnlineMatchScanner = memo(function OnlineMatchScanner({ matchId, validationType, onSuccess }: OnlineMatchScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const overlayCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const captureCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const activeScanAbortRef = useRef<AbortController | null>(null);
  const activeScanIdentityRef = useRef<{
    scanSessionId: string;
    scanGeneration: number;
    targetFaceIndex: number;
  } | null>(null);
  const sessionRef = useRef<ScannerSessionDto | null>(null);
  const sessionFingerprintRef = useRef('empty');

  const [session, setSession] = useState<ScannerSessionDto | null>(null);
  const [localObservations, setLocalObservations] = useState<any[]>([]);
  const completionInFlightRef = useRef(false);
  const [preview, setPreview] = useState<ScannerPreviewDto | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [cameraStatus, setCameraStatus] = useState<'idle' | 'starting' | 'ready' | 'failed'>('idle');
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isScanningFace, setIsScanningFace] = useState(false);
  const [isPreparingSession, setIsPreparingSession] = useState(false);
  const [isStartingCamera, setIsStartingCamera] = useState(false);
  const [manualFocusRange, setManualFocusRange] = useState<ManualFocusRange | null>(null);
  const [focusDistance, setFocusDistance] = useState(0);
  const [focusMode, setFocusMode] = useState<'auto' | 'manual'>('auto');
  const [exposureRange, setExposureRange] = useState<ExposureRange | null>(null);
  const [exposureCompensation, setExposureCompensation] = useState(0);
  const [exposureMode, setExposureMode] = useState<'auto' | 'manual'>('auto');
  const [error, setError] = useState<string | null>(null);
  const [lastReason, setLastReason] = useState<string | null>(null);
  const [scannerState, setScannerState] = useState<string>('POSITION_FACE');
  const [statusMessage, setStatusMessage] = useState<string>('Start Camera, then Start Scan Session to begin the online match scanner.');

  const effectiveFaces = session?.faces ?? [];
  const remainingCenters = React.useMemo(() => getRemainingCenterColors(session), [session]);
  const scannerGuidance = getScannerGuidance(session, validationType);
  const effectiveObservedCenter = (preview?.observedCenterColor ?? session?.observedCenterColor ?? '').toLowerCase();
  const effectiveStickers = preview?.stickers ?? session?.stickers ?? [];
  const effectiveScannerState = preview?.scannerState ?? session?.scannerState ?? 'POSITION_FACE';
  const effectiveStableObservationCount = preview?.stableObservationCount ?? session?.stableObservationCount ?? 0;
  const effectiveRequiredStableObservations = preview?.requiredStableObservations ?? session?.requiredStableObservations ?? 3;
  const effectiveDetectedStickers = preview?.detectedStickers ?? session?.detectedStickers ?? 0;
  const effectiveInferMs = preview?.inferMs ?? session?.inferMs ?? 0;
  const effectiveCapturedFaceCount = session?.capturedFaceCount ?? 0;
  const effectiveModelVersion = preview?.modelVersion || session?.modelVersion || '-';
  const effectiveAiHealth = error || cameraError ? 'degraded' : effectiveModelVersion !== '-' ? 'healthy' : 'unknown';
  const targetTotalFaces = 5;
  const progressText = `${effectiveCapturedFaceCount} / ${targetTotalFaces}`;
  const stableText = `${effectiveStableObservationCount} / ${effectiveRequiredStableObservations}`;
  const observedCenterText = effectiveObservedCenter ? effectiveObservedCenter.toUpperCase() : '-';
  const remainingCenterLabels = remainingCenters.map(getColorLabel);

  /**
   * applySessionFull: Dùng khi start/load/reset session.
   * Reset toàn bộ: session + preview + state.
   */
  const applySessionFull = (nextSession: ScannerSessionDto, fallbackReason?: string) => {
    const nextFingerprint = getSessionFingerprint(nextSession);
    sessionRef.current = nextSession;
    sessionFingerprintRef.current = nextFingerprint;
    setSession(nextSession);
    setPreview(extractPreview(nextSession));
    setScannerState(nextSession.scannerState);
    const nextMessage = nextSession.reason || nextSession.message || UI_MESSAGE[nextSession.scannerState] || fallbackReason || 'Scanner session updated.';
    setLastReason(nextMessage);
    setStatusMessage(nextMessage);
  };

  /**
   * applySessionCommit: Dùng sau commitScannerObservation.
   * CHỈ update session state — KHÔNG overwrite preview để giữ sticker bbox overlay.
   * Điều này ngăn hiện tượng sticker biến mất sau khi face được ACCEPTED.
   */
  const applySessionCommit = (nextSession: ScannerSessionDto, fallbackReason?: string) => {
    const nextFingerprint = getSessionFingerprint(nextSession);
    sessionRef.current = nextSession;
    sessionFingerprintRef.current = nextFingerprint;
    setSession(nextSession);
    // Không gọi setPreview ở đây — giữ nguyên preview có sticker bbox từ burst scan
    setScannerState(nextSession.scannerState);
    const nextMessage = nextSession.reason || nextSession.message || UI_MESSAGE[nextSession.scannerState] || fallbackReason || 'Scanner observation committed.';
    setLastReason(nextMessage);
    setStatusMessage(nextMessage);
  };

  /**
   * Cho phép chọn và xóa 1 mặt đã quét sai để quét lại riêng mặt đó
   * mà không cần phải Reset toàn bộ session.
   */
  const rescanSingleFace = async (targetFace: ScannerAcceptedFaceDto) => {
    if (!session) return;

    const faceCenter = (targetFace.observedCenterColor || targetFace.expectedCenterColor || '').toLowerCase();

    // Reset Python AI session RAM state để xóa danh sách captured_centers ở phía AI
    if (session.aiSessionId) {
      try {
        await resetScannerTestSession({ backendUrl, sessionId: session.aiSessionId });
      } catch (e) {
        // Suppress reset error if session was stale
      }
    }

    const nextFaces = session.faces.filter(
      (f) => (f.observedCenterColor || f.expectedCenterColor || '').toLowerCase() !== faceCenter
    );

    const nextObservations = localObservations.filter(
      (obs) => (obs.centerColor || '').toLowerCase() !== faceCenter
    );
    setLocalObservations(nextObservations);

    const updatedSession: ScannerSessionDto = {
      ...session,
      faces: nextFaces,
      capturedFaceCount: nextFaces.length,
      requestedFaceIndex: nextFaces.length + 1,
      requestedFaceLabel: `Face ${nextFaces.length + 1} of 5`,
      scanStatus: 'IN_PROGRESS',
      scannerState: 'POSITION_FACE',
      message: `Removed ${faceCenter.toUpperCase()} face. Point camera at ${faceCenter.toUpperCase()} face and press Scan.`,
    };

    applySessionFull(updatedSession, `Removed ${faceCenter.toUpperCase()} face for re-scan.`);
    setStatusMessage(`Selected ${faceCenter.toUpperCase()} face to re-scan. Point camera and press Scan.`);
    setLastReason(`Selected ${faceCenter.toUpperCase()} face to re-scan. Point camera and press Scan.`);
  };

  useEffect(() => {
    sessionRef.current = session;
    sessionFingerprintRef.current = getSessionFingerprint(session);
  }, [session]);

  useEffect(() => {
    return () => {
      activeScanAbortRef.current?.abort();
      activeScanIdentityRef.current = null;
      if (streamRef.current) {
        streamRef.current = null;
      }
    };
  }, []);

  useEffect(() => {
    activeScanAbortRef.current?.abort();
    activeScanIdentityRef.current = null;
    setSession(null);
    setPreview(null);
    setLocalObservations([]);
    completionInFlightRef.current = false;
    sessionRef.current = null;
    sessionFingerprintRef.current = 'empty';
    setError(null);
    setScannerState('POSITION_FACE');
    setLastReason('Load an existing session or start a new scan session.');
    setStatusMessage('Start Camera, then Start Scan Session to begin the online match scanner.');
  }, [matchId, validationType]);

  // Chỉ cập nhật kích thước canvas một lần khi video bắt đầu phát hoặc thay đổi kích thước.
  // Điều này ngăn chặn việc trình duyệt khởi tạo lại buffer bộ nhớ của Canvas liên tục mỗi 300ms gây lag UI.
  useEffect(() => {
    const video = videoRef.current;
    const canvas = overlayCanvasRef.current;
    if (!video || !canvas || cameraStatus !== 'ready') return;

    const handleResize = () => {
      if (video.videoWidth > 0 && video.videoHeight > 0) {
        canvas.width = video.videoWidth;
        canvas.height = video.videoHeight;
      }
    };

    handleResize();
    video.addEventListener('loadedmetadata', handleResize);
    video.addEventListener('resize', handleResize);

    return () => {
      video.removeEventListener('loadedmetadata', handleResize);
      video.removeEventListener('resize', handleResize);
    };
  }, [cameraStatus]);

  useEffect(() => {
    const canvas = overlayCanvasRef.current;
    if (!canvas || !cameraActive) return;

    const context = canvas.getContext('2d');
    if (!context) return;

    const width = canvas.width;
    const height = canvas.height;
    const inset = Math.round(Math.min(width, height) * OVERLAY_INSET_RATIO);
    const snapshotWidth = Math.min(SNAPSHOT_MAX_WIDTH, width);
    const snapshotHeight = Math.round((height / width) * snapshotWidth);
    // Canvas coordinates use the camera's native resolution and CSS scales the
    // canvas down. Scale UI primitives too, otherwise labels look half-sized on HD.
    const uiScale = Math.max(1, Math.min(width, height) / 480);
    const observedCenter = preview?.observedCenterColor || session?.observedCenterColor || '';
    const secondaryCenters = remainingCenters.length > 0
      ? `Remaining: ${remainingCenters.map((color) => color.toUpperCase()).join(', ')}`
      : 'All 6 centers captured';

    context.clearRect(0, 0, width, height);
    context.strokeStyle = 'rgba(249, 115, 22, 0.72)';
    context.lineWidth = 3 * uiScale;
    context.setLineDash([8 * uiScale, 8 * uiScale]);
    context.strokeRect(inset, inset, width - inset * 2, height - inset * 2);
    context.setLineDash([]);

    context.fillStyle = 'rgba(9, 9, 11, 0.85)';
    context.fillRect(16 * uiScale, 16 * uiScale, Math.min(320 * uiScale, width - 32 * uiScale), 48 * uiScale);
    context.fillStyle = '#ffffff';
    context.font = `bold ${11 * uiScale}px sans-serif`;
    context.fillText(
      observedCenter ? `Observed center: ${observedCenter.toUpperCase()}` : 'Observed center: waiting',
      24 * uiScale,
      34 * uiScale,
    );
    context.fillStyle = 'rgba(161, 161, 170, 1)';
    context.font = `${10 * uiScale}px sans-serif`;
    context.fillText(secondaryCenters, 24 * uiScale, 50 * uiScale);

    for (const [index, sticker] of effectiveStickers.entries()) {
      const [rawX1, rawY1, rawX2, rawY2] = sticker.bbox;
      if (![rawX1, rawY1, rawX2, rawY2].every(Number.isFinite)) {
        continue;
      }
      const scaleX = width / snapshotWidth;
      const scaleY = height / snapshotHeight;
      const x1 = rawX1 * scaleX;
      const y1 = rawY1 * scaleY;
      const x2 = rawX2 * scaleX;
      const y2 = rawY2 * scaleY;
      context.strokeStyle = 'rgba(250, 204, 21, 0.95)';
      context.lineWidth = 2 * uiScale;
      context.strokeRect(x1, y1, x2 - x1, y2 - y1);
      context.fillStyle = 'rgba(15, 23, 42, 0.84)';
      context.fillRect(x1, Math.max(0, y1 - 18 * uiScale), 92 * uiScale, 16 * uiScale);
      context.fillStyle = '#f8fafc';
      context.font = `${10 * uiScale}px sans-serif`;
      context.fillText(
        `${index + 1}. ${sticker.color}`,
        x1 + 4 * uiScale,
        Math.max(11 * uiScale, y1 - 6 * uiScale),
      );
    }
  }, [cameraActive, effectiveStickers, preview?.observedCenterColor, remainingCenters, session?.observedCenterColor]);

  const backendUrl = useMemo(() => resolveBackendUrl(), []);

  const scanCurrentFace = async () => {
    if (!videoRef.current || isScanningFace) return;

    if (cameraStatus !== 'ready') {
      setError('Start the camera before scanning.');
      setScannerState('CAMERA_ERROR');
      setStatusMessage(UI_MESSAGE.CAMERA_ERROR);
      setLastReason(UI_MESSAGE.CAMERA_ERROR);
      return;
    }

    let currentSession = sessionRef.current;
    if (!currentSession) {
      try {
        const created = await startScanner(matchId, validationType) as unknown as ScannerSessionDto;
        currentSession = created;
        applySessionFull(created, 'Scanner session ready. Hold one face steady, then press Scan / Accept Next Face.');
      } catch (err: any) {
        setError(err?.message || 'Failed to start scanner session.');
        setScannerState('AI_UNAVAILABLE');
        setStatusMessage(UI_MESSAGE.AI_UNAVAILABLE);
        setLastReason(UI_MESSAGE.AI_UNAVAILABLE);
        return;
      }
    }

    if (!currentSession) {
      return;
    }

    if (currentSession.scanStatus === 'COMPLETED') {
      setLastReason('This scanner session is already completed.');
      return;
    }

    // FIX #4: Không gọi retryScannerFace() BE trước khi scan (tốn 1 round-trip).
    // Reset state client-side ngay lập tức — BE retry chỉ cần khi user bấm nút Retry riêng.
    const currentScannerState = preview?.scannerState ?? currentSession.scannerState;
    if (currentScannerState === 'RETRY' || currentScannerState === 'DUPLICATE_FACE') {
      setScannerState('SCANNING');
      setPreview(createScanningPreview(currentSession.modelVersion));
      setStatusMessage(`Re-scanning ${currentSession.requestedFaceLabel}. Hold steady.`);
      setLastReason(`Re-scanning ${currentSession.requestedFaceLabel}. Hold steady.`);
    }

    const abortController = new AbortController();
    activeScanAbortRef.current?.abort();
    activeScanAbortRef.current = abortController;
    const scanGeneration = currentSession.scanGeneration;
    const scanIdentity = {
      scanSessionId: currentSession.aiSessionId,
      scanGeneration,
      targetFaceIndex: currentSession.requestedFaceIndex,
    };
    activeScanIdentityRef.current = scanIdentity;

    try {
      setIsScanningFace(true);
      setError(null);
      setPreview(createScanningPreview(currentSession.modelVersion));
      setScannerState('SCANNING');
      setStatusMessage(`Scanning ${currentSession.requestedFaceLabel}. Hold the cube still for stable reads.`);
      setLastReason(`Scanning ${currentSession.requestedFaceLabel}. Hold the cube still for stable reads.`);

      // ─── Sandbox-identical frame scan ────────────────────────────────────────
      // Gọi đúng Python /observe qua C# Dev proxy (backendUrl = '' = relative URL).
      // Đây là y chang cách Sandbox /online/sandbox hoạt động:
      //   observeScannerTestFrame → /api/dev/ai/scanner-test/sessions/{aiSessionId}/observe
      //   → C# AiScannerTestController (transparent proxy, không cần auth)
      //   → Python /ai/scanner-test/session/{aiSessionId}/observe
      //   → Python cộng dồn stable_observation_count trong RAM, trả ACCEPTED sau 3 frame
      // Không còn lỗi 401, session mismatch, hay RETRY giả do gọi sai endpoint.
      const result = await runScannerBurst<ScannerObservationDto>({
        capture: async () => captureSnapshot(videoRef.current, captureCanvasRef),
        observe: async (snapshot) => {
          const requestId = createRequestId();
          return observeScannerTestFrame({
            backendUrl,                                  // Bypasses dev proxy if local
            sessionId: currentSession!.aiSessionId,     // Python session ID (route param)
            snapshot,
            scanSessionId: currentSession!.aiSessionId, // Python session ID (form field)
            scanGeneration,
            requestId,
            targetFaceIndex: currentSession!.requestedFaceIndex,
            signal: abortController.signal,
          }) as unknown as ScannerObservationDto;
        },
        onObservation: (nextResponse) => {
          if (!isCurrentObservation(nextResponse, scanIdentity)) {
            return;
          }

          setError(null);
          setScannerState(nextResponse.scannerState);
          // FIX #2: Luôn giữ sticker bbox overlay — cập nhật preview sau mỗi frame
          setPreview(extractPreviewFromObservation(nextResponse));
          const nextMessage = nextResponse.reason || UI_MESSAGE[nextResponse.scannerState] || 'Scanner observation updated.';
          setStatusMessage(nextMessage);
          setLastReason(nextMessage);

          // FIX #2: Khi ACCEPTED, update face slot ngay lập tức client-side
          // Không chờ commitScannerObservation round-trip mới hiện face
          if (nextResponse.scannerState === 'ACCEPTED') {
            setSession((current) => applyAcceptedObservationClientSide(current, nextResponse));
          }
        },
        shouldStop: (nextResponse) => isCurrentObservation(nextResponse, scanIdentity)
          && TERMINAL_SCANNER_STATES.has(nextResponse.scannerState),
        shouldAbort: () => abortController.signal.aborted,
        maxBurstMs: MAX_SCAN_BURST_MS,
        sampleIntervalMs: CAPTURE_INTERVAL_MS,
      });

      if (result.reason === 'aborted') {
        return;
      }

      const terminalResponse = result.observation;
      if (!terminalResponse) {
        setLastReason('No scanner observation was returned. Try again.');
        return;
      }

      if (result.reason === 'timeout') {
        // Timeout: giữ preview cuối (có sticker bbox) nhưng đổi state sang RETRY
        if (terminalResponse) {
          setPreview({
            ...extractPreviewFromObservation(terminalResponse),
            scannerState: 'RETRY',
            reason: terminalResponse.reason || 'Detection unstable. Adjust the cube & retry.',
          });
        }
        setScannerState('RETRY');
        const retryMsg = terminalResponse?.reason || 'Detection unstable. Adjust the cube & retry.';
        setStatusMessage(retryMsg);
        setLastReason(retryMsg);
        return;
      }

      if (!terminalResponse) {
        setLastReason('No scanner observation was returned. Try again.');
        return;
      }

      if (!isCurrentObservation(terminalResponse, scanIdentity)) {
        setLastReason('Scanner returned a stale response. Please scan again.');
        return;
      }

      if (terminalResponse.scannerState !== 'ACCEPTED') {
        setLastReason(terminalResponse.reason || UI_MESSAGE[terminalResponse.scannerState] || 'Scanner requires another attempt.');
        return;
      }

      // Store face observation locally and update UI state instantly
      const nextObservations = [...localObservations, terminalResponse];
      setLocalObservations(nextObservations);

      const targetTotalFaces = validationType === 'SCRAMBLE' ? 5 : 6;
      const nextSession = applyAcceptedObservationClientSide(currentSession, terminalResponse, targetTotalFaces);
      if (nextSession) {
        applySessionCommit(nextSession, 'Face accepted locally. Rotate to a different center color.');
      }

      // If SCRAMBLE mode and we have collected 5 faces with distinct center colors:
      if (validationType === 'SCRAMBLE' && nextSession && nextSession.faces.length >= 5) {
        if (completionInFlightRef.current) return;
        completionInFlightRef.current = true;

        setStatusMessage('Submitting 5 faces for scramble validation...');
        setIsScanningFace(true);

        try {
          const batchFaces = nextSession.faces.slice(0, 5).map((f) => ({
            centerColor: f.observedCenterColor || f.expectedCenterColor,
            grid3x3: f.grid3x3 || undefined,
          }));

          const response = await submitScrambleBatch(matchId, {
            sessionId: currentSession.scanSessionId,
            faces: batchFaces,
          });

          if (response.status === 'PASSED') {
            setStatusMessage('SCRAMBLE_CHECK PASSED!');
            if (onSuccess) onSuccess(response);
            return;
          }

          if (response.status === 'MISMATCHED') {
            const mismatchedColors: string[] = response.mismatchedCenterColors || [];
            const mismatchedUpper = new Set(mismatchedColors.map((c) => c.toUpperCase()));

            // Keep valid faces in local session, remove mismatched ones
            const filteredFaces = nextSession.faces.filter(
              (f) => !mismatchedUpper.has((f.observedCenterColor || f.expectedCenterColor || '').toUpperCase())
            );

            const updatedSession: ScannerSessionDto = {
              ...nextSession,
              faces: filteredFaces,
              capturedFaceCount: filteredFaces.length,
              requestedFaceIndex: filteredFaces.length + 1,
              scannerState: 'POSITION_FACE',
              message: `Mismatched faces: ${mismatchedColors.join(', ')}. Please re-scan those faces.`,
            };

            applySessionFull(updatedSession, `Mismatched faces: ${mismatchedColors.join(', ')}. Please re-scan those faces.`);
            setError(`Faces [${mismatchedColors.join(', ')}] did not match scramble. Please re-scan them.`);
            return;
          }
        } catch (err: any) {
          setError(err?.message || 'Failed to validate scramble batch.');
        } finally {
          completionInFlightRef.current = false;
          setIsScanningFace(false);
        }
      }

      // If FINISH mode and we have collected 5 faces:
      if (validationType === 'FINISH' && nextSession && nextSession.faces.length >= 5) {
        if (completionInFlightRef.current) return;
        completionInFlightRef.current = true;

        setStatusMessage('Submitting 5 faces for finish validation...');
        setIsScanningFace(true);

        try {
          const committed = await completeScannerSession(matchId, validationType, {
            scanSessionId: currentSession.scanSessionId,
            scanGeneration: currentSession.scanGeneration,
            requestId: terminalResponse.requestId || createRequestId(),
            observations: nextObservations,
          });

          if (isScannerSessionResponse(committed)) {
            applySessionFull(committed, committed.reason || committed.message || 'Scanner session completed.');
            if ((committed.scanStatus === 'COMPLETED' || !!committed.validation) && onSuccess) {
              onSuccess(committed);
            }
            return;
          }

          // Handle ObserveFinishFrameResponseDto (returned by FINISH scan completion)
          if (committed && typeof committed.finishCheckStatus === 'string') {
            if (committed.nextUiState === 'RETRY_SCAN' || committed.finishCheckStatus === 'NOT_STARTED') {
              // Backend rejected the scan (colors didn't match a solved Rubik's cube)
              // Reset local session so player can scan again from scratch without clicking manual reset
              setSession(null);
              sessionRef.current = null;
              sessionFingerprintRef.current = 'empty';
              setPreview(null);
              setLocalObservations([]);
              setScannerState('POSITION_FACE');
              const retryMsg = committed.message || 'Colors did not match a solved Rubik\'s cube. Please re-scan ALL faces from the beginning.';
              setStatusMessage(retryMsg);
              setLastReason(retryMsg);
              setError(retryMsg);
              if (onSuccess) onSuccess(committed);
              return;
            }

            if (committed.finishCheckStatus === 'PASSED' || committed.nextUiState === 'COMPLETED' || committed.nextUiState === 'WAITING_OPPONENT') {
              setStatusMessage('Finish check passed successfully!');
              setLastReason('Finish check passed successfully!');
              if (onSuccess) onSuccess(committed);
              return;
            }
          }
        } catch (err: any) {
          const msg = err?.message || 'Failed to complete scanner session.';
          setError(msg);
          setStatusMessage(msg);
        } finally {

          completionInFlightRef.current = false;
          setIsScanningFace(false);
        }
      }
    } catch (err: any) {
      if (!abortController.signal.aborted) {
        const message = err?.message || 'Error occurred during scan.';
        if (currentSession) {
          sessionRef.current = currentSession;
          sessionFingerprintRef.current = getSessionFingerprint(currentSession);
          setSession(currentSession);
          setPreview(extractPreview(currentSession));
        }
        setError(message);
        setScannerState('AI_UNAVAILABLE');
        setStatusMessage(message);
        setLastReason(message);
      }
    } finally {
      if (activeScanAbortRef.current === abortController) {
        activeScanAbortRef.current = null;
      }
      if (activeScanIdentityRef.current?.scanGeneration === scanIdentity.scanGeneration) {
        activeScanIdentityRef.current = null;
      }
      setIsScanningFace(false);
    }
  };

  const handleStartCamera = async () => {
    if (cameraActive) {
      setCameraStatus('ready');
      setLastReason('Camera is already running.');
      return;
    }

    try {
      setIsStartingCamera(true);
      setCameraStatus('starting');
      setError(null);
      setCameraError(null);
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 640 },
          height: { ideal: 480 },
          frameRate: { ideal: 30 },
          facingMode: 'environment',
          resizeMode: 'none',
        } as any,
        audio: false,
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      streamRef.current = stream;
      setCameraActive(true);
      setCameraStatus('ready');
      const track = stream.getVideoTracks()[0];
      const capabilities = (track as any)?.getCapabilities?.() as any;
      const supportedFocusModes = Array.isArray(capabilities?.focusMode) ? capabilities.focusMode : [];

      if (supportedFocusModes.includes('continuous')) {
        try {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
          setFocusMode('auto');
        } catch {
          // Keep the camera's default autofocus when this browser rejects the hint.
        }
      }

      const focusCapability = capabilities?.focusDistance;
      if (
        focusCapability
        && Number.isFinite(focusCapability.min)
        && Number.isFinite(focusCapability.max)
        && focusCapability.max > focusCapability.min
      ) {
        const settings = (track as any).getSettings?.() as any;
        const initialDistance = Number.isFinite(settings?.focusDistance)
          ? settings.focusDistance
          : (focusCapability.min + focusCapability.max) / 2;
        setManualFocusRange({
          min: focusCapability.min,
          max: focusCapability.max,
          step: focusCapability.step > 0 ? focusCapability.step : 0.01,
        });
        setFocusDistance(initialDistance);
      } else {
        setManualFocusRange(null);
      }

      const supportedExposureModes = Array.isArray(capabilities?.exposureMode) ? capabilities.exposureMode : [];
      if (supportedExposureModes.includes('continuous')) {
        try {
          await track.applyConstraints({ advanced: [{ exposureMode: 'continuous' }] } as any);
          setExposureMode('auto');
        } catch {
          // Keep the camera's default auto-exposure when this hint is unsupported.
        }
      }

      const exposureCapability = capabilities?.exposureCompensation;
      const brightnessCapability = capabilities?.brightness;
      if (
        exposureCapability
        && Number.isFinite(exposureCapability.min)
        && Number.isFinite(exposureCapability.max)
        && exposureCapability.max > exposureCapability.min
      ) {
        const currentSettings = (track as any).getSettings?.() as any;
        const initialExposure = Number.isFinite(currentSettings?.exposureCompensation)
          ? currentSettings.exposureCompensation
          : Math.max(exposureCapability.min, Math.min(exposureCapability.max, 0));
        setExposureRange({
          min: exposureCapability.min,
          max: exposureCapability.max,
          step: exposureCapability.step > 0 ? exposureCapability.step : 0.1,
          type: 'exposureCompensation',
        });
        setExposureCompensation(initialExposure);
      } else if (
        brightnessCapability
        && Number.isFinite(brightnessCapability.min)
        && Number.isFinite(brightnessCapability.max)
        && brightnessCapability.max > brightnessCapability.min
      ) {
        const currentSettings = (track as any).getSettings?.() as any;
        const initialBrightness = Number.isFinite(currentSettings?.brightness)
          ? currentSettings.brightness
          : Math.max(brightnessCapability.min, Math.min(brightnessCapability.max, 0));
        setExposureRange({
          min: brightnessCapability.min,
          max: brightnessCapability.max,
          step: brightnessCapability.step > 0 ? brightnessCapability.step : 1,
          type: 'brightness',
        });
        setExposureCompensation(initialBrightness);
      } else {
        setExposureRange(null);
      }

      const settings = track?.getSettings?.();
      const resolution = settings?.width && settings?.height ? `${settings.width}x${settings.height}` : 'unknown resolution';
      const nextMessage = `Camera started (${resolution}). Hold one full face steady, then press Scan / Accept Next Face.`;
      setLastReason(nextMessage);
      setStatusMessage(nextMessage);
    } catch (err: any) {
      console.error(err);
      setCameraStatus('failed');
      setCameraError(err?.message || 'Failed to start camera.');
      setError(err?.message || 'Failed to start camera.');
    } finally {
      setIsStartingCamera(false);
    }
  };

  const handleStopCamera = () => {
    activeScanAbortRef.current?.abort();
    activeScanIdentityRef.current = null;
    if (streamRef.current) {
      streamRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setCameraActive(false);
    setManualFocusRange(null);
    setFocusMode('auto');
    setExposureRange(null);
    setExposureMode('auto');
    setCameraStatus('idle');
    setIsScanningFace(false);
    setPreview(null);
    setStatusMessage('Camera stopped.');
    setLastReason('Camera stopped.');
  };

  const handleManualFocusChange = async (nextDistance: number) => {
    setFocusDistance(nextDistance);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({
        advanced: [{ focusMode: 'manual', focusDistance: nextDistance }],
      } as any);
      setFocusMode('manual');
      setCameraError(null);
    } catch {
      setCameraError('This camera could not apply the selected manual focus distance.');
    }
  };

  const handleEnableAutoFocus = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
      setFocusMode('auto');
      setCameraError(null);
    } catch {
      setCameraError('Continuous autofocus is not available on this camera.');
    }
  };

  const handleExposureChange = async (nextExposure: number) => {
    setExposureCompensation(nextExposure);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;

    try {
      if (exposureRange?.type === 'brightness') {
        await track.applyConstraints({
          advanced: [{ brightness: nextExposure }],
        } as any);
      } else {
        await track.applyConstraints({
          advanced: [{ exposureMode: 'continuous', exposureCompensation: nextExposure }],
        } as any);
      }
      setExposureMode('manual');
      setCameraError(null);
    } catch {
      setCameraError('This camera could not apply the selected brightness level.');
    }
  };

  const handleEnableAutoExposure = async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track || !exposureRange) return;

    const neutralExposure = Math.max(exposureRange.min, Math.min(exposureRange.max, 0));
    try {
      if (exposureRange?.type === 'brightness') {
        await track.applyConstraints({
          advanced: [{ brightness: neutralExposure }],
        } as any);
      } else {
        await track.applyConstraints({
          advanced: [{ exposureMode: 'continuous', exposureCompensation: neutralExposure }],
        } as any);
      }
      setExposureCompensation(neutralExposure);
      setExposureMode('auto');
      setCameraError(null);
    } catch {
      setCameraError('Automatic exposure is not available on this camera.');
    }
  };

  const handleLoadExistingSession = async () => {
    setIsPreparingSession(true);
    try {
      setError(null);
      const res = await getScannerSession(matchId, validationType) as unknown as ScannerSessionDto;
      applySessionFull(res, 'Scanner session loaded.');
    } catch (err: any) {
      setError(err?.message || 'Failed to load scanner session.');
    } finally {
      setIsPreparingSession(false);
    }
  };

  const handleStartSession = async () => {
    activeScanAbortRef.current?.abort();
    setIsPreparingSession(true);
    try {
      setError(null);
      const res = await startScanner(matchId, validationType) as unknown as ScannerSessionDto;
      applySessionFull(res, 'Scanner session ready. Hold one face steady, then press Scan / Accept Next Face.');
    } catch (err: any) {
      setError(err?.message || 'Failed to start scanner session.');
    } finally {
      setIsPreparingSession(false);
    }
  };

  const handleRetryFace = async () => {
    if (!session) return;
    activeScanAbortRef.current?.abort();
    setScannerState('POSITION_FACE');
    setPreview(null);
    setStatusMessage('Resetting current face...');

    // Client-side: pop the last accepted observation
    const nextObs = [...localObservations];
    nextObs.pop();
    setLocalObservations(nextObs);

    // Re-calculate session locally
    const targetIdxToRemove = session.requestedFaceIndex - 1;
    const nextFaces = session.faces.filter((f) => f.faceIndex !== targetIdxToRemove);
    const nextSession = {
      ...session,
      faces: nextFaces,
      capturedFaceCount: nextFaces.length,
      requestedFaceIndex: Math.max(1, session.requestedFaceIndex - 1),
      requestedFaceLabel: `Face ${Math.max(1, session.requestedFaceIndex - 1)} of 6`,
    };

    setSession(nextSession);
    setPreview(extractPreview(nextSession));

    try {
      setError(null);
      const res = await retryScannerFace(matchId, validationType) as unknown as ScannerSessionDto;
      setSession((curr) => {
        if (!curr) return nextSession;
        return {
          ...nextSession,
          scanGeneration: res.scanGeneration,
          aiSessionId: res.aiSessionId,
        };
      });
    } catch (err: any) {
      console.warn('Failed to sync retry with backend:', err);
    }
  };

  const handleReset = async () => {
    if (!session) return;
    activeScanAbortRef.current?.abort();
    setScannerState('POSITION_FACE');
    setPreview(null);
    setLocalObservations([]);
    completionInFlightRef.current = false;
    setStatusMessage('Resetting scanner session...');
    try {
      setError(null);
      const res = await resetScanner(matchId, validationType) as unknown as ScannerSessionDto;
      applySessionFull(res, 'Scanner reset. Start from Face 1.');
    } catch (err: any) {
      setError(err?.message || 'Failed to reset scanner.');
    }
  };

  return (
    <div className="space-y-6">
      {/* Side-by-Side Main Section on Desktop */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-12 items-start">

        {/* Left Side: Large Clean Camera Viewport + Remaining Colors (7 cols out of 12) */}
        <div className="lg:col-span-7 flex flex-col space-y-3">
          <div className="relative overflow-hidden rounded-3xl border border-slate-800 bg-slate-950/90 shadow-2xl">
            {/* Camera Viewport 4:3 */}
            <div className="relative aspect-[4/3] w-full bg-black overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="absolute inset-0 z-0 block h-full w-full object-cover bg-black"
              />
              <canvas
                ref={overlayCanvasRef}
                className="absolute inset-0 z-10 block h-full w-full object-cover pointer-events-none"
              />

              {/* Stability Bar overlay at bottom of camera frame */}
              <div className="absolute bottom-0 left-0 right-0 z-20 bg-gradient-to-t from-black/90 via-black/40 to-transparent p-4">
                <StabilityBar
                  stable={effectiveStableObservationCount}
                  required={effectiveRequiredStableObservations}
                  detectedStickers={effectiveDetectedStickers}
                  isScanning={isScanningFace}
                />
              </div>
            </div>
          </div>

          {/* Captured Face Slots Card (Positioned directly under Camera Viewport for instant scanning verification) */}
          <div className="rounded-3xl border border-slate-200 bg-white p-4 shadow-sm space-y-3">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center gap-2">
                <h4 className="text-xs font-black uppercase tracking-wider text-slate-800">Captured Face Slots</h4>
                <span className="rounded-full bg-slate-100 px-2.5 py-0.5 text-[10px] font-black text-slate-700">
                  {effectiveCapturedFaceCount} / 5
                </span>
              </div>
              <div className="flex items-center gap-1.5 text-[11px] font-bold">
                <span className="text-slate-400 uppercase text-[10px]">Remaining:</span>
                <span className="text-orange-600 font-extrabold">
                  {remainingCenterLabels.length ? remainingCenterLabels.join(', ') : 'All 5 Captured'}
                </span>
              </div>
            </div>

            {/* 5 Mini Rubik Face Slots in a Row */}
            <div className="grid grid-cols-5 gap-2 sm:gap-2.5">
              {Array.from({ length: 5 }).map((_, idx) => {
                const face = effectiveFaces.find((item) => item.faceIndex === idx + 1);
                const isActive = session ? !face && idx === effectiveCapturedFaceCount : false;

                return (
                  <div
                    key={idx}
                    className={`p-2 border rounded-2xl flex flex-col gap-1.5 transition-all duration-300 relative group ${
                      isActive
                        ? 'border-orange-500 bg-orange-50/70 shadow-sm ring-2 ring-orange-400/30'
                        : face
                          ? 'border-emerald-300 bg-emerald-50/60'
                          : 'border-slate-200 bg-slate-50/60'
                    }`}
                  >
                    <header className="flex justify-between items-center text-[9px] font-black uppercase">
                      <span className={isActive ? 'text-orange-600 font-extrabold' : face ? 'text-emerald-700 font-extrabold' : 'text-slate-500'}>
                        {face?.faceCode || SLOT_FACE_CODES[idx]}
                      </span>
                      <div className="flex items-center gap-0.5">
                        <span className={`text-[8px] font-bold truncate max-w-[38px] ${face?.observedCenterColor ? 'text-orange-600' : 'text-slate-400'}`}>
                          {face?.observedCenterColor ?? face?.expectedCenterColor ?? 'wait'}
                        </span>
                        {face && (
                          <button
                            type="button"
                            onClick={() => rescanSingleFace(face)}
                            title="Quét lại mặt này"
                            className="p-0.5 text-slate-400 hover:text-orange-600 hover:bg-slate-200/80 rounded transition-colors border-none bg-transparent cursor-pointer"
                          >
                            <RotateCcw className="h-2.5 w-2.5" />
                          </button>
                        )}
                      </div>
                    </header>
                    <div className="grid grid-cols-3 gap-0.5 h-12 w-12 sm:h-14 sm:w-14 mx-auto bg-slate-300/70 p-1 rounded-xl border border-slate-300/80">
                      {Array.from({ length: 9 }).map((_, cellIndex) => {
                        const color = face?.grid3x3?.[Math.floor(cellIndex / 3)]?.[cellIndex % 3] ?? 'unknown';
                        return (
                          <span
                            key={cellIndex}
                            className="rounded-[2px] transition-all duration-300"
                            style={{ background: COLOR_STYLE[color] ?? COLOR_STYLE.unknown }}
                          />
                        );
                      })}
                    </div>
                  </div>
                );
              })}
            </div>

            {scannerGuidance && (
              <p className="text-[10px] text-slate-500 leading-snug font-medium pt-1 border-t border-slate-100">
                💡 <span className="font-semibold text-slate-600">{scannerGuidance}</span>
              </p>
            )}
          </div>

          {/* Error messages if any */}
          {cameraError && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
              {cameraError}
            </div>
          )}
          {error && (
            <div className="rounded-2xl border border-rose-500/30 bg-rose-500/10 px-4 py-2.5 text-xs font-semibold text-rose-300">
              {error}
            </div>
          )}
        </div>

        {/* Right Side: Scanner Control Buttons Panel & Metrics (5 cols out of 12) */}
        <div className="lg:col-span-5 flex flex-col space-y-4">

          {/* Controls Panel Card */}
          <div className="rounded-3xl border border-slate-200 bg-white p-5 shadow-sm space-y-4">
            <div>
              <div className="flex items-center justify-between gap-2">
                <h3 className="text-sm font-black uppercase tracking-wider text-slate-800">
                  Match Scanner Controls
                </h3>
                <span className="rounded-full border border-orange-500/30 bg-orange-500/10 px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider text-orange-600">
                  {validationType} MODE
                </span>
              </div>
              <p className="mt-1 text-xs text-orange-600 font-semibold leading-relaxed">{statusMessage}</p>
            </div>

            {/* Primary SCAN / ACCEPT Button */}
            <button
              onClick={scanCurrentFace}
              disabled={cameraStatus !== 'ready' || isScanningFace || isPreparingSession}
              className="w-full inline-flex items-center justify-center gap-2.5 rounded-2xl bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 px-5 py-3.5 text-xs font-black uppercase tracking-wider text-white shadow-lg shadow-orange-500/25 transition-all duration-200 hover:scale-[1.01] active:scale-[0.99] disabled:cursor-not-allowed disabled:bg-none disabled:from-slate-100 disabled:to-slate-100 disabled:text-slate-500 disabled:shadow-none disabled:border disabled:border-slate-200"
            >
              {isScanningFace ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  <span>Scanning... Hold Still</span>
                </>
              ) : (
                <>
                  <Camera className="h-4 w-4" />
                  <span>Scan / Accept Next Face</span>
                </>
              )}
            </button>

            {/* Grid of Control Action Buttons right next to Camera */}
            <div className="grid grid-cols-2 gap-2.5 pt-1">
              <button
                onClick={handleStartCamera}
                disabled={cameraStatus === 'starting' || isScanningFace}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <Camera className="h-4 w-4 text-orange-500 shrink-0" />
                <span>{cameraStatus === 'starting' ? 'Starting...' : 'Start Camera'}</span>
              </button>

              <button
                onClick={handleStartSession}
                disabled={isPreparingSession || isScanningFace}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-250 bg-emerald-50 px-3.5 py-3 text-xs font-bold text-emerald-700 transition hover:bg-emerald-100/80 disabled:opacity-50"
              >
                <Play className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{isPreparingSession ? 'Preparing...' : 'Start Session'}</span>
              </button>

              <button
                onClick={handleLoadExistingSession}
                disabled={isPreparingSession || isScanningFace}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <FolderOpen className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Load Session</span>
              </button>

              <button
                onClick={handleRetryFace}
                disabled={!session || isScanningFace}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <RefreshCw className="h-4 w-4 text-slate-500 shrink-0" />
                <span>Retry Face</span>
              </button>

              <button
                onClick={handleReset}
                disabled={isScanningFace}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900 disabled:opacity-50"
              >
                <span>Reset Session</span>
              </button>

              <button
                onClick={handleStopCamera}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-slate-200 bg-slate-50 px-3.5 py-3 text-xs font-bold text-slate-700 transition hover:bg-slate-100 hover:text-slate-900"
              >
                <Square className="h-4 w-4 text-rose-500 shrink-0" />
                <span>Stop Camera</span>
              </button>
            </div>

            {cameraStatus === 'ready' && (manualFocusRange || exposureRange) && (
              <div className="rounded-2xl border border-orange-200 bg-gradient-to-br from-orange-50 to-white p-4 space-y-4">
                <div>
                  <p className="text-[11px] font-black uppercase tracking-wider text-slate-800">Camera Image Controls</p>
                  <p className="mt-0.5 text-[10px] leading-relaxed text-slate-500">
                    Blurry cube? Adjust Focus. Washed-out stickers? Move {exposureRange?.type === 'brightness' ? 'Brightness' : 'Exposure'} toward Darker.
                  </p>
                </div>

                {manualFocusRange ? (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-700">Focus</p>
                        <p className="text-[9px] font-semibold text-slate-400">
                          {focusMode === 'auto' ? 'AUTO · Camera is focusing continuously' : 'MANUAL · Set before scanning'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleEnableAutoFocus()}
                        disabled={focusMode === 'auto'}
                        className="rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-orange-700 transition hover:bg-orange-100 disabled:cursor-default disabled:opacity-50"
                      >
                        Use Auto
                      </button>
                    </div>
                    <input
                      type="range"
                      min={manualFocusRange.min}
                      max={manualFocusRange.max}
                      step={manualFocusRange.step}
                      value={focusDistance}
                      onChange={(event) => void handleManualFocusChange(Number(event.target.value))}
                      aria-label="Manual camera focus distance"
                      className="w-full cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Far</span>
                      <span className="text-slate-600">{focusDistance.toFixed(2)}</span>
                      <span>Near</span>
                    </div>
                  </div>
                ) : (
                  <div className="rounded-xl border border-dashed border-orange-200/80 bg-white/70 px-3 py-2 text-[10px] text-slate-500 flex items-center justify-between">
                    <span className="font-bold text-slate-600">Focus: Fixed-Focus</span>
                    <span className="text-[9px] text-slate-400 font-medium">Hardware does not support manual focus distance</span>
                  </div>
                )}

                {manualFocusRange && exposureRange && <div className="h-px bg-orange-100" />}

                {exposureRange && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <p className="text-[11px] font-extrabold text-slate-700">
                          {exposureRange.type === 'brightness' ? 'Brightness' : 'Exposure'}
                        </p>
                        <p className="text-[9px] font-semibold text-slate-400">
                          {exposureMode === 'auto'
                            ? (exposureRange.type === 'brightness' ? 'AUTO · Neutral brightness (0)' : 'AUTO · Neutral brightness')
                            : 'ADJUSTED · Custom level'}
                        </p>
                      </div>
                      <button
                        type="button"
                        onClick={() => void handleEnableAutoExposure()}
                        disabled={exposureMode === 'auto'}
                        className="rounded-lg border border-orange-200 bg-white px-2.5 py-1.5 text-[10px] font-black uppercase text-orange-700 transition hover:bg-orange-100 disabled:cursor-default disabled:opacity-50"
                      >
                        Reset Auto
                      </button>
                    </div>
                    <input
                      type="range"
                      min={exposureRange.min}
                      max={exposureRange.max}
                      step={exposureRange.step}
                      value={exposureCompensation}
                      onChange={(event) => void handleExposureChange(Number(event.target.value))}
                      aria-label={exposureRange.type === 'brightness' ? 'Camera brightness' : 'Camera exposure compensation'}
                      className="w-full cursor-pointer accent-orange-500"
                    />
                    <div className="flex justify-between text-[9px] font-bold uppercase tracking-wider text-slate-400">
                      <span>Darker</span>
                      <span className="text-slate-600">
                        {exposureCompensation > 0 ? '+' : ''}
                        {exposureRange.type === 'brightness'
                          ? Math.round(exposureCompensation)
                          : exposureCompensation.toFixed(1)}
                      </span>
                      <span>Brighter</span>
                    </div>
                  </div>
                )}

                <p className="rounded-xl bg-white/80 px-3 py-2 text-[9px] font-semibold leading-relaxed text-slate-500">
                  Adjust while watching the preview, then hold the cube still and press Scan. Controls appear only when supported by your camera.
                </p>
              </div>
            )}
          </div>


        </div>
      </div>



      {session?.validation && !session.validation.matched && (
        <div className="bg-rose-50 border border-rose-200 p-5 rounded-3xl space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0" />
            <h4 className="text-xs font-black text-rose-600 uppercase tracking-widest">Cube State Mismatch Detected</h4>
          </div>
          <p className="text-[11px] text-slate-600 leading-relaxed font-semibold">
            The scanned sticker states do not match the expected state of the scramble sequence.
            Compare the mismatched slots below and scramble your cube again if necessary:
          </p>
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-[10px] font-bold text-slate-500">
              <thead>
                <tr className="border-b border-slate-200 uppercase tracking-wider text-slate-400">
                  <th className="py-2">Face</th>
                  <th className="py-2">Sticker Pos</th>
                  <th className="py-2 text-rose-600">Expected</th>
                  <th className="py-2 text-orange-600">Observed</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-mono">
                {session.validation.mismatches.map((mismatch, idx) => (
                  <tr key={idx} className="hover:bg-slate-100">
                    <td className="py-2 uppercase font-sans font-extrabold text-slate-800">{mismatch.face}</td>
                    <td className="py-2">Row {mismatch.row + 1}, Col {mismatch.column + 1}</td>
                    <td className="py-2 uppercase text-rose-600">{mismatch.expected}</td>
                    <td className="py-2 uppercase text-orange-600">{mismatch.observed}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <button
            onClick={handleReset}
            className="w-fit px-4 py-2 bg-rose-500 hover:bg-rose-600 text-white font-bold text-xs rounded-xl uppercase transition-all border-none cursor-pointer"
          >
            Reset Session & Re-scan
          </button>
        </div>
      )}

      {error && (
        <div className="bg-rose-50 border border-rose-200 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-600 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-600 uppercase tracking-wider">Scanner Error</h4>
            <p className="text-[11px] text-rose-600 mt-0.5 leading-relaxed font-semibold">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
});


