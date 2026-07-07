'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { useCameraStream } from '@/features/online-arena/contexts/CameraStreamContext';
import {
  markCameraReady,
  markWebRtcConnected,
} from '@/features/online-arena/api/onlineArenaApi';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { useWebRtcSetup } from '@/features/online-arena/hooks/useWebRtcSetup';
import {
  CheckCircle2,
  Circle,
  Camera,
  Radio,
  QrCode,
  Loader2,
  AlertCircle,
  Clock,
  Wifi,
  WifiOff,
} from 'lucide-react';

// ------------------------------------------------------------------
// Utility: countdown string from a UTC deadline
// ------------------------------------------------------------------
function useCountdown(deadlineIso: string | null, serverNowIso: string): string {
  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadlineIso) return 0;
    const skew = Date.now() - new Date(serverNowIso).getTime();
    return Math.max(0, Math.floor((new Date(deadlineIso).getTime() - Date.now() + skew) / 1000));
  });

  useEffect(() => {
    if (!deadlineIso) return;
    const skew = Date.now() - new Date(serverNowIso).getTime();
    const tick = () => {
      const secs = Math.max(0, Math.floor((new Date(deadlineIso).getTime() - Date.now() + skew) / 1000));
      setRemaining(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso, serverNowIso]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ------------------------------------------------------------------
// ChecklistRow component
// ------------------------------------------------------------------
function ChecklistRow({
  icon,
  label,
  sublabel,
  done,
  status,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  sublabel: string;
  done: boolean;
  status?: 'ok' | 'loading' | 'error' | 'pending';
  children?: React.ReactNode;
}) {
  return (
    <div
      className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-300 ${
        done
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : status === 'error'
          ? 'bg-rose-500/5 border-rose-500/20'
          : 'bg-zinc-950/40 border-zinc-800/60 hover:border-zinc-700/60'
      }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className={`mt-0.5 shrink-0 ${
            done ? 'text-emerald-400' : status === 'error' ? 'text-rose-400' : 'text-zinc-500'
          }`}
        >
          {done ? (
            <CheckCircle2 className="h-5 w-5" />
          ) : status === 'loading' ? (
            <Loader2 className="h-5 w-5 animate-spin" />
          ) : status === 'error' ? (
            <AlertCircle className="h-5 w-5" />
          ) : (
            <Circle className="h-5 w-5" />
          )}
        </div>
        <div className="flex-1 space-y-2">
          <div>
            <span className="block text-xs font-bold text-white uppercase tracking-wide">{label}</span>
            <span className="text-[10px] text-zinc-500">{sublabel}</span>
          </div>
          {children}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// OpponentChecklist mini component
// ------------------------------------------------------------------
function OpponentChecklistBadge({ done, label }: { done: boolean; label: string }) {
  return (
    <span
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${
        done
          ? 'text-emerald-400 border-emerald-500/30 bg-emerald-500/10'
          : 'text-zinc-500 border-zinc-700/30 bg-zinc-800/30'
      }`}
    >
      {done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

// ------------------------------------------------------------------
// Main SetupPage
// ------------------------------------------------------------------
export default function RoomSetupPage() {
  const { matchId, state, refetch, connection } = useMatchContext();
  const { stream, cameraError, isAcquiring, acquireStream } = useCameraStream();
  const videoRef = useRef<HTMLVideoElement>(null);

  // Camera-ready call tracker
  const cameraReadyCalledRef = useRef(false);

  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const isP1 = state?.player1?.userId === userId;
  const myState = isP1 ? state?.player1 : state?.player2;
  const opponentState = isP1 ? state?.player2 : state?.player1;

  // ----------------------------------------------------------------
  // Setup deadline countdown
  // ----------------------------------------------------------------
  const countdownStr = useCountdown(
    state?.setupDeadlineAt ?? null,
    state?.serverNow ?? new Date().toISOString()
  );

  // ----------------------------------------------------------------
  // Step 1: Auto-acquire camera on mount
  // ----------------------------------------------------------------
  useEffect(() => {
    if (!myState?.cameraReady && !stream && !isAcquiring) {
      acquireStream();
    }
  }, [myState?.cameraReady, stream, isAcquiring, acquireStream]);

  // Attach stream to video preview element
  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // ----------------------------------------------------------------
  // Step 2: Auto-call markCameraReady when stream is active
  // ----------------------------------------------------------------
  useEffect(() => {
    if (stream && !myState?.cameraReady && !cameraReadyCalledRef.current) {
      cameraReadyCalledRef.current = true;
      markCameraReady(matchId)
        .then(() => refetch())
        .catch((err) => {
          console.error('[Camera] markCameraReady failed', err);
          cameraReadyCalledRef.current = false; // allow retry
        });
    }
  }, [stream, myState?.cameraReady, matchId, refetch]);

  // ----------------------------------------------------------------
  // Step 3: WebRTC connection using the robust useWebRtcSetup hook
  // ----------------------------------------------------------------
  const handleWebRtcConnected = useCallback(async () => {
    await markWebRtcConnected(matchId);
    await refetch();
  }, [matchId, refetch]);

  const {
    status: webRtcStatus,
    error: webRtcError,
    retry: retryWebRtc,
  } = useWebRtcSetup({
    matchId,
    isP1,
    opponentUserId: opponentState?.userId ?? null,
    connection: connection ?? null,
    stream,
    alreadyConnected: myState?.webRtcConnected ?? false,
    onConnected: handleWebRtcConnected,
  });

  if (!state || !myState) return null;

  const allDone = myState.checklistPassed;

  return (
    <div className="space-y-6 animate-fade-in max-w-2xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 1 / 4
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">ROOM SETUP</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Prepare your battle station. All items must be verified before scramble scanning.
        </p>
      </div>

      {/* Setup deadline banner */}
      {state.setupDeadlineAt && (
        <div
          className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${
            parseInt(countdownStr) < 60
              ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
              : 'border-orange-500/20 bg-orange-500/10 text-orange-400'
          }`}
        >
          <span className="flex items-center gap-1.5">
            <Clock className="h-3.5 w-3.5" />
            Setup deadline
          </span>
          <span className="font-mono text-base font-black">{countdownStr}</span>
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {/* Left: Video preview */}
        <div className="md:col-span-1 flex flex-col gap-3">
          <div className="bg-zinc-900/60 border border-zinc-800/80 rounded-2xl overflow-hidden aspect-video relative">
            {stream ? (
              <video
                ref={videoRef}
                autoPlay
                muted
                playsInline
                className="w-full h-full object-cover"
              />
            ) : cameraError ? (
              <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2">
                <AlertCircle className="h-8 w-8 text-rose-400" />
                <p className="text-[10px] text-rose-300">{cameraError}</p>
                <button
                  onClick={() => { cameraReadyCalledRef.current = false; acquireStream(); }}
                  className="px-3 py-1.5 bg-rose-500 text-white text-[10px] font-bold rounded-xl uppercase"
                >
                  Retry
                </button>
              </div>
            ) : (
              <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
                <p className="text-[10px] text-zinc-500">Requesting camera...</p>
              </div>
            )}

            {/* REC indicator placeholder — recording only starts in COUNTDOWN */}
            {stream && (
              <div className="absolute top-2 left-2 flex items-center gap-1 bg-zinc-950/70 rounded-full px-2 py-0.5">
                <Camera className="h-3 w-3 text-emerald-400" />
                <span className="text-[9px] font-bold text-emerald-400 uppercase">LIVE</span>
              </div>
            )}
          </div>

          {/* WebRTC mini status */}
          <div className={`flex items-center gap-2 px-3 py-2 rounded-xl border text-[10px] font-bold uppercase ${
            myState.webRtcConnected
              ? 'border-emerald-500/20 bg-emerald-500/10 text-emerald-400'
              : webRtcStatus === 'error'
              ? 'border-rose-500/20 bg-rose-500/10 text-rose-400'
              : 'border-zinc-700/30 bg-zinc-800/30 text-zinc-500'
          }`}>
            {myState.webRtcConnected ? (
              <Wifi className="h-3.5 w-3.5" />
            ) : webRtcStatus === 'connecting' ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : (
              <WifiOff className="h-3.5 w-3.5" />
            )}
            {myState.webRtcConnected
              ? 'P2P Connected'
              : webRtcStatus === 'connecting'
              ? 'Negotiating ICE...'
              : webRtcStatus === 'error'
              ? 'P2P Failed'
              : 'Awaiting camera'}
          </div>
        </div>

        {/* Right: Checklist */}
        <div className="md:col-span-2 bg-zinc-900/60 border border-zinc-800/80 rounded-3xl p-5 backdrop-blur-md shadow-xl space-y-3">
          {/* 1. Camera */}
          <ChecklistRow
            icon={<Camera className="h-4 w-4" />}
            label="Camera Initialization"
            sublabel="Auto-acquired via getUserMedia"
            done={myState.cameraReady}
            status={
              myState.cameraReady ? 'ok'
              : cameraError ? 'error'
              : isAcquiring || stream ? 'loading'
              : 'pending'
            }
          >
            {cameraError && !myState.cameraReady && (
              <button
                onClick={() => { cameraReadyCalledRef.current = false; acquireStream(); }}
                className="px-3 py-1.5 bg-rose-500 hover:bg-rose-600 text-white text-[10px] font-bold rounded-xl uppercase"
              >
                Retry Camera
              </button>
            )}
          </ChecklistRow>

          {/* 2. WebRTC */}
          <ChecklistRow
            icon={<Wifi className="h-4 w-4" />}
            label="WebRTC P2P Connection"
            sublabel={
              myState.webRtcConnected
                ? 'Peer-to-peer channel established'
                : webRtcStatus === 'error'
                ? webRtcError ?? 'Connection failed'
                : 'Auto-negotiating ICE via STUN'
            }
            done={myState.webRtcConnected}
            status={
              myState.webRtcConnected ? 'ok'
              : webRtcStatus === 'error' ? 'error'
              : webRtcStatus === 'connecting' ? 'loading'
              : 'pending'
            }
          >
            {webRtcStatus === 'error' && !myState.webRtcConnected && (
              <button
                onClick={retryWebRtc}
                className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 text-white text-[10px] font-bold rounded-xl uppercase"
              >
                Retry WebRTC
              </button>
            )}
          </ChecklistRow>

          {/* 3. Mobile Timer */}
          <ChecklistRow
            icon={<QrCode className="h-4 w-4" />}
            label="Mobile Timer"
            sublabel="Scan QR to pair Stackmat mobile device"
            done={myState.timerReady}
            status={myState.timerReady ? 'ok' : 'pending'}
          >
            {state.qrSessionCode && !myState.timerReady && (
              <div className="bg-white p-2.5 rounded-xl w-fit border border-zinc-800 shadow-inner">
                <img
                  src={`https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(state.qrSessionCode)}`}
                  alt="Session Pairing QR"
                  className="h-28 w-28 object-contain"
                />
              </div>
            )}
          </ChecklistRow>

          {/* 4. Scramble Check — accessible once cam+webrtc+timer done */}
          <ChecklistRow
            icon={<Radio className="h-4 w-4" />}
            label="Scramble Verification"
            sublabel={
              myState.scrambleCheckStatus === 'PASSED'
                ? 'Cube state verified ✓'
                : myState.cameraReady && myState.webRtcConnected && myState.timerReady
                ? 'Ready to scan — proceed to Scramble tab'
                : 'Complete steps 1–3 first'
            }
            done={myState.scrambleCheckStatus === 'PASSED'}
            status={myState.scrambleCheckStatus === 'PASSED' ? 'ok' : 'pending'}
          />

          {/* All done indicator */}
          {allDone && (
            <div className="mt-2 p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-2xl text-center">
              <p className="text-xs font-black text-emerald-400 uppercase tracking-widest flex items-center justify-center gap-2">
                <CheckCircle2 className="h-4 w-4" />
                You are ready — waiting for opponent
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Opponent progress */}
      {opponentState && (
        <div className="bg-zinc-900/40 border border-zinc-800/60 rounded-2xl px-4 py-3">
          <p className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-2">
            Opponent: {opponentState.displayName ?? 'Opponent'}
          </p>
          <div className="flex flex-wrap gap-1.5">
            <OpponentChecklistBadge done={opponentState.cameraReady} label="Camera" />
            <OpponentChecklistBadge done={opponentState.webRtcConnected} label="WebRTC" />
            <OpponentChecklistBadge done={opponentState.timerReady} label="Timer" />
            <OpponentChecklistBadge done={opponentState.scrambleCheckStatus === 'PASSED'} label="Scramble" />
            {opponentState.checklistPassed && (
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border text-emerald-400 border-emerald-500/30 bg-emerald-500/10">
                <CheckCircle2 className="h-2.5 w-2.5" />
                READY
              </span>
            )}
          </div>
        </div>
      )}

      {/* Bottom status */}
      <div className="text-center">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" />
          {allDone ? 'Waiting for opponent to complete setup...' : 'Complete all checklist items above'}
        </span>
      </div>
    </div>
  );
}
