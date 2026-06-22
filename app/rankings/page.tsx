'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { LoaderCircle } from 'lucide-react';
import { 
  ArrowUp, 
  ArrowDown, 
  Minus, 
  Trophy, 
  Search, 
  Target, 
  Flame, 
  Globe, 
  Play, 
  Sparkles,
  TrendingUp,
  Clock
} from 'lucide-react';

export default function RankingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [selectedCategory, setSelectedCategory] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');

  const recentMatches = [
    { playerA: 'SpeedMaster_JP', playerB: 'CubeLegend_CN', winner: 'SpeedMaster_JP', time: '8.120s', room: 'VN-2048', elo: '+12' },
    { playerA: 'FastFingers_US', playerB: 'TwistyKing_KR', winner: 'TwistyKing_KR', time: '8.480s', room: 'VN-2051', elo: '+15' },
    { playerA: 'BlazeFast_BR', playerB: 'PuzzleWizard_DE', winner: 'BlazeFast_BR', time: '8.770s', room: 'VN-2060', elo: '+11' },
  ];

  const rankings = [
    { rank: 1, name: 'SpeedMaster_JP', rating: 2950, country: '🇯🇵', change: 'up', bestTime: '7.200s', tournaments: 45 },
    { rank: 2, name: 'CubeLegend_CN', rating: 2890, country: '🇨🇳', change: 'down', bestTime: '7.500s', tournaments: 52 },
    { rank: 3, name: 'FastFingers_US', rating: 2845, country: '🇺🇸', change: 'up', bestTime: '7.800s', tournaments: 38 },
    { rank: 4, name: 'TwistyKing_KR', rating: 2820, country: '🇰🇷', change: 'up', bestTime: '8.100s', tournaments: 41 },
    { rank: 5, name: 'BlazeFast_BR', rating: 2790, country: '🇧🇷', change: 'down', bestTime: '8.300s', tournaments: 35 },
    { rank: 6, name: 'PuzzleWizard_DE', rating: 2750, country: '🇩🇪', change: 'stable', bestTime: '8.500s', tournaments: 28 },
    { rank: 7, name: 'Speedcube_RU', rating: 2720, country: '🇷🇺', change: 'up', bestTime: '8.700s', tournaments: 32 },
    { rank: 8, name: 'CubeNinja_MX', rating: 2695, country: '🇲🇽', change: 'up', bestTime: '8.900s', tournaments: 29 },
    { rank: 9, name: 'TwistMaster_IN', rating: 2670, country: '🇮🇳', change: 'down', bestTime: '9.100s', tournaments: 26 },
    { rank: 10, name: 'FastCube_AU', rating: 2645, country: '🇦🇺', change: 'stable', bestTime: '9.300s', tournaments: 24 },
    { rank: 11, name: 'SpeedRuler_CA', rating: 2620, country: '🇨🇦', change: 'up', bestTime: '9.500s', tournaments: 21 },
    { rank: 12, name: 'CubeExpert_SE', rating: 2595, country: '🇸🇪', change: 'down', bestTime: '9.700s', tournaments: 19 },
  ];

  const categories = [
    { id: 'global', label: 'Global Leaderboard' },
    { id: 'asia', label: 'Asia Pacific' },
    { id: 'europe', label: 'Europe Tier' },
    { id: 'americas', label: 'Americas Division' },
  ];

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <ArrowUp className="h-4.5 w-4.5 text-emerald-400" />;
      case 'down':
        return <ArrowDown className="h-4.5 w-4.5 text-red-400" />;
      default:
        return <Minus className="h-4.5 w-4.5 text-zinc-500" />;
    }
  };

  const filteredRankings = useMemo(() => {
    return rankings.filter(player => 
      player.name.toLowerCase().includes(searchQuery.toLowerCase())
    );
  }, [searchQuery]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <LoaderCircle className="h-8 w-8 animate-spin text-[#eab308]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Banner Section */}
        <Card className="border border-border bg-card p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308] flex items-center gap-1.5">
                  <Globe className="h-3.5 w-3.5" /> LIVE RATINGS
                </span>
                <span className="text-muted-foreground text-xs font-medium">• Resetting in 22 Days</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
                GLOBAL LEADERBOARD
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
                Track real-time Speedcubing Elo scores, national records, and watch current active matches online in the arena.
              </p>
            </div>
            <div>
              <Button asChild className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-black px-8 py-6 text-sm tracking-wider shadow-lg shadow-yellow-500/10 rounded-xl transition-all border-none uppercase flex items-center gap-2">
                <Link href="/arena">
                  Watch Live Arena <Play className="h-3.5 w-3.5 fill-current" />
                </Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* User stats overview and Live Matches */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal rating indicator */}
          <Card className="border border-[#eab308]/40 bg-[#eab308]/5 p-6 rounded-2xl flex flex-col justify-between shadow-md relative overflow-hidden lg:col-span-2">
            <div className="absolute top-0 right-0 p-4 opacity-10">
              <Trophy className="h-28 w-28 text-[#eab308]" />
            </div>
            
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-[#eab308] uppercase tracking-widest flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Competitor rank
                  </span>
                  <p className="text-3xl font-black text-foreground mt-1">#1,284 Global</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-muted-foreground font-semibold">ELO RATING</span>
                  <p className="text-2xl font-black text-[#eab308] mt-0.5">2,645</p>
                </div>
              </div>

              <div className="pt-4 border-t border-border">
                <div className="flex justify-between text-xs text-muted-foreground font-semibold mb-2">
                  <span>Progress to Master Tier (2,700 ELO)</span>
                  <span className="text-foreground">55 / 100 PTS</span>
                </div>
                <div className="h-2 w-full rounded-full bg-muted overflow-hidden">
                  <div className="h-full w-[55%] rounded-full bg-[#eab308] shadow-[0_0_8px_#eab308]" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-4 text-muted-foreground font-semibold">
              <span className="flex items-center gap-1.5"><Flame className="h-4 w-4 text-[#eab308]" /> Win Streak: 12 matches</span>
              <span>Regional Rank: #86 (VN)</span>
            </div>
          </Card>

          {/* Live Recent Feed */}
          <Card className="border border-border bg-card p-6 rounded-2xl space-y-4 shadow-sm">
            <h3 className="text-sm font-extrabold uppercase tracking-widest text-[#eab308] flex items-center gap-2">
              <Clock className="h-4.5 w-4.5 text-[#eab308]" />
              RECENT MATCHES
            </h3>
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div key={match.room} className="rounded-xl border border-border/80 bg-muted/10 p-3 hover:border-[#eab308]/20 transition-all duration-300">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold">
                    <span className="text-foreground">{match.playerA}</span>
                    <span className="text-[10px] text-muted-foreground">vs</span>
                    <span className="text-foreground">{match.playerB}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold text-muted-foreground">
                    <span className="text-[#eab308] flex items-center gap-1">
                      Winner: {match.winner} <span className="text-[10px] bg-emerald-500/10 text-emerald-400 px-1.5 py-0.5 rounded font-black">{match.elo}</span>
                    </span>
                    <span>{match.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        </div>

        {/* Category Filter and Leaderboard Search */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-card/40 border border-border/60 p-4 rounded-2xl">
          <div className="flex flex-wrap gap-2">
            {categories.map((category) => (
              <button
                key={category.id}
                onClick={() => setSelectedCategory(category.id)}
                className={`px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                  selectedCategory === category.id 
                    ? 'border-[#eab308] bg-[#eab308]/5 text-[#eab308]' 
                    : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-border/80'
                }`}
              >
                {category.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input 
              type="text" 
              placeholder="Search player name..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-[#eab308]"
            />
          </div>
        </div>

        {/* Leaderboard Table Container */}
        <Card className="border border-border/80 bg-card rounded-2xl overflow-hidden shadow-sm">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="border-b border-border bg-muted/40 text-xs font-bold text-muted-foreground uppercase tracking-widest text-left">
                    <th className="px-8 py-5">Rank</th>
                    <th className="px-6 py-5">Cuber Profile</th>
                    <th className="px-6 py-5 text-center">Elo Rating</th>
                    <th className="px-6 py-5 text-center">Single PB</th>
                    <th className="px-6 py-5 text-center">Tournaments</th>
                    <th className="px-8 py-5 text-center">Trend</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/60">
                  {filteredRankings.map((player) => (
                    <tr
                      key={player.rank}
                      className={`hover:bg-muted/10 transition-colors ${
                        player.name === 'CuberNexus_Pro' || player.rank === 1 ? 'bg-[#eab308]/2' : ''
                      }`}
                    >
                      <td className="px-8 py-5">
                        <div className="flex items-center gap-3">
                          {player.rank <= 3 ? (
                            <Trophy
                              className={`h-5 w-5 ${
                                player.rank === 1
                                  ? 'text-[#eab308] drop-shadow-[0_0_6px_rgba(234,179,8,0.4)]'
                                  : player.rank === 2
                                  ? 'text-zinc-400'
                                  : 'text-amber-700'
                              }`}
                            />
                          ) : (
                            <div className="w-5" />
                          )}
                          <span className="font-extrabold text-sm">#{player.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                          <span className="text-xl leading-none">{player.country}</span>
                          <span className="font-bold text-foreground hover:text-[#eab308] cursor-pointer transition-colors text-sm">
                            {player.name}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-5 text-center">
                        <span className="font-black text-[#eab308] text-sm">{player.rating.toLocaleString('en-US')}</span>
                      </td>
                      <td className="px-6 py-5 text-center font-bold text-foreground text-sm">{player.bestTime}</td>
                      <td className="px-6 py-5 text-center font-medium text-muted-foreground text-sm">{player.tournaments}</td>
                      <td className="px-8 py-5">
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

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-border/60">
            {filteredRankings.map((player) => (
              <div key={player.rank} className="p-4 space-y-2.5">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {player.rank <= 3 && (
                      <Trophy
                        className={`h-4.5 w-4.5 ${
                          player.rank === 1
                            ? 'text-[#eab308]'
                            : player.rank === 2
                            ? 'text-zinc-400'
                            : 'text-amber-700'
                        }`}
                      />
                    )}
                    <span className="font-extrabold text-sm">#{player.rank}</span>
                    <span className="text-lg leading-none">{player.country}</span>
                    <span className="font-bold text-foreground text-sm">{player.name}</span>
                  </div>
                  <div>
                    {getChangeIcon(player.change)}
                  </div>
                </div>
                <div className="grid grid-cols-3 gap-2 border-t border-border/40 pt-2 text-[11px] text-muted-foreground font-semibold">
                  <div>ELO: <span className="font-extrabold text-[#eab308]">{player.rating}</span></div>
                  <div>PB: <span className="font-extrabold text-foreground">{player.bestTime}</span></div>
                  <div>Events: <span className="font-extrabold text-foreground">{player.tournaments}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}
