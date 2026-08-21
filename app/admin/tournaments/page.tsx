'use client';

import React, { useState, useEffect, useCallback } from 'react';
import {
  Trophy,
  Search,
  RefreshCw,
  Eye,
  ChevronLeft,
  ChevronRight,
  Loader2,
  AlertCircle,
  CheckCircle2,
  Power,
  Play,
  Lock,
  User,
  MapPin,
  Calendar,
  Users,
} from 'lucide-react';
import {
  getAdminTournaments,
  updateAdminTournamentStatus,
  forceStartOnlineAsyncTournament,
  closeOnlineAsyncRegistration,
  type AdminTournamentDto,
} from '@/features/admin/api/adminTournamentApi';
import { TournamentDetailModal } from '@/components/admin/TournamentDetailModal';

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<AdminTournamentDto[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize] = useState(10);

  // Filters
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('ALL');

  // Loading & Toast
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoadingId, setActionLoadingId] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Detail Modal
  const [selectedTournament, setSelectedTournament] = useState<AdminTournamentDto | null>(null);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const fetchTournaments = useCallback(async () => {
    setIsLoading(true);
    try {
      const res = await getAdminTournaments({
        page,
        pageSize,
        search: searchTerm.trim() || undefined,
        status: statusFilter !== 'ALL' ? statusFilter : undefined,
      });
      setTournaments(res.items);
      setTotalCount(res.totalCount);
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể tải danh sách giải đấu.');
    } finally {
      setIsLoading(false);
    }
  }, [page, pageSize, searchTerm, statusFilter]);

  useEffect(() => {
    fetchTournaments();
  }, [fetchTournaments]);

  const handleToggleStatus = async (t: AdminTournamentDto) => {
    const isCurrentlyDisabled = t.statusCode.toUpperCase() === 'DISABLED' || t.statusCode.toUpperCase() === 'CANCELLED';
    const nextStatus = isCurrentlyDisabled ? 'PUBLISHED' : 'DISABLED';
    const actionText = isCurrentlyDisabled ? 'kích hoạt lại' : 'vô hiệu hóa';

    if (!window.confirm(`Bạn có chắc chắn muốn ${actionText} giải đấu "${t.name}"?`)) return;

    setActionLoadingId(t.id);
    try {
      const updated = await updateAdminTournamentStatus(t.id, nextStatus);
      setTournaments((prev) => prev.map((item) => (item.id === updated.id ? updated : item)));
      if (selectedTournament?.id === updated.id) {
        setSelectedTournament(updated);
      }
      showToast('success', `Đã ${actionText} thành công giải đấu "${updated.name}".`);
    } catch (err: any) {
      showToast('error', err?.message || `Không thể ${actionText} giải đấu.`);
    } finally {
      setActionLoadingId(null);
    }
  };

  const applyAdminAction = async (t: AdminTournamentDto, action: 'start' | 'close-registration') => {
    const label = action === 'start' ? 'mở giải ngay và đóng đăng ký' : 'đóng đăng ký ngay';
    if (!window.confirm(`Bạn có chắc muốn ${label} cho "${t.name}"?`)) return;
    setActionLoadingId(t.id);
    try {
      const updated = action === 'start'
        ? await forceStartOnlineAsyncTournament(t.id)
        : await closeOnlineAsyncRegistration(t.id);
      setTournaments((prev) => prev.map((item) => item.id === updated.id ? updated : item));
      if (selectedTournament?.id === updated.id) setSelectedTournament(updated);
      showToast('success', action === 'start' ? 'Giải A01 đã được mở để kiểm thử.' : 'Đăng ký đã được đóng.');
    } catch (err: any) {
      showToast('error', err?.message || 'Không thể thực hiện thao tác phát triển.');
    } finally {
      setActionLoadingId(null);
    }
  };

  const getStatusBadge = (code: string) => {
    switch (code.toUpperCase()) {
      case 'DISABLED':
      case 'CANCELLED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-rose-100 text-rose-700 border border-rose-200">Vô Hiệu Hóa</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-indigo-100 text-indigo-700 border border-indigo-200">Đã Xuất Bản</span>;
      case 'REGISTRATION_OPEN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-emerald-100 text-emerald-700 border border-emerald-200">Đang Mở Đăng Ký</span>;
      case 'REGISTRATION_CLOSED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-amber-100 text-amber-700 border border-amber-200">Đóng Đăng Ký</span>;
      case 'CHECKING_IN':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-cyan-100 text-cyan-700 border border-cyan-200">Đang Check-in</span>;
      case 'ONGOING':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-purple-100 text-purple-700 border border-purple-200">Đang Diễn Ra</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase bg-slate-100 text-slate-700 border border-slate-200">Hoàn Thành</span>;
      default:
        return <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase bg-slate-100 text-slate-700 border border-slate-200">{code}</span>;
    }
  };

  const totalPages = Math.ceil(totalCount / pageSize) || 1;

  return (
    <div className="space-y-6">
      {/* Toast Notification */}
      {toastMessage && (
        <div
          className={`fixed top-4 right-4 z-50 flex items-center gap-2 px-4 py-3 rounded-2xl shadow-xl border text-xs font-bold animate-in slide-in-from-top-2 duration-300 ${toastMessage.type === 'success'
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
          <div className="p-3 bg-amber-50 border border-amber-100 rounded-2xl text-amber-600 shrink-0">
            <Trophy className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Quản Lý Giải Đấu (Admin)</h1>
            <p className="text-xs text-slate-500 mt-0.5">
              Theo dõi người tạo giải đấu (Manager) và kiểm soát trạng thái vô hiệu hóa giải đấu trên toàn hệ thống.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => fetchTournaments()}
            disabled={isLoading}
            className="inline-flex items-center gap-1.5 px-3 py-2 rounded-xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-semibold text-slate-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-3.5 w-3.5 ${isLoading ? 'animate-spin' : ''}`} />
            Làm mới
          </button>
        </div>
      </div>

      {/* Filters Bar */}
      <div className="bg-white p-4 rounded-2xl border border-slate-200 shadow-2xs flex flex-wrap items-center justify-between gap-3">
        {/* Search */}
        <div className="relative flex-1 min-w-[240px]">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-slate-400" />
          <input
            type="text"
            placeholder="Tìm tên giải đấu, địa điểm, tên/email Manager tạo..."
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setPage(1);
            }}
            className="w-full pl-9 pr-3 py-2 text-xs font-medium text-slate-900 bg-slate-50 border border-slate-200 rounded-xl outline-none focus:border-indigo-600 focus:bg-white transition"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value);
            setPage(1);
          }}
          className="px-3 py-2 text-xs font-semibold text-slate-800 bg-slate-50 border border-slate-200 rounded-xl outline-none cursor-pointer focus:border-indigo-600 focus:bg-white transition"
        >
          <option value="ALL">Tất cả Trạng Thái</option>
          <option value="PUBLISHED">Đã Công Bố</option>
          <option value="REGISTRATION_OPEN">Đang Mở Đăng Ký</option>
          <option value="REGISTRATION_CLOSED">Đóng Đăng Ký</option>
          <option value="CHECKING_IN">Đang Check-in</option>
          <option value="ONGOING">Đang Diễn Ra</option>
          <option value="COMPLETED">Hoàn Thành</option>
          <option value="DISABLED">Đang Vô Hiệu Hóa</option>
          <option value="DRAFT">Nháp (DRAFT)</option>
        </select>
      </div>

      {/* Tournaments Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
              <tr>
                <th className="py-3.5 px-4">Giải Đấu</th>
                <th className="py-3.5 px-4">Người Tạo (Manager)</th>
                <th className="py-3.5 px-4">Thí Sinh</th>
                <th className="py-3.5 px-4">Thời Gian Thi Đấu</th>
                <th className="py-3.5 px-4">Trạng Thái</th>
                <th className="py-3.5 px-4 text-right">Thao Tác</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {isLoading ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Loader2 className="h-6 w-6 animate-spin mx-auto mb-2 text-amber-600" />
                    <span>Đang tải danh sách giải đấu...</span>
                  </td>
                </tr>
              ) : tournaments.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400">
                    <Trophy className="h-8 w-8 mx-auto mb-2 opacity-40 text-amber-500" />
                    <p className="font-semibold">Không tìm thấy giải đấu nào phù hợp</p>
                  </td>
                </tr>
              ) : (
                tournaments.map((t) => {
                  const isActionLoading = actionLoadingId === t.id;
                  const isDisabled = t.statusCode.toUpperCase() === 'DISABLED' || t.statusCode.toUpperCase() === 'CANCELLED';
                  const isOnlineAsync = t.tournamentType === 'ONLINE_ASYNC';
                  const canForceStart = isOnlineAsync && !isDisabled && new Date(t.startDate) > new Date();
                  const canCloseRegistration = isOnlineAsync && !isDisabled && new Date(t.registrationCloseAt) > new Date() && new Date(t.startDate) > new Date();

                  return (
                    <tr key={t.id} className="hover:bg-slate-50/60 transition">
                      {/* Tournament Info */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-xl bg-amber-50 border border-amber-100 flex items-center justify-center text-amber-600 font-extrabold text-xs shrink-0 overflow-hidden">
                            {t.bannerUrl ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={t.bannerUrl} alt={t.name} className="h-full w-full object-cover" />
                            ) : (
                              <Trophy className="h-5 w-5" />
                            )}
                          </div>
                          <div className="min-w-0">
                            <p className="font-extrabold text-slate-900 truncate">{t.name}</p>
                            <p className="text-[11px] text-slate-400 flex items-center gap-1 mt-0.5 truncate">
                              <MapPin className="h-3 w-3 text-slate-400 shrink-0" /> {t.location || 'Chưa cập nhật'}
                            </p>
                          </div>
                        </div>
                      </td>

                      {/* Manager Creator */}
                      <td className="py-3.5 px-4">
                        <div className="min-w-0">
                          <p className="font-bold text-slate-900 truncate flex items-center gap-1">
                            <User className="h-3 w-3 text-indigo-500 shrink-0" /> {t.createdByName}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate">{t.createdByEmail}</p>
                        </div>
                      </td>

                      {/* Participants */}
                      <td className="py-3.5 px-4">
                        <span className="font-bold text-slate-900">{t.registeredParticipantsCount}</span>
                        <span className="text-slate-400"> / {t.maxParticipants ?? '∞'}</span>
                      </td>

                      {/* Dates */}
                      <td className="py-3.5 px-4 text-slate-500 font-medium whitespace-nowrap">
                        {new Date(t.startDate).toLocaleDateString('vi-VN')} - {new Date(t.endDate).toLocaleDateString('vi-VN')}
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4">{getStatusBadge(t.statusCode)}</td>

                      {/* Actions */}
                      <td className="py-3.5 px-4 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {/* View Detail */}
                          <button
                            onClick={() => setSelectedTournament(t)}
                            title="Xem chi tiết giải đấu"
                            className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 border border-transparent hover:border-indigo-100 transition cursor-pointer"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {canCloseRegistration && (
                            <button onClick={() => applyAdminAction(t, 'close-registration')} disabled={isActionLoading} title="Đóng đăng ký A01 ngay" className="p-1.5 rounded-lg text-amber-600 hover:bg-amber-50 hover:border-amber-100 border border-transparent transition cursor-pointer disabled:opacity-50">
                              <Lock className="h-4 w-4" />
                            </button>
                          )}

                          {canForceStart && (
                            <button onClick={() => applyAdminAction(t, 'start')} disabled={isActionLoading} title="Dev: mở giải A01 ngay" className="p-1.5 rounded-lg text-indigo-600 hover:bg-indigo-50 hover:border-indigo-100 border border-transparent transition cursor-pointer disabled:opacity-50">
                              <Play className="h-4 w-4 fill-current" />
                            </button>
                          )}

                          {/* Toggle Status */}
                          <button
                            onClick={() => handleToggleStatus(t)}
                            disabled={isActionLoading}
                            title={isDisabled ? 'Kích hoạt lại giải đấu' : 'Vô hiệu hóa giải đấu'}
                            className={`p-1.5 rounded-lg border border-transparent transition cursor-pointer disabled:opacity-50 ${isDisabled
                                ? 'text-emerald-600 hover:bg-emerald-50 hover:border-emerald-100'
                                : 'text-rose-500 hover:bg-rose-50 hover:border-rose-100'
                              }`}
                          >
                            {isActionLoading ? (
                              <Loader2 className="h-4 w-4 animate-spin" />
                            ) : (
                              <Power className="h-4 w-4" />
                            )}
                          </button>
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
            Hiển thị <span className="font-bold text-slate-900">{tournaments.length}</span> /{' '}
            <span className="font-bold text-slate-900">{totalCount}</span> giải đấu
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

      {/* Detail Modal */}
      <TournamentDetailModal
        isOpen={!!selectedTournament}
        tournament={selectedTournament}
        onClose={() => setSelectedTournament(null)}
        onToggleStatus={handleToggleStatus}
      />
    </div>
  );
}
