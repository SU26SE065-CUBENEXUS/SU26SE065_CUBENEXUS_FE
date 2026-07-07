'use client';

import { createContext, useContext, useRef, useState, useCallback, ReactNode } from 'react';

interface CameraStreamContextType {
  stream: MediaStream | null;
  cameraError: string | null;
  isAcquiring: boolean;
  acquireStream: () => Promise<MediaStream | null>;
  releaseStream: () => void;
}

const CameraStreamContext = createContext<CameraStreamContextType | null>(null);

export function CameraStreamProvider({ children }: { children: ReactNode }) {
  const streamRef = useRef<MediaStream | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState<string | null>(null);
  const [isAcquiring, setIsAcquiring] = useState(false);

  const acquireStream = useCallback(async (): Promise<MediaStream | null> => {
    // Return existing stream if still active
    if (streamRef.current && streamRef.current.active) {
      return streamRef.current;
    }

    setIsAcquiring(true);
    setCameraError(null);

    try {
      const mediaStream = await navigator.mediaDevices.getUserMedia({
        video: { width: { ideal: 1280 }, height: { ideal: 720 }, facingMode: 'user' },
        audio: true,
      });
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
