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
  { id: 'timed', name: 'Timed Challenge', icon: Timer, description: 'Train against the clock' },
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
  const [selectedMode, setSelectedMode] = useState('1v1');
  const [matchPhase, setMatchPhase] = useState<'idle' | 'queue' | 'searching' | 'found' | 'room'>('idle');
  const [matchedOpponentId, setMatchedOpponentId] = useState<number | null>(null);
  const [acceptCountdown, setAcceptCountdown] = useState<number | null>(null);
  const [popupTab, setPopupTab] = useState<'matchmaking' | 'room'>('matchmaking');
  const [popupOpen, setPopupOpen] = useState(false);

  const playerRating = 2645;

  const matchedOpponent = useMemo(
    () => activePlayers.find((player) => player.id === matchedOpponentId) ?? null,
    [activePlayers, matchedOpponentId]
  );

  useEffect(() => {
    if (matchPhase !== 'queue') {
      return;
    }

    const searchingTimeout = window.setTimeout(() => {
      setMatchPhase('searching');

      const availableOpponents = activePlayers
        .filter((player) => player.status === 'Waiting')
        .map((player) => ({
          ...player,
          eloGap: Math.abs(player.rating - playerRating),
        }))
        .sort((first, second) => first.eloGap - second.eloGap);

      const bestMatch = availableOpponents[0];

      window.setTimeout(() => {
        if (bestMatch) {
          setMatchedOpponentId(bestMatch.id);
          // show a 'match found' accept/decline like LoL
          setMatchPhase('found');
          setAcceptCountdown(10);
        } else {
          setMatchPhase('idle');
        }
      }, 1400);
    }, 1200);

    return () => {
      window.clearTimeout(searchingTimeout);
    };
  }, [activePlayers, matchPhase, playerRating]);

  // Countdown effect for accept/decline
  useEffect(() => {
    if (matchPhase !== 'found' || acceptCountdown === null) return;

    if (acceptCountdown <= 0) {
      // timeout: cancel match
      setMatchedOpponentId(null);
      setMatchPhase('idle');
      setAcceptCountdown(null);
      return;
    }

    const id = window.setTimeout(() => setAcceptCountdown((c) => (c ? c - 1 : null)), 1000);
    return () => window.clearTimeout(id);
  }, [matchPhase, acceptCountdown]);

  const startMatchmaking = () => {
    setMatchedOpponentId(null);
    setMatchPhase('queue');
    setPopupTab('matchmaking');
    setPopupOpen(true);
  };

  const acceptMatch = () => {
    setAcceptCountdown(null);
    setMatchPhase('room');
    setPopupTab('room');
  };

  const declineMatch = () => {
    setAcceptCountdown(null);
    setMatchedOpponentId(null);
    setMatchPhase('idle');
  };

  const openPopup = (tab: 'matchmaking' | 'room') => {
    setPopupTab(tab);
    setPopupOpen(true);
  };

  const closePopup = () => {
    setPopupOpen(false);
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />

      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-12 grid gap-8 lg:grid-cols-1">
          <div className="space-y-5">
            <p className="text-sm font-semibold uppercase tracking-[0.3em] text-muted-foreground">Ranking Arena</p>
            <h1 className="text-balance text-4xl font-black tracking-tight text-foreground sm:text-6xl">
              Ranking Arena for Cubers
            </h1>
            <p className="max-w-2xl text-lg text-muted-foreground">
              A ranking arena for Rubik's Cube enthusiasts.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button className="bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white hover:opacity-95" onClick={startMatchmaking}>
                Open Match Popup
              </Button>
              <Button variant="outline" className="border-border" onClick={() => openPopup('room')}>
                View Virtual Room
              </Button>
            </div>
          </div>
        </div>

        {/* Game Modes */}
        <div className="mb-12 grid grid-cols-1 gap-4 sm:grid-cols-3">
          {modes.map((mode) => {
            const IconComponent = mode.icon;
            return (
              <Card
                key={mode.id}
                onClick={() => setSelectedMode(mode.id)}
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

        <div className="grid gap-8 lg:grid-cols-3">
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
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary/10 text-lg">
                        {player.country}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">{player.name}</p>
                        <p className="text-sm text-muted-foreground">Rating: {player.rating}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className={`text-sm font-medium ${
                        player.status === 'Waiting' ? 'text-primary' : 'text-muted-foreground'
                      }`}>
                        {player.status}
                      </span>
                      <Button 
                        className="bg-primary text-primary-foreground hover:bg-primary/90"
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

          <div className="space-y-4">
            <Card className="border-border p-6">
              <h3 className="mb-4 font-semibold text-foreground">Match Controls</h3>
              <div className="space-y-4">
                <div className="rounded-lg border border-dashed border-border bg-card/40 p-4">
                  <p className="text-sm font-medium text-foreground">Queue status</p>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {matchPhase === 'idle' && 'Ready to enter matchmaking queue'}
                    {matchPhase === 'queue' && 'Joining matchmaking queue...'}
                    {matchPhase === 'searching' && 'Searching for opponent with similar Elo...'}
                    {matchPhase === 'room' && 'Virtual room created'}
                  </p>
                </div>

                <div className="space-y-3">
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Your Elo</span>
                    <span className="font-semibold text-primary">{playerRating}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Selected Mode</span>
                    <span className="font-semibold text-foreground">{selectedMode === '1v1' ? '1v1 Match' : 'Other Mode'}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-muted-foreground">Match State</span>
                    <span className="font-semibold text-foreground capitalize">{matchPhase}</span>
                  </div>
                </div>

                <Button
                  className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white hover:opacity-95"
                  onClick={startMatchmaking}
                  disabled={selectedMode !== '1v1' || matchPhase === 'queue' || matchPhase === 'searching' || matchPhase === 'room'}
                >
                  Join Matchmaking 
                </Button>
                <Button variant="outline" className="w-full border-border" onClick={() => openPopup('matchmaking')}>
                  Open Match Popup
                </Button>
              </div>
            </Card>
          </div>
        </div>
      </div>

      <Dialog open={popupOpen} onOpenChange={setPopupOpen}>
        <DialogContent className="max-w-4xl border-border bg-background/98 sm:max-w-4xl">
          <DialogHeader>
            <DialogTitle className="text-2xl">Arena Match Popup</DialogTitle>
            <DialogDescription>
              Switch between Matchmaking and Virtual Room without leaving the Arena.
            </DialogDescription>
          </DialogHeader>

          <Tabs value={popupTab} onValueChange={(value) => setPopupTab(value as 'matchmaking' | 'room')} className="mt-2">
            <TabsList className="grid w-full grid-cols-2 bg-muted p-1">
              <TabsTrigger value="matchmaking">Matchmaking</TabsTrigger>
              <TabsTrigger value="room">Virtual Room</TabsTrigger>
            </TabsList>

            <TabsContent value="matchmaking" className="mt-4 space-y-4 outline-none">
              <div className="grid gap-4 lg:grid-cols-[1.4fr_0.6fr]">
                <Card className="border-border p-6 flex flex-col items-center justify-center text-center">
                  {matchPhase === 'queue' || matchPhase === 'searching' ? (
                    <div className="space-y-4 w-full">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Searching</p>
                      <h3 className="text-3xl font-extrabold text-foreground">Finding a match...</h3>
                      <div className="flex items-center justify-center">
                        <LoaderCircle className="h-12 w-12 animate-spin text-primary" />
                      </div>
                      <p className="text-sm text-muted-foreground">Looking for players with similar Elo. This may take a few seconds.</p>
                      <div className="mx-auto mt-3 w-full max-w-lg">
                        <div className="h-3 w-full rounded-full bg-border">
                          <div className="h-full rounded-full bg-gradient-to-r from-red-500 to-yellow-400 animate-pulse" style={{ width: matchPhase === 'searching' ? '80%' : '30%' }} />
                        </div>
                        <div className="mt-2 flex justify-between text-xs text-muted-foreground">
                          <span>Players in queue: {activePlayers.filter((p) => p.status === 'Waiting').length}</span>
                          <span>Estimated: {matchPhase === 'searching' ? '~3s' : '~7s'}</span>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button className="flex-1 bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white" onClick={declineMatch}>
                          Cancel Search
                        </Button>
                      </div>
                    </div>
                  ) : matchPhase === 'found' && matchedOpponent ? (
                    <div className="space-y-4 w-full">
                      <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Match Found</p>
                      <h3 className="text-3xl font-extrabold text-foreground">Opponent Ready</h3>
                      <div className="mx-auto mt-2 flex w-full max-w-md items-center justify-between gap-4 rounded-2xl border border-border p-4">
                        <div className="flex items-center gap-4">
                          <div className="flex h-16 w-16 items-center justify-center rounded-full bg-primary/10 text-2xl">
                            {matchedOpponent.country}
                          </div>
                          <div className="text-left">
                            <p className="font-bold text-foreground">{matchedOpponent.name}</p>
                            <p className="text-sm text-muted-foreground">Elo {matchedOpponent.rating}</p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-muted-foreground">Accept to enter room</p>
                          <p className="text-2xl font-extrabold text-accent">{acceptCountdown}s</p>
                        </div>
                      </div>
                      <div className="mt-4 flex gap-3">
                        <Button className="flex-1 bg-primary text-primary-foreground hover:bg-primary/90" onClick={acceptMatch}>
                          Accept
                        </Button>
                        <Button variant="outline" className="flex-1 border-border" onClick={declineMatch}>
                          Decline
                        </Button>
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-3 w-full text-sm text-muted-foreground">
                      <p>No opponent locked yet. Click below to start searching with LoL-style matchmaking UI.</p>
                      <Button className="w-full bg-gradient-to-r from-red-500 via-orange-500 to-yellow-400 text-white" onClick={startMatchmaking}>
                        Start Search
                      </Button>
                    </div>
                  )}
                </Card>

                <Card className="border-border p-5">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-semibold text-foreground">Match Info</h3>
                    <Crown className="h-5 w-5 text-yellow-500" />
                  </div>
                  <div className="mt-4 space-y-3 text-sm text-muted-foreground">
                    <div className="flex items-center justify-between">
                      <span>Mode</span>
                      <span className="font-medium text-foreground">1v1</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Your Elo</span>
                      <span className="font-medium text-foreground">{playerRating}</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Target Elo gap</span>
                      <span className="font-medium text-foreground">± 120</span>
                    </div>
                    <div className="flex items-center justify-between">
                      <span>Players in queue</span>
                      <span className="font-medium text-foreground">{activePlayers.filter((p) => p.status === 'Waiting').length}</span>
                    </div>
                  </div>
                </Card>
              </div>
            </TabsContent>

            <TabsContent value="room" className="mt-4 space-y-4 outline-none">
              <Card className="border-border p-5">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm font-semibold uppercase tracking-[0.24em] text-muted-foreground">Virtual Room</p>
                    <h3 className="mt-1 text-xl font-bold text-foreground">Room VN-2048</h3>
                  </div>
                  <Rocket className="h-5 w-5 text-red-500" />
                </div>

                {matchPhase === 'room' && matchedOpponent ? (
                  <div className="mt-4 grid gap-4 md:grid-cols-2">
                    <div className="rounded-2xl border border-border bg-red-500/5 p-4">
                      <p className="text-sm text-muted-foreground">You</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{playerRating}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Ready in the room</p>
                    </div>
                    <div className="rounded-2xl border border-border bg-blue-500/5 p-4">
                      <p className="text-sm text-muted-foreground">Opponent</p>
                      <p className="mt-1 text-2xl font-black text-foreground">{matchedOpponent.name}</p>
                      <p className="mt-2 text-sm text-muted-foreground">Elo {matchedOpponent.rating}</p>
                    </div>
                  </div>
                ) : (
                  <div className="mt-4 rounded-2xl border border-dashed border-border bg-muted/30 p-4 text-sm text-muted-foreground">
                    No room yet. Matchmaking will automatically create the virtual room after an opponent is found.
                  </div>
                )}

                <div className="mt-4 flex flex-wrap gap-3">
                  <Button className="bg-foreground text-background hover:bg-foreground/90" disabled={!matchedOpponent}>
                    Enter Match
                  </Button>
                  <Button variant="outline" className="border-border" onClick={() => setPopupTab('matchmaking')}>
                    Back to Matchmaking
                  </Button>
                  <Button variant="ghost" className="ml-auto" onClick={closePopup}>
                    <X className="mr-2 h-4 w-4" />
                    Close Popup
                  </Button>
                </div>
              </Card>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </main>
  );
}
