'use client';

import { Header } from '@/components/header';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useState } from 'react';
import { ArrowUp, ArrowDown, Minus } from 'lucide-react';

export default function RankingsPage() {
  const [selectedCategory, setSelectedCategory] = useState('global');

  const rankings = [
    { rank: 1, name: 'SpeedMaster_JP', rating: 2950, country: '🇯🇵', change: 'up', bestTime: '7.2s', tournaments: 45 },
    { rank: 2, name: 'CubeLegend_CN', rating: 2890, country: '🇨🇳', change: 'down', bestTime: '7.5s', tournaments: 52 },
    { rank: 3, name: 'FastFingers_US', rating: 2845, country: '🇺🇸', change: 'up', bestTime: '7.8s', tournaments: 38 },
    { rank: 4, name: 'TwistyKing_KR', rating: 2820, country: '🇰🇷', change: 'up', bestTime: '8.1s', tournaments: 41 },
    { rank: 5, name: 'BlazeFast_BR', rating: 2790, country: '🇧🇷', change: 'down', bestTime: '8.3s', tournaments: 35 },
    { rank: 6, name: 'PuzzleWizard_DE', rating: 2750, country: '🇩🇪', change: 'stable', bestTime: '8.5s', tournaments: 28 },
    { rank: 7, name: 'Speedcube_RU', rating: 2720, country: '🇷🇺', change: 'up', bestTime: '8.7s', tournaments: 32 },
    { rank: 8, name: 'CubeNinja_MX', rating: 2695, country: '🇲🇽', change: 'up', bestTime: '8.9s', tournaments: 29 },
    { rank: 9, name: 'TwistMaster_IN', rating: 2670, country: '🇮🇳', change: 'down', bestTime: '9.1s', tournaments: 26 },
    { rank: 10, name: 'FastCube_AU', rating: 2645, country: '🇦🇺', change: 'stable', bestTime: '9.3s', tournaments: 24 },
    { rank: 11, name: 'SpeedRuler_CA', rating: 2620, country: '🇨🇦', change: 'up', bestTime: '9.5s', tournaments: 21 },
    { rank: 12, name: 'CubeExpert_SE', rating: 2595, country: '🇸🇪', change: 'down', bestTime: '9.7s', tournaments: 19 },
  ];

  const categories = [
    { id: 'global', label: 'Global Rankings' },
    { id: 'asia', label: 'Asia Pacific' },
    { id: 'europe', label: 'Europe' },
    { id: 'americas', label: 'Americas' },
    { id: 'monthly', label: 'Monthly' },
  ];

  const getChangeIcon = (change: string) => {
    switch (change) {
      case 'up':
        return <ArrowUp className="h-4 w-4 text-green-600" />;
      case 'down':
        return <ArrowDown className="h-4 w-4 text-red-600" />;
      default:
        return <Minus className="h-4 w-4 text-muted-foreground" />;
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Global Rankings
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Compete and climb the leaderboard to become a legend
          </p>
        </div>

        {/* Category Tabs */}
        <div className="mb-8 flex flex-wrap gap-2">
          {categories.map((category) => (
            <Button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              variant={selectedCategory === category.id ? 'default' : 'outline'}
              className={
                selectedCategory === category.id
                  ? 'bg-accent text-accent-foreground hover:bg-accent/90'
                  : 'border-border'
              }
            >
              {category.label}
            </Button>
          ))}
        </div>

        {/* Your Ranking */}
        <Card className="mb-8 border-accent bg-accent/5 p-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground">Your Current Rank</h3>
              <p className="mt-1 text-3xl font-bold text-foreground">#1,284</p>
              <p className="mt-1 text-sm text-muted-foreground">Rating: 2,645 • Next rank at 2,700</p>
            </div>
            <div className="text-right">
              <p className="text-sm text-muted-foreground">Progress to next rank</p>
              <div className="mt-2 h-3 w-48 rounded-full bg-border">
                <div className="h-full w-1/3 rounded-full bg-accent" />
              </div>
              <p className="mt-1 text-xs text-muted-foreground">55/100 rating points</p>
            </div>
          </div>
        </Card>

        {/* Rankings Table */}
        <Card className="border-border overflow-hidden">
          {/* Desktop View */}
          <div className="hidden md:block">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-border bg-muted/50">
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">#</th>
                    <th className="px-6 py-4 text-left text-sm font-semibold text-foreground">Player</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Rating</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Best Time</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Tournaments</th>
                    <th className="px-6 py-4 text-center text-sm font-semibold text-foreground">Trend</th>
                  </tr>
                </thead>
                <tbody>
                  {rankings.map((player) => (
                    <tr
                      key={player.rank}
                      className="border-b border-border hover:bg-muted/50 transition-colors"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          {player.rank <= 3 && (
                            <Trophy
                              className={`h-5 w-5 ${
                                player.rank === 1
                                  ? 'text-yellow-500'
                                  : player.rank === 2
                                  ? 'text-gray-400'
                                  : 'text-orange-600'
                              }`}
                            />
                          )}
                          <span className="font-semibold text-foreground">#{player.rank}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <span className="text-lg">{player.country}</span>
                          <span className="font-medium text-foreground">{player.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-center">
                        <span className="font-semibold text-accent">{player.rating}</span>
                      </td>
                      <td className="px-6 py-4 text-center text-foreground">{player.bestTime}</td>
                      <td className="px-6 py-4 text-center text-muted-foreground">{player.tournaments}</td>
                      <td className="px-6 py-4 flex justify-center">
                        {getChangeIcon(player.change)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Mobile View */}
          <div className="md:hidden divide-y divide-border">
            {rankings.map((player) => (
              <div key={player.rank} className="p-4">
                <div className="mb-3 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    {player.rank <= 3 && (
                      <Trophy
                        className={`h-4 w-4 ${
                          player.rank === 1
                            ? 'text-yellow-500'
                            : player.rank === 2
                            ? 'text-gray-400'
                            : 'text-orange-600'
                        }`}
                      />
                    )}
                    <span className="font-bold text-foreground">#{player.rank}</span>
                    <span className="text-lg">{player.country}</span>
                  </div>
                  {getChangeIcon(player.change)}
                </div>
                <p className="font-medium text-foreground">{player.name}</p>
                <div className="mt-2 grid grid-cols-3 gap-2 text-xs text-muted-foreground">
                  <div>Rating: <span className="font-semibold text-accent">{player.rating}</span></div>
                  <div>Best: <span className="font-semibold">{player.bestTime}</span></div>
                  <div>Events: <span className="font-semibold">{player.tournaments}</span></div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </main>
  );
}

function Trophy({ className }: { className: string }) {
  return (
    <svg className={className} fill="currentColor" viewBox="0 0 24 24">
      <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm0 18c-4.41 0-8-3.59-8-8s3.59-8 8-8 8 3.59 8 8-3.59 8-8 8zm3.5-9c.83 0 1.5-.67 1.5-1.5S16.33 8 15.5 8 14 8.67 14 9.5s.67 1.5 1.5 1.5zm-7 0c.83 0 1.5-.67 1.5-1.5S9.33 8 8.5 8 7 8.67 7 9.5 7.67 11 8.5 11zm3.5 6.5c2.33 0 4.31-1.46 5.11-3.5H6.89c.8 2.04 2.78 3.5 5.11 3.5z" />
    </svg>
  );
}
