'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
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
  Flame,
  Play,
  Sparkles,
  Clock,
  Swords,
  Medal,
} from 'lucide-react';

export default function RankingsPage() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [selectedDivision, setSelectedDivision] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');

  const recentMatches = [
    { playerA: 'SpeedMaster_JP', playerB: 'CubeLegend_CN', winner: 'SpeedMaster_JP', time: '8.12s', room: 'VN-2048', elo: '+12' },
    { playerA: 'FastFingers_US', playerB: 'TwistyKing_KR', winner: 'TwistyKing_KR', time: '8.48s', room: 'VN-2051', elo: '+15' },
    { playerA: 'BlazeFast_BR', playerB: 'PuzzleWizard_DE', winner: 'BlazeFast_BR', time: '8.77s', room: 'VN-2060', elo: '+11' },
  ];

  const rankings = [
    { rank: 1, name: 'SpeedMaster_JP', rating: 2950, country: '🇯🇵', region: 'asia', change: 'up', bestTime: '5.20s', duels: 145, winRate: '88%' },
    { rank: 2, name: 'CubeLegend_CN', rating: 2890, country: '🇨🇳', region: 'asia', change: 'down', bestTime: '5.50s', duels: 182, winRate: '84%' },
    { rank: 3, name: 'FastFingers_US', rating: 2845, country: '🇺🇸', region: 'americas', change: 'up', bestTime: '5.71s', duels: 138, winRate: '82%' },
    { rank: 4, name: 'TwistyKing_KR', rating: 2820, country: '🇰🇷', region: 'asia', change: 'up', bestTime: '6.10s', duels: 121, winRate: '79%' },
    { rank: 5, name: 'PhamVanD_VN', rating: 2795, country: '🇻🇳', region: 'vn', change: 'up', bestTime: '5.85s', duels: 96, winRate: '85%' },
    { rank: 6, name: 'BlazeFast_BR', rating: 2790, country: '🇧🇷', region: 'americas', change: 'down', bestTime: '6.30s', duels: 135, winRate: '76%' },
    { rank: 7, name: 'PuzzleWizard_DE', rating: 2750, country: '🇩🇪', region: 'europe', change: 'stable', bestTime: '6.50s', duels: 108, winRate: '74%' },
    { rank: 8, name: 'Speedcube_RU', rating: 2720, country: '🇷🇺', region: 'europe', change: 'up', bestTime: '6.70s', duels: 112, winRate: '72%' },
    { rank: 9, name: 'NguyenVanA_VN', rating: 2695, country: '🇻🇳', region: 'vn', change: 'up', bestTime: '6.89s', duels: 89, winRate: '75%' },
    { rank: 10, name: 'CubeNinja_MX', rating: 2675, country: '🇲🇽', region: 'americas', change: 'down', bestTime: '6.90s', duels: 94, winRate: '70%' },
    { rank: 11, name: 'TwistMaster_IN', rating: 2650, country: '🇮🇳', region: 'asia', change: 'down', bestTime: '7.10s', duels: 86, winRate: '68%' },
    { rank: 12, name: 'TranThiB_VN', rating: 2625, country: '🇻🇳', region: 'vn', change: 'stable', bestTime: '7.30s', duels: 78, winRate: '66%' },
  ];

  const divisions = [
    { id: 'global', label: 'Toàn Cầu (Global)' },
    { id: 'vn', label: 'Việt Nam (VN)' },
    { id: 'asia', label: 'Châu Á (Asia Pacific)' },
    { id: 'master', label: 'Bảng Cao Thủ (Master Tier)' },
  ];

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-emerald-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-rose-500" />;
      default:
        return <Minus className="h-4 w-4 text-slate-400" />;
    }
  };

  const filteredRankings = useMemo(() => {
    return rankings.filter((player) => {
      const matchesSearch = player.name.toLowerCase().includes(searchQuery.toLowerCase());
      if (!matchesSearch) return false;
      if (selectedDivision === 'global') return true;
      if (selectedDivision === 'vn') return player.region === 'vn';
      if (selectedDivision === 'asia') return player.region === 'asia' || player.region === 'vn';
      if (selectedDivision === 'master') return player.rating >= 2700;
      return true;
    });
  }, [searchQuery, selectedDivision]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <LoaderCircle className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  const top1 = rankings[0];
  const top2 = rankings[1];
  const top3 = rankings[2];

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
        {/* Banner Section */}
        <div className="bg-white border border-slate-200 p-6 sm:p-8 rounded-3xl relative overflow-hidden shadow-2xs">
          <div className="absolute -top-12 -right-12 w-96 h-96 bg-amber-500/10 rounded-full blur-3xl pointer-events-none" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3.5 py-1 text-xs font-bold text-amber-700 flex items-center gap-1.5 font-mono uppercase">
                  <Swords className="h-3.5 w-3.5 text-amber-600" /> 3X3X3 SPEEDCUBING ARENA
                </span>
                <span className="text-slate-500 text-xs font-semibold font-mono">
                  • Season 4 Resetting in 22 Days
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
                ARENA LEADERBOARD (3X3X3)
              </h1>
              <p className="text-slate-600 max-w-2xl text-xs sm:text-sm leading-relaxed">
                Bảng xếp hạng chỉ số ELO Rating chính thức của chế độ thi đấu Đấu trường 3x3x3 Online. Tích lũy điểm ELO qua từng trận solo 1v1 để thăng hạng và tranh suất vào Master Tier.
              </p>
            </div>
            <div>
              <Button
                asChild
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-5 text-xs tracking-wider shadow-md rounded-xl transition-all border-none uppercase flex items-center gap-2 cursor-pointer"
              >
                <Link href="/online">
                  Tham Gia Đấu Trường 3x3x3 <Play className="h-3.5 w-3.5 fill-current" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Rank 2 - Silver */}
          {top2 && (
            <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Medal className="h-20 w-20 text-slate-400" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                  Rank #2 Silver
                </span>
                <span className="text-2xl">{top2.country}</span>
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-base text-slate-900 tracking-tight">{top2.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-slate-700 font-mono">{top2.rating}</span>
                  <span className="text-xs font-bold text-slate-500 font-mono">ELO</span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Best PB: <strong className="text-slate-900 font-mono">{top2.bestTime}</strong></span>
                <span>Win rate: <strong className="text-indigo-600 font-mono">{top2.winRate}</strong></span>
              </div>
            </div>
          )}

          {/* Rank 1 - Gold */}
          {top1 && (
            <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-50/50 to-white border-2 border-amber-400 rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden transform md:-translate-y-2">
              <div className="absolute top-0 right-0 p-3 opacity-20">
                <Trophy className="h-24 w-24 text-amber-500" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-extrabold font-mono px-3 py-1 rounded-full bg-amber-500 text-white uppercase flex items-center gap-1 shadow-2xs">
                  <Trophy className="h-3 w-3" /> Champion #1
                </span>
                <span className="text-3xl">{top1.country}</span>
              </div>
              <div className="space-y-1">
                <p className="font-black text-lg text-slate-900 tracking-tight">{top1.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-3xl font-black text-amber-600 font-mono">{top1.rating}</span>
                  <span className="text-xs font-extrabold text-amber-700 font-mono">ELO</span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-slate-600">
                <span>Best PB: <strong className="text-amber-700 font-mono text-sm">{top1.bestTime}</strong></span>
                <span>Win rate: <strong className="text-emerald-600 font-mono text-sm">{top1.winRate}</strong></span>
              </div>
            </div>
          )}

          {/* Rank 3 - Bronze */}
          {top3 && (
            <div className="order-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
              <div className="absolute top-0 right-0 p-3 opacity-10">
                <Medal className="h-20 w-20 text-amber-700" />
              </div>
              <div className="flex items-center justify-between mb-3">
                <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-100/60 text-amber-800 border border-amber-200 uppercase">
                  Rank #3 Bronze
                </span>
                <span className="text-2xl">{top3.country}</span>
              </div>
              <div className="space-y-1">
                <p className="font-extrabold text-base text-slate-900 tracking-tight">{top3.name}</p>
                <div className="flex items-baseline gap-2">
                  <span className="text-2xl font-black text-amber-800 font-mono">{top3.rating}</span>
                  <span className="text-xs font-bold text-slate-500 font-mono">ELO</span>
                </div>
              </div>
              <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                <span>Best PB: <strong className="text-slate-900 font-mono">{top3.bestTime}</strong></span>
                <span>Win rate: <strong className="text-indigo-600 font-mono">{top3.winRate}</strong></span>
              </div>
            </div>
          )}
        </div>

        {/* User stats overview and Live Matches */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal rating indicator */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-2xs relative overflow-hidden lg:col-span-2 text-slate-900">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Competitor Rank
                  </span>
                  <p className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight mt-1">#1,284 Global</p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold font-mono">3x3x3 ELO RATING</span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5 font-mono">2,645</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-600 font-semibold mb-2">
                  <span>Tiến trình lên Master Tier (2,700 ELO)</span>
                  <span className="text-slate-900 font-mono">55 / 100 PTS</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div className="h-full w-[55%] rounded-full bg-amber-500" />
                </div>
              </div>
            </div>

            <div className="flex items-center justify-between text-xs pt-4 text-slate-500 font-semibold border-t border-slate-100 mt-4">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" /> Chuỗi thắng: <strong className="text-slate-900">12 trận liên tiếp</strong>
              </span>
              <span>Thứ hạng Việt Nam: <strong className="text-slate-900 font-mono">#86 (VN)</strong></span>
            </div>
          </div>

          {/* Live Recent Feed */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xs text-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 font-mono flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Trận 3x3x3 Gần Đây
            </h3>
            <div className="space-y-3">
              {recentMatches.map((match) => (
                <div key={match.room} className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-amber-300 transition">
                  <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-900">
                    <span>{match.playerA}</span>
                    <span className="text-[10px] text-slate-400 font-mono">VS</span>
                    <span>{match.playerB}</span>
                  </div>
                  <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                    <span className="text-amber-700 flex items-center gap-1">
                      Thắng: {match.winner} <span className="text-[10px] bg-emerald-50 text-emerald-700 border border-emerald-200 px-1.5 py-0.2 rounded font-bold font-mono">{match.elo}</span>
                    </span>
                    <span className="font-mono text-slate-600">{match.time}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Division Filter and Leaderboard Search */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex flex-wrap gap-2">
            {divisions.map((division) => (
              <button
                key={division.id}
                onClick={() => setSelectedDivision(division.id)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer font-mono ${
                  selectedDivision === division.id
                    ? 'border-amber-500 bg-amber-50 text-amber-700'
                    : 'border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                }`}
              >
                {division.label}
              </button>
            ))}
          </div>

          <div className="relative min-w-[280px]">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
            <input
              type="text"
              placeholder="Tìm kiếm đấu thủ..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-10 pr-4 py-2 text-xs text-slate-900 font-medium placeholder-slate-400 outline-none focus:bg-white focus:border-amber-500 transition"
            />
          </div>
        </div>

        {/* Leaderboard Table Container */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          {/* Desktop Table View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    <th className="px-6 py-4">Hạng</th>
                    <th className="px-6 py-4">Đấu Thủ 3x3x3</th>
                    <th className="px-6 py-4 text-center">ELO Rating</th>
                    <th className="px-6 py-4 text-center">3x3x3 Best PB</th>
                    <th className="px-6 py-4 text-center">Số Trận Đã Đấu</th>
                    <th className="px-6 py-4 text-center">Tỷ Lệ Thắng</th>
                    <th className="px-6 py-4 text-center">Xu Hướng</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-900">
                  {filteredRankings.map((player) => {
                    const isUser = player.name === 'PhamVanD_VN';
                    return (
                      <tr
                        key={player.rank}
                        className={`hover:bg-slate-50 transition-colors ${
                          isUser ? 'bg-amber-50/60 font-semibold' : ''
                        }`}
                      >
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            {player.rank <= 3 ? (
                              <Trophy
                                className={`h-4.5 w-4.5 ${
                                  player.rank === 1
                                    ? 'text-amber-500'
                                    : player.rank === 2
                                    ? 'text-slate-400'
                                    : 'text-amber-700'
                                }`}
                              />
                            ) : (
                              <div className="w-4.5" />
                            )}
                            <span className="font-extrabold font-mono text-sm">#{player.rank}</span>
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex items-center gap-2.5">
                            <span className="text-lg leading-none">{player.country}</span>
                            <span className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer transition-colors text-xs">
                              {player.name}
                            </span>
                            {isUser && (
                              <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono uppercase">
                                SỐ CỦA BẠN
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 text-center">
                          <span className="font-extrabold text-amber-600 font-mono text-sm">
                            {player.rating.toLocaleString('en-US')}
                          </span>
                        </td>
                        <td className="px-6 py-4 text-center font-bold font-mono text-slate-700 text-xs">
                          {player.bestTime}
                        </td>
                        <td className="px-6 py-4 text-center font-semibold font-mono text-slate-600">
                          {player.duels}
                        </td>
                        <td className="px-6 py-4 text-center font-bold font-mono text-emerald-600">
                          {player.winRate}
                        </td>
                        <td className="px-6 py-4">
                          <div className="flex justify-center">{getChangeIcon(player.change)}</div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile Cards View */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredRankings.map((player) => (
              <div key={player.rank} className="p-4 space-y-2">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <span className="font-extrabold font-mono text-xs text-slate-900">#{player.rank}</span>
                    <span className="text-base">{player.country}</span>
                    <span className="font-bold text-xs text-slate-900">{player.name}</span>
                  </div>
                  <span className="font-extrabold text-amber-600 font-mono text-xs">{player.rating} ELO</span>
                </div>
                <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                  <span>Best: <strong className="text-slate-900">{player.bestTime}</strong></span>
                  <span>Trận: <strong className="text-slate-900">{player.duels}</strong> ({player.winRate})</span>
                  <div className="flex items-center gap-1">{getChangeIcon(player.change)}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </main>
  );
}
