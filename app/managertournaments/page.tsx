'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TournamentTable } from '@/components/tournament-manager/TournamentTable';
import { CreateTournamentModal } from '@/components/tournament-manager/CreateTournamentModal';
import { getPublicTournaments, getTournamentById } from '@/lib/api/tournaments';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import {
  Trophy,
  Zap,
  Calendar,
  CheckCircle,
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Sparkles,
} from 'lucide-react';

const STATUS_FILTERS: Array<{ label: string; value: TournamentStatusCode | 'all' }> = [
  { label: 'All', value: 'all' },
  { label: 'In Progress', value: 'ongoing' },
  { label: 'Reg. Open', value: 'registration_open' },
  { label: 'Upcoming', value: 'published' },
  { label: 'Completed', value: 'completed' },
  { label: 'Cancelled', value: 'cancelled' },
];

export default function TournamentManagerOverviewPage() {
  const [tournaments, setTournaments] = useState<TournamentDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [activeFilter, setActiveFilter] = useState<TournamentStatusCode | 'all'>('all');
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const publicList = await getPublicTournaments();
      
      const storedDraftsJson = localStorage.getItem('local_draft_tournaments');
      const storedDrafts: string[] = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
      const drafts: TournamentDetailDto[] = [];
      
      for (const id of storedDrafts) {
        if (!publicList.some(t => t.id === id)) {
           try {
              const draft = await getTournamentById(id);
              drafts.push(draft);
           } catch (e) {
              // Ignore if not found
           }
        }
      }
      
      setTournaments([...drafts, ...publicList]);
    } catch (err) {
      console.warn('API connection failed, falling back to mock data:', err);
      const mappedMocks: TournamentDetailDto[] = [
        {
          id: 'T001',
          name: 'CubeNexus Open 2026',
          description: 'Official CubeNexus Speedcubing Tournament',
          location: 'FPT University, Ho Chi Minh City',
          startDate: '2026-06-12T09:00:00Z',
          endDate: '2026-06-14T18:00:00Z',
          registrationOpenAt: '2026-05-01T00:00:00Z',
          registrationCloseAt: '2026-06-10T00:00:00Z',
          createdAt: '2026-04-15T12:00:00Z',
          createdBy: 'U001',
          createdByUserName: 'Nguyen Van A',
          updatedAt: '2026-04-15T12:00:00Z',
          statusCode: 'ongoing',
          events: [
            { id: 'E001', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [], registrationStatusCode: 'open' },
            { id: 'E002', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [], registrationStatusCode: 'open' }
          ]
        },
        {
          id: 'T002',
          name: 'Asian Speedcubing Cup 2026',
          description: 'Major regional speedcubing championship',
          location: 'GEM Center, Ho Chi Minh City',
          startDate: '2026-07-08T09:00:00Z',
          endDate: '2026-07-10T18:00:00Z',
          registrationOpenAt: '2026-06-01T00:00:00Z',
          registrationCloseAt: '2026-07-05T00:00:00Z',
          createdAt: '2026-05-15T12:00:00Z',
          createdBy: 'U002',
          createdByUserName: 'Tran Thi B',
          updatedAt: '2026-05-15T12:00:00Z',
          statusCode: 'registration_open',
          events: [
            { id: 'E003', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [], registrationStatusCode: 'open' }
          ]
        },
        {
          id: 'T003',
          name: 'Speed Run Showdown U18',
          description: 'Youth cubing tournament',
          location: 'Phu Dong Sports Center',
          startDate: '2026-08-03T09:00:00Z',
          endDate: '2026-08-03T18:00:00Z',
          registrationOpenAt: '2026-07-01T00:00:00Z',
          registrationCloseAt: '2026-08-01T00:00:00Z',
          createdAt: '2026-06-01T12:00:00Z',
          createdBy: 'U003',
          createdByUserName: 'Le Van C',
          updatedAt: '2026-06-01T12:00:00Z',
          statusCode: 'published',
          events: [
            { id: 'E004', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [], registrationStatusCode: 'open' }
          ]
        }
      ];
      setTournaments(mappedMocks);
      setError('Using mock data (Cannot connect to Backend)');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  // Stats from fetched data
  const stats = useMemo(() => {
    const total = tournaments.length;
    const ongoing = tournaments.filter((t) => (t.statusCode || '').toLowerCase() === 'ongoing').length;
    const upcoming = tournaments.filter(
      (t) => {
        const s = (t.statusCode || '').toLowerCase();
        return s === 'published' || s === 'registration_open';
      }
    ).length;
    const completed = tournaments.filter((t) => (t.statusCode || '').toLowerCase() === 'completed').length;
    return { total, ongoing, upcoming, completed };
  }, [tournaments]);

  // Filtered list
  const filtered = useMemo(() => {
    return tournaments.filter((t) => {
      const matchSearch =
        t.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.location ?? '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = activeFilter === 'all' || (t.statusCode || '').toLowerCase() === activeFilter;
      return matchSearch && matchStatus;
    });
  }, [tournaments, searchTerm, activeFilter]);

  const handleCreated = (newTournament: TournamentDetailDto) => {
    setTournaments((prev) => [newTournament, ...prev]);
    setShowCreateModal(false);
  };

  const statCards = [
    { label: 'Total Tournaments', value: stats.total, icon: Trophy, color: 'text-foreground', bg: 'bg-muted/50', border: 'border-border' },
    { label: 'Ongoing', value: stats.ongoing, icon: Zap, color: 'text-emerald-600', bg: 'bg-emerald-500/5', border: 'border-emerald-500/20' },
    { label: 'Upcoming / Open', value: stats.upcoming, icon: Calendar, color: 'text-sky-600', bg: 'bg-sky-500/5', border: 'border-sky-500/20' },
    { label: 'Completed', value: stats.completed, icon: CheckCircle, color: 'text-primary', bg: 'bg-primary/5', border: 'border-primary/20' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-primary/10 border border-primary/20 px-3 py-1 text-xs font-semibold text-primary flex items-center gap-1">
              <Sparkles className="h-3 w-3" /> Tournament Manager
            </span>
          </div>
          <h1 className="text-2xl font-black text-foreground tracking-tight sm:text-3xl uppercase">
            Tournament Dashboard
          </h1>
          <p className="text-sm text-muted-foreground">
            Create, manage and operate your offline speedcubing tournaments.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={fetchTournaments}
            disabled={isLoading}
            className="rounded-xl border border-border bg-card p-2.5 text-muted-foreground shadow-sm transition hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
            title="Refresh"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-primary hover:bg-primary/90 text-primary-foreground font-extrabold text-xs px-5 py-3 rounded-xl shadow-lg shadow-primary/10 transition-all border-none uppercase tracking-wider"
          >
            <Plus className="h-4 w-4" />
            Create Tournament
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          const Icon = card.icon;
          return (
            <div
              key={card.label}
              className={`rounded-2xl border ${card.border} ${card.bg} p-5 transition-all hover:shadow-md bg-card`}
            >
              <div className="flex items-center justify-between mb-3">
                <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${card.bg} border ${card.border}`}>
                  <Icon className={`h-5 w-5 ${card.color}`} />
                </div>
              </div>
              <p className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">{card.label}</p>
              <p className={`text-2xl font-black mt-1 ${card.color}`}>{card.value}</p>
            </div>
          );
        })}
      </div>

      {/* Error state */}
      {error && (
        <div className="flex items-center gap-3 rounded-2xl border border-red-500/20 bg-red-500/5 p-4 text-sm text-red-400">
          <AlertCircle className="h-5 w-5 shrink-0" />
          <div>
            <p className="font-bold">Connection Warning</p>
            <p className="text-red-400/80 text-xs">{error}</p>
          </div>
          <button
            onClick={fetchTournaments}
            className="ml-auto rounded-xl border border-red-500/20 px-4 py-2 text-xs font-bold hover:bg-red-500/10 transition"
          >
            Retry
          </button>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-4 bg-card/40 border border-border/60 p-4 rounded-2xl">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search by name or location..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-primary transition"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-4 py-2.5 rounded-xl text-[11px] font-bold border transition-all ${
                activeFilter === f.value
                  ? 'border-primary bg-primary/5 text-primary'
                  : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-border/80'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="overflow-hidden rounded-2xl border border-border bg-card shadow-sm">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-border/60 px-5 py-4 last:border-0">
              <div className="h-4 w-48 animate-pulse rounded bg-muted" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-muted" />
              <div className="h-4 w-32 animate-pulse rounded bg-muted" />
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-muted" />
            </div>
          ))}
        </div>
      )}

      {/* Tournament Table */}
      {!isLoading && <TournamentTable tournaments={filtered} />}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTourney) => {
            setShowCreateModal(false);
            const storedDraftsJson = localStorage.getItem('local_draft_tournaments');
            const storedDrafts = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
            if (!storedDrafts.includes(newTourney.id)) {
              localStorage.setItem('local_draft_tournaments', JSON.stringify([newTourney.id, ...storedDrafts]));
            }
            fetchTournaments();
          }}
        />
      )}
    </div>
  );
}
