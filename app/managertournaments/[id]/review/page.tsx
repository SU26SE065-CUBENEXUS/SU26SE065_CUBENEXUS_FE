'use client';

import { useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { ShieldAlert, Loader2 } from 'lucide-react';

interface Props {
  params: Promise<{ id: string }>;
}

export default function ManagerAttemptReviewRedirectPage({ params }: Props) {
  const { id: tournamentId } = use(params);
  const router = useRouter();
  const { user, isLoading: authLoading } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

  useEffect(() => {
    if (!authLoading) {
      if (isAdmin) {
        router.replace(`/admin/tournaments/${tournamentId}/review`);
      }
    }
  }, [authLoading, isAdmin, router, tournamentId]);

  if (authLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (!isAdmin) {
    return (
      <div className="mx-auto max-w-lg p-8 text-center mt-12 bg-white rounded-3xl border border-rose-200 shadow-sm space-y-4">
        <ShieldAlert className="h-12 w-12 text-rose-500 mx-auto" />
        <h2 className="text-xl font-bold text-slate-900">Quyền Truy Cập Bị Từ Chối</h2>
        <p className="text-sm text-slate-500">
          Chỉ có Quản trị viên hệ thống (Admin) mới có quyền kiểm duyệt Video Solve A01 và điều chỉnh điểm phạt.
        </p>
        <button
          onClick={() => router.push('/managertournaments')}
          className="px-5 py-2.5 bg-slate-900 text-white rounded-xl text-xs font-bold hover:bg-slate-800 transition"
        >
          Quay lại Manager Portal
        </button>
      </div>
    );
  }

  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
    </div>
  );
}
