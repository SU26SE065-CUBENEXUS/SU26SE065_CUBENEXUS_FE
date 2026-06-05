'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Calendar, ClipboardList, QrCode, ShieldCheck, Trophy, Users, Zap } from 'lucide-react';

import { Suspense } from 'react';
import { LoaderCircle as LoaderCircleIcon } from 'lucide-react';

type FlowAction = 'create' | 'register' | 'checkin' | 'dashboard' | null;

function TournamentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeAction = searchParams.get('action') as FlowAction | null;

  const [activeAction, setActiveAction] = useState<FlowAction>(null);
  const [feedback, setFeedback] = useState<string | null>(null);

  useEffect(() => {
    if (routeAction === 'create' || routeAction === 'register' || routeAction === 'checkin' || routeAction === 'dashboard') {
      setActiveAction(routeAction);
      setFeedback(null);
      return;
    }

    if (!routeAction) {
      setActiveAction(null);
      setFeedback(null);
    }
  }, [routeAction]);

  const openFlow = (action: Exclude<FlowAction, null>) => {
    setActiveAction(action);
    setFeedback(null);
    router.push(`/tournaments?action=${action}`);
  };

  const closeFlow = () => {
    setActiveAction(null);
    setFeedback(null);
    router.replace('/tournaments');
  };

  const dialogMeta = useMemo(() => {
    switch (activeAction) {
      case 'create':
        return {
          title: 'Create Tournament',
          description: 'Configure the event, choose Traditional or Medley, then generate groups and scrambles.',
        };
      case 'register':
        return {
          title: 'Register for Tournament',
          description: 'Submit your registration and generate a QR check-in code for the competition station.',
        };
      case 'checkin':
        return {
          title: 'Judge Check-in',
          description: 'Scan the competitor QR, validate the round, enter the result, and submit the final score.',
        };
      case 'dashboard':
        return {
          title: 'Live Operations Dashboard',
          description: 'Monitor judge progress, competitor status, disputes, and realtime live board updates.',
        };
      default:
        return {
          title: 'Tournament Action',
          description: 'Select a flow to continue.',
        };
    }
  }, [activeAction]);

  const offlineFlows = [
    {
      title: 'Manager / Delegate',
      description: 'Login, create a tournament, configure the format, generate groups and scrambles, then publish the event.',
      icon: Trophy,
      action: 'Create Tournament',
      href: '/tournaments?action=create',
      actionType: 'create' as const,
    },
    {
      title: 'Player Registration',
      description: 'Browse tournaments, register, receive a QR check-in code, and wait for the schedule.',
      icon: QrCode,
      action: 'Register Now',
      href: '/tournaments?action=register',
      actionType: 'register' as const,
    },
    {
      title: 'Judge Check-in',
      description: 'Scan QR, verify the attempt, enter Stackmat times, apply penalties, and collect e-signatures.',
      icon: ShieldCheck,
      action: 'Open Judge App',
      href: '/judge?action=checkin',
      actionType: 'route' as const,
    },
    {
      title: 'Live Operations',
      description: 'Monitor judge progress, competitor status, live rankings, and lock results before advancing rounds.',
      icon: ClipboardList,
      action: 'Open Dashboard',
      href: '/judge?action=dashboard',
      actionType: 'route' as const,
    },
  ];

  const tournaments = [
    {
      id: 1,
      name: 'Global Championship 2025',
      status: 'Registration Open',
      date: 'June 15-17, 2025',
      participants: 1248,
      maxParticipants: 2000,
      prizePool: '$50,000',
      format: '3x3 Speedcubing',
    },
    {
      id: 2,
      name: 'Asian Regional Cup',
      status: 'In Progress',
      date: 'May 20 - June 5, 2025',
      participants: 542,
      maxParticipants: 800,
      prizePool: '$12,000',
      format: 'Mixed Events',
    },
    {
      id: 3,
      name: 'Speed Run Championship',
      status: 'Starting Soon',
      date: 'June 1, 2025',
      participants: 89,
      maxParticipants: 500,
      prizePool: '$8,000',
      format: '2x2 & 3x3',
    },
    {
      id: 4,
      name: 'Blind Cube Masters',
      status: 'Registration Open',
      date: 'June 8-9, 2025',
      participants: 234,
      maxParticipants: 400,
      prizePool: '$6,000',
      format: 'Blindfolded Solving',
    },
    {
      id: 5,
      name: 'Weekly Sprint Series',
      status: 'In Progress',
      date: 'Ongoing (Weekly)',
      participants: 3200,
      maxParticipants: 5000,
      prizePool: '$2,000/week',
      format: 'Weekly Brackets',
    },
    {
      id: 6,
      name: 'Youth Championship U18',
      status: 'Registration Open',
      date: 'June 22-23, 2025',
      participants: 456,
      maxParticipants: 800,
      prizePool: '$4,000',
      format: 'Age 18 & Under',
    },
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Registration Open':
        return 'bg-accent/10 text-accent';
      case 'In Progress':
        return 'bg-blue-500/10 text-blue-600';
      case 'Starting Soon':
        return 'bg-orange-500/10 text-orange-600';
      default:
        return 'bg-muted text-muted-foreground';
    }
  };

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const tournamentName = String(formData.get('tournamentName') || 'Untitled Tournament');
    const format = String(formData.get('format') || 'Traditional');
    setFeedback(`Tournament "${tournamentName}" created. ${format} groups and scrambles generated.`);
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const playerName = String(formData.get('playerName') || 'Player');
    const tournamentName = String(formData.get('tournamentName') || 'Selected Tournament');
    const qrCode = `QR-${Math.floor(100000 + Math.random() * 900000)}`;
    setFeedback(`${playerName} registered for ${tournamentName}. QR check-in code generated: ${qrCode}`);
  };

  const handleCheckInSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const playerQr = String(formData.get('playerQr') || 'Unknown QR');
    const round = String(formData.get('round') || 'Round 1');
    const stackmat = String(formData.get('stackmat') || '0.00');
    const penalty = String(formData.get('penalty') || 'None');
    const finalTime = penalty === '+2' ? `${stackmat} +2` : penalty === 'DNF' ? 'DNF' : `${stackmat}s`;
    setFeedback(`Verified ${playerQr} for ${round}. Final result submitted as ${finalTime}.`);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-1">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">Offline Tournament Hub</p>
            <h1 className="mt-3 text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
Tournament Hub            </h1>
            <p className="mt-4 max-w-2xl text-lg text-muted-foreground">
              This screen maps the full offline workflow: manager setup, player registration, judge station, Medley support, and real-time live board control.
            </p>
          </div>

          
        </div>

        <div className="mb-12 grid gap-6 md:grid-cols-2 xl:grid-cols-4">
          {offlineFlows.map((flow) => {
            const Icon = flow.icon;
            return (
              <Card key={flow.title} className="border-border p-6">
                <div className="flex items-start justify-between gap-4">
                  <div className="rounded-2xl bg-accent/10 p-3">
                    <Icon className="h-6 w-6 text-accent" />
                  </div>
                  <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
                    Offline
                  </span>
                </div>
                <h3 className="mt-5 text-lg font-semibold text-foreground">{flow.title}</h3>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">{flow.description}</p>
                {flow.actionType === 'route' ? (
                  <Button asChild className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90">
                    <Link href={flow.href}>{flow.action}</Link>
                  </Button>
                ) : (
                  <Button
                    asChild
                    className="mt-5 w-full bg-accent text-accent-foreground hover:bg-accent/90"
                    onClick={() => openFlow(flow.actionType)}
                  >
                    <Link href={flow.href}>{flow.action}</Link>
                  </Button>
                )}
              </Card>
            );
          })}
        </div>

        <div className="mb-8 flex flex-wrap gap-3">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            Published Events
          </Button>
          <Button variant="outline" className="border-border">
            Registration Open
          </Button>
          <Button variant="outline" className="border-border">
            Live Now
          </Button>
          <Button variant="outline" className="border-border">
            Medley Ready
          </Button>
        </div>

        {/* Tournaments Grid */}
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
          {tournaments.map((tournament) => (
            <Card key={tournament.id} className="border-border overflow-hidden flex flex-col">
              {/* Header */}
              <div className="border-b border-border bg-gradient-to-r from-accent/5 to-transparent p-6">
                <div className="mb-3 flex items-start justify-between">
                  <h3 className="text-lg font-bold text-foreground leading-tight">
                    {tournament.name}
                  </h3>
                  <span className={`inline-flex rounded-full px-3 py-1 text-xs font-semibold ${getStatusColor(tournament.status)}`}>
                    {tournament.status}
                  </span>
                </div>
              </div>

              {/* Content */}
              <div className="flex flex-col flex-grow p-6 space-y-4">
                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Calendar className="h-4 w-4" />
                    <span className="text-sm">{tournament.date}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Users className="h-4 w-4" />
                    <span className="text-sm">
                      {tournament.participants} / {tournament.maxParticipants} participants
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Trophy className="h-4 w-4" />
                    <span className="text-sm font-semibold text-accent">{tournament.prizePool}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Zap className="h-4 w-4" />
                    <span className="text-sm">{tournament.format}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="mb-2 flex justify-between text-xs text-muted-foreground">
                    <span>Participants</span>
                    <span>{Math.round((tournament.participants / tournament.maxParticipants) * 100)}%</span>
                  </div>
                  <div className="h-2 rounded-full bg-border">
                    <div
                      className="h-full rounded-full bg-accent"
                      style={{
                        width: `${(tournament.participants / tournament.maxParticipants) * 100}%`,
                      }}
                    />
                  </div>
                </div>
              </div>

              {/* Footer */}
              <div className="border-t border-border p-6">
                <Button
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90"
                  onClick={() => {
                    if (tournament.status === 'Registration Open') {
                      openFlow('register');
                      return;
                    }
                    openFlow('checkin');
                  }}
                >
                  {tournament.status === 'Registration Open' ? 'Register Now' : 'View Details'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>

      <Dialog open={Boolean(activeAction)} onOpenChange={(open) => (!open ? closeFlow() : null)}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>{dialogMeta.title}</DialogTitle>
            <DialogDescription>{dialogMeta.description}</DialogDescription>
          </DialogHeader>

          {activeAction === 'create' && (
            <form className="space-y-4" onSubmit={handleCreateSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Tournament name</span>
                  <input name="tournamentName" defaultValue="CubeNexus Open 2026" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Time limit</span>
                  <input name="timeLimit" defaultValue="10 minutes" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
              </div>
              <label className="block space-y-2 text-sm">
                <span className="font-medium text-foreground">Description</span>
                <textarea name="description" defaultValue="Offline tournament with live board, QR check-in, and Judge station workflow." rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
              </label>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Format</span>
                <select name="format" defaultValue="Traditional" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent">
                  <option>Traditional</option>
                  <option>Medley</option>
                </select>
              </label>
              {feedback && <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">{feedback}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" className="border-border" onClick={closeFlow}>Cancel</Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Save Tournament</Button>
              </DialogFooter>
            </form>
          )}

          {activeAction === 'register' && (
            <form className="space-y-4" onSubmit={handleRegisterSubmit}>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Tournament</span>
                <input name="tournamentName" defaultValue="Global Championship 2025" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
              </label>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Player name</span>
                  <input name="playerName" defaultValue="CubeNexus_Player" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Email</span>
                  <input name="email" defaultValue="player@cubenexus.app" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
              </div>
              {feedback && <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">{feedback}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" className="border-border" onClick={closeFlow}>Cancel</Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Generate QR Check-in</Button>
              </DialogFooter>
            </form>
          )}

          {activeAction === 'checkin' && (
            <form className="space-y-4" onSubmit={handleCheckInSubmit}>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Player QR code</span>
                  <input name="playerQr" defaultValue="QR-428761" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Round</span>
                  <input name="round" defaultValue="Solve 1" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
              </div>
              <div className="grid gap-4 sm:grid-cols-2">
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Stackmat time</span>
                  <input name="stackmat" defaultValue="8.42" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
                </label>
                <label className="space-y-2 text-sm">
                  <span className="font-medium text-foreground">Penalty</span>
                  <select name="penalty" defaultValue="None" className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent">
                    <option>None</option>
                    <option>+2</option>
                    <option>DNF</option>
                  </select>
                </label>
              </div>
              <label className="space-y-2 text-sm">
                <span className="font-medium text-foreground">Judge note</span>
                <textarea name="note" defaultValue="Verified identity and attempt; player signed on device after final result was shown." rows={3} className="w-full rounded-md border border-border bg-background px-3 py-2 text-sm text-foreground outline-none focus:border-accent" />
              </label>
              {feedback && <div className="rounded-lg border border-accent/30 bg-accent/5 p-4 text-sm text-foreground">{feedback}</div>}
              <DialogFooter>
                <Button type="button" variant="outline" className="border-border" onClick={closeFlow}>Cancel</Button>
                <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90">Submit Result</Button>
              </DialogFooter>
            </form>
          )}

          {activeAction === 'dashboard' && (
            <div className="space-y-4">
              <div className="grid gap-3 sm:grid-cols-3">
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Judge Progress</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">18 / 24</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Pending Disputes</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">2</p>
                </div>
                <div className="rounded-lg border border-border p-4">
                  <p className="text-sm text-muted-foreground">Live Rankings</p>
                  <p className="mt-1 text-2xl font-bold text-foreground">Realtime</p>
                </div>
              </div>
              <div className="rounded-lg border border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                Live operations dashboard route is now connected. Replace these mock values with the real websocket feed when the API is ready.
              </div>
              <DialogFooter>
                <Button type="button" variant="outline" className="border-border" onClick={closeFlow}>Close</Button>
                <Button type="button" className="bg-accent text-accent-foreground hover:bg-accent/90" onClick={() => router.push('/rankings')}>Open Rankings</Button>
              </DialogFooter>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </main>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderCircleIcon className="h-8 w-8 animate-spin text-accent" />
      </div>
    }>
      <TournamentsPageContent />
    </Suspense>
  );
}
