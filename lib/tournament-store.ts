'use client';

export type TournamentFormat = 'Traditional' | 'Medley';

export interface Tournament {
  id: number;
  name: string;
  status: 'Registration Open' | 'In Progress' | 'Starting Soon' | 'Completed';
  date: string;
  participants: number;
  maxParticipants: number;
  prizePool: string;
  format: string;
  formatType: TournamentFormat;
  tier: string;
  round: number;
}

export interface Competitor {
  qrCode: string;
  name: string;
  email: string;
  tournamentId: number;
  solves: {
    attempt: number;
    time: number; // elapsed in milliseconds
    penalty: 'None' | '+2' | 'DNF';
    isMedley?: boolean;
    medleyDetails?: { puzzle: string; time: number; penalty: 'None' | '+2' | 'DNF' }[];
  }[];
}

const DEFAULT_TOURNAMENTS: Tournament[] = [
  {
    id: 1,
    name: 'Global Speedcubing Championship 2026',
    status: 'Registration Open',
    date: 'June 15-17, 2026',
    participants: 1248,
    maxParticipants: 2000,
    prizePool: '$50,000',
    format: '3x3 Speedcubing',
    formatType: 'Traditional',
    tier: 'Tier S',
    round: 1
  },
  {
    id: 2,
    name: 'Asia Pacific Regional Cup 2026',
    status: 'In Progress',
    date: 'June 5-10, 2026',
    participants: 780,
    maxParticipants: 800,
    prizePool: '$12,000',
    format: 'Mixed Events',
    formatType: 'Medley',
    tier: 'Tier A',
    round: 1
  },
  {
    id: 3,
    name: 'Pro Speed Run Showdown',
    status: 'Starting Soon',
    date: 'June 20, 2026',
    participants: 89,
    maxParticipants: 500,
    prizePool: '$8,000',
    format: '2x2 & 3x3 Sprint',
    formatType: 'Traditional',
    tier: 'Tier B',
    round: 1
  }
];

const DEFAULT_COMPETITORS: Competitor[] = [
  {
    qrCode: 'QR-428761',
    name: 'SpeedMaster_JP',
    email: 'master@cubenexus.jp',
    tournamentId: 2,
    solves: [
      {
        attempt: 1,
        time: 12420,
        penalty: 'None',
        isMedley: true,
        medleyDetails: [
          { puzzle: '3x3', time: 12420, penalty: 'None' },
          { puzzle: 'Skewb', time: 7880, penalty: '+2' },
          { puzzle: 'Pyraminx', time: 6350, penalty: 'None' }
        ]
      }
    ]
  }
];

export function getTournaments(): Tournament[] {
  if (typeof window === 'undefined') return DEFAULT_TOURNAMENTS;
  const data = localStorage.getItem('cubenexus_tournaments');
  if (!data) {
    localStorage.setItem('cubenexus_tournaments', JSON.stringify(DEFAULT_TOURNAMENTS));
    return DEFAULT_TOURNAMENTS;
  }
  return JSON.parse(data);
}

export function saveTournaments(data: Tournament[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cubenexus_tournaments', JSON.stringify(data));
}

export function getCompetitors(): Competitor[] {
  if (typeof window === 'undefined') return DEFAULT_COMPETITORS;
  const data = localStorage.getItem('cubenexus_competitors');
  if (!data) {
    localStorage.setItem('cubenexus_competitors', JSON.stringify(DEFAULT_COMPETITORS));
    return DEFAULT_COMPETITORS;
  }
  return JSON.parse(data);
}

export function saveCompetitors(data: Competitor[]) {
  if (typeof window === 'undefined') return;
  localStorage.setItem('cubenexus_competitors', JSON.stringify(data));
}
