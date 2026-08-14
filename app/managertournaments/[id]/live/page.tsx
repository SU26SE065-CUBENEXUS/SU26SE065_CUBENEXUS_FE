'use client';

import { useEffect, useState, use, useRef, useCallback } from 'react';
import Link from 'next/link';
import * as signalR from '@microsoft/signalr';
import { API_BASE_URL } from '@/lib/api/config';
import { getTournamentById, getTournamentJudges, generateGroups, generateScrambles } from '@/lib/api/tournaments';
import {
  checkIn,
  submitTraditionalResult,
  submitMedleyResult,
  verifyJudgeStation,
  getLiveBoardState,
  getGroupScrambles,
  getPenaltyTypes,
  startRound,
  lockRoundResults,
  completeRound,
  advanceRound,
  completeEvent,
  correctResult,
  formatEvidencePhotoUrl,
} from '@/lib/api/operations';
import type { TournamentDetailDto, EventDetailDto } from '@/lib/api/types';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import { StationStatusBadge, type StationState } from '@/components/tournament-manager/StationStatusBadge';
import { ScrambleDisplay } from '@/components/tournament-manager/ScrambleDisplay';
import { formatMs } from '@/components/tournament-manager/TimerDisplay';
import {
  ChevronRight,
  ChevronLeft,
  ChevronUp,
  ChevronDown,
  Trophy,
  Radio,
  QrCode,
  AlertCircle,
  CheckCircle,
  CheckCircle2,
  Loader2,
  Scan,
  ClipboardEdit,
  TimerIcon,
  ShieldCheck,
  Check,
  RefreshCw,
  Play,
  Lock,
  Wifi,
  WifiOff,
  Monitor,
  ArrowRight,
  Zap,
  Shuffle,
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

function EventRoundControlPanel({
  event,
  tournamentId,
  defaultStationCount = 4,
}: {
  event: EventDetailDto;
  tournamentId: string;
  defaultStationCount?: number;
}) {
  const [expanded, setExpanded] = useState(true);
  const [roundNumber, setRoundNumber] = useState('1');

  // Form configurations
  const [groupSize, setGroupSize] = useState('8');
  const [stationCount, setStationCount] = useState(defaultStationCount.toString());
  const [advanceCount, setAdvanceCount] = useState(event.advanceTopN?.toString() || '16');
  const [selectedCompEventIds, setSelectedCompEventIds] = useState<string[]>([]);

  useEffect(() => {
    setStationCount(defaultStationCount.toString());
  }, [defaultStationCount]);

  useEffect(() => {
    if (event.advanceTopN) {
      setAdvanceCount(event.advanceTopN.toString());
    }
  }, [event.advanceTopN]);

  // Live board state
  const [liveBoard, setLiveBoard] = useState<any>(null);
  const [isLiveBoardLoading, setIsLiveBoardLoading] = useState(false);

  // Group scrambles
  const [groupScrambles, setGroupScrambles] = useState<Record<string, any[]>>({});

  // Modals
  const [isGenerateGroupsOpen, setIsGenerateGroupsOpen] = useState(false);
  const [isAdvanceOpen, setIsAdvanceOpen] = useState(false);

  // Track if we already did the initial auto-populate for this modal open
  const didAutoPopulate = useRef(false);

  useEffect(() => {
    if (isAdvanceOpen && liveBoard?.competitors && !didAutoPopulate.current) {
      didAutoPopulate.current = true;
      const topN = event.advanceTopN || Number(advanceCount);
      const isAvg = (event.solveCount || 5) >= 3;
      const eligible = [...liveBoard.competitors]
        .filter((c: any) => {
          if (!c.rank || c.isCutoffReached) return false;
          return isAvg
            ? c.averageTimeMs && c.averageTimeMs > 0 && c.averageTimeMs < 2147483647
            : c.bestTimeMs && c.bestTimeMs > 0 && c.bestTimeMs < 2147483647;
        })
        .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999));

      const topNIds = eligible.slice(0, topN).map((c: any) => c.registrationEventId || c.groupCompetitorId).filter(Boolean);
      setSelectedCompEventIds(topNIds);
    }
    if (!isAdvanceOpen) {
      // Reset flag when modal closes so next open will auto-populate again
      didAutoPopulate.current = false;
      setSelectedCompEventIds([]);
    }
  }, [isAdvanceOpen, liveBoard, event.advanceTopN, event.solveCount]);

  // Global actions loading & notifications
  const [isLoading, setIsLoading] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Fetch Live Board Status
  const fetchLiveBoard = useCallback(async (roundNum: number) => {
    setIsLiveBoardLoading(true);
    try {
      const data = await getLiveBoardState(event.id, roundNum);
      setLiveBoard(data);
    } catch {
      setLiveBoard(null);
    } finally {
      setIsLiveBoardLoading(false);
    }
  }, [event.id]);

  useEffect(() => {
    fetchLiveBoard(Number(roundNumber));
  }, [roundNumber, fetchLiveBoard]);

  // Fetch scrambles for generated groups
  useEffect(() => {
    if (!liveBoard?.groups || liveBoard.groups.length === 0) {
      setGroupScrambles({});
      return;
    }
    const fetchScrambles = async () => {
      const newScrambles: Record<string, any[]> = {};
      await Promise.all(
        liveBoard.groups.map(async (g: any) => {
          try {
            const list = await getGroupScrambles(g.groupId);
            newScrambles[g.groupId] = list;
          } catch {}
        })
      );
      setGroupScrambles(newScrambles);
    };
    fetchScrambles();
  }, [liveBoard?.groups]);

  // Helper action executor
  const doAction = async (actionFn: () => Promise<unknown>, successMsg: string) => {
    setIsLoading(true);
    setMessage(null);
    setError(null);
    try {
      await actionFn();
      setMessage(successMsg);
      await fetchLiveBoard(Number(roundNumber));
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Action failed');
    } finally {
      setIsLoading(false);
    }
  };

  // Computed properties
  const roundStatus = liveBoard?.roundStatus || 'PENDING';
  const groupsCount = liveBoard?.groups?.length ?? 0;
  const groupsExist = groupsCount > 0;
  const scramblesGenerated = groupsExist && liveBoard.groups.every((g: any) => {
    const list = groupScrambles[g.groupId];
    return list && list.length > 0;
  });
  const isScramblesReady = scramblesGenerated;

  const stepStatus = {
    groups: groupsExist ? 'Done' : 'Pending',
    scrambles: scramblesGenerated ? 'Done' : (groupsExist ? 'Ready' : 'Pending'),
    start: roundStatus !== 'PENDING' ? 'Done' : (groupsExist && scramblesGenerated ? 'Ready' : 'Blocked'),
    lock: (roundStatus === 'LOCKED' || roundStatus === 'COMPLETED') ? 'Done' : (roundStatus === 'ONGOING' ? 'Ready' : 'Blocked'),
    complete: roundStatus === 'COMPLETED' ? 'Done' : (roundStatus === 'LOCKED' ? 'Ready' : 'Blocked'),
    advance: roundStatus === 'COMPLETED' ? 'Ready' : 'Blocked',
  };

  const totalCompetitors = liveBoard?.progress?.totalCompetitors ?? 0;
  const totalSolves = liveBoard?.progress?.totalExpectedSolves ?? 0;
  const submittedSolves = liveBoard?.progress?.submittedSolves ?? 0;
  const progressPercentage = totalSolves > 0 ? Math.round((submittedSolves / totalSolves) * 100) : 0;
  const activeStations = liveBoard?.competitors
    ? Math.max(...liveBoard.competitors.map((c: any) => c.stationNumber || 0), 0)
    : 0;

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
      {/* Panel Header */}
      <div className="flex items-center justify-between px-5 py-4 hover:bg-slate-50/70 transition">
        <button
          onClick={() => setExpanded((v) => !v)}
          className="flex-1 flex items-center justify-between text-left cursor-pointer"
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
            </div>
          </div>
        </button>

        <div className="flex items-center gap-3">
          {expanded && (
            <div className="flex items-center gap-2">
              {/* Round Switcher */}
              <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                <button
                  disabled={Number(roundNumber) <= 1 || isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Math.max(1, Number(prev) - 1)))}
                  className="p-1 rounded hover:bg-slate-200 text-slate-700 disabled:opacity-40 transition-colors cursor-pointer"
                >
                  <ChevronLeft className="h-3 w-3" />
                </button>
                <span className="text-[10px] font-bold px-2 text-slate-800 font-mono">Round {roundNumber}</span>
                <button
                  disabled={isLoading || isLiveBoardLoading}
                  onClick={() => setRoundNumber((prev) => String(Number(prev) + 1))}
                  className="p-1 rounded hover:bg-slate-200 text-slate-700 transition-colors cursor-pointer"
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
            className="p-1 rounded hover:bg-slate-100 text-slate-500 cursor-pointer"
          >
            {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </button>
        </div>
      </div>

      {expanded && (
        <div className="border-t border-slate-200 px-5 pb-6 pt-4 bg-slate-50/20">
          {/* Notifications */}
          {message && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-600">
              <CheckCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 font-semibold">{message}</div>
              <button onClick={() => setMessage(null)} className="underline hover:text-emerald-500 transition-colors cursor-pointer">Dismiss</button>
            </div>
          )}
          {error && (
            <div className="mb-4 flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600">
              <AlertCircle className="h-4 w-4 shrink-0" />
              <div className="flex-1 font-semibold">{error}</div>
              <button onClick={() => setError(null)} className="underline hover:text-red-500 transition-colors cursor-pointer">Dismiss</button>
            </div>
          )}

          {/* Overview Summary Cards */}
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
                  {isScramblesReady ? 'Ready' : (groupsExist ? 'Missing' : 'None')}
                </span>
                <span className={`inline-block w-2.5 h-2.5 rounded-full ${isScramblesReady ? 'bg-emerald-500' : 'bg-amber-500'}`} />
              </div>
              <span className="text-xs text-indigo-600 font-semibold mt-1">{isScramblesReady ? 'Đã tạo chuỗi Scramble' : 'Chưa tạo Scramble'}</span>
            </div>

            <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-2xs text-slate-900 flex flex-col justify-between">
              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider font-mono">Submissions Progress</span>
              <div className="mt-2">
                <span className="text-2xl font-bold text-indigo-600">{progressPercentage}%</span>
                <span className="text-xs text-slate-500 font-semibold ml-2">({submittedSolves}/{totalSolves})</span>
              </div>
              <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden mt-2 border border-slate-200">
                <div className="bg-indigo-600 h-full rounded-full transition-all duration-300" style={{ width: `${progressPercentage}%` }} />
              </div>
            </div>
          </div>

          {/* Stepper Section */}
          <div className="space-y-4 max-w-4xl mx-auto w-full">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs text-slate-500 font-bold font-mono block">
                QUY TRÌNH ĐIỀU HÀNH VÒNG THI (LIFECYCLE STEPPER)
              </span>
              <button
                onClick={() => fetchLiveBoard(Number(roundNumber))}
                disabled={isLiveBoardLoading}
                className="flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider text-slate-500 hover:text-slate-900 p-1 transition cursor-pointer"
              >
                <RefreshCw className={`h-3 w-3 ${isLiveBoardLoading ? 'animate-spin text-indigo-600' : ''}`} />
                Đồng Bộ Dữ Liệu
              </button>
            </div>

            <div className="space-y-3">
              {/* Step 1: Generate Groups */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stepStatus.groups === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
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

              {/* Step 2: Generate Scrambles */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stepStatus.scrambles === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : stepStatus.scrambles === 'Ready' ? 'bg-purple-50 text-purple-700 border border-purple-200' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
                    {stepStatus.scrambles === 'Done' ? <Check className="h-3.5 w-3.5" /> : '2'}
                  </span>
                  <div>
                    <p className="text-xs font-bold text-slate-900">2. Tạo Chuỗi Scramble (Generate Scrambles)</p>
                    <p className="text-xs text-slate-600 font-medium mt-0.5">{isScramblesReady ? 'Đã khởi tạo xong chuỗi xáo trộn cho toàn bộ các nhóm.' : 'Sinh ngẫu nhiên bộ scramble chính thức cho vòng đấu này.'}</p>
                  </div>
                </div>
                <button
                  disabled={isLoading || stepStatus.scrambles === 'Pending' || isScramblesReady}
                  onClick={() => doAction(
                    () => generateScrambles(event.id, { roundNumber: Number(roundNumber) }),
                    'Scrambles generated!'
                  )}
                  className={`sm:self-center inline-flex items-center justify-center gap-1.5 rounded-lg px-3.5 py-2 text-xs font-semibold transition shadow-2xs cursor-pointer ${isScramblesReady ? 'bg-purple-50 border border-purple-200 text-purple-700 cursor-not-allowed' : 'bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60'}`}
                >
                  {isScramblesReady ? <Check className="h-3.5 w-3.5" /> : <Zap className="h-3.5 w-3.5" />}
                  {isScramblesReady ? 'Scrambles Ready' : 'Generate Scrambles'}
                </button>
              </div>

              {/* Step 3: Start Round */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stepStatus.start === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : stepStatus.start === 'Ready' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 animate-pulse' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
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
                  <Play className="h-3.5 w-3.5" /> Start Round
                </button>
              </div>

              {/* Step 4: Lock Results */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stepStatus.lock === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : stepStatus.lock === 'Ready' ? 'bg-amber-50 text-amber-700 border border-amber-200' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
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
                  <Lock className="h-3.5 w-3.5" /> Lock Results
                </button>
              </div>

              {/* Step 5: Complete Round */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stepStatus.complete === 'Done' ? 'bg-emerald-50 text-emerald-700 border border-emerald-200' : stepStatus.complete === 'Ready' ? 'bg-blue-50 text-blue-700 border border-blue-200' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
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
                  <CheckCircle2 className="h-3.5 w-3.5" /> Complete Round
                </button>
              </div>

              {/* Step 6: Advance Round */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 p-4 rounded-xl border border-slate-200 bg-white shadow-2xs text-slate-900">
                <div className="flex items-start gap-3">
                  <span className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold font-mono shrink-0 ${stepStatus.advance === 'Ready' ? 'bg-indigo-50 text-indigo-700 border border-indigo-200 animate-pulse' : 'bg-slate-100 border border-slate-200 text-slate-700'}`}>
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
                  <Zap className="h-3.5 w-3.5" /> Advance Round
                </button>
              </div>
            </div>
          </div>

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
                    <h3 className="text-base font-bold text-slate-900">Cấu Hình Tạo Nhóm Thi Đấu</h3>
                    <button onClick={() => setIsGenerateGroupsOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                  <p className="text-xs text-slate-500 leading-relaxed">
                    Thiết lập thông số chia nhóm thi đấu cho <strong className="text-indigo-600">Vòng {roundNumber}</strong> - Môn <strong className="text-slate-900">{formatEventLabel(event)}</strong>.
                  </p>

                  {/* NO STATIONS / JUDGES UNASSIGNED ALERT */}
                  {isNoStationsAssigned && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Chưa Phân Công Trọng Tài & Bàn Thi!</strong>
                        Chưa có bàn thi đấu nào được gắn với Trọng tài. Vui lòng hoàn thành <strong>Bước 1 (Phân công Trọng tài & Bàn thi)</strong> trước khi tạo nhóm thi đấu.
                      </div>
                    </div>
                  )}

                  <div className="space-y-3">
                    <div>
                      <div className="flex items-center justify-between mb-1">
                        <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono">
                          Số lượng thí sinh trong 1 nhóm
                        </label>
                        {totalEligibleCount > 0 && (
                          <span className="text-[10px] text-indigo-600 font-bold font-mono">
                            Tổng đủ điều kiện: {totalEligibleCount} thí sinh
                          </span>
                        )}
                      </div>
                      <input type="number" min="1" max={totalEligibleCount || undefined} value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className={`w-full rounded-lg border ${isGroupExceeded || isGroupLessThanStations ? 'border-red-500 bg-red-50/50' : 'border-slate-200 bg-slate-50'} px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600`} />
                    </div>

                    {!isNoStationsAssigned && (
                      <div className="rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs flex items-center justify-between">
                        <span className="text-slate-600 font-medium">Số bàn thi đấu khả dụng:</span>
                        <span className="font-bold text-xs bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded border border-indigo-200 font-mono">
                          {sCount} Bàn (Đã phân công Trọng tài)
                        </span>
                      </div>
                    )}
                  </div>

                  {/* Validation Alerts & Helper Box */}
                  {isGroupExceeded && (
                    <div className="p-2.5 bg-red-50 border border-red-200 rounded-lg text-xs text-red-700 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
                      <span>Số thí sinh/nhóm ({gSize}) không được lớn hơn tổng số thí sinh tham gia ({totalEligibleCount}).</span>
                    </div>
                  )}

                  {isGroupLessThanStations && (
                    <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-center gap-1.5">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
                      <span>Số thí sinh/nhóm ({gSize}) không được ít hơn số bàn thi khả dụng ({sCount} bàn).</span>
                    </div>
                  )}



                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button onClick={() => setIsGenerateGroupsOpen(false)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer">
                      Hủy Bỏ
                    </button>
                    <button
                      disabled={isLoading || isInvalid}
                      onClick={() => {
                        setIsGenerateGroupsOpen(false);
                        doAction(
                          () => generateGroups(event.id, { roundNumber: Number(roundNumber), competitorsPerGroup: gSize, stationCount: sCount }),
                          `Đã khởi tạo thành công các nhóm thi đấu cho Vòng ${roundNumber}!`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Tạo Nhóm Ngay
                    </button>
                  </div>
                </div>
              </div>
            );
          })()}

          {/* ADVANCE ROUND MODAL */}
          {isAdvanceOpen && (() => {
            const isAvgFormatLocal = (event.solveCount || 5) >= 3;
            const eligibleAll = liveBoard?.competitors
              ? [...liveBoard.competitors]
                .filter((c: any) => {
                  if (!c.rank || c.isCutoffReached) return false;
                  return isAvgFormatLocal
                    ? c.averageTimeMs && c.averageTimeMs > 0 && c.averageTimeMs < 2147483647
                    : c.bestTimeMs && c.bestTimeMs > 0 && c.bestTimeMs < 2147483647;
                })
                .sort((a: any, b: any) => (a.rank ?? 999) - (b.rank ?? 999))
              : [];

            const topNVal = Number(advanceCount);
            const candidateBoundary = eligibleAll[topNVal - 1];
            const candidateOutside = eligibleAll[topNVal];
            const hasTieBreakBoundary = candidateBoundary && candidateOutside && (
              candidateBoundary.rank === candidateOutside.rank ||
              (candidateBoundary.averageTimeMs === candidateOutside.averageTimeMs && candidateBoundary.bestTimeMs === candidateOutside.bestTimeMs)
            );

            const sCount = defaultStationCount || 0;
            const isNoStationsAssigned = sCount === 0;

            return (
              <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
                <div className="relative w-full max-w-2xl p-6 bg-white border border-slate-200 rounded-xl shadow-2xl flex flex-col max-h-[85vh] space-y-4 text-slate-900 overflow-hidden">
                  <div className="flex items-center justify-between pb-3 border-b border-slate-100">
                    <h3 className="text-base font-bold text-slate-900">Cấu Hình Tăng Vòng (Advance Round)</h3>
                    <button onClick={() => setIsAdvanceOpen(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors cursor-pointer">
                      <X className="h-4 w-4" />
                    </button>
                  </div>

                  <p className="text-xs text-slate-500 leading-relaxed">
                    Tuyển chọn các thí sinh xuất sắc từ <strong className="text-indigo-600">Vòng {roundNumber}</strong> tiến vào <strong className="text-indigo-600">Vòng {Number(roundNumber) + 1}</strong> - Môn <strong className="text-slate-900">{formatEventLabel(event)}</strong>.
                  </p>

                  {/* NO STATIONS ALERT */}
                  {isNoStationsAssigned && (
                    <div className="p-3 bg-red-50 border border-red-200 rounded-xl text-xs text-red-700 leading-relaxed flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-red-600 mt-0.5" />
                      <div>
                        <strong className="block font-bold mb-0.5">Chưa Phân Công Trọng Tài & Bàn Thi!</strong>
                        Chưa có bàn thi đấu nào được gắn với Trọng tài. Vui lòng hoàn thành <strong>Bước 1 (Phân công Trọng tài & Bàn thi)</strong> trước khi thăng hạng.
                      </div>
                    </div>
                  )}


                  {/* Top N Info banner - read only from event config */}
                  {event.advanceTopN && (
                    <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-indigo-50 border border-indigo-200 text-xs text-indigo-700 font-medium">
                      <CheckCircle2 className="h-3.5 w-3.5 shrink-0 text-indigo-500" />
                      Theo cấu hình giải đấu, <strong className="font-bold">{event.advanceTopN} thí sinh</strong> xuất sắc nhất sẽ tiến vào Vòng {Number(roundNumber) + 1}. Bạn có thể điều chỉnh lại bên dưới.
                    </div>
                  )}

                  {/* Group size input only */}
                  <div className="w-48">
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                      Size Nhóm Mới
                    </label>
                    <input type="number" min="1" value={groupSize} onChange={(e) => setGroupSize(e.target.value)} className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600" />
                  </div>

                  {/* Tie-Break Warning Badge */}
                  {hasTieBreakBoundary && (
                    <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-xs text-amber-800 font-medium flex items-start gap-2">
                      <AlertCircle className="h-4 w-4 shrink-0 text-amber-600 mt-0.5" />
                      <div>
                        <span className="font-bold">⚠️ Cảnh báo Đồng Hạng (Tie-Break):</span> Phát hiện nhiều hơn {topNVal} thí sinh bằng điểm ở vị trí ranh giới Top {topNVal} (Hạng #{candidateBoundary.rank}). Vui lòng tích chọn đúng {topNVal} thí sinh thắng lượt đấu phụ offline để đi tiếp Vòng {Number(roundNumber) + 1}.
                      </div>
                    </div>
                  )}

                  {/* Advance Preview Table with Manual Checkboxes */}
                  <div className="flex-1 overflow-y-auto border border-slate-200 rounded-lg bg-white">
                    <div className="p-2.5 bg-slate-50 border-b border-slate-200 text-[10px] font-bold text-slate-500 uppercase tracking-wider font-mono flex items-center justify-between">
                      <span>Danh Sách Thí Sinh Tuyển Chọn</span>
                      <span className="text-indigo-600 font-bold">
                        Đã chọn: {selectedCompEventIds.length} / {topNVal} thí sinh
                      </span>
                    </div>
                    {eligibleAll.length === 0 ? (
                      <div className="p-6 text-center text-xs text-slate-500 italic">Chưa có kết quả xếp hạng. Bấm Xác Nhận để hệ thống tự động tính toán.</div>
                    ) : (
                      <table className="w-full text-left text-xs border-collapse">
                        <thead>
                          <tr className="border-b border-slate-200 bg-slate-50 text-slate-500 font-bold text-[10px] uppercase">
                            <th className="p-2.5 w-10 text-center">Chọn</th>
                            <th className="p-2.5 font-mono">Hạng</th>
                            <th className="p-2.5 font-mono">Thí Sinh</th>
                            <th className="p-2.5 font-mono">Best</th>
                            <th className="p-2.5 font-mono">Average</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-100">
                          {eligibleAll.map((c: any) => {
                            const compId = c.registrationEventId || c.groupCompetitorId;
                            const isChecked = selectedCompEventIds.includes(compId);
                            const isLimitReached = !isChecked && selectedCompEventIds.length >= topNVal;
                            const isBoundaryTied = candidateBoundary && c.rank === candidateBoundary.rank;

                            return (
                              <tr key={c.groupCompetitorId} className={`hover:bg-slate-50/80 ${isBoundaryTied ? 'bg-amber-50/50' : ''}`}>
                                <td className="p-2.5 text-center">
                                  <input
                                    type="checkbox"
                                    checked={isChecked}
                                    disabled={isLimitReached}
                                    onChange={(e) => {
                                      if (e.target.checked) {
                                        if (selectedCompEventIds.length >= topNVal) {
                                          return;
                                        }
                                        setSelectedCompEventIds((prev) => [...prev, compId]);
                                      } else {
                                        setSelectedCompEventIds((prev) => prev.filter((id) => id !== compId));
                                      }
                                    }}
                                    className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500 h-4 w-4 cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed"
                                  />
                                </td>
                                <td className="p-2.5 font-bold font-mono text-indigo-600">
                                  #{c.rank}
                                  {isBoundaryTied && <span className="ml-1.5 text-[9px] bg-amber-100 text-amber-700 px-1 py-0.2 rounded font-semibold">TIE</span>}
                                </td>
                                <td className="p-2.5 font-bold text-slate-900">{c.competitorName}</td>
                                <td className="p-2.5 font-mono text-slate-600">{msToDisplay(c.bestTimeMs)}</td>
                                <td className="p-2.5 font-mono font-bold text-indigo-600">{msToDisplay(c.averageTimeMs)}</td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    )}
                  </div>

                  <div className="flex items-center justify-end gap-3 pt-3 border-t border-slate-100">
                    <button onClick={() => setIsAdvanceOpen(false)} className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer">
                      Hủy Bỏ
                    </button>
                    <button
                      disabled={isLoading || selectedCompEventIds.length === 0 || isNoStationsAssigned}
                      onClick={() => {
                        setIsAdvanceOpen(false);
                        doAction(
                          () => advanceRound(event.id, Number(roundNumber), {
                            nextRoundNumber: Number(roundNumber) + 1,
                            topN: selectedCompEventIds.length || Number(advanceCount),
                            competitorsPerGroup: Number(groupSize),
                            stationCount: sCount,
                            selectedRegistrationEventIds: selectedCompEventIds.length > 0 ? selectedCompEventIds : undefined
                          }),
                          `Đã chuyển thành công ${selectedCompEventIds.length} thí sinh vào Vòng ${Number(roundNumber) + 1}!`
                        );
                      }}
                      className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50 cursor-pointer"
                    >
                      {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                      Xác Nhận Chuyển Vòng ({selectedCompEventIds.length})
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
interface StationEntry {
  stationNumber: number;
  state: StationState;
  competitorName?: string;
  updatedAt: number;
}

// ─── Main Page ───────────────────────────────────────────────
export default function LiveOperationsPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);

  // Helper to validate GUID formats
  const isValidGuid = (guid: string | null | undefined): boolean => {
    if (!guid) return false;
    return /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(guid);
  };

  // ─── Core States ─────────────────────────────────────────
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [penaltyTypes, setPenaltyTypes] = useState<
    Array<{ id: string; code: string; label: string; timeAdditionMs: number }>
  >([]);
  const [activeTab, setActiveTab] = useState<'stations' | 'checkin' | 'traditional' | 'medley' | 'verify' | 'round'>('traditional');
  const [isLoadingMain, setIsLoadingMain] = useState(true);
  const [errorMain, setErrorMain] = useState<string | null>(null);

  // ─── SignalR Hub ─────────────────────────────────────────
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const [isHubConnected, setIsHubConnected] = useState(false);
  const [hubStatus, setHubStatus] = useState<'Disconnected' | 'Connecting...' | 'Connected' | 'Reconnecting...'>('Disconnected');
  const [stations, setStations] = useState<StationEntry[]>([]);
  const [hubEventId, setHubEventId] = useState('');
  const [hubRound, setHubRound] = useState('1');
  const [stationCount, setStationCount] = useState('4');

  // ─── Check-In ────────────────────────────────────────────
  const [qrInput, setQrInput] = useState('');
  const [isCheckingIn, setIsCheckingIn] = useState(false);
  const [checkInResult, setCheckInResult] = useState<{ success: boolean; message: string; displayName?: string } | null>(null);

  // ─── Traditional Scoring ─────────────────────────────────
  const [selectedEventId, setSelectedEventId] = useState('');
  const [roundNumber, setRoundNumber] = useState('1');
  const [liveState, setLiveState] = useState<any>(null);
  const [isLoadingLiveState, setIsLoadingLiveState] = useState(false);
  const [selectedGroupId, setSelectedGroupId] = useState('');
  const [groupScrambles, setGroupScrambles] = useState<any[]>([]);
  const [isLoadingScrambles, setIsLoadingScrambles] = useState(false);
  const [selectedGroupCompetitorId, setSelectedGroupCompetitorId] = useState('');
  const [attemptNumber, setAttemptNumber] = useState('1');
  const [rawTimeMs, setRawTimeMs] = useState('');
  const [selectedPenaltyId, setSelectedPenaltyId] = useState('none');
  const [isSubmittingTrad, setIsSubmittingTrad] = useState(false);
  const [submitTradResult, setSubmitTradResult] = useState<{ ok: boolean; message: string } | null>(null);
  const tradCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isTradDrawing, setIsTradDrawing] = useState(false);
  const [tradHasSignature, setTradHasSignature] = useState(false);

  // ─── Medley Scoring ──────────────────────────────────────
  const [medleyEventId, setMedleyEventId] = useState('');
  const [medleyRoundNumber, setMedleyRoundNumber] = useState('1');
  const [medleyLiveState, setMedleyLiveState] = useState<any>(null);
  const [isLoadingMedleyLive, setIsLoadingMedleyLive] = useState(false);
  const [medleyGroupId, setMedleyGroupId] = useState('');
  const [medleyScrambles, setMedleyScrambles] = useState<any[]>([]);
  const [isLoadingMedleyScrambles, setIsLoadingMedleyScrambles] = useState(false);
  const [medleyCompetitorId, setMedleyCompetitorId] = useState('');
  const [medleyAttemptNumber, setMedleyAttemptNumber] = useState('1');
  const [medleyTimes, setMedleyTimes] = useState<Record<string, string>>({});
  const [medleyPenalties, setMedleyPenalties] = useState<Record<string, string>>({});
  const [isSubmittingMedley, setIsSubmittingMedley] = useState(false);
  const [submitMedleyResultStatus, setSubmitMedleyResultStatus] = useState<{ ok: boolean; message: string } | null>(null);
  const medleyCanvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isMedleyDrawing, setIsMedleyDrawing] = useState(false);
  const [medleyHasSignature, setMedleyHasSignature] = useState(false);

  // ─── Verify Station ──────────────────────────────────────
  const [verifyForm, setVerifyForm] = useState({ qrToken: '', eventId: '', roundNumber: '1', stationNumber: '1' });
  const [isVerifying, setIsVerifying] = useState(false);
  const [verifyResult, setVerifyResult] = useState<any | null>(null);

  // ─── Round Operations ────────────────────────────────────
  const [roundMgmtEventId, setRoundMgmtEventId] = useState('');
  const [roundMgmtRound, setRoundMgmtRound] = useState('1');
  const [roundState, setRoundState] = useState<any>(null);
  const [isRoundAction, setIsRoundAction] = useState(false);
  const [roundActionResult, setRoundActionResult] = useState<{ ok: boolean; message: string } | null>(null);



  // ─── Result Correction Modal States ──────────────────────
  const [editingResult, setEditingResult] = useState<any | null>(null);
  const [editingResultTime, setEditingResultTime] = useState('');
  const [editingResultPenalty, setEditingResultPenalty] = useState('none');
  const [editingResultReason, setEditingResultReason] = useState('');
  const [isCorrectingSubmit, setIsCorrectingSubmit] = useState(false);
  const [correctionError, setCorrectionError] = useState<string | null>(null);

  // ─── Inline Result Correction Form States ─────────────────
  const [isCorrectingMode, setIsCorrectingMode] = useState(false);
  const [targetCorrectionResultId, setTargetCorrectionResultId] = useState<string | null>(null);
  const [correctionReason, setCorrectionReason] = useState('');

  // Detect if selected solve already has a result to activate Correction Mode
  useEffect(() => {
    if (!selectedGroupCompetitorId || !attemptNumber || !liveState) {
      setIsCorrectingMode(false);
      setTargetCorrectionResultId(null);
      return;
    }
    const competitorObj = liveState.competitors?.find(
      (c: any) => c.groupCompetitorId === selectedGroupCompetitorId
    );
    const existing = competitorObj?.results?.find(
      (r: any) => r.solveNumber === Number(attemptNumber)
    );
    if (existing) {
      setIsCorrectingMode(true);
      setTargetCorrectionResultId(existing.resultId);
      // Pre-fill time in seconds (converting from finalTimeMs or rawTimeMs)
      const secVal = ((existing.rawTimeMs || existing.finalTimeMs) / 1000).toString();
      setRawTimeMs(secVal);
      const match = penaltyTypes.find((p) => p.code === existing.penaltyCode);
      setSelectedPenaltyId(match?.id || 'none');
      setCorrectionReason('');
    } else {
      setIsCorrectingMode(false);
      setTargetCorrectionResultId(null);
      setRawTimeMs('');
      setSelectedPenaltyId('none');
      setCorrectionReason('');
    }
  }, [selectedGroupCompetitorId, attemptNumber, liveState, penaltyTypes]);

  // Sync state values when editingResult is loaded
  useEffect(() => {
    if (editingResult) {
      const seconds = (editingResult.rawTimeMs / 1000).toFixed(2);
      setEditingResultTime(seconds);

      // Locate matching penalty ID in penaltyTypes
      const match = penaltyTypes.find(p => p.code === editingResult.penaltyCode);
      setEditingResultPenalty(match?.id || 'none');
      setEditingResultReason('');
      setCorrectionError(null);
    }
  }, [editingResult, penaltyTypes]);

  const [judges, setJudges] = useState<any[]>([]);

  const assignedStations = judges
    .map((j) => j.assignedStationNumber)
    .filter((s): s is number => typeof s === 'number' && s > 0);
  const detectedStations = assignedStations.length > 0 ? Math.max(...assignedStations) : 0;

  // ─── Initialize ──────────────────────────────────────────
  useEffect(() => {
    async function loadData() {
      setIsLoadingMain(true);
      setErrorMain(null);
      try {
        const [tournData, penalties, jData] = await Promise.all([
          getTournamentById(id),
          getPenaltyTypes().catch(() => [
            { id: 'ok-uuid', code: 'OK', label: 'OK', timeAdditionMs: 0 },
            { id: 'plus2-uuid', code: 'PLUS_2', label: '+2s', timeAdditionMs: 2000 },
            { id: 'dnf-uuid', code: 'DNF', label: 'DNF', timeAdditionMs: 0 },
          ]),
          getTournamentJudges(id).catch(() => []),
        ]);
        setTournament(tournData);
        setPenaltyTypes(penalties);
        setJudges(jData);
        if (tournData.events.length > 0) {
          setSelectedEventId(tournData.events[0].id);
          const medEvents = tournData.events.filter((e) => e.eventFormatCode === 'MEDLEY');
          if (medEvents.length > 0) setMedleyEventId(medEvents[0].id);
          setVerifyForm((prev) => ({ ...prev, eventId: tournData.events[0].id }));
          setHubEventId(tournData.events[0].id);
        }
      } catch (err) {
        setErrorMain(err instanceof Error ? err.message : 'Failed to load tournament data');
      } finally {
        setIsLoadingMain(false);
      }
    }
    loadData();
  }, [id]);

  // ─── Auto Detect Active Stations for Hub Event & Round ──
  useEffect(() => {
    if (!hubEventId || !hubRound) return;
    getLiveBoardState(hubEventId, Number(hubRound))
      .then((state) => {
        if (state?.competitors && state.competitors.length > 0) {
          const maxSt = Math.max(...state.competitors.map((c: any) => c.stationNumber || 0), 0);
          if (maxSt > 0) {
            setStationCount(maxSt.toString());
          }
        }
      })
      .catch(() => undefined);
  }, [hubEventId, hubRound]);

  // ─── SignalR Hub connection ──────────────────────────────
  const connectHub = useCallback(async () => {
    if (hubConnection) {
      await hubConnection.stop().catch(() => undefined);
      setHubConnection(null);
      setIsHubConnected(false);
    }
    if (!hubEventId || !hubRound) return;

    // Detect station count from live state if not manually set
    let count = Number(stationCount || '0');
    if (count <= 0) {
      try {
        const state = await getLiveBoardState(hubEventId, Number(hubRound));
        if (state?.competitors && state.competitors.length > 0) {
          const maxSt = Math.max(...state.competitors.map((c: any) => c.stationNumber || 0), 0);
          if (maxSt > 0) count = maxSt;
        }
      } catch { }
    }
    if (count <= 0) count = 2; // fallback default
    setStationCount(count.toString());

    // Init station grid
    setStations(
      Array.from({ length: count }, (_, i) => ({
        stationNumber: i + 1,
        state: 'EMPTY' as StationState,
        updatedAt: Date.now(),
      }))
    );

    const connection = new signalR.HubConnectionBuilder()
      .withUrl(`${API_BASE_URL}/hubs/tournament`)
      .withAutomaticReconnect([0, 2000, 5000, 10000])
      .build();

    connection.on('StationStateUpdated', (payload: {
      eventId: string; roundNumber: number; stationNumber: number; state: string; competitorName?: string;
    }) => {
      if (payload.eventId !== hubEventId || payload.roundNumber !== Number(hubRound)) return;
      setStations((prev) =>
        prev.map((s) =>
          s.stationNumber === payload.stationNumber
            ? { ...s, state: (payload.state as StationState) || 'EMPTY', competitorName: payload.competitorName, updatedAt: Date.now() }
            : s
        )
      );
    });

    connection.on('ResultSubmittedEvent', (payload: { eventId: string; roundNumber: number }) => {
      if (payload.eventId === hubEventId && payload.roundNumber === Number(hubRound)) {
        // Refresh live state when a result is submitted
        getLiveBoardState(selectedEventId || hubEventId, Number(hubRound))
          .then(setLiveState)
          .catch(() => undefined);
      }
    });

    connection.on('ResultCorrected', (payload: { eventId: string; roundNumber: number }) => {
      if (payload.eventId === hubEventId && payload.roundNumber === Number(hubRound)) {
        getLiveBoardState(selectedEventId || hubEventId, Number(hubRound))
          .then(setLiveState)
          .catch(() => undefined);
      }
    });

    connection.on('RoundStarted', (payload: any) => {
      setRoundActionResult({ ok: true, message: `Round ${payload.roundNumber} started!` });
    });

    connection.on('ResultsLocked', (payload: any) => {
      setRoundActionResult({ ok: true, message: `Round ${payload.roundNumber} results locked.` });
    });

    connection.on('RoundCompleted', (payload: any) => {
      setRoundActionResult({ ok: true, message: `Round ${payload.roundNumber} completed.` });
    });

    connection.onreconnecting(() => {
      setIsHubConnected(false);
      setHubStatus('Reconnecting...');
    });

    connection.onreconnected(async () => {
      setIsHubConnected(true);
      setHubStatus('Connected');
      try {
        await connection.invoke('RegisterManagerHub', hubEventId, Number(hubRound));
      } catch { }
    });

    connection.onclose(() => {
      setIsHubConnected(false);
      setHubStatus('Disconnected');
    });

    try {
      setHubStatus('Connecting...');
      await connection.start();
      setHubConnection(connection);
      setIsHubConnected(true);
      setHubStatus('Connected');
      await connection.invoke('RegisterManagerHub', hubEventId, Number(hubRound)).catch(() => undefined);
    } catch (err: any) {
      setHubStatus('Disconnected');
      setIsHubConnected(false);
      console.error('SignalR connection failed:', err);
    }
  }, [hubEventId, hubRound, stationCount]);

  useEffect(() => {
    return () => {
      hubConnection?.stop().catch(() => undefined);
    };
  }, [hubConnection]);

  // ─── Traditional scoring side-effects ────────────────────
  useEffect(() => {
    if (!selectedEventId) return;
    async function fetchLive() {
      setIsLoadingLiveState(true);
      setLiveState(null);
      setSelectedGroupId('');
      setSelectedGroupCompetitorId('');
      try {
        const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
        setLiveState(state);
        if (state.groups.length > 0) setSelectedGroupId(state.groups[0].groupId);
      } catch { }
      finally { setIsLoadingLiveState(false); }
    }
    fetchLive();
  }, [selectedEventId, roundNumber]);

  useEffect(() => {
    if (!selectedGroupId) { setGroupScrambles([]); return; }
    async function fetchScrambles() {
      setIsLoadingScrambles(true);
      try {
        const scrambles = await getGroupScrambles(selectedGroupId);
        setGroupScrambles(scrambles);
      } catch { setGroupScrambles([]); }
      finally { setIsLoadingScrambles(false); }
    }
    fetchScrambles();
  }, [selectedGroupId]);
  useEffect(() => {
    if (!selectedGroupCompetitorId || !liveState) return;
    const compObj = liveState.competitors?.find((c: any) => c.groupCompetitorId === selectedGroupCompetitorId);
    if (compObj) {
      const totalSolves = liveState.solveCount || 5;
      if (compObj.completedSolves < totalSolves) {
        const next = compObj.completedSolves + 1;
        setAttemptNumber(String(next));
      }
    }
  }, [selectedGroupCompetitorId, liveState]);


  // ─── Medley side-effects ─────────────────────────────────
  useEffect(() => {
    if (!medleyEventId) return;
    async function fetchMedleyLive() {
      setIsLoadingMedleyLive(true);
      setMedleyLiveState(null);
      setMedleyGroupId('');
      setMedleyCompetitorId('');
      try {
        const state = await getLiveBoardState(medleyEventId, Number(medleyRoundNumber));
        setMedleyLiveState(state);
        if (state.groups.length > 0) setMedleyGroupId(state.groups[0].groupId);
      } catch { }
      finally { setIsLoadingMedleyLive(false); }
    }
    fetchMedleyLive();
  }, [medleyEventId, medleyRoundNumber]);

  useEffect(() => {
    if (!medleyGroupId) { setMedleyScrambles([]); return; }
    async function fetchMedleyScrambles() {
      setIsLoadingMedleyScrambles(true);
      try {
        const scrambles = await getGroupScrambles(medleyGroupId);
        setMedleyScrambles(scrambles);
      } catch { setMedleyScrambles([]); }
      finally { setIsLoadingMedleyScrambles(false); }
    }
    fetchMedleyScrambles();
  }, [medleyGroupId]);

  // ─── Actions ─────────────────────────────────────────────
  const handleCheckIn = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    setIsCheckingIn(true);
    setCheckInResult(null);
    try {
      const result = await checkIn({ qrToken: qrInput.trim() });
      setCheckInResult({ success: result.success, message: result.message, displayName: result.displayName });
      if (result.success) setQrInput('');
    } catch (err) {
      setCheckInResult({ success: false, message: err instanceof Error ? err.message : 'Check-in failed' });
    } finally { setIsCheckingIn(false); }
  };

  // Canvas helpers — Traditional
  const startTradDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = tradCanvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = 'oklch(0.72 0.21 42)';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsTradDrawing(true);
  };
  const drawTrad = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isTradDrawing) return;
    const canvas = tradCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
    setTradHasSignature(true);
  };
  const clearTradSignature = () => {
    const canvas = tradCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setTradHasSignature(false);
  };

  // Canvas helpers — Medley
  const startMedleyDrawing = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = medleyCanvasRef.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    ctx.lineWidth = 2.5; ctx.lineCap = 'round'; ctx.strokeStyle = 'oklch(0.68 0.20 310)';
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath(); ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
    setIsMedleyDrawing(true);
  };
  const drawMedley = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isMedleyDrawing) return;
    const canvas = medleyCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (!canvas || !ctx) return;
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top); ctx.stroke();
    setMedleyHasSignature(true);
  };
  const clearMedleySignature = () => {
    const canvas = medleyCanvasRef.current; const ctx = canvas?.getContext('2d');
    if (canvas && ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
    setMedleyHasSignature(false);
  };

  const handleTraditionalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitTradResult(null);
    if (!selectedGroupCompetitorId) { setSubmitTradResult({ ok: false, message: 'Please select a competitor.' }); return; }
    if (!rawTimeMs) { setSubmitTradResult({ ok: false, message: 'Solve Time is required.' }); return; }
    const solveNum = Number(attemptNumber);

    // If in Correction Mode, call the correction endpoint instead of submit
    if (isCorrectingMode && targetCorrectionResultId) {
      if (!correctionReason.trim()) {
        setSubmitTradResult({ ok: false, message: 'Lý do sửa đổi (Correction Reason) là bắt buộc.' });
        return;
      }
      setIsSubmittingTrad(true);
      try {
        const penaltyTypeId = isValidGuid(selectedPenaltyId) ? selectedPenaltyId : undefined;
        await correctResult(targetCorrectionResultId, {
          rawTimeMs: Math.round(parseFloat(rawTimeMs) * 1000),
          penaltyTypeId,
          reason: correctionReason.trim(),
        });
        setSubmitTradResult({ ok: true, message: `✓ Đã sửa điểm Solve #${solveNum} thành ${rawTimeMs}s!` });
        setCorrectionReason('');
        // Refresh live state
        const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
        setLiveState(state);
      } catch (err) {
        setSubmitTradResult({ ok: false, message: err instanceof Error ? err.message : 'Correction failed' });
      } finally {
        setIsSubmittingTrad(false);
      }
      return;
    }

    const matchingScramble = groupScrambles.find((s) => s.solveNumber === solveNum);
    if (!matchingScramble) {
      setSubmitTradResult({ ok: false, message: `No scramble for Solve #${solveNum}. Generate scrambles first.` });
      return;
    }
    setIsSubmittingTrad(true);
    try {
      const sigData = tradHasSignature ? tradCanvasRef.current?.toDataURL() : undefined;
      const penaltyTypeId = isValidGuid(selectedPenaltyId) ? selectedPenaltyId : undefined;
      const currentCompName = filteredTradCompetitors.find((c: any) => c.groupCompetitorId === selectedGroupCompetitorId)?.competitorName || 'Thí sinh';
      const submittedTimeSec = formatMs(Math.round(Number(rawTimeMs) * 1000));
      await submitTraditionalResult({
        groupCompetitorId: selectedGroupCompetitorId,
        solveNumber: solveNum,
        rawTimeMs: Math.round(Number(rawTimeMs) * 1000),
        penaltyTypeId,
        scrambleId: matchingScramble.id,
        esignatureData: sigData,
      });

      setRawTimeMs('');
      setSelectedPenaltyId('none');
      clearTradSignature();

      const state = await getLiveBoardState(selectedEventId, Number(roundNumber));
      setLiveState(state);

      const totalSolves = state?.solveCount || 5;
      const updatedComp = state?.competitors?.find((c: any) => c.groupCompetitorId === selectedGroupCompetitorId);

      if (updatedComp && updatedComp.completedSolves >= totalSolves) {
        // Competitor completed all solves! Find next incomplete competitor in group
        const groupComps = state.competitors.filter((c: any) => c.groupId === selectedGroupId);
        const nextComp = groupComps.find((c: any) => c.completedSolves < totalSolves);

        if (nextComp) {
          setSelectedGroupCompetitorId(nextComp.groupCompetitorId);
          setSubmitTradResult({
            ok: true,
            message: `✓ Solve #${solveNum} (${submittedTimeSec}) đã lưu! ${currentCompName} đã hoàn thành đủ ${totalSolves} lượt. Tự động chuyển sang thí sinh tiếp theo: ${nextComp.competitorName}.`,
          });
        } else {
          setSelectedGroupCompetitorId('');
          setIsCorrectingMode(false);
          setTargetCorrectionResultId(null);
          setSubmitTradResult({
            ok: true,
            message: `✓ Solve #${solveNum} (${submittedTimeSec}) đã lưu! ${currentCompName} đã hoàn thành lượt thi cuối. Tất cả thí sinh trong nhóm đã hoàn thành.`,
          });
        }
      } else {
        setSubmitTradResult({
          ok: true,
          message: `✓ Solve #${solveNum} submitted — ${submittedTimeSec}`,
        });
      }
    } catch (err) {
      setSubmitTradResult({ ok: false, message: err instanceof Error ? err.message : 'Submission failed' });
    } finally { setIsSubmittingTrad(false); }
  };

  const handleMedleySubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitMedleyResultStatus(null);
    if (!medleyCompetitorId) { setSubmitMedleyResultStatus({ ok: false, message: 'Please select a competitor.' }); return; }
    const activeEvent = tournament?.events.find((ev) => ev.id === medleyEventId);
    if (!activeEvent) return;
    const detailsList = [];
    const solveNum = Number(medleyAttemptNumber);
    let totalTimeStr = medleyTimes['total'] || medleyTimes[activeEvent.medleyPuzzles[0]?.id];
    if (!totalTimeStr) {
      totalTimeStr = Object.values(medleyTimes).find((v) => !!v) || '';
    }
    if (!totalTimeStr) { setSubmitMedleyResultStatus({ ok: false, message: `Vui lòng nhập tổng thời gian thi đấu Medley.` }); return; }

    let idx = 0;
    for (const puzzle of activeEvent.medleyPuzzles) {
      const matchingScramble = medleyScrambles.find(
        (s) => s.solveNumber === solveNum && s.puzzleTypeId === puzzle.puzzleTypeId
      );
      const scrambleId = matchingScramble?.id || medleyScrambles[0]?.id || '00000000-0000-0000-0000-000000000000';
      const penVal = medleyPenalties['total'] || medleyPenalties[puzzle.id];

      detailsList.push({
        medleyPuzzleId: puzzle.id,
        rawTimeMs: idx === 0 ? Math.round(Number(totalTimeStr) * 1000) : 0,
        penaltyTypeId: idx === 0 && isValidGuid(penVal) ? penVal : undefined,
        scrambleId
      });
      idx++;
    }
    setIsSubmittingMedley(true);
    try {
      const sigData = medleyHasSignature ? medleyCanvasRef.current?.toDataURL() : undefined;
      await submitMedleyResult({ groupCompetitorId: medleyCompetitorId, solveNumber: solveNum, esignatureData: sigData, details: detailsList });
      setSubmitMedleyResultStatus({ ok: true, message: '✓ Medley results submitted successfully!' });
      setMedleyTimes({}); setMedleyPenalties({}); clearMedleySignature();
      const state = await getLiveBoardState(medleyEventId, Number(medleyRoundNumber));
      setMedleyLiveState(state);
    } catch (err) {
      setSubmitMedleyResultStatus({ ok: false, message: err instanceof Error ? err.message : 'Submission failed' });
    } finally { setIsSubmittingMedley(false); }
  };

  const handleVerifyStation = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!verifyForm.qrToken.trim()) return;
    setIsVerifying(true);
    setVerifyResult(null);
    try {
      // FIX: Use stationNumber (not groupId)
      const result = await verifyJudgeStation({
        qrToken: verifyForm.qrToken.trim(),
        eventId: verifyForm.eventId,
        roundNumber: Number(verifyForm.roundNumber),
        stationNumber: Number(verifyForm.stationNumber),
      });
      setVerifyResult(result);
    } catch (err) {
      setVerifyResult({ success: false, message: err instanceof Error ? err.message : 'Verification failed' });
    } finally { setIsVerifying(false); }
  };

  const handleRoundAction = async (action: 'start' | 'lock' | 'complete' | 'complete_event') => {
    if (!roundMgmtEventId) return;
    setIsRoundAction(true);
    setRoundActionResult(null);
    try {
      if (action === 'start') {
        await startRound(roundMgmtEventId, Number(roundMgmtRound));
        setRoundActionResult({ ok: true, message: `Round ${roundMgmtRound} started! Trạm trọng tài đã mở để bắt đầu thi đấu.` });
      } else if (action === 'lock') {
        await lockRoundResults(roundMgmtEventId, Number(roundMgmtRound));
        setRoundActionResult({ ok: true, message: `Đã khóa kết quả Vòng ${roundMgmtRound}. Tất cả các trạm không thể gửi thêm điểm.` });
      } else if (action === 'complete') {
        await completeRound(roundMgmtEventId, Number(roundMgmtRound));
        setRoundActionResult({ ok: true, message: `Vòng ${roundMgmtRound} đã hoàn thành. Điểm số đã chốt và xếp hạng đã được tạo.` });
      } else if (action === 'complete_event') {
        const selectedEv = tournament?.events.find((e) => e.id === roundMgmtEventId);
        const configuredRounds = selectedEv?.totalRounds || 1;
        const currentRoundNum = Number(roundMgmtRound);
        if (currentRoundNum < configuredRounds) {
          setRoundActionResult({
            ok: false,
            message: `❌ Không Thể Hoàn Thành Môn Thi!\n\nMôn thi này được cấu hình ${configuredRounds} vòng đấu nhưng hiện tại mới thực hiện xong Vòng ${currentRoundNum}.\nVui lòng bấm 'Advance Round' để tuyển chọn thí sinh thi tiếp Vòng ${currentRoundNum + 1}.`,
          });
          setIsRoundAction(false);
          return;
        }
        await completeEvent(roundMgmtEventId);
        setRoundActionResult({ ok: true, message: `Hạng mục thi đấu đã được Hoàn thành và chốt giải thành công!` });
      }

      // Refresh round state after action
      const state = await getLiveBoardState(roundMgmtEventId, Number(roundMgmtRound));
      setRoundState(state);
    } catch (err) {
      setRoundActionResult({ ok: false, message: err instanceof Error ? err.message : 'Thực hiện thao tác thất bại.' });
    } finally {
      setIsRoundAction(false);
    }
  };

  const handleCorrectSubmit = async () => {
    if (!editingResult) return;
    setIsCorrectingSubmit(true);
    setCorrectionError(null);
    try {
      const penaltyTypeId = isValidGuid(editingResultPenalty) ? editingResultPenalty : undefined;
      await correctResult(editingResult.resultId, {
        rawTimeMs: Math.round(parseFloat(editingResultTime) * 1000),
        penaltyTypeId,
        reason: editingResultReason.trim(),
      });
      setEditingResult(null);
      // Refresh live board states
      const state = await getLiveBoardState(selectedEventId || hubEventId, Number(roundNumber || hubRound));
      setLiveState(state);
    } catch (err) {
      setCorrectionError(err instanceof Error ? err.message : 'Correction failed');
    } finally {
      setIsCorrectingSubmit(false);
    }
  };

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
          <p className="font-semibold">{errorMain ?? 'Không tìm thấy giải đấu'}</p>
        </div>
      </div>
    );
  }

  const traditionalEvents = tournament.events.filter((e) => e.eventFormatCode === 'TRADITIONAL');
  const currentEvent = tournament.events.find((e) => e.id === selectedEventId);
  const medleyEvents = tournament.events.filter((e) => e.eventFormatCode === 'MEDLEY');
  const filteredTradCompetitors = liveState?.competitors.filter((c: any) => c.groupId === selectedGroupId) || [];
  const filteredMedleyCompetitors = medleyLiveState?.competitors.filter((c: any) => c.groupId === medleyGroupId) || [];

  const TABS = [
    { id: 'traditional', label: 'Bảng Xếp Hạng & Nhập Điểm', icon: ClipboardEdit },
    { id: 'medley', label: 'Thi Đấu Medley', icon: TimerIcon },
    { id: 'round', label: 'Điều Hành Vòng Thi', icon: Play },
  ] as const;

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">Giải Đấu</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors">{tournament.name}</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Điều Hành Trực Tiếp (Live)</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2.5">
            <span className="relative flex h-3 w-3">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-3 w-3 bg-emerald-500"></span>
            </span>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight">Điều Hành Trực Tiếp</h1>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Theo dõi trạm bàn thi, nhập điểm và điều hành tiến trình vòng thi thời gian thực.
          </p>
        </div>

        {/* Real-time Status Badge */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-xs font-semibold border text-emerald-700 border-emerald-200 bg-emerald-50">
            <Wifi className="h-3.5 w-3.5" />
            <span>Hệ Thống Trực Tiếp Sẵn Sàng</span>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 overflow-x-auto gap-1">
        {TABS.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2.5 text-xs font-semibold border-b-2 transition whitespace-nowrap cursor-pointer ${isActive
                ? 'border-indigo-600 text-indigo-600 font-bold bg-indigo-50/50 rounded-t-lg'
                : 'border-transparent text-slate-500 hover:text-slate-900 hover:border-slate-300'
                }`}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* ─── TAB 1: CHECK-IN ──────────────────────────────────── */}
      {activeTab === 'checkin' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-xl mx-auto w-full shadow-2xs text-slate-900">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <QrCode className="h-4 w-4 text-indigo-600" /> Check-In Thí Sinh Sảnh Đấu
          </h2>
          <p className="text-xs text-slate-500 mb-5">Nhập hoặc quét mã QR thí sinh để xác nhận sự có mặt tại giải đấu.</p>
          <form onSubmit={handleCheckIn} className="space-y-3">
            <div className="relative">
              <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
              <input
                type="text" value={qrInput} onChange={(e) => setQrInput(e.target.value)}
                placeholder="Quét mã hoặc nhập mã QR token thí sinh..."
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                autoFocus
              />
            </div>
            <button
              type="submit" disabled={isCheckingIn || !qrInput.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
            >
              {isCheckingIn ? <Loader2 className="h-4 w-4 animate-spin" /> : <Check className="h-4 w-4" />}
              {isCheckingIn ? 'Đang xác nhận...' : 'Xác Nhận Check-In'}
            </button>
          </form>
          {checkInResult && (
            <div className={`mt-4 flex items-start gap-3 rounded-lg border p-3.5 text-xs ${checkInResult.success
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
              }`}>
              {checkInResult.success ? <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" /> : <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />}
              <div>
                {checkInResult.displayName && <p className="font-bold text-slate-900">{checkInResult.displayName}</p>}
                <p className="text-xs mt-0.5">{checkInResult.message}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 1: TRADITIONAL LEADERBOARD & SCORE ────────────────────────── */}
      {activeTab === 'traditional' && (
        <div className="space-y-6">
          {/* Full-width Live Leaderboard & Evidence Inspection Table */}
          <div className="rounded-xl border border-slate-200 bg-white p-6 space-y-4 shadow-2xs text-slate-900">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-slate-200 pb-4">
              <div>
                <h2 className="text-base font-bold text-slate-900 uppercase tracking-tight">
                  Bảng Xếp Hạng Trực Tiếp & Đối Soát Tờ Ghi Điểm Minh Chứng
                </h2>
                <p className="text-xs text-slate-500 mt-0.5">
                  Bấm vào kết quả bất kỳ (Lượt 1…5) hoặc biểu tượng 📸 Ảnh Minh Chứng để mở tờ ghi điểm và điều chỉnh điểm.
                </p>
              </div>
              <div className="flex items-center gap-2">
                <select
                  value={selectedEventId}
                  onChange={(e) => setSelectedEventId(e.target.value)}
                  className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                >
                  {tournament.events.map((e) => (
                    <option key={e.id} value={e.id}>{formatEventLabel(e)}</option>
                  ))}
                </select>
                <div className="flex items-center gap-1">
                  <span className="text-xs font-semibold text-slate-500 uppercase">Round</span>
                  <input
                    type="number" min="1" value={roundNumber}
                    onChange={(e) => setRoundNumber(e.target.value)}
                    className="w-14 rounded-lg border border-slate-200 bg-slate-50 px-2 py-1.5 text-xs font-semibold text-slate-900 text-center outline-none focus:bg-white focus:border-indigo-600"
                  />
                </div>
                <button
                  onClick={() => {
                    if (selectedEventId) {
                      getLiveBoardState(selectedEventId, Number(roundNumber)).then(setLiveState);
                    }
                  }}
                  className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:text-slate-900 hover:bg-slate-50 transition"
                  title="Làm mới bảng điểm"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
            </div>

            {/* Info Bar for Time Limit & Cutoff */}
            {currentEvent && (currentEvent.timeLimitMs || currentEvent.cutoffTimeMs) && (
              <div className="flex flex-wrap items-center gap-4 px-4 py-2 bg-slate-50 border border-b-0 border-slate-200 text-xs text-slate-600 font-sans rounded-t-lg">
                {currentEvent.timeLimitMs && (
                  <span className="flex items-center gap-1 font-medium">
                    <span className="font-semibold text-slate-700">Time Limit:</span> <strong className="text-slate-900 font-mono">{formatMs(currentEvent.timeLimitMs)}</strong> <span className="text-[11px] text-slate-500">(Vượt mốc = DNF)</span>
                  </span>
                )}
                {currentEvent.cutoffTimeMs && (
                  <span className="flex items-center gap-1 font-medium">
                    <span className="font-semibold text-slate-700">Cutoff Time:</span> <strong className="text-amber-700 font-mono">{formatMs(currentEvent.cutoffTimeMs)}</strong> <span className="text-[11px] text-slate-500">(Mốc tối đa lượt thi đầu để được thi tiếp)</span>
                  </span>
                )}
              </div>
            )}

            {/* Table */}
            {isLoadingLiveState ? (
              <div className="flex justify-center py-12">
                <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
              </div>
            ) : !liveState || !liveState.competitors || liveState.competitors.length === 0 ? (
              <div className="text-center py-12 text-xs text-slate-500">
                Chưa có dữ liệu bảng điểm trực tiếp cho hạng mục và round này.
              </div>
            ) : (
              <div className="overflow-x-auto rounded-lg border border-slate-200">
                <table className="w-full text-xs text-left">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center w-10">Hạng</th>
                      <th className="px-3 py-2 font-bold uppercase text-slate-500">Thí Sinh</th>
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center">Nhóm</th>
                      {Array.from({ length: liveState.solveCount || 5 }, (_, i) => (
                        <th key={i} className="px-2 py-2 font-bold uppercase text-slate-500 text-center">
                          Solve #{i + 1}
                        </th>
                      ))}
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center">Best</th>
                      <th className="px-3 py-2 font-bold uppercase text-slate-500 text-center">Average</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 font-mono">
                    {liveState.competitors.map((c: any) => {
                      const compGroup = liveState.groups?.find((g: any) => g.groupId === c.groupId);
                      return (
                        <tr key={c.groupCompetitorId} className="hover:bg-slate-50 transition-colors">
                          <td className="px-3 py-2.5 text-center font-bold">
                            <span className={`inline-flex items-center justify-center h-5 w-5 rounded-full ${c.rank === 1 ? 'bg-amber-100 text-amber-900 font-bold' :
                              c.rank === 2 ? 'bg-slate-200 text-slate-800 font-bold' :
                                c.rank === 3 ? 'bg-amber-800 text-white font-bold' : 'text-slate-500'
                              }`}>
                              {c.rank || '—'}
                            </span>
                          </td>
                          <td className="px-3 py-2.5 font-sans font-bold text-slate-900">
                            <div>
                              <span>{c.competitorName}</span>
                              <span className="text-[10px] text-slate-400 font-mono block font-normal">{c.competitorUserCode}</span>
                            </div>
                          </td>
                          <td className="px-3 py-2.5 text-center font-sans">
                            <span className="px-2 py-0.5 rounded bg-slate-100 text-[9px] font-bold text-slate-600 uppercase">
                              {compGroup?.groupName || 'Group'}
                            </span>
                          </td>
                          {Array.from({ length: liveState.solveCount || 5 }, (_, i) => {
                            const attempt = c.results?.find((r: any) => r.solveNumber === i + 1);
                            const cutoffMs = currentEvent?.cutoffTimeMs;
                            const timeLimitMs = currentEvent?.timeLimitMs;
                            const solveCount = liveState.solveCount || 5;
                            const reqAttempts = solveCount >= 3 ? 2 : 1;
                            const isInitialSolve = i < reqAttempts;

                            const rawOrFinalMs = attempt ? (attempt.rawTimeMs || attempt.finalTimeMs || 0) : 0;
                            const finalMs = attempt ? (attempt.finalTimeMs || attempt.rawTimeMs || 0) : 0;

                            // 1. Time Limit Exceeded?
                            const isOverTimeLimit = Boolean(
                              attempt &&
                              timeLimitMs &&
                              timeLimitMs > 0 &&
                              (rawOrFinalMs >= timeLimitMs || finalMs >= timeLimitMs)
                            );

                            // 2. Cutoff Exceeded?
                            const isOverCutoff = Boolean(
                              attempt &&
                              cutoffMs &&
                              cutoffMs > 0 &&
                              (rawOrFinalMs > cutoffMs && finalMs > cutoffMs) &&
                              isInitialSolve
                            );

                            const isDnf = Boolean(attempt && (attempt.isDnf || attempt.penaltyCode === 'DNF' || isOverTimeLimit));
                            const isCutoffStoppedCell = !attempt && c.isCutoffReached && i >= reqAttempts;
                            const hasPhoto = Boolean(attempt?.evidencePhotoUrl);

                            const val = attempt ? (isDnf ? 'DNF' : formatMs(finalMs)) : '—';

                            return (
                              <td key={i} className="px-2 py-2.5 text-center">
                                {isCutoffStoppedCell ? (
                                  <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-1.5 py-0.5 text-[9px] font-bold text-amber-700 uppercase tracking-wider" title="Dừng thi do không đạt mốc Cutoff ở các lượt đầu">
                                    CUTOFF
                                  </span>
                                ) : (
                                  <button
                                    type="button"
                                    disabled={!attempt}
                                    onClick={() => {
                                      if (attempt) {
                                        setEditingResult({
                                          resultId: attempt.resultId,
                                          competitorName: c.competitorName,
                                          solveNumber: i + 1,
                                          rawTimeMs: attempt.rawTimeMs || attempt.finalTimeMs,
                                          penaltyTypeId: attempt.penaltyTypeId || 'none',
                                          isDnf: isDnf,
                                          penaltyCode: isDnf ? 'DNF' : (attempt.penaltyCode || 'OK'),
                                          evidencePhotoUrl: attempt.evidencePhotoUrl,
                                          esignatureData: attempt.esignatureData,
                                        });
                                      }
                                    }}
                                    className={`px-2 py-1 rounded transition font-semibold flex items-center justify-center gap-1 mx-auto ${!attempt
                                        ? 'text-slate-300 cursor-default'
                                        : isOverTimeLimit
                                          ? 'bg-rose-100 text-rose-800 border border-rose-300 hover:bg-rose-200 font-bold'
                                          : isOverCutoff
                                            ? 'bg-amber-50 text-amber-900 border border-amber-300 hover:bg-amber-100 font-bold'
                                            : isDnf
                                              ? 'bg-red-50 text-red-700 border border-red-200'
                                              : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                                      }`}
                                    title={
                                      attempt
                                        ? `Solve #${i + 1}: ${val} ${isOverTimeLimit ? '(Vượt mốc Time Limit => DNF)' : isOverCutoff ? '(Vượt mốc Cutoff)' : ''} ${hasPhoto ? '(Bấm để mở ảnh tờ ghi điểm R2)' : '(Bấm để sửa điểm)'}`
                                        : 'Chưa thi đấu'
                                    }
                                  >
                                    <span>{val}</span>
                                    {isOverTimeLimit ? (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-rose-600 text-white uppercase tracking-tight shadow-2xs" title={`Thời gian (${formatMs(rawOrFinalMs)}) vượt mốc Time Limit (${formatMs(timeLimitMs!)})`}>
                                        Time Limit (DNF)
                                      </span>
                                    ) : isOverCutoff ? (
                                      <span className="text-[9px] font-black px-1.5 py-0.5 rounded bg-amber-500 text-white uppercase tracking-tight shadow-2xs" title={`Thời gian (${formatMs(finalMs)}) vượt mốc Cutoff (${formatMs(cutoffMs!)})`}>
                                        Cutoff
                                      </span>
                                    ) : null}
                                    {!isOverTimeLimit && attempt?.penaltyCode === 'PLUS_2' && <span className="text-[9px] text-amber-600 font-bold ml-0.5">+2</span>}
                                    {hasPhoto && <span className="text-[10px] ml-0.5" title="Có ảnh R2">📸</span>}
                                  </button>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-3 py-2.5 text-center font-bold text-slate-900">
                            {c.bestTimeMs ? formatMs(c.bestTimeMs) : '—'}
                          </td>
                          <td className="px-3 py-2.5 text-center font-bold text-indigo-600">
                            {c.averageTimeMs === 2147483647 || c.isCutoffReached || (c.completedSolves >= (liveState?.solveCount || 5) && c.results?.filter((r: any) => r.isDnf || r.penaltyCode === 'DNF').length >= ((liveState?.solveCount || 5) === 5 ? 2 : 1))
                              ? 'DNF'
                              : c.averageTimeMs
                                ? formatMs(c.averageTimeMs)
                                : '—'}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-slate-900">
              <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
                <ClipboardEdit className="h-4 w-4 text-indigo-600" /> Nhập Điểm Trực Tiếp (Traditional Result Entry)
              </h2>
              <p className="text-xs text-slate-500 mb-5">Nhập kết quả các lượt giải thi đấu truyền thống.</p>

              {currentEvent?.eventFormatCode === 'MEDLEY' ? (
                <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-6 text-center text-xs text-indigo-900 space-y-2">
                  <p className="font-bold text-sm">📌 Hạng Mục Đang Chọn: {formatEventLabel(currentEvent)}</p>
                  <p className="text-slate-600">
                    Bảng xếp hạng trực tiếp của Medley Relay đã được hiển thị ở bảng phía trên. Để nhập điểm Medley thủ công trên Web Manager, vui lòng chọn Tab <button type="button" onClick={() => setActiveTab('medley')} className="font-bold text-indigo-600 underline">Thi Đấu Medley</button> hoặc sử dụng App Trọng Tài trên Mobile.
                  </p>
                </div>
              ) : traditionalEvents.length === 0 ? (
                <p className="text-center py-10 text-xs text-slate-500">Không có hạng mục thi đấu truyền thống.</p>
              ) : (
                <form onSubmit={handleTraditionalSubmit} className="space-y-4">
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Môn Thi</label>
                      <select value={selectedEventId} onChange={(e) => setSelectedEventId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                      >
                        {traditionalEvents.map((e) => <option key={e.id} value={e.id}>{formatEventLabel(e)}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Round</label>
                      <input type="number" min="1" value={roundNumber} onChange={(e) => setRoundNumber(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nhóm (Group)</label>
                      {isLoadingLiveState ? (
                        <div className="flex items-center gap-2 py-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Đang tải...</div>
                      ) : (
                        <select value={selectedGroupId} onChange={(e) => setSelectedGroupId(e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                        >
                          <option value="">-- Chọn Nhóm Thi --</option>
                          {liveState?.groups.map((g: any) => (
                            <option key={g.groupId} value={g.groupId}>{g.groupName} ({g.statusCode})</option>
                          ))}
                        </select>
                      )}
                    </div>
                    <div>
                      <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Thí Sinh</label>
                      <select value={selectedGroupCompetitorId} onChange={(e) => setSelectedGroupCompetitorId(e.target.value)}
                        disabled={!selectedGroupId}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 disabled:opacity-50"
                      >
                        <option value="">-- Chọn Thí Sinh --</option>
                        {filteredTradCompetitors.map((c: any) => (
                          <option key={c.groupCompetitorId} value={c.groupCompetitorId}>{c.competitorName} (Trạm {c.stationNumber ?? '—'})</option>
                        ))}
                      </select>
                    </div>
                  </div>

                  {selectedGroupCompetitorId && (
                    <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Lượt Solve #</label>
                          <select value={attemptNumber} onChange={(e) => setAttemptNumber(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                          >
                            {[...Array(liveState?.solveCount || 5)].map((_, i) => (
                              <option key={i + 1} value={i + 1}>Solve {i + 1}</option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">
                            {isCorrectingMode ? 'Thời Gian Sửa (Giây)' : 'Thời Gian Solve (Giây)'}
                          </label>
                          <input type="number" step="0.01" value={rawTimeMs} onChange={(e) => setRawTimeMs(e.target.value)}
                            placeholder="Ví dụ: 10.25"
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 font-mono"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5 font-mono">Hình Phạt (Penalty)</label>
                          <select value={selectedPenaltyId} onChange={(e) => setSelectedPenaltyId(e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                          >
                            <option value="none">OK (Hợp lệ)</option>
                            {penaltyTypes.filter((p) => p.code !== 'OK').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                          </select>
                        </div>
                      </div>

                      {isCorrectingMode ? (
                        /* Correction Reason Input (Audit Trail) */
                        <div className="space-y-1.5 animate-in fade-in duration-200">
                          <label className="block text-[10px] font-bold text-amber-600 uppercase font-mono">Lý Do Đổi Điểm (Bắt buộc)</label>
                          <textarea
                            value={correctionReason}
                            onChange={(e) => setCorrectionReason(e.target.value)}
                            placeholder="Ví dụ: Trọng tài ghi nhầm giây trên scorecard giấy..."
                            rows={2}
                            className="w-full rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600"
                          />
                        </div>
                      ) : (
                        /* Standard Scramble & Signature Requirements */
                        <>
                          {/* Scramble for this solve */}
                          {(() => {
                            const scramble = groupScrambles.find((s) => s.solveNumber === Number(attemptNumber));
                            return scramble && (
                              <ScrambleDisplay sequence={scramble.sequence} solveNumber={Number(attemptNumber)} />
                            );
                          })()}

                          {/* Signature */}
                          <div>
                            <div className="flex items-center justify-between mb-1.5">
                              <label className="text-[10px] font-bold text-slate-500 uppercase">Chữ Ký Thí Sinh</label>
                              <button type="button" onClick={clearTradSignature} className="text-[10px] font-bold text-red-600 hover:underline">Xóa chữ ký</button>
                            </div>
                            <canvas
                              ref={tradCanvasRef} width={400} height={80}
                              onMouseDown={startTradDrawing} onMouseMove={drawTrad}
                              onMouseUp={() => setIsTradDrawing(false)} onMouseLeave={() => setIsTradDrawing(false)}
                              className="w-full rounded-lg border border-slate-200 cursor-crosshair block bg-white"
                              style={{ height: '80px' }}
                            />
                          </div>
                        </>
                      )}
                    </div>
                  )}

                  {isCorrectingMode && !isHubConnected && (
                    <div className="mb-3 flex items-center gap-2 rounded-lg border border-red-200 bg-red-50 px-4 py-2.5 text-xs font-semibold text-red-700 animate-in fade-in duration-200">
                      <AlertCircle className="h-4 w-4 shrink-0" />
                      <span>Yêu cầu kết nối truyền dữ liệu trực tiếp đang hoạt động mới được phép điều chỉnh điểm.</span>
                    </div>
                  )}

                  <button type="submit"
                    disabled={isSubmittingTrad || !selectedGroupCompetitorId || (isCorrectingMode && !isHubConnected)}
                    className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
                  >
                    {isSubmittingTrad ? (
                      <Loader2 className="h-4 w-4 animate-spin" />
                    ) : isCorrectingMode ? (
                      <Check className="h-4 w-4" />
                    ) : (
                      <ClipboardEdit className="h-4 w-4" />
                    )}
                    {isSubmittingTrad ? 'Đang gửi...' : isCorrectingMode ? 'Cập Nhật Điều Chỉnh Điểm' : 'Gửi Kết Quả Thi'}
                  </button>
                </form>
              )}

              {submitTradResult && (
                <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${submitTradResult.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                  }`}>
                  {submitTradResult.ok ? <CheckCircle className="h-4 w-4 shrink-0" /> : <AlertCircle className="h-4 w-4 shrink-0" />}
                  {submitTradResult.message}
                </div>
              )}
            </div>

            {/* Results Monitor sidebar */}
            <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit shadow-2xs text-slate-900">
              <h3 className="font-bold text-xs text-slate-700 mb-4 uppercase tracking-wider">Tiến Độ Nhóm</h3>
              {isLoadingLiveState ? (
                <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
              ) : filteredTradCompetitors.length === 0 ? (
                <p className="text-xs text-slate-400">Chọn nhóm thi để xem danh sách thí sinh.</p>
              ) : (
                <div className="space-y-3">
                  {filteredTradCompetitors.map((c: any) => (
                    <div key={c.groupCompetitorId} className="border-b border-slate-100 pb-2.5 last:border-0">
                      <div className="flex items-center justify-between text-xs mb-1.5">
                        <span className="font-bold text-slate-900 truncate mr-2">{c.competitorName}</span>
                        <span className="text-[10px] text-slate-500 font-mono shrink-0">
                          {c.completedSolves}/{liveState?.solveCount}
                        </span>
                      </div>
                      <div className="flex gap-1 flex-wrap">
                        {Array.from({ length: liveState?.solveCount || 5 }, (_, i) => {
                          const result = c.results?.find((r: any) => r.solveNumber === i + 1);
                          return (
                            <button key={i}
                              type="button"
                              disabled={!result}
                              onClick={() => {
                                if (result) {
                                  setEditingResult({
                                    resultId: result.resultId,
                                    competitorName: c.competitorName,
                                    solveNumber: i + 1,
                                    rawTimeMs: result.rawTimeMs || result.finalTimeMs,
                                    penaltyTypeId: result.penaltyTypeId || 'none',
                                    isDnf: result.isDnf,
                                    penaltyCode: result.penaltyCode || 'OK',
                                    evidencePhotoUrl: result.evidencePhotoUrl,
                                    esignatureData: result.esignatureData,
                                  });
                                  setEditingResultTime(result.rawTimeMs ? (result.rawTimeMs / 1000).toString() : (result.finalTimeMs / 1000).toString());
                                  setEditingResultPenalty(result.penaltyTypeId || 'none');
                                  setEditingResultReason('');
                                  setCorrectionError(null);
                                }
                              }}
                              className={`px-1.5 py-0.5 rounded text-[9px] font-bold font-mono transition-all ${result ? (
                                result.isLocked
                                  ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                                  : result.isDnf
                                    ? 'bg-red-50 text-red-700 border border-red-200'
                                    : 'bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100'
                              ) : 'bg-slate-100 text-slate-400 cursor-default'
                                }`}
                              title={result ? "Bấm để xem ảnh minh chứng / Sửa điểm" : "Lượt thi chưa hoàn thành"}
                            >
                              {result ? (result.isDnf ? 'DNF' : `${(result.finalTimeMs / 1000).toFixed(2)}`) : `S${i + 1}`}
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ─── TAB 3: MEDLEY SCORE ─────────────────────────────── */}
      {activeTab === 'medley' && (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 rounded-xl border border-slate-200 bg-white p-6 shadow-2xs text-slate-900">
            <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
              <TimerIcon className="h-4 w-4 text-indigo-600" /> Nhập Điểm Medley Relay
            </h2>
            <p className="text-xs text-slate-500 mb-5">Nhập kết quả thi đấu đồng đội liên hoàn theo từng loại Rubik.</p>

            {medleyEvents.length === 0 ? (
              <p className="text-center py-10 text-xs text-slate-500">Chưa cấu hình môn thi Medley.</p>
            ) : (
              <form onSubmit={handleMedleySubmit} className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Môn Thi Medley</label>
                    <select value={medleyEventId} onChange={(e) => setMedleyEventId(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                    >
                      {medleyEvents.map((e) => <option key={e.id} value={e.id}>{e.puzzleTypeName}</option>)}
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Round</label>
                    <input type="number" min="1" value={medleyRoundNumber} onChange={(e) => setMedleyRoundNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Lượt Solve (#)</label>
                    <select
                      value={medleyAttemptNumber}
                      onChange={(e) => setMedleyAttemptNumber(e.target.value)}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                    >
                      {Array.from(
                        { length: tournament?.events.find((ev) => ev.id === medleyEventId)?.solveCount || 5 },
                        (_, i) => (
                          <option key={i + 1} value={i + 1}>
                            Solve #{i + 1}
                          </option>
                        )
                      )}
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Nhóm</label>
                    {isLoadingMedleyLive ? (
                      <div className="flex items-center gap-2 py-2 text-xs text-slate-500"><Loader2 className="h-3 w-3 animate-spin" /> Đang tải...</div>
                    ) : (
                      <select value={medleyGroupId} onChange={(e) => setMedleyGroupId(e.target.value)}
                        className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                      >
                        <option value="">-- Chọn Nhóm --</option>
                        {medleyLiveState?.groups.map((g: any) => (
                          <option key={g.groupId} value={g.groupId}>{g.groupName}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Thí Sinh</label>
                    <select
                      value={medleyCompetitorId}
                      onChange={(e) => {
                        const compId = e.target.value;
                        setMedleyCompetitorId(compId);
                        const compObj = filteredMedleyCompetitors.find((c: any) => c.groupCompetitorId === compId);
                        if (compObj) {
                          const activeEv = tournament?.events.find((ev) => ev.id === medleyEventId);
                          const totalSolves = activeEv?.solveCount || 5;
                          const submitted = compObj.submittedCount || compObj.results?.length || 0;
                          const nextSolve = Math.min(submitted + 1, totalSolves);
                          setMedleyAttemptNumber(nextSolve.toString());
                        }
                      }}
                      disabled={!medleyGroupId}
                      className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 disabled:opacity-50"
                    >
                      <option value="">-- Chọn Thí Sinh --</option>
                      {filteredMedleyCompetitors.map((c: any) => (
                        <option key={c.groupCompetitorId} value={c.groupCompetitorId}>{c.competitorName}</option>
                      ))}
                    </select>
                  </div>
                </div>

                {medleyCompetitorId && (
                  <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 space-y-4">
                    <div className="space-y-3">
                      <div className="flex items-center justify-between border-b border-slate-200 pb-2">
                        <p className="text-[10px] font-bold text-slate-500 uppercase">Tổng Thời Gian Medley</p>
                        {tournament.events.find((ev) => ev.id === medleyEventId) && (
                          <span className="text-[10px] font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded border border-indigo-100">
                            Gồm {tournament.events.find((ev) => ev.id === medleyEventId)?.medleyPuzzles.length || 0} khối
                          </span>
                        )}
                      </div>

                      <div className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-3">
                        <div className="flex items-center justify-between gap-3">
                          <div>
                            <label className="block text-xs font-bold text-slate-900">Tổng Thời Gian (giây)</label>
                            <p className="text-[10px] text-slate-500">Ví dụ: nhập 45.20</p>
                          </div>
                          <div>
                            <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1">Penalty</label>
                            <select
                              value={medleyPenalties['total'] || 'none'}
                              onChange={(e) => setMedleyPenalties({ total: e.target.value })}
                              className="rounded-lg border border-slate-200 bg-slate-50 px-2.5 py-1.5 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                            >
                              <option value="none">OK (Không phạt)</option>
                              {penaltyTypes.filter((p) => p.code !== 'OK').map((p) => <option key={p.id} value={p.id}>{p.label}</option>)}
                            </select>
                          </div>
                        </div>

                        <input
                          type="number"
                          step="0.01"
                          value={medleyTimes['total'] || ''}
                          onChange={(e) => setMedleyTimes({ total: e.target.value })}
                          placeholder="VD: 45.20"
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2.5 text-sm text-slate-900 font-mono font-bold outline-none focus:bg-white focus:border-indigo-600"
                        />
                      </div>
                    </div>

                    {/* Signature */}
                    <div>
                      <div className="flex items-center justify-between mb-1.5">
                        <label className="text-[10px] font-bold text-slate-500 uppercase">Chữ Ký Thí Sinh</label>
                        <button type="button" onClick={clearMedleySignature} className="text-[10px] font-bold text-red-600 hover:underline">Xóa chữ ký</button>
                      </div>
                      <canvas
                        ref={medleyCanvasRef} width={400} height={80}
                        onMouseDown={startMedleyDrawing} onMouseMove={drawMedley}
                        onMouseUp={() => setIsMedleyDrawing(false)} onMouseLeave={() => setIsMedleyDrawing(false)}
                        className="w-full rounded-lg border border-slate-200 cursor-crosshair block bg-white"
                        style={{ height: '80px' }}
                      />
                    </div>
                  </div>
                )}

                <button type="submit" disabled={isSubmittingMedley || !medleyCompetitorId}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
                >
                  {isSubmittingMedley ? <Loader2 className="h-4 w-4 animate-spin" /> : <TimerIcon className="h-4 w-4" />}
                  {isSubmittingMedley ? 'Đang gửi...' : 'Gửi Kết Quả Medley'}
                </button>
              </form>
            )}

            {submitMedleyResultStatus && (
              <div className={`mt-4 flex items-center gap-2 rounded-lg border px-4 py-3 text-xs font-medium ${submitMedleyResultStatus.ok ? 'border-emerald-200 bg-emerald-50 text-emerald-800' : 'border-red-200 bg-red-50 text-red-800'
                }`}>
                {submitMedleyResultStatus.ok ? <CheckCircle className="h-4 w-4" /> : <AlertCircle className="h-4 w-4" />}
                {submitMedleyResultStatus.message}
              </div>
            )}
          </div>

          {/* Medley Monitor */}
          <div className="rounded-xl border border-slate-200 bg-white p-5 h-fit shadow-2xs text-slate-900">
            <h3 className="font-bold text-xs text-slate-700 mb-4 uppercase tracking-wider">Tiến Độ Medley</h3>
            {isLoadingMedleyLive ? (
              <div className="flex justify-center py-6"><Loader2 className="h-5 w-5 animate-spin text-indigo-600" /></div>
            ) : filteredMedleyCompetitors.length === 0 ? (
              <p className="text-xs text-slate-400">Chọn nhóm thi Medley.</p>
            ) : (
              <div className="space-y-3">
                {filteredMedleyCompetitors.map((c: any) => (
                  <div key={c.groupCompetitorId} className="border-b border-slate-100 pb-2.5 last:border-0">
                    <div className="flex items-center justify-between text-xs">
                      <span className="font-bold text-slate-900 truncate mr-2">{c.competitorName}</span>
                      <span className={`text-[10px] font-bold ${c.completedSolves > 0 ? 'text-emerald-600' : 'text-slate-400'}`}>
                        {c.completedSolves > 0 ? 'HOÀN THÀNH' : 'ĐANG THI'}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* ─── TAB 4: VERIFY QR ─────────────────────────────────── */}
      {activeTab === 'verify' && (
        <div className="rounded-xl border border-slate-200 bg-white p-6 max-w-2xl mx-auto w-full shadow-2xs text-slate-900">
          <h2 className="text-base font-bold text-slate-900 mb-1 flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-emerald-600" /> Xác Nhận QR Trạm Trọng Tài
          </h2>
          <p className="text-xs text-slate-500 mb-5">Kiểm tra thông tin thẻ QR thí sinh tại trạm bàn thi cụ thể.</p>
          <form onSubmit={handleVerifyStation} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Môn Thi</label>
                <select value={verifyForm.eventId} onChange={(e) => setVerifyForm((v) => ({ ...v, eventId: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                >
                  {tournament.events.map((e) => <option key={e.id} value={e.id}>{e.puzzleTypeName} ({e.eventFormatCode})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Round</label>
                <input type="number" min="1" value={verifyForm.roundNumber}
                  onChange={(e) => setVerifyForm((v) => ({ ...v, roundNumber: e.target.value }))}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">Số Trạm Bàn Thi</label>
              <input type="number" min="1" value={verifyForm.stationNumber}
                onChange={(e) => setVerifyForm((v) => ({ ...v, stationNumber: e.target.value }))}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1.5">QR Token Thí Sinh</label>
              <div className="relative">
                <Scan className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
                <input type="text" value={verifyForm.qrToken}
                  onChange={(e) => setVerifyForm((v) => ({ ...v, qrToken: e.target.value }))}
                  placeholder="Nhập mã QR token..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-10 pr-4 py-2.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
            </div>
            <button type="submit" disabled={isVerifying || !verifyForm.qrToken.trim()}
              className="w-full flex items-center justify-center gap-2 rounded-lg py-2.5 text-xs font-semibold text-white bg-indigo-600 hover:bg-indigo-700 transition disabled:opacity-50 shadow-2xs"
            >
              {isVerifying ? <Loader2 className="h-4 w-4 animate-spin" /> : <ShieldCheck className="h-4 w-4" />}
              {isVerifying ? 'Đang xác thực...' : 'Xác Thực Trạm Thi'}
            </button>
          </form>

          {verifyResult && (
            <div className={`mt-5 flex items-start gap-3 rounded-lg border p-4 text-xs ${verifyResult.success && verifyResult.canSubmit
              ? 'border-emerald-200 bg-emerald-50 text-emerald-800'
              : 'border-red-200 bg-red-50 text-red-800'
              }`}>
              {verifyResult.success && verifyResult.canSubmit ? (
                <CheckCircle className="h-4 w-4 shrink-0 mt-0.5" />
              ) : (
                <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              )}
              <div>
                <p className="font-bold text-slate-900">{verifyResult.message}</p>
                {verifyResult.success && (
                  <div className="mt-2 space-y-1 text-xs text-slate-600">
                    <p>Group Competitor ID: <strong className="text-slate-900 font-mono">{verifyResult.groupCompetitorId}</strong></p>
                    <p>Event: <strong className="text-slate-900">{verifyResult.eventName}</strong></p>
                    <p>Group / Station: <strong className="text-slate-900">{verifyResult.groupName} / Trạm {verifyResult.stationNumber}</strong></p>
                    <p>Lượt tiếp theo: <strong className="font-bold text-indigo-600">#{verifyResult.nextSolveNumber} / {verifyResult.solveCount}</strong></p>
                    {verifyResult.currentScramble && (
                      <ScrambleDisplay sequence={verifyResult.currentScramble.sequence} solveNumber={verifyResult.nextSolveNumber} className="mt-2" />
                    )}
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}

      {/* ─── TAB 5: ROUND CONTROL (LIFECYCLE STEPPER) ──────────── */}
      {activeTab === 'round' && (
        <div className="space-y-4 max-w-7xl mx-auto w-full">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider font-mono">
                Điều Hành Tiến Trình Vòng Thi
              </p>
              <h2 className="text-xl font-bold text-slate-900 tracking-tight mt-0.5 flex items-center gap-2">
                <Play className="h-5 w-5 text-indigo-600" />
                Round Control Lifecycle Stepper
              </h2>
              <p className="text-xs text-slate-500 mt-1">
                Khởi tạo nhóm thi đấu, tạo chuỗi scramble, khai mạc vòng đấu, khóa kết quả và thăng hạng thí sinh cho từng môn thi.
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
                  <EventRoundControlPanel
                    key={event.id}
                    event={event}
                    tournamentId={id}
                    defaultStationCount={detectedStations}
                  />
                ))}
            </div>
          )}
        </div>
      )}

      {/* Result Correction Modal */}
      {editingResult && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-slate-900">
            <div>
              <span className="text-[10px] font-bold text-amber-600 uppercase tracking-wider font-mono">BÀN ĐIỀU CHỈNH ĐIỂM</span>
              <h3 className="text-base font-bold text-slate-900 mt-0.5 leading-tight">
                Sửa điểm {editingResult.competitorName} — Solve #{editingResult.solveNumber}
              </h3>
              <p className="text-xs text-slate-500 mt-1">
                Sửa đổi điểm thi trực tiếp của đấu thủ. Thao tác này sẽ ghi nhận lại điểm số trên Live Leaderboard.
              </p>
            </div>

            {/* Evidence Photo / Scorecard Attachment */}
            {(() => {
              const formattedUrl = formatEvidencePhotoUrl(editingResult.evidencePhotoUrl);
              return formattedUrl ? (
                <div className="rounded-lg border border-indigo-200 bg-indigo-50/50 p-3 space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-bold text-indigo-700 uppercase tracking-wider block">📸 Ảnh Minh Chứng / Tờ Ghi Điểm</span>
                    <button
                      type="button"
                      onClick={() => window.open(formattedUrl, '_blank')}
                      className="text-[10px] font-semibold text-indigo-600 hover:underline inline-flex items-center gap-1"
                    >
                      Mở Tab Mới ↗
                    </button>
                  </div>
                  <div
                    onClick={() => window.open(formattedUrl, '_blank')}
                    className="block group relative overflow-hidden rounded-lg border border-slate-200 cursor-pointer min-h-[120px] bg-slate-100 flex items-center justify-center"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={formattedUrl}
                      alt="Evidence photo"
                      className="max-h-48 w-full object-contain transition group-hover:scale-105"
                    />
                  </div>
                </div>
              ) : null;
            })()}

            <div className="space-y-3">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Thời Gian Sửa (Giây)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingResultTime}
                  onChange={(e) => setEditingResultTime(e.target.value)}
                  placeholder="Ví dụ: 12.34"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600 font-mono"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Hình Phạt (Penalty)</label>
                <select
                  value={editingResultPenalty}
                  onChange={(e) => setEditingResultPenalty(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 font-semibold outline-none focus:bg-white focus:border-indigo-600"
                >
                  <option value="none">OK (Hợp lệ)</option>
                  {penaltyTypes.filter((p) => p.code !== 'OK').map((p) => (
                    <option key={p.id} value={p.id}>{p.label}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase mb-1 font-mono">Lý Do Đổi Điểm</label>
                <textarea
                  value={editingResultReason}
                  onChange={(e) => setEditingResultReason(e.target.value)}
                  placeholder="Ví dụ: Trọng tài nhập sai hàng chục, đối sánh với scorecard giấy..."
                  rows={2}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600"
                />
              </div>
            </div>

            {/* Error display */}
            {correctionError && (
              <div className="flex items-center gap-1.5 rounded-lg bg-red-50 border border-red-200 px-3 py-2 text-xs text-red-700 font-medium">
                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                <span>{correctionError}</span>
              </div>
            )}

            {/* Action buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setEditingResult(null)}
                className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                onClick={handleCorrectSubmit}
                disabled={isCorrectingSubmit || !editingResultTime || !editingResultReason.trim()}
                className="inline-flex items-center gap-1 rounded-lg bg-indigo-600 px-4 py-2 text-xs font-semibold text-white hover:bg-indigo-700 disabled:opacity-50 transition shadow-2xs"
              >
                {isCorrectingSubmit ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
                Xác Nhận Đổi Điểm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
