'use client';

import React, { useMemo, useState, useEffect, useRef } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { useMatchLocalRecorder } from '@/features/online-arena/hooks/useMatchLocalRecorder';
import { MatchUploadQueueManager, MatchUploadTask } from '@/features/online-arena/services/MatchUploadQueueManager';
import { parseJwt, getAccessToken } from '@/lib/api/config';
import { useRouter } from 'next/navigation';
import { Trophy, Swords, ShieldCheck, TrendingUp, TrendingDown, ArrowRight, Home, Loader2, CheckCircle2, AlertCircle } from 'lucide-react';

export default function ResultPage() {
  const { matchId, state } = useMatchContext();
  const { stopRecordingWithBuffer } = useMatchLocalRecorder();
  const router = useRouter();

  useEffect(() => {
    if (!state || !['COMPLETED', 'CANCELLED', 'DRAW', 'NEEDS_REVIEW'].includes(state.statusCode)) return;

    void stopRecordingWithBuffer(1000);
  }, [state?.statusCode, stopRecordingWithBuffer]);

  const [uploadTask, setUploadTask] = useState<MatchUploadTask | undefined>(() =>
    matchId ? MatchUploadQueueManager.getTaskStatus(matchId) : undefined
  );

  useEffect(() => {
    if (!matchId) return;
    const unsubscribe = MatchUploadQueueManager.subscribe((task) => {
      if (task.matchId === matchId) {
        setUploadTask({ ...task });
      }
    });
    return unsubscribe;
  }, [matchId]);

  const userId = useMemo(() => {
    const token = getAccessToken();
    if (!token) return '';
    const decoded = parseJwt(token);
    return (decoded?.sub as string) || (decoded?.nameid as string) || '';
  }, []);

  const { mePlayer, opponentPlayer, eloBefore, eloAfter, oppEloBefore, oppEloAfter } = useMemo(() => {
    if (!state) return { mePlayer: null, opponentPlayer: null };
    const isP1 = state.player1.userId === userId;
    return {
      mePlayer: isP1 ? state.player1 : state.player2,
      opponentPlayer: isP1 ? state.player2 : state.player1,
      eloBefore: isP1 ? state.player1EloBefore : state.player2EloBefore,
      eloAfter: isP1 ? state.player1EloAfter : state.player2EloAfter,
      oppEloBefore: isP1 ? state.player2EloBefore : state.player1EloBefore,
      oppEloAfter: isP1 ? state.player2EloAfter : state.player1EloAfter,
    };
  }, [state, userId]);

  if (!state || !mePlayer || !opponentPlayer) return null;

  const isWinner = state.winnerId === userId;
  const isDraw = state.outcome === 'DRAW' || !state.winnerId;

  // Format times helper
  const formatTime = (status: string, ms: number | null) => {
    if (status === 'DNF') return 'DNF';
    if (ms === null) return '—';
    const seconds = Math.floor(ms / 1000);
    const centiseconds = Math.floor((ms % 1000) / 10);
    return `${seconds}.${centiseconds.toString().padStart(2, '0')}s`;
  };

  // ELO delta calculation
  const eloDelta = eloAfter !== undefined && eloBefore !== undefined && eloAfter !== null && eloBefore !== null
    ? eloAfter - eloBefore
    : null;

  const hasRecordingStarted = Boolean(
    (state?.player1?.recordingStarted || state?.player2?.recordingStarted) &&
    state?.cancelReason !== 'SETUP_TIMEOUT' &&
    state?.cancelReason !== 'READY_TIMEOUT'
  );

  return (
    <div className="space-y-6 animate-in fade-in duration-200 max-w-xl mx-auto w-full text-center">
      {/* Victory/Defeat Banner */}
      <div className="space-y-2">
        {isDraw ? (
          <div className="space-y-1">
            <span className="bg-muted text-muted-foreground text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-md uppercase border border-border inline-block">
              Draw Match
            </span>
            <h2 className="text-3xl font-black text-foreground uppercase tracking-wider">DRAW GAME</h2>
          </div>
        ) : isWinner ? (
          <div className="space-y-1">
            <span className="bg-amber-500/10 border border-amber-500/20 text-amber-500 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-md uppercase inline-block">
              Victory
            </span>
            <h2 className="text-3xl font-black text-amber-500 uppercase tracking-wider">
              VICTORY
            </h2>
          </div>
        ) : (
          <div className="space-y-1">
            <span className="bg-rose-500/10 border border-rose-500/20 text-rose-500 text-[10px] font-bold tracking-wider px-2.5 py-0.5 rounded-md uppercase inline-block">
              Defeat
            </span>
            <h2 className="text-3xl font-black text-rose-500 uppercase tracking-wider">DEFEAT</h2>
          </div>
        )}
      </div>

      {/* Main Results card */}
      <div className="bg-card border border-border p-6 sm:p-7 rounded-2xl backdrop-blur-md shadow-md space-y-6 relative overflow-hidden text-left">
        <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />

        {/* ELO Changes display */}
        {eloDelta !== null && eloAfter !== null && (
          <div className="bg-background/60 border border-border p-6 rounded-2xl flex flex-col items-center justify-center space-y-2 relative">
            <span className="text-[9px] text-muted-foreground font-black tracking-widest uppercase">ELO Rating Impact</span>
            <div className="flex items-center gap-2">
              <span className="text-3xl font-black tracking-tight text-foreground">{eloAfter}</span>
              <span className={`flex items-center gap-0.5 text-sm font-extrabold px-2.5 py-0.5 rounded-full ${eloDelta >= 0
                  ? 'text-emerald-600 bg-emerald-500/10'
                  : 'text-rose-600 bg-rose-500/10'
                }`}>
                {eloDelta >= 0 ? <TrendingUp className="h-4 w-4" /> : <TrendingDown className="h-4 w-4" />}
                {eloDelta >= 0 ? `+${eloDelta}` : eloDelta} ELO
              </span>
            </div>
          </div>
        )}

        {/* Duels Comparison Table */}
        <div className="grid grid-cols-2 gap-4">
          {/* You card */}
          <div className={`p-5 rounded-2xl border text-left space-y-3 ${isWinner && !isDraw ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background/60 border-border'
            }`}>
            <span className="text-[9px] text-muted-foreground font-black tracking-wider uppercase block">You</span>
            <div className="space-y-1">
              <span className="block text-2xl font-black font-mono text-foreground">
                {formatTime(mePlayer.resultStatus, mePlayer.timeMs)}
              </span>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${mePlayer.resultStatus === 'DNF'
                  ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                  : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                {mePlayer.resultStatus === 'DNF' ? 'DNF' : 'VALID'}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold border-t border-border pt-2 flex justify-between">
              <span>Finish Check:</span>
              <span className={mePlayer.finishCheckStatus === 'PASSED' || mePlayer.finishCheckStatus === 'NOT_REQUIRED' ? 'text-emerald-500' : 'text-rose-500'}>
                {mePlayer.finishCheckStatus}
              </span>
            </div>
          </div>

          {/* Opponent card */}
          <div className={`p-5 rounded-2xl border text-left space-y-3 ${!isWinner && !isDraw ? 'bg-amber-500/5 border-amber-500/20' : 'bg-background/60 border-border'
            }`}>
            <span className="text-[9px] text-muted-foreground font-black tracking-wider uppercase block">
              {opponentPlayer.displayName || opponentPlayer.username || (opponentPlayer.userId ? `Player_${opponentPlayer.userId.slice(0, 6)}` : 'Opponent')}
            </span>
            <div className="space-y-1">
              <span className="block text-2xl font-black font-mono text-foreground">
                {formatTime(opponentPlayer.resultStatus, opponentPlayer.timeMs)}
              </span>
              <span className={`inline-block text-[9px] font-bold px-2 py-0.5 rounded-full border ${opponentPlayer.resultStatus === 'DNF'
                  ? 'text-rose-500 bg-rose-500/10 border-rose-500/20'
                  : 'text-emerald-500 bg-emerald-500/10 border-emerald-500/20'
                }`}>
                {opponentPlayer.resultStatus === 'DNF' ? 'DNF' : 'VALID'}
              </span>
            </div>
            <div className="text-[10px] text-muted-foreground font-semibold border-t border-border pt-2 flex justify-between">
              <span>Finish Check:</span>
              <span className={opponentPlayer.finishCheckStatus === 'PASSED' || opponentPlayer.finishCheckStatus === 'NOT_REQUIRED' ? 'text-emerald-500' : 'text-rose-500'}>
                {opponentPlayer.finishCheckStatus}
              </span>
            </div>
          </div>
        </div>

        {/* Video Recording Background Upload Status */}
        {hasRecordingStarted ? (
          <div className="bg-background border border-border p-4 rounded-2xl flex items-center justify-between text-left">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <ShieldCheck className="h-4 w-4" />
              </div>
              <div>
                <p className="text-xs font-black text-foreground uppercase tracking-wider">Match Replay Integrity</p>
                <p className="text-[10px] text-muted-foreground">
                  {uploadTask?.status === 'completed'
                    ? 'Local camera video saved and verified on server.'
                    : uploadTask?.status === 'uploading' || uploadTask?.status === 'finalizing'
                      ? `Uploading footage to Cloud storage... (${uploadTask.progress}%)`
                      : uploadTask?.status === 'failed'
                        ? 'Video upload encountered an error.'
                        : 'Camera footage buffered and uploading in background.'}
                </p>
              </div>
            </div>

            <div>
              {uploadTask?.status === 'completed' ? (
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 uppercase flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Upload Complete
                </span>
              ) : uploadTask?.status === 'uploading' || uploadTask?.status === 'finalizing' ? (
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-orange-500/10 border border-orange-500/20 text-orange-500 uppercase flex items-center gap-1">
                  <Loader2 className="h-3 w-3 animate-spin" /> {uploadTask.progress}%
                </span>
              ) : uploadTask?.status === 'failed' ? (
                <button
                  onClick={() => matchId && MatchUploadQueueManager.retry(matchId)}
                  className="text-[10px] font-bold px-3 py-1 rounded-full bg-rose-500/10 border border-rose-500/20 text-rose-500 hover:bg-rose-500/20 uppercase transition-all flex items-center gap-1 cursor-pointer"
                >
                  <AlertCircle className="h-3 w-3" /> Retry Upload
                </button>
              ) : (
                <span className="text-[10px] font-mono font-bold px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-500 uppercase">
                  ✓ Upload Enqueued
                </span>
              )}
            </div>
          </div>
        ) : (
          <div className="bg-background border border-border p-4 rounded-2xl flex items-center gap-3 text-left">
            <div className="h-8 w-8 rounded-xl bg-muted border border-border flex items-center justify-center text-muted-foreground shrink-0">
              <AlertCircle className="h-4 w-4 text-muted-foreground" />
            </div>
            <div>
              <p className="text-xs font-black text-foreground uppercase tracking-wider">Recording Not Started</p>
              <p className="text-[10px] text-muted-foreground">
                Match ended before setup phase was completed. Camera recording starts only after setup is complete.
              </p>
            </div>
          </div>
        )}

        {/* Watch Replay Button & Player Integration */}
        <ReplaySection matchId={matchId} state={state} uploadTask={uploadTask} viewerUserId={userId} />
      </div>

      {/* Play Again actions */}
      <div className="flex flex-col sm:flex-row gap-4 max-w-sm mx-auto">
        <button
          onClick={() => router.push('/online/matchmaking')}
          className="flex-1 flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-4 px-6 rounded-2xl shadow-xl shadow-orange-500/15 transition-all uppercase tracking-widest cursor-pointer border-none"
        >
          <Swords className="h-4.5 w-4.5" /> Duel Again
        </button>
        <button
          onClick={() => router.push('/online')}
          className="flex-1 flex items-center justify-center gap-2 bg-card hover:bg-muted border border-border text-muted-foreground hover:text-foreground font-extrabold text-xs py-4 px-6 rounded-2xl transition-all uppercase tracking-widest cursor-pointer"
        >
          <Home className="h-4.5 w-4.5" /> Return Lobby
        </button>
      </div>
    </div>
  );
}

import { SplitScreenReplayPlayer } from '@/features/online-arena/components/SplitScreenReplayPlayer';
import { FraudReportModal } from '@/features/online-arena/components/FraudReportModal';
import { getMatchRecordingPlaybackUrls, PlaybackResponseDto } from '@/features/online-arena/api/onlineArenaApi';
import { Video, ShieldAlert } from 'lucide-react';

function ReplaySection({
  matchId,
  state,
  uploadTask,
  viewerUserId,
}: {
  matchId: string;
  state: any;
  uploadTask?: MatchUploadTask;
  viewerUserId?: string;
}) {
  const hasRecordingStarted = Boolean(
    (state?.player1?.recordingStarted || state?.player2?.recordingStarted) &&
    state?.cancelReason !== 'SETUP_TIMEOUT' &&
    state?.cancelReason !== 'READY_TIMEOUT'
  );

  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [playbackData, setPlaybackData] = useState<PlaybackResponseDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isReportModalOpen, setIsReportModalOpen] = useState(false);
  const uploadTaskRef = useRef(uploadTask);

  useEffect(() => {
    uploadTaskRef.current = uploadTask;
  }, [uploadTask]);

  if (!hasRecordingStarted) {
    return (
      <div className="space-y-3">
        <button
          disabled
          className="w-full py-3 px-4 bg-muted/50 border border-border text-muted-foreground font-black text-xs rounded-2xl uppercase tracking-wider flex items-center justify-center gap-2 cursor-not-allowed opacity-75"
        >
          <Video className="h-4 w-4 text-muted-foreground/60" />
          🎬 Replay Unavailable (Setup Incomplete)
        </button>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="w-full py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-black text-xs rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/5"
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" />  Report Fraud / Cheat
        </button>
        <FraudReportModal
          matchId={matchId}
          isOpen={isReportModalOpen}
          onClose={() => setIsReportModalOpen(false)}
        />
      </div>
    );
  }

  const fetchPlayback = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const maxAttempts = 20;
      let lastError: any;

      for (let attempt = 1; attempt <= maxAttempts; attempt += 1) {
        const currentUploadStatus = uploadTaskRef.current?.status;
        if (currentUploadStatus === 'idle'
          || currentUploadStatus === 'uploading'
          || currentUploadStatus === 'finalizing') {
          await new Promise((resolve) => setTimeout(resolve, 1500));
          continue;
        }

        try {
          const res = await getMatchRecordingPlaybackUrls(matchId);
          setPlaybackData(res);
          setIsOpen(true);
          return;
        } catch (err: any) {
          lastError = err;
          const isStillProcessing = String(err?.message || '')
            .toLowerCase()
            .includes('no ready recording');

          if (!isStillProcessing || attempt === maxAttempts) throw err;
          await new Promise((resolve) => setTimeout(resolve, 1500));
        }
      }

      throw lastError;
    } catch (err: any) {
      console.error(err);
      setError(err?.message || 'Replay video is still processing or not found yet.');
    } finally {
      setIsLoading(false);
    }
  };

  // Determine me vs opponent from viewer perspective
  const isViewerP1 = viewerUserId && state?.player1?.userId === viewerUserId;
  const meStateReplay = isViewerP1 ? state?.player1 : state?.player2;
  const oppStateReplay = isViewerP1 ? state?.player2 : state?.player1;

  const myRecord = playbackData?.recordings?.find((r: any) => r.playerId === meStateReplay?.userId);
  const oppRecord = playbackData?.recordings?.find((r: any) => r.playerId === oppStateReplay?.userId);

  const winnerUsername = state?.winnerId === state?.player1?.userId
    ? (state?.player1?.displayName || state?.player1?.username || (state?.player1?.userId ? `Player_${state?.player1?.userId?.slice(0, 6)}` : 'Player 1'))
    : state?.winnerId === state?.player2?.userId
      ? (state?.player2?.displayName || state?.player2?.username || (state?.player2?.userId ? `Player_${state?.player2?.userId?.slice(0, 6)}` : 'Player 2'))
      : undefined;

  return (
    <div className="space-y-4">
      <div className="flex flex-col sm:flex-row gap-3">
        <button
          onClick={fetchPlayback}
          disabled={isLoading}
          className="flex-1 py-3 px-4 bg-card hover:bg-muted border border-orange-500/20 hover:border-orange-500/50 text-orange-500 font-black text-xs rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-orange-500/5"
        >
          {isLoading ? (
            <Loader2 className="h-4 w-4 animate-spin text-orange-500" />
          ) : (
            <Video className="h-4 w-4 text-orange-500" />
          )}
          {isLoading ? 'Fetching Replay...' : ' Watch Replay'}
        </button>
        <button
          onClick={() => setIsReportModalOpen(true)}
          className="flex-1 py-3 px-4 bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-500 font-black text-xs rounded-2xl transition-all uppercase tracking-wider flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-rose-500/5"
        >
          <ShieldAlert className="h-4 w-4 text-rose-500" />  Report Fraud
        </button>
      </div>

      <FraudReportModal
        matchId={matchId}
        isOpen={isReportModalOpen}
        onClose={() => setIsReportModalOpen(false)}
      />

      {error && (
        <div className="p-3 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-xs font-semibold rounded-xl text-center">
          {error}
        </div>
      )}

      {isOpen && playbackData && (
        <div className="space-y-3 animate-fade-in pt-2">
          <SplitScreenReplayPlayer
            matchId={matchId}
            playerA={{
              username: meStateReplay?.displayName || meStateReplay?.username || (meStateReplay?.userId ? `Player_${meStateReplay?.userId?.slice(0, 6)}` : 'You'),
              videoUrl: myRecord?.playbackUrl || '',
              solveTimeSeconds: ((meStateReplay?.timeMs || 10000) / 1000),
              videoDurationSeconds: myRecord?.durationSeconds,
              isWinner: Boolean(state?.winnerId && state?.winnerId === meStateReplay?.userId),
            }}
            playerB={{
              username: oppStateReplay?.displayName || oppStateReplay?.username || (oppStateReplay?.userId ? `Player_${oppStateReplay?.userId?.slice(0, 6)}` : 'Opponent'),
              videoUrl: oppRecord?.playbackUrl || '',
              solveTimeSeconds: ((oppStateReplay?.timeMs || 10000) / 1000),
              videoDurationSeconds: oppRecord?.durationSeconds,
              isWinner: Boolean(state?.winnerId && state?.winnerId === oppStateReplay?.userId),
            }}
            officialWinnerName={winnerUsername}
            officialWinnerText={state?.outcome}
          />
        </div>
      )}
    </div>
  );
}

