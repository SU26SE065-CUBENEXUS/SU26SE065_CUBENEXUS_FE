'use client';

import { Copy, Check } from 'lucide-react';
import { useState } from 'react';

interface ScrambleDisplayProps {
  sequence: string;
  solveNumber?: number;
  compact?: boolean;
  className?: string;
}

export function ScrambleDisplay({ sequence, solveNumber, compact = false, className = '' }: ScrambleDisplayProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(sequence);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  if (!sequence) {
    return (
      <div className={`scramble-code opacity-40 italic ${className}`}>
        No scramble generated
      </div>
    );
  }

  return (
    <div className={`relative group ${className}`}>
      {solveNumber !== undefined && (
        <div className="flex items-center gap-2 mb-1.5">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-foreground">
            Solve #{solveNumber} Scramble
          </span>
        </div>
      )}
      <div className="relative">
        <code className={`scramble-code block ${compact ? 'text-[11px] py-2 px-3' : ''}`}>
          {sequence}
        </code>
        <button
          onClick={handleCopy}
          className="absolute top-1.5 right-1.5 opacity-0 group-hover:opacity-100 transition-opacity p-1 rounded bg-border/50 hover:bg-border text-muted-foreground hover:text-foreground"
          title="Copy scramble"
        >
          {copied ? <Check className="h-3 w-3 text-green-400" /> : <Copy className="h-3 w-3" />}
        </button>
      </div>
    </div>
  );
}
