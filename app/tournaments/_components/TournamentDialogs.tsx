'use client';

import { useState, useRef, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { QrCode, PenTool, CheckCircle, ShieldAlert, Award } from 'lucide-react';

type FlowAction = 'create' | 'register' | 'checkin' | 'dashboard' | null;

interface TournamentDialogsProps {
  activeAction: FlowAction;
  onClose: () => void;
}

export function TournamentDialogs({ activeAction, onClose }: TournamentDialogsProps) {
  const [feedback, setFeedback] = useState<string | null>(null);
  const [qrCode, setQrCode] = useState<string | null>(null);
  const [selectedFormat, setSelectedFormat] = useState('Traditional');
  const [medleyPuzzles, setMedleyPuzzles] = useState<string[]>(['3x3', '2x2']);

  // E-Signature states and ref
  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSigned, setHasSigned] = useState(false);

  useEffect(() => {
    // Reset state on modal open/change
    setFeedback(null);
    setQrCode(null);
    setHasSigned(false);
  }, [activeAction]);

  // Handle signature drawing
  const startDrawing = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.strokeStyle = 'oklch(0.8 0.19 92)'; // accent color
    ctx.lineWidth = 3.5;
    ctx.lineCap = 'round';

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.beginPath();
    ctx.moveTo(clientX - rect.left, clientY - rect.top);
    setIsDrawing(true);
  };

  const draw = (e: React.MouseEvent<HTMLCanvasElement> | React.TouchEvent<HTMLCanvasElement>) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = e.clientX;
      clientY = e.clientY;
    }

    ctx.lineTo(clientX - rect.left, clientY - rect.top);
    ctx.stroke();
    setHasSigned(true);
  };

  const stopDrawing = () => {
    setIsDrawing(false);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSigned(false);
  };

  const handleCreateSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const tournamentName = String(formData.get('tournamentName') || 'Untitled Tournament');
    const limit = String(formData.get('timeLimit') || '10m');
    
    if (selectedFormat === 'Medley') {
      setFeedback(`Success: Tournament "${tournamentName}" created with Medley format (${medleyPuzzles.join(' + ')}). Scramble sequence bundles generated.`);
    } else {
      setFeedback(`Success: Traditional Tournament "${tournamentName}" created. Scrambles generated under standard WCA parameters.`);
    }
  };

  const handleRegisterSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const formData = new FormData(event.currentTarget);
    const playerName = String(formData.get('playerName') || 'Cuber');
    const tName = String(formData.get('tournamentName') || 'Global Championship');
    const mockQr = `CN-${Math.floor(100000 + Math.random() * 900000)}`;

    setQrCode(mockQr);
    setFeedback(`Congratulations ${playerName}! Registered successfully for ${tName}. Keep this check-in QR Code secure.`);
  };

  const handleCheckInSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!hasSigned) {
      setFeedback('Error: Competitor signature is required to verify the Stackmat time.');
      return;
    }
    const formData = new FormData(event.currentTarget);
    const time = String(formData.get('stackmat') || '0.00');
    const penalty = String(formData.get('penalty') || 'None');
    const competitorId = String(formData.get('playerQr') || 'QR-428761');

    let displayTime = `${time}s`;
    if (penalty === '+2') displayTime = `${(parseFloat(time) + 2).toFixed(2)}s (+2 Applied)`;
    if (penalty === 'DNF') displayTime = 'DNF (Did Not Finish)';

    setFeedback(`Checked-in and saved. Competitor "${competitorId}" score recorded as: ${displayTime}. Verified by digital e-signature.`);
  };

  const togglePuzzleSelection = (puzzle: string) => {
    if (medleyPuzzles.includes(puzzle)) {
      if (medleyPuzzles.length > 1) {
        setMedleyPuzzles(medleyPuzzles.filter((p) => p !== puzzle));
      }
    } else {
      setMedleyPuzzles([...medleyPuzzles, puzzle]);
    }
  };

  const dialogMeta = {
    create: {
      title: 'Create Tournament / Event Config',
      description: 'Configure offline groups, select puzzle formats, and initialize cryptographically secure scramble bundles.',
    },
    register: {
      title: 'Competitor Registration',
      description: 'Sign up for a published tournament and receive your unique player check-in QR code.',
    },
    checkin: {
      title: 'Station Judge Check-In & Scoring',
      description: 'Scan player QR, enter Stackmat times, verify WCA penalties, and collect digital signatures.',
    },
    dashboard: {
      title: 'Live Operations & Live Boards',
      description: 'Monitor real-time judging streams, solve rates, dispute locks, and live score sync.',
    },
  }[activeAction || 'create'];

  return (
    <Dialog open={Boolean(activeAction)} onOpenChange={(open) => (!open ? onClose() : null)}>
      <DialogContent className="max-w-2xl border-border bg-card text-foreground shadow-2xl rounded-2xl p-6 sm:p-8">
        <DialogHeader className="mb-6">
          <DialogTitle className="text-2xl font-bold flex items-center gap-2">
            <Award className="h-6 w-6 text-accent" />
            {dialogMeta.title}
          </DialogTitle>
          <DialogDescription className="text-sm text-muted-foreground mt-1">
            {dialogMeta.description}
          </DialogDescription>
        </DialogHeader>

        {/* Create Flow */}
        {activeAction === 'create' && (
          <form className="space-y-5" onSubmit={handleCreateSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Tournament Name</span>
                <input
                  name="tournamentName"
                  required
                  defaultValue="CubeNexus Open 2026"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Time Limit / Cut-off</span>
                <input
                  name="timeLimit"
                  required
                  defaultValue="10 minutes"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold">
              <span>Event Description</span>
              <textarea
                name="description"
                rows={3}
                defaultValue="WCA-aligned offline regional cup utilizing real-time table judge scoresheets."
                className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
              />
            </label>

            <div className="space-y-3">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Format Selection</span>
                <select
                  value={selectedFormat}
                  onChange={(e) => setSelectedFormat(e.target.value)}
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                >
                  <option value="Traditional">Traditional (Single Puzzle)</option>
                  <option value="Medley">Medley (Multi-Puzzle Sequence)</option>
                </select>
              </label>

              {selectedFormat === 'Medley' && (
                <div className="rounded-xl border border-accent/20 bg-accent/5 p-4 space-y-3">
                  <span className="text-xs font-bold text-accent uppercase tracking-wider">Select Puzzles in Medley Sequence (In Order)</span>
                  <div className="flex flex-wrap gap-2 pt-1">
                    {['2x2', '3x3', '4x4', '3x3 One-Handed', 'Pyraminx', 'Megaminx'].map((puzzle) => {
                      const isSelected = medleyPuzzles.includes(puzzle);
                      return (
                        <button
                          key={puzzle}
                          type="button"
                          onClick={() => togglePuzzleSelection(puzzle)}
                          className={`rounded-lg px-3 py-1.5 text-xs font-semibold border transition-all duration-300 ${
                            isSelected
                              ? 'bg-accent text-accent-foreground border-accent shadow-sm'
                              : 'bg-background hover:bg-muted border-border'
                          }`}
                        >
                          {puzzle}
                        </button>
                      );
                    })}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    *WCA Penalty Rule: The medley scoresheets automatically sum all sequential puzzle attempts. Any single puzzle marked DNF defaults the entire attempt to DNF.
                  </p>
                </div>
              )}
            </div>

            {feedback && (
              <div className="flex items-start gap-2.5 rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 text-sm text-foreground">
                <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                <span>{feedback}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="border-border rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-5 font-bold">
                Generate Event Config
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Register Flow */}
        {activeAction === 'register' && (
          <form className="space-y-5" onSubmit={handleRegisterSubmit}>
            <label className="flex flex-col gap-2 text-sm font-semibold">
              <span>Selected Tournament</span>
              <input
                name="tournamentName"
                readOnly
                value="Global Championship 2025"
                className="rounded-xl border border-border bg-muted/40 px-4 py-2.5 text-sm text-foreground focus:outline-none"
              />
            </label>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Player Name</span>
                <input
                  name="playerName"
                  required
                  defaultValue="CubeNexus_Competitor"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Contact Email</span>
                <input
                  name="email"
                  type="email"
                  required
                  defaultValue="competitor@cubenexus.app"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </label>
            </div>

            {feedback && (
              <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-4 space-y-4">
                <div className="flex items-start gap-2.5 text-sm text-foreground">
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                  <span>{feedback}</span>
                </div>
                {qrCode && (
                  <div className="flex flex-col items-center justify-center p-4 rounded-xl bg-white border border-border/80 max-w-[200px] mx-auto shadow-sm">
                    <QrCode className="h-28 w-28 text-slate-800" />
                    <span className="mt-2 text-xs font-bold text-slate-700">{qrCode}</span>
                  </div>
                )}
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="border-border rounded-xl" onClick={onClose}>
                Close
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-5 font-bold">
                Confirm Registration & QR
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Judge Flow */}
        {activeAction === 'checkin' && (
          <form className="space-y-5" onSubmit={handleCheckInSubmit}>
            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Player QR Scan ID</span>
                <input
                  name="playerQr"
                  required
                  defaultValue="QR-428761"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Attempt Turn</span>
                <input
                  name="round"
                  required
                  defaultValue="Attempt 1 of 5"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40"
                />
              </label>
            </div>

            <div className="grid gap-4 sm:grid-cols-2">
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>Stackmat Timer Input (seconds)</span>
                <input
                  name="stackmat"
                  required
                  defaultValue="8.42"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold">
                <span>WCA Penalty Rule</span>
                <select
                  name="penalty"
                  className="rounded-xl border border-border bg-background px-4 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-accent/40 focus:border-accent"
                >
                  <option value="None">None (Clean Solve)</option>
                  <option value="+2">+2 seconds penalty</option>
                  <option value="DNF">DNF (Did Not Finish)</option>
                </select>
              </label>
            </div>

            {/* E-Signature Drawing Board */}
            <div className="space-y-2">
              <span className="text-sm font-semibold flex items-center gap-1.5">
                <PenTool className="h-4.5 w-4.5 text-accent" />
                Competitor Digital E-Signature Verification
              </span>
              <div className="rounded-xl border border-border/80 bg-background overflow-hidden relative shadow-inner">
                <canvas
                  ref={canvasRef}
                  width={560}
                  height={120}
                  className="w-full h-[120px] cursor-crosshair touch-none bg-background/50"
                  onMouseDown={startDrawing}
                  onMouseMove={draw}
                  onMouseUp={stopDrawing}
                  onMouseLeave={stopDrawing}
                  onTouchStart={startDrawing}
                  onTouchMove={draw}
                  onTouchEnd={stopDrawing}
                />
                {!hasSigned && (
                  <div className="absolute inset-0 flex items-center justify-center pointer-events-none text-muted-foreground/60 text-xs font-semibold">
                    Competitor must sign here to confirm attempt time
                  </div>
                )}
                {hasSigned && (
                  <button
                    type="button"
                    onClick={clearSignature}
                    className="absolute right-3 bottom-3 rounded-lg border border-border bg-card px-2 py-1 text-[10px] font-bold text-muted-foreground hover:text-accent transition-colors"
                  >
                    Clear
                  </button>
                )}
              </div>
            </div>

            {feedback && (
              <div
                className={`flex items-start gap-2.5 rounded-xl border p-4 text-sm ${
                  feedback.startsWith('Error')
                    ? 'border-rose-500/20 bg-rose-500/10 text-foreground'
                    : 'border-emerald-500/20 bg-emerald-500/10 text-foreground'
                }`}
              >
                {feedback.startsWith('Error') ? (
                  <ShieldAlert className="h-5 w-5 text-rose-500 shrink-0 mt-0.5" />
                ) : (
                  <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0 mt-0.5" />
                )}
                <span>{feedback}</span>
              </div>
            )}

            <DialogFooter className="gap-2 sm:gap-0 pt-2">
              <Button type="button" variant="outline" className="border-border rounded-xl" onClick={onClose}>
                Cancel
              </Button>
              <Button type="submit" className="bg-accent text-accent-foreground hover:bg-accent/90 rounded-xl px-5 font-bold">
                Submit & Sign Attempt
              </Button>
            </DialogFooter>
          </form>
        )}

        {/* Dashboard Flow */}
        {activeAction === 'dashboard' && (
          <div className="space-y-6">
            <div className="grid gap-4 sm:grid-cols-3">
              <div className="rounded-xl border border-border p-4 bg-muted/10 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Attempt Progress</p>
                <p className="mt-2 text-3xl font-extrabold text-foreground">18 / 24</p>
                <div className="mt-2 text-[10px] text-muted-foreground">Times logged to tables</div>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/10 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Active Disputes</p>
                <p className="mt-2 text-3xl font-extrabold text-rose-500">2</p>
                <div className="mt-2 text-[10px] text-rose-500/80 font-medium">Requires delegate lock</div>
              </div>
              <div className="rounded-xl border border-border p-4 bg-muted/10 text-center">
                <p className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">WebSocket Sync</p>
                <p className="mt-2 text-3xl font-extrabold text-emerald-500 animate-pulse">Online</p>
                <div className="mt-2 text-[10px] text-emerald-500/80 font-medium">Latency &lt; 80ms</div>
              </div>
            </div>

            <div className="rounded-xl border border-border bg-muted/30 p-4 space-y-2">
              <h4 className="text-sm font-semibold text-foreground">Real-time Station Streams</h4>
              <p className="text-xs text-muted-foreground leading-relaxed">
                Judge stations are synced. Delegates can lock rounds to auto-calculate the top rankings and advance cubers to next brackets. Click below to review general results on the main leaderboard.
              </p>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" className="border-border rounded-xl" onClick={onClose}>
                Close Dashboard
              </Button>
            </DialogFooter>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}
