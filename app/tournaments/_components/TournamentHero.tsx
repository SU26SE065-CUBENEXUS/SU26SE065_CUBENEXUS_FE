'use client';

import { Trophy, Users, Award, Radio } from 'lucide-react';

export function TournamentHero() {
  const stats = [
    {
      label: 'Active Tournaments',
      value: '12',
      change: '+3 this week',
      icon: Trophy,
      iconColor: 'text-amber-500',
      bgColor: 'bg-amber-500/10 border-amber-500/20',
    },
    {
      label: 'Registered Cubers',
      value: '6,420',
      change: '142 checking in today',
      icon: Users,
      iconColor: 'text-emerald-500',
      bgColor: 'bg-emerald-500/10 border-emerald-500/20',
    },
    {
      label: 'Total Prize Pools',
      value: '$82,500',
      change: 'Guaranteed payouts',
      icon: Award,
      iconColor: 'text-cyan-500',
      bgColor: 'bg-cyan-500/10 border-cyan-500/20',
    },
    {
      label: 'Live Judge Stations',
      value: '24/24',
      change: 'E-signatures ready',
      icon: Radio,
      iconColor: 'text-rose-500',
      bgColor: 'bg-rose-500/10 border-rose-500/20',
    },
  ];

  return (
    <div className="relative mb-12 overflow-hidden rounded-3xl border border-border bg-gradient-to-br from-card via-card to-accent/5 p-8 sm:p-10 shadow-lg">
      <div className="absolute -right-10 -top-10 h-40 w-40 rounded-full bg-accent/10 blur-3xl" />
      <div className="absolute -left-10 -bottom-10 h-40 w-40 rounded-full bg-primary/5 blur-3xl" />

      <div className="relative z-10 flex flex-col justify-between gap-6 lg:flex-row lg:items-end">
        <div className="max-w-3xl">
          <span className="inline-flex items-center gap-1.5 rounded-full bg-accent/15 px-3 py-1 text-xs font-semibold text-accent animate-pulse">
            <Radio className="h-3.5 w-3.5" />
            Offline Live Board Active
          </span>
          <h1 className="mt-4 text-balance text-4xl font-extrabold tracking-tight text-foreground sm:text-5xl">
            Offline Tournament Hub
          </h1>
          <p className="mt-4 text-lg leading-relaxed text-muted-foreground">
            A comprehensive, WCA-aligned digital scoresheet ecosystem. Configure Traditional or Medley multi-puzzle rounds, auto-generate scramble groups, scan check-in QR codes, input Stackmat timer results with +2/DNF penalties, and collect touchscreen e-signatures.
          </p>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="relative z-10 mt-10 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <div
              key={i}
              className={`rounded-2xl border p-5 transition-all duration-300 hover:-translate-y-1 hover:shadow-md ${stat.bgColor}`}
            >
              <div className="flex items-center justify-between">
                <span className="text-sm font-semibold text-muted-foreground">{stat.label}</span>
                <div className={`rounded-xl p-2 bg-background/50 border border-border/40 shadow-sm`}>
                  <Icon className={`h-5 w-5 ${stat.iconColor}`} />
                </div>
              </div>
              <div className="mt-4">
                <span className="text-3xl font-bold tracking-tight text-foreground">{stat.value}</span>
                <p className="mt-1 text-xs text-muted-foreground font-medium">{stat.change}</p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
