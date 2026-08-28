'use client';

import React, { useMemo, useEffect, useRef, useState, useCallback } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { useCameraStream } from '@/features/online-arena/contexts/CameraStreamContext';
import { useWebRtcContext } from '@/features/online-arena/contexts/WebRtcContext';
import {
  markWebRtcConnected,
} from '@/features/online-arena/api/onlineArenaApi';
import { parseJwt, getAccessToken } from '@/lib/api/config';
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
  Copy,
  Check,
} from 'lucide-react';

// ------------------------------------------------------------------
// Utility: countdown string from a UTC deadline
// ------------------------------------------------------------------
function useCountdown(deadlineIso: string | null, serverNowIso: string): string {
  const skewRef = React.useRef<number | null>(null);

  const parseUtc = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
    return new Date(hasTimezone ? dateStr : `${dateStr}Z`).getTime();
  };

  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadlineIso) return 0;
    const skew = Date.now() - parseUtc(serverNowIso);
    skewRef.current = skew;
    return Math.max(0, Math.floor((parseUtc(deadlineIso) - Date.now() + skew) / 1000));
  });

  useEffect(() => {
    if (!deadlineIso) return;

    if (skewRef.current === null) {
      skewRef.current = Date.now() - parseUtc(serverNowIso);
    }
    const stableSkew = skewRef.current;

    const tick = () => {
      const secs = Math.max(0, Math.floor((parseUtc(deadlineIso) - Date.now() + stableSkew) / 1000));
      setRemaining(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ------------------------------------------------------------------
function CountdownTimer({ deadlineIso, serverNowIso }: { deadlineIso: string | null; serverNowIso: string }) {
  const countdownStr = useCountdown(deadlineIso, serverNowIso);
  if (!deadlineIso) return null;
  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${parseInt(countdownStr) < 60
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
  );
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
      className={`flex items-start justify-between p-4 rounded-2xl border transition-all duration-300 ${done
          ? 'bg-emerald-500/5 border-emerald-500/20'
          : status === 'error'
            ? 'bg-rose-500/5 border-rose-500/20'
            : 'bg-card border-border hover:border-orange-500/50'
        }`}
    >
      <div className="flex items-start gap-3 flex-1">
        <div
          className={`mt-0.5 shrink-0 ${done ? 'text-emerald-500' : status === 'error' ? 'text-rose-500' : 'text-muted-foreground'
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
            <span className="block text-xs font-bold text-foreground uppercase tracking-wide">{label}</span>
            <span className="text-[10px] text-muted-foreground">{sublabel}</span>
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
      className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase border ${done
          ? 'text-emerald-600 border-emerald-500/30 bg-emerald-500/10'
          : 'text-muted-foreground border-border bg-muted/40'
        }`}
    >
      {done ? <CheckCircle2 className="h-2.5 w-2.5" /> : <Circle className="h-2.5 w-2.5" />}
      {label}
    </span>
  );
}

// ------------------------------------------------------------------
// WebRtcConnectStep component — reads WebRTC state from layout-level WebRtcContext
// ------------------------------------------------------------------
function WebRtcConnectStep({
  matchId,
  isP1,
  opponentUserId,
  connection,
  alreadyConnected,
  onConnected,
}: {
  matchId?: string;
  isP1: boolean;
  opponentUserId?: string | null;
  connection?: any;
  alreadyConnected: boolean;
  onConnected: () => Promise<void>;
}) {
  // Camera stream comes from WebRtcContext (which internally uses CameraStreamContext)
  const { status, error, remoteStream, localStream, retry, acquireLocalStream } = useWebRtcContext();
  const { stream, cameraError, isAcquiring, acquireStream } = useCameraStream();
  const videoRef = useRef<HTMLVideoElement>(null);
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState<string>('');

  // Enumerate video devices for camera selector
  useEffect(() => {
    if (typeof navigator !== 'undefined' && navigator.mediaDevices) {
      navigator.mediaDevices.enumerateDevices().then((allDevices) => {
        const videoDevices = allDevices.filter((d) => d.kind === 'videoinput');
        setDevices(videoDevices);
      });
    }
  }, [localStream]);

  // Attach local stream to video tag
  useEffect(() => {
    const s = localStream ?? stream;
    if (videoRef.current && s) {
      videoRef.current.srcObject = s;
    }
  }, [localStream, stream]);

  // Attach remote stream to video tag
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => {
        console.warn('[WebRTC] Setup remote video play error:', err);
      });
    }
  }, [remoteStream]);

  const currentStream = localStream ?? stream;

  return (
    <div className="bg-card/60 border border-border/80 rounded-3xl p-5 shadow-md space-y-4">
      <div className="flex items-center gap-2">
        <Wifi className="h-5 w-5 text-orange-500" />
        <span className="text-sm font-bold text-foreground uppercase tracking-wider">WebRTC P2P Connection</span>
      </div>
      <p className="text-xs text-muted-foreground">
        Establishing a direct peer-to-peer connection for live video supervision during the solve.
      </p>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Local Video Stream — MY camera */}
        <div className="bg-background border border-border/80 rounded-2xl overflow-hidden aspect-video relative">
          {currentStream ? (
            <video
              ref={videoRef}
              autoPlay
              muted
              playsInline
              className="w-full h-full object-cover"
            />
          ) : cameraError ? (
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-3 gap-2">
              <AlertCircle className="h-6 w-6 text-rose-500" />
              <p className="text-[10px] text-rose-600 leading-relaxed">{cameraError}</p>
              <button
                onClick={() => acquireStream(selectedDeviceId || undefined)}
                className="px-2.5 py-1.5 bg-rose-500 text-white text-[9px] font-bold rounded-lg uppercase cursor-pointer border-none"
              >
                Retry
              </button>
            </div>
          ) : (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
              <p className="text-[10px] text-muted-foreground">Starting camera stream...</p>
            </div>
          )}
          <div className="absolute top-2 left-2 flex items-center gap-1 bg-background/70 rounded-full px-2 py-0.5 z-10">
            <Camera className="h-3 w-3 text-emerald-500" />
            <span className="text-[9px] font-bold text-emerald-500 uppercase">You</span>
          </div>

          {devices.length > 1 && (
            <div className="absolute bottom-2 right-2 max-w-[150px] z-10">
              <select
                value={selectedDeviceId}
                onChange={(e) => {
                  const devId = e.target.value;
                  setSelectedDeviceId(devId);
                  acquireStream(devId);
                }}
                className="w-full bg-background/90 text-foreground text-[9px] font-black border border-border rounded px-2 py-1 focus:outline-none focus:border-orange-500/50 cursor-pointer"
              >
                <option value="">Default Camera</option>
                {devices.map((d, index) => (
                  <option key={d.deviceId} value={d.deviceId} className="bg-background text-foreground">
                    {d.label || `Camera ${index + 1}`}
                  </option>
                ))}
              </select>
            </div>
          )}
        </div>

        {/* Remote Video Stream — OPPONENT camera */}
        <div className="bg-background border border-border/80 rounded-2xl overflow-hidden aspect-video relative">
          {/* Video element always mounted so remoteStream can be attached immediately */}
          <video
            ref={remoteVideoRef}
            autoPlay
            muted
            playsInline
            className={`w-full h-full object-cover ${remoteStream ? 'block' : 'hidden'}`}
          />

          {!remoteStream && (
            <div className="absolute inset-0 flex flex-col items-center justify-center gap-2">
              {status === 'connected' || alreadyConnected ? (
                // Connected but remote track not yet flowing — very brief moment
                <>
                  <Loader2 className="h-6 w-6 text-emerald-500 animate-spin" />
                  <p className="text-[10px] text-zinc-500">Receiving opponent stream...</p>
                </>
              ) : status === 'error' ? (
                <>
                  <AlertCircle className="h-6 w-6 text-rose-400" />
                  <p className="text-[10px] text-rose-400">Connection failed</p>
                  <button
                    onClick={retry}
                    className="px-2.5 py-1.5 bg-orange-500 text-white text-[9px] font-bold rounded-lg uppercase cursor-pointer"
                  >
                    Retry
                  </button>
                </>
              ) : (
                <>
                  <Loader2 className="h-6 w-6 text-orange-500 animate-spin" />
                  <p className="text-[10px] text-zinc-500">Waiting for opponent camera...</p>
                </>
              )}
            </div>
          )}

          <div className="absolute top-2 left-2 flex items-center gap-1 bg-zinc-950/70 rounded-full px-2 py-0.5 z-10">
            <Radio className="h-3 w-3 text-orange-400" />
            <span className="text-[9px] font-bold text-orange-400 uppercase">Opponent</span>
          </div>

          {/* ICE status + Reconnect button + Force Connect bypass */}
          {!remoteStream && (
            <div className="absolute bottom-2 left-2 right-2 z-10 flex flex-col gap-1">
              {/* Reconnect row */}
              <div className="flex items-center justify-between gap-1.5 bg-zinc-950/90 border border-zinc-800/80 rounded-lg px-2 py-1">
                <div className="flex items-center gap-1.5 min-w-0">
                  <Loader2 className="h-3 w-3 text-orange-500 animate-spin shrink-0" />
                  <span className="text-[9px] text-zinc-400 truncate">
                    {status === 'connected' || alreadyConnected
                      ? 'Stream pending...'
                      : status === 'connecting'
                        ? (isP1 ? 'P2P Connecting...' : 'Awaiting P2P Offer...')
                        : 'P2P Stall'}
                  </span>
                </div>
                <button
                  onClick={retry}
                  className="px-2 py-0.5 bg-orange-500 hover:bg-orange-600 text-white text-[9px] font-bold rounded uppercase cursor-pointer shrink-0 transition-colors"
                >
                  Reconnect
                </button>
              </div>
              {/* Force Connect bypass — always visible when stuck */}
              {!alreadyConnected && (
                <button
                  onClick={onConnected}
                  className="w-full py-1 bg-zinc-800 hover:bg-emerald-800/60 border border-zinc-700 hover:border-emerald-600/50 text-zinc-400 hover:text-emerald-400 text-[9px] font-bold rounded-lg uppercase tracking-wider cursor-pointer transition-colors"
                  title="Mark P2P as connected and proceed (use when auto-connect fails)"
                >
                  Force Connect &amp; Proceed
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ------------------------------------------------------------------
// Main SetupPage
// ------------------------------------------------------------------
export default function RoomSetupPage() {
  const { matchId, state, refetch, connection } = useMatchContext();
  const { releaseStream } = useCameraStream();

  // Step is only timer, webrtc, completed — scramble is handled before redirecting here
  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const isP1 = state?.player1?.userId === userId;
  const myState = isP1 ? state?.player1 : state?.player2;
  const opponentState = isP1 ? state?.player2 : state?.player1;

  const [copiedToken, setCopiedToken] = useState(false);
  const [qrProvider, setQrProvider] = useState<'qrserver' | 'quickchart'>('qrserver');
  const [overrideStep, setOverrideStep] = useState<'timer' | 'webrtc' | null>(null);

  const pairingCode = useMemo(() => {
    const sessionCode = state?.qrSessionCode || (typeof matchId === 'string' && matchId ? matchId.slice(0, 8).toUpperCase() : 'ARENA');
    return `${sessionCode}:${isP1 ? 'P1' : 'P2'}`;
  }, [state?.qrSessionCode, matchId, isP1]);

  const qrImageUrl = useMemo(() => {
    if (qrProvider === 'qrserver') {
      return `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(pairingCode)}`;
    }
    return `https://quickchart.io/qr?text=${encodeURIComponent(pairingCode)}&size=200`;
  }, [pairingCode, qrProvider]);

  const handleCopyToken = () => {
    navigator.clipboard.writeText(pairingCode);
    setCopiedToken(true);
    setTimeout(() => setCopiedToken(false), 2000);
  };

  const autoStep = useMemo(() => {
    if (!myState) return 'timer';
    if (!myState.timerReady) return 'timer';
    if (!myState.webRtcConnected) return 'webrtc';
    return 'completed';
  }, [myState]);

  const currentStep = overrideStep || autoStep;

  const handleWebRtcConnected = useCallback(async () => {
    if (!matchId) return;
    await markWebRtcConnected(matchId);
    await refetch();
  }, [matchId, refetch]);

  if (!state || !myState) {
    return (
      <div className="flex flex-col items-center justify-center p-12 space-y-3 min-h-[400px]">
        <Loader2 className="h-8 w-8 text-orange-500 animate-spin" />
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          Initializing Battle Station...
        </span>
      </div>
    );
  }

  const allDone = Boolean(myState.checklistPassed);

  return (
    <div className="space-y-6 animate-fade-in max-w-4xl mx-auto w-full">
      {/* Header */}
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 1 / 4
        </span>
        <h2 className="text-3xl font-black text-foreground uppercase tracking-wider">ROOM SETUP</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Prepare your battle station. All items must be verified before the countdown starts.
        </p>
      </div>

      {/* Setup deadline banner */}
      <CountdownTimer deadlineIso={state.setupDeadlineAt ?? null} serverNowIso={state.serverNow ?? new Date().toISOString()} />

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Active Step Panel (md:col-span-2) */}
        <div className="md:col-span-2 space-y-4">


          {currentStep === 'timer' && (
            <div className="bg-card/60 border border-border/80 rounded-3xl p-5 shadow-md space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <QrCode className="h-5 w-5 text-orange-500" />
                  <span className="text-sm font-bold text-foreground uppercase tracking-wider">Step 3: Pair Mobile Timer</span>
                </div>
                {myState.timerReady && (
                  <button
                    type="button"
                    onClick={() => setOverrideStep('webrtc')}
                    className="px-3 py-1 bg-emerald-500/10 border border-emerald-500/30 text-emerald-500 rounded-xl text-xs font-bold hover:bg-emerald-500/20 transition cursor-pointer"
                  >
                    Go to Camera Setup &rarr;
                  </button>
                )}
              </div>
              <p className="text-xs text-muted-foreground">
                Scan the QR code below using your CubeNexus Mobile App to pair it as a Stackmat-compatible solve timer.
              </p>

              <div className="flex flex-col items-center justify-center p-6 bg-background border border-border/60 rounded-2xl gap-4">
                <div className="bg-white p-3 rounded-2xl border border-border shadow-inner relative flex items-center justify-center min-h-[160px] min-w-[160px]">
                  <img
                    src={qrImageUrl}
                    alt="Session Pairing QR"
                    className="h-36 w-36 object-contain"
                    onError={() => {
                      if (qrProvider === 'qrserver') {
                        setQrProvider('quickchart');
                      }
                    }}
                  />
                </div>

                <p className="text-[11px] text-muted-foreground text-center">
                  Open Mobile App &gt; <strong>Timer</strong> &gt; <strong>Scan QR</strong> to pair your device.
                </p>
              </div>
            </div>
          )}

          {currentStep === 'webrtc' && (
            <div className="space-y-3">
              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={() => setOverrideStep('timer')}
                  className="px-3 py-1 bg-muted hover:bg-muted/80 text-muted-foreground hover:text-foreground border border-border rounded-xl text-xs font-bold flex items-center gap-1.5 transition cursor-pointer"
                >
                  <QrCode className="h-3.5 w-3.5 text-orange-500" />
                  <span>View / Re-pair Mobile Timer</span>
                </button>
              </div>
              <WebRtcConnectStep
                matchId={matchId}
                isP1={isP1}
                opponentUserId={opponentState?.userId ?? null}
                connection={connection ?? null}
                alreadyConnected={myState?.webRtcConnected ?? false}
                onConnected={handleWebRtcConnected}
              />
            </div>
          )}

          {currentStep === 'completed' && (
            <div className="bg-card/60 border border-border/80 rounded-3xl p-8 shadow-md text-center space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mx-auto text-emerald-500">
                <CheckCircle2 className="h-6 w-6 animate-pulse" />
              </div>
              <div className="space-y-1">
                <h3 className="text-sm font-bold text-foreground uppercase tracking-wider">Setup Complete</h3>
                <p className="text-xs text-muted-foreground">
                  Waiting for your opponent to complete their readiness setup. Keep this window open.
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Right checklist column (md:col-span-1) */}
        <div className="md:col-span-1 bg-card/60 border border-border/80 rounded-3xl p-5 backdrop-blur-md shadow-md flex flex-col gap-3">
          <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest">My Progress</span>

          <ChecklistRow
            icon={<Radio className="h-4 w-4" />}
            label="Scramble Scan"
            sublabel="AI cube calibration"
            done={myState.scrambleCheckStatus === 'PASSED'}
            status={myState.scrambleCheckStatus === 'PASSED' ? 'ok' : 'pending'}
          />

          <div
            onClick={() => setOverrideStep('timer')}
            className="cursor-pointer transition hover:opacity-90"
            title="Click to view Timer QR code"
          >
            <ChecklistRow
              icon={<QrCode className="h-4 w-4" />}
              label="Mobile Timer"
              sublabel={myState.timerReady ? "Connected (Click to re-view QR)" : "Device pairing active"}
              done={myState.timerReady}
              status={myState.timerReady ? 'ok' : currentStep === 'timer' ? 'loading' : 'pending'}
            />
          </div>

          <div
            onClick={() => setOverrideStep('webrtc')}
            className="cursor-pointer transition hover:opacity-90"
            title="Click to view Camera WebRTC setup"
          >
            <ChecklistRow
              icon={<Wifi className="h-4 w-4" />}
              label="P2P Connection"
              sublabel="Opponent video feed link"
              done={myState.webRtcConnected}
              status={
                myState.webRtcConnected ? 'ok'
                  : currentStep === 'webrtc' ? 'loading'
                    : 'pending'
              }
            />
          </div>

          {opponentState && (
            <div className="mt-4 pt-4 border-t border-border/80 space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest block">Opponent Progress</span>
              <p className="text-[10px] font-bold text-muted-foreground uppercase truncate">
                {opponentState.displayName || 'Opponent'}
              </p>
              <div className="grid grid-cols-2 gap-1.5">
                <OpponentChecklistBadge done={opponentState.scrambleCheckStatus === 'PASSED'} label="Scramble" />
                <OpponentChecklistBadge done={opponentState.timerReady} label="Timer" />
                <OpponentChecklistBadge done={opponentState.webRtcConnected} label="WebRTC" />
              </div>
              {opponentState.checklistPassed && (
                <div className="mt-2 p-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl text-center">
                  <span className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">READY FOR BATTLE</span>
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Bottom status */}
      <div className="text-center">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" />
          {allDone ? 'Waiting for opponent to complete setup...' : 'Complete all checklist items above'}
        </span>
      </div>
    </div>
  );
}
