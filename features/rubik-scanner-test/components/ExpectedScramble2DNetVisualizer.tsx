'use client';

import { useMemo, useState } from 'react';
import { simulateScramble, COLOR_HEX_MAP, FACE_LABEL_EN, CubeFaceState } from '../utils/rubikSimulator';
import { Eye, Layers, Info } from 'lucide-react';

interface Props {
  scrambleSequence: string;
}

export function ExpectedScramble2DNetVisualizer({ scrambleSequence }: Props) {
  const [selectedFace, setSelectedFace] = useState<'U' | 'D' | 'F' | 'B' | 'R' | 'L' | 'ALL'>('ALL');

  const expectedState = useMemo(() => {
    return simulateScramble(scrambleSequence);
  }, [scrambleSequence]);

  const renderMiniGrid = (faceKey: 'U' | 'D' | 'F' | 'B' | 'R' | 'L', size: 'sm' | 'md' = 'sm') => {
    const grid = expectedState[faceKey];
    const info = FACE_LABEL_EN[faceKey];
    const isSelected = selectedFace === faceKey;

    return (
      <div
        key={faceKey}
        onClick={() => setSelectedFace(isSelected ? 'ALL' : faceKey)}
        className={`p-2.5 rounded-2xl border transition-all cursor-pointer ${
          isSelected
            ? 'bg-indigo-50/90 border-indigo-500 shadow-md ring-2 ring-indigo-500/20'
            : 'bg-white border-slate-200 hover:border-indigo-300 hover:bg-slate-50'
        }`}
      >
        <div className="flex items-center justify-between gap-1 mb-1.5 text-[10px] font-extrabold text-slate-700">
          <span className="truncate">{info.label}</span>
          <span className="px-1.5 py-0.2 rounded bg-slate-100 border text-slate-600 font-mono">
            {faceKey}
          </span>
        </div>

        <div className="grid grid-cols-3 gap-1 p-1 bg-slate-900 rounded-xl max-w-[120px] mx-auto aspect-square shadow-inner">
          {grid.flatMap((row, rIdx) =>
            row.map((color, cIdx) => (
              <span
                key={`${rIdx}-${cIdx}`}
                className="w-full aspect-square rounded-[2px] border border-black/30 shadow-2xs"
                style={{ backgroundColor: COLOR_HEX_MAP[color] || '#4b5563' }}
              />
            ))
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="space-y-4 rounded-3xl border border-indigo-100 bg-gradient-to-br from-indigo-50/30 via-white to-slate-50 p-5 shadow-sm">
      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-100 text-indigo-700">
            <Layers className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-black text-slate-900 flex items-center gap-1.5">
              Expected Rubik Pattern After Scramble (2D Net)
            </h3>
            <p className="text-[11px] text-slate-500">
              Compare your physical Rubik's cube with the 2D model below before scanning.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1 text-[11px] font-bold text-slate-500">
          <Info className="h-3.5 w-3.5 text-indigo-500" /> Click any face to zoom in
        </div>
      </div>

      {/* 2D NET LAYOUT: Standard WCA Unfolded Cube Net */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
        {/* Top Face: U */}
        <div className="col-span-1 md:col-start-2">
          {renderMiniGrid('U')}
        </div>

        {/* Middle Row: L - F - R - B */}
        <div className="col-span-1 md:col-span-3 grid grid-cols-2 sm:grid-cols-4 gap-2.5">
          {renderMiniGrid('L')}
          {renderMiniGrid('F')}
          {renderMiniGrid('R')}
          {renderMiniGrid('B')}
        </div>

        {/* Bottom Face: D */}
        <div className="col-span-1 md:col-start-2">
          {renderMiniGrid('D')}
        </div>
      </div>

      {/* DETAILED VIEW FOR SELECTED FACE */}
      {selectedFace !== 'ALL' && (
        <div className="p-4 rounded-2xl bg-indigo-900 text-white space-y-3 shadow-lg border border-indigo-800">
          <div className="flex items-center justify-between text-xs font-bold">
            <span className="flex items-center gap-1.5 text-indigo-200">
              <Eye className="h-4 w-4 text-amber-400" /> Details of {FACE_LABEL_EN[selectedFace].label}
            </span>
            <button
              onClick={() => setSelectedFace('ALL')}
              className="text-[10px] bg-indigo-800 hover:bg-indigo-700 text-indigo-200 px-2.5 py-1 rounded-lg transition"
            >
              Zoom back to 2D Net
            </button>
          </div>

          <div className="grid grid-cols-3 gap-2 max-w-[180px] mx-auto p-2 bg-slate-950 rounded-2xl border border-indigo-700/60 shadow-2xl">
            {expectedState[selectedFace].flatMap((row, rIdx) =>
              row.map((color, cIdx) => (
                <div key={`${rIdx}-${cIdx}`} className="space-y-1 text-center">
                  <span
                    className="block w-full aspect-square rounded-lg border border-black/40 shadow-sm"
                    style={{ backgroundColor: COLOR_HEX_MAP[color] || '#4b5563' }}
                  />
                  <span className="text-[9px] font-mono text-indigo-300 capitalize">{color}</span>
                </div>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
