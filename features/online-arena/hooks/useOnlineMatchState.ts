'use client';

import { useState, useEffect, useCallback } from 'react';
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

  const fetchState = useCallback(async () => {
    try {
      const res = await getMatchState(matchId);
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
    setState((current) => {
      if (!current) return current;

      return {
        ...current,
        player1: {
          ...current.player1,
          webRtcConnected:
            update.player1WebRtcConnected ?? current.player1.webRtcConnected,
        },
        player2: {
          ...current.player2,
          webRtcConnected:
            update.player2WebRtcConnected ?? current.player2.webRtcConnected,
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
