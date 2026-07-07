'use client';

import { useEffect, useState, useCallback, use } from 'react';
import Link from 'next/link';
import { getTournamentById, getTournamentRegistrations, updateRegistrationStatus, checkInRegistration } from '@/lib/api/tournaments';
import type { TournamentDetailDto, TournamentRegistrationDetailDto, RegisteredEventDetailDto } from '@/lib/api/types';
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
  const [filterMissingSeed, setFilterMissingSeed] = useState(false);

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
    const headers = ['Competitor Name', 'Email', 'User Code', 'Registration Status', 'Check-In Status', 'Checked-In At', 'Registered At', 'Registered Events (Seed Times)'];
    
    const rows = filteredRegistrations.map(r => {
      const eventsStr = r.registeredEvents.map(e => 
        `${e.puzzleTypeName}: ${e.seedTimeMs ? msToDisplay(e.seedTimeMs) : 'No Seed'} (${e.statusCode})`
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

    // Missing seed filter
    const matchesMissingSeed = 
      !filterMissingSeed || 
      r.registeredEvents.some(e => e.statusCode === 'REGISTERED' && !e.seedTimeMs);

    return matchesSearch && matchesEvent && matchesStatus && matchesCheckIn && matchesMissingSeed;
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
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium flex-wrap">
        <Trophy className="h-3.5 w-3.5" />
        <Link href="/managertournaments" className="hover:text-foreground transition-colors">Tournaments</Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <Link href={`/managertournaments/${tournamentId}`} className="hover:text-foreground transition-colors">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold">Registrations</span>
      </div>

      {/* Action feedbacks */}
      {actionError && (
        <div className="flex items-center gap-2 rounded-xl bg-red-500/5 border border-red-500/20 px-4 py-3 text-xs text-red-600 dark:text-red-400">
          <AlertCircle className="h-4 w-4 shrink-0" />
          {actionError}
        </div>
      )}
      {actionSuccess && (
        <div className="flex items-center gap-2 rounded-xl bg-emerald-500/5 border border-emerald-500/20 px-4 py-3 text-xs text-emerald-600 dark:text-emerald-400">
          <CheckCircle className="h-4 w-4 shrink-0" />
          {actionSuccess}
        </div>
      )}

      {/* Tournament Context Header Banner */}
      <div className="rounded-3xl border border-border bg-card/40 backdrop-blur-md p-6 relative overflow-hidden shadow-xl">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,oklch(0.72_0.21_42_/_0.04),transparent_50%)]" />
        <div className="relative z-10 flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-3">
              <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase flex items-center gap-1">
                <MapPin className="h-3.5 w-3.5 text-primary" /> {tournament.location || 'Venue Offline'}
              </span>
              <span className="text-[10px] text-muted-foreground/60 font-semibold uppercase flex items-center gap-1">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {new Date(tournament.startDate).toLocaleDateString('vi-VN')} – {new Date(tournament.endDate).toLocaleDateString('vi-VN')}
              </span>
            </div>
            <h1 className="text-xl sm:text-3xl font-black tracking-tight text-foreground uppercase">
              {tournament.name}
            </h1>
            <div className="text-xs text-muted-foreground font-semibold flex flex-wrap gap-x-4 gap-y-1">
              <p>Registration: <span className="font-mono text-primary">{formatDate(tournament.registrationOpenAt)}</span> to <span className="font-mono text-primary">{formatDate(tournament.registrationCloseAt)}</span></p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <StatusBadge status={tournament.statusCode} />
          </div>
        </div>
      </div>

      {/* Summary Status Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-4">
        {[
          { label: 'Total Registered', value: totalRegisteredCount, color: 'text-foreground' },
          { label: 'Pending Approval', value: pendingCount, color: 'text-amber-500' },
          { label: 'Approved/Accepted', value: confirmedCount, color: 'text-emerald-500' },
          { label: 'Checked-In', value: checkedInCount, color: 'text-blue-400' },
          { label: 'Cancelled/Rejected', value: cancelledCount, color: 'text-muted-foreground' }
        ].map((s) => (
          <div key={s.label} className="rounded-2xl bg-card border border-border/80 px-5 py-4 shadow-sm relative overflow-hidden">
            <p className="text-[9px] font-bold text-muted-foreground uppercase tracking-widest">{s.label}</p>
            <p className={`text-2xl font-black mt-2 ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Events Summary Grid */}
      <div className="space-y-3">
        <h3 className="font-black text-xs uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Layers className="h-4 w-4 text-primary" /> EVENT REGISTRATION CAPACITIES
        </h3>
        <div className="grid grid-cols-1 sm:grid-cols-4 gap-4">
          {tournament.events.map(ev => {
            // Count registered competitors in this event
            const count = registrations.filter(r => 
              r.registeredEvents.some(e => e.eventId === ev.id && e.statusCode === 'REGISTERED')
            ).length;

            return (
              <div key={ev.id} className="rounded-xl border border-border bg-card/60 p-4 space-y-1">
                <p className="font-extrabold text-xs text-foreground uppercase">{ev.puzzleTypeName}</p>
                <div className="flex justify-between items-center text-[10px] text-muted-foreground font-bold pt-1">
                  <span>Registered: <strong className="text-primary font-mono">{count}</strong></span>
                  {ev.maxCapacity && (
                    <span>Limit: <strong className="font-mono">{ev.maxCapacity}</strong></span>
                  )}
                </div>
                {ev.maxCapacity && (
                  <div className="w-full bg-muted h-1 rounded-full overflow-hidden mt-1.5">
                    <div 
                      className={`h-full ${count >= ev.maxCapacity ? 'bg-red-500' : 'bg-primary'}`} 
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
        <div className="flex flex-col lg:flex-row gap-4 justify-between items-start lg:items-center bg-muted/20 border border-border p-4 rounded-2xl">
          
          <div className="flex flex-wrap items-center gap-3 w-full lg:w-auto">
            {/* Search Input */}
            <div className="relative flex-grow sm:flex-grow-0 sm:w-64">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search competitor, email..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full rounded-xl border border-border bg-card pl-9 pr-3 py-2 text-xs text-foreground outline-none focus:border-primary transition"
              />
            </div>

            {/* Filter by Event */}
            <div className="flex items-center gap-1">
              <Filter className="h-3.5 w-3.5 text-muted-foreground shrink-0" />
              <select
                value={filterEvent}
                onChange={(e) => setFilterEvent(e.target.value)}
                className="rounded-xl border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
              >
                <option value="ALL">All Events</option>
                {tournament.events.map(ev => (
                  <option key={ev.id} value={ev.id}>{ev.puzzleTypeName}</option>
                ))}
              </select>
            </div>

            {/* Filter by Status */}
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="rounded-xl border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="CONFIRMED">Approved</option>
              <option value="CHECKED_IN">Checked-In</option>
              <option value="CANCELLED">Cancelled</option>
            </select>

            {/* Filter by Check-In status */}
            <select
              value={filterCheckIn}
              onChange={(e) => setFilterCheckIn(e.target.value)}
              className="rounded-xl border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary"
            >
              <option value="ALL">All Check-In</option>
              <option value="CHECKED_IN">Checked In</option>
              <option value="NOT_CHECKED_IN">Not Checked In</option>
            </select>

            {/* Toggle Missing Seeds */}
            <label className="flex items-center gap-2 text-xs font-bold text-muted-foreground select-none cursor-pointer">
              <input
                type="checkbox"
                checked={filterMissingSeed}
                onChange={(e) => setFilterMissingSeed(e.target.checked)}
                className="rounded border-border text-primary focus:ring-primary h-3.5 w-3.5"
              />
              Missing Seed Time
            </label>
          </div>

          <div className="flex items-center gap-2 w-full sm:w-auto shrink-0 justify-end">
            {/* Refresh Button */}
            <button
              onClick={() => loadData(true)}
              className="inline-flex items-center justify-center rounded-xl border border-border bg-card h-9 w-9 text-muted-foreground hover:bg-muted/50 transition"
              title="Refresh"
            >
              <RefreshCw className="h-4 w-4" />
            </button>

            {/* Export CSV */}
            <button
              onClick={handleExportCSV}
              disabled={registrations.length === 0}
              className="inline-flex items-center gap-1.5 rounded-xl border border-primary/20 bg-primary/10 px-4 h-9 text-xs font-bold text-primary hover:bg-primary/20 transition shadow-sm disabled:opacity-50"
            >
              <Download className="h-3.5 w-3.5" /> Export CSV
            </button>
          </div>
        </div>

        {/* Competitor Table List */}
        <div className="rounded-2xl border border-border overflow-hidden bg-card/40 backdrop-blur-md shadow-lg">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead>
                <tr className="bg-muted/30 border-b border-border">
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground w-12 text-center">#</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Competitor</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Contact Email</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Status</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground">Registered Events & Seeds</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center">Check-In</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-center w-28">Registered At</th>
                  <th className="px-4 py-3 text-[10px] font-bold uppercase tracking-wider text-muted-foreground text-right w-44">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {filteredRegistrations.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="text-center py-12 text-xs text-muted-foreground">
                      {searchQuery || filterEvent !== 'ALL' || filterStatus !== 'ALL' || filterCheckIn !== 'ALL' || filterMissingSeed
                        ? 'No competitors match the specified search filters.'
                        : 'No competitor registrations found for this tournament.'}
                    </td>
                  </tr>
                ) : (
                  filteredRegistrations.map((reg, index) => {
                    const isCheckedIn = reg.checkedInAt || reg.statusCode === 'CHECKED_IN';
                    
                    return (
                      <tr key={reg.registrationId} className="hover:bg-muted/20 transition">
                        <td className="px-4 py-3.5 text-center text-xs text-muted-foreground font-medium">
                          {index + 1}
                        </td>
                        
                        {/* Profile Info */}
                        <td className="px-4 py-3.5 font-bold">
                          <div className="flex items-center gap-3">
                            <div className="h-7 w-7 rounded-full bg-primary/10 border border-primary/20 overflow-hidden shrink-0 flex items-center justify-center text-[10px] font-extrabold text-primary">
                              {reg.competitorAvatarUrl ? (
                                <img src={reg.competitorAvatarUrl} alt={reg.competitorName} className="h-full w-full object-cover" />
                              ) : (
                                reg.competitorName.slice(0, 2).toUpperCase()
                              )}
                            </div>
                            <div>
                              <span className="text-xs font-extrabold text-foreground">{reg.competitorName}</span>
                              <span className="text-[9px] text-muted-foreground/60 font-mono tracking-tight block">
                                {reg.competitorUserCode || 'No Code'}
                              </span>
                            </div>
                          </div>
                        </td>

                        {/* Email */}
                        <td className="px-4 py-3.5 text-xs text-muted-foreground max-w-[150px] truncate">
                          {reg.email}
                        </td>

                        {/* Registration Status */}
                        <td className="px-4 py-3.5 text-center">
                          <span className={`inline-flex items-center rounded-md px-2 py-0.5 text-[9px] font-bold uppercase ring-1 ring-inset ${
                            reg.statusCode === 'CONFIRMED' ? 'bg-emerald-500/10 text-emerald-500 ring-emerald-500/20' :
                            reg.statusCode === 'CHECKED_IN' ? 'bg-blue-500/10 text-blue-400 ring-blue-500/20' :
                            reg.statusCode === 'CANCELLED' ? 'bg-red-500/10 text-red-500 ring-red-500/20' :
                            'bg-amber-500/10 text-amber-500 ring-amber-500/20'
                          }`}>
                            {reg.statusCode}
                          </span>
                        </td>

                        {/* Registered Events list with seed details */}
                        <td className="px-4 py-3.5">
                          <div className="flex flex-wrap gap-1.5">
                            {reg.registeredEvents.map(ev => {
                              const isWithdrawn = ev.statusCode === 'WITHDRAWN';
                              const isDisqualified = ev.statusCode === 'DISQUALIFIED';

                              return (
                                <div 
                                  key={ev.registrationEventId} 
                                  className={`rounded-lg border px-2 py-1 flex items-center gap-1.5 text-[10px] font-medium transition ${
                                    isWithdrawn ? 'bg-muted/30 border-dashed border-border/40 text-muted-foreground/45 line-through' :
                                    isDisqualified ? 'bg-red-500/5 border-red-500/10 text-red-400/70' :
                                    'bg-card border-border text-foreground shadow-sm'
                                  }`}
                                >
                                  <span>{ev.puzzleTypeName}</span>
                                  {!isWithdrawn && !isDisqualified && (
                                    <>
                                      <span className="text-muted-foreground/40">|</span>
                                      {ev.seedTimeMs ? (
                                        <span className="font-mono text-primary font-bold" title="Seed Time">Seed: {msToDisplay(ev.seedTimeMs)}</span>
                                      ) : (
                                        <span className="text-amber-500 font-bold flex items-center gap-0.5" title="No seed time configured!">
                                          <AlertTriangle className="h-3 w-3" /> No Seed
                                        </span>
                                      )}
                                    </>
                                  )}
                                </div>
                              );
                            })}
                          </div>
                        </td>

                        {/* Check-In Status */}
                        <td className="px-4 py-3.5 text-center">
                          {isCheckedIn ? (
                            <div className="flex flex-col items-center">
                              <span className="inline-flex items-center gap-1 rounded-md bg-emerald-500/10 px-2 py-0.5 text-[9px] font-bold text-emerald-500 ring-1 ring-inset ring-emerald-500/20">
                                Checked In
                              </span>
                              {reg.checkedInAt && (
                                <span className="text-[8px] text-muted-foreground/60 font-mono mt-0.5">
                                  {new Date(reg.checkedInAt).toLocaleTimeString('vi-VN', { hour: '2-digit', minute: '2-digit' })}
                                </span>
                              )}
                            </div>
                          ) : (
                            <span className="inline-flex items-center rounded-md bg-muted px-2 py-0.5 text-[9px] font-bold text-muted-foreground">
                              Absent
                            </span>
                          )}
                        </td>

                        {/* Registered At */}
                        <td className="px-4 py-3.5 text-center text-xs text-muted-foreground font-mono">
                          {formatDate(reg.registeredAt)}
                        </td>

                        {/* Manager Action Options */}
                        <td className="px-4 py-3.5 text-right space-x-1.5 whitespace-nowrap">
                          {reg.statusCode === 'PENDING' && (
                            <>
                              <button
                                onClick={() => handleApprove(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-emerald-500/10 border border-emerald-500/20 h-7 w-7 text-emerald-500 hover:bg-emerald-500/20 transition"
                                title="Approve Registration"
                              >
                                <Check className="h-3.5 w-3.5" />
                              </button>
                              <button
                                onClick={() => handleCancel(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 h-7 w-7 text-red-500 hover:bg-red-500/20 transition"
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
                                className="inline-flex items-center gap-1 rounded-lg bg-blue-500/10 border border-blue-500/20 px-2 h-7 text-[10px] font-bold text-blue-400 hover:bg-blue-500/20 transition"
                                title="Mark Checked-In"
                              >
                                <UserCheck className="h-3.5 w-3.5" /> Check-In
                              </button>
                              <button
                                onClick={() => handleCancel(reg.registrationId)}
                                className="inline-flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 h-7 w-7 text-red-500 hover:bg-red-500/20 transition"
                                title="Cancel Registration"
                              >
                                <X className="h-3.5 w-3.5" />
                              </button>
                            </>
                          )}

                          {reg.statusCode === 'CHECKED_IN' && (
                            <button
                              onClick={() => handleCancel(reg.registrationId)}
                              className="inline-flex items-center justify-center rounded-lg bg-red-500/10 border border-red-500/20 h-7 w-7 text-red-500 hover:bg-red-500/20 transition"
                              title="Cancel Registration / Check-In"
                            >
                              <X className="h-3.5 w-3.5" />
                            </button>
                          )}

                          {/* Override seed link redirects to events panel */}
                          <Link
                            href={`/managertournaments/${tournamentId}/events`}
                            className="inline-flex items-center justify-center rounded-lg border border-border bg-card h-7 w-7 text-muted-foreground hover:bg-muted/50 transition"
                            title="Override Seed Time"
                          >
                            <Edit3 className="h-3.5 w-3.5" />
                          </Link>
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
