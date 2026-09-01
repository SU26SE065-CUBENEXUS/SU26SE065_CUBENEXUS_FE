import { useCallback, useEffect, useRef, useState } from 'react';
import {
  applyScannerVideoTrackSettings,
  buildScannerVideoConstraints,
} from './scannerCamera';

export interface ManualFocusRange {
  min: number;
  max: number;
  step: number;
}

export interface ExposureRange {
  min: number;
  max: number;
  step: number;
  type?: 'exposureCompensation' | 'brightness';
}

export function useCameraStream() {
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const [deviceLabel, setDeviceLabel] = useState('');
  const [status, setStatus] = useState<'idle' | 'starting' | 'ready' | 'failed'>('idle');
  const [error, setError] = useState<string | null>(null);

  const [manualFocusRange, setManualFocusRange] = useState<ManualFocusRange | null>(null);
  const [focusDistance, setFocusDistance] = useState<number>(0);
  const [focusMode, setFocusMode] = useState<'auto' | 'manual'>('auto');

  const [exposureRange, setExposureRange] = useState<ExposureRange | null>(null);
  const [exposureCompensation, setExposureCompensation] = useState<number>(0);
  const [exposureMode, setExposureMode] = useState<'auto' | 'manual'>('auto');

  const start = useCallback(async () => {
    if (typeof window === 'undefined') return;
    setStatus('starting');
    setError(null);
    try {
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

      await applyScannerVideoTrackSettings(stream);
      streamRef.current = stream;
      setDeviceLabel(stream.getVideoTracks()[0]?.label ?? '');

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        await videoRef.current.play();
      }

      const track = stream.getVideoTracks()[0];
      const capabilities = (track as any)?.getCapabilities?.() as any;
      const supportedFocusModes = Array.isArray(capabilities?.focusMode) ? capabilities.focusMode : [];

      if (supportedFocusModes.includes('continuous')) {
        try {
          await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
          setFocusMode('auto');
        } catch {
          // Keep default
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
          // Keep default
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

      setStatus('ready');
    } catch (err) {
      setStatus('failed');
      setError(err instanceof Error ? err.message : String(err));
    }
  }, []);

  const handleManualFocusChange = useCallback(async (nextDistance: number) => {
    setFocusDistance(nextDistance);
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({
        advanced: [{ focusMode: 'manual', focusDistance: nextDistance }],
      } as any);
      setFocusMode('manual');
      setError(null);
    } catch {
      setError('This camera could not apply manual focus distance.');
    }
  }, []);

  const handleEnableAutoFocus = useCallback(async () => {
    const track = streamRef.current?.getVideoTracks()[0];
    if (!track) return;
    try {
      await track.applyConstraints({ advanced: [{ focusMode: 'continuous' }] } as any);
      setFocusMode('auto');
      setError(null);
    } catch {
      setError('Continuous autofocus is not available on this camera.');
    }
  }, []);

  const handleExposureChange = useCallback(async (nextExposure: number) => {
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
      setError(null);
    } catch {
      setError('This camera could not apply brightness level.');
    }
  }, [exposureRange]);

  const handleEnableAutoExposure = useCallback(async () => {
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
      setError(null);
    } catch {
      setError('Automatic exposure is not available on this camera.');
    }
  }, [exposureRange]);

  const stop = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setManualFocusRange(null);
    setFocusMode('auto');
    setExposureRange(null);
    setExposureMode('auto');
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

  return {
    videoRef,
    status,
    error,
    deviceLabel,
    start,
    stop,
    getStream: () => streamRef.current,
    manualFocusRange,
    focusDistance,
    focusMode,
    exposureRange,
    exposureCompensation,
    exposureMode,
    handleManualFocusChange,
    handleEnableAutoFocus,
    handleExposureChange,
    handleEnableAutoExposure,
  };
}
export type CameraStreamResult = ReturnType<typeof useCameraStream>;
