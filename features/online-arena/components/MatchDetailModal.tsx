'use client';

import React, { useState, useEffect } from 'react';
import { X, Trophy, Video, ShieldCheck, Clock, Award, Hash, ArrowUpRight, ArrowDownRight, Loader2, Sparkles, ShieldAlert } from 'lucide-react';
import { SplitScreenReplayPlayer } from './SplitScreenReplayPlayer';
import { FraudReportModal } from './FraudReportModal';
import { getMatchRecordingPlaybackUrls, PlaybackResponseDto, OnlineMatchHistoryItemDto } from '../api/onlineArenaApi';

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

  useEffect(() => {
    if (!isOpen || !matchItem) {
      setPlaybackData(null);
      setVideoError(null);
      return;
    }

    // Auto-fetch video playback URLs when modal opens
    let isMounted = true;
    const fetchVideo = async () => {
      setIsLoadingVideo(true);
      setVideoError(null);
      try {
        const data = await getMatchRecordingPlaybackUrls(matchItem.matchId);
        if (isMounted) setPlaybackData(data);
      } catch (err: any) {
        if (isMounted) {
          console.warn('[ReplayModal] Could not fetch video replay:', err);
          setVideoError(err?.message || 'Video evidence is still processing or unavailable.');
        }
      } finally {
        if (isMounted) setIsLoadingVideo(false);
      }
    };

    fetchVideo();

    return () => {
      isMounted = false;
    };
  }, [isOpen, matchItem]);

  if (!isOpen || !matchItem) return null;

  const formatTimeStr = (ms?: number, isDnf?: boolean) => {
    if (isDnf) return 'DNF';
    if (!ms || ms <= 0) return 'N/A';
    return (ms / 1000).toFixed(2) + 's';
  };

  const p1Record = playbackData?.recordings?.find((r) => r.playerId === matchItem.meUserId);
  const p2Record = playbackData?.recordings?.find((r) => r.playerId === matchItem.opponentUserId);

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-4xl max-h-[90vh] overflow-y-auto shadow-2xl space-y-6 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer z-10"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header Broadcast Banner */}
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 pb-4 border-b border-zinc-800/80">
          <div className="space-y-1">
            <div className="flex items-center gap-2">
              <span className="px-2.5 py-0.5 text-[10px] font-black uppercase tracking-widest bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-full">
                {matchItem.modeName || 'Ranked 1v1'}
              </span>
              <span className="text-xs text-zinc-400 font-medium">
                {new Date(matchItem.createdAt).toLocaleString()}
              </span>
            </div>
            <h2 className="text-xl font-black tracking-tight text-white flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-amber-400" />
              MATCH DETAILS & REPLAY
            </h2>
          </div>

          {/* Outcome Badge */}
          <div className="flex items-center gap-3">
            <div
              className={`px-4 py-2 rounded-2xl border font-black text-sm uppercase tracking-wider flex items-center gap-2 ${
                matchItem.isWinner
                  ? 'bg-gradient-to-r from-emerald-500/20 via-teal-500/10 to-emerald-500/20 text-emerald-400 border-emerald-500/40 shadow-lg shadow-emerald-500/10'
                  : matchItem.isDraw
                  ? 'bg-zinc-900 text-zinc-300 border-zinc-700'
                  : 'bg-gradient-to-r from-rose-500/20 via-purple-500/10 to-rose-500/20 text-rose-400 border-rose-500/40'
              }`}
            >
              {matchItem.isWinner ? (
                <>
                  <Trophy className="h-4 w-4 text-amber-400" /> VICTORY
                </>
              ) : matchItem.isDraw ? (
                'DRAW'
              ) : (
                'DEFEAT'
              )}
            </div>

            {/* ELO Delta Tag */}
            <div
              className={`px-3 py-2 rounded-2xl border font-mono font-black text-sm flex items-center gap-1 ${
                matchItem.eloChange > 0
                  ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30'
                  : matchItem.eloChange < 0
                  ? 'bg-rose-500/10 text-rose-400 border-rose-500/30'
                  : 'bg-zinc-900 text-zinc-400 border-zinc-800'
              }`}
            >
              {matchItem.eloChange > 0 ? (
                <ArrowUpRight className="h-4 w-4" />
              ) : matchItem.eloChange < 0 ? (
                <ArrowDownRight className="h-4 w-4" />
              ) : null}
              {matchItem.eloChange > 0 ? `+${matchItem.eloChange}` : matchItem.eloChange} ELO
            </div>

            {/* Report Fraud Button */}
            <button
              onClick={() => setIsReportModalOpen(true)}
              className="px-3.5 py-2 rounded-2xl border border-rose-500/30 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 font-extrabold text-xs uppercase tracking-wider flex items-center gap-1.5 transition-all cursor-pointer"
            >
              <ShieldAlert className="h-4 w-4 text-rose-500" />
              Report Fraud
            </button>
          </div>
        </div>

        {/* Video Replay Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-1.5">
              <Video className="h-4 w-4 text-orange-400" /> Dual-Cam Video Replay
            </h3>
            {isLoadingVideo && (
              <span className="text-[11px] font-bold text-orange-400 flex items-center gap-1.5 animate-pulse">
                <Loader2 className="h-3.5 w-3.5 animate-spin" /> Fetching stream URLs...
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
              officialWinnerName={matchItem.isWinner ? matchItem.meUsername : matchItem.opponentUsername}
              officialWinnerText={matchItem.outcome}
            />
          ) : videoError ? (
            <div className="p-8 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-2 text-zinc-400">
              <ShieldCheck className="h-8 w-8 text-zinc-600 mx-auto" />
              <p className="text-xs font-semibold">{videoError}</p>
              <p className="text-[10px] text-zinc-500">
                {matchItem.isDraw || matchItem.outcome === 'CANCELLED'
                  ? 'No video recording was captured because the match ended before setup was completed.'
                  : 'Video evidence might still be processing or expired.'}
              </p>
            </div>
          ) : (
            <div className="p-12 bg-zinc-900/60 border border-zinc-800 rounded-2xl text-center space-y-3">
              <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
              <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Loading Match Replay Stream...</p>
            </div>
          )}
        </div>

        {/* Stats Comparison Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
          {/* Player (Me) Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-emerald-500" />
                <span className="text-sm font-black text-white">{matchItem.meUsername}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">(YOU)</span>
              </div>
              {matchItem.isWinner && (
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  WINNER
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/50 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Solve Time</span>
                <p className="text-lg font-black font-mono text-emerald-400">
                  {formatTimeStr(matchItem.meTimeMs, matchItem.meIsDnf)}
                </p>
              </div>

              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/50 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">ELO Rating</span>
                <p className="text-base font-black font-mono text-zinc-200">
                  {matchItem.meEloAfter ?? matchItem.meEloBefore ?? '1200'}
                  {matchItem.eloChange !== 0 && (
                    <span className={`text-xs ml-1 font-bold ${matchItem.eloChange > 0 ? 'text-emerald-400' : 'text-rose-400'}`}>
                      ({matchItem.eloChange > 0 ? `+${matchItem.eloChange}` : matchItem.eloChange})
                    </span>
                  )}
                </p>
              </div>
            </div>
          </div>

          {/* Opponent Card */}
          <div className="bg-zinc-900/70 border border-zinc-800 rounded-2xl p-4 space-y-3">
            <div className="flex items-center justify-between border-b border-zinc-800/60 pb-2.5">
              <div className="flex items-center gap-2">
                <span className="h-2.5 w-2.5 rounded-full bg-orange-500" />
                <span className="text-sm font-black text-white">{matchItem.opponentUsername}</span>
                <span className="text-[10px] font-bold text-zinc-500 uppercase">(OPPONENT)</span>
              </div>
              {!matchItem.isWinner && !matchItem.isDraw && (
                <span className="text-[10px] font-black uppercase text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full border border-amber-500/20">
                  WINNER
                </span>
              )}
            </div>

            <div className="grid grid-cols-2 gap-2 text-xs">
              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/50 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Solve Time</span>
                <p className="text-lg font-black font-mono text-orange-400">
                  {formatTimeStr(matchItem.opponentTimeMs, matchItem.opponentIsDnf)}
                </p>
              </div>

              <div className="bg-zinc-950/60 p-2.5 rounded-xl border border-zinc-800/50 space-y-0.5">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">ELO Rating</span>
                <p className="text-base font-black font-mono text-zinc-200">
                  {matchItem.opponentEloAfter ?? matchItem.opponentEloBefore ?? '1200'}
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Scramble Sequence Box */}
        {matchItem.scrambleSequence && (
          <div className="bg-zinc-900/50 border border-zinc-800/80 rounded-2xl p-4 space-y-1.5">
            <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500 flex items-center gap-1.5">
              <Hash className="h-3.5 w-3.5 text-orange-500" /> Official Match Scramble Sequence
            </span>
            <p className="text-xs font-mono font-bold text-amber-300/90 break-words bg-zinc-950/80 p-3 rounded-xl border border-zinc-800 select-all">
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
  );
}
