'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Clock, Zap, Target, BookOpen } from 'lucide-react';

export default function PracticePage() {
  const [selectedMode, setSelectedMode] = useState('timing');

  const modes = [
    {
      id: 'timing',
      name: 'Timed Solve',
      icon: Clock,
      description: 'Practice with timer and statistics',
      stats: { solves: 342, best: '8.2s', average: '12.5s' },
    },
    {
      id: 'speedrun',
      name: 'Speed Run',
      icon: Zap,
      description: 'Race against clock for unlimited time',
      stats: { sessions: 156, personal: '7.2s', level: 'Advanced' },
    },
    {
      id: 'blind',
      name: 'Blind Solving',
      icon: Target,
      description: 'Practice blindfolded solving techniques',
      stats: { solves: 89, personal: '34.5s', accuracy: '92%' },
    },
    {
      id: 'learn',
      name: 'Learn Methods',
      icon: BookOpen,
      description: 'Study and master different solving techniques',
      stats: { completed: 12, progress: '68%', time: '45h' },
    },
  ];

  const practiceStats = [
    { label: 'Total Solves', value: '2,847' },
    { label: 'Avg Time', value: '12.5s' },
    { label: 'Best Time', value: '8.2s' },
    { label: 'Session Streak', value: '28 days' },
  ];

  const methods = [
    {
      name: 'CFOP (Fridrich Method)',
      difficulty: 'Beginner',
      users: 12400,
      progress: 100,
    },
    {
      name: 'Roux Method',
      difficulty: 'Intermediate',
      users: 3200,
      progress: 75,
    },
    {
      name: 'ZZ Method',
      difficulty: 'Advanced',
      users: 1800,
      progress: 45,
    },
    {
      name: 'Petrus Method',
      difficulty: 'Advanced',
      users: 890,
      progress: 20,
    },
    {
      name: 'Keyhole Method',
      difficulty: 'Intermediate',
      users: 2100,
      progress: 60,
    },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Practice Mode
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Improve your skills with targeted practice sessions
          </p>
        </div>

        {/* Stats Overview */}
        <div className="mb-12 grid grid-cols-2 gap-4 sm:grid-cols-4">
          {practiceStats.map((stat) => (
            <Card key={stat.label} className="border-border p-4 sm:p-6">
              <p className="text-sm text-muted-foreground">{stat.label}</p>
              <p className="mt-2 text-2xl font-bold text-foreground sm:text-3xl">{stat.value}</p>
            </Card>
          ))}
        </div>

        {/* Practice Modes */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <Card
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
                className={`cursor-pointer border-2 p-6 transition-all ${
                  selectedMode === mode.id
                    ? 'border-accent bg-accent/5'
                    : 'border-border hover:border-accent/50'
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-lg bg-accent/10">
                  <IconComponent className="h-6 w-6 text-accent" />
                </div>
                <h3 className="font-semibold text-foreground">{mode.name}</h3>
                <p className="mt-1 mb-4 text-sm text-muted-foreground">{mode.description}</p>
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  Start
                </Button>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Session Details */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {modes.find((m) => m.id === selectedMode)?.name} Statistics
                </h2>
              </div>
              <div className="p-6">
                <div className="mb-8">
                  <h3 className="mb-4 font-semibold text-foreground">Recent Sessions</h3>
                  <div className="space-y-3">
                    {[
                      { date: 'Today', solves: 42, avg: '12.3s', best: '8.5s' },
                      { date: 'Yesterday', solves: 38, avg: '12.7s', best: '8.2s' },
                      { date: '2 days ago', solves: 45, avg: '13.1s', best: '8.9s' },
                      { date: '3 days ago', solves: 35, avg: '12.8s', best: '8.4s' },
                    ].map((session) => (
                      <div key={session.date} className="flex items-center justify-between rounded-lg bg-muted/30 p-4">
                        <div>
                          <p className="font-medium text-foreground">{session.date}</p>
                          <p className="text-sm text-muted-foreground">{session.solves} solves</p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium text-foreground">{session.avg}</p>
                          <p className="text-sm text-accent">Best: {session.best}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Goals */}
                <div>
                  <h3 className="mb-4 font-semibold text-foreground">Your Goals</h3>
                  <div className="space-y-4">
                    {[
                      { goal: 'Average below 12s', progress: 85, target: '12.0s' },
                      { goal: 'Achieve 50 solves today', progress: 84, target: '42/50' },
                      { goal: 'Master Roux method', progress: 60, target: '60%' },
                    ].map((item) => (
                      <div key={item.goal}>
                        <div className="mb-2 flex justify-between">
                          <span className="text-sm font-medium text-foreground">{item.goal}</span>
                          <span className="text-sm text-accent font-semibold">{item.target}</span>
                        </div>
                        <div className="h-2 rounded-full bg-border">
                          <div
                            className="h-full rounded-full bg-accent transition-all"
                            style={{ width: `${item.progress}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </Card>
          </div>

          {/* Solving Methods */}
          <div>
            <Card className="border-border">
              <div className="border-b border-border px-6 py-4">
                <h3 className="font-semibold text-foreground">Solving Methods</h3>
              </div>
              <div className="divide-y divide-border">
                {methods.map((method) => (
                  <div key={method.name} className="p-6 hover:bg-muted/30 transition-colors cursor-pointer">
                    <div className="mb-2 flex items-start justify-between">
                      <h4 className="font-medium text-foreground">{method.name}</h4>
                      <span className="inline-flex text-xs rounded-full px-2 py-1 bg-accent/10 text-accent font-semibold">
                        {method.difficulty}
                      </span>
                    </div>
                    <p className="mb-3 text-xs text-muted-foreground">{method.users.toLocaleString()} users</p>
                    <div className="mb-2">
                      <div className="h-1.5 rounded-full bg-border">
                        <div
                          className="h-full rounded-full bg-accent"
                          style={{ width: `${method.progress}%` }}
                        />
                      </div>
                    </div>
                    <p className="text-xs text-muted-foreground">{method.progress}% learned</p>
                  </div>
                ))}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
