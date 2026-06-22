import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: LucideIcon;
  accent?: 'yellow' | 'emerald' | 'blue' | 'red' | 'purple' | 'slate';
  className?: string;
}

const accentStyles = {
  yellow: {
    bg: 'bg-card border-yellow-500/20 shadow-sm',
    icon: 'bg-yellow-500/10 text-yellow-600 dark:text-yellow-400 border-yellow-500/20',
    value: 'text-yellow-600 dark:text-yellow-400',
  },
  emerald: {
    bg: 'bg-card border-emerald-500/20 shadow-sm',
    icon: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20',
    value: 'text-emerald-600 dark:text-emerald-400',
  },
  blue: {
    bg: 'bg-card border-blue-500/20 shadow-sm',
    icon: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20',
    value: 'text-blue-600 dark:text-blue-400',
  },
  red: {
    bg: 'bg-card border-red-500/20 shadow-sm',
    icon: 'bg-red-500/10 text-red-600 dark:text-red-400 border-red-500/20',
    value: 'text-red-600 dark:text-red-400',
  },
  purple: {
    bg: 'bg-card border-purple-500/20 shadow-sm',
    icon: 'bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-500/20',
    value: 'text-purple-700 dark:text-purple-300',
  },
  slate: {
    bg: 'bg-card border-border shadow-sm',
    icon: 'bg-muted text-muted-foreground border-border',
    value: 'text-foreground',
  },
};

export function DashboardCard({
  title,
  value,
  subtitle,
  icon: Icon,
  accent = 'slate',
  className = '',
}: DashboardCardProps) {
  const styles = accentStyles[accent];

  return (
    <div className={`rounded-2xl border p-5 transition-all hover:shadow-md ${styles.bg} ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">{title}</p>
          <p className={`mt-1.5 text-2xl font-black tracking-tight ${styles.value}`}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-muted-foreground font-medium">{subtitle}</p>}
        </div>
        <div className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl border ${styles.icon}`}>
          <Icon className="h-5 w-5" />
        </div>
      </div>
    </div>
  );
}
