'use client';

interface TimerDisplayProps {
  ms: number | null | undefined;
  isDnf?: boolean;
  size?: 'sm' | 'md' | 'lg' | 'xl';
  className?: string;
  showMs?: boolean;
}

export function formatMs(ms: number | null | undefined, showMs = true): string {
  if (ms === null || ms === undefined) return '—';
  if (ms <= 0) return '0.000';
  const totalSeconds = ms / 1000;
  if (totalSeconds >= 60) {
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = (totalSeconds % 60).toFixed(showMs ? 3 : 2);
    return `${minutes}:${seconds.padStart(showMs ? 6 : 5, '0')}`;
  }
  return showMs ? totalSeconds.toFixed(3) : totalSeconds.toFixed(2);
}

export function TimerDisplay({ ms, isDnf = false, size = 'md', className = '', showMs = true }: TimerDisplayProps) {
  const sizeClasses = {
    sm: 'text-lg',
    md: 'text-2xl',
    lg: 'text-4xl',
    xl: 'text-6xl',
  }[size];

  if (isDnf) {
    return (
      <span className={`time-display font-black ${sizeClasses} text-red-400 ${className}`}>
        DNF
      </span>
    );
  }

  return (
    <span className={`time-display font-black ${sizeClasses} ${className}`}>
      {formatMs(ms, showMs)}
      <span className="text-muted-foreground font-normal ml-0.5" style={{ fontSize: '0.4em' }}>s</span>
    </span>
  );
}
