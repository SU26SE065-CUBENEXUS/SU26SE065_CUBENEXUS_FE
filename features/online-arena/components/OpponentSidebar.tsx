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
      <div className="w-80 bg-zinc-950/80 border-l border-zinc-800 p-6 flex flex-col justify-center items-center text-zinc-500 animate-pulse">
        <User className="h-12 w-12 mb-3" />
        <span className="text-xs uppercase font-semibold">Loading Opponent...</span>
      </div>
    );
  }

  const isP1 = state.player1.userId === userId;
  const oppState = isP1 ? state.player2 : state.player1;
  const oppElo = isP1 ? state.player2EloBefore : state.player1EloBefore;

  // Determine opponent display status
  let statusText = 'SETUP ROOM';
  let statusColor = 'text-amber-400 bg-amber-500/10 border-amber-500/20';

  if (oppState.resultStatus === 'PENDING') {
    if (state.phase === 'INSPECTION') {
      statusText = 'INSPECTION';
      statusColor = 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20';
    } else if (state.phase === 'SOLVING') {
      statusText = 'SOLVING';
      statusColor = 'text-green-400 bg-green-500/10 border-green-500/20';
    } else if (oppState.checklistPassed || oppState.isReady) {
      statusText = 'READY';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (oppState.scrambleCheckStatus === 'PASSED') {
      statusText = 'SCRAMBLED';
      statusColor = 'text-indigo-400 bg-indigo-500/10 border-indigo-500/20';
    }
  } else if (oppState.resultStatus === 'DNF') {
    statusText = 'DNF';
    statusColor = 'text-rose-400 bg-rose-500/10 border-rose-500/20';
  } else if (oppState.resultStatus === 'VALID') {
    if (oppState.finishCheckStatus === 'PASSED') {
      statusText = 'VERIFIED';
      statusColor = 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20';
    } else if (oppState.finishCheckStatus === 'FAILED') {
      statusText = 'REVIEW REQ';
      statusColor = 'text-red-400 bg-red-500/10 border-red-500/20';
    } else {
      statusText = 'SCANNING FINISH';
      statusColor = 'text-orange-400 bg-orange-500/10 border-orange-500/20';
    }
  }

  // Format result time if available
  const resultTime =
    oppState.resultStatus === 'DNF'
      ? 'DNF'
      : oppState.timeMs !== null
      ? (() => {
          const ms = oppState.timeMs;
          const seconds = Math.floor(ms / 1000);
          const centiseconds = Math.floor((ms % 1000) / 10);
          return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
        })()
      : null;

  const isSetupPhase = ['ROOM_SETUP', 'WEBRTC_CONNECTING', 'MOBILE_TIMER_PAIRING', 'SCRAMBLE_CHECKING'].includes(state.phase);

  return (
    <div className="w-80 bg-zinc-950/70 backdrop-blur-md border-l border-zinc-800/80 p-5 flex flex-col justify-between shrink-0 shadow-2xl relative">
      <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />

      {/* Opponent Profile Header */}
      <div className="space-y-4 relative z-10">
        <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
          <h3 className="text-xs font-black text-zinc-400 uppercase tracking-widest flex items-center gap-1.5">
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
            <h4 className="text-sm font-bold text-white truncate">
              {oppState.displayName || `Player_${oppState.userId.slice(0, 6)}`}
            </h4>
            <div className="flex items-center gap-1.5 text-xs text-zinc-400 mt-0.5">
              <Award className="h-3.5 w-3.5 text-orange-400" />
              <span>{oppElo !== null && oppElo !== undefined ? `${oppElo} ELO` : '1500 ELO'}</span>
            </div>
          </div>
        </div>


        {/* Live Camera Feed */}
        <div className="aspect-video w-full rounded-2xl bg-zinc-900 border border-zinc-800/60 overflow-hidden relative group">
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
            <div className="absolute inset-0 flex items-center justify-center bg-zinc-950/80">
              {status === 'connected' ? (
                // Connected but track hasn't arrived yet — very brief
                <Video className="h-8 w-8 text-emerald-600 animate-pulse" />
              ) : (
                <Video className="h-8 w-8 text-zinc-700 animate-pulse" />
              )}
            </div>
          )}

          {/* Overlay: LIVE FEED badge + connection status */}
          <div className="absolute inset-0 bg-black/20 flex flex-col justify-between p-3.5 z-10 pointer-events-none">
            <span className={`flex items-center gap-1.5 text-[10px] font-semibold px-2.5 py-0.5 rounded-full w-fit border ${
              remoteStream
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : status === 'connected'
                ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20 animate-pulse'
                : 'text-zinc-500 bg-zinc-800/50 border-zinc-700/50'
            }`}>
              <Wifi className="h-3.5 w-3.5" />
              {remoteStream ? 'LIVE FEED' : status === 'connected' ? 'BUFFERING...' : 'WAITING...'}
            </span>
            {(remoteStream || status === 'connected') && (
              <div className="flex items-center gap-2">
                <div className="h-2 w-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-[10px] text-zinc-300 font-bold">WebRTC Connected</span>
              </div>
            )}
          </div>

          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent pointer-events-none" />
        </div>

        {/* Live Setup Status Indicators (Shown only during room setup phase) */}
        {isSetupPhase && (
          <div className="grid grid-cols-2 gap-3 pt-2">
            <div className="bg-zinc-900/60 border border-zinc-800/60 p-3 rounded-xl">
              <span className="block text-[9px] text-zinc-500 uppercase font-black tracking-wider">Scramble</span>
              <span className={`text-xs font-bold ${
                oppState.scrambleCheckStatus === 'PASSED' ? 'text-indigo-400' : 'text-zinc-400'
              }`}>
                {oppState.scrambleCheckStatus === 'PASSED' ? 'PASSED' : 'PENDING'}
              </span>
            </div>

            <div className="bg-zinc-900/60 border border-zinc-800/60 p-3 rounded-xl">
              <span className="block text-[9px] text-zinc-500 uppercase font-black tracking-wider">Ready State</span>
              <span className={`text-xs font-bold ${
                oppState.checklistPassed || oppState.isReady ? 'text-emerald-400' : 'text-zinc-400'
              }`}>
                {oppState.checklistPassed || oppState.isReady ? 'READY' : 'SETTING UP'}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Opponent Results Card */}
      <div className="space-y-4 pt-4 border-t border-zinc-800/80 relative z-10">
        <div>
          <span className="block text-[10px] text-zinc-500 uppercase font-black tracking-widest mb-1">
            Opponent Time
          </span>
          {resultTime ? (
            <div className="flex items-baseline gap-2">
              <span className={`text-3xl font-black font-mono tracking-tight ${
                oppState.resultStatus === 'DNF' ? 'text-rose-500' : 'text-white'
              }`}>
                {resultTime}
              </span>
              <span className="text-[10px] font-bold text-zinc-400 uppercase">SUBMITTED</span>
            </div>
          ) : (
            <span className="text-lg font-black text-zinc-600 font-mono tracking-wider animate-pulse">
              SOLVING...
            </span>
          )}
        </div>

        {oppState.resultStatus === 'VALID' && (
          <div className="bg-zinc-900/50 border border-zinc-800/50 p-3.5 rounded-2xl flex items-center justify-between">
            <span className="text-xs font-semibold text-zinc-400">Finish Check</span>
            <span className={`text-xs font-bold ${
              oppState.finishCheckStatus === 'PASSED'
                ? 'text-emerald-400'
                : oppState.finishCheckStatus === 'FAILED'
                ? 'text-rose-400'
                : 'text-orange-400 animate-pulse'
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
