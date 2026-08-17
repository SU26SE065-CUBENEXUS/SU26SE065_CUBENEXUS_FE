'use client';

import Link from 'next/link';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { useState, useMemo, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { useLanguage } from '@/contexts/language-context';
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
  ArrowLeft,
} from 'lucide-react';

import {
  getOnlineLeaderboard,
  getMyProfiles,
  getMyMatchHistory,
  LeaderboardEntryDto,
  OnlineMatchHistoryItemDto,
} from '@/features/online-arena/api/onlineArenaApi';

export default function RankingsPage() {
  const { isAuthenticated, isLoading: isAuthLoading } = useAuth();
  const router = useRouter();
  const { t } = useLanguage();

  const [selectedDivision, setSelectedDivision] = useState('global');
  const [searchQuery, setSearchQuery] = useState('');

  // Real API state variables
  const [apiRankings, setApiRankings] = useState<LeaderboardEntryDto[]>([]);
  const [myProfile, setMyProfile] = useState<any>(null);
  const [recentMatches, setRecentMatches] = useState<OnlineMatchHistoryItemDto[]>([]);
  const [isDataLoading, setIsDataLoading] = useState(true);

  // Dynamic back routing state
  const [fromParam, setFromParam] = useState<string | null>(null);

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const searchParams = new URLSearchParams(window.location.search);
      setFromParam(searchParams.get('from'));
    }
  }, []);

  const handleBack = () => {
    if (fromParam === 'arena') {
      router.push('/online');
    } else if (fromParam === 'header') {
      router.push('/');
    } else {
      if (window.history.length > 1) {
        router.back();
      } else {
        router.push('/');
      }
    }
  };

  useEffect(() => {
    if (!isAuthenticated) return;

    let isMounted = true;
    async function loadRealData() {
      setIsDataLoading(true);
      try {
        const [leaderboardData, profilesData, historyData] = await Promise.all([
          getOnlineLeaderboard().catch(() => []),
          getMyProfiles().catch(() => []),
          getMyMatchHistory(undefined, 1, 5).catch(() => ({ matches: [] })),
        ]);

        if (isMounted) {
          if (Array.isArray(leaderboardData) && leaderboardData.length > 0) {
            setApiRankings(leaderboardData);
          }
          if (Array.isArray(profilesData) && profilesData.length > 0) {
            setMyProfile(profilesData[0]);
          }
          if (historyData?.matches && Array.isArray(historyData.matches)) {
            setRecentMatches(historyData.matches);
          }
        }
      } catch (err) {
        console.error('Failed to load online leaderboard data:', err);
      } finally {
        if (isMounted) setIsDataLoading(false);
      }
    }

    loadRealData();
    return () => {
      isMounted = false;
    };
  }, [isAuthenticated]);

  // Derived rankings list: uses API data if available, or empty list
  const rankings = useMemo(() => {
    if (apiRankings.length > 0) {
      return apiRankings.map((item, index) => ({
        rank: item.rank || index + 1,
        name: item.displayName || (item.userId ? `Player_${item.userId.slice(0, 6)}` : 'Player'),
        rating: item.elo || 1000,
        change: 'stable',
        duels: item.totalWins || 0,
        userId: item.userId,
        avatarUrl: item.avatarUrl,
      }));
    }
    return [];
  }, [apiRankings]);

  const divisions = [
    { id: 'global', label: 'Tất Cả Đấu Thủ (All Rankings)' },
    { id: 'master', label: 'Bảng Cao Thủ (Master Tier >= 2700 ELO)' },
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
      if (selectedDivision === 'master') return player.rating >= 2700;
      return true;
    });
  }, [rankings, searchQuery, selectedDivision]);

  useEffect(() => {
    if (!isAuthLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isAuthLoading, isAuthenticated, router]);

  if (isAuthLoading) {
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

  // User real profile metrics
  const userElo = myProfile?.elo ?? myProfile?.eloStandard ?? 1000;
  const userPeakElo = myProfile?.peakElo ?? myProfile?.peakEloStandard ?? userElo;
  const isPlacementDone = myProfile?.isPlacementComplete ?? myProfile?.isPlacementCompleteStandard ?? false;

  // Compute real wins & total matches with fallback to recent match history
  const historyWins = recentMatches.filter((m) => m.isWinner).length;
  const historyTotal = recentMatches.length;

  const totalWins = Math.max(myProfile?.totalWins ?? myProfile?.totalWinsStandard ?? 0, historyWins);
  const totalLosses = myProfile?.totalLosses ?? myProfile?.totalLossesStandard ?? 0;
  const totalDraws = myProfile?.totalDraws ?? myProfile?.totalDrawsStandard ?? 0;
  const totalMatches = Math.max(totalWins + totalLosses + totalDraws, historyTotal);
  const placementDoneCount = Math.max(myProfile?.placementMatchesDone ?? myProfile?.placementMatchesDoneStandard ?? 0, totalMatches);

  return (
    <main className="min-h-screen bg-slate-50 text-slate-900 pb-20 font-sans">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-4">
        {/* Back Button */}
        <div className="flex items-center">
          <button
            onClick={handleBack}
            className="flex items-center gap-2 px-3 py-1.5 text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/50 border border-transparent hover:border-slate-200 rounded-xl transition-all cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" />
            {t('common', 'goBack')}
          </button>
        </div>

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
                  • Season Live ELO Rating
                </span>
              </div>
              <h1 className="text-2xl sm:text-4xl font-extrabold tracking-tight text-slate-900 uppercase">
                {t('competitor', 'rankingsTitle')} (3X3X3)
              </h1>
              <p className="text-slate-600 max-w-2xl text-xs sm:text-sm leading-relaxed">
                {t('competitor', 'rankingsSubtitle')}
              </p>
            </div>
            <div>
              <Button
                asChild
                className="bg-amber-500 hover:bg-amber-600 text-white font-extrabold px-6 py-5 text-xs tracking-wider shadow-md rounded-xl transition-all border-none uppercase flex items-center gap-2 cursor-pointer"
              >
                <Link href="/online">
                  Tham Gia Đấu Trường Online <Play className="h-3.5 w-3.5 fill-current" />
                </Link>
              </Button>
            </div>
          </div>
        </div>

        {/* Top 3 Podium Cards */}
        {rankings.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* Rank 2 - Silver */}
            {top2 ? (
              <div className="order-2 md:order-1 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Medal className="h-20 w-20 text-slate-400" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-slate-100 text-slate-700 border border-slate-200 uppercase">
                    Rank #2 Silver
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-base text-slate-900 tracking-tight">{top2.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-slate-700 font-mono">{top2.rating}</span>
                    <span className="text-xs font-bold text-slate-500 font-mono">ELO</span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Số trận thắng: <strong className="text-indigo-600 font-mono">{top2.duels}</strong></span>
                </div>
              </div>
            ) : null}

            {/* Rank 1 - Gold */}
            {top1 ? (
              <div className="order-1 md:order-2 bg-gradient-to-b from-amber-500/10 via-amber-50/50 to-white border-2 border-amber-400 rounded-2xl p-6 shadow-md flex flex-col justify-between relative overflow-hidden transform md:-translate-y-2">
                <div className="absolute top-0 right-0 p-3 opacity-20">
                  <Trophy className="h-24 w-24 text-amber-500" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-extrabold font-mono px-3 py-1 rounded-full bg-amber-500 text-white uppercase flex items-center gap-1 shadow-2xs">
                    <Trophy className="h-3 w-3" /> Champion #1
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-black text-lg text-slate-900 tracking-tight">{top1.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-3xl font-black text-amber-600 font-mono">{top1.rating}</span>
                    <span className="text-xs font-extrabold text-amber-700 font-mono">ELO</span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-amber-200/60 flex items-center justify-between text-xs font-semibold text-slate-600">
                  <span>Số trận thắng: <strong className="text-emerald-600 font-mono text-sm">{top1.duels}</strong></span>
                </div>
              </div>
            ) : null}

            {/* Rank 3 - Bronze */}
            {top3 ? (
              <div className="order-3 bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs flex flex-col justify-between relative overflow-hidden">
                <div className="absolute top-0 right-0 p-3 opacity-10">
                  <Medal className="h-20 w-20 text-amber-700" />
                </div>
                <div className="flex items-center justify-between mb-3">
                  <span className="text-[10px] font-bold font-mono px-2.5 py-0.5 rounded-full bg-amber-100/60 text-amber-800 border border-amber-200 uppercase">
                    Rank #3 Bronze
                  </span>
                </div>
                <div className="space-y-1">
                  <p className="font-extrabold text-base text-slate-900 tracking-tight">{top3.name}</p>
                  <div className="flex items-baseline gap-2">
                    <span className="text-2xl font-black text-amber-800 font-mono">{top3.rating}</span>
                    <span className="text-xs font-bold text-slate-500 font-mono">ELO</span>
                  </div>
                </div>
                <div className="pt-3 mt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500 font-medium">
                  <span>Số trận thắng: <strong className="text-indigo-600 font-mono">{top3.duels}</strong></span>
                </div>
              </div>
            ) : null}
          </div>
        ) : (
          <div className="bg-white border border-slate-200 rounded-2xl p-8 text-center text-slate-500 shadow-2xs space-y-2">
            <Trophy className="h-10 w-10 text-amber-500/40 mx-auto" />
            <p className="font-bold text-sm text-slate-900">Chưa có người chơi nào hoàn thành 5 trận phân hạng.</p>
            <p className="text-xs text-slate-500">Hãy tham gia thi đấu Arena 3x3x3 để trở thành người đầu tiên có tên trên Bảng xếp hạng!</p>
          </div>
        )}

        {/* User stats overview and Live Matches */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Personal rating indicator */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl flex flex-col justify-between shadow-2xs relative overflow-hidden lg:col-span-2 text-slate-900">
            <div className="space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono flex items-center gap-1">
                    <Sparkles className="h-3 w-3" /> Thông Tin Hồ Sơ Arena Của Bạn
                  </span>
                  <p className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight mt-1">
                    {isPlacementDone ? 'Đã Hoàn Thành Phân Hạng' : `Đang Phân Hạng (${placementDoneCount}/5 trận)`}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-xs text-slate-500 font-bold font-mono">3X3X3 ELO RATING</span>
                  <p className="text-2xl sm:text-3xl font-black text-amber-600 mt-0.5 font-mono">{userElo}</p>
                </div>
              </div>

              <div className="pt-4 border-t border-slate-100">
                <div className="flex justify-between text-xs text-slate-600 font-semibold mb-2">
                  <span>ELO Cao Nhất Ghi Nhận (Peak ELO):</span>
                  <span className="text-amber-700 font-mono font-bold">{userPeakElo} ELO</span>
                </div>
                <div className="h-2.5 w-full rounded-full bg-slate-100 overflow-hidden border border-slate-200">
                  <div
                    className="h-full rounded-full bg-amber-500 transition-all duration-300"
                    style={{ width: `${Math.min(100, Math.max(10, (userElo / 3000) * 100))}%` }}
                  />
                </div>
              </div>
            </div>

            <div className="flex flex-wrap items-center justify-between gap-4 text-xs pt-4 text-slate-500 font-semibold border-t border-slate-100 mt-4 font-mono">
              <span className="flex items-center gap-1.5">
                <Flame className="h-4 w-4 text-amber-500" /> Trận thắng: <strong className="text-emerald-600">{totalWins}</strong> / <strong className="text-slate-900">{totalMatches} trận</strong>
              </span>
              <span>Trạng thái ELO: <strong className="text-slate-900">{isPlacementDone ? 'Công Khai' : 'Tạm Ẩn'}</strong></span>
            </div>
          </div>

          {/* Live Recent Feed */}
          <div className="bg-white border border-slate-200 p-6 rounded-2xl space-y-4 shadow-2xs text-slate-900">
            <h3 className="text-xs font-bold uppercase tracking-wider text-amber-600 font-mono flex items-center gap-2">
              <Clock className="h-4 w-4 text-amber-500" />
              Lịch Sử Trận Gần Đây
            </h3>
            {recentMatches.length > 0 ? (
              <div className="space-y-3">
                {recentMatches.map((match) => (
                  <div key={match.matchId} className="rounded-xl border border-slate-100 bg-slate-50 p-3 hover:border-amber-300 transition">
                    <div className="flex items-center justify-between gap-3 text-xs font-bold text-slate-900">
                      <span>{match.meUsername}</span>
                      <span className="text-[10px] text-slate-400 font-mono">VS</span>
                      <span>{match.opponentUsername}</span>
                    </div>
                    <div className="mt-2 flex items-center justify-between text-[11px] font-semibold">
                      <span className={match.isWinner ? 'text-emerald-600 font-bold' : match.isDraw ? 'text-amber-600 font-bold' : 'text-rose-500 font-bold'}>
                        {match.isWinner ? 'Chiến Thắng' : match.isDraw ? 'Hòa' : 'Thất Bại'}
                        {match.eloChange !== 0 && (
                          <span className={`text-[10px] ml-1.5 px-1.5 py-0.2 rounded font-bold font-mono border ${match.eloChange > 0 ? 'bg-emerald-50 text-emerald-700 border-emerald-200' : 'bg-rose-50 text-rose-700 border-rose-200'
                            }`}>
                            {match.eloChange > 0 ? `+${match.eloChange}` : match.eloChange}
                          </span>
                        )}
                      </span>
                      <span className="font-mono text-slate-600">
                        {match.meTimeMs ? `${(match.meTimeMs / 1000).toFixed(2)}s` : 'DNF'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="py-6 text-center text-xs text-slate-400 italic">
                Chưa có dữ liệu lịch sử trận đấu gần đây.
              </div>
            )}
          </div>
        </div>

        {/* Division Filter and Leaderboard Search */}
        <div className="flex flex-col md:flex-row justify-between items-stretch md:items-center gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
          <div className="flex flex-wrap gap-2">
            {divisions.map((division) => (
              <button
                key={division.id}
                onClick={() => setSelectedDivision(division.id)}
                className={`px-4 py-2 rounded-xl border text-xs font-bold transition cursor-pointer font-mono ${selectedDivision === division.id
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
          {filteredRankings.length > 0 ? (
            <>
              {/* Desktop Table View */}
              <div className="hidden md:block">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="border-b border-slate-200 bg-slate-50 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                        <th className="px-6 py-4">Hạng</th>
                        <th className="px-6 py-4">Đấu Thủ 3x3x3</th>
                        <th className="px-6 py-4 text-center">ELO Rating</th>
                        <th className="px-6 py-4 text-center">Tổng Số Trận Thắng</th>
                        <th className="px-6 py-4 text-center">Xu Hướng</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100 text-slate-900">
                      {filteredRankings.map((player) => {
                        const isUser = myProfile?.userId && player.userId === myProfile.userId;
                        return (
                          <tr
                            key={player.rank}
                            className={`hover:bg-slate-50 transition-colors ${isUser ? 'bg-amber-50/60 font-semibold' : ''
                              }`}
                          >
                            <td className="px-6 py-4">
                              <div className="flex items-center gap-2.5">
                                {player.rank <= 3 ? (
                                  <Trophy
                                    className={`h-4.5 w-4.5 ${player.rank === 1
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
                                <span className="font-bold text-slate-900 hover:text-amber-600 cursor-pointer transition-colors text-xs">
                                  {player.name}
                                </span>
                                {isUser && (
                                  <span className="text-[9px] font-bold px-1.5 py-0.2 rounded bg-amber-500 text-white font-mono uppercase">
                                    BẠN
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
                              {player.duels} trận
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
                        <span className="font-bold text-xs text-slate-900">{player.name}</span>
                      </div>
                      <span className="font-extrabold text-amber-600 font-mono text-xs">{player.rating} ELO</span>
                    </div>
                    <div className="flex items-center justify-between text-[11px] text-slate-500 font-mono pt-1">
                      <span>Số trận thắng: <strong className="text-slate-900">{player.duels}</strong></span>
                      <div className="flex items-center gap-1">{getChangeIcon(player.change)}</div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="py-12 text-center text-slate-500 space-y-2">
              <p className="font-bold text-sm text-slate-900">Không tìm thấy dữ liệu đấu thủ nào.</p>
              <p className="text-xs text-slate-400">Các đấu thủ hoàn thành đủ 5 trận phân hạng sẽ được hiển thị tại đây.</p>
            </div>
          )}
        </div>
      </div>
    </main>
  );
}
