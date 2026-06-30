'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import { getTournamentById, generateGroups, generateScrambles } from '@/lib/api/tournaments';
import {
  startRound,
  lockRoundResults,
  completeRound,
  advanceRound,
  completeEvent,
  getLiveBoardState,
  getGroupScrambles,
} from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import { toast } from '@/lib/toast';
import { ConfirmationModal } from '@/components/tournament-manager/ConfirmationModal';
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
  const [activeAction, setActiveAction] = useState<string | null>(null);
  const isLoading = activeAction !== null;
  const isExecutingRef = useRef(false);

  // Live Preview States
  const [liveState, setLiveState] = useState<any>(null);
  const [isLoadingPreview, setIsLoadingPreview] = useState(false);
  const [previewError, setPreviewError] = useState<string | null>(null);
  const [selectedPreviewGroupId, setSelectedPreviewGroupId] = useState<string | null>(null);
  const [scramblesMap, setScramblesMap] = useState<Record<string, any[]>>({});
  const [showScramblesMap, setShowScramblesMap] = useState<Record<string, boolean>>({});

  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    title: string;
    description: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void | Promise<void>;
    variant?: 'danger' | 'warning' | 'info' | 'success';
  }>({
    isOpen: false,
    title: '',
    description: '',
    onConfirm: () => {},
  });

  const requestConfirm = (
    title: string,
    description: string,
    action: () => void,
    variant: 'danger' | 'warning' | 'info' | 'success' = 'warning',
    confirmText = 'Xác nhận'
  ) => {
    setConfirmModal({
      isOpen: true,
      title,
      description,
      confirmText,
      variant,
      onConfirm: () => {
        action();
        setConfirmModal(prev => ({ ...prev, isOpen: false }));
      }
    });
  };

  const fetchPreviewData = useCallback(async () => {
    if (!expanded) return;
    setIsLoadingPreview(true);
    setPreviewError(null);
    try {
      const state = await getLiveBoardState(event.id, Number(roundNumber));
      setLiveState(state);
      if (state && state.groups && state.groups.length > 0) {
        const exists = state.groups.some((g: any) => g.groupId === selectedPreviewGroupId);
        if (!exists) {
          setSelectedPreviewGroupId(state.groups[0].groupId);
          const scrambles = await getGroupScrambles(state.groups[0].groupId).catch(() => []);
          setScramblesMap(prev => ({ ...prev, [state.groups[0].groupId]: scrambles }));
        }
      } else {
        setSelectedPreviewGroupId(null);
      }
    } catch (err) {
      console.warn('Failed to load preview data:', err);
      setLiveState(null);
      setSelectedPreviewGroupId(null);
    } finally {
      setIsLoadingPreview(false);
    }
  }, [expanded, event.id, roundNumber, selectedPreviewGroupId]);

  useEffect(() => {
    fetchPreviewData();
  }, [expanded, roundNumber]);

  const fetchGroupScramblesIfNeeded = async (groupId: string) => {
    if (scramblesMap[groupId]) return;
    try {
      const list = await getGroupScrambles(groupId);
      setScramblesMap(prev => ({ ...prev, [groupId]: list }));
    } catch (err) {
      console.warn('Failed to load scrambles:', err);
      setScramblesMap(prev => ({ ...prev, [groupId]: [] }));
    }
  };

  const toggleScramblesVisibility = (groupId: string) => {
    setShowScramblesMap(prev => ({ ...prev, [groupId]: !prev[groupId] }));
    fetchGroupScramblesIfNeeded(groupId);
  };

  const doAction = async (actionKey: string, fn: () => Promise<unknown>, successMsg: string) => {
    if (isExecutingRef.current) return;
    isExecutingRef.current = true;
    setActiveAction(actionKey);
    try {
      await fn();
      toast.success(successMsg);
      fetchPreviewData();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : 'Action failed');
    } finally {
      isExecutingRef.current = false;
      setActiveAction(null);
    }
  };

  const handleGenerateGroups = () => {
    const round = parseInt(roundNumber);
    const size = parseInt(groupSize);
    const stations = parseInt(stationCount);

    if (isNaN(round) || round <= 0) {
      toast.error('Round Number must be a positive integer.');
      return;
    }
    if (isNaN(size) || size <= 0) {
      toast.error('Group Size must be a positive integer.');
      return;
    }
    if (isNaN(stations) || stations <= 0) {
      toast.error('Station Count must be a positive integer.');
      return;
    }

    requestConfirm(
      'Tạo nhóm thi đấu',
      `Bạn có chắc chắn muốn tạo các nhóm thi đấu cho vòng ${round}? Hành động này có thể ghi đè dữ liệu nhóm hiện có.`,
      () => {
        doAction(
          'groups',
          () => generateGroups(event.id, {
            roundNumber: round,
            competitorsPerGroup: size,
            stationCount: stations
          }),
          'Groups generated successfully!'
        );
      },
      'info',
      'Tạo Nhóm'
    );
  };

  const handleGenerateScrambles = () => {
    const round = parseInt(roundNumber);
    if (isNaN(round) || round <= 0) {
      toast.error('Round Number must be a positive integer.');
      return;
    }
    requestConfirm(
      'Tạo chuỗi xáo trộn (Scrambles)',
      `Bạn có chắc chắn muốn sinh chuỗi Scramble mới cho vòng ${round}?`,
      () => {
        doAction(
          'scrambles',
          () => generateScrambles(event.id, { roundNumber: round }),
          'Scrambles generated successfully!'
        );
      },
      'info',
      'Tạo Scrambles'
    );
  };

  const handleStartRound = () => {
    const round = parseInt(roundNumber);
    if (isNaN(round) || round <= 0) {
      toast.error('Round Number must be a positive integer.');
      return;
    }
    requestConfirm(
      'Bắt đầu vòng đấu',
      `Bạn có chắc chắn muốn BẮT ĐẦU Vòng ${round}? Trọng tài có thể ghi nhận kết quả ngay lập tức.`,
      () => {
        doAction(
          'startRound',
          () => startRound(event.id, round, {}),
          `Round ${round} started!`
        );
      },
      'success',
      'Bắt đầu Vòng'
    );
  };

  const handleLockResults = () => {
    const round = parseInt(roundNumber);
    if (isNaN(round) || round <= 0) {
      toast.error('Round Number must be a positive integer.');
      return;
    }
    requestConfirm(
      'Khóa kết quả vòng đấu',
      `Bạn có chắc chắn muốn KHÓA kết quả Vòng ${round}? Trọng tài sẽ không thể thay đổi điểm số sau khi khóa.`,
      () => {
        doAction(
          'lockResults',
          () => lockRoundResults(event.id, round),
          `Round ${round} results locked!`
        );
      },
      'warning',
      'Khóa kết quả'
    );
  };

  const handleCompleteRound = () => {
    const round = parseInt(roundNumber);
    if (isNaN(round) || round <= 0) {
      toast.error('Round Number must be a positive integer.');
      return;
    }
    requestConfirm(
      'Hoàn thành vòng đấu',
      `Bạn có chắc chắn muốn HOÀN THÀNH Vòng ${round}?`,
      () => {
        doAction(
          'completeRound',
          () => completeRound(event.id, round),
          `Round ${round} completed!`
        );
      },
      'success',
      'Hoàn thành Vòng'
    );
  };

  const handleAdvanceRound = () => {
    const round = parseInt(roundNumber);
    const adv = parseInt(advanceCount);
    const size = parseInt(groupSize);
    const stations = parseInt(stationCount);

    if (isNaN(round) || round <= 0) {
      toast.error('Round Number must be a positive integer.');
      return;
    }
    if (isNaN(adv) || adv <= 0) {
      toast.error('Advance Count must be a positive integer.');
      return;
    }
    if (isNaN(size) || size <= 0) {
      toast.error('Group Size must be a positive integer.');
      return;
    }
    if (isNaN(stations) || stations <= 0) {
      toast.error('Station Count must be a positive integer.');
      return;
    }

    requestConfirm(
      'Chọn người đi tiếp (Advance)',
      `Bạn có chắc chắn muốn chọn top ${adv} thí sinh đứng đầu đi tiếp từ vòng ${round} sang vòng ${round + 1}?`,
      () => {
        doAction(
          'advanceRound',
          () => advanceRound(event.id, round, {
            nextRoundNumber: round + 1,
            topN: adv,
            competitorsPerGroup: size,
            stationCount: stations
          }),
          `Top ${adv} competitors advanced!`
        );
      },
      'success',
      'Cho đi tiếp'
    );
  };

  const handleCompleteEvent = () => {
    requestConfirm(
      'Hoàn thành Sự kiện',
      `Bạn có chắc chắn muốn đóng và kết thúc sự kiện "${event.puzzleTypeName || event.puzzleTypeCode}"? Hành động này không thể hoàn tác.`,
      () => {
        doAction('completeEvent', () => completeEvent(event.id), 'Event completed!');
      },
      'danger',
      'Hoàn thành Sự kiện'
    );
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
        <span className="flex-shrink-0">
          {expanded ? (
            <ChevronUp key="up" className="h-4 w-4 text-muted-foreground" />
          ) : (
            <ChevronDown key="down" className="h-4 w-4 text-muted-foreground" />
          )}
        </span>
      </button>

      {expanded && (
        <div className="border-t border-border px-5 pb-5">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 mt-4">
            {/* Left Column: Operations (cols 5) */}
            <div className="lg:col-span-5 space-y-4">
              {/* Generate Groups */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Generate Groups</p>
                <div className="grid grid-cols-2 gap-3 mb-3">
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Group Size</label>
                    <input type="number" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} min="1"
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Station Count</label>
                    <input type="number" value={stationCount} onChange={(e) => setStationCount(e.target.value)} min="1"
                      className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
                  </div>
                </div>
                <button
                  disabled={isLoading}
                  onClick={handleGenerateGroups}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:bg-primary/90 disabled:opacity-60 transition"
                >
                  <span className="inline-flex items-center justify-center">
                    {activeAction === 'groups' ? <Loader2 key="loading" className="h-3.5 w-3.5 animate-spin" /> : <Shuffle key="shuffle" className="h-3.5 w-3.5" />}
                  </span>
                  Generate Groups & Assign Stations
                </button>
              </div>

              {/* Generate Scrambles */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
                <p className="text-xs font-bold text-foreground mb-3 uppercase tracking-wider">Generate Scrambles</p>
                <div className="mb-3">
                  <label className="block text-[10px] font-semibold text-muted-foreground mb-1">Round Number</label>
                  <input type="number" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}
                    min="1"
                    className="w-full rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary" />
                </div>
                <button
                  disabled={isLoading}
                  onClick={handleGenerateScrambles}
                  className="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-purple-600 px-4 py-2 text-xs font-bold text-white hover:bg-purple-500 disabled:opacity-60 transition"
                >
                  <span className="inline-flex items-center justify-center">
                    {activeAction === 'scrambles' ? <Loader2 key="loading" className="h-3.5 w-3.5 animate-spin" /> : <Zap key="zap" className="h-3.5 w-3.5" />}
                  </span>
                  Generate Scrambles
                </button>
              </div>

              {/* Round Operations */}
              <div className="rounded-xl border border-border bg-muted/20 p-4">
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
                    onClick={handleStartRound}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-emerald-600 px-3 py-2 text-xs font-bold text-white hover:bg-emerald-500 disabled:opacity-60">
                    <span className="inline-flex items-center justify-center">
                      {activeAction === 'startRound' ? <Loader2 key="loading" className="h-3 w-3 animate-spin" /> : <Play key="play" className="h-3 w-3" />}
                    </span>
                    Start Round
                  </button>
                  <button disabled={isLoading}
                    onClick={handleLockResults}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-muted border border-border px-3 py-2 text-xs font-bold text-foreground hover:bg-muted/80 disabled:opacity-60">
                    <span className="inline-flex items-center justify-center">
                      {activeAction === 'lockResults' ? <Loader2 key="loading" className="h-3 w-3 animate-spin" /> : <Lock key="lock" className="h-3 w-3" />}
                    </span>
                    Lock Results
                  </button>
                  <button disabled={isLoading}
                    onClick={handleCompleteRound}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-blue-600 px-3 py-2 text-xs font-bold text-white hover:bg-blue-500 disabled:opacity-60">
                    <span className="inline-flex items-center justify-center">
                      {activeAction === 'completeRound' ? <Loader2 key="loading" className="h-3 w-3 animate-spin" /> : <CheckCircle key="check" className="h-3 w-3" />}
                    </span>
                    Complete Round
                  </button>
                  <button disabled={isLoading}
                    onClick={handleAdvanceRound}
                    className="inline-flex items-center justify-center gap-1.5 rounded-lg bg-orange-600 px-3 py-2 text-xs font-bold text-white hover:bg-orange-500 disabled:opacity-60">
                    <span className="inline-flex items-center justify-center">
                      {activeAction === 'advanceRound' ? <Loader2 key="loading" className="h-3 w-3 animate-spin" /> : <Zap key="zap" className="h-3 w-3" />}
                    </span>
                    Advance Round
                  </button>
                </div>

                {/* Complete Event */}
                <button
                  disabled={isLoading}
                  onClick={handleCompleteEvent}
                  className="mt-2 w-full inline-flex items-center justify-center gap-2 rounded-lg border border-border bg-card px-3 py-2 text-xs font-bold text-muted-foreground hover:bg-muted/50 disabled:opacity-60 transition"
                >
                  <span className="inline-flex items-center justify-center">
                    {activeAction === 'completeEvent' ? <Loader2 key="loading" className="h-3.5 w-3.5 animate-spin" /> : <Flag key="flag" className="h-3 w-3" />}
                  </span>
                  Complete Event
                </button>
              </div>
            </div>

            {/* Right Column: Live Preview (cols 7) */}
            <div className="lg:col-span-7 rounded-xl border border-border bg-card p-4 space-y-4">
              <div className="flex items-center justify-between border-b border-border pb-2.5">
                <span className="text-xs font-bold text-foreground uppercase tracking-wider flex items-center gap-1.5">
                  <Layers className="h-3.5 w-3.5 text-primary" /> Live Preview (Round {roundNumber})
                </span>
                <button
                  type="button"
                  onClick={fetchPreviewData}
                  className="rounded-lg border border-border p-1.5 text-muted-foreground hover:bg-muted/50 hover:text-foreground transition"
                  title="Refresh Preview"
                >
                  <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPreview ? 'animate-spin' : ''}`} />
                </button>
              </div>

              {isLoadingPreview && (
                <div className="py-8 flex justify-center">
                  <Loader2 className="h-5 w-5 animate-spin text-primary" />
                </div>
              )}

              {previewError && (
                <div className="text-xs text-red-500 bg-red-500/10 border border-red-500/20 p-3 rounded-lg flex items-center gap-2">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  {previewError}
                </div>
              )}

              {!isLoadingPreview && !previewError && (!liveState || !liveState.groups || liveState.groups.length === 0) && (
                <div className="py-10 text-center text-xs text-muted-foreground">
                  No groups generated yet for Round {roundNumber}. Use the controls on the left to generate groups.
                </div>
              )}

              {!isLoadingPreview && !previewError && liveState && liveState.groups && liveState.groups.length > 0 && (
                <div className="space-y-4">
                  {/* List of Groups */}
                  <div className="flex flex-wrap gap-2">
                    {liveState.groups.map((g: any) => {
                      const isSelected = selectedPreviewGroupId === g.groupId;
                      return (
                        <button
                          key={g.groupId}
                          type="button"
                          onClick={() => {
                            setSelectedPreviewGroupId(g.groupId);
                            fetchGroupScramblesIfNeeded(g.groupId);
                          }}
                          className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition ${
                            isSelected
                              ? 'bg-primary/10 border-primary text-primary'
                              : 'bg-muted/30 border-border text-muted-foreground hover:text-foreground hover:bg-muted/50'
                          }`}
                        >
                          {g.groupName}
                        </button>
                      );
                    })}
                  </div>

                  {/* Selected Group Competitors & Scrambles */}
                  {selectedPreviewGroupId && (
                    <div className="space-y-4 pt-2 border-t border-border/60">
                      {/* Competitors List */}
                      <div>
                        <p className="text-[11px] font-bold text-foreground mb-2 uppercase tracking-wide">Competitors & Stations</p>
                        <div className="overflow-hidden rounded-lg border border-border/60">
                          <table className="w-full text-xs text-left">
                            <thead>
                              <tr className="bg-muted/30 border-b border-border/60">
                                <th className="px-3 py-2 font-semibold">Station</th>
                                <th className="px-3 py-2 font-semibold">Competitor</th>
                                <th className="px-3 py-2 font-semibold text-right">Status</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-border/60 text-foreground">
                              {liveState.competitors && liveState.competitors
                                .filter((c: any) => c.groupId === selectedPreviewGroupId)
                                .map((c: any) => (
                                  <tr key={c.groupCompetitorId} className="hover:bg-muted/10">
                                    <td className="px-3 py-2 font-mono text-muted-foreground">#{c.stationNumber}</td>
                                    <td className="px-3 py-2 font-medium">{c.displayName}</td>
                                    <td className="px-3 py-2 text-right">
                                      <span className={`inline-flex rounded-full px-1.5 py-0.5 text-[10px] font-bold ${
                                        c.isDone ? 'bg-emerald-500/10 text-emerald-600' : 'bg-yellow-500/10 text-yellow-600'
                                      }`}>
                                        {c.isDone ? 'Finished' : 'Pending'}
                                      </span>
                                    </td>
                                  </tr>
                                ))}
                              {(!liveState.competitors || liveState.competitors.filter((c: any) => c.groupId === selectedPreviewGroupId).length === 0) && (
                                <tr>
                                  <td colSpan={3} className="px-3 py-4 text-center text-muted-foreground">No competitors assigned to this group.</td>
                                </tr>
                              )}
                            </tbody>
                          </table>
                        </div>
                      </div>

                      {/* Scrambles List */}
                      <div>
                        <div className="flex items-center justify-between mb-2">
                          <p className="text-[11px] font-bold text-foreground uppercase tracking-wide">Scramble Sequences</p>
                          <button
                            type="button"
                            onClick={() => toggleScramblesVisibility(selectedPreviewGroupId)}
                            className="text-[10px] font-semibold text-primary hover:underline"
                          >
                            {showScramblesMap[selectedPreviewGroupId] ? 'Hide Scrambles' : 'Show Scrambles'}
                          </button>
                        </div>
                        {showScramblesMap[selectedPreviewGroupId] ? (
                          <div className="space-y-1.5">
                            {scramblesMap[selectedPreviewGroupId] ? (
                              scramblesMap[selectedPreviewGroupId].map((s: any) => (
                                <div key={s.id} className="rounded-lg border border-border/60 bg-muted/20 px-3 py-2 flex flex-col sm:flex-row sm:items-start gap-2">
                                  <span className="text-[10px] font-bold text-muted-foreground font-mono w-16 pt-0.5">Attempt {s.solveNumber}</span>
                                  <span className="text-[11px] font-mono text-foreground font-semibold break-all">{s.sequence}</span>
                                </div>
                              ))
                            ) : (
                              <div className="py-2 text-center text-[11px] text-muted-foreground">
                                Loading scrambles...
                              </div>
                            )}
                            {scramblesMap[selectedPreviewGroupId] && scramblesMap[selectedPreviewGroupId].length === 0 && (
                              <div className="py-2 text-center text-[11px] text-muted-foreground">
                                No scrambles generated yet. Click "Generate Scrambles" to create them.
                              </div>
                            )}
                          </div>
                        ) : (
                          <div className="bg-muted/10 border border-border/40 rounded-lg p-3 text-center text-[11px] text-muted-foreground italic">
                            Scramble sequences are hidden. Click "Show Scrambles" to view them.
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <ConfirmationModal
        isOpen={confirmModal.isOpen}
        title={confirmModal.title}
        description={confirmModal.description}
        confirmText={confirmModal.confirmText}
        cancelText={confirmModal.cancelText || 'Hủy'}
        variant={confirmModal.variant}
        isLoading={isLoading}
        onConfirm={confirmModal.onConfirm}
        onCancel={() => setConfirmModal(prev => ({ ...prev, isOpen: false }))}
      />
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
