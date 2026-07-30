'use client';

import { useEffect, useState, use } from 'react';
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
  const [advanceCount, setAdvanceCount] = useState('8');

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

  // Lifecycle Stepper Rules mapping
  const groupsExist = groupsCount > 0;
  const stepStatus = {
    groups: groupsExist ? 'Done' : 'Pending',
    scrambles: scramblesGenerated ? 'Done' : (groupsExist ? 'Ready' : 'Pending'),
    start: roundStatus !== 'PENDING' ? 'Done' : (groupsExist && scramblesGenerated ? 'Ready' : 'Blocked'),
    lock: (roundStatus === 'LOCKED' || roundStatus === 'COMPLETED') ? 'Done' : (roundStatus === 'ONGOING' ? 'Ready' : 'Blocked'),
    complete: roundStatus === 'COMPLETED' ? 'Done' : (roundStatus === 'LOCKED' ? 'Ready' : 'Blocked'),
    advance: roundStatus === 'COMPLETED' ? 'Ready' : 'Blocked',
  };

  // Ranked competitors currently qualifying for next round
  const advancingCompetitors = liveBoard?.competitors
    ? [...liveBoard.competitors]
        .filter((c: any) => c.rank && c.rank <= Number(advanceCount))
        .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999))
    : [];

  return (
    <div className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
      {/* Event Header Panel */}
      <div className="flex items-center justify-between px-5 py-4 hover:bg-muted/30 transition">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center justify-between text-left"
        >
          <div>
            <div className="flex items-center gap-2">
              <span className="font-black text-foreground text-base tracking-tight">
                {event.puzzleTypeName || event.puzzleTypeCode}
              </span>
              {event.eventFormatCode === 'MEDLEY' && (
                <span className="rounded-full bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-600 dark:text-purple-400">
                  MEDLEY
                </span>
              )}
            </div>
            <div className="text-xs text-muted-foreground mt-0.5">
              {event.solveCount} solves · Limit: {msToDisplay(event.timeLimitMs)}
              {event.cutoffTimeMs ? ` · Cutoff: ${msToDisplay(event.cutoffTimeMs)}` : ''}
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {/* Compact Active Round and Status Badge */}
          {expanded && (
            <div className="flex items-center gap-2">
              {/* Round Switcher */}
              <div className="flex items-center gap-1 bg-muted/50 p-0.5 rounded-lg border border-border">
                <button
                  disabled={Number(roundNumber) <= 1 || isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Math.max(1, Number(prev) - 1)))}
                  className="p-1 rounded hover:bg-muted text-foreground disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-bold px-2 text-foreground font-mono">Round {roundNumber}</span>
                <button
                  disabled={isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Number(prev) + 1))}
                  className="p-1 rounded hover:bg-muted text-foreground transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Status Badge */}
              <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold border uppercase tracking-wider font-mono ${
                roundStatus === 'ONGOING' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                : roundStatus === 'LOCKED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                : roundStatus === 'COMPLETED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                : 'text-gray-400 bg-gray-500/10 border-border'
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
            <div className="rounded-xl border border-border bg-muted/15 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Current Round</span>
              <div className="mt-2 flex items-baseline gap-2">
                <span className="text-2xl font-black text-foreground">Round {roundNumber}</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">Status: {roundStatus}</span>
            </div>

            <div className="rounded-xl border border-border bg-muted/15 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Participants & Groups</span>
              <div className="mt-2">
                <span className="text-2xl font-black text-foreground">{totalCompetitors}</span>
                <span className="text-xs text-muted-foreground font-semibold ml-1">competitors</span>
              </div>
              <span className="text-xs text-muted-foreground mt-1">{groupsCount} groups · {activeStations} stations</span>
            </div>

            <div className="rounded-xl border border-border bg-muted/15 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Scramble Status</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-black text-foreground">
                  {scramblesStatus === 'Generated' ? 'Ready' : (scramblesStatus === 'Missing' ? 'Missing' : 'None')}
                </span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  scramblesStatus === 'Generated' ? 'bg-purple-500' : 'bg-amber-500'
                }`} />
              </div>
              <span className="text-xs text-purple-400 mt-1">Group sets generated</span>
            </div>

            <div className="rounded-xl border border-border bg-muted/15 p-4 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider font-mono">Submissions Progress</span>
              <div className="mt-2">
                <span className="text-2xl font-black text-foreground">{progressPercentage}%</span>
                <span className="text-xs text-muted-foreground font-semibold ml-2">
                  ({submittedSolves}/{totalSolves})
                </span>
              </div>
              <div className="w-full bg-border h-1.5 rounded-full overflow-hidden mt-2">
                <div
                  className="bg-primary h-full rounded-full transition-all duration-300"
                  style={{ width: `${progressPercentage}%` }}
                />
              </div>
            </div>
          </div>

          {/* Segmented Tab Headers */}
          <div className="flex border-b border-border mb-5 gap-4">
            {(['groups', 'scrambles', 'control'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-2.5 text-xs font-bold uppercase tracking-wider border-b-2 transition-all ${
                  activeTab === tab
                    ? 'border-primary text-primary font-black'
                    : 'border-transparent text-muted-foreground hover:text-foreground'
                }`}
              >
                {tab === 'groups' ? 'Groups Board' : tab === 'scrambles' ? 'Scrambles' : 'Round Control'}
              </button>
            ))}
            <button
              onClick={() => fetchLiveBoard(Number(roundNumber))}
              disabled={isLiveBoardLoading}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground p-1 transition"
            >
              <RefreshCw className={`h-3 w-3 ${isLiveBoardLoading ? 'animate-spin text-primary' : ''}`} />
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
                      <p className="font-bold text-sm text-foreground">Vòng {roundNumber} chưa có Nhóm thi đấu</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-md mb-4 leading-relaxed">
                        Danh sách thí sinh ở <strong>Vòng {roundNumber}</strong> phải được tuyển chọn từ kết quả xuất sắc của <strong>Vòng {Number(roundNumber) - 1}</strong>.
                        <br />
                        Vui lòng chuyển sang <strong>Vòng {Number(roundNumber) - 1}</strong>, hoàn thành thi đấu và chọn nút <strong className="text-orange-400">"Advance Round"</strong> để tuyển chọn thí sinh tiến vào Vòng {roundNumber}.
                      </p>
                    </>
                  ) : (
                    <>
                      <p className="font-bold text-sm text-foreground">Chưa tạo nhóm thi đấu cho Vòng 1</p>
                      <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
                        Trước khi bắt đầu thi đấu Vòng 1, bạn cần tạo các nhóm thi đấu và phân bổ bàn thi cho các thí sinh.
                      </p>
                      <button
                        onClick={() => setIsGenerateGroupsOpen(true)}
                        className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600 px-4 py-2.5 text-xs font-bold text-white hover:bg-orange-500 transition shadow-sm cursor-pointer"
                      >
                        <Shuffle className="h-3.5 w-3.5" /> Tạo Nhóm Thi Đấu Vòng 1
                      </button>
                    </>
                  )}
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold font-mono">
                      Groups Structure Board ({groupsCount} groups)
                    </span>
                    <button
                      onClick={() => setIsGenerateGroupsOpen(true)}
                      className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border border-border bg-card hover:bg-muted text-xs font-bold text-foreground transition"
                    >
                      <Shuffle className="h-3 w-3" /> Re-generate Groups
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

                      const groupStatusColor = group.statusCode === 'PENDING' ? 'text-gray-400 bg-gray-500/10'
                        : group.statusCode === 'ONGOING' ? 'text-emerald-400 bg-emerald-500/10 border-emerald-500/20'
                        : group.statusCode === 'LOCKED' ? 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                        : group.statusCode === 'COMPLETED' ? 'text-blue-400 bg-blue-500/10 border-blue-500/20'
                        : 'text-gray-400 bg-gray-500/10';

                      return (
                        <div key={group.groupId} className="rounded-xl border border-border bg-muted/5 p-4 flex flex-col justify-between">
                          <div>
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-black text-sm text-foreground">{group.groupName}</span>
                              <span className={`px-2 py-0.5 rounded text-[9px] font-bold border uppercase tracking-wider font-mono ${groupStatusColor}`}>
                                {groupStatusText}
                              </span>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-muted-foreground font-medium mb-4">
                              <Users className="h-3.5 w-3.5" />
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
                <div className="flex flex-col items-center justify-center py-12 text-center bg-muted/5 rounded-2xl border border-dashed border-border p-6">
                  <Shuffle className="h-10 w-10 text-muted-foreground/35 mb-3" />
                  <p className="font-bold text-sm text-foreground">Scrambles cannot be generated yet.</p>
                  <p className="text-xs text-muted-foreground mt-1 max-w-sm mb-4">
                    Please generate Groups first in order to allocate scramble sets to specific heats.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground font-bold font-mono">
                      Scrambles Sets Management
                    </span>
                    <button
                      disabled={isLoading || isScramblesReady}
                      onClick={() => doAction(
                        () => generateScrambles(event.id, { roundNumber: Number(roundNumber) }),
                        'Scrambles generated successfully!'
                      )}
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition shadow-sm ${
                        isScramblesReady
                          ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 cursor-not-allowed'
                          : 'bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60'
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
                        <div key={group.groupId} className="p-4 rounded-xl border border-border bg-muted/5">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-xs font-bold text-foreground">{group.groupName}</span>
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                              scrambles ? 'text-purple-400 bg-purple-500/10 border-purple-500/20' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'
                            }`}>
                              {scrambles ? 'Generated' : 'Missing'}
                            </span>
                          </div>

                          {isScramblesLoading ? (
                            <div className="flex items-center justify-center py-6">
                              <Loader2 className="h-4 w-4 animate-spin text-purple-500" />
                            </div>
                          ) : scrambles && scrambles.length > 0 ? (
                            <div className="space-y-2">
                              {scrambles.map((s: any) => (
                                <div key={s.id} className="text-xs flex flex-col sm:flex-row items-start gap-2 p-2 bg-card rounded border border-border">
                                  <span className="font-bold text-purple-400 min-w-[60px] font-mono">Solve {s.solveNumber}:</span>
                                  <span className="font-mono break-all text-foreground/90 select-all tracking-wider">{s.sequence}</span>
                                </div>
                              ))}
                            </div>
                          ) : scrambles ? (
                            <p className="text-xs text-muted-foreground italic py-2">
                              Scrambles generated, details unavailable from current API.
                            </p>
                          ) : (
                            <p className="text-xs text-amber-500 italic py-2 flex items-center gap-1.5">
                              <AlertCircle className="h-3.5 w-3.5" />
                              No scrambles generated for this group yet. Click Generate Scrambles above.
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

          {/* TAB 3: ROUND CONTROL (LIFE CYCLE WORKFLOW STEPPER) */}
          {activeTab === 'control' && !isLiveBoardLoading && (
            <div className="space-y-4">
              <span className="text-xs text-muted-foreground font-bold font-mono block mb-2">
                Workflow Lifecycle Stepper
              </span>

              <div className="space-y-3">
                {/* 1. Generate Groups */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      stepStatus.groups === 'Done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30' : 'bg-muted border border-border text-muted-foreground'
                    }`}>
                      {stepStatus.groups === 'Done' ? <Check className="h-3 w-3" /> : '1'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Generate Groups & Stations</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Define group parameters and allocate target competitor slots.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading}
                    onClick={() => setIsGenerateGroupsOpen(true)}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-60 transition"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    {groupsExist ? 'Regenerate Groups' : 'Configure & Generate'}
                  </button>
                </div>

                {/* 2. Generate Scrambles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      stepStatus.scrambles === 'Done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : (stepStatus.scrambles === 'Ready' ? 'bg-purple-500/20 text-purple-400 border border-purple-500/30' : 'bg-muted border border-border text-muted-foreground')
                    }`}>
                      {stepStatus.scrambles === 'Done' ? <Check className="h-3 w-3" /> : '2'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Generate Scrambles</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">
                        {isScramblesReady ? 'Scrambles generated for all groups.' : 'Generate solve scramble sequences for all competitors in this round.'}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.scrambles === 'Pending' || isScramblesReady}
                    onClick={() => doAction(
                      () => generateScrambles(event.id, { roundNumber: Number(roundNumber) }),
                      'Scrambles generated!'
                    )}
                    className={`sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-bold transition ${
                      isScramblesReady
                        ? 'bg-purple-500/10 border border-purple-500/30 text-purple-400 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-500 disabled:opacity-60'
                    }`}
                  >
                    {isScramblesReady ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    {isScramblesReady ? 'Scrambles Ready' : 'Generate Scrambles'}
                  </button>
                </div>

                {/* 3. Start Round */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      stepStatus.start === 'Done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : (stepStatus.start === 'Ready' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 animate-pulse' : 'bg-muted border border-border text-muted-foreground')
                    }`}>
                      {stepStatus.start === 'Done' ? <Check className="h-3 w-3" /> : '3'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Start Active Round</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Activate solving station Hub connection pipelines and open competitor scan flow.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.start !== 'Ready'}
                    onClick={() => doAction(
                      () => startRound(event.id, Number(roundNumber), {}),
                      `Round ${roundNumber} started!`
                    )}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60 transition"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start Round
                  </button>
                </div>

                {/* 4. Lock Results */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      stepStatus.lock === 'Done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : (stepStatus.lock === 'Ready' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'bg-muted border border-border text-muted-foreground')
                    }`}>
                      {stepStatus.lock === 'Done' ? <Check className="h-3 w-3" /> : '4'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Lock Round Results</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Block station scoring modifications and sign-off result submissions.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.lock !== 'Ready'}
                    onClick={() => doAction(
                      () => lockRoundResults(event.id, Number(roundNumber)),
                      `Round ${roundNumber} results locked!`
                    )}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-amber-500 disabled:opacity-60 transition"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Lock Results
                  </button>
                </div>

                {/* 5. Complete Round */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      stepStatus.complete === 'Done' ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                      : (stepStatus.complete === 'Ready' ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30' : 'bg-muted border border-border text-muted-foreground')
                    }`}>
                      {stepStatus.complete === 'Done' ? <Check className="h-3 w-3" /> : '5'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Complete Round</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Confirm submission checks and finalize rankings for competitor advancement.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.complete !== 'Ready'}
                    onClick={() => doAction(
                      () => completeRound(event.id, Number(roundNumber)),
                      `Round ${roundNumber} completed!`
                    )}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60 transition"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete Round
                  </button>
                </div>

                {/* 6. Advance Round */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-border bg-card">
                  <div className="flex items-start gap-3">
                    <span className={`w-6 h-6 rounded-full flex items-center justify-center text-xs font-black font-mono ${
                      stepStatus.advance === 'Ready' ? 'bg-orange-500/20 text-orange-400 border border-orange-500/30 animate-pulse' : 'bg-muted border border-border text-muted-foreground'
                    }`}>
                      6
                    </span>
                    <div>
                      <p className="text-xs font-bold text-foreground">Advance Competitors to Next Round</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">Move top ranked competitors to the next round structure and generate new groups.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.advance !== 'Ready'}
                    onClick={() => setIsAdvanceOpen(true)}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-1.5 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-60 transition"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Advance Round
                  </button>
                </div>
              </div>


            </div>
          )}
        </div>
      )}
               {/* GENERATE GROUPS MODAL */}
          {isGenerateGroupsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="relative w-full max-w-md p-6 md:p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl space-y-6 overflow-hidden">
                <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <Shuffle className="h-6 w-6 text-amber-400" />
                    <h3 className="text-lg font-black text-white tracking-tight">Cấu Hình Tạo Nhóm Thi Đấu</h3>
                  </div>
                  <button
                    onClick={() => setIsGenerateGroupsOpen(false)}
                    className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-400 leading-relaxed">
                  Thiết lập thông số chia nhóm thi đấu cho <strong className="text-amber-400">Vòng {roundNumber}</strong> - Môn <strong className="text-white">{event.puzzleTypeName || event.puzzleTypeCode}</strong>.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-2">
                      Số lượng thí sinh trong 1 nhóm
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-4 py-3 text-sm text-white font-bold outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                      placeholder="Ví dụ: 8 thí sinh / nhóm"
                    />
                  </div>

                  <div className="rounded-2xl border border-amber-500/20 bg-amber-500/10 p-4 text-xs space-y-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 text-zinc-300 font-medium">
                        <ShieldCheck className="h-4 w-4 text-amber-400 shrink-0" />
                        <span>Số bàn thi đấu hiện có:</span>
                      </div>
                      <span className="font-bold text-xs bg-amber-500/20 text-amber-300 px-3 py-1 rounded-full border border-amber-500/30">
                        {stationCount} Bàn khả dụng
                      </span>
                    </div>
                    <p className="text-[11px] text-zinc-400 leading-snug">
                      💡 Thí sinh sẽ được chia đều để lượt thi diễn ra liên tục trên {stationCount} bàn trọng tài.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-3 pt-3">
                  <button
                    type="button"
                    onClick={() => setIsGenerateGroupsOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => {
                      setIsGenerateGroupsOpen(false);
                      doAction(
                        () => generateGroups(event.id, {
                          roundNumber: Number(roundNumber),
                          competitorsPerGroup: Number(groupSize),
                          stationCount: Number(stationCount)
                        }),
                        'Đã khởi tạo thành công các Nhóm thi đấu!'
                      );
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-white text-white" />}
                    Xác Nhận Tạo Nhóm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCE ROUND CONFIRMATION MODAL */}
          {isAdvanceOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
              <div className="relative w-full max-w-2xl p-6 md:p-8 bg-zinc-900 border border-zinc-800 rounded-3xl shadow-2xl flex flex-col max-h-[85vh] space-y-5 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-zinc-800">
                  <div className="flex items-center gap-2.5 text-amber-400">
                    <Zap className="h-6 w-6 text-amber-400 fill-amber-400" />
                    <h3 className="text-lg font-black text-white tracking-tight">Cấu Hình Tăng Vòng (Advance Round)</h3>
                  </div>
                  <button
                    onClick={() => setIsAdvanceOpen(false)}
                    className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors cursor-pointer"
                  >
                    <X className="h-5 w-5" />
                  </button>
                </div>

                <p className="text-xs text-zinc-400">
                  Tuyển chọn các thí sinh có thứ hạng xuất sắc nhất Vòng {roundNumber} tiến vào <strong className="text-amber-400">Vòng {Number(roundNumber) + 1}</strong>.
                </p>

                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Số Lấy Vào (Top N)</label>
                    <input
                      type="number"
                      value={advanceCount}
                      onChange={(e) => setAdvanceCount(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500/60 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Size Nhóm Mới</label>
                    <input
                      type="number"
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500/60 font-bold"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-zinc-300 mb-1.5">Số Bàn Thi</label>
                    <input
                      type="number"
                      value={stationCount}
                      onChange={(e) => setStationCount(e.target.value)}
                      className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 px-3.5 py-2.5 text-xs text-white outline-none focus:border-amber-500/60 font-bold"
                    />
                  </div>
                </div>

                {/* Advance Ranking Preview */}
                <div className="flex-1 overflow-y-auto border border-zinc-800 rounded-2xl bg-zinc-950">
                  <div className="p-3 bg-zinc-900/80 border-b border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-wider font-mono">
                    Danh Sách Thí Sinh Dự Kiến Đi Tiếp (Top {advanceCount})
                  </div>

                  {advancingCompetitors.length === 0 ? (
                    <div className="p-8 text-center text-xs text-zinc-500 italic flex flex-col items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 text-amber-500" />
                      Chưa có kết quả xếp hạng. Bấm Xác Nhận để hệ thống tự động tính toán từ bảng thành tích.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-zinc-800 bg-zinc-900/40 text-zinc-400 font-bold text-[10px] uppercase">
                          <th className="p-3 font-mono">Hạng</th>
                          <th className="p-3 font-mono">Thí Sinh</th>
                          <th className="p-3 font-mono">Best</th>
                          <th className="p-3 font-mono">Average</th>
                          <th className="p-3 font-mono">Số Lượt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-zinc-800/50">
                        {advancingCompetitors.map((c: any) => (
                          <tr key={c.groupCompetitorId} className="hover:bg-zinc-800/30">
                            <td className="p-3 font-bold font-mono text-amber-400">#{c.rank}</td>
                            <td className="p-3 font-bold text-white">{c.competitorName}</td>
                            <td className="p-3 font-mono text-zinc-300">{msToDisplay(c.bestTimeMs)}</td>
                            <td className="p-3 font-mono font-bold text-amber-300">{msToDisplay(c.averageTimeMs)}</td>
                            <td className="p-3 text-zinc-400 font-mono">{c.completedSolves} lượt</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex items-center justify-end gap-3 pt-2">
                  <button
                    onClick={() => setIsAdvanceOpen(false)}
                    className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3 px-5 rounded-2xl uppercase tracking-wider transition-all cursor-pointer"
                  >
                    Hủy Bỏ
                  </button>
                  <button
                    disabled={isLoading}
                    onClick={() => {
                      setIsAdvanceOpen(false);
                      doAction(
                        () => advanceRound(event.id, Number(roundNumber), {
                          nextRoundNumber: Number(roundNumber) + 1,
                          topN: Number(advanceCount),
                          competitorsPerGroup: Number(groupSize),
                          stationCount: Number(stationCount)
                        }),
                        `Đã chuyển thành công Top ${advanceCount} thí sinh vào Vòng ${Number(roundNumber) + 1}!`
                      );
                    }}
                    className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs py-3 px-6 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all cursor-pointer"
                  >
                    {isLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <Zap className="h-4 w-4 fill-white text-white" />}
                    Xác Nhận Chuyển Vòng
                  </button>
                </div>
              </div>
            </div>
          )}
    </div>
  );
}

// Collapsible Roster list inside Group Cards
function CollapsibleRoster({ list }: { list: any[] }) {
  const [open, setOpen] = useState(false);

  return (
    <div className="border-t border-border/60 pt-3 mt-1">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between text-left text-xs font-bold text-muted-foreground hover:text-foreground transition-colors p-1"
      >
        <span className="font-mono">Danh Sách Thí Sinh ({list.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5" /> : <ChevronDown className="h-3.5 w-3.5" />}
      </button>

      {open && (
        <div className="mt-2.5 space-y-1.5 max-h-[160px] overflow-y-auto pr-1">
          {list.length === 0 ? (
            <p className="text-[10px] text-muted-foreground italic p-2 bg-muted/20 rounded">Chưa có thí sinh nào được xếp vào nhóm này.</p>
          ) : (
            list.map((c: any) => (
              <div key={c.groupCompetitorId} className="flex items-center justify-between p-1.5 rounded bg-card border border-border/40 text-[10px]">
                <div className="flex items-center gap-1">
                  <span className="font-bold text-foreground">{c.competitorName}</span>
                  <span className="text-[8px] text-muted-foreground bg-muted border border-border px-1 rounded font-mono uppercase shrink-0">
                    {c.competitorUserCode}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-muted-foreground font-mono">Station {c.stationNumber ?? 'TBD'}</span>
                  <span className={`px-1.5 rounded-[3px] font-bold uppercase font-mono ${
                    c.competitorStatus === 'DONE' ? 'text-emerald-500 bg-emerald-500/10'
                    : c.competitorStatus === 'COMPETING' ? 'text-primary bg-primary/10'
                    : 'text-gray-400 bg-gray-500/10'
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
  const detectedStations = assignedStations.length > 0 ? Math.max(...assignedStations) : 4;

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
        <span className="text-foreground font-semibold font-mono">Dashboard Operations</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h1 className="text-2xl font-black text-foreground tracking-tight">Round Operations Dashboard</h1>
          <p className="text-sm text-muted-foreground mt-1">
            Manage groups layout, check scramble sequences details, start round pipelines, and advance top ranked competitors.
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
              <EventGroupPanel key={event.id} event={event} tournamentId={id} defaultStationCount={detectedStations} />
            ))}
        </div>
      )}
    </div>
  );
}
