'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { ShieldAlert, RefreshCw, Clock, ChevronRight, CheckCircle2, AlertTriangle, Eye, User, FileText } from 'lucide-react';
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
    <div className="min-h-screen bg-black text-white p-6 sm:p-10 space-y-8 max-w-7xl mx-auto">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-6 border-b border-zinc-800">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> ADMIN ANTI-CHEAT DASHBOARD
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black uppercase tracking-wider text-white">
            Danh Sách Báo Cáo Gian Lận Trận Đấu
          </h1>
          <p className="text-xs text-zinc-400">
            Kiểm duyệt video replay, nhật ký AI và đưa ra phán quyết xử phạt người chơi gian lận.
          </p>
        </div>

        <button
          onClick={fetchReports}
          disabled={isLoading}
          className="px-4 py-2.5 rounded-2xl bg-zinc-900 hover:bg-zinc-800 border border-zinc-700 text-xs font-bold text-zinc-200 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50"
        >
          <RefreshCw className={`h-4 w-4 text-orange-400 ${isLoading ? 'animate-spin' : ''}`} />
          <span>Tải Lại Danh Sách</span>
        </button>
      </div>

      {/* Main Queue Section */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4 bg-zinc-950 border border-zinc-800 rounded-3xl">
          <RefreshCw className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
          <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Đang tải báo cáo chờ xử lý...</p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-500/10 border border-rose-500/20 rounded-3xl space-y-3 text-center">
          <AlertTriangle className="h-8 w-8 text-rose-500 mx-auto" />
          <p className="text-xs font-semibold text-rose-300">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-rose-500 text-white font-bold text-xs rounded-xl uppercase tracking-wider"
          >
            Thử Lại
          </button>
        </div>
      ) : reports.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-zinc-950 border border-zinc-800 rounded-3xl">
          <CheckCircle2 className="h-10 w-10 text-emerald-400 mx-auto" />
          <h3 className="text-sm font-black uppercase tracking-wider text-zinc-200">Không có báo cáo nào đang chờ</h3>
          <p className="text-xs text-zinc-500 max-w-sm mx-auto">
            Hiện tại tất cả các báo cáo gian lận đã được xử lý hoàn tất hoặc chưa có khiếu nại mới.
          </p>
        </div>
      ) : (
        <div className="bg-zinc-950 border border-zinc-800 rounded-3xl overflow-hidden shadow-2xl">
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-zinc-800 bg-zinc-900/60 uppercase text-[10px] font-black tracking-wider text-zinc-400">
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
              <tbody className="divide-y divide-zinc-900 font-medium">
                {reports.map((report) => (
                  <tr key={report.id} className="hover:bg-zinc-900/40 transition-colors">
                    <td className="p-4 font-mono font-bold text-white">
                      {report.matchId.slice(0, 8)}...
                    </td>
                    <td className="p-4 text-zinc-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-emerald-400" />
                      <span className="font-mono">{report.reporterUserId.slice(0, 8)}</span>
                    </td>
                    <td className="p-4 text-zinc-300 flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-rose-400" />
                      <span className="font-mono">{report.reportedUserId.slice(0, 8)}</span>
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-lg bg-orange-500/10 border border-orange-500/20 font-black text-[10px] uppercase text-orange-400">
                        {report.fraudType || report.reasonCode || 'OTHER'}
                      </span>
                    </td>
                    <td className="p-4 font-mono font-bold text-amber-400 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-amber-400" />
                      {report.timestampText || '00:00'}
                    </td>
                    <td className="p-4 text-zinc-400 font-mono text-[11px]">
                      {new Date(report.createdAt).toLocaleString()}
                    </td>
                    <td className="p-4">
                      <span className="px-2.5 py-1 rounded-full bg-rose-500/20 border border-rose-500/30 text-rose-400 font-black text-[10px] uppercase tracking-wider animate-pulse">
                        {report.statusCode}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <Link
                        href={`/admin/fraud-reports/${report.id}`}
                        className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider transition-all shadow-md shadow-orange-500/20"
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
