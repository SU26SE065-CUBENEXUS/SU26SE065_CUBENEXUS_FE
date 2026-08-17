import type { TournamentStatusCode, RegistrationStatusCode } from '@/lib/api/types';

// BE status codes → display label
const STATUS_LABELS: Record<string, string> = {
  // Tournament
  draft: 'Draft',
  published: 'Published',
  registration_open: 'Registration Open',
  registration_closed: 'Reg. Closed',
  checking_in: 'Checking In',
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
  draft: 'bg-slate-100 text-slate-600 border-slate-200',
  published: 'bg-sky-100 text-sky-700 border-sky-200',
  registration_open: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  registration_closed: 'bg-orange-100 text-orange-700 border-orange-200',
  checking_in: 'bg-purple-100 text-purple-700 border-purple-200',
  ongoing: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  completed: 'bg-slate-100 text-slate-600 border-slate-200',
  cancelled: 'bg-red-100 text-red-700 border-red-200',
  // Registration (BE codes)
  pending: 'bg-yellow-100 text-yellow-700 border-yellow-200',
  approved: 'bg-emerald-100 text-emerald-700 border-emerald-200',
  rejected: 'bg-red-100 text-red-700 border-red-200',
  waitlisted: 'bg-purple-100 text-purple-700 border-purple-200',
  checked_in: 'bg-teal-100 text-teal-700 border-teal-200',
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
