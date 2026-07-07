'use client';

import React from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { OnlineMatchScanner } from '@/features/online-arena/components/OnlineMatchScanner';
import { useRouter } from 'next/navigation';
import { Radio } from 'lucide-react';

export default function FinishCheckPage() {
  const { matchId, refetch } = useMatchContext();
  const router = useRouter();

  const handleSuccess = async (res: any) => {
    console.log('Finish Scan completed successfully!', res);
    await refetch();
    
    // Explicit safety routing (layout will also route automatically based on me.nextUiState)
    if (res.nextUiState === 'WAITING_OPPONENT') {
      router.replace(`/online/match/${matchId}/waiting`);
    } else if (res.nextUiState === 'COMPLETED') {
      router.replace(`/online/match/${matchId}/result`);
    } else if (res.nextUiState === 'NEEDS_REVIEW') {
      router.replace(`/online/match/${matchId}/review`);
    }
  };

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full">
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase animate-pulse">
          SOLVE VERIFICATION ACTIVE
        </span>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">FINISH CHECK</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Scan the 6 solved faces of your Rubik's cube to verify the solve validity using AI.
        </p>
      </div>

      <OnlineMatchScanner
        matchId={matchId}
        validationType="FINISH"
        onSuccess={handleSuccess}
      />

      <div className="text-center">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" /> AI evaluating final solved face grids
        </span>
      </div>
    </div>
  );
}
