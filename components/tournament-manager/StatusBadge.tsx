import type { TournamentStatusCode, RegistrationStatusCode } from '@/lib/api/types';

// BE status codes → display label
const STATUS_LABELS: Record<string, string> = {
  // Tournament
  draft: 'Draft',
  published: 'Published',
  registration_open: 'Registration Open',
  registration_closed: 'Reg. Closed',
  ongoing: 'In Progress',
  completed: 'Completed',
  cancelled: 'Cancelled',
  // Registration
  pending: 'Pending',
  approved: 'Approved',
  rejected: 'Rejected',
  waitlisted: 'Waitlisted',
  checked_in: 'Checked In',
  // Generic / legacy
  'In Progress': 'In Progress',
  'Registration Open': 'Registration Open',
  'Upcoming': 'Upcoming',
  'Completed': 'Completed',
  'Cancelled': 'Cancelled',
  'Approved': 'Approved',
  'Pending': 'Pending',
  'Rejected': 'Rejected',
  'Waitlisted': 'Waitlisted',
  'Confirmed': 'Confirmed',
  'Assigned': 'Assigned',
  'Unassigned': 'Unassigned',
  'Open': 'Open',
  'Under Review': 'Under Review',
  'Resolved': 'Resolved',
  'Escalated': 'Escalated',
  'Active': 'Active',
  'Idle': 'Idle',
  'Paused': 'Paused',
  'Generated': 'Generated',
  'Not Generated': 'Not Generated',
  'Scanned': 'Scanned',
  'Not Started': 'Not Started',
};

const VARIANT_STYLES: Record<string, string> = {
  // Tournament (BE codes)
  draft: 'bg-slate-100 text-slate-700 border-slate-200 dark:bg-slate-500/10 dark:text-slate-400 dark:border-slate-500/25',
  published: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
  registration_open: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
  registration_closed: 'bg-orange-50 text-orange-700 border-orange-200 dark:bg-orange-500/10 dark:text-orange-400 dark:border-orange-500/25',
  ongoing: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
  completed: 'bg-blue-100 text-blue-700 border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/25',
  cancelled: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25',
  // Registration (BE codes)
  pending: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-500/10 dark:text-amber-400 dark:border-amber-500/25',
  approved: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-500/10 dark:text-emerald-400 dark:border-emerald-500/25',
  rejected: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-500/10 dark:text-rose-400 dark:border-rose-500/25',
  waitlisted: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-500/10 dark:text-purple-400 dark:border-purple-500/25',
  checked_in: 'bg-cyan-50 text-cyan-700 border-cyan-200 dark:bg-cyan-500/10 dark:text-cyan-400 dark:border-cyan-500/25',
  // Legacy display strings
  'In Progress': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Registration Open': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Upcoming': 'bg-sky-100 text-sky-700 border-sky-200',
  'Completed': 'bg-slate-100 text-slate-600 border-slate-200',
  'Cancelled': 'bg-red-100 text-red-700 border-red-200',
  'Approved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Pending': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Rejected': 'bg-red-100 text-red-700 border-red-200',
  'Waitlisted': 'bg-purple-100 text-purple-700 border-purple-200',
  'Confirmed': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Assigned': 'bg-blue-100 text-blue-700 border-blue-200',
  'Unassigned': 'bg-red-100 text-red-700 border-red-200',
  'Open': 'bg-red-100 text-red-700 border-red-200',
  'Under Review': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Resolved': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Escalated': 'bg-orange-100 text-orange-700 border-orange-200',
  'Active': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Idle': 'bg-slate-100 text-slate-600 border-slate-200',
  'Paused': 'bg-yellow-100 text-yellow-700 border-yellow-200',
  'Generated': 'bg-blue-100 text-blue-700 border-blue-200',
  'Not Generated': 'bg-slate-100 text-slate-500 border-slate-200',
  'Scanned': 'bg-emerald-100 text-emerald-700 border-emerald-200',
  'Not Started': 'bg-slate-100 text-slate-500 border-slate-200',
  default: 'bg-slate-100 text-slate-600 border-slate-200',
};

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export function StatusBadge({ status, className = '' }: StatusBadgeProps) {
  const normalized = (status || '').toLowerCase();
  const style = VARIANT_STYLES[normalized] ?? VARIANT_STYLES['default'];
  const label = STATUS_LABELS[normalized] ?? status;
  return (
    <span
      className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[11px] font-semibold tracking-wide ${style} ${className}`}
    >
      {label}
    </span>
  );
}
