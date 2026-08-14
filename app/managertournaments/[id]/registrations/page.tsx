'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getTournamentRegistrations, updateRegistrationStatus, checkInRegistration } from '@/lib/api/tournaments';
import type { TournamentDetailDto, TournamentRegistrationDetailDto } from '@/lib/api/types';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import {
  ChevronRight,
  Trophy,
  Loader2,
  AlertCircle,
  Users,
  RefreshCw,
  Search,
  Clock,
  Edit3,
  Check,
  X,
  UserCheck,
  Download,
  Calendar,
  MapPin,
  Layers,
  Filter,
  CheckCircle,
  XCircle,
  AlertTriangle
} from 'lucide-react';

function msToDisplay(ms?: number | null): string {
  if (!ms) return '—';
  const totalSec = ms / 1000;
  if (totalSec >= 60) {
    const min = Math.floor(totalSec / 60);
    const sec = (totalSec % 60).toFixed(2);
    return `${min}:${sec.padStart(5, '0')}`;
  }
  return `${totalSec.toFixed(2)}s`;
}

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  return new Date(dateStr).toLocaleDateString('vi-VN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit'
  });
}

export default function RegistrationManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id: tournamentId } = use(params);

  // ---------- States ----------
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [registrations, setRegistrations] = useState<TournamentRegistrationDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [filterEvent, setFilterEvent] = useState('ALL');
  const [filterStatus, setFilterStatus] = useState('ALL');
  const [filterCheckIn, setFilterCheckIn] = useState('ALL');

  // Action feedback
  const [actionError, setActionError] = useState<string | null>(null);
  const [actionSuccess, setActionSuccess] = useState<string | null>(null);

  // ---------- Load Data ----------
  const loadData = useCallback(async (showLoader = false) => {
    if (showLoader) setIsLoading(true);
    setError(null);
    try {
      const [tourData, regData] = await Promise.all([
        getTournamentById(tournamentId),
        getTournamentRegistrations(tournamentId)
      ]);
      setTournament(tourData);
      setRegistrations(regData);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load registrations');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  // ---------- Actions ----------
  const handleApprove = async (regId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await updateRegistrationStatus(regId, 'CONFIRMED');
      setActionSuccess('Registration approved successfully.');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to approve registration');
    }
  };

  const handleCancel = async (regId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await updateRegistrationStatus(regId, 'CANCELLED');
      setActionSuccess('Registration cancelled successfully.');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to cancel registration');
    }
  };

  const handleCheckIn = async (regId: string) => {
    setActionError(null);
    setActionSuccess(null);
    try {
      await checkInRegistration(regId);
      setActionSuccess('Competitor checked in successfully.');
      loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to check in competitor');
    }
  };

  // ---------- CSV Export ----------
  const handleExportCSV = () => {
    if (registrations.length === 0) return;

    // Header row
    const headers = ['Competitor Name', 'Email', 'User Code', 'Registration Status', 'Check-In Status', 'Checked-In At', 'Registered At', 'Registered Events'];
    
    const rows = filteredRegistrations.map(r => {
      const eventsStr = r.registeredEvents.map(e => 
        `${e.puzzleTypeName} (${e.statusCode})`
      ).join('; ');

      return [
        r.competitorName,
        r.email,
        r.competitorUserCode,
        r.statusCode,
        r.checkedInAt ? 'Checked In' : 'Not Checked In',
        r.checkedInAt ? formatDate(r.checkedInAt) : '—',
        formatDate(r.registeredAt),
        eventsStr
      ];
    });

    const csvContent = [headers, ...rows]
      .map(e => e.map(val => `"${String(val).replace(/"/g, '""')}"`).join(','))
      .join('\n');

    // Create file and download
    const blob = new Blob([new Uint8Array([0xEF, 0xBB, 0xBF]), csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `${tournament?.name.replace(/\s+/g, '_')}_registrations.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // ---------- Filter Logic ----------
  const filteredRegistrations = registrations.filter(r => {
    // Search filter
    const matchesSearch = 
      r.competitorName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      r.competitorUserCode.toLowerCase().includes(searchQuery.toLowerCase());

    // Event filter
    const matchesEvent = filterEvent === 'ALL' || r.registeredEvents.some(e => e.eventId === filterEvent);

    // Registration status filter
    const matchesStatus = filterStatus === 'ALL' || r.statusCode === filterStatus;

    // Check-in status filter
    const matchesCheckIn = 
      filterCheckIn === 'ALL' || 
      (filterCheckIn === 'CHECKED_IN' && r.checkedInAt !== null && r.checkedInAt !== undefined) ||
      (filterCheckIn === 'NOT_CHECKED_IN' && (!r.checkedInAt));

    return matchesSearch && matchesEvent && matchesStatus && matchesCheckIn;
  });

  // ---------- Counts Summary ----------
  const totalRegisteredCount = registrations.length;
  const pendingCount = registrations.filter(r => r.statusCode === 'PENDING').length;
  const confirmedCount = registrations.filter(r => r.statusCode === 'CONFIRMED').length;
  const checkedInCount = registrations.filter(r => r.statusCode === 'CHECKED_IN' || r.checkedInAt).length;
  const cancelledCount = registrations.filter(r => r.statusCode === 'CANCELLED').length;

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
          <p className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Loading registrations...</p>
        </div>
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-8 text-center text-red-600 dark:text-red-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error ?? 'Tournament not found'}</p>
          <button
            onClick={() => loadData(true)}
            className="mt-4 inline-flex items-center gap-2 rounded-xl bg-primary px-4 py-2 text-xs font-bold text-primary-foreground hover:opacity-90 transition"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 relative">
      <div className="absolute top-0 right-0 w-[400px] h-[400px] rounded-full bg-primary/5 blur-[120px] pointer-events-none" />

      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">Giải Đấu</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${tournamentId}`} className="hover:text-slate-900 transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Danh Sách Đăng Ký</span>
      </div>

      {/* Action feedbacks */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-50 border border-red-200 px-4 py-3 text-xs text-red-700">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-50 border border-emerald-200 px-4 py-3 text-xs text-emerald-700">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Tournament Context Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div className="space-y-1">
            <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 font-medium">
              <span>Địa điểm: {tournament.location || 'Offline'}</span>
              <span>• Thời gian: {new Date(tournament.startDate).toLocaleDateString('vi-VN')} – {new Date(tournament.endDate).toLocaleDateString('vi-VN')}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {tournament.name}
            </h1>
            <p className="text-xs text-slate-500">
              Thời gian mở đăng ký: <span className="font-semibold text-slate-700">{formatDate(tournament.registrationOpenAt)}</span> đến <span className="font-semibold text-slate-700">{formatDate(tournament.registrationCloseAt)}</span>
            </p>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={tournament.statusCode} />
          </div>
        </div>
      </div>

      {/* Summary Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Tổng số đăng ký', value: totalRegisteredCount, color: 'text-slate-900' },
          { label: 'Chờ duyệt', value: pendingCount, color: 'text-amber-600' },
          { label: 'Đã duyệt', value: confirmedCount, color: 'text-emerald-600' },
          { label: 'Đã Check-In', value: checkedInCount, color: 'text-indigo-600' },
          { label: 'Đã hủy', value: cancelledCount, color: 'text-slate-400' }
        ].map((s) => (
          <div key={s.label} className="rounded-xl bg-white border border-slate-200 p-4 shadow-2xs">
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{s.label}</p>
            <p className={`text-2xl font-bold mt-1.5 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Events Summary Grid */}
      <div className="space-y-2">
        <h3 className="font-bold text-xs uppercase tracking-wider text-slate-500">
          SỨC CHỨA HẠNG MỤC THI ĐẤU
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
          {tournament.events.map(ev => {
            const count = registrations.filter(r => 
              r.registeredEvents.some(e => e.eventId === ev.id && e.statusCode === 'REGISTERED')
            ).length;

            return (
              <div key={ev.id} className="rounded-lg border border-slate-200 bg-white p-3.5 space-y-1 shadow-2xs">
                <p className="font-bold text-xs text-slate-900">{formatEventLabel(ev)}</p>
                <div className="flex justify-between items-center text-xs text-slate-500 font-medium pt-1">
                  <span>Đã đăng ký: <strong className="text-indigo-600">{count}</strong></span>
                  {ev.maxCapacity && (
                    <span>Tối đa: {ev.maxCapacity}</span>
                  )}
                </div>
                {ev.maxCapacity && (
                  <div className="w-full bg-slate-100 h-1.5 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full ${count >= ev.maxCapacity ? 'bg-red-500' : 'bg-indigo-600'}`} 
                      style={{ width: `${Math.min(100, (count / ev.maxCapacity) * 100)}%` }} 
                    />
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Competitors Management Section */}
      <div className="space-y-4">
        {/* Table Filters & Toolbar */}
        <div className="flex flex-col lg:flex-row gap-3 justify-between items-start lg:items-center bg-white border border-slate-200 p-4 rounded-xl shadow-2xs">
          <div className="flex flex-wrap items-center gap-2.5 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Tìm thí sinh, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-lg border border-slate-200 bg-slate-50 pl-9 pr-3 py-1.5 text-xs text-slate-800 outline-none focus:bg-white focus:border-indigo-600 transition"
              />
            </div>

            {/* Filter by Event */}
            <select
              value={filterEvent}
              onChange={(e) => setFilterEvent(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-xs font-medium text-slate-700 outline-none focus:border-indigo-600 shadow-2xs"
            >
              <option value="ALL">Tất cả môn thi</option>
              {tournament.events.map(ev => (
                <option key={ev.id} value={ev.id}>{formatEventLabel(ev)}</option>
              ))}
            </select>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-600 font-medium"
            >
              <option value="ALL">Tất cả trạng thái</option>
              <option value="PENDING">Chờ duyệt</option>
              <option value="CONFIRMED">Đã duyệt</option>
              <option value="CHECKED_IN">Đã Check-In</option>
              <option value="CANCELLED">Đã hủy</option>
            </select>

            {/* Filter by Check-In status */}
            <select
              value={filterCheckIn}
              onChange={(e) => setFilterCheckIn(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-600 font-medium"
            >
              <option value="ALL">Tất cả Check-In</option>
              <option value="CHECKED_IN">Đã Check-In</option>
              <option value="NOT_CHECKED_IN">Chưa Check-In</option>
            </select>


          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white h-8 w-8 text-slate-600 hover:bg-slate-50 transition shadow-2xs"
              title="Tải lại"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 h-8 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs disabled:opacity-50"
            >
              Xuất CSV
            </button>
          </div>
        </div>

        {/* Competitor Table List */}
        <div className="rounded-xl border border-slate-200 overflow-hidden bg-white shadow-2xs">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="px-4 py-3.5 w-12 text-center">#</th>
                  <th className="px-4 py-3.5">Thí Sinh</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5 text-center">Trạng Thái</th>
                  <th className="px-4 py-3.5">Hạng Mục</th>
                  <th className="px-4 py-3.5 text-center">Check-In</th>
                  <th className="px-4 py-3.5 text-center w-28">Ngày Đăng Ký</th>
                  <th className="px-4 py-3.5 text-right w-44">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                      {searchQuery || filterEvent !== 'ALL' || filterStatus !== 'ALL' || filterCheckIn !== 'ALL'
                        ? 'No competitors match the specified search filters.'
                        : 'No competitor registrations found for this tournament.'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg, index) => {
                    const isCheckedIn = reg.checkedInAt || reg.statusCode === 'CHECKED_IN';
                    
                    return (
                      <tr key={reg.registrationId} className="hover:bg-slate-50 transition border-b border-slate-100">
                        <td className="px-4 py-3.5 text-center text-xs text-slate-700 font-bold">
                          {index + 1}
                        </td>
                        
                        {/* Profile Info */}
                        <td className="px-4 py-3.5 font-bold">
                          <div className="flex items-center gap-3">
                            <div className="h-8 w-8 rounded-full bg-indigo-50 border border-indigo-200 overflow-hidden shrink-0 flex items-center justify-center text-xs font-bold text-indigo-700 shadow-2xs">
                              {reg.competitorAvatarUrl ? (
                                <img src={reg.competitorAvatarUrl} alt={reg.competitorName} className="h-full w-full object-cover" />
                              ) : (
                                reg.competitorName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-bold text-slate-900 block">{reg.competitorName}</span>
                              <span className="text-[10px] text-slate-500 font-mono tracking-tight block">
                                {reg.competitorUserCode || 'No Code'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium max-w-[170px] truncate">
                          {reg.email}
                        </td>

                        {/* Registration Status */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${
                            reg.statusCode === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
                            reg.statusCode === 'CHECKED_IN' ? 'bg-blue-50 text-blue-700 ring-blue-200' :
                            reg.statusCode === 'CANCELLED' ? 'bg-red-50 text-red-700 ring-red-200' :
                            'bg-amber-50 text-amber-700 ring-amber-200'
                          }`}>
                            {reg.statusCode}
                          </span>
                        </td>

                        {/* Registered Events list */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {reg.registeredEvents.map(ev => {
                              const isWithdrawn = ev.statusCode === 'WITHDRAWN';
                              const isDisqualified = ev.statusCode === 'DISQUALIFIED';

                              return (
                                <div 
                                  key={ev.registrationEventId} 
                                  className={`rounded-lg border px-2.5 py-1 flex items-center gap-1.5 text-xs transition ${
                                    isWithdrawn ? 'bg-slate-100 border-dashed border-slate-300 text-slate-400 line-through' :
                                    isDisqualified ? 'bg-rose-50 border-rose-200 text-rose-700 font-medium' :
                                    'bg-slate-50 border-slate-200 text-slate-800 shadow-2xs font-medium'
                                  }`}
                                >
                                  <span className="font-bold text-slate-900">{formatEventLabel(ev)}</span>
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Check-In Status */}
                        <td className="px-4 py-3.5 text-center">
                          {isCheckedIn ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-50 px-2 py-0.5 text-[9px] font-bold text-emerald-700 ring-1 ring-inset ring-emerald-200">
                                Checked In
                              </span>
                              {reg.checkedInAt && (
                                <span className="text-[10px] text-slate-500 font-mono mt-0.5">
                                  {new Date(reg.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-slate-100 px-2 py-0.5 text-[9px] font-bold text-slate-600">
                              Absent
                            </span>
                          )}
                        </td>

                        {/* Registered At */}
                        <td className="px-4 py-3.5 text-center text-xs text-slate-700 font-mono font-medium">
                          {formatDate(reg.registeredAt)}
                        </td>

                        {/* Manager Action Options */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {reg.statusCode === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 h-7 w-7 text-emerald-600 hover:bg-emerald-100 transition shadow-2xs"
                                title="Approve Registration"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancel(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 border border-red-200 h-7 w-7 text-red-600 hover:bg-red-100 transition shadow-2xs"
                                title="Reject/Cancel"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {(reg.statusCode === 'CONFIRMED') && (
                            <>
                              <button
                                onClick={() => handleCheckIn(reg.registrationId)}
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-50 border border-blue-200 px-2 h-7 text-[10px] font-bold text-blue-700 hover:bg-blue-100 transition shadow-2xs"
                                title="Mark Checked-In"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Check-In
                              </button>
                              <button
                                onClick={() => handleCancel(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 border border-red-200 h-7 w-7 text-red-600 hover:bg-red-100 transition shadow-2xs"
                                title="Cancel Registration"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {reg.statusCode === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleCancel(reg.registrationId)}
                              className="inline-flex items-center justify-center rounded-lg bg-red-50 border border-red-200 h-7 w-7 text-red-600 hover:bg-red-100 transition shadow-2xs"
                              title="Cancel Registration / Check-In"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}


                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
