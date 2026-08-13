'use client';

import React, { useState, useMemo } from 'react';
import type { TournamentDetailDto } from '@/lib/api/types';
import {
  Trophy,
  Users,
  Video,
  Zap,
  BarChart3,
  PieChart,
  ShieldCheck,
  TrendingUp,
} from 'lucide-react';

export interface DashboardAnalyticsChartsProps {
  tournaments: TournamentDetailDto[];
  pendingVideoCount?: number;
  approvedCount?: number;
  dnfCount?: number;
  rejectedCount?: number;
  userRole?: string;
  initialWorkflow?: 'online_async' | 'offline_manager';
  onNavigateToAsync?: () => void;
  onNavigateToOffline?: () => void;
  onNavigateToReview?: () => void;
}

function isAsyncOnline(t: TournamentDetailDto): boolean {
  if (t.isOnlineAsync || (t as any).tournamentType === 'ONLINE_ASYNC') return true;
  const nameLower = (t.name || '').toLowerCase();
  const descLower = (t.description || '').toLowerCase();
  if (nameLower.includes('async') || nameLower.includes('ao1') || nameLower.includes('a01') || nameLower.includes('online async')) return true;
  if (descLower.includes('async') || descLower.includes('ao1') || descLower.includes('bất đồng bộ')) return true;
  return false;
}

function isOfflineManager(t: TournamentDetailDto): boolean {
  if (isAsyncOnline(t)) return false;
  return true;
}

export function DashboardAnalyticsCharts({
  tournaments = [],
  pendingVideoCount = 0,
  approvedCount = 0,
  dnfCount = 0,
  rejectedCount = 0,
  userRole,
  initialWorkflow = 'online_async',
  onNavigateToAsync,
  onNavigateToOffline,
  onNavigateToReview,
}: DashboardAnalyticsChartsProps) {
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

  // Separate tournaments array into Async Online vs Genuine Manager Offline
  const asyncTournaments = useMemo(() => tournaments.filter(isAsyncOnline), [tournaments]);
  const offlineTournaments = useMemo(() => tournaments.filter(isOfflineManager), [tournaments]);

  // Compute Current Month & Monthly Offline Manager Creations
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth();

  // Dynamically calculate past 6 months data points from real tournament dates
  const monthlyChartData = useMemo(() => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const label = `T${d.getMonth() + 1}`;
      const year = d.getFullYear();
      const month = d.getMonth();

      const asyncInMonth = asyncTournaments.filter((t) => {
        const date = new Date(t.createdAt || t.startDate);
        return date.getFullYear() === year && date.getMonth() === month;
      }).length;

      months.push({
        label,
        asyncValue: asyncInMonth,
      });
    }
    return months;
  }, [asyncTournaments]);

  const activePointsData = monthlyChartData.map((m) => ({
    label: m.label,
    value: m.asyncValue,
  }));

  const values = activePointsData.map((d) => d.value);
  const maxValue = Math.max(...values, 1);

  const chartHeight = 180;
  const chartWidth = 650;

  // SVG Coordinates calculation
  const points = activePointsData.map((item, idx) => {
    const x = (idx / Math.max(activePointsData.length - 1, 1)) * (chartWidth - 60) + 30;
    const y = chartHeight - (item.value / maxValue) * (chartHeight - 50) - 25;
    return { x, y, ...item };
  });

  const pathString = points.map((p, i) => `${i === 0 ? 'M' : 'L'} ${p.x},${p.y}`).join(' ');
  const areaString = `M 30,${chartHeight} L ${points.map((p) => `${p.x},${p.y}`).join(' L ')} L ${chartWidth - 30},${chartHeight} Z`;

  const totalAttempts = approvedCount + dnfCount + rejectedCount + pendingVideoCount;
  const approvalRate = totalAttempts > 0
    ? ((approvedCount / (totalAttempts - pendingVideoCount || 1)) * 100).toFixed(1)
    : '100';

  return (
    <div className="space-y-6 text-left">
      {/* KPI Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Giải Online Async</span>
            <Zap className="h-4 w-4 text-indigo-600" />
          </div>
          <p className="text-3xl font-black text-slate-900 font-mono">{asyncTournaments.length}</p>
          <p className="text-[11px] font-semibold text-indigo-600">Admin hệ thống khởi tạo</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Video Chờ Duyệt</span>
            <Video className="h-4 w-4 text-amber-600" />
          </div>
          <p className="text-3xl font-black text-amber-600 font-mono">{pendingVideoCount}</p>
          <p className="text-[11px] font-semibold text-amber-700">Cần Admin review evidence</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Tỷ Lệ Duyệt Hợp Lệ</span>
            <ShieldCheck className="h-4 w-4 text-emerald-600" />
          </div>
          <p className="text-3xl font-black text-emerald-600 font-mono">{approvalRate}%</p>
          <p className="text-[11px] font-semibold text-emerald-700">{approvedCount} Approved attempts</p>
        </div>

        <div className="bg-white rounded-3xl p-5 border border-slate-200 shadow-xs space-y-2">
          <div className="flex items-center justify-between text-xs font-bold text-slate-400 uppercase">
            <span>Lượt DNF (Phạm Quy)</span>
            <PieChart className="h-4 w-4 text-rose-600" />
          </div>
          <p className="text-3xl font-black text-rose-600 font-mono">{dnfCount}</p>
          <p className="text-[11px] font-semibold text-rose-700">Attempt thất bại / DNF</p>
        </div>
      </div>

      {/* Main Real Dynamic Chart Section */}
      <div className="bg-white rounded-3xl p-6 sm:p-7 border border-slate-200 shadow-xs space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-100 pb-4">
          <div>
            <h3 className="text-base font-black text-slate-900 tracking-tight flex items-center gap-2">
              <BarChart3 className="h-4 w-4 text-indigo-600" />
              Thống Kê Giải Online Async Theo Tháng (Dữ Liệu Thực)
            </h3>
            <p className="text-xs text-slate-500 mt-0.5">
              Chạm hoặc di chuột vào các mốc tháng để xem số lượng giải đấu thực tế.
            </p>
          </div>
        </div>

        {/* Interactive SVG Chart */}
        <div className="relative pt-4 pb-2">
          <svg
            viewBox={`0 0 ${chartWidth} ${chartHeight}`}
            className="w-full h-auto overflow-visible cursor-pointer"
          >
            <defs>
              <linearGradient id="chartGradientAsync" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#4f46e5" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#4f46e5" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {/* Grid lines */}
            {[0, 0.33, 0.66, 1].map((pct, idx) => (
              <line
                key={idx}
                x1="30"
                y1={chartHeight * pct}
                x2={chartWidth - 30}
                y2={chartHeight * pct}
                stroke="#f1f5f9"
                strokeWidth="1"
                strokeDasharray="4 4"
              />
            ))}

            {/* Area Fill */}
            <path
              d={areaString}
              fill="url(#chartGradientAsync)"
            />

            {/* Smooth Line */}
            <path
              d={pathString}
              fill="none"
              stroke="#4f46e5"
              strokeWidth="3.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />

            {/* Points */}
            {points.map((p, idx) => {
              const isHovered = hoveredIdx === idx;
              return (
                <g
                  key={idx}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onClick={() => setHoveredIdx(idx)}
                  className="group cursor-pointer"
                >
                  <circle cx={p.x} cy={p.y} r="16" fill="transparent" />

                  {isHovered && (
                    <circle
                      cx={p.x}
                      cy={p.y}
                      r="10"
                      className="animate-ping opacity-75 fill-indigo-400"
                    />
                  )}

                  <circle
                    cx={p.x}
                    cy={p.y}
                    r={isHovered ? '7' : '5'}
                    className="transition-all duration-200 fill-white stroke-indigo-600 stroke-[3.5]"
                  />

                  <text
                    x={p.x}
                    y={chartHeight + 18}
                    textAnchor="middle"
                    className="text-[11px] font-bold fill-slate-500 font-sans"
                  >
                    {p.label}
                  </text>
                </g>
              );
            })}
          </svg>

          {/* Interactive Floating Tooltip */}
          {hoveredIdx !== null && points[hoveredIdx] && (
            <div className="absolute z-20 top-2 left-1/2 -translate-x-1/2 p-3 rounded-2xl shadow-xl border text-xs space-y-1 transition-all bg-slate-900 text-white border-indigo-500/40">
              <div className="flex items-center gap-2">
                <span className="font-extrabold text-slate-300">{points[hoveredIdx].label}</span>
                <span className="px-2 py-0.5 rounded-full text-[10px] font-black uppercase bg-slate-800 text-slate-200">
                  Online Async
                </span>
              </div>
              <p className="text-sm font-black font-mono">
                {points[hoveredIdx].value} <span className="text-xs font-normal text-slate-400">giải đấu được tạo</span>
              </p>
            </div>
          )}
        </div>

        <div className="flex items-center justify-between pt-2 border-t border-slate-100 text-xs text-slate-500 font-semibold">
          <span className="flex items-center gap-2">
            <span className="w-3 h-3 rounded-full bg-indigo-600" />
            Số lượng giải Async do Admin tạo theo từng tháng
          </span>
          <span className="text-slate-400 font-mono">Tính toán thực tế 100%</span>
        </div>
      </div>
    </div>
  );
}
