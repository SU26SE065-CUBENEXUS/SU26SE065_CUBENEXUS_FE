'use client';

import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { OnlineMatchScanner } from '@/features/online-arena/components/OnlineMatchScanner';
import { mockScramblePass } from '@/features/online-arena/api/onlineArenaApi';
import { simulateScramble, COLOR_HEX_MAP } from '@/features/rubik-scanner-test/utils/rubikSimulator';
import { Radio, Clock, Shuffle, Eye, RotateCcw } from 'lucide-react';

function useCountdown(deadlineIso: string | null, serverNowIso: string): string {
  const skewRef = React.useRef<number | null>(null);

  const parseUtc = (dateStr: string | null | undefined): number => {
    if (!dateStr) return 0;
    const hasTimezone = dateStr.endsWith('Z') || /[+-]\d{2}:\d{2}$/.test(dateStr);
    return new Date(hasTimezone ? dateStr : `${dateStr}Z`).getTime();
  };

  const [remaining, setRemaining] = useState<number>(() => {
    if (!deadlineIso) return 0;
    const skew = Date.now() - parseUtc(serverNowIso);
    skewRef.current = skew;
    return Math.max(0, Math.floor((parseUtc(deadlineIso) - Date.now() + skew) / 1000));
  });

  useEffect(() => {
    if (!deadlineIso) return;

    if (skewRef.current === null) {
      skewRef.current = Date.now() - parseUtc(serverNowIso);
    }
    const stableSkew = skewRef.current;

    const tick = () => {
      const secs = Math.max(0, Math.floor((parseUtc(deadlineIso) - Date.now() + stableSkew) / 1000));
      setRemaining(secs);
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [deadlineIso]);

  const m = Math.floor(remaining / 60);
  const s = remaining % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

// ------------------------------------------------------------------
function CountdownTimer({ deadlineIso, serverNowIso }: { deadlineIso: string | null; serverNowIso: string }) {
  const countdownStr = useCountdown(deadlineIso, serverNowIso);
  if (!deadlineIso) return null;
  return (
    <div
      className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${parseInt(countdownStr) < 60
          ? 'border-rose-500/30 bg-rose-500/10 text-rose-400'
          : 'border-orange-500/20 bg-orange-500/10 text-orange-400'
        }`}
    >
      <span className="flex items-center gap-1.5">
        <Clock className="h-3.5 w-3.5" />
        Setup deadline remaining
      </span>
      <span className="font-mono text-base font-black">{countdownStr}</span>
    </div>
  );
}

// ------------------------------------------------------------------
// ScrambleDisplay — hiển thị từng move dưới dạng badge
// ------------------------------------------------------------------
function ScrambleDisplay({ sequence }: { sequence: string }) {
  const moves = sequence.trim().split(/\s+/).filter(Boolean);

  // Classify the move for coloring
  const getMoveColor = (move: string) => {
    const face = move[0].toUpperCase();
    const colors: Record<string, string> = {
      U: 'border-zinc-300 bg-zinc-100 text-zinc-800',
      D: 'border-yellow-400 bg-yellow-400/20 text-yellow-700',
      F: 'border-emerald-500/30 bg-emerald-500/10 text-emerald-700',
      B: 'border-blue-500/30 bg-blue-500/10 text-blue-700',
      R: 'border-red-500/30 bg-red-500/10 text-red-700',
      L: 'border-orange-500/30 bg-orange-500/10 text-orange-700',
    };
    return colors[face] ?? 'border-border bg-muted text-muted-foreground';
  };

  return (
    <div className="rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 to-card p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Shuffle className="h-4 w-4 text-orange-500" />
        <span className="text-xs font-black text-orange-500 uppercase tracking-widest">Your Scramble</span>
      </div>

      <div className="flex flex-wrap gap-2">
        {moves.map((move, i) => (
          <span
            key={i}
            className={`inline-flex items-center justify-center min-w-[2.25rem] px-2.5 py-1.5 rounded-xl border font-mono text-sm font-black tracking-wider ${getMoveColor(move)}`}
          >
            {move}
          </span>
        ))}
      </div>

      <p className="text-[10px] text-muted-foreground leading-relaxed">
        Apply <span className="font-bold text-foreground">{moves.length} move{moves.length !== 1 ? 's' : ''}</span> to your cube starting from a <span className="font-bold text-foreground">solved state</span>, then scan any 5 faces.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------
// ColorSchemeGuide — Hướng dẫn chuẩn màu sắc 6 mặt & Mô hình 2D Target sau khi Scramble
// ------------------------------------------------------------------
function ColorSchemeGuide({ scrambleSequence }: { scrambleSequence: string | null }) {
  const [selectedFace, setSelectedFace] = useState<'U' | 'D' | 'F' | 'B' | 'R' | 'L' | null>(null);

  const expectedState = useMemo(() => {
    return scrambleSequence ? simulateScramble(scrambleSequence) : null;
  }, [scrambleSequence]);

  const scheme = [
    { code: 'U', name: 'Up', colorName: 'White', bg: 'bg-white text-zinc-950 border-zinc-300' },
    { code: 'D', name: 'Down', colorName: 'Yellow', bg: 'bg-yellow-400 text-zinc-950 border-yellow-300' },
    { code: 'F', name: 'Front', colorName: 'Green', bg: 'bg-emerald-500 text-white border-emerald-400' },
    { code: 'B', name: 'Back', colorName: 'Blue', bg: 'bg-blue-600 text-white border-blue-400' },
    { code: 'R', name: 'Right', colorName: 'Red', bg: 'bg-red-600 text-white border-red-400' },
    { code: 'L', name: 'Left', colorName: 'Orange', bg: 'bg-orange-500 text-white border-orange-400' },
  ] as const;

  return (
    <div className="rounded-2xl border border-border bg-card p-5 space-y-4 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div>
          <span className="text-xs font-bold text-foreground uppercase tracking-wider block">
            Starting Faces & Target Scramble Layout
          </span>
          <span className="text-[10px] text-muted-foreground mt-0.5 block">
            Compare your physical cube faces with the target 3x3 patterns below after scrambling.
          </span>
        </div>
        {/* <span className="text-[10px] font-mono font-bold text-orange-500 bg-orange-500/10 border border-orange-500/20 px-3 py-1 rounded-full uppercase tracking-wider">
          Expected 2D Pattern
        </span> */}
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-3">
        {scheme.map((item) => {
          const faceKey = item.code as 'U' | 'D' | 'F' | 'B' | 'R' | 'L';
          const faceGrid = expectedState ? expectedState[faceKey] : null;
          const isSelected = selectedFace === faceKey;

          return (
            <div
              key={item.code}
              onClick={() => setSelectedFace(isSelected ? null : faceKey)}
              className={`flex flex-col items-center p-3 rounded-2xl border transition-all cursor-pointer select-none space-y-2.5 ${isSelected
                  ? 'bg-orange-500/10 border-orange-500 shadow-md ring-2 ring-orange-500/20 scale-105 z-10'
                  : 'bg-muted/40 border-border/80 hover:border-orange-500/40 hover:bg-muted'
                }`}
            >
              {/* Header badge */}
              <div className="flex items-center gap-2">
                <div className={`w-6 h-6 rounded-md border font-black text-xs flex items-center justify-center shadow-sm ${item.bg}`}>
                  {item.code}
                </div>
                <div className="text-left">
                  <span className="block text-[11px] font-extrabold text-foreground leading-none">{item.colorName}</span>
                  <span className="block text-[9px] text-muted-foreground font-mono leading-none mt-0.5">({item.name})</span>
                </div>
              </div>

              {/* 3x3 Target Rubik Grid */}
              {faceGrid ? (
                <div className="grid grid-cols-3 gap-1 p-1.5 bg-zinc-950 rounded-xl w-full max-w-[105px] aspect-square border border-zinc-800 shadow-inner">
                  {faceGrid.flatMap((row, rIdx) =>
                    row.map((color, cIdx) => (
                      <span
                        key={`${rIdx}-${cIdx}`}
                        className="w-full aspect-square rounded-[2px] border border-black/40 shadow-xs"
                        style={{ backgroundColor: COLOR_HEX_MAP[color] || '#4b5563' }}
                        title={`${item.colorName} face (${color})`}
                      />
                    ))
                  )}
                </div>
              ) : (
                <div className="w-[95px] h-[95px] rounded-xl bg-zinc-900 border border-border flex items-center justify-center">
                  <span className="text-[9px] text-muted-foreground">Loading...</span>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Detailed view if face clicked */}
      {selectedFace && expectedState && (
        <div className="p-4 rounded-2xl bg-background/90 border border-orange-500/30 space-y-3 shadow-xl animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-foreground">
              <Eye className="h-4 w-4 text-orange-500" /> Detailed Face View: <strong className="text-orange-500">{selectedFace} Face</strong>
            </span>
            <button
              onClick={() => setSelectedFace(null)}
              className="text-[10px] font-black uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 px-3 py-1 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Close Details
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 max-w-[180px] mx-auto p-3 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl">
            {expectedState[selectedFace].flatMap((row, rIdx) =>
              row.map((color, cIdx) => (
                <div key={`${rIdx}-${cIdx}`} className="space-y-1 text-center">
                  <span
                    className="block w-full aspect-square rounded-lg border border-black/50 shadow-md"
                    style={{ backgroundColor: COLOR_HEX_MAP[color] || '#4b5563' }}
                  />
                  <span className="text-[9px] font-mono text-zinc-400 capitalize">{color}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ------------------------------------------------------------------
export default function ScrambleCheckPage() {
  const { matchId, state, refetch } = useMatchContext();
  const [isSkipping, setIsSkipping] = useState(false);

  const handleSuccess = useCallback(async () => {
    console.log('Scramble Scan completed successfully! Refetching state...');
    await refetch();
  }, [refetch]);

  const handleSkip = async () => {
    setIsSkipping(true);
    try {
      await mockScramblePass(matchId);
      await refetch();
    } catch (err) {
      console.error('Failed to skip scramble scan', err);
    } finally {
      setIsSkipping(false);
    }
  };

  const scramble = state?.scrambleSequence ?? null;

  return (
    <div className="space-y-6 animate-fade-in max-w-6xl mx-auto w-full px-4 sm:px-6">
      <div className="space-y-2 text-center">
        <span className="bg-orange-500/10 border border-orange-500/20 text-orange-500 text-[10px] font-black tracking-widest px-3 py-1 rounded-full uppercase">
          Stage 2 / 4
        </span>
        <h2 className="text-3xl font-black text-foreground uppercase tracking-wider">SCRAMBLE CHECK</h2>
        <p className="text-muted-foreground text-xs sm:text-sm">
          Apply the scramble below to your cube from a <strong className="text-foreground">solved state</strong>, then scan any 5 faces for verification.
        </p>

        <button
          onClick={handleSkip}
          disabled={isSkipping}
          className="mt-3 px-4 py-2 bg-card border border-border hover:bg-muted hover:text-foreground text-muted-foreground text-xs font-black rounded-xl uppercase transition-all tracking-wider inline-flex items-center gap-2 cursor-pointer"
        >
          {isSkipping ? 'Skipping...' : 'Dev: Skip Scramble Scan'}
        </button>
      </div>

      <CountdownTimer deadlineIso={state?.setupDeadlineAt ?? null} serverNowIso={state?.serverNow ?? new Date().toISOString()} />

      {/* Scramble Display */}
      {scramble ? (
        <ScrambleDisplay sequence={scramble} />
      ) : (
        <div className="rounded-2xl border border-border bg-card p-5 text-center">
          <p className="text-xs text-muted-foreground">Loading scramble...</p>
        </div>
      )}

      {/* Color Scheme & Target 3x3 Scramble Guide */}
      <ColorSchemeGuide scrambleSequence={scramble} />

      <OnlineMatchScanner
        matchId={matchId}
        validationType="SCRAMBLE"
        onSuccess={handleSuccess}
      />

      <div className="text-center">
        <span className="text-[10px] font-black text-muted-foreground uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" /> Auto-evaluating center color and 3x3 face stability
        </span>
      </div>
    </div>
  );
}

