'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { ShieldCheck, Trophy, History, Zap, Play, Swords, User } from 'lucide-react';
import { getMyProfiles, getOnlineMatchAvailability, initProfile } from '@/features/online-arena/api/onlineArenaApi';

const ONLINE_MATCH_PUZZLE_TYPE_ID = 'f4ddb522-426f-4dd0-a98d-20f21b192470';

export default function OnlineLobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [elo, setElo] = useState<number | null>(null);
  const [matchmakingAvailable, setMatchmakingAvailable] = useState<boolean | null>(null);
  const [availabilityMessage, setAvailabilityMessage] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    const fetchOrInitProfile = async () => {
      try {
        const profiles = await getMyProfiles();
        if (active) {
          if (!profiles || profiles.length === 0) {
            const newProfile = await initProfile(ONLINE_MATCH_PUZZLE_TYPE_ID);
            setElo(newProfile.elo);
          } else {
            setElo(profiles[0].elo);
          }
        }
      } catch (err) {
        console.error('Failed to fetch/initialize ELO rating:', err);
      }
    };
    fetchOrInitProfile();
    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    let active = true;
    const refreshAvailability = async () => {
      try {
        const result = await getOnlineMatchAvailability(ONLINE_MATCH_PUZZLE_TYPE_ID);
        if (!active) return;
        setMatchmakingAvailable(result.isAvailable);
        setAvailabilityMessage(result.message ?? null);
      } catch {
        if (!active) return;
        setMatchmakingAvailable(false);
        setAvailabilityMessage('Online matches are temporarily unavailable.');
      }
    };
    void refreshAvailability();
    const intervalId = window.setInterval(() => void refreshAvailability(), 30000);
    return () => {
      active = false;
      window.clearInterval(intervalId);
    };
  }, []);

  return (
    <main className="min-h-screen bg-background text-foreground relative pb-20">
      <Header />

      {/* Cyber Grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.5_0.15_40_/_0.03),transparent_50%)] pointer-events-none" />
      <div className="absolute top-20 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-border to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10 space-y-12">
        {/* Welcome Hero Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-card/60 border border-border/80 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-md">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase animate-pulse">
                Ranked Season 1
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase text-foreground">
              1V1 ONLINE ARENA
            </h1>
            <p className="text-muted-foreground text-xs sm:text-sm max-w-xl leading-relaxed">
              Match up with speedcubers worldwide. Verify scrambles and final solves using our real-time AI computer vision checker.
            </p>
          </div>

          {/* User profile card */}
          {user && (
            <div className="flex items-center gap-4 bg-background/60 border border-border/80 rounded-2xl p-4 shrink-0 w-full md:w-fit">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">{user.displayName}</h4>
                <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                  <Trophy className="h-3.5 w-3.5 text-orange-500" />
                  <span className="font-bold text-foreground">
                    {elo !== null ? `${elo.toLocaleString()} ELO` : '1,500 ELO'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Panels grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Play Battle Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-card to-background border border-orange-500/20 hover:border-orange-500/40 rounded-3xl p-8 flex flex-col justify-between shadow-md relative group transition-all duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,oklch(0.55_0.15_40_/_0.03),transparent_60%)] pointer-events-none" />
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Swords className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-foreground uppercase tracking-wider">Ranked Duel</h2>
              <p className="text-muted-foreground text-xs leading-relaxed max-w-md">
                Find an opponent of similar skill, solve on Stackmat Timer, scan with your camera, and climb the global leaderboards.
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={() => router.push('/online/matchmaking')}
                disabled={matchmakingAvailable !== true}
                className="w-full sm:w-fit flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/25 transition-all uppercase tracking-widest text-xs cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 disabled:hover:bg-orange-500"
              >
                <Play className="h-4.5 w-4.5 fill-current" /> FIND MATCH
              </button>
              {matchmakingAvailable === false && (
                <p className="mt-3 max-w-md text-xs font-semibold text-amber-600">
                  {availabilityMessage || 'Online matches are temporarily unavailable.'}
                </p>
              )}
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-6">
            {/* Leaderboard Card */}
            <div
              onClick={() => router.push('/rankings?from=arena')}
              className="bg-card/40 hover:bg-card/60 border border-border/80 hover:border-border rounded-2xl p-6 cursor-pointer flex items-center gap-4 transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider">Arena Leaderboard</h4>
                <p className="text-muted-foreground text-[10px] sm:text-xs">Compare with top cubers worldwide.</p>
              </div>
            </div>

            {/* History Card */}
            <div
              onClick={() => router.push('/online/history')}
              className="bg-card/40 hover:bg-card/60 border border-border/80 hover:border-orange-500/50 rounded-2xl p-6 cursor-pointer flex items-center gap-4 transition-all duration-200 group"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 group-hover:bg-orange-500/20 flex items-center justify-center text-orange-500 shrink-0 transition-all">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-foreground uppercase tracking-wider group-hover:text-orange-500 transition-colors">Match History</h4>
                <p className="text-muted-foreground text-[10px] sm:text-xs">Review past matches, times, ELO changes, and video replays.</p>
              </div>
            </div>

            {/* AI Calibration Guide */}
            <div className="bg-muted/30 border border-border/60 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-orange-500" /> SYSTEM CALIBRATION
              </span>
              <p className="text-muted-foreground text-[10px] sm:text-xs leading-relaxed">
                Ensure camera visibility and solid lighting before starting. Solving times must be uploaded via paired Mobile Timer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
