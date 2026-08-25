'use client';

import { useEffect, useState, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/contexts/auth-context';
import { getTournamentById } from '@/lib/api/tournaments';
import { getOnlineAsyncTournamentById } from '@/lib/api/online-async';
import {
  getAdminTournaments,
  updateAdminTournamentStatus,
  forceStartOnlineAsyncTournament,
  closeOnlineAsyncRegistration,
  type AdminTournamentDto,
} from '@/features/admin/api/adminTournamentApi';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import {
  Trophy,
  ArrowLeft,
  Calendar,
  MapPin,
  Users,
  ShieldCheck,
  Zap,
  Play,
  Lock,
  Unlock,
  Power,
  RefreshCw,
  Video,
  Layers,
  Settings,
  UserCheck,
  ShieldAlert,
  Loader2,
  CheckCircle2,
  Clock,
  Send,
} from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function AdminTournamentDetailPage({ params }: Props) {
  const { id } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  const [tournament, setTournament] = useState<any | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [actionLoading, setActionLoading] = useState(false);
  const [successToast, setSuccessToast] = useState<string | null>(null);

  const showToast = (text: string) => {
    setSuccessToast(text);
    setTimeout(() => setSuccessToast(null), 4000);
  };

  const fetchDetails = async () => {
    setIsLoading(true);
    setError(null);
    try {
      let data: any = null;
      try {
        data = await getTournamentById(id);
      } catch {
        data = await getOnlineAsyncTournamentById(id);
      }

      // If it's an online async tournament and puzzleTypeName is missing, fetch async detail
      if (data && (data.isOnlineAsync || data.tournamentType === 'ONLINE_ASYNC') && !data.puzzleTypeName) {
        try {
          const asyncData = await getOnlineAsyncTournamentById(id);
          data = { ...data, ...asyncData };
        } catch {
          // ignore
        }
      }

      setTournament(data);
    } catch (err: any) {
      setError(err?.message || 'Unable to load tournament information from the server.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && !isAdmin) {
      router.push('/managertournaments');
      return;
    }
    if (isAdmin) {
      fetchDetails();
    }
  }, [authLoading, isAdmin, id, router]);

  const handleUpdateStatus = async (nextStatus: string, label: string) => {
    if (!tournament) return;
    if (!window.confirm(`Are you sure you want to change this tournament to "${label}"?`)) return;

    setActionLoading(true);
    try {
      await updateAdminTournamentStatus(tournament.id, nextStatus);
      showToast(`Tournament status changed to: ${label}`);
      await fetchDetails();
    } catch (err: any) {
      alert(err?.message || 'Unable to update tournament status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleForceStart = async () => {
    if (!tournament) return;
    if (!window.confirm('Force start this tournament now? Its status will change to ONGOING and registration will close.')) return;

    setActionLoading(true);
    try {
      await forceStartOnlineAsyncTournament(tournament.id);
      showToast('Tournament started successfully.');
      await fetchDetails();
    } catch (err: any) {
      alert(err?.message || 'Unable to start the tournament.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleCloseReg = async () => {
    if (!tournament) return;
    if (!window.confirm('Close registration for this tournament now?')) return;

    setActionLoading(true);
    try {
      await closeOnlineAsyncRegistration(tournament.id);
      showToast('Tournament registration closed.');
      await fetchDetails();
    } catch (err: any) {
      alert(err?.message || 'Unable to close registration.');
    } finally {
      setActionLoading(false);
    }
  };

  if (authLoading || isLoading) {
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
          Only system administrators can access this tournament administration page.
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

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-2xl p-8 text-center mt-12 bg-white rounded-3xl border border-slate-200 shadow-sm space-y-4">
        <h2 className="text-lg font-bold text-slate-900">Unable to Load Tournament</h2>
        <p className="text-xs text-rose-600 font-semibold">{error || 'Tournament not found'}</p>
        <div className="flex justify-center gap-3">
          <button
            onClick={() => router.push('/admin/tournaments/async')}
            className="px-4 py-2 bg-slate-100 text-slate-800 rounded-xl text-xs font-bold"
          >
            Back to Tournament List
          </button>
          <button
            onClick={fetchDetails}
            className="px-4 py-2 bg-indigo-600 text-white rounded-xl text-xs font-bold"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  const isOnlineAsync =
    tournament.tournamentType === 'ONLINE_ASYNC' ||
    tournament.isOnlineAsync ||
    Boolean(tournament.puzzleTypeName) ||
    Boolean(tournament.puzzleTypeId) ||
    (tournament.name || '').toLowerCase().includes('async') ||
    (tournament.name || '').toLowerCase().includes('a01');
  const status = (tournament.statusCode || 'DRAFT').toUpperCase();

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 space-y-6 text-left">
      {/* Toast Alert */}
      {successToast && (
        <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2 animate-in fade-in">
          <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          <span>{successToast}</span>
        </div>
      )}

      {/* Top Header Navigation */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <button
            onClick={() => router.push('/admin/tournaments/async')}
            className="inline-flex items-center gap-1.5 text-xs font-bold text-indigo-600 hover:text-indigo-800 transition mb-1 cursor-pointer"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Async Online (A01)
          </button>
          <div className="flex items-center gap-2">
            <h1 className="text-2xl font-black text-slate-900 tracking-tight">{tournament.name}</h1>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-200">
              Admin View
            </span>
          </div>
          <p className="text-xs text-slate-500 font-medium">
            System ID: <span className="font-sans font-medium text-slate-700">{tournament.id}</span>
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={fetchDetails}
            disabled={actionLoading}
            className="p-2.5 rounded-xl border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
            title="Refresh information"
          >
            <RefreshCw className={`h-4 w-4 ${actionLoading ? 'animate-spin' : ''}`} />
          </button>

          {isOnlineAsync && (
            <Link
              href={`/admin/tournaments/${tournament.id}/review`}
              className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs transition shadow-md cursor-pointer"
            >
              <Video className="h-4 w-4" /> Review A01 Videos
            </Link>
          )}

          <a
            href={`/tournaments/${tournament.id}`}
            target="_blank"
            rel="noreferrer"
            className="inline-flex items-center gap-1.5 px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-bold text-xs transition cursor-pointer"
            title="Open the public player-facing page"
          >
            View Public Portal ↗
          </a>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left 2 Cols: Detailed Parameters */}
        <div className="lg:col-span-2 space-y-6">
          {/* Overview Card */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-5">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="h-4 w-4 text-indigo-600" /> Tournament Information & Technical Configuration
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Tournament Type</span>
                <p className="font-extrabold text-slate-900">
                  {isOnlineAsync ? 'Online Asynchronous (A01 Format)' : 'Offline WCA In-Person Tournament'}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Current Status</span>
                <p className="font-extrabold text-indigo-600 uppercase">{status}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Start and End Time</span>
                <p className="font-semibold text-slate-800">{formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Registration Window</span>
                <p className="font-semibold text-slate-800">
                  {formatDate(tournament.registrationOpenAt)} – {formatDate(tournament.registrationCloseAt)}
                </p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Location</span>
                <p className="font-semibold text-slate-800">{tournament.location || 'Online Server Arena'}</p>
              </div>

              <div className="p-3.5 rounded-2xl bg-slate-50 border border-slate-100 space-y-1">
                <span className="text-slate-400 font-bold text-[10px] uppercase">Created By</span>
                <p className="font-semibold text-slate-800">{tournament.createdByUserName || 'Admin System'}</p>
              </div>
            </div>

            {tournament.description && (
              <div className="space-y-1.5 pt-2 border-t border-slate-100">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Tournament Description</span>
                <p className="text-xs text-slate-600 leading-relaxed bg-slate-50/50 p-3 rounded-xl border border-slate-100">
                  {tournament.description}
                </p>
              </div>
            )}
          </div>

          {/* Events / Format Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Layers className="h-4 w-4 text-indigo-600" /> Events & Puzzle Formats
            </h2>

            {isOnlineAsync ? (
              <div className="p-4 rounded-2xl bg-indigo-50/60 border border-indigo-100 space-y-3">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-black text-indigo-900">
                    {tournament.puzzleTypeName || '3x3x3 Cube'} (A01 Single Solve)
                  </span>
                  <span className="px-2.5 py-1 rounded-md bg-indigo-200/80 text-indigo-800 text-[10px] font-bold uppercase">
                    A01 Format
                  </span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-xs text-indigo-950 font-medium">
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Puzzle Type</span>
                    <span className="font-bold">{tournament.puzzleTypeName || 'Rubik'}</span>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-indigo-100">
                    <span className="text-[10px] text-slate-400 font-bold block uppercase">Attempt Time Limit</span>
                    <span className="font-bold font-mono">
                      {tournament.attemptTimeLimitMs ? `${tournament.attemptTimeLimitMs / 1000}s` : '300s (5 minutes)'}
                    </span>
                  </div>
                </div>
              </div>
            ) : tournament.events && tournament.events.length > 0 ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {tournament.events.map((ev: any) => (
                  <div key={ev.id} className="p-3 rounded-2xl bg-slate-50 border border-slate-200/70 flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{formatEventLabel(ev)}</span>
                    <span className="text-[10px] font-semibold text-slate-500">{ev.rounds?.length || 1} Round(s)</span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="p-6 text-center text-xs text-slate-400 font-semibold bg-slate-50 rounded-2xl">
                No tournament events have been configured.
              </div>
            )}
          </div>
        </div>

        {/* Right Col: Admin Controls */}
        <div className="space-y-6">
          {/* Fast Action Panel */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200 shadow-2xs space-y-4">
            <h2 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <Zap className="h-4 w-4 text-amber-500" /> Admin Controls
            </h2>
            <p className="text-xs text-slate-500 font-medium">
              System-level actions that directly control the tournament lifecycle.
            </p>

            <div className="space-y-2 pt-2">
              {/* Force Start */}
              <button
                onClick={handleForceStart}
                disabled={actionLoading || status === 'ONGOING' || status === 'COMPLETED'}
                className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs transition shadow-md disabled:opacity-40 cursor-pointer"
              >
                <Play className="h-3.5 w-3.5 fill-current" /> Force Start
              </button>

              {/* Open Registration */}
              <button
                onClick={() => handleUpdateStatus('REGISTRATION_OPEN', 'Registration Open')}
                disabled={actionLoading || status === 'REGISTRATION_OPEN' || status === 'ONGOING' || status === 'COMPLETED'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-emerald-600 hover:bg-emerald-700 text-white font-extrabold text-xs transition shadow-2xs disabled:opacity-40 cursor-pointer"
              >
                <Unlock className="h-3.5 w-3.5" /> Open Registration
              </button>

              {/* Close Registration */}
              <button
                onClick={handleCloseReg}
                disabled={actionLoading || status === 'REGISTRATION_CLOSED' || status === 'COMPLETED'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-amber-300 bg-amber-50 hover:bg-amber-100 text-amber-900 font-extrabold text-xs transition disabled:opacity-40 cursor-pointer"
              >
                <Lock className="h-3.5 w-3.5 text-amber-700" /> Close Registration
              </button>

              {/* Complete Tournament */}
              <button
                onClick={() => handleUpdateStatus('COMPLETED', 'Completed')}
                disabled={actionLoading || status === 'COMPLETED'}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs transition disabled:opacity-40 cursor-pointer"
              >
                <CheckCircle2 className="h-3.5 w-3.5" /> Complete Tournament
              </button>

              {/* Disable / Enable Toggle */}
              <button
                onClick={() => handleUpdateStatus(status === 'DISABLED' ? 'PUBLISHED' : 'DISABLED', status === 'DISABLED' ? 'Reactivated' : 'Disabled')}
                disabled={actionLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 px-4 rounded-2xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-extrabold text-xs transition cursor-pointer"
              >
                <Power className="h-3.5 w-3.5" /> {status === 'DISABLED' ? 'Reactivate Tournament' : 'Disable Tournament'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
