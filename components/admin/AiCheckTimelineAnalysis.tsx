'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { 
  Bot, 
  Sparkles, 
  Clock, 
  Eye, 
  ExternalLink, 
  X, 
  AlertTriangle, 
  CheckCircle2, 
  ShieldAlert,
  Play,
  Zap,
  Info,
  Users,
  Box,
  Hand,
  PlusCircle,
  FileCheck
} from 'lucide-react';

export interface ViolationItem {
  type: 'RUBIK_LOST' | 'MULTIPLE_PERSONS' | 'EXTRA_HANDS';
  title: string;
  start_time: string;
  end_time: string;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM';
  details: string;
  snapshot_url?: string;
}

export interface AiCheckResult {
  report_id: string;
  status: string;
  verdict: 'SUSPICIOUS' | 'CLEAN';
  confidence_score: number;
  scanned_range?: string;
  video_duration_formatted: string;
  processing_time_seconds: number;
  total_violations: number;
  has_violations: boolean;
  evidence_video_url: string;
  violations: ViolationItem[];
}

interface Props {
  reportId: string;
  videoUrl: string;
  targetPlayerName?: string;
  player1VideoUrl?: string;
  player2VideoUrl?: string;
  player1Name?: string;
  player2Name?: string;
  defaultTarget?: 'player1' | 'player2';
  timestampSeconds?: number;
  timestampText?: string;
  onSeekVideo?: (seconds: number) => void;
  onAttachEvidence?: (violation: ViolationItem) => void;
  onAutoFillVerdict?: (result: AiCheckResult, playerName: string) => void;
  apiUrl?: string;
}

export const AiCheckTimelineAnalysis: React.FC<Props> = ({
  reportId,
  videoUrl,
  targetPlayerName = 'Người chơi bị báo cáo',
  player1VideoUrl,
  player2VideoUrl,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  defaultTarget = 'player1',
  timestampSeconds = 75,
  timestampText = '01:15',
  onSeekVideo,
  onAttachEvidence,
  onAutoFillVerdict,
  apiUrl = 'http://localhost:8000'
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'player1' | 'player2' | 'custom'>(defaultTarget);
  const [scanScope, setScanScope] = useState<'WINDOW' | 'FULL'>('WINDOW');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AiCheckResult | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<string | null>(null);
  const [attachedIndices, setAttachedIndices] = useState<number[]>([]);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEvidenceModal(false);
        setSelectedSnapshot(null);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const activeVideoUrl = selectedTarget === 'player1'
    ? (player1VideoUrl || videoUrl)
    : selectedTarget === 'player2'
      ? (player2VideoUrl || videoUrl)
      : videoUrl;

  const currentTargetLabel = selectedTarget === 'player1'
    ? player1Name
    : selectedTarget === 'player2'
      ? player2Name
      : targetPlayerName;

  const windowStart = Math.max(0, (timestampSeconds || 0) - 15);
  const windowEnd = (timestampSeconds || 0) + 15;
  const formatSec = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m.toString().padStart(2, '0')}:${sec.toString().padStart(2, '0')}`;
  };

  const handleRunAiCheck = async () => {
    if (!activeVideoUrl) {
      alert(`Không tìm thấy video trận đấu của ${currentTargetLabel} để phân tích!`);
      return;
    }

    setLoading(true);
    setErrorMsg(null);
    setAttachedIndices([]);

    try {
      const payload: any = {
        video_url: activeVideoUrl,
        report_id: reportId || 'unassigned',
        rubik_lost_threshold: 1.0,
        multi_person_threshold: 1.0
      };

      if (scanScope === 'WINDOW' && timestampSeconds !== undefined && timestampSeconds >= 0) {
        payload.target_timestamp_sec = timestampSeconds;
        payload.window_padding_sec = 15.0;
      }

      const response = await fetch(`${apiUrl}/api/v1/analyze-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        throw new Error(`AI Microservice phản hồi lỗi: ${response.statusText}`);
      }

      const data: AiCheckResult = await response.json();
      setAiData(data);
    } catch (err: any) {
      console.error('AI Check Error:', err);
      setErrorMsg(err.message || 'Không thể kết nối đến AI Service (Hãy đảm bảo run_ai_service.bat đang bật tại localhost:8000).');
    } finally {
      setLoading(false);
    }
  };

  const handleAttachClick = (violation: ViolationItem, index: number) => {
    if (onAttachEvidence) {
      onAttachEvidence(violation);
      setAttachedIndices(prev => prev.includes(index) ? prev : [...prev, index]);
    }
  };

  const getViolationBadge = (type: string) => {
    switch (type) {
      case 'RUBIK_LOST':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-200 shrink-0">
            <Box className="h-3 w-3 text-amber-600" />
            <span>Mất Dấu Rubik</span>
          </span>
        );
      case 'MULTIPLE_PERSONS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
            <Users className="h-3 w-3 text-rose-600" />
            <span>≥2 Người Trong Phòng</span>
          </span>
        );
      case 'EXTRA_HANDS':
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-purple-50 text-purple-800 border border-purple-200 shrink-0">
            <Hand className="h-3 w-3 text-purple-600" />
            <span>Tay Lạ Can Thiệp</span>
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-[11px] font-bold bg-rose-50 text-rose-800 border border-rose-200 shrink-0">
            <AlertTriangle className="h-3 w-3 text-rose-600" />
            <span>Nghi Vấn Gian Lận</span>
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 sm:p-6 space-y-4 shadow-2xs text-slate-900 font-sans">
      {/* HEADER */}
      <div className="space-y-3 border-b border-slate-100 pb-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2">
            <span className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-100 rounded-lg flex items-center justify-center">
              <Bot className="h-4 w-4" />
            </span>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-extrabold tracking-tight text-slate-900">
                AI Check Timeline Analysis
              </h3>
              {aiData && (
                <span className={`px-2 py-0.5 rounded-md text-[11px] font-extrabold uppercase tracking-wider border ${
                  aiData.has_violations
                    ? 'bg-rose-50 text-rose-700 border-rose-200'
                    : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                }`}>
                  {aiData.has_violations ? `🚨 ${aiData.total_violations} Vi Phạm` : '✨ Sạch'}
                </span>
              )}
            </div>
          </div>

          {(player1VideoUrl || player2VideoUrl) && (
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-semibold">
              <button
                type="button"
                onClick={() => { setSelectedTarget('player1'); setAiData(null); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTarget === 'player1'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {player1Name}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedTarget('player2'); setAiData(null); }}
                className={`px-3 py-1 rounded-lg transition-all cursor-pointer ${
                  selectedTarget === 'player2'
                    ? 'bg-white text-indigo-700 font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
              >
                {player2Name}
              </button>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 pt-1">
          <p className="text-xs text-slate-500">
            Mục tiêu: <strong className="text-slate-800 font-bold">{currentTargetLabel}</strong>
          </p>

          <div className="flex flex-wrap items-center gap-2">
            <div className="flex bg-slate-100 p-0.5 rounded-xl border border-slate-200 text-xs font-medium">
              <button
                type="button"
                onClick={() => { setScanScope('WINDOW'); setAiData(null); }}
                className={`px-2.5 py-1 rounded-lg transition-all flex items-center gap-1 cursor-pointer ${
                  scanScope === 'WINDOW'
                    ? 'bg-amber-500 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Chỉ quét 15s trước và 15s sau mốc báo cáo"
              >
                <Zap className="h-3 w-3" />
                <span>Mốc ±15s ({formatSec(windowStart)} - {formatSec(windowEnd)})</span>
              </button>
              <button
                type="button"
                onClick={() => { setScanScope('FULL'); setAiData(null); }}
                className={`px-2.5 py-1 rounded-lg transition-all cursor-pointer ${
                  scanScope === 'FULL'
                    ? 'bg-slate-800 text-white font-bold shadow-xs'
                    : 'text-slate-500 hover:text-slate-900'
                }`}
                title="Quét toàn bộ video"
              >
                <span>Toàn bộ</span>
              </button>
            </div>

            <button
              type="button"
              onClick={handleRunAiCheck}
              disabled={loading}
              className="px-3.5 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
            >
              {loading ? (
                <>
                  <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  <span>Đang Quét AI...</span>
                </>
              ) : (
                <>
                  <Sparkles className="h-3.5 w-3.5" />
                  <span>{aiData ? 'Quét Lại' : 'Kích Hoạt AI Check'}</span>
                </>
              )}
            </button>
          </div>
        </div>
      </div>

      {/* THÔNG BÁO LỖI */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs font-medium flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0 text-rose-600" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* TRẠNG THÁI CHƯA QUÉT */}
      {!aiData && !loading && !errorMsg && (
        <div className="flex items-center gap-3 p-4 bg-slate-50 border border-slate-200 rounded-xl">
          <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg shrink-0">
            <Info className="h-4 w-4" />
          </div>
          <div className="text-xs space-y-0.5">
            <p className="text-slate-700">
              Chế độ: <strong className="text-slate-900">{scanScope === 'WINDOW' ? `Quét nhanh mốc ${timestampText} (${formatSec(windowStart)} → ${formatSec(windowEnd)})` : 'Quét toàn bộ video'}</strong> cho <strong>{currentTargetLabel}</strong>.
            </p>
            <p className="text-[11px] text-slate-400">
              Nhấn nút <strong className="text-indigo-600">"Kích Hoạt AI Check"</strong> ở góc phải để bắt đầu phát hiện gian lận tự động.
            </p>
          </div>
        </div>
      )}

      {/* KẾT QUẢ PHÂN TÍCH */}
      {aiData && (
        <div className="space-y-4">
          {/* STATS BAR */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs">
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Phạm vi quét</span>
              <p className="font-mono font-bold text-slate-800">{aiData.scanned_range || aiData.video_duration_formatted}</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Thời gian AI xử lý</span>
              <p className="font-mono font-bold text-indigo-600">{aiData.processing_time_seconds}s</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Độ tin cậy</span>
              <p className="font-mono font-bold text-emerald-600">{aiData.confidence_score}%</p>
            </div>
            <div className="space-y-0.5">
              <span className="text-[10px] uppercase font-bold text-slate-400">Đánh giá</span>
              <p className={`font-bold ${aiData.has_violations ? 'text-rose-600' : 'text-emerald-600'}`}>
                {aiData.has_violations ? `Phát hiện ${aiData.total_violations} Vi Phạm` : 'Hợp Lệ'}
              </p>
            </div>
          </div>

          {/* THANH THAO TÁC NHANH VỚI PHÁN QUYẾT */}
          {aiData.has_violations && onAutoFillVerdict && (
            <div className="flex items-center justify-between p-3 bg-indigo-50/70 border border-indigo-100 rounded-xl text-xs">
              <span className="text-indigo-900 font-medium flex items-center gap-1.5">
                <FileCheck className="h-4 w-4 text-indigo-600" />
                <span>AI đã tổng hợp {aiData.total_violations} bằng chứng vi phạm.</span>
              </span>
              <button
                type="button"
                onClick={() => onAutoFillVerdict(aiData, currentTargetLabel)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg font-bold transition shadow-xs flex items-center gap-1 cursor-pointer"
              >
                <span>⚡ Chèn tất cả vào Phán Quyết</span>
              </button>
            </div>
          )}

          {/* DANH SÁCH VI PHẠM */}
          {aiData.violations.length === 0 ? (
            <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs font-semibold flex items-center gap-2">
              <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
              <span>Không phát hiện dấu hiệu vi phạm gian lận nào ở video của <strong>{currentTargetLabel}</strong> trong phạm vi kiểm tra!</span>
            </div>
          ) : (
            <div className="space-y-3 max-h-[320px] overflow-y-auto pr-1">
              {aiData.violations.map((v, i) => {
                const isAttached = attachedIndices.includes(i);
                return (
                  <div
                    key={i}
                    className="bg-slate-50/80 hover:bg-slate-100 border border-slate-200 rounded-xl p-3.5 space-y-2.5 transition-all shadow-2xs"
                  >
                    {/* HÀNG 1: MỐC THỜI GIAN + BADGE LOẠI VI PHẠM */}
                    <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200/60 pb-2">
                      <div className="flex items-center gap-2">
                        <span className="px-2.5 py-1 bg-white border border-slate-300 rounded-md text-xs font-mono font-extrabold text-slate-900 shadow-2xs">
                          ⏱️ {v.start_time} - {v.end_time}
                        </span>
                        <span className="text-xs font-mono text-slate-500 font-semibold">
                          (Kéo dài {v.duration_sec}s)
                        </span>
                      </div>

                      {getViolationBadge(v.type)}
                    </div>

                    {/* HÀNG 2: MÔ TẢ CHI TIẾT + CÁC NÚT HÀNH ĐỘNG */}
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-0.5">
                      <p className="text-xs text-slate-700 font-medium leading-relaxed flex-1">
                        {v.details}
                      </p>

                      <div className="flex flex-wrap items-center gap-2 shrink-0 self-end sm:self-auto">
                        {/* Nút đính kèm vào phán quyết */}
                        {v.snapshot_url && onAttachEvidence && (
                          <button
                            type="button"
                            onClick={() => handleAttachClick(v, i)}
                            className={`px-2.5 py-1.5 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer ${
                              isAttached
                                ? 'bg-emerald-100 border border-emerald-300 text-emerald-800'
                                : 'bg-white hover:bg-slate-50 border border-slate-200 text-indigo-600'
                            }`}
                            title="Đính kèm ảnh bằng chứng này vào form Phán quyết bên dưới"
                          >
                            {isAttached ? (
                              <>
                                <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600" />
                                <span>Đã đính kèm</span>
                              </>
                            ) : (
                              <>
                                <PlusCircle className="h-3.5 w-3.5 text-indigo-600" />
                                <span>+ Đính kèm</span>
                              </>
                            )}
                          </button>
                        )}

                        {/* Nút xem ảnh */}
                        {v.snapshot_url && (
                          <button
                            type="button"
                            onClick={() => setSelectedSnapshot(v.snapshot_url || null)}
                            className="px-2.5 py-1.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-700 rounded-lg text-xs font-bold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                          >
                            <Eye className="h-3.5 w-3.5 text-slate-600" />
                            <span>Ảnh</span>
                          </button>
                        )}

                        {/* Nút tua video */}
                        <button
                          type="button"
                          onClick={() => onSeekVideo && onSeekVideo(v.start_sec)}
                          className="px-2.5 py-1.5 bg-indigo-50 hover:bg-indigo-100 border border-indigo-200 text-indigo-700 rounded-lg text-xs font-extrabold transition-all shadow-xs flex items-center gap-1 cursor-pointer"
                        >
                          <Play className="h-3 w-3 fill-indigo-600 text-indigo-600" />
                          <span>Tua {v.start_time}</span>
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* FOOTER NÚT BẬT VIDEO BẰNG CHỨNG */}
          <div className="pt-2 border-t border-slate-100 flex justify-between items-center text-xs text-slate-500">
            <span>Video bằng chứng đã được AI xuất sẵn Bounding Box & Cảnh báo đỏ.</span>
            <button
              type="button"
              onClick={() => setShowEvidenceModal(true)}
              className="text-indigo-600 hover:text-indigo-800 font-extrabold transition-all flex items-center gap-1.5 cursor-pointer underline underline-offset-4"
            >
              <ExternalLink className="h-3.5 w-3.5" />
              <span>Xem Video Bằng Chứng AI (Popup)</span>
            </button>
          </div>
        </div>
      )}

      {/* MODAL VIDEO BẰNG CHỨNG */}
      {mounted && showEvidenceModal && aiData && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setShowEvidenceModal(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg">
                  <Bot className="h-4 w-4" />
                </span>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-mono">
                  Video Bằng Chứng AI: <span className="text-indigo-600">{currentTargetLabel}</span>
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={aiData.evidence_video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Mở Tab Mới
                </a>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-slate-200">
              <video
                key={aiData.evidence_video_url}
                src={aiData.evidence_video_url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[420px] object-contain mx-auto"
              >
                <source src={aiData.evidence_video_url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL ẢNH SNAPSHOT */}
      {mounted && selectedSnapshot && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="flex items-center gap-2">
                <span className="p-1.5 bg-rose-50 text-rose-600 border border-rose-200 rounded-lg">
                  <ShieldAlert className="h-4 w-4" />
                </span>
                <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-mono">
                  Ảnh Chụp Bằng Chứng Vi Phạm (AI Snapshot)
                </h4>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={selectedSnapshot}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Mở ảnh gốc
                </a>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
              <img
                src={selectedSnapshot}
                alt="AI Snapshot Evidence"
                className="w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
