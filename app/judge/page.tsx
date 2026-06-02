'use client';

import Link from 'next/link';
import { useMemo, useState } from 'react';
import { Header } from '@/components/header';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { BadgeCheck, Camera, ChevronRight, QrCode, ShieldCheck, Signature, Timer } from 'lucide-react';

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
  const [status, setStatus] = useState('Ready to scan the competitor QR code.');
  const [resultSummary, setResultSummary] = useState<string | null>(null);
  const [medleySolves, setMedleySolves] = useState<MedleySolve[]>([
    { puzzle: '3x3', time: '12.42', penalty: 'None' },
    { puzzle: 'Skewb', time: '7.88', penalty: '+2' },
    { puzzle: 'Pyraminx', time: '6.35', penalty: 'None' },
  ]);

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

  const verifyCompetitor = () => setStatus(`Verified ${playerQr} for ${round} / attempt ${attempt}.`);
  const submitResult = () => {
    if (!signature.trim()) {
      setResultSummary('Please collect the competitor e-signature before submitting.');
      return;
    }
    setResultSummary(`Final result ${finalTime} submitted for ${playerQr}. Live board updated.`);
  };

  const updateSolve = (index: number, field: keyof MedleySolve, value: string) => {
    setMedleySolves((cur) => cur.map((s, i) => (i === index ? { ...s, [field]: value } : s)));
  };

  return (
    <main className="min-h-screen bg-background">
      <Header />
      <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <div className="mb-10 flex items-center justify-between">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.28em] text-muted-foreground">Judge App Flow</p>
            <h1 className="mt-3 text-4xl font-bold tracking-tight text-foreground sm:text-5xl">Judge Station</h1>
            <p className="mt-2 text-sm text-muted-foreground">Scan QR, verify competitor, enter stackmat times, apply penalties, collect e-signature.</p>
          </div>
          <div className="flex gap-3">
            <Button asChild variant="outline"><Link href="/tournaments">Back</Link></Button>
            <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90"><Link href="/rankings">Live Board</Link></Button>
          </div>
        </div>

        <div className="grid gap-6 lg:grid-cols-3">
          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground">Verify competitor</h3>
            <div className="mt-4 space-y-3">
              <input value={playerQr} onChange={(e) => setPlayerQr(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              <div className="grid gap-3 sm:grid-cols-2">
                <input value={round} onChange={(e) => setRound(e.target.value)} className="rounded-md border border-border px-3 py-2 bg-background" />
                <input value={attempt} onChange={(e) => setAttempt(e.target.value)} className="rounded-md border border-border px-3 py-2 bg-background" />
              </div>
              <Button className="w-full bg-accent text-accent-foreground" onClick={verifyCompetitor}>Verify QR</Button>
              <p className="text-sm text-muted-foreground">{status}</p>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground">Result entry</h3>
            <div className="mt-4 space-y-3">
              <input value={stackmat} onChange={(e) => setStackmat(e.target.value)} className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              <select value={penalty} onChange={(e) => setPenalty(e.target.value as Penalty)} className="w-full rounded-md border border-border px-3 py-2 bg-background">
                <option>None</option>
                <option>+2</option>
                <option>DNF</option>
              </select>
              <div className="rounded-xl border border-border p-3">
                <p className="text-sm text-muted-foreground">Final result</p>
                <p className="mt-1 text-2xl font-bold text-foreground">{finalTime}</p>
              </div>
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground">E-signature & submit</h3>
            <div className="mt-4 space-y-3">
              <input value={signature} onChange={(e) => setSignature(e.target.value)} placeholder="Competitor name" className="w-full rounded-md border border-border px-3 py-2 bg-background" />
              <Button className="w-full bg-accent text-accent-foreground" onClick={submitResult}>Submit result</Button>
              {resultSummary && <div className="rounded-lg border border-accent/30 bg-accent/5 p-3 text-sm text-foreground">{resultSummary}</div>}
            </div>
          </Card>
        </div>

        <div className="mt-8 grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground">Medley Event</h3>
            <div className="mt-4 space-y-3">
              {medleySolves.map((s, i) => (
                <div key={s.puzzle} className="grid gap-3 sm:grid-cols-[1fr_140px_120px] items-center rounded-xl border border-border p-3">
                  <div>
                    <p className="font-medium text-foreground">{s.puzzle}</p>
                  </div>
                  <input value={s.time} onChange={(e) => updateSolve(i, 'time', e.target.value)} className="rounded-md border border-border px-3 py-2 bg-background" />
                  <select value={s.penalty} onChange={(e) => updateSolve(i, 'penalty', e.target.value)} className="rounded-md border border-border px-3 py-2 bg-background">
                    <option>None</option>
                    <option>+2</option>
                    <option>DNF</option>
                  </select>
                </div>
              ))}
            </div>
          </Card>

          <Card className="p-6 border-border">
            <h3 className="font-semibold text-foreground">Medley Summary</h3>
            <div className="mt-4 rounded-2xl bg-accent/5 p-4">
              <p className="text-sm text-muted-foreground">Computed total</p>
              <p className="mt-2 text-3xl font-bold text-foreground">{medleyResult}</p>
            </div>
            <Button className="mt-4 w-full bg-foreground text-background">Review final Medley result <ChevronRight className="ml-2 h-4 w-4" /></Button>
          </Card>
        </div>
      </div>
    </main>
  );
}
