'use client';

import React from 'react';
import { X, User, Mail, Phone, MapPin, Shield, Calendar, AlertTriangle, CheckCircle2, Clock } from 'lucide-react';
import type { AdminUserDto } from '@/features/admin/api/adminUserApi';

interface UserDetailModalProps {
  isOpen: boolean;
  user: AdminUserDto | null;
  onClose: () => void;
}

export function UserDetailModal({ isOpen, user, onClose }: UserDetailModalProps) {
  if (!isOpen || !user) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('en-US', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getRoleBadgeStyle = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return 'bg-purple-100 text-purple-700 border-purple-200';
      case 'MANAGER':
        return 'bg-indigo-100 text-indigo-700 border-indigo-200';
      case 'JUDGE':
        return 'bg-amber-100 text-amber-700 border-amber-200';
      default:
        return 'bg-slate-100 text-slate-700 border-slate-200';
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-lg rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-start justify-between border-b border-slate-100 pb-4">
          <div className="flex items-center gap-3">
            <div className="flex h-12 w-12 items-center justify-center rounded-full bg-indigo-600 text-white font-extrabold text-lg shadow-md shrink-0 overflow-hidden">
              {user.avatarUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
              ) : (
                user.displayName?.charAt(0)?.toUpperCase() ?? 'U'
              )}
            </div>
            <div>
              <h3 className="text-lg font-extrabold text-slate-900 leading-snug">{user.displayName}</h3>
              <div className="flex items-center gap-2 mt-0.5">
                <span className="text-xs text-slate-500 font-sans font-medium">ID: {user.userCode || user.id.slice(0, 8)}</span>
                <span className={`inline-block rounded-full border px-2 py-0.5 text-[10px] font-bold tracking-wide uppercase ${getRoleBadgeStyle(user.userRole)}`}>
                  {user.userRole}
                </span>
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Alert Banner */}
        {user.isBanned ? (
          <div className="rounded-xl border border-rose-200 bg-rose-50 p-4 space-y-1.5 text-rose-900">
            <div className="flex items-center gap-2 font-bold text-xs">
              <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>Account is currently banned</span>
            </div>
            <p className="text-xs text-rose-700">
              <span className="font-semibold">Reason:</span> {user.banReason || 'Not specified'}
            </p>
            <div className="flex items-center gap-4 text-[11px] text-rose-600 font-medium pt-1">
              <span>Started: {formatDate(user.bannedAt)}</span>
              <span>Expires: {user.bannedUntil ? formatDate(user.bannedUntil) : 'Permanent'}</span>
            </div>
          </div>
        ) : (
          <div className="flex items-center gap-2 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2.5 text-xs text-emerald-800 font-semibold">
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
            <span>Account is active</span>
          </div>
        )}

        {/* User Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Mail className="h-3 w-3 text-slate-400" /> Email
            </p>
            <p className="font-semibold text-slate-800 break-all">{user.email}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Phone className="h-3 w-3 text-slate-400" /> Phone Number
            </p>
            <p className="font-semibold text-slate-800">{user.phone || 'Not provided'}</p>
          </div>

          <div className="sm:col-span-2 rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" /> Address
            </p>
            <p className="font-semibold text-slate-800">{user.address || 'Not provided'}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" /> Joined On
            </p>
            <p className="font-semibold text-slate-800">{formatDate(user.createdAt)}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Clock className="h-3 w-3 text-slate-400" /> Last Updated
            </p>
            <p className="font-semibold text-slate-800">{formatDate(user.updatedAt)}</p>
          </div>
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
