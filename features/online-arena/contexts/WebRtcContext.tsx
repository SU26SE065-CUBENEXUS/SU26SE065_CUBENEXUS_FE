'use client';

/**
 * WebRtcContext — layout-level WebRTC session manager.
 *
 * Lives inside <CameraStreamProvider> so it can call useCameraStream().
 * The RTCPeerConnection and remoteStream are created once and persist for the
 * entire match lifecycle (setup → countdown → inspection → solving → result).
 *
 * Components that need the opponent's video (e.g. OpponentSidebar) should call
 * useWebRtcContext() to get the remoteStream and attach it to a <video> element.
 */

import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import type { HubConnection } from '@microsoft/signalr';
import { useCameraStream } from './CameraStreamContext';
import { useWebRtcSetup, type WebRtcStatus } from '../hooks/useWebRtcSetup';

// ── Types ────────────────────────────────────────────────────────────────────

interface WebRtcContextType {
  /** Connection lifecycle status */
  status: WebRtcStatus;
  error: string | null;
  /** Live video stream received from the opponent via WebRTC */
  remoteStream: MediaStream | null;
  /** Local camera stream (same as useCameraStream().stream) */
  localStream: MediaStream | null;
  /** Manual retry after ICE failure */
  retry: () => void;
  /** Acquire a specific camera device for the local stream */
  acquireLocalStream: (deviceId?: string) => void;
}

const WebRtcContext = createContext<WebRtcContextType | null>(null);

export function useWebRtcContext(): WebRtcContextType {
  const ctx = useContext(WebRtcContext);
  if (!ctx) throw new Error('useWebRtcContext must be used inside <WebRtcProvider>');
  return ctx;
}

// ── Provider ─────────────────────────────────────────────────────────────────

interface WebRtcProviderProps {
  matchId: string;
  isP1: boolean;
  opponentUserId: string | null;
  connection: HubConnection | null;
  /** True when this user's backend record already has webRtcConnected=true */
  alreadyConnected: boolean;
  /** Backend says the opponent connected but this client has not yet done so. */
  opponentAlreadyConnected?: boolean;
  /** Called when ICE reaches connected/completed → should call markWebRtcConnected */
  onConnected: () => Promise<void>;
  /**
   * Whether to activate WebRTC signaling now.
   * Set to true once both players have timerReady (the setup step requires it).
   */
  shouldActivate: boolean;
  /** True when the local player has completed mobile timer pairing and needs camera preview */
  myTimerReady?: boolean;
  children: React.ReactNode;
}

export function WebRtcProvider({
  matchId,
  isP1,
  opponentUserId,
  connection,
  alreadyConnected,
  opponentAlreadyConnected = false,
  onConnected,
  shouldActivate,
  myTimerReady = false,
  children,
}: WebRtcProviderProps) {
  const { stream, acquireStream, isAcquiring, cameraError } = useCameraStream();

  // Automatically acquire local camera as soon as local player is ready for camera step (timer paired or P2P active)
  useEffect(() => {
    if ((shouldActivate || myTimerReady) && !stream && !isAcquiring && !cameraError) {
      acquireStream();
    }
  }, [shouldActivate, myTimerReady, stream, isAcquiring, cameraError, acquireStream]);

  const { status, error, remoteStream, retry } = useWebRtcSetup({
    matchId,
    isP1,
    opponentUserId,
    connection,
    // Pass null if not yet active — hook won't start negotiation without stream
    stream: shouldActivate ? stream : null,
    alreadyConnected,
    opponentAlreadyConnected,
    onConnected,
    enabled: shouldActivate,
  });

  const acquireLocalStream = useCallback(
    (deviceId?: string) => acquireStream(deviceId),
    [acquireStream],
  );

  const value = useMemo(
    () => ({ status, error, remoteStream, localStream: stream, retry, acquireLocalStream }),
    [status, error, remoteStream, stream, retry, acquireLocalStream],
  );

  return <WebRtcContext.Provider value={value}>{children}</WebRtcContext.Provider>;
}
