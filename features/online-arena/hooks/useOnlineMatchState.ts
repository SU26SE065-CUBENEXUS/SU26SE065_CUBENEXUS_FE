'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMatchState } from '../api/onlineArenaApi';
import type { OnlineMatchRecoveryStateDto } from '../types';

export interface WebRtcConnectionUpdate {
  player1WebRtcConnected?: boolean;
  player2WebRtcConnected?: boolean;
}

export interface TimerConnectionUpdate {
  playerId?: string;
  player1TimerReady?: boolean;
  player2TimerReady?: boolean;
}

interface RealtimeSetupPlayerUpdate {
  userId?: string;
  timerReady?: boolean;
  webRtcConnected?: boolean;
  cameraReady?: boolean;
  recordingStarted?: boolean;
  checklistPassed?: boolean;
  playerReady?: boolean;
  scrambleCheckStatus?: string;
}

export interface RealtimeMatchStateUpdate {
  status?: string;
  statusCode?: string;
  phase?: string;
  serverNow?: string;
  setupDeadlineAt?: string | null;
  countdownEndsAt?: string | null;
  player1?: RealtimeSetupPlayerUpdate;
  player2?: RealtimeSetupPlayerUpdate;
}

export function useOnlineMatchState(matchId: string) {
  const [state, setState] = useState<OnlineMatchRecoveryStateDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  /**
   * Persistent lock: once a player's webRtcConnected flag is confirmed as true
   * (either from an API response or SignalR event), it is NEVER allowed to be
   * set back to false by any subsequent refetch() that might return stale DB data.
   *
   * Multiple concurrent refetch() calls are triggered by ChecklistUpdated,
   * WebRtcConnectionUpdated, MatchJoined, etc. — whichever resolves last would
   * previously overwrite the optimistic update. This ref prevents that regression.
   */
  const webRtcLock = useRef({ player1: false, player2: false });
  const timerReadyLock = useRef({ player1: false, player2: false });

  const fetchState = useCallback(async () => {
    try {
      const res = await getMatchState(matchId);

      // Never allow a refetch to regress a confirmed webRtcConnected flag.
      if (webRtcLock.current.player1) res.player1.webRtcConnected = true;
      if (webRtcLock.current.player2) res.player2.webRtcConnected = true;
      if (timerReadyLock.current.player1) res.player1.timerReady = true;
      if (timerReadyLock.current.player2) res.player2.timerReady = true;

      setState(res);
      setError(null);
    } catch (err: any) {
      console.error('Failed to fetch online match state:', err);
      setError(err?.message || 'Failed to fetch match state');
    } finally {
      setIsLoading(false);
    }
  }, [matchId]);

  // SignalR and the POST response already contain the two WebRTC flags. Apply
  // them immediately so the checklist does not have to wait for another GET.
  const applyWebRtcConnectionUpdate = useCallback((update: WebRtcConnectionUpdate) => {
    // Latch the lock — once true, never goes back to false.
    if (update.player1WebRtcConnected) webRtcLock.current.player1 = true;
    if (update.player2WebRtcConnected) webRtcLock.current.player2 = true;

    setState((current) => {
      if (!current) return current;

      return {
        ...current,
        player1: {
          ...current.player1,
          // Use lock OR incoming update — never regress to false.
          webRtcConnected:
            webRtcLock.current.player1 ||
            (update.player1WebRtcConnected ?? current.player1.webRtcConnected),
        },
        player2: {
          ...current.player2,
          webRtcConnected:
            webRtcLock.current.player2 ||
            (update.player2WebRtcConnected ?? current.player2.webRtcConnected),
        },
      };
    });
  }, []);

  const applyTimerConnectionUpdate = useCallback((update: TimerConnectionUpdate) => {
    if (update.player1TimerReady) timerReadyLock.current.player1 = true;
    if (update.player2TimerReady) timerReadyLock.current.player2 = true;

    setState((current) => {
      if (!current) return current;
      const player1FromId = update.playerId === current.player1.userId;
      const player2FromId = update.playerId === current.player2.userId;
      if (player1FromId) timerReadyLock.current.player1 = true;
      if (player2FromId) timerReadyLock.current.player2 = true;

      return {
        ...current,
        player1: {
          ...current.player1,
          timerReady: timerReadyLock.current.player1 || current.player1.timerReady,
        },
        player2: {
          ...current.player2,
          timerReady: timerReadyLock.current.player2 || current.player2.timerReady,
        },
      };
    });
  }, []);

  const applyTimerDisconnectionUpdate = useCallback((update: TimerConnectionUpdate) => {
    setState((current) => {
      if (!current || !update.playerId) return current;
      const isPlayer1 = update.playerId === current.player1.userId;
      const isPlayer2 = update.playerId === current.player2.userId;
      if (isPlayer1) timerReadyLock.current.player1 = false;
      if (isPlayer2) timerReadyLock.current.player2 = false;
      return {
        ...current,
        player1: isPlayer1 ? { ...current.player1, timerReady: false } : current.player1,
        player2: isPlayer2 ? { ...current.player2, timerReady: false } : current.player2,
      };
    });
  }, []);

  const applyRealtimeMatchStateUpdate = useCallback((update: RealtimeMatchStateUpdate) => {
    if (update.player1?.timerReady) timerReadyLock.current.player1 = true;
    if (update.player2?.timerReady) timerReadyLock.current.player2 = true;
    if (update.player1?.webRtcConnected) webRtcLock.current.player1 = true;
    if (update.player2?.webRtcConnected) webRtcLock.current.player2 = true;

    setState((current) => {
      if (!current) return current;

      const mergePlayer = (
        existing: OnlineMatchRecoveryStateDto['player1'],
        incoming: RealtimeSetupPlayerUpdate | undefined,
        slot: 'player1' | 'player2',
      ) => {
        if (!incoming) return existing;
        return {
          ...existing,
          cameraReady: incoming.cameraReady ?? existing.cameraReady,
          recordingStarted: incoming.recordingStarted ?? existing.recordingStarted,
          checklistPassed: incoming.checklistPassed ?? existing.checklistPassed,
          isReady: incoming.playerReady ?? existing.isReady,
          scrambleCheckStatus: (incoming.scrambleCheckStatus as typeof existing.scrambleCheckStatus) ?? existing.scrambleCheckStatus,
          timerReady: timerReadyLock.current[slot] || incoming.timerReady || existing.timerReady,
          webRtcConnected: webRtcLock.current[slot] || incoming.webRtcConnected || existing.webRtcConnected,
        };
      };

      return {
        ...current,
        statusCode: (update.statusCode ?? update.status ?? current.statusCode) as OnlineMatchRecoveryStateDto['statusCode'],
        phase: (update.phase ?? current.phase) as OnlineMatchRecoveryStateDto['phase'],
        serverNow: update.serverNow ?? current.serverNow,
        setupDeadlineAt: update.setupDeadlineAt ?? current.setupDeadlineAt,
        countdownEndsAt: update.countdownEndsAt ?? current.countdownEndsAt,
        player1: mergePlayer(current.player1, update.player1, 'player1'),
        player2: mergePlayer(current.player2, update.player2, 'player2'),
      };
    });
  }, []);

  useEffect(() => {
    if (matchId) {
      webRtcLock.current = { player1: false, player2: false };
      timerReadyLock.current = { player1: false, player2: false };
      setIsLoading(true);
      fetchState();
    }
  }, [matchId, fetchState]);

  return {
    state,
    isLoading,
    error,
    refetch: fetchState,
    applyWebRtcConnectionUpdate,
    applyTimerConnectionUpdate,
    applyTimerDisconnectionUpdate,
    applyRealtimeMatchStateUpdate,
  };
}
