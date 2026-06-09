'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Trophy, QrCode, ShieldCheck, ClipboardList, ArrowUpRight } from 'lucide-react';

type FlowAction = 'create' | 'register' | 'checkin' | 'dashboard';

interface TournamentFlowCardsProps {
  onOpenFlow: (action: FlowAction) => void;
}

export function TournamentFlowCards({ onOpenFlow }: TournamentFlowCardsProps) {
  const offlineFlows = [
    {
      title: 'Manager / Delegate',
      description: 'Login, create a tournament, configure Traditional/Medley format, set Cut-offs, and generate cryptographically secure PDF scrambles.',
      icon: Trophy,
      action: 'Create Tournament',
      actionType: 'create' as const,
      color: 'from-amber-500/10 to-orange-500/5 hover:border-amber-500/40 border-border/80',
      iconColor: 'text-amber-500 bg-amber-500/10',
    },
    {
      title: 'Player Registration',
      description: 'Browse local/global tournaments, complete registration, and download your unique check-in QR Code for the competition table.',
      icon: QrCode,
      action: 'Register Now',
      actionType: 'register' as const,
      color: 'from-emerald-500/10 to-teal-500/5 hover:border-emerald-500/40 border-border/80',
      iconColor: 'text-emerald-500 bg-emerald-500/10',
    },
    {
      title: 'Judge Check-in',
      description: 'Check in competitors, input Stackmat timer scores, apply +2/DNF penalties, handle Medley sequences, and collect competitor e-signatures.',
      icon: ShieldCheck,
      action: 'Open Judge App',
      actionType: 'checkin' as const,
      color: 'from-cyan-500/10 to-blue-500/5 hover:border-cyan-500/40 border-border/80',
      iconColor: 'text-cyan-500 bg-cyan-500/10',
    },
    {
      title: 'Live Operations',
      description: 'Monitor real-time judging progress, resolve competitor scoring disputes, view real-time live boards, and lock final round placements.',
      icon: ClipboardList,
      action: 'Open Dashboard',
      actionType: 'dashboard' as const,
      color: 'from-rose-500/10 to-pink-500/5 hover:border-rose-500/40 border-border/80',
      iconColor: 'text-rose-500 bg-rose-500/10',
    },
  ];

  return (
    <div className="mb-14">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground sm:text-2xl">Role-Based Workflows</h2>
          <p className="text-sm text-muted-foreground">Select your competition role to access the digitized scoring pipelines.</p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-4">
        {offlineFlows.map((flow) => {
          const Icon = flow.icon;
          return (
            <Card
              key={flow.title}
              className={`group relative flex flex-col justify-between overflow-hidden border bg-gradient-to-b p-6 shadow-sm transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg ${flow.color}`}
            >
              <div>
                <div className="flex items-start justify-between">
                  <div className={`rounded-2xl p-3 border border-border/20 ${flow.iconColor}`}>
                    <Icon className="h-6 w-6" />
                  </div>
                  <span className="inline-flex items-center gap-1 rounded-full bg-muted/60 border border-border/30 px-2.5 py-0.5 text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">
                    Official
                  </span>
                </div>

                <div className="mt-5">
                  <h3 className="text-lg font-bold text-foreground group-hover:text-accent transition-colors flex items-center gap-1">
                    {flow.title}
                    <ArrowUpRight className="h-4 w-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                  </h3>
                  <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{flow.description}</p>
                </div>
              </div>

              <div className="mt-6">
                <Button
                  onClick={() => onOpenFlow(flow.actionType)}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border border-accent/20 group-hover:shadow-md transition-all duration-300 font-semibold"
                >
                  {flow.action}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
