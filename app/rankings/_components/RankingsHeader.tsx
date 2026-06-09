'use client';

import { ShieldCheck, Flame, Users, Calendar } from 'lucide-react';

export function RankingsHeader() {
  const stats = [
    { label: 'Active 1v1 Rooms', value: '184', icon: Flame, iconColor: 'text-orange-500' },
    { label: 'Total Matches Today', value: '2,482', icon: Users, iconColor: 'text-accent' },
    { label: 'Top Tier Elo', value: '2,950', icon: ShieldCheck, iconColor: 'text-emerald-500' },
  ];

  return (
    <div className="relative mb-12 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-accent/5 p-8 shadow-lg">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-center">
        <div>
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent">
            <Flame className="h-3.5 w-3.5 text-accent animate-pulse" />
            1v1 Arena Matches Live
          </span>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Global Leaderboards
          </h1>
          <p className="mt-4 max-w-2xl text-lg text-muted-foreground leading-relaxed">
            Track real-time rankings from our 1v1 Online Matchmaking Arena. View active competitor ratings, verified webcam streams (Anti-Cheat sync), smart timer outcomes, and complete match histories.
          </p>
        </div>

        {/* Small stats cards */}
        <div className="flex flex-wrap gap-4 lg:justify-end">
          {stats.map((stat, i) => {
            const Icon = stat.icon;
            return (
              <div key={i} className="flex items-center gap-3.5 rounded-2xl border border-border bg-background/50 px-5 py-3.5 shadow-sm">
                <div className="rounded-xl bg-muted p-2">
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
                <div>
                  <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{stat.label}</p>
                  <p className="text-xl font-bold text-foreground mt-0.5">{stat.value}</p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}
