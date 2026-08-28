'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getTournamentRegistrations, generateDemoParticipants, updateRegistrationStatus, checkInRegistration } from '@/lib/api/tournaments';
import type { TournamentDetailDto, TournamentRegistrationDetailDto } from '@/lib/api/types';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
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
  AlertTriangle,
  QrCode,
  Copy,
  Printer,
  Sparkles
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
  return new Date(dateStr).toLocaleDateString('en-US', {
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
  const [isGeneratingDemo, setIsGeneratingDemo] = useState(false);
  const [demoCount, setDemoCount] = useState('1');
  const isRegistrationOpen = String(tournament?.statusCode ?? '').toUpperCase() === 'REGISTRATION_OPEN';

  // QR Modal State
  const [selectedRegForQr, setSelectedRegForQr] = useState<TournamentRegistrationDetailDto | null>(null);
  const [copiedToken, setCopiedToken] = useState(false);

  // Check-in All Modal State
  const [showCheckInAllConfirm, setShowCheckInAllConfirm] = useState(false);
  const [isCheckingInAll, setIsCheckingInAll] = useState(false);

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

  const activeRegisteredCount = registrations.filter(r => r.statusCode !== 'CANCELLED').length;
  const maxParticipants = tournament?.maxParticipants ?? 0;
  const tournamentStatus = String(tournament?.statusCode ?? '').toUpperCase();
  const canCheckIn = tournamentStatus === 'CHECKING_IN' || tournamentStatus === 'ONGOING';
  const checkInEligibleRegistrations = registrations.filter(
    (registration) => registration.statusCode === 'CONFIRMED' && !registration.checkedInAt,
  );
  const remainingCapacity = maxParticipants > 0
    ? Math.max(0, maxParticipants - activeRegisteredCount)
    : 20;

  useEffect(() => {
    setDemoCount(String(remainingCapacity > 0 ? remainingCapacity : 1));
  }, [remainingCapacity]);

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

  const handleCheckInAll = async () => {
    setActionError(null);
    setActionSuccess(null);
    setIsCheckingInAll(true);
    try {
      const targets = checkInEligibleRegistrations;
      if (targets.length === 0) {
        setActionError('No confirmed competitors waiting for check-in.');
        setShowCheckInAllConfirm(false);
        return;
      }

      let successCount = 0;
      let failCount = 0;

      for (const reg of targets) {
        try {
          await checkInRegistration(reg.registrationId);
          successCount++;
        } catch {
          failCount++;
        }
      }

      if (failCount === 0) {
        setActionSuccess(`Checked in all ${successCount} confirmed competitors successfully.`);
      } else {
        setActionSuccess(`Checked in ${successCount} competitor(s). (${failCount} failed)`);
      }
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to check in competitors');
    } finally {
      setIsCheckingInAll(false);
      setShowCheckInAllConfirm(false);
    }
  };

  const handleGenerateDemoParticipants = async () => {
    setActionError(null);
    setActionSuccess(null);
    const requestedCount = Number.parseInt(demoCount, 10);
    if (!Number.isInteger(requestedCount) || requestedCount < 1) {
      setActionError('Demo participant count must be at least 1.');
      return;
    }
    if (maxParticipants > 0 && requestedCount > remainingCapacity) {
      setActionError(`Only ${remainingCapacity} registration slot(s) remain in this tournament.`);
      return;
    }

    setIsGeneratingDemo(true);
    try {
      const result = await generateDemoParticipants(tournamentId, requestedCount);
      setActionSuccess(
        `Generated ${result.newRegistrations} demo participants (${result.existingRegistrations} already existed).`
      );
      await loadData();
    } catch (err) {
      setActionError(err instanceof Error ? err.message : 'Failed to generate demo participants');
    } finally {
      setIsGeneratingDemo(false);
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
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${tournamentId}`} className="hover:text-slate-900 transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Registrations</span>
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
              {tournament.location ? (
                <a
                  href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tournament.location)}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-indigo-600 hover:text-indigo-800 hover:underline transition font-medium"
                  title="Xem địa điểm trên Google Maps (Mở tab mới)"
                >
                  <MapPin className="h-3.5 w-3.5 text-indigo-500 shrink-0" />
                  <span>{tournament.location}</span>
                </a>
              ) : (
                <span>Location: Offline</span>
              )}
              <span>• Dates: {new Date(tournament.startDate).toLocaleDateString('en-US')} – {new Date(tournament.endDate).toLocaleDateString('en-US')}</span>
            </div>
            <h1 className="text-2xl font-bold tracking-tight text-slate-900">
              {tournament.name}
            </h1>
            <p className="text-xs text-slate-500">
              Registration Window: <span className="font-semibold text-slate-700">{formatDate(tournament.registrationOpenAt)}</span> to <span className="font-semibold text-slate-700">{formatDate(tournament.registrationCloseAt)}</span>
            </p>
          </div>
          <div className="flex w-full flex-col items-stretch gap-2 sm:w-auto sm:flex-row sm:items-center">
            <StatusBadge status={tournament.statusCode} />
            <div className="flex items-center justify-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1.5 sm:justify-start" title="Number of demo competitors to create">
              <input
                type="number"
                min="1"
                max={maxParticipants > 0 ? remainingCapacity : undefined}
                value={demoCount}
                onChange={(e) => setDemoCount(e.target.value)}
                disabled={isGeneratingDemo || !isRegistrationOpen || remainingCapacity === 0}
                className="w-12 bg-transparent text-center text-xs font-bold text-indigo-800 outline-none disabled:opacity-50"
                aria-label="Number of demo participants"
              />
            </div>
            <button
              type="button"
              onClick={handleGenerateDemoParticipants}
              disabled={isGeneratingDemo || !isRegistrationOpen || remainingCapacity === 0}
              title={!isRegistrationOpen
                ? 'Open registration before generating demo participants'
                : remainingCapacity === 0
                  ? 'Tournament registration is full'
                  : `Create ${demoCount} demo registrations`}
              className="inline-flex w-full items-center justify-center gap-2 rounded-lg bg-indigo-600 px-3 py-2 text-xs font-bold text-white transition hover:bg-indigo-700 disabled:cursor-not-allowed disabled:opacity-50 sm:w-auto"
            >
              {isGeneratingDemo ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
              {isGeneratingDemo ? 'Generating...' : `Generate ${demoCount} Demo Participants`}
            </button>
          </div>
        </div>
      </div>

      {/* Summary Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Registrations', value: totalRegisteredCount, color: 'text-slate-900' },
          { label: 'Pending Approval', value: pendingCount, color: 'text-amber-600' },
          { label: 'Confirmed', value: confirmedCount, color: 'text-emerald-600' },
          { label: 'Checked-In', value: checkedInCount, color: 'text-indigo-600' },
          { label: 'Cancelled', value: cancelledCount, color: 'text-slate-400' }
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
          EVENT CAPACITY & REGISTRATIONS
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
                  <span>Registered: <strong className="text-indigo-600">{count}</strong></span>
                  {ev.maxCapacity && (
                    <span>Max: {ev.maxCapacity}</span>
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
                placeholder="Search competitors, email..."
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
              <option value="ALL">All Events</option>
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
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="CHECKED_IN">Checked-In</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Filter by Check-In status */}
            <select
              value={filterCheckIn}
              onChange={(e) => setFilterCheckIn(e.target.value)}
              className="rounded-lg border border-slate-200 bg-white px-2.5 py-1.5 text-xs text-slate-700 outline-none focus:border-indigo-600 font-medium"
            >
              <option value="ALL">All Check-In</option>
              <option value="CHECKED_IN">Checked-In</option>
              <option value="NOT_CHECKED_IN">Not Checked-In</option>
            </select>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end flex-wrap sm:flex-nowrap">
            <button
              onClick={() => setShowCheckInAllConfirm(true)}
              disabled={!canCheckIn || checkInEligibleRegistrations.length === 0 || isCheckingInAll}
              title={
                !canCheckIn
                  ? 'Check-in is available only when tournament status is CHECKING_IN or ONGOING'
                  : checkInEligibleRegistrations.length === 0
                  ? 'No confirmed competitors waiting for check-in'
                  : `Check in all ${checkInEligibleRegistrations.length} confirmed competitors`
              }
              className="inline-flex items-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 px-3 h-8 text-xs font-semibold text-emerald-700 hover:bg-emerald-100 transition shadow-2xs disabled:opacity-50 disabled:cursor-not-allowed cursor-pointer"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Check-in All ({checkInEligibleRegistrations.length})
            </button>

            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center justify-center rounded-lg border border-slate-200 bg-white h-8 w-8 text-slate-600 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
              title="Reload"
            >
              <RefreshCw className="h-3.5 w-3.5" />
            </button>

            <button
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-200 bg-indigo-50 px-3 h-8 text-xs font-semibold text-indigo-700 hover:bg-indigo-100 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              Export CSV
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
                  <th className="px-4 py-3.5">Competitor</th>
                  <th className="px-4 py-3.5">Email</th>
                  <th className="px-4 py-3.5 text-center">Status</th>
                  <th className="px-4 py-3.5">Events</th>
                  <th className="px-4 py-3.5 text-center">Check-In</th>
                  <th className="px-4 py-3.5 text-center w-28">Registered At</th>
                  <th className="px-4 py-3.5 text-right w-44">Actions</th>
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

                    // Collect all round→station pairs across all events (deduplicated by round)
                    const roundStationMap = new Map<number, number>();
                    reg.registeredEvents?.forEach(ev => {
                      (ev.assignments || []).forEach(a => {
                        if (typeof a.stationNumber === 'number' && a.stationNumber > 0) {
                          roundStationMap.set(a.roundNumber, a.stationNumber);
                        }
                      });
                    });
                    const roundStationEntries = Array.from(roundStationMap.entries()).sort(([a], [b]) => a - b);

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
                              <span className="text-[10px] text-slate-500 font-sans font-medium tracking-tight block">
                                {reg.competitorUserCode || 'No Code'}
                              </span>
                              {roundStationEntries.length > 0 ? (
                                <div className="flex flex-wrap gap-1 mt-0.5">
                                  {roundStationEntries.map(([round, station]) => (
                                    <span
                                      key={round}
                                      className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200/80"
                                    >
                                      <MapPin className="h-2.5 w-2.5 text-amber-600 shrink-0" />
                                      R{round}·#{station}
                                    </span>
                                  ))}
                                </div>
                              ) : (
                                <span className="inline-flex items-center gap-1 mt-0.5 px-1.5 py-0.5 rounded text-[10px] font-medium bg-slate-100 text-slate-500 border border-slate-200/60">
                                  <MapPin className="h-3 w-3 text-slate-400 shrink-0" />
                                  Unassigned
                                </span>
                              )}
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3.5 text-xs text-slate-700 font-medium max-w-[170px] truncate">
                          {reg.email}
                        </td>

                        {/* Registration Status */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${reg.statusCode === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-700 ring-emerald-200' :
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
                                  className={`rounded-lg border px-2.5 py-1 flex items-center gap-1 text-xs transition ${isWithdrawn ? 'bg-slate-100 border-dashed border-slate-300 text-slate-400 line-through' :
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
                        <td className="px-4 py-3.5 text-center text-xs text-slate-700 font-sans font-medium">
                          {formatDate(reg.registeredAt)}
                        </td>

                        {/* Manager Action Options */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {/* QR Ticket Button */}
                          <button
                            onClick={() => {
                              setSelectedRegForQr(reg);
                              setCopiedToken(false);
                            }}
                            className="inline-flex items-center justify-center rounded-lg bg-indigo-50 border border-indigo-200 h-7 w-7 text-indigo-700 hover:bg-indigo-100 transition shadow-2xs cursor-pointer"
                            title="View Competitor QR Ticket"
                          >
                            <QrCode className="h-3.5 w-3.5" />
                          </button>

                          {reg.statusCode === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-emerald-50 border border-emerald-200 h-7 w-7 text-emerald-600 hover:bg-emerald-100 transition shadow-2xs cursor-pointer"
                                title="Approve Registration"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancel(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 border border-red-200 h-7 w-7 text-red-600 hover:bg-red-100 transition shadow-2xs cursor-pointer"
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
                                disabled={!canCheckIn || isCheckingInAll}
                                className={`inline-flex items-center gap-1 rounded-lg border px-2 h-7 text-[10px] font-bold transition shadow-2xs ${canCheckIn && !isCheckingInAll
                                    ? 'bg-blue-50 border-blue-200 text-blue-700 hover:bg-blue-100 cursor-pointer'
                                    : 'bg-slate-50 border-slate-200 text-slate-400 cursor-not-allowed'
                                  }`}
                                title={canCheckIn ? 'Mark Checked-In' : 'Check-in is available only when the tournament is CHECKING_IN or ONGOING'}
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Check-In
                              </button>
                              <button
                                onClick={() => handleCancel(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-50 border border-red-200 h-7 w-7 text-red-600 hover:bg-red-100 transition shadow-2xs cursor-pointer"
                                title="Cancel Registration"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {reg.statusCode === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleCancel(reg.registrationId)}
                              className="inline-flex items-center justify-center rounded-lg bg-red-50 border border-red-200 h-7 w-7 text-red-600 hover:bg-red-100 transition shadow-2xs cursor-pointer"
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

      {/* Modal: Competitor QR Ticket Display */}
      {selectedRegForQr && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4">
          <div className="relative w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 space-y-4 text-slate-900 animate-in fade-in zoom-in duration-150">
            <button
              onClick={() => setSelectedRegForQr(null)}
              className="absolute right-4 top-4 rounded-lg p-1.5 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition cursor-pointer"
            >
              <X className="h-5 w-5" />
            </button>

            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600 font-bold shrink-0">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-slate-900 leading-snug">Competitor QR Ticket</h3>
                <p className="text-xs text-slate-500 font-medium truncate max-w-[260px]">{tournament.name}</p>
              </div>
            </div>

            {/* Competitor Profile Details */}
            <div className="rounded-xl bg-slate-50 border border-slate-200 p-4 space-y-2 text-xs">
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Competitor:</span>
                <span className="font-extrabold text-slate-900">{selectedRegForQr.competitorName}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">User Code:</span>
                <span className="font-mono font-bold text-indigo-600 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded">
                  {selectedRegForQr.competitorUserCode || 'N/A'}
                </span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Registration Status:</span>
                <span className="font-bold uppercase text-slate-800">{selectedRegForQr.statusCode}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-slate-500 font-medium">Check-In Status:</span>
                <span className={`font-bold ${selectedRegForQr.checkedInAt || selectedRegForQr.statusCode === 'CHECKED_IN' ? 'text-emerald-600' : 'text-slate-500'}`}>
                  {selectedRegForQr.checkedInAt || selectedRegForQr.statusCode === 'CHECKED_IN' ? 'Checked-In' : 'Absent'}
                </span>
              </div>
            </div>

            {/* High-Resolution QR Display */}
            <div className="flex flex-col items-center justify-center p-4 bg-white border-2 border-dashed border-slate-200 rounded-2xl space-y-2">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedRegForQr.qrToken)}`}
                alt={`QR Ticket for ${selectedRegForQr.competitorName}`}
                className="w-48 h-48 object-contain rounded-lg"
              />
              <p className="text-[10px] font-mono font-medium text-slate-500 text-center break-all px-2 bg-slate-50 py-1 rounded border border-slate-100 max-w-full select-all">
                {selectedRegForQr.qrToken}
              </p>
            </div>

            {/* Action Buttons */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
              <button
                onClick={() => {
                  if (navigator?.clipboard) {
                    navigator.clipboard.writeText(selectedRegForQr.qrToken);
                    setCopiedToken(true);
                    setTimeout(() => setCopiedToken(false), 2000);
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
              >
                <Copy className="h-3.5 w-3.5" /> {copiedToken ? 'Copied!' : 'Copy Token'}
              </button>
              <button
                onClick={() => {
                  const printWin = window.open('', '_blank');
                  if (printWin) {
                    printWin.document.write(`
                      <html>
                        <head>
                          <title>QR Ticket - ${selectedRegForQr.competitorName}</title>
                          <style>
                            body { font-family: sans-serif; text-align: center; padding: 40px; }
                            h2 { margin-bottom: 4px; font-size: 24px; }
                            p { color: #555; margin: 4px 0; font-size: 14px; }
                            .qr { width: 260px; height: 260px; margin: 20px auto; }
                            .code { font-family: monospace; font-size: 12px; word-break: break-all; color: #444; }
                          </style>
                        </head>
                        <body>
                          <h2>${selectedRegForQr.competitorName}</h2>
                          <p>User Code: <strong>${selectedRegForQr.competitorUserCode}</strong></p>
                          <p>Tournament: ${tournament.name}</p>
                          <img src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=${encodeURIComponent(selectedRegForQr.qrToken)}" class="qr" />
                          <p class="code">${selectedRegForQr.qrToken}</p>
                          <script>window.print();</script>
                        </body>
                      </html>
                    `);
                    printWin.document.close();
                  }
                }}
                className="flex items-center gap-1.5 rounded-xl bg-indigo-600 px-4 py-2 text-xs font-bold text-white hover:bg-indigo-700 transition cursor-pointer shadow-2xs"
              >
                <Printer className="h-3.5 w-3.5" /> Print Ticket
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirm Modal: Check-in All */}
      <ConfirmModal
        isOpen={showCheckInAllConfirm}
        title="Check-in All Competitors"
        description={`Check in all ${checkInEligibleRegistrations.length} confirmed competitor(s)? This will mark them as checked in for the tournament.`}
        confirmText={`Check-in All (${checkInEligibleRegistrations.length})`}
        cancelText="Cancel"
        variant="primary"
        isLoading={isCheckingInAll}
        onConfirm={handleCheckInAll}
        onClose={() => setShowCheckInAllConfirm(false)}
      />
    </div>
  );
}
