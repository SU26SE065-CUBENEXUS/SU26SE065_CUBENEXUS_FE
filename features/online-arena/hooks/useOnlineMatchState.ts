'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { getMatchState } from '../api/onlineArenaApi';
import type { OnlineMatchRecoveryStateDto } from '../types';

export interface WebRtcConnectionUpdate {
  player1WebRtcConnected?: boolean;
  player2WebRtcConnected?: boolean;
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

  const fetchState = useCallback(async () => {
    try {
      const res = await getMatchState(matchId);

      // Never allow a refetch to regress a confirmed webRtcConnected flag.
      if (webRtcLock.current.player1) res.player1.webRtcConnected = true;
      if (webRtcLock.current.player2) res.player2.webRtcConnected = true;

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

  useEffect(() => {
    if (matchId) {
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
  };
}
