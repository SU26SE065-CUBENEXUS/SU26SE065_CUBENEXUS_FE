'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getEventCompetitors } from '@/lib/api/tournaments';
import type { TournamentDetailDto, EventDetailDto, EventCompetitorDto } from '@/lib/api/types';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import {
  ChevronRight,
  Trophy,
  Loader2,
  AlertCircle,
  Users,
  RefreshCw,
  Search,
  ChevronDown,
  ChevronUp,
  Clock,
  Edit3,
} from 'lucide-react';

function msToDisplay(ms?: number | null): string {
  if (!ms) return '—';
  const totalSec = ms / 1000;
  if (totalSec >= 60) {
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(2);
    return `${min}:${sec.padStart(5, '0')}`;
  }
  return `${totalSec.toFixed(2)}s`;
}

const MOCK_COMPETITORS: EventCompetitorDto[] = [
  { registrationEventId: 'RE001', userId: 'U001', displayName: 'Nguyen Minh Khoa', email: 'khoa@gmail.com', seedTimeMs: 11240, seedSourceCode: 'PRACTICE_AO5' },
  { registrationEventId: 'RE002', userId: 'U002', displayName: 'Tran Bao Long', email: 'long@gmail.com', seedTimeMs: 9870, seedSourceCode: 'OFFICIAL_RESULT' },
  { registrationEventId: 'RE003', userId: 'U003', displayName: 'Le Thi Hoa', email: 'hoa@gmail.com' },
  { registrationEventId: 'RE004', userId: 'U004', displayName: 'Pham Duc Anh', email: 'anh@gmail.com', seedTimeMs: 14500, seedSourceCode: 'DEFAULT' },
  { registrationEventId: 'RE005', userId: 'U005', displayName: 'Do Quang Huy', email: 'huy@gmail.com', seedTimeMs: 12300, seedSourceCode: 'MANUAL_OVERRIDE' },
];

function EventCompetitorPanel({
  event,
  tournamentId,
}: {
  event: EventDetailDto;
  tournamentId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [competitors, setCompetitors] = useState<EventCompetitorDto[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [fetched, setFetched] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [search, setSearch] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    setCurrentPage(1);
  }, [search]);

  const loadCompetitors = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getEventCompetitors(event.id);
      setCompetitors(data);
    } catch (err) {
      console.warn('API unavailable, using mock competitor data:', err);
      setCompetitors(MOCK_COMPETITORS);
    } finally {
      setIsLoading(false);
      setFetched(true);
    }
  }, [event.id]);

  const handleToggle = () => {
    setExpanded((v) => !v);
    if (!fetched) {
      loadCompetitors();
    }
  };

  const filtered = competitors.filter(
    (c) =>
      c.displayName.toLowerCase().includes(search.toLowerCase()) ||
      (c.email && c.email.toLowerCase().includes(search.toLowerCase()))
  );

  const totalPages = Math.ceil(filtered.length / itemsPerPage);
  const paginated = filtered.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  const SOURCE_BADGE: Record<string, string> = {
    OFFICIAL_RESULT: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20',
    PRACTICE_AO5: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20',
    MANUAL_OVERRIDE: 'bg-orange-500/10 text-orange-600 dark:text-orange-400 border border-orange-500/20',
    DEFAULT: 'bg-muted text-muted-foreground border border-border',
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={handleToggle}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition"
      >
        <div>
          <div className="flex items-center gap-2">
            <span className="font-bold text-foreground text-sm">
              {event.puzzleTypeName || event.puzzleTypeCode}
            </span>
            {event.eventFormatCode === 'MEDLEY' && (
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                MEDLEY
              </span>
            )}
          </div>
          <p className="text-xs text-muted-foreground mt-0.5">{event.solveCount} solves</p>
        </div>
        <div className="flex items-center gap-3">
          {fetched && (
            <span className="rounded-full bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
              {competitors.length} registered
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5">
          {/* Search + Refresh */}
          <div className="flex items-center gap-3 mt-4 mb-3">
            <div className="relative flex-1">
              <Search className="absolute h-3.5 w-3.5 text-muted-foreground" style={{ left: '0.75rem', top: '50%', transform: 'translateY(-50%)' }} />
              <input
                type="text"
                placeholder="Search by name or email..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 pr-3 py-2 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition"
                style={{ paddingLeft: '2.25rem' }}
              />
            </div>
            <button
              onClick={loadCompetitors}
              disabled={isLoading}
              className="flex items-center gap-1.5 rounded-xl border border-border bg-card px-3 py-2 text-xs text-muted-foreground hover:bg-muted/50 transition shadow-sm"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : filtered.length === 0 ? (
            <div className="py-10 text-center">
              <Users className="h-8 w-8 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-xs text-muted-foreground">
                {search ? 'No competitors match your search.' : 'No competitors registered yet.'}
              </p>
            </div>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Competitor</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">
                        <span className="flex items-center gap-1"><Clock className="h-3 w-3" />Seed Time</span>
                      </th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Source</th>
                      <th className="px-4 py-2.5 text-right text-xs font-semibold text-muted-foreground">Override</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {paginated.map((c, i) => {
                      const actualIdx = (currentPage - 1) * itemsPerPage + i + 1;
                      return (
                        <tr key={c.registrationEventId} className="hover:bg-muted/30 transition">
                          <td className="px-4 py-3 text-xs text-muted-foreground font-medium">{actualIdx}</td>
                          <td className="px-4 py-3 font-semibold text-foreground">{c.displayName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.email || '—'}</td>
                          <td className="px-4 py-3 font-mono text-sm text-foreground">
                            {msToDisplay(c.seedTimeMs)}
                          </td>
                          <td className="px-4 py-3">
                            {c.seedSourceCode ? (
                              <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${SOURCE_BADGE[c.seedSourceCode] ?? 'bg-muted text-muted-foreground'}`}>
                                {c.seedSourceCode.replace('_', ' ')}
                              </span>
                            ) : (
                              <span className="text-xs text-muted-foreground/45">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3 text-right">
                            <Link
                              href={`/managertournaments/${tournamentId}/events`}
                              className="inline-flex items-center gap-1 rounded-lg border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-semibold text-primary hover:bg-primary/20 transition"
                            >
                              <Edit3 className="h-3 w-3" />
                              Override
                            </Link>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Pagination controls */}
              {totalPages > 1 && (
                <div className="flex items-center justify-between border-t border-border/60 pt-4 flex-wrap gap-4">
                  <span className="text-xs text-muted-foreground font-semibold">
                    Hiển thị {Math.min(filtered.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(filtered.length, currentPage * itemsPerPage)} trên {filtered.length} đối thủ
                  </span>
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                      disabled={currentPage === 1}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Trước
                    </button>
                    <span className="text-xs font-bold text-foreground">
                      Trang {currentPage} / {totalPages}
                    </span>
                    <button
                      onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                      disabled={currentPage === totalPages}
                      className="rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-bold hover:bg-muted/50 disabled:opacity-50 disabled:pointer-events-none transition"
                    >
                      Sau
                    </button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Summary Footer */}
          {!isLoading && filtered.length > 0 && (
            <div className="mt-3 flex items-center gap-4 text-xs text-muted-foreground">
              <span>{filtered.length} of {competitors.length} shown</span>
              <span>·</span>
              <span>{competitors.filter((c) => c.seedTimeMs).length} with seed time</span>
              <span>·</span>
              <span>{competitors.filter((c) => !c.seedTimeMs).length} without seed</span>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function RegistrationManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const data = await getTournamentById(id);
        setTournament(data);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error ?? 'Tournament not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-7 flex-wrap">
        <Trophy className="h-3.5 w-3.5" />
        <Link href="/managertournaments" className="hover:text-foreground transition-colors">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/managertournaments/${id}`} className="hover:text-foreground transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold">Registrations</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Registration Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            View all competitors registered per event, their seed times, and source.
          </p>
        </div>
        <StatusBadge status={tournament.statusCode} />
      </div>


      {/* Event accordion list */}
      <div className="flex items-center gap-2 mb-4">
        <Users className="h-4 w-4 text-primary" />
        <h2 className="font-bold text-foreground text-sm uppercase tracking-wider">Competitors by Event</h2>
        
      </div>

      {tournament.events.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <p className="font-semibold text-sm">No events configured.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournament.events
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((event) => (
              <EventCompetitorPanel key={event.id} event={event} tournamentId={id} />
            ))}
        </div>
      )}
    </div>
  );
}
