'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tv, ShieldCheck, Video, Smartphone, ArrowRight } from 'lucide-react';

export function SpectatorFeed() {
  const recentMatches = [
    {
      playerA: 'SpeedMaster_JP',
      playerB: 'CubeLegend_CN',
      winner: 'SpeedMaster_JP',
      time: '7.12s',
      room: 'ROOM-8042',
      webcamActive: true,
      smartTimerActive: true,
    },
    {
      playerA: 'FastFingers_US',
      playerB: 'TwistyKing_KR',
      winner: 'TwistyKing_KR',
      time: '8.48s',
      room: 'ROOM-4127',
      webcamActive: true,
      smartTimerActive: true,
    },
    {
      playerA: 'BlazeFast_BR',
      playerB: 'PuzzleWizard_DE',
      winner: 'BlazeFast_BR',
      time: '8.77s',
      room: 'ROOM-0925',
      webcamActive: false, // Disconnected during verify
      smartTimerActive: true,
    },
  ];

  return (
    <div className="mb-12 grid gap-6 lg:grid-cols-3">
      {/* Spectator Feed Card */}
      <Card className="relative overflow-hidden border border-border bg-card p-6 lg:col-span-2 flex flex-col justify-between shadow-sm">
        <div className="absolute -right-6 -bottom-6 h-28 w-28 rounded-full bg-accent/5 blur-xl" />
        
        <div>
          <div className="flex items-center justify-between gap-4">
            <div>
              <span className="text-xs font-bold text-accent uppercase tracking-widest flex items-center gap-1.5">
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
                </span>
                Spectator Portal
              </span>
              <h2 className="mt-2 text-2xl font-bold tracking-tight text-foreground">Live 1v1 Arena Matches</h2>
            </div>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-4 py-2 font-semibold flex items-center gap-1">
              <Link href="/arena">
                Watch Battle Arena <ArrowRight className="h-4 w-4" />
              </Link>
            </Button>
          </div>
          <p className="mt-4 text-sm leading-relaxed text-muted-foreground">
            Spectators can tune in to inspect ongoing online Elo matchmaking rooms. The platform securely requires all ranked players to broadcast their webcams for hand-solving validation and utilize their mobile app as a smart stacked-hands timer.
          </p>
        </div>

        <div className="mt-6 flex flex-wrap gap-4 border-t border-border/80 pt-6">
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Video className="h-4 w-4 text-accent" />
            <span>WebRTC Webcam Stream Required</span>
          </div>
          <div className="flex items-center gap-2 text-xs text-muted-foreground font-medium">
            <Smartphone className="h-4 w-4 text-accent" />
            <span>Mobile Stackmat Timer Sync</span>
          </div>
        </div>
      </Card>

      {/* Match History Card */}
      <Card className="border border-border bg-card p-6 shadow-sm flex flex-col justify-between">
        <div>
          <h3 className="text-lg font-bold text-foreground mb-4 flex items-center gap-2">
            <Tv className="h-5 w-5 text-accent" />
            Live Battle Log
          </h3>
          <div className="space-y-3">
            {recentMatches.map((match) => (
              <div key={match.room} className="group rounded-xl border border-border/70 p-3 bg-muted/20 hover:border-accent/40 transition-colors">
                <div className="flex items-center justify-between gap-3 text-sm">
                  <span className="font-semibold text-foreground">{match.playerA}</span>
                  <span className="text-xs text-muted-foreground font-bold">vs</span>
                  <span className="font-semibold text-foreground">{match.playerB}</span>
                </div>
                <div className="mt-2.5 flex items-center justify-between text-[11px] text-muted-foreground">
                  <div className="flex gap-2">
                    <span className="font-semibold text-foreground">Winner: <span className="text-accent">{match.winner}</span></span>
                    <span>•</span>
                    <span className="font-bold text-foreground">{match.time}</span>
                  </div>
                  <span className="font-semibold bg-muted border border-border px-1.5 py-0.5 rounded text-[9px]">{match.room}</span>
                </div>

                {/* Webcam / Timer Verification Badges */}
                <div className="mt-2 flex gap-1.5">
                  {match.webcamActive ? (
                    <Badge className="bg-emerald-500/10 text-emerald-600 border border-emerald-500/15 hover:bg-emerald-500/15 text-[8px] py-0 px-1 font-bold">
                      CAM SYNCED
                    </Badge>
                  ) : (
                    <Badge className="bg-rose-500/10 text-rose-600 border border-rose-500/15 hover:bg-rose-500/15 text-[8px] py-0 px-1 font-bold">
                      CAM OFFLINE
                    </Badge>
                  )}
                  {match.smartTimerActive && (
                    <Badge className="bg-cyan-500/10 text-cyan-600 border border-cyan-500/15 hover:bg-cyan-500/15 text-[8px] py-0 px-1 font-bold">
                      TIMER SYNCED
                    </Badge>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </Card>
    </div>
  );
}
