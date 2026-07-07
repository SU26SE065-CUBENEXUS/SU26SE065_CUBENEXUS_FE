'use client';

import { useState, useEffect, useCallback } from 'react';
import { getMatchState } from '../api/onlineArenaApi';
import type { OnlineMatchRecoveryStateDto } from '../types';

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
  };
}
