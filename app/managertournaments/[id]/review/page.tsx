'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  ShieldCheck,
  CheckCircle,
  XCircle,
  Video,
  Clock,
  AlertTriangle,
  RefreshCw,
  Search,
  Filter,
  Eye,
  ArrowLeft,
  FileText,
} from 'lucide-react';
import {
  getAttemptsForReview,
  reviewAttempt,
  getOnlineAsyncTournamentById,
  resolveVideoEvidenceUrl,
  type AsyncLeaderboardEntryDto,
  type OnlineAsyncTournamentDto,
} from '@/lib/api/online-async';
import { SingleVideoReplayPlayer } from '@/features/online-arena/components/SingleVideoReplayPlayer';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminAttemptReviewPage({ params }: Props) {
  const { id: tournamentId } = use(params);
  const router = useRouter();

  const [tournament, setTournament] = useState<OnlineAsyncTournamentDto | null>(null);
  const [attempts, setAttempts] = useState<AsyncLeaderboardEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Selected attempt modal state
  const [selectedAttempt, setSelectedAttempt] = useState<AsyncLeaderboardEntryDto | null>(null);
  const [reviewPenalty, setReviewPenalty] = useState<'NONE' | 'PLUS2' | 'DNF'>('NONE');
  const [reviewNote, setReviewNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tourney = await getOnlineAsyncTournamentById(tournamentId);
      setTournament(tourney);

      const list = await getAttemptsForReview(tournamentId);
      setAttempts(list);
    } catch (err: any) {
      setError(err?.message || 'Failed to load attempt reviews.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleOpenReview = (att: AsyncLeaderboardEntryDto) => {
    setSelectedAttempt(att);
    setReviewPenalty((att.penaltyCode as any) || 'NONE');
    setReviewNote('');
  };

  const handleApplyReview = async (reviewStatus: 'APPROVED' | 'REJECTED') => {
    if (!selectedAttempt) return;
    setIsSubmitting(true);
    try {
      await reviewAttempt(selectedAttempt.attemptId, {
        attemptId: selectedAttempt.attemptId,
        reviewStatus,
        penaltyCode: reviewPenalty,
        reviewNote,
      });

      setSelectedAttempt(null);
      fetchData();
    } catch (err: any) {
      alert(err?.message || 'Failed to submit review.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/managertournaments')}
            className="inline-flex items-center gap-1 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Tournaments
          </button>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight">
            Review Attempts - {tournament?.name || 'Online Async Tournament'}
          </h1>
          <p className="text-xs text-slate-500">
            Inspect video recordings, verify Scramble & Solved states to Approve or Reject attempts.
          </p>
        </div>

        <button
          onClick={fetchData}
          disabled={isLoading}
          className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer self-start sm:self-center"
        >
          <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {error && (
        <div className="rounded-xl bg-red-50 p-4 text-xs font-semibold text-red-700 border border-red-200">
          {error}
        </div>
      )}

      {/* Attempts Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        {isLoading ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
            Loading attempts data...
          </div>
        ) : attempts.length === 0 ? (
          <div className="p-12 text-center text-xs font-semibold text-slate-500">
            No competitors have submitted attempts for this tournament yet.
          </div>
        ) : (
          <table className="w-full text-left text-xs">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50 text-slate-400 font-bold uppercase tracking-wider">
                <th className="py-3.5 px-4">Competitor</th>
                <th className="py-3.5 px-4 text-right">Solve Time (Raw)</th>
                <th className="py-3.5 px-4 text-center">Penalty</th>
                <th className="py-3.5 px-4 text-right">Final Result</th>
                <th className="py-3.5 px-4 text-center">Review Status</th>
                <th className="py-3.5 px-4 text-center">Video Evidence</th>
                <th className="py-3.5 px-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {attempts.map((att) => (
                <tr key={att.attemptId} className="hover:bg-slate-50 transition">
                  <td className="py-3.5 px-4 font-bold text-slate-900">
                    {att.userFullName}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono">
                    {att.rawTimeMs ? `${(att.rawTimeMs / 1000).toFixed(2)}s` : '-'}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {att.penaltyCode === 'PLUS2' ? (
                      <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">+2s</span>
                    ) : att.isDnf ? (
                      <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[11px]">DNF</span>
                    ) : (
                      <span className="text-slate-400">-</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right font-mono font-extrabold text-indigo-600">
                    {att.displayResult}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {att.reviewStatus === 'APPROVED' ? (
                      <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 font-bold text-[11px]">
                        APPROVED
                      </span>
                    ) : att.reviewStatus === 'REJECTED' ? (
                      <span className="px-2.5 py-1 rounded-full bg-red-100 text-red-800 font-bold text-[11px]">
                        REJECTED
                      </span>
                    ) : (
                      <span className="px-2.5 py-1 rounded-full bg-amber-100 text-amber-800 font-bold text-[11px]">
                        PENDING REVIEW
                      </span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-center">
                    {att.videoEvidenceUrl ? (
                      <a
                        href={resolveVideoEvidenceUrl(att.videoEvidenceUrl) || '#'}
                        target="_blank"
                        rel="noreferrer"
                        className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                      >
                        <Video className="h-3.5 w-3.5" /> Recording
                      </a>
                    ) : (
                      <span className="text-slate-400 text-[11px]">N/A</span>
                    )}
                  </td>
                  <td className="py-3.5 px-4 text-right">
                    <button
                      onClick={() => handleOpenReview(att)}
                      className="px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 font-bold hover:bg-indigo-100 transition cursor-pointer"
                    >
                      Review & Decide
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Review Modal */}
      {selectedAttempt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
          <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8 space-y-5">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div>
                <h3 className="text-base font-extrabold text-slate-900">
                  Review Attempt: {selectedAttempt.userFullName}
                </h3>
                <p className="text-xs text-slate-500">Inspect video evidence and adjust penalty if needed.</p>
              </div>
              <button
                onClick={() => setSelectedAttempt(null)}
                className="text-slate-400 hover:text-slate-600 font-bold"
              >
                ✕
              </button>
            </div>

            <div className="rounded-xl bg-slate-50 p-4 border border-slate-200 grid grid-cols-2 gap-4 text-xs">
              <div>
                <p className="text-slate-400 font-bold">Solve Time (Raw)</p>
                <p className="text-lg font-mono font-bold text-slate-900 mt-0.5">
                  {selectedAttempt.rawTimeMs ? `${(selectedAttempt.rawTimeMs / 1000).toFixed(2)}s` : '-'}
                </p>
              </div>
              <div>
                <p className="text-slate-400 font-bold">Original Result Display</p>
                <p className="text-lg font-mono font-extrabold text-indigo-600 mt-0.5">
                  {selectedAttempt.displayResult}
                </p>
              </div>
            </div>

            {/* Video Evidence Preview */}
            <div className="space-y-2">
              {selectedAttempt.videoEvidenceUrl ? (
                <SingleVideoReplayPlayer
                  videoUrl={resolveVideoEvidenceUrl(selectedAttempt.videoEvidenceUrl) || ''}
                  title={`Video Evidence - ${selectedAttempt.userFullName}`}
                  downloadFilename={`attempt-${selectedAttempt.attemptId}.webm`}
                />
              ) : (
                <div className="p-4 bg-slate-100 rounded-xl text-xs text-slate-500 text-center">
                  Video has been stored securely on server.
                </div>
              )}
            </div>

            {/* Penalty adjustment */}
            <div className="space-y-2">
              <label className="block text-xs font-bold text-slate-700">Adjust Penalty</label>
              <div className="grid grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => setReviewPenalty('NONE')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    reviewPenalty === 'NONE'
                      ? 'border-emerald-600 bg-emerald-50 text-emerald-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  No Penalty (+0s)
                </button>
                <button
                  type="button"
                  onClick={() => setReviewPenalty('PLUS2')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    reviewPenalty === 'PLUS2'
                      ? 'border-amber-600 bg-amber-50 text-amber-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  +2 Seconds
                </button>
                <button
                  type="button"
                  onClick={() => setReviewPenalty('DNF')}
                  className={`py-2 text-xs font-bold rounded-xl border transition cursor-pointer ${
                    reviewPenalty === 'DNF'
                      ? 'border-red-600 bg-red-50 text-red-700'
                      : 'border-slate-200 bg-white text-slate-600'
                  }`}
                >
                  DNF (Disqualified)
                </button>
              </div>
            </div>

            {/* Note */}
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">Review Notes (Optional)</label>
              <textarea
                placeholder="Enter review explanation or reason for decision..."
                value={reviewNote}
                onChange={(e) => setReviewNote(e.target.value)}
                rows={2}
                className="w-full rounded-xl border border-slate-200 p-2.5 text-xs outline-none focus:border-indigo-600"
              />
            </div>

            {/* Action buttons */}
            <div className="flex justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => handleApplyReview('REJECTED')}
                disabled={isSubmitting}
                className="px-4 py-2.5 rounded-xl border border-red-200 bg-red-50 text-red-700 font-bold hover:bg-red-100 transition cursor-pointer disabled:opacity-50 text-xs"
              >
                Reject Attempt
              </button>
              <button
                type="button"
                onClick={() => handleApplyReview('APPROVED')}
                disabled={isSubmitting}
                className="px-5 py-2.5 rounded-xl bg-emerald-600 text-white font-bold hover:bg-emerald-700 transition cursor-pointer disabled:opacity-50 text-xs"
              >
                Approve Result
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
