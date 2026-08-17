'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getTournamentJudges, generateGroups, generateScrambles } from '@/lib/api/tournaments';
import {
  startRound,
  lockRoundResults,
  completeRound,
  advanceRound,
  completeEvent,
  getLiveBoardState,
  getGroupScrambles,
} from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto, TournamentJudgeDto } from '@/lib/api/types';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import {
  ChevronRight,
  ChevronLeft,
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
  Users,
  Clipboard,
  FileText,
  Check,
  ShieldCheck,
  X,
} from 'lucide-react';

function msToDisplay(ms: number | null | undefined): string {
  if (ms === null || ms === undefined) return '-';
  if (ms === 999999999) return 'DNF';
  const totalSec = ms / 1000;
  if (totalSec >= 60) {
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(2);
    return `${min}:${sec.padStart(5, '0')}`;
  }
  return `${totalSec.toFixed(2)}s`;
}

function EventGroupPanel({
  event,
  tournamentId,
  defaultStationCount = 4,
}: {
  event: EventDetailDto;
  tournamentId: string;
  defaultStationCount?: number;
}) {
  const [expanded, setExpanded] = useState(false);
  const [activeTab, setActiveTab] = useState<'groups' | 'scrambles' | 'control'>('groups');
  const [roundNumber, setRoundNumber] = useState('1');

  // Form configurations
  const [groupSize, setGroupSize] = useState('8');
  const [stationCount, setStationCount] = useState(defaultStationCount.toString());
  const [advanceCount, setAdvanceCount] = useState(event.advanceTopN?.toString() || '8');

  useEffect(() => {
    if (event.advanceTopN) {
      setAdvanceCount(event.advanceTopN.toString());
    }
  }, [event.advanceTopN]);

  useEffect(() => {
    setStationCount(defaultStationCount.toString());
  }, [defaultStationCount]);

  // Live board data state
  const [liveBoard, setLiveBoard] = useState<any>(null);
  const [isLiveBoardLoading, setIsLiveBoardLoading] = useState(false);
  const [liveBoardError, setLiveBoardError] = useState<string | null>(null);

  // Scramble sequences details state
  const [groupScrambles, setGroupScrambles] = useState<Record<string, any[]>>({});
  const [isScramblesLoading, setIsScramblesLoading] = useState(false);

  // Modal open states
  const [isGenerateGroupsOpen, setIsGenerateGroupsOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);

  // Global actions loading & notifications
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Live Board Status
  const fetchLiveBoard = async (roundNum: number) => {
    setIsLiveBoardLoading(true);
    setLiveBoardError(null);
    try {
      const data = await getLiveBoardState(event.id, roundNum);
      setLiveBoard(data);
    } catch (err) {
      console.warn('Failed to fetch live board state:', err);
      setLiveBoardError('Could not retrieve details for this round.');
      setLiveBoard(null);
    } finally {
      setIsLiveBoardLoading(false);
    }
  };

  // Fetch Scrambles for each Group
  const fetchScramblesForGroups = async (groupsList: any[]) => {
    if (!groupsList || groupsList.length === 0) return;
    setIsScramblesLoading(true);
    const newScrambles: Record<string, any[]> = {};
    try {
      await Promise.all(
        groupsList.map(async (group) => {
          try {
            const data = await getGroupScrambles(group.groupId);
            newScrambles[group.groupId] = data;
          } catch (err) {
            console.warn(`Failed to fetch scrambles for group ${group.groupName}:`, err);
          }
        })
      );
      setGroupScrambles(newScrambles);
    } finally {
      setIsScramblesLoading(false);
    }
  };

  // Trigger Live Board Load on Expand & Round Switch
  useEffect(() => {
    if (expanded) {
      setError(null);
      setMessage(null);
      fetchLiveBoard(Number(roundNumber));
    }
  }, [expanded, roundNumber]);

  // Trigger Scrambles Fetch when groups are loaded
  useEffect(() => {
    if (liveBoard?.groups) {
      fetchScramblesForGroups(liveBoard.groups);
    } else {
      setGroupScrambles({});
    }
  }, [liveBoard?.groups]);

  const doAction = async (fn: () => Promise<unknown>, successMsg: string) => {
    setIsLoading(true);
    setError(null);
    setMessage(null);
    try {
      await fn();
      setMessage(successMsg);
      await fetchLiveBoard(Number(roundNumber));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Calculations for Summary Dashboard Cards
  const totalCompetitors = liveBoard?.progress?.totalCompetitors ?? 0;
  const groupsCount = liveBoard?.groups?.length ?? 0;
  const roundStatus = liveBoard?.roundStatus || 'PENDING';

  // Calculate active stations from competitors maximum station number
  const activeStations = liveBoard?.competitors
    ? Math.max(...liveBoard.competitors.map((c: any) => c.stationNumber || 0), 0)
    : 0;

  // Determine scramble generation status
  const scramblesGenerated = liveBoard?.groups?.length > 0 && liveBoard.groups.every((group: any) => {
    const list = groupScrambles[group.groupId];
    return list && list.length > 0;
  });
  const scramblesStatus = liveBoard?.groups?.length > 0
    ? (scramblesGenerated ? 'Generated' : 'Missing')
    : 'Not Generated';
  const isScramblesReady = scramblesStatus === 'Generated';

  // Submissions Progress
  const totalSolves = liveBoard?.progress?.totalExpectedSolves ?? 0;
  const submittedSolves = liveBoard?.progress?.submittedSolves ?? 0;
  const progressPercentage = totalSolves > 0 ? Math.round((submittedSolves / totalSolves) * 100) : 0;

  const totalRoundsConfigured = event.totalRounds || 1;
  const isFinalRound = Number(roundNumber) >= totalRoundsConfigured;

  // Lifecycle Stepper Rules mapping
  const groupsExist = groupsCount > 0;
  const stepStatus = {
    groups: groupsExist ? 'Done' : 'Pending',
    scrambles: scramblesGenerated ? 'Done' : (groupsExist ? 'Ready' : 'Pending'),
    start: roundStatus !== 'PENDING' ? 'Done' : (groupsExist && scramblesGenerated ? 'Ready' : 'Blocked'),
    lock: (roundStatus === 'LOCKED' || roundStatus === 'COMPLETED') ? 'Done' : (roundStatus === 'ONGOING' ? 'Ready' : 'Blocked'),
    complete: roundStatus === 'COMPLETED' ? 'Done' : (roundStatus === 'LOCKED' ? 'Ready' : 'Blocked'),
    advance: isFinalRound ? 'Disabled' : (roundStatus === 'COMPLETED' ? 'Ready' : 'Blocked'),
  };

  // Ranked competitors qualifying for next round (exclude cutoff-stopped, DNF-stopped, and DNF Average/Best)
  const isAvgFormat = (event.solveCount || 5) >= 3;
  const advancingCompetitors = liveBoard?.competitors
    ? [...liveBoard.competitors]
      .filter((c: any) => {
        if (!c.rank || c.rank > Number(advanceCount) || c.isCutoffReached) return false;
        if (isAvgFormat) {
          return c.averageTimeMs && c.averageTimeMs > 0 && c.averageTimeMs < 2147483647;
        } else {
          return c.bestTimeMs && c.bestTimeMs > 0 && c.bestTimeMs < 2147483647;
        }
      })
      .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999))
    : [];

  return (
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
      {/* Event Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/70 transition">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-bold text-slate-900 text-base tracking-tight">
                {formatEventLabel(event)}
              </span>
              {event.eventFormatCode === 'MEDLEY' && (
                <span className="rounded bg-purple-50 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700">
                  MEDLEY
                </span>
              )}
            </div>
            <div className="text-xs text-slate-500 mt-0.5 font-medium">
              {event.solveCount} solves · Limit: {msToDisplay(event.timeLimitMs)}
              {event.cutoffTimeMs ? ` · Cutoff: ${msToDisplay(event.cutoffTimeMs)}` : ''}
              {` · Total: ${totalRoundsConfigured} ${totalRoundsConfigured > 1 ? 'Rounds' : 'Final Round'}`}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {/* Compact Active Round and Status Badge */}
          {expanded && (
            <div className="flex items-center gap-2">
              {/* Round Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  disabled={Number(roundNumber) <= 1 || isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Math.max(1, Number(prev) - 1)))}
                  className="p-1 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  title="Previous Round"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-bold px-2 text-slate-800 font-mono">
                  Round {roundNumber} / {totalRoundsConfigured}
                </span>
                <button
                  disabled={Number(roundNumber) >= totalRoundsConfigured || isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Number(prev) + 1))}
                  className="p-1 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                  title={Number(roundNumber) >= totalRoundsConfigured ? 'Final Round reached' : 'Next Round'}
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Status Badge */}
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${roundStatus === 'ONGOING' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                : roundStatus === 'LOCKED' ? 'text-amber-700 bg-amber-50 border-amber-200'
                  : roundStatus === 'COMPLETED' ? 'text-indigo-700 bg-indigo-50 border-indigo-200'
                    : 'text-slate-500 bg-slate-100 border-slate-200'
                }`}>
                {roundStatus}
              </span>
            </div>
          )}

          <button
            onClick={() => setExpanded((v) => !v)}
            className="p-1 rounded hover:bg-muted text-muted-foreground"
          >
            {expanded ? (
              <ChevronUp className="h-4 w-4" />
            ) : (
              <ChevronDown className="h-4 w-4" />
            )}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-border px-5 pb-6 pt-4 bg-card-secondary/20">
          {/* Notifications */}
          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 font-semibold">{message}</div>
              <button onClick={() => setMessage(null)} className="underline hover:text-emerald-500 transition-colors">Dismiss</button>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 font-semibold">{error}</div>
              <button onClick={() => setError(null)} className="underline hover:text-red-500 transition-colors">Dismiss</button>
            </div>
          )}

          {/* 1. Overview Summary Cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Current Round</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-bold text-slate-900">Round {roundNumber}</span>
              </div>
              <span className="text-xs text-slate-500 mt-1">Status: <strong className="text-slate-900">{roundStatus}</strong></span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Participants & Groups</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">{totalCompetitors}</span>
                <span className="text-xs text-slate-500 font-semibold ml-1">competitors</span>
              </div>
              <span className="text-xs text-slate-500 mt-1">{groupsCount} groups · {activeStations} stations</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Scramble Status</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {scramblesStatus === 'Generated' ? 'Ready' : (scramblesStatus === 'Missing' ? 'Missing' : 'None')}
                </span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${scramblesStatus === 'Generated' ? 'bg-emerald-500' : 'bg-amber-500'
                  }`} />
              </div>
              <span className="text-xs text-indigo-600 font-semibold mt-1">Scramble sequences ready</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Submissions Progress</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                <span className="text-xs text-slate-500 font-semibold ml-2">
                  ({submittedSolves}/{totalSolves})
                </span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200">
                <div
                  className="bg-indigo-600 h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Segmented Tab Headers */}
          <div className="flex border-b border-slate-200 mb-5 gap-6">
            {(['groups', 'scrambles'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${activeTab === tab
                  ? 'border-indigo-600 text-indigo-600 font-bold'
                  : 'border-transparent text-slate-500 hover:text-slate-900'
                  }`}
              >
                {tab === 'groups' ? 'Groups Board' : 'Scrambles'}
              </button>
            ))}
            <button
              onClick={() => fetchLiveBoard(Number(roundNumber))}
              disabled={isLiveBoardLoading}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 p-1 transition cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isLiveBoardLoading ? 'animate-spin text-indigo-600' : ''}`} />
              Sync Data
            </button>
          </div>

          {/* Loading Roster Screen */}
          {isLiveBoardLoading && !liveBoard && (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-2" />
              <p className="text-xs text-muted-foreground font-medium">Syncing round operations dashboard...</p>
            </div>
          )}

          {/* TAB 1: GROUPS */}
          {activeTab === 'groups' && !isLiveBoardLoading && (
            <div>
              {!groupsExist ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-2xl border border-dashed border-border p-6">
                  <Shuffle className="h-10 w-10 text-muted-foreground/35 mb-3" />
                  {Number(roundNumber) > 1 ? (
                    <>
                      <p className="font-bold text-sm text-foreground">Round {roundNumber} has no Groups yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mb-4 leading-relaxed">
                        Competitors for <strong>Round {roundNumber}</strong> must be selected based on results from <strong>Round {Number(roundNumber) - 1}</strong>.
                        <br />
                        Please switch to <strong>Round {Number(roundNumber) - 1}</strong>, complete the round, and click <strong className="text-orange-400">"Advance Round"</strong> to qualify top competitors for Round {roundNumber}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm text-foreground">No groups created for Round 1 yet</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
                        Before starting Round 1, generate competition groups and assign station stations to competitors.
                      </p>
                      <button
                        onClick={() => setIsGenerateGroupsOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-sm cursor-pointer"
                      >
                        <Shuffle className="h-3.5 w-3.5" /> Generate Round 1 Groups
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold font-mono">
                      Groups Structure Board ({groupsCount} groups)
                    </span>
                    <button
                      onClick={() => setIsGenerateGroupsOpen(true)}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-800 transition shadow-2xs cursor-pointer"
                    >
                      <Shuffle className="h-3 w-3 text-indigo-600" /> Re-generate Groups
                    </button>
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {liveBoard.groups.map((group: any) => {
                      const groupComps = liveBoard.competitors.filter((c: any) => c.groupId === group.groupId);
                      const stations = groupComps.map((c: any) => c.stationNumber).filter((s: any) => s !== null && s !== undefined);
                      const minStation = stations.length > 0 ? Math.min(...stations) : null;
                      const maxStation = stations.length > 0 ? Math.max(...stations) : null;
                      const stationRange = minStation !== null ? `Stations ${minStation} - ${maxStation}` : 'No stations assigned';

                      const groupStatusText = group.statusCode === 'PENDING' ? 'Ready'
                        : group.statusCode === 'ONGOING' ? 'Running'
                          : group.statusCode === 'LOCKED' ? 'Locked'
                            : group.statusCode === 'COMPLETED' ? 'Completed'
                              : group.statusCode;

                      const groupStatusColor = group.statusCode === 'PENDING' ? 'text-slate-600 bg-slate-100 border-slate-200'
                        : group.statusCode === 'ONGOING' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
                          : group.statusCode === 'LOCKED' ? 'text-amber-700 bg-amber-50 border-amber-200'
                            : group.statusCode === 'COMPLETED' ? 'text-blue-700 bg-blue-50 border-blue-200'
                              : 'text-slate-600 bg-slate-100 border-slate-200';

                      return (
                        <div key={group.groupId} className="rounded-xl border border-slate-200 bg-white p-4 flex flex-col justify-between shadow-2xs text-slate-900">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-bold text-sm text-slate-900">{group.groupName}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider font-mono ${groupStatusColor}`}>
                                {groupStatusText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-slate-600 font-medium mb-4">
                              <Users className="h-3.5 w-3.5 text-indigo-600" />
                              <span>{groupComps.length} Competitors</span>
                              <span>·</span>
                              <span>{stationRange}</span>
                            </div>
                          </div>

                          <CollapsibleRoster list={groupComps} />
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* TAB 2: SCRAMBLES */}
          {activeTab === 'scrambles' && !isLiveBoardLoading && (
            <div className="space-y-4">
              {!groupsExist ? (
                <div className="flex flex-col items-center justify-center py-12 text-center bg-slate-50 rounded-2xl border border-dashed border-slate-200 p-6">
                  <Shuffle className="h-10 w-10 text-slate-300 mb-3" />
                  <p className="font-bold text-sm text-slate-900">Scrambles cannot be generated yet.</p>
                  <p className="text-xs text-slate-500 mt-1 max-w-sm mb-4">
                    Please generate Groups first in order to allocate scramble sets to specific heats.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-slate-500 font-bold font-mono">
                      Scrambles Sets Management
                    </span>
                    <button
                      disabled={isLoading || isScramblesReady}
                      onClick={() => doAction(
                        () => generateScrambles(event.id, { roundNumber: Number(roundNumber) }),
                        'Scrambles generated successfully!'
                      )}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${isScramblesReady
                        ? 'bg-purple-50 border border-purple-200 text-purple-700 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
                        }`}
                    >
                      {isLoading ? (
                        <Loader2 className="h-3 w-3 animate-spin" />
                      ) : isScramblesReady ? (
                        <Check className="h-3 w-3" />
                      ) : (
                        <Zap className="h-3 w-3" />
                      )}
                      {isScramblesReady ? 'Scrambles Ready' : 'Generate Scrambles'}
                    </button>
                  </div>

                  <div className="grid grid-cols-1 gap-4">
                    {liveBoard.groups.map((group: any) => {
                      const scrambles = groupScrambles[group.groupId];
                      return (
                        <div key={group.groupId} className="p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-slate-900">{group.groupName}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${scrambles ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-amber-700 bg-amber-50 border-amber-200'
                              }`}>
                              {scrambles ? 'Generated' : 'Missing'}
                            </span>
                          </div>

                          {isScramblesLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin text-indigo-600" />
                            </div>
                          ) : scrambles && scrambles.length > 0 ? (
                            <div className="space-y-2">
                              {scrambles.map((s: any) => (
                                <div key={s.id} className="text-xs flex flex-col sm:flex-row items-center justify-between gap-2 p-3 bg-white rounded-lg border border-slate-200 shadow-2xs">
                                  <span className="font-bold text-indigo-600 min-w-[70px] font-mono">Solve #{s.solveNumber}:</span>
                                  <span className="font-mono break-all text-slate-900 font-semibold select-all tracking-wider text-xs">{s.sequence}</span>
                                </div>
                              ))}
                            </div>
                          ) : scrambles ? (
                            <p className="text-xs text-slate-500 italic py-2">
                              Scrambles generated, details unavailable from current API.
                            </p>
                          ) : (
                            <p className="text-xs text-amber-600 italic py-2 flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              Scramble sequence not generated for this group yet. Click Generate Scrambles above.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* GENERATE GROUPS MODAL */}
          {isGenerateGroupsOpen && (() => {
            const totalEligibleCount = liveBoard?.competitors?.length || 0;
            const gSize = Number(groupSize) || 0;
            const sCount = defaultStationCount || 0;
            const isGroupExceeded = totalEligibleCount > 0 && gSize > totalEligibleCount;
            const isGroupLessThanStations = sCount > 0 && gSize > 0 && gSize < sCount;
            const isNoStationsAssigned = sCount === 0;
            const isInvalid = isGroupExceeded || isGroupLessThanStations || isNoStationsAssigned || gSize <= 0;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="relative w-full max-w-md p-6 bg-white border border-slate-200 rounded-xl shadow-2xl space-y-4 text-slate-900 overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Configure Competition Groups</h3>
                    <button
                      onClick={() => setIsGenerateGroupsOpen(false)}
                      className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Set grouping parameters for <strong className="text-indigo-600">Round {roundNumber}</strong> - Event <strong className="text-slate-900">{formatEventLabel(event)}</strong>.
                  </p>

                  {/* NO STATIONS / JUDGES UNASSIGNED ALERT */}
                  {isNoStationsAssigned && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Judges & Stations Not Assigned!</strong>
                        No competition stations are assigned to judges. Please complete <strong>Step 1 (Assign Judges & Stations)</strong> before creating groups.
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                          Competitors per Group
                        </label>
                        {totalEligibleCount > 0 && (
                          <span className="text-[10px] text-indigo-600 font-bold font-mono">
                            Total eligible: {totalEligibleCount} competitors
                          </span>
                        )}
                      </div>
                      <input
                        type="number"
                        min="1"
                        max={totalEligibleCount || undefined}
                        value={groupSize}
                        onChange={(e) => setGroupSize(e.target.value)}
                        className={`w-full rounded-lg border ${isGroupExceeded || isGroupLessThanStations ? 'border-red-500 bg-red-50/50' : 'border-slate-200 bg-slate-50'} px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 transition`}
                        placeholder="e.g. 8 competitors / group"
                      />
                    </div>

                    {!isNoStationsAssigned && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Available Stations:</span>
                        <span className="font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200 font-mono">
                          {sCount} Stations (Judges Assigned)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Validation Alerts & Helper Box */}
                  {isGroupExceeded && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>Competitors per group ({gSize}) cannot exceed total eligible competitors ({totalEligibleCount}).</span>
                    </div>
                  )}

                  {isGroupLessThanStations && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Competitors per group ({gSize}) cannot be fewer than available stations ({sCount} stations).</span>
                    </div>
                  )}

                  <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                    <button
                      type="button"
                      onClick={() => setIsGenerateGroupsOpen(false)}
                      className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                    >
                      Cancel
                    </button>
                    <button
                      disabled={isLoading || isInvalid}
                      onClick={() => {
                        setIsGenerateGroupsOpen(false);
                        doAction(
                          () => generateGroups(event.id, {
                            roundNumber: Number(roundNumber),
                            competitorsPerGroup: gSize,
                            stationCount: sCount
                          }),
                          'Groups created successfully!'
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50 font-medium"
                    >
                      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Confirm Create Groups
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ADVANCE ROUND CONFIRMATION MODAL */}
          {isAdvanceOpen && (() => {
            const sCount = defaultStationCount || 0;
            const isNoStationsAssigned = sCount === 0;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="relative w-full max-w-2xl p-6 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[85vh] space-y-4 text-slate-900 overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Advance Round Configuration</h3>
                    <button
                      onClick={() => setIsAdvanceOpen(false)}
                      className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500">
                    Qualify top competitors from Round {roundNumber} to proceed to <strong className="text-indigo-600">Round {Number(roundNumber) + 1}</strong>.
                  </p>

                  {/* NO STATIONS ALERT */}
                  {isNoStationsAssigned && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Judges & Stations Not Assigned!</strong>
                        No competition stations are assigned to judges. Please complete <strong>Step 1 (Assign Judges & Stations)</strong> before advancing.
                      </div>
                    </div>
                  )}

                  {/* Top N Info banner - read-only from event config */}
                  {event.advanceTopN && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      Per tournament configuration, the top <strong className="font-bold">{event.advanceTopN} competitors</strong> will advance to Round {Number(roundNumber) + 1}.
                    </div>
                  )}

                  {/* Group size input only */}
                  <div className="w-48">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">New Group Size</label>
                    <input
                      type="number"
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                    />
                  </div>

                {/* Advance Ranking Preview */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Qualifying Competitors Preview (Top {advanceCount})
                  </div>

                  {advancingCompetitors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      No ranked results available yet. Confirming will automatically compute from the live scoreboard.
                    </div>
                  ) : (
                    <>
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                            <th className="p-2.5 font-mono">Rank</th>
                            <th className="p-2.5 font-mono">Competitor</th>
                            <th className="p-2.5 font-mono">Best</th>
                            <th className="p-2.5 font-mono">Average</th>
                            <th className="p-2.5 font-mono">Attempts</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {advancingCompetitors.map((c: any) => (
                            <tr key={c.groupCompetitorId} className="hover:bg-slate-50/80">
                              <td className="p-2.5 font-bold font-mono text-indigo-600">#{c.rank}</td>
                              <td className="p-2.5 font-bold text-slate-900">{c.competitorName}</td>
                              <td className="p-2.5 font-mono text-slate-600">{msToDisplay(c.bestTimeMs)}</td>
                              <td className="p-2.5 font-mono font-bold text-indigo-600">{msToDisplay(c.averageTimeMs)}</td>
                              <td className="p-2.5 text-slate-500 font-mono">{c.completedSolves} solves</td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                      {/* Cutoff warning note */}
                      {event.cutoffTimeMs && liveBoard?.competitors?.some((c: any) => c.isCutoffReached) && (
                        <div className="p-2.5 border-t border-amber-100 bg-amber-50 text-[10px] text-amber-700 font-semibold flex items-center gap-1.5">
                          <span>⚠️</span>
                          <span>Competitors who failed to meet the Cutoff Time ({msToDisplay(event.cutoffTimeMs)}) or DNF have been automatically filtered out.</span>
                        </div>
                      )}
                    </>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsAdvanceOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                  >
                    Cancel
                  </button>
                  <button
                    disabled={isLoading || isNoStationsAssigned}
                    onClick={() => {
                      setIsAdvanceOpen(false);
                      doAction(
                        () => advanceRound(event.id, Number(roundNumber), {
                          nextRoundNumber: Number(roundNumber) + 1,
                          topN: Number(advanceCount),
                          competitorsPerGroup: Number(groupSize),
                          stationCount: sCount
                        }),
                        `Successfully advanced Top ${advanceCount} competitors to Round ${Number(roundNumber) + 1}!`
                      );
                    }}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Confirm Advance Round
                  </button>
                </div>
              </div>
            </div>
          );
        })()}
        </div>
      )}
    </div>
  );
}

// Collapsible Roster list inside Group Cards
function CollapsibleRoster({ list }: { list: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-slate-200 pt-3 mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-xs font-bold text-slate-700 hover:text-slate-900 transition-colors p-1 cursor-pointer"
      >
        <span className="font-mono text-slate-800">Competitors List ({list.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      {open && (
        <div className="mt-2.5 space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {list.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2 bg-slate-50 border border-slate-200 rounded-lg">No competitors assigned to this group yet.</p>
          ) : (
            list.map((c: any) => (
              <div key={c.groupCompetitorId} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 border border-slate-200 text-xs shadow-2xs">
                <div className="flex items-center gap-2">
                  <span className="font-bold text-slate-900">{c.competitorName}</span>
                  <span className="text-[9px] text-slate-600 bg-white border border-slate-200 px-1.5 py-0.5 rounded font-mono font-semibold uppercase shrink-0">
                    {c.competitorUserCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-slate-600 font-mono text-[11px] font-medium">Station {c.stationNumber ?? 'TBD'}</span>
                  <span className={`px-2 py-0.5 rounded font-bold uppercase font-mono text-[9px] ${c.competitorStatus === 'DONE' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    : c.competitorStatus === 'COMPETING' ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                      : 'text-slate-600 bg-slate-100 border-slate-200'
                    }`}>
                    {c.competitorStatus}
                  </span>
                </div>
              </div>
            ))
          )}
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
  const [judges, setJudges] = useState<TournamentJudgeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const [tData, jData] = await Promise.all([
          getTournamentById(id),
          getTournamentJudges(id).catch(() => []),
        ]);
        setTournament(tData);
        setJudges(jData);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load tournament');
      } finally {
        setIsLoading(false);
      }
    })();
  }, [id]);

  const assignedStations = judges
    .map((j) => j.assignedStationNumber)
    .filter((s): s is number => typeof s === 'number' && s > 0);
  const detectedStations = assignedStations.length > 0 ? Math.max(...assignedStations) : 0;

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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Groups & Scrambles</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Rounds & Heat Management</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Groups & Scrambles Management</h1>
          <p className="text-xs text-slate-500 mt-1">
            Generate competition groups, view official scramble sets, control rounds, and advance qualifying competitors.
          </p>
        </div>
      </div>

      {tournament.events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-2xs">
          <p className="text-slate-400 font-semibold text-sm">No events configured for this tournament yet.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournament.events
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((event) => (
              <EventGroupPanel key={event.id} event={event} tournamentId={id} defaultStationCount={detectedStations} />
            ))}
        </div>
      )}
    </div>
  );
}
