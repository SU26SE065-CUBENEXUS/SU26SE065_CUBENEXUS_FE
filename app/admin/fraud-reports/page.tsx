'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Clock, ChevronRight, CheckCircle2, AlertTriangle, Eye, User, FileText, LayoutDashboard } from 'lucide-react';
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
    <div className="min-h-screen bg-slate-50 text-slate-900 p-6 sm:p-10 space-y-6 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> ADMIN ANTI-CHEAT DASHBOARD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900">
            Danh Sách Báo Cáo Gian Lận Trận Đấu
          </h1>
          <p className="text-xs text-slate-500">
            Kiểm duyệt video replay, nhật ký AI và đưa ra phán quyết xử phạt người chơi gian lận.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0">
          <Link
            href="/admin/elo-management"
            className="px-4 py-2.5 rounded-xl bg-orange-50 hover:bg-orange-100 border border-orange-200 text-xs font-bold text-orange-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <ShieldAlert className="h-4 w-4 text-orange-600" />
            <span>Quản Lý ELO</span>
          </Link>
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
        <div className="py-20 text-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang tải báo cáo chờ xử lý...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-center">
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
        <div className="py-20 text-center space-y-3 bg-white border border-slate-200 rounded-2xl shadow-2xs">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-sm font-bold uppercase tracking-wider text-slate-800">Không có báo cáo nào đang chờ</h3>
          <p className="text-xs text-slate-500 max-w-sm mx-auto">
            Hiện tại tất cả các báo cáo gian lận đã được xử lý hoàn tất hoặc chưa có khiếu nại mới.
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 uppercase text-[10px] font-extrabold tracking-wider text-slate-500">
                  <th className="p-4">Trận Đấu (Match ID)</th>
                  <th className="p-4">Người Báo Cáo</th>
                  <th className="p-4">Người Bị Báo Cáo</th>
                  <th className="p-4">Loại Gian Lận</th>
                  <th className="p-4">Timestamp</th>
                  <th className="p-4">Thời Gian Gửi</th>
                  <th className="p-4">Trạng Thái</th>
                  <th className="p-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="p-4 font-mono font-bold text-slate-900">
                      {report.matchId.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-emerald-600" />
                      <span className="font-mono">{report.reporterUserId.slice(0, 8)}</span>
                    </td>
                    <td className="p-4 text-slate-700 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-rose-600" />
                      <span className="font-mono">{report.reportedUserId.slice(0, 8)}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-md bg-amber-50 border border-amber-200 font-bold text-[10px] uppercase text-amber-700">
                        {report.fraudType || report.reasonCode || 'OTHER'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-indigo-600 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-indigo-600" />
                      {report.timestampText || '00:00'}
                    </td>
                    <td className="p-4 text-slate-500 font-mono text-[11px]">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-[10px] uppercase tracking-wider">
                        {report.statusCode}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/fraud-reports/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs uppercase tracking-wider transition-all shadow-2xs"
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
        </div>
      )}
    </div>
  );
}
