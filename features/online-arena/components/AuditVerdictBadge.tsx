import React from 'react';
import { ShieldAlert, ShieldCheck, AlertCircle, Clock, FileText } from 'lucide-react';

interface AuditVerdictBadgeProps {
  reportStatus?: string;
  verdictCode?: string;
  adminNote?: string;
}

export function AuditVerdictBadge({ reportStatus, verdictCode, adminNote }: AuditVerdictBadgeProps) {
  // ONLY show if there is an actual fraud report. Regular DRAW matches have no reportStatus.
  if (!reportStatus && !verdictCode) return null;

  if (verdictCode === 'GUILTY') {
    return (
      <div className="bg-rose-500/10 border border-rose-500/30 rounded-2xl p-4 space-y-2 text-xs animate-fade-in shadow-lg shadow-rose-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-400 font-extrabold uppercase tracking-wider text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-500" />
            <span>KẾT QUẢ KIỂM DUYỆT: XÁC NHẬN GIAN LẬN</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-500/20 text-rose-400 border border-rose-500/40">
            ĐÃ XỬ LÝ
          </span>
        </div>
        <p className="text-zinc-300 text-xs leading-relaxed font-medium">
          Trọng tài &amp; Ban Quản Trị đã xác nhận có hành vi vi phạm gian lận. Kết quả trận đấu và điểm ELO đã được điều chỉnh theo điều lệ.
        </p>
        {adminNote && (
          <div className="pt-2 border-t border-rose-500/20 flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-rose-400 shrink-0 mt-0.5" />
            <span className="text-rose-200 font-medium">
              <strong className="text-rose-400">Ghi chú Trọng tài:</strong> &quot;{adminNote}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  if (verdictCode === 'INNOCENT') {
    return (
      <div className="bg-emerald-500/10 border border-emerald-500/30 rounded-2xl p-4 space-y-2 text-xs animate-fade-in shadow-lg shadow-emerald-500/5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-400 font-extrabold uppercase tracking-wider text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-500" />
            <span>KẾT QUẢ KIỂM DUYỆT: KHÔNG VI PHẠM</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-500/20 text-emerald-400 border border-emerald-500/40">
            ĐÃ XỬ LÝ
          </span>
        </div>
        <p className="text-zinc-300 text-xs leading-relaxed font-medium">
          Ban Trọng Tài đã kiểm tra video replay: Trận đấu hợp lệ, không phát hiện vi phạm. Kết quả thi đấu giữ nguyên.
        </p>
        {adminNote && (
          <div className="pt-2 border-t border-emerald-500/20 flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-emerald-400 shrink-0 mt-0.5" />
            <span className="text-emerald-200 font-medium">
              <strong className="text-emerald-400">Ghi chú Trọng tài:</strong> &quot;{adminNote}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  if (verdictCode === 'INCONCLUSIVE') {
    return (
      <div className="bg-zinc-900 border border-zinc-800 rounded-2xl p-4 space-y-2 text-xs animate-fade-in shadow-xl">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-400 font-extrabold uppercase tracking-wider text-xs">
            <AlertCircle className="h-4 w-4 text-amber-500" />
            <span>KẾT QUẢ KIỂM DUYỆT: HÒA (KHÔNG ĐỦ BẰNG CHỨNG)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-zinc-800 text-amber-400 border border-zinc-700">
            ĐÃ XỬ LÝ
          </span>
        </div>
        <p className="text-zinc-300 text-xs leading-relaxed font-medium">
          Ban Trọng Tài đã hoàn tất kiểm tra: Bằng chứng không đủ để xác định vi phạm. Kết quả chính thức là <strong>HÒA (DRAW)</strong>.
        </p>
        {adminNote && (
          <div className="pt-2 border-t border-zinc-800 flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-amber-400 shrink-0 mt-0.5" />
            <span className="text-zinc-300 font-medium">
              <strong className="text-amber-400">Ghi chú Trọng tài:</strong> &quot;{adminNote}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  // PENDING — report submitted but not yet reviewed
  if (reportStatus === 'PENDING') {
    return (
      <div className="bg-amber-500/10 border border-amber-500/30 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-pulse">
        <div className="flex items-center gap-2.5 text-amber-300 min-w-0">
          <Clock className="h-4 w-4 text-amber-400 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold uppercase tracking-wider text-xs text-amber-400 block">
              ĐƠN KHIẾU NẠI ĐANG ĐƯỢC XỬ LÝ
            </span>
            <p className="text-[11px] text-amber-200/80 truncate mt-0.5">
              Ban Trọng tài đang kiểm duyệt video replay. Kết quả sẽ được cập nhật tại đây.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-500/20 text-amber-300 border border-amber-500/40 shrink-0">
          ĐANG XỬ LÝ
        </span>
      </div>
    );
  }

  return null;
}
