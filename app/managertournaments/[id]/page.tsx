'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { DashboardCard } from '@/components/tournament-manager/DashboardCard';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import { getTournamentById, completeTournament } from '@/lib/api/tournaments';
import type { TournamentDetailDto } from '@/lib/api/types';
import {
  ChevronRight,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  Settings,
  QrCode,
  Zap,
  Shield,
  Radio,
  ClipboardList,
  Calendar,
  MapPin,
  User2,
  Loader2,
  Trophy,
  RefreshCw,
  CheckCircle,
} from 'lucide-react';
import { ConfirmDialog } from '@/components/ui/confirm-dialog';

const QUICK_ACTIONS = [
  {
    title: 'Configure Events',
    description: 'Set formats, rounds, and scoring rules',
    href: 'events',
    icon: Settings,
    accent: 'bg-card border-blue-500/20 text-blue-600 hover:bg-blue-500/5',
  },
  {
    title: 'Manage Registrations',
    description: 'View and override competitor seed times',
    href: 'registrations',
    icon: ClipboardList,
    accent: 'bg-card border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5',
  },
  {
    title: 'Generate Groups & Scrambles',
    description: 'Create groups, assign stations and scrambles',
    href: 'groups',
    icon: Layers,
    accent: 'bg-card border-purple-500/20 text-purple-600 hover:bg-purple-500/5',
  },
  {
    title: 'Live Operations',
    description: 'Monitor stations, check-in, and active rounds',
    href: 'live',
    icon: Radio,
    accent: 'bg-card border-emerald-500/20 text-emerald-600 hover:bg-emerald-500/5',
  },
  {
    title: 'Manage Disputes',
    description: 'Review and resolve result disputes',
    href: 'disputes',
    icon: Shield,
    accent: 'bg-card border-red-500/20 text-red-600 hover:bg-red-500/5',
  },
];

function formatDate(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  const hours = pad(d.getHours());
  const minutes = pad(d.getMinutes());
  return `${day} ${month} ${year}, ${hours}:${minutes}`;
}

function formatDateOnly(dateStr?: string): string {
  if (!dateStr) return '—';
  const d = new Date(dateStr);
  const pad = (n: number) => String(n).padStart(2, '0');
  const day = pad(d.getDate());
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
  const month = months[d.getMonth()];
  const year = d.getFullYear();
  return `${day} ${month} ${year}`;
}

export default function TournamentDetailDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeMsg, setCompleteMsg] = useState<string | null>(null);

  const fetchTournament = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTournamentById(id);
      setTournament(data);
    } catch (err) {
      console.warn('API connection failed, falling back to mock details:', err);
      const mockDetail: TournamentDetailDto = {
        id: id || 'T001',
        name: 'CubeNexus Open 2026',
        description: 'Official CubeNexus Speedcubing Tournament featuring 3x3x3, 2x2x2 and special medley relay.',
        location: 'FPT University, Ho Chi Minh City',
        startDate: '2026-06-12T09:00:00Z',
        endDate: '2026-06-14T18:00:00Z',
        registrationOpenAt: '2026-05-01T00:00:00Z',
        registrationCloseAt: '2026-06-10T00:00:00Z',
        createdAt: '2026-04-15T12:00:00Z',
        createdBy: 'U001',
        createdByUserName: 'Nguyen Van A',
        updatedAt: new Date().toISOString(),
        statusCode: 'ongoing',
        events: [
          { id: 'E001', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, registrationStatusCode: 'CLOSED', medleyPuzzles: [] },
          { id: 'E002', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, registrationStatusCode: 'OPEN', medleyPuzzles: [] },
          { id: 'E004', puzzleTypeId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', puzzleTypeCode: 'MEDLEY', puzzleTypeName: 'Medley Relay', eventFormatCode: 'MEDLEY', solveCount: 1, registrationStatusCode: 'NOT_OPEN', medleyPuzzles: [
            { id: 'MP1', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2', sortOrder: 1 },
            { id: 'MP2', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3', sortOrder: 2 },
          ] }
        ]
      };
      setTournament(mockDetail);
      setCompleteMsg('Using mock data (Failed to connect to Backend)');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const [showCompleteConfirm, setShowCompleteConfirm] = useState(false);

  const handleComplete = async () => {
    if (!tournament) return;
    setIsCompleting(true);
    try {
      const res = await completeTournament(id);
      if (res.success) {
        setCompleteMsg('Tournament marked as completed!');
        await fetchTournament();
      } else {
        setCompleteMsg(`Error: ${res.message || 'Failed to complete tournament'}`);
      }
    } catch (err) {
      setCompleteMsg(
        `Error: ${err instanceof Error ? err.message : 'Failed to complete tournament'}`
      );
    } finally {
      setIsCompleting(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Error
  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="flex flex-col items-center gap-4 rounded-2xl border border-red-500/20 bg-red-500/5 py-16 text-center">
          <AlertCircle className="h-10 w-10 text-red-400" />
          <p className="text-base font-semibold text-red-700">
            {error ?? 'Tournament not found'}
          </p>
          <button
            onClick={fetchTournament}
            className="inline-flex items-center gap-1.5 rounded-xl bg-card border border-border px-4 py-2 text-sm font-semibold text-foreground hover:bg-muted/50"
          >
            <RefreshCw className="h-4 w-4" />
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium mb-7 flex-wrap">
        <Trophy className="h-3.5 w-3.5" />
        <Link href="/managertournaments" className="hover:text-foreground transition-colors">
          Tournaments
        </Link>
        <ChevronRight className="h-3.5 w-3.5" />
        <span className="text-foreground font-semibold">{tournament.name}</span>
      </div>

      {/* Complete success/error banner */}
      {completeMsg && (
        <div className={`mb-5 flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
          completeMsg.startsWith('Error')
            ? 'border-red-500/20 bg-red-500/5 text-red-600'
            : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600'
        }`}>
          <CheckCircle className="h-4 w-4 shrink-0" />
          {completeMsg}
          <button onClick={() => setCompleteMsg(null)} className="ml-auto text-xs underline">Dismiss</button>
        </div>
      )}

      {/* Tournament Overview Card */}
      <div className="rounded-2xl border border-border bg-card shadow-sm p-6 mb-8">
        <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-3 mb-2">
              <StatusBadge status={tournament.statusCode} />
              <span className="text-xs text-muted-foreground font-mono">
                {tournament.id.slice(0, 8)}…
              </span>
            </div>
            <h1 className="text-xl font-black text-foreground tracking-tight leading-tight">
              {tournament.name}
            </h1>
            {tournament.description && (
              <p className="text-sm text-muted-foreground mt-1">{tournament.description}</p>
            )}
            <div className="flex flex-wrap items-center gap-4 mt-3 text-[13px] text-muted-foreground">
              <span className="flex items-center gap-1.5">
                <Calendar className="h-3.5 w-3.5 text-primary" />
                {formatDateOnly(tournament.startDate)} – {formatDateOnly(tournament.endDate)}
              </span>
              {tournament.location && (
                <span className="flex items-center gap-1.5">
                  <MapPin className="h-3.5 w-3.5 text-primary" />
                  {tournament.location}
                </span>
              )}
              <span className="flex items-center gap-1.5">
                <User2 className="h-3.5 w-3.5 text-primary" />
                {tournament.createdByUserName}
              </span>
            </div>
            {/* Events chips */}
            <div className="flex flex-col gap-1.5 mt-3">
              <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">Event Categories (Events)</span>
              <div className="flex flex-wrap gap-1.5">
                {tournament.events.map((e) => {
                  const isClosed = e.registrationStatusCode === 'CLOSED';
                  const isOpen = e.registrationStatusCode === 'OPEN';
                  return (
                    <span
                      key={e.id}
                      className={`inline-flex items-center gap-1.5 rounded-lg border px-2.5 py-1 text-[11px] font-semibold transition-all ${
                        isClosed
                          ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600'
                          : isOpen
                          ? 'bg-amber-500/10 border-amber-500/20 text-amber-600'
                          : 'bg-muted border-border text-muted-foreground'
                      }`}
                    >
                      <span>{e.puzzleTypeName || e.puzzleTypeCode}{e.eventFormatCode === 'MEDLEY' && ' (Medley)'}</span>
                      <span className="w-1 h-1 rounded-full bg-current opacity-70" />
                      <span className="text-[9px] uppercase font-mono tracking-wider">
                        {isClosed ? 'Completed' : isOpen ? 'Ongoing' : 'Not Open'}
                      </span>
                    </span>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-2 flex-shrink-0">
            <button
              onClick={fetchTournament}
              disabled={isLoading}
              className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground shadow-sm transition hover:bg-muted/50 hover:text-foreground"
              title="Refresh"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {tournament.statusCode !== 'completed' && tournament.statusCode !== 'cancelled' && (
              <div className="flex flex-col items-end gap-1.5">
                <button
                  onClick={() => setShowCompleteConfirm(true)}
                  disabled={isCompleting}
                  className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white shadow-md transition hover:bg-emerald-500 disabled:opacity-60"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <CheckCircle2 className="h-4 w-4" />
                  )}
                  Complete Tournament
                </button>
                {tournament.events.some(e => e.registrationStatusCode !== 'CLOSED') && (
                  <span className="text-[10px] font-semibold text-amber-500 flex items-center gap-1 mt-0.5">
                    <AlertCircle className="h-3.5 w-3.5" />
                    All event categories must be completed
                  </span>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Reg window */}
        <div className="mt-5 border-t border-border pt-4 flex flex-wrap gap-x-4 gap-y-1 text-xs text-muted-foreground font-semibold">
          <p>Registration: <span className="text-primary">{formatDate(tournament.registrationOpenAt)}</span> to <span className="text-primary">{formatDate(tournament.registrationCloseAt)}</span></p>
          <span className="ml-0 sm:ml-4">
            <span className="font-semibold text-foreground">Created:</span>{' '}
            <span className="text-primary">{formatDateOnly(tournament.createdAt)}</span>
          </span>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4 mb-8">
        <DashboardCard title="Events" value={tournament.events.length} icon={Zap} accent="blue" />
        <DashboardCard title="Groups" value="—" icon={Layers} accent="purple" />
        <DashboardCard title="Registrations" value="—" icon={Users} accent="yellow" />
        <DashboardCard title="Pending Disputes" value="—" icon={AlertCircle} accent="red" />
      </div>

      {/* Quick Action Cards */}
      <div>
        <h2 className="text-sm font-bold text-muted-foreground uppercase tracking-wider mb-4">
          Quick Actions
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            const Icon = action.icon;
            return (
              <Link
                key={action.title}
                href={`/managertournaments/${id}/${action.href}`}
                className={`rounded-2xl border p-5 transition-all shadow-sm hover:shadow-md group ${action.accent}`}
              >
                <div className="flex items-center gap-3 mb-3">
                  <Icon className="h-5 w-5 flex-shrink-0" />
                  <ChevronRight className="h-4 w-4 ml-auto opacity-0 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="font-bold text-[13px] leading-tight text-foreground">{action.title}</p>
                <p className="text-[11px] mt-1 text-muted-foreground leading-snug">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      <ConfirmDialog
        isOpen={showCompleteConfirm}
        onOpenChange={setShowCompleteConfirm}
        title="Complete Tournament"
        description={`Are you sure you want to mark "${tournament.name}" as Completed? This action cannot be undone.`}
        onConfirm={handleComplete}
        confirmText="Complete"
      />
    </div>
  );
}
