'use client';

import React, { useRef, useState, useCallback, useEffect } from 'react';
import { Play, Pause, RotateCcw, Volume2, VolumeX, Video, Download } from 'lucide-react';

export interface SingleVideoReplayPlayerProps {
  videoUrl: string;
  title?: string;
  showDownloadLink?: boolean;
  downloadFilename?: string;
  className?: string;
}

function fetchExactVideoDuration(url: string): Promise<number> {
  return new Promise((resolve) => {
    if (!url || typeof window === 'undefined') return resolve(0);
    const video = document.createElement('video');
    video.preload = 'metadata';
    video.src = url;

    const cleanup = () => {
      video.onloadedmetadata = null;
      video.onseeked = null;
      video.onerror = null;
      try {
        video.removeAttribute('src');
        video.load();
      } catch {}
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

      // Chrome WebM streaming fallback: seek to far end to force Chrome to calculate duration
      video.currentTime = 1e101;
      video.onseeked = () => {
        const exact = (video.duration && isFinite(video.duration) && video.duration > 0)
          ? video.duration
          : video.currentTime;
        cleanup();
        if (exact && isFinite(exact) && exact > 0) {
          resolve(exact);
        } else {
          resolve(0);
        }
      };
    };

    video.onerror = () => {
      cleanup();
      resolve(0);
    };

    setTimeout(() => {
      cleanup();
      resolve(0);
    }, 4000);
  });
}

export function SingleVideoReplayPlayer({
  videoUrl,
  title = 'Video Evidence Recording',
  showDownloadLink = true,
  downloadFilename = 'evidence.webm',
  className = '',
}: SingleVideoReplayPlayerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);

  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [duration, setDuration] = useState<number>(0);
  const [isDurationLoading, setIsDurationLoading] = useState<boolean>(true);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [playbackSpeed, setPlaybackSpeed] = useState<number>(1.0);

  // Probe duration on mount / videoUrl change
  useEffect(() => {
    let isCancelled = false;
    setDuration(0);
    setCurrentTime(0);
    setIsPlaying(false);
    setIsDurationLoading(true);

    if (videoUrl) {
      void fetchExactVideoDuration(videoUrl).then((dur) => {
        if (!isCancelled) {
          if (dur > 0) {
            setDuration(dur);
          }
          setIsDurationLoading(false);
        }
      });
    } else {
      setIsDurationLoading(false);
    }

    return () => {
      isCancelled = true;
    };
  }, [videoUrl]);

  // Extract duration from main video element or seekable ranges
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

  const updateDuration = useCallback(() => {
    const dur = getEffectiveDuration(videoRef.current);
    if (dur > 0) {
      setDuration((prev) => Math.max(prev, dur));
      setIsDurationLoading(false);
    }
  }, [getEffectiveDuration]);

  // Sync video durations whenever metadata, progress, or durationchange fires
  const handleLoadedMetadata = useCallback(() => {
    updateDuration();

    // Fallback: If duration is Infinity or NaN on the primary element
    const video = videoRef.current;
    if (video && (video.duration === Infinity || isNaN(video.duration))) {
      video.currentTime = 1e101;
      const onSeekedHandler = () => {
        video.currentTime = 0;
        video.removeEventListener('seeked', onSeekedHandler);
        updateDuration();
      };
      video.addEventListener('seeked', onSeekedHandler, { once: true });
    }
  }, [updateDuration]);

  const handleTimeUpdate = useCallback(() => {
    const video = videoRef.current;
    if (!video) return;

    setCurrentTime(video.currentTime);

    if (video.ended) {
      setIsPlaying(false);
    }

    updateDuration();
  }, [updateDuration]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;

    if (isPlaying) {
      video.pause();
      setIsPlaying(false);
    } else {
      if (video.ended) {
        video.currentTime = 0;
      }
      video.play().catch(() => {});
      setIsPlaying(true);
    }
  };

  const handleSeek = (e: React.ChangeEvent<HTMLInputElement>) => {
    const seekTime = parseFloat(e.target.value);
    setCurrentTime(seekTime);
    if (videoRef.current) {
      videoRef.current.currentTime = seekTime;
    }
  };

  const handleSpeedChange = (speed: number) => {
    setPlaybackSpeed(speed);
    if (videoRef.current) {
      videoRef.current.playbackRate = speed;
    }
  };

  const toggleMute = () => {
    setIsMuted(!isMuted);
    if (videoRef.current) {
      videoRef.current.muted = !isMuted;
    }
  };

  const handleRestart = () => {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      setCurrentTime(0);
    }
  };

  const formatTime = (sec: number) => {
    if (!sec || isNaN(sec) || !isFinite(sec)) return '00:00.00';
    const mins = Math.floor(sec / 60);
    const secs = (sec % 60).toFixed(2);
    return `${String(mins).padStart(2, '0')}:${Number(secs) < 10 ? '0' : ''}${secs}`;
  };

  return (
    <div className={`w-full bg-slate-900 border border-slate-800 rounded-3xl overflow-hidden shadow-lg space-y-0 text-left ${className}`}>
      {/* Video Header Bar */}
      <div className="bg-slate-950/80 border-b border-slate-800 px-4 py-2.5 flex items-center justify-between backdrop-blur-md">
        <div className="flex items-center gap-2">
          <Video className="h-4 w-4 text-emerald-400" />
          <span className="text-xs font-black tracking-wider text-slate-200 uppercase truncate max-w-[280px] sm:max-w-md">
            {title}
          </span>
        </div>
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[10px] bg-emerald-500/20 text-emerald-300 border border-emerald-500/40 px-2.5 py-0.5 rounded-full font-bold">
            READY FOR REVIEW
          </span>
          {showDownloadLink && videoUrl && (
            <a
              href={videoUrl}
              download={downloadFilename}
              className="inline-flex items-center gap-1 text-[11px] text-indigo-400 font-bold hover:underline hover:text-indigo-300 transition ml-1"
            >
              <Download className="h-3.5 w-3.5" /> Download
            </a>
          )}
        </div>
      </div>

      {/* Video Viewport Frame */}
      <div className="relative aspect-video bg-black flex items-center justify-center overflow-hidden">
        <video
          ref={videoRef}
          src={videoUrl}
          muted={isMuted}
          playsInline
          onLoadedMetadata={handleLoadedMetadata}
          onDurationChange={handleLoadedMetadata}
          onProgress={handleLoadedMetadata}
          onCanPlay={handleLoadedMetadata}
          onTimeUpdate={handleTimeUpdate}
          onClick={togglePlay}
          className="w-full h-full object-contain cursor-pointer"
        />

        {/* Big Overlay Play Icon when Paused */}
        {!isPlaying && (
          <button
            onClick={togglePlay}
            className="absolute inset-0 m-auto w-16 h-16 rounded-full bg-indigo-600/80 hover:bg-indigo-600 text-white flex items-center justify-center shadow-xl backdrop-blur-xs transition transform hover:scale-105 cursor-pointer"
          >
            <Play className="h-8 w-8 ml-1 fill-current" />
          </button>
        )}
      </div>

      {/* Control Toolbar */}
      <div className="bg-slate-950 border-t border-slate-800 p-4 space-y-3">
        {/* Scrubber / Progress Bar */}
        <div className="flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-indigo-400 w-16 text-right shrink-0">
            {formatTime(currentTime)}
          </span>
          <input
            type="range"
            min={0}
            max={duration || 10}
            step={0.05}
            value={currentTime}
            onChange={handleSeek}
            disabled={duration === 0}
            className="flex-1 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-indigo-500 disabled:opacity-40"
          />
          <span className="text-xs font-mono font-bold text-slate-400 w-16 shrink-0">
            {isDurationLoading && duration === 0 ? (
              <span className="animate-pulse text-indigo-400">--:--</span>
            ) : (
              formatTime(duration)
            )}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <div className="flex items-center gap-2">
            <button
              onClick={togglePlay}
              className="p-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl font-bold transition shadow-md shadow-indigo-600/20 cursor-pointer"
              title={isPlaying ? 'Pause' : 'Play'}
            >
              {isPlaying ? <Pause className="h-4 w-4" /> : <Play className="h-4 w-4 ml-0.5 fill-current" />}
            </button>

            <button
              onClick={handleRestart}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 cursor-pointer"
              title="Restart from beginning"
            >
              <RotateCcw className="h-4 w-4" />
            </button>

            <button
              onClick={toggleMute}
              className="p-2.5 bg-slate-800 hover:bg-slate-700 text-slate-300 rounded-xl transition border border-slate-700 cursor-pointer"
              title={isMuted ? 'Unmute' : 'Mute'}
            >
              {isMuted ? <VolumeX className="h-4 w-4 text-rose-400" /> : <Volume2 className="h-4 w-4 text-emerald-400" />}
            </button>
          </div>

          {/* Speed Selector Buttons (0.5x, 1x, 1.5x, 2x, 3x) */}
          <div className="flex items-center gap-1.5 bg-slate-900 p-1 rounded-xl border border-slate-800">
            <span className="text-[10px] font-extrabold uppercase text-slate-400 px-1.5 hidden sm:inline">Speed:</span>
            {[0.5, 1.0, 1.5, 2.0, 3.0].map((speed) => (
              <button
                key={speed}
                onClick={() => handleSpeedChange(speed)}
                className={`px-2.5 py-1 text-[11px] font-black rounded-lg transition ${
                  playbackSpeed === speed
                    ? 'bg-indigo-600 text-white shadow-xs'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
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
