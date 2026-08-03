'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { OnlineMatchScanner } from '@/features/online-arena/components/OnlineMatchScanner';
import { mockFinishPass } from '@/features/online-arena/api/onlineArenaApi';
import { useRouter } from 'next/navigation';
import { Radio, Cpu, Loader2, AlertCircle } from 'lucide-react';

export default function FinishCheckPage() {
  const { matchId, refetch } = useMatchContext();
  const router = useRouter();

  const [isDev, setIsDev] = useState(false);
  const [isMocking, setIsMocking] = useState(false);
  const [mockError, setMockError] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      setIsDev(
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1'
      );
    }
  }, []);

  const handleSuccess = useCallback(async (res: any) => {
    console.log('Finish Scan completed successfully!', res);
    await refetch();
    
    // Explicit safety routing back to the main root match page (the parent page switcher handles the sub-views)
    router.replace(`/online/match/${matchId}`);
  }, [matchId, refetch, router]);

  const handleMockFinish = async () => {
    if (isMocking) return;
    setIsMocking(true);
    setMockError(null);
    try {
      await mockFinishPass(matchId);
      await refetch();
      router.replace(`/online/match/${matchId}`);
    } catch (err: any) {
      console.error(err);
      setMockError(err.message || 'Failed to mock finish check.');
    } finally {
      setIsMocking(false);
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

      {isDev && (
        <div className="rounded-3xl border border-dashed border-zinc-800/80 bg-zinc-900/10 p-6 space-y-4 text-left animate-fade-in">
          <div className="flex items-center gap-2 border-b border-zinc-800/80 pb-3">
            <Cpu className="h-4.5 w-4.5 text-orange-500" />
            <h4 className="text-xs font-black text-zinc-300 uppercase tracking-wider">
              [Dev Simulator] Solve verification bypass
            </h4>
          </div>
          <p className="text-[11px] text-zinc-500 leading-normal">
            Simulates a successful AI face scan verification of the solved Rubik's cube, passing the audit checklist.
          </p>

          <button
            onClick={handleMockFinish}
            disabled={isMocking}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer"
          >
            {isMocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Dev: Mock Finish Scan Pass'}
          </button>

          {mockError && (
            <div className="flex items-start gap-2 bg-rose-500/5 border border-rose-500/15 p-3 rounded-lg text-rose-400 text-[10px] leading-relaxed font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mockError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
