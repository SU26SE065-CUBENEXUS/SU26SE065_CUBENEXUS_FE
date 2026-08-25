'use client';

import React, { useEffect, useRef } from 'react';
import { Shield, User, Video, VideoOff, Wifi, Award, Activity } from 'lucide-react';
import type { OnlineMatchRecoveryStateDto } from '../types';
import { useWebRtcContext } from '../contexts/WebRtcContext';

interface OpponentSidebarProps {
  state: OnlineMatchRecoveryStateDto | null;
  userId: string;
}

export function OpponentSidebar({ state, userId }: OpponentSidebarProps) {
  const { remoteStream, status } = useWebRtcContext();
  const remoteVideoRef = useRef<HTMLVideoElement>(null);

  // Attach remote stream to video element whenever it changes
  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
      remoteVideoRef.current.play().catch((err) => {
        console.warn('[WebRTC] Opponent video play error:', err);
      });
    }
  }, [remoteStream]);

  if (!state) {
    return (
      <div className="w-80 bg-card border-l border-border p-6 flex flex-col justify-center items-center text-muted-foreground/60 animate-pulse">
        <User className="h-12 w-12 mb-3" />
        <span className="text-xs uppercase font-semibold">Loading Opponent...</span>
      </div>
    );
  }

  const isP1 = state.player1.userId === userId;
  const oppState = isP1 ? state.player2 : state.player1;
  const oppElo = (isP1 ? state.player2EloBefore : state.player1EloBefore) ?? (oppState as any)?.eloBefore ?? 1000;

  // Determine opponent display status
  let statusText = 'SETUP ROOM';
  let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  if (oppState.resultStatus === 'PENDING') {
    if (state.phase === 'INSPECTION') {
      statusText = 'INSPECTING';
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    } else if (state.phase === 'SOLVING') {
      statusText = 'SOLVING';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else {
      statusText = 'SETUP ROOM';
      statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
    }
  } else if (oppState.resultStatus === 'VALID') {
    statusText = 'FINISHED';
    statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
  } else if (oppState.resultStatus === 'DNF') {
    statusText = 'DNF';
    statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  }

  const oppTimeFormatted =
    oppState.timeMs && oppState.timeMs > 0
      ? (() => {
          const ms = oppState.timeMs;
          const seconds = Math.floor(ms / 1000);
          const centiseconds = Math.floor((ms % 1000) / 10);
          return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
        })()
      : null;

  const isSetupPhase = ['ROOM_SETUP', 'WEBRTC_CONNECTING', 'MOBILE_TIMER_PAIRING', 'SCRAMBLE_CHECKING'].includes(state.phase);

  return (
    <div className="w-80 bg-card border-l border-border p-5 flex flex-col justify-between shrink-0 shadow-md relative">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Opponent Profile Header */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between border-b border-border/80 pb-4">
          <h3 className="text-xs font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
            <Activity className="h-4 w-4 text-orange-500" /> OPPONENT BOARD
          </h3>
          <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${statusColor}`}>
            {statusText}
          </span>
        </div>

        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
            <User className="h-5 w-5" />
          </div>
          <div className="min-w-0">
            <h4 className="text-sm font-bold text-foreground truncate">
              {oppState.displayName || `Player_${oppState.userId.slice(0, 6)}`}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-muted-foreground mt-0.5">
              <Award className="h-3.5 w-3.5 text-orange-500" />
              <span>{oppElo} ELO</span>
            </div>
          </div>
        </div>


        {/* Live Camera Feed */}
        <div className="aspect-video w-full rounded-2xl bg-background border border-border/60 overflow-hidden relative group">
          {/* Actual remote video stream */}
          <video
            ref={remoteVideoRef}
            autoPlay
            muted
            playsInline
            className={`absolute inset-0 w-full h-full object-cover ${remoteStream ? 'block' : 'hidden'}`}
          />

          {/* Placeholder when stream not yet received */}
          {!remoteStream && (
            <div className="absolute inset-0 flex items-center justify-center bg-background/80">
              {status === 'connected' ? (
                // Connected but track hasn't arrived yet — very brief
                <Video className="h-8 w-8 text-emerald-600 animate-pulse" />
              ) : (
                <Video className="h-8 w-8 text-muted-foreground/40 animate-pulse" />
              )}
            </div>
          )}

          {/* Overlay: LIVE FEED badge + connection status */}
          <div className="absolute inset-0 bg-black/5 flex flex-col justify-between p-3.5 z-10 pointer-events-none">
            <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full w-fit border ${
              remoteStream
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                : status === 'connected'
                ? 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20 animate-pulse'
                : 'text-muted-foreground/60 bg-muted/50 border-border/50'
            }`}>
              <Wifi className="h-3.5 w-3.5" />
              {remoteStream ? 'LIVE FEED' : status === 'connected' ? 'BUFFERING...' : 'WAITING...'}
            </span>
            {(remoteStream || status === 'connected') && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-foreground/80 font-bold">WebRTC Connected</span>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Live Setup Status Indicators (Shown only during room setup phase) */}
        {isSetupPhase && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-muted/60 border border-border/60 p-3 rounded-xl">
              <span className="block text-[9px] text-muted-foreground uppercase font-black tracking-wider">Scramble</span>
              <span className={`text-xs font-bold ${
                oppState.scrambleCheckStatus === 'PASSED' ? 'text-indigo-600' : 'text-muted-foreground'
              }`}>
                {oppState.scrambleCheckStatus === 'PASSED' ? 'PASSED' : 'PENDING'}
              </span>
            </div>

            <div className="bg-muted/60 border border-border/60 p-3 rounded-xl">
              <span className="block text-[9px] text-muted-foreground uppercase font-black tracking-wider">Ready State</span>
              <span className={`text-xs font-bold ${
                oppState.checklistPassed || oppState.isReady ? 'text-emerald-600' : 'text-muted-foreground'
              }`}>
                {oppState.checklistPassed || oppState.isReady ? 'READY' : 'SETTING UP'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Opponent Results Card */}
      <div className="space-y-4 pt-4 border-t border-border/80 relative z-10">
        <div>
          <span className="block text-[10px] text-muted-foreground uppercase font-black tracking-widest mb-1">
            Opponent Time
          </span>
          {resultTime ? (
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono tracking-tight ${
                oppState.resultStatus === 'DNF' ? 'text-rose-500' : 'text-foreground'
              }`}>
                {resultTime}
              </span>
              <span className="text-[10px] font-bold text-muted-foreground uppercase">SUBMITTED</span>
            </div>
          ) : (
            <span className="text-lg font-black text-muted-foreground/60 font-mono tracking-wider animate-pulse">
              SOLVING...
            </span>
          )}
        </div>

        {oppState.resultStatus === 'VALID' && (
          <div className="bg-muted/50 border border-border/50 p-3.5 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground">Finish Check</span>
            <span className={`text-xs font-bold ${
              oppState.finishCheckStatus === 'PASSED'
                ? 'text-emerald-600'
                : oppState.finishCheckStatus === 'FAILED'
                ? 'text-rose-600'
                : 'text-orange-500 animate-pulse'
            }`}>
              {oppState.finishCheckStatus === 'PASSED'
                ? 'PASSED'
                : oppState.finishCheckStatus === 'FAILED'
                ? 'FAILED'
                : 'SCANNING...'}
            </span>
          </div>
        )}
      </div>
    </div>
  );
}
