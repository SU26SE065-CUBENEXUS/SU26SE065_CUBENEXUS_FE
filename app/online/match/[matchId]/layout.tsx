'use client';

import React, { useEffect, useMemo } from 'react';
import { useParams, usePathname, useRouter } from 'next/navigation';
import { MatchContext } from '@/features/online-arena/contexts/MatchContext';
import { CameraStreamProvider } from '@/features/online-arena/contexts/CameraStreamContext';
import { useOnlineMatchState } from '@/features/online-arena/hooks/useOnlineMatchState';
import { useOnlineArenaSignalR } from '@/features/online-arena/hooks/useOnlineArenaSignalR';
import { routeForNextUiState } from '@/features/online-arena/utils/navigation';
import { OpponentSidebar } from '@/features/online-arena/components/OpponentSidebar';
import { Header } from '@/components/header';
import { Loader2, ShieldAlert } from 'lucide-react';
import { parseJwt, getAccessToken } from '@/lib/api/config';

export default function MatchLayout({ children }: { children: React.ReactNode }) {
  const params = useParams();
  const matchId = (params?.matchId as string) || '';
  const pathname = usePathname();
  const router = useRouter();

  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const { state, isLoading, error, refetch } = useOnlineMatchState(matchId);

  const { connection, isConnected } = useOnlineArenaSignalR(matchId, {
    onMatchPhaseUpdated: async () => { await refetch(); },
    onCountdownStarted: async () => { await refetch(); },
    onInspectionStarted: async () => { await refetch(); },
    onSolveStarted: async () => { await refetch(); },
    onResultSubmitted: async () => { await refetch(); },
    onFinishCheckUpdated: async () => { await refetch(); },
    onPlayerWaitingOpponent: async () => { await refetch(); },
    onMatchNeedsReview: async () => { await refetch(); },
    onMatchCompleted: async () => { await refetch(); },
    onMatchCancelled: async () => { await refetch(); },
    onSolveTimeout: async () => { await refetch(); },
    onMatchStateChanged: async () => { await refetch(); },
    onChecklistUpdated: async () => { await refetch(); },
  });

  useEffect(() => {
    if (state?.me?.nextUiState) {
      const targetRoute = routeForNextUiState(matchId, state.me.nextUiState);
      if (pathname && pathname !== targetRoute) {
        console.log(`[Rerouting nextUiState] Current: ${pathname}, Target: ${targetRoute}`);
        router.replace(targetRoute);
      }
    }
  }, [state?.me?.nextUiState, pathname, matchId, router]);

  if (isLoading && !state) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.5_0.15_40_/_0.15),transparent_60%)]" />
        <Loader2 className="h-12 w-12 text-orange-500 animate-spin mb-4 relative z-10" />
        <p className="text-sm font-bold text-zinc-400 tracking-wider uppercase relative z-10">
          Entering Match Arena...
        </p>
      </main>
    );
  }

  if (error && !state) {
    return (
      <main className="min-h-screen bg-zinc-950 text-white flex flex-col items-center justify-center relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.6_0.18_20_/_0.1),transparent_60%)]" />
        <div className="bg-zinc-900/60 border border-zinc-800 p-8 rounded-3xl max-w-md text-center space-y-6 relative z-10 backdrop-blur-md">
          <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
            <ShieldAlert className="h-7 w-7" />
          </div>
          <div className="space-y-2">
            <h2 className="text-xl font-black text-white uppercase tracking-wider">Access Blocked</h2>
            <p className="text-zinc-400 text-xs sm:text-sm leading-relaxed">{error}</p>
          </div>
          <button
            onClick={() => router.replace('/online')}
            className="w-full bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold py-3 px-4 rounded-xl border border-zinc-700/80 transition-all uppercase tracking-widest"
          >
            Return to Lobby
          </button>
        </div>
      </main>
    );
  }

  return (
    <CameraStreamProvider>
      <MatchContext.Provider
        value={{
          matchId,
          state,
          isLoading,
          error,
          refetch,
          isConnected,
          connection,
        }}
      >
        <main className="min-h-screen bg-zinc-950 text-white flex flex-col">
          <Header />
          <div className="flex-1 flex overflow-hidden">
            <div className="flex-1 overflow-y-auto p-6 sm:p-8 relative">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,oklch(0.5_0.15_40_/_0.06),transparent_50%)]" />
              <div className="max-w-4xl mx-auto h-full flex flex-col justify-center relative z-10">
                {children}
              </div>
            </div>
            <OpponentSidebar state={state} userId={userId} />
          </div>
        </main>
      </MatchContext.Provider>
    </CameraStreamProvider>
  );
}
