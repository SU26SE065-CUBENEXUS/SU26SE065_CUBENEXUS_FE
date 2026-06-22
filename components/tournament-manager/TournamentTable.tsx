import Link from 'next/link';
import type { TournamentDetailDto, TournamentStatusCode } from '@/lib/api/types';
import { StatusBadge } from './StatusBadge';
import { Settings, ChevronRight } from 'lucide-react';

interface TournamentTableProps {
  tournaments: TournamentDetailDto[];
}

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export function TournamentTable({ tournaments }: TournamentTableProps) {
  return (
    <div className="overflow-x-auto rounded-2xl border border-border bg-card shadow-sm">
      <table className="w-full text-sm text-left">
        <thead>
          <tr className="border-b border-border bg-muted/30">
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Tournament</th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Status</th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Date</th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Location</th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground">Events</th>
            <th className="px-5 py-3.5 text-xs font-semibold uppercase tracking-wider text-muted-foreground text-right">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-border">
          {tournaments.map((t) => (
            <tr key={t.id} className="hover:bg-muted/30 transition-colors">
              <td className="px-5 py-4">
                <p className="font-semibold text-foreground text-[13px]">{t.name}</p>
                {t.description && (
                  <p className="text-[11px] text-muted-foreground mt-0.5 line-clamp-1">{t.description}</p>
                )}
              </td>
              <td className="px-5 py-4">
                <StatusBadge status={t.statusCode as TournamentStatusCode} />
              </td>
              <td className="px-5 py-4 text-[13px] text-muted-foreground whitespace-nowrap">
                {formatDateRange(t.startDate, t.endDate)}
              </td>
              <td className="px-5 py-4 text-[13px] text-muted-foreground max-w-[180px]">
                <p className="line-clamp-2 leading-snug">{t.location ?? '—'}</p>
              </td>
              <td className="px-5 py-4">
                <div className="flex flex-wrap gap-1">
                  {t.events.slice(0, 3).map((e) => (
                    <span
                      key={e.id}
                      className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-foreground border border-border"
                    >
                      {e.puzzleTypeName || e.puzzleTypeCode}
                    </span>
                  ))}
                  {t.events.length > 3 && (
                    <span className="rounded-md bg-muted px-2 py-0.5 text-[10px] font-semibold text-muted-foreground border border-border">
                      +{t.events.length - 3}
                    </span>
                  )}
                </div>
              </td>
              <td className="px-5 py-4 text-right">
                <Link
                  href={`/managertournaments/${t.id}`}
                  className="inline-flex items-center gap-1 text-[12px] font-semibold text-primary hover:text-primary/80 transition-colors"
                >
                  <Settings className="h-3.5 w-3.5" />
                  Manage
                  <ChevronRight className="h-3.5 w-3.5" />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
      {tournaments.length === 0 && (
        <div className="py-16 text-center text-muted-foreground text-sm">No tournaments found.</div>
      )}
    </div>
  );
}
