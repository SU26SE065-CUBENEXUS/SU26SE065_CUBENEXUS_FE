'use client';

import React, { useRef, useState, useEffect, useCallback, useMemo } from 'react';
import { Play, Pause, RotateCcw, Trophy, CheckCircle2, ShieldCheck, Volume2, VolumeX, Maximize2 } from 'lucide-react';

export interface PlayerReplayTrack {
  username: string;
  avatarUrl?: string;
  videoUrl: string;
  solveTimeSeconds: number;
  videoDurationSeconds?: number; // Known duration from server — shown immediately without preloading
  isWinner?: boolean;
}

export interface SplitScreenReplayProps {
  matchId: string;
  playerA: PlayerReplayTrack;
  playerB: PlayerReplayTrack;
  officialWinnerName?: string;
  officialWinnerText?: string;
}

function fetchExactVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    if (!url || typeof window === 'undefined') return resolve(0);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onerror = null;
      video.src = '';
    };

    video.onloadedmetadata = () => {
      const dur = video.duration;
      if (dur && isFinite(dur) && !isNaN(dur) && dur > 0) {
        cleanup();
        resolve(dur);
        return;
      }
      if (video.seekable && video.seekable.length > 0) {
        const end = video.seekable.end(video.seekable.length - 1);
        if (end > 0 && isFinite(end)) {
          cleanup();
          resolve(end);
          return;
        }
      }
      cleanup();
      resolve(0);
    };

    video.onerror = () => {
      cleanup();
      resolve(0);
    };

    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 5000);
  });
}

export function SplitScreenReplayPlayer({
  matchId,
  playerA,
  playerB,
  officialWinnerName,
  officialWinnerText,
}: SplitScreenReplayProps) {
  const videoARef = useRef<HTMLVideoElement | null>(null);
  const videoBRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(
    // Seed from server-provided duration immediately — no preloading needed
    () => Math.max(playerA.videoDurationSeconds || 0, playerB.videoDurationSeconds || 0)
  );
  const [isMuted, setIsMuted] = useState<boolean>(true);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  const [isAFinished, setIsAFinished] = useState<boolean>(false);
  const [isBFinished, setIsBFinished] = useState<boolean>(false);

  // Helper to extract effective duration from video element or seekable ranges
  const getEffectiveDuration = useCallback((video: HTMLVideoElement | null): number => {
    if (!video) return 0;
    const dur = video.duration;
    if (dur && isFinite(dur) && !isNaN(dur) && dur > 0) return dur;
    if (video.seekable && video.seekable.length > 0) {
      const end = video.seekable.end(video.seekable.length - 1);
      if (end > 0 && isFinite(end)) return end;
    }
    return 0;
  }, []);

  // Sync video durations whenever metadata, progress, or durationchange fires
  const handleLoadedMetadata = useCallback(() => {
    const durA = getEffectiveDuration(videoARef.current);
    const durB = getEffectiveDuration(videoBRef.current);
    const maxDur = Math.max(durA, durB);
    if (maxDur > 0) {
      setDuration((prev) => Math.max(prev, maxDur));
    }
  }, [getEffectiveDuration]);

  // Timeupdate handler: each video checks its OWN currentTime independently
  // Timeline advances from the video that is furthest along (max of both times)
  const handleTimeUpdate = useCallback(() => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA && !videoB) return;

    const timeA = videoA?.currentTime ?? 0;
    const timeB = videoB?.currentTime ?? 0;

    // Use the max of both times so the scrubber keeps advancing even when one video is frozen
    const globalTime = Math.max(timeA, timeB);
    setCurrentTime(globalTime);

    const limitA = playerA.solveTimeSeconds && playerA.solveTimeSeconds > 0 ? playerA.solveTimeSeconds : Infinity;
    const limitB = playerB.solveTimeSeconds && playerB.solveTimeSeconds > 0 ? playerB.solveTimeSeconds : Infinity;

    if (videoA) {
      setIsAFinished(timeA >= limitA);
    }

    if (videoB) {
      setIsBFinished(timeB >= limitB);
    }

    // Both videos naturally ended (reached end of file)
    const aEnded = videoA ? videoA.ended : true;
    const bEnded = videoB ? videoB.ended : true;
    if (aEnded && bEnded) {
      setIsPlaying(false);
    }

    // Dynamically update duration from seekable range while video loads
    const durA = getEffectiveDuration(videoA);
    const durB = getEffectiveDuration(videoB);
    const maxDur = Math.max(durA, durB);
    if (maxDur > 0) {
      setDuration((prev) => Math.max(prev, maxDur));
    }
  }, [playerA.solveTimeSeconds, playerB.solveTimeSeconds, getEffectiveDuration]);

  const togglePlay = () => {
    const videoA = videoARef.current;
    const videoB = videoBRef.current;
    if (!videoA && !videoB) return;

    if (isPlaying) {
      if (videoA) videoA.pause();
      if (videoB) videoB.pause();
      setIsPlaying(false);
    } else {
      if (videoA && !videoA.ended) videoA.play().catch(() => {});
      if (videoB && !videoB.ended) videoB.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);

    if (videoARef.current) {
      videoARef.current.currentTime = seekTime;
    }
    if (videoBRef.current) {
      videoBRef.current.currentTime = seekTime;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoARef.current) videoARef.current.playbackRate = speed;
    if (videoBRef.current) videoBRef.current.playbackRate = speed;
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoARef.current) videoARef.current.muted = !isMuted;
    if (videoBRef.current) videoBRef.current.muted = !isMuted;
  };

  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    return `${mins}:${Number(secs) < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className="w-full bg-zinc-950 border border-zinc-800/80 rounded-3xl overflow-hidden shadow-2xl space-y-0 relative animate-fade-in">
      {/* Official Match Winner Broadcast Header Overlay */}
      {officialWinnerName && (
        <div className="bg-gradient-to-r from-orange-500/20 via-amber-500/10 to-orange-500/20 border-b border-orange-500/30 px-6 py-3 flex items-center justify-between backdrop-blur-md">
          <div className="flex items-center gap-2">
            <Trophy className="h-5 w-5 text-amber-400 animate-bounce" />
            <span className="text-xs font-black tracking-widest text-amber-300 uppercase">
              OFFICIAL RESULT
            </span>
          </div>
          <div className="text-xs font-black text-white tracking-wider">
            WINNER: <span className="text-amber-400 uppercase">{officialWinnerName}</span>
            {officialWinnerText && <span className="text-zinc-400 ml-2">({officialWinnerText})</span>}
          </div>
          <div className="flex items-center gap-1.5 text-[10px] text-zinc-400 font-bold uppercase">
            <ShieldCheck className="h-4 w-4 text-emerald-400" /> VERIFIED REPLAY
          </div>
        </div>
      )}

      {/* Split-Screen Dual Video Frame Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-black p-2 relative">
        {/* Player A Video Frame */}
        <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
          {playerA.videoUrl ? (
            <video
              ref={videoARef}
              src={playerA.videoUrl}
              muted={isMuted}
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={handleLoadedMetadata}
              onProgress={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 space-y-1 text-zinc-500">
              <p className="text-xs font-bold uppercase">{playerA.username}</p>
              <p className="text-[10px]">Video processing or awaiting upload...</p>
            </div>
          )}

          {/* Player A Minimal Subtle HUD Overlay */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-tight">{playerA.username}</span>
            </div>

            <div
              className={`bg-zinc-950/70 backdrop-blur-md border px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-all ${
                isAFinished
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-zinc-800/60 text-zinc-300'
              }`}
            >
              <span className="text-[10px] font-bold font-mono">
                {playerA.solveTimeSeconds.toFixed(2)}s
              </span>
              {isAFinished && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
            </div>
          </div>
        </div>

        {/* Player B Video Frame */}
        <div className="relative aspect-video bg-zinc-900 rounded-2xl overflow-hidden border border-zinc-800 flex items-center justify-center">
          {playerB.videoUrl ? (
            <video
              ref={videoBRef}
              src={playerB.videoUrl}
              muted={isMuted}
              playsInline
              onLoadedMetadata={handleLoadedMetadata}
              onDurationChange={handleLoadedMetadata}
              onProgress={handleLoadedMetadata}
              onTimeUpdate={handleTimeUpdate}
              className="w-full h-full object-cover"
            />
          ) : (
            <div className="text-center p-4 space-y-1 text-zinc-500">
              <p className="text-xs font-bold uppercase">{playerB.username}</p>
              <p className="text-[10px]">Video processing or awaiting upload...</p>
            </div>
          )}

          {/* Player B Minimal Subtle HUD Overlay */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-zinc-950/70 backdrop-blur-md border border-zinc-800/60 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold text-zinc-200 uppercase tracking-tight">{playerB.username}</span>
            </div>

            <div
              className={`bg-zinc-950/70 backdrop-blur-md border px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-all ${
                isBFinished
                  ? 'border-emerald-500/40 text-emerald-400 bg-emerald-500/10'
                  : 'border-zinc-800/60 text-zinc-300'
              }`}
            >
              <span className="text-[10px] font-bold font-mono">
                {playerB.solveTimeSeconds.toFixed(2)}s
              </span>
              {isBFinished && <CheckCircle2 className="h-3 w-3 text-emerald-400" />}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Video Controls Toolbar */}
      <div className="bg-zinc-900/90 border-t border-zinc-800 px-6 py-4 space-y-3">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-zinc-400 w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-xs font-mono font-bold text-zinc-500 w-12">{formatTime(duration)}</span>
        </div>

        {/* Buttons and Speed Selector */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-lg shadow-orange-500/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (videoARef.current) videoARef.current.currentTime = 0;
                if (videoBRef.current) videoBRef.current.currentTime = 0;
                setCurrentTime(0);
              }}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2.5 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 rounded-xl transition-all"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase border transition-all ${
                  playbackSpeed === speed
                    ? 'bg-zinc-800 text-orange-400 border-orange-500/40'
                    : 'bg-zinc-900/60 text-zinc-500 border-zinc-800 hover:text-zinc-300'
                }`}
              >
                {speed}x
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
