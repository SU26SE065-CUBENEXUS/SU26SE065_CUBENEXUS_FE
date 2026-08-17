'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTournamentById } from '@/lib/api/tournaments';
import { getLiveBoardState, getPenaltyTypes, correctResult } from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import {
  ChevronRight,
  Trophy,
  AlertCircle,
  ShieldCheck,
  FileText,
  RotateCcw,
  Check,
  Loader2,
  CheckCircle,
  Info,
  RefreshCw,
  Search,
} from 'lucide-react';

interface MockDispute {
  id: string;
  resultId: string | null;
  competitorName: string;
  event: string;
  round: string;
  reason: string;
  status: 'Open' | 'Resolved';
  rawTime: string;
  penalty: string;
  finalResult: string;
  submittedAt: string;
}

const MOCK_DISPUTES: MockDispute[] = [
  {
    id: 'D001',
    resultId: null,
    competitorName: 'Nguyen Minh Khoa',
    event: '3x3x3 Speedcubing',
    round: 'Round 1, Solve 3',
    reason: 'Judge applied +2 incorrectly — puzzle was fully solved',
    status: 'Open',
    rawTime: '11.24s',
    penalty: '+2',
    finalResult: '13.24s',
    submittedAt: '2026-06-12 09:35',
  },
  {
    id: 'D002',
    resultId: null,
    competitorName: 'Tran Bao Long',
    event: 'Medley Relay',
    round: 'Round 1, Solve 1',
    reason: 'Timer stopped accidentally before Pyraminx was solved',
    status: 'Open',
    rawTime: '42.18s',
    penalty: 'DNF',
    finalResult: 'DNF',
    submittedAt: '2026-06-12 11:02',
  },
];

const STATUS_STYLE: Record<string, string> = {
  Open: 'bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400',
  Resolved: 'bg-emerald-500/10 border border-emerald-500/20 text-emerald-600 dark:text-emerald-400',
};

export default function DisputeManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // ─── Global States ──────────────────────────────────────────
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [penaltyTypes, setPenaltyTypes] = useState<any[]>([]);
  const [activeSubTab, setActiveSubTab] = useState<'real_corrections' | 'mock_disputes'>('real_corrections');
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [errorMain, setErrorMain] = useState<string | null>(null);

  // ─── Live Audit states ─────────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState('');
  const [roundNumber, setRoundNumber] = useState('1');
  const [liveState, setLiveState] = useState<any>(null);
  const [isLoadingLive, setIsLoadingLive] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  // ─── Selected Solve for Correction ─────────────────────────
  const [selectedSolve, setSelectedSolve] = useState<{
    resultId: string;
    competitorName: string;
    solveNumber: number;
    rawTimeMs?: number;
    penaltyCode: string;
    penaltyTypeId?: string;
  } | null>(null);

  const [correctionTimeMs, setCorrectionTimeMs] = useState('');
  const [correctionPenaltyId, setCorrectionPenaltyId] = useState('none');
  const [correctionReason, setCorrectionReason] = useState('');
  const [isSubmittingCorrection, setIsSubmittingCorrection] = useState(false);
  const [submitMessage, setSubmitMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // ─── Mock Disputes states ──────────────────────────────────
  const [disputes, setDisputes] = useState<MockDispute[]>(MOCK_DISPUTES);
  const [selectedMockDispute, setSelectedMockDispute] = useState<MockDispute | null>(null);

  // ─── Init Data ─────────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoadingMain(true);
      setErrorMain(null);
      try {
        const [tournData, penalties] = await Promise.all([
          getTournamentById(id),
          getPenaltyTypes().catch(() => [
            { id: 'plus2-uuid', code: 'PLUS_2', label: '+2s' },
            { id: 'dnf-uuid', code: 'DNF', label: 'DNF' },
          ]),
        ]);
        setTournament(tournData);
        setPenaltyTypes(penalties);
        if (tournData.events.length > 0) {
          setSelectedEventId(tournData.events[0].id);
        }
      } catch (err) {
        setErrorMain(err instanceof Error ? err.message : 'Failed to load tournament data');
      } finally {
        setIsLoadingMain(false);
      }
    }
    loadData();
  }, [id]);

  // Fetch live board state for audits
  const fetchLiveState = async () => {
    if (!selectedEventId) return;
    setIsLoadingLive(false);
    try {
      setIsLoadingLive(true);
      const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
      setLiveState(state);
    } catch (err) {
      console.warn('Failed to load live board state for audit:', err);
      setLiveState(null);
    } finally {
      setIsLoadingLive(false);
    }
  };

  useEffect(() => {
    fetchLiveState();
  }, [selectedEventId, roundNumber]);

  // ─── Solve Correction Actions ──────────────────────────────
  const handleSelectSolve = (competitorName: string, solve: any) => {
    // Map penalty code back to penalty type ID if possible
    let penId = 'none';
    if (solve.penaltyCode && solve.penaltyCode !== 'NONE') {
      const match = penaltyTypes.find((p) => p.code === solve.penaltyCode);
      if (match) penId = match.id;
    }

    setSelectedSolve({
      resultId: solve.resultId,
      competitorName,
      solveNumber: solve.solveNumber,
      rawTimeMs: solve.rawTimeMs,
      penaltyCode: solve.penaltyCode,
      penaltyTypeId: penId !== 'none' ? penId : undefined,
    });

    setCorrectionTimeMs(solve.rawTimeMs ? String(solve.rawTimeMs) : '');
    setCorrectionPenaltyId(penId);
    setCorrectionReason('');
    setSubmitMessage(null);
  };

  const handleApplyCorrection = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSolve) return;
    if (!correctionReason.trim()) {
      setSubmitMessage({ ok: false, text: 'Please enter a reason for this correction.' });
      return;
    }

    setIsSubmittingCorrection(true);
    setSubmitMessage(null);
    try {
      const penaltyTypeId = correctionPenaltyId !== 'none' ? correctionPenaltyId : null;
      const rawTimeMsVal = correctionTimeMs ? Number(correctionTimeMs) : null;

      await correctResult(selectedSolve.resultId, {
        rawTimeMs: rawTimeMsVal || undefined,
        penaltyTypeId: penaltyTypeId || undefined,
        reason: correctionReason,
      });

      setSubmitMessage({ ok: true, text: 'Result updated successfully!' });
      setSelectedSolve(null);

      // Refresh data
      fetchLiveState();
    } catch (err) {
      setSubmitMessage({
        ok: false,
        text: err instanceof Error ? err.message : 'Result correction failed',
      });
    } finally {
      setIsSubmittingCorrection(false);
    }
  };

  // Mock resolve
  const handleResolveMock = (disputeId: string) => {
    setDisputes((prev) =>
      prev.map((d) => (d.id === disputeId ? { ...d, status: 'Resolved' as const } : d))
    );
    setSelectedMockDispute(null);
    setSubmitMessage({ ok: true, text: 'Mock dispute marked as resolved.' });
  };

  // ─── Filtering ─────────────────────────────────────────────
  const filteredCompetitors =
    liveState?.competitors.filter((c: any) =>
      c.competitorName.toLowerCase().includes(searchQuery.toLowerCase())
    ) || [];

  if (isLoadingMain) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (errorMain || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{errorMain ?? 'Tournament not found'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">
          Tournaments
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Disputes & Results Audit</span>
      </div>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Audit & Dispute Resolution</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Disputes & Results Audit</h1>
          <p className="text-xs text-slate-500 mt-1">
            Audit solve times, correct erroneous score submissions, and resolve dispute tickets reported by competitors.
          </p>
        </div>
      </div>

      {/* Sub Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setActiveSubTab('real_corrections')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'real_corrections'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Live Score Audit (Live Audit)
        </button>
        <button
          onClick={() => setActiveSubTab('mock_disputes')}
          className={`px-4 py-2 rounded-lg text-xs font-semibold transition cursor-pointer ${
            activeSubTab === 'mock_disputes'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
          }`}
        >
          Dispute Tickets ({disputes.filter((d) => d.status === 'Open').length} Open)
        </button>
      </div>

      {submitMessage && (
        <div
          className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
            submitMessage.ok
              ? 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
              : 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
          }`}
        >
          {submitMessage.ok ? (
            <CheckCircle className="h-4 w-4 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 shrink-0" />
          )}
          {submitMessage.text}
          <button onClick={() => setSubmitMessage(null)} className="ml-auto text-xs underline">
            Dismiss
          </button>
        </div>
      )}

      {/* ─── TAB 1: RESULT AUDITS & CORRECTIONS ────────────────── */}
      {activeSubTab === 'real_corrections' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          {/* Audit Queue */}
          <div className="lg:col-span-2 space-y-4">
            <div className="bg-card border border-border rounded-2xl p-5 shadow-sm space-y-4">
              <h3 className="font-bold text-sm text-foreground uppercase tracking-wider">
                Select Round to Audit
              </h3>

              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Event
                  </label>
                  <select
                    value={selectedEventId}
                    onChange={(e) => setSelectedEventId(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2.5 text-xs text-foreground font-semibold outline-none focus:border-primary"
                  >
                    {tournament.events.map((e) => (
                      <option key={e.id} value={e.id}>
                        {e.puzzleTypeName}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-muted-foreground mb-1.5">
                    Round Number
                  </label>
                  <input
                    type="number"
                    min="1"
                    value={roundNumber}
                    onChange={(e) => setRoundNumber(e.target.value)}
                    className="w-full rounded-xl border border-border bg-card px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary"
                  />
                </div>
                <div className="flex items-end">
                  <button
                    onClick={fetchLiveState}
                    disabled={isLoadingLive}
                    className="w-full flex items-center justify-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground"
                  >
                    <RefreshCw className={`h-3.5 w-3.5 ${isLoadingLive ? 'animate-spin' : ''}`} />
                    Refresh State
                  </button>
                </div>
              </div>

              {/* Search Competitor */}
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
                <input
                  type="text"
                  placeholder="Filter competitor by name..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full rounded-xl border border-border bg-muted/10 pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                />
              </div>
            </div>

            {/* Competitors Solves Table */}
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              {isLoadingLive ? (
                <div className="flex justify-center py-16">
                  <Loader2 className="h-8 w-8 animate-spin text-primary" />
                </div>
              ) : filteredCompetitors.length === 0 ? (
                <div className="py-16 text-center text-xs text-muted-foreground">
                  No competitors found matching your criteria.
                </div>
              ) : (
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-border bg-muted/20">
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Competitor</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Group</th>
                      <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Solve attempts (click to correct)</th>
                      <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Stats</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border">
                    {filteredCompetitors.map((c: any) => {
                      // Find group name
                      const groupObj = liveState?.groups.find((g: any) => g.groupId === c.groupId);
                      return (
                        <tr key={c.groupCompetitorId} className="hover:bg-muted/10 transition">
                          <td className="px-4 py-3">
                            <p className="font-semibold text-foreground">{c.competitorName}</p>
                            <p className="text-[10px] text-muted-foreground">Station {c.stationNumber ?? '—'}</p>
                          </td>
                          <td className="px-4 py-3 text-xs font-bold text-foreground">
                            {groupObj?.groupName || 'Group'}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1.5">
                              {c.results.map((r: any) => (
                                <button
                                  key={r.resultId}
                                  type="button"
                                  onClick={() => handleSelectSolve(c.competitorName, r)}
                                  className={`rounded-lg px-2 py-1 text-xs font-mono font-bold border transition ${
                                    selectedSolve?.resultId === r.resultId
                                      ? 'border-primary bg-primary text-primary-foreground shadow-sm'
                                      : r.isDnf
                                      ? 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400 hover:bg-red-500/10'
                                      : r.penaltyCode !== 'NONE'
                                      ? 'border-orange-500/20 bg-orange-500/5 text-orange-600 dark:text-orange-400 hover:bg-orange-500/10'
                                      : 'border-border bg-muted/40 hover:bg-muted/80 text-foreground'
                                  }`}
                                  title="Click to apply result correction"
                                >
                                  S{r.solveNumber}: {r.isDnf ? 'DNF' : `${(r.finalTimeMs / 1000).toFixed(2)}s`}
                                </button>
                              ))}
                              {c.results.length === 0 && (
                                <span className="text-xs text-muted-foreground italic">No solves submitted yet</span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right">
                            <p className="font-bold text-xs text-foreground">
                              Ao5: {c.averageTimeMs ? `${(c.averageTimeMs / 1000).toFixed(2)}s` : '—'}
                            </p>
                            <p className="text-[10px] text-muted-foreground">
                              Best: {c.bestTimeMs ? `${(c.bestTimeMs / 1000).toFixed(2)}s` : '—'}
                            </p>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Correction Panel */}
          <div>
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider mb-4">
              Correction Form
            </h3>
            {selectedSolve ? (
              <form
                onSubmit={handleApplyCorrection}
                className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden"
              >
                <div className="flex items-center gap-2 border-b border-border bg-muted/20 px-5 py-4">
                  <RotateCcw className="h-4 w-4 text-primary" />
                  <span className="font-bold text-sm text-foreground">Correct Solve</span>
                </div>

                <div className="p-5 space-y-4">
                  <div>
                    <p className="text-[10px] font-extrabold uppercase text-muted-foreground mb-1">Competitor</p>
                    <p className="font-semibold text-sm text-foreground">{selectedSolve.competitorName}</p>
                    <p className="text-xs text-muted-foreground">Solve Number #{selectedSolve.solveNumber}</p>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      New Raw Time (milliseconds)
                    </label>
                    <input
                      type="number"
                      value={correctionTimeMs}
                      onChange={(e) => setCorrectionTimeMs(e.target.value)}
                      placeholder="e.g. 10250 = 10.25s"
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary font-mono"
                    />
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">Penalty</label>
                    <select
                      value={correctionPenaltyId}
                      onChange={(e) => setCorrectionPenaltyId(e.target.value)}
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary"
                    >
                      <option value="none">No penalty (OK)</option>
                      {penaltyTypes
                        .filter((p) => p.code !== 'OK')
                        .map((p) => (
                          <option key={p.id} value={p.id}>
                            {p.label}
                          </option>
                        ))}
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-semibold text-muted-foreground mb-1">
                      Correction Reason <span className="text-red-500">*</span>
                    </label>
                    <textarea
                      value={correctionReason}
                      onChange={(e) => setCorrectionReason(e.target.value)}
                      rows={3}
                      placeholder="E.g., Timer stopped accidentally, Judge miscalculated +2, etc."
                      className="w-full rounded-lg border border-border bg-card px-3 py-2 text-xs text-foreground outline-none focus:border-primary resize-none"
                    />
                  </div>
                </div>

                <div className="border-t border-border p-4 space-y-2">
                  <button
                    type="submit"
                    disabled={isSubmittingCorrection}
                    className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-primary py-2.5 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
                  >
                    {isSubmittingCorrection ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : (
                      <RotateCcw className="h-4 w-4" />
                    )}
                    Apply Correction
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedSolve(null)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/50"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-semibold text-sm">No solve selected</p>
                <p className="text-muted-foreground text-xs mt-1">
                  Click on any competitor solve attempt in the table to apply correction.
                </p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 2: MOCK DISPUTES QUEUE ─────────────────────────── */}
      {activeSubTab === 'mock_disputes' && (
        <div className="grid grid-cols-1 gap-8 lg:grid-cols-3">
          <div className="lg:col-span-2">
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider mb-4">
              Dispute Queue
            </h3>
            <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-border bg-muted/20">
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Competitor</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Event</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Status</th>
                    <th className="px-4 py-3 text-left text-xs font-semibold text-muted-foreground">Submitted</th>
                    <th className="px-4 py-3 text-right text-xs font-semibold text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {disputes.map((d) => (
                    <tr key={d.id} className="hover:bg-muted/10 transition">
                      <td className="px-4 py-3 font-semibold text-foreground">{d.competitorName}</td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">
                        <p className="text-foreground font-medium">{d.event}</p>
                        <p className="text-muted-foreground/80">{d.round}</p>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex items-center rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[d.status]}`}>
                          {d.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-muted-foreground">{d.submittedAt}</td>
                      <td className="px-4 py-3 text-right">
                        {d.status !== 'Resolved' ? (
                          <button
                            onClick={() => setSelectedMockDispute(d)}
                            className="rounded-lg border border-primary/20 bg-primary/5 px-3 py-1.5 text-xs font-bold text-primary hover:bg-primary/10 transition"
                          >
                            Review
                          </button>
                        ) : (
                          <span className="text-xs text-muted-foreground">Resolved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          <div>
            <h3 className="font-bold text-sm text-foreground uppercase tracking-wider mb-4">
              Review Panel
            </h3>
            {selectedMockDispute ? (
              <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                <div className="flex items-center justify-between px-5 py-4 border-b border-border bg-muted/20">
                  <span className="font-bold text-sm text-foreground">{selectedMockDispute.competitorName}</span>
                  <span className={`rounded-full px-2 py-0.5 text-[10px] font-bold ${STATUS_STYLE[selectedMockDispute.status]}`}>
                    {selectedMockDispute.status}
                  </span>
                </div>

                <div className="p-5 space-y-4 text-xs">
                  <div>
                    <p className="font-extrabold text-muted-foreground uppercase tracking-wider mb-1">Reason</p>
                    <p className="text-sm text-foreground leading-relaxed bg-muted/10 p-3 rounded-xl border border-border/80">
                      "{selectedMockDispute.reason}"
                    </p>
                  </div>

                  <div className="grid grid-cols-3 gap-3 text-center border-t border-b border-border py-3">
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Raw Time</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedMockDispute.rawTime}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Penalty</p>
                      <p className="font-bold text-red-500 mt-0.5">{selectedMockDispute.penalty}</p>
                    </div>
                    <div>
                      <p className="text-[10px] text-muted-foreground uppercase">Final</p>
                      <p className="font-bold text-foreground mt-0.5">{selectedMockDispute.finalResult}</p>
                    </div>
                  </div>

                  <div className="rounded-xl border border-primary/20 bg-primary/5 p-3.5 flex items-start gap-2.5 text-primary leading-normal">
                    <Info className="h-4 w-4 shrink-0 mt-0.5" />
                    <p>
                      To correct this result, use the <strong>Result Audits & Corrections</strong> tab. Select event{' '}
                      <strong>{selectedMockDispute.event}</strong> and search for competitor{' '}
                      <strong>{selectedMockDispute.competitorName}</strong>.
                    </p>
                  </div>
                </div>

                <div className="border-t border-border p-4 space-y-2">
                  <button
                    onClick={() => handleResolveMock(selectedMockDispute.id)}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 py-2.5 text-xs font-bold text-white hover:bg-emerald-500"
                  >
                    <Check className="h-3.5 w-3.5" /> Mark Resolved
                  </button>
                  <button
                    onClick={() => setSelectedMockDispute(null)}
                    className="w-full rounded-xl border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/50"
                  >
                    Close
                  </button>
                </div>
              </div>
            ) : (
              <div className="rounded-2xl border border-dashed border-border bg-card py-16 text-center">
                <AlertCircle className="h-10 w-10 text-muted-foreground/30 mx-auto mb-3" />
                <p className="text-muted-foreground font-semibold text-sm">No mock dispute selected</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
