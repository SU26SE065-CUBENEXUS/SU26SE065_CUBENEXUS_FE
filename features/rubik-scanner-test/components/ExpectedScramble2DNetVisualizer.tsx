'use client';

import React, { useMemo, useState } from 'react';
import { simulateScramble, COLOR_HEX_MAP, FACE_LABEL_EN } from '../utils/rubikSimulator';
import { Eye, Layers, Info, Grid2X2, RotateCcw } from 'lucide-react';

interface Props {
  scrambleSequence: string;
  className?: string;
}

export function ExpectedScramble2DNetVisualizer({ scrambleSequence, className = '' }: Props) {
  const [selectedFace, setSelectedFace] = useState<'U' | 'D' | 'F' | 'B' | 'R' | 'L' | 'ALL'>('ALL');

  const expectedState = useMemo(() => {
    return simulateScramble(scrambleSequence);
  }, [scrambleSequence]);

  const renderMiniGrid = (faceKey: 'U' | 'D' | 'F' | 'B' | 'R' | 'L') => {
    const grid = expectedState[faceKey];
    const info = FACE_LABEL_EN[faceKey];
    const isSelected = selectedFace === faceKey;

    return (
      <div
        key={faceKey}
        onClick={() => setSelectedFace(isSelected ? 'ALL' : faceKey)}
        className={`p-3 rounded-2xl border transition-all cursor-pointer select-none ${
          isSelected
            ? 'bg-orange-500/10 border-orange-500 shadow-lg shadow-orange-500/10 ring-2 ring-orange-500/30 scale-105 z-10'
            : 'bg-background/80 border-border/80 hover:border-orange-500/40 hover:bg-card/90 shadow-sm'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-2 text-[10px] font-black text-foreground">
          <span className="truncate">{info.label}</span>
          <span className="px-1.5 py-0.5 rounded-md bg-orange-500/10 border border-orange-500/20 text-orange-500 font-mono text-[9px]">
            {faceKey}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1.5 bg-zinc-950 rounded-xl max-w-[110px] mx-auto aspect-square border border-zinc-800 shadow-inner">
          {grid.flatMap((row, rIdx) =>
            row.map((color, cIdx) => (
              <span
                key={`${rIdx}-${cIdx}`}
                className="w-full aspect-square rounded-[3px] border border-black/40 shadow-xs transition-transform duration-150"
                style={{ backgroundColor: COLOR_HEX_MAP[color] || '#4b5563' }}
                title={`${info.label} (${color})`}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className={`rounded-2xl border border-orange-500/20 bg-gradient-to-br from-orange-500/5 via-card to-card p-5 space-y-4 shadow-xl backdrop-blur-md ${className}`}>
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-500 shadow-sm">
            <Grid2X2 className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-black text-orange-500 uppercase tracking-widest flex items-center gap-1.5">
              Expected 2D Rubik Net Visualizer
            </h3>
            <p className="text-[11px] text-muted-foreground leading-normal mt-0.5">
              Target face layout resulting from official scramble (WCA unfolded net view).
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[10px] font-bold text-muted-foreground bg-background/60 border border-border/80 px-2.5 py-1 rounded-full">
          <Info className="h-3 w-3 text-orange-500" /> Click face to inspect
        </div>
      </div>

      {/* 2D UNFOLDED CUBE NET: WCA Standard Layout */}
      <div className="py-2">
        <div className="max-w-md mx-auto space-y-2">
          {/* Top Face: U */}
          <div className="w-1/4 mx-auto">
            {renderMiniGrid('U')}
          </div>

          {/* Middle Row: L - F - R - B */}
          <div className="grid grid-cols-4 gap-2">
            {renderMiniGrid('L')}
            {renderMiniGrid('F')}
            {renderMiniGrid('R')}
            {renderMiniGrid('B')}
          </div>

          {/* Bottom Face: D */}
          <div className="w-1/4 mx-auto">
            {renderMiniGrid('D')}
          </div>
        </div>
      </div>

      {/* DETAILED ZOOM VIEW FOR SELECTED FACE */}
      {selectedFace !== 'ALL' && (
        <div className="p-4 rounded-2xl bg-background/90 border border-orange-500/30 space-y-3 shadow-2xl animate-fade-in">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-foreground">
              <Eye className="h-4 w-4 text-orange-500" /> Detailed Face View: <strong className="text-orange-500">{FACE_LABEL_EN[selectedFace].label}</strong>
            </span>
            <button
              onClick={() => setSelectedFace('ALL')}
              className="text-[10px] font-black uppercase tracking-wider bg-orange-500/10 hover:bg-orange-500/20 text-orange-500 border border-orange-500/20 px-3 py-1.5 rounded-xl transition flex items-center gap-1 cursor-pointer"
            >
              <RotateCcw className="h-3 w-3" /> Back to 2D Net
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2.5 max-w-[200px] mx-auto p-3 bg-zinc-950 rounded-2xl border border-zinc-800 shadow-2xl">
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

