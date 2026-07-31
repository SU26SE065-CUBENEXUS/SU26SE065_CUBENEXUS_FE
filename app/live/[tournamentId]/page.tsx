'use client';

import { useEffect, useState, useRef, use } from 'react';
import Link from 'next/link';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { getPublicLiveTournamentDetail, type PublicLiveTournamentDetailDto, type PublicLiveEventDto } from '@/lib/api/live';
import { getLiveBoardState, formatEvidencePhotoUrl } from '@/lib/api/operations';
import { formatMs } from '@/components/tournament-manager/TimerDisplay';
import * as signalR from '@microsoft/signalr';
import {
  Trophy,
  MapPin,
  Calendar,
  Layers,
  ArrowLeft,
  Wifi,
  WifiOff,
  Clock,
  Zap,
  Play,
  RotateCcw,
  AlertCircle,
  TrendingUp,
  User,
  Medal,
  Loader2,
  CalendarDays,
  Flame,
  CheckCircle,
  Timer,
  Award,
  Camera,
  ExternalLink,
  X,
  FileText,
} from 'lucide-react';

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

function formatDisplayTime(ms: number | null | undefined, isDnf = false, isDns = false): string {
  if (isDns) return 'DNS';
  if (isDnf || ms === 2147483647) return 'DNF';
  if (ms === null || ms === undefined || ms < 0 || ms === -1) return '—';
  return formatMs(ms, false);
}

function formatLimitMs(ms?: number | null): string | null {
  if (!ms) return null;
  const totalSeconds = ms / 1000;
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(2);
    return `${minutes}:${seconds.padStart(5, '0')}`;
  }
  return `${totalSeconds.toFixed(2)}s`;
}

export default function PublicLiveBoardDetailPage({
  params,
}: {
  params: Promise<{ tournamentId: string }>;
}) {
  const { tournamentId } = use(params);

  // ─── States ────────────────────────────────────────────────
  const [tournament, setTournament] = useState<PublicLiveTournamentDetailDto | null>(null);
  const [selectedEventId, setSelectedEventId] = useState<string>('');
  const [selectedRoundNumber, setSelectedRoundNumber] = useState<number>(1);
  const [liveBoard, setLiveBoard] = useState<any>(null);
  const [isLoadingDetails, setIsLoadingDetails] = useState(true);
  const [isLoadingBoard, setIsLoadingBoard] = useState(false);
  const [detailsError, setDetailsError] = useState<string | null>(null);
  const [boardError, setBoardError] = useState<string | null>(null);
  const [lastUpdated, setLastUpdated] = useState<string>('');

  // ─── Realtime / SignalR ────────────────────────────────────
  const [hubConnection, setHubConnection] = useState<signalR.HubConnection | null>(null);
  const [isHubConnected, setIsHubConnected] = useState(false);
  const [hubStatus, setHubStatus] = useState<'Disconnected' | 'Connecting...' | 'Connected' | 'Reconnecting...'>('Disconnected');

  // ─── Visual Update Highlights ──────────────────────────────
  const [updatedCompetitorIds, setUpdatedCompetitorIds] = useState<Set<string>>(new Set());
  const prevCompetitorsRef = useRef<Record<string, { completedSolves: number; bestTimeMs?: number; averageTimeMs?: number }>>({});

  // ─── Evidence Photo Inspection Modal State ──────────────────
  const [selectedInspectSolve, setSelectedInspectSolve] = useState<{
    competitorName: string;
    competitorUserCode: string;
    solveNumber: number;
    eventName: string;
    roundNumber: number;
    rawTimeMs?: number;
    finalTimeMs?: number;
    penaltyCode: string;
    isDnf: boolean;
    submittedAt?: string;
    evidencePhotoUrl?: string;
    esignatureData?: string;
  } | null>(null);

  // Get active event details
  const activeEvent = tournament?.events.find((e) => e.id === selectedEventId);
  const solveCount = liveBoard?.solveCount || activeEvent?.solveCount || 5;
  const showAverage = solveCount === 3 || solveCount === 5;

  // ─── Load Tournament Details ───────────────────────────────
  const loadTournamentDetails = async (initial = false) => {
    if (initial) setIsLoadingDetails(true);
    setDetailsError(null);
    try {
      const data = await getPublicLiveTournamentDetail(tournamentId);
      setTournament(data);
      
      if (initial && data.events.length > 0) {
        // Default to currently active event/round if returned, otherwise first event
        const defaultEventId = data.activeEventId || data.events[0].id;
        const defaultEvent = data.events.find(e => e.id === defaultEventId) || data.events[0];
        const defaultRoundNumber = data.activeRoundNumber || defaultEvent.currentRoundNumber || 1;

        setSelectedEventId(defaultEventId);
        setSelectedRoundNumber(defaultRoundNumber);
      }
    } catch (err) {
      console.error('Error fetching public tournament details:', err);
      setDetailsError('Could not load tournament details. Please try again.');
    } finally {
      if (initial) setIsLoadingDetails(false);
    }
  };

  useEffect(() => {
    loadTournamentDetails(true);
  }, [tournamentId]);

  // ─── Load Live Board Rankings ──────────────────────────────
  const loadLiveBoard = async (showLoader = false) => {
    if (!selectedEventId || !selectedRoundNumber) return;
    if (showLoader) setIsLoadingBoard(true);
    setBoardError(null);
    try {
      const data = await getLiveBoardState(selectedEventId, selectedRoundNumber);
      setLastUpdated(new Date().toLocaleTimeString('vi-VN'));
      
      // Calculate highlight for changed rows
      if (data && data.competitors) {
        const newUpdates = new Set<string>();
        const prev = prevCompetitorsRef.current;
        const currentMap: typeof prev = {};

        data.competitors.forEach((c: any) => {
          const key = c.groupCompetitorId;
          const currentVal = {
            completedSolves: c.completedSolves,
            bestTimeMs: c.bestTimeMs,
            averageTimeMs: c.averageTimeMs,
          };
          currentMap[key] = currentVal;

          // Check if competitor had previous data and it was updated
          if (prev[key]) {
            const hasUpdates =
              prev[key].completedSolves !== currentVal.completedSolves ||
              prev[key].bestTimeMs !== currentVal.bestTimeMs ||
              prev[key].averageTimeMs !== currentVal.averageTimeMs;
            
            if (hasUpdates) {
              newUpdates.add(key);
            }
          }
        });

        prevCompetitorsRef.current = currentMap;

        if (newUpdates.size > 0) {
          setUpdatedCompetitorIds(newUpdates);
          // Clear highlighting after 2 seconds
          setTimeout(() => {
            setUpdatedCompetitorIds(new Set());
          }, 2000);
        }
      }

      setLiveBoard(data);
    } catch (err) {
      console.warn('Live board not available or failed to fetch:', err);
      setLiveBoard(null);
    } finally {
      if (showLoader) setIsLoadingBoard(false);
    }
  };

  // Trigger loading board when event/round selection changes
  useEffect(() => {
    loadLiveBoard(true);
  }, [selectedEventId, selectedRoundNumber]);

  // ─── Polling Fallback (15s) ──────────────────────────────────
  useEffect(() => {
    const interval = setInterval(() => {
      if (!isHubConnected && tournament?.status === 'ONGOING') {
        console.log('[Specator Polling] Refreshing live board...');
        loadLiveBoard();
        loadTournamentDetails();
      }
    }, 15000);

    return () => clearInterval(interval);
  }, [selectedEventId, selectedRoundNumber, isHubConnected, tournament]);

  // ─── SignalR Realtime Subscription ──────────────────────────
  useEffect(() => {
    let connection: signalR.HubConnection | null = null;
    let isCancelled = false;

    if (!selectedEventId || !selectedRoundNumber || tournament?.status !== 'ONGOING') {
      return;
    }

    const initSignalR = async () => {
      const conn = new signalR.HubConnectionBuilder()
        .withUrl('/hubs/tournament')
        .withAutomaticReconnect([0, 2000, 5000, 10000])
        .build();
      connection = conn;

      conn.on('ResultSubmitted', (payload: any) => {
        if (payload.eventId === selectedEventId && payload.roundNumber === selectedRoundNumber) {
          console.log('[Realtime SignalR] Result submitted event received. Reloading board...');
          loadLiveBoard();
        }
      });

      conn.on('ResultSubmittedEvent', (payload: any) => {
        if (payload.eventId === selectedEventId && payload.roundNumber === selectedRoundNumber) {
          console.log('[Realtime SignalR] ResultSubmittedEvent received. Reloading board...');
          loadLiveBoard();
        }
      });

      conn.on('ResultCorrected', (payload: any) => {
        if (payload.eventId === selectedEventId && payload.roundNumber === selectedRoundNumber) {
          console.log('[Realtime SignalR] ResultCorrected received. Reloading board...');
          loadLiveBoard();
        }
      });

      conn.on('RoundStarted', (payload: any) => {
        if (payload.eventId === selectedEventId && payload.roundNumber === selectedRoundNumber) {
          console.log('[Realtime SignalR] Round started. Refreshing details...');
          loadLiveBoard();
          loadTournamentDetails();
        }
      });

      conn.on('RoundCompleted', (payload: any) => {
        if (payload.eventId === selectedEventId && payload.roundNumber === selectedRoundNumber) {
          console.log('[Realtime SignalR] Round completed. Refreshing details...');
          loadLiveBoard();
          loadTournamentDetails();
        }
      });

      conn.on('ResultsLocked', (payload: any) => {
        if (payload.eventId === selectedEventId && payload.roundNumber === selectedRoundNumber) {
          console.log('[Realtime SignalR] Results locked. Refreshing details...');
          loadLiveBoard();
          loadTournamentDetails();
        }
      });

      conn.onreconnecting((error) => {
        if (isCancelled) return;
        setIsHubConnected(false);
        setHubStatus('Reconnecting...');
        console.warn('[SignalR Reconnecting]', error);
      });

      conn.onreconnected(async () => {
        if (isCancelled) return;
        setIsHubConnected(true);
        setHubStatus('Connected');
        try {
          await conn.invoke('JoinEventRound', selectedEventId, selectedRoundNumber);
        } catch (e) {
          console.error('[SignalR group re-join error]', e);
        }
      });

      conn.onclose(() => {
        if (isCancelled) return;
        setIsHubConnected(false);
        setHubStatus('Disconnected');
      });

      try {
        setHubStatus('Connecting...');
        await conn.start();

        if (isCancelled) {
          await conn.stop().catch(() => undefined);
          return;
        }

        setIsHubConnected(true);
        setHubStatus('Connected');

        await conn.invoke('JoinEventRound', selectedEventId, selectedRoundNumber);
        console.log(`[SignalR connected] Subscribed to group: event:${selectedEventId}:round:${selectedRoundNumber}`);
      } catch (err) {
        if (isCancelled) return;
        setIsHubConnected(false);
        setHubStatus('Disconnected');
        console.error('[SignalR connection error]', err);
      }
    };

    initSignalR();

    return () => {
      isCancelled = true;
      if (connection) {
        connection.invoke('LeaveEventRound', selectedEventId, selectedRoundNumber)
          .catch(() => undefined)
          .finally(() => {
            connection?.stop().catch(() => undefined);
          });
      }
    };
  }, [selectedEventId, selectedRoundNumber, tournament]);

  // Clean up previous values ref on event switch
  useEffect(() => {
    prevCompetitorsRef.current = {};
    setUpdatedCompetitorIds(new Set());
  }, [selectedEventId]);

  // Find Podium Standings
  const topCompetitors = liveBoard?.competitors
    ?.filter((c: any) => c.rank <= 3 && c.rank > 0)
    ?.sort((a: any, b: any) => a.rank - b.rank) || [];

  const firstPlace = topCompetitors.find((c: any) => c.rank === 1);
  const secondPlace = topCompetitors.find((c: any) => c.rank === 2);
  const thirdPlace = topCompetitors.find((c: any) => c.rank === 3);

  return (
    <div className="flex flex-col min-h-screen bg-background text-foreground relative overflow-hidden">
      {/* Visual wow gradients */}
      <div className="absolute top-0 left-0 w-[600px] h-[600px] rounded-full bg-primary/5 blur-[140px] pointer-events-none" />
      
      <Header />

      <main className="flex-grow max-w-7xl w-full mx-auto px-4 py-8 sm:px-6 lg:px-8 relative z-10">
        
        {/* Back Link */}
        <div className="mb-6 flex justify-between items-center">
          <Link
            href="/live"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors group"
          >
            <ArrowLeft className="h-4 w-4 group-hover:-translate-x-1 transition-transform" />
            Back to Tournaments
          </Link>

          {lastUpdated && (
            <span className="text-[10px] text-muted-foreground/60 font-medium">
              Last updated: {lastUpdated}
            </span>
          )}
        </div>

        {/* Loading details */}
        {isLoadingDetails ? (
          <div className="flex min-h-[400px] items-center justify-center">
            <div className="flex flex-col items-center gap-3">
              <Loader2 className="h-8 w-8 animate-spin text-primary" />
              <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading Live Board Details...</p>
            </div>
          </div>
        ) : detailsError || !tournament ? (
          /* Error State */
          <div className="max-w-md mx-auto text-center py-16 px-4 rounded-3xl border border-red-500/10 bg-red-500/5">
            <AlertCircle className="h-10 w-10 text-red-400 mx-auto mb-4" />
            <h3 className="font-extrabold text-base mb-2">Error Loading Live Board</h3>
            <p className="text-xs text-muted-foreground mb-6">{detailsError || 'Tournament not found'}</p>
            <button
              onClick={() => loadTournamentDetails(true)}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
            >
              <RotateCcw className="h-3.5 w-3.5" /> Retry
            </button>
          </div>
        ) : (
          /* Main Layout */
          <div className="space-y-6">
            
            {/* Tournament Details Banner Card */}
            <div className="rounded-3xl border border-border bg-card/40 backdrop-blur-md p-6 relative overflow-hidden shadow-2xl">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.72_0.21_42_/_0.06),transparent_55%)]" />
              <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
                <div className="space-y-2">
                  <div className="flex flex-wrap items-center gap-3">
                    {tournament.isLive ? (
                      <span className="rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 text-[10px] font-extrabold text-red-500 flex items-center gap-1.5 uppercase animate-pulse">
                        <Flame className="h-3.5 w-3.5" /> ĐANG THI ĐẤU (LIVE)
                      </span>
                    ) : tournament.status === 'ONGOING' ? (
                      <span className="rounded-full bg-purple-500/10 border border-purple-500/30 px-3 py-1 text-[10px] font-extrabold text-purple-400 uppercase">
                        ĐANG DIỄN RA
                      </span>
                    ) : tournament.status === 'COMPLETED' ? (
                      <span className="rounded-full bg-muted border border-border px-3 py-1 text-[10px] font-extrabold text-muted-foreground uppercase">
                        ĐÃ HOÀN THÀNH
                      </span>
                    ) : tournament.status === 'REGISTRATION_OPEN' ? (
                      <span className="rounded-full bg-emerald-500/10 border border-emerald-500/30 px-3 py-1 text-[10px] font-extrabold text-emerald-400 uppercase">
                        MỞ ĐĂNG KÝ
                      </span>
                    ) : tournament.status === 'REGISTRATION_CLOSED' ? (
                      <span className="rounded-full bg-amber-500/10 border border-amber-500/30 px-3 py-1 text-[10px] font-extrabold text-amber-400 uppercase">
                        ĐÓNG ĐĂNG KÝ
                      </span>
                    ) : tournament.status === 'CANCELLED' ? (
                      <span className="rounded-full bg-red-500/10 border border-red-500/30 px-3 py-1 text-[10px] font-extrabold text-red-400 uppercase">
                        ĐÃ HỦY
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/10 border border-blue-500/30 px-3 py-1 text-[10px] font-extrabold text-blue-400 uppercase">
                        SẮP DIỄN RA
                      </span>
                    )}
                    <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase flex items-center gap-1">
                      <MapPin className="h-3.5 w-3.5 text-primary" /> {tournament.location || 'Offline Venue'}
                    </span>
                  </div>
                  <h1 className="text-2xl sm:text-4xl font-black tracking-tight text-foreground uppercase">
                    {tournament.name}
                  </h1>
                  {tournament.description && (
                    <p className="text-xs sm:text-sm text-muted-foreground max-w-3xl leading-relaxed">
                      {tournament.description}
                    </p>
                  )}
                  <p className="text-xs text-muted-foreground font-medium flex items-center gap-1">
                    <Calendar className="h-3.5 w-3.5 text-primary" />
                    {formatDateRange(tournament.startTime, tournament.endTime)}
                  </p>
                </div>

                {/* Hub realtime connection status */}
                {tournament.status === 'ONGOING' && (
                  <div className="shrink-0 flex items-center gap-2">
                    <div className={`flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold border shadow-sm ${
                      isHubConnected
                        ? 'text-emerald-400 border-emerald-400/30 bg-emerald-400/8'
                        : 'text-orange-400 border-orange-400/30 bg-orange-400/8 animate-pulse'
                    }`}>
                      {isHubConnected ? <Wifi className="h-4 w-4" /> : <WifiOff className="h-4 w-4" />}
                      <span className="uppercase text-[10px] tracking-wider">
                        {isHubConnected ? 'Realtime Connected' : 'Updates Paused (Auto-Polling)'}
                      </span>
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Event Tabs Switcher */}
            <div className="flex border-b border-border overflow-x-auto scrollbar-none gap-1 pt-2">
              {tournament.events.map((ev) => {
                const isSelected = selectedEventId === ev.id;
                const isEvLive = ev.roundStatus === 'ONGOING';
                
                return (
                  <button
                    key={ev.id}
                    onClick={() => {
                      setSelectedEventId(ev.id);
                      setSelectedRoundNumber(ev.currentRoundNumber || 1);
                    }}
                    className={`flex items-center gap-2 px-5 py-3.5 border-b-2 text-xs font-extrabold uppercase tracking-wider transition-all -mb-[2px] whitespace-nowrap ${
                      isSelected
                        ? 'border-primary text-primary'
                        : 'border-transparent text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    <span>{ev.puzzleTypeName}</span>
                    {isEvLive && (
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shrink-0" />
                    )}
                  </button>
                );
              })}
            </div>

            {/* State handlers if Tournament is Upcoming / Not Ongoing / Not Completed */}
            {tournament.status !== 'ONGOING' && tournament.status !== 'COMPLETED' ? (
              <div className="text-center py-20 bg-card/20 border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-4">
                <CalendarDays className="h-12 w-12 text-primary/40 mx-auto" />
                <h3 className="font-extrabold text-lg uppercase tracking-tight text-foreground">
                  {tournament.status === 'REGISTRATION_CLOSED'
                    ? 'Giải Đấu Đã Đóng Đăng Ký — Sắp Khởi Tranh'
                    : tournament.status === 'REGISTRATION_OPEN'
                    ? 'Giải Đấu Đang Mở Đăng Ký Thi Đấu'
                    : 'Giải Đấu Chưa Khởi Tranh'}
                </h3>
                <p className="text-xs text-muted-foreground max-w-md mx-auto leading-relaxed">
                  {tournament.status === 'REGISTRATION_CLOSED'
                    ? `Cổng đăng ký đã khép lại. Giải đấu sẽ chính thức khởi tranh vào ngày ${new Date(tournament.startTime).toLocaleDateString('vi-VN')}. Hãy quay lại khi giải bắt đầu để xem kết quả Live trực tiếp!`
                    : tournament.status === 'REGISTRATION_OPEN'
                    ? `Giải đấu đang mở cổng đăng ký cho các thí sinh. Thời gian thi đấu chính thức bắt đầu từ ngày ${new Date(tournament.startTime).toLocaleDateString('vi-VN')}.`
                    : `Giải đấu dự kiến bắt đầu vào ngày ${new Date(tournament.startTime).toLocaleDateString('vi-VN')}. Vui lòng quay lại sau để xem bảng xếp hạng trực tiếp.`}
                </p>
                <div className="pt-2">
                  <span className="inline-flex rounded-xl bg-primary/10 border border-primary/20 px-4 py-2 text-xs font-bold text-primary uppercase">
                    TRẠNG THÁI: {
                      tournament.status === 'REGISTRATION_OPEN' ? 'ĐANG MỞ ĐĂNG KÝ' :
                      tournament.status === 'REGISTRATION_CLOSED' ? 'ĐÃ ĐÓNG ĐĂNG KÝ' :
                      tournament.status === 'PUBLISHED' ? 'CÔNG BỐ / SẮP KHỞI TRANH' :
                      tournament.status === 'DRAFT' ? 'BẢN NHÁP' :
                      tournament.status.replace('_', ' ')
                    }
                  </span>
                </div>
              </div>
            ) : !selectedEventId ? (
              /* No events config fallback */
              <div className="text-center py-16 bg-card/20 border border-border rounded-3xl">
                <p className="text-sm font-semibold text-muted-foreground">No events are configured for this tournament.</p>
              </div>
            ) : (
              /* Main dynamic live board section */
              <div className="space-y-6">
                
                {/* Event Round selection & details header */}
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-muted/20 border border-border/80 p-4 rounded-2xl">
                  <div className="flex items-center gap-3">
                    <span className="flex items-center justify-center h-8 w-8 rounded-lg bg-primary/10 text-primary shrink-0">
                      <Layers className="h-4.5 w-4.5" />
                    </span>
                    <div>
                      <h3 className="font-extrabold text-sm uppercase tracking-tight text-foreground">
                        {activeEvent?.puzzleTypeName || 'Event Board'}
                      </h3>
                      {activeEvent && (
                        <p className="text-[10px] text-muted-foreground uppercase font-bold tracking-wider mt-0.5">
                          Format: {activeEvent.eventFormatCode} · Solve Count: {activeEvent.solveCount}
                        </p>
                      )}
                    </div>
                  </div>

                  {/* Round Switcher */}
                  {activeEvent && activeEvent.currentRoundNumber && (
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] font-extrabold uppercase text-muted-foreground tracking-wider">Round:</span>
                      <div className="flex gap-1">
                        {Array.from({ length: activeEvent.currentRoundNumber }, (_, i) => i + 1).map((r) => (
                          <button
                            key={r}
                            onClick={() => setSelectedRoundNumber(r)}
                            className={`h-8 w-8 rounded-lg text-xs font-bold transition ${
                              selectedRoundNumber === r
                                ? 'bg-primary text-primary-foreground shadow-md'
                                : 'bg-card border border-border text-foreground hover:bg-muted/80'
                            }`}
                          >
                            {r}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>

                {/* Loading Live Board State */}
                {isLoadingBoard ? (
                  <div className="flex justify-center py-20">
                    <Loader2 className="h-8 w-8 animate-spin text-primary" />
                  </div>
                ) : !liveBoard ? (
                  /* Empty state for active round */
                  <div className="text-center py-20 bg-card/25 border border-dashed border-border rounded-3xl max-w-xl mx-auto space-y-3">
                    <Play className="h-10 w-10 text-muted-foreground/30 mx-auto" />
                    <h3 className="font-bold text-sm uppercase tracking-wider text-muted-foreground">No Active Round Right Now</h3>
                    <p className="text-xs text-muted-foreground max-w-xs mx-auto leading-relaxed">
                      The tournament administrators have not started or initialized round {selectedRoundNumber} for this event yet.
                    </p>
                  </div>
                ) : (
                  /* Live Board Stats & Standings table */
                  <div className="space-y-6">
                    
                    {/* Live Stats Overview Banner */}
                    <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Round Status</span>
                        <div className="flex items-center gap-2 mt-1">
                          <span className={`h-2 w-2 rounded-full ${
                            liveBoard.roundStatus === 'ONGOING' ? 'bg-red-500 animate-pulse' :
                            liveBoard.roundStatus === 'COMPLETED' ? 'bg-green-500' : 'bg-orange-400'
                          }`} />
                          <span className="font-extrabold text-sm uppercase text-foreground">{liveBoard.roundStatus}</span>
                        </div>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Completion Progress</span>
                        <span className="font-black text-xs text-primary mt-1 leading-tight">
                          {typeof liveBoard.progress === 'object' && liveBoard.progress
                            ? `${liveBoard.progress.completedCompetitors ?? 0} / ${liveBoard.progress.totalCompetitors ?? 0} Competitors (${liveBoard.progress.submittedSolves ?? 0}/${liveBoard.progress.totalExpectedSolves ?? 0} Solves)`
                            : liveBoard.progress || '—'}
                        </span>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Solving Format</span>
                        <span className="font-extrabold text-sm text-foreground mt-1 uppercase">
                          {solveCount === 5 ? 'Average of 5 (Ao5)' : solveCount === 3 ? 'Mean of 3 (Mo3)' : `Best of ${solveCount}`}
                        </span>
                      </div>

                      <div className="rounded-xl border border-border/60 bg-card p-4 shadow-sm flex flex-col justify-between">
                        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Time Limit & Cutoff</span>
                        <div className="mt-1 text-xs font-bold space-y-0.5">
                          {activeEvent?.timeLimitMs ? (
                            <p className="text-foreground">Limit: <span className="font-mono text-primary">{formatLimitMs(activeEvent.timeLimitMs)}</span></p>
                          ) : (
                            <p className="text-muted-foreground/60">No Limit</p>
                          )}
                          {activeEvent?.cutoffTimeMs && (
                            <p className="text-orange-400">Cutoff: <span className="font-mono">{formatLimitMs(activeEvent.cutoffTimeMs)}</span></p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Gorgeous Podium for Completed rounds */}
                    {liveBoard.roundStatus === 'COMPLETED' && topCompetitors.length > 0 && (
                      <div className="rounded-3xl border border-primary/20 bg-gradient-to-b from-primary/10 to-card/50 p-6 shadow-2xl relative overflow-hidden">
                        <div className="absolute top-0 right-0 w-[200px] h-[200px] rounded-full bg-yellow-500/5 blur-[50px] pointer-events-none" />
                        <h3 className="text-center font-black text-sm uppercase tracking-widest text-primary mb-6 flex items-center justify-center gap-1.5">
                          <Award className="h-5 w-5 text-yellow-500" /> PODIUM STANDINGS
                        </h3>

                        <div className="flex flex-col sm:flex-row items-end justify-center gap-6 max-w-4xl mx-auto">
                          
                          {/* 2nd Place */}
                          {secondPlace && (
                            <div className="w-full sm:w-1/3 flex flex-col items-center order-2 sm:order-1 mt-4 sm:mt-0">
                              <div className="relative mb-2">
                                <div className="h-16 w-16 rounded-full border-2 border-slate-300 bg-slate-400/20 overflow-hidden flex items-center justify-center text-xs font-black">
                                  {secondPlace.competitorAvatarUrl ? (
                                    <img src={secondPlace.competitorAvatarUrl} alt={secondPlace.competitorName} className="h-full w-full object-cover" />
                                  ) : (
                                    secondPlace.competitorName.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black flex items-center justify-center shadow-md">
                                  2
                                </span>
                              </div>
                              <h4 className="font-extrabold text-xs text-foreground uppercase tracking-tight text-center truncate w-full">{secondPlace.competitorName}</h4>
                              <p className="text-[9px] text-muted-foreground/60 font-mono tracking-tighter">{secondPlace.competitorUserCode}</p>
                              
                              <div className="w-full bg-slate-400/10 border border-slate-300/20 rounded-xl p-2.5 mt-2 text-center text-[10px] space-y-0.5">
                                <p className="text-muted-foreground">Best: <span className="font-mono font-bold text-foreground">{formatDisplayTime(secondPlace.bestTimeMs, secondPlace.competitorStatus === 'DNF', secondPlace.competitorStatus === 'NO_SHOW')}</span></p>
                                {showAverage && (
                                  <p className="text-muted-foreground">Avg: <span className="font-mono font-bold text-primary">{formatDisplayTime(secondPlace.averageTimeMs, secondPlace.competitorStatus === 'DNF', secondPlace.competitorStatus === 'NO_SHOW')}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 1st Place */}
                          {firstPlace && (
                            <div className="w-full sm:w-1/3 flex flex-col items-center order-1 sm:order-2">
                              <Trophy className="h-6 w-6 text-yellow-500 animate-bounce mb-1" />
                              <div className="relative mb-2">
                                <div className="h-20 w-20 rounded-full border-4 border-yellow-500 bg-yellow-500/10 overflow-hidden flex items-center justify-center text-sm font-black shadow-lg shadow-yellow-500/10">
                                  {firstPlace.competitorAvatarUrl ? (
                                    <img src={firstPlace.competitorAvatarUrl} alt={firstPlace.competitorName} className="h-full w-full object-cover" />
                                  ) : (
                                    firstPlace.competitorName.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-yellow-500 text-yellow-950 text-xs font-black flex items-center justify-center shadow-lg">
                                  1
                                </span>
                              </div>
                              <h4 className="font-black text-sm text-yellow-500 uppercase tracking-tight text-center truncate w-full">{firstPlace.competitorName}</h4>
                              <p className="text-[9px] text-muted-foreground/60 font-mono tracking-tighter">{firstPlace.competitorUserCode}</p>
                              
                              <div className="w-full bg-yellow-500/10 border border-yellow-500/20 rounded-xl p-3 mt-2 text-center text-xs space-y-0.5 shadow-md">
                                <p className="text-muted-foreground">Best: <span className="font-mono font-bold text-foreground">{formatDisplayTime(firstPlace.bestTimeMs, firstPlace.competitorStatus === 'DNF', firstPlace.competitorStatus === 'NO_SHOW')}</span></p>
                                {showAverage && (
                                  <p className="text-muted-foreground">Avg: <span className="font-mono font-bold text-primary">{formatDisplayTime(firstPlace.averageTimeMs, firstPlace.competitorStatus === 'DNF', firstPlace.competitorStatus === 'NO_SHOW')}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                          {/* 3rd Place */}
                          {thirdPlace && (
                            <div className="w-full sm:w-1/3 flex flex-col items-center order-3 mt-4 sm:mt-0">
                              <div className="relative mb-2">
                                <div className="h-16 w-16 rounded-full border-2 border-amber-700 bg-amber-700/20 overflow-hidden flex items-center justify-center text-xs font-black">
                                  {thirdPlace.competitorAvatarUrl ? (
                                    <img src={thirdPlace.competitorAvatarUrl} alt={thirdPlace.competitorName} className="h-full w-full object-cover" />
                                  ) : (
                                    thirdPlace.competitorName.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <span className="absolute -bottom-1 -right-1 h-6 w-6 rounded-full bg-amber-700 text-white text-xs font-black flex items-center justify-center shadow-md">
                                  3
                                </span>
                              </div>
                              <h4 className="font-extrabold text-xs text-foreground uppercase tracking-tight text-center truncate w-full">{thirdPlace.competitorName}</h4>
                              <p className="text-[9px] text-muted-foreground/60 font-mono tracking-tighter">{thirdPlace.competitorUserCode}</p>
                              
                              <div className="w-full bg-amber-700/10 border border-amber-700/20 rounded-xl p-2.5 mt-2 text-center text-[10px] space-y-0.5">
                                <p className="text-muted-foreground">Best: <span className="font-mono font-bold text-foreground">{formatDisplayTime(thirdPlace.bestTimeMs, thirdPlace.competitorStatus === 'DNF', thirdPlace.competitorStatus === 'NO_SHOW')}</span></p>
                                {showAverage && (
                                  <p className="text-muted-foreground">Avg: <span className="font-mono font-bold text-primary">{formatDisplayTime(thirdPlace.averageTimeMs, thirdPlace.competitorStatus === 'DNF', thirdPlace.competitorStatus === 'NO_SHOW')}</span></p>
                                )}
                              </div>
                            </div>
                          )}

                        </div>
                      </div>
                    )}

                    {/* Rankings Table */}
                    <div className="rounded-2xl border border-border overflow-hidden bg-card/30 backdrop-blur-md shadow-lg">
                      <div className="overflow-x-auto">
                        <table className="w-full text-sm text-left">
                          <thead>
                            <tr className="bg-muted/40 border-b border-border">
                              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-12 text-center">Rank</th>
                              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Competitor</th>
                              <th className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-16">Group</th>
                              {Array.from({ length: solveCount }, (_, i) => (
                                <th key={i} className="px-3 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">
                                  #{i + 1}
                                </th>
                              ))}
                              <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-24">Best</th>
                              {showAverage && (
                                <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-24">
                                  {solveCount === 3 ? 'Mean' : 'Average'}
                                </th>
                              )}
                            </tr>
                          </thead>
                          <tbody className="divide-y divide-border">
                            {liveBoard.competitors && liveBoard.competitors.length === 0 ? (
                              <tr>
                                <td colSpan={solveCount + (showAverage ? 5 : 4)} className="text-center py-10 text-xs text-muted-foreground">
                                  No competitors assigned to this round.
                                </td>
                              </tr>
                            ) : (
                              liveBoard.competitors.map((c: any) => {
                                const isUpdating = updatedCompetitorIds.has(c.groupCompetitorId);
                                const compGroup = liveBoard.groups?.find((g: any) => g.groupId === c.groupId);

                                return (
                                  <tr
                                    key={c.groupCompetitorId}
                                    className={`transition-all duration-500 hover:bg-muted/30 ${
                                      isUpdating ? 'bg-primary/20 scale-[0.99] font-semibold' : ''
                                    } ${
                                      c.rank === 1 ? 'bg-yellow-500/5 hover:bg-yellow-500/8' :
                                      c.rank === 2 ? 'bg-slate-300/5 hover:bg-slate-300/8' :
                                      c.rank === 3 ? 'bg-amber-700/5 hover:bg-amber-700/8' : ''
                                    }`}
                                  >
                                    {/* Rank column with medal indicator */}
                                    <td className="px-4 py-3.5 text-center font-bold">
                                      {c.rank === 1 ? (
                                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-yellow-500 text-yellow-950 text-xs font-black shadow-sm">1</span>
                                      ) : c.rank === 2 ? (
                                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-slate-300 text-slate-900 text-xs font-black shadow-sm">2</span>
                                      ) : c.rank === 3 ? (
                                        <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-amber-700 text-white text-xs font-black shadow-sm">3</span>
                                      ) : (
                                        <span className="text-muted-foreground text-xs">{c.rank || '—'}</span>
                                      )}
                                    </td>

                                    {/* Competitor Profile Info */}
                                    <td className="px-4 py-3.5 font-bold text-foreground">
                                      <div className="flex items-center gap-3">
                                        <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-extrabold text-primary shadow-inner">
                                          {c.competitorAvatarUrl ? (
                                            <img src={c.competitorAvatarUrl} alt={c.competitorName} className="h-full w-full object-cover" />
                                          ) : (
                                            c.competitorName.slice(0, 2).toUpperCase()
                                          )}
                                        </div>
                                        <div>
                                          <span className="text-sm font-extrabold text-foreground">{c.competitorName}</span>
                                          {c.isCutoffReached && (
                                            <span className="inline-flex items-center rounded-md bg-orange-500/10 border border-orange-500/30 px-1.5 py-0.5 text-[9px] font-extrabold text-orange-400 uppercase tracking-wider ml-2">
                                              CUTOFF
                                            </span>
                                          )}
                                          <span className="text-[10px] text-muted-foreground/60 font-mono tracking-tight block mt-0.5">
                                            {c.competitorUserCode || 'No Code'}
                                          </span>
                                        </div>
                                      </div>
                                    </td>

                                    {/* Group Column */}
                                    <td className="px-3 py-3.5 text-center">
                                      <span className="inline-flex items-center rounded-md bg-muted/60 border border-border px-2 py-0.5 text-[9px] font-bold text-muted-foreground uppercase">
                                        {compGroup?.groupName || 'Group'}
                                      </span>
                                    </td>

                                    {/* Solve attempts */}
                                    {Array.from({ length: solveCount }, (_, i) => {
                                      const attempt = c.results && c.results.find((r: any) => r.solveNumber === i + 1);
                                      const isAttemptDnf = attempt?.isDnf || attempt?.penaltyCode === 'DNF';
                                      const isAttemptDns = attempt?.penaltyCode === 'DNS' || (c.competitorStatus === 'NO_SHOW' && i === 0 && !attempt);
                                      const val = attempt 
                                        ? (isAttemptDns ? 'DNS' : formatDisplayTime(attempt.finalTimeMs, isAttemptDnf))
                                        : (isAttemptDns ? 'DNS' : '—');
                                      
                                      return (
                                        <td key={i} className="px-3 py-3.5 text-center font-mono text-xs">
                                          <button
                                            type="button"
                                            onClick={() => {
                                              setSelectedInspectSolve({
                                                competitorName: c.competitorName,
                                                competitorUserCode: c.competitorUserCode,
                                                solveNumber: i + 1,
                                                eventName: activeEvent?.puzzleTypeName || 'Event',
                                                roundNumber: selectedRoundNumber,
                                                rawTimeMs: attempt?.rawTimeMs || attempt?.finalTimeMs,
                                                finalTimeMs: attempt?.finalTimeMs,
                                                penaltyCode: attempt?.penaltyCode || 'OK',
                                                isDnf: Boolean(isAttemptDnf),
                                                submittedAt: attempt?.submittedAt,
                                                evidencePhotoUrl: attempt?.evidencePhotoUrl,
                                                esignatureData: attempt?.esignatureData,
                                              });
                                            }}
                                            className={`px-2 py-1 rounded-lg transition-all hover:scale-105 hover:bg-primary/10 cursor-pointer ${
                                              attempt ? 'font-bold' : 'text-muted-foreground/60'
                                            }`}
                                            title="Bấm để xem ảnh minh chứng Cloudflare R2 & chi tiết"
                                          >
                                            <span className={`${isAttemptDnf ? 'text-red-400 font-bold' : isAttemptDns ? 'text-muted-foreground/80 font-bold' : 'text-foreground'} relative group/tooltip`}>
                                              {val}
                                              {attempt?.penaltyCode === 'PLUS_2' && <span className="text-[10px] text-orange-400 font-semibold ml-0.5">+2</span>}
                                              {attempt?.evidencePhotoUrl && (
                                                <span className="text-[9px] ml-1" title="Có ảnh tờ ghi điểm R2">📸</span>
                                              )}
                                              {attempt?.isLocked && (
                                                <span className="text-[7px] text-emerald-400 font-extrabold align-super ml-0.5" title="Verified by Judge">✓</span>
                                              )}
                                            </span>
                                          </button>
                                        </td>
                                      );
                                    })}

                                    {/* Best Time */}
                                    <td className="px-4 py-3.5 text-center font-mono text-xs font-black text-foreground bg-muted/10">
                                      {formatDisplayTime(c.bestTimeMs, c.competitorStatus === 'DNF', c.competitorStatus === 'NO_SHOW')}
                                    </td>

                                    {/* Average Time */}
                                    {showAverage && (
                                      <td className="px-4 py-3.5 text-center font-mono text-xs font-black text-primary bg-primary/5">
                                        {formatDisplayTime(c.averageTimeMs, c.competitorStatus === 'DNF', c.competitorStatus === 'NO_SHOW')}
                                      </td>
                                    )}
                                  </tr>
                                );
                              })
                            )}
                          </tbody>
                        </table>
                      </div>
                      
                      {/* Legend / Tooltips */}
                      <div className="flex flex-wrap gap-4 px-4 py-3 bg-muted/20 border-t border-border text-[10px] text-muted-foreground/80 font-medium select-none">
                        <span className="flex items-center gap-1"><span className="text-emerald-400 font-extrabold font-mono">✓</span> Verified</span>
                        <span className="flex items-center gap-1"><span className="text-orange-400 font-bold font-mono">+2</span> Penalty</span>
                        <span className="flex items-center gap-1"><span className="text-red-400 font-bold font-mono">DNF</span> Did Not Finish</span>
                        <span className="flex items-center gap-1"><span className="text-muted-foreground/80 font-bold font-mono">DNS</span> Did Not Start</span>
                        <span className="flex items-center gap-1"><span className="font-mono">—</span> Unsubmitted</span>
                      </div>
                    </div>

                    {/* Responsive Mobile Layout listing cards (hidden on desktop) */}
                    <div className="block lg:hidden space-y-4">
                      <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground mt-4 mb-2">Live Standing list</h3>
                      {liveBoard.competitors && liveBoard.competitors.map((c: any) => {
                        const isUpdating = updatedCompetitorIds.has(c.groupCompetitorId);
                        const compGroup = liveBoard.groups?.find((g: any) => g.groupId === c.groupId);
                        
                        return (
                          <div
                            key={c.groupCompetitorId}
                            className={`rounded-2xl border border-border bg-card p-4 space-y-3 transition-all duration-500 ${
                              isUpdating ? 'border-primary bg-primary/10' : ''
                            }`}
                          >
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                <span className="font-black text-sm text-primary">#{c.rank || '—'}</span>
                                <div className="h-7 w-7 rounded-full bg-primary/10 overflow-hidden flex items-center justify-center text-[10px] font-bold">
                                  {c.competitorAvatarUrl ? (
                                    <img src={c.competitorAvatarUrl} alt={c.competitorName} className="h-full w-full object-cover" />
                                  ) : (
                                    c.competitorName.slice(0, 2).toUpperCase()
                                  )}
                                </div>
                                <div>
                                  <span className="font-extrabold text-foreground text-sm block">{c.competitorName}</span>
                                  <span className="text-[9px] text-muted-foreground/60 font-mono tracking-tight">{c.competitorUserCode}</span>
                                </div>
                              </div>
                              <div className="flex flex-col items-end gap-1">
                                <span className="inline-flex rounded-md bg-muted px-1.5 py-0.5 text-[8px] font-bold text-muted-foreground uppercase">
                                  {compGroup?.groupName || 'Group'}
                                </span>
                                <span className="text-[9px] text-muted-foreground uppercase font-semibold">
                                  {c.completedSolves} / {solveCount} Completed
                                </span>
                              </div>
                            </div>

                            <div className="grid grid-cols-5 gap-1.5 pt-1.5 border-t border-border/40 font-mono text-[11px] text-center">
                              {Array.from({ length: solveCount }, (_, i) => {
                                const attempt = c.results && c.results.find((r: any) => r.solveNumber === i + 1);
                                const isAttemptDnf = attempt?.isDnf || attempt?.penaltyCode === 'DNF';
                                const isAttemptDns = attempt?.penaltyCode === 'DNS' || (c.competitorStatus === 'NO_SHOW' && i === 0 && !attempt);
                                const val = attempt 
                                  ? (isAttemptDns ? 'DNS' : formatDisplayTime(attempt.finalTimeMs, isAttemptDnf))
                                  : (isAttemptDns ? 'DNS' : '—');
                                return (
                                  <div key={i} className="bg-muted/15 py-1 rounded">
                                    <p className="text-[8px] text-muted-foreground uppercase tracking-widest font-sans font-bold">#{i+1}</p>
                                    <p className={`mt-0.5 font-bold ${isAttemptDnf ? 'text-red-400' : isAttemptDns ? 'text-muted-foreground/80' : 'text-foreground'}`}>
                                      {val}
                                      {attempt?.penaltyCode === 'PLUS_2' && <span className="text-[8px] text-orange-400 font-semibold ml-0.5">+2</span>}
                                      {attempt?.isLocked && <span className="text-[7px] text-emerald-400 ml-0.5">✓</span>}
                                    </p>
                                  </div>
                                );
                              })}
                            </div>

                            <div className="flex gap-2 justify-between items-center pt-2 text-xs font-bold border-t border-border/40">
                              <span className="text-muted-foreground">Best: <strong className="font-mono text-foreground">{formatDisplayTime(c.bestTimeMs, c.competitorStatus === 'DNF', c.competitorStatus === 'NO_SHOW')}</strong></span>
                              {showAverage && (
                                <span className="text-muted-foreground">
                                  {solveCount === 3 ? 'Mean' : 'Average'}: <strong className="font-mono text-primary">{formatDisplayTime(c.averageTimeMs, c.competitorStatus === 'DNF', c.competitorStatus === 'NO_SHOW')}</strong>
                                </span>
                              )}
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* ─── Evidence Photo Inspection Modal ─────────────────── */}
        {selectedInspectSolve && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-200">
            <div className="relative w-full max-w-xl rounded-3xl border border-border bg-card shadow-2xl overflow-hidden p-6 space-y-5 max-h-[90vh] overflow-y-auto">
              {/* Header */}
              <div className="flex items-center justify-between border-b border-border pb-4">
                <div className="flex items-center gap-2.5">
                  <span className="p-2.5 rounded-2xl bg-primary/10 text-primary border border-primary/20">
                    <Camera className="h-5 w-5" />
                  </span>
                  <div>
                    <h3 className="text-base font-black text-foreground uppercase tracking-tight leading-tight">
                      📸 Tờ Ghi Điểm Minh Chứng — Solve #{selectedInspectSolve.solveNumber}
                    </h3>
                    <p className="text-xs text-muted-foreground font-medium mt-0.5">
                      Thí sinh: <strong className="text-foreground">{selectedInspectSolve.competitorName}</strong> ({selectedInspectSolve.competitorUserCode})
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => setSelectedInspectSolve(null)}
                  className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>

              {/* Details Row */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs font-mono text-center">
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-sans uppercase font-bold">Hạng Mục</p>
                  <p className="font-extrabold text-foreground mt-0.5 truncate">{selectedInspectSolve.eventName}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-sans uppercase font-bold">Lượt Thi</p>
                  <p className="font-extrabold text-foreground mt-0.5">Solve #{selectedInspectSolve.solveNumber}</p>
                </div>
                <div className="rounded-xl border border-border/60 bg-muted/20 p-2.5">
                  <p className="text-[10px] text-muted-foreground font-sans uppercase font-bold">Hình Phạt</p>
                  <p className={`font-extrabold mt-0.5 ${selectedInspectSolve.isDnf ? 'text-red-400' : selectedInspectSolve.penaltyCode === 'PLUS_2' ? 'text-orange-400' : 'text-emerald-400'}`}>
                    {selectedInspectSolve.penaltyCode || 'OK'}
                  </p>
                </div>
                <div className="rounded-xl border border-primary/30 bg-primary/10 p-2.5">
                  <p className="text-[10px] text-primary font-sans uppercase font-bold">Kết Quả Cuối</p>
                  <p className="font-black text-primary text-sm mt-0.5">
                    {formatDisplayTime(selectedInspectSolve.finalTimeMs, selectedInspectSolve.isDnf)}
                  </p>
                </div>
              </div>

              {/* Cloudflare R2 Image Container */}
              <div>
                {(() => {
                  const formattedUrl = formatEvidencePhotoUrl(selectedInspectSolve.evidencePhotoUrl);
                  return (
                    <>
                      <div className="flex items-center justify-between mb-2">
                        <label className="text-xs font-bold text-foreground flex items-center gap-1.5 uppercase tracking-wider">
                          <FileText className="h-4 w-4 text-primary" />
                          Ảnh Tờ Ghi Điểm Trọng Tài Minh Chứng
                        </label>
                        {formattedUrl && (
                          <button
                            onClick={() => window.open(formattedUrl, '_blank')}
                            className="inline-flex items-center gap-1 text-[11px] font-extrabold text-primary hover:underline"
                          >
                            Mở Ảnh Gốc Tab Mới <ExternalLink className="h-3 w-3" />
                          </button>
                        )}
                      </div>

                      {formattedUrl ? (
                        <div
                          onClick={() => window.open(formattedUrl, '_blank')}
                          className="group relative rounded-2xl border border-primary/40 bg-black/80 overflow-hidden cursor-pointer shadow-2xl hover:border-primary transition-all duration-300 min-h-[220px] flex items-center justify-center p-2"
                          title="Click trực tiếp để mở ảnh gốc ở tab mới với độ phân giải cao nhất"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img
                            src={formattedUrl}
                            alt="Evidence scorecard photo"
                            className="w-full max-h-[350px] object-contain group-hover:scale-105 transition-transform duration-300"
                            onLoad={(e) => {
                              // Make sure image is visible after successful load
                              (e.target as HTMLElement).style.display = '';
                            }}
                            onError={(e) => {
                              const target = e.target as HTMLElement;
                              target.style.display = 'none';
                              const parent = target.parentElement;
                              if (parent && !parent.querySelector('.img-error-fallback')) {
                                const fallbackDiv = document.createElement('div');
                                fallbackDiv.className = 'img-error-fallback p-6 text-center text-xs text-amber-400 font-semibold space-y-1';
                                const url = formattedUrl || '';
                                const isLocal = url.startsWith('file://') || url.startsWith('ph://') || url.startsWith('content://');
                                const isBase64 = url.startsWith('data:image');
                                if (isLocal) {
                                  fallbackDiv.innerHTML = '⚠️ Đường dẫn ảnh lưu ở bộ nhớ máy di động.<br/><span class="text-[10px] text-gray-400 font-normal">Trọng tài cần sử dụng phiên bản ứng dụng di động mới nhất để tải ảnh trực tiếp.</span>';
                                } else if (isBase64) {
                                  fallbackDiv.innerHTML = '⚠️ Ảnh quá lớn, trình duyệt không thể hiển thị trực tiếp.<br/><span class="text-[10px] text-gray-400 font-normal">Vui lòng bấm "Mở Ảnh Gốc Tab Mới" bên trên để xem ảnh.</span>';
                                } else {
                                  fallbackDiv.innerHTML = '⚠️ Tạm thời không tải được ảnh minh chứng.<br/><span class="text-[10px] text-gray-400 font-normal">Vui lòng thử lại sau.</span>';
                                }
                                parent.appendChild(fallbackDiv);
                              }
                            }}
                          />
                          <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center text-white text-xs font-extrabold gap-2">
                            <ExternalLink className="h-5 w-5 text-primary" /> Click để mở ảnh gốc độ phân giải cao (Tab Mới)
                          </div>
                          <div className="absolute bottom-2.5 right-2.5 px-3 py-1 rounded-xl bg-black/80 backdrop-blur-md text-[10px] text-white font-extrabold border border-white/20 flex items-center gap-1 shadow-lg">
                            <ExternalLink className="h-3 w-3 text-primary" /> Click Phóng To Ảnh Gốc
                          </div>
                        </div>
                      ) : (
                        <div className="rounded-2xl border border-dashed border-border/80 bg-muted/10 py-10 px-4 text-center space-y-2">
                          <Camera className="h-8 w-8 text-muted-foreground/30 mx-auto" />
                          <p className="text-xs font-bold text-muted-foreground">Chưa có ảnh tờ ghi điểm minh chứng cho lượt thi này.</p>
                          <p className="text-[10px] text-muted-foreground/60">Trọng tài đã nhập trực tiếp điểm số qua ứng dụng di động.</p>
                        </div>
                      )}

                    </>
                  );
                })()}
              </div>

              {/* Digital Signature */}
              {selectedInspectSolve.esignatureData && (
                <div className="border-t border-border pt-3">
                  <p className="text-[10px] font-bold uppercase text-muted-foreground mb-1">Chữ Ký Trọng Tài / Thí Sinh:</p>
                  <div className="rounded-xl border border-border bg-black/40 p-2 flex justify-center">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={selectedInspectSolve.esignatureData} alt="Digital Signature" className="max-h-16 object-contain" />
                  </div>
                </div>
              )}

              {/* Close Button */}
              <div className="pt-2">
                <button
                  onClick={() => setSelectedInspectSolve(null)}
                  className="w-full rounded-xl bg-muted py-2.5 text-xs font-bold text-foreground hover:bg-muted/80 transition"
                >
                  Đóng Khung Xem
                </button>
              </div>
            </div>
          </div>
        )}
      </main>

      <Footer />
    </div>
  );
}
