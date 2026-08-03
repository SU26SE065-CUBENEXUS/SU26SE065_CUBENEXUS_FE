import React from 'react';
import { LucideIcon } from 'lucide-react';

interface DashboardCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon?: LucideIcon;
  accent?: 'yellow' | 'emerald' | 'blue' | 'red' | 'purple' | 'slate';
  className?: string;
}

const accentStyles = {
  yellow: {
    value: 'text-amber-600',
  },
  emerald: {
    value: 'text-emerald-600',
  },
  blue: {
    value: 'text-indigo-600',
  },
  red: {
    value: 'text-red-600',
  },
  purple: {
    value: 'text-purple-600',
  },
  slate: {
    value: 'text-slate-900',
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
    <div className={`rounded-xl border border-slate-200 bg-white p-5 shadow-2xs hover:border-slate-300 transition-all ${className}`}>
      <div className="flex items-start justify-between gap-4">
        <div className="min-w-0 flex-1">
          <p className="text-[11px] font-bold uppercase tracking-wider text-slate-400">{title}</p>
          <p className={`mt-1.5 text-2xl font-bold tracking-tight ${styles.value}`}>{value}</p>
          {subtitle && <p className="mt-0.5 text-xs text-slate-500 font-medium">{subtitle}</p>}
        </div>
        {Icon && (
          <div className="flex-shrink-0 flex h-8 w-8 items-center justify-center rounded-lg bg-slate-50 border border-slate-200 text-slate-500">
            <Icon className="h-4 w-4" />
          </div>
        )}
      </div>
    </div>
  );
}
