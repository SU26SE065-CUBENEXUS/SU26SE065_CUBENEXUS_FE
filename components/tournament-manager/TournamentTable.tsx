import { useState } from 'react';
import Link from 'next/link';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import { StatusBadge } from './StatusBadge';
import { Settings, ChevronRight, ZoomIn, Radio, Lock } from 'lucide-react';
import { ImageLightboxModal } from '@/components/ui/ImageLightboxModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';

interface TournamentTableProps {
  tournaments: TournamentDetailDto[];
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function TournamentTable({ tournaments }: TournamentTableProps) {
  const [previewImage, setPreviewImage] = useState<{ url: string; name: string } | null>(null);
  const [targetTourToClose, setTargetTourToClose] = useState<TournamentDetailDto | null>(null);
  const [isClosingReg, setIsClosingReg] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  const executeCloseRegistration = async () => {
    if (!targetTourToClose) return;
    setIsClosingReg(true);
    setErrorMessage(null);
    try {
      const { closeRegistration } = await import('@/lib/api/tournaments');
      await closeRegistration(targetTourToClose.id);
      window.location.reload();
    } catch (err: any) {
      setErrorMessage(err.message || 'Lỗi đóng cổng đăng ký');
      setIsClosingReg(false);
    }
  };

  return (
    <div className="space-y-3">
      {/* Count Header */}
      <div className="flex items-center justify-between px-1">
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wider">
          Tìm thấy {tournaments.length} giải đấu
        </p>
      </div>

      {/* Clean Modern Light Table */}
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left border-collapse text-slate-800">
            <thead>
              <tr className="border-b border-slate-200 bg-slate-50/80">
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Giải Đấu</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Trạng Thái</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Thời Gian</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Địa Điểm</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500">Hạng Mục Thi Đấu</th>
                <th className="px-5 py-3.5 text-[11px] font-bold uppercase tracking-wider text-slate-500 text-right">Quản Lý Giải</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-medium">
              {tournaments.map((t) => (
                <tr key={t.id} className="hover:bg-slate-50/70 transition-colors group align-middle">
                  {/* Tournament Name & Banner */}
                  <td className="px-5 py-3.5">
                    <div className="flex items-center gap-3">
                      {t.bannerUrl ? (
                        <div
                          onClick={() => setPreviewImage({ url: t.bannerUrl!, name: t.name })}
                          className="w-16 h-10 rounded-lg overflow-hidden border border-slate-200 shrink-0 bg-slate-100 relative cursor-pointer hover:border-indigo-500 transition shadow-2xs"
                          title="Bấm để xem ảnh banner"
                        >
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover" />
                        </div>
                      ) : (
                        <div className="w-10 h-10 rounded-lg bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 text-xs font-bold shrink-0">
                          {t.name.slice(0, 2).toUpperCase()}
                        </div>
                      )}
                      <div className="min-w-0">
                        <p className="font-bold text-slate-900 text-sm leading-snug group-hover:text-indigo-600 transition">{t.name}</p>
                        {t.maxParticipants && (
                          <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200/80 whitespace-nowrap">
                            Tối đa {t.maxParticipants} thí sinh
                          </span>
                        )}
                      </div>
                    </div>
                  </td>

                  {/* Status */}
                  <td className="px-5 py-3.5 whitespace-nowrap">
                    <StatusBadge status={t.statusCode as TournamentStatusCode} />
                  </td>

                  {/* Date */}
                  <td className="px-5 py-3.5 text-xs text-slate-600 whitespace-nowrap font-mono font-medium">
                    {formatDateRange(t.startDate, t.endDate)}
                  </td>

                  {/* Location */}
                  <td className="px-5 py-3.5 text-xs text-slate-700 max-w-[180px]">
                    <p className="line-clamp-1 truncate font-medium">{t.location ?? '—'}</p>
                  </td>

                  {/* Events */}
                  <td className="px-5 py-3.5">
                    {t.events && t.events.length > 0 ? (
                      <div className="flex flex-wrap gap-1">
                        {t.events.slice(0, 3).map((e) => (
                          <span
                            key={e.id}
                            className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-700 border border-slate-200/80 whitespace-nowrap"
                          >
                            {e.puzzleTypeName || e.puzzleTypeCode}
                          </span>
                        ))}
                        {t.events.length > 3 && (
                          <span className="rounded-md bg-slate-100 px-2 py-0.5 text-[10px] font-semibold text-slate-500 border border-slate-200/80">
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

                  {/* Action */}
                  <td className="px-5 py-3.5 text-right whitespace-nowrap">
                    <div className="flex items-center justify-end gap-2">
                      {/* Live Operations Button */}
                      {(() => {
                        const isOngoing = (t.statusCode || '').toUpperCase() === 'ONGOING';
                        const isRegClosed = (t.statusCode || '').toUpperCase() === 'REGISTRATION_CLOSED';
                        
                        if (isOngoing) {
                          return (
                            <Link
                              href={`/managertournaments/${t.id}/live`}
                              className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs"
                              title="Giải đấu đang diễn ra. Bấm để mở Điều Hành Live"
                            >
                              Điều Hành Live
                            </Link>
                          );
                        }

                        if (isRegClosed) {
                          return (
                            <Link
                              href={`/managertournaments/${t.id}/live`}
                              className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 border border-emerald-200/80 hover:bg-emerald-100 transition"
                              title="Sẵn sàng vào Điều Hành Live"
                            >
                              Điều Hành Live
                            </Link>
                          );
                        }

                        return (
                          <Link
                            href={`/managertournaments/${t.id}/live`}
                            className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs"
                            title="Mở điều hành live"
                          >
                            Điều Hành Live
                          </Link>
                        );
                      })()}

                      {/* Lock Registration Button vs Locked Badge */}
                      {(() => {
                        const st = (t.statusCode || '').toUpperCase();
                        const isOpenForLocking = st === 'PUBLISHED' || st === 'REGISTRATION_OPEN';

                        if (isOpenForLocking) {
                          return (
                            <button
                              onClick={() => setTargetTourToClose(t)}
                              className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-300 bg-amber-50 text-amber-800 hover:bg-amber-100 transition cursor-pointer"
                              title="Khóa cổng đăng ký thủ công"
                            >
                              Khóa Đăng Ký
                            </button>
                          );
                        }

                        return (
                          <span
                            className="inline-flex items-center text-[11px] font-medium text-slate-400 bg-slate-100 border border-slate-200 px-2.5 py-1.5 rounded-lg cursor-default"
                            title="Cổng đăng ký đã đóng"
                          >
                            Đã Khóa
                          </span>
                        );
                      })()}

                      {/* Details */}
                      <Link
                        href={`/managertournaments/${t.id}`}
                        className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-white border border-slate-200 text-slate-700 hover:text-slate-900 hover:bg-slate-50 hover:border-slate-300 transition shadow-2xs cursor-pointer"
                        title="Vào trang quản lý chi tiết giải đấu"
                      >
                        Chi Tiết
                      </Link>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          {tournaments.length === 0 && (
            <div className="py-16 text-center text-slate-400 text-sm">Chưa có giải đấu nào được tạo.</div>
          )}
        </div>
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
            ? `Lỗi: ${errorMessage}`
            : `Bạn có chắc chắn muốn đóng cổng đăng ký cho giải "${targetTourToClose?.name}" ngay lập tức? Các thí sinh sẽ không thể đăng ký thêm vào giải đấu này.`
        }
        confirmText="Xác Nhận Khóa"
        cancelText="Hủy Bỏ"
        variant="warning"
        isLoading={isClosingReg}
        onConfirm={executeCloseRegistration}
        onClose={() => {
          if (!isClosingReg) {
            setTargetTourToClose(null);
            setErrorMessage(null);
          }
        }}
      />
    </div>
  );
}
