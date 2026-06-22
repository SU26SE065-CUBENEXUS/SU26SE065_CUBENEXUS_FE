'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTournamentById, generateGroups, generateScrambles } from '@/lib/api/tournaments';
import { startRound, lockRoundResults, completeRound, advanceRound, completeEvent } from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import {
  ChevronRight,
  Trophy,
  Shuffle,
  Layers,
  Loader2,
  AlertCircle,
  RefreshCw,
  Play,
  Lock,
  CheckCircle2,
  ChevronDown,
  ChevronUp,
  Zap,
  CheckCircle,
  Flag,
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

function EventGroupPanel({ event, tournamentId }: { event: EventDetailDto; tournamentId: string }) {
  const [expanded, setExpanded] = useState(false);
  const [groupSize, setGroupSize] = useState('8');
  const [stationCount, setStationCount] = useState('4');
  const [roundNumber, setRoundNumber] = useState('1');
  const [advanceCount, setAdvanceCount] = useState('8');
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const doAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(successMsg);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/30 transition"
      >
        <div>
          <span className="font-bold text-foreground text-sm">
            {event.puzzleTypeName || event.puzzleTypeCode}
          </span>
          {event.eventFormatCode === 'MEDLEY' && (
            <span className="ml-2 rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
              MEDLEY
            </span>
          )}
          <div className="text-xs text-muted-foreground mt-0.5">
            {event.solveCount} solves · Limit: {msToDisplay(event.timeLimitMs)}
          </div>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        ) : (
          <ChevronDown className="h-4 w-4 text-muted-foreground flex-shrink-0" />
        )}
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5">
          {message && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-500/5 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-3.5 w-3.5 shrink-0" />
              {message}
              <button onClick={() => setMessage(null)} className="ml-auto underline text-xs">Dismiss</button>
            </div>
          )}
          {error && (
            <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-500/5 border border-red-500/20 px-3 py-2 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto underline text-xs">Dismiss</button>
            </div>
          )}

          {/* Generate Groups */}
          <div className="mt-4 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Generate Groups</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Group Size</label>
                <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Station Count</label>
                <input type="number" value={stationCount} onChange={(e) => setStationCount(e.target.value)}
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
              </div>
            </div>
            <button
              disabled={isLoading}
              onClick={() => doAction(
                () => generateGroups(event.id, {
                  roundNumber: Number(roundNumber),
                  competitorsPerGroup: Number(groupSize),
                  stationCount: Number(stationCount)
                }),
                'Groups generated successfully!'
              )}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Shuffle className="h-3.5 w-3.5" />}
              Generate Groups & Assign Stations
            </button>
          </div>

          {/* Generate Scrambles */}
          <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Generate Scrambles</p>
            <div className="mb-3">
              <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Round Number</label>
              <input type="number" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}
                min="1"
                className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
            </div>
            <button
              disabled={isLoading}
              onClick={() => doAction(
                () => generateScrambles(event.id, { roundNumber: Number(roundNumber) }),
                'Scrambles generated!'
              )}
              className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-60 transition"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
              Generate Scrambles
            </button>
          </div>

          {/* Round Operations */}
          <div className="mt-3 rounded-xl border border-border bg-muted/20 p-4">
            <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Round Operations</p>
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Round Number</label>
                <input type="number" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}
                  min="1"
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
              </div>
              <div>
                <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Advance Count</label>
                <input type="number" value={advanceCount} onChange={(e) => setAdvanceCount(e.target.value)}
                  min="1"
                  className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
              </div>
            </div>
            <div className="grid grid-cols-2 gap-2">
              <button disabled={isLoading}
                onClick={() => doAction(
                  () => startRound(event.id, Number(roundNumber), {}),
                  `Round ${roundNumber} started!`
                )}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
                <Play className="h-3 w-3" /> Start Round
              </button>
              <button disabled={isLoading}
                onClick={() => doAction(
                  () => lockRoundResults(event.id, Number(roundNumber)),
                  `Round ${roundNumber} results locked!`
                )}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-muted border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/80 disabled:opacity-60">
                <Lock className="h-3 w-3" /> Lock Results
              </button>
              <button disabled={isLoading}
                onClick={() => doAction(
                  () => completeRound(event.id, Number(roundNumber)),
                  `Round ${roundNumber} completed!`
                )}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60">
                <CheckCircle2 className="h-3 w-3" /> Complete Round
              </button>
              <button disabled={isLoading}
                onClick={() => doAction(
                  () => advanceRound(event.id, Number(roundNumber), {
                    nextRoundNumber: Number(roundNumber) + 1,
                    topN: Number(advanceCount),
                    competitorsPerGroup: Number(groupSize),
                    stationCount: Number(stationCount)
                  }),
                  `Top ${advanceCount} competitors advanced!`
                )}
                className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-60">
                <Zap className="h-3 w-3" /> Advance Round
              </button>
            </div>

            {/* Complete Event */}
            <button
              disabled={isLoading}
              onClick={() => {
                if (!confirm(`Mark all rounds of "${event.puzzleTypeName || event.puzzleTypeCode}" as completed? This cannot be undone.`)) return;
                doAction(() => completeEvent(event.id), 'Event completed!');
              }}
              className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted/50 disabled:opacity-60 transition"
            >
              {isLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Flag className="h-3 w-3" />}
              Complete Event
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default function GroupHeatManagementPage({
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
        <span className="text-foreground font-semibold">Groups & Scrambles</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Group & Heat Management</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Generate groups, assign stations, create scrambles, and manage rounds per event.
          </p>
        </div>
      </div>

      {tournament.events.length === 0 ? (
        <div className="rounded-2xl border border-border bg-card py-16 text-center shadow-sm">
          <Layers className="h-10 w-10 text-muted-foreground/35 mx-auto mb-3" />
          <p className="text-muted-foreground font-semibold text-sm">No events configured for this tournament.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournament.events
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((event) => (
              <EventGroupPanel key={event.id} event={event} tournamentId={id} />
            ))}
        </div>
      )}
    </div>
  );
}
