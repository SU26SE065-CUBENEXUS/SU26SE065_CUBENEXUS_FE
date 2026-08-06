'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
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
  Save,
  X,
  ShieldAlert,
  HelpCircle,
  Calculator,
  ArrowUpRight,
  ArrowDownRight,
  LayoutDashboard,
  Info,
} from 'lucide-react';
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

  // Live ELO Simulator Demo State
  const [simP1Elo, setSimP1Elo] = useState<number>(1000);
  const [simP2Elo, setSimP2Elo] = useState<number>(1000);

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
      setPlayers(data || []);
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

      setAdjustSuccess(
        `Đã điều chỉnh ELO cho ${res.username}: ${res.eloBefore} ➔ ${res.eloAfter} (${res.delta > 0 ? '+' : ''}${res.delta} ELO)`
      );
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

  // ELO Formula Simulation Math
  const calcExpected = (rA: number, rB: number) => 1 / (1 + Math.pow(10, (rB - rA) / 400));
  const expectedP1 = calcExpected(simP1Elo, simP2Elo);
  const expectedP2 = calcExpected(simP2Elo, simP1Elo);

  // Standard match win deltas
  const p1WinGainStd = Math.round(kStandard * (1 - expectedP1));
  const p2WinGainStd = Math.round(kStandard * (1 - expectedP2));

  // Placement match win deltas
  const p1WinGainPlc = Math.round(kPlacement * (1 - expectedP1));
  const p2WinGainPlc = Math.round(kPlacement * (1 - expectedP2));

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 space-y-6 max-w-7xl mx-auto">
      {/* Top Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div>
          <div className="flex items-center gap-2">
            <span className="px-3 py-1 text-[10px] font-extrabold uppercase tracking-wider bg-orange-50 text-orange-600 border border-orange-200 rounded-full flex items-center gap-1.5">
              <Zap className="h-3.5 w-3.5 fill-orange-500 text-orange-500" /> ADMIN ELO MANAGEMENT CONSOLE
            </span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight text-slate-900 mt-2">
            Quản Lý &amp; Cấu Hình ELO Hệ Thống
          </h1>
          <p className="text-xs sm:text-sm text-slate-500 mt-1">
            Cấu hình công thức ELO chuẩn quốc tế (K-Factor) và hỗ trợ Admin cộng/trừ ELO trực tiếp cho người chơi.
          </p>
        </div>

        {/* Quick Nav Links */}
        <div className="flex flex-wrap items-center gap-2.5 shrink-0">
          <Link
            href="/admin/fraud-reports"
            className="px-4 py-2.5 rounded-xl bg-rose-50 hover:bg-rose-100 border border-rose-200 text-xs font-bold text-rose-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <ShieldAlert className="h-4 w-4 text-rose-600" />
            <span>Fraud Reports Queue</span>
          </Link>
          <Link
            href="/managertournaments"
            className="px-4 py-2.5 rounded-xl bg-slate-100 hover:bg-slate-200 border border-slate-200 text-xs font-bold text-slate-700 transition-all flex items-center gap-2 cursor-pointer shadow-2xs"
          >
            <LayoutDashboard className="h-4 w-4 text-slate-600" />
            <span>Dashboard</span>
          </Link>
        </div>
      </div>

      {/* Main Tab Controls */}
      <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs w-fit">
        <button
          onClick={() => setActiveTab('config')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'config'
            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Sliders className="h-4 w-4" /> Cấu Hình Tham Số ELO
        </button>
        <button
          onClick={() => setActiveTab('players')}
          className={`px-5 py-2.5 text-xs font-extrabold rounded-xl flex items-center gap-2 transition-all cursor-pointer ${activeTab === 'players'
            ? 'bg-orange-500 text-white shadow-md shadow-orange-500/20'
            : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
            }`}
        >
          <Users className="h-4 w-4" /> Bảng ELO Người Chơi
        </button>
      </div>

      {/* Tab 1: Cấu Hình Tham Số ELO */}
      {activeTab === 'config' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
          {/* Form Cấu Hình chính */}
          <div className="lg:col-span-7 bg-white border border-slate-200 rounded-2xl p-6 space-y-6 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-4">
              <div className="space-y-0.5">
                <h2 className="text-lg font-bold text-slate-900 flex items-center gap-2">
                  <Settings className="h-5 w-5 text-orange-500" /> Thiết Lập Chỉ Số ELO
                </h2>
                <p className="text-xs text-slate-500">
                  Điều chỉnh hệ số K-Factor và tham số khởi tạo xếp hạng cho hệ thống Online Arena.
                </p>
              </div>
              <button
                onClick={fetchConfig}
                disabled={isLoadingConfig}
                className="p-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-600 hover:text-slate-900 rounded-xl transition-all cursor-pointer"
                title="Tải lại"
              >
                <RefreshCw className={`h-4 w-4 ${isLoadingConfig ? 'animate-spin' : ''}`} />
              </button>
            </div>

            {configSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-4 rounded-xl text-xs flex items-center gap-2 font-bold">
                <CheckCircle2 className="h-4 w-4 shrink-0 text-emerald-600" />
                <span>{configSuccess}</span>
              </div>
            )}

            {configError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-4 rounded-xl text-xs flex items-center gap-2 font-bold">
                <AlertCircle className="h-4 w-4 shrink-0 text-rose-600" />
                <span>{configError}</span>
              </div>
            )}

            {isLoadingConfig ? (
              <div className="py-12 text-center text-slate-400 text-sm font-medium">Đang tải cấu hình ELO...</div>
            ) : (
              <form onSubmit={handleSaveConfig} className="space-y-5">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* K-Factor Standard */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Hệ Số K-Factor (Chuẩn)
                    </label>
                    <input
                      type="number"
                      value={kStandard}
                      onChange={(e) => setKStandard(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
                      min={1}
                      max={200}
                      required
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Mức độ biến động ELO tối đa cho trận đấu chính thức (Mặc định: <strong>20</strong>).
                    </p>
                  </div>

                  {/* K-Factor Placement */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Hệ Số K-Factor (Phân Hạng)
                    </label>
                    <input
                      type="number"
                      value={kPlacement}
                      onChange={(e) => setKPlacement(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
                      min={1}
                      max={300}
                      required
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Mức biến động ELO cực nhanh ở giai đoạn đấu phân hạng (Mặc định: <strong>100</strong>).
                    </p>
                  </div>

                  {/* Placement Match Count */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      Số Trận Đấu Phân Hạng
                    </label>
                    <input
                      type="number"
                      value={placementCount}
                      onChange={(e) => setPlacementCount(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
                      min={0}
                      max={20}
                      required
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Số trận đầu tiên tài khoản mới cần thi đấu để xác định rank (Mặc định: <strong>5 trận</strong>).
                    </p>
                  </div>

                  {/* Default ELO */}
                  <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl space-y-2">
                    <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                      ELO Khởi Điểm Nền
                    </label>
                    <input
                      type="number"
                      value={defaultElo}
                      onChange={(e) => setDefaultElo(Number(e.target.value))}
                      className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
                      min={100}
                      max={3000}
                      required
                    />
                    <p className="text-[11px] text-slate-500 leading-normal">
                      Điểm ELO cấp cho tài khoản khi bắt đầu đấu PvP (Mặc định: <strong>1000 ELO</strong>).
                    </p>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100 flex justify-end">
                  <button
                    type="submit"
                    disabled={isSavingConfig}
                    className="px-6 py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 flex items-center gap-2 cursor-pointer"
                  >
                    <Save className="h-4 w-4" />
                    {isSavingConfig ? 'Đang Lưu...' : 'Cập Nhật Cấu Hình ELO'}
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Educational ELO Explanation & Live Calculator */}
          <div className="lg:col-span-5 space-y-4">
            {/* Explanation Card */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3.5 shadow-2xs">
              <div className="flex items-center gap-2 text-indigo-700 font-extrabold text-xs uppercase tracking-wider">
                <HelpCircle className="h-4 w-4 text-indigo-600" /> Công Thức ELO
              </div>
              <p className="text-xs text-slate-600 leading-relaxed font-medium">
                Trong hệ thống ELO chuẩn quốc tế, số điểm ELO tăng/giảm sau mỗi trận đấu <strong>không cố định</strong> (như +10 hay -10) mà được tính dựa trên <strong>tỷ lệ chênh lệch trình độ giữa 2 người chơi</strong> và hệ số <strong>K-Factor</strong>.
              </p>

              <div className="bg-indigo-50/60 border border-indigo-100 rounded-xl p-3 space-y-2 text-xs">
                <div className="font-extrabold text-indigo-900 font-mono text-[11px]">
                  Công thức: ELO_mới = ELO_cũ + K × (Kết_Quả - Kỳ_Vọng)
                </div>
                <ul className="list-disc pl-4 text-[11px] text-indigo-950 space-y-1 font-medium">
                  <li><strong>K-Factor càng cao:</strong> Số điểm cộng/trừ sau mỗi trận càng lớn (thay đổi nhanh).</li>
                  <li><strong>Thắng đối thủ mạnh hơn:</strong> Được cộng <strong>rất nhiều ELO</strong>.</li>
                  <li><strong>Thắng đối thủ yếu hơn nhiều:</strong> Chỉ được cộng <strong>rất ít ELO</strong>.</li>
                </ul>
              </div>
            </div>

            {/* Live Interactive Simulator */}
            <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 text-orange-600 font-extrabold text-xs uppercase tracking-wider">
                  <Calculator className="h-4 w-4 text-orange-500" /> Mô Phỏng Điểm Cộng/Trừ Thực Tế
                </div>
                <span className="text-[10px] font-extrabold uppercase bg-slate-100 px-2 py-0.5 rounded-md text-slate-600">
                  Live Calculator
                </span>
              </div>

              {/* Slider / Controls */}
              <div className="grid grid-cols-2 gap-3 text-xs">
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">ELO Người A</label>
                  <input
                    type="number"
                    value={simP1Elo}
                    onChange={(e) => setSimP1Elo(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] font-bold text-slate-700 block">ELO Người B</label>
                  <input
                    type="number"
                    value={simP2Elo}
                    onChange={(e) => setSimP2Elo(Number(e.target.value))}
                    className="w-full bg-slate-50 border border-slate-200 rounded-lg px-2.5 py-1.5 font-mono font-bold text-slate-900"
                  />
                </div>
              </div>

              {/* Output Delta Display */}
              <div className="space-y-4 border-t border-slate-100 pt-3 text-xs">
                {/* Kịch bản 1: Người A Thắng */}
                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center justify-between">
                    <span> NẾU NGƯỜI A THẮNG</span>
                    <span className="text-[10px] text-slate-500 font-mono">Đúng dự đoán</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                      <span className="text-[10px] text-emerald-700 block font-bold">Người A Thắng</span>
                      <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-0.5">
                        <ArrowUpRight className="h-4 w-4" /> +{p1WinGainStd} ELO
                      </span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2">
                      <span className="text-[10px] text-rose-700 block font-bold">Người B Thua</span>
                      <span className="text-sm font-black text-rose-600 flex items-center justify-center gap-0.5">
                        <ArrowDownRight className="h-4 w-4" /> -{p1WinGainStd} ELO
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
                    Nếu là trận Phân Hạng (K={kPlacement}): <strong>A: +{p1WinGainPlc} ELO</strong> | <strong>B: -{p1WinGainPlc} ELO</strong>
                  </div>
                </div>

                {/* Kịch bản 2: Người B Thắng */}
                <div className="space-y-2 bg-slate-50/80 p-3 rounded-xl border border-slate-200">
                  <div className="text-[11px] font-extrabold text-slate-700 uppercase flex items-center justify-between">
                    <span> NẾU NGƯỜI B THẮNG</span>
                    <span className="text-[10px] text-amber-600 font-bold font-mono">Lội ngược dòng</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2 text-center font-mono">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-2">
                      <span className="text-[10px] text-emerald-700 block font-bold">Người B Thắng</span>
                      <span className="text-sm font-black text-emerald-600 flex items-center justify-center gap-0.5">
                        <ArrowUpRight className="h-4 w-4" /> +{p2WinGainStd} ELO
                      </span>
                    </div>
                    <div className="bg-rose-50 border border-rose-200 rounded-xl p-2">
                      <span className="text-[10px] text-rose-700 block font-bold">Người A Thua</span>
                      <span className="text-sm font-black text-rose-600 flex items-center justify-center gap-0.5">
                        <ArrowDownRight className="h-4 w-4" /> -{p2WinGainStd} ELO
                      </span>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 text-center font-mono pt-1">
                    Nếu là trận Phân Hạng (K={kPlacement}): <strong>B: +{p2WinGainPlc} ELO</strong> | <strong>A: -{p2WinGainPlc} ELO</strong>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Tab 2: Bảng ELO Người Chơi */}
      {activeTab === 'players' && (
        <div className="space-y-6">
          {/* Search & Refresh Toolbar */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-4 bg-white border border-slate-200 p-4 rounded-2xl shadow-2xs">
            <form onSubmit={handleSearchSubmit} className="flex items-center gap-2 w-full sm:w-96">
              <div className="relative flex-1">
                <Search className="h-4 w-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Tìm theo Tên hoặc User ID..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full bg-slate-50 border border-slate-200 rounded-xl pl-9 pr-4 py-2 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500"
                />
              </div>
              <button
                type="submit"
                className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-bold rounded-xl transition-all cursor-pointer"
              >
                Tìm
              </button>
            </form>

            <button
              onClick={() => fetchPlayers(searchQuery)}
              disabled={isLoadingPlayers}
              className="px-4 py-2 bg-slate-100 hover:bg-slate-200 border border-slate-200 text-slate-700 text-xs font-bold rounded-xl transition-all flex items-center gap-2 cursor-pointer"
            >
              <RefreshCw className={`h-3.5 w-3.5 ${isLoadingPlayers ? 'animate-spin' : ''}`} /> Tải Lại Danh Sách
            </button>
          </div>

          {/* Players Table */}
          <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden shadow-2xs">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs text-slate-700">
                <thead className="bg-slate-100 text-slate-700 uppercase tracking-wider font-extrabold text-[10px] border-b border-slate-200">
                  <tr>
                    <th className="px-5 py-3.5">Người Chơi</th>
                    <th className="px-5 py-3.5">ELO Hiện Tại</th>
                    <th className="px-5 py-3.5">Peak ELO</th>
                    <th className="px-5 py-3.5 text-center">Thắng / Thua / Hòa</th>
                    <th className="px-5 py-3.5">Trạng Thái</th>
                    <th className="px-5 py-3.5 text-right">Hành Động</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium">
                  {isLoadingPlayers ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Đang tải danh sách người chơi...
                      </td>
                    </tr>
                  ) : players.length === 0 ? (
                    <tr>
                      <td colSpan={6} className="px-5 py-8 text-center text-slate-400">
                        Không tìm thấy người chơi nào.
                      </td>
                    </tr>
                  ) : (
                    players.map((p) => (
                      <tr key={p.userId} className="hover:bg-slate-50 transition-colors">
                        <td className="px-5 py-3.5 font-bold text-slate-900 flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-slate-100 border border-slate-200 flex items-center justify-center text-orange-600 font-black shrink-0">
                            {p.avatarUrl ? (
                              <img src={p.avatarUrl} alt={p.username} className="w-full h-full rounded-full object-cover" />
                            ) : (
                              p.username.charAt(0).toUpperCase()
                            )}
                          </div>
                          <div>
                            <span className="block font-bold text-slate-900">{p.username}</span>
                            <span className="text-[10px] text-slate-400 font-mono">{p.userId}</span>
                          </div>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-black text-amber-600 text-sm">
                          <span className="flex items-center gap-1">
                            <Zap className="h-3.5 w-3.5 fill-amber-500 text-amber-500" /> {p.eloStandard}
                          </span>
                        </td>
                        <td className="px-5 py-3.5 font-mono font-bold text-slate-500">
                          {p.peakEloStandard}
                        </td>
                        <td className="px-5 py-3.5 text-center font-mono font-bold">
                          <span className="text-emerald-600">{p.totalWinsStandard}</span> /{' '}
                          <span className="text-rose-600">{p.totalLossesStandard}</span> /{' '}
                          <span className="text-slate-400">{p.totalDrawsStandard}</span>
                        </td>
                        <td className="px-5 py-3.5">
                          {p.isPlacementCompleteStandard ? (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-emerald-50 text-emerald-700 border border-emerald-200">
                              Official Rank
                            </span>
                          ) : (
                            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-extrabold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200">
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
                            className="px-3.5 py-1.5 bg-orange-50 hover:bg-orange-100 text-orange-700 border border-orange-200 rounded-xl text-xs font-extrabold transition-all cursor-pointer shadow-2xs"
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
        <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white border border-slate-200 rounded-2xl w-full max-w-md p-6 relative space-y-5 shadow-2xl text-left">
            <button
              onClick={() => setSelectedPlayer(null)}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>

            <div className="space-y-1">
              <div className="flex items-center gap-1.5 text-xs font-extrabold text-orange-600 uppercase tracking-wider">
                <Zap className="h-3.5 w-3.5 fill-orange-500 text-orange-500" /> Manual ELO Adjustment
              </div>
              <h3 className="text-xl font-extrabold text-slate-900 tracking-tight">
                Thay Đổi ELO: {selectedPlayer.username}
              </h3>
              <p className="text-xs text-slate-500 font-mono">
                ELO Hiện tại: <strong className="text-amber-600 font-extrabold">{selectedPlayer.eloStandard}</strong>
              </p>
            </div>

            {adjustSuccess && (
              <div className="bg-emerald-50 border border-emerald-200 text-emerald-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>{adjustSuccess}</span>
              </div>
            )}

            {adjustError && (
              <div className="bg-rose-50 border border-rose-200 text-rose-800 p-3 rounded-xl text-xs font-bold flex items-center gap-2">
                <AlertCircle className="h-4 w-4 text-rose-600 shrink-0" />
                <span>{adjustError}</span>
              </div>
            )}

            <form onSubmit={handleAdjustSubmit} className="space-y-4">
              {/* ELO Delta Input */}
              <div className="space-y-2">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                  Giá Trị Điều Chỉnh ELO (+ hoặc -)
                </label>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setEloDelta((prev) => (prev > 0 ? -prev : prev))}
                    className={`px-3 py-2 rounded-xl font-extrabold text-xs uppercase border transition-all cursor-pointer ${eloDelta < 0
                      ? 'bg-rose-100 text-rose-700 border-rose-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                  >
                    Trừ (-)
                  </button>
                  <button
                    type="button"
                    onClick={() => setEloDelta((prev) => Math.abs(prev))}
                    className={`px-3 py-2 rounded-xl font-extrabold text-xs uppercase border transition-all cursor-pointer ${eloDelta > 0
                      ? 'bg-emerald-100 text-emerald-700 border-emerald-300'
                      : 'bg-slate-100 text-slate-600 border-slate-200'
                      }`}
                  >
                    Cộng (+)
                  </button>
                  <input
                    type="number"
                    value={eloDelta}
                    onChange={(e) => setEloDelta(Number(e.target.value))}
                    className="flex-1 bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-slate-900 font-mono text-sm font-bold focus:outline-none focus:border-orange-500 shadow-2xs"
                    required
                  />
                </div>
                <p className="text-[11px] text-slate-500">
                  Ví dụ: <code className="text-emerald-700 font-bold">+50</code> hoặc <code className="text-rose-700 font-bold">-30</code>. ELO sau điều chỉnh: <strong className="text-slate-900">{Math.max(0, selectedPlayer.eloStandard + eloDelta)}</strong>
                </p>
              </div>

              {/* Reason Note */}
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase tracking-wider text-slate-700 block">
                  Lý Do / Ghi Chú Admin
                </label>
                <textarea
                  value={adjustReason}
                  onChange={(e) => setAdjustReason(e.target.value)}
                  placeholder="Nhập lý do (ví dụ: Xử lý khiếu nại trận đấu #1234, Thưởng giải đấu...)"
                  className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs text-slate-900 font-medium focus:outline-none focus:border-orange-500 min-h-[80px]"
                />
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setSelectedPlayer(null)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 font-extrabold text-xs rounded-xl"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingAdjust}
                  className="px-5 py-2 bg-orange-500 hover:bg-orange-600 text-white font-extrabold text-xs uppercase tracking-wider rounded-xl transition-all shadow-md shadow-orange-500/20 cursor-pointer"
                >
                  {isSubmittingAdjust ? 'Đang Lưu...' : 'Xác Nhận Thay Đổi'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
