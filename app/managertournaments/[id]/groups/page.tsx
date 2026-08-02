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
                {event.puzzleTypeName || event.puzzleTypeCode}
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
                  className="p-1 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-bold px-2 text-slate-800 font-mono">Round {roundNumber}</span>
                <button
                  disabled={isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Number(prev) + 1))}
                  className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors"
                >
                  <ChevronRight className="h-3 w-3" />
                </button>
              </div>

              {/* Status Badge */}
              <span className={`px-2 py-0.5 rounded text-[10px] font-bold border uppercase tracking-wider ${
                roundStatus === 'ONGOING' ? 'text-emerald-700 bg-emerald-50 border-emerald-200'
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
              <span className="text-xs text-slate-500 mt-1">Trạng thái: <strong className="text-slate-900">{roundStatus}</strong></span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Participants & Groups</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-slate-900">{totalCompetitors}</span>
                <span className="text-xs text-slate-500 font-semibold ml-1">thí sinh</span>
              </div>
              <span className="text-xs text-slate-500 mt-1">{groupsCount} nhóm · {activeStations} bàn thi</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Scramble Status</span>
              <div className="mt-2 flex items-center gap-2">
                <span className="text-2xl font-bold text-slate-900">
                  {scramblesStatus === 'Generated' ? 'Ready' : (scramblesStatus === 'Missing' ? 'Missing' : 'None')}
                </span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${
                  scramblesStatus === 'Generated' ? 'bg-emerald-500' : 'bg-amber-500'
                }`} />
              </div>
              <span className="text-xs text-indigo-600 font-semibold mt-1">Đã tạo chuỗi Scramble</span>
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
            {(['groups', 'scrambles', 'control'] as const).map((tab) => (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                className={`pb-3 text-xs font-bold uppercase tracking-wider border-b-2 transition-all cursor-pointer ${
                  activeTab === tab
                    ? 'border-indigo-600 text-indigo-600 font-bold'
                    : 'border-transparent text-slate-500 hover:text-slate-900'
                }`}
              >
                {tab === 'groups' ? 'Groups Board' : tab === 'scrambles' ? 'Scrambles' : 'Round Control'}
              </button>
            ))}
            <button
              onClick={() => fetchLiveBoard(Number(roundNumber))}
              disabled={isLiveBoardLoading}
              className="ml-auto flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 p-1 transition cursor-pointer"
            >
              <RefreshCw className={`h-3 w-3 ${isLiveBoardLoading ? 'animate-spin text-indigo-600' : ''}`} />
              Đồng Bộ Dữ Liệu
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
                              <span>{groupComps.length} Thí sinh</span>
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
                      className={`inline-flex items-center gap-1.5 rounded-lg px-3.5 py-1.5 text-xs font-bold transition shadow-2xs ${
                        isScramblesReady
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
                            <span className={`text-[9px] font-bold px-2 py-0.5 rounded border uppercase tracking-wider font-mono ${
                              scrambles ? 'text-indigo-700 bg-indigo-50 border-indigo-200' : 'text-amber-700 bg-amber-50 border-amber-200'
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
                              Chưa tạo chuỗi Scramble cho nhóm này. Bấm nút Tạo Scrambles phía trên.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          )}`

          {/* TAB 3: ROUND CONTROL (LIFE CYCLE WORKFLOW STEPPER) */}
          {activeTab === 'control' && !isLiveBoardLoading && (
            <div className="space-y-4 max-w-4xl mx-auto w-full">
              <span className="text-xs text-slate-500 font-bold font-mono block mb-2">
                QUY TRÌNH ĐIỀU HÀNH VÒNG THI (LIFECYCLE STEPPER)
              </span>

              <div className="space-y-3">
                {/* 1. Generate Groups */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      stepStatus.groups === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}>
                      {stepStatus.groups === 'Done' ? <Check className="h-3.5 w-3.5" /> : '1'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">1. Tạo Nhóm Thi & Trạm Bàn Thi (Generate Groups & Stations)</p>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Phân chia nhóm thi đấu và gán bàn thi cho từng thí sinh.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading}
                    onClick={() => setIsGenerateGroupsOpen(true)}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-2xs cursor-pointer"
                  >
                    <Shuffle className="h-3.5 w-3.5" />
                    {groupsExist ? 'Regenerate Groups' : 'Configure & Generate'}
                  </button>
                </div>

                {/* 2. Generate Scrambles */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      stepStatus.scrambles === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (stepStatus.scrambles === 'Ready' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 border border-slate-200 text-slate-700')
                    }`}>
                      {stepStatus.scrambles === 'Done' ? <Check className="h-3.5 w-3.5" /> : '2'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">2. Tạo Chuỗi Scramble (Generate Scrambles)</p>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">
                        {isScramblesReady ? 'Đã khởi tạo xong chuỗi xáo trộn cho toàn bộ các nhóm.' : 'Sinh ngẫu nhiên bộ scramble chính thức cho vòng đấu này.'}
                      </p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.scrambles === 'Pending' || isScramblesReady}
                    onClick={() => doAction(
                      () => generateScrambles(event.id, { roundNumber: Number(roundNumber) }),
                      'Scrambles generated!'
                    )}
                    className={`sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition shadow-2xs cursor-pointer ${
                      isScramblesReady
                        ? 'bg-purple-50 border border-purple-200 text-purple-700 cursor-not-allowed'
                        : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'
                    }`}
                  >
                    {isScramblesReady ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                    {isScramblesReady ? 'Scrambles Ready' : 'Generate Scrambles'}
                  </button>
                </div>

                {/* 3. Start Round */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      stepStatus.start === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (stepStatus.start === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' : 'bg-slate-100 border border-slate-200 text-slate-700')
                    }`}>
                      {stepStatus.start === 'Done' ? <Check className="h-3.5 w-3.5" /> : '3'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">3. Khai Mạc Vòng Đấu (Start Active Round)</p>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Kích hoạt kết nối SignalR Hub cho các bàn thi và cho phép trọng tài quét mã QR.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.start !== 'Ready'}
                    onClick={() => doAction(
                      () => startRound(event.id, Number(roundNumber), {}),
                      `Round ${roundNumber} started!`
                    )}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-emerald-700 disabled:opacity-60 transition shadow-2xs cursor-pointer"
                  >
                    <Play className="h-3.5 w-3.5" />
                    Start Round
                  </button>
                </div>

                {/* 4. Lock Results */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      stepStatus.lock === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (stepStatus.lock === 'Ready' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 border border-slate-200 text-slate-700')
                    }`}>
                      {stepStatus.lock === 'Done' ? <Check className="h-3.5 w-3.5" /> : '4'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">4. Khóa Bảng Điểm (Lock Round Results)</p>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Ngăn các trạm bàn thi gửi thêm điểm và chốt kiểm tra kết quả đối soát.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.lock !== 'Ready'}
                    onClick={() => doAction(
                      () => lockRoundResults(event.id, Number(roundNumber)),
                      `Round ${roundNumber} results locked!`
                    )}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-amber-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-amber-700 disabled:opacity-60 transition shadow-2xs cursor-pointer"
                  >
                    <Lock className="h-3.5 w-3.5" />
                    Lock Results
                  </button>
                </div>

                {/* 5. Complete Round */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      stepStatus.complete === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : (stepStatus.complete === 'Ready' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 border border-slate-200 text-slate-700')
                    }`}>
                      {stepStatus.complete === 'Done' ? <Check className="h-3.5 w-3.5" /> : '5'}
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">5. Hoàn Tất Vòng Đấu (Complete Round)</p>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Xác nhận thứ hạng chính thức để chuẩn bị thăng hạng thí sinh.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.complete !== 'Ready'}
                    onClick={() => doAction(
                      () => completeRound(event.id, Number(roundNumber)),
                      `Round ${roundNumber} completed!`
                    )}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-blue-700 disabled:opacity-60 transition shadow-2xs cursor-pointer"
                  >
                    <CheckCircle2 className="h-3.5 w-3.5" />
                    Complete Round
                  </button>
                </div>

                {/* 6. Advance Round */}
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                  <div className="flex items-start gap-3">
                    <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${
                      stepStatus.advance === 'Ready' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' : 'bg-slate-100 border border-slate-200 text-slate-700'
                    }`}>
                      6
                    </span>
                    <div>
                      <p className="text-xs font-bold text-slate-900">6. Thăng Hạng Thí Sinh Vào Vòng Kế (Advance Competitors)</p>
                      <p className="text-xs text-slate-600 font-medium mt-0.5">Chuyển top thí sinh xuất sắc nhất vào vòng tiếp theo và tự động tạo nhóm mới.</p>
                    </div>
                  </div>
                  <button
                    disabled={isLoading || stepStatus.advance !== 'Ready'}
                    onClick={() => setIsAdvanceOpen(true)}
                    className="sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 px-3.5 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-60 transition shadow-2xs cursor-pointer"
                  >
                    <Zap className="h-3.5 w-3.5" />
                    Advance Round
                  </button>
                </div>
              </div>`
            </div>
          )}

          {/* GENERATE GROUPS MODAL */}
          {isGenerateGroupsOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="relative w-full max-w-md p-6 bg-white border border-slate-200 rounded-xl shadow-2xl space-y-4 text-slate-900 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Cấu Hình Tạo Nhóm Thi Đấu</h3>
                  <button
                    onClick={() => setIsGenerateGroupsOpen(false)}
                    className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500 leading-relaxed">
                  Thiết lập thông số chia nhóm thi đấu cho <strong className="text-indigo-600">Vòng {roundNumber}</strong> - Môn <strong className="text-slate-900">{event.puzzleTypeName || event.puzzleTypeCode}</strong>.
                </p>

                <div className="space-y-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                      Số lượng thí sinh trong 1 nhóm
                    </label>
                    <input
                      type="number"
                      min="1"
                      max="50"
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                      placeholder="Ví dụ: 8 thí sinh / nhóm"
                    />
                  </div>

                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs space-y-1.5">
                    <div className="flex items-center justify-between">
                      <span className="text-slate-600 font-medium">Số bàn thi đấu hiện có:</span>
                      <span className="font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-0.5 rounded border border-indigo-200 font-mono">
                        {stationCount} Bàn khả dụng
                      </span>
                    </div>
                    <p className="text-[11px] text-slate-500 leading-snug">
                      Thí sinh sẽ được chia đều để lượt thi diễn ra liên tục trên {stationCount} bàn trọng tài.
                    </p>
                  </div>
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    type="button"
                    onClick={() => setIsGenerateGroupsOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Xác Nhận Tạo Nhóm
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ADVANCE ROUND CONFIRMATION MODAL */}
          {isAdvanceOpen && (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
              <div className="relative w-full max-w-2xl p-6 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[85vh] space-y-4 text-slate-900 overflow-hidden">
                <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                  <h3 className="text-base font-bold text-slate-900">Cấu Hình Tăng Vòng (Advance Round)</h3>
                  <button
                    onClick={() => setIsAdvanceOpen(false)}
                    className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer"
                  >
                    <X className="h-4 w-4" />
                  </button>
                </div>

                <p className="text-xs text-slate-500">
                  Tuyển chọn các thí sinh có thứ hạng xuất sắc nhất Vòng {roundNumber} tiến vào <strong className="text-indigo-600">Vòng {Number(roundNumber) + 1}</strong>.
                </p>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Số Lấy Vào (Top N)</label>
                    <input
                      type="number"
                      value={advanceCount}
                      onChange={(e) => setAdvanceCount(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Size Nhóm Mới</label>
                    <input
                      type="number"
                      value={groupSize}
                      onChange={(e) => setGroupSize(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Số Bàn Thi</label>
                    <input
                      type="number"
                      value={stationCount}
                      onChange={(e) => setStationCount(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                    />
                  </div>
                </div>

                {/* Advance Ranking Preview */}
                <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                  <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                    Danh Sách Thí Sinh Dự Kiến Đi Tiếp (Top {advanceCount})
                  </div>

                  {advancingCompetitors.length === 0 ? (
                    <div className="p-6 text-center text-xs text-slate-500 italic">
                      Chưa có kết quả xếp hạng. Bấm Xác Nhận để hệ thống tự động tính toán từ bảng thành tích.
                    </div>
                  ) : (
                    <table className="w-full text-left text-xs border-collapse">
                      <thead>
                        <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                          <th className="p-2.5 font-mono">Hạng</th>
                          <th className="p-2.5 font-mono">Thí Sinh</th>
                          <th className="p-2.5 font-mono">Best</th>
                          <th className="p-2.5 font-mono">Average</th>
                          <th className="p-2.5 font-mono">Số Lượt</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-slate-100">
                        {advancingCompetitors.map((c: any) => (
                          <tr key={c.groupCompetitorId} className="hover:bg-slate-50/80">
                            <td className="p-2.5 font-bold font-mono text-indigo-600">#{c.rank}</td>
                            <td className="p-2.5 font-bold text-slate-900">{c.competitorName}</td>
                            <td className="p-2.5 font-mono text-slate-600">{msToDisplay(c.bestTimeMs)}</td>
                            <td className="p-2.5 font-mono font-bold text-indigo-600">{msToDisplay(c.averageTimeMs)}</td>
                            <td className="p-2.5 text-slate-500 font-mono">{c.completedSolves} lượt</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  )}
                </div>

                <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                  <button
                    onClick={() => setIsAdvanceOpen(false)}
                    className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
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
                    className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                  >
                    {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                    Xác Nhận Chuyển Vòng
                  </button>
                </div>
              </div>
            </div>
          )}
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
        <span className="font-mono text-slate-800">Danh Sách Thí Sinh ({list.length})</span>
        {open ? <ChevronUp className="h-3.5 w-3.5 text-slate-500" /> : <ChevronDown className="h-3.5 w-3.5 text-slate-500" />}
      </button>

      {open && (
        <div className="mt-2.5 space-y-1.5 max-h-[180px] overflow-y-auto pr-1">
          {list.length === 0 ? (
            <p className="text-xs text-slate-500 italic p-2 bg-slate-50 border border-slate-200 rounded-lg">Chưa có thí sinh nào được xếp vào nhóm này.</p>
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
                  <span className={`px-2 py-0.5 rounded font-bold uppercase font-mono text-[9px] ${
                    c.competitorStatus === 'DONE' ? 'text-emerald-700 bg-emerald-50 border border-emerald-200'
                    : c.competitorStatus === 'COMPETING' ? 'text-indigo-700 bg-indigo-50 border border-indigo-200'
                    : 'text-slate-600 bg-slate-100 border border-slate-200'
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
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">Giải Đấu</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Quản Lý Nhóm & Scramble</span>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Vòng Thi & Nhóm Thi</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">Quản Lý Nhóm & Scramble</h1>
          <p className="text-xs text-slate-500 mt-1">
            Khởi tạo nhóm thi đấu, xem chuỗi Scramble chính thức, bắt đầu vòng thi và thăng hạng thí sinh.
          </p>
        </div>
      </div>

      {tournament.events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center shadow-2xs">
          <p className="text-slate-400 font-semibold text-sm">Chưa có hạng mục thi đấu nào cho giải này.</p>
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
