'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AlertCircle, FileText, Home, ArrowRight, ShieldAlert } from 'lucide-react';

export default function NeedsReviewPage() {
  const router = useRouter();

  return (
    <div className="space-y-8 animate-fade-in max-w-xl mx-auto w-full text-center">
      <div className="space-y-2">
        <div className="h-14 w-14 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center mx-auto text-orange-500 animate-pulse">
          <ShieldAlert className="h-7 w-7" />
        </div>
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">MATCH UNDER REVIEW</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          This match has been flagged for manual administrative review.
        </p>
      </div>

      <div className="bg-zinc-900/60 border border-zinc-800/80 p-6 sm:p-8 rounded-3xl backdrop-blur-md shadow-2xl text-left space-y-5">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider border-b border-zinc-800/80 pb-3 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-orange-500" /> Review Details
        </h3>

        <div className="space-y-4 text-xs text-zinc-400 leading-relaxed">
          <p>
            An automatic AI check failed to verify the solved state of one or both Rubik's cubes.
            As a result, ELO rating updates have been suspended for this match.
          </p>
          <p>
            Our tournament moderators will review the recorded video evidence to verify the solve validity.
            Once resolved, your ELO rating and match result status will update automatically.
          </p>
        </div>

        <div className="bg-zinc-950/60 border border-zinc-850 p-4 rounded-xl space-y-2">
          <span className="block text-[9px] font-black text-zinc-500 uppercase tracking-widest">
            TICKET INFORMATION
          </span>
          <div className="flex justify-between items-center text-[10px] text-zinc-400">
            <span>Status:</span>
            <span className="font-extrabold text-orange-400 uppercase">PENDING MODERATION</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-zinc-400">
            <span>Evidence Saved:</span>
            <span className="font-semibold text-emerald-400">Yes (Camera Feed Backed Up)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
        <button
          onClick={() => router.push('/online')}
          className="flex-1 flex items-center justify-center gap-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 font-extrabold text-xs py-4 px-6 rounded-2xl transition-all uppercase tracking-widest"
        >
          <Home className="h-4.5 w-4.5" /> Return Lobby
        </button>
      </div>
    </div>
  );
}
