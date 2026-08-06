'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Video, ShieldCheck, Clock, Award, Hash, ArrowUpRight, ArrowDownRight, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { SplitScreenReplayPlayer } from './SplitScreenReplayPlayer';
import { FraudReportModal } from './FraudReportModal';
import { getMatchRecordingPlaybackUrls, getMatchFraudReport, PlaybackResponseDto, OnlineMatchHistoryItemDto, MatchFraudReportStatusDto } from '../api/onlineArenaApi';
import { AuditVerdictBadge } from './AuditVerdictBadge';

interface MatchDetailModalProps {
  matchItem: OnlineMatchHistoryItemDto | null;
  isOpen: boolean;
  onClose: () => void;
}

export function MatchDetailModal({ matchItem, isOpen, onClose }: MatchDetailModalProps) {
  const [playbackData, setPlaybackData] = useState<PlaybackResponseDto | null>(null);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [videoError, setVideoError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState<boolean>(false);
  const [reportDetail, setReportDetail] = useState<MatchFraudReportStatusDto | null>(null);

  useEffect(() => {
    if (!isOpen || !matchItem) {
      setPlaybackData(null);
      setVideoError(null);
      setReportDetail(null);
      return;
    }

    let isMounted = true;
    setIsLoadingVideo(true);
    setVideoError(null);

    // Fetch video replay
    getMatchRecordingPlaybackUrls(matchItem.matchId)
      .then((data) => {
        if (isMounted) {
          setPlaybackData(data);
        }
      })
      .catch((err) => {
        if (isMounted) {
          console.warn('[MatchDetailModal] Failed to fetch replay stream:', err);
          setVideoError('Video replay stream not available for this match.');
        }
      })
      .finally(() => {
        if (isMounted) {
          setIsLoadingVideo(false);
        }
      });

    // Fetch fraud report status directly for guaranteed fresh report details
    getMatchFraudReport(matchItem.matchId)
      .then((res) => {
        if (isMounted && res) {
          setReportDetail(res);
        }
      })
      .catch(() => {});

    return () => {
      isMounted = false;
    };
  }, [isOpen, matchItem]);

  if (!isOpen || !matchItem) return null;

  const formatTimeStr = (ms?: number, isDnf?: boolean) => {
    if (isDnf) return 'DNF';
    if (!ms || ms <= 0) return '0.00s';
    return (ms / 1000).toFixed(2) + 's';
  };

  const p1Record = playbackData?.recordings?.find((r) => r.playerId === matchItem.meUserId);
  const p2Record = playbackData?.recordings?.find((r) => r.playerId === matchItem.opponentUserId);

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="flex min-h-full items-center justify-center p-4 sm:p-6">
        <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-3xl shadow-2xl space-y-5 p-5 sm:p-6 relative text-left text-zinc-800">
          {/* Close Button */}
          <button
            onClick={onClose}
            className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer z-10"
            title="Close (Esc)"
          >
            <X className="h-4 w-4" />
          </button>

          {/* Header Section */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-zinc-200 pr-8">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <span className="px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wider bg-orange-500/10 text-orange-600 border border-orange-500/20 rounded-md">
                  {matchItem.modeName || 'Ranked 1v1'}
                </span>
                <span className="text-xs text-zinc-500 font-mono">
                  {new Date(matchItem.createdAt).toLocaleString()}
                </span>
              </div>
              <h2 className="text-lg font-bold tracking-tight text-zinc-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-amber-500" />
                Match Replay &amp; Details
              </h2>
            </div>

            {/* Outcome Badge & Actions */}
            <div className="flex items-center gap-2 shrink-0">
              <div
                className={`px-2.5 py-1 rounded-lg border text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 ${
                  matchItem.isWinner
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : matchItem.isDraw
                    ? 'bg-zinc-100 text-zinc-600 border-zinc-200'
                    : 'bg-rose-50 text-rose-600 border-rose-200'
                }`}
              >
                {matchItem.isWinner ? (
                  <>
                    <Trophy className="h-3.5 w-3.5 text-amber-500" /> VICTORY
                  </>
                ) : matchItem.isDraw ? (
                  'DRAW'
                ) : (
                  'DEFEAT'
                )}
              </div>

              {/* ELO Delta Tag */}
              <div
                className={`px-2.5 py-1 rounded-lg border font-mono font-bold text-xs flex items-center gap-1 ${
                  matchItem.eloChange > 0
                    ? 'bg-emerald-50 text-emerald-600 border-emerald-200'
                    : matchItem.eloChange < 0
                    ? 'bg-rose-50 text-rose-600 border-rose-200'
                    : 'bg-zinc-100 text-zinc-500 border-zinc-200'
                }`}
              >
                {matchItem.eloChange > 0 ? (
                  <ArrowUpRight className="h-3.5 w-3.5" />
                ) : matchItem.eloChange < 0 ? (
                  <ArrowDownRight className="h-3.5 w-3.5" />
                ) : null}
                {matchItem.eloChange > 0 ? `+${matchItem.eloChange}` : matchItem.eloChange} ELO
              </div>

              {/* Report Fraud Button */}
              <button
                onClick={() => setIsReportModalOpen(true)}
                className="px-2.5 py-1 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-600 font-semibold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <ShieldAlert className="h-3.5 w-3.5 text-rose-500" />
                Report
              </button>
            </div>
          </div>

          {/* Audit Verdict Banner — only shows if a fraud report exists */}
          <AuditVerdictBadge
            reportStatus={reportDetail?.statusCode || matchItem.reportStatus}
            verdictCode={reportDetail?.verdictCode || matchItem.reportVerdictCode}
            adminNote={reportDetail?.adminNote || matchItem.reportAdminNote}
          />

          {/* Video Replay Section */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Video className="h-3.5 w-3.5 text-orange-500" /> Dual-Cam Video Replay
              </h3>
              {isLoadingVideo && (
                <span className="text-[11px] font-medium text-orange-500 flex items-center gap-1.5 animate-pulse">
                  <Loader2 className="h-3 w-3 animate-spin" /> Fetching replay stream...
                </span>
              )}
            </div>

            {playbackData ? (
              <SplitScreenReplayPlayer
                matchId={matchItem.matchId}
                playerA={{
                  username: matchItem.meUsername,
                  videoUrl: p1Record?.playbackUrl || '',
                  solveTimeSeconds: (matchItem.meTimeMs || 10000) / 1000,
                  videoDurationSeconds: p1Record?.durationSeconds,
                  isWinner: matchItem.isWinner,
                }}
                playerB={{
                  username: matchItem.opponentUsername,
                  videoUrl: p2Record?.playbackUrl || '',
                  solveTimeSeconds: (matchItem.opponentTimeMs || 10000) / 1000,
                  videoDurationSeconds: p2Record?.durationSeconds,
                  isWinner: !matchItem.isWinner && !matchItem.isDraw,
                }}
                officialWinnerName={
                  matchItem.isDraw || matchItem.outcome === 'DRAW' || matchItem.outcome === 'INCONCLUSIVE'
                    ? undefined
                    : matchItem.isWinner
                    ? matchItem.meUsername
                    : matchItem.opponentUsername
                }
                officialWinnerText={matchItem.outcome}
              />
            ) : videoError ? (
              <div className="p-6 bg-zinc-50 border border-zinc-200 rounded-xl text-center space-y-1.5 text-zinc-500">
                <ShieldCheck className="h-6 w-6 text-zinc-400 mx-auto" />
                <p className="text-xs font-medium">{videoError}</p>
                <p className="text-[10px] text-zinc-400">
                  {matchItem.isDraw || matchItem.outcome === 'CANCELLED'
                    ? 'No video recording was captured because the match ended before setup was completed.'
                    : 'Video evidence might still be processing or expired.'}
                </p>
              </div>
            ) : (
              <div className="p-8 bg-zinc-50 border border-zinc-200 rounded-xl text-center space-y-2">
                <Loader2 className="h-6 w-6 text-orange-500 animate-spin mx-auto" />
                <p className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Loading Match Replay Stream...</p>
              </div>
            )}
          </div>

          {/* Stats Comparison Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1">
            {/* Player (Me) Card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-emerald-500" />
                  <span className="text-xs font-bold text-zinc-900">{matchItem.meUsername}</span>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase">(YOU)</span>
                </div>
                {matchItem.isWinner && (
                  <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    WINNER
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-zinc-200 space-y-0.5 shadow-sm">
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Solve Time</span>
                  <p className="text-base font-bold font-mono text-emerald-600">
                    {formatTimeStr(matchItem.meTimeMs, matchItem.meIsDnf)}
                  </p>
                </div>

                <div className="bg-white p-2 rounded-lg border border-zinc-200 space-y-0.5 shadow-sm">
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">ELO Rating</span>
                  <p className="text-sm font-bold font-mono text-zinc-800">
                    {matchItem.meEloAfter ?? matchItem.meEloBefore ?? '1200'}
                    {matchItem.eloChange !== 0 && (
                      <span className={`text-xs ml-1 font-semibold ${matchItem.eloChange > 0 ? 'text-emerald-600' : 'text-rose-600'}`}>
                        ({matchItem.eloChange > 0 ? `+${matchItem.eloChange}` : matchItem.eloChange})
                      </span>
                    )}
                  </p>
                </div>
              </div>
            </div>

            {/* Opponent Card */}
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3.5 space-y-2.5">
              <div className="flex items-center justify-between border-b border-zinc-200 pb-2">
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-orange-500" />
                  <span className="text-xs font-bold text-zinc-900">{matchItem.opponentUsername}</span>
                  <span className="text-[10px] font-semibold text-zinc-500 uppercase">(OPPONENT)</span>
                </div>
                {!matchItem.isWinner && !matchItem.isDraw && (
                  <span className="text-[9px] font-bold uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    WINNER
                  </span>
                )}
              </div>

              <div className="grid grid-cols-2 gap-2 text-xs">
                <div className="bg-white p-2 rounded-lg border border-zinc-200 space-y-0.5 shadow-sm">
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">Solve Time</span>
                  <p className="text-base font-bold font-mono text-orange-600">
                    {formatTimeStr(matchItem.opponentTimeMs, matchItem.opponentIsDnf)}
                  </p>
                </div>

                <div className="bg-white p-2 rounded-lg border border-zinc-200 space-y-0.5 shadow-sm">
                  <span className="text-[9px] font-semibold text-zinc-500 uppercase tracking-wider">ELO Rating</span>
                  <p className="text-sm font-bold font-mono text-zinc-800">
                    {matchItem.opponentEloAfter ?? matchItem.opponentEloBefore ?? '1200'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Scramble Sequence Box */}
          {matchItem.scrambleSequence && (
            <div className="bg-zinc-50 border border-zinc-200 rounded-xl p-3 space-y-1">
              <span className="text-[10px] font-semibold uppercase tracking-wider text-zinc-500 flex items-center gap-1.5">
                <Hash className="h-3 w-3 text-orange-500" /> Official Scramble Sequence
              </span>
              <p className="text-xs font-mono font-medium text-amber-700 break-words bg-white p-2.5 rounded-lg border border-zinc-200 select-all shadow-sm">
                {matchItem.scrambleSequence}
              </p>
            </div>
          )}

          {/* Fraud Report Modal */}
          <FraudReportModal
            matchId={matchItem.matchId}
            isOpen={isReportModalOpen}
            onClose={() => setIsReportModalOpen(false)}
            onSuccess={() => {
              console.log('[MatchDetailModal] Fraud report submitted successfully!');
            }}
          />
        </div>
      </div>
    </div>
  );
}
