'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getEventCompetitors, overrideSeed, closeEventRegistration } from '@/lib/api/tournaments';
import type { TournamentDetailDto, EventDetailDto, EventCompetitorDto } from '@/lib/api/types';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import { toast } from '@/lib/toast';
import { ConfirmationModal } from '@/components/tournament-manager/ConfirmationModal';
import {
  ChevronRight,
  Trophy,
  Clock,
  Scissors,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  Lock,
  Users,
  Edit3,
  CheckCircle,
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

function EventCard({
  event,
  tournamentId,
}: {
  event: EventDetailDto;
  tournamentId: string;
}) {
  const [expanded, setExpanded] = useState(false);
  const [competitors, setCompetitors] = useState<EventCompetitorDto[]>([]);
  const [loadingComp, setLoadingComp] = useState(false);
  const [closingReg, setClosingReg] = useState(false);
  const [isClosed, setIsClosed] = useState(false);
  const [editSeedId, setEditSeedId] = useState<string | null>(null);
  const [seedInput, setSeedInput] = useState('');
  const [showCloseConfirm, setShowCloseConfirm] = useState(false);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const closed = localStorage.getItem(`event_reg_closed_${event.id}`) === 'true';
      setIsClosed(closed);
    }
  }, [event.id]);

  const loadCompetitors = async () => {
    setLoadingComp(true);
    try {
      const data = await getEventCompetitors(event.id);
      setCompetitors(data);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to load competitors');
    } finally {
      setLoadingComp(false);
    }
  };

  const handleToggle = () => {
    setExpanded((v) => !v);
    if (!expanded && competitors.length === 0) {
      loadCompetitors();
    }
  };

  const handleCloseRegistration = async () => {
    setClosingReg(true);
    try {
      await closeEventRegistration(event.id);
      setIsClosed(true);
      if (typeof window !== 'undefined') {
        localStorage.setItem(`event_reg_closed_${event.id}`, 'true');
      }
      toast.success('Registration closed successfully.');
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to close registration');
    } finally {
      setClosingReg(false);
      setShowCloseConfirm(false);
    }
  };

  const handleSaveSeed = async (regEventId: string) => {
    const ms = parseInt(seedInput);
    if (isNaN(ms) || ms <= 0) {
      toast.error('Enter a valid seed time in milliseconds.');
      return;
    }
    try {
      await overrideSeed(regEventId, { seedTimeMs: ms });
      setCompetitors((prev) =>
        prev.map((c) =>
          c.registrationEventId === regEventId ? { ...c, seedTimeMs: ms } : c
        )
      );
      toast.success('Seed time updated successfully.');
      setEditSeedId(null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Failed to update seed');
    }
  };

  const isMedley = event.eventFormatCode === 'MEDLEY';
  const totalPages = Math.ceil(competitors.length / itemsPerPage);
  const paginated = competitors.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Header */}
      <div
        onClick={handleToggle}
        className="w-full flex items-center gap-4 px-5 py-4 text-left hover:bg-muted/30 transition cursor-pointer"
      >
        <div className="flex-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="font-bold text-foreground text-sm">
              {event.puzzleTypeName || event.puzzleTypeCode}
            </span>
            {isMedley && (
              <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                MEDLEY
              </span>
            )}
            <span className="rounded-full bg-muted border border-border px-2 py-0.5 text-[10px] font-semibold text-muted-foreground">
              {event.eventFormatCode}
            </span>
          </div>
          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
            {event.timeLimitMs && (
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Limit: {msToDisplay(event.timeLimitMs)}
              </span>
            )}
            {event.cutoffTimeMs && (
              <span className="flex items-center gap-1">
                <Scissors className="h-3 w-3" />
                Cutoff: {msToDisplay(event.cutoffTimeMs)}
              </span>
            )}
            <span>{event.solveCount} solves</span>
          </div>
          {isMedley && event.medleyPuzzles.length > 0 && (
            <div className="flex gap-1 mt-1.5 flex-wrap">
              {event.medleyPuzzles
                .sort((a, b) => a.sortOrder - b.sortOrder)
                .map((p) => (
                  <span
                    key={p.id}
                    className="rounded-md bg-purple-500/5 border border-purple-500/10 px-1.5 py-0.5 text-[9px] font-semibold text-purple-600 dark:text-purple-400"
                  >
                    {p.puzzleTypeName}
                  </span>
                ))}
            </div>
          )}
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowCloseConfirm(true);
            }}
            disabled={closingReg || isClosed}
            className={`inline-flex items-center gap-1.5 rounded-lg border px-3 py-1.5 text-xs font-semibold transition ${
              isClosed
                ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400 opacity-90 cursor-not-allowed'
                : 'border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10 disabled:opacity-50'
            }`}
          >
            {closingReg ? (
              <Loader2 className="h-3.5 w-3.5 animate-spin" />
            ) : isClosed ? (
              <CheckCircle className="h-3.5 w-3.5" />
            ) : (
              <Lock className="h-3.5 w-3.5" />
            )}
            {isClosed ? 'Registration Closed' : 'Close Reg.'}
          </button>
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown className="h-4 w-4 text-muted-foreground" />
          )}
        </div>
      </div>

      {/* Expanded: competitor list */}
      {expanded && (
        <div className="border-t border-border px-5 pb-5">
          <div className="mt-4 flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-4 w-4 text-muted-foreground" />
              <span className="text-xs font-semibold text-muted-foreground">
                Competitors ({competitors.length})
              </span>
            </div>
            <button
              onClick={loadCompetitors}
              disabled={loadingComp}
              className="text-xs text-primary hover:text-primary/80 flex items-center gap-1"
            >
              <RefreshCw className={`h-3 w-3 ${loadingComp ? 'animate-spin' : ''}`} />
              Refresh
            </button>
          </div>

          {loadingComp ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : competitors.length === 0 ? (
            <p className="text-center py-8 text-xs text-muted-foreground">No competitors yet.</p>
          ) : (
            <div className="space-y-4">
              <div className="overflow-x-auto rounded-xl border border-border">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="bg-muted/30 border-b border-border">
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">#</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Competitor</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Email</th>
                      <th className="px-4 py-2.5 text-left text-xs font-semibold text-muted-foreground">Seed Time</th>
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
                          <td className="px-4 py-3 text-sm font-semibold text-foreground">{c.displayName}</td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.email || '—'}</td>
                          <td className="px-4 py-3 text-sm font-mono text-foreground">
                            {msToDisplay(c.seedTimeMs)}
                          </td>
                          <td className="px-4 py-3 text-xs text-muted-foreground">{c.seedSourceCode ?? '—'}</td>
                          <td className="px-4 py-3 text-right">
                            {editSeedId === c.registrationEventId ? (
                              <div className="flex items-center gap-1.5 justify-end">
                                <input
                                  type="number"
                                  value={seedInput}
                                  onChange={(e) => setSeedInput(e.target.value)}
                                  placeholder="ms"
                                  className="w-24 rounded-lg border border-border bg-card px-2 py-1 text-xs text-foreground outline-none focus:border-primary"
                                />
                                <button
                                  onClick={() => handleSaveSeed(c.registrationEventId)}
                                  className="rounded-lg bg-primary px-2.5 py-1 text-xs font-bold text-primary-foreground hover:bg-primary/90 shadow-sm"
                                >
                                  Save
                                </button>
                                <button
                                  onClick={() => setEditSeedId(null)}
                                  className="rounded-lg border border-border px-2 py-1 text-xs text-muted-foreground hover:bg-muted/50"
                                >
                                  ✕
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => {
                                  setEditSeedId(c.registrationEventId);
                                  setSeedInput(String(c.seedTimeMs ?? ''));
                                }}
                                className="inline-flex items-center gap-1 rounded-lg border border-border px-2.5 py-1 text-xs font-semibold text-muted-foreground hover:bg-muted/50"
                              >
                                <Edit3 className="h-3 w-3" />
                                Override
                              </button>
                            )}
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
                    Hiển thị {Math.min(competitors.length, (currentPage - 1) * itemsPerPage + 1)} - {Math.min(competitors.length, currentPage * itemsPerPage)} trên {competitors.length} đối thủ
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
        </div>
      )}

      <ConfirmationModal
        isOpen={showCloseConfirm}
        title="Đóng Đăng ký Sự kiện"
        description={`Bạn có chắc chắn muốn đóng đăng ký cho sự kiện "${event.puzzleTypeName || event.puzzleTypeCode}"? Thí sinh sẽ không thể đăng ký sự kiện này nữa.`}
        confirmText="Đóng Đăng ký"
        cancelText="Hủy"
        variant="warning"
        isLoading={closingReg}
        onConfirm={handleCloseRegistration}
        onCancel={() => setShowCloseConfirm(false)}
      />
    </div>
  );
}

export default function EventConfigurationPage({
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
        <span className="text-foreground font-semibold">Events & Competitors</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Events & Competitors</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Configure events, view registered competitors, override seed times, and close registration.
          </p>
        </div>
        <StatusBadge status={tournament.statusCode} />
      </div>

      {tournament.events.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <p className="font-semibold">No events configured yet.</p>
          <p className="text-xs mt-1">Events are created when setting up the tournament.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournament.events
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((event) => (
              <EventCard key={event.id} event={event} tournamentId={id} />
            ))}
        </div>
      )}
    </div>
  );
}
