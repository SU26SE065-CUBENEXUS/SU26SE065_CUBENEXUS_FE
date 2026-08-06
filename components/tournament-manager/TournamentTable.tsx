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

      {/* Clean Modern Table */}
      <div className="overflow-x-auto rounded-xl border border-zinc-800/80 bg-zinc-950 shadow-xl">
        <table className="w-full text-sm text-left border-collapse text-zinc-100">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-900/60">
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Giải Đấu</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Trạng Thái</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Thời Gian</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Địa Điểm</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400">Hạng Mục Thi Đấu</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-zinc-400 text-right">Quản Lý Giải</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-zinc-900 font-medium">
            {tournaments.map((t) => (
              <tr key={t.id} className="hover:bg-zinc-900/40 transition-colors group align-middle">
                {/* Tournament Name & Banner */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {t.bannerUrl ? (
                      <div
                        onClick={() => setPreviewImage({ url: t.bannerUrl!, name: t.name })}
                        className="w-16 h-10 rounded-lg overflow-hidden border border-zinc-800 shrink-0 bg-zinc-900 relative cursor-pointer hover:border-orange-500 transition shadow-2xs"
                        title="Bấm để xem ảnh banner"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover" />
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-orange-500/10 border border-orange-500/20 flex items-center justify-center text-orange-400 text-xs font-bold shrink-0">
                        {t.name.slice(0, 2).toUpperCase()}
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-white text-sm leading-snug group-hover:text-orange-400 transition">{t.name}</p>
                      {t.maxParticipants && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 border border-amber-500/20 whitespace-nowrap">
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
                <td className="px-5 py-3.5 text-xs text-zinc-400 whitespace-nowrap font-mono font-medium">
                  {formatDateRange(t.startDate, t.endDate)}
                </td>

                {/* Location */}
                <td className="px-5 py-3.5 text-xs text-zinc-300 max-w-[180px]">
                  <p className="line-clamp-1 truncate font-medium">{t.location ?? '—'}</p>
                </td>

                {/* Events */}
                <td className="px-5 py-3.5">
                  {t.events && t.events.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {t.events.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-300 border border-zinc-800 whitespace-nowrap"
                        >
                          {e.puzzleTypeName || e.puzzleTypeCode}
                        </span>
                      ))}
                      {t.events.length > 3 && (
                        <span className="rounded-md bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-zinc-500 border border-zinc-800">
                          +{t.events.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-zinc-500 font-normal italic">
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
                            className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white transition shadow-sm"
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
                            className="inline-flex items-center text-xs font-semibold px-3 py-1.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 hover:bg-emerald-500/20 transition"
                            title="Sẵn sàng vào Điều Hành Live"
                          >
                            Điều Hành Live
                          </Link>
                        );
                      }

                      return (
                        <Link
                          href={`/managertournaments/${t.id}/live`}
                          className="inline-flex items-center text-xs font-semibold px-2.5 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-zinc-300 hover:text-white hover:bg-zinc-800 transition"
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
                            className="text-xs font-semibold px-3 py-1.5 rounded-lg border border-amber-500/30 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition cursor-pointer"
                            title="Khóa cổng đăng ký thủ công"
                          >
                            Khóa Đăng Ký
                          </button>
                        );
                      }

                      return (
                        <span
                          className="inline-flex items-center text-[11px] font-medium text-zinc-500 bg-zinc-900 border border-zinc-800 px-2.5 py-1.5 rounded-lg cursor-default"
                          title="Cổng đăng ký đã đóng"
                        >
                          Đã Khóa
                        </span>
                      );
                    })()}

                    {/* Details */}
                    <Link
                      href={`/managertournaments/${t.id}`}
                      className="inline-flex items-center text-xs font-bold px-3 py-1.5 rounded-lg bg-zinc-900 border border-zinc-800 text-white hover:bg-zinc-800 transition cursor-pointer"
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
          <div className="py-16 text-center text-zinc-500 text-sm">Chưa có giải đấu nào được tạo.</div>
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
