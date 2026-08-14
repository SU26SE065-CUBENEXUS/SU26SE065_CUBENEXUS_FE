'use client';

import { useEffect, useState, use } from 'react';
import Link from 'next/link';
import { toast } from '@/lib/toast';
import {
  getTournamentById,
  getTournamentJudges,
  createTournamentJudge,
  batchCreateTournamentJudges,
  updateTournamentJudge,
  resetTournamentJudgePassword,
  deleteTournamentJudge,
  shuffleTournamentJudges,
  toggleJudgeStatus,
  deactivateAllJudges,
  activateAllJudges,
} from '@/lib/api/tournaments';
import type {
  TournamentDetailDto,
  TournamentJudgeDto,
} from '@/lib/api/types';
import {
  ChevronRight,
  Trophy,
  UserCheck,
  Loader2,
  AlertCircle,
  Plus,
  X,
  CheckCircle,
  Zap,
  Copy,
  Key,
  Pencil,
  Trash2,
  Search,
  Eye,
  EyeOff,
  Sparkles,
  Share2,
  ShieldCheck,
  Shuffle,
  QrCode,
  Users,
  Lock,
  Unlock,
  PowerOff,
} from 'lucide-react';

export default function JudgeManagementPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = use(params);
  const [tournament, setTournament] = useState<TournamentDetailDto | null>(null);
  const [judges, setJudges] = useState<TournamentJudgeDto[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | 'CHECKIN' | 'STATION'>('ALL');

  // Modals state
  const [showBatchModal, setShowBatchModal] = useState(false);
  const [showSingleModal, setShowSingleModal] = useState(false);
  const [showHandoverModal, setShowHandoverModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showResetPasswordModal, setShowResetPasswordModal] = useState(false);
  const [showShuffleModal, setShowShuffleModal] = useState(false);
  const [judgeToDelete, setJudgeToDelete] = useState<TournamentJudgeDto | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // Form states - Advanced Batch Allocation
  const [checkInCountInput, setCheckInCountInput] = useState('1');
  const [stationCountInput, setStationCountInput] = useState('5');
  const [judgesPerStationInput, setJudgesPerStationInput] = useState('2');
  const [isBatchSubmitting, setIsBatchSubmitting] = useState(false);
  const [isShuffleSubmitting, setIsShuffleSubmitting] = useState(false);

  const [singleName, setSingleName] = useState('');
  const [singleUsername, setSingleUsername] = useState('');
  const [singlePassword, setSinglePassword] = useState('');
  const [singleRoleCode, setSingleRoleCode] = useState('STATION_JUDGE');
  const [singleStationNumber, setSingleStationNumber] = useState('');
  const [isSingleSubmitting, setIsSingleSubmitting] = useState(false);

  const [selectedJudge, setSelectedJudge] = useState<TournamentJudgeDto | null>(null);
  const [editName, setEditName] = useState('');
  const [editRoleCode, setEditRoleCode] = useState('STATION_JUDGE');
  const [editStationNumber, setEditStationNumber] = useState('');
  const [isEditSubmitting, setIsEditSubmitting] = useState(false);

  const [resetNewPassword, setResetNewPassword] = useState('');
  const [isResetSubmitting, setIsResetSubmitting] = useState(false);

  // Handover state (holds list of judges with plain-text passwords)
  const [handoverJudges, setHandoverJudges] = useState<TournamentJudgeDto[]>([]);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isAllCopied, setIsAllCopied] = useState(false);

  const [visiblePasswords, setVisiblePasswords] = useState<Record<string, boolean>>({});

  // Calculation for Batch Create
  const checkInNum = Math.max(0, parseInt(checkInCountInput, 10) || 0);
  const stationNum = Math.max(0, parseInt(stationCountInput, 10) || 0);
  const perStationNum = Math.max(1, parseInt(judgesPerStationInput, 10) || 1);
  const calculatedTotal = checkInNum + (stationNum * perStationNum);

  // Load tournament and judges
  const loadData = async () => {
    try {
      setIsLoading(true);
      setError(null);
      const [tData, jData] = await Promise.all([
        getTournamentById(id),
        getTournamentJudges(id).catch(() => []),
      ]);
      setTournament(tData);
      setJudges(jData);
    } catch (err: any) {
      setError(err?.message || 'Không thể tải dữ liệu giải đấu.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [id]);

  // Handler: Advanced Batch Create
  const handleBatchCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (calculatedTotal < 1) {
      toast.error('Cấu hình không hợp lệ', 'Vui lòng chọn số lượng trọng tài lớn hơn 0.');
      return;
    }
    try {
      setIsBatchSubmitting(true);
      const newJudges = await batchCreateTournamentJudges(id, {
        checkInCount: checkInNum,
        stationCount: stationNum,
        judgesPerStation: perStationNum,
      });
      setShowBatchModal(false);
      setHandoverJudges(newJudges);
      setShowHandoverModal(true);
      toast.success('Khởi tạo thành công', `Đã khởi tạo thành công ${newJudges.length} tài khoản Trọng tài.`);
      await loadData();
    } catch (err: any) {
      toast.error('Khởi tạo thất bại', err?.message || 'Lỗi khi tạo hàng loạt trọng tài.');
    } finally {
      setIsBatchSubmitting(false);
    }
  };

  // Handler: Shuffle / Randomize assignments
  const handleShuffle = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setIsShuffleSubmitting(true);
      const updatedJudges = await shuffleTournamentJudges(id, {
        checkInCount: checkInNum,
        stationCount: stationNum,
        judgesPerStation: perStationNum,
      });
      setShowShuffleModal(false);
      await loadData();
      toast.success('Tráo vị trí thành công', `Đã tráo đổi ngẫu nhiên vai trò cho ${updatedJudges.length} Trọng tài!`);
    } catch (err: any) {
      toast.error('Tráo vị trí thất bại', err?.message || 'Lỗi khi tráo đổi trọng tài.');
    } finally {
      setIsShuffleSubmitting(false);
    }
  };

  // Handler: Single Create
  const handleSingleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!singleName.trim()) return;
    try {
      setIsSingleSubmitting(true);
      const newJudge = await createTournamentJudge(id, {
        displayName: singleName.trim(),
        username: singleUsername.trim() || undefined,
        password: singlePassword.trim() || undefined,
      });
      setShowSingleModal(false);
      setSingleName('');
      setSingleUsername('');
      setSinglePassword('');
      setHandoverJudges([newJudge]);
      setShowHandoverModal(true);
      toast.success('Thêm trọng tài thành công', `Đã tạo tài khoản cho ${newJudge.displayName}`);
      await loadData();
    } catch (err: any) {
      toast.error('Tạo trọng tài thất bại', err?.message || 'Lỗi khi tạo trọng tài.');
    } finally {
      setIsSingleSubmitting(false);
    }
  };

  // Handler: Edit Name
  const handleEditJudge = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudge || !editName.trim()) return;
    try {
      setIsEditSubmitting(true);
      await updateTournamentJudge(id, selectedJudge.userId, {
        displayName: editName.trim(),
      });
      setShowEditModal(false);
      setSelectedJudge(null);
      toast.success('Cập nhật thành công', 'Đã lưu thông tin trọng tài.');
      await loadData();
    } catch (err: any) {
      toast.error('Cập nhật thất bại', err?.message || 'Lỗi khi cập nhật trọng tài.');
    } finally {
      setIsEditSubmitting(false);
    }
  };

  // Handler: Reset Password
  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedJudge) return;
    try {
      setIsResetSubmitting(true);
      const updated = await resetTournamentJudgePassword(id, selectedJudge.userId, {
        newPassword: resetNewPassword.trim() || undefined,
      });
      setShowResetPasswordModal(false);
      setResetNewPassword('');
      setHandoverJudges([updated]);
      setShowHandoverModal(true);
      toast.success('Đặt lại mật khẩu thành công', `Mật khẩu mới đã được cập nhật cho ${updated.displayName}`);
      await loadData();
    } catch (err: any) {
      toast.error('Thất bại', err?.message || 'Lỗi khi đặt lại mật khẩu.');
    } finally {
      setIsResetSubmitting(false);
    }
  };

  // Handler: Delete
  const confirmDeleteJudge = async () => {
    if (!judgeToDelete) return;
    try {
      setIsDeleting(true);
      await deleteTournamentJudge(id, judgeToDelete.userId);
      toast.success('Đã xóa trọng tài', `Đã xóa tài khoản "${judgeToDelete.displayName}" khỏi giải đấu.`);
      setJudgeToDelete(null);
      await loadData();
    } catch (err: any) {
      toast.error('Xóa thất bại', err?.message || 'Lỗi khi xóa trọng tài.');
    } finally {
      setIsDeleting(false);
    }
  };

  // Handler: Toggle individual judge active status
  const handleToggleJudgeStatus = async (j: TournamentJudgeDto) => {
    try {
      const currentActive = j.isActive ?? true;
      const updated = await toggleJudgeStatus(id, j.userId, !currentActive);
      setJudges((prev) =>
        prev.map((item) => (item.userId === j.userId ? { ...item, isActive: updated.isActive } : item))
      );
      toast.success(
        updated.isActive ? 'Đã kích hoạt' : 'Đã vô hiệu hóa',
        `Tài khoản ${j.displayName} đã ${updated.isActive ? 'được mở khóa' : 'bị khóa'}.`
      );
    } catch (err: any) {
      toast.error('Thao tác thất bại', err?.message || 'Không thể đổi trạng thái trọng tài.');
    }
  };

  // Handler: Activate all judges for this tournament
  const handleActivateAllJudges = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn mở khóa TOÀN BỘ tài khoản trọng tài của giải đấu này không?')) return;
    try {
      const updatedJudges = await activateAllJudges(id);
      setJudges(updatedJudges);
      toast.success('Đã mở khóa toàn bộ', 'Tất cả tài khoản trọng tài đã sẵn sàng hoạt động.');
    } catch (err: any) {
      toast.error('Thất bại', err?.message || 'Lỗi khi kích hoạt tất cả trọng tài.');
    }
  };

  // Handler: Deactivate all judges for this tournament
  const handleDeactivateAllJudges = async () => {
    if (!window.confirm('Bạn có chắc chắn muốn vô hiệu hóa TOÀN BỘ tài khoản trọng tài của giải đấu này không?')) return;
    try {
      const updatedJudges = await deactivateAllJudges(id);
      setJudges(updatedJudges);
      toast.success('Đã vô hiệu hóa toàn bộ', 'Tất cả tài khoản trọng tài đã được khóa.');
    } catch (err: any) {
      toast.error('Thất bại', err?.message || 'Lỗi khi vô hiệu hóa tất cả trọng tài.');
    }
  };

  // Role Badge Helper
  const renderRoleBadge = (j: TournamentJudgeDto) => {
    if (j.roleCode === 'CHECKIN_JUDGE') {
      return (
        <span className="inline-flex items-center rounded bg-sky-50 border border-sky-200 px-2 py-0.5 text-[11px] font-semibold text-sky-700">
          Check-in Desk
        </span>
      );
    }
    if (j.assignedStationNumber) {
      return (
        <span className="inline-flex items-center rounded bg-amber-50 border border-amber-200 px-2 py-0.5 text-[11px] font-semibold text-amber-700">
          Bàn Thi Số {j.assignedStationNumber}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center rounded bg-slate-100 border border-slate-200 px-2 py-0.5 text-[11px] font-semibold text-slate-600">
        Trọng Tài Dự Phòng
      </span>
    );
  };

  // Copy all handover credentials formatted for chat/messenger/excel
  const copyAllHandover = () => {
    if (handoverJudges.length === 0) return;
    const tournamentName = tournament?.name || 'CubeNexus Tournament';
    let text = `🏆 [TÀI KHOẢN TRỌNG TÀI - ${tournamentName.toUpperCase()}]\n`;
    text += `----------------------------------------\n\n`;

    const checkInJudges = handoverJudges.filter((j) => j.roleCode === 'CHECKIN_JUDGE');
    const stationJudges = handoverJudges.filter((j) => j.roleCode !== 'CHECKIN_JUDGE');

    if (checkInJudges.length > 0) {
      text += `🎯 [KHU VỰC CHECK-IN DESK]\n`;
      checkInJudges.forEach((j, index) => {
        text += `${index + 1}. ${j.displayName}\n`;
        text += `   • Username: ${j.username}\n`;
        text += `   • Password: ${j.rawPassword || '(Đã bảo mật)'}\n`;
      });
      text += `\n`;
    }

    if (stationJudges.length > 0) {
      text += `⏹️ [KHU VỰC BÀN THI ĐẤU]\n`;
      stationJudges.forEach((j, index) => {
        const stationText = j.assignedStationNumber ? `(Bàn ${j.assignedStationNumber})` : '';
        text += `${index + 1}. ${j.displayName} ${stationText}\n`;
        text += `   • Username: ${j.username}\n`;
        text += `   • Password: ${j.rawPassword || '(Đã bảo mật)'}\n`;
      });
    }

    text += `----------------------------------------\n`;
    text += `📌 Đăng nhập tại hệ thống thi đấu CubeNexus.`;

    navigator.clipboard.writeText(text);
    setIsAllCopied(true);
    setTimeout(() => setIsAllCopied(false), 2500);
  };

  const copySingleCredential = (judge: TournamentJudgeDto, idx: number) => {
    const text = `Tài khoản Trọng tài: ${judge.displayName}\nUsername: ${judge.username}\nPassword: ${judge.rawPassword || ''}`;
    navigator.clipboard.writeText(text);
    setCopiedIndex(idx);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const togglePasswordVisibility = (judgeId: string) => {
    setVisiblePasswords((prev) => ({ ...prev, [judgeId]: !prev[judgeId] }));
  };

  const filteredJudges = judges.filter((j) => {
    const matchesSearch =
      j.displayName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      j.username.toLowerCase().includes(searchQuery.toLowerCase());

    if (!matchesSearch) return false;
    if (roleFilter === 'CHECKIN') return j.roleCode === 'CHECKIN_JUDGE';
    if (roleFilter === 'STATION') return j.roleCode === 'STATION_JUDGE' || j.assignedStationNumber;
    return true;
  });

  if (isLoading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  if (error || !tournament) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-10">
        <div className="rounded-2xl border border-rose-500/20 bg-rose-500/10 p-8 text-center text-rose-400">
          <AlertCircle className="h-8 w-8 mx-auto mb-2" />
          <p className="font-semibold">{error ?? 'Không tìm thấy thông tin giải đấu'}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-xs text-slate-500 font-medium flex-wrap">
        <Link href="/managertournaments" className="hover:text-slate-900 transition-colors">
          Giải Đấu
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <Link href={`/managertournaments/${id}`} className="hover:text-slate-900 transition-colors truncate max-w-[200px]">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-slate-300" />
        <span className="text-slate-900 font-bold">Quản Lý Trọng Tài</span>
      </div>

      {/* Header Banner */}
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <p className="text-[11px] font-bold text-indigo-600 uppercase tracking-wider">
              Hệ Thống Trọng Tài
            </p>
            <h1 className="text-2xl font-bold text-slate-900 tracking-tight mt-1">
              Danh Sách Trọng Tài Giải Đấu
            </h1>
            <p className="text-xs text-slate-500 mt-1">
              Khởi tạo, phân công bàn trực & bàn giao tài khoản trọng tài giải đấu.
            </p>
          </div>

          <div className="flex items-center gap-2.5 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white shadow-2xs transition cursor-pointer border-none"
            >
              Tạo Hàng Loạt Trọng Tài
            </button>

            <button
              onClick={() => setShowShuffleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
              title="Tráo đổi ngẫu nhiên vị trí trọng tài"
            >
              Tráo Vị Trí
            </button>

            <button
              onClick={() => setShowSingleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-lg border border-slate-200 bg-white hover:bg-slate-50 px-4 py-2.5 text-xs font-semibold text-slate-700 transition cursor-pointer shadow-2xs"
            >
              + Thêm Đơn Lẻ
            </button>

            <button
              onClick={handleActivateAllJudges}
              disabled={judges.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-emerald-200 bg-emerald-50 hover:bg-emerald-100 px-3 py-2.5 text-xs font-semibold text-emerald-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Mở khóa tất cả tài khoản trọng tài"
            >
              <Unlock className="h-3.5 w-3.5" />
              Mở Khóa Tất Cả
            </button>

            <button
              onClick={handleDeactivateAllJudges}
              disabled={judges.length === 0}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg border border-rose-200 bg-rose-50 hover:bg-rose-100 px-3 py-2.5 text-xs font-semibold text-rose-700 transition cursor-pointer shadow-2xs disabled:opacity-50"
              title="Vô hiệu hóa toàn bộ trọng tài giải đấu"
            >
              <PowerOff className="h-3.5 w-3.5" />
              Khóa Tất Cả
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 h-3.5 w-3.5 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trọng tài theo tên hoặc username..."
            className="w-full pl-9 pr-3 py-2 rounded-lg border border-slate-200 bg-white text-xs text-slate-800 placeholder-slate-400 outline-none focus:border-indigo-600 transition shadow-2xs"
          />
        </div>

        {/* Role Filter Segment */}
        <div className="flex items-center gap-1 bg-slate-100 border border-slate-200 p-1 rounded-lg">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === 'ALL' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Tất Cả ({judges.length})
          </button>
          <button
            onClick={() => setRoleFilter('CHECKIN')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === 'CHECKIN' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Check-in ({judges.filter(j => j.roleCode === 'CHECKIN_JUDGE').length})
          </button>
          <button
            onClick={() => setRoleFilter('STATION')}
            className={`flex-1 py-1.5 text-xs font-semibold rounded-md transition-all ${roleFilter === 'STATION' ? 'bg-white text-indigo-600 shadow-2xs font-bold' : 'text-slate-600 hover:text-slate-900'
              }`}
          >
            Trạm Bàn ({judges.filter(j => j.roleCode !== 'CHECKIN_JUDGE').length})
          </button>
        </div>

        <div className="rounded-lg border border-slate-200 bg-white px-4 py-2 flex items-center justify-between shadow-2xs">
          <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">Tổng Trọng Tài</span>
          <span className="text-xl font-bold text-indigo-600">{judges.length}</span>
        </div>
      </div>

      {/* Judges List Table */}
      {filteredJudges.length === 0 ? (
        <div className="rounded-xl border border-dashed border-slate-200 bg-white py-12 px-6 text-center space-y-3 shadow-2xs">
          <p className="text-slate-900 font-bold text-base">Chưa có Trọng tài nào cho giải đấu này</p>
          <p className="text-slate-500 text-xs max-w-md mx-auto">
            Bấm nút <strong className="text-indigo-600">"Tạo Hàng Loạt Trọng Tài"</strong> ở trên để khởi tạo nhanh hệ thống Trọng tài.
          </p>
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2.5 text-xs font-semibold text-white transition shadow-2xs cursor-pointer border-none"
          >
            Tạo Hàng Loạt Trọng Tài
          </button>
        </div>
      ) : (
        <div className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-slate-50/80 border-b border-slate-200 text-xs font-semibold text-slate-500 uppercase tracking-wider">
                  <th className="py-3.5 px-5 w-16 text-center">STT</th>
                  <th className="py-3.5 px-5">Tên Trọng Tài</th>
                  <th className="py-3.5 px-5">Vai Trò & Vị Trí Trực</th>
                  <th className="py-3.5 px-5">Trạng Thái</th>
                  <th className="py-3.5 px-5">Tài Khoản (Username)</th>
                  <th className="py-3.5 px-5">Mật Khẩu Ban Đầu</th>
                  <th className="py-3.5 px-5 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredJudges.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3.5 px-5 text-center font-mono font-bold text-slate-400 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-3.5 px-5">
                      <div className="flex items-center gap-3">
                        <div className="h-8 w-8 rounded-lg bg-indigo-50 border border-indigo-100 text-indigo-700 font-bold text-xs flex items-center justify-center shrink-0">
                          {j.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900 text-sm">{j.displayName}</p>
                          <span className="text-[10px] text-slate-400 font-mono">{j.userCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-3.5 px-5">
                      {renderRoleBadge(j)}
                    </td>
                    <td className="py-3.5 px-5">
                      {(j.isActive ?? true) ? (
                        <span className="inline-flex items-center gap-1 rounded bg-emerald-50 border border-emerald-200 px-2 py-0.5 text-[11px] font-semibold text-emerald-700">
                          Hoạt Động
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 rounded bg-rose-50 border border-rose-200 px-2 py-0.5 text-[11px] font-semibold text-rose-700">
                          Đã Khóa
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-5">
                      <span className="font-mono font-semibold text-slate-700 bg-slate-100 border border-slate-200 px-2.5 py-0.5 rounded text-xs">
                        {j.username}
                      </span>
                    </td>
                    <td className="py-3.5 px-5">
                      {j.rawPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-semibold text-emerald-700 bg-emerald-50 px-2.5 py-0.5 rounded border border-emerald-200">
                            {visiblePasswords[j.id] ? j.rawPassword : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(j.id)}
                            className="text-slate-400 hover:text-slate-700 p-1 transition-colors"
                            title="Hiện/Ẩn mật khẩu"
                          >
                            {visiblePasswords[j.id] ? (
                              <EyeOff className="h-3.5 w-3.5" />
                            ) : (
                              <Eye className="h-3.5 w-3.5" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-slate-400 italic">Đã bảo mật (Hash)</span>
                      )}
                    </td>
                    <td className="py-3.5 px-5 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        <button
                          onClick={() => handleToggleJudgeStatus(j)}
                          title={(j.isActive ?? true) ? 'Khóa tài khoản trọng tài' : 'Mở khóa tài khoản'}
                          className={`p-1.5 rounded-lg border transition-all shadow-2xs cursor-pointer ${
                            (j.isActive ?? true)
                              ? 'bg-white hover:bg-amber-50 border-slate-200 text-amber-600'
                              : 'bg-white hover:bg-emerald-50 border-slate-200 text-emerald-600'
                          }`}
                        >
                          {(j.isActive ?? true) ? <Lock className="h-3.5 w-3.5" /> : <Unlock className="h-3.5 w-3.5" />}
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJudge(j);
                            setShowResetPasswordModal(true);
                          }}
                          title="Đặt lại mật khẩu"
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg transition-all shadow-2xs"
                        >
                          <Key className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedJudge(j);
                            setEditName(j.displayName);
                            setEditRoleCode(j.roleCode || 'STATION_JUDGE');
                            setEditStationNumber(j.assignedStationNumber?.toString() || '');
                            setShowEditModal(true);
                          }}
                          title="Sửa thông tin trọng tài"
                          className="bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 p-1.5 rounded-lg transition-all shadow-2xs"
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </button>
                        <button
                          onClick={() => setJudgeToDelete(j)}
                          title="Xóa trọng tài"
                          className="bg-white hover:bg-red-50 border border-slate-200 text-red-600 p-1.5 rounded-lg transition-all cursor-pointer shadow-2xs"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 1: ADVANCED BATCH CREATE */}
      {/* ============================================================ */}
      {showBatchModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Cấu Hình Khởi Tạo Trọng Tài Hàng Loạt</h3>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleBatchCreate} className="space-y-4">
              {/* Parameter 1: Check-in Desk Count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Số Trọng Tài Bàn Check-in (Đón Tiếp)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={checkInCountInput}
                  onChange={(e) => setCheckInCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 1"
                />
              </div>

              {/* Parameter 2: Station Count */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Số Bàn Thi Đấu (Stations)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={stationCountInput}
                  onChange={(e) => setStationCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 5"
                />
              </div>

              {/* Parameter 3: Judges Per Station */}
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Số Trọng Tài Trực Cho 1 Bàn Thi
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={judgesPerStationInput}
                  onChange={(e) => setJudgesPerStationInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. 2 (1 Trực chính + 1 Hỗ trợ)"
                />
              </div>

              {/* Interactive Calculation Preview Card */}
              <div className="rounded-lg bg-slate-50 border border-slate-200 p-3.5 text-xs space-y-1.5">
                <p className="font-bold text-slate-900 text-xs">
                  Tổng số tài khoản sẽ tự động tạo:
                </p>
                <div className="space-y-1 text-slate-600 text-xs">
                  <p>• Check-in Desk: <strong className="text-slate-900">{checkInNum}</strong> người</p>
                  <p>• Khu Bàn thi: <strong className="text-slate-900">{stationNum} bàn</strong> x <strong className="text-slate-900">{perStationNum} người/bàn</strong> = <strong className="text-slate-900">{stationNum * perStationNum}</strong> người</p>
                  <p className="pt-2 border-t border-slate-200 font-bold text-xs text-slate-900 flex items-center justify-between">
                    <span>TỔNG CỘNG KHỞI TẠO:</span>
                    <span className="text-indigo-600 font-mono text-sm">{calculatedTotal} Trọng Tài</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isBatchSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isBatchSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Xác Nhận Tạo {calculatedTotal} Trọng Tài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: SHUFFLE / RANDOMIZE ASSIGNMENTS */}
      {/* ============================================================ */}
      {showShuffleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-lg rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Tráo Đổi Ngẫu Nhiên Vị Trí Trọng Tài</h3>
              <button
                onClick={() => setShowShuffleModal(false)}
                className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleShuffle} className="space-y-4">
              <p className="text-xs text-slate-500">
                Hệ thống sẽ giữ nguyên danh sách tài khoản & mật khẩu hiện tại, chỉ tráo đổi ngẫu nhiên vai trò (Check-in Desk vs Bàn thi số X) giữa các trọng tài.
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Số Trọng Tài Check-in Desk</label>
                <input
                  type="number" min="0" value={checkInCountInput} onChange={(e) => setCheckInCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Số Bàn Thi Đấu</label>
                <input
                  type="number" min="1" value={stationCountInput} onChange={(e) => setStationCountInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">Số Trọng Tài / 1 Bàn Thi</label>
                <input
                  type="number" min="1" value={judgesPerStationInput} onChange={(e) => setJudgesPerStationInput(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button" onClick={() => setShowShuffleModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit" disabled={isShuffleSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isShuffleSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Tráo Đổi Ngẫu Nhiên Vị Trí
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 2: SINGLE CREATE */}
      {/* ============================================================ */}
      {showSingleModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Thêm Trọng Tài Đơn Lẻ</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleSingleCreate} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Họ và Tên Trọng Tài <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 placeholder:text-slate-400 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Username (Tên đăng nhập) <span className="text-slate-400 font-normal lowercase">(Tự sinh nếu trống)</span>
                </label>
                <input
                  type="text"
                  value={singleUsername}
                  onChange={(e) => setSingleUsername(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. judge001"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Mật Khẩu Ban Đầu <span className="text-slate-400 font-normal lowercase">(Tự sinh nếu trống)</span>
                </label>
                <input
                  type="text"
                  value={singlePassword}
                  onChange={(e) => setSinglePassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. Judge@123456"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSingleSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isSingleSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Lưu Trọng Tài
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 3: HANDOVER CREDENTIALS (XUẤT & COPY DỮ LIỆU TÀI KHOẢN) */}
      {/* ============================================================ */}
      {showHandoverModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-2xl rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="text-base font-bold text-slate-900">Bàn Giao Tài Khoản Trọng Tài</h3>
                <p className="text-xs text-slate-500 mt-0.5">Mật khẩu thật dưới đây sẵn sàng để gửi cho các Trọng tài.</p>
              </div>
              <button onClick={() => setShowHandoverModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <div className="max-h-[50vh] overflow-y-auto space-y-2.5 pr-1">
              {handoverJudges.map((j, idx) => (
                <div key={j.id} className="flex items-center justify-between rounded-lg border border-slate-200 bg-slate-50 p-3 text-xs">
                  <div>
                    <p className="font-bold text-slate-900 text-xs">{j.displayName}</p>
                    <div className="flex items-center gap-3 mt-1 text-[11px] text-slate-600">
                      <span>Username: <strong className="font-mono text-slate-900">{j.username}</strong></span>
                      <span>Password: <strong className="font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-1.5 py-0.5 rounded">{j.rawPassword || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => copySingleCredential(j, idx)}
                    className="flex items-center gap-1 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 px-3 py-1.5 text-xs font-semibold text-slate-700 transition shrink-0 shadow-2xs"
                  >
                    {copiedIndex === idx ? (
                      <span className="text-emerald-600 font-bold">✓ Đã Copy</span>
                    ) : (
                      <span>Copy</span>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
              <span className="text-xs text-slate-500">
                Hãy sao chép và gửi danh sách thông tin này cho Trọng tài.
              </span>
              <div className="flex items-center gap-2 w-full sm:w-auto">
                <button
                  onClick={copyAllHandover}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition"
                >
                  {isAllCopied ? '✓ Đã Copy Tất Cả!' : 'Copy Tất Cả'}
                </button>
                <button
                  onClick={() => setShowHandoverModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Đóng
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 4: EDIT NAME */}
      {/* ============================================================ */}
      {showEditModal && selectedJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Sửa Tên Trọng Tài</h3>
              <button onClick={() => setShowEditModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleEditJudge} className="space-y-4">
              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Họ và Tên Mới
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 px-3 py-2 text-xs font-semibold outline-none focus:bg-white focus:border-indigo-600 transition"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isEditSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Cập Nhật Tên
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL 5: RESET PASSWORD */}
      {/* ============================================================ */}
      {showResetPasswordModal && selectedJudge && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-5 text-slate-900">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="text-base font-bold text-slate-900">Đặt Lại Mật Khẩu Trọng Tài</h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-slate-400 hover:text-slate-600 rounded-lg p-1 transition-colors">
                <X className="h-4 w-4" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-slate-500">
                Đặt lại mật khẩu mới cho <strong className="text-slate-900">{selectedJudge.displayName}</strong> ({selectedJudge.username}).
              </p>

              <div>
                <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1 font-mono">
                  Mật Khẩu Mới <span className="text-slate-400 font-normal lowercase">(Tự sinh nếu trống)</span>
                </label>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 text-slate-900 font-mono placeholder:text-slate-400 px-3 py-2 text-xs outline-none focus:bg-white focus:border-indigo-600 transition"
                  placeholder="e.g. NewPass@123"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="inline-flex items-center gap-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
                >
                  {isResetSubmitting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                  Cấp Mật Khẩu Mới
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================ */}
      {/* MODAL: CONFIRM DELETE JUDGE */}
      {/* ============================================================ */}
      {judgeToDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/40 backdrop-blur-xs p-4 animate-in fade-in duration-200">
          <div className="w-full max-w-md rounded-xl border border-slate-200 bg-white p-6 shadow-2xl space-y-4 text-center text-slate-900">
            <div>
              <h3 className="text-base font-bold text-slate-900">Xác Nhận Xóa Trọng Tài</h3>
              <p className="text-xs text-slate-500 mt-1">
                Bạn có chắc chắn muốn xóa trọng tài <strong className="text-slate-900">{judgeToDelete.displayName}</strong> (<span className="font-mono text-slate-700">{judgeToDelete.username}</span>) khỏi giải đấu không?
              </p>
              <p className="text-[11px] text-slate-400 mt-1 italic">Hành động này không thể hoàn tác.</p>
            </div>

            <div className="flex items-center justify-center gap-2 pt-2 border-t border-slate-100">
              <button
                type="button"
                onClick={() => setJudgeToDelete(null)}
                className="flex-1 rounded-lg border border-slate-200 bg-white px-3.5 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteJudge}
                className="flex-1 inline-flex items-center justify-center gap-1.5 rounded-lg bg-red-600 hover:bg-red-700 text-white font-semibold text-xs py-2 px-4 shadow-2xs transition disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
                Xóa Trọng Tài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
