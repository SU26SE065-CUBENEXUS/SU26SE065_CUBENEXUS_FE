'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { getPublicLiveTournaments, type PublicLiveTournamentDto } from '@/lib/api/live';
import {
  Trophy,
  MapPin,
  Calendar,
  Search,
  RefreshCw,
  Layers,
  ArrowRight,
  ChevronRight,
  CalendarDays
} from 'lucide-react';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export function LiveSection() {
  const [tournaments, setTournaments] = useState<PublicLiveTournamentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');

  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPublicLiveTournaments();
      setTournaments(data || []);
    } catch (err) {
      console.error('Error fetching public tournaments for home section:', err);
      setError('Failed to load tournaments.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  const filteredTournaments = tournaments.filter((t) => {
    const matchesSearch =
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));

    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;

    const s = (t.status || '').toUpperCase();
    if (statusFilter === 'LIVE') return t.isLive || s === 'ONGOING';
    if (statusFilter === 'UPCOMING') return s === 'REGISTRATION_OPEN' || s === 'REGISTRATION_CLOSED' || s === 'PUBLISHED' || s === 'DRAFT';
    if (statusFilter === 'COMPLETED') return s === 'COMPLETED';
    return true;
  });

  // Always limit to 3 items on Home page
  const displayedTournaments = filteredTournaments.slice(0, 3);

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      {/* Section Title */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 mb-8">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-red-500/10 border border-red-500/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-red-500 mb-3 font-mono">
            <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
            LIVE SPECTATE & TOURNAMENTS
          </span>
          <h2 className="text-3xl sm:text-4xl font-black tracking-tight text-foreground uppercase">
            Trực Tiếp <span className="text-amber-500">Giải Đấu Rubik</span>
          </h2>
          <p className="text-sm text-muted-foreground mt-1 max-w-xl font-medium">
            Theo dõi diễn biến trực tiếp, lịch thi đấu và bảng xếp hạng thời gian thực của các giải đấu Rubik công khai.
          </p>
        </div>

        <Link
          href="/live"
          className="inline-flex items-center gap-2 text-xs font-extrabold uppercase tracking-wider text-amber-500 hover:text-amber-400 transition-colors shrink-0 group font-mono"
        >
          <span>Xem Tất Cả Trực Tiếp</span>
          <ChevronRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
        </Link>
      </div>

      {/* Filters and search bar */}
      <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-card border border-border/60 p-4 rounded-2xl shadow-2xs">
        {/* Search Input */}
        <div className="relative w-full md:max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Tìm kiếm giải đấu theo tên hoặc địa điểm..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder-muted-foreground outline-none focus:border-amber-500 transition"
          />
        </div>

        {/* Filter tabs */}
        <div className="flex overflow-x-auto w-full md:w-auto scrollbar-none gap-1 bg-muted p-1 rounded-xl border border-border/60">
          {(['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => setStatusFilter(tab)}
              className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${
                statusFilter === tab
                  ? 'bg-amber-500 text-black shadow-2xs font-black'
                  : 'text-muted-foreground hover:text-foreground hover:bg-background/60'
              }`}
            >
              {tab === 'LIVE' ? (
                <span className="flex items-center gap-1.5 font-mono">
                  <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-pulse" />
                  LIVE BOARD
                </span>
              ) : (
                tab
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Tournament Cards (Only 3) */}
      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {[1, 2, 3].map((n) => (
            <div key={n} className="rounded-3xl border border-border/60 bg-card p-6 space-y-4 animate-pulse shadow-2xs">
              <div className="h-4 bg-muted rounded w-2/3" />
              <div className="h-3 bg-muted rounded w-1/2" />
              <div className="h-12 bg-muted rounded-2xl" />
              <div className="h-10 bg-muted rounded-xl" />
            </div>
          ))}
        </div>
      ) : error ? (
        <div className="text-center py-12 bg-card border border-rose-500/20 rounded-3xl p-6">
          <RefreshCw className="h-8 w-8 text-rose-500 mx-auto mb-3" />
          <p className="text-xs font-bold text-rose-400">{error}</p>
        </div>
      ) : displayedTournaments.length === 0 ? (
        <div className="text-center py-16 bg-card border border-dashed border-border/60 rounded-3xl shadow-2xs">
          <CalendarDays className="h-10 w-10 text-muted-foreground mx-auto mb-3" />
          <h3 className="font-bold text-sm text-foreground">Không Tìm Thấy Giải Đấu</h3>
          <p className="text-xs text-muted-foreground mt-1">
            Không có giải đấu nào phù hợp với bộ lọc tìm kiếm của bạn.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {displayedTournaments.map((t) => {
            let statusText = 'Sắp Diễn Ra';
            let badgeStyle = 'border-blue-500/20 text-blue-400 bg-blue-500/10';
            let ctaStyle = 'bg-amber-500 hover:bg-amber-400 text-black font-bold shadow-2xs';
            let ctaLabel = 'Xem Lịch Thi Đấu';

            const codeUpper = (t.status || '').toUpperCase();

            if (t.isLive) {
              statusText = 'ĐANG THI ĐẤU (LIVE)';
              badgeStyle = 'border-red-500/30 text-red-400 bg-red-500/10 font-extrabold';
              ctaStyle = 'bg-red-600 hover:bg-red-500 text-white font-bold shadow-2xs';
              ctaLabel = 'Xem Bảng Live';
            } else if (codeUpper === 'ONGOING') {
              statusText = 'Đang Thi Đấu';
              badgeStyle = 'border-purple-500/30 text-purple-400 bg-purple-500/10 font-bold';
              ctaStyle = 'bg-purple-600 hover:bg-purple-500 text-white font-bold shadow-2xs';
              ctaLabel = 'Xem Bảng Live';
            } else if (codeUpper === 'COMPLETED') {
              statusText = 'Đã Hoàn Thành';
              badgeStyle = 'border-border text-muted-foreground bg-muted';
              ctaStyle = 'bg-secondary text-secondary-foreground hover:bg-secondary/80';
              ctaLabel = 'Xem Kết Quả';
            }

            return (
              <div
                key={t.id}
                className="group relative rounded-3xl border border-border/60 bg-card p-6 flex flex-col justify-between hover:border-amber-500/50 hover:shadow-lg transition-all duration-300"
              >
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                      {t.isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping mr-0.5" />}
                      {statusText}
                    </span>
                    <span className="text-[10px] text-muted-foreground font-mono">
                      {t.id.slice(0, 8)}
                    </span>
                  </div>

                  <div>
                    <h3 className="text-base font-bold text-foreground group-hover:text-amber-400 transition-colors tracking-tight leading-tight uppercase">
                      {t.name}
                    </h3>
                    {t.description && (
                      <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-medium">
                        {t.description}
                      </p>
                    )}
                  </div>

                  <div className="space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground font-medium">
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-amber-500 shrink-0" />
                      <span className="truncate">{t.location || 'Offline Location'}</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>
                        {formatDate(t.startTime)} – {formatDate(t.endTime)}
                      </span>
                    </div>
                    <div className="flex items-center gap-2">
                      <Layers className="h-4 w-4 text-amber-500 shrink-0" />
                      <span>{t.eventsCount} Hạng mục</span>
                    </div>
                  </div>
                </div>

                <div className="mt-6 pt-2">
                  <Link
                    href={`/live/${t.id}`}
                    className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs uppercase tracking-wider transition-all ${ctaStyle}`}
                  >
                    <span>{ctaLabel}</span>
                    <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                  </Link>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </section>
  );
}
