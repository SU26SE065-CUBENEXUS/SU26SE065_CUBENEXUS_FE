'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getEventCompetitors, closeEventRegistration } from '@/lib/api/tournaments';
import type { TournamentDetailDto, EventDetailDto, EventCompetitorDto } from '@/lib/api/types';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Loader2,
  AlertCircle,
  RefreshCw,
  CheckCircle2,
  Check,
  X,
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
      setMessage(`Đã khóa cổng đăng ký cho hạng mục ${formatEventLabel(event)}.`);
      setShowConfirmClose(false);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Không thể khóa cổng đăng ký');
    } finally {
      setClosingReg(false);
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
    <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden transition-all">
      {/* Header */}
      <div className="p-4 sm:p-5 border-b border-slate-100 bg-slate-50/50">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4">
          <div className="flex-1 min-w-0">
            {/* Title Row */}
            <div className="flex items-center gap-2 flex-wrap mb-1">
              <h2 className="text-base font-bold text-slate-900 tracking-tight">
                {formatEventLabel(event)}
              </h2>
              {isEventRegistrationClosed ? (
                <span className="rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[10px] font-semibold text-slate-500">
                  Đã Khóa Đăng Ký
                </span>
              ) : (
                <span className="rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[10px] font-semibold text-emerald-700">
                  Đang Mở Đăng Ký
                </span>
              )}
            </div>

            {/* WCA Rules Summary Line */}
            <p className="text-xs text-slate-500 font-medium mt-1">
              {formatLabel} • Limit: <strong className="text-slate-700 font-mono">{msToDisplay(event.timeLimitMs)}</strong> • Cutoff: <strong className="text-slate-700 font-mono">{msToDisplay(event.cutoffTimeMs)}</strong> • Số lượt: <strong className="text-slate-700 font-mono">{event.solveCount} solves</strong> • Đăng ký: <strong className="text-indigo-600 font-mono">{competitors.length}{event.maxCapacity && event.maxCapacity > 0 ? ` / ${event.maxCapacity}` : ''}</strong>
            </p>

            {/* Medley Puzzle Chain */}
            {isMedley && event.medleyPuzzles && event.medleyPuzzles.length > 0 && (
              <div className="flex items-center gap-1.5 mt-2 flex-wrap">
                <span className="text-[11px] text-slate-400">Chuỗi Rubik:</span>
                {event.medleyPuzzles
                  .sort((a, b) => a.sortOrder - b.sortOrder)
                  .map((p, idx) => (
                    <span
                      key={p.id}
                      className="rounded bg-purple-50 border border-purple-200 px-1.5 py-0.5 text-[10px] font-semibold text-purple-700"
                    >
                      #{idx + 1} {p.puzzleTypeName}
                    </span>
                  ))}
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 shrink-0">
            {!isEventRegistrationClosed && (
              <button
                onClick={() => setShowConfirmClose(true)}
                className="inline-flex items-center gap-1.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-700 hover:bg-amber-100 transition cursor-pointer"
                title="Khóa cổng đăng ký cho môn này"
              >
                Khóa Đăng Ký Môn Thi
              </button>
            )}

            <button
              onClick={() => setExpanded(!expanded)}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-600 hover:bg-slate-50 transition shadow-2xs"
            >
              {expanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </button>
          </div>
        </div>

        {/* Feedback messages */}
        {message && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-emerald-50 border border-emerald-200 p-2.5 text-xs text-emerald-700 font-medium">
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message}</span>
            <button onClick={() => setMessage(null)} className="ml-auto text-xs underline">Đóng</button>
          </div>
        )}
        {error && (
          <div className="mt-3 flex items-center gap-2 rounded-lg bg-red-50 border border-red-200 p-2.5 text-xs text-red-700 font-medium">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
            <button onClick={() => setError(null)} className="ml-auto text-xs underline">Đóng</button>
          </div>
        )}
      </div>

      {/* Expanded Competitor List */}
      {expanded && (
        <div className="p-4 sm:p-5 space-y-4">
          <div className="flex items-center justify-between">
            <p className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Thí Sinh Đã Đăng Ký ({competitors.length})
            </p>
            <button
              onClick={loadCompetitors}
              disabled={loadingComp}
              className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-500 hover:text-slate-900 transition"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${loadingComp ? 'animate-spin' : ''}`} />
              Tải lại
            </button>
          </div>

          {loadingComp && (
            <div className="py-8 text-center text-xs text-slate-400">Đang tải danh sách thí sinh…</div>
          )}

          {!loadingComp && competitors.length === 0 && (
            <div className="py-8 text-center text-xs text-slate-400">Chưa có thí sinh nào đăng ký cho môn này.</div>
          )}

          {!loadingComp && competitors.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-slate-200">
              <table className="w-full text-xs text-left border-collapse">
                <thead>
                  <tr className="bg-slate-50 border-b border-slate-200 font-semibold text-slate-500 uppercase tracking-wider">
                    <th className="py-2.5 px-4 w-12 text-center">STT</th>
                    <th className="py-2.5 px-4">Thí Sinh</th>
                    <th className="py-2.5 px-4">Email</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {competitors.map((c, idx) => (
                    <tr key={c.registrationEventId} className="hover:bg-slate-50/60 transition-colors">
                      <td className="py-2.5 px-4 text-center font-mono font-bold text-slate-400">{idx + 1}</td>
                      <td className="py-2.5 px-4 font-semibold text-slate-900">{c.displayName}</td>
                      <td className="py-2.5 px-4 text-slate-500">{c.email || '—'}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal */}
      <ConfirmModal
        isOpen={showConfirmClose}
        title="Khóa Cổng Đăng Ký Môn Thi"
        description={`Bạn có chắc muốn đóng cổng đăng ký cho môn thi "${formatEventLabel(event)}"?`}
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
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-xl border border-red-200 bg-red-50 p-8 text-center text-red-700">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error ?? 'Không tìm thấy giải đấu'}</p>
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
        <span className="text-slate-900 font-bold">Cấu Hình Hạng Mục & Thí Sinh</span>
      </div>

      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-xl border border-slate-200 shadow-2xs">
        <div>
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">Hạng Mục & Quy Tắc</p>
          <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-0.5">
            Cấu Hình Hạng Mục & Thí Sinh
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Quản lý quy định luật WCA (Time Limit, Cutoff) và theo dõi danh sách đăng ký thí sinh cho từng hạng mục.
          </p>
        </div>
        <StatusBadge status={tournament.statusCode} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Tổng Hạng Mục</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">{tournament.events.length} Môn Thi</p>
        </div>

        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400">Quy Chuẩn Thi Đấu</span>
          <p className="text-2xl font-bold text-slate-900 mt-1">Luật Thi WCA</p>
        </div>
      </div>

      {/* Main Content List */}
      {tournament.events.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 text-center text-slate-400 shadow-2xs">
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
