'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Play,
  Eye,
  Paperclip,
  Check,
  AlertTriangle,
  CheckCircle2,
  Clock,
  ExternalLink,
  X,
  Video,
  Zap,
  User,
  Film,
} from 'lucide-react';

export interface ViolationItem {
  type: 'RUBIK_LOST' | 'MULTIPLE_PERSONS' | 'EXTRA_HANDS' | string;
  title: string;
  start_time: string;
  end_time: string;
  start_sec: number;
  end_sec: number;
  duration_sec: number;
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | string;
  details: string;
  snapshot_url?: string;
}

export interface AiCheckResult {
  report_id: string;
  status: string;
  verdict: 'SUSPICIOUS' | 'CLEAN' | string;
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
  apiUrl?: string;
  onAttachEvidence?: (violation: ViolationItem) => void;
  onAutoFillVerdict?: (result: AiCheckResult, playerName: string) => void;
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
  apiUrl = 'http://localhost:8000',
  onAttachEvidence,
  onAutoFillVerdict,
}) => {
  const [mounted, setMounted] = useState(false);
  const [selectedTarget, setSelectedTarget] = useState<'player1' | 'player2' | 'custom'>(defaultTarget);
  const [scanScope, setScanScope] = useState<'WINDOW' | 'FULL'>('WINDOW');
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [aiData, setAiData] = useState<AiCheckResult | null>(null);
  const [showEvidenceModal, setShowEvidenceModal] = useState(false);
  const [selectedSnapshot, setSelectedSnapshot] = useState<ViolationItem | null>(null);
  const [attachedKeys, setAttachedKeys] = useState<Record<string, boolean>>({});
  const [autoFilledSuccess, setAutoFilledSuccess] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on ESC
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

  const activeVideoUrl =
    selectedTarget === 'player1'
      ? player1VideoUrl || videoUrl
      : selectedTarget === 'player2'
      ? player2VideoUrl || videoUrl
      : videoUrl;

  const currentTargetLabel =
    selectedTarget === 'player1'
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
    setAutoFilledSuccess(false);

    try {
      const payload: any = {
        video_url: activeVideoUrl,
        report_id: reportId || 'unassigned',
        rubik_lost_threshold: 1.0,
        multi_person_threshold: 1.0,
      };

      if (scanScope === 'WINDOW' && timestampSeconds !== undefined && timestampSeconds >= 0) {
        payload.target_timestamp_sec = timestampSeconds;
        payload.window_padding_sec = 15.0;
      }

      const response = await fetch(`${apiUrl}/api/v1/analyze-video`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        throw new Error(`AI Microservice phản hồi lỗi: ${response.statusText}`);
      }

      const data: AiCheckResult = await response.json();
      setAiData(data);
    } catch (err: any) {
      console.error('AI Check Error:', err);
      setErrorMsg(
        err.message ||
          'Không thể kết nối đến AI Service (Hãy đảm bảo python ai_service.py đang chạy tại localhost:8000).'
      );
    } finally {
      setLoading(false);
    }
  };

  const handleAttachItem = (v: ViolationItem) => {
    if (onAttachEvidence) {
      onAttachEvidence(v);
      const key = `${v.start_time}_${v.title}`;
      setAttachedKeys((prev) => ({ ...prev, [key]: true }));
    }
  };

  const handleAutoFill = () => {
    if (!aiData || !onAutoFillVerdict) return;
    onAutoFillVerdict(aiData, currentTargetLabel);
    setAutoFilledSuccess(true);
    const newAttached: Record<string, boolean> = {};
    aiData.violations.forEach((v) => {
      newAttached[`${v.start_time}_${v.title}`] = true;
    });
    setAttachedKeys(newAttached);
  };

  const getViolationBadge = (type: string) => {
    switch (type) {
      case 'RUBIK_LOST':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-amber-50 text-amber-700 border border-amber-200 inline-flex items-center gap-1 shrink-0">
            Mất Rubik
          </span>
        );
      case 'MULTIPLE_PERSONS':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 shrink-0">
            ≥ 2 Người
          </span>
        );
      case 'EXTRA_HANDS':
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-purple-50 text-purple-700 border border-purple-200 inline-flex items-center gap-1 shrink-0">
            Tay Lạ
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 rounded-md text-[11px] font-bold bg-rose-50 text-rose-700 border border-rose-200 inline-flex items-center gap-1 shrink-0">
            Vi Phạm
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-2xs text-slate-800 font-sans space-y-4">
      {/* 1. TOP HEADER & CONTROLS (COMPACT) */}
      <div className="space-y-3 border-b border-slate-100 pb-3.5">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="flex items-center gap-2.5">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-xl border border-indigo-100 shadow-2xs">
              <Sparkles className="h-4 w-4" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-sm font-bold text-slate-900">
                  AI Phân Tích &amp; Kiểm Duyệt Video
                </h3>
                {aiData && (
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[11px] font-bold ${
                      aiData.has_violations
                        ? 'bg-rose-50 text-rose-700 border border-rose-200'
                        : 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                    }`}
                  >
                    {aiData.has_violations ? `${aiData.total_violations} Vi Phạm` : 'Hợp Lệ'}
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* Trigger Scan Button */}
          <button
            type="button"
            onClick={handleRunAiCheck}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition-all shadow-xs disabled:opacity-50 flex items-center gap-1.5 cursor-pointer border-none shrink-0 self-start sm:self-auto"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Đang Quét...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>{aiData ? 'Quét Lại' : 'Kích Hoạt AI Check'}</span>
              </>
            )}
          </button>
        </div>

        {/* Control Bar: Compact Pills */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-1 text-xs">
          <div className="flex flex-wrap items-center gap-2">
            {/* Player Target Selector */}
            {(player1VideoUrl || player2VideoUrl) && (
              <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTarget('player1');
                    setAiData(null);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedTarget === 'player1'
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {player1Name}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setSelectedTarget('player2');
                    setAiData(null);
                  }}
                  className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                    selectedTarget === 'player2'
                      ? 'bg-white text-indigo-700 font-bold shadow-2xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {player2Name}
                </button>
              </div>
            )}

            {/* Scan Scope Toggle */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-lg border border-slate-200 text-xs">
              <button
                type="button"
                onClick={() => {
                  setScanScope('WINDOW');
                  setAiData(null);
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scanScope === 'WINDOW'
                    ? 'bg-amber-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Quét 15s trước và 15s sau mốc nghi vấn"
              >
                Mốc ±15s ({formatSec(windowStart)} - {formatSec(windowEnd)})
              </button>
              <button
                type="button"
                onClick={() => {
                  setScanScope('FULL');
                  setAiData(null);
                }}
                className={`px-2.5 py-1 rounded-md transition-all cursor-pointer ${
                  scanScope === 'FULL'
                    ? 'bg-indigo-600 text-white font-bold shadow-2xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
                title="Quét toàn bộ video trận đấu"
              >
                Toàn Bộ Video
              </button>
            </div>
          </div>

          <span className="text-slate-400 text-[11px]">
            Đối tượng quét: <strong className="text-slate-700">{currentTargetLabel}</strong>
          </span>
        </div>
      </div>

      {/* 2. ERROR STATE */}
      {errorMsg && (
        <div className="p-3 bg-rose-50 border border-rose-200 rounded-xl text-rose-700 text-xs flex items-center gap-2 font-medium">
          <AlertTriangle className="h-4 w-4 text-rose-600 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* 3. INITIAL UN-SCANNED STATE */}
      {!aiData && !loading && !errorMsg && (
        <div className="py-4 px-3 bg-slate-50 border border-slate-200/80 rounded-xl text-center text-xs text-slate-500">
          Chế độ: <strong className="text-slate-700 font-semibold">{scanScope === 'WINDOW' ? `Quét mốc ${timestampText} (${formatSec(windowStart)} → ${formatSec(windowEnd)})` : 'Toàn bộ video'}</strong> cho <strong>{currentTargetLabel}</strong>. Nhấn <strong className="text-indigo-600">"Kích Hoạt AI Check"</strong> để bắt đầu.
        </div>
      )}

      {/* 4. SCANNED RESULTS VIEW (RÚT GỌN GỌN GÀNG) */}
      {aiData && (
        <div className="space-y-3 animate-in fade-in">
          {/* COMPACT STATS BAR */}
          <div className="flex flex-wrap items-center justify-between bg-slate-50 border border-slate-200 rounded-xl px-3 py-2 text-xs text-slate-600 gap-2">
            <div className="flex items-center gap-3">
              <span>Phạm vi: <strong className="text-slate-900">{aiData.scanned_range || aiData.video_duration_formatted}</strong></span>
              <span>Thời gian quét: <strong className="text-indigo-600">{aiData.processing_time_seconds}s</strong></span>
              <span>Độ tin cậy: <strong className="text-emerald-600">{aiData.confidence_score}%</strong></span>
            </div>

            {onAutoFillVerdict && (
              <button
                type="button"
                onClick={handleAutoFill}
                className="px-3 py-1 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-lg text-xs font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                title="Tự động áp dụng kết quả AI vào ô phán quyết bên dưới"
              >
                <Zap className="h-3.5 w-3.5 text-indigo-600" />
                <span>{autoFilledSuccess ? '✓ Đã Điền Phán Quyết' : 'Tự Động Điền Phán Quyết'}</span>
              </button>
            )}
          </div>

          {/* RÚT GỌN DANH SÁCH VI PHẠM (DẠNG HÀNG GỌN 1 DÒNG) */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs font-bold text-slate-700 px-0.5">
              <span>Chi Tiết Vi Phạm ({aiData.violations.length})</span>
            </div>

            {aiData.violations.length === 0 ? (
              <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-xl text-emerald-800 text-xs flex items-center gap-2 font-medium">
                <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                <span>Không phát hiện dấu hiệu vi phạm nào ở video của <strong>{currentTargetLabel}</strong>!</span>
              </div>
            ) : (
              <div className="space-y-1.5 max-h-[220px] overflow-y-auto pr-1">
                {aiData.violations.map((v, i) => {
                  const itemKey = `${v.start_time}_${v.title}`;
                  const isAttached = attachedKeys[itemKey];

                  return (
                    <div
                      key={i}
                      className="flex items-center justify-between gap-2 p-2 bg-slate-50/90 hover:bg-slate-100 border border-slate-200 rounded-xl transition text-xs"
                    >
                      {/* Cột trái: Mốc thời gian (bấm để tua trực tiếp) + Nhãn + Tóm tắt ngắn 1 dòng */}
                      <div className="flex items-center gap-2 min-w-0 flex-1">
                        <button
                          type="button"
                          onClick={() => onSeekVideo && onSeekVideo(v.start_sec)}
                          className="px-2.5 py-1 bg-white hover:bg-indigo-50 hover:border-indigo-300 text-indigo-700 border border-slate-200 rounded-lg text-[11px] font-bold shrink-0 shadow-2xs transition flex items-center gap-1 cursor-pointer group"
                          title={`Nhấn để tua video trực tiếp đến ${v.start_time}`}
                        >
                          <Play className="h-2.5 w-2.5 fill-current text-indigo-500 group-hover:text-indigo-600" />
                          <span>{v.start_time} - {v.end_time}</span>
                        </button>
                        {getViolationBadge(v.type)}
                        <span className="text-slate-700 text-xs truncate font-medium" title={v.details || v.title}>
                          {v.details || v.title}
                        </span>
                      </div>

                      {/* Cột phải: Nút Ảnh & Nút Gắn */}
                      <div className="flex items-center gap-1.5 shrink-0">
                        {v.snapshot_url && (
                          <button
                            type="button"
                            onClick={() => setSelectedSnapshot(v)}
                            className="px-2.5 py-1 bg-white hover:bg-slate-100 text-slate-700 border border-slate-200 rounded-lg text-[11px] font-bold transition flex items-center gap-1 cursor-pointer shadow-2xs"
                            title="Xem ảnh chụp bằng chứng"
                          >
                            <Eye className="h-3 w-3 text-slate-500" />
                            <span>Ảnh</span>
                          </button>
                        )}

                        {onAttachEvidence && (
                          <button
                            type="button"
                            onClick={() => handleAttachItem(v)}
                            className={`px-2.5 py-1 rounded-lg text-[11px] font-bold transition-all flex items-center gap-1 cursor-pointer shadow-2xs border-none ${
                              isAttached
                                ? 'bg-emerald-600 text-white'
                                : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                            }`}
                            title="Đính kèm vi phạm này vào kết luận của Admin"
                          >
                            {isAttached ? (
                              <>
                                <Check className="h-3 w-3" />
                                <span>Đã Gắn</span>
                              </>
                            ) : (
                              <>
                                <Paperclip className="h-3 w-3" />
                                <span>Gắn</span>
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* FOOTER: POPUP VIDEO EVIDENCE (COMPACT) */}
          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Video bằng chứng có Bounding Box AI.</span>
            <button
              type="button"
              onClick={() => setShowEvidenceModal(true)}
              className="text-indigo-600 hover:text-indigo-800 font-bold transition flex items-center gap-1 cursor-pointer"
            >
              <Video className="h-3.5 w-3.5" />
              <span>Xem Video Bằng Chứng (Popup)</span>
              <ExternalLink className="h-3 w-3" />
            </button>
          </div>
        </div>
      )}

      {/* MODAL XEM VIDEO BẰNG CHỨNG AI */}
      {mounted && showEvidenceModal && aiData && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowEvidenceModal(false)}
        >
          <div
            className="relative max-w-3xl w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                <span>Video Bằng Chứng AI: <strong>{currentTargetLabel}</strong></span>
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={aiData.evidence_video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Mở tab mới
                </a>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-inner">
              <video
                key={aiData.evidence_video_url}
                src={aiData.evidence_video_url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[440px] object-contain mx-auto"
              >
                <source src={aiData.evidence_video_url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>,
        document.body
      )}

      {/* MODAL XEM ẢNH SNAPSHOT BẰNG CHỨNG */}
      {mounted && selectedSnapshot && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <span>📸</span> Ảnh Bằng Chứng: {selectedSnapshot.title}
                </h4>
                <p className="text-xs text-slate-500">
                  Thời điểm: {selectedSnapshot.start_time} - {selectedSnapshot.end_time} ({selectedSnapshot.duration_sec}s)
                </p>
              </div>
              <div className="flex items-center gap-3">
                {selectedSnapshot.snapshot_url && (
                  <a
                    href={selectedSnapshot.snapshot_url}
                    target="_blank"
                    rel="noreferrer"
                    className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                  >
                    <ExternalLink className="h-3.5 w-3.5" /> Mở ảnh gốc
                  </a>
                )}
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-2xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
              <img
                src={selectedSnapshot.snapshot_url}
                alt="AI Snapshot Evidence"
                className="w-full max-h-[60vh] object-contain mx-auto rounded-xl"
              />
            </div>

            {onAttachEvidence && selectedSnapshot && (
              <div className="pt-2 flex justify-end">
                <button
                  type="button"
                  onClick={() => {
                    handleAttachItem(selectedSnapshot);
                    setSelectedSnapshot(null);
                  }}
                  className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer shadow-2xs border-none"
                >
                  <Paperclip className="h-3.5 w-3.5" />
                  <span>Gắn Vào Phán Quyết</span>
                </button>
              </div>
            )}
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
