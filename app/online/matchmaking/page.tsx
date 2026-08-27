'use client';

import React, { useState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { useOnlineArenaSignalR } from '@/features/online-arena/hooks/useOnlineArenaSignalR';
import { findMatch, confirmMatch, cancelMatchmaking, getMyProfiles, getOnlineMatchAvailability, initProfile } from '@/features/online-arena/api/onlineArenaApi';
import type { MatchmakingStatusDto } from '@/features/online-arena/types';
import { Loader2, Swords, User, ShieldAlert, Award, Clock, CheckCircle2, RotateCcw, AlertTriangle } from 'lucide-react';

const DEFAULT_PUZZLE_TYPE_ID = 'f4ddb522-426f-4dd0-a98d-20f21b192470'; // 3x3x3 Rubik's Cube GUID

export default function MatchmakingPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [status, setStatus] = useState<MatchmakingStatusDto['status'] | 'CONFIRMING' | 'COOLDOWN' | 'UNAVAILABLE'>('IDLE');
  const [matchmakingInfo, setMatchmakingInfo] = useState<MatchmakingStatusDto | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [countdown, setCountdown] = useState<number>(60);
  const countdownIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isConfirmingApi, setIsConfirmingApi] = useState(false);
  const [hasConfirmed, setHasConfirmed] = useState(false);
  const hasConfirmedRef = useRef(false);
  const [myElo, setMyElo] = useState<number | null>(null);
  const [myDisplayName, setMyDisplayName] = useState<string>('');
  const [autoRequeuedNotice, setAutoRequeuedNotice] = useState<boolean>(false);

  useEffect(() => {
    hasConfirmedRef.current = hasConfirmed;
  }, [hasConfirmed]);

  const parseUtc = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
    return new Date(hasTimezone ? dateStr : `${dateStr}Z`).getTime();
  };

  const startQueueRef = useRef<(() => void) | undefined>(undefined);

  // Fetch current user ELO rating
  useEffect(() => {
    let active = true;
    const fetchOrInit = async () => {
      try {
        const profiles = await getMyProfiles();
        if (active) {
          if (!profiles || profiles.length === 0) {
            const newProfile = await initProfile(DEFAULT_PUZZLE_TYPE_ID);
            setMyElo(newProfile.elo);
            setMyDisplayName(newProfile.displayName || '');
          } else {
            setMyElo(profiles[0].elo);
            setMyDisplayName(profiles[0].displayName || '');
          }
        }
      } catch (err) {
        console.error('Failed to fetch/initialize ELO rating:', err);
      }
    };
    fetchOrInit();
    return () => {
      active = false;
    };
  }, []);


  // Setup SignalR callbacks
  const { isConnected, error: signalRError } = useOnlineArenaSignalR(undefined, {
    onMatchmakingQueued: (payload) => {
      console.log('SignalR: Matchmaking Queued', payload);
      setStatus('QUEUED');
      setErrorMsg(null);
    },
    onMatchFound: (payload) => {
      console.log('SignalR: Match Found', payload);
      setMatchmakingInfo(payload);
      setStatus('MATCH_FOUND');
      setHasConfirmed(false);
      setAutoRequeuedNotice(false);
      
      // Calculate remaining countdown
      if (payload.confirmDeadlineAt) {
        const deadline = parseUtc(payload.confirmDeadlineAt);
        const serverNow = payload.serverNow ? parseUtc(payload.serverNow) : Date.now();
        const diff = Math.max(0, Math.floor((deadline - serverNow) / 1000));
        setCountdown(diff);
      } else {
        setCountdown(60);
      }
    },
    onMatchConfirmationUpdated: (payload) => {
      console.log('SignalR: Match Confirmation Updated', payload);
      setMatchmakingInfo(prev => prev ? {
        ...prev,
        player1Confirmed: payload.player1Confirmed,
        player2Confirmed: payload.player2Confirmed,
        opponent: prev.opponent || (payload as any).opponent,
      } : null);
      if (payload.confirmDeadlineAt) {
        const deadline = parseUtc(payload.confirmDeadlineAt);
        const serverNow = payload.serverNow ? parseUtc(payload.serverNow) : Date.now();
        const diff = Math.max(0, Math.floor((deadline - serverNow) / 1000));
        setCountdown(diff);
      }
    },
    onMatchConfirmed: (payload) => {
      console.log('SignalR: Match Confirmed!', payload);
      setStatus('MATCHED');
      router.push(`/online/match/${payload.matchId}`);
    },
    onMatchConfirmationExpired: (payload) => {
      console.log('SignalR: Match Confirmation Expired', payload);
      if (hasConfirmedRef.current) {
        console.log('Opponent failed to accept. Auto-requeuing innocent player...');
        setHasConfirmed(false);
        setMatchmakingInfo(null);
        setErrorMsg(null);
        setAutoRequeuedNotice(true);
        startQueueRef.current?.();
      } else {
        const serverNow = payload.serverNow ? parseUtc(payload.serverNow) : Date.now();
        let myCooldownUntil: string | null = null;
        
        if (matchmakingInfo?.meUserId && payload.player1UserId && payload.player2UserId) {
          myCooldownUntil = matchmakingInfo.meUserId === payload.player1UserId
            ? payload.player1CooldownUntil
            : payload.player2CooldownUntil;
        } else {
          myCooldownUntil = payload.cooldownUntil || payload.player1CooldownUntil || payload.player2CooldownUntil || null;
        }

        if (myCooldownUntil) {
          const until = parseUtc(myCooldownUntil);
          const diff = Math.max(0, Math.floor((until - serverNow) / 1000));
          if (diff > 0) {
            setStatus('COOLDOWN');
            setMatchmakingInfo(prev => ({
              ...(prev || { status: 'COOLDOWN' }),
              status: 'COOLDOWN',
              remainingSeconds: diff,
            }));
            setErrorMsg('You failed to confirm the match within 60 seconds and have been placed on temporary cooldown.');
            return;
          }
        }

        // If cooldown already expired or diff is 0, return to IDLE so user can re-queue directly
        setStatus('IDLE');
        setMatchmakingInfo(null);
        setErrorMsg('Match confirmation timed out. Please find a match again.');
      }
    },
    onMatchConfirmationCancelled: (payload) => {
      console.log('SignalR: Match Confirmation Cancelled', payload);
      if (hasConfirmedRef.current) {
        setHasConfirmed(false);
        setMatchmakingInfo(null);
        setErrorMsg(null);
        setAutoRequeuedNotice(true);
        startQueueRef.current?.();
      } else {
        setStatus('IDLE');
        setErrorMsg(payload.message || 'Match confirmation was cancelled.');
      }
    },
    onMatchmakingCooldownApplied: (payload) => {
      console.log('SignalR: Matchmaking Cooldown Applied', payload);
      setStatus('COOLDOWN');
      if (payload.cooldownUntil) {
        const until = parseUtc(payload.cooldownUntil);
        const serverNow = payload.serverNow ? parseUtc(payload.serverNow) : Date.now();
        const diff = Math.max(0, Math.floor((until - serverNow) / 1000));
        setMatchmakingInfo(prev => ({
          ...(prev || { status: 'COOLDOWN' }),
          status: 'COOLDOWN',
          remainingSeconds: diff,
        }));
      }
    },
  });

  const startQueue = async () => {
    try {
      setErrorMsg(null);
      setHasConfirmed(false);
      setMatchmakingInfo(null);
      const availability = await getOnlineMatchAvailability(DEFAULT_PUZZLE_TYPE_ID);
      if (!availability.isAvailable) {
        setStatus('UNAVAILABLE');
        setErrorMsg(availability.message || 'Online matches are temporarily unavailable.');
        return;
      }
      setStatus('QUEUED');
      const res = await findMatch(DEFAULT_PUZZLE_TYPE_ID);
      setMatchmakingInfo(res);
      if (res.status) {
        setStatus(res.status);
        if (res.status === 'MATCH_CONFIRMING') {
          setHasConfirmed(true);
        }
        if ((res.status === 'MATCHED' || res.status === 'IN_ACTIVE_MATCH') && res.matchId) {
          router.push(`/online/match/${res.matchId}`);
          return;
        }
        if ((res.status === 'MATCH_FOUND' || res.status === 'MATCH_CONFIRMING') && res.confirmDeadlineAt) {
          const deadline = parseUtc(res.confirmDeadlineAt);
          const serverNow = res.serverNow ? parseUtc(res.serverNow) : Date.now();
          const diff = Math.max(0, Math.floor((deadline - serverNow) / 1000));
          setCountdown(diff);
        }
      }
    } catch (err: any) {
      console.error(err);
      const message = err.message || 'Failed to start matchmaking queue.';
      setStatus(message.toLowerCase().includes('temporarily unavailable') ? 'UNAVAILABLE' : 'IDLE');
      setErrorMsg(message);
    }
  };

  useEffect(() => {
    startQueueRef.current = startQueue;
  });

  // Start finding match on mount
  useEffect(() => {
    let active = true;
    if (isConnected) {
      startQueue();
    }
    return () => {
      active = false;
    };
  }, [isConnected]);

  // Handle confirmation countdown timer
  useEffect(() => {
    if (status === 'MATCH_FOUND' || status === 'MATCH_CONFIRMING') {
      countdownIntervalRef.current = setInterval(() => {
        setCountdown(prev => {
          if (prev <= 1) {
            clearInterval(countdownIntervalRef.current!);
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }

    return () => {
      if (countdownIntervalRef.current) {
        clearInterval(countdownIntervalRef.current);
      }
    };
  }, [status]);

  // Handle live cooldown countdown timer
  useEffect(() => {
    if (status === 'COOLDOWN') {
      const interval = setInterval(() => {
        setMatchmakingInfo(prev => {
          if (!prev || prev.remainingSeconds === undefined) return prev;
          const nextRemaining = Math.max(0, prev.remainingSeconds - 1);
          return { ...prev, remainingSeconds: nextRemaining };
        });
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [status]);

  // Cancel matchmaking
  const handleCancelQueue = async () => {
    try {
      await cancelMatchmaking(DEFAULT_PUZZLE_TYPE_ID);
      router.push('/online');
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to cancel queue.');
    }
  };

  // Confirm match
  const handleConfirm = async () => {
    if (!matchmakingInfo?.confirmationId || isConfirmingApi) return;
    setIsConfirmingApi(true);
    try {
      await confirmMatch(matchmakingInfo.confirmationId);
      setHasConfirmed(true);
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || 'Failed to confirm match.');
    } finally {
      setIsConfirmingApi(false);
    }
  };

  return (
    <div className="min-h-screen bg-background text-foreground relative flex flex-col overflow-hidden">
      <Header />

      <main className="flex-1 flex flex-col justify-center items-center pb-12 relative z-10">
        {/* Cyber Grid background */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,oklch(0.5_0.15_40_/_0.06),transparent_70%)] pointer-events-none" />
        <div className="absolute inset-0 opacity-5 bg-[linear-gradient(to_right,#808080_1px,transparent_1px),linear-gradient(to_bottom,#808080_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

        <div className="max-w-md w-full px-6 relative z-10 text-center">
        {status === 'IDLE' && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-wider">CONNECTING TO ARENA</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Establishing real-time connection with matchmaking server...
            </p>
          </div>
        )}

        {status === 'UNAVAILABLE' && (
          <div className="mx-auto max-w-md space-y-5 rounded-3xl border border-amber-500/30 bg-card/70 p-8 text-center shadow-md">
            <AlertTriangle className="mx-auto h-12 w-12 text-amber-500" />
            <h2 className="text-xl font-black uppercase tracking-wider text-foreground">Arena temporarily unavailable</h2>
            <p className="text-xs leading-relaxed text-muted-foreground">
              {errorMsg || 'Online matches are temporarily unavailable because the 3x3x3 scramble pool is empty.'}
            </p>
            <button
              onClick={() => void startQueue()}
              className="inline-flex items-center gap-2 rounded-xl bg-orange-500 px-6 py-3 text-xs font-extrabold uppercase tracking-widest text-white transition hover:bg-orange-600"
            >
              <RotateCcw className="h-4 w-4" /> Check again
            </button>
          </div>
        )}

        {(status === 'IN_ACTIVE_MATCH' || status === 'MATCHED') && (
          <div className="space-y-4 animate-fade-in">
            <div className="relative h-20 w-20 mx-auto flex items-center justify-center">
              <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
            </div>
            <h2 className="text-lg font-black text-foreground uppercase tracking-wider">RESUMING MATCH SESSION</h2>
            <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
              Redirecting you to the active duel arena...
            </p>
          </div>
        )}

        {status === 'QUEUED' && (
          <div className="space-y-8 animate-fade-in">
            {/* Animated Radar Scanning Effect */}
            <div className="relative h-48 w-48 mx-auto flex items-center justify-center">
              <div className="absolute inset-0 rounded-full border border-orange-500/20 animate-ping duration-1000" />
              <div className="absolute inset-4 rounded-full border border-orange-500/30 animate-pulse duration-1000" />
              <div className="absolute inset-8 rounded-full border border-orange-500/40" />
              <div className="h-20 w-20 rounded-2xl bg-orange-500/10 border border-orange-500/30 flex items-center justify-center text-orange-500 shadow-xl shadow-orange-500/5 animate-pulse">
                <Swords className="h-10 w-10 animate-bounce" />
              </div>
            </div>

            <div className="space-y-3">
              <h2 className="text-2xl font-black text-foreground uppercase tracking-wider">FINDING OPPONENT</h2>
              {autoRequeuedNotice && (
                <div className="bg-amber-500/10 border border-amber-500/20 text-amber-600 p-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 max-w-sm mx-auto animate-fade-in">
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-amber-500" />
                  <span>Previous opponent did not confirm. Searching for a new opponent...</span>
                </div>
              )}
              {myElo !== null && (
                <div className="flex items-center justify-center gap-1.5 text-[10px] font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-3.5 py-1.5 rounded-full w-fit mx-auto animate-pulse">
                  <Award className="h-4 w-4 text-orange-500" />
                  <span>YOUR RATING: {myElo.toLocaleString()} ELO</span>
                </div>
              )}
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                Matching with cubers near your skill rating. Ready your Stackmat and camera setup.
              </p>
            </div>

            <button
              onClick={handleCancelQueue}
              className="px-8 py-3 bg-card hover:bg-muted text-muted-foreground hover:text-foreground font-extrabold text-xs rounded-xl border border-border transition-all uppercase tracking-widest cursor-pointer"
            >
              Cancel Matchmaking
            </button>
          </div>
        )}

        {status === 'MATCH_FOUND' && matchmakingInfo && (() => {
          const isMePlayer1 = matchmakingInfo.isPlayer1;

          // My Card (Left Card): Confirmed ONLY if local user has confirmed
          const isMySlotConfirmed = Boolean(
            hasConfirmed ||
            (isMePlayer1 !== undefined
              ? (isMePlayer1 ? matchmakingInfo.player1Confirmed : matchmakingInfo.player2Confirmed)
              : false)
          );

          // Opponent Card (Right Card): Confirmed ONLY if opponent has confirmed
          const isOpponentConfirmed = Boolean(
            isMePlayer1 !== undefined
              ? (isMePlayer1 ? matchmakingInfo.player2Confirmed : matchmakingInfo.player1Confirmed)
              : (hasConfirmed
                  ? (matchmakingInfo.player1Confirmed && matchmakingInfo.player2Confirmed)
                  : (matchmakingInfo.player1Confirmed || matchmakingInfo.player2Confirmed))
          );

          return (
            <div className="bg-card/60 border border-border p-6 sm:p-8 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-xl animate-fade-in text-center space-y-6">
              <div className="absolute inset-0 bg-gradient-to-b from-orange-500/5 via-transparent to-transparent pointer-events-none" />
              
              {/* Opponent Confirmation Overlay */}
              <div className="space-y-2">
                <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
                  Match Found
                </span>
                <h2 className="text-xl font-black text-foreground uppercase tracking-wider">PREPARE DUEL</h2>
              </div>

              {/* VS Card Layout */}
              <div className="flex justify-between items-center bg-background/80 border border-border/80 rounded-2xl p-6 relative overflow-hidden shadow-inner">
                {/* Background gradient hints */}
                <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-orange-500/5 pointer-events-none" />

                {/* Player 1 (Me) */}
                <div className="flex-1 flex flex-col items-center text-center space-y-2.5 relative">
                  <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-md">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-foreground uppercase tracking-wider truncate max-w-[120px]">
                      {myDisplayName || user?.displayName || 'User'}
                    </span>
                    <span className="inline-block text-[10px] font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full mt-1.5">
                      {myElo !== null ? `${myElo.toLocaleString()} ELO` : '1,500 ELO'}
                    </span>
                  </div>
                  {isMySlotConfirmed && (
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1 animate-pulse">
                      <CheckCircle2 className="h-3.5 w-3.5" /> CONFIRMED
                    </div>
                  )}
                </div>

                {/* VS Divider */}
                <div className="px-4 shrink-0 flex flex-col items-center justify-center relative">
                  <div className="h-10 w-10 rounded-full bg-orange-500/15 border border-orange-500/30 flex items-center justify-center text-xs font-black text-orange-500 shadow-lg shadow-orange-500/10">
                    VS
                  </div>
                </div>

                {/* Player 2 (Opponent) */}
                <div className="flex-1 flex flex-col items-center text-center space-y-2.5 relative">
                  <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500 shadow-md">
                    <User className="h-6 w-6" />
                  </div>
                  <div>
                    <span className="block text-xs font-black text-foreground uppercase tracking-wider truncate max-w-[120px]">
                      {matchmakingInfo.opponent?.displayName || 'Opponent'}
                    </span>
                    <span className="inline-block text-[10px] font-black text-orange-600 bg-orange-500/10 border border-orange-500/20 px-2.5 py-0.5 rounded-full mt-1.5">
                      {matchmakingInfo.opponent?.rating != null
                        ? `${Number(matchmakingInfo.opponent.rating).toLocaleString()} ELO`
                        : '— ELO'}
                    </span>
                  </div>
                  {/* Hiển thị CONFIRMED nếu đối thủ đã bấm chấp nhận */}
                  {isOpponentConfirmed && (
                    <div className="flex items-center gap-1 text-[10px] font-extrabold text-emerald-500 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-md mt-1 animate-pulse">
                      <CheckCircle2 className="h-3.5 w-3.5" /> CONFIRMED
                    </div>
                  )}
                </div>

              </div>

              {/* Countdown bar */}
              <div className="bg-background/60 border border-border/80 p-4 rounded-xl flex items-center justify-between">
                <div className="flex items-center gap-2 text-muted-foreground text-xs">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Confirmation deadline</span>
                </div>
                <span className="text-lg font-black font-mono text-orange-500">
                  {countdown}s
                </span>
              </div>

              {/* Confirm Actions */}
              <button
                onClick={handleConfirm}
                disabled={hasConfirmed || isConfirmingApi}
                className={`w-full font-black text-xs py-4 px-6 rounded-xl transition-all uppercase tracking-widest cursor-pointer ${
                  hasConfirmed
                    ? 'bg-emerald-500/10 text-emerald-600 border border-emerald-500/25'
                    : 'bg-orange-500 hover:bg-orange-600 text-white shadow-xl shadow-orange-500/25'
                }`}
              >
                {isConfirmingApi ? (
                  <span className="flex items-center justify-center gap-2">
                    <Loader2 className="h-4 w-4 animate-spin" /> Confirming...
                  </span>
                ) : hasConfirmed ? (
                  'WAITING FOR OPPONENT'
                ) : (
                  'ACCEPT DUEL'
                )}
              </button>
            </div>
          );
        })()}

        {status === 'COOLDOWN' && (
          <div className="bg-card/60 border border-border p-8 rounded-3xl backdrop-blur-md relative overflow-hidden shadow-md animate-fade-in text-center space-y-6">
            <div className="absolute inset-0 bg-gradient-to-b from-rose-500/5 via-transparent to-transparent pointer-events-none" />
            <div className="h-16 w-16 rounded-2xl bg-rose-500/10 border border-rose-500/20 flex items-center justify-center mx-auto text-rose-500">
              <Clock className="h-8 w-8 animate-pulse" />
            </div>
            <div className="space-y-2">
              <h2 className="text-xl font-black text-foreground uppercase tracking-wider">Queue Cooldown</h2>
              <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                You have been temporarily suspended from the matchmaking queue for failing to confirm a match.
              </p>
            </div>
            {matchmakingInfo?.remainingSeconds !== undefined && matchmakingInfo.remainingSeconds > 0 ? (
              <div className="bg-background/60 border border-border/80 p-4 rounded-xl flex items-center justify-between">
                <span className="text-muted-foreground text-xs">Remaining Cooldown</span>
                <span className="text-lg font-black font-mono text-rose-500">
                  {matchmakingInfo.remainingSeconds}s
                </span>
              </div>
            ) : (
              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-xl text-xs font-bold text-emerald-500">
                Cooldown period ended! You can search for a match again.
              </div>
            )}
            <div className="space-y-2">
              {(matchmakingInfo?.remainingSeconds === 0 || matchmakingInfo?.remainingSeconds === undefined) && (
                <button
                  onClick={startQueue}
                  className="w-full bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs py-3.5 px-4 rounded-xl shadow-lg transition-all uppercase tracking-widest cursor-pointer"
                >
                  Find Match Again
                </button>
              )}
              <button
                onClick={() => router.push('/online')}
                className="w-full bg-card hover:bg-muted text-muted-foreground hover:text-foreground text-xs font-bold py-3.5 px-4 rounded-xl border border-border transition-all uppercase tracking-widest cursor-pointer"
              >
                Return to Lobby
              </button>
            </div>
          </div>
        )}

        {/* Global Errors or Requeuing */}
        {status !== 'COOLDOWN' && (errorMsg || signalRError) && (
          <div className="bg-rose-500/10 border border-rose-500/25 p-4 rounded-2xl flex items-start gap-3 mt-6 text-left animate-fade-in">
            <AlertTriangle className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
            <div className="space-y-1.5 flex-1">
              <h4 className="text-xs font-bold text-rose-500 uppercase tracking-wide">Error encountered</h4>
              <p className="text-[11px] text-muted-foreground leading-normal">{errorMsg || signalRError}</p>
              <button
                onClick={() => {
                  setErrorMsg(null);
                  setStatus('QUEUED');
                  router.refresh();
                }}
                className="text-[10px] font-bold text-orange-500 hover:text-orange-600 flex items-center gap-1 mt-1 bg-transparent border-none p-0 cursor-pointer"
              >
                <RotateCcw className="h-3 w-3" /> RETRY QUEUE
              </button>
            </div>
          </div>
        )}
        </div>
      </main>
    </div>
  );
}
