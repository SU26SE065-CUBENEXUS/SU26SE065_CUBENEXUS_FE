'use client';

import React, { useCallback, useState, useEffect } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { OnlineMatchScanner } from '@/features/online-arena/components/OnlineMatchScanner';
import { mockFinishPass } from '@/features/online-arena/api/onlineArenaApi';
import { useMatchLocalRecorder } from '@/features/online-arena/hooks/useMatchLocalRecorder';
import { useRouter } from 'next/navigation';
import { Radio, Cpu, Loader2, AlertCircle } from 'lucide-react';

export default function FinishCheckPage() {
  const { matchId, refetch } = useMatchContext();
  const { stopRecordingWithBuffer } = useMatchLocalRecorder();
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

  const [retryWarning, setRetryWarning] = useState<string | null>(null);

  const handleSuccess = useCallback(async (res: any) => {
    // Nếu backend trả về RETRY_SCAN: không navigate, chỉ hiển thị thông báo
    // (OnlineMatchScanner đã tự reset session client-side)
    if (res?.nextUiState === 'RETRY_SCAN') {
      setRetryWarning(res?.message || 'Colors did not match a solved Rubik\'s cube. Please re-scan all faces from the beginning.');
      return;
    }
    if (res?.validation?.status === 'RETRY') {
      setRetryWarning('Colors did not match a solved Rubik\'s cube. Please re-scan all faces from the beginning.');
      return;
    }

    // Scan thành công → Dừng ghi hình ngay và điều hướng bình thường
    setRetryWarning(null);
    console.log('[REC] Finish Scan completed successfully! Finalizing camera recording for this player...');
    void stopRecordingWithBuffer(1000);
    await refetch();
    
    // Explicit safety routing back to the main root match page (the parent page switcher handles the sub-views)
    router.replace(`/online/match/${matchId}`);
  }, [matchId, refetch, router, stopRecordingWithBuffer]);

  const handleMockFinish = async () => {
    if (isMocking) return;
    setIsMocking(true);
    setMockError(null);
    try {
      await mockFinishPass(matchId);
      console.log('[REC] Mock Finish Check passed! Finalizing camera recording...');
      void stopRecordingWithBuffer(1000);
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
    <div className="space-y-8 animate-fade-in max-w-6xl mx-auto w-full px-4 sm:px-6">
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase animate-pulse">
          SOLVE VERIFICATION ACTIVE
        </span>
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wider">FINISH CHECK</h2>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          Scan the 6 solved faces of your Rubik's cube to verify the solve validity using AI.
        </p>
      </div>

      <OnlineMatchScanner
        matchId={matchId}
        validationType="FINISH"
        onSuccess={handleSuccess}
      />

      {retryWarning && (
        <div className="animate-fade-in rounded-2xl border border-amber-500/35 bg-amber-55 p-5 space-y-3">
          <div className="flex items-start gap-3">
            <AlertCircle className="h-5 w-5 text-amber-600 shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-sm font-black text-amber-700 uppercase tracking-wider">
                RE-SCAN REQUIRED
              </p>
              <p className="text-xs text-amber-800 leading-relaxed font-semibold">
                {retryWarning}
              </p>
              <p className="text-[10px] text-slate-500 leading-relaxed font-medium">
                This may be caused by lighting conditions, camera angle, or cube orientation.
                Make sure all 9 stickers on each face are clearly visible and press <strong className="text-slate-700">Scan</strong> again.
              </p>
            </div>
          </div>
          <button
            onClick={() => setRetryWarning(null)}
            className="text-[10px] font-bold text-amber-600 hover:text-amber-800 transition-colors uppercase tracking-widest border-none bg-transparent cursor-pointer"
          >
            ✕ Dismiss
          </button>
        </div>
      )}

      <div className="text-center">
        <span className="text-[10px] font-black text-slate-400 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" /> AI evaluating final solved face grids
        </span>
      </div>

      {isDev && (
        <div className="rounded-3xl border border-dashed border-slate-200 bg-slate-50/50 p-6 space-y-4 text-left animate-fade-in">
          <div className="flex items-center gap-2 border-b border-slate-100 pb-3">
            <Cpu className="h-4.5 w-4.5 text-orange-500" />
            <h4 className="text-xs font-black text-slate-900 uppercase tracking-wider">
              [Dev Simulator] Solve verification bypass
            </h4>
          </div>
          <p className="text-[11px] text-slate-500 leading-normal font-medium">
            Simulates a successful AI face scan verification of the solved Rubik's cube, passing the audit checklist.
          </p>

          <button
            onClick={handleMockFinish}
            disabled={isMocking}
            className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-[10px] py-3 px-4 rounded-xl transition-all uppercase tracking-widest flex items-center justify-center gap-2 cursor-pointer border-none"
          >
            {isMocking ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : 'Dev: Mock Finish Scan Pass'}
          </button>

          {mockError && (
            <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-3 rounded-lg text-rose-600 text-[10px] leading-relaxed font-semibold">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <span>{mockError}</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
