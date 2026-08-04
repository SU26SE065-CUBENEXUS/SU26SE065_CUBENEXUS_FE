'use client';

import React, { useState, useEffect, useCallback } from 'react';
import { useMatchContext } from '@/features/online-arena/contexts/MatchContext';
import { OnlineMatchScanner } from '@/features/online-arena/components/OnlineMatchScanner';
import { mockScramblePass } from '@/features/online-arena/api/onlineArenaApi';
import { Radio, Clock, Shuffle } from 'lucide-react';

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
      className={`flex items-center justify-between px-4 py-2.5 rounded-2xl border text-xs font-bold ${
        parseInt(countdownStr) < 60
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
      U: 'border-zinc-300/40 bg-zinc-100/10 text-zinc-100',
      D: 'border-yellow-400/40 bg-yellow-400/10 text-yellow-300',
      F: 'border-green-400/40 bg-green-400/10 text-green-300',
      B: 'border-blue-400/40 bg-blue-400/10 text-blue-300',
      R: 'border-red-400/40 bg-red-400/10 text-red-300',
      L: 'border-orange-400/40 bg-orange-400/10 text-orange-300',
    };
    return colors[face] ?? 'border-zinc-600/40 bg-zinc-800/40 text-zinc-300';
  };

  return (
    <div className="rounded-2xl border border-orange-500/30 bg-gradient-to-br from-orange-500/5 to-zinc-900/60 p-5 space-y-3">
      <div className="flex items-center gap-2">
        <Shuffle className="h-4 w-4 text-orange-400" />
        <span className="text-xs font-black text-orange-400 uppercase tracking-widest">Your Scramble</span>
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

      <p className="text-[10px] text-zinc-500 leading-relaxed">
        Apply <span className="font-bold text-zinc-400">{moves.length} move{moves.length !== 1 ? 's' : ''}</span> to your cube starting from a <span className="font-bold text-zinc-400">solved state</span>, then scan any 5 faces.
      </p>
    </div>
  );
}

// ------------------------------------------------------------------
// ColorSchemeGuide — Hướng dẫn chuẩn màu sắc 6 mặt khi bắt đầu từ Solved State
// ------------------------------------------------------------------
function ColorSchemeGuide() {
  const scheme = [
    { code: 'U', name: 'Up', colorName: 'Trắng', bg: 'bg-white text-zinc-950 border-zinc-300' },
    { code: 'D', name: 'Down', colorName: 'Vàng', bg: 'bg-yellow-400 text-zinc-950 border-yellow-300' },
    { code: 'F', name: 'Front', colorName: 'Xanh lá', bg: 'bg-emerald-500 text-white border-emerald-400' },
    { code: 'B', name: 'Back', colorName: 'Xanh dương', bg: 'bg-blue-600 text-white border-blue-400' },
    { code: 'R', name: 'Right', colorName: 'Đỏ', bg: 'bg-red-600 text-white border-red-400' },
    { code: 'L', name: 'Left', colorName: 'Cam', bg: 'bg-orange-500 text-white border-orange-400' },
  ];

  return (
    <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-4 space-y-3">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold text-zinc-300 uppercase tracking-wider">
          Quy ước mặt & màu xuất phát (Solved State)
        </span>
        <span className="text-[10px] text-zinc-500">Chuẩn CubeNexus</span>
      </div>

      <div className="grid grid-cols-3 sm:grid-cols-6 gap-2">
        {scheme.map((item) => (
          <div
            key={item.code}
            className="flex flex-col items-center p-2 rounded-xl bg-zinc-950/60 border border-zinc-800/80 text-center space-y-1"
          >
            <div className={`w-6 h-6 rounded-md border font-black text-xs flex items-center justify-center shadow-sm ${item.bg}`}>
              {item.code}
            </div>
            <span className="text-[10px] font-bold text-zinc-200">{item.colorName}</span>
            <span className="text-[9px] text-zinc-500 font-mono">({item.name})</span>
          </div>
        ))}
      </div>
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
        <h2 className="text-3xl font-black text-white uppercase tracking-wider">SCRAMBLE CHECK</h2>
        <p className="text-zinc-400 text-xs sm:text-sm">
          Apply the scramble below to your cube from a <strong className="text-zinc-300">solved state</strong>, then scan any 5 faces for verification.
        </p>

        <button
          onClick={handleSkip}
          disabled={isSkipping}
          className="mt-3 px-4 py-2 bg-zinc-900 border border-zinc-800 hover:bg-zinc-800 hover:text-white text-zinc-400 text-xs font-black rounded-xl uppercase transition-all tracking-wider inline-flex items-center gap-2 cursor-pointer"
        >
          {isSkipping ? 'Skipping...' : 'Dev: Skip Scramble Scan'}
        </button>
      </div>

      <CountdownTimer deadlineIso={state?.setupDeadlineAt ?? null} serverNowIso={state?.serverNow ?? new Date().toISOString()} />

      {/* Scramble Display */}
      {scramble ? (
        <ScrambleDisplay sequence={scramble} />
      ) : (
        <div className="rounded-2xl border border-zinc-800 bg-zinc-900/60 p-5 text-center">
          <p className="text-xs text-zinc-500">Loading scramble...</p>
        </div>
      )}

      {/* Color Scheme Guide */}
      <ColorSchemeGuide />

      <OnlineMatchScanner
        matchId={matchId}
        validationType="SCRAMBLE"
        onSuccess={handleSuccess}
      />

      <div className="text-center">
        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest flex items-center justify-center gap-1.5 animate-pulse">
          <Radio className="h-3.5 w-3.5 text-orange-500" /> Auto-evaluating center color and 3x3 face stability
        </span>
      </div>
    </div>
  );
}
