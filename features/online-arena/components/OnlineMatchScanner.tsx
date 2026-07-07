'use client';

import React, { useEffect, useRef, useState } from 'react';
import { startScanner, observeScannerFrame, retryScannerFace, resetScanner } from '../api/onlineArenaApi';
import type { ScannerStartResponseDto } from '../types';
import { Camera, RefreshCw, AlertTriangle, CheckCircle, Video, Play, Loader2 } from 'lucide-react';

interface OnlineMatchScannerProps {
  matchId: string;
  validationType: 'SCRAMBLE' | 'FINISH';
  onSuccess?: (data: any) => void;
}

const FACE_NAMES = ['U', 'R', 'F', 'D', 'L', 'B'];

export function OnlineMatchScanner({ matchId, validationType, onSuccess }: OnlineMatchScannerProps) {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const captureIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const [session, setSession] = useState<ScannerStartResponseDto | null>(null);
  const [cameraActive, setCameraActive] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastReason, setLastReason] = useState<string | null>(null);
  const [scannedFacesCount, setScannedFacesCount] = useState(0);

  // Initialize session and camera on mount
  useEffect(() => {
    let active = true;

    const initScanner = async () => {
      try {
        setError(null);
        // 1. Start scanner session on backend
        const res = await startScanner(matchId, validationType);
        if (active) {
          setSession(res);
          setScannedFacesCount(res.requestedFaceIndex - 1);
        }

        // 2. Start local camera feed
        const stream = await navigator.mediaDevices.getUserMedia({
          video: { facingMode: 'environment', width: { ideal: 640 }, height: { ideal: 480 } },
        });

        if (active) {
          if (videoRef.current) {
            videoRef.current.srcObject = stream;
            videoRef.current.play();
          }
          streamRef.current = stream;
          setCameraActive(true);
          setIsScanning(true);
        }
      } catch (err: any) {
        if (active) {
          console.error(err);
          setError(err.message || 'Failed to start camera or scanner session.');
        }
      }
    };

    initScanner();

    return () => {
      active = false;
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
      }
    };
  }, [matchId, validationType]);

  // Automated capture loop
  useEffect(() => {
    if (isScanning && cameraActive && session) {
      captureIntervalRef.current = setInterval(() => {
        captureFrame();
      }, 2000);
    } else {
      if (captureIntervalRef.current) {
        clearInterval(captureIntervalRef.current);
        captureIntervalRef.current = null;
      }
    }

    return () => {
      if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
    };
  }, [isScanning, cameraActive, session]);

  const captureFrame = async () => {
    if (!videoRef.current || !session) return;

    try {
      const canvas = document.createElement('canvas');
      canvas.width = 640;
      canvas.height = 480;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Draw active video frame
      ctx.drawImage(videoRef.current, 0, 0, 640, 480);

      // Convert to blob and upload
      canvas.toBlob(async (blob) => {
        if (!blob) return;

        const formData = new FormData();
        formData.append('Snapshot', blob, 'snapshot.jpg');
        formData.append('ScanSessionId', session.scanSessionId);
        formData.append('ScanGeneration', session.scanGeneration.toString());
        formData.append('RequestId', crypto.randomUUID());
        formData.append('TargetFaceIndex', session.requestedFaceIndex.toString());

        try {
          const res = await observeScannerFrame(matchId, validationType, formData);
          console.log('[AI Scanner Frame Observation]', res);
          
          if (res.reason) {
            setLastReason(res.reason);
          }

          // Check if progress updated
          if (res.requestedFaceIndex !== undefined) {
            setSession(prev => prev ? {
              ...prev,
              requestedFaceIndex: res.requestedFaceIndex
            } : null);
            setScannedFacesCount(res.requestedFaceIndex - 1);
          }

          // Check if completion is reported
          if (res.nextUiState || res.scanStatus === 'COMPLETED' || res.finishCheckStatus) {
            setIsScanning(false);
            if (captureIntervalRef.current) clearInterval(captureIntervalRef.current);
            if (onSuccess) onSuccess(res);
          }
        } catch (err: any) {
          console.warn('Frame submission ignored due to error:', err);
        }
      }, 'image/jpeg', 0.85);
    } catch (err) {
      console.error('Frame capture failed:', err);
    }
  };

  const handleRetryFace = async () => {
    try {
      setError(null);
      await retryScannerFace(matchId, validationType);
      // Refetch starting configuration
      const res = await startScanner(matchId, validationType);
      setSession(res);
      setScannedFacesCount(res.requestedFaceIndex - 1);
      setIsScanning(true);
      setLastReason('Current face reset. Ready to scan.');
    } catch (err: any) {
      setError(err.message || 'Failed to retry face.');
    }
  };

  const handleReset = async () => {
    try {
      setError(null);
      await resetScanner(matchId, validationType);
      const res = await startScanner(matchId, validationType);
      setSession(res);
      setScannedFacesCount(res.requestedFaceIndex - 1);
      setIsScanning(true);
      setLastReason('Scanner reset. Start from Face 1.');
    } catch (err: any) {
      setError(err.message || 'Failed to reset scanner.');
    }
  };

  const targetFaceName = FACE_NAMES[scannedFacesCount] || 'Done';

  return (
    <div className="space-y-6">
      {/* Scanner viewfinder */}
      <div className="aspect-video w-full max-w-2xl mx-auto rounded-3xl bg-zinc-900 border border-zinc-800/80 overflow-hidden relative shadow-2xl">
        <video
          ref={videoRef}
          playsInline
          muted
          className="absolute inset-0 w-full h-full object-cover"
        />

        {/* Framing Grid Guides */}
        <div className="absolute inset-0 border-[3px] border-orange-500/20 pointer-events-none flex items-center justify-center">
          <div className="w-48 h-48 border-2 border-dashed border-orange-500/50 rounded-2xl flex items-center justify-center relative">
            {/* Grid inner dividers */}
            <div className="absolute inset-y-0 left-1/3 w-[1px] bg-orange-500/35" />
            <div className="absolute inset-y-0 right-1/3 w-[1px] bg-orange-500/35" />
            <div className="absolute inset-x-0 top-1/3 h-[1px] bg-orange-500/35" />
            <div className="absolute inset-x-0 bottom-1/3 h-[1px] bg-orange-500/35" />

            <div className="absolute -top-6 left-1/2 -translate-x-1/2 bg-orange-500 text-white font-extrabold text-[9px] px-2 py-0.5 rounded tracking-widest uppercase">
              Align Face
            </div>
          </div>
        </div>

        {/* Viewfinder Overlays */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
        <div className="absolute inset-0 p-4 flex flex-col justify-between pointer-events-none">
          <div className="flex items-center justify-between">
            <span className="flex items-center gap-1.5 text-[9px] font-black text-orange-500 bg-orange-500/10 border border-orange-500/20 px-2.5 py-1 rounded-full uppercase tracking-wider">
              <Camera className="h-3.5 w-3.5 animate-pulse" /> AI Computer Vision Active
            </span>

            <span className="text-[10px] text-zinc-300 font-bold bg-zinc-950/80 px-2.5 py-1 rounded-lg">
              Face {scannedFacesCount + 1} / 6 ({targetFaceName})
            </span>
          </div>

          <div className="space-y-1 relative z-10">
            <span className="block text-[9px] text-zinc-400 font-black tracking-widest uppercase">Scanner Status</span>
            <p className="text-xs text-white font-bold max-w-sm truncate leading-relaxed">
              {lastReason || 'Ready. Hold the cube face aligned to the scanner guide.'}
            </p>
          </div>
        </div>
      </div>

      {/* Progress indicators */}
      <div className="bg-zinc-900/40 border border-zinc-800/80 p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4">
        <div className="flex flex-wrap items-center gap-2">
          {FACE_NAMES.map((name, idx) => {
            const isCompleted = idx < scannedFacesCount;
            const isActive = idx === scannedFacesCount;

            return (
              <div
                key={name}
                className={`h-8 w-8 rounded-xl border flex items-center justify-center font-bold text-xs transition-all ${
                  isCompleted
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400'
                    : isActive
                    ? 'bg-orange-500/20 border-orange-500 text-orange-400 animate-pulse'
                    : 'bg-zinc-950/60 border-zinc-800 text-zinc-600'
                }`}
              >
                {name}
              </div>
            );
          })}
        </div>

        {/* Scan Actions */}
        <div className="flex items-center gap-3">
          <button
            onClick={handleRetryFace}
            className="flex items-center gap-1.5 px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold text-xs rounded-xl border border-zinc-700/50 transition-all uppercase tracking-wider"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry Face
          </button>
          <button
            onClick={handleReset}
            className="px-4 py-2 bg-zinc-950 hover:bg-zinc-900 text-zinc-500 hover:text-rose-400 font-bold text-xs rounded-xl border border-zinc-800 hover:border-rose-500/20 transition-all uppercase tracking-wider"
          >
            Reset All
          </button>
        </div>
      </div>

      {error && (
        <div className="bg-rose-500/10 border border-rose-500/20 p-4 rounded-xl flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
          <div>
            <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wider">Scanner Error</h4>
            <p className="text-[11px] text-zinc-400 mt-0.5 leading-relaxed">{error}</p>
          </div>
        </div>
      )}
    </div>
  );
}
