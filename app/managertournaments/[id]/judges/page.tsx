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

  // Role Badge Helper
  const renderRoleBadge = (j: TournamentJudgeDto) => {
    if (j.roleCode === 'CHECKIN_JUDGE') {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-cyan-500/10 border border-cyan-500/20 px-2 py-0.5 text-[10px] font-bold text-cyan-400">
          <QrCode className="h-3 w-3" /> CHECK-IN DESK
        </span>
      );
    }
    if (j.assignedStationNumber) {
      return (
        <span className="inline-flex items-center gap-1 rounded-md bg-amber-500/10 border border-amber-500/20 px-2 py-0.5 text-[10px] font-bold text-amber-400">
          <ShieldCheck className="h-3 w-3" /> BÀN THI SỐ {j.assignedStationNumber}
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1 rounded-md bg-zinc-800 border border-zinc-700 px-2 py-0.5 text-[10px] font-bold text-zinc-400">
        TRỌNG TÀI DỰ PHÒNG
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
      <div className="flex items-center gap-2 text-xs text-zinc-400 font-medium flex-wrap">
        <Trophy className="h-3.5 w-3.5 text-amber-500" />
        <Link href="/managertournaments" className="hover:text-white transition-colors">
          Tournaments
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
        <Link href={`/managertournaments/${id}`} className="hover:text-white transition-colors truncate max-w-[200px]">
          {tournament.name}
        </Link>
        <ChevronRight className="h-3.5 w-3.5 text-zinc-600" />
        <span className="text-amber-400 font-bold">Quản Lý Trọng Tài (Judges)</span>
      </div>

      {/* Hero Action Header Banner */}
      <div className="relative overflow-hidden rounded-3xl border border-zinc-800/80 bg-zinc-900/60 p-6 md:p-8 backdrop-blur-md shadow-2xl">
        <div className="absolute inset-0 bg-gradient-to-r from-amber-500/10 via-orange-500/5 to-transparent pointer-events-none" />

        <div className="relative flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center shrink-0 shadow-lg shadow-amber-500/5">
              <UserCheck className="h-7 w-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-black tracking-widest px-2.5 py-0.5 rounded-full uppercase">
                  Tournament Referee Suite
                </span>
              </div>
              <h1 className="text-2xl md:text-3xl font-black text-white tracking-tight mt-1">
                Danh Sách Trọng Tài Giải Đấu
              </h1>
              <p className="text-xs md:text-sm text-zinc-400 mt-1">
                Tự động khởi tạo, phân công bàn trực & bàn giao tài khoản trọng tài giải đấu.
              </p>
            </div>
          </div>

          <div className="flex items-center gap-3 flex-wrap sm:flex-nowrap shrink-0">
            <button
              onClick={() => setShowBatchModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 px-5 py-3 text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] active:scale-95 cursor-pointer"
            >
              <Zap className="h-4 w-4 fill-white text-white" />
              ⚡ Tạo Hàng Loạt Theo Cấu Hình
            </button>

            <button
              onClick={() => setShowShuffleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-4 py-3 text-xs font-black text-amber-400 uppercase tracking-wider transition-all cursor-pointer"
              title="Tráo đổi ngẫu nhiên vị trí trọng tài"
            >
              <Shuffle className="h-4 w-4 text-amber-400" />
              🔀 Tráo Vị Trí
            </button>

            <button
              onClick={() => setShowSingleModal(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl border border-zinc-800 bg-zinc-950 hover:bg-zinc-900 px-4 py-3 text-xs font-black text-zinc-300 uppercase tracking-wider transition-all cursor-pointer"
            >
              <Plus className="h-4 w-4 text-zinc-400" />
              + Thêm Đơn Lẻ
            </button>
          </div>
        </div>
      </div>

      {/* Search Bar & Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="md:col-span-2 relative">
          <Search className="absolute left-4 top-3.5 h-4 w-4 text-zinc-500" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Tìm kiếm trọng tài theo tên hoặc username..."
            className="w-full pl-11 pr-4 py-3 rounded-2xl border border-zinc-800 bg-zinc-950/80 text-sm text-white placeholder:text-zinc-500 outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
          />
        </div>

        {/* Role Filter Segment */}
        <div className="flex items-center gap-1 bg-zinc-950/80 border border-zinc-800 p-1 rounded-2xl">
          <button
            onClick={() => setRoleFilter('ALL')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              roleFilter === 'ALL' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Tất Cả ({judges.length})
          </button>
          <button
            onClick={() => setRoleFilter('CHECKIN')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              roleFilter === 'CHECKIN' ? 'bg-cyan-500/20 text-cyan-400 border border-cyan-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Check-in ({judges.filter(j => j.roleCode === 'CHECKIN_JUDGE').length})
          </button>
          <button
            onClick={() => setRoleFilter('STATION')}
            className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${
              roleFilter === 'STATION' ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30' : 'text-zinc-400 hover:text-white'
            }`}
          >
            Trạm Bàn ({judges.filter(j => j.roleCode !== 'CHECKIN_JUDGE').length})
          </button>
        </div>

        <div className="rounded-2xl border border-zinc-800/80 bg-zinc-900/60 px-5 py-3 flex items-center justify-between shadow-lg">
          <span className="text-xs font-black text-zinc-400 uppercase tracking-widest">Tổng Trọng Tài</span>
          <span className="text-2xl font-black text-amber-400 font-mono">{judges.length}</span>
        </div>
      </div>

      {/* Judges List Table */}
      {filteredJudges.length === 0 ? (
        <div className="rounded-3xl border border-dashed border-zinc-800 bg-zinc-900/40 py-16 px-6 text-center space-y-4 shadow-2xl">
          <div className="h-16 w-16 rounded-3xl bg-zinc-800/80 border border-zinc-700 text-zinc-500 flex items-center justify-center mx-auto shadow-inner">
            <UserCheck className="h-8 w-8 text-zinc-400" />
          </div>
          <div>
            <p className="text-white font-black text-lg">Chưa có Trọng tài nào cho giải đấu này</p>
            <p className="text-zinc-400 text-xs mt-1 max-w-md mx-auto">
              Bấm nút <strong className="text-amber-400">"⚡ Tạo Hàng Loạt Theo Cấu Hình"</strong> ở trên để khởi tạo nhanh hệ thống Trọng tài.
            </p>
          </div>
          <button
            onClick={() => setShowBatchModal(true)}
            className="inline-flex items-center gap-2 rounded-2xl bg-amber-500 hover:bg-amber-600 px-5 py-3 text-xs font-black text-white uppercase tracking-wider shadow-lg shadow-amber-500/20 transition-all hover:scale-[1.02] cursor-pointer"
          >
            <Zap className="h-4 w-4 fill-white text-white" />
            Tạo Hàng Loạt Trọng Tài
          </button>
        </div>
      ) : (
        <div className="rounded-3xl border border-zinc-800/80 bg-zinc-900/60 shadow-2xl overflow-hidden backdrop-blur-md">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm border-collapse">
              <thead>
                <tr className="bg-zinc-950/80 border-b border-zinc-800/80 text-[10px] font-black text-zinc-400 uppercase tracking-widest">
                  <th className="py-4 px-6 w-16 text-center">STT</th>
                  <th className="py-4 px-6">Tên Trọng Tài</th>
                  <th className="py-4 px-6">Vai Trò & Vị Trí Trực</th>
                  <th className="py-4 px-6">Tài Khoản (Username)</th>
                  <th className="py-4 px-6">Mật Khẩu Ban Đầu</th>
                  <th className="py-4 px-6 text-right">Thao Tác</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-800/50">
                {filteredJudges.map((j, idx) => (
                  <tr key={j.id} className="hover:bg-zinc-800/40 transition-colors">
                    <td className="py-4 px-6 text-center font-mono font-bold text-zinc-500 text-xs">
                      {idx + 1}
                    </td>
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <div className="h-10 w-10 rounded-xl bg-gradient-to-tr from-amber-500 to-orange-600 font-black text-white text-sm shadow-md flex items-center justify-center shrink-0">
                          {j.displayName.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-white text-sm">{j.displayName}</p>
                          <span className="text-[10px] text-zinc-500 font-mono">{j.userCode}</span>
                        </div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      {renderRoleBadge(j)}
                    </td>
                    <td className="py-4 px-6">
                      <span className="font-mono font-bold text-amber-300 bg-amber-500/10 border border-amber-500/20 px-2.5 py-1 rounded-lg text-xs">
                        {j.username}
                      </span>
                    </td>
                    <td className="py-4 px-6">
                      {j.rawPassword ? (
                        <div className="flex items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-400 bg-emerald-500/10 px-3 py-1 rounded-xl border border-emerald-500/20">
                            {visiblePasswords[j.id] ? j.rawPassword : '••••••••'}
                          </span>
                          <button
                            onClick={() => togglePasswordVisibility(j.id)}
                            className="text-zinc-400 hover:text-white p-1 transition-colors"
                            title="Hiện/Ẩn mật khẩu"
                          >
                            {visiblePasswords[j.id] ? (
                              <EyeOff className="h-4 w-4" />
                            ) : (
                              <Eye className="h-4 w-4" />
                            )}
                          </button>
                        </div>
                      ) : (
                        <span className="text-xs text-zinc-500 italic">Đã bảo mật (Hash)</span>
                      )}
                    </td>
                    <td className="py-4 px-6 text-right">
                      <div className="flex items-center justify-end gap-2">
                        <button
                          onClick={() => {
                            setSelectedJudge(j);
                            setShowResetPasswordModal(true);
                          }}
                          title="Đặt lại mật khẩu"
                          className="bg-amber-500/10 hover:bg-amber-500/20 border border-amber-500/30 text-amber-400 p-2 rounded-xl transition-all"
                        >
                          <Key className="h-4 w-4" />
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
                          className="bg-zinc-800 hover:bg-zinc-700 border border-zinc-700 text-zinc-300 p-2 rounded-xl transition-all"
                        >
                          <Pencil className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => setJudgeToDelete(j)}
                          title="Xóa trọng tài"
                          className="bg-rose-500/10 hover:bg-rose-500/20 border border-rose-500/30 text-rose-400 p-2 rounded-xl transition-all cursor-pointer"
                        >
                          <Trash2 className="h-4 w-4" />
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Zap className="h-6 w-6 fill-amber-400 text-amber-400" />
                <h3 className="text-lg font-black text-white tracking-tight">Cấu Hình Khởi Tạo Trọng Tài Hàng Loạt</h3>
              </div>
              <button
                onClick={() => setShowBatchModal(false)}
                className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleBatchCreate} className="space-y-5">
              {/* Parameter 1: Check-in Desk Count */}
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <QrCode className="h-4 w-4 text-cyan-400" /> Số Trọng Tài Bàn Check-in (Đón Tiếp)
                </label>
                <input
                  type="number"
                  min="0"
                  max="10"
                  value={checkInCountInput}
                  onChange={(e) => setCheckInCountInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white px-4 py-3 text-sm font-bold outline-none focus:border-cyan-500/60 focus:ring-1 focus:ring-cyan-500/30 transition-all"
                  placeholder="e.g. 1"
                />
              </div>

              {/* Parameter 2: Station Count */}
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <ShieldCheck className="h-4 w-4 text-amber-400" /> Số Bàn Thi Đấu (Stations)
                </label>
                <input
                  type="number"
                  min="1"
                  max="20"
                  value={stationCountInput}
                  onChange={(e) => setStationCountInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  placeholder="e.g. 5"
                />
              </div>

              {/* Parameter 3: Judges Per Station */}
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5 flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-orange-400" /> Số Trọng Tài Trực Cho 1 Bàn Thi
                </label>
                <input
                  type="number"
                  min="1"
                  max="5"
                  value={judgesPerStationInput}
                  onChange={(e) => setJudgesPerStationInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white px-4 py-3 text-sm font-bold outline-none focus:border-orange-500/60 focus:ring-1 focus:ring-orange-500/30 transition-all"
                  placeholder="e.g. 2 (1 Trực chính + 1 Hỗ trợ)"
                />
              </div>

              {/* Interactive Calculation Preview Card */}
              <div className="rounded-2xl bg-zinc-950 border border-zinc-800 p-4 text-xs space-y-2">
                <p className="font-bold text-amber-400 flex items-center gap-1.5">
                  <Sparkles className="h-4 w-4" /> Tổng số tài khoản sẽ tự động tạo:
                </p>
                <div className="space-y-1 text-zinc-300 font-medium pl-1">
                  <p>• Check-in Desk: <strong className="text-cyan-400">{checkInNum}</strong> người</p>
                  <p>• Khu Bàn thi: <strong className="text-amber-400">{stationNum} bàn</strong> x <strong className="text-amber-400">{perStationNum} người/bàn</strong> = <strong className="text-amber-400">{stationNum * perStationNum}</strong> người</p>
                  <p className="pt-2 border-t border-zinc-800/80 font-black text-sm text-white flex items-center justify-between">
                    <span>⚡ TỔNG CỘNG KHỞI TẠO:</span>
                    <span className="text-amber-400 font-mono text-base">{calculatedTotal} Trọng Tài</span>
                  </p>
                </div>
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowBatchModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all cursor-pointer"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isBatchSubmitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer"
                >
                  {isBatchSubmitting ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Zap className="h-4 w-4 fill-white text-white" />
                  )}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-lg rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-2 text-amber-400">
                <Shuffle className="h-6 w-6 text-amber-400" />
                <h3 className="text-lg font-black text-white tracking-tight">Tráo Đổi Ngẫu Nhiên Vị Trí Trọng Tài</h3>
              </div>
              <button
                onClick={() => setShowShuffleModal(false)}
                className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleShuffle} className="space-y-5">
              <p className="text-xs text-zinc-400">
                Hệ thống sẽ giữ nguyên danh sách tài khoản & mật khẩu hiện tại, chỉ tráo đổi ngẫu nhiên vai trò (Check-in Desk vs Bàn thi số X) giữa các trọng tài.
              </p>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Số Trọng Tài Check-in Desk</label>
                <input
                  type="number" min="0" value={checkInCountInput} onChange={(e) => setCheckInCountInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Số Bàn Thi Đấu</label>
                <input
                  type="number" min="1" value={stationCountInput} onChange={(e) => setStationCountInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/60"
                />
              </div>
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-1.5">Số Trọng Tài / 1 Bàn Thi</label>
                <input
                  type="number" min="1" value={judgesPerStationInput} onChange={(e) => setJudgesPerStationInput(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white px-4 py-3 text-sm font-bold outline-none focus:border-amber-500/60"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-2">
                <button
                  type="button" onClick={() => setShowShuffleModal(false)}
                  className="bg-zinc-800 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit" disabled={isShuffleSubmitting}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl uppercase cursor-pointer"
                >
                  {isShuffleSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Shuffle className="h-4 w-4" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white tracking-tight">Thêm Trọng Tài Đơn Lẻ</h3>
              <button onClick={() => setShowSingleModal(false)} className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSingleCreate} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Họ và Tên Trọng Tài <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={singleName}
                  onChange={(e) => setSingleName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  placeholder="e.g. Nguyễn Văn A"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Username (Tên đăng nhập) <span className="text-zinc-500 font-normal lowercase">(Tự sinh nếu trống)</span>
                </label>
                <input
                  type="text"
                  value={singleUsername}
                  onChange={(e) => setSingleUsername(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-amber-300 font-mono placeholder:text-zinc-600 px-4 py-3 text-xs outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  placeholder="e.g. judge001"
                />
              </div>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Mật Khẩu Ban Đầu <span className="text-zinc-500 font-normal lowercase">(Tự sinh nếu trống)</span>
                </label>
                <input
                  type="text"
                  value={singlePassword}
                  onChange={(e) => setSinglePassword(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-emerald-400 font-mono placeholder:text-zinc-600 px-4 py-3 text-xs outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  placeholder="e.g. Judge@123456"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowSingleModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isSingleSubmitting}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isSingleSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-2xl rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <div className="flex items-center gap-3 text-emerald-400">
                <div className="h-10 w-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <CheckCircle className="h-6 w-6 text-emerald-400" />
                </div>
                <div>
                  <h3 className="text-lg font-black text-white tracking-tight">Bàn Giao Tài Khoản Trọng Tài</h3>
                  <p className="text-xs text-zinc-400">Mật khẩu thật dưới đây sẵn sàng để gửi cho các Trọng tài.</p>
                </div>
              </div>
              <button onClick={() => setShowHandoverModal(false)} className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="max-h-[55vh] overflow-y-auto space-y-3 pr-1">
              {handoverJudges.map((j, idx) => (
                <div key={j.id} className="flex items-center justify-between rounded-2xl border border-zinc-800 bg-zinc-950 p-4">
                  <div>
                    <p className="font-bold text-white text-sm">{j.displayName}</p>
                    <div className="flex items-center gap-3 mt-1.5 text-xs">
                      <span className="text-zinc-400">Username: <strong className="font-mono text-amber-300">{j.username}</strong></span>
                      <span className="text-zinc-400">Password: <strong className="font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-lg">{j.rawPassword || 'N/A'}</strong></span>
                    </div>
                  </div>

                  <button
                    onClick={() => copySingleCredential(j, idx)}
                    className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 hover:bg-zinc-800 px-3.5 py-2 text-xs font-bold text-zinc-200 transition-all shrink-0 cursor-pointer"
                  >
                    {copiedIndex === idx ? (
                      <>
                        <CheckCircle className="h-3.5 w-3.5 text-emerald-400" />
                        <span className="text-emerald-400">Đã Copy</span>
                      </>
                    ) : (
                      <>
                        <Copy className="h-3.5 w-3.5 text-zinc-400" />
                        Copy
                      </>
                    )}
                  </button>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-zinc-800 flex flex-col sm:flex-row items-center justify-between gap-4">
              <span className="text-xs text-zinc-400">
                Hãy sao chép và gửi danh sách thông tin này cho Trọng tài.
              </span>
              <div className="flex items-center gap-3 w-full sm:w-auto">
                <button
                  onClick={copyAllHandover}
                  className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-2 rounded-2xl bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 px-6 py-3.5 text-xs font-extrabold text-white uppercase tracking-wider shadow-lg shadow-emerald-500/20 transition-all cursor-pointer"
                >
                  {isAllCopied ? (
                    <>
                      <CheckCircle className="h-4 w-4" />
                      Đã Copy Tất Cả Dữ Liệu!
                    </>
                  ) : (
                    <>
                      <Share2 className="h-4 w-4" />
                      📋 Copy Tất Cả (Gửi Zalo/Excel)
                    </>
                  )}
                </button>
                <button
                  onClick={() => setShowHandoverModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all"
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white tracking-tight">Sửa Tên Trọng Tài</h3>
              <button onClick={() => setShowEditModal(false)} className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleEditJudge} className="space-y-4">
              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Họ và Tên Mới
                </label>
                <input
                  type="text"
                  required
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-white placeholder:text-zinc-600 px-4 py-3 text-sm font-semibold outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowEditModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isEditSubmitting}
                  className="inline-flex items-center gap-2 bg-amber-500 hover:bg-amber-600 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isEditSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-zinc-800 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-6 relative overflow-hidden">
            <div className="flex items-center justify-between pb-4 border-b border-zinc-800">
              <h3 className="text-lg font-black text-white tracking-tight">Đặt Lại Mật Khẩu Trọng Tài</h3>
              <button onClick={() => setShowResetPasswordModal(false)} className="text-zinc-400 hover:text-white rounded-xl p-1 transition-colors">
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleResetPassword} className="space-y-4">
              <p className="text-xs text-zinc-400">
                Đặt lại mật khẩu mới cho <strong className="text-white">{selectedJudge.displayName}</strong> ({selectedJudge.username}).
              </p>

              <div>
                <label className="block text-xs font-black text-zinc-400 uppercase tracking-widest mb-2">
                  Mật Khẩu Mới <span className="text-zinc-500 font-normal lowercase">(Tự sinh nếu trống)</span>
                </label>
                <input
                  type="text"
                  value={resetNewPassword}
                  onChange={(e) => setResetNewPassword(e.target.value)}
                  className="w-full rounded-2xl border border-zinc-800 bg-zinc-950 text-emerald-400 font-mono placeholder:text-zinc-600 px-4 py-3 text-xs outline-none focus:border-amber-500/60 focus:ring-1 focus:ring-amber-500/30 transition-all"
                  placeholder="e.g. NewPass@123"
                />
              </div>

              <div className="flex items-center justify-end gap-3 pt-3">
                <button
                  type="button"
                  onClick={() => setShowResetPasswordModal(false)}
                  className="bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all"
                >
                  Hủy Bỏ
                </button>
                <button
                  type="submit"
                  disabled={isResetSubmitting}
                  className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500 to-orange-600 hover:from-amber-600 hover:to-orange-700 text-white font-extrabold text-xs py-3.5 px-6 rounded-2xl shadow-lg shadow-amber-500/20 uppercase tracking-wider transition-all disabled:opacity-50"
                >
                  {isResetSubmitting && <Loader2 className="h-4 w-4 animate-spin" />}
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
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-fade-in">
          <div className="w-full max-w-md rounded-3xl border border-rose-500/30 bg-zinc-900 p-6 md:p-8 shadow-2xl space-y-5 text-center relative overflow-hidden">
            <div className="h-14 w-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto shadow-lg">
              <Trash2 className="h-7 w-7" />
            </div>

            <div>
              <h3 className="text-lg font-black text-white tracking-tight">Xác Nhận Xóa Trọng Tài</h3>
              <p className="text-xs text-zinc-400 mt-2">
                Bạn có chắc chắn muốn xóa trọng tài <strong className="text-rose-400">{judgeToDelete.displayName}</strong> (<span className="font-mono text-zinc-300">{judgeToDelete.username}</span>) khỏi giải đấu không?
              </p>
              <p className="text-[11px] text-zinc-500 mt-1 italic">Hành động này không thể hoàn tác.</p>
            </div>

            <div className="flex items-center justify-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setJudgeToDelete(null)}
                className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-extrabold text-xs py-3.5 px-5 rounded-2xl uppercase tracking-wider transition-all cursor-pointer"
              >
                Hủy Bỏ
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={confirmDeleteJudge}
                className="flex-1 inline-flex items-center justify-center gap-2 bg-rose-600 hover:bg-rose-700 text-white font-extrabold text-xs py-3.5 px-5 rounded-2xl shadow-lg shadow-rose-600/20 uppercase tracking-wider transition-all cursor-pointer disabled:opacity-50"
              >
                {isDeleting ? <Loader2 className="h-4 w-4 animate-spin" /> : <Trash2 className="h-4 w-4" />}
                Xóa Trọng Tài
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
