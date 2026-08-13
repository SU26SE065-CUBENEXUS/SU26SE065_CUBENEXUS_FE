'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { DashboardCard } from '@/components/tournament-manager/DashboardCard';
import { StatusBadge } from '@/components/tournament-manager/StatusBadge';
import { getTournamentById, completeTournament } from '@/lib/api/tournaments';
import type { TournamentDetailDto } from '@/lib/api/types';
import { formatEventLabel } from '@/lib/utils/eventFormatter';
import { ImageLightboxModal } from '@/components/ui/ImageLightboxModal';
import { ConfirmModal } from '@/components/ui/ConfirmModal';
import {
  ChevronRight,
  Users,
  Layers,
  CheckCircle2,
  AlertCircle,
  Settings,
  Radio,
  ClipboardList,
  Calendar,
  MapPin,
  User2,
  UserCheck,
  Loader2,
  Trophy,
  RefreshCw,
  CheckCircle,
  ZoomIn,
  Zap,
} from 'lucide-react';

const QUICK_ACTIONS = [
  {
    title: 'Live Operations',
    description: 'Monitor stations, check-in, and active rounds',
    href: 'live',
    icon: Radio,
    accent: 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/30 text-emerald-700',
  },
  {
    title: 'Manage Judges',
    description: 'Create referee accounts and 1-click batch credentials handover',
    href: 'judges',
    icon: UserCheck,
    accent: 'bg-white border-slate-200 hover:border-amber-500 hover:bg-amber-50/30 text-amber-700',
  },
  {
    title: 'Configure Events',
    description: 'Set formats, rounds, and scoring rules',
    href: 'events',
    icon: Settings,
    accent: 'bg-white border-slate-200 hover:border-indigo-500 hover:bg-indigo-50/30 text-indigo-700',
  },
  {
    title: 'Manage Registrations',
    description: 'View and manage competitor registrations',
    href: 'registrations',
    icon: ClipboardList,
    accent: 'bg-white border-slate-200 hover:border-sky-500 hover:bg-sky-50/30 text-sky-700',
  },
  {
    title: 'Generate Groups & Scrambles',
    description: 'Create groups, assign stations and scrambles',
    href: 'groups',
    icon: Layers,
    accent: 'bg-white border-slate-200 hover:border-purple-500 hover:bg-purple-50/30 text-purple-700',
  },
];

function formatDateRange(start: string, end: string): string {
  const s = new Date(start);
  const e = new Date(end);
  const fmt = (d: Date) =>
    d.toLocaleDateString('vi-VN', { day: '2-digit', month: 'short', year: 'numeric' });
  return `${fmt(s)} – ${fmt(e)}`;
}

export default function TournamentDetailDashboardPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isCompleting, setIsCompleting] = useState(false);
  const [completeMsg, setCompleteMsg] = useState<{ text: string; isError: boolean } | null>(null);
  const [showConfirmComplete, setShowConfirmComplete] = useState(false);
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  const fetchTournament = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const data = await getTournamentById(id);
      setTournament(data);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải thông tin giải đấu từ máy chủ.');
      setTournament(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchTournament();
  }, [id]);

  const handleComplete = async () => {
    if (!tournament) return;
    setIsCompleting(true);
    setShowConfirmComplete(false);
    try {
      const updated = await completeTournament(id);
      setTournament(updated);
      setCompleteMsg({
        text: 'Giải đấu đã được đánh dấu HOÀN THÀNH thành công!',
        isError: false,
      });
    } catch (err: any) {
      setCompleteMsg({
        text: err?.message || 'Không thể đánh dấu hoàn thành giải đấu.',
        isError: true,
      });
    } finally {
      setIsCompleting(false);
    }
  };

  // Loading
  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  // Error
  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8 text-left">
        <div className="flex flex-col items-center gap-4 rounded-3xl border border-red-200 bg-red-50/50 p-12 text-center shadow-2xs">
          <AlertCircle className="h-10 w-10 text-red-500" />
          <div>
            <p className="text-base font-extrabold text-red-900">Không Tìm Thấy Giải Đấu</p>
            <p className="text-xs text-red-700 mt-1">{error || 'Giải đấu không tồn tại hoặc đã bị xóa.'}</p>
          </div>
          <button
            onClick={fetchTournament}
            className="inline-flex items-center gap-2 rounded-xl bg-white border border-slate-200 px-4 py-2 text-xs font-extrabold text-slate-800 hover:bg-slate-50 transition cursor-pointer shadow-2xs"
          >
            <RefreshCw className="h-4 w-4" /> Thử Lại
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6 text-left">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">
          Giải Đấu
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-semibold">{tournament.name}</span>
      </div>

      {/* Complete success/error banner */}
      {completeMsg && (
        <div className={`flex items-center gap-2 rounded-xl border px-4 py-3 text-sm font-medium ${
          completeMsg.isError
            ? 'border-red-200 bg-red-50 text-red-700'
            : 'border-emerald-200 bg-emerald-50 text-emerald-700'
        }`}>
          {completeMsg.isError ? (
            <AlertCircle className="h-4 w-4 shrink-0 text-red-600" />
          ) : (
            <CheckCircle className="h-4 w-4 shrink-0 text-emerald-600" />
          )}
          <span>{completeMsg.text}</span>
          <button onClick={() => setCompleteMsg(null)} className="ml-auto text-xs underline font-semibold cursor-pointer">Đóng</button>
        </div>
      )}

      {/* Tournament Overview Card */}
      <div className="rounded-2xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
        {/* Banner Poster Header */}
        {tournament.bannerUrl && (
          <div
            onClick={() => setPreviewImage(tournament.bannerUrl!)}
            className="relative h-48 w-full overflow-hidden bg-slate-100 cursor-pointer border-b border-slate-200"
            title="Bấm để xem ảnh phóng to"
          >
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img
              src={tournament.bannerUrl}
              alt={tournament.name}
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-6">
          <div className="flex flex-col lg:flex-row lg:items-start justify-between gap-4">
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-2.5 mb-2">
                <StatusBadge status={tournament.statusCode} />
                {tournament.maxParticipants && (
                  <span className="text-[10px] font-semibold px-2 py-0.5 rounded bg-amber-50 text-amber-700 border border-amber-200">
                    Tối đa: {tournament.maxParticipants} thí sinh
                  </span>
                )}
                <span className="text-xs text-slate-400 font-mono">
                  #{tournament.id.slice(0, 8)}
                </span>
              </div>
              <h1 className="text-2xl font-bold text-slate-900 tracking-tight">
                {tournament.name}
              </h1>
              {tournament.description && (
                <p className="text-sm text-slate-500 mt-1">{tournament.description}</p>
              )}
              <div className="flex flex-wrap items-center gap-4 mt-3 text-xs text-slate-600 font-medium">
                <span>
                  {formatDateRange(tournament.startDate, tournament.endDate)}
                </span>
                {tournament.location && (
                  <span>
                    • {tournament.location}
                  </span>
                )}
                <span>
                  • Người tạo: {tournament.createdByUserName || 'Manager'}
                </span>
              </div>
              {/* Events chips */}
              <div className="flex flex-wrap gap-1.5 mt-3">
                {(tournament.events || []).map((e) => (
                  <span
                    key={e.id}
                    className="rounded-md bg-indigo-50 border border-indigo-100 px-2.5 py-0.5 text-xs font-semibold text-indigo-700"
                  >
                    {formatEventLabel(e)}
                  </span>
                ))}
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <button
                onClick={fetchTournament}
                disabled={isLoading}
                className="rounded-lg border border-slate-200 bg-white p-2.5 text-slate-600 shadow-2xs transition hover:bg-slate-50 cursor-pointer"
                title="Tải lại"
              >
                <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
              </button>
              {tournament.statusCode !== 'completed' && tournament.statusCode !== 'cancelled' && (
                <button
                  onClick={() => setShowConfirmComplete(true)}
                  disabled={isCompleting}
                  className="inline-flex items-center gap-2 rounded-lg bg-emerald-600 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition hover:bg-emerald-700 disabled:opacity-60 border-none cursor-pointer"
                >
                  {isCompleting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : null}
                  Hoàn Thành Giải Đấu
                </button>
              )}
            </div>
          </div>

          {/* Reg window */}
          <div className="mt-5 border-t border-slate-100 pt-4 flex flex-wrap gap-4 text-xs text-slate-500">
            <span>
              <span className="font-semibold text-slate-700">Mở đăng ký:</span>{' '}
              {new Date(tournament.registrationOpenAt).toLocaleString('vi-VN')}
            </span>
            <span>
              <span className="font-semibold text-slate-700">Đóng đăng ký:</span>{' '}
              {new Date(tournament.registrationCloseAt).toLocaleString('vi-VN')}
            </span>
            <span>
              <span className="font-semibold text-slate-700">Ngày tạo:</span>{' '}
              {new Date(tournament.createdAt).toLocaleDateString('vi-VN')}
            </span>
          </div>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-2 gap-4 md:grid-cols-4">
        <DashboardCard title="Hạng mục thi" value={tournament.events?.length || 0} accent="blue" />
        <DashboardCard title="Nhóm & Scramble" value="Sẵn sàng" accent="purple" />
        <DashboardCard title="Thí sinh đăng ký" value="Chi tiết" accent="yellow" />
        <DashboardCard title="Điều hành Live" value="Hoạt động" accent="emerald" />
      </div>

      {/* Quick Action Cards */}
      <div className="space-y-3">
        <h2 className="text-xs font-bold text-slate-500 uppercase tracking-wider">
          Thao Tác Nhanh
        </h2>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {QUICK_ACTIONS.map((action) => {
            return (
              <Link
                key={action.title}
                href={`/managertournaments/${id}/${action.href}`}
                className={`rounded-xl border p-5 transition-all shadow-2xs hover:shadow-xs group ${action.accent}`}
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="font-bold text-sm text-slate-900">{action.title}</p>
                  <ChevronRight className="h-4 w-4 text-slate-400 opacity-60 group-hover:opacity-100 transition-opacity" />
                </div>
                <p className="text-xs text-slate-500 leading-snug">{action.description}</p>
              </Link>
            );
          })}
        </div>
      </div>

      {/* Full-Screen Image Lightbox Modal */}
      <ImageLightboxModal
        isOpen={Boolean(previewImage)}
        imageUrl={previewImage}
        title={tournament ? `Poster Banner — ${tournament.name}` : 'Poster Giải Đấu'}
        onClose={() => setPreviewImage(null)}
      />

      {/* Confirm Modal for Complete Tournament */}
      <ConfirmModal
        isOpen={showConfirmComplete}
        title="Đánh Dấu Hoàn Thành Giải Đấu"
        description={`Bạn có chắc chắn muốn kết thúc và đánh dấu giải đấu "${tournament.name}" là HOÀN THÀNH? Thao tác này không thể hoàn tác.`}
        confirmText="Xác Nhận Hoàn Thành"
        cancelText="Hủy Bỏ"
        variant="primary"
        isLoading={isCompleting}
        onConfirm={handleComplete}
        onClose={() => setShowConfirmComplete(false)}
      />
    </div>
  );
}
