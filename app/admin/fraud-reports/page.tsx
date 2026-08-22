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
  Filter,
  CheckCircle,
  Clock3,
  Edit3,
  Lock,
  XCircle,
  HelpCircle,
} from 'lucide-react';
import { getFraudReports, FraudReportDto } from '@/features/online-arena/api/onlineArenaApi';

type TabType = 'ALL' | 'PENDING' | 'RESOLVED';

export default function AdminFraudReportsQueuePage() {
  const [reports, setReports] = useState<FraudReportDto[]>([]);
  const [activeTab, setActiveTab] = useState<TabType>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const fetchReports = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFraudReports();
      setReports(data || []);
    } catch (err: any) {
      console.error('Failed to fetch fraud reports:', err);
      setError(err?.message || 'Không thể tải danh sách báo cáo gian lận.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const pendingCount = reports.filter(
    (r) => r.statusCode === 'OPEN' || r.statusCode === 'REVIEWING' || r.statusCode === 'PENDING'
  ).length;

  const resolvedCount = reports.filter((r) => r.statusCode === 'RESOLVED').length;

  const filteredReports = reports.filter((r) => {
    const isPending = r.statusCode === 'OPEN' || r.statusCode === 'REVIEWING' || r.statusCode === 'PENDING';
    const isResolved = r.statusCode === 'RESOLVED';

    if (activeTab === 'PENDING') return isPending;
    if (activeTab === 'RESOLVED') return isResolved;
    return true; // 'ALL'
  });

  const getVerdictBadge = (report: FraudReportDto) => {
    const isPending = report.statusCode === 'OPEN' || report.statusCode === 'REVIEWING' || report.statusCode === 'PENDING';
    if (isPending) {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
          <Clock3 className="h-3.5 w-3.5" />
          Chờ Xử Lý
        </span>
      );
    }

    const verdict = report.verdictCode || report.decision;
    if (verdict === 'GUILTY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
          <XCircle className="h-3.5 w-3.5" />
          Đã Xử Lý: GUILTY (Gian Lận)
        </span>
      );
    }

    if (verdict === 'INNOCENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Đã Xử Lý: INNOCENT (Vô Tội)
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
        <HelpCircle className="h-3.5 w-3.5" />
        Đã Xử Lý: INCONCLUSIVE
      </span>
    );
  };

  const get24hStatusBadge = (report: FraudReportDto) => {
    if (report.statusCode !== 'RESOLVED') return null;

    if (report.canReReview !== false) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium text-xs">
          <Edit3 className="h-3 w-3" />
          Có thể sửa ({report.hoursLeftToReReview != null ? `${report.hoursLeftToReReview}h` : '<24h'})
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-slate-500 font-medium text-xs">
        <Lock className="h-3 w-3" />
        Đã khóa ({'>'}24h)
      </span>
    );
  };

  return (
    <div className="w-full max-w-full p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen transition-all duration-300 font-sans">
      {/* Header Banner */}
      <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs w-full">
        <div className="space-y-1.5 min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-xs font-bold bg-rose-50 text-rose-600 border border-rose-200 rounded-full flex items-center gap-1.5">
              <ShieldAlert className="h-3.5 w-3.5" /> ADMIN ANTI-CHEAT DASHBOARD
            </span>
          </div>
          <h1 className="text-xl sm:text-3xl font-extrabold tracking-tight text-slate-900 truncate">
            Danh Sách Báo Cáo Gian Lận Trận Đấu
          </h1>
          <p className="text-sm text-slate-500">
            Quản lý báo cáo gian lận, xem video replay, nhật ký AI và đưa ra/điều chỉnh phán quyết trong vòng 24 giờ.
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

      {/* Filter Tabs */}
      <div className="flex flex-wrap items-center gap-2 bg-white p-2 rounded-2xl border border-slate-200 shadow-2xs">
        <button
          onClick={() => setActiveTab('ALL')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'ALL'
              ? 'bg-indigo-600 text-white shadow-2xs'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Filter className="h-3.5 w-3.5" />
          <span>Tất Cả ({reports.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('PENDING')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PENDING'
              ? 'bg-amber-600 text-white shadow-2xs'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Clock3 className="h-3.5 w-3.5" />
          <span>Chờ Xử Lý ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('RESOLVED')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'RESOLVED'
              ? 'bg-emerald-600 text-white shadow-2xs'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          <span>Đã Xử Lý ({resolvedCount})</span>
        </button>
      </div>

      {/* Main Queue Section */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-2xs w-full">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">
            Đang tải danh sách báo cáo...
          </p>
        </div>
      ) : error ? (
        <div className="p-6 bg-rose-50 border border-rose-200 rounded-2xl space-y-3 text-center w-full">
          <AlertTriangle className="h-8 w-8 text-rose-600 mx-auto" />
          <p className="text-sm font-semibold text-rose-900">{error}</p>
          <button
            onClick={fetchReports}
            className="px-4 py-2 bg-rose-600 text-white font-bold text-xs rounded-xl shadow-2xs cursor-pointer"
          >
            Thử Lại
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-200 rounded-2xl shadow-2xs w-full">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === 'PENDING'
              ? 'Không có báo cáo nào đang chờ xử lý'
              : activeTab === 'RESOLVED'
              ? 'Chưa có báo cáo nào đã xử lý'
              : 'Không có báo cáo nào'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? 'Tất cả các báo cáo gian lận đã được xử lý hoàn tất hoặc chưa có khiếu nại mới.'
              : 'Danh sách báo cáo trống.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs w-full">
          {/* Desktop Responsive Table View */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 whitespace-nowrap">
                  <th className="px-5 py-4">Trận Đấu (Match ID)</th>
                  <th className="px-5 py-4">Người Báo Cáo</th>
                  <th className="px-5 py-4">Người Bị Báo Cáo</th>
                  <th className="px-5 py-4">Loại Gian Lận</th>
                  <th className="px-5 py-4">Thời Điểm</th>
                  <th className="px-5 py-4">Thời Gian Gửi</th>
                  <th className="px-5 py-4">Trạng Thái &amp; Phán Quyết</th>
                  <th className="px-5 py-4 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredReports.map((report) => {
                  const isPending =
                    report.statusCode === 'OPEN' ||
                    report.statusCode === 'REVIEWING' ||
                    report.statusCode === 'PENDING';
                  const canEdit = report.statusCode === 'RESOLVED' && report.canReReview !== false;

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {report.matchId.slice(0, 8)}...
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-medium">{report.reporterUserId.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-rose-600 shrink-0" />
                          <span className="font-medium text-slate-900">{report.reportedUserId.slice(0, 8)}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-xs text-amber-700 inline-block">
                          {report.fraudType || report.reasonCode || 'Khác'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-indigo-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{report.timestampText || '00:00'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {new Date(report.createdAt).toLocaleString('vi-VN')}
                      </td>
                      <td className="px-5 py-4">
                        <div className="space-y-1.5">
                          <div>{getVerdictBadge(report)}</div>
                          <div>{get24hStatusBadge(report)}</div>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/fraud-reports/${report.id}`}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-2xs cursor-pointer ${
                            isPending
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : canEdit
                              ? 'bg-amber-600 hover:bg-amber-700'
                              : 'bg-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Kiểm Duyệt</span>
                            </>
                          ) : canEdit ? (
                            <>
                              <Edit3 className="h-3.5 w-3.5" />
                              <span>Xem / Sửa</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Chi Tiết</span>
                            </>
                          )}
                          <ChevronRight className="h-3.5 w-3.5" />
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Cards View for Small Screens */}
          <div className="md:hidden divide-y divide-slate-100">
            {filteredReports.map((report) => {
              const isPending =
                report.statusCode === 'OPEN' ||
                report.statusCode === 'REVIEWING' ||
                report.statusCode === 'PENDING';
              const canEdit = report.statusCode === 'RESOLVED' && report.canReReview !== false;

              return (
                <div key={report.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      Trận: {report.matchId.slice(0, 8)}...
                    </span>
                    <div>{getVerdictBadge(report)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Người Báo Cáo</span>
                      <span className="font-semibold text-slate-900">{report.reporterUserId.slice(0, 8)}</span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Người Bị Báo Cáo</span>
                      <span className="font-semibold text-rose-600">{report.reportedUserId.slice(0, 8)}</span>
                    </div>
                  </div>

                  {get24hStatusBadge(report) && <div>{get24hStatusBadge(report)}</div>}

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold">
                      {report.fraudType || 'Khác'} ({report.timestampText || '00:00'})
                    </span>
                    <Link
                      href={`/admin/fraud-reports/${report.id}`}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs ${
                        isPending
                          ? 'bg-indigo-600'
                          : canEdit
                          ? 'bg-amber-600'
                          : 'bg-slate-700'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Kiểm Duyệt</span>
                        </>
                      ) : canEdit ? (
                        <>
                          <Edit3 className="h-3.5 w-3.5" />
                          <span>Xem / Sửa</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Chi Tiết</span>
                        </>
                      )}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
