'use client';

import { useEffect, useState } from 'react';
import { Check, Loader2, PlayCircle, ShieldCheck, X } from 'lucide-react';
import { getAdminTournaments, type AdminTournamentDto } from '@/features/admin/api/adminTournamentApi';
import { getAsyncAttemptVideoPlayback, getAttemptsForReview, reviewAttempt, type AsyncLeaderboardEntryDto } from '@/lib/api/online-async';

import { SingleVideoReplayPlayer } from '@/features/online-arena/components/SingleVideoReplayPlayer';

export default function A01VideoReviewPage() {
  const [tournaments, setTournaments] = useState<AdminTournamentDto[]>([]);
  const [selectedId, setSelectedId] = useState('');
  const [attempts, setAttempts] = useState<AsyncLeaderboardEntryDto[]>([]);
  const [videoUrl, setVideoUrl] = useState<string | null>(null);
  const [activeAttemptId, setActiveAttemptId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState<string | null>(null);
  const selected = tournaments.find((item) => item.id === selectedId);

  useEffect(() => {
    getAdminTournaments({ page: 1, pageSize: 100, tournamentType: 'ONLINE_ASYNC' })
      .then((result) => {
        const a01 = result.items.filter((item) => item.tournamentType === 'ONLINE_ASYNC');
        setTournaments(a01);
        if (a01[0]) setSelectedId(a01[0].id);
      })
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    if (!selectedId) return;
    setLoading(true);
    setVideoUrl(null);
    getAttemptsForReview(selectedId).then(setAttempts).finally(() => setLoading(false));
  }, [selectedId]);

  const openVideo = async (attemptId: string) => {
    setBusy(attemptId);
    try { setVideoUrl((await getAsyncAttemptVideoPlayback(attemptId)).url); setActiveAttemptId(attemptId); }
    finally { setBusy(null); }
  };

  const decide = async (attemptId: string, approved: boolean) => {
    setBusy(attemptId);
    try {
      await reviewAttempt(attemptId, { attemptId, reviewStatus: approved ? 'APPROVED' : 'REJECTED', penaltyCode: approved ? 'NONE' : 'DNF' });
      setAttempts((current) => current.filter((item) => item.attemptId !== attemptId));
      setVideoUrl(null);
      setActiveAttemptId(null);
    } finally { setBusy(null); }
  };

  return (
    <main className="mx-auto w-full max-w-7xl space-y-6 p-6">
      <header><h1 className="text-2xl font-black text-slate-900">A01 Video Review</h1><p className="mt-1 text-sm text-slate-500">Only completed, valid attempts with video evidence are shown.</p></header>
      <select value={selectedId} onChange={(event) => setSelectedId(event.target.value)} className="w-full max-w-lg rounded-xl border border-slate-200 bg-white px-3 py-2.5 text-sm font-semibold text-slate-800">
        {tournaments.map((item) => <option key={item.id} value={item.id}>{item.name} — {item.puzzleTypeName}</option>)}
      </select>
      {loading ? <Loader2 className="h-6 w-6 animate-spin text-indigo-600" /> : (
        <div className="grid gap-5 lg:grid-cols-[1fr_1.3fr]">
          <section className="overflow-hidden rounded-2xl border border-slate-200 bg-white">
            <div className="border-b border-slate-100 px-5 py-4 text-sm font-bold text-slate-800">Pending review · {selected?.name}</div>
            {attempts.length === 0 ? <p className="p-5 text-sm text-slate-500">No valid A01 videos are awaiting review.</p> : attempts.map((item) => (
              <article key={item.attemptId} className="flex items-center justify-between gap-3 border-b border-slate-100 p-4 last:border-0">
                <div><p className="font-bold text-slate-900">{item.userFullName}</p><p className="text-xs text-slate-500">{item.displayResult}</p></div>
                <button onClick={() => void openVideo(item.attemptId)} disabled={busy === item.attemptId} className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white disabled:opacity-50"><PlayCircle className="h-4 w-4" /> View Video</button>
              </article>
            ))}
          </section>
          <section className="rounded-2xl border border-slate-200 bg-white p-5 space-y-4">
            {videoUrl ? (
              <SingleVideoReplayPlayer
                videoUrl={videoUrl}
                title={`A01 Evidence - ${attempts.find((a) => a.attemptId === activeAttemptId)?.userFullName || ''}`}
                downloadFilename={`attempt-${activeAttemptId}.webm`}
              />
            ) : (
              <div className="flex aspect-video items-center justify-center rounded-xl bg-slate-50 text-sm text-slate-400">Select an attempt to view its evidence.</div>
            )}
            {videoUrl && activeAttemptId && (
              <div className="flex gap-3">
                <button onClick={() => void decide(activeAttemptId, true)} className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-emerald-700 transition cursor-pointer"><Check className="h-4 w-4" /> Approve</button>
                <button onClick={() => void decide(activeAttemptId, false)} className="inline-flex items-center gap-2 rounded-xl bg-rose-600 px-4 py-2.5 text-sm font-bold text-white shadow-md hover:bg-rose-700 transition cursor-pointer"><X className="h-4 w-4" /> Reject / DNF</button>
              </div>
            )}
          </section>
        </div>
      )}
    </main>
  );
}
