'use client';

import Link from 'next/link';
import { useMemo, useState, useEffect } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { 
  BadgeCheck, 
  Camera, 
  ChevronRight, 
  QrCode, 
  ShieldCheck, 
  Signature, 
  Timer, 
  Sparkles,
  Award,
  Video
} from 'lucide-react';
import { 
  getCompetitors, 
  saveCompetitors, 
  getTournaments, 
  Competitor, 
  Tournament 
} from '@/lib/tournament-store';

type Penalty = 'None' | '+2' | 'DNF';

type MedleySolve = {
  puzzle: string;
  time: string;
  penalty: Penalty;
};

export default function JudgePage() {
  const [playerQr, setPlayerQr] = useState('QR-428761');
  const [round, setRound] = useState('Solve 1');
  const [attempt, setAttempt] = useState('1');
  const [stackmat, setStackmat] = useState('8.42');
  const [penalty, setPenalty] = useState<Penalty>('None');
  const [signature, setSignature] = useState('');
  const [status, setStatus] = useState('Enter a competitor QR code to begin verification.');
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  
  const [activeCompetitor, setActiveCompetitor] = useState<Competitor | null>(null);
  const [activeTournament, setActiveTournament] = useState<Tournament | null>(null);

  const [medleySolves, setMedleySolves] = useState<MedleySolve[]>([
    { puzzle: '3x3 Cube', time: '12.42', penalty: 'None' },
    { puzzle: 'Skewb', time: '7.88', penalty: '+2' },
    { puzzle: 'Pyraminx', time: '6.35', penalty: 'None' },
  ]);

  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);

  useEffect(() => {
    setCompetitors(getCompetitors());
    setTournaments(getTournaments());
  }, []);

  const finalTime = useMemo(() => {
    if (penalty === 'DNF') return 'DNF';
    const parsed = Number.parseFloat(stackmat || '0');
    if (Number.isNaN(parsed)) return 'Invalid time';
    const adjusted = penalty === '+2' ? parsed + 2 : parsed;
    return `${adjusted.toFixed(2)}s`;
  }, [penalty, stackmat]);

  const medleyResult = useMemo(() => {
    if (medleySolves.some((s) => s.penalty === 'DNF')) return 'DNF';
    const total = medleySolves.reduce((sum, s) => {
      const p = Number.parseFloat(s.time || '0');
      const pen = s.penalty === '+2' ? 2 : 0;
      return sum + (Number.isNaN(p) ? 0 : p + pen);
    }, 0);
    return `${total.toFixed(2)}s`;
  }, [medleySolves]);

  const verifyCompetitor = () => {
    const found = competitors.find(c => c.qrCode.toLowerCase() === playerQr.toLowerCase());
    if (found) {
      setActiveCompetitor(found);
      const tour = tournaments.find(t => t.id === found.tournamentId);
      setActiveTournament(tour || null);
      setStatus(`Verified: Competitor ${found.name} is checked into "${tour?.name || 'Tournament'}" - Format: ${tour?.formatType || 'Traditional'}`);
      setRound(`Solve ${found.solves.length + 1}`);
      setAttempt(String(found.solves.length + 1));
    } else {
      setActiveCompetitor(null);
      setActiveTournament(null);
      setStatus(`Error: QR code "${playerQr}" not found in current registrations.`);
    }
  };

  const submitResult = () => {
    if (!activeCompetitor) {
      setResultSummary('Please verify a valid competitor first.');
      return;
    }
    if (!signature.trim()) {
      setResultSummary('Authentication failed: Please collect competitor signature sign-off.');
      return;
    }

    const calculatedTimeMs = activeTournament?.formatType === 'Medley' 
      ? medleySolves.reduce((sum, s) => {
          if (s.penalty === 'DNF') return sum;
          const parsed = Number.parseFloat(s.time) * 1000;
          const extra = s.penalty === '+2' ? 2000 : 0;
          return sum + parsed + extra;
        }, 0)
      : (penalty === 'DNF' ? 0 : (Number.parseFloat(stackmat) * 1000 + (penalty === '+2' ? 2000 : 0)));

    const newAttemptSolve = {
      attempt: activeCompetitor.solves.length + 1,
      time: calculatedTimeMs,
      penalty: activeTournament?.formatType === 'Medley' 
        ? (medleySolves.some(s => s.penalty === 'DNF') ? 'DNF' as const : 'None' as const)
        : penalty,
      isMedley: activeTournament?.formatType === 'Medley',
      medleyDetails: activeTournament?.formatType === 'Medley' 
        ? medleySolves.map(s => ({ puzzle: s.puzzle, time: Number.parseFloat(s.time) * 1000, penalty: s.penalty }))
        : undefined
    };

    const updatedCompetitors = competitors.map(c => {
      if (c.qrCode === activeCompetitor.qrCode) {
        return {
          ...c,
          solves: [...c.solves, newAttemptSolve]
        };
      }
      return c;
    });

    setCompetitors(updatedCompetitors);
    saveCompetitors(updatedCompetitors);
    
    setResultSummary(`Success: Submitted solve ${round} duration of ${activeTournament?.formatType === 'Medley' ? medleyResult : finalTime}. Live rankings updated.`);
    setSignature('');
    
    // Refresh active competitor details
    const refreshed = updatedCompetitors.find(c => c.qrCode === activeCompetitor.qrCode);
    setActiveCompetitor(refreshed || null);
  };

  const updateSolve = (index: number, field: keyof MedleySolve, value: string) => {
    setMedleySolves((cur) => cur.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  return (
    <main className="min-h-screen bg-background text-foreground pb-20">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8 space-y-12">
        {/* Banner Section */}
        <Card className="border border-border bg-card p-8 rounded-3xl relative overflow-hidden shadow-xl shadow-black/10">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_50%)]" />
          <div className="relative z-10 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
            <div className="space-y-3">
              <div className="flex flex-wrap items-center gap-3">
                <span className="rounded-full bg-[#eab308]/10 border border-[#eab308]/20 px-3 py-1 text-xs font-semibold text-[#eab308] flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4" /> JUDGING LANE ACTIVE
                </span>
                <span className="text-muted-foreground text-xs font-medium">• WCA Certified Standard</span>
              </div>
              <h1 className="text-3xl font-black tracking-tight text-foreground sm:text-5xl uppercase">
                JUDGE STATION
              </h1>
              <p className="text-muted-foreground max-w-2xl text-sm sm:text-base leading-relaxed">
                Scan/input player check-in QR codes, sync Stackmat solve attempts, apply time penalties (+2 / DNF), and collect competitor e-signature approvals.
              </p>
            </div>
            <div className="flex items-center gap-3">
              <Button asChild variant="outline" className="border-border text-xs rounded-xl h-auto px-5 py-3.5 bg-transparent">
                <Link href="/tournaments">BACK TO HUB</Link>
              </Button>
              <Button asChild className="bg-[#eab308] hover:bg-[#ca8a04] text-black font-black px-5 py-3.5 text-xs rounded-xl h-auto transition-all border-none">
                <Link href="/rankings">LIVE LEADERBOARD</Link>
              </Button>
            </div>
          </div>
        </Card>

        {/* Lane Operations Grid */}
        <div className="grid gap-6 lg:grid-cols-3">
          {/* Card 1: Verification */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <QrCode className="h-4 w-4" /> 1. Verify Competitor
              </h3>
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Check-in QR Ticket</label>
                <input 
                  value={playerQr} 
                  onChange={(e) => setPlayerQr(e.target.value)} 
                  className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                />
                <div className="grid gap-3 sm:grid-cols-2">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Round</label>
                    <input 
                      value={round} 
                      onChange={(e) => setRound(e.target.value)} 
                      className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Attempt</label>
                    <input 
                      value={attempt} 
                      onChange={(e) => setAttempt(e.target.value)} 
                      className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                    />
                  </div>
                </div>
              </div>
            </div>
            
            <div className="space-y-3 pt-4">
              <Button className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-xl py-5 text-xs" onClick={verifyCompetitor}>
                VERIFY PLAYER
              </Button>
              <div className="rounded-xl border border-border/80 bg-muted/10 p-3.5 text-[11px] text-muted-foreground leading-relaxed">
                {status}
              </div>
            </div>
          </Card>

          {/* Card 2: Solve Time Inputs */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <Timer className="h-4 w-4" /> 2. Stackmat Solve
              </h3>
              
              {activeTournament?.formatType !== 'Medley' ? (
                <div className="space-y-3 pt-2">
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">Timer Duration (Seconds)</label>
                    <input 
                      value={stackmat} 
                      onChange={(e) => setStackmat(e.target.value)} 
                      className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-muted-foreground uppercase mb-1.5">WCA Penalty Adjustments</label>
                    <select 
                      value={penalty} 
                      onChange={(e) => setPenalty(e.target.value as Penalty)} 
                      className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]"
                    >
                      <option value="None">None (Clean Solve)</option>
                      <option value="+2">+2 Seconds Penalty</option>
                      <option value="DNF">Did Not Finish (DNF)</option>
                    </select>
                  </div>
                </div>
              ) : (
                <div className="rounded-xl bg-[#eab308]/5 border border-[#eab308]/25 p-4 text-xs text-muted-foreground leading-relaxed">
                  Medley Relay active. Use the special Medley Panel below to enter solve values for each puzzle type.
                </div>
              )}
            </div>

            {activeTournament?.formatType !== 'Medley' && (
              <div className="rounded-xl border border-border/60 p-4 bg-muted/10 text-center">
                <p className="text-[10px] font-bold text-muted-foreground uppercase">Adjusted Solved Time</p>
                <p className="mt-1 text-2xl font-black text-[#eab308]">{finalTime}</p>
              </div>
            )}
          </Card>

          {/* Card 3: Signatures and submission */}
          <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
            <div className="space-y-4">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <Signature className="h-4 w-4" /> 3. Player Auths
              </h3>
              <div className="space-y-3 pt-2">
                <label className="block text-[10px] font-bold text-muted-foreground uppercase">Competitor Signature Confirmation</label>
                <input 
                  value={signature} 
                  onChange={(e) => setSignature(e.target.value)} 
                  placeholder="Competitor signs name to verify" 
                  className="w-full rounded-xl border border-border bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-[#eab308]" 
                />
              </div>
            </div>

            <div className="space-y-3 pt-4">
              <Button className="w-full bg-[#eab308] hover:bg-[#ca8a04] text-black font-extrabold rounded-xl py-5 text-xs" onClick={submitResult}>
                SUBMIT SOLVE RECORD
              </Button>
              {resultSummary && (
                <div className={`rounded-xl border p-3.5 text-[11px] font-semibold leading-relaxed ${
                  resultSummary.includes('Success') 
                    ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-400' 
                    : 'border-red-500/30 bg-red-500/10 text-red-400'
                }`}>
                  {resultSummary}
                </div>
              )}
            </div>
          </Card>
        </div>

        {/* Medley panel section (displayed when Medley tournament loaded) */}
        {activeTournament?.formatType === 'Medley' && (
          <div className="grid gap-6 lg:grid-cols-[1.5fr_0.8fr] animate-in fade-in duration-300">
            <Card className="p-6 border border-border/60 bg-card rounded-2xl space-y-4 hover:border-[#eab308]/20 transition-all duration-300">
              <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider flex items-center gap-1.5">
                <Award className="h-4.5 w-4.5" /> Medley Puzzles Lane Setup
              </h3>
              <div className="space-y-3">
                {medleySolves.map((s, i) => (
                  <div key={s.puzzle} className="grid gap-3 sm:grid-cols-[1fr_140px_140px] items-center rounded-xl border border-border bg-muted/15 p-3 hover:border-border/80 transition-colors">
                    <div>
                      <p className="text-xs font-bold text-foreground">{s.puzzle}</p>
                    </div>
                    <input 
                      value={s.time} 
                      onChange={(e) => updateSolve(i, 'time', e.target.value)} 
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground outline-none focus:border-[#eab308]" 
                    />
                    <select 
                      value={s.penalty} 
                      onChange={(e) => updateSolve(i, 'penalty', e.target.value as Penalty)} 
                      className="rounded-xl border border-border bg-muted/10 px-3 py-2 text-xs text-foreground outline-none focus:border-[#eab308]"
                    >
                      <option value="None">None</option>
                      <option value="+2">+2s</option>
                      <option value="DNF">DNF</option>
                    </select>
                  </div>
                ))}
              </div>
            </Card>

            <Card className="p-6 border border-border/60 bg-card rounded-2xl flex flex-col justify-between shadow-sm hover:border-[#eab308]/20 transition-all duration-300">
              <div className="space-y-4">
                <h3 className="font-extrabold text-sm text-[#eab308] uppercase tracking-wider">
                  Medley Combined Stats
                </h3>
                <div className="mt-4 rounded-xl bg-[#eab308]/5 border border-[#eab308]/25 p-4 text-center">
                  <p className="text-[10px] font-bold text-muted-foreground uppercase">Computed Total duration</p>
                  <p className="mt-1.5 text-3xl font-black text-[#eab308]">{medleyResult}</p>
                </div>
              </div>
              
              <div className="rounded-xl border border-border/80 bg-muted/10 p-3.5 text-[10px] text-muted-foreground leading-relaxed mt-4">
                Make sure all puzzle durations have been typed correctly. The Medley total updates dynamically on values change.
              </div>
            </Card>
          </div>
        )}
      </div>
    </main>
  );
}
