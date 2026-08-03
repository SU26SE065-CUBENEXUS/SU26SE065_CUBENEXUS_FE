'use client';

import React from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { Loader2 } from 'lucide-react';

// Import sub-pages as components for the unified match flow
import RoomSetupPage from './setup/page';
import ScrambleCheckPage from './scramble/page';
import CountdownPage from './countdown/page';
import InspectionPage from './inspection/page';
import SolvingPage from './solving/page';
import FinishCheckPage from './finish/page';
import WaitingOpponentPage from './waiting/page';
import ResultPage from './result/page';
import NeedsReviewPage from './review/page';

export default function MatchArenaMainPage() {
  const { state, isLoading } = useMatchContext();

  if (isLoading && !state) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400 gap-3">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <span className="text-xs uppercase font-bold tracking-widest">Loading Phase State...</span>
      </div>
    );
  }

  if (!state || !state.me?.nextUiState) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-zinc-400 gap-3">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <span className="text-xs uppercase font-bold tracking-widest">Connecting to match...</span>
      </div>
    );
  }

  const currentStep = state.me.nextUiState;

  switch (currentStep) {
    case 'SETUP':
      return <RoomSetupPage />;
    case 'SCRAMBLE_CHECK':
      return <ScrambleCheckPage />;
    case 'COUNTDOWN':
      return <CountdownPage />;
    case 'INSPECTION':
      return <InspectionPage />;
    case 'SOLVING':
      return <SolvingPage />;
    case 'FINISH_SCANNING':
      return <FinishCheckPage />;
    case 'WAITING_OPPONENT':
      return <WaitingOpponentPage />;
    case 'COMPLETED':
      return <ResultPage />;
    case 'NEEDS_REVIEW':
      return <NeedsReviewPage />;
    default:
      return <RoomSetupPage />;
  }
}
