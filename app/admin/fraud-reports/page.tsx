'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import {
  ShieldAlert,
  RefreshCw,
  Clock,
  ChevronRight,
  CheckCircle2,
  AlertTriangle,
  Eye,
  User,
  LayoutDashboard,
} from 'lucide-react';
import { getPendingFraudReports, FraudReportDto } from '@/features/online-arena/api/onlineArenaApi';

export default function AdminFraudReportsQueuePage() {
  const [reports, setReports] = useState<FraudReportDto[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getPendingFraudReports();
      setReports(data || []);
    } catch (err: any) {
      console.error('Failed to fetch pending fraud reports:', err);
      setError(err?.message || 'Không thể tải danh sách báo cáo gian lận.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  return (
    <div className="w-full max-w-full p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen transition-all duration-300 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs w-full">
        <div className="space-y-1 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center gap-1.5 font-mono">
              <ShieldAlert className="h-3.5 w-3.5" /> ADMIN ANTI-CHEAT DASHBOARD
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 truncate">
            Danh Sách Báo Cáo Gian Lận Trận Đấu
          </h1>
          <p className="text-xs text-slate-500">
            Kiểm duyệt video replay, nhật ký AI và đưa ra phán quyết xử phạt người chơi gian lận.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <Link
            href="/managertournaments"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-600" />
            <span>Về Dashboard</span>
          </Link>
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Tải Lại</span>
          </button>
        </div>
      </div>

      {/* Main Queue Section */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-2xs w-full">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest font-mono">Đang tải báo cáo chờ xử lý...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-center w-full">
          <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
          <p className="text-xs font-semibold text-rose-900">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-2xs cursor-pointer"
          >
            Thử Lại
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-200 rounded-2xl shadow-2xs w-full">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Không có báo cáo nào đang chờ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hiện tại tất cả các báo cáo gian lận đã được xử lý hoàn tất hoặc chưa có khiếu nại mới.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs w-full">
          {/* Desktop Responsive Table View */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 uppercase text-[10px] font-extrabold tracking-wider text-slate-500 font-mono whitespace-nowrap">
                  <th className="px-5 py-4">Trận Đấu (Match ID)</th>
                  <th className="px-5 py-4">Người Báo Cáo</th>
                  <th className="px-5 py-4">Người Bị Báo Cáo</th>
                  <th className="px-5 py-4">Loại Gian Lận</th>
                  <th className="px-5 py-4">Timestamp</th>
                  <th className="px-5 py-4">Thời Gian Gửi</th>
                  <th className="px-5 py-4">Trạng Thái</th>
                  <th className="px-5 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                    <td className="px-5 py-4 font-mono font-bold text-slate-900">
                      {report.matchId.slice(0, 8)}...
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-emerald-600 shrink-0" />
                        <span className="font-mono">{report.reporterUserId.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-700">
                      <div className="flex items-center gap-1.5">
                        <User className="h-3.5 w-3.5 text-rose-600 shrink-0" />
                        <span className="font-mono">{report.reportedUserId.slice(0, 8)}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 font-bold text-[10px] uppercase text-amber-700 font-mono inline-block">
                        {report.fraudType || report.reasonCode || 'OTHER'}
                      </span>
                    </td>
                    <td className="px-5 py-4 font-mono font-bold text-indigo-600">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>{report.timestampText || '00:00'}</span>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-slate-500 font-mono text-[11px]">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="px-5 py-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider font-mono inline-block">
                        {report.statusCode}
                      </span>
                    </td>
                    <td className="px-5 py-4 text-right">
                      <Link
                        href={`/admin/fraud-reports/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-2xs cursor-pointer"
                      >
                        <Eye className="h-3.5 w-3.5" />
                        <span>Kiểm Duyệt</span>
                        <ChevronRight className="h-3.5 w-3.5" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View for Small Screens */}
          <div className="md:hidden divide-y divide-slate-100">
            {reports.map((report) => (
              <div key={report.id} className="p-4 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="font-mono font-extrabold text-xs text-slate-900">
                    Match: {report.matchId.slice(0, 8)}...
                  </span>
                  <span className="px-2 py-0.5 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[9px] uppercase font-mono">
                    {report.statusCode}
                  </span>
                </div>

                <div className="grid grid-cols-2 gap-2 text-xs font-mono text-slate-600">
                  <div>
                    <span className="text-[10px] text-slate-400 block">NGƯỜI BÁO CÁO</span>
                    <span className="font-bold text-slate-900">{report.reporterUserId.slice(0, 8)}</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-slate-400 block">NGƯỜI BỊ BÁO CÁO</span>
                    <span className="font-bold text-rose-600">{report.reportedUserId.slice(0, 8)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-between text-xs pt-1 border-t border-slate-100">
                  <span className="px-2 py-0.5 rounded bg-amber-50 border border-amber-200 text-amber-700 font-mono text-[10px] font-bold">
                    {report.fraudType || 'OTHER'} ({report.timestampText || '00:00'})
                  </span>
                  <Link
                    href={`/admin/fraud-reports/${report.id}`}
                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white font-bold text-xs uppercase"
                  >
                    <Eye className="h-3 w-3" />
                    <span>Kiểm Duyệt</span>
                  </Link>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
