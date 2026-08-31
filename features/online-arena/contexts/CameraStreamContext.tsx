'use client';

import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface CameraStreamContextType {
  stream: MediaStream | null;
  cameraError: string | null;
  isAcquiring: boolean;
  acquireStream: (deviceId?: string) => Promise<MediaStream | null>;
  releaseStream: () => void;
}

const CameraStreamContext = createContext<CameraStreamContextType | null>(null);

export function CameraStreamProvider({ children }: { children: ReactNode }) {
  const streamRef = useRef<MediaStream | null>(null);
  const selectedDeviceIdRef = useRef<string | undefined>(undefined);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);

  const acquireStream = useCallback(async (deviceId?: string): Promise<MediaStream | null> => {
    const previousDeviceId = selectedDeviceIdRef.current;
    if (deviceId) {
      selectedDeviceIdRef.current = deviceId;
    }

    const targetDeviceId = selectedDeviceIdRef.current;
    const activeVideoTrack = streamRef.current?.getVideoTracks()[0];
    const activeDeviceId = activeVideoTrack?.getSettings?.().deviceId;
    const isSwitchingDevice = Boolean(
      deviceId
      && (activeDeviceId
        ? activeDeviceId !== deviceId
        : previousDeviceId !== deviceId),
    );

    // Reuse existing stream if it is still active and live and no device switch is requested
    if (
      streamRef.current &&
      streamRef.current.active &&
      streamRef.current.getVideoTracks().some((t) => t.readyState === 'live') &&
      !isSwitchingDevice
    ) {
      return streamRef.current;
    }

    // Stop existing stream only when switching device or stream became inactive
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }

    setIsAcquiring(true);
    setCameraError(null);

    try {
      const videoConstraints: any = targetDeviceId
        ? {
            deviceId: { exact: targetDeviceId },
            // Keep a sharp source for the model's centered 640x640 crop. The
            // browser may gracefully fall back when the camera cannot do HD.
            width: { ideal: 1280 },
            height: { ideal: 720 },
            frameRate: { ideal: 30 },
            resizeMode: 'none',
          }
        : {
            width: { ideal: 1280 },
            height: { ideal: 720 },
            facingMode: 'user',
            frameRate: { ideal: 30 },
            resizeMode: 'none',
          };

      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: videoConstraints,
        audio: false,
      });
      const videoTrack = mediaStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.contentHint = 'detail';

        // Prefer continuous camera controls when the browser/device exposes
        // them. Unsupported controls are omitted, so desktop webcams and older
        // mobile browsers continue to work normally.
        try {
          const capabilities = videoTrack.getCapabilities?.() as any;
          const advanced: Record<string, string> = {};
          if (capabilities?.focusMode?.includes?.('continuous')) advanced.focusMode = 'continuous';
          if (capabilities?.exposureMode?.includes?.('continuous')) advanced.exposureMode = 'continuous';
          if (capabilities?.whiteBalanceMode?.includes?.('continuous')) advanced.whiteBalanceMode = 'continuous';
          if (Object.keys(advanced).length > 0) {
            await videoTrack.applyConstraints({ advanced: [advanced] } as any);
          }
        } catch {
          // Camera controls are best-effort and must never block match setup.
        }
      }
      streamRef.current = mediaStream;
      setStream(mediaStream);
      return mediaStream;
    } catch (err: any) {
      const msg =
        err?.name === 'NotAllowedError'
          ? 'Camera permission denied. Please allow camera access and reload.'
          : err?.name === 'NotFoundError'
          ? 'No camera device found.'
          : err?.message || 'Failed to access camera.';
      setCameraError(msg);
      return null;
    } finally {
      setIsAcquiring(false);
    }
  }, []);

  const releaseStream = useCallback(() => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
      setStream(null);
    }
    selectedDeviceIdRef.current = undefined;
  }, []);

  return (
    <CameraStreamContext.Provider value={{ stream, cameraError, isAcquiring, acquireStream, releaseStream }}>
      {children}
    </CameraStreamContext.Provider>
  );
}

export function useCameraStream() {
  const ctx = useContext(CameraStreamContext);
  if (!ctx) throw new Error('useCameraStream must be used within CameraStreamProvider');
  return ctx;
}
