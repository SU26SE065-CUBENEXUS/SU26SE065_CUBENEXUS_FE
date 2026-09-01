import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyScannerVideoTrackSettings,
  buildScannerVideoConstraints,
} from './scannerCamera';

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setStatus('starting');
    setError(null);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: buildScannerVideoConstraints(undefined, { facingMode: 'environment' }),
        audio: false,
      });
      await applyScannerVideoTrackSettings(stream);
      streamRef.current = stream;
      setDeviceLabel(stream.getVideoTracks()[0]?.label ?? '');
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }
      setStatus('ready');
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setStatus('idle');
  }, []);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((track) => track.stop());
      }
    };
  }, []);

  return { videoRef, status, error, deviceLabel, start, stop, getStream: () => streamRef.current };
}
export type CameraStreamResult = ReturnType<typeof useCameraStream>;
