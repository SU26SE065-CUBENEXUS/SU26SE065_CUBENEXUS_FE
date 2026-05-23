'use client';

import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Calendar, Users, Trophy, Zap } from 'lucide-react';

export default function TournamentsPage() {
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

  return (
    <main className="min-h-screen bg-background">
      <Header />
      
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page Header */}
        <div className="mb-12">
          <h1 className="text-balance text-4xl font-bold tracking-tight text-foreground sm:text-5xl">
            Tournaments
          </h1>
          <p className="mt-4 text-lg text-muted-foreground">
            Compete in tournaments worldwide and win amazing prizes
          </p>
        </div>

        {/* Filters */}
        <div className="mb-8 flex flex-wrap gap-3">
          <Button className="bg-accent text-accent-foreground hover:bg-accent/90">
            All Events
          </Button>
          <Button variant="outline" className="border-border">
            Registration Open
          </Button>
          <Button variant="outline" className="border-border">
            Starting Soon
          </Button>
          <Button variant="outline" className="border-border">
            In Progress
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
                <Button className="w-full bg-accent text-accent-foreground hover:bg-accent/90">
                  {tournament.status === 'Registration Open' ? 'Register Now' : 'View Details'}
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
    </main>
  );
}
