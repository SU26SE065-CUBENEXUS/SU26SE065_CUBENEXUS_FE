'use client';

import React, { useState } from 'react';
import { X, Shield, Loader2, AlertCircle } from 'lucide-react';
import type { AdminUserDto } from '@/features/admin/api/adminUserApi';

interface ChangeRoleModalProps {
  isOpen: boolean;
  user: AdminUserDto | null;
  onClose: () => void;
  onConfirm: (newRole: string) => Promise<void>;
}

const ROLES = [
  {
    role: 'ADMIN',
    label: 'System Administrator (ADMIN)',
    color: 'bg-purple-50 text-purple-700 border-purple-200',
    desc: 'Toàn quyền quản trị hệ thống, quản lý người dùng, Anti-Cheat, ELO và giải đấu.',
  },
  {
    role: 'MANAGER',
    label: 'Tournament Manager (MANAGER)',
    color: 'bg-indigo-50 text-indigo-700 border-indigo-200',
    desc: 'Quản lý tạo và vận hành giải đấu, kiểm soát đăng ký, nhóm đấu và trọng tài.',
  },
  {
    role: 'JUDGE',
    label: 'Tournament Judge (JUDGE)',
    color: 'bg-amber-50 text-amber-700 border-amber-200',
    desc: 'Nhập điểm, xác nhận kết quả lượt giải trực tiếp tại các thảm đấu.',
  },
  {
    role: 'COMPETITOR',
    label: 'Competitor (COMPETITOR)',
    color: 'bg-slate-50 text-slate-700 border-slate-200',
    desc: 'Thành viên/Thí sinh tham gia giải đấu và phòng đấu Online Arena.',
  },
];

export function ChangeRoleModal({ isOpen, user, onClose, onConfirm }: ChangeRoleModalProps) {
  const [selectedRole, setSelectedRole] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  React.useEffect(() => {
    if (user) {
      setSelectedRole(user.userRole.toUpperCase());
    }
  }, [user]);

  if (!isOpen || !user) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedRole) return;
    if (selectedRole === user.userRole.toUpperCase()) {
      onClose();
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      await onConfirm(selectedRole);
      onClose();
    } catch (err: any) {
      setError(err?.message || 'Có lỗi xảy ra khi cập nhật vai trò người dùng.');
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
            <div className="p-2 bg-indigo-50 border border-indigo-100 rounded-xl text-indigo-600 shrink-0">
              <Shield className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900 leading-snug">Thay Đổi Vai Trò (Role)</h3>
              <p className="text-xs text-slate-500">Nâng cấp hoặc hạ cấp quyền hạn người dùng</p>
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

        {/* User summary */}
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
          <span className="text-[10px] font-bold px-2 py-0.5 rounded-full border border-slate-200 bg-white text-slate-700 uppercase">
            Hiện tại: {user.userRole}
          </span>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-3">
          {error && (
            <div className="p-3 rounded-lg border border-rose-200 bg-rose-50 text-xs text-rose-800 font-medium flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <div className="space-y-2 max-h-[50vh] overflow-y-auto pr-1">
            {ROLES.map((r) => {
              const isSelected = selectedRole === r.role;
              return (
                <div
                  key={r.role}
                  onClick={() => setSelectedRole(r.role)}
                  className={`p-3 rounded-xl border transition cursor-pointer flex flex-col gap-1 ${
                    isSelected
                      ? 'border-indigo-600 bg-indigo-50/50 shadow-2xs'
                      : 'border-slate-200 bg-white hover:bg-slate-50'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-900">{r.label}</span>
                    <input
                      type="radio"
                      name="role"
                      checked={isSelected}
                      onChange={() => setSelectedRole(r.role)}
                      className="accent-indigo-600 cursor-pointer"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500 leading-normal">{r.desc}</p>
                </div>
              );
            })}
          </div>

          {/* Actions */}
          <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-100">
            <button
              type="button"
              onClick={onClose}
              disabled={isLoading}
              className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              Hủy Bỏ
            </button>
            <button
              type="submit"
              disabled={isLoading || selectedRole === user.userRole.toUpperCase()}
              className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-white text-xs font-bold transition shadow-2xs disabled:opacity-50 cursor-pointer"
            >
              {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
              Lưu Thay Đổi
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
