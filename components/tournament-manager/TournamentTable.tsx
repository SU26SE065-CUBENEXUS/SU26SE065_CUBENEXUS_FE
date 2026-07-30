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
        <p className="text-xs font-bold text-muted-foreground uppercase tracking-wider">
          {tournaments.length} Tournament{tournaments.length !== 1 ? 's' : ''} Found
        </p>
      </div>

      {/* Clean Compact Table */}
      <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
        <table className="w-full text-sm text-left border-collapse">
          <thead>
            <tr className="border-b border-border bg-muted/40">
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Giải Đấu</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Trạng Thái</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Thời Gian</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Địa Điểm</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground">Hạng Mục Thi Đấu</th>
              <th className="px-5 py-3.5 text-xs font-bold uppercase tracking-wider text-muted-foreground text-right">Quản Lý Giải</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {tournaments.map((t) => (
              <tr key={t.id} className="hover:bg-muted/30 transition-colors group align-middle">
                {/* Tournament Name & Banner */}
                <td className="px-5 py-3.5">
                  <div className="flex items-center gap-3">
                    {t.bannerUrl ? (
                      <div
                        onClick={() => setPreviewImage({ url: t.bannerUrl!, name: t.name })}
                        className="w-16 h-10 rounded-lg overflow-hidden border border-border shrink-0 bg-black/40 shadow-sm relative cursor-pointer group/img hover:border-primary transition"
                        title="Bấm để xem ảnh phóng to"
                      >
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img src={t.bannerUrl} alt={t.name} className="w-full h-full object-cover group-hover/img:scale-110 transition-transform duration-300" />
                        <div className="absolute inset-0 bg-black/50 opacity-0 group-hover/img:opacity-100 transition-opacity flex items-center justify-center text-white text-[9px] font-bold">
                          <ZoomIn className="h-3 w-3" />
                        </div>
                      </div>
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-primary/10 border border-primary/20 flex items-center justify-center text-primary text-base font-black shrink-0">
                        🏆
                      </div>
                    )}
                    <div className="min-w-0">
                      <p className="font-bold text-foreground text-sm leading-snug group-hover:text-primary transition">{t.name}</p>
                      {t.maxParticipants && (
                        <span className="inline-block mt-0.5 text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-500/10 text-amber-500 border border-amber-500/20 whitespace-nowrap">
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
                <td className="px-5 py-3.5 text-xs text-muted-foreground whitespace-nowrap">
                  {formatDateRange(t.startDate, t.endDate)}
                </td>

                {/* Location */}
                <td className="px-5 py-3.5 text-xs text-muted-foreground max-w-[180px]">
                  <p className="line-clamp-1 truncate">{t.location ?? '—'}</p>
                </td>

                {/* Events */}
                <td className="px-5 py-3.5">
                  {t.events && t.events.length > 0 ? (
                    <div className="flex flex-wrap gap-1">
                      {t.events.slice(0, 3).map((e) => (
                        <span
                          key={e.id}
                          className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border whitespace-nowrap"
                        >
                          {e.puzzleTypeName || e.puzzleTypeCode}
                        </span>
                      ))}
                      {t.events.length > 3 && (
                        <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                          +{t.events.length - 3}
                        </span>
                      )}
                    </div>
                  ) : (
                    <span className="text-[11px] text-muted-foreground/70 italic bg-muted/20 px-2 py-1 rounded-md border border-border/40">
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
                            className="inline-flex items-center gap-1.5 text-xs font-black px-3 py-1.5 rounded-lg bg-gradient-to-r from-emerald-600 to-teal-600 text-white hover:from-emerald-500 hover:to-teal-500 transition shadow-lg shadow-emerald-500/20 border border-emerald-400/30 animate-pulse"
                            title="Giải đấu ĐANG DIỄN RA! Bấm để mở màn hình Điều Hành Live"
                          >
                            <Radio className="h-3.5 w-3.5 text-emerald-200" />
                            <span className="tracking-wide">🔴 Điều Hành Live</span>
                          </Link>
                        );
                      }

                      if (isRegClosed) {
                        return (
                          <Link
                            href={`/managertournaments/${t.id}/live`}
                            className="inline-flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-lg bg-emerald-950/40 border border-emerald-800/50 text-emerald-400 hover:bg-emerald-900/60 transition"
                            title="Đã khóa đăng ký. Sẵn sàng vào Điều Hành Live"
                          >
                            <Radio className="h-3.5 w-3.5" />
                            Điều Hành Live
                          </Link>
                        );
                      }

                      return (
                        <Link
                          href={`/managertournaments/${t.id}/live`}
                          className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1.5 rounded-lg bg-muted/40 border border-border/80 text-muted-foreground hover:text-foreground hover:bg-muted transition"
                          title="Mở màn hình điều hành giải live"
                        >
                          <Radio className="h-3.5 w-3.5 opacity-60" />
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
                            className="text-xs font-bold px-3 py-1.5 rounded-lg border border-amber-500/40 bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 transition shadow-sm cursor-pointer"
                            title="Khóa cổng đăng ký thủ công cho giải đấu này"
                          >
                            Khóa Đăng Ký
                          </button>
                        );
                      }

                      return (
                        <span
                          className="inline-flex items-center gap-1 text-[11px] font-medium text-muted-foreground/60 bg-muted/20 border border-border/40 px-2.5 py-1.5 rounded-lg opacity-70 cursor-default"
                          title="Cổng đăng ký đã đóng hoặc không khả dụng"
                        >
                          <Lock className="h-3 w-3 opacity-40" />
                          Đã Khóa
                        </span>
                      );
                    })()}

                    {/* Details */}
                    <Link
                      href={`/managertournaments/${t.id}`}
                      className="inline-flex items-center gap-1 text-xs font-bold px-3 py-1.5 rounded-lg bg-card border border-border text-foreground hover:bg-muted/50 transition shadow-sm"
                      title="Vào trang quản lý chi tiết giải đấu"
                    >
                      <Settings className="h-3.5 w-3.5" />
                      Chi Tiết
                    </Link>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {tournaments.length === 0 && (
          <div className="py-16 text-center text-muted-foreground text-sm">Chưa có giải đấu nào được tạo.</div>
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
