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

  // Derived winner name if officialWinnerName is missing but playerA or playerB is marked as winner
  const resolvedWinnerName = (officialWinnerText === 'DRAW' || officialWinnerText === 'INCONCLUSIVE')
    ? undefined
    : (officialWinnerName || (playerA.isWinner ? playerA.username : playerB.isWinner ? playerB.username : undefined));

  return (
    <div className="w-full bg-white border border-zinc-200 rounded-xl overflow-hidden shadow-sm space-y-0 relative text-left">
      {/* Official Match Winner Broadcast Header Overlay */}
      <div className="bg-zinc-50 border-b border-zinc-200 px-3.5 py-2 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-1.5">
          <Trophy className="h-3.5 w-3.5 text-amber-500" />
          <span className="text-[10px] font-bold tracking-wider text-amber-600 uppercase">
            Official Result
          </span>
        </div>
        <div className="text-xs font-bold text-zinc-900 tracking-tight">
          {resolvedWinnerName ? (
            <>
              Winner: <span className="text-amber-600">{resolvedWinnerName}</span>
              {officialWinnerText && officialWinnerText !== 'DRAW' && (
                <span className="text-zinc-500 font-normal ml-1 text-[11px]">({officialWinnerText})</span>
              )}
            </>
          ) : (
            <span className="text-amber-600 font-bold uppercase">
              {officialWinnerText === 'INCONCLUSIVE' ? 'RESULT: DRAW - AUDITED (INCONCLUSIVE)' : 'RESULT: DRAW'}
            </span>
          )}
        </div>
        <div className="flex items-center gap-1 text-[10px] text-zinc-500 font-semibold uppercase">
          <ShieldCheck className="h-3.5 w-3.5 text-emerald-500" /> Verified Replay
        </div>
      </div>

      {/* Split-Screen Dual Video Frame Viewport */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 bg-zinc-100 p-2 relative border-b border-zinc-200">
        {/* Player A Video Frame */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-300 flex items-center justify-center shadow-inner">
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
            <div className="text-center p-4 space-y-1 text-zinc-400">
              <p className="text-xs font-bold uppercase">{playerA.username}</p>
              <p className="text-[10px]">Video processing or awaiting upload...</p>
            </div>
          )}

          {/* Player A Minimal Subtle HUD Overlay */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur-md border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-emerald-500" />
              <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight">{playerA.username}</span>
            </div>

            <div
              className={`bg-white/90 backdrop-blur-md border px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-all ${
                isAFinished
                  ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                  : 'border-zinc-200 text-zinc-700'
              }`}
            >
              <span className="text-[10px] font-bold font-mono">
                {playerA.solveTimeSeconds.toFixed(2)}s
              </span>
              {isAFinished && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            </div>
          </div>
        </div>

        {/* Player B Video Frame */}
        <div className="relative aspect-video bg-black rounded-xl overflow-hidden border border-zinc-300 flex items-center justify-center shadow-inner">
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
            <div className="text-center p-4 space-y-1 text-zinc-400">
              <p className="text-xs font-bold uppercase">{playerB.username}</p>
              <p className="text-[10px]">Video processing or awaiting upload...</p>
            </div>
          )}

          {/* Player B Minimal Subtle HUD Overlay */}
          <div className="absolute top-2 left-2 right-2 flex items-center justify-between pointer-events-none z-10">
            <div className="bg-white/90 backdrop-blur-md border border-zinc-200 px-2 py-0.5 rounded-full flex items-center gap-1.5 shadow-sm">
              <span className="h-1.5 w-1.5 rounded-full bg-orange-500" />
              <span className="text-[10px] font-bold text-zinc-800 uppercase tracking-tight">{playerB.username}</span>
            </div>

            <div
              className={`bg-white/90 backdrop-blur-md border px-2 py-0.5 rounded-full flex items-center gap-1 shadow-sm transition-all ${
                isBFinished
                  ? 'border-emerald-200 text-emerald-600 bg-emerald-50'
                  : 'border-zinc-200 text-zinc-700'
              }`}
            >
              <span className="text-[10px] font-bold font-mono">
                {playerB.solveTimeSeconds.toFixed(2)}s
              </span>
              {isBFinished && <CheckCircle2 className="h-3 w-3 text-emerald-500" />}
            </div>
          </div>
        </div>
      </div>

      {/* Broadcast Video Controls Toolbar */}
      <div className="bg-white border-t border-zinc-200 px-6 py-4 space-y-3">
        {/* Timeline Scrubber */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-zinc-500 w-12">{formatTime(currentTime)}</span>
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            className="flex-1 h-1.5 bg-zinc-200 rounded-lg appearance-none cursor-pointer accent-orange-500"
          />
          <span className="text-xs font-mono font-bold text-zinc-500 w-12">{formatTime(duration)}</span>
        </div>

        {/* Buttons and Speed Selector */}
        <div className="flex items-center justify-between pt-1">
          <div className="flex items-center gap-3">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-orange-500 hover:bg-orange-600 text-white rounded-xl font-bold transition-all shadow-md shadow-orange-500/20"
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5" />}
            </button>

            <button
              onClick={() => {
                if (videoARef.current) videoARef.current.currentTime = 0;
                if (videoBRef.current) videoBRef.current.currentTime = 0;
                setCurrentTime(0);
              }}
              className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-all border border-zinc-200"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2.5 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-xl transition-all border border-zinc-200"
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-500" /> : <Volume2 className="h-4 w-4 text-emerald-500" />}
            </button>
          </div>

          <div className="flex items-center gap-2">
            {[0.5, 1.0, 1.5, 2.0].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 text-[11px] font-bold rounded-lg uppercase border transition-all ${
                  playbackSpeed === speed
                    ? 'bg-zinc-100 text-orange-600 border-orange-300'
                    : 'bg-zinc-50 text-zinc-500 border-zinc-200 hover:text-zinc-800 hover:bg-zinc-100'
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
