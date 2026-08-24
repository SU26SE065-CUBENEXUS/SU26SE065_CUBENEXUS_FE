'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Loader2 } from 'lucide-react';
import type { AdminUserDto } from '@/features/admin/api/adminUserApi';

interface BanUserModalProps {
  isOpen: boolean;
  user: AdminUserDto | null;
  onClose: () => void;
  onConfirm: (durationDays: number | undefined, banReason: string) => Promise<void>;
}

const DURATION_OPTIONS = [
  { label: '1 Day', value: 1 },
  { label: '7 Days', value: 7 },
  { label: '30 Days (1 Month)', value: 30 },
  { label: '90 Days (3 Months)', value: 90 },
  { label: 'Permanent Ban', value: 0 },
];

export function BanUserModal({ isOpen, user, onClose, onConfirm }: BanUserModalProps) {
  const [durationDays, setDurationDays] = useState<number>(7);
  const [banReason, setBanReason] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!banReason.trim()) {
      setError('Please provide a reason for the ban.');
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(durationDays > 0 ? durationDays : undefined, banReason.trim());
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Unable to ban this account.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-md rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 animate-in zoom-in-95 duration-200">
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-rose-50 border border-rose-100 rounded-xl text-rose-600 shrink-0">
              <ShieldAlert className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Ban User Account</h3>
              <p className="text-xs text-slate-500">Restrict this account from accessing the system</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition disabled:opacity-50 cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* User preview */}
        <div className="rounded-xl border border-slate-200 bg-slate-50 p-3.5 flex items-center gap-3">
          <div className="h-9 w-9 rounded-full bg-slate-200 flex items-center justify-center text-slate-700 font-bold text-xs shrink-0 overflow-hidden">
            {user.avatarUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              user.displayName?.charAt(0)?.toUpperCase() ?? 'U'
            )}
          </div>
          <div className="min-w-0 flex-1">
            <p className="text-xs font-extrabold text-slate-900 truncate">{user.displayName}</p>
            <p className="text-[11px] text-slate-500 truncate">{user.email}</p>
          </div>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          {error && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-800 font-medium">
              {error}
            </div>
          )}

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">Ban Duration</label>
            <div className="grid grid-cols-2 gap-2">
              {DURATION_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => setDurationDays(opt.value)}
                  className={`px-3 py-2 rounded-xl text-xs font-semibold border transition text-left cursor-pointer ${
                    durationDays === opt.value
                      ? 'border-rose-600 bg-rose-50 text-rose-700 font-bold shadow-2xs'
                      : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50'
                  }`}
                >
                  {opt.label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-xs font-bold text-slate-700 mb-1.5">
              Ban Reason <span className="text-rose-500">*</span>
            </label>
            <textarea
              rows={3}
              value={banReason}
              onChange={(e) => setBanReason(e.target.value)}
              placeholder="Describe the violation (for example, using cheating software during a tournament)..."
              className="w-full rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs text-slate-900 outline-none focus:border-rose-600 focus:bg-white transition resize-none"
            />
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Confirm Ban
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
