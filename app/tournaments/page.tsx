'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, Suspense } from 'react';
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
import { 
  Calendar, 
  QrCode, 
  Trophy, 
  Users, 
  Zap, 
  Search, 
  Info,
  Sparkles,
  Ticket,
  ChevronRight,
  Clock,
  MapPin,
  Flame,
  Award,
  Bell,
  CheckCircle,
  ShieldAlert,
  LoaderCircle as LoaderCircleIcon 
} from 'lucide-react';
import { 
  getTournaments, 
  saveTournaments, 
  getCompetitors, 
  saveCompetitors, 
  Tournament, 
  Competitor
} from '@/lib/tournament-store';
import { useAuth } from '@/contexts/auth-context';

type ActiveTab = 'explore' | 'my-tournaments' | 'live-results';
type DetailSubTab = 'overview' | 'events' | 'schedule' | 'competitors' | 'live-board' | 'rules';

const getStatusColor = (status: string) => {
  switch (status) {
    case 'Registration Open':
      return 'bg-[#eab308]/15 border border-[#eab308]/30 text-[#eab308]';
    case 'In Progress':
    case 'Ongoing':
      return 'bg-emerald-500/15 border border-emerald-500/30 text-emerald-400';
    case 'Starting Soon':
    case 'Upcoming':
      return 'bg-sky-500/15 border border-sky-500/30 text-sky-400';
    case 'Cancelled':
      return 'bg-red-500/15 border border-red-500/30 text-red-400';
    default:
      return 'bg-zinc-800 border border-zinc-700 text-zinc-400';
  }
};

function TournamentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailParam = searchParams.get('details');

  const { user, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState('All');
  
  // Detail Sub-Tab State
  const [activeDetailTab, setActiveDetailTab] = useState<DetailSubTab>('overview');

  // Store States
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);

  // Registration modal states
  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [targetTournament, setTargetTournament] = useState<Tournament | null>(null);
  
  // Selected registered events checkbox states
  const [selectedEvents, setSelectedEvents] = useState({
    '3x3x3': true,
    '2x2x2': false,
    'Pyraminx': false,
    'Medley': false
  });

  const [regName, setRegName] = useState('CuberNexus_Pro');
  const [regEmail, setRegEmail] = useState('cuber@cubenexus.app');
  const [feedback, setFeedback] = useState<string | null>(null);

  // Tournament detail view states
  const [selectedTourDetails, setSelectedTourDetails] = useState<Tournament | null>(null);



  // Mock Notifications for Player
  const mockNotifications = [
    { text: "You have been assigned to Group 2.", time: "5 mins ago" },
    { text: "Please go to Station 5.", time: "10 mins ago" },
    { text: "Your 3x3 Round 1 starts in 10 minutes.", time: "15 mins ago" },
    { text: "Your result has been successfully submitted.", time: "1 hour ago" }
  ];

  // Mock schedule assigned for player
  const mockPlayerSchedule = {
    event: '3x3x3 Speedcubing',
    round: 'Round 1',
    group: 'Group 2',
    station: 'Table 5',
    time: '09:30 AM'
  };

  // Mock results for player
  const mockPlayerResults = {
    event: '3x3x3 Round 1',
    solves: [
      { id: 1, val: '12.34s', penalty: 'None' },
      { id: 2, val: '13.10s', penalty: '+2' },
      { id: 3, val: '11.90s', penalty: 'None' },
      { id: 4, val: 'DNF', penalty: 'DNF' },
      { id: 5, val: '12.50s', penalty: 'None' }
    ],
    finalAvg: '12.65s',
    rank: '#24'
  };

  // List of public static events detailed info
  const eventsDetails = [
    { name: '3x3x3 Cube', format: 'Average of 5', timeLimit: '10 minutes', cutoff: '1 minute', rounds: 2 },
    { name: '2x2x2 Cube', format: 'Average of 5', timeLimit: '5 minutes', cutoff: '30 seconds', rounds: 1 },
    { name: 'Pyraminx', format: 'Average of 5', timeLimit: '5 minutes', cutoff: '30 seconds', rounds: 1 },
    { name: 'Medley Relay', format: 'Total time', timeLimit: '15 minutes', cutoff: '3 minutes', rounds: 1 }
  ];

  // List of schedule
  const scheduleDetails = [
    { time: '08:00 AM', event: 'Competitors & Judges Check-in opens' },
    { time: '09:00 AM', event: '3x3x3 Speedcubing Round 1' },
    { time: '10:30 AM', event: '2x2x2 Speedcubing Round 1' },
    { time: '11:30 AM', event: 'Pyraminx Round 1' },
    { time: '01:00 PM', event: 'Medley Relay Finals' },
    { time: '02:30 PM', event: '3x3x3 Speedcubing Final Round' },
    { time: '04:00 PM', event: 'Awards & Closing ceremony' }
  ];

  // List of rules
  const rulesDetails = [
    { rule: 'Time limit', desc: 'Each solve attempt must be completed under the event-specific time limit (e.g. 10 minutes for 3x3x3).' },
    { rule: 'Cut-off limit', desc: 'Competitors must solve below the cut-off time in their first 2 attempts to unlock the remaining 3 attempts.' },
    { rule: 'Penalty +2', desc: 'A 2-second penalty (+2s) is applied if the cube is one turn away from solved state, or for timer starts/stops violations.' },
    { rule: 'DNF Rule', desc: 'Did Not Finish (DNF) is assigned if the puzzle is unresolved, or if the competitor halts the timer prematurely.' }
  ];

  useEffect(() => {
    // Generate default/current tournaments
    const defaultTours: Tournament[] = [
      {
        id: 1,
        name: 'CubeNexus Open 2026',
        status: 'Registration Open',
        date: 'June 12-14, 2026',
        participants: 124,
        maxParticipants: 500,
        prizePool: '$8,000',
        format: '3x3, 2x2, Pyraminx, Medley',
        formatType: 'Traditional',
        tier: 'Tier A',
        round: 1
      },
      {
        id: 2,
        name: 'Asian Speedcubing Cup 2026',
        status: 'In Progress',
        date: 'June 08-10, 2026',
        participants: 780,
        maxParticipants: 800,
        prizePool: '$12,000',
        format: 'Mixed Medley Relay',
        formatType: 'Medley',
        tier: 'Tier S',
        round: 2
      },
      {
        id: 3,
        name: 'Speed Run Showdown U18',
        status: 'Starting Soon',
        date: 'June 20, 2026',
        participants: 45,
        maxParticipants: 300,
        prizePool: '$4,000',
        format: '2x2 & 3x3 Sprint',
        formatType: 'Traditional',
        tier: 'Tier B',
        round: 1
      },
      {
        id: 4,
        name: 'Global Championship Series',
        status: 'Completed',
        date: 'May 15-17, 2026',
        participants: 2000,
        maxParticipants: 2000,
        prizePool: '$50,000',
        format: '3x3, 2x2, Pyraminx',
        formatType: 'Traditional',
        tier: 'Tier S',
        round: 3
      }
    ];

    if (getTournaments().length === 0) {
      saveTournaments(defaultTours);
    }
    setTournaments(getTournaments());
    setCompetitors(getCompetitors());
  }, []);

  // Protected Route Guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Sync logged in user details to registration name and email
  useEffect(() => {
    if (user) {
      setRegName(user.displayName || 'Competitor');
      setRegEmail(user.email || '');
    }
  }, [user]);

  useEffect(() => {
    if (detailParam) {
      const tour = tournaments.find(t => String(t.id) === detailParam);
      if (tour) {
        setSelectedTourDetails(tour);
        setActiveDetailTab('overview');
      }
    } else {
      setSelectedTourDetails(null);
    }
  }, [detailParam, tournaments]);

  const openDetails = (id: number) => {
    router.push(`/tournaments?details=${id}`);
  };

  const closeDetails = () => {
    setSelectedTourDetails(null);
    router.replace('/tournaments');
  };

  const openRegister = (tour: Tournament) => {
    setTargetTournament(tour);
    setShowRegisterModal(true);
    setFeedback(null);
  };

  const closeRegister = () => {
    setShowRegisterModal(false);
    setTargetTournament(null);
    setFeedback(null);
  };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter(t => {
      const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.format.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFormat = filterFormat === 'All' || t.status === filterFormat;
      return matchSearch && matchFormat;
    });
  }, [searchTerm, filterFormat, tournaments]);

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetTournament) return;
    
    const qrCode = `QR-${Math.floor(100000 + Math.random() * 900000)}`;
    const selectedList = Object.entries(selectedEvents)
      .filter(([_, checked]) => checked)
      .map(([name]) => name);

    const newCompetitor: Competitor = {
      qrCode,
      name: regName,
      email: regEmail,
      tournamentId: targetTournament.id,
      solves: []
    };

    // Increment participants count
    const updatedTournaments = tournaments.map(t => {
      if (t.id === targetTournament.id) {
        return { ...t, participants: Math.min(t.maxParticipants, t.participants + 1) };
      }
      return t;
    });

    const updatedCompetitors = [...competitors, newCompetitor];
    
    setTournaments(updatedTournaments);
    saveTournaments(updatedTournaments);
    
    setCompetitors(updatedCompetitors);
    saveCompetitors(updatedCompetitors);

    setFeedback(`Success: Registered for events [${selectedList.join(', ')}]. Check-in Ticket QR Code generated: ${qrCode}`);
    
    setTimeout(() => {
      closeRegister();
      setActiveTab('my-tournaments');
    }, 2500);
  };

  // Compute standings for detail popup
  const tournamentCompetitors = useMemo(() => {
    if (!selectedTourDetails) return [];
    return competitors.filter(c => c.tournamentId === selectedTourDetails.id);
  }, [selectedTourDetails, competitors]);

  const computedStandings = useMemo(() => {
    return tournamentCompetitors.map(c => {
      const validTimes = c.solves
        .filter(s => s.penalty !== 'DNF')
        .map(s => s.time + (s.penalty === '+2' ? 2000 : 0));
      const best = validTimes.length > 0 ? Math.min(...validTimes) : null;
      return {
        name: c.name,
        qr: c.qrCode,
        bestTime: best ? (best / 1000).toFixed(3) + 's' : 'Waiting attempt',
        solvesCount: c.solves.length
      };
    }).sort((a, b) => a.rawBest - b.rawBest);
  }, [tournamentCompetitors]);
  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[300px]">
        <LoaderCircleIcon className="h-8 w-8 animate-spin text-[#eab308]" />
      </div>
    );
  }

  if (!isAuthenticated) {
    return null;
  }

  return (
    <div className="space-y-12">
      {/* Banner Section */}
      <Card className="border border-border bg-card p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-black/10">
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_50%)]" />
        <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
          <div className="space-y-3">
            <div className="flex flex-wrap items-center gap-3">
              <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308] flex items-center gap-1">
                <Sparkles className="h-3 w-3" /> Public Tournament Portal
              </span>
              <span className="text-muted-foreground text-xs font-medium">• Browse, register, check schedule & standings</span>
            </div>
            <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
              TOURNAMENTS
            </h1>
            <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
              Browse WCA standardized Speedcubing brackets. Join matches, receive check-in tickets, and follow real-time leaderboards.
            </p>
          </div>

        </div>
      </Card>

      {/* Tab Controls */}
      <div className="flex gap-2 bg-card/40 border border-border/60 p-2 rounded-2xl w-fit">
        <button
          onClick={() => setActiveTab('explore')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all ${
            activeTab === 'explore'
              ? 'bg-[#eab308] text-black font-black shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          All Tournaments
        </button>
        <button
          onClick={() => setActiveTab('my-tournaments')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'my-tournaments'
              ? 'bg-[#eab308] text-black font-black shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          My Tournaments
        </button>
        <button
          onClick={() => setActiveTab('live-results')}
          className={`px-6 py-2.5 rounded-xl text-xs font-bold transition-all flex items-center gap-1.5 ${
            activeTab === 'live-results'
              ? 'bg-[#eab308] text-black font-black shadow-md'
              : 'text-muted-foreground hover:text-foreground'
          }`}
        >
          Live Results
        </button>
      </div>

      {/* Tab 1: All Tournaments */}
      {activeTab === 'explore' && (
        <div className="space-y-6">
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-4 bg-card/40 border border-border/60 p-4 rounded-2xl">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input 
                type="text" 
                placeholder="Search active tournaments, formats, or locations..." 
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full bg-muted/20 border border-border rounded-xl pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none focus:border-[#eab308]"
              />
            </div>
            <div className="flex gap-2">
              {['All', 'Registration Open', 'In Progress', 'Starting Soon'].map((f) => (
                <button
                  key={f}
                  onClick={() => setFilterFormat(f)}
                  className={`px-4 py-2.5 rounded-xl border text-[11px] font-bold transition-all ${
                    filterFormat === f 
                      ? 'border-[#eab308] bg-[#eab308]/5 text-[#eab308]' 
                      : 'border-border bg-transparent text-muted-foreground hover:text-foreground hover:border-border/80'
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>
          </div>

          {/* Tournaments list grid */}
          <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
            {filteredTournaments.map((tour) => (
              <Card key={tour.id} className="border border-border/60 bg-card overflow-hidden flex flex-col justify-between rounded-2xl hover:shadow-lg hover:border-[#eab308]/30 transition-all duration-300">
                <div className="border-b border-border bg-gradient-to-r from-[#eab308]/5 to-transparent p-6">
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <span className="text-[10px] font-extrabold uppercase text-[#eab308] tracking-widest">{tour.tier}</span>
                      <h3 className="text-base font-black text-foreground leading-snug">{tour.name}</h3>
                    </div>
                    <span className={`inline-flex rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wider ${getStatusColor(tour.status)}`}>
                      {tour.status}
                    </span>
                  </div>
                </div>

                <div className="p-6 space-y-4 flex-grow">
                  <div className="space-y-2.5 text-xs text-muted-foreground">
                    <p className="flex items-center gap-2"><Calendar className="h-4 w-4 text-[#eab308]" /> {tour.date}</p>
                    <p className="flex items-center gap-2"><MapPin className="h-4 w-4 text-[#eab308]" /> Ho Chi Minh City</p>
                    <p className="flex items-center gap-2"><Users className="h-4 w-4 text-[#eab308]" /> {tour.participants} / {tour.maxParticipants} seeds</p>
                    <p className="flex items-center gap-2"><Zap className="h-4 w-4 text-[#eab308]" /> Events: {tour.format}</p>
                  </div>
                </div>

                <div className="border-t border-border/80 p-5 bg-muted/10 flex gap-2">
                  <Button 
                    variant="outline" 
                    onClick={() => openDetails(tour.id)}
                    className="flex-grow border-border text-xs rounded-xl bg-transparent font-bold py-5 hover:text-[#eab308]"
                  >
                    View Details
                  </Button>
                  
                  {tour.status === 'Registration Open' && (
                    <Button 
                      onClick={() => openRegister(tour)}
                      className="flex-grow bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold text-xs rounded-xl py-5"
                    >
                      Register Now
                    </Button>
                  )}
                </div>
              </Card>
            ))}
          </div>
        </div>
      )}

      {/* Tab 2: My Tournaments */}
      {activeTab === 'my-tournaments' && (
        <div className="space-y-8">
          {user?.role?.toUpperCase() === 'MANAGER' || user?.role?.toUpperCase() === 'ADMIN' ? (
            <Card className="border border-dashed border-border p-12 rounded-3xl text-center space-y-4 max-w-xl mx-auto">
              <Trophy className="h-12 w-12 mx-auto text-[#eab308]" />
              <h3 className="text-lg font-black uppercase text-foreground">Manager Portal Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are authenticated as a Manager / Administrator. Please access the Manager Portal to construct matches, assign groups, and manage tournament brackets.
              </p>
              <div className="flex gap-2 justify-center pt-2">
                <Button asChild className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-black px-6 rounded-xl">
                  <Link href="/managertournaments">GO TO MANAGER PORTAL</Link>
                </Button>
              </div>
            </Card>
          ) : (
            <div className="grid gap-8 lg:grid-cols-3">
              {/* Registrations List and QR check-in */}
              <div className="lg:col-span-2 space-y-6">
                <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-2">
                  <Ticket className="h-4.5 w-4.5" /> My Registered Tournaments
                </h3>
                
                {competitors.length > 0 ? (
                  <div className="grid gap-6 sm:grid-cols-2">
                    {competitors.map((ticket) => {
                      const tour = tournaments.find(t => t.id === ticket.tournamentId);
                      return (
                        <Card key={ticket.qrCode} className="border border-border/60 bg-card p-6 rounded-2xl relative overflow-hidden flex flex-col justify-between shadow-sm">
                          <div className="space-y-4">
                            <div className="flex justify-between items-start">
                              <div>
                                <span className="text-[9px] font-black bg-[#eab308]/15 border border-[#eab308]/25 text-[#eab308] px-2.5 py-0.5 rounded uppercase">
                                  Status: Confirmed
                                </span>
                                <h4 className="mt-2 text-base font-black text-foreground">{tour?.name || 'Tournament'}</h4>
                              </div>
                              <QrCode className="h-10 w-10 text-[#eab308] opacity-80" />
                            </div>
                            
                            <div className="space-y-2 text-xs text-muted-foreground font-semibold">
                              <p>Events: <span className="text-foreground">3x3x3, 2x2x2</span></p>
                              <p>QR Ticket: <span className="text-foreground font-mono">{ticket.qrCode}</span></p>
                            </div>
                          </div>

                          {/* Ticket QR instruction overlay */}
                          <div className="mt-6 pt-4 border-t border-border/60 bg-muted/5 rounded-xl p-3.5 space-y-3">
                            <div className="flex items-center justify-center p-2 bg-white rounded-lg w-28 h-28 mx-auto">
                              <div className="w-24 h-24 bg-[radial-gradient(circle_at_center,black_40%,transparent_42%)] bg-[size:10px_10px]" />
                            </div>
                            <p className="text-[10px] text-center text-muted-foreground">
                              Scan this QR ticket at the active lane station to solve.
                            </p>
                          </div>
                        </Card>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-16 text-center text-muted-foreground border border-dashed border-border rounded-2xl">
                    <Ticket className="h-8 w-8 mx-auto mb-2 text-muted-foreground/60" />
                    <p className="text-xs font-semibold">You haven't registered for any active tournament brackets.</p>
                  </div>
                )}

                {/* Personal Schedule Card */}
                <Card className="border border-border bg-card p-6 rounded-2xl space-y-4">
                  <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-1.5">
                    <Clock className="h-4.5 w-4.5" /> My Solve Schedule
                  </h4>
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    <div className="border border-border/60 rounded-xl p-4 bg-muted/10 space-y-2">
                      <div className="flex justify-between items-center text-[10px] font-bold text-muted-foreground uppercase border-b border-border pb-1">
                        <span>{mockPlayerSchedule.event}</span>
                        <span className="text-[#eab308]">{mockPlayerSchedule.round}</span>
                      </div>
                      <p className="font-semibold">Group Assignment: <span className="text-foreground font-extrabold">{mockPlayerSchedule.group}</span></p>
                      <p className="font-semibold">Target Lane Station: <span className="text-foreground font-extrabold">{mockPlayerSchedule.station}</span></p>
                      <p className="font-semibold">Solve Time: <span className="text-foreground font-extrabold">{mockPlayerSchedule.time}</span></p>
                    </div>
                    
                    <div className="border border-border/60 rounded-xl p-4 bg-muted/10 flex flex-col justify-between">
                      <p className="text-[10px] font-extrabold text-muted-foreground uppercase">Schedule Alert</p>
                      <p className="text-xs text-muted-foreground leading-relaxed mt-2">
                        Please arrive at the lane station 10 minutes prior to your group's start time with your QR check-in code.
                      </p>
                    </div>
                  </div>
                </Card>
              </div>

              {/* Side Columns: Notifications & Results */}
              <div className="space-y-6">
                {/* Notifications feed */}
                <Card className="border border-border bg-card p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-2">
                    <Bell className="h-4.5 w-4.5 text-[#eab308]" />
                    LANE NOTIFICATIONS
                  </h3>
                  <div className="space-y-3.5">
                    {mockNotifications.map((notif, idx) => (
                      <div key={idx} className="flex gap-3 text-xs border-b border-border pb-3 last:border-none last:pb-0">
                        <CheckCircle className="h-4 w-4 text-[#eab308] flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="font-medium text-foreground">{notif.text}</p>
                          <span className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">{notif.time}</span>
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                {/* My Results detail */}
                <Card className="border border-border bg-card p-6 rounded-2xl space-y-4">
                  <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-2">
                    <Award className="h-4.5 w-4.5 text-[#eab308]" />
                    MY ATTEMPT TIMES
                  </h3>
                  <div className="space-y-2 border-b border-border pb-4">
                    <p className="text-[10px] font-extrabold text-muted-foreground uppercase">{mockPlayerResults.event}</p>
                    <div className="grid grid-cols-5 gap-1 pt-1 text-center font-mono">
                      {mockPlayerResults.solves.map((s) => (
                        <div key={s.id} className="p-2 border border-border bg-muted/15 rounded-lg">
                          <p className="text-[9px] font-bold text-muted-foreground uppercase">S{s.id}</p>
                          <p className="text-[11px] font-black text-foreground mt-1">{s.val}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="flex justify-between items-center text-xs pt-1">
                    <div>
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Final Average</p>
                      <p className="text-base font-black text-foreground">{mockPlayerResults.finalAvg}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[10px] font-bold text-muted-foreground uppercase">Placement Rank</p>
                      <p className="text-base font-black text-[#eab308]">{mockPlayerResults.rank}</p>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Tab 3: Live Results */}
      {activeTab === 'live-results' && (
        <div className="space-y-6">
          <h3 className="text-sm font-extrabold uppercase tracking-wider text-[#eab308] flex items-center gap-2">
            <Flame className="h-4.5 w-4.5 text-[#eab308]" /> ONGOING TOURNAMENTS (LIVE)
          </h3>
          
          <div className="grid gap-6 md:grid-cols-2">
            {/* Leaderboard Card */}
            <Card className="border border-border bg-card p-6 rounded-2xl space-y-4">
              <div>
                <h4 className="font-extrabold text-sm text-foreground uppercase">Asian Speedcubing Cup 2026</h4>
                <p className="text-xs text-muted-foreground mt-1">Live Standing Round 2 leaderboard</p>
              </div>
              
              <div className="rounded-xl border border-border overflow-hidden text-xs">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                      <th className="p-3.5">Rank</th>
                      <th className="p-3.5">Competitor</th>
                      <th className="p-3.5 text-center">Best Solve</th>
                      <th className="p-3.5 text-right">Avg Ao5</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/60">
                    {[
                      { r: 1, name: 'SpeedMaster_JP', best: '7.20s', avg: '8.12s' },
                      { r: 2, name: 'CubeLegend_CN', best: '7.50s', avg: '8.45s' },
                      { r: 3, name: 'FastFingers_US', best: '7.80s', avg: '8.92s' }
                    ].map((item) => (
                      <tr key={item.r} className="hover:bg-muted/10 transition-colors">
                        <td className="p-3.5 font-bold text-[#eab308]">#{item.r}</td>
                        <td className="p-3.5 font-bold text-foreground">{item.name}</td>
                        <td className="p-3.5 text-center font-semibold text-foreground">{item.best}</td>
                        <td className="p-3.5 text-right font-black text-[#eab308]">{item.avg}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </Card>

            {/* Progress Card */}
            <Card className="border border-border bg-card p-6 rounded-2xl flex flex-col justify-between shadow-sm">
              <div className="space-y-4">
                <h4 className="font-extrabold text-sm text-foreground uppercase">Round Bracket Progress</h4>
                <div className="space-y-3 text-xs pt-2">
                  <div className="flex justify-between items-center">
                    <span className="font-semibold">3x3x3 Round 1 completion</span>
                    <span className="text-[#eab308] font-bold">100% (Completed)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[100%] rounded-full bg-emerald-500" />
                  </div>
                  
                  <div className="flex justify-between items-center pt-2">
                    <span className="font-semibold">3x3x3 Round 2 completion</span>
                    <span className="text-[#eab308] font-bold">45% (In Progress)</span>
                  </div>
                  <div className="h-1.5 w-full rounded-full bg-muted overflow-hidden">
                    <div className="h-full w-[45%] rounded-full bg-[#eab308]" />
                  </div>
                </div>
              </div>

              <div className="bg-muted/10 border border-border/80 rounded-xl p-4 text-xs text-muted-foreground leading-relaxed mt-6">
                Match lane results synchronize dynamically as judges submit competitor attempts signature confirmations.
              </div>
            </Card>
          </div>
        </div>
      )}

      {/* Tournament Detailed multi-tab modal */}
      <Dialog open={Boolean(selectedTourDetails)} onOpenChange={(open) => (!open ? closeDetails() : null)}>
        <DialogContent className="max-w-2xl bg-card border border-border shadow-2xl rounded-2xl text-foreground">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-black tracking-wider text-[#eab308] uppercase flex items-center gap-2">
              <Trophy className="h-5 w-5" /> {selectedTourDetails?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Official bracket parameters, schedules, events list, and seed standings.
            </DialogDescription>
          </DialogHeader>

          {/* Sub Tab Controls */}
          <div className="flex flex-wrap gap-1 border-b border-border pb-2 text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
            {([
              { id: 'overview', label: 'Overview' },
              { id: 'events', label: 'Events' },
              { id: 'schedule', label: 'Schedule' },
              { id: 'competitors', label: 'Competitors' },
              { id: 'live-board', label: 'Live Board' },
              { id: 'rules', label: 'Rules' }
            ] as const).map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveDetailTab(tab.id)}
                className={`px-3 py-2 rounded-lg transition-all ${
                  activeDetailTab === tab.id 
                    ? 'bg-[#eab308]/10 text-[#eab308] border border-[#eab308]/20' 
                    : 'hover:text-foreground'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          <div className="space-y-6 pt-4 min-h-[300px] max-h-[420px] overflow-y-auto pr-1">
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-xs leading-relaxed">
                <div className="grid gap-3 sm:grid-cols-2">
                  <div className="border border-border/60 bg-muted/10 rounded-xl p-3">
                    <p className="font-bold text-muted-foreground uppercase text-[9px] mb-1">Location Venue</p>
                    <p className="font-extrabold text-foreground">Ho Chi Minh City, Vietnam</p>
                  </div>
                  <div className="border border-border/60 bg-muted/10 rounded-xl p-3">
                    <p className="font-bold text-muted-foreground uppercase text-[9px] mb-1">Registration Deadline</p>
                    <p className="font-extrabold text-[#eab308]">June 11, 2026</p>
                  </div>
                </div>
                <div className="space-y-1.5">
                  <h4 className="font-extrabold text-foreground">Tournament Description</h4>
                  <p className="text-muted-foreground leading-relaxed">
                    Official offline speedcubing tournament featuring local regional champions. Standard WCA regulations are enforced on all lanes. Competitor results sync to the global ratings board.
                  </p>
                </div>
              </div>
            )}

            {activeDetailTab === 'events' && (
              <div className="space-y-3">
                {eventsDetails.map((evt) => (
                  <div key={evt.name} className="flex justify-between items-center rounded-xl border border-border bg-muted/10 p-3.5 text-xs">
                    <div>
                      <p className="font-extrabold text-foreground">{evt.name}</p>
                      <p className="text-[10px] text-muted-foreground font-semibold uppercase mt-0.5">Format: {evt.format} • Rounds: {evt.rounds}</p>
                    </div>
                    <div className="text-right text-[10px] text-muted-foreground font-bold uppercase space-y-0.5">
                      <p>Time Limit: <span className="text-[#eab308]">{evt.timeLimit}</span></p>
                      <p>Cut-off: <span className="text-foreground">{evt.cutoff}</span></p>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeDetailTab === 'schedule' && (
              <div className="space-y-2.5">
                {scheduleDetails.map((sched, idx) => (
                  <div key={idx} className="flex gap-4 items-center text-xs border-b border-border/50 pb-2.5 last:border-none last:pb-0">
                    <span className="font-mono font-bold text-[#eab308] w-20 flex-shrink-0">{sched.time}</span>
                    <span className="font-semibold text-foreground">{sched.event}</span>
                  </div>
                ))}
              </div>
            )}

            {activeDetailTab === 'competitors' && (
              <div className="space-y-3">
                {tournamentCompetitors.length > 0 ? (
                  <div className="grid gap-3 sm:grid-cols-2 text-xs">
                    {tournamentCompetitors.map((c) => (
                      <div key={c.qrCode} className="border border-border/60 bg-muted/15 rounded-xl p-3 flex justify-between items-center">
                        <div>
                          <p className="font-bold text-foreground">{c.name}</p>
                          <span className="text-[9px] text-muted-foreground font-semibold uppercase mt-0.5">Seat ID: {c.qrCode}</span>
                        </div>
                        <span className="text-[10px] font-bold text-[#eab308] uppercase">Confirmed</span>
                      </div>
                    ))}
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No registered competitors found in public rosters.
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'live-board' && (
              <div className="space-y-3">
                {computedStandings.length > 0 ? (
                  <div className="rounded-xl border border-border overflow-hidden text-xs">
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="bg-muted/40 border-b border-border/80 font-bold text-muted-foreground uppercase text-[10px] tracking-wider">
                          <th className="p-3">Rank</th>
                          <th className="p-3">Competitor</th>
                          <th className="p-3 text-center">Attempts</th>
                          <th className="p-3 text-right">Best Solve</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-border/60">
                        {computedStandings.map((player, idx) => (
                          <tr key={player.qr} className="hover:bg-muted/10 transition-colors">
                            <td className="p-3 font-bold text-[#eab308]">#{idx + 1}</td>
                            <td className="p-3 font-bold text-foreground">{player.name}</td>
                            <td className="p-3 text-center font-medium text-muted-foreground">{player.solvesCount} / 5</td>
                            <td className="p-3 text-right font-black text-foreground">{player.bestTime}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No active round attempts submitted yet for this bracket.
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'rules' && (
              <div className="space-y-3 pt-1">
                {rulesDetails.map((rule) => (
                  <div key={rule.rule} className="rounded-xl border border-border bg-muted/10 p-3.5 text-xs space-y-1">
                    <p className="font-extrabold text-[#eab308] uppercase tracking-wider">{rule.rule}</p>
                    <p className="text-muted-foreground leading-relaxed font-medium">{rule.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border flex justify-end">
            <Button className="bg-transparent border border-border text-xs font-bold rounded-xl px-5 py-2.5 h-auto hover:text-[#eab308]" onClick={closeDetails}>
              Close Details
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Register Competitor Dialog */}
      <Dialog open={showRegisterModal} onOpenChange={(open) => (!open ? closeRegister() : null)}>
        <DialogContent className="max-w-md bg-card border border-border shadow-2xl rounded-2xl text-foreground">
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-lg font-black tracking-wider text-[#eab308] uppercase flex items-center gap-2">
              <QrCode className="h-5 w-5" /> SECURE YOUR SEED
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register to participate in "{targetTournament?.name}".
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-4" onSubmit={handleRegisterSubmit}>
            <label className="block space-y-1.5 text-xs">
              <span className="font-bold text-muted-foreground uppercase">Target Tournament</span>
              <div className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-xs text-foreground font-semibold">
                {targetTournament?.name}
              </div>
            </label>

            {/* Checkbox select events */}
            <div className="space-y-2">
              <span className="text-xs font-bold text-muted-foreground uppercase">Select Events</span>
              <div className="grid grid-cols-2 gap-2 pt-1 text-xs">
                {Object.keys(selectedEvents).map((evt) => (
                  <label key={evt} className="flex items-center gap-2 bg-muted/20 border border-border/80 rounded-xl p-3 cursor-pointer hover:border-[#eab308]/40 transition-colors">
                    <input 
                      type="checkbox"
                      checked={selectedEvents[evt as keyof typeof selectedEvents]}
                      onChange={(e) => setSelectedEvents(prev => ({ ...prev, [evt]: e.target.checked }))}
                      className="accent-[#eab308] h-3.5 w-3.5"
                    />
                    <span className="font-bold text-foreground">{evt}</span>
                  </label>
                ))}
              </div>
            </div>

            <label className="block space-y-1.5 text-xs">
              <span className="font-bold text-muted-foreground uppercase">Your Competitor Nickname</span>
              <input 
                value={regName} 
                onChange={(e) => setRegName(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                required 
              />
            </label>
            <label className="block space-y-1.5 text-xs">
              <span className="font-bold text-muted-foreground uppercase">Confirmation Email Address</span>
              <input 
                type="email"
                value={regEmail} 
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                required 
              />
            </label>

            {feedback && (
              <div className="rounded-xl border border-emerald-500/30 bg-emerald-500/10 p-3.5 text-xs text-emerald-400 font-medium leading-relaxed">
                {feedback}
              </div>
            )}

            <DialogFooter className="pt-4 border-t border-border flex justify-end gap-2">
              <Button type="button" variant="outline" className="border-border text-xs px-5 py-2.5 rounded-xl h-auto bg-transparent" onClick={closeRegister}>Cancel</Button>
              <Button type="submit" className="bg-[#eab308] text-black font-extrabold text-xs px-5 py-2.5 rounded-xl h-auto hover:bg-[#ca8a04]">Get QR Ticket</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-background flex items-center justify-center">
        <LoaderCircleIcon className="h-8 w-8 animate-spin text-[#eab308]" />
      </div>
    }>
      <main className="min-h-screen bg-background text-foreground pb-20">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <TournamentsPageContent />
        </div>
      </main>
    </Suspense>
  );
}
