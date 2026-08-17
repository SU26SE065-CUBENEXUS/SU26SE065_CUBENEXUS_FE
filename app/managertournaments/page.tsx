'use client';

import { useState, useMemo, useEffect, useCallback } from 'react';
import { TournamentTable } from '@/components/tournament-manager/TournamentTable';
import { CreateTournamentModal } from '@/components/tournament-manager/CreateTournamentModal';
import { getPublicTournaments, getTournamentById } from '@/lib/api/tournaments';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import {
  Search,
  Plus,
  RefreshCw,
  AlertCircle,
  Trophy,
} from 'lucide-react';

const STATUS_FILTERS: Array<{ label: string; value: TournamentStatusCode | 'all' }> = [
  { label: 'Tất cả trạng thái', value: 'all' },
  { label: 'Đang diễn ra (Live)', value: 'ongoing' },
  { label: 'Đang mở đăng ký', value: 'registration_open' },
  { label: 'Sắp diễn ra', value: 'published' },
  { label: 'Đang Check-in', value: 'checking_in' },
  { label: 'Đã hoàn thành', value: 'completed' },
  { label: 'Đã hủy', value: 'cancelled' },
];

export function isOfflineManagerTournament(t: TournamentDetailDto): boolean {
  if (t.isOnlineAsync || (t as any).tournamentType === 'ONLINE_ASYNC') return false;
  const nameLower = (t.name || '').toLowerCase();
  const descLower = (t.description || '').toLowerCase();
  if (nameLower.includes('async') || nameLower.includes('ao1') || nameLower.includes('a01') || nameLower.includes('online async')) return false;
  if (descLower.includes('async') || descLower.includes('ao1') || descLower.includes('bất đồng bộ')) return false;
  return true;
}

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
      const publicList = await getPublicTournaments().catch(() => []);
      
      // Load local draft tournaments created by Manager in this session
      const storedDraftsJson = typeof window !== 'undefined' ? localStorage.getItem('local_draft_tournaments') : null;
      const storedDrafts: string[] = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
      const drafts: TournamentDetailDto[] = [];
      
      for (const id of storedDrafts) {
        if (!publicList.some((t) => t.id === id)) {
           try {
              const draft = await getTournamentById(id);
              if (isOfflineManagerTournament(draft)) {
                drafts.push(draft);
              }
           } catch {
              // Ignore if draft deleted
           }
        }
      }
      
      const combined = [...drafts, ...publicList].filter(isOfflineManagerTournament);
      setTournaments(combined);
    } catch (err: any) {
      setError(err?.message || 'Không thể kết nối đến máy chủ BE.');
      setTournaments([]);
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
        (t.name || '').toLowerCase().includes(searchTerm.toLowerCase()) ||
        (t.location || '').toLowerCase().includes(searchTerm.toLowerCase());
      const matchStatus = activeFilter === 'all' || (t.statusCode || '').toLowerCase() === activeFilter;
      return matchSearch && matchStatus;
    });
  }, [tournaments, searchTerm, activeFilter]);

  const statCards = [
    { label: 'Tổng số giải đấu Offline', value: stats.total, color: 'text-slate-900', hint: 'Hội trường WCA' },
    { label: 'Đang diễn ra (Live)', value: stats.ongoing, color: 'text-emerald-600', hint: 'Live Operations' },
    { label: 'Sắp diễn ra / Mở đăng ký', value: stats.upcoming, color: 'text-indigo-600', hint: 'Nhận đăng ký' },
    { label: 'Đã hoàn thành', value: stats.completed, color: 'text-slate-500', hint: 'Đã kết thúc' },
  ];

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-left">
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
            Quản Lý Giải Đấu Offline WCA
          </p>
          <h1 className="text-2xl font-extrabold text-slate-900 tracking-tight sm:text-3xl">
            Tournament Dashboard
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 font-normal">
            Tạo, quản lý và điều hành các giải đấu Speedcubing trực tiếp tại hội trường.
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
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
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
            <p className="font-semibold text-amber-900">Thông báo kết nối Backend</p>
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
        <div className="flex gap-1.5 overflow-x-auto w-full sm:w-auto pb-1 sm:pb-0 scrollbar-none whitespace-nowrap">
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
        <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-2xs">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-b border-slate-100 px-5 py-4 last:border-0">
              <div className="h-4 w-48 animate-pulse rounded bg-slate-100" />
              <div className="h-5 w-24 animate-pulse rounded-full bg-slate-100" />
              <div className="h-4 w-32 animate-pulse rounded bg-slate-100" />
              <div className="ml-auto h-4 w-16 animate-pulse rounded bg-slate-100" />
            </div>
          ))}
        </div>
      )}

      {/* Tournament Table */}
      {!isLoading && <TournamentTable tournaments={filtered} onRefresh={fetchTournaments} />}

      {/* Create Tournament Modal */}
      {showCreateModal && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTourney) => {
            setShowCreateModal(false);
            const storedDraftsJson = typeof window !== 'undefined' ? localStorage.getItem('local_draft_tournaments') : null;
            const storedDrafts: string[] = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
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
