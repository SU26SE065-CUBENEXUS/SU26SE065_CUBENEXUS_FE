'use client';

import React, { useState, useEffect } from 'react';
import {
  Zap,
  Settings,
  Users,
  Search,
  Sliders,
  CheckCircle2,
  AlertCircle,
  TrendingUp,
  TrendingDown,
  Award,
  RefreshCw,
  Plus,
  Minus,
  Save,
  X,
  ShieldAlert,
} from 'lucide-react';
import Link from 'next/link';
import {
  getEloConfig,
  updateEloConfig,
  getAdminPlayerEloList,
  adjustPlayerElo,
  EloConfigDto,
  AdminPlayerEloDto,
} from '@/features/online-arena/api/onlineArenaApi';

export default function AdminEloManagementPage() {
  const [activeTab, setActiveTab] = useState<'config' | 'players'>('config');

  // Config State
  const [config, setConfig] = useState<EloConfigDto | null>(null);
  const [isLoadingConfig, setIsLoadingConfig] = useState<boolean>(true);
  const [isSavingConfig, setIsSavingConfig] = useState<boolean>(false);
  const [configSuccess, setConfigSuccess] = useState<string | null>(null);
  const [configError, setConfigError] = useState<string | null>(null);

  // Form State for Config
  const [kStandard, setKStandard] = useState<number>(20);
  const [kPlacement, setKPlacement] = useState<number>(100);
  const [placementCount, setPlacementCount] = useState<number>(5);
  const [defaultElo, setDefaultElo] = useState<number>(1000);

  // Players State
  const [players, setPlayers] = useState<AdminPlayerEloDto[]>([]);
  const [isLoadingPlayers, setIsLoadingPlayers] = useState<boolean>(false);
  const [searchQuery, setSearchQuery] = useState<string>('');

  // Adjust Modal State
  const [selectedPlayer, setSelectedPlayer] = useState<AdminPlayerEloDto | null>(null);
  const [eloDelta, setEloDelta] = useState<number>(50);
  const [adjustReason, setAdjustReason] = useState<string>('');
  const [isSubmittingAdjust, setIsSubmittingAdjust] = useState<boolean>(false);
  const [adjustSuccess, setAdjustSuccess] = useState<string | null>(null);
  const [adjustError, setAdjustError] = useState<string | null>(null);

  useEffect(() => {
    fetchConfig();
    fetchPlayers();
  }, []);

  const fetchConfig = async () => {
    setIsLoadingConfig(true);
    setConfigError(null);
    try {
      const data = await getEloConfig();
      setConfig(data);
      setKStandard(data.kFactorStandard);
      setKPlacement(data.kFactorPlacement);
      setPlacementCount(data.placementMatchCount);
      setDefaultElo(data.defaultElo);
    } catch (err: any) {
      setConfigError(err?.message || 'Không thể tải cấu hình ELO.');
    } finally {
      setIsLoadingConfig(false);
    }
  };

  const fetchPlayers = async (search?: string) => {
    setIsLoadingPlayers(true);
    try {
      const data = await getAdminPlayerEloList(search);
      setPlayers(data);
    } catch (err: any) {
      console.warn('Failed to load player ELO list:', err);
    } finally {
      setIsLoadingPlayers(false);
    }
  };

  const handleSaveConfig = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingConfig(true);
    setConfigSuccess(null);
    setConfigError(null);

    try {
      const updated = await updateEloConfig({
        kFactorStandard: kStandard,
        kFactorPlacement: kPlacement,
        placementMatchCount: placementCount,
        defaultElo,
      });
      setConfig(updated);
      setConfigSuccess('Cập nhật cấu hình ELO hệ thống thành công!');
    } catch (err: any) {
      setConfigError(err?.message || 'Cập nhật thất bại.');
    } finally {
      setIsSavingConfig(false);
    }
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPlayers(searchQuery);
  };

  const handleAdjustSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPlayer) return;

    setIsSubmittingAdjust(true);
    setAdjustSuccess(null);
    setAdjustError(null);

    try {
      const res = await adjustPlayerElo(selectedPlayer.userId, {
        eloDelta,
        reason: adjustReason || 'ADMIN_MANUAL_ADJUST',
      });

      setAdjustSuccess(`Đã điều chỉnh ELO cho ${res.username}: ${res.eloBefore} ➔ ${res.eloAfter} (${res.delta > 0 ? '+' : ''}${res.delta} ELO)`);
      setTimeout(() => {
        setSelectedPlayer(null);
        setAdjustSuccess(null);
        fetchPlayers(searchQuery);
      }, 1800);
    } catch (err: any) {
      setAdjustError(err?.message || 'Điều chỉnh ELO thất bại.');
    } finally {
      setIsSubmittingAdjust(false);
    }
  };

  return (
    <div className="min-h-screen bg-zinc-900 text-zinc-100 p-4 sm:p-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-zinc-800 pb-6">
        <div>
          <div className="flex items-center gap-2 text-orange-400 text-xs font-bold uppercase tracking-wider">
            <Zap className="h-4 w-4 fill-orange-400" /> Administrative ELO Console
          </div>
          <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
            Quản Lý &amp; Cấu Hình ELO
          </h1>
          <p className="text-xs sm:text-sm text-zinc-400 mt-1">
            Thiết lập tham số K-Factor hệ thống và điều chỉnh ELO thủ công cho người chơi.
          </p>
        </div>

        {/* Tab Navigation & Quick Links */}
        <div className="flex flex-wrap items-center gap-3">
          <Link
            href="/admin/fraud-reports"
            className="px-3.5 py-2 text-xs font-bold rounded-xl bg-zinc-950 hover:bg-zinc-800 border border-zinc-800 text-rose-400 flex items-center gap-1.5 transition-all"
          >
            <ShieldAlert className="h-4 w-4" /> Báo Cáo Gian Lận
          </Link>
          <div className="flex items-center bg-zinc-950 p-1 rounded-xl border border-zinc-800">
            <button
              onClick={() => setActiveTab('config')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'config'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Sliders className="h-4 w-4" /> Cấu Hình Hệ Thống
            </button>
            <button
              onClick={() => setActiveTab('players')}
              className={`px-4 py-2 text-xs font-bold rounded-lg flex items-center gap-2 transition-all ${
                activeTab === 'players'
                  ? 'bg-orange-500 text-white shadow-lg shadow-orange-500/20'
                  : 'text-zinc-400 hover:text-white'
              }`}
            >
              <Users className="h-4 w-4" /> ELO Người Chơi
            </button>
          </div>
        </div>
      </div>

      {/* Tab 1: Cấu Hình Hệ Thống */}
      {activeTab === 'config' && (
        <div className="max-w-3xl mx-auto space-y-6">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl p-6 space-y-6 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800/80 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-white flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-400" /> Cấu Hình Tham Số ELO
                </h2>
                <p className="text-xs text-zinc-400">
                  Điều chỉnh hệ số K-Factor và số trận phân hạng toàn hệ thống.
                </p>
              </div>
              <button
                onClick={fetchConfig}
                disabled={isLoadingConfig}
                className="p-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-400 hover:text-white rounded-xl transition-all"
                title="Làm mới"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingConfig ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {configSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-4 rounded-xl text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-400" />
                <span>{configSuccess}</span>
              </div>
            )}

            {configError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-4 rounded-xl text-xs flex items-center gap-2 font-medium">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-400" />
                <span>{configError}</span>
              </div>
            )}

            {isLoadingConfig ? (
              <div className="py-12 text-center text-zinc-500 text-sm">Đang tải cấu hình...</div>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Standard K-Factor */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                      Hệ Số K (Chuẩn)
                    </label>
                    <input
                      type="number"
                      value={kStandard}
                      onChange={(e) => setKStandard(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                      min={1}
                      max={200}
                    />
                    <p className="text-[11px] text-zinc-500">
                      Mức độ biến động ELO cho mỗi trận đấu chuẩn (mặc định: 20).
                    </p>
                  </div>

                  {/* Placement K-Factor */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                      Hệ Số K (Phân Hạng)
                    </label>
                    <input
                      type="number"
                      value={kPlacement}
                      onChange={(e) => setKPlacement(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                      min={1}
                      max={300}
                    />
                    <p className="text-[11px] text-zinc-500">
                      Mức độ biến động ELO trong giai đoạn thi đấu phân hạng (mặc định: 100).
                    </p>
                  </div>

                  {/* Placement Matches Count */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                      Số Trận Phân Hạng
                    </label>
                    <input
                      type="number"
                      value={placementCount}
                      onChange={(e) => setPlacementCount(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                      min={0}
                      max={20}
                    />
                    <p className="text-[11px] text-zinc-500">
                      Số trận đầu tiên tài khoản phải hoàn thành để xếp hạng (mặc định: 5).
                    </p>
                  </div>

                  {/* Default ELO */}
                  <div className="bg-zinc-900/60 border border-zinc-800 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                      ELO Mặc Định Khi Tạo
                    </label>
                    <input
                      type="number"
                      value={defaultElo}
                      onChange={(e) => setDefaultElo(Number(e.target.value))}
                      className="w-full bg-zinc-950 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm focus:outline-none focus:border-orange-500"
                      min={100}
                      max={3000}
                    />
                    <p className="text-[11px] text-zinc-500">
                      Mức ELO khởi điểm cho người chơi mới (mặc định: 1000).
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-zinc-800 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingConfig ? 'Đang lưu...' : 'Lưu Cấu Hình ELO'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Tab 2: Qúan Lý & Điều Chỉnh ELO Người Chơi */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {/* Search & Action Bar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-zinc-950 border border-zinc-800 p-4 rounded-2xl">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-96">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-zinc-500" />
                <input
                  type="text"
                  placeholder="Tìm theo Tên hoặc User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-9 pr-4 py-2 text-xs text-white focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-white text-xs font-bold rounded-xl transition-all"
              >
                Tìm
              </button>
            </form>

            <button
              onClick={() => fetchPlayers(searchQuery)}
              disabled={isLoadingPlayers}
              className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 border border-zinc-800 text-zinc-300 text-xs font-bold rounded-xl transition-all flex items-center gap-2"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPlayers ? 'animate-spin' : ''}`} /> Tải Lại
            </button>
          </div>

          {/* Players Table */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl overflow-hidden shadow-xl">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-zinc-300">
                <thead className="bg-zinc-900/80 text-zinc-400 uppercase tracking-wider font-bold text-[10px] border-b border-zinc-800">
                  <tr>
                    <th className="px-5 py-3">Người Chơi</th>
                    <th className="px-5 py-3">ELO Hiện Tại</th>
                    <th className="px-5 py-3">Peak ELO</th>
                    <th className="px-5 py-3 text-center">Thắng / Thua / Hòa</th>
                    <th className="px-5 py-3">Trạng Thái</th>
                    <th className="px-5 py-3 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-800/60 font-medium">
                  {isLoadingPlayers ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                        Đang tải danh sách người chơi...
                      </td>
                    </tr>
                  ) : players.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-zinc-500">
                        Không tìm thấy người chơi nào.
                      </td>
                    </tr>
                  ) : (
                    players.map((p) => (
                      <tr key={p.userId} className="hover:bg-zinc-900/40 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-white flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center text-orange-400 font-bold border border-zinc-700">
                            {p.username.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <span className="block font-bold text-white">{p.username}</span>
                            <span className="text-[10px] text-zinc-500 font-mono">{p.userId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-black text-amber-400 text-sm">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 fill-amber-400" /> {p.eloStandard}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-zinc-400">
                          {p.peakEloStandard}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-semibold">
                          <span className="text-emerald-400">{p.totalWinsStandard}</span> /{' '}
                          <span className="text-rose-400">{p.totalLossesStandard}</span> /{' '}
                          <span className="text-zinc-400">{p.totalDrawsStandard}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.isPlacementCompleteStandard ? (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                              Official
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded-md text-[10px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-400 border border-amber-500/20">
                              Placement ({p.placementMatchesDoneStandard}/5)
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3.5 text-right">
                          <button
                            onClick={() => {
                              setSelectedPlayer(p);
                              setEloDelta(50);
                              setAdjustReason('');
                              setAdjustSuccess(null);
                              setAdjustError(null);
                            }}
                            className="px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500/20 text-orange-400 border border-orange-500/30 rounded-lg text-xs font-bold transition-all cursor-pointer"
                          >
                            Điều Chỉnh ELO
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Manual ELO Adjust Modal */}
      {selectedPlayer && (
        <div className="fixed inset-0 z-50 overflow-y-auto bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl w-full max-w-md p-6 relative space-y-5 shadow-2xl text-left">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-400 hover:text-white hover:bg-zinc-900 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-bold text-orange-400 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 fill-orange-400" /> Manual ELO Adjustment
              </div>
              <h3 className="text-xl font-black text-white tracking-tight">
                Thay Đổi ELO: {selectedPlayer.username}
              </h3>
              <p className="text-xs text-zinc-400 font-mono">
                ELO Hiện tại: <strong className="text-amber-400 font-bold">{selectedPlayer.eloStandard}</strong>
              </p>
            </div>

            {adjustSuccess && (
              <div className="bg-emerald-500/10 border border-emerald-500/30 text-emerald-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-400 shrink-0" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            {adjustError && (
              <div className="bg-rose-500/10 border border-rose-500/30 text-rose-400 p-3 rounded-xl text-xs font-semibold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-400 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* ELO Delta Input */}
              <div className="space-y-2">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Giá Trị Điều Chỉnh ELO (+ hoặc -)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEloDelta((prev) => (prev > 0 ? -prev : prev))}
                    className={`px-3 py-2 rounded-lg font-bold text-xs border uppercase transition-all ${
                      eloDelta < 0
                        ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Trừ (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEloDelta((prev) => Math.abs(prev))}
                    className={`px-3 py-2 rounded-lg font-bold text-xs border uppercase transition-all ${
                      eloDelta > 0
                        ? 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                        : 'bg-zinc-900 text-zinc-400 border-zinc-800'
                    }`}
                  >
                    Cộng (+)
                  </button>
                  <input
                    type="number"
                    value={eloDelta}
                    onChange={(e) => setEloDelta(Number(e.target.value))}
                    className="flex-1 bg-zinc-900 border border-zinc-800 rounded-lg px-3 py-2 text-white font-mono text-sm font-bold focus:outline-none focus:border-orange-500"
                    required
                  />
                </div>
                <p className="text-[11px] text-zinc-500">
                  Ví dụ: <code className="text-emerald-400">+50</code> hoặc <code className="text-rose-400">-30</code>. ELO sau thay đổi: <strong className="text-white">{Math.max(0, selectedPlayer.eloStandard + eloDelta)}</strong>
                </p>
              </div>

              {/* Reason Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-bold uppercase tracking-wider text-zinc-300 block">
                  Lý Do / Ghi Chú Admin
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Nhập lý do (ví dụ: Xử lý khiếu nại trận đấu #1234, Thưởng giải đấu...)"
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-orange-500 min-h-[80px]"
                />
              </div>

              <div className="pt-3 border-t border-zinc-800 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="px-4 py-2 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs uppercase tracking-wider rounded-xl transition-all shadow-lg shadow-orange-500/20"
                >
                  {isSubmittingAdjust ? 'Đang lưu...' : 'Xác Nhận Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
