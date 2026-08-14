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
        <h2 className="text-3xl font-black text-slate-900 uppercase tracking-wider">MATCH UNDER REVIEW</h2>
        <p className="text-slate-500 text-xs sm:text-sm font-semibold">
          This match has been flagged for manual administrative review.
        </p>
      </div>

      <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl shadow-sm text-left space-y-5">
        <h3 className="text-sm font-bold text-slate-900 uppercase tracking-wider border-b border-slate-100 pb-3 flex items-center gap-2">
          <AlertCircle className="h-4.5 w-4.5 text-orange-500" /> Review Details
        </h3>

        <div className="space-y-4 text-xs text-slate-600 leading-relaxed font-medium">
          <p>
            An automatic AI check failed to verify the solved state of one or both Rubik's cubes.
            As a result, ELO rating updates have been suspended for this match.
          </p>
          <p>
            Our tournament moderators will review the recorded video evidence to verify the solve validity.
            Once resolved, your ELO rating and match result status will update automatically.
          </p>
        </div>

        <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
          <span className="block text-[9px] font-black text-slate-400 uppercase tracking-widest">
            TICKET INFORMATION
          </span>
          <div className="flex justify-between items-center text-[10px] text-slate-600 font-semibold">
            <span>Status:</span>
            <span className="font-extrabold text-orange-600 uppercase">PENDING MODERATION</span>
          </div>
          <div className="flex justify-between items-center text-[10px] text-slate-600 font-semibold">
            <span>Evidence Saved:</span>
            <span className="font-bold text-emerald-600">Yes (Camera Feed Backed Up)</span>
          </div>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
        <button
          onClick={() => router.push('/online')}
          className="flex-1 flex items-center justify-center gap-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 font-extrabold text-xs py-4 px-6 rounded-2xl transition-all uppercase tracking-widest cursor-pointer"
        >
          <Home className="h-4.5 w-4.5" /> Return Lobby
        </button>
      </div>
    </div>
  );
}
