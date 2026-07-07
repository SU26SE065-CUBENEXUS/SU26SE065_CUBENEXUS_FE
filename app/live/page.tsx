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
  Filter,
  Zap, 
  RefreshCw, 
  Layers, 
  ArrowRight,
  Loader2,
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

export default function PublicLiveTournamentsPage() {
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

  const filteredTournaments = tournaments.filter((t) => {
    // Search filter
    const matchesSearch = 
      t.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.location && t.location.toLowerCase().includes(searchQuery.toLowerCase()));

    // Status filter
    if (!matchesSearch) return false;
    if (statusFilter === 'ALL') return true;
    if (statusFilter === 'LIVE') return t.isLive;
    if (statusFilter === 'UPCOMING') return t.status === 'REGISTRATION_OPEN' || t.status === 'PUBLISHED';
    if (statusFilter === 'COMPLETED') return t.status === 'COMPLETED';
    return true;
  });

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Background gradients for premium wow factor */}
      <div className="absolute top-0 right-0 w-[500px] h-[500px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />
      <div className="absolute bottom-20 left-0 w-[400px] h-[400px] rounded-full bg-accent/5 blur-[100px] pointer-events-none" />
      
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-10 sm:px-6 lg:px-8 relative z-10">
        
        {/* Banner section */}
        <div className="text-center max-w-3xl mx-auto mb-12">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-primary/10 border border-primary/20 px-3.5 py-1 text-[11px] font-extrabold uppercase tracking-widest text-primary mb-4">
            <Trophy className="h-3.5 w-3.5" /> CubeNexus Live Portal
          </span>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tight text-foreground uppercase mb-4 leading-tight">
            Follow Live <span className="text-primary font-extrabold">Tournaments</span>
          </h1>
          <p className="text-muted-foreground text-sm sm:text-base leading-relaxed">
            Spectate official speedcubing tournaments in real-time. View group assignments, live solves, stations, and rankings instantly.
          </p>
        </div>

        {/* Filters and search bar */}
        <div className="flex flex-col md:flex-row gap-4 justify-between items-center mb-8 bg-card/40 backdrop-blur-md border border-border/60 p-4 rounded-2xl shadow-xl">
          {/* Search Input */}
          <div className="relative w-full md:max-w-md">
            <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search tournaments by name or location..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl border border-border bg-muted/10 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition"
            />
          </div>

          {/* Filter tabs */}
          <div className="flex overflow-x-auto w-full md:w-auto scrollbar-none gap-1 bg-muted/20 p-1 rounded-xl">
            {(['ALL', 'LIVE', 'UPCOMING', 'COMPLETED'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setStatusFilter(tab)}
                className={`px-4 py-2 rounded-lg text-[10px] font-extrabold uppercase tracking-wider whitespace-nowrap transition-all ${
                  statusFilter === tab
                    ? 'bg-primary text-primary-foreground shadow-md'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'LIVE' ? (
                  <span className="flex items-center gap-1.5">
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

        {/* Tournament Grid / States */}
        {isLoading ? (
          /* Loading skeletons */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((n) => (
              <div key={n} className="rounded-3xl border border-border bg-card/30 p-6 space-y-4 animate-pulse">
                <div className="h-4 bg-muted rounded w-2/3" />
                <div className="h-3 bg-muted rounded w-1/2" />
                <div className="h-12 bg-muted rounded-2xl" />
                <div className="h-10 bg-muted rounded-xl" />
              </div>
            ))}
          </div>
        ) : error ? (
          /* Error State */
          <div className="max-w-md mx-auto text-center py-16 px-4 rounded-3xl border border-red-500/10 bg-red-500/5">
            <RefreshCw className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h3 className="font-extrabold text-base mb-2">Could Not Load Tournaments</h3>
            <p className="text-xs text-muted-foreground mb-6 leading-relaxed">{error}</p>
            <button
              onClick={fetchTournaments}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition shadow-lg shadow-primary/10"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : filteredTournaments.length === 0 ? (
          /* Empty State */
          <div className="text-center py-20 bg-card/20 border border-dashed border-border rounded-3xl max-w-xl mx-auto">
            <CalendarDays className="h-12 w-12 text-muted-foreground/30 mx-auto mb-4" />
            <h3 className="font-bold text-lg mb-1">No Tournaments Found</h3>
            <p className="text-xs text-muted-foreground max-w-sm mx-auto leading-relaxed">
              We couldn't find any tournaments matching your filters. Try adjusting your search query or status filter.
            </p>
          </div>
        ) : (
          /* Tournament cards listing */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTournaments.map((t) => {
              // Custom badge styling depending on state
              let statusText = 'Upcoming';
              let badgeStyle = 'border-blue-500/20 text-blue-400 bg-blue-500/5';
              let ctaStyle = 'bg-primary hover:bg-primary/90 text-primary-foreground';
              let ctaLabel = 'View Schedule';

              if (t.isLive) {
                statusText = 'LIVE NOW';
                badgeStyle = 'border-red-500/30 text-red-500 bg-red-500/8 animate-pulse-glow';
                ctaStyle = 'bg-red-600 hover:bg-red-500 text-white shadow-lg shadow-red-500/20';
                ctaLabel = 'Watch Live Board';
              } else if (t.status === 'COMPLETED') {
                statusText = 'Completed';
                badgeStyle = 'border-muted-foreground/20 text-muted-foreground bg-muted/5';
                ctaStyle = 'bg-muted hover:bg-muted/80 text-foreground';
                ctaLabel = 'View Results';
              } else if (t.status === 'REGISTRATION_OPEN') {
                statusText = 'Registration Open';
                badgeStyle = 'border-emerald-500/20 text-emerald-400 bg-emerald-500/5';
              }

              return (
                <div
                  key={t.id}
                  className="group relative rounded-3xl border border-border/80 bg-card/40 backdrop-blur-md p-6 flex flex-col justify-between hover:border-primary/40 hover:shadow-2xl transition-all duration-300"
                >
                  <div className="space-y-4">
                    {/* Header: badge + isLive */}
                    <div className="flex justify-between items-center">
                      <span className={`inline-flex items-center gap-1 rounded-full border px-2.5 py-0.5 text-[9px] font-bold uppercase tracking-wider ${badgeStyle}`}>
                        {t.isLive && <span className="h-1.5 w-1.5 rounded-full bg-red-500 animate-ping mr-0.5" />}
                        {statusText}
                      </span>
                      <span className="text-[10px] text-muted-foreground/40 font-mono">
                        {t.id.slice(0, 8)}
                      </span>
                    </div>

                    {/* Name and description */}
                    <div>
                      <h2 className="text-lg font-black text-foreground group-hover:text-primary transition-colors tracking-tight leading-tight uppercase">
                        {t.name}
                      </h2>
                      {t.description && (
                        <p className="text-[11px] text-muted-foreground/80 mt-1 line-clamp-2 leading-relaxed">
                          {t.description}
                        </p>
                      )}
                    </div>

                    {/* Metadata details */}
                    <div className="space-y-2 pt-2 border-t border-border/40 text-xs text-muted-foreground">
                      <div className="flex items-center gap-2">
                        <MapPin className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span className="truncate">{t.location || 'Offline Location'}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span>
                          {formatDate(t.startTime)} – {formatDate(t.endTime)}
                        </span>
                      </div>
                      <div className="flex items-center gap-2">
                        <Layers className="h-4.5 w-4.5 text-primary shrink-0" />
                        <span>{t.eventsCount} Events configured</span>
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
        )}

      </main>

      <Footer />
    </div>
  );
}
