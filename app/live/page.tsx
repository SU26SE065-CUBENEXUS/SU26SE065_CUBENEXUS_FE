'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPublicLiveTournaments, type PublicLiveTournamentDto } from '@/lib/api/live';
import {
  Trophy,
  MapPin,
  Calendar,
  Search,
  RefreshCw,
  Layers,
  ArrowRight,
  CalendarDays,
  ChevronDown
} from 'lucide-react';

function formatDate(dateStr: string): string {
  const date = new Date(dateStr);
  return date.toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });
}

export default function PublicLiveTournamentsPage() {
  const [tournaments, setTournaments] = useState<PublicLiveTournamentDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | 'LIVE' | 'UPCOMING' | 'COMPLETED'>('ALL');
  const [visibleCount, setVisibleCount] = useState<number>(3);

  const fetchTournaments = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPublicLiveTournaments();
      setTournaments(data);
    } catch (err) {
      console.error('Error fetching public tournaments:', err);
      setError('Failed to load tournaments. Please check your connection and try again.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    setVisibleCount(3);
  }, [searchQuery, statusFilter]);

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

  const displayedTournaments = filteredTournaments.slice(0, visibleCount);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden font-sans">
      {/* Background gradients for soft accent */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-orange-500/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-amber-500/5 blur-[100px] pointer-events-none" />

      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">

        {/* Banner section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 border border-orange-500/20 px-3.5 py-1 text-[11px] font-bold uppercase tracking-widest text-orange-500 mb-4 shadow-2xs font-mono">
            <Trophy className="h-3.5 w-3.5 text-orange-500" /> CubeNexus Live Portal
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground uppercase mb-4 leading-tight">
            Follow Live <span className="text-orange-500 font-black">Tournaments</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed font-medium">
            Spectate official speedcubing tournaments in real-time. View group assignments, live solves, stations, and rankings instantly.
          </p>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-card border border-border p-4 rounded-2xl shadow-2xs">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tournaments by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-background text-xs text-foreground placeholder-muted-foreground/60 outline-none focus:border-orange-500 focus:bg-background transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex overflow-x-auto w-full md:w-auto scrollbar-none gap-1 bg-muted p-1 rounded-xl border border-border">
            {(['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider whitespace-nowrap transition-all cursor-pointer ${statusFilter === tab
                    ? 'bg-orange-500 text-white shadow-2xs font-extrabold'
                    : 'text-muted-foreground hover:text-foreground hover:bg-muted/80'
                  }`}
              >
                {tab === 'LIVE' ? (
                  <span className="flex items-center gap-1.5 font-mono">
                    <span className="h-1.5 w-1.5 rounded-full bg-red-400 animate-pulse" />
                    LIVE BOARD
                  </span>
                ) : (
                  tab
                )}
              </button>
            ))}
          </div>
        </div>

        {/* Tournament Grid / States */}
        {isLoading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-border bg-card p-6 space-y-4 animate-pulse shadow-2xs">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded-2xl" />
                <div className="h-10 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="max-w-md mx-auto text-center py-16 px-4 rounded-3xl border border-red-200 bg-red-50">
            <RefreshCw className="h-10 w-10 text-red-500 mx-auto mb-4" />
            <h3 className="font-bold text-base text-red-900 mb-2">Could Not Load Tournaments</h3>
            <p className="text-xs text-red-700 mb-6 leading-relaxed font-medium">{error}</p>
            <button
              onClick={fetchTournaments}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-xs font-bold text-white hover:bg-red-700 transition shadow-2xs cursor-pointer border-none"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : filteredTournaments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-card border border-dashed border-border rounded-3xl max-w-xl mx-auto shadow-2xs">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg text-foreground mb-1">No Tournaments Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed font-medium">
              We couldn't find any tournaments matching your filters. Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          /* Tournament cards listing (limited to 3 initially) */
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {displayedTournaments.map((t) => {
                let statusText = 'Sắp Diễn Ra';
                let badgeStyle = 'border-blue-200 text-blue-700 bg-blue-50';
                let ctaStyle = 'bg-orange-500 hover:bg-orange-600 text-white shadow-orange-500/15';
                let ctaLabel = 'Xem Lịch Thi Đấu';

                const codeUpper = (t.status || '').toUpperCase();

                if (t.isLive) {
                  statusText = 'ĐANG THI ĐẤU (LIVE)';
                  badgeStyle = 'border-red-200 text-red-700 bg-red-50 font-extrabold';
                  ctaStyle = 'bg-red-600 hover:bg-red-700 text-white shadow-2xs';
                  ctaLabel = 'Xem Bảng Live';
                } else if (codeUpper === 'ONGOING') {
                  statusText = 'Đang Thi Đấu';
                  badgeStyle = 'border-purple-200 text-purple-700 bg-purple-50 font-bold';
                  ctaStyle = 'bg-purple-600 hover:bg-purple-700 text-white shadow-2xs';
                  ctaLabel = 'Xem Bảng Live';
                } else if (codeUpper === 'COMPLETED') {
                  statusText = 'Đã Hoàn Thành';
                  badgeStyle = 'border-border text-muted-foreground bg-muted';
                  ctaStyle = 'bg-muted hover:bg-muted/80 text-foreground border border-border';
                  ctaLabel = 'Xem Kết Quả';
                } else if (codeUpper === 'REGISTRATION_OPEN') {
                  statusText = 'Mở Đăng Ký';
                  badgeStyle = 'border-emerald-200 text-emerald-700 bg-emerald-50';
                  ctaLabel = 'Xem Chi Tiết';
                } else if (codeUpper === 'REGISTRATION_CLOSED') {
                  statusText = 'Đóng Đăng Ký';
                  badgeStyle = 'border-amber-200 text-amber-700 bg-amber-50';
                  ctaLabel = 'Xem Lịch Thi Đấu';
                } else if (codeUpper === 'CANCELLED') {
                  statusText = 'Đã Hủy';
                  badgeStyle = 'border-red-200 text-red-700 bg-red-50';
                  ctaLabel = 'Xem Chi Tiết';
                } else if (codeUpper === 'PUBLISHED') {
                  statusText = 'Công Bố / Sắp Khởi Tranh';
                  badgeStyle = 'border-blue-200 text-blue-700 bg-blue-50';
                  ctaLabel = 'Xem Lịch Thi Đấu';
                }

                return (
                  <div
                    key={t.id}
                    className="group relative rounded-3xl border border-border bg-card p-6 flex flex-col justify-between hover:border-orange-500/50 hover:shadow-md transition-all duration-300"
                  >
                    <div className="space-y-4">
                      {/* Header: badge + isLive */}
                      <div className="flex justify-between items-center">
                        <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                          {t.isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping mr-0.5" />}
                          {statusText}
                        </span>
                        {/* <span className="text-[10px] text-muted-foreground font-mono font-medium">
                          {t.id.slice(0, 8)}
                        </span> */}
                      </div>

                      {/* Name and description */}
                      <div>
                        <h2 className="text-lg font-bold text-foreground group-hover:text-orange-500 transition-colors tracking-tight leading-tight uppercase">
                          {t.name}
                        </h2>
                        {t.description && (
                          <p className="text-xs text-muted-foreground mt-1 line-clamp-2 leading-relaxed font-medium">
                            {t.description}
                          </p>
                        )}
                      </div>

                      {/* Metadata details */}
                      <div className="space-y-2 pt-2 border-t border-border text-xs text-muted-foreground font-medium">
                        <div className="flex items-center gap-2">
                          <MapPin className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                          <span className="truncate">{t.location || 'Offline Location'}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                          <span>
                            {formatDate(t.startTime)} – {formatDate(t.endTime)}
                          </span>
                        </div>
                        <div className="flex items-center gap-2">
                          <Layers className="h-4.5 w-4.5 text-orange-500 shrink-0" />
                          <span>{t.eventsCount} Hạng mục thi đấu</span>
                        </div>
                      </div>
                    </div>

                    {/* CTA Button */}
                    <div className="mt-6 pt-2">
                      <Link
                        href={`/live/${t.id}`}
                        className={`w-full inline-flex items-center justify-center gap-2 rounded-xl py-3 text-xs font-bold transition-all ${ctaStyle}`}
                      >
                        <span>{ctaLabel}</span>
                        <ArrowRight className="h-3.5 w-3.5 group-hover:translate-x-1 transition-transform" />
                      </Link>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Show More Button */}
            {filteredTournaments.length > visibleCount && (
              <div className="text-center mt-10">
                <button
                  onClick={() => setVisibleCount((prev) => prev + 3)}
                  className="px-6 py-3 rounded-2xl bg-card hover:bg-muted border border-border text-xs font-extrabold text-orange-500 hover:text-orange-600 transition-all shadow-2xs inline-flex items-center gap-2 cursor-pointer font-mono"
                >
                  <span>XEM THÊM GIẢI ĐẤU ({filteredTournaments.length - visibleCount} GIẢI CÒN LẠI)</span>
                  <ChevronDown className="h-4 w-4" />
                </button>
              </div>
            )}
          </>
        )}

      </main>

      <Footer />
    </div>
  );
}
