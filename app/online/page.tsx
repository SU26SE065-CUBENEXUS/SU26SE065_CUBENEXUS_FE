'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Header } from '@/components/header';
import { useAuth } from '@/contexts/auth-context';
import { ShieldCheck, Trophy, History, Zap, Play, Swords, User } from 'lucide-react';
import { getMyProfiles, initProfile } from '@/features/online-arena/api/onlineArenaApi';

export default function OnlineLobbyPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [elo, setElo] = useState<number | null>(null);

  useEffect(() => {
    let active = true;
    const fetchOrInitProfile = async () => {
      try {
        const profiles = await getMyProfiles();
        if (active) {
          if (!profiles || profiles.length === 0) {
            const newProfile = await initProfile('f4ddb522-426f-4dd0-a98d-20f21b192470');
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

  return (
    <main className="min-h-screen bg-zinc-950 text-white relative pb-20">
      <Header />

      {/* Cyber Grid background */}
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,oklch(0.5_0.15_40_/_0.06),transparent_50%)] pointer-events-none" />
      <div className="absolute top-20 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-zinc-800 to-transparent" />

      <div className="max-w-6xl mx-auto px-6 py-12 relative z-10 space-y-12">
        {/* Welcome Hero Panel */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 bg-zinc-900/40 border border-zinc-800/80 rounded-3xl p-8 backdrop-blur-md relative overflow-hidden shadow-2xl">
          <div className="absolute inset-0 bg-gradient-to-r from-orange-500/5 via-transparent to-transparent pointer-events-none" />
          <div className="space-y-3">
            <div className="flex items-center gap-2">
              <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-2.5 py-1 rounded-full uppercase animate-pulse">
                Ranked Season 1
              </span>
            </div>
            <h1 className="text-3xl sm:text-5xl font-black tracking-tight uppercase">
              1V1 ONLINE ARENA
            </h1>
            <p className="text-zinc-400 text-xs sm:text-sm max-w-xl leading-relaxed">
              Match up with speedcubers worldwide. Verify scrambles and final solves using our real-time AI computer vision checker.
            </p>
          </div>

          {/* User profile card */}
          {user && (
            <div className="flex items-center gap-4 bg-zinc-950/60 border border-zinc-800/80 rounded-2xl p-4 shrink-0 w-full md:w-fit">
              <div className="h-12 w-12 rounded-xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <User className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">{user.displayName}</h4>
                <div className="flex items-center gap-2 text-xs text-zinc-400 mt-1">
                  <Trophy className="h-3.5 w-3.5 text-orange-400" />
                  <span className="font-bold text-white">
                    {elo !== null ? `${elo.toLocaleString()} ELO` : '1500 ELO'}
                  </span>
                </div>
              </div>
            </div>
          )}

        </div>

        {/* Action Panels grid */}
        <div className="grid gap-6 md:grid-cols-3">
          {/* Play Battle Card */}
          <div className="md:col-span-2 bg-gradient-to-br from-zinc-900 to-zinc-950 border border-orange-500/20 hover:border-orange-500/40 rounded-3xl p-8 flex flex-col justify-between shadow-lg relative group transition-all duration-300">
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_right,oklch(0.55_0.15_40_/_0.06),transparent_60%)] pointer-events-none" />
            <div className="space-y-4">
              <div className="h-12 w-12 rounded-2xl bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-500">
                <Swords className="h-6 w-6" />
              </div>
              <h2 className="text-2xl font-black text-white uppercase tracking-wider">Ranked Duel</h2>
              <p className="text-zinc-400 text-xs leading-relaxed max-w-md">
                Find an opponent of similar skill, solve on Stackmat Timer, scan with your camera, and climb the global leaderboards.
              </p>
            </div>

            <div className="mt-8">
              <button
                onClick={() => router.push('/online/matchmaking')}
                className="w-full sm:w-fit flex items-center justify-center gap-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold px-8 py-4 rounded-2xl shadow-xl shadow-orange-500/20 transition-all uppercase tracking-widest text-xs"
              >
                <Play className="h-4.5 w-4.5 fill-current" /> FIND MATCH
              </button>
            </div>
          </div>

          {/* Secondary Actions */}
          <div className="space-y-6">
            {/* Leaderboard Card */}
            <div
              onClick={() => router.push('/rankings')}
              className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 cursor-pointer flex items-center gap-4 transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <Trophy className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Arena Leaderboard</h4>
                <p className="text-zinc-500 text-[10px] sm:text-xs">Compare with top cubers worldwide.</p>
              </div>
            </div>

            {/* History Card */}
            <div
              onClick={() => alert('Battle Records feature is coming soon!')}
              className="bg-zinc-900/40 hover:bg-zinc-900/60 border border-zinc-800/80 hover:border-zinc-700/80 rounded-2xl p-6 cursor-pointer flex items-center gap-4 transition-all duration-200"
            >
              <div className="h-10 w-10 rounded-xl bg-orange-500/10 flex items-center justify-center text-orange-500 shrink-0">
                <History className="h-5 w-5" />
              </div>
              <div>
                <h4 className="text-sm font-bold text-white uppercase tracking-wider">Battle Records</h4>
                <p className="text-zinc-500 text-[10px] sm:text-xs">Review past matches, times, and ELO changes.</p>
              </div>
            </div>

            {/* AI Calibration Guide */}
            <div className="bg-zinc-900/20 border border-zinc-800/40 rounded-2xl p-5 space-y-2">
              <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center gap-1.5">
                <ShieldCheck className="h-4 w-4 text-orange-500" /> SYSTEM CALIBRATION
              </span>
              <p className="text-zinc-400 text-[10px] sm:text-xs leading-relaxed">
                Ensure camera visibility and solid lighting before starting. Solving times must be uploaded via paired Mobile Timer.
              </p>
            </div>
          </div>
        </div>
      </div>
    </main>
  );
}
