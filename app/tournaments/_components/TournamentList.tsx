'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Calendar, Users, Trophy, Zap, Search, SlidersHorizontal, ArrowRight } from 'lucide-react';

interface Tournament {
  id: number;
  name: string;
  status: string;
  date: string;
  participants: number;
  maxParticipants: number;
  prizePool: string;
  format: string;
  type: 'Traditional' | 'Medley';
}

interface TournamentListProps {
  onOpenFlow: (action: 'register' | 'checkin') => void;
}

export function TournamentList({ onOpenFlow }: TournamentListProps) {
  const [filter, setFilter] = useState<'all' | 'open' | 'live' | 'medley'>('all');
  const [search, setSearch] = useState('');

  const tournaments: Tournament[] = [
    {
      id: 1,
      name: 'Global Championship 2025',
      status: 'Registration Open',
      date: 'June 15-17, 2025',
      participants: 1248,
      maxParticipants: 2000,
      prizePool: '$50,000',
      format: '3x3 Speedcubing (Traditional)',
      type: 'Traditional',
    },
    {
      id: 2,
      name: 'Asian Regional Cup',
      status: 'In Progress',
      date: 'May 20 - June 5, 2025',
      participants: 542,
      maxParticipants: 800,
      prizePool: '$12,000',
      format: 'Medley (2x2 + 3x3 + 4x4)',
      type: 'Medley',
    },
    {
      id: 3,
      name: 'Speed Run Championship',
      status: 'Starting Soon',
      date: 'June 1, 2025',
      participants: 89,
      maxParticipants: 500,
      prizePool: '$8,000',
      format: '2x2 & 3x3 (Traditional)',
      type: 'Traditional',
    },
    {
      id: 4,
      name: 'Blind Cube Masters',
      status: 'Registration Open',
      date: 'June 8-9, 2025',
      participants: 234,
      maxParticipants: 400,
      prizePool: '$6,000',
      format: '3x3 Blindfolded (Traditional)',
      type: 'Traditional',
    },
    {
      id: 5,
      name: 'Weekly Medley Sprint',
      status: 'In Progress',
      date: 'Ongoing (Weekly)',
      participants: 3200,
      maxParticipants: 5000,
      prizePool: '$2,000/week',
      format: 'Medley (3x3 + OH + Pyraminx)',
      type: 'Medley',
    },
    {
      id: 6,
      name: 'Youth Championship U18',
      status: 'Registration Open',
      date: 'June 22-23, 2025',
      participants: 456,
      maxParticipants: 800,
      prizePool: '$4,000',
      format: '3x3 & 2x2 (Traditional)',
      type: 'Traditional',
    },
  ];

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'Registration Open':
        return (
          <Badge className="bg-emerald-500/15 text-emerald-600 border border-emerald-500/20 hover:bg-emerald-500/20">
            Registration Open
          </Badge>
        );
      case 'In Progress':
        return (
          <Badge className="bg-blue-500/15 text-blue-600 border border-blue-500/20 hover:bg-blue-500/20 animate-pulse">
            Live In Progress
          </Badge>
        );
      case 'Starting Soon':
        return (
          <Badge className="bg-amber-500/15 text-amber-600 border border-amber-500/20 hover:bg-amber-500/20">
            Starting Soon
          </Badge>
        );
      default:
        return <Badge variant="secondary">Completed</Badge>;
    }
  };

  const filteredTournaments = tournaments.filter((tournament) => {
    const matchesSearch = tournament.name.toLowerCase().includes(search.toLowerCase()) || 
                          tournament.format.toLowerCase().includes(search.toLowerCase());
    
    if (!matchesSearch) return false;
    if (filter === 'open') return tournament.status === 'Registration Open';
    if (filter === 'live') return tournament.status === 'In Progress';
    if (filter === 'medley') return tournament.type === 'Medley';
    return true;
  });

  return (
    <div>
      {/* Controls */}
      <div className="mb-8 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            onClick={() => setFilter('all')}
            variant={filter === 'all' ? 'default' : 'outline'}
            className={filter === 'all' ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm' : 'border-border'}
          >
            All Events
          </Button>
          <Button
            onClick={() => filter === 'open' ? setFilter('all') : setFilter('open')}
            variant={filter === 'open' ? 'default' : 'outline'}
            className={filter === 'open' ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm' : 'border-border'}
          >
            Registration Open
          </Button>
          <Button
            onClick={() => filter === 'live' ? setFilter('all') : setFilter('live')}
            variant={filter === 'live' ? 'default' : 'outline'}
            className={filter === 'live' ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm' : 'border-border'}
          >
            Live Boards
          </Button>
          <Button
            onClick={() => filter === 'medley' ? setFilter('all') : setFilter('medley')}
            variant={filter === 'medley' ? 'default' : 'outline'}
            className={filter === 'medley' ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm' : 'border-border'}
          >
            Medley Events
          </Button>
        </div>

        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search tournaments..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full rounded-xl border border-border bg-card pl-9 pr-4 py-2 text-sm placeholder-muted-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
          />
        </div>
      </div>

      {/* Grid */}
      <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
        {filteredTournaments.map((tournament) => {
          const progressPercent = Math.round((tournament.participants / tournament.maxParticipants) * 100);
          return (
            <Card
              key={tournament.id}
              className="group overflow-hidden border border-border bg-card transition-all duration-300 hover:-translate-y-1.5 hover:shadow-lg flex flex-col justify-between"
            >
              {/* Header */}
              <div className="border-b border-border bg-gradient-to-r from-accent/5 via-transparent to-transparent p-6">
                <div className="flex items-start justify-between gap-4">
                  <span className="inline-flex items-center gap-1 rounded-full bg-accent/10 px-2 py-0.5 text-[10px] font-bold text-accent uppercase tracking-wider">
                    {tournament.type}
                  </span>
                  {getStatusBadge(tournament.status)}
                </div>
                <h3 className="mt-4 text-xl font-bold text-foreground leading-snug group-hover:text-accent transition-colors">
                  {tournament.name}
                </h3>
              </div>

              {/* Body */}
              <div className="p-6 space-y-4 flex-grow">
                <div className="space-y-2.5">
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Calendar className="h-4.5 w-4.5 text-accent/75" />
                    <span className="text-sm font-medium">{tournament.date}</span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Users className="h-4.5 w-4.5 text-accent/75" />
                    <span className="text-sm font-medium">
                      {tournament.participants.toLocaleString()} / {tournament.maxParticipants.toLocaleString()} cubers
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Trophy className="h-4.5 w-4.5 text-amber-500" />
                    <span className="text-sm font-bold text-foreground">
                      Prize Pool: <span className="text-amber-500">{tournament.prizePool}</span>
                    </span>
                  </div>
                  <div className="flex items-center gap-3 text-muted-foreground">
                    <Zap className="h-4.5 w-4.5 text-accent/75" />
                    <span className="text-sm font-medium text-foreground/80">{tournament.format}</span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="pt-2">
                  <div className="mb-2 flex items-center justify-between text-xs font-semibold text-muted-foreground">
                    <span>Slots Filled</span>
                    <span>{progressPercent}%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted overflow-hidden border border-border/30">
                    <div
                      className="h-full rounded-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-500"
                      style={{ width: `${progressPercent}%` }}
                    />
                  </div>
                </div>
              </div>

              {/* Action */}
              <div className="border-t border-border/70 p-6 bg-muted/20">
                <Button
                  onClick={() => {
                    if (tournament.status === 'Registration Open') {
                      onOpenFlow('register');
                    } else {
                      onOpenFlow('checkin');
                    }
                  }}
                  className="w-full bg-accent text-accent-foreground hover:bg-accent/90 border border-accent/20 group-hover:shadow-md transition-all duration-300 font-semibold flex items-center justify-center gap-2"
                >
                  {tournament.status === 'Registration Open' ? (
                    <>
                      Register for Event <ArrowRight className="h-4 w-4" />
                    </>
                  ) : (
                    'View Details & Scores'
                  )}
                </Button>
              </div>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
