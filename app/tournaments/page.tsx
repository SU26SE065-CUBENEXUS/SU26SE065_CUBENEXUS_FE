'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { CalendarDays, ChevronRight, Clock3, Loader2, Search, Trophy, Users } from 'lucide-react';
import { Header } from '@/components/header';
import { listOnlineAsyncTournaments, type OnlineAsyncTournamentDto } from '@/lib/api/online-async';

const statusLabels: Record<string, string> = {
  PUBLISHED: 'Sắp mở đăng ký',
  REGISTRATION_OPEN: 'Đang mở đăng ký',
  REGISTRATION_CLOSED: 'Đã đóng đăng ký',
  ONGOING: 'Đang diễn ra',
  COMPLETED: 'Đã kết thúc',
  DISABLED: 'Tạm ngưng',
  CANCELLED: 'Đã hủy',
};

const statusStyles: Record<string, string> = {
  PUBLISHED: 'bg-sky-50 text-sky-700 ring-sky-200',
  REGISTRATION_OPEN: 'bg-emerald-50 text-emerald-700 ring-emerald-200',
  REGISTRATION_CLOSED: 'bg-amber-50 text-amber-700 ring-amber-200',
  ONGOING: 'bg-violet-50 text-violet-700 ring-violet-200',
  COMPLETED: 'bg-slate-100 text-slate-600 ring-slate-200',
  DISABLED: 'bg-rose-50 text-rose-700 ring-rose-200',
  CANCELLED: 'bg-rose-50 text-rose-700 ring-rose-200',
};

function formatDate(value: string) {
  return new Intl.DateTimeFormat('vi-VN', {
    day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit',
  }).format(new Date(value));
}

export default function OnlineAsyncTournamentsPage() {
  const [tournaments, setTournaments] = useState<OnlineAsyncTournamentDto[]>([]);
  const [search, setSearch] = useState('');
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let active = true;
    listOnlineAsyncTournaments()
      .then((items) => active && setTournaments(items))
      .catch((err: Error) => active && setError(err.message || 'Không thể tải danh sách giải đấu.'))
      .finally(() => active && setIsLoading(false));
    return () => { active = false; };
  }, []);

  const filtered = useMemo(() => {
    const term = search.trim().toLocaleLowerCase('vi-VN');
    if (!term) return tournaments;
    return tournaments.filter((tournament) =>
      [tournament.name, tournament.description, tournament.puzzleTypeName, tournament.statusCode]
        .filter(Boolean)
        .some((value) => value!.toLocaleLowerCase('vi-VN').includes(term)),
    );
  }, [search, tournaments]);

  return (
    <div className="min-h-screen bg-background text-foreground">
      <Header />
      <main className="mx-auto max-w-6xl px-4 py-10 sm:px-6">
        <section className="rounded-3xl border border-border bg-card px-6 py-8 shadow-sm sm:px-8">
          <div className="flex flex-col gap-6 sm:flex-row sm:items-end sm:justify-between">
            <div className="max-w-2xl">
              <span className="inline-flex items-center gap-1.5 rounded-full bg-orange-500/10 px-3 py-1 text-xs font-bold text-orange-500">
                <Trophy className="h-3.5 w-3.5 text-orange-500" /> Online Asynchronous
              </span>
              <h1 className="mt-4 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">Giải đấu Online A01</h1>
              <p className="mt-3 text-sm leading-6 text-muted-foreground">Mỗi giải chỉ có một puzzle, một scramble chung và một attempt cho mỗi thí sinh.</p>
            </div>
            <div className="w-full sm:w-80">
              <label className="sr-only" htmlFor="tournament-search">Tìm giải đấu</label>
              <div className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-2.5 shadow-xs focus-within:border-orange-500 focus-within:ring-2 focus-within:ring-orange-500/20">
                <Search className="h-4 w-4 text-muted-foreground" />
                <input id="tournament-search" value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Tìm tên giải, puzzle..." className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground/60 text-foreground" />
              </div>
            </div>
          </div>
        </section>

        <section className="mt-7">
          {isLoading ? (
            <div className="flex min-h-52 items-center justify-center rounded-3xl border border-border bg-card"><Loader2 className="h-6 w-6 animate-spin text-orange-500" /></div>
          ) : error ? (
            <div className="rounded-2xl border border-rose-200 bg-rose-50 p-5 text-sm text-rose-700">{error}</div>
          ) : filtered.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-border bg-card py-16 text-center"><Trophy className="mx-auto h-9 w-9 text-muted-foreground/30" /><p className="mt-3 text-sm font-semibold text-muted-foreground">Chưa có giải A01 phù hợp.</p></div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2 xl:grid-cols-3">
              {filtered.map((tournament) => {
                const status = tournament.statusCode.toUpperCase();
                return <article key={tournament.id} className="flex flex-col rounded-2xl border border-border bg-card p-5 shadow-sm transition hover:-translate-y-0.5 hover:border-orange-500/50 hover:shadow-md">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0"><p className="text-xs font-bold uppercase tracking-wider text-orange-500">{tournament.puzzleTypeName || 'Puzzle'} · AO1</p><h2 className="mt-1 truncate text-lg font-bold text-foreground">{tournament.name}</h2></div>
                    <span className={`shrink-0 rounded-full px-2.5 py-1 text-[11px] font-bold ring-1 ${statusStyles[status] || statusStyles.COMPLETED}`}>{statusLabels[status] || status}</span>
                  </div>
                  <p className="mt-3 min-h-10 text-sm leading-5 text-muted-foreground">{tournament.description || 'Giải speedcubing trực tuyến, kết quả được duyệt sau khi nộp attempt.'}</p>
                  <div className="mt-5 space-y-2.5 border-t border-border pt-4 text-xs text-muted-foreground">
                    <p className="flex gap-2"><CalendarDays className="h-4 w-4 shrink-0 text-orange-500" /><span>Đăng ký: {formatDate(tournament.registrationOpenAt)} – {formatDate(tournament.registrationCloseAt)}</span></p>
                    <p className="flex gap-2"><Clock3 className="h-4 w-4 shrink-0 text-orange-500" /><span>Thi đấu: {formatDate(tournament.startDate)} – {formatDate(tournament.endDate)}</span></p>
                    <p className="flex gap-2"><Users className="h-4 w-4 shrink-0 text-orange-500" /><span>1 attempt · giới hạn {Math.round(tournament.attemptTimeLimitMs / 60000)} phút</span></p>
                  </div>
                  <Link href={`/tournaments/${tournament.id}`} className="mt-5 inline-flex items-center justify-center gap-1.5 rounded-xl bg-orange-500 hover:bg-orange-600 px-4 py-2.5 text-sm font-bold text-white transition">Xem giải & đăng ký <ChevronRight className="h-4 w-4" /></Link>
                </article>;
              })}
            </div>
          )}
        </section>
      </main>
    </div>
  );
}
