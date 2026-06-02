'use client';

import Link from 'next/link';
import { ArrowRight, Clock3, QrCode, ShieldCheck, Smartphone, Trophy, Users, Video } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';

const offlineFlows = [
  {
    title: 'Manager / Delegate',
    steps: ['Login', 'Create tournament', 'Configure format', 'Generate groups & scrambles', 'Publish event'],
    href: '/tournaments?action=create',
    icon: Trophy,
  },
  {
    title: 'Player Registration',
    steps: ['Create account', 'Login', 'Browse events', 'Register', 'Receive QR check-in'],
    href: '/tournaments?action=register',
    icon: QrCode,
  },
  {
    title: 'Judge Station',
    steps: ['Scan QR', 'Verify attempt', 'Enter time', 'Apply penalties', 'Collect e-signature'],
    href: '/judge?action=checkin',
    icon: ShieldCheck,
  },
];

const onlineFlows = [
  {
    title: 'Online 1v1 Arena',
    steps: ['Find Match', 'Queue', 'Elo match', 'Virtual Room', 'Realtime result'],
    href: '/arena',
    icon: Users,
  },
  {
    title: 'WebRTC Preparation',
    steps: ['Enable webcam', 'Show hands and cube', 'Generate QR session', 'Share room evidence'],
    href: '/arena',
    icon: Video,
  },
  {
    title: 'Mobile Smart Timer',
    steps: ['Scan QR', 'Join socket room', 'Sync timer', 'Solve and submit'],
    href: '/arena',
    icon: Smartphone,
  },
];

export function FlowsSection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-col gap-3 lg:flex-row lg:items-end lg:justify-between">
        <div>
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Business Flows</p>
          <h2 className="mt-2 text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
            From tournament ops to online matchmaking
          </h2>
        </div>
        <p className="max-w-2xl text-sm text-muted-foreground">
          Start with the current UI screens, then connect each flow to real data, real-time updates, and mobile sync.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-2">
        <Card className="border-border p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">Offline</p>
              <h3 className="mt-1 text-2xl font-semibold text-foreground">Tournament Operations</h3>
            </div>
            <Clock3 className="h-10 w-10 text-accent" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {offlineFlows.map((flow) => {
              const Icon = flow.icon;
              return (
                <div key={flow.title} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <Icon className="h-5 w-5 text-accent" />
                    <Link href={flow.href} className="text-xs font-semibold text-accent hover:underline">
                      Open
                    </Link>
                  </div>
                  <h4 className="font-semibold text-foreground">{flow.title}</h4>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {flow.steps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <Button asChild className="mt-6 bg-accent text-accent-foreground hover:bg-accent/90">
            <Link href="/tournaments">
              Explore Offline Tournament UI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>

        <Card className="border-border p-6">
          <div className="mb-6 flex items-center justify-between">
            <div>
              <p className="text-sm font-medium uppercase tracking-[0.24em] text-accent">Online</p>
              <h3 className="mt-1 text-2xl font-semibold text-foreground">Ranked Arena</h3>
            </div>
            <Video className="h-10 w-10 text-accent" />
          </div>

          <div className="grid gap-4 md:grid-cols-3">
            {onlineFlows.map((flow) => {
              const Icon = flow.icon;
              return (
                <div key={flow.title} className="rounded-2xl border border-border bg-card p-4">
                  <div className="mb-4 flex items-center justify-between">
                    <Icon className="h-5 w-5 text-accent" />
                    <Link href={flow.href} className="text-xs font-semibold text-accent hover:underline">
                      Open
                    </Link>
                  </div>
                  <h4 className="font-semibold text-foreground">{flow.title}</h4>
                  <ul className="mt-3 space-y-2 text-sm text-muted-foreground">
                    {flow.steps.map((step) => (
                      <li key={step} className="flex items-start gap-2">
                        <span className="mt-1 h-1.5 w-1.5 rounded-full bg-accent" />
                        <span>{step}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>

          <Button asChild className="mt-6 bg-foreground text-background hover:bg-foreground/90">
            <Link href="/arena">
              Launch Online Arena UI
              <ArrowRight className="ml-2 h-4 w-4" />
            </Link>
          </Button>
        </Card>
      </div>
    </section>
  );
}
