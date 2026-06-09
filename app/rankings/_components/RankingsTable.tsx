'use client';

import { ArrowUp, ArrowDown, Minus, Trophy, Star } from 'lucide-react';
import { Card } from '@/components/ui/card';

interface Cuber {
  rank: number;
  name: string;
  rating: number;
  country: string;
  change: 'up' | 'down' | 'stable';
  bestTime: string;
  tournaments: number;
}

export function RankingsTable() {
  const rankings: Cuber[] = [
    { rank: 1, name: 'SpeedMaster_JP', rating: 2950, country: '🇯🇵', change: 'up', bestTime: '7.22s', tournaments: 45 },
    { rank: 2, name: 'CubeLegend_CN', rating: 2890, country: '🇨🇳', change: 'down', bestTime: '7.54s', tournaments: 52 },
    { rank: 3, name: 'FastFingers_US', rating: 2845, country: '🇺🇸', change: 'up', bestTime: '7.81s', tournaments: 38 },
    { rank: 4, name: 'TwistyKing_KR', rating: 2820, country: '🇰🇷', change: 'up', bestTime: '8.12s', tournaments: 41 },
    { rank: 5, name: 'BlazeFast_BR', rating: 2790, country: '🇧🇷', change: 'down', bestTime: '8.34s', tournaments: 35 },
    { rank: 6, name: 'PuzzleWizard_DE', rating: 2750, country: '🇩🇪', change: 'stable', bestTime: '8.50s', tournaments: 28 },
    { rank: 7, name: 'Speedcube_RU', rating: 2720, country: '🇷🇺', change: 'up', bestTime: '8.76s', tournaments: 32 },
    { rank: 8, name: 'CubeNinja_MX', rating: 2695, country: '🇲🇽', change: 'up', bestTime: '8.92s', tournaments: 29 },
    { rank: 9, name: 'TwistMaster_IN', rating: 2670, country: '🇮🇳', change: 'down', bestTime: '9.11s', tournaments: 26 },
    { rank: 10, name: 'FastCube_AU', rating: 2645, country: '🇦🇺', change: 'stable', bestTime: '9.31s', tournaments: 24 },
    { rank: 11, name: 'SpeedRuler_CA', rating: 2620, country: '🇨🇦', change: 'up', bestTime: '9.58s', tournaments: 21 },
    { rank: 12, name: 'CubeExpert_SE', rating: 2595, country: '🇸🇪', change: 'down', bestTime: '9.72s', tournaments: 19 },
  ];

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-emerald-500/10 px-1.5 py-0.5 text-xs font-bold text-emerald-600 border border-emerald-500/25">
            <ArrowUp className="h-3 w-3" />
            UP
          </span>
        );
      case 'down':
        return (
          <span className="inline-flex items-center gap-1 rounded bg-rose-500/10 px-1.5 py-0.5 text-xs font-bold text-rose-600 border border-rose-500/25">
            <ArrowDown className="h-3 w-3" />
            DOWN
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 rounded bg-muted/60 px-1.5 py-0.5 text-xs font-bold text-muted-foreground border border-border">
            <Minus className="h-3 w-3" />
            MID
          </span>
        );
    }
  };

  const getRankBadge = (rank: number) => {
    if (rank === 1) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-400 text-amber-950 font-bold border border-amber-300 shadow-md">
          <Trophy className="h-4 w-4" />
        </span>
      );
    }
    if (rank === 2) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-slate-300 text-slate-800 font-bold border border-slate-200 shadow-md">
          <Star className="h-4 w-4" />
        </span>
      );
    }
    if (rank === 3) {
      return (
        <span className="inline-flex h-7 w-7 items-center justify-center rounded-full bg-amber-600 text-amber-50 font-bold border border-amber-500 shadow-md">
          3
        </span>
      );
    }
    return <span className="font-bold text-muted-foreground">#{rank}</span>;
  };

  return (
    <Card className="border border-border overflow-hidden rounded-2xl shadow-sm">
      {/* Desktop Leaderboard View */}
      <div className="hidden md:block">
        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-border bg-muted/40">
                <th className="px-6 py-4.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Rank</th>
                <th className="px-6 py-4.5 text-left text-xs font-bold text-muted-foreground uppercase tracking-wider">Cuber / Player</th>
                <th className="px-6 py-4.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Elo Rating</th>
                <th className="px-6 py-4.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Best Official Solve</th>
                <th className="px-6 py-4.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Tournaments</th>
                <th className="px-6 py-4.5 text-center text-xs font-bold text-muted-foreground uppercase tracking-wider">Trend</th>
              </tr>
            </thead>
            <tbody>
              {rankings.map((player) => (
                <tr
                  key={player.rank}
                  className="border-b border-border hover:bg-muted/30 transition-colors"
                >
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      {getRankBadge(player.rank)}
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <span className="text-xl filter drop-shadow-sm select-none">{player.country}</span>
                      <span className="font-semibold text-foreground hover:text-accent transition-colors cursor-pointer">
                        {player.name}
                      </span>
                    </div>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <span className="font-extrabold text-accent">{player.rating.toLocaleString()}</span>
                  </td>
                  <td className="px-6 py-4 text-center font-bold text-foreground/80">{player.bestTime}</td>
                  <td className="px-6 py-4 text-center font-semibold text-muted-foreground">{player.tournaments}</td>
                  <td className="px-6 py-4">
                    <div className="flex justify-center">
                      {getChangeIcon(player.change)}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Mobile Accordion/List View */}
      <div className="md:hidden divide-y divide-border">
        {rankings.map((player) => (
          <div key={player.rank} className="p-4 hover:bg-muted/10 transition-colors">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2.5">
                {getRankBadge(player.rank)}
                <span className="text-lg filter drop-shadow-sm select-none">{player.country}</span>
                <span className="font-bold text-foreground text-sm">{player.name}</span>
              </div>
              <div>{getChangeIcon(player.change)}</div>
            </div>

            <div className="mt-3.5 grid grid-cols-3 gap-2.5 rounded-xl border border-border bg-muted/10 p-3 text-center text-xs">
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Elo Rating</p>
                <p className="mt-1 font-extrabold text-accent">{player.rating.toLocaleString()}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Best Solve</p>
                <p className="mt-1 font-bold text-foreground/80">{player.bestTime}</p>
              </div>
              <div>
                <p className="text-[10px] font-semibold text-muted-foreground uppercase">Events</p>
                <p className="mt-1 font-semibold text-muted-foreground">{player.tournaments}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
