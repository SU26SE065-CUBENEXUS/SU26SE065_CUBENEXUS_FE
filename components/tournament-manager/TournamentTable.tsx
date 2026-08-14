'use client';

import { useState } from 'react';
import Link from 'next/link';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import { StatusBadge } from './StatusBadge';
import { Play, Lock, Video, Radio, CheckCircle, Globe, AlertTriangle } from 'lucide-react';
import { ImageLightboxModal } from '@/components/ui/ImageLightboxModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import { formatEventLabel } from '@/lib/utils/eventFormatter';

interface TournamentTableProps {
  tournaments: (TournamentDetailDto & { puzzleTypeName?: string })[];
  onRefresh?: () => void;
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function TournamentTable({ tournaments, onRefresh }: TournamentTableProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [targetTourToClose, setTargetTourToClose] = useState<TournamentDetailDto | null>(null);
  const [targetTourToStart, setTargetTourToStart] = useState<TournamentDetailDto | null>(null);
  const [targetTourToComplete, setTargetTourToComplete] = useState<TournamentDetailDto | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Execute Close Registration with fallback & exact error reporting
  const executeCloseRegistration = async () => {
    if (!targetTourToClose) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { closeRegistration } = await import('@/lib/api/tournaments');
      const { closeOnlineAsyncRegistration, updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');

      let lastErr: any = null;
      try {
        if (targetTourToClose.isOnlineAsync) {
          await closeOnlineAsyncRegistration(targetTourToClose.id);
        } else {
          await closeRegistration(targetTourToClose.id);
        }
        targetTourToClose.statusCode = 'registration_closed' as any;
        setTargetTourToClose(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e1) {
        lastErr = e1;
      }

      try {
        await updateAdminTournamentStatus(targetTourToClose.id, 'REGISTRATION_CLOSED');
        targetTourToClose.statusCode = 'registration_closed' as any;
        setTargetTourToClose(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e2) {
        lastErr = e2;
      }

      setErrorMessage(`Lỗi từ Backend: ${lastErr?.message || 'Không thể khóa cổng đăng ký.'}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể khóa cổng đăng ký giải đấu.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Force Start Tournament with fallback & exact error reporting
  const executeForceStart = async () => {
    if (!targetTourToStart) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { forceStartOnlineAsyncTournament, updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');

      let lastErr: any = null;
      try {
        await forceStartOnlineAsyncTournament(targetTourToStart.id);
        targetTourToStart.statusCode = 'ongoing' as any;
        setTargetTourToStart(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e1) {
        lastErr = e1;
      }

      try {
        await updateAdminTournamentStatus(targetTourToStart.id, 'ONGOING');
        targetTourToStart.statusCode = 'ongoing' as any;
        setTargetTourToStart(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e2) {
        lastErr = e2;
      }

      setErrorMessage(`Lỗi từ Backend: ${lastErr?.message || 'Không thể cho diễn ra giải đấu.'}`);
    } catch (err: any) {
      setErrorMessage(err.message || 'Không thể cho diễn ra giải đấu ngay.');
    } finally {
      setIsProcessing(false);
    }
  };

  // Execute Complete Tournament with fallback & exact error reporting
  const executeCompleteTournament = async () => {
    if (!targetTourToComplete) return;
    setIsProcessing(true);
    setErrorMessage(null);
    try {
      const { completeTournament } = await import('@/lib/api/tournaments');
      const { updateAdminTournamentStatus } = await import('@/features/admin/api/adminTournamentApi');

      let lastErr: any = null;

      try {
        await completeTournament(targetTourToComplete.id);
        targetTourToComplete.statusCode = 'completed' as any;
        setTargetTourToComplete(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e1: any) {
        lastErr = e1;
      }

      try {
        await updateAdminTournamentStatus(targetTourToComplete.id, 'COMPLETED');
        targetTourToComplete.statusCode = 'completed' as any;
        setTargetTourToComplete(null);
        if (onRefresh) onRefresh();
        else window.location.reload();
        return;
      } catch (e2: any) {
        lastErr = e2;
      }

      const detail = lastErr?.message || lastErr?.detail || 'Máy chủ từ chối chuyển trạng thái sang COMPLETED.';
      setErrorMessage(`Lỗi từ Backend: ${detail}`);
    } catch (err: any) {
      setErrorMessage(err?.message || 'Không thể hoàn thành giải đấu.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="space-y-3 text-left">
      {/* Count Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-extrabold text-slate-600 uppercase tracking-wider">
          Tìm thấy {tournaments.length} giải đấu
        </p>
      </div>

      {/* Error Banner if any action failed */}
      {errorMessage && (
        <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 text-xs font-bold text-rose-800 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button
            onClick={() => setErrorMessage(null)}
            className="px-2.5 py-1 bg-white border border-rose-300 rounded-lg text-rose-900 font-extrabold hover:bg-rose-100 transition cursor-pointer"
          >
            Đóng
          </button>
        </div>
      )}

      {/* Clean Modern Light Table (Desktop) */}
      <div className="hidden xl:block overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse text-slate-800">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/90">
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">GIẢI ĐẤU</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">TRẠNG THÁI</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">THỜI GIAN</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">ĐỊA ĐIỂM</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500">HẠNG MỤC THI ĐẤU</th>
                <th className="px-5 py-4 text-[11px] font-black uppercase tracking-wider text-slate-500 text-right">QUẢN LÝ GIẢI (ACTIONS)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tournaments.map((t) => {
                const st = (t.statusCode || '').toUpperCase();
                const isOngoing = st === 'ONGOING';
                const isCompleted = st === 'COMPLETED';
                const isOpenForLocking = st === 'PUBLISHED' || st === 'REGISTRATION_OPEN';
                const canForceStart = !isOngoing && !isCompleted;
                const canComplete = !isCompleted;

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition-colors group align-middle">
                    {/* Tournament Name & Banner */}
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {t.bannerUrl ? (
                          <div
                            onClick={() => setPreviewImage({ url: t.bannerUrl!, name: t.name })}
                            className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative cursor-pointer hover:border-indigo-500 transition shadow-2xs"
                            title="Bấm để xem ảnh banner"
                          >
                            <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover" />
                          </div>
                        ) : (
                          <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-xs font-black shrink-0 ${t.isOnlineAsync ? 'bg-indigo-50 text-indigo-600 border border-indigo-100' : 'bg-amber-50 text-amber-700 border border-amber-100'
                            }`}>
                            {t.name.slice(0, 2).toUpperCase()}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="font-extrabold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition">
                            {t.name}
                          </p>
                          {t.isOnlineAsync ? (
                            <span className="inline-block mt-0.5 text-[10px] font-black px-2 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 whitespace-nowrap">
                              Async A01 Single
                            </span>
                          ) : t.maxParticipants ? (
                            <span className="inline-block mt-0.5 text-[10px] font-extrabold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                              Tối đa {t.maxParticipants} thí sinh
                            </span>
                          ) : null}
                        </div>
                      </div>
                    </td>

                    {/* Status */}
                    <td className="px-5 py-4 whitespace-nowrap">
                      <StatusBadge status={t.statusCode as TournamentStatusCode} />
                    </td>

                    {/* Date */}
                    <td className="px-5 py-4 text-xs text-slate-600 whitespace-nowrap font-mono font-semibold">
                      {formatDateRange(t.startDate, t.endDate)}
                    </td>

                    {/* Location */}
                    <td className="px-5 py-4 text-xs text-slate-700 max-w-[180px]">
                      {t.isOnlineAsync ? (
                        <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                          <Globe className="h-3.5 w-3.5" /> Thi Trực Tuyến
                        </span>
                      ) : (
                        <p className="line-clamp-1 truncate font-medium">{t.location ?? '—'}</p>
                      )}
                    </td>

                    {/* Category/Events */}
                    <td className="px-5 py-4">
                      {t.isOnlineAsync ? (
                        <span className="inline-block rounded-lg bg-indigo-50 px-2.5 py-1 text-xs font-black text-indigo-700 border border-indigo-200/80">
                          {t.puzzleTypeName || '3x3x3 Cube'} (A01)
                        </span>
                      ) : t.events && t.events.length > 0 ? (
                        <div className="flex flex-wrap gap-1">
                          {t.events.slice(0, 3).map((e) => (
                            <span
                              key={e.id}
                              className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-700 border border-slate-200/80 whitespace-nowrap"
                            >
                              {formatEventLabel(e)}
                            </span>
                          ))}
                          {t.events.length > 3 && (
                            <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-extrabold text-slate-500 border border-slate-200/80">
                              +{t.events.length - 3}
                            </span>
                          )}
                        </div>
                      ) : (
                        <span className="text-[11px] text-slate-400 font-normal italic">
                          Chưa tạo hạng mục
                        </span>
                      )}
                    </td>

                    {/* Action Buttons Matching Custom Pill Styles */}
                    <td className="px-5 py-4 text-right whitespace-nowrap">
                      <div className="flex items-center justify-end gap-2">
                        {/*  Force Start Button */}
                        {canForceStart && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToStart(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                            title="Cho diễn ra giải đấu ngay (Force Start)"
                          >
                            <Play className="h-3.5 w-3.5 fill-current" /> Bắt Đầu Ngay
                          </button>
                        )}

                        {/* Lock Registration Button */}
                        {isOpenForLocking ? (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToClose(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-extrabold text-xs transition cursor-pointer"
                            title="Khóa cổng đăng ký ngay lập tức"
                          >
                            <Lock className="h-3.5 w-3.5 text-amber-700" /> Khóa Đăng Ký
                          </button>
                        ) : (
                          <span
                            className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-xs cursor-default"
                            title="Cổng đăng ký đã đóng"
                          >
                            <Lock className="h-3.5 w-3.5" /> Đã Khóa
                          </span>
                        )}

                        {/*  Complete Tournament Button */}
                        {canComplete && (
                          <button
                            onClick={() => {
                              setErrorMessage(null);
                              setTargetTourToComplete(t);
                            }}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition shadow-2xs cursor-pointer"
                            title="Kết thúc / Hoàn thành giải đấu"
                          >
                            <CheckCircle className="h-3.5 w-3.5" /> Hoàn Thành
                          </button>
                        )}

                        {/* Review A01 (for Async) or Live Ops (for Offline) */}
                        {t.isOnlineAsync ? (
                          <Link
                            href={`/managertournaments/${t.id}/review`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-2xs"
                            title="Review video attempt A01"
                          >
                            <Video className="h-3.5 w-3.5" /> Review A01
                          </Link>
                        ) : (
                          <Link
                            href={`/managertournaments/${t.id}/live`}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-xs transition shadow-2xs"
                            title="Mở bảng Điều Hành Live"
                          >
                            <Radio className="h-3.5 w-3.5 text-red-400" /> Live Ops
                          </Link>
                        )}

                        {/* Details Link */}
                        <Link
                          href={t.isOnlineAsync ? `/tournaments/${t.id}` : `/managertournaments/${t.id}`}
                          className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-slate-900 hover:bg-slate-50 transition font-extrabold text-xs cursor-pointer shadow-2xs"
                          title={t.isOnlineAsync ? 'Xem Leaderboard Async A01' : 'Vào trang quản lý cấu hình Offline'}
                        >
                          Chi Tiết
                        </Link>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          {tournaments.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm font-semibold">
              Chưa có giải đấu nào trong danh sách.
            </div>
          )}
        </div>
      </div>

      {/* Mobile Card List View */}
      <div className="xl:hidden space-y-4">
        {tournaments.map((t) => {
          const st = (t.statusCode || '').toUpperCase();
          const isOngoing = st === 'ONGOING';
          const isCompleted = st === 'COMPLETED';
          const isOpenForLocking = st === 'PUBLISHED' || st === 'REGISTRATION_OPEN';
          const canForceStart = !isOngoing && !isCompleted;
          const canComplete = !isCompleted;

          return (
            <div key={t.id} className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs space-y-4">
              {/* Header Info: Name, Status Badge, Type */}
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <h3 className="font-extrabold text-slate-900 text-sm leading-snug">
                    {t.name}
                  </h3>
                  <div className="flex flex-wrap gap-1 mt-1">
                    {t.isOnlineAsync ? (
                      <span className="inline-block text-[9px] font-black px-1.5 py-0.5 rounded bg-indigo-50 text-indigo-700 border border-indigo-200/80 whitespace-nowrap">
                        Async A01 Single
                      </span>
                    ) : t.maxParticipants ? (
                      <span className="inline-block text-[9px] font-extrabold px-1.5 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                        Tối đa {t.maxParticipants} thí sinh
                      </span>
                    ) : null}
                  </div>
                </div>
                <div className="shrink-0">
                  <StatusBadge status={t.statusCode as TournamentStatusCode} />
                </div>
              </div>

              {/* Details: Date, Location, Events */}
              <div className="space-y-2 border-t border-slate-100 pt-3 text-xs text-slate-600">
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Thời gian:</span>
                  <span className="font-mono font-semibold text-[11px] text-slate-700">
                    {formatDateRange(t.startDate, t.endDate)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-slate-400 font-medium">Địa điểm:</span>
                  <span className="font-medium text-slate-700 truncate max-w-[180px]">
                    {t.isOnlineAsync ? (
                      <span className="inline-flex items-center gap-1 font-bold text-indigo-600">
                        <Globe className="h-3 w-3" /> Thi Trực Tuyến
                      </span>
                    ) : (
                      t.location ?? '—'
                    )}
                  </span>
                </div>
                <div className="flex items-start justify-between">
                  <span className="text-slate-400 font-medium shrink-0">Hạng mục:</span>
                  <div className="text-right">
                    {t.isOnlineAsync ? (
                      <span className="inline-block rounded bg-indigo-50 px-2 py-0.5 text-[10px] font-black text-indigo-700 border border-indigo-200/80">
                        {t.puzzleTypeName || '3x3x3 Cube'} (A01)
                      </span>
                    ) : t.events && t.events.length > 0 ? (
                      <div className="flex flex-wrap gap-1 justify-end">
                        {t.events.map((e) => (
                          <span
                            key={e.id}
                            className="rounded bg-slate-100 px-2 py-0.5 text-[9px] font-extrabold text-slate-700 border border-slate-200/80 whitespace-nowrap"
                          >
                            {formatEventLabel(e)}
                          </span>
                        ))}
                      </div>
                    ) : (
                      <span className="text-[10px] text-slate-400 font-normal italic">
                        Chưa tạo hạng mục
                      </span>
                    )}
                  </div>
                </div>
              </div>

              {/* Actions Grid */}
              <div className="border-t border-slate-100 pt-3 flex flex-wrap gap-2 justify-end">
                {/* Force Start */}
                {canForceStart && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToStart(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none"
                  >
                    <Play className="h-3 w-3 fill-current" /> Bắt Đầu Ngay
                  </button>
                )}

                {/* Lock Registration */}
                {isOpenForLocking ? (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToClose(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full border border-amber-400 bg-amber-50/70 hover:bg-amber-100 text-amber-900 font-extrabold text-[10px] transition cursor-pointer"
                  >
                    <Lock className="h-3 w-3 text-amber-700" /> Khóa Đăng Ký
                  </button>
                ) : (
                  <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-100 border border-slate-200 text-slate-400 font-extrabold text-[10px] cursor-default">
                    <Lock className="h-3 w-3" /> Đã Khóa
                  </span>
                )}

                {/* Complete Tournament */}
                {canComplete && (
                  <button
                    onClick={() => {
                      setErrorMessage(null);
                      setTargetTourToComplete(t);
                    }}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-[10px] transition cursor-pointer border-none"
                  >
                    <CheckCircle className="h-3 w-3" /> Hoàn Thành
                  </button>
                )}

                {/* Review or Live Ops */}
                {t.isOnlineAsync ? (
                  <Link
                    href={`/managertournaments/${t.id}/review`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-[10px] transition"
                  >
                    <Video className="h-3 w-3" /> Review A01
                  </Link>
                ) : (
                  <Link
                    href={`/managertournaments/${t.id}/live`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-slate-950 hover:bg-slate-800 text-white font-extrabold text-[10px] transition"
                  >
                    <Radio className="h-3 w-3 text-red-400" /> Live Ops
                  </Link>
                )}

                {/* Details */}
                <Link
                  href={t.isOnlineAsync ? `/tournaments/${t.id}` : `/managertournaments/${t.id}`}
                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-full bg-white border border-slate-200 text-slate-800 hover:text-slate-900 hover:bg-slate-50 transition font-extrabold text-[10px]"
                >
                  Chi Tiết
                </Link>
              </div>
            </div>
          );
        })}

        {tournaments.length === 0 && (
          <div className="py-16 text-center text-slate-400 text-sm font-semibold bg-white rounded-2xl border border-slate-200 shadow-2xs">
            Chưa có giải đấu nào trong danh sách.
          </div>
        )}
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage?.url || null}
        title={previewImage ? `Poster Banner — ${previewImage.name}` : undefined}
        onClose={() => setPreviewImage(null)}
      />

      {/* Confirmation Modal for Lock Registration */}
      <ConfirmModal
        isOpen={Boolean(targetTourToClose)}
        title="Khóa Cổng Đăng Ký Giải Đấu"
        description={
          errorMessage
            ? errorMessage
            : `Bạn có chắc chắn muốn khóa cổng đăng ký cho giải "${targetTourToClose?.name}" ngay lập tức? Thí sinh sẽ không thể đăng ký thêm.`
        }
        confirmText="Xác Nhận Khóa"
        cancelText="Hủy Bỏ"
        variant="warning"
        isLoading={isProcessing}
        onConfirm={executeCloseRegistration}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToClose(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Force Start Tournament */}
      <ConfirmModal
        isOpen={Boolean(targetTourToStart)}
        title="Cho Diễn Ra Giải Đấu Ngay (Force Start)"
        description={
          errorMessage
            ? errorMessage
            : `Bạn có chắc chắn muốn cho giải đấu "${targetTourToStart?.name}" diễn ra ngay lập tức? Trạng thái sẽ được chuyển sang ONGOING.`
        }
        confirmText="Cho Diễn Ra Ngay"
        cancelText="Hủy Bỏ"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executeForceStart}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToStart(null);
            setErrorMessage(null);
          }
        }}
      />

      {/* Confirmation Modal for Complete Tournament */}
      <ConfirmModal
        isOpen={Boolean(targetTourToComplete)}
        title="Hoàn Thành Giải Đấu"
        description={
          errorMessage
            ? errorMessage
            : `Bạn có chắc chắn muốn hoàn thành giải đấu "${targetTourToComplete?.name}"? Trạng thái sẽ được chuyển sang COMPLETED.`
        }
        confirmText="Xác Nhận Hoàn Thành"
        cancelText="Hủy Bỏ"
        variant="primary"
        isLoading={isProcessing}
        onConfirm={executeCompleteTournament}
        onClose={() => {
          if (!isProcessing) {
            setTargetTourToComplete(null);
            setErrorMessage(null);
          }
        }}
      />
    </div>
  );
}
