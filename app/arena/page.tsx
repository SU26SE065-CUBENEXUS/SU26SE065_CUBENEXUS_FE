'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useEffect, useMemo, useState } from 'react';
import { ChevronRight, Crown, LoaderCircle, Rocket, Timer, Trophy, Users, X } from 'lucide-react';

const modes = [
  { id: '1v1', name: '1v1 Match', icon: Users, description: 'Challenge a cuber with matching Elo' },
  { id: 'history', name: 'Match History', icon: Trophy, description: 'Review your completed matches' },
  { id: 'practice', name: 'Practice Mode', icon: Timer, description: 'Personal practice or create a practice room' },
];

const activePlayers = [
  { id: 1, name: 'SpeedMaster_JP', rating: 2850, country: '🇯🇵', status: 'Waiting' },
  { id: 2, name: 'CubeLegend_CN', rating: 2720, country: '🇨🇳', status: 'In Match' },
  { id: 3, name: 'FastFingers_US', rating: 2680, country: '🇺🇸', status: 'Waiting' },
  { id: 4, name: 'TwistyKing_KR', rating: 2650, country: '🇰🇷', status: 'Waiting' },
  { id: 5, name: 'BlazeFast_BR', rating: 2600, country: '🇧🇷', status: 'In Match' },
  { id: 6, name: 'PuzzleWizard_DE', rating: 2580, country: '🇩🇪', status: 'Waiting' },
];

export default function ArenaPage() {
  const [selectedMode, setSelectedMode] = useState<'1v1' | 'history' | 'practice'>('1v1');
  const [matchPhase, setMatchPhase] = useState<'idle' | 'queue' | 'searching' | 'found' | 'room'>('idle');
  const [matchedOpponentId, setMatchedOpponentId] = useState<number | null>(null);
  const [acceptCountdown, setAcceptCountdown] = useState<number | null>(null);
  const [practiceRoomId, setPracticeRoomId] = useState<string | null>(null);

  const playerRating = 2645;

  const matchedOpponent = useMemo(
    () => activePlayers.find((player) => player.id === matchedOpponentId) ?? null,
    [matchedOpponentId]
  );

  useEffect(() => {
    if (matchPhase !== 'queue') return;

    const searchingTimeout = window.setTimeout(() => {
      setMatchPhase('searching');

      const availableOpponents = activePlayers
        .filter((player) => player.status === 'Waiting')
        .map((player) => ({ ...player, eloGap: Math.abs(player.rating - playerRating) }))
        .sort((first, second) => first.eloGap - second.eloGap);

      const bestMatch = availableOpponents[0];

      window.setTimeout(() => {
        if (bestMatch) {
          setMatchedOpponentId(bestMatch.id);
          setMatchPhase('found');
          setAcceptCountdown(10);
        } else {
          setMatchPhase('idle');
        }
      }, 1400);
    }, 1200);

    return () => window.clearTimeout(searchingTimeout);
  }, [matchPhase, playerRating]);

  useEffect(() => {
    if (matchPhase !== 'found' || acceptCountdown === null) return;

    if (acceptCountdown <= 0) {
      setMatchedOpponentId(null);
      setMatchPhase('idle');
      setAcceptCountdown(null);
      return;
    }

    const id = window.setTimeout(() => setAcceptCountdown((value) => (value ? value - 1 : null)), 1000);
    return () => window.clearTimeout(id);
  }, [matchPhase, acceptCountdown]);

  const startMatchmaking = () => {
    setPracticeRoomId(null);
    setMatchedOpponentId(null);
    setAcceptCountdown(null);
    setMatchPhase('queue');
  };

  const acceptMatch = () => {
    setAcceptCountdown(null);
    setMatchPhase('room');
  };

  const declineMatch = () => {
    setAcceptCountdown(null);
    setMatchedOpponentId(null);
    setMatchPhase('idle');
  };

  const createPracticeRoom = () => {
    const code = `PR-${Math.floor(1000 + Math.random() * 9000)}`;
    setPracticeRoomId(code);
    setMatchedOpponentId(null);
    setAcceptCountdown(null);
    setMatchPhase('room');
  };

  const renderQueueScreen = () => {
    if (matchPhase === 'found' && matchedOpponent) {
      return (
        <Card className="overflow-hidden border border-[#2d4f74] bg-[#08111f] p-0 shadow-2xl shadow-black/45">
          <div className="grid min-h-[620px] lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative flex items-center justify-center overflow-hidden px-6 py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(62,181,255,0.18)_0%,_rgba(8,17,31,0)_52%),radial-gradient(circle_at_center,_rgba(244,210,122,0.08)_0%,_rgba(8,17,31,0)_68%)]" />
              <div className="relative flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-[360px] w-[360px] rounded-full border border-[#59c7ff]/45" />
                  <div className="absolute h-[300px] w-[300px] rounded-full border-4 border-[#79d8ff]/75 shadow-[0_0_30px_rgba(61,211,255,0.45)]" />
                  <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,_rgba(40,125,215,0.95)_0%,_rgba(13,38,72,0.98)_70%)] shadow-[0_0_70px_rgba(63,181,255,0.35)]">
                    <div className="flex h-24 w-24 items-center justify-center rounded-2xl border-4 border-[#f4d27a] bg-[#0b1a32] text-4xl shadow-lg shadow-black/30">
                      {matchedOpponent.country}
                    </div>
                  </div>
                </div>

                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.42em] text-[#9fe8ff]">Match Found</p>
                <h2 className="mt-4 text-4xl font-black tracking-[0.16em] text-[#f6ead1] sm:text-5xl">MATCH FOUND</h2>
                <p className="mt-3 text-sm text-[#8fa7c1]">Ranked 1v1 • Similar Elo • Ready to accept</p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[#d5dfeb]">
                  <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Your Elo: {playerRating}</span>
                  <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Opponent Elo: {matchedOpponent.rating}</span>
                  <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Accept in {acceptCountdown}s</span>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button className="min-w-[240px] border-2 border-[#79d8ff] bg-[#112544] px-10 py-6 text-xl font-black tracking-[0.12em] text-[#d8f6ff] shadow-[0_0_30px_rgba(81,197,255,0.35)] hover:bg-[#143055]" onClick={acceptMatch}>
                    ACCEPT!
                  </Button>
                  <Button variant="outline" className="border-2 border-[#f4d27a] bg-transparent px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#f4d27a] hover:bg-[#f4d27a]/10" onClick={declineMatch}>
                    DECLINE
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#264059] bg-[#07101d] px-6 py-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#89b4d8]">Finding Match</p>
                <span className="text-lg font-bold text-[#79d8ff]">0:{String(Math.max(0, acceptCountdown ?? 0)).padStart(2, '0')}</span>
              </div>

              <div className="mt-6 rounded-2xl border border-[#264059] bg-[#0a1628] p-4">
                <div className="flex items-center justify-between text-sm text-[#b7c6d9]">
                  <span>Match locked</span>
                  <span>Invite pending</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#20324c]">
                  <div className="h-full w-full rounded-full bg-gradient-to-r from-[#36d8ff] via-[#6fd8ff] to-[#2f7dff]" />
                </div>
                <p className="mt-3 text-xs text-[#7f95b2]">Accept now to enter the room before the countdown ends.</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-[#264059] bg-[#0a1628] px-4 py-3 text-sm text-[#cbd5e1]">
                  {matchedOpponent.name} is ready.
                </div>
                <div className="rounded-2xl border border-[#264059] bg-[#0a1628] px-4 py-3 text-sm text-[#cbd5e1]">
                  Ranked queue style only, no extra popup.
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    if (matchPhase === 'queue' || matchPhase === 'searching') {
      return (
        <Card className="overflow-hidden border border-[#2d4f74] bg-[#08111f] p-0 shadow-2xl shadow-black/45">
          <div className="grid min-h-[620px] lg:grid-cols-[1.35fr_0.65fr]">
            <div className="relative flex items-center justify-center overflow-hidden px-6 py-12">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,_rgba(62,181,255,0.18)_0%,_rgba(8,17,31,0)_52%),radial-gradient(circle_at_center,_rgba(244,210,122,0.08)_0%,_rgba(8,17,31,0)_68%)]" />
              <div className="relative flex flex-col items-center text-center">
                <div className="relative flex items-center justify-center">
                  <div className="absolute h-[360px] w-[360px] rounded-full border border-[#59c7ff]/45" />
                  <div className="absolute h-[300px] w-[300px] rounded-full border-4 border-[#79d8ff]/75 shadow-[0_0_30px_rgba(61,211,255,0.45)]" />
                  <div className="flex h-[220px] w-[220px] items-center justify-center rounded-full bg-[radial-gradient(circle_at_center,_rgba(40,125,215,0.95)_0%,_rgba(13,38,72,0.98)_70%)] shadow-[0_0_70px_rgba(63,181,255,0.35)]">
                    <LoaderCircle className="h-16 w-16 animate-spin text-[#d8f6ff]" />
                  </div>
                </div>

                <p className="mt-8 text-sm font-semibold uppercase tracking-[0.42em] text-[#9fe8ff]">Ready to Queue</p>
                <h2 className="mt-4 text-4xl font-black tracking-[0.16em] text-[#f6ead1] sm:text-5xl">MATCHMAKING</h2>
                <p className="mt-3 text-sm text-[#8fa7c1]">Ranked 1v1 • Similar Elo search • Lobby queue</p>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-3 text-sm text-[#d5dfeb]">
                  <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Your Elo: {playerRating}</span>
                  <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Players in queue: {activePlayers.filter((player) => player.status === 'Waiting').length}</span>
                  <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Estimated: ~3:00</span>
                </div>

                <div className="mt-8 flex flex-wrap justify-center gap-3">
                  <Button className="min-w-[240px] border-2 border-[#79d8ff] bg-[#112544] px-10 py-6 text-xl font-black tracking-[0.12em] text-[#d8f6ff] shadow-[0_0_30px_rgba(81,197,255,0.35)] hover:bg-[#143055]" onClick={startMatchmaking}>
                    FIND MATCH
                  </Button>
                  <Button variant="outline" className="border-2 border-[#f4d27a] bg-transparent px-8 py-3 text-sm font-semibold tracking-[0.18em] text-[#f4d27a] hover:bg-[#f4d27a]/10" onClick={declineMatch}>
                    CANCEL
                  </Button>
                </div>
              </div>
            </div>

            <div className="border-t border-[#264059] bg-[#07101d] px-6 py-6 lg:border-l lg:border-t-0">
              <div className="flex items-center justify-between">
                <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#89b4d8]">In Queue</p>
                <span className="text-lg font-bold text-[#79d8ff]">0:{String(matchPhase === 'searching' ? 3 : 0).padStart(2, '0')}</span>
              </div>

              <div className="mt-6 rounded-2xl border border-[#264059] bg-[#0a1628] p-4">
                <div className="flex items-center justify-between text-sm text-[#b7c6d9]">
                  <span>Searching for similar Elo</span>
                  <span>{matchPhase === 'searching' ? 'Active' : 'Entering queue'}</span>
                </div>
                <div className="mt-3 h-2 rounded-full bg-[#20324c]">
                  <div
                    className="h-full rounded-full bg-gradient-to-r from-[#36d8ff] via-[#6fd8ff] to-[#2f7dff] transition-all"
                    style={{ width: matchPhase === 'searching' ? '88%' : '34%' }}
                  />
                </div>
                <p className="mt-3 text-xs text-[#7f95b2]">Keep the queue open while the system scans for similar Elo.</p>
              </div>

              <div className="mt-6 space-y-3">
                <div className="rounded-2xl border border-[#264059] bg-[#0a1628] px-4 py-3 text-sm text-[#cbd5e1]">
                  Queueing like ranked LoL: lobby queue, match search, accept, room.
                </div>
              </div>
            </div>
          </div>
        </Card>
      );
    }

    return (
      <Card className="border border-[#2d4f74] bg-[#08111f] p-0 shadow-2xl shadow-black/35">
  {/* Thay đổi từ grid 2 cột thành flex để đưa mọi thứ vào giữa */}
  <div className="flex min-h-[620px] w-full items-center justify-center">
    <div className="flex items-center justify-center px-6 py-12 text-center">
      <div className="max-w-2xl space-y-5">
        <p className="text-sm font-semibold uppercase tracking-[0.42em] text-[#9fe8ff]">Ready to Queue</p>
        <h2 className="text-4xl font-black tracking-[0.16em] text-[#f6ead1] sm:text-5xl">RANKED ARENA</h2>
        <p className="text-sm text-[#8fa7c1]">Find your next competitor</p>
        <div className="flex flex-wrap justify-center gap-3 text-sm text-[#d5dfeb]">
          <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Your Elo: {playerRating}</span>
          <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Lobby queue</span>
          <span className="rounded-full border border-[#59c7ff]/30 bg-[#0b1529]/85 px-4 py-2">Accept timer 10s</span>
        </div>
        <Button className="mt-4 min-w-[240px] border-2 border-[#79d8ff] bg-[#112544] px-10 py-6 text-xl font-black tracking-[0.12em] text-[#d8f6ff] shadow-[0_0_30px_rgba(81,197,255,0.35)] hover:bg-[#143055]" onClick={startMatchmaking}>
          FIND MATCH
        </Button>
      </div>
    </div>

          {/* <div className="border-t border-[#264059] bg-[#07101d] px-6 py-6 lg:border-l lg:border-t-0">
            <div className="rounded-2xl border border-[#264059] bg-[#0a1628] p-4">
              <p className="text-xs font-semibold uppercase tracking-[0.32em] text-[#89b4d8]">Queue Preview</p>
              <div className="mt-4 flex items-center justify-between text-sm text-[#b7c6d9]">
                <span>Searching for similar Elo</span>
                <span>Idle</span>
              </div>
              <div className="mt-3 h-2 rounded-full bg-[#20324c]">
                <div className="h-full w-[34%] rounded-full bg-gradient-to-r from-[#36d8ff] via-[#6fd8ff] to-[#2f7dff]" />
              </div>
              <p className="mt-3 text-xs text-[#7f95b2]">The layout will switch to the queue screen once you press Find Match.</p>
            </div>
          </div> */}
        </div>
      </Card>
    );
  };

  const renderContent = () => {
    if (selectedMode === 'history') {
      return (
        <Card className="border-2 border-border p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Match History</h2>
              <p className="mt-2 text-sm text-muted-foreground">Review your last ranked games in a clean LoL-style list.</p>
            </div>
            <Button variant="outline" className="border-border" onClick={() => setSelectedMode('1v1')}>
              Back to Queue
            </Button>
          </div>
          <div className="mt-5 space-y-3 text-sm">
            {[
              { id: 'M-1023', opponent: 'SpeedMaster_JP', result: 'Win', time: '9.12s', date: 'Today' },
              { id: 'M-0998', opponent: 'CubeLegend_CN', result: 'Lose', time: '11.34s', date: 'Yesterday' },
              { id: 'M-0784', opponent: 'FastFingers_US', result: 'Win', time: '8.92s', date: '2 days ago' },
            ].map((match) => (
              <div key={match.id} className="flex items-center justify-between rounded-2xl border border-border bg-muted/20 p-4">
                <div>
                  <p className="font-medium text-foreground">
                    {match.opponent} <span className="text-xs text-muted-foreground">· {match.date}</span>
                  </p>
                  <p className="text-sm text-muted-foreground">Match {match.id} — {match.time}</p>
                </div>
                <div className={`text-sm font-semibold ${match.result === 'Win' ? 'text-green-600' : 'text-red-600'}`}>
                  {match.result}
                </div>
              </div>
            ))}
          </div>
        </Card>
      );
    }

    if (selectedMode === 'practice') {
      return (
        <Card className="border-2 border-border p-6">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
            <div>
              <h2 className="text-2xl font-black text-foreground">Practice Mode</h2>
              <p className="mt-2 text-sm text-muted-foreground">Solo practice, timer drills, or create a custom room.</p>
            </div>
            <Button variant="outline" className="border-border" onClick={() => setSelectedMode('1v1')}>
              Back to Queue
            </Button>
          </div>
          <div className="mt-5 grid gap-3 md:grid-cols-2">
            <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">Start Solo Practice</Button>
            <Button className="w-full border-border" onClick={createPracticeRoom}>Create Practice Room</Button>
          </div>
          <div className="mt-5 rounded-2xl border border-border bg-muted/20 p-4">
            <p className="text-sm font-medium text-foreground">Practice Room</p>
            <p className="mt-1 text-sm text-muted-foreground">
              {practiceRoomId ? `Room code: ${practiceRoomId}` : 'Create a room to invite friends or coach sessions.'}
            </p>
          </div>
        </Card>
      );
    }

    return renderQueueScreen();
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 space-y-5">
          <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Ranking Arena</p>
          <h1 className="text-balance text-4xl font-black tracking-tight text-foreground sm:text-6xl">Ranking Arena for Cubers</h1>
          <p className="max-w-2xl text-lg text-muted-foreground">
            A ranking arena for Rubik's Cube enthusiasts.
          </p>
        </div>

        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {modes.map((mode) => {
            const IconComponent = mode.icon;

            return (
              <Card
                key={mode.id}
                onClick={() => {
                  setSelectedMode(mode.id as '1v1' | 'history' | 'practice');
                  if (mode.id !== 'practice') setPracticeRoomId(null);
                  if (mode.id !== '1v1') {
                    setMatchPhase('idle');
                    setMatchedOpponentId(null);
                    setAcceptCountdown(null);
                  }
                }}
                className={`cursor-pointer border-2 p-6 transition-all ${
                  selectedMode === mode.id
                    ? 'border-primary bg-primary/5 shadow-lg shadow-primary/5'
                    : 'border-border hover:border-primary/40'
                }`}
              >
                <div className="mb-3 flex h-12 w-12 items-center justify-center rounded-xl bg-primary/10">
                  <IconComponent className="h-6 w-6 text-primary" />
                </div>
                <h3 className="font-semibold text-foreground">{mode.name}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{mode.description}</p>
              </Card>
            );
          })}
        </div>

        {renderContent()}
      </div>
    </main>
  );
}
