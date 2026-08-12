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
} from 'lucide-react';
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
      setError(err?.message || 'Không thể tải thông tin giải đấu.');
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
      setSuccessMsg('Đăng ký tham gia giải đấu thành công!');
      fetchData();
    } catch (err: any) {
      setError(err?.message || 'Đăng ký không thành công. Vui lòng thử lại.');
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
      setError(err?.message || 'Không thể bắt đầu attempt.');
      setIsActionLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <RefreshCw className="h-8 w-8 animate-spin text-indigo-600 mx-auto mb-3" />
        <p className="text-sm font-semibold text-slate-600">Đang tải thông tin giải đấu Online...</p>
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-16 text-center">
        <AlertTriangle className="h-12 w-12 text-amber-500 mx-auto mb-3" />
        <h2 className="text-xl font-bold text-slate-800">Không tìm thấy giải đấu</h2>
        <p className="text-sm text-slate-500 mt-1">{error || 'Giải đấu không tồn tại hoặc đã bị gỡ.'}</p>
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
    <div className="mx-auto max-w-6xl px-4 py-8 space-y-8">
      {/* Banner / Header Card */}
      <div className="relative overflow-hidden rounded-3xl bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 text-white p-8 shadow-xl border border-indigo-900/50">
        <div className="absolute right-0 top-0 -mr-16 -mt-16 h-64 w-64 rounded-full bg-indigo-500/10 blur-3xl" />

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="space-y-3 max-w-2xl">
            <div className="flex items-center gap-2">
              <span className="inline-flex items-center gap-1 rounded-full bg-indigo-500/20 px-3 py-1 text-xs font-bold text-indigo-300 border border-indigo-500/30">
                <Sparkles className="h-3.5 w-3.5" /> Asynchronous Online (AO1)
              </span>
              <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/20 px-3 py-1 text-xs font-bold text-amber-300 border border-amber-500/30">
                Puzzle: {tournament.puzzleTypeName}
              </span>
            </div>

            <h1 className="text-3xl font-extrabold tracking-tight sm:text-4xl text-white">
              {tournament.name}
            </h1>
            <p className="text-sm text-slate-300 leading-relaxed font-normal">
              {tournament.description || 'Giải đấu Asynchronous Online Speedcubing chính thức. Mỗi thí sinh thực hiện 1 attempt duy nhất.'}
            </p>

            <div className="flex flex-wrap gap-4 text-xs font-medium text-slate-300 pt-2">
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Calendar className="h-4 w-4 text-indigo-400" />
                <span>Đăng ký: {regOpen.toLocaleDateString()} - {regClose.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <Clock className="h-4 w-4 text-indigo-400" />
                <span>Thi đấu: {compStart.toLocaleDateString()} - {compEnd.toLocaleDateString()}</span>
              </div>
              <div className="flex items-center gap-1.5 bg-slate-800/80 px-3 py-1.5 rounded-lg border border-slate-700">
                <ShieldCheck className="h-4 w-4 text-emerald-400" />
                <span>Attempt Time Limit: {Math.round(tournament.attemptTimeLimitMs / 60000)} phút</span>
              </div>
            </div>
          </div>

          {/* Action Box */}
          <div className="flex flex-col items-center justify-center bg-white/10 backdrop-blur-md p-6 rounded-2xl border border-white/20 text-center min-w-[260px] space-y-3">
            <p className="text-xs text-indigo-200 font-bold uppercase tracking-wider">Trạng thái tham gia</p>

            {tournament.userAttemptId ? (
              <div className="space-y-2">
                <div className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-400 bg-emerald-500/20 px-3 py-1 rounded-full border border-emerald-500/30">
                  <CheckCircle className="h-4 w-4" /> Đã hoàn thành Attempt
                </div>
                <button
                  onClick={() => router.push(`/tournaments/${tournamentId}/attempt/${tournament.userAttemptId}`)}
                  className="w-full text-xs font-bold bg-white text-slate-900 py-2.5 px-4 rounded-xl shadow-md hover:bg-slate-100 transition cursor-pointer"
                >
                  Xem Kết Quả Của Tôi
                </button>
              </div>
            ) : isCompWindow && tournament.isRegistered ? (
              <button
                onClick={handleStartAttempt}
                disabled={isActionLoading}
                className="w-full flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white font-extrabold text-sm py-3 px-6 rounded-xl shadow-lg transition-all transform active:scale-98 cursor-pointer disabled:opacity-50"
              >
                <Play className="h-4 w-4 fill-white" />
                {isActionLoading ? 'Đang khởi tạo...' : 'VÀO THI NGAY (START ATTEMPT)'}
              </button>
            ) : isRegWindow && !tournament.isRegistered ? (
              <button
                onClick={handleRegister}
                disabled={isActionLoading}
                className="w-full flex items-center justify-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-sm py-3 px-6 rounded-xl shadow-lg transition cursor-pointer disabled:opacity-50"
              >
                <UserCheck className="h-4 w-4" />
                {isActionLoading ? 'Đang ký...' : 'Đăng Ký Tham Gia'}
              </button>
            ) : tournament.isRegistered && !isCompWindow ? (
              <div className="text-xs text-amber-300 font-semibold bg-amber-500/20 p-2.5 rounded-xl border border-amber-500/30">
                Đã đăng ký. Chờ đến khung giờ thi đấu ({compStart.toLocaleString()})
              </div>
            ) : (
              <div className="text-xs text-slate-300 font-medium">
                {now < regOpen ? 'Chưa tới thời gian mở đăng ký' : 'Cổng đăng ký đã đóng'}
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
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-xs space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-500" /> Final Leaderboard (AO1)
            </h2>
            <p className="text-xs text-slate-500 mt-0.5">Xếp hạng theo thời gian giải sau phạt. Chỉ hiển thị kết quả đã qua Admin Review (APPROVED).</p>
          </div>
          <button
            onClick={fetchData}
            className="flex items-center gap-1.5 text-xs font-semibold text-indigo-600 bg-indigo-50 px-3 py-1.5 rounded-lg hover:bg-indigo-100 transition cursor-pointer"
          >
            <RefreshCw className="h-3.5 w-3.5" /> Tải lại Bảng xếp hạng
          </button>
        </div>

        {leaderboard.length === 0 ? (
          <div className="text-center py-12 bg-slate-50 rounded-2xl border border-dashed border-slate-200">
            <Medal className="h-10 w-10 text-slate-400 mx-auto mb-2" />
            <p className="text-sm font-semibold text-slate-700">Chưa có kết quả được duyệt</p>
            <p className="text-xs text-slate-500 mt-1">Kết quả sẽ tự động xuất hiện sau khi Admin review video recording.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-bold uppercase tracking-wider">
                  <th className="py-3 px-4">Rank</th>
                  <th className="py-3 px-4">Thí sinh</th>
                  <th className="py-3 px-4 text-right">Thời gian Solve (Raw)</th>
                  <th className="py-3 px-4 text-center">Phạt (Penalty)</th>
                  <th className="py-3 px-4 text-right">Kết Quả Cuối (Final)</th>
                  <th className="py-3 px-4 text-center">Video Evidence</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 font-medium">
                {leaderboard.map((entry) => (
                  <tr key={entry.attemptId} className="hover:bg-slate-50 transition">
                    <td className="py-3.5 px-4">
                      {entry.rank === 1 ? (
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-100 text-amber-800 font-black">1</span>
                      ) : entry.rank === 2 ? (
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-slate-200 text-slate-800 font-black">2</span>
                      ) : entry.rank === 3 ? (
                        <span className="inline-flex items-center justify-center h-7 w-7 rounded-full bg-amber-700/15 text-amber-900 font-black">3</span>
                      ) : (
                        <span className="text-slate-500 font-bold px-2">#{entry.rank}</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {entry.userFullName}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-slate-700">
                      {entry.rawTimeMs ? `${(entry.rawTimeMs / 1000).toFixed(2)}s` : '-'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {entry.penaltyCode === 'PLUS2' ? (
                        <span className="px-2 py-0.5 rounded bg-amber-100 text-amber-800 font-bold text-[11px]">+2s</span>
                      ) : entry.isDnf ? (
                        <span className="px-2 py-0.5 rounded bg-red-100 text-red-800 font-bold text-[11px]">DNF</span>
                      ) : (
                        <span className="text-slate-400">-</span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono font-extrabold text-indigo-600 text-sm">
                      {entry.displayResult}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {entry.videoEvidenceUrl ? (
                        <a
                          href={entry.videoEvidenceUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800"
                        >
                          <Video className="h-3.5 w-3.5" /> Recording
                        </a>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Saved</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
