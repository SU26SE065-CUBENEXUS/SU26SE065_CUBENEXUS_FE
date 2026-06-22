'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTournamentById } from '@/lib/api/tournaments';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import {
  ChevronRight,
  Trophy,
  UserCheck,
  AlertTriangle,
  Loader2,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  ChevronDown,
  ChevronUp,
} from 'lucide-react';

// Judge assignment is a UI-only feature for now.
// BE does not have a judge assignment endpoint — this stores state locally
// until the BE adds: POST /api/tournament-management/events/{eventId}/judges
type JudgeStatus = 'Unassigned' | 'Assigned' | 'Confirmed';

interface StationAssignment {
  station: number;
  judgeName: string;
  status: JudgeStatus;
}

function EventJudgePanel({ event }: { event: EventDetailDto }) {
  const [expanded, setExpanded] = useState(false);
  const [stations, setStations] = useState<StationAssignment[]>([
    { station: 1, judgeName: '', status: 'Unassigned' },
    { station: 2, judgeName: '', status: 'Unassigned' },
    { station: 3, judgeName: '', status: 'Unassigned' },
    { station: 4, judgeName: '', status: 'Unassigned' },
  ]);
  const [editStation, setEditStation] = useState<number | null>(null);
  const [judgeInput, setJudgeInput] = useState('');

  const unassignedCount = stations.filter((s) => s.status === 'Unassigned').length;
  const confirmedCount = stations.filter((s) => s.status === 'Confirmed').length;

  const handleAssign = (stationNum: number) => {
    if (!judgeInput.trim()) return;
    setStations((prev) =>
      prev.map((s) =>
        s.station === stationNum
          ? { ...s, judgeName: judgeInput.trim(), status: 'Assigned' }
          : s
      )
    );
    setEditStation(null);
    setJudgeInput('');
  };

  const handleConfirm = (stationNum: number) => {
    setStations((prev) =>
      prev.map((s) => (s.station === stationNum ? { ...s, status: 'Confirmed' } : s))
    );
  };

  const handleUnassign = (stationNum: number) => {
    setStations((prev) =>
      prev.map((s) =>
        s.station === stationNum ? { ...s, judgeName: '', status: 'Unassigned' } : s
      )
    );
  };

  const STATUS_STYLES: Record<JudgeStatus, string> = {
    Unassigned: 'bg-red-100 text-red-700',
    Assigned: 'bg-yellow-100 text-yellow-700',
    Confirmed: 'bg-emerald-100 text-emerald-700',
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm overflow-hidden">
      <button
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-slate-50 transition"
      >
        <div className="flex items-center gap-3">
          <div>
            <span className="font-bold text-slate-800 text-sm">
              {event.puzzleTypeName || event.puzzleTypeCode}
            </span>
            {event.eventFormatCode === 'MEDLEY' && (
              <span className="ml-2 rounded-full bg-purple-100 px-2 py-0.5 text-[10px] font-bold text-purple-700">
                MEDLEY
              </span>
            )}
            <p className="text-xs text-slate-500 mt-0.5">{event.solveCount} solves</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {unassignedCount > 0 && (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700">
              {unassignedCount} unassigned
            </span>
          )}
          {confirmedCount > 0 && (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-bold text-emerald-700">
              {confirmedCount} confirmed
            </span>
          )}
          {expanded ? (
            <ChevronUp className="h-4 w-4 text-slate-400 flex-shrink-0" />
          ) : (
            <ChevronDown className="h-4 w-4 text-slate-400 flex-shrink-0" />
          )}
        </div>
      </button>

      {expanded && (
        <div className="border-t border-slate-100 px-5 pb-5">
          <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mt-4 mb-3">
            Station Assignments
          </p>
          <div className="space-y-2">
            {stations.map((s) => (
              <div
                key={s.station}
                className="flex items-center gap-3 rounded-xl border border-slate-100 bg-slate-50 px-4 py-3"
              >
                <span className="text-xs font-bold text-slate-500 w-20 shrink-0">
                  Station {s.station}
                </span>

                {editStation === s.station ? (
                  <div className="flex flex-1 items-center gap-2">
                    <input
                      type="text"
                      value={judgeInput}
                      onChange={(e) => setJudgeInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleAssign(s.station)}
                      placeholder="Enter judge name..."
                      autoFocus
                      className="flex-1 rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-xs outline-none focus:border-indigo-400 transition"
                    />
                    <button
                      onClick={() => handleAssign(s.station)}
                      className="rounded-lg bg-indigo-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-indigo-700"
                    >
                      Save
                    </button>
                    <button
                      onClick={() => { setEditStation(null); setJudgeInput(''); }}
                      className="rounded-lg border border-slate-200 px-2 py-1.5 text-xs text-slate-500 hover:bg-slate-100"
                    >
                      <X className="h-3 w-3" />
                    </button>
                  </div>
                ) : (
                  <>
                    <div className="flex-1">
                      {s.judgeName ? (
                        <span className="text-sm font-semibold text-slate-800">{s.judgeName}</span>
                      ) : (
                        <span className="text-xs text-slate-400 italic">No judge assigned</span>
                      )}
                    </div>
                    <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLES[s.status]}`}>
                      {s.status}
                    </span>
                    <div className="flex items-center gap-1.5">
                      {s.status !== 'Confirmed' && (
                        <button
                          onClick={() => { setEditStation(s.station); setJudgeInput(s.judgeName); }}
                          className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs font-semibold text-slate-600 hover:bg-slate-50"
                        >
                          <Plus className="h-3 w-3" />
                        </button>
                      )}
                      {s.status === 'Assigned' && (
                        <button
                          onClick={() => handleConfirm(s.station)}
                          className="rounded-lg border border-emerald-200 bg-emerald-50 px-2.5 py-1 text-xs font-semibold text-emerald-700 hover:bg-emerald-100"
                        >
                          <CheckCircle className="h-3 w-3" />
                        </button>
                      )}
                      {s.judgeName && (
                        <button
                          onClick={() => handleUnassign(s.station)}
                          className="rounded-lg border border-red-100 bg-red-50 px-2.5 py-1 text-xs text-red-600 hover:bg-red-100"
                        >
                          <X className="h-3 w-3" />
                        </button>
                      )}
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default function JudgeAssignmentPage({
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
        // Fallback mock tournament for UI development
        setTournament({
          id,
          name: 'CubeNexus Open 2026',
          statusCode: 'ongoing',
          startDate: '2026-06-12T09:00:00Z',
          endDate: '2026-06-14T18:00:00Z',
          registrationOpenAt: '2026-05-01T00:00:00Z',
          registrationCloseAt: '2026-06-10T00:00:00Z',
          createdAt: '2026-04-15T12:00:00Z',
          createdBy: 'U001',
          createdByUserName: 'Manager',
          updatedAt: new Date().toISOString(),
          events: [
            { id: 'E001', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] },
            { id: 'E002', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] },
          ],
        });
        console.warn('API unavailable, using mock tournament:', err);
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error ?? 'Tournament not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-400 font-medium mb-7 flex-wrap">
        <Trophy className="h-3.5 w-3.5" />
        <Link href="/managertournaments" className="hover:text-slate-600 transition-colors">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-600 transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-slate-600 font-semibold">Judge Assignment</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-2xl font-black text-slate-900 tracking-tight">Judge Assignment</h1>
          <p className="text-sm text-slate-500 mt-1">
            Assign judges to stations for each event. Click a station to set the judge name.
          </p>
        </div>
      </div>

      {/* Warning Banner */}
      <div className="mb-6 flex items-start gap-3 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3.5 text-sm text-amber-700">
        <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5" />
        <div>
          <p className="font-semibold">Assignments saved locally only</p>
          <p className="text-xs text-amber-600 mt-0.5">
            BE does not yet have a judge assignment endpoint. Assignments are stored in this session only and will reset on page refresh. This will be connected to the API when available.
          </p>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-6">
        {[
          { label: 'Total Events', value: tournament.events.length, color: 'text-slate-700' },
          { label: 'Stations Per Event', value: 4, color: 'text-indigo-600' },
          { label: 'Total Stations', value: tournament.events.length * 4, color: 'text-slate-700' },
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-slate-200 px-5 py-4 shadow-sm">
            <p className="text-xs text-slate-400 font-semibold uppercase">{s.label}</p>
            <p className={`text-2xl font-black mt-1 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Judge-icon row */}
      <div className="flex items-center gap-2 mb-4">
        <UserCheck className="h-4 w-4 text-indigo-500" />
        <h2 className="font-bold text-slate-700 text-sm uppercase tracking-wider">Assign by Event</h2>
      </div>

      {/* Event panels */}
      {tournament.events.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-slate-300 bg-white py-16 text-center">
          <p className="text-slate-400 font-semibold text-sm">No events configured for this tournament.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournament.events
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((event) => (
              <EventJudgePanel key={event.id} event={event} />
            ))}
        </div>
      )}
    </div>
  );
}
