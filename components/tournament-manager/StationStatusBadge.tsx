'use client';

export type StationState =
  | 'EMPTY'
  | 'VERIFIED'
  | 'INSPECTING'
  | 'SOLVING'
  | 'SUBMITTING'
  | 'DONE'
  | 'LOCKED';

interface StationStatusBadgeProps {
  state: StationState;
  size?: 'sm' | 'md' | 'lg';
  showDot?: boolean;
}

const STATE_CONFIG: Record<StationState, { label: string; dotColor: string; textColor: string; bg: string; border: string }> = {
  EMPTY:      { label: 'Empty',      dotColor: 'bg-muted-foreground', textColor: 'text-muted-foreground', bg: 'bg-muted/20',        border: 'border-border/50' },
  VERIFIED:   { label: 'Verified',   dotColor: 'bg-blue-400',         textColor: 'text-blue-400',          bg: 'bg-blue-400/8',      border: 'border-blue-400/30' },
  INSPECTING: { label: 'Inspecting', dotColor: 'bg-amber-400',        textColor: 'text-amber-400',         bg: 'bg-amber-400/8',     border: 'border-amber-400/30' },
  SOLVING:    { label: 'Solving',    dotColor: 'bg-orange-400',       textColor: 'text-orange-400',        bg: 'bg-orange-400/8',    border: 'border-orange-400/30' },
  SUBMITTING: { label: 'Submitting', dotColor: 'bg-purple-400',       textColor: 'text-purple-400',        bg: 'bg-purple-400/8',    border: 'border-purple-400/30' },
  DONE:       { label: 'Done',       dotColor: 'bg-emerald-400',      textColor: 'text-emerald-400',       bg: 'bg-emerald-400/8',   border: 'border-emerald-400/30' },
  LOCKED:     { label: 'Locked',     dotColor: 'bg-red-400',          textColor: 'text-red-400',           bg: 'bg-red-400/8',       border: 'border-red-400/30' },
};

export function StationStatusBadge({ state, size = 'md', showDot = true }: StationStatusBadgeProps) {
  const cfg = STATE_CONFIG[state] ?? STATE_CONFIG.EMPTY;
  const isAnimated = state === 'SOLVING' || state === 'INSPECTING';

  const sizeClasses = {
    sm: 'text-[9px] px-1.5 py-0.5 gap-1',
    md: 'text-[10px] px-2 py-0.5 gap-1.5',
    lg: 'text-xs px-2.5 py-1 gap-1.5',
  }[size];

  return (
    <span
      className={`inline-flex items-center rounded-full font-bold uppercase tracking-wider border ${cfg.bg} ${cfg.border} ${cfg.textColor} ${sizeClasses}`}
    >
      {showDot && (
        <span
          className={`inline-block rounded-full flex-shrink-0 ${cfg.dotColor} ${
            size === 'sm' ? 'w-1.5 h-1.5' : 'w-2 h-2'
          } ${isAnimated ? 'animate-pulse' : ''}`}
        />
      )}
      {cfg.label}
    </span>
  );
}
