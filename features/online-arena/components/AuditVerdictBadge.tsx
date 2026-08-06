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
      <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 space-y-2 text-xs animate-fade-in shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-rose-700 font-extrabold uppercase tracking-wider text-xs">
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>KẾT QUẢ KIỂM DUYỆT: XÁC NHẬN GIAN LẬN</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
            ĐÃ XỬ LÝ
          </span>
        </div>
        <p className="text-rose-950 text-xs leading-relaxed font-semibold">
          Trọng tài &amp; Ban Quản Trị đã xác nhận có hành vi vi phạm gian lận. Kết quả trận đấu và điểm ELO đã được điều chỉnh theo điều lệ.
        </p>
        {adminNote && (
          <div className="pt-2 border-t border-rose-200 flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
            <span className="text-rose-900 font-medium">
              <strong className="text-rose-700">Ghi chú Trọng tài:</strong> &quot;{adminNote}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  if (verdictCode === 'INNOCENT') {
    return (
      <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 space-y-2 text-xs animate-fade-in shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-emerald-700 font-extrabold uppercase tracking-wider text-xs">
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
            <span>KẾT QUẢ KIỂM DUYỆT: KHÔNG VI PHẠM</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300">
            ĐÃ XỬ LÝ
          </span>
        </div>
        <p className="text-emerald-950 text-xs leading-relaxed font-semibold">
          Ban Trọng Tài đã kiểm tra video replay: Trận đấu hợp lệ, không phát hiện vi phạm. Kết quả thi đấu giữ nguyên.
        </p>
        {adminNote && (
          <div className="pt-2 border-t border-emerald-200 flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
            <span className="text-emerald-900 font-medium">
              <strong className="text-emerald-700">Ghi chú Trọng tài:</strong> &quot;{adminNote}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  if (verdictCode === 'INCONCLUSIVE') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-4 space-y-2 text-xs animate-fade-in shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-800 font-extrabold uppercase tracking-wider text-xs">
            <AlertCircle className="h-4 w-4 text-amber-600" />
            <span>KẾT QUẢ KIỂM DUYỆT: HÒA (KHÔNG ĐỦ BẰNG CHỨNG)</span>
          </div>
          <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
            ĐÃ XỬ LÝ
          </span>
        </div>
        <p className="text-amber-950 text-xs leading-relaxed font-semibold">
          Ban Trọng Tài đã hoàn tất kiểm tra: Bằng chứng không đủ để xác định vi phạm. Kết quả chính thức là <strong>HÒA (DRAW)</strong>.
        </p>
        {adminNote && (
          <div className="pt-2 border-t border-amber-200 flex items-start gap-2 text-xs">
            <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
            <span className="text-amber-900 font-medium">
              <strong className="text-amber-700">Ghi chú Trọng tài:</strong> &quot;{adminNote}&quot;
            </span>
          </div>
        )}
      </div>
    );
  }

  // PENDING — report submitted but not yet reviewed
  if (reportStatus === 'PENDING') {
    return (
      <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-pulse">
        <div className="flex items-center gap-2.5 text-amber-900 min-w-0">
          <Clock className="h-4 w-4 text-amber-600 shrink-0" />
          <div className="min-w-0">
            <span className="font-bold uppercase tracking-wider text-xs text-amber-800 block">
              ĐƠN KHIẾU NẠI ĐANG ĐƯỢC XỬ LÝ
            </span>
            <p className="text-[11px] text-amber-900/80 truncate mt-0.5">
              Ban Trọng tài đang kiểm duyệt video replay. Kết quả sẽ được cập nhật tại đây.
            </p>
          </div>
        </div>
        <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
          ĐANG XỬ LÝ
        </span>
      </div>
    );
  }

  return null;
}
