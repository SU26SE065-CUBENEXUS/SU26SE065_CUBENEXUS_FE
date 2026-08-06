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
            { id: 'E001', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] },
            { id: 'E002', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] }
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
            { id: 'E003', puzzleTypeId: '33333333-3333-3333-3333-333333333333', puzzleTypeCode: '333', puzzleTypeName: '3x3x3 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] }
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
            { id: 'E004', puzzleTypeId: '22222222-2222-2222-2222-222222222222', puzzleTypeCode: '222', puzzleTypeName: '2x2x2 Speedcubing', eventFormatCode: 'TRADITIONAL', solveCount: 5, medleyPuzzles: [] }
          ]
        }
      ];
      setTournaments(mappedMocks);
      setError('Đang sử dụng dữ liệu mẫu (Không kết nối được BE)');
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
    { label: 'Tổng số giải đấu', value: stats.total, color: 'text-slate-900', hint: 'Tất cả giải đấu' },
    { label: 'Đang diễn ra', value: stats.ongoing, color: 'text-emerald-600', hint: 'Live Operations' },
    { label: 'Sắp diễn ra / Mở đăng ký', value: stats.upcoming, color: 'text-indigo-600', hint: 'Nhận đăng ký' },
    { label: 'Đã hoàn thành', value: stats.completed, color: 'text-slate-500', hint: 'Đã kết thúc' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Quản Lý Giải Đấu
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Tournament Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Tạo, quản lý và điều hành các giải đấu Speedcubing trực tiếp.
          </p>
        </div>
        <div className="flex items-center gap-2.5 shrink-0">
          <button
            onClick={fetchTournaments}
            disabled={isLoading}
            className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 shadow-2xs transition hover:bg-slate-50 hover:text-slate-900 disabled:opacity-50 cursor-pointer"
            title="Tải lại dữ liệu"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
          <button
            onClick={() => setShowCreateModal(true)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs px-4 py-2.5 rounded-lg shadow-2xs transition-all border-none cursor-pointer"
          >
            <Plus className="h-4 w-4" />
            Tạo Giải Đấu
          </button>
        </div>
      </div>

      {/* Clean Stat Cards */}
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
        {statCards.map((card) => {
          return (
            <div
              key={card.label}
              className="rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all"
            >
              <p className="text-[11px] font-bold text-slate-400 uppercase tracking-wider">{card.label}</p>
              <div className="flex items-baseline justify-between mt-2">
                <p className={`text-3xl font-extrabold tracking-tight ${card.color}`}>{card.value}</p>
                <span className="text-[11px] text-slate-400 font-medium">{card.hint}</span>
              </div>
            </div>
          );
        })}
      </div>

      {/* Connection Warning */}
      {error && (
        <div className="flex items-center gap-3 rounded-xl border border-amber-200 bg-amber-50 p-4 text-xs text-amber-800">
          <AlertCircle className="h-4 w-4 shrink-0 text-amber-600" />
          <div className="flex-1">
            <p className="font-semibold text-amber-900">Chế độ offline / Dữ liệu mẫu</p>
            <p className="text-amber-700 text-[11px] mt-0.5">{error}</p>
          </div>
          <button
            onClick={fetchTournaments}
            className="rounded-lg border border-amber-300 bg-white px-3 py-1.5 text-xs font-semibold text-amber-900 hover:bg-amber-100 transition shadow-2xs cursor-pointer"
          >
            Thử lại
          </button>
        </div>
      )}

      {/* Filters + Search */}
      <div className="flex flex-col sm:flex-row gap-3 bg-white border border-slate-200 p-4 rounded-xl shadow-2xs items-center justify-between">
        <div className="relative flex-1 w-full max-w-sm">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm kiếm theo tên giải hoặc địa điểm..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-xs text-slate-800 placeholder-slate-400 outline-none focus:bg-white focus:border-indigo-600 transition"
          />
        </div>
        <div className="flex gap-1.5 flex-wrap w-full sm:w-auto">
          {STATUS_FILTERS.map((f) => (
            <button
              key={f.value}
              onClick={() => setActiveFilter(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold border transition-all cursor-pointer ${
                activeFilter === f.value
                  ? 'border-indigo-600 bg-indigo-600 text-white shadow-2xs font-bold'
                  : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50 hover:text-slate-900'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
      </div>

      {/* Loading skeleton */}
      {isLoading && (
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-zinc-950 shadow-xl">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-zinc-800/60 px-5 py-4 last:border-0">
              <div className="h-4 w-48 animate-pulse rounded bg-zinc-900" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-zinc-900" />
              <div className="h-4 w-32 animate-pulse rounded bg-zinc-900" />
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-zinc-900" />
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
