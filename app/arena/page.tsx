'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { useState } from 'react';
import { Users, Zap, Trophy, Timer } from 'lucide-react';

export default function ArenaPage() {
  const [selectedMode, setSelectedMode] = useState('1v1');

  const modes = [
    { id: '1v1', name: '1v1 Match', icon: Users, description: 'Challenge a cuber worldwide' },
    { id: 'speed', name: 'Speed Run', icon: Zap, description: 'Race against the clock' },
    { id: 'ranked', name: 'Ranked Match', icon: Trophy, description: 'Climb the leaderboard' },
    { id: 'timed', name: 'Timed Challenge', icon: Timer, description: 'Complete in set time' },
  ];

  const activePlayers = [
    { id: 1, name: 'SpeedMaster_JP', rating: 2850, country: '🇯🇵', status: 'Waiting' },
    { id: 2, name: 'CubeLegend_CN', rating: 2720, country: '🇨🇳', status: 'In Match' },
    { id: 3, name: 'FastFingers_US', rating: 2680, country: '🇺🇸', status: 'Waiting' },
    { id: 4, name: 'TwistyKing_KR', rating: 2650, country: '🇰🇷', status: 'Waiting' },
    { id: 5, name: 'BlazeFast_BR', rating: 2600, country: '🇧🇷', status: 'In Match' },
    { id: 6, name: 'PuzzleWizard_DE', rating: 2580, country: '🇩🇪', status: 'Waiting' },
  ];

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Global Arena
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Challenge speedcubers worldwide in real-time 1v1 matches
          </p>
        </div>

        {/* Game Modes */}
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
                <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
              </Card>
            );
          })}
        </div>

        <div className="grid gap-8 lg:grid-cols-3">
          {/* Active Opponents */}
          <div className="lg:col-span-2">
            <Card className="border-border">
              <div className="border-b border-border px-6 py-4">
                <h2 className="text-xl font-semibold text-foreground">
                  {selectedMode === '1v1' ? 'Find Opponent' : 'Active Players'}
                </h2>
              </div>
              <div className="divide-y divide-border">
                {activePlayers.map((player) => (
                  <div
                    key={player.id}
                    className="flex items-center justify-between px-6 py-4 hover:bg-card/50 transition-colors"
                  >
                    <div className="flex items-center gap-4">
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-accent/10 text-lg">
                        {player.country}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">Rating: {player.rating}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${
                        player.status === 'Waiting' ? 'text-accent' : 'text-muted-foreground'
                      }`}>
                        {player.status}
                      </span>
                      <Button 
                        className="bg-accent text-accent-foreground hover:bg-accent/90"
                        disabled={player.status === 'In Match'}
                      >
                        Challenge
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          </div>

          {/* Match Info */}
          <div className="space-y-4">
            <Card className="border-border p-6">
              <h3 className="mb-4 font-semibold text-foreground">Your Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Wins</span>
                  <span className="font-semibold text-foreground">247</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Losses</span>
                  <span className="font-semibold text-foreground">52</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Rating</span>
                  <span className="font-semibold text-accent">2,645</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ranking</span>
                  <span className="font-semibold text-foreground">#1,284</span>
                </div>
              </div>
            </Card>

            <Card className="border-border p-6">
              <h3 className="mb-4 font-semibold text-foreground">Quick Stats</h3>
              <div className="space-y-3">
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Avg Time</span>
                  <span className="font-semibold text-foreground">12.5s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Best Time</span>
                  <span className="font-semibold text-accent">8.2s</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Win Rate</span>
                  <span className="font-semibold text-foreground">82.6%</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Streak</span>
                  <span className="font-semibold text-accent">12 Wins</span>
                </div>
              </div>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
