'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { CreateOnlineAsyncTournamentModal } from '@/components/tournament-manager/CreateOnlineAsyncTournamentModal';
import { TournamentTable } from '@/components/tournament-manager/TournamentTable';
import { listOnlineAsyncTournaments } from '@/lib/api/online-async';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import { useAuth } from '@/contexts/auth-context';
import {
  Zap,
  Video,
  Plus,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  ShieldAlert,
  Loader2,
} from 'lucide-react';

export default function AdminAsyncTournamentsPage() {
  const router = useRouter();
  const { user, isAuthenticated, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [tournaments, setTournaments] = useState<TournamentDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  // Search & Status Filter
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  const fetchAsyncTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      // This endpoint filters TournamentType == ONLINE_ASYNC at the database layer.
      // Do not merge the public Offline tournament list into the Admin Async page.
      const asyncList = await listOnlineAsyncTournaments();

      const mappedAsync: TournamentDetailDto[] = asyncList.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        registrationOpenAt: t.registrationOpenAt,
        registrationCloseAt: t.registrationCloseAt,
        statusCode: (t.statusCode || 'ONGOING').toLowerCase() as TournamentStatusCode,
        createdBy: t.createdBy,
        createdByUserName: 'Admin',
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
        events: [],
        isOnlineAsync: true,
      }));

      setTournaments(mappedAsync);
    } catch (err: any) {
      setError(err?.message || 'Unable to load Online Async tournaments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/managertournaments');
      return;
    }
    if (isAdmin) {
      fetchAsyncTournaments();
    }
  }, [authLoading, isAdmin, router, fetchAsyncTournaments]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center mt-12 bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Access Denied</h2>
        <p className="text-sm text-slate-500">
          Only system administrators can manage and configure Online Async A01 tournaments.
        </p>
        <button
          onClick={() => router.push('/managertournaments')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
        >
          Back to Manager Portal
        </button>
      </div>
    );
  }

  // Filtered List
  const filteredTournaments = tournaments.filter((t) => {
    if (searchTerm.trim()) {
      const s = searchTerm.trim().toLowerCase();
      const nameMatch = (t.name || '').toLowerCase().includes(s);
      const descMatch = (t.description || '').toLowerCase().includes(s);
      if (!nameMatch && !descMatch) return false;
    }

    if (statusFilter !== 'ALL') {
      const st = (t.statusCode || '').toUpperCase();
      if (st !== statusFilter) return false;
    }

    return true;
  });

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                <Zap className="h-3.5 w-3.5 text-indigo-400" /> Admin Workflow - Async Online (A01)
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              Online Async Tournament Management (A01)
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              Admin operations for A01 tournaments: AI-assisted five-face cube scanning, 14-second hand-timer penalties, live recording, and R2 video evidence review.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchAsyncTournaments}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Refresh tournament list"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            <button
              onClick={() => router.push('/admin/a01-video-review')}
              className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs px-4 py-3 rounded-2xl shadow-md transition cursor-pointer"
            >
              <Video className="h-4 w-4" /> A01 Video Review Center
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs px-5 py-3 rounded-2xl shadow-md transition cursor-pointer"
            >
              <Plus className="h-4 w-4" /> Create Online Async A01
            </button>
          </div>
        </div>
      </div>

      {/* Error Notice */}
      {error && (
        <div className="rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-800 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchAsyncTournaments}
            className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold hover:bg-amber-100 transition cursor-pointer"
          >
            Try Again
          </button>
        </div>
      )}

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search Online Async tournaments by name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2.5 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        {/* Status Filter */}
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-slate-400 shrink-0" />
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3.5 py-2.5 text-xs font-bold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer focus:border-indigo-600 focus:bg-white transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="ONGOING">Ongoing</option>
            <option value="COMPLETED">Completed</option>
            <option value="REGISTRATION_OPEN">Registration Open</option>
            <option value="REGISTRATION_CLOSED">Registration Closed</option>
            <option value="PUBLISHED">Published</option>
            <option value="DRAFT">Draft</option>
            <option value="DISABLED">Disabled</option>
          </select>
        </div>
      </div>

      {/* Table Section */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Zap className="h-4 w-4 text-indigo-600" /> Online Async A01 Tournaments ({filteredTournaments.length})
          </h2>
          <span className="text-xs font-bold text-slate-500">A01 format • Full administrative control</span>
        </div>

        {isLoading ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-indigo-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading Online Async tournaments...</p>
          </div>
        ) : (
          <TournamentTable tournaments={filteredTournaments} onRefresh={fetchAsyncTournaments} />
        )}
      </div>

      {/* Create Async Tournament Modal */}
      {showCreateModal && (
        <CreateOnlineAsyncTournamentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            fetchAsyncTournaments();
          }}
        />
      )}
    </div>
  );
}
