'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getEventCompetitors, overrideSeed, closeEventRegistration } from '@/lib/api/tournaments';
import type { TournamentDetailDto, EventDetailDto, EventCompetitorDto } from '@/lib/api/types';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  CheckCircle2,
  Sliders,
  Award,
  Zap,
  Check,
  X,
  ShieldCheck,
} from 'lucide-react';

function msToDisplay(ms?: number | null): string {
  if (!ms || ms <= 0) return 'Không giới hạn';
  const totalSec = ms / 1000;
  if (totalSec >= 60) {
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(2);
    return `${min}:${sec.padStart(5, '0')}`;
  }
  return `${totalSec.toFixed(2)}s`;
}

function parseDisplayToMs(str: string): number | null {
  const trimmed = str.trim().toLowerCase().replace('s', '');
  if (!trimmed) return null;
  if (trimmed.includes(':')) {
    const parts = trimmed.split(':');
    const min = parseFloat(parts[0]);
    const sec = parseFloat(parts[1]);
    if (isNaN(min) || isNaN(sec)) return null;
    return Math.round((min * 60 + sec) * 1000);
  }
  const sec = parseFloat(trimmed);
  if (isNaN(sec) || sec <= 0) return null;
  return Math.round(sec * 1000);
}

function EventCard({
  event,
  tournamentStatus,
}: {
  event: EventDetailDto;
  tournamentStatus: string;
}) {
  const [expanded, setExpanded] = useState(true);
  const [competitors, setCompetitors] = useState<EventCompetitorDto[]>([]);
  const [loadingComp, setLoadingComp] = useState(false);
  const [closingReg, setClosingReg] = useState(false);
  const [isLocallyClosed, setIsLocallyClosed] = useState(false);
  const [editSeedId, setEditSeedId] = useState<string | null>(null);
  const [seedInput, setSeedInput] = useState('');
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const tStatusUpper = (tournamentStatus || '').toUpperCase();
  const isTournamentEndedOrOngoing = tStatusUpper === 'COMPLETED' || tStatusUpper === 'ONGOING' || tStatusUpper === 'REGISTRATION_CLOSED' || tStatusUpper === 'CANCELLED';
  const isEventRegistrationClosed = (event.registrationStatusCode || '').toUpperCase() === 'CLOSED' || isLocallyClosed || isTournamentEndedOrOngoing;

  const loadCompetitors = async () => {
    setLoadingComp(true);
    setError(null);
    try {
      const data = await getEventCompetitors(event.id);
      setCompetitors(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể tải danh sách thí sinh');
    } finally {
      setLoadingComp(false);
    }
  };

  useEffect(() => {
    loadCompetitors();
  }, [event.id]);

  const [showConfirmClose, setShowConfirmClose] = useState(false);

  const handleCloseRegistration = async () => {
    setClosingReg(true);
    setError(null);
    try {
      await closeEventRegistration(event.id);
      setIsLocallyClosed(true);
      setMessage(`Đã khóa cổng đăng ký cho hạng mục ${event.puzzleTypeName || event.puzzleTypeCode}.`);
      setShowConfirmClose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể khóa cổng đăng ký');
    } finally {
      setClosingReg(false);
    }
  };

  const handleSaveSeed = async (regEventId: string) => {
    const ms = parseDisplayToMs(seedInput);
    if (!ms) {
      setError('Thời gian hạt giống không hợp lệ. Nhập ví dụ: 15.50');
      return;
    }
    setError(null);
    try {
      await overrideSeed(regEventId, { seedTimeMs: ms });
      setCompetitors((prev) =>
        prev.map((c) =>
          c.registrationEventId === regEventId ? { ...c, seedTimeMs: ms } : c
        )
      );
      setMessage(`Đã cập nhật hạt giống thành ${msToDisplay(ms)}.`);
      setEditSeedId(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể cập nhật thời gian hạt giống');
    }
  };

  const isMedley = event.eventFormatCode === 'MEDLEY';
  const formatLabel = isMedley
    ? 'Thi Đấu Đội Phối Hợp (Medley Relay)'
    : event.solveCount === 5
    ? 'Average of 5 (Ao5)'
    : event.solveCount === 3
    ? 'Mean of 3 (Mo3)'
    : `Best of ${event.solveCount}`;

  return (
    <div className="rounded-xl border border-border bg-card/60 backdrop-blur-sm shadow-sm overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-border/50 bg-card/40">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-base font-bold text-foreground tracking-tight flex items-center gap-2">
                <Trophy className="h-4 w-4 text-amber-500" />
                {event.puzzleTypeName || event.puzzleTypeCode}
              </h2>
              {isMedley ? (
                <span className="rounded-md bg-purple-500/10 border border-purple-500/20 px-2 py-0.5 text-[10px] font-bold text-purple-400 flex items-center gap-1">
                  <Zap className="h-2.5 w-2.5" /> MEDLEY
                </span>
              ) : (
                <span className="rounded-md bg-blue-500/10 border border-blue-500/20 px-2 py-0.5 text-[10px] font-bold text-blue-400">
                  {formatLabel}
                </span>
              )}
              {isEventRegistrationClosed ? (
                <span className="rounded-md bg-red-500/10 border border-red-500/20 px-2 py-0.5 text-[10px] font-bold text-red-400 flex items-center gap-1">
                  <ShieldCheck className="h-3 w-3" /> Cổng Đăng Ký Đã Khóa
                </span>
              ) : (
                <span className="rounded-md bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-400 flex items-center gap-1">
                  <CheckCircle2 className="h-3 w-3" /> Đang Mở Đăng Ký
                </span>
              )}
            </div>

            {/* WCA Rules Summary Line */}
            <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-muted-foreground font-normal">
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3 text-muted-foreground" />
                Time Limit: <strong className="text-foreground font-mono font-medium">{msToDisplay(event.timeLimitMs)}</strong>
              </span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Scissors className="h-3 w-3 text-orange-400" />
                Cutoff: <strong className="text-orange-400 font-mono font-medium">{msToDisplay(event.cutoffTimeMs)}</strong>
              </span>
              <span className="text-border">•</span>
              <span>Số Lượt: <strong className="text-foreground font-mono font-medium">{event.solveCount} solves</strong></span>
              <span className="text-border">•</span>
              <span className="flex items-center gap-1">
                <Users className="h-3 w-3 text-emerald-400" />
                Chỉ tiêu môn: <strong className="text-foreground font-mono font-medium">
                  {competitors.length} {event.maxCapacity && event.maxCapacity > 0 ? `/ ${event.maxCapacity} thí sinh` : 'thí sinh (Không giới hạn)'}
                </strong>
              </span>
            </div>

            {/* Medley Puzzle Chain */}
            {isMedley && event.medleyPuzzles && event.medleyPuzzles.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-muted-foreground">Chuỗi Rubik:</span>
                {event.medleyPuzzles
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((p, idx) => (
                    <span
                      key={p.id}
                      className="rounded bg-purple-500/10 border border-purple-500/20 px-1.5 py-0.5 text-[10px] font-medium text-purple-300"
                    >
                      #{idx + 1} {p.puzzleTypeName}
                    </span>
                  ))}
              </div>
            )}
          </div>

          {/* Action Buttons */}
          <div className="flex items-center gap-2 self-start lg:self-center">
            {!isEventRegistrationClosed && (
              <button
                onClick={() => setShowConfirmClose(true)}
                disabled={closingReg}
                className="inline-flex items-center gap-1.5 rounded-lg border border-orange-500/30 bg-orange-500/10 px-3 py-1.5 text-xs font-semibold text-orange-400 hover:bg-orange-500/20 disabled:opacity-50 transition cursor-pointer"
              >
                {closingReg ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Lock className="h-3.5 w-3.5" />}
                Khóa Đăng Ký
              </button>
            )}
            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg border border-border bg-card hover:bg-muted/50 text-muted-foreground transition"
              title={expanded ? 'Thu gọn' : 'Mở rộng'}
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>
      </div>

      {/* Body: Competitor List Table */}
      {expanded && (
        <div className="p-4 sm:p-5">
          {message && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-emerald-500/10 border border-emerald-500/20 px-3 py-2 text-xs text-emerald-400 font-medium">
              <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              {message}
              <button onClick={() => setMessage(null)} className="ml-auto text-xs underline">Đóng</button>
            </div>
          )}
          {error && (
            <div className="mb-3 flex items-center gap-2 rounded-lg bg-red-500/10 border border-red-500/20 px-3 py-2 text-xs text-red-400 font-medium">
              <AlertCircle className="h-3.5 w-3.5 shrink-0" />
              {error}
              <button onClick={() => setError(null)} className="ml-auto text-xs underline">Đóng</button>
            </div>
          )}

          {/* Section Sub-Header */}
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Users className="h-3.5 w-3.5 text-muted-foreground" />
              <span className="text-xs font-bold text-foreground">
                Thí Sinh Đã Đăng Ký ({competitors.length})
              </span>
            </div>
            <button
              onClick={loadCompetitors}
              disabled={loadingComp}
              className="text-xs text-muted-foreground hover:text-foreground flex items-center gap-1 font-medium"
            >
              <RefreshCw className={`h-3 w-3 ${loadingComp ? 'animate-spin' : ''}`} />
              Làm mới
            </button>
          </div>

          {loadingComp ? (
            <div className="flex justify-center py-6">
              <Loader2 className="h-5 w-5 animate-spin text-primary" />
            </div>
          ) : competitors.length === 0 ? (
            <p className="text-center py-6 text-xs text-muted-foreground">Chưa có thí sinh đăng ký cho môn thi này.</p>
          ) : (
            <div className="overflow-x-auto rounded-lg border border-border bg-card/40">
              <table className="w-full text-left text-xs border-collapse">
                <thead>
                  <tr className="bg-muted/30 border-b border-border text-[11px] font-semibold text-muted-foreground">
                    <th className="px-3 py-2 text-center w-10">STT</th>
                    <th className="px-3 py-2">Họ & Tên Thí Sinh</th>
                    <th className="px-3 py-2">Email</th>
                    <th className="px-3 py-2">Thành Tích Hạt Giống</th>
                    <th className="px-3 py-2 text-right">Tùy Chọn Hạt Giống</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border/50">
                  {competitors.map((c, i) => (
                    <tr key={c.registrationEventId} className="hover:bg-muted/20 transition">
                      <td className="px-3 py-2.5 text-center text-muted-foreground font-mono">{i + 1}</td>
                      <td className="px-3 py-2.5 font-semibold text-foreground">{c.displayName}</td>
                      <td className="px-3 py-2.5 text-muted-foreground font-mono">{c.email || '—'}</td>
                      <td className="px-3 py-2.5">
                        {c.seedTimeMs && c.seedTimeMs > 0 ? (
                          <span className="font-mono font-semibold text-primary">{msToDisplay(c.seedTimeMs)}</span>
                        ) : (
                          <span className="text-[10px] text-muted-foreground/70 italic">Mặc định (Chưa có seed)</span>
                        )}
                      </td>
                      <td className="px-3 py-2.5 text-right">
                        {editSeedId === c.registrationEventId ? (
                          <div className="flex items-center gap-1 justify-end">
                            <input
                              type="text"
                              value={seedInput}
                              onChange={(e) => setSeedInput(e.target.value)}
                              placeholder="15.50"
                              className="w-20 rounded border border-primary bg-card px-2 py-0.5 text-xs text-foreground font-mono outline-none"
                              autoFocus
                            />
                            <button
                              onClick={() => handleSaveSeed(c.registrationEventId)}
                              className="rounded bg-emerald-600 px-2 py-0.5 text-[10px] font-bold text-white hover:bg-emerald-500"
                            >
                              Lưu
                            </button>
                            <button
                              onClick={() => setEditSeedId(null)}
                              className="rounded border border-border px-1.5 py-0.5 text-[10px] text-muted-foreground hover:bg-muted/50"
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => {
                              setEditSeedId(c.registrationEventId);
                              setSeedInput(c.seedTimeMs ? (c.seedTimeMs / 1000).toFixed(2) : '');
                            }}
                            className="inline-flex items-center gap-1 rounded border border-border px-2 py-0.5 text-[10px] text-muted-foreground hover:text-foreground hover:bg-muted/50 transition cursor-pointer"
                          >
                            <Edit3 className="h-3 w-3" />
                            Sửa Hạt Giống
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirm Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        title="Khóa Đăng Ký Hạng Mục"
        description={`Xác nhận khóa cổng đăng ký môn "${event.puzzleTypeName || event.puzzleTypeCode}"? Thao tác này giúp chốt danh sách để tạo nhóm thi đấu.`}
        confirmText="Xác Nhận Khóa"
        cancelText="Hủy Bỏ"
        variant="warning"
        isLoading={closingReg}
        onConfirm={handleCloseRegistration}
        onClose={() => setShowConfirmClose(false)}
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
        setError(err instanceof Error ? err.message : 'Không thể tải thông tin giải đấu');
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
          <p className="font-semibold">{error ?? 'Không tìm thấy giải đấu'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-6 flex-wrap">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        <Link href="/managertournaments" className="hover:text-foreground transition-colors">Giải Đấu</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/managertournaments/${id}`} className="hover:text-foreground transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold">Cấu Hình Hạng Mục & Thí Sinh</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-6">
        <div>
          <h1 className="text-xl font-bold text-foreground tracking-tight flex items-center gap-2">
            <Award className="h-6 w-6 text-primary" />
            Cấu Hình Hạng Mục & Thí Sinh
          </h1>
          <p className="text-xs text-muted-foreground mt-1">
            Quản lý quy định luật WCA (Time Limit, Cutoff) và theo dõi danh sách đăng ký thí sinh cho từng hạng mục.
          </p>
        </div>
        <StatusBadge status={tournament.statusCode} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 mb-6">
        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Tổng Hạng Mục</span>
            <Trophy className="h-4 w-4 text-amber-500" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2 font-mono">{tournament.events.length} Môn Thi</p>
        </div>

        <div className="rounded-xl border border-border bg-card p-4 shadow-sm">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold uppercase tracking-wider text-muted-foreground">Quy Chuẩn Thi Đấu</span>
            <Sliders className="h-4 w-4 text-blue-500" />
          </div>
          <p className="text-xl font-bold text-foreground mt-2">Luật Thi WCA</p>
        </div>
      </div>

      {/* Main Content List */}
      {tournament.events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-card py-16 text-center text-muted-foreground shadow-sm">
          <Trophy className="h-8 w-8 mx-auto mb-2 opacity-30" />
          <p className="font-semibold text-sm">Chưa có hạng mục thi đấu nào được cấu hình.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {tournament.events
            .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0))
            .map((event) => (
              <EventCard key={event.id} event={event} tournamentStatus={tournament.statusCode} />
            ))}
        </div>
      )}
    </div>
  );
}
