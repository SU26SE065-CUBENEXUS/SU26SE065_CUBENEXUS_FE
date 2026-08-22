'use client';

import { useEffect, useRef, useState } from 'react';
import * as signalR from '@microsoft/signalr';
import { getAccessToken, API_BASE_URL } from '@/lib/api/config';

interface SignalRCallbacks {
  onMatchmakingQueued?: (payload: any) => void;
  onMatchmakingFound?: (payload: any) => void;
  onMatchFound?: (payload: any) => void;
  onMatchConfirmationUpdated?: (payload: any) => void;
  onMatchConfirmed?: (payload: any) => void;
  onMatchConfirmationExpired?: (payload: any) => void;
  onMatchConfirmationCancelled?: (payload: any) => void;
  onMatchmakingCooldownApplied?: (payload: any) => void;
  onMatchPhaseUpdated?: (payload: any) => void;
  onCountdownStarted?: (payload: any) => void;
  onInspectionStarted?: (payload: any) => void;
  onSolveStarted?: (payload: any) => void;
  onResultSubmitted?: (payload: any) => void;
  onFinishCheckUpdated?: (payload: any) => void;
  onPlayerWaitingOpponent?: (payload: any) => void;
  onMatchNeedsReview?: (payload: any) => void;
  onMatchCompleted?: (payload: any) => void;
  onMatchCancelled?: (payload: any) => void;
  onSolveTimeout?: (payload: any) => void;
  onMatchStateChanged?: (payload: any) => void;
  onWebRtcOfferReceived?: (payload: any) => void;
  onWebRtcAnswerReceived?: (payload: any) => void;
  onIceCandidateReceived?: (payload: any) => void;
  onChecklistUpdated?: (payload: any) => void;
  onPracticeAttemptUpdated?: (payload: any) => void;
  onPracticeMobileConnected?: (payload: any) => void;
  onPracticeMobileDisconnected?: (payload: any) => void;
  onPracticeSessionEnded?: (payload: any) => void;
  onTimerConnected?: (payload: any) => void;
  onTimerDisconnected?: (payload: any) => void;
  onCameraReadyUpdated?: (payload: any) => void;
  onWebRtcConnectionUpdated?: (payload: any) => void;
  onVideoRecordingStarted?: (payload: any) => void;
}

export function useOnlineArenaSignalR(matchId?: string, callbacks?: SignalRCallbacks) {
  const [connection, setConnection] = useState<signalR.HubConnection | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const callbacksRef = useRef<SignalRCallbacks | undefined>(callbacks);

  // Keep callbacks ref updated to avoid re-registering handlers on every render
  useEffect(() => {
    callbacksRef.current = callbacks;
  }, [callbacks]);

  useEffect(() => {
    const token = getAccessToken();
    if (!token) {
      setError('Access token is missing.');
      return;
    }

    const conn = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/online-arena`, {
        accessTokenFactory: () => getAccessToken() || '',
        headers: {
          'ngrok-skip-browser-warning': 'true',
        },
      })
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    // Setup event listeners
    const register = (event: string, callbackKey: keyof SignalRCallbacks) => {
      conn.on(event, (payload: any) => {
        console.log(`[SignalR Event RECEIVED: ${event}]`, payload);
        const cb = callbacksRef.current?.[callbackKey];
        if (cb) cb(payload);
      });
    };

    // Matchmaking events
    register('MatchmakingQueued', 'onMatchmakingQueued');
    register('MatchmakingFound', 'onMatchmakingFound');
    register('MatchFound', 'onMatchFound');
    register('MatchConfirmationUpdated', 'onMatchConfirmationUpdated');
    register('MatchConfirmed', 'onMatchConfirmed');
    register('MatchConfirmationExpired', 'onMatchConfirmationExpired');
    register('MatchConfirmationCancelled', 'onMatchConfirmationCancelled');
    register('MatchmakingCooldownApplied', 'onMatchmakingCooldownApplied');

    // Room / Flow events
    register('MatchPhaseUpdated', 'onMatchPhaseUpdated');
    register('CountdownStarted', 'onCountdownStarted');
    register('InspectionStarted', 'onInspectionStarted');
    register('SolveStarted', 'onSolveStarted');
    register('ResultSubmitted', 'onResultSubmitted');
    register('FinishCheckUpdated', 'onFinishCheckUpdated');
    register('PlayerWaitingOpponent', 'onPlayerWaitingOpponent');
    register('MatchNeedsReview', 'onMatchNeedsReview');
    register('MatchCompleted', 'onMatchCompleted');
    register('MatchCancelled', 'onMatchCancelled');
    register('SolveTimeout', 'onSolveTimeout');
    register('MatchStateChanged', 'onMatchStateChanged');
    register('ChecklistUpdated', 'onChecklistUpdated');
    register('PracticeAttemptUpdated', 'onPracticeAttemptUpdated');
    register('PracticeMobileConnected', 'onPracticeMobileConnected');
    register('PracticeMobileDisconnected', 'onPracticeMobileDisconnected');
    register('PracticeSessionEnded', 'onPracticeSessionEnded');
    register('TimerConnected', 'onTimerConnected');
    register('TimerDisconnected', 'onTimerDisconnected');
    register('CameraReadyUpdated', 'onCameraReadyUpdated');
    register('WebRtcConnectionUpdated', 'onWebRtcConnectionUpdated');
    register('VideoRecordingStarted', 'onVideoRecordingStarted');

    // WebRTC signaling
    register('WebRtcOfferReceived', 'onWebRtcOfferReceived');
    register('WebRtcAnswerReceived', 'onWebRtcAnswerReceived');
    register('IceCandidateReceived', 'onIceCandidateReceived');

    let active = true;
    let timerId: NodeJS.Timeout;

    const startConnection = async () => {
      try {
        await conn.start();
        if (!active) {
          conn.stop().catch(() => {});
          return;
        }
        console.log('Connected to /hubs/online-arena');
        setConnection(conn);
        setIsConnected(true);

        if (matchId) {
          await conn.invoke('JoinMatchRoom', matchId);
          console.log(`Joined match room group for matchId: ${matchId}`);
        }
      } catch (err: any) {
        if (active) {
          console.error('Failed to establish SignalR connection:', err);
          setError(err.message || 'SignalR connection error');
        }
      }
    };

    // Delay connection start slightly to bypass React Strict Mode double-mount aborts
    timerId = setTimeout(() => {
      startConnection();
    }, 100);

    return () => {
      active = false;
      clearTimeout(timerId);
      if (conn) {
        if (matchId) {
          conn.invoke('LeaveMatchRoom', matchId).catch(() => {});
        }
        conn.stop().catch(() => {});
      }
      setIsConnected(false);
      setConnection(null);
    };
  }, [matchId]);

  return { connection, isConnected, error };
}
