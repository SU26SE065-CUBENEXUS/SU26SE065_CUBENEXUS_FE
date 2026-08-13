'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { DashboardAnalyticsCharts } from '@/features/admin/components/DashboardAnalyticsCharts';
import { getPublicTournaments } from '@/lib/api/tournaments';
import { listOnlineAsyncTournaments } from '@/lib/api/online-async';
import type { TournamentDetailDto } from '@/lib/api/types';
import { Zap, Trophy, Video, Users, ArrowRight, ShieldCheck, Database } from 'lucide-react';

export default function AdminDashboardPage() {
  const router = useRouter();
  const { user } = useAuth();
  const [tournaments, setTournaments] = useState<TournamentDetailDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const [publicList, asyncList] = await Promise.all([
        getPublicTournaments().catch(() => []),
        listOnlineAsyncTournaments().catch(() => []),
      ]);

      const mappedAsync = asyncList.map((t) => ({
        id: t.id,
        name: t.name,
        description: t.description,
        startDate: t.startDate,
        endDate: t.endDate,
        registrationOpenAt: t.registrationOpenAt,
        registrationCloseAt: t.registrationCloseAt,
        statusCode: (t.statusCode || 'ONGOING').toLowerCase() as any,
        createdBy: t.createdBy,
        createdByUserName: 'Admin',
        createdAt: t.createdAt,
        updatedAt: t.createdAt,
        events: [],
        isOnlineAsync: true,
      }));

      const combined = [...publicList, ...mappedAsync];
      const unique = [...new Map(combined.map((item) => [item.id, item])).values()];
      setTournaments(unique);
    } catch {
      setTournaments([]);
    } finally {
      setIsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-8 text-left">
      {/* 📊 Real Dynamic Analytics Charts Component for Admin */}
      <DashboardAnalyticsCharts
        tournaments={tournaments}
        userRole="ADMIN"
        initialWorkflow="online_async"
        onNavigateToAsync={() => router.push('/managertournaments/async')}
        onNavigateToOffline={() => router.push('/managertournaments/offline')}
        onNavigateToReview={() => router.push('/admin/a01-video-review')}
      />

      {/* Admin Quick Access Cards */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-black text-slate-900 tracking-tight">
            Truy Cập Nhanh Phân Hệ Admin System
          </h2>
          <span className="text-xs font-bold text-slate-400">Điều hành hệ thống</span>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Card 1: Async Tournaments */}
          <div
            onClick={() => router.push('/managertournaments/async')}
            className="group bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-lg hover:border-indigo-300 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-indigo-50 text-indigo-600 rounded-2xl border border-indigo-100 group-hover:bg-indigo-600 group-hover:text-white transition">
                  <Zap className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-indigo-700 bg-indigo-50 border border-indigo-100 px-2 py-0.5 rounded-full">
                  Admin System
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-indigo-600 transition">
                  Giải Online Async (A01)
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Quản lý giải đấu Online A01, AI 5-Face Scan & Hand Timer 14s.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-indigo-600">
              <span>Quản Lý Async</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card 2: Scramble Pool */}
          <div
            onClick={() => router.push('/admin/scrambles')}
            className="group bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-lg hover:border-emerald-300 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-emerald-50 text-emerald-600 rounded-2xl border border-emerald-100 group-hover:bg-emerald-600 group-hover:text-white transition">
                  <Database className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-emerald-700 bg-emerald-50 border border-emerald-100 px-2 py-0.5 rounded-full">
                  Scramble Pool
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-emerald-600 transition">
                  Kho Đề Scramble Center
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Sinh đề xoay tự động, duyệt 1-click & thu hồi đề Rubik.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-emerald-600">
              <span>Mở Kho Đề</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card 3: Video Review */}
          <div
            onClick={() => router.push('/admin/a01-video-review')}
            className="group bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-lg hover:border-rose-300 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-rose-50 text-rose-600 rounded-2xl border border-rose-100 group-hover:bg-rose-600 group-hover:text-white transition">
                  <Video className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-rose-700 bg-rose-50 border border-rose-100 px-2 py-0.5 rounded-full">
                  Anti-Cheat
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-rose-600 transition">
                  A01 Video Review
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Kiểm duyệt Video bằng chứng của thí sinh nộp bài Async.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-rose-600">
              <span>Review Video</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>

          {/* Card 4: User Management */}
          <div
            onClick={() => router.push('/admin/users')}
            className="group bg-white rounded-3xl p-5 border border-slate-200 shadow-xs hover:shadow-lg hover:border-slate-400 transition-all cursor-pointer space-y-3 flex flex-col justify-between"
          >
            <div className="space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="p-3 bg-slate-100 text-slate-700 rounded-2xl border border-slate-200 group-hover:bg-slate-800 group-hover:text-white transition">
                  <Users className="h-5 w-5" />
                </span>
                <span className="text-[10px] font-black uppercase tracking-wider text-slate-700 bg-slate-100 border border-slate-200 px-2 py-0.5 rounded-full">
                  Users & Roles
                </span>
              </div>
              <div>
                <h3 className="text-base font-black text-slate-900 group-hover:text-slate-800 transition">
                  Quản Lý Người Dùng
                </h3>
                <p className="text-xs text-slate-500 mt-1 font-medium leading-relaxed">
                  Quản lý tài khoản, phân quyền Manager/Admin & hệ thống.
                </p>
              </div>
            </div>
            <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs font-extrabold text-slate-700">
              <span>Quản Lý User</span>
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
