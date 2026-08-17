'use client';

import { useState, useEffect, useCallback, use } from 'react';
import { useRouter } from 'next/navigation';
import {
  Trophy,
  Calendar,
  Clock,
  Sparkles,
  UserCheck,
  Play,
  CheckCircle,
  AlertTriangle,
  RefreshCw,
  Video,
  ShieldCheck,
  Medal,
  Award,
  ArrowLeft,
} from 'lucide-react';
import { Header } from '@/components/header';
import {
  getOnlineAsyncTournamentById,
  registerOnlineAsyncTournament,
  startOnlineAsyncAttempt,
  getAsyncLeaderboard,
  type OnlineAsyncTournamentDto,
  type AsyncLeaderboardEntryDto,
} from '@/lib/api/online-async';

interface Props {
  params: Promise<{ id: string }>;
}

export default function OnlineAsyncTournamentDetailPage({ params }: Props) {
  const { id: tournamentId } = use(params);
  const router = useRouter();

  const [tournament, setTournament] = useState<OnlineAsyncTournamentDto | null>(null);
  const [leaderboard, setLeaderboard] = useState<AsyncLeaderboardEntryDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isActionLoading, setIsActionLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMsg, setSuccessMsg] = useState<string | null>(null);

  const fetchData = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getOnlineAsyncTournamentById(tournamentId);
      setTournament(data);

      const lb = await getAsyncLeaderboard(tournamentId);
      setLeaderboard(lb);
    } catch (err: any) {
      setError(err?.message || 'Failed to load tournament info.');
    } finally {
      setIsLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const handleRegister = async () => {
    setIsActionLoading(true);
    setError(null);
    try {
      await registerOnlineAsyncTournament(tournamentId);
      setSuccessMsg('Successfully registered for tournament!');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Registration failed. Please try again.');
    } finally {
      setIsActionLoading(false);
    }
  };

  const handleStartAttempt = async () => {
    setIsActionLoading(true);
    setError(null);
    try {
      const resp = await startOnlineAsyncAttempt(tournamentId);
      router.push(`/tournaments/${tournamentId}/attempt/${resp.attemptId}`);
    } catch (err: any) {
      setError(err?.message || 'Failed to start attempt.');
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-orange-500 mx-auto mb-3" />
        <p className="text-sm font-semibold text-muted-foreground">Loading Online tournament details...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Tournament Not Found</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'Tournament does not exist or has been removed.'}</p>
      </div>
    );
  }

  const now = new Date();
  const regOpen = new Date(tournament.registrationOpenAt);
  const regClose = new Date(tournament.registrationCloseAt);
  const compStart = new Date(tournament.startDate);
  const compEnd = new Date(tournament.endDate);

  const isRegWindow = now >= regOpen && now <= regClose;
  const isCompWindow = now >= compStart && now <= compEnd;

  return (
    <div className="min-h-screen bg-background text-foreground pb-12">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 space-y-6 animate-fade-in">
        {/* Back Button */}
        <div className="flex items-center">
          <button
            onClick={() => router.push('/tournaments')}
            className="inline-flex items-center gap-2 text-xs font-bold text-muted-foreground hover:text-foreground transition bg-transparent border-none cursor-pointer p-0"
          >
            <ArrowLeft className="h-4 w-4" /> Back to Tournaments
          </button>
        </div>

        {/* Banner / Header Card */}
        <div className="relative overflow-hidden rounded-3xl bg-card text-foreground p-8 shadow-sm border border-border">
          {/* Soft background glow decoration */}
          <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-orange-500/5 blur-3xl pointer-events-none" />

          <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
            <div className="space-y-4 max-w-2xl">
              <div className="flex items-center gap-2">
                <span className="inline-flex items-center gap-1 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500">
                  <Sparkles className="h-3.5 w-3.5 text-orange-500" /> Online (AO1)
                </span>
                <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/10 px-3 py-1 text-xs font-bold text-amber-650 border border-amber-500/20">
                  Puzzle: {tournament.puzzleTypeName}
                </span>
              </div>

              <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-foreground">
                {tournament.name}
              </h1>
              <p className="text-sm text-muted-foreground leading-relaxed font-medium">
                {tournament.description || 'Official Asynchronous Online Speedcubing Tournament. Each competitor makes a single attempt.'}
              </p>

              <div className="flex flex-wrap gap-3 text-xs font-medium text-muted-foreground pt-2">
                <div className="flex items-center gap-1.5 bg-background px-3.5 py-2 rounded-xl border border-border">
                  <Calendar className="h-4 w-4 text-orange-500" />
                  <span>Registration: {regOpen.toLocaleDateString('en-US')} - {regClose.toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-background px-3.5 py-2 rounded-xl border border-border">
                  <Clock className="h-4 w-4 text-orange-500" />
                  <span>Competition: {compStart.toLocaleDateString('en-US')} - {compEnd.toLocaleDateString('en-US')}</span>
                </div>
                <div className="flex items-center gap-1.5 bg-background px-3.5 py-2 rounded-xl border border-border">
                  <ShieldCheck className="h-4 w-4 text-emerald-500" />
                  <span>Attempt Time Limit: {Math.round(tournament.attemptTimeLimitMs / 60000)} mins</span>
                </div>
              </div>
            </div>

            {/* Action Box */}
            <div className="flex flex-col items-center justify-center bg-background/50 backdrop-blur-md p-6 rounded-2xl border border-border text-center min-w-[260px] space-y-4 shadow-2xs">
              <p className="text-xs text-muted-foreground font-bold uppercase tracking-wider">Participation Status</p>

              {tournament.userAttemptId ? (
                <div className="space-y-3 w-full">
                  <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-600 bg-emerald-50 px-3 py-1 rounded-full border border-emerald-200 w-full justify-center">
                    <CheckCircle className="h-4 w-4 text-emerald-500" /> Attempt Completed
                  </div>
                  <button
                    onClick={() => router.push(`/tournaments/${tournamentId}/attempt/${tournament.userAttemptId}`)}
                    className="w-full text-xs font-bold bg-card text-foreground py-2.5 px-4 rounded-xl shadow-xs border border-border hover:bg-muted transition cursor-pointer"
                  >
                    View My Results
                  </button>
                </div>
              ) : isCompWindow && tournament.isRegistered ? (
                <button
                  onClick={handleStartAttempt}
                  disabled={isActionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm py-3 px-6 rounded-xl shadow-md transition-all cursor-pointer disabled:opacity-50 border-none"
                >
                  <Play className="h-4 w-4 fill-white" />
                  {isActionLoading ? 'Initializing...' : 'START ATTEMPT NOW'}
                </button>
              ) : isRegWindow && !tournament.isRegistered ? (
                <button
                  onClick={handleRegister}
                  disabled={isActionLoading}
                  className="w-full flex items-center justify-center gap-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-md transition cursor-pointer disabled:opacity-50 border-none shadow-orange-500/15"
                >
                  <UserCheck className="h-4 w-4" />
                  {isActionLoading ? 'Registering...' : 'Register Now'}
                </button>
              ) : tournament.isRegistered && !isCompWindow ? (
                <div className="text-xs text-amber-700 font-semibold bg-amber-50 p-2.5 rounded-xl border border-amber-200">
                  Registered. Waiting for competition window ({compStart.toLocaleString('en-US')})
                </div>
              ) : (
                <div className="text-xs text-muted-foreground font-medium bg-muted p-2.5 rounded-xl border border-border w-full">
                  {now < regOpen ? 'Registration not open yet' : 'Registration closed'}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Messages */}
        {successMsg && (
          <div className="rounded-2xl bg-emerald-50 p-4 text-xs font-semibold text-emerald-800 border border-emerald-200 flex items-center gap-2">
            <CheckCircle className="h-4 w-4 text-emerald-600" /> {successMsg}
          </div>
        )}
        {error && (
          <div className="rounded-2xl bg-red-50 p-4 text-xs font-semibold text-red-800 border border-red-200 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4 text-red-600" /> {error}
          </div>
        )}

        {/* Public Leaderboard */}
        <div className="bg-card rounded-3xl border border-border p-6 shadow-xs space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-xl font-extrabold text-foreground tracking-tight flex items-center gap-2">
                <Trophy className="h-5 w-5 text-amber-500" /> Final Leaderboard (AO1)
              </h2>
              <p className="text-xs text-muted-foreground mt-0.5">Ranked by solve time after penalties. Displays approved results reviewed by Admins.</p>
            </div>
            <button
              onClick={fetchData}
              className="flex items-center gap-1.5 text-xs font-semibold text-orange-500 bg-orange-500/10 px-3 py-1.5 rounded-lg hover:bg-orange-500/20 transition cursor-pointer border-none"
            >
              <RefreshCw className="h-3.5 w-3.5" /> Refresh Leaderboard
            </button>
          </div>

          {leaderboard.length === 0 ? (
            <div className="text-center py-12 bg-muted/30 rounded-2xl border border-dashed border-border">
              <Medal className="h-10 w-10 text-muted-foreground/30 mx-auto mb-2" />
              <p className="text-sm font-semibold text-foreground">No approved results yet</p>
              <p className="text-xs text-muted-foreground mt-1">Results will appear automatically after Admin reviews video recording.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead>
                  <tr className="border-b border-border text-muted-foreground/60 font-bold uppercase tracking-wider">
                    <th className="py-3 px-4">Rank</th>
                    <th className="py-3 px-4">Competitor</th>
                    <th className="py-3 px-4 text-right">Solve Time (Raw)</th>
                    <th className="py-3 px-4 text-center">Penalty</th>
                    <th className="py-3 px-4 text-right">Final Result</th>
                    <th className="py-3 px-4 text-center">Video Evidence</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border font-medium">
                  {leaderboard.map((entry) => (
                    <tr key={entry.attemptId} className="hover:bg-muted/30 transition">
                      <td className="py-3.5 px-4">
                        {entry.rank === 1 ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-800 font-black">1</span>
                        ) : entry.rank === 2 ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-muted text-foreground font-black border border-border">2</span>
                        ) : entry.rank === 3 ? (
                          <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-700/15 text-amber-900 font-black">3</span>
                        ) : (
                          <span className="text-muted-foreground font-bold px-2">#{entry.rank}</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 font-bold text-foreground">
                        {entry.userFullName}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono text-muted-foreground">
                        {entry.rawTimeMs ? `${(entry.rawTimeMs / 1000).toFixed(2)}s` : '-'}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {entry.penaltyCode === 'PLUS2' ? (
                          <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">+2s</span>
                        ) : entry.isDnf ? (
                          <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[11px]">DNF</span>
                        ) : (
                          <span className="text-muted-foreground/40">-</span>
                        )}
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-extrabold text-orange-500 text-sm">
                        {entry.displayResult}
                      </td>
                      <td className="py-3.5 px-4 text-center">
                        {entry.videoEvidenceUrl ? (
                          <a
                            href={entry.videoEvidenceUrl}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1 text-xs font-semibold text-orange-500 hover:text-orange-600"
                          >
                            <Video className="h-3.5 w-3.5" /> Recording
                          </a>
                        ) : (
                          <span className="text-muted-foreground/50 text-[11px]">Saved</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
