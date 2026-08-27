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
  XCircle,
  HelpCircle,
  Flame,
} from 'lucide-react';
import { getFraudReports, FraudReportDto } from '@/features/online-arena/api/onlineArenaApi';

type TabType = 'ALL' | 'PENDING' | 'PRIORITY' | 'RESOLVED';

function formatCompetitorLabel(userCode?: string | null, displayName?: string | null, fallbackUserId?: string) {
  const code = userCode?.trim();
  if (code) return code;
  const name = displayName?.trim();
  if (name) return name;
  return fallbackUserId ? `${fallbackUserId.slice(0, 8)}…` : 'Unknown';
}

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
      setError(err?.message || 'Unable to load fraud reports.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const isReportPending = (r: FraudReportDto) =>
    r.statusCode === 'OPEN' || r.statusCode === 'REVIEWING' || r.statusCode === 'PENDING';

  const isReportOverdue = (r: FraudReportDto) => {
    if (!isReportPending(r)) return false;
    const createdTime = new Date(r.createdAt).getTime();
    const now = Date.now();
    return now - createdTime >= 24 * 3600 * 1000; // >= 24 hours
  };

  const pendingCount = reports.filter(isReportPending).length;
  const priorityCount = reports.filter(isReportOverdue).length;
  const resolvedCount = reports.filter((r) => r.statusCode === 'RESOLVED').length;

  const filteredReports = reports
    .filter((r) => {
      const isPending = isReportPending(r);
      const isResolved = r.statusCode === 'RESOLVED';

      if (activeTab === 'PENDING') return isPending;
      if (activeTab === 'PRIORITY') return isPending && (priorityCount > 0 ? isReportOverdue(r) : true);
      if (activeTab === 'RESOLVED') return isResolved;
      return true; // 'ALL'
    })
    .sort((a, b) => {
      // Priority tab sorts oldest first so long-pending items get handled first
      if (activeTab === 'PRIORITY') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      // Other tabs sort newest first
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const getVerdictBadge = (report: FraudReportDto) => {
    const isPending = isReportPending(report);
    const isOverdue = isReportOverdue(report);

    if (isPending) {
      if (isOverdue) {
        return (
          <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-extrabold text-xs animate-pulse">
            <Flame className="h-3.5 w-3.5 text-rose-600" />
            Overdue (&gt;24h)
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-amber-50 border border-amber-200 text-amber-700 font-bold text-xs">
          <Clock3 className="h-3.5 w-3.5" />
          Pending Review
        </span>
      );
    }

    const verdict = report.verdictCode || report.decision;
    if (verdict === 'GUILTY') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-rose-50 border border-rose-200 text-rose-700 font-bold text-xs">
          <XCircle className="h-3.5 w-3.5" />
          Resolved: GUILTY
        </span>
      );
    }

    if (verdict === 'INNOCENT') {
      return (
        <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-50 border border-emerald-200 text-emerald-700 font-bold text-xs">
          <CheckCircle2 className="h-3.5 w-3.5" />
          Resolved: INNOCENT
        </span>
      );
    }

    return (
      <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-slate-100 border border-slate-200 text-slate-700 font-bold text-xs">
        <HelpCircle className="h-3.5 w-3.5" />
        Resolved: INCONCLUSIVE
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
            Match Fraud Reports
          </h1>
          <p className="text-sm text-slate-500">
            Review fraud reports, replay video evidence, inspect AI logs, and issue final non-reversible verdicts.
          </p>
        </div>

        <div className="flex items-center gap-2.5 shrink-0 self-start md:self-auto">
          <Link
            href="/managertournaments"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-600" />
            <span>Back to Dashboard</span>
          </Link>
          <button
            onClick={fetchReports}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl bg-white hover:bg-slate-50 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer disabled:opacity-50 shadow-2xs"
          >
            <RefreshCw className={`h-4 w-4 text-indigo-600 ${isLoading ? 'animate-spin' : ''}`} />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Filter Tabs (All, Pending, Priority/Overdue, Resolved) */}
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
          <span>All ({reports.length})</span>
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
          <span>Pending ({pendingCount})</span>
        </button>

        <button
          onClick={() => setActiveTab('PRIORITY')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all flex items-center gap-2 cursor-pointer ${
            activeTab === 'PRIORITY'
              ? 'bg-rose-600 text-white shadow-2xs'
              : priorityCount > 0
              ? 'bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100'
              : 'bg-transparent text-slate-600 hover:bg-slate-100'
          }`}
        >
          <Flame className={`h-3.5 w-3.5 ${priorityCount > 0 ? 'text-rose-500 animate-pulse' : ''}`} />
          <span>Priority / Overdue ({priorityCount})</span>
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
          <span>Resolved ({resolvedCount})</span>
        </button>
      </div>

      {/* Main Queue Section */}
      {isLoading ? (
        <div className="py-20 text-center space-y-4 bg-white border border-slate-200 rounded-2xl shadow-2xs w-full">
          <RefreshCw className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
          <p className="text-sm font-semibold text-slate-500">
            Loading fraud reports...
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
            Try Again
          </button>
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="py-20 text-center space-y-3 bg-white border border-slate-200 rounded-2xl shadow-2xs w-full">
          <CheckCircle2 className="h-10 w-10 text-emerald-600 mx-auto" />
          <h3 className="text-base font-bold text-slate-800">
            {activeTab === 'PENDING'
              ? 'No reports are awaiting review'
              : activeTab === 'PRIORITY'
              ? 'No overdue fraud reports pending'
              : activeTab === 'RESOLVED'
              ? 'No reports have been resolved'
              : 'No fraud reports found'}
          </h3>
          <p className="text-sm text-slate-500 max-w-sm mx-auto">
            {activeTab === 'PENDING'
              ? 'All fraud reports have been resolved, or no new reports have been submitted.'
              : activeTab === 'PRIORITY'
              ? 'All pending reports are within normal processing timeframe (<24h).'
              : 'The report list is empty.'}
          </p>
        </div>
      ) : (
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs w-full">
          {/* Desktop Responsive Table View */}
          <div className="hidden md:block overflow-x-auto w-full">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-slate-200 bg-slate-50 text-xs font-bold text-slate-600 whitespace-nowrap">
                  <th className="px-5 py-4">Match ID</th>
                  <th className="px-5 py-4">Reporter</th>
                  <th className="px-5 py-4">Reported Player</th>
                  <th className="px-5 py-4">Fraud Type</th>
                  <th className="px-5 py-4">Incident Time</th>
                  <th className="px-5 py-4">Submitted At</th>
                  <th className="px-5 py-4">Status &amp; Verdict</th>
                  <th className="px-5 py-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-normal">
                {filteredReports.map((report) => {
                  const isPending = isReportPending(report);

                  return (
                    <tr key={report.id} className="hover:bg-slate-50/80 transition-colors whitespace-nowrap">
                      <td className="px-5 py-4 font-semibold text-slate-900">
                        {report.matchId.slice(0, 8)}...
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-emerald-600 shrink-0" />
                          <span className="font-medium" title={report.reporterUserId}>
                            {formatCompetitorLabel(
                              report.reporterUserCode,
                              report.reporterDisplayName,
                              report.reporterUserId,
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-700">
                        <div className="flex items-center gap-1.5">
                          <User className="h-4 w-4 text-rose-600 shrink-0" />
                          <span className="font-medium text-slate-900" title={report.reportedUserId}>
                            {formatCompetitorLabel(
                              report.reportedUserCode,
                              report.reportedDisplayName,
                              report.reportedUserId,
                            )}
                          </span>
                        </div>
                      </td>
                      <td className="px-5 py-4">
                        <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 font-bold text-xs text-amber-700 inline-block">
                          {report.fraudType || report.reasonCode || 'Other'}
                        </span>
                      </td>
                      <td className="px-5 py-4 font-semibold text-indigo-600">
                        <div className="flex items-center gap-1.5">
                          <Clock className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                          <span>{report.timestampText || '00:00'}</span>
                        </div>
                      </td>
                      <td className="px-5 py-4 text-slate-500 text-xs">
                        {new Date(report.createdAt).toLocaleString('en-US')}
                      </td>
                      <td className="px-5 py-4">
                        <div>{getVerdictBadge(report)}</div>
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/admin/fraud-reports/${report.id}`}
                          className={`inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white font-bold text-xs transition-all shadow-2xs cursor-pointer ${
                            isPending
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : 'bg-slate-700 hover:bg-slate-800'
                          }`}
                        >
                          {isPending ? (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Review</span>
                            </>
                          ) : (
                            <>
                              <Eye className="h-3.5 w-3.5" />
                              <span>Details</span>
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
              const isPending = isReportPending(report);

              return (
                <div key={report.id} className="p-4 space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-bold text-sm text-slate-900">
                      Match: {report.matchId.slice(0, 8)}...
                    </span>
                    <div>{getVerdictBadge(report)}</div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 text-xs text-slate-600">
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Reporter</span>
                      <span className="font-semibold text-slate-900" title={report.reporterUserId}>
                        {formatCompetitorLabel(
                          report.reporterUserCode,
                          report.reporterDisplayName,
                          report.reporterUserId,
                        )}
                      </span>
                    </div>
                    <div>
                      <span className="text-[11px] text-slate-400 block font-medium">Reported Player</span>
                      <span className="font-semibold text-rose-600" title={report.reportedUserId}>
                        {formatCompetitorLabel(
                          report.reportedUserCode,
                          report.reportedDisplayName,
                          report.reportedUserId,
                        )}
                      </span>
                    </div>
                  </div>

                  <div className="flex items-center justify-between text-xs pt-2 border-t border-slate-100">
                    <span className="px-2.5 py-1 rounded-lg bg-amber-50 border border-amber-200 text-amber-700 font-bold">
                      {report.fraudType || 'Other'} ({report.timestampText || '00:00'})
                    </span>
                    <Link
                      href={`/admin/fraud-reports/${report.id}`}
                      className={`inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-white font-bold text-xs ${
                        isPending ? 'bg-indigo-600' : 'bg-slate-700'
                      }`}
                    >
                      {isPending ? (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Review</span>
                        </>
                      ) : (
                        <>
                          <Eye className="h-3.5 w-3.5" />
                          <span>Details</span>
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

