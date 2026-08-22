'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { CreateTournamentModal } from '@/components/tournament-manager/CreateTournamentModal';
import { getPublicTournaments, getTournamentById } from '@/lib/api/tournaments';
import type { TournamentDetailDto } from '@/lib/api/types';
import {
  Trophy,
  MapPin,
  Plus,
  RefreshCw,
  Calendar,
  Radio,
  ArrowRight,
  AlertTriangle,
} from 'lucide-react';

export function isOfflineManagerTournament(t: TournamentDetailDto): boolean {
  if (t.isOnlineAsync) return false;
  const nameLower = (t.name || '').toLowerCase();
  const descLower = (t.description || '').toLowerCase();
  if (nameLower.includes('async') || nameLower.includes('ao1') || nameLower.includes('a01') || nameLower.includes('online async')) return false;
  if (descLower.includes('async') || descLower.includes('ao1') || descLower.includes('bất đồng bộ')) return false;

  // Offline WCA tournaments MUST have a real location (hội trường) and be created by a Manager.
  // Unlocated system test items (e.g. 'test3', 'lll', 'zzz') are NOT Offline Manager tournaments.
  if (!t.location || t.location.trim() === '' || t.location === 'Hội trường chưa cập nhật') {
    return false;
  }

  return true;
}

export default function OfflineTournamentManagerPage() {
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [tournaments, setTournaments] = useState<TournamentDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showCreateModal, setShowCreateModal] = useState(false);

  const fetchOfflineTournaments = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const publicList = await getPublicTournaments().catch(() => []);
      
      // Load local draft tournaments created by Manager in this session
      const storedDraftsJson = localStorage.getItem('local_draft_tournaments');
      const storedDrafts: string[] = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
      const localOfflineDrafts: TournamentDetailDto[] = [];

      for (const id of storedDrafts) {
        if (!publicList.some((t) => t.id === id)) {
          try {
            const draft = await getTournamentById(id);
            if (isOfflineManagerTournament(draft)) {
              localOfflineDrafts.push(draft);
            }
          } catch {
            // Ignore if draft deleted
          }
        }
      }

      // Filter ONLY genuine Offline tournaments created by Managers with real locations
      const offlineOnly = [...localOfflineDrafts, ...publicList].filter(isOfflineManagerTournament);
      setTournaments(offlineOnly);
    } catch (err: any) {
      setError(err?.message || 'Failed to load offline tournaments.');
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchOfflineTournaments();
  }, [fetchOfflineTournaments]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-left">
      {/* Header Banner */}
      <div className="relative overflow-hidden rounded-3xl bg-slate-900 p-6 sm:p-8 text-white shadow-xl border border-slate-800">
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-2 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                <Trophy className="h-3.5 w-3.5 text-amber-400" /> Manager Workflow - Offline WCA Tournaments
              </span>
            </div>

            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white">
              {isAdmin ? 'Manager Offline Tournaments Overview' : 'Manage On-Site Offline Tournaments'}
            </h1>
            <p className="text-xs sm:text-sm text-slate-300 font-medium leading-relaxed">
              On-site tournament operations with Live Station control, WCA scramble group assignment, judge and runner dispatch, and big screen live displays.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-3 shrink-0">
            <button
              onClick={fetchOfflineTournaments}
              disabled={isLoading}
              className="p-3 rounded-2xl bg-slate-800 hover:bg-slate-700 text-slate-200 border border-slate-700 transition cursor-pointer disabled:opacity-50"
              title="Reload list"
            >
              <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            </button>
            {!isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="flex items-center gap-2 bg-amber-600 hover:bg-amber-700 text-white font-black text-xs px-5 py-3 rounded-2xl shadow-md transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Offline Tournament
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Connection Warning */}
      {error && (
        <div className="rounded-2xl bg-amber-50 p-4 text-xs font-semibold text-amber-800 border border-amber-200 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-amber-600 shrink-0" />
            <span>{error}</span>
          </div>
          <button
            onClick={fetchOfflineTournaments}
            className="px-3 py-1 bg-white border border-amber-300 rounded-lg text-amber-900 font-bold hover:bg-amber-100 transition cursor-pointer"
          >
            Retry
          </button>
        </div>
      )}

      {/* Tournaments Grid */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight flex items-center gap-2">
            <Trophy className="h-4 w-4 text-amber-500" /> Offline WCA Tournaments ({tournaments.length})
          </h2>
          <span className="text-xs font-bold text-slate-500">Live Station Control • Venue Events</span>
        </div>

        {isLoading ? (
          <div className="p-12 bg-white rounded-3xl border border-slate-200 text-center">
            <RefreshCw className="h-6 w-6 animate-spin text-amber-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-500">Loading offline tournaments...</p>
          </div>
        ) : tournaments.length === 0 ? (
          <div className="p-12 bg-white rounded-3xl border border-dashed border-slate-300 text-center space-y-3">
            <Trophy className="h-10 w-10 text-slate-300 mx-auto" />
            <p className="text-sm font-extrabold text-slate-800">No offline tournaments created yet</p>
            <p className="text-xs text-slate-500 max-w-md mx-auto">
              {!isAdmin
                ? 'Click "Create Offline Tournament" above to start your first on-site WCA event.'
                : 'No Manager has initialized an Offline WCA tournament in the system yet.'}
            </p>
            {!isAdmin && (
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 bg-amber-600 text-white font-extrabold text-xs px-5 py-2.5 rounded-xl shadow-md hover:bg-amber-700 transition cursor-pointer"
              >
                <Plus className="h-4 w-4" /> Create Offline Tournament Now
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {tournaments.map((tourney) => {
              const statusUpper = (tourney.statusCode || '').toUpperCase();
              const isOngoing = statusUpper === 'ONGOING';
              const isRegOpen = statusUpper === 'REGISTRATION_OPEN';

              return (
                <div
                  key={tourney.id}
                  className="bg-white rounded-3xl p-6 border border-slate-200 shadow-xs hover:shadow-md transition flex flex-col justify-between space-y-4"
                >
                  <div className="space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          isOngoing
                            ? 'bg-emerald-50 text-emerald-700 border-emerald-200'
                            : isRegOpen
                            ? 'bg-indigo-50 text-indigo-700 border-indigo-200'
                            : 'bg-slate-100 text-slate-600 border-slate-200'
                        }`}
                      >
                        {tourney.statusCode || 'PUBLISHED'}
                      </span>
                      <span className="text-[11px] font-extrabold text-amber-700 bg-amber-50 px-2.5 py-0.5 rounded-md">
                        {tourney.events?.length || 1} WCA Events
                      </span>
                    </div>

                    <div>
                      <h3 className="text-base font-extrabold text-slate-900 leading-snug">
                        {tourney.name}
                      </h3>
                      <p className="text-xs text-slate-500 line-clamp-2 mt-1 font-normal">
                        {tourney.description || 'On-site Speedcubing tournament created by Manager.'}
                      </p>
                    </div>

                    <div className="space-y-1.5 text-xs text-slate-600 bg-slate-50 p-3 rounded-2xl border border-slate-100 font-medium">
                      <div className="flex items-center gap-1.5">
                        <MapPin className="h-3.5 w-3.5 text-rose-500 shrink-0" />
                        <a
                          href={`https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(tourney.location || '')}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="truncate hover:text-indigo-600 hover:underline transition"
                          title="Xem trên Google Maps (Mở tab mới)"
                          onClick={(e) => e.stopPropagation()}
                        >
                          {tourney.location}
                        </a>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <Calendar className="h-3.5 w-3.5 text-indigo-600 shrink-0" />
                        <span>Dates: {new Date(tourney.startDate).toLocaleDateString()} - {new Date(tourney.endDate).toLocaleDateString()}</span>
                      </div>
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="pt-2 border-t border-slate-100 flex items-center justify-between gap-2">
                    <button
                      onClick={() => router.push(`/managertournaments/${tourney.id}/live`)}
                      className="flex-1 flex items-center justify-center gap-1.5 rounded-xl bg-emerald-600 text-white hover:bg-emerald-700 px-3 py-2.5 text-xs font-extrabold shadow-sm transition cursor-pointer"
                    >
                      <Radio className="h-3.5 w-3.5" /> Live Operations
                    </button>
                    <button
                      onClick={() => router.push(`/managertournaments/${tourney.id}`)}
                      className="flex-1 flex items-center justify-center gap-1 rounded-xl bg-slate-100 text-slate-800 hover:bg-slate-200 px-3 py-2.5 text-xs font-extrabold transition cursor-pointer"
                    >
                      Details <ArrowRight className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Create Tournament Modal */}
      {showCreateModal && !isAdmin && (
        <CreateTournamentModal
          onClose={() => setShowCreateModal(false)}
          onCreated={(newTourney) => {
            setShowCreateModal(false);
            if (newTourney?.id && typeof window !== 'undefined') {
              const storedDraftsJson = localStorage.getItem('local_draft_tournaments');
              const storedDrafts: string[] = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
              if (!storedDrafts.includes(newTourney.id)) {
                localStorage.setItem('local_draft_tournaments', JSON.stringify([newTourney.id, ...storedDrafts]));
              }
              localStorage.setItem('newly_created_tournament_id', newTourney.id);
              window.dispatchEvent(new CustomEvent('tournament-list-updated', { detail: newTourney }));
            }
            fetchOfflineTournaments();
          }}
        />
      )}
    </div>
  );
}
