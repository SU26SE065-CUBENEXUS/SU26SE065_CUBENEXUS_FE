'use client';

import React from 'react';
import { X, Trophy, MapPin, Calendar, Users, User, ShieldAlert, CheckCircle2, Layers } from 'lucide-react';
import type { AdminTournamentDto } from '@/features/admin/api/adminTournamentApi';
import { formatEventLabel } from '@/lib/utils/eventFormatter';

interface TournamentDetailModalProps {
  isOpen: boolean;
  tournament: AdminTournamentDto | null;
  onClose: () => void;
  onToggleStatus: (t: AdminTournamentDto) => void;
}

export function TournamentDetailModal({
  isOpen,
  tournament,
  onClose,
  onToggleStatus,
}: TournamentDetailModalProps) {
  if (!isOpen || !tournament) return null;

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return '—';
    const d = new Date(dateStr);
    return d.toLocaleDateString('vi-VN', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const isDisabled = tournament.statusCode.toUpperCase() === 'DISABLED' || tournament.statusCode.toUpperCase() === 'CANCELLED';

  const getStatusBadge = (code: string) => {
    switch (code.toUpperCase()) {
      case 'DISABLED':
      case 'CANCELLED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-rose-100 text-rose-700 border border-rose-200 uppercase">Vô Hiệu Hóa</span>;
      case 'PUBLISHED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-indigo-100 text-indigo-700 border border-indigo-200 uppercase">Đã Công Bố</span>;
      case 'REGISTRATION_OPEN':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-emerald-100 text-emerald-700 border border-emerald-200 uppercase">Đang Mở Đăng Ký</span>;
      case 'REGISTRATION_CLOSED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-700 border border-amber-200 uppercase">Đóng Đăng Ký</span>;
      case 'ONGOING':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-700 border border-purple-200 uppercase">Đang Diễn Ra</span>;
      case 'COMPLETED':
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">Hoàn Thành</span>;
      default:
        return <span className="px-2.5 py-1 rounded-full text-xs font-bold bg-slate-100 text-slate-700 border border-slate-200 uppercase">{code}</span>;
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl rounded-2xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200 max-h-[90vh] overflow-y-auto">
        {/* Banner or Header */}
        <div className="relative rounded-xl overflow-hidden border border-slate-200 bg-gradient-to-r from-indigo-900 to-slate-900 min-h-[120px] flex items-end p-4 text-white">
          {tournament.bannerUrl && (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={tournament.bannerUrl} alt={tournament.name} className="absolute inset-0 w-full h-full object-cover opacity-40" />
          )}
          <div className="relative z-10 space-y-1">
            <div className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-amber-400 shrink-0" />
              <h3 className="text-xl font-extrabold tracking-tight text-white">{tournament.name}</h3>
            </div>
            <p className="text-xs text-slate-300 font-mono">ID: {tournament.id}</p>
          </div>

          <button
            onClick={onClose}
            className="absolute top-3 right-3 z-20 rounded-lg p-1.5 bg-black/40 text-white hover:bg-black/60 transition cursor-pointer"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Status Bar */}
        <div className="flex items-center justify-between p-3.5 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex items-center gap-2">
            <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Trạng Thái:</span>
            {getStatusBadge(tournament.statusCode)}
          </div>
          <button
            onClick={() => onToggleStatus(tournament)}
            className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shadow-2xs cursor-pointer ${isDisabled
                ? 'bg-emerald-600 hover:bg-emerald-700 text-white'
                : 'bg-rose-600 hover:bg-rose-700 text-white'
              }`}
          >
            {isDisabled ? 'Kích Hoạt Lại Giải Đấu' : 'Vô Hiệu Hóa Giải Đấu'}
          </button>
        </div>

        {/* Created By Manager Info */}
        <div className="rounded-xl border border-indigo-100 bg-indigo-50/50 p-4 space-y-2">
          <p className="text-[10px] font-extrabold text-indigo-500 uppercase tracking-wider flex items-center gap-1.5">
            <User className="h-3.5 w-3.5 text-indigo-600" /> Quản Lý Tạo Giải (Manager)
          </p>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-extrabold text-slate-900">{tournament.createdByName}</p>
              <p className="text-xs text-slate-600 font-medium">{tournament.createdByEmail}</p>
            </div>
            <span className="text-xs font-mono text-indigo-700 bg-indigo-100 border border-indigo-200 px-2.5 py-1 rounded-lg">
              Mã: {tournament.createdByCode || 'N/A'}
            </span>
          </div>
        </div>

        {/* Details Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <MapPin className="h-3 w-3 text-slate-400" /> Địa điểm
            </p>
            <p className="font-semibold text-slate-800">{tournament.location || 'Chưa cập nhật'}</p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Users className="h-3 w-3 text-slate-400" /> Số lượng Thí Sinh
            </p>
            <p className="font-semibold text-slate-800">
              {tournament.registeredParticipantsCount} / {tournament.maxParticipants ?? 'Không giới hạn'} người đăng ký
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" /> Thời Gian Thi Đấu
            </p>
            <p className="font-semibold text-slate-800">
              {formatDate(tournament.startDate)} - {formatDate(tournament.endDate)}
            </p>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider flex items-center gap-1">
              <Calendar className="h-3 w-3 text-slate-400" /> Hạn Đăng Ký Thí Sinh
            </p>
            <p className="font-semibold text-slate-800">
              {formatDate(tournament.registrationOpenAt)} - {formatDate(tournament.registrationCloseAt)}
            </p>
          </div>
        </div>

        {/* Description */}
        {tournament.description && (
          <div className="rounded-xl border border-slate-100 bg-slate-50/70 p-3 space-y-1 text-xs">
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">Mô tả giải đấu</p>
            <p className="text-slate-700 leading-relaxed">{tournament.description}</p>
          </div>
        )}

        {/* Events List */}
        <div className="space-y-2">
          <p className="text-xs font-bold text-slate-900 flex items-center gap-1.5">
            <Layers className="h-4 w-4 text-indigo-600" /> Danh Sách Môn Thi ({tournament.events.length})
          </p>
          {tournament.events.length === 0 ? (
            <p className="text-xs text-slate-400 italic">Chưa có môn thi nào được tạo trong giải đấu này.</p>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {tournament.events.map((ev) => (
                <div key={ev.id} className="rounded-xl border border-slate-200 bg-white p-2.5 flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    <span className="font-bold text-slate-900">{formatEventLabel(ev)}</span>
                  </div>
                  <span className="text-[10px] font-semibold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded uppercase font-mono">{ev.eventFormatCode || 'TRADITIONAL'}</span>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="flex justify-end pt-2 border-t border-slate-100">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl border border-slate-200 bg-white text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs cursor-pointer"
          >
            Đóng
          </button>
        </div>
      </div>
    </div>
  );
}
