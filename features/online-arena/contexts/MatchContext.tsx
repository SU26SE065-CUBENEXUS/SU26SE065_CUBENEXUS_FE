'use client';

import { createContext, useContext } from 'react';
import type { HubConnection } from '@microsoft/signalr';
import type { OnlineMatchRecoveryStateDto } from '../types';

interface MatchContextType {
  matchId: string;
  state: OnlineMatchRecoveryStateDto | null;
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
  isConnected: boolean;
  connection: HubConnection | null;
}

export const MatchContext = createContext<MatchContextType | null>(null);

export function useMatchContext() {
  const context = useContext(MatchContext);
  if (!context) {
    throw new Error('useMatchContext must be used within a MatchProvider');
  }
  return context;
}
