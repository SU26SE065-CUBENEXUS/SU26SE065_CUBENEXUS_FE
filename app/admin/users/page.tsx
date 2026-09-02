'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  RefreshCw,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Eye,
  ChevronLeft,
  ChevronRight,
  UserX,
  UserCheck,
  Loader2,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';
import {
  getAdminUsers,
  updateUserRole,
  banUser,
  unbanUser,
  type AdminUserDto,
} from '@/features/admin/api/adminUserApi';
import { UserDetailModal } from '@/components/admin/UserDetailModal';
import { BanUserModal } from '@/components/admin/BanUserModal';
import { ChangeRoleModal } from '@/components/admin/ChangeRoleModal';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<AdminUserDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Loading & Toast
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Modals state
  const [selectedUserDetail, setSelectedUserDetail] = useState<AdminUserDto | null>(null);
  const [userToBan, setUserToBan] = useState<AdminUserDto | null>(null);
  const [userToChangeRole, setUserToChangeRole] = useState<AdminUserDto | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminUsers({
        page,
        pageSize,
        search: searchTerm.trim() || undefined,
        role: roleFilter !== 'ALL' ? roleFilter : undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setUsers(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to load users.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, roleFilter, statusFilter]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  // Handlers
  const handleRoleChangeConfirm = async (newRole: string) => {
    if (!userToChangeRole) return;
    try {
      const updated = await updateUserRole(userToChangeRole.id, newRole);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast('success', `${updated.displayName}'s role was updated to ${updated.userRole}.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to change the user role.');
      throw err;
    }
  };

  const handleBanConfirm = async (durationDays: number | undefined, banReason: string) => {
    if (!userToBan) return;
    try {
      const updated = await banUser(userToBan.id, banReason, durationDays);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      const untilText = updated.bannedUntil
        ? `until ${new Date(updated.bannedUntil).toLocaleDateString('en-US')}`
        : 'permanently';
      showToast('success', `${updated.displayName}'s account was banned ${untilText}.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to ban the account.');
      throw err;
    }
  };

  const handleUnban = async (user: AdminUserDto) => {
    if (!window.confirm(`Are you sure you want to unban "${user.displayName}"?`)) return;
    setActionLoadingId(user.id);
    try {
      const updated = await unbanUser(user.id);
      setUsers((prev) => prev.map((u) => (u.id === updated.id ? updated : u)));
      showToast('success', `${updated.displayName}'s account was unbanned.`);
    } catch (err: any) {
      showToast('error', err?.message || 'Unable to unban the account.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getRoleBadge = (role: string) => {
    switch (role.toUpperCase()) {
      case 'ADMIN':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 border border-purple-200">ADMIN</span>;
      case 'MANAGER':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">MANAGER</span>;
      case 'JUDGE':
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 border border-amber-200">JUDGE</span>;
      default:
        return <span className="px-2 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">COMPETITOR</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-in slide-in-from-top-2 duration-300 ${
            toastMessage.type === 'success'
              ? 'bg-emerald-50 text-emerald-900 border-emerald-200'
              : 'bg-rose-50 text-rose-900 border-rose-200'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
          ) : (
            <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
            <Users className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">User Management</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Manage system accounts, roles, and time-limited or permanent bans.
            </p>
            <p className="mt-1 text-[11px] font-medium text-indigo-600">
              Select “Match history” on a competitor row to review their Online Arena records.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchUsers()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
             Refresh
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[220px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Search by name, email, or user code..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        {/* Role Filter */}
        <div className="flex items-center gap-2">
          <select
            value={roleFilter}
            onChange={(e) => {
              setRoleFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer focus:border-indigo-600 focus:bg-white transition"
          >
            <option value="ALL">All Roles</option>
            <option value="ADMIN">Role ADMIN</option>
            <option value="MANAGER">Role MANAGER</option>
            <option value="JUDGE">Role JUDGE</option>
            <option value="COMPETITOR">Role COMPETITOR</option>
          </select>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => {
              setStatusFilter(e.target.value);
              setPage(1);
            }}
            className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer focus:border-indigo-600 focus:bg-white transition"
          >
            <option value="ALL">All Statuses</option>
            <option value="active">Active</option>
            <option value="banned">Banned</option>
          </select>
        </div>
      </div>

      {/* Users Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">User</th>
                <th className="py-3.5 px-4">Contact</th>
                <th className="py-3.5 px-4">Role</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4">Joined On</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-indigo-600" />
                    <span>Loading users...</span>
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <UserX className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p className="font-semibold">No matching users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => {
                  const isActionLoading = actionLoadingId === user.id;
                  return (
                    <tr key={user.id} className="hover:bg-slate-50/60 transition">
                      {/* User Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-slate-700 font-extrabold text-xs shrink-0 overflow-hidden">
                            {user.avatarUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                            ) : (
                              user.displayName?.charAt(0)?.toUpperCase() ?? 'U'
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{user.displayName}</p>
                            <p className="text-[11px] text-slate-400 font-sans font-medium">ID: {user.userCode || user.id.slice(0, 8)}</p>
                          </div>
                        </div>
                      </td>

                      {/* Contact */}
                      <td className="py-3.5 px-4">
                        <p className="font-semibold text-slate-800">{user.email}</p>
                        <p className="text-[11px] text-slate-400">{user.phone || 'No phone number'}</p>
                      </td>

                      {/* Role */}
                      <td className="py-3.5 px-4">{getRoleBadge(user.userRole)}</td>

                      {/* Status */}
                      <td className="py-3.5 px-4">
                        {user.isBanned ? (
                          <div className="flex flex-col gap-0.5">
                            <span className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-full w-fit">
                              <ShieldAlert className="h-3 w-3" /> Banned
                            </span>
                            {user.bannedUntil && (
                              <span className="text-[10px] text-rose-500 font-medium">
                                Until: {new Date(user.bannedUntil).toLocaleDateString('en-US')}
                              </span>
                            )}
                          </div>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-bold text-emerald-600 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full w-fit">
                            <ShieldCheck className="h-3 w-3" /> Active
                          </span>
                        )}
                      </td>

                      {/* Joined Date */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium">
                        {new Date(user.createdAt).toLocaleDateString('en-US')}
                      </td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedUserDetail(user)}
                            title={user.userRole.toUpperCase() === 'COMPETITOR' ? 'View competitor match history' : 'View user details'}
                            className="inline-flex items-center gap-1.5 rounded-lg border border-indigo-100 bg-indigo-50 px-2.5 py-1.5 text-[11px] font-bold text-indigo-700 transition hover:border-indigo-200 hover:bg-indigo-100 cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                            <span>{user.userRole.toUpperCase() === 'COMPETITOR' ? 'Match history' : 'Details'}</span>
                          </button>

                          {/* Change Role */}
                          <button
                            onClick={() => setUserToChangeRole(user)}
                            title="Change user role"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-purple-600 hover:bg-purple-50 border border-transparent hover:border-purple-100 transition cursor-pointer"
                          >
                            <Shield className="h-4 w-4" />
                          </button>

                          {/* Ban / Unban */}
                          {user.isBanned ? (
                            <button
                              onClick={() => handleUnban(user)}
                              disabled={isActionLoading}
                              title="Unban account"
                              className="p-1.5 rounded-lg text-emerald-600 hover:bg-emerald-50 border border-transparent hover:border-emerald-100 transition cursor-pointer disabled:opacity-50"
                            >
                              {isActionLoading ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserCheck className="h-4 w-4" />}
                            </button>
                          ) : (
                            <button
                              onClick={() => setUserToBan(user)}
                              title="Ban account"
                              className="p-1.5 rounded-lg text-rose-500 hover:text-rose-700 hover:bg-rose-50 border border-transparent hover:border-rose-100 transition cursor-pointer"
                            >
                              <ShieldAlert className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="flex items-center justify-between px-4 py-3 border-t border-slate-200 bg-slate-50/50 text-xs">
          <p className="text-slate-500 font-medium">
            Showing <span className="font-bold text-slate-900">{users.length}</span> of{' '}
            <span className="font-bold text-slate-900">{totalCount}</span> users
          </p>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1 || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronLeft className="h-4 w-4" />
            </button>
            <span className="font-bold text-slate-800">
              {page} / {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages || isLoading}
              className="p-1.5 rounded-lg border border-slate-200 bg-white text-slate-700 hover:bg-slate-50 disabled:opacity-40 cursor-pointer shadow-2xs"
            >
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Modals */}
      <UserDetailModal
        isOpen={!!selectedUserDetail}
        user={selectedUserDetail}
        onClose={() => setSelectedUserDetail(null)}
      />

      <BanUserModal
        isOpen={!!userToBan}
        user={userToBan}
        onClose={() => setUserToBan(null)}
        onConfirm={handleBanConfirm}
      />

      <ChangeRoleModal
        isOpen={!!userToChangeRole}
        user={userToChangeRole}
        onClose={() => setUserToChangeRole(null)}
        onConfirm={handleRoleChangeConfirm}
      />
    </div>
  );
}
