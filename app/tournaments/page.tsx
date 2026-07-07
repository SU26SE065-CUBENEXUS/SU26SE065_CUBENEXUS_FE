'use client';

import Link from 'next/link';
import { useEffect, useMemo, useState, Suspense, useCallback } from 'react';
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
  Sparkles,
  Ticket,
  ChevronRight,
  Clock,
  MapPin,
  Flame,
  Award,
  Bell,
  CheckCircle,
  LoaderCircle as LoaderCircleIcon,
  Loader2,
  Star,
  Shield,
  LayoutGrid,
  ListFilter,
  Info,
} from 'lucide-react';
import { getTournaments, saveTournaments, getCompetitors, saveCompetitors, Tournament, Competitor } from '@/lib/tournament-store';
import { useAuth } from '@/contexts/auth-context';
import { getPublicTournaments } from '@/lib/api/tournaments';
import { registerTournament, getMyRegistrations } from '@/lib/api/registrations';
import { getLiveBoardState } from '@/lib/api/operations';

// ─── Types ────────────────────────────────────────────────────
type ActiveTab = 'explore' | 'my-tournaments' | 'live-results';
type DetailSubTab = 'overview' | 'events' | 'schedule' | 'competitors' | 'live-board' | 'rules';

// ─── Helper: Status Color ─────────────────────────────────────
const getStatusConfig = (status: string): { bg: string; border: string; text: string; dot: string } => {
  switch (status) {
    case 'Registration Open':
      return { bg: 'bg-amber-500/10', border: 'border-amber-500/30', text: 'text-amber-400', dot: 'bg-amber-400' };
    case 'In Progress':
    case 'Ongoing':
      return { bg: 'bg-emerald-500/10', border: 'border-emerald-500/30', text: 'text-emerald-400', dot: 'bg-emerald-400' };
    case 'Starting Soon':
    case 'Upcoming':
      return { bg: 'bg-sky-500/10', border: 'border-sky-500/30', text: 'text-sky-400', dot: 'bg-sky-400' };
    case 'Cancelled':
      return { bg: 'bg-red-500/10', border: 'border-red-500/30', text: 'text-red-400', dot: 'bg-red-400' };
    default:
      return { bg: 'bg-muted/20', border: 'border-border', text: 'text-muted-foreground', dot: 'bg-muted-foreground' };
  }
};

const TIER_CONFIG: Record<string, { color: string; glow: string }> = {
  'Tier S': { color: 'text-amber-400', glow: 'shadow-[0_0_12px_rgba(251,191,36,0.2)]' },
  'Tier A': { color: 'text-orange-400', glow: 'shadow-[0_0_8px_rgba(249,115,22,0.15)]' },
  'Tier B': { color: 'text-blue-400', glow: '' },
  'Tier C': { color: 'text-muted-foreground', glow: '' },
};

// ─── Tournament Card ──────────────────────────────────────────
function TournamentCard({ tour, onDetails, onRegister }: {
  tour: Tournament;
  onDetails: (id: number) => void;
  onRegister: (tour: Tournament) => void;
}) {
  const statusCfg = getStatusConfig(tour.status);
  const tierCfg = TIER_CONFIG[tour.tier] || TIER_CONFIG['Tier B'];
  const isLive = tour.status === 'In Progress';

  return (
    <div className={`group relative flex flex-col rounded-2xl border overflow-hidden transition-all duration-300 hover:-translate-y-0.5 card-shine ${
      isLive ? 'border-emerald-500/30 glow-border-green' : 'border-border hover:border-primary/30'
    }`}
      style={{ background: 'oklch(0.155 0.018 255)' }}
    >
      {/* Top accent bar */}
      <div className={`h-0.5 w-full ${isLive ? 'bg-gradient-to-r from-emerald-500 to-emerald-400' : 'bg-gradient-to-r from-primary/60 to-transparent'}`} />

      {/* Header */}
      <div className="p-5 border-b border-border/60">
        <div className="flex items-start justify-between gap-3 mb-2">
          <div className="min-w-0">
            <span className={`text-[9px] font-black uppercase tracking-[0.2em] ${tierCfg.color}`}>{tour.tier}</span>
            <h3 className="text-sm font-black text-foreground leading-snug mt-0.5 truncate">{tour.name}</h3>
          </div>
          <span className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-[10px] font-bold border flex-shrink-0 ${statusCfg.bg} ${statusCfg.border} ${statusCfg.text}`}>
            <span className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${statusCfg.dot} ${isLive ? 'animate-pulse' : ''}`} />
            {tour.status}
          </span>
        </div>
      </div>

      {/* Info */}
      <div className="p-5 flex-1 space-y-2.5 text-xs text-muted-foreground">
        <p className="flex items-center gap-2"><Calendar className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.72 0.21 42)' }} />{tour.date}</p>
        <p className="flex items-center gap-2"><MapPin className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.72 0.21 42)' }} />Ho Chi Minh City, Vietnam</p>
        <p className="flex items-center gap-2"><Users className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.72 0.21 42)' }} />{tour.participants} / {tour.maxParticipants} competitors</p>
        <p className="flex items-center gap-2 text-[11px]"><Zap className="h-3.5 w-3.5 flex-shrink-0" style={{ color: 'oklch(0.72 0.21 42)' }} />{tour.format}</p>

        {/* Participant bar */}
        <div>
          <div className="h-1 rounded-full overflow-hidden" style={{ background: 'oklch(0.22 0.02 256)' }}>
            <div
              className="h-full rounded-full transition-all"
              style={{
                width: `${Math.min(100, (tour.participants / tour.maxParticipants) * 100)}%`,
                background: tour.participants / tour.maxParticipants > 0.9 ? 'oklch(0.52 0.22 25)' : 'oklch(0.72 0.21 42)',
              }}
            />
          </div>
          <p className="text-[9px] text-muted-foreground/60 mt-0.5">{Math.round((tour.participants / tour.maxParticipants) * 100)}% full</p>
        </div>
      </div>

      {/* Actions */}
      <div className="border-t border-border/60 p-4 flex gap-2"
        style={{ background: 'oklch(0.14 0.018 255)' }}
      >
        <button onClick={() => onDetails(tour.id as number)}
          className="flex-1 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground hover:border-primary/40 transition-all"
        >
          Details
        </button>
        {tour.status === 'Registration Open' && (
          <button onClick={() => onRegister(tour)}
            className="flex-1 py-2 rounded-xl text-xs font-bold text-primary-foreground transition-all hover:opacity-90"
            style={{ background: 'oklch(0.72 0.21 42)', boxShadow: '0 2px 12px oklch(0.72 0.21 42 / 0.25)' }}
          >
            Register Now
          </button>
        )}
      </div>
    </div>
  );
}

// ─── My Registration Card ─────────────────────────────────────
function RegistrationCard({ ticket, tour }: { ticket: Competitor; tour?: Tournament }) {
  const [expiry, setExpiry] = useState<string | null>(null);

  useEffect(() => {
    try {
      const parsed = JSON.parse(ticket.qrCode);
      if (parsed?.ExpiresAt) {
        const date = new Date(parsed.ExpiresAt);
        setExpiry(date.toLocaleString());
      }
    } catch (e) {
      // Not JSON
    }
  }, [ticket.qrCode]);

  return (
    <div className="relative rounded-2xl border border-border overflow-hidden"
      style={{ background: 'oklch(0.155 0.018 255)' }}
    >
      <div className="h-0.5 w-full" style={{ background: 'linear-gradient(90deg, oklch(0.72 0.21 42), oklch(0.78 0.185 85))' }} />
      <div className="p-5 space-y-4">
        <div className="flex justify-between items-start">
          <div>
            <span className="text-[9px] font-black px-2 py-0.5 rounded uppercase tracking-wider"
              style={{ background: 'oklch(0.72 0.21 42 / 0.12)', border: '1px solid oklch(0.72 0.21 42 / 0.25)', color: 'oklch(0.72 0.21 42)' }}
            >
              Confirmed
            </span>
            <h4 className="mt-2 text-sm font-black text-foreground">{tour?.name || 'Tournament'}</h4>
          </div>
          <QrCode className="h-8 w-8 opacity-60" style={{ color: 'oklch(0.72 0.21 42)' }} />
        </div>

        <div className="space-y-1 text-xs text-muted-foreground">
          <p className="font-bold text-foreground">Competitor: <span className="text-muted-foreground font-normal">{ticket.name}</span></p>
          {expiry && <p className="text-[10px] text-amber-500/80">Expires: {expiry}</p>}
        </div>

        {/* QR visual placeholder */}
        <div className="pt-3 border-t border-border/60">
          <div className="flex flex-col items-center justify-center p-4 rounded-2xl mx-auto w-fit"
            style={{ background: 'white' }}
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(ticket.qrCode)}`}
              alt="Competitor QR Code"
              className="w-36 h-36 object-contain"
            />
          </div>
          <p className="text-[10px] text-center text-muted-foreground mt-3 font-semibold uppercase tracking-wider">
            Present QR to Judge at Solving Station
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Main Content ─────────────────────────────────────────────
function TournamentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const detailParam = searchParams.get('details');

  const { user, isAuthenticated, isLoading } = useAuth();

  const [activeTab, setActiveTab] = useState<ActiveTab>('explore');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFormat, setFilterFormat] = useState('All');
  const [activeDetailTab, setActiveDetailTab] = useState<DetailSubTab>('overview');

  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [isLoadingTournaments, setIsLoadingTournaments] = useState(true);

  const [showRegisterModal, setShowRegisterModal] = useState(false);
  const [targetTournament, setTargetTournament] = useState<Tournament | null>(null);
  const [selectedEventIds, setSelectedEventIds] = useState<string[]>([]);
  const [regName, setRegName] = useState('');
  const [regEmail, setRegEmail] = useState('');
  const [feedback, setFeedback] = useState<string | null>(null);
  const [isRegistering, setIsRegistering] = useState(false);

  const [selectedTourDetails, setSelectedTourDetails] = useState<Tournament | null>(null);
  const [liveBoardData, setLiveBoardData] = useState<any>(null);
  const [isLoadingLiveBoard, setIsLoadingLiveBoard] = useState(false);

  // ─── Load Tournaments ─────────────────────────────────────
  useEffect(() => {
    async function loadRealTournaments() {
      setIsLoadingTournaments(true);
      try {
        const publicList = await getPublicTournaments();
        const mappedList: Tournament[] = publicList.map((t) => {
          const now = new Date();
          const regOpen = new Date(t.registrationOpenAt);
          const regClose = new Date(t.registrationCloseAt);
          let statusText = 'Upcoming';
          const code = t.statusCode.toUpperCase();
          if (code === 'DRAFT') statusText = 'Registration Open';
          else if (code === 'ONGOING') statusText = 'In Progress';
          else if (code === 'COMPLETED') statusText = 'Completed';
          else if (code === 'CANCELLED') statusText = 'Cancelled';
          else if (code === 'PUBLISHED') {
            if (now >= regOpen && now <= regClose) statusText = 'Registration Open';
            else if (now < regOpen) statusText = 'Starting Soon';
            else statusText = 'Reg. Closed';
          }
          const formatString = t.events.map((e) => e.puzzleTypeName).join(', ') || 'Speedcubing';
          const isMedley = t.events.some((e) => e.eventFormatCode === 'MEDLEY');
          const tier = t.events.length > 4 ? 'Tier S' : t.events.length > 2 ? 'Tier A' : 'Tier B';
          return {
            id: t.id as any,
            name: t.name,
            status: statusText,
            date: new Date(t.startDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ' – ' + new Date(t.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }),
            participants: Math.max(t.events.length * 8, 12),
            maxParticipants: 500,
            prizePool: '$5,000',
            format: formatString,
            formatType: isMedley ? 'Medley' : 'Traditional',
            tier,
            round: 1,
            events: t.events,
          } as any;
        });

        if (mappedList.length > 0) {
          setTournaments(mappedList);
          saveTournaments(mappedList);
        } else {
          // Fallback: load from local store
          const stored = getTournaments();
          setTournaments(stored);
        }
      } catch {
        const stored = getTournaments();
        setTournaments(stored);
      } finally {
        setIsLoadingTournaments(false);
      }
    }
    loadRealTournaments();
  }, []);

  // ─── Load My Registrations ────────────────────────────────
  const loadMyRegistrations = useCallback(async () => {
    if (!isAuthenticated) return;
    try {
      const list = await getMyRegistrations();
      const tickets: Competitor[] = list.map((reg) => ({
        qrCode: reg.qrToken,
        name: user?.displayName || 'Competitor',
        email: user?.email || '',
        tournamentId: Number(reg.tournamentId) || 0,
        solves: [],
      }));
      setCompetitors(tickets);
      saveCompetitors(tickets);
    } catch {
      const stored = getCompetitors();
      setCompetitors(stored);
    }
  }, [isAuthenticated, user]);

  useEffect(() => {
    if (isAuthenticated) loadMyRegistrations();
  }, [isAuthenticated, loadMyRegistrations]);

  // Route guard
  useEffect(() => {
    if (!isLoading && !isAuthenticated) router.replace('/login');
  }, [isLoading, isAuthenticated, router]);

  // Sync user to form
  useEffect(() => {
    if (user) { setRegName(user.displayName || 'Competitor'); setRegEmail(user.email || ''); }
  }, [user]);

  // Detail param sync
  useEffect(() => {
    if (detailParam) {
      const tour = tournaments.find((t) => String(t.id) === detailParam);
      if (tour) { setSelectedTourDetails(tour); setActiveDetailTab('overview'); }
    } else {
      setSelectedTourDetails(null);
    }
  }, [detailParam, tournaments]);

  // Load live board when live-board tab selected
  useEffect(() => {
    if (activeDetailTab !== 'live-board' || !selectedTourDetails) return;
    const tour = selectedTourDetails as any;
    const firstEvent = tour.events?.[0];
    if (!firstEvent) return;
    setIsLoadingLiveBoard(true);
    getLiveBoardState(firstEvent.id, 1)
      .then(setLiveBoardData)
      .catch(() => setLiveBoardData(null))
      .finally(() => setIsLoadingLiveBoard(false));
  }, [activeDetailTab, selectedTourDetails]);

  const openDetails = (id: number) => router.push(`/tournaments?details=${id}`);
  const closeDetails = () => { setSelectedTourDetails(null); setLiveBoardData(null); router.replace('/tournaments'); };
  const openRegister = (tour: Tournament) => {
    setTargetTournament(tour);
    const eventIds = (tour as any).events ? (tour as any).events.map((e: any) => e.id) : [];
    setSelectedEventIds(eventIds);
    setShowRegisterModal(true);
    setFeedback(null);
  };
  const closeRegister = () => { setShowRegisterModal(false); setTargetTournament(null); setSelectedEventIds([]); setFeedback(null); };

  const filteredTournaments = useMemo(() => {
    return tournaments.filter((t) => {
      const matchSearch = t.name.toLowerCase().includes(searchTerm.toLowerCase()) || t.format.toLowerCase().includes(searchTerm.toLowerCase());
      const matchFormat = filterFormat === 'All' || t.status === filterFormat;
      return matchSearch && matchFormat;
    });
  }, [searchTerm, filterFormat, tournaments]);

  const handleRegisterSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!targetTournament || selectedEventIds.length === 0) return;
    setIsRegistering(true);
    setFeedback('Submitting registration...');
    try {
      const regRes = await registerTournament(String(targetTournament.id), selectedEventIds);
      setFeedback(`✓ Registered successfully! QR Token: ${regRes.qrToken}`);
      await loadMyRegistrations();
      setTimeout(() => { closeRegister(); setActiveTab('my-tournaments'); }, 2000);
    } catch (err: any) {
      setFeedback(`Registration failed: ${err.message || err}`);
    } finally {
      setIsRegistering(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex justify-center items-center py-24 min-h-[300px]">
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.72 0.21 42)' }} />
      </div>
    );
  }

  if (!isAuthenticated) return null;

  return (
    <div className="space-y-8">

      {/* ─── Hero Banner ─────────────────────────────────────── */}
      <div className="relative rounded-3xl overflow-hidden"
        style={{
          background: 'oklch(0.155 0.018 255)',
          border: '1px solid oklch(0.24 0.02 256)',
          boxShadow: '0 0 40px oklch(0.72 0.21 42 / 0.05)',
        }}
      >
        <div className="absolute inset-0 pointer-events-none"
          style={{
            background: 'radial-gradient(ellipse at top right, oklch(0.72 0.21 42 / 0.07) 0%, transparent 60%)',
          }}
        />
        <div className="relative z-10 p-8">
          <div className="flex flex-wrap items-center gap-3 mb-4">
            <span className="rounded-full px-3 py-1 text-xs font-semibold flex items-center gap-1.5"
              style={{ background: 'oklch(0.72 0.21 42 / 0.1)', border: '1px solid oklch(0.72 0.21 42 / 0.2)', color: 'oklch(0.72 0.21 42)' }}
            >
              <Sparkles className="h-3 w-3" /> Public Tournament Portal
            </span>
            <span className="text-muted-foreground text-xs font-medium">• Browse, register, and follow live leaderboards</span>
          </div>
          <h1 className="text-4xl sm:text-6xl font-black tracking-tighter text-foreground uppercase mb-3">
            TOURNAMENTS
          </h1>
          <p className="text-muted-foreground max-w-xl text-sm leading-relaxed">
            Join WCA standardized speedcubing brackets. Check in with QR, track live results, and compete for rankings.
          </p>
        </div>
      </div>

      {/* ─── Tab Controls ─────────────────────────────────────── */}
      <div className="flex gap-1.5 p-1.5 rounded-2xl w-fit"
        style={{ background: 'oklch(0.155 0.018 255)', border: '1px solid oklch(0.22 0.02 256)' }}
      >
        {[
          { id: 'explore', label: 'All Tournaments', icon: LayoutGrid },
          { id: 'my-tournaments', label: 'My Tournaments', icon: Ticket },
          { id: 'live-results', label: 'Live Results', icon: Flame },
        ].map(({ id, label, icon: Icon }) => (
          <button key={id}
            onClick={() => setActiveTab(id as ActiveTab)}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${
              activeTab === id
                ? 'text-primary-foreground font-black shadow-md'
                : 'text-muted-foreground hover:text-foreground'
            }`}
            style={activeTab === id ? { background: 'oklch(0.72 0.21 42)', boxShadow: '0 2px 12px oklch(0.72 0.21 42 / 0.3)' } : {}}
          >
            <Icon className="h-3.5 w-3.5" />
            {label}
          </button>
        ))}
      </div>

      {/* ─── Tab 1: All Tournaments ───────────────────────────── */}
      {activeTab === 'explore' && (
        <div className="space-y-5">
          {/* Search + Filter */}
          <div className="flex flex-col sm:flex-row justify-between items-stretch sm:items-center gap-3 p-4 rounded-2xl"
            style={{ background: 'oklch(0.155 0.018 255)', border: '1px solid oklch(0.22 0.02 256)' }}
          >
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <input
                type="text"
                placeholder="Search tournaments, events..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full rounded-xl border border-border pl-10 pr-4 py-2.5 text-xs text-foreground placeholder-muted-foreground outline-none transition"
                style={{ background: 'oklch(0.185 0.02 256)' }}
              />
            </div>
            <div className="flex gap-1.5">
              {['All', 'Registration Open', 'In Progress', 'Starting Soon'].map((f) => {
                const cfg = getStatusConfig(f === 'All' ? '' : f);
                return (
                  <button key={f}
                    onClick={() => setFilterFormat(f)}
                    className={`px-3 py-2 rounded-xl border text-[10px] font-bold transition-all ${
                      filterFormat === f
                        ? `${cfg.border} ${cfg.bg} ${cfg.text}`
                        : 'border-border text-muted-foreground hover:text-foreground'
                    }`}
                  >
                    {f === 'All' ? 'All' : f.split(' ')[0]}
                  </button>
                );
              })}
            </div>
          </div>

          {isLoadingTournaments ? (
            <div className="flex justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.72 0.21 42)' }} />
            </div>
          ) : filteredTournaments.length === 0 ? (
            <div className="py-20 text-center rounded-2xl border border-dashed border-border">
              <Trophy className="h-10 w-10 mx-auto mb-3 text-muted-foreground/30" />
              <p className="text-sm font-semibold text-muted-foreground">No tournaments found</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2 lg:grid-cols-3">
              {filteredTournaments.map((tour) => (
                <TournamentCard
                  key={tour.id}
                  tour={tour}
                  onDetails={(id) => openDetails(id)}
                  onRegister={(t) => openRegister(t)}
                />
              ))}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 2: My Tournaments ───────────────────────────── */}
      {activeTab === 'my-tournaments' && (
        <div className="space-y-6">
          {user?.role?.toUpperCase() === 'MANAGER' || user?.role?.toUpperCase() === 'ADMIN' ? (
            <div className="rounded-3xl border border-dashed border-border p-12 text-center space-y-4 max-w-xl mx-auto"
              style={{ background: 'oklch(0.155 0.018 255)' }}
            >
              <Shield className="h-12 w-12 mx-auto" style={{ color: 'oklch(0.72 0.21 42)' }} />
              <h3 className="text-lg font-black uppercase text-foreground">Manager Portal Access</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">
                You are authenticated as a Manager / Administrator. Use the Manager Portal to manage tournament brackets and operations.
              </p>
              <Link href="/managertournaments"
                className="inline-flex items-center gap-2 px-6 py-3 rounded-xl text-xs font-black text-primary-foreground"
                style={{ background: 'oklch(0.72 0.21 42)', boxShadow: '0 4px 16px oklch(0.72 0.21 42 / 0.25)' }}
              >
                GO TO MANAGER PORTAL <ChevronRight className="h-4 w-4" />
              </Link>
            </div>
          ) : (
            <div className="space-y-6">
              <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'oklch(0.72 0.21 42)' }}>
                <Ticket className="h-4 w-4" /> My Registered Tournaments
              </h2>

              {competitors.length > 0 ? (
                <div className="grid gap-4 sm:grid-cols-2">
                  {competitors.map((ticket) => {
                    const tour = tournaments.find((t) => String(t.id) === String(ticket.tournamentId));
                    return <RegistrationCard key={ticket.qrCode} ticket={ticket} tour={tour} />;
                  })}
                </div>
              ) : (
                <div className="py-16 text-center rounded-2xl border border-dashed border-border">
                  <Ticket className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
                  <p className="text-xs font-semibold text-muted-foreground">No registered tournaments yet.</p>
                  <button onClick={() => setActiveTab('explore')}
                    className="mt-3 text-xs font-bold underline"
                    style={{ color: 'oklch(0.72 0.21 42)' }}
                  >
                    Browse tournaments
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* ─── Tab 3: Live Results ─────────────────────────────── */}
      {activeTab === 'live-results' && (
        <div className="space-y-5">
          <h2 className="text-sm font-bold uppercase tracking-wider flex items-center gap-2" style={{ color: 'oklch(0.72 0.21 42)' }}>
            <Flame className="h-4 w-4" /> Live & Ongoing Tournaments
          </h2>

          {tournaments.filter((t) => t.status === 'In Progress').length === 0 ? (
            <div className="py-16 text-center rounded-2xl border border-dashed border-border">
              <Clock className="h-8 w-8 mx-auto mb-2 text-muted-foreground/40" />
              <p className="text-xs font-semibold text-muted-foreground">No live tournaments right now</p>
            </div>
          ) : (
            <div className="grid gap-5 md:grid-cols-2">
              {tournaments.filter((t) => t.status === 'In Progress').map((tour) => {
                const tourAny = tour as any;
                return (
                  <div key={tour.id} className="rounded-2xl border p-6 space-y-4"
                    style={{ background: 'oklch(0.155 0.018 255)', borderColor: 'oklch(0.70 0.19 145 / 0.3)' }}
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="flex items-center gap-2 mb-1">
                          <div className="live-dot" />
                          <h4 className="font-extrabold text-sm text-foreground">{tour.name}</h4>
                        </div>
                        <p className="text-xs text-muted-foreground">Round {tour.round} — Live Results</p>
                      </div>
                      <button onClick={() => openDetails(tour.id as number)}
                        className="text-[10px] font-bold text-primary hover:underline"
                      >
                        View Details
                      </button>
                    </div>

                    {/* Placeholder live leaderboard */}
                    <div className="rounded-xl border border-border overflow-hidden text-xs"
                      style={{ background: 'oklch(0.14 0.018 255)' }}
                    >
                      <div className="px-4 py-2.5 border-b border-border/60 flex items-center gap-2 text-[10px] font-bold text-muted-foreground uppercase">
                        <Trophy className="h-3 w-3" /> Live Standings
                      </div>
                      <div className="divide-y divide-border/60">
                        {['Loading live data...'].map((msg, i) => (
                          <div key={i} className="px-4 py-3 text-xs text-muted-foreground flex items-center gap-2">
                            <Loader2 className="h-3 w-3 animate-spin" />
                            {msg}
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ─── Detail Dialog ────────────────────────────────────── */}
      <Dialog open={Boolean(selectedTourDetails)} onOpenChange={(open) => (!open ? closeDetails() : null)}>
        <DialogContent className="max-w-2xl border shadow-2xl rounded-2xl text-foreground"
          style={{ background: 'oklch(0.145 0.018 255)', borderColor: 'oklch(0.24 0.02 256)' }}
        >
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-base font-black tracking-wider uppercase flex items-center gap-2" style={{ color: 'oklch(0.72 0.21 42)' }}>
              <Trophy className="h-5 w-5" /> {selectedTourDetails?.name}
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Tournament details, schedule, and live results.
            </DialogDescription>
          </DialogHeader>

          {/* Sub tabs */}
          <div className="flex flex-wrap gap-1 border-b border-border pb-2">
            {(['overview', 'events', 'schedule', 'live-board', 'rules'] as DetailSubTab[]).map((tab) => (
              <button key={tab}
                onClick={() => setActiveDetailTab(tab)}
                className={`px-3 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all ${
                  activeDetailTab === tab
                    ? 'text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                style={activeDetailTab === tab ? { background: 'oklch(0.72 0.21 42 / 0.15)', border: '1px solid oklch(0.72 0.21 42 / 0.25)', color: 'oklch(0.72 0.21 42)' } : {}}
              >
                {tab.replace('-', ' ')}
              </button>
            ))}
          </div>

          <div className="space-y-4 pt-1 min-h-[280px] max-h-[400px] overflow-y-auto">
            {activeDetailTab === 'overview' && (
              <div className="space-y-4 text-xs">
                <div className="grid gap-3 sm:grid-cols-2">
                  {[
                    { label: 'Location', value: 'Ho Chi Minh City, Vietnam' },
                    { label: 'Status', value: selectedTourDetails?.status || '—' },
                    { label: 'Date', value: selectedTourDetails?.date || '—' },
                    { label: 'Competitors', value: `${selectedTourDetails?.participants} / ${selectedTourDetails?.maxParticipants}` },
                  ].map(({ label, value }) => (
                    <div key={label} className="rounded-xl p-3 space-y-0.5" style={{ background: 'oklch(0.185 0.02 256)', border: '1px solid oklch(0.24 0.02 256)' }}>
                      <p className="text-[9px] font-bold text-muted-foreground uppercase">{label}</p>
                      <p className="font-bold text-foreground">{value}</p>
                    </div>
                  ))}
                </div>
                <div className="rounded-xl p-4" style={{ background: 'oklch(0.185 0.02 256)', border: '1px solid oklch(0.24 0.02 256)' }}>
                  <p className="text-muted-foreground leading-relaxed">
                    Official offline speedcubing tournament following WCA regulations. Competitors will be organized into groups and assigned solving stations. All results are synced to the live leaderboard.
                  </p>
                </div>
              </div>
            )}

            {activeDetailTab === 'events' && (
              <div className="space-y-2.5">
                {((selectedTourDetails as any)?.events?.length > 0 ? (selectedTourDetails as any).events : [
                  { name: '3x3x3 Cube', format: 'Average of 5', timeLimit: '10 min', cutoff: '1 min', rounds: 2 },
                  { name: '2x2x2 Cube', format: 'Average of 5', timeLimit: '5 min', cutoff: '30s', rounds: 1 },
                ]).map((evt: any) => (
                  <div key={evt.id || evt.name} className="flex justify-between items-center rounded-xl p-3.5 text-xs"
                    style={{ background: 'oklch(0.185 0.02 256)', border: '1px solid oklch(0.24 0.02 256)' }}
                  >
                    <div>
                      <p className="font-bold text-foreground">{evt.puzzleTypeName || evt.name}</p>
                      <p className="text-[10px] text-muted-foreground mt-0.5">{evt.eventFormatCode || evt.format}</p>
                    </div>
                    <span className="text-[9px] font-bold px-2 py-0.5 rounded"
                      style={{ background: 'oklch(0.72 0.21 42 / 0.1)', color: 'oklch(0.72 0.21 42)', border: '1px solid oklch(0.72 0.21 42 / 0.2)' }}
                    >
                      {evt.solveCount ? `${evt.solveCount} solves` : evt.format}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {activeDetailTab === 'schedule' && (
              <div className="space-y-2">
                {[
                  { time: '08:00 AM', event: 'Check-in Opens' },
                  { time: '09:00 AM', event: '3x3x3 Round 1' },
                  { time: '11:00 AM', event: '2x2x2 Round 1' },
                  { time: '01:00 PM', event: 'Medley Finals' },
                  { time: '03:00 PM', event: '3x3x3 Finals' },
                  { time: '04:30 PM', event: 'Awards Ceremony' },
                ].map((s, idx) => (
                  <div key={idx} className="flex gap-4 items-center text-xs border-b border-border/40 pb-2 last:border-0">
                    <span className="font-mono font-bold w-20 flex-shrink-0" style={{ color: 'oklch(0.72 0.21 42)' }}>{s.time}</span>
                    <span className="font-semibold text-foreground">{s.event}</span>
                  </div>
                ))}
              </div>
            )}

            {activeDetailTab === 'live-board' && (
              <div>
                {isLoadingLiveBoard ? (
                  <div className="flex justify-center py-10">
                    <Loader2 className="h-6 w-6 animate-spin" style={{ color: 'oklch(0.72 0.21 42)' }} />
                  </div>
                ) : liveBoardData ? (
                  <div>
                    <p className="text-xs text-muted-foreground mb-3">{liveBoardData.eventName} — Round {liveBoardData.roundNumber}</p>
                    <div className="rounded-xl border border-border overflow-hidden text-xs">
                      <table className="w-full">
                        <thead>
                          <tr className="border-b border-border/60 text-[10px] font-bold text-muted-foreground uppercase"
                            style={{ background: 'oklch(0.185 0.02 256)' }}
                          >
                            <th className="px-4 py-2.5 text-left">#</th>
                            <th className="px-4 py-2.5 text-left">Competitor</th>
                            <th className="px-4 py-2.5 text-center">Solves</th>
                            <th className="px-4 py-2.5 text-right">Best</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {liveBoardData.competitors?.slice(0, 10).map((c: any, i: number) => (
                            <tr key={c.groupCompetitorId} className="hover:bg-muted/10 transition-colors">
                              <td className="px-4 py-2.5 font-bold" style={{ color: i < 3 ? 'oklch(0.72 0.21 42)' : undefined }}>#{i + 1}</td>
                              <td className="px-4 py-2.5 font-semibold text-foreground">{c.competitorName}</td>
                              <td className="px-4 py-2.5 text-center text-muted-foreground">{c.completedSolves}</td>
                              <td className="px-4 py-2.5 text-right font-mono font-bold text-foreground">
                                {c.bestTimeMs ? `${(c.bestTimeMs / 1000).toFixed(3)}s` : '—'}
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                ) : (
                  <div className="py-12 text-center text-xs text-muted-foreground border border-dashed border-border rounded-xl">
                    No live data available for this tournament yet.
                  </div>
                )}
              </div>
            )}

            {activeDetailTab === 'rules' && (
              <div className="space-y-2.5">
                {[
                  { rule: 'Time Limit', desc: 'Each attempt must be completed within the event time limit.' },
                  { rule: '+2 Penalty', desc: '+2 seconds for cube one turn from solved, or timer violations.' },
                  { rule: 'DNF', desc: 'Did Not Finish — puzzle unsolved, or premature timer stop.' },
                  { rule: 'Cut-off', desc: 'Competitor must beat cut-off in first 2 attempts to unlock remaining solves.' },
                  { rule: 'Signature Required', desc: 'Competitor must e-sign each result card after submission.' },
                ].map((rule) => (
                  <div key={rule.rule} className="rounded-xl p-3.5 text-xs"
                    style={{ background: 'oklch(0.185 0.02 256)', border: '1px solid oklch(0.24 0.02 256)' }}
                  >
                    <p className="font-bold uppercase text-xs mb-1" style={{ color: 'oklch(0.72 0.21 42)' }}>{rule.rule}</p>
                    <p className="text-muted-foreground leading-relaxed">{rule.desc}</p>
                  </div>
                ))}
              </div>
            )}
          </div>

          <DialogFooter className="pt-4 border-t border-border flex items-center justify-between">
            {selectedTourDetails?.status === 'Registration Open' && (
              <button onClick={() => { closeDetails(); openRegister(selectedTourDetails!); }}
                className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-primary-foreground"
                style={{ background: 'oklch(0.72 0.21 42)' }}
              >
                Register Now
              </button>
            )}
            <button onClick={closeDetails}
              className="ml-auto px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
            >
              Close
            </button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* ─── Register Dialog ──────────────────────────────────── */}
      <Dialog open={showRegisterModal} onOpenChange={(open) => (!open ? closeRegister() : null)}>
        <DialogContent className="max-w-md border shadow-2xl rounded-2xl text-foreground"
          style={{ background: 'oklch(0.145 0.018 255)', borderColor: 'oklch(0.24 0.02 256)' }}
        >
          <DialogHeader className="border-b border-border pb-4">
            <DialogTitle className="text-base font-black uppercase flex items-center gap-2" style={{ color: 'oklch(0.72 0.21 42)' }}>
              <QrCode className="h-4 w-4" /> Register
            </DialogTitle>
            <DialogDescription className="text-xs text-muted-foreground">
              Register for "{targetTournament?.name}"
            </DialogDescription>
          </DialogHeader>

          <form className="space-y-4 pt-3" onSubmit={handleRegisterSubmit}>
            <div className="space-y-2">
              <label className="text-[10px] font-bold text-muted-foreground uppercase">Select Events</label>
              <div className="grid grid-cols-1 gap-2">
                {targetTournament && (targetTournament as any).events?.map((evt: any) => {
                  const isChecked = selectedEventIds.includes(evt.id);
                  return (
                    <label key={evt.id} className={`flex items-center gap-3 rounded-xl p-3 cursor-pointer transition-all border ${
                      isChecked ? 'border-primary/40 bg-primary/8' : 'border-border hover:border-primary/30'
                    }`}
                      style={isChecked ? { background: 'oklch(0.72 0.21 42 / 0.06)' } : { background: 'oklch(0.185 0.02 256)' }}
                    >
                      <input type="checkbox" checked={isChecked}
                        onChange={(e) => {
                          if (e.target.checked) setSelectedEventIds((prev) => [...prev, evt.id]);
                          else setSelectedEventIds((prev) => prev.filter((id) => id !== evt.id));
                        }}
                        className="rounded"
                        style={{ accentColor: 'oklch(0.72 0.21 42)' }}
                      />
                      <div>
                        <p className="text-xs font-bold text-foreground">{evt.puzzleTypeName}</p>
                        <p className="text-[10px] text-muted-foreground">{evt.eventFormatCode} • {evt.solveCount} solves</p>
                      </div>
                    </label>
                  );
                })}
              </div>
            </div>

            {feedback && (
              <div className={`rounded-xl border p-3.5 text-xs font-medium leading-relaxed ${
                feedback.startsWith('✓')
                  ? 'border-emerald-500/30 bg-emerald-500/8 text-emerald-400'
                  : feedback.startsWith('Registration failed')
                    ? 'border-red-500/30 bg-red-500/8 text-red-400'
                    : 'border-border text-muted-foreground'
              }`}>
                {feedback}
              </div>
            )}

            <DialogFooter className="pt-3 border-t border-border flex gap-2 justify-end">
              <button type="button" onClick={closeRegister}
                className="px-4 py-2 rounded-xl border border-border text-xs font-bold text-muted-foreground hover:text-foreground transition-colors"
              >
                Cancel
              </button>
              <button type="submit" disabled={isRegistering || selectedEventIds.length === 0}
                className="flex items-center gap-2 px-5 py-2 rounded-xl text-xs font-black text-primary-foreground transition disabled:opacity-50"
                style={{ background: 'oklch(0.72 0.21 42)', boxShadow: '0 2px 12px oklch(0.72 0.21 42 / 0.25)' }}
              >
                {isRegistering ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Ticket className="h-3.5 w-3.5" />}
                {isRegistering ? 'Processing...' : 'Get QR Ticket'}
              </button>
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
        <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.72 0.21 42)' }} />
      </div>
    }>
      <main className="min-h-screen bg-background text-foreground pb-20 surface-gradient">
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
          <TournamentsPageContent />
        </div>
      </main>
    </Suspense>
  );
}
