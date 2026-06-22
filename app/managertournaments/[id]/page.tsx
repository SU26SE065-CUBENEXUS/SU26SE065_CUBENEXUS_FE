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

const QUICK_ACTIONS = [
  {
    title: 'Configure Events',
    description: 'Set formats, rounds, and scoring rules',
    href: 'events',
    icon: Settings,
    accent: 'bg-card border-blue-500/20 text-blue-600 dark:text-blue-400 hover:bg-blue-500/5',
  },
  {
    title: 'Manage Registrations',
    description: 'View and override competitor seed times',
    href: 'registrations',
    icon: ClipboardList,
    accent: 'bg-card border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5',
  },
  {
    title: 'Generate Groups & Scrambles',
    description: 'Create groups, assign stations and scrambles',
    href: 'groups',
    icon: Layers,
    accent: 'bg-card border-purple-500/20 text-purple-600 dark:text-purple-400 hover:bg-purple-500/5',
  },
  {
    title: 'Live Operations',
    description: 'Monitor stations, check-in, and active rounds',
    href: 'live',
    icon: Radio,
    accent: 'bg-card border-emerald-500/20 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/5',
  },
  {
    title: 'Manage Disputes',
    description: 'Review and resolve result disputes',
    href: 'disputes',
    icon: Shield,
    accent: 'bg-card border-red-500/20 text-red-600 dark:text-red-400 hover:bg-red-500/5',
  },
];

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
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
          { id: 'E001', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] },
          { id: 'E002', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] },
          { id: 'E004', puzzleTypeId: 'eeeeeeee-eeee-eeee-eeee-eeeeeeeeeeee', puzzleTypeCode: 'MEDLEY', puzzleTypeName: 'Medley Relay', eventFormatCode: 'MEDLEY', solveCount: 1, medleyPuzzles: [
            { id: 'MP1', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2', sortOrder: 1 },
            { id: 'MP2', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3', sortOrder: 2 },
          ] }
        ]
      };
      setTournament(mockDetail);
      setCompleteMsg('Đang sử dụng dữ liệu mẫu (Không kết nối được BE)');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const handleComplete = async () => {
    if (!tournament) return;
    if (!confirm(`Mark "${tournament.name}" as Completed? This cannot be undone.`)) return;
    setIsCompleting(true);
    try {
      const updated = await completeTournament(id);
      setTournament(updated);
      setCompleteMsg('Tournament marked as completed!');
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
            ? 'border-red-500/20 bg-red-500/5 text-red-600 dark:text-red-400'
            : 'border-emerald-500/20 bg-emerald-500/5 text-emerald-600 dark:text-emerald-400'
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
                {formatDateRange(tournament.startDate, tournament.endDate)}
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
            <div className="flex flex-wrap gap-1.5 mt-3">
              {tournament.events.map((e) => (
                <span
                  key={e.id}
                  className="rounded-md bg-primary/10 border border-primary/20 px-2.5 py-0.5 text-[11px] font-semibold text-primary"
                >
                  {e.puzzleTypeName || e.puzzleTypeCode}
                  {e.eventFormatCode === 'MEDLEY' && ' (Medley)'}
                </span>
              ))}
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
              <button
                onClick={handleComplete}
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
            )}
          </div>
        </div>

        {/* Reg window */}
        <div className="mt-5 border-t border-border pt-4 flex flex-wrap gap-4 text-xs text-muted-foreground">
          <span>
            <span className="font-semibold text-foreground">Reg. Opens:</span>{' '}
            {new Date(tournament.registrationOpenAt).toLocaleString('vi-VN')}
          </span>
          <span>
            <span className="font-semibold text-foreground">Reg. Closes:</span>{' '}
            {new Date(tournament.registrationCloseAt).toLocaleString('vi-VN')}
          </span>
          <span>
            <span className="font-semibold text-foreground">Created:</span>{' '}
            {new Date(tournament.createdAt).toLocaleDateString('vi-VN')}
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
    </div>
  );
}
