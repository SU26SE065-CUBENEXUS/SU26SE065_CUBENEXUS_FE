'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';

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

  useEffect(() => {
    setMounted(true);
  }, []);

  // Đóng modal khi nhấn phím ESC
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

  const getViolationBadge = (type: string) => {
    switch (type) {
      case 'RUBIK_LOST':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">MẤT RUBIK</span>;
      case 'MULTIPLE_PERSONS':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/30">&ge;2 NGƯỜI</span>;
      case 'EXTRA_HANDS':
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-purple-500/20 text-purple-300 border border-purple-500/30">TAY LẠ</span>;
      default:
        return <span className="px-1.5 py-0.5 rounded text-[10px] font-bold bg-red-500/20 text-red-300">VI PHẠM</span>;
    }
  };

  return (
    <div className="bg-slate-900 border border-slate-800 rounded-2xl p-4 shadow-xl text-slate-100 font-sans">
      {/* HEADER: COMPACT & CHỌN ĐỐI TƯỢNG + PHẠM VI QUÉT */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-800 pb-3">
        <div className="flex items-center gap-2">
          <span className="p-1.5 bg-indigo-500/20 text-indigo-400 rounded-lg text-sm font-bold">AI</span>
          <div>
            <h3 className="text-sm font-bold tracking-wide flex items-center gap-2">
              AI Check Timeline Analysis
              {aiData && (
                <span className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${aiData.has_violations
                  ? 'bg-rose-500/20 text-rose-400 border border-rose-500/30 animate-pulse'
                  : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                  }`}>
                  {aiData.has_violations ? `${aiData.total_violations} Vi Phạm` : 'Hợp Lệ'}
                </span>
              )}
            </h3>
            <p className="text-[11px] text-slate-400">
              Đối tượng quét: <strong className="text-amber-300">{currentTargetLabel}</strong>
            </p>
          </div>
        </div>

        {/* NÚT CHỌN ĐỐI TƯỢNG VÀ NÚT KÍCH HOẠT */}
        <div className="flex flex-wrap items-center gap-2">
          {(player1VideoUrl || player2VideoUrl) && (
            <div className="flex bg-slate-800 p-0.5 rounded-lg text-[11px]">
              <button
                type="button"
                onClick={() => { setSelectedTarget('player1'); setAiData(null); }}
                className={`px-2.5 py-1 rounded-md transition ${selectedTarget === 'player1' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {player1Name}
              </button>
              <button
                type="button"
                onClick={() => { setSelectedTarget('player2'); setAiData(null); }}
                className={`px-2.5 py-1 rounded-md transition ${selectedTarget === 'player2' ? 'bg-indigo-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              >
                {player2Name}
              </button>
            </div>
          )}

          {/* CHỌN PHẠM VI QUÉT */}
          <div className="flex bg-slate-800 p-0.5 rounded-lg text-[11px]">
            <button
              type="button"
              onClick={() => { setScanScope('WINDOW'); setAiData(null); }}
              className={`px-2.5 py-1 rounded-md transition flex items-center gap-1 ${scanScope === 'WINDOW' ? 'bg-amber-600 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Chỉ quét 15s trước và 15s sau mốc báo cáo (Cực nhanh: 1-2s)"
            >
              <span>Mốc ±15s ({formatSec(windowStart)} - {formatSec(windowEnd)})</span>
            </button>
            <button
              type="button"
              onClick={() => { setScanScope('FULL'); setAiData(null); }}
              className={`px-2.5 py-1 rounded-md transition ${scanScope === 'FULL' ? 'bg-slate-700 text-white font-bold' : 'text-slate-400 hover:text-white'}`}
              title="Quét toàn bộ video trận đấu"
            >
              <span>Toàn bộ</span>
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunAiCheck}
            disabled={loading}
            className="px-3.5 py-1.5 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white rounded-lg text-xs font-bold transition shadow-md disabled:opacity-50 flex items-center gap-1.5 cursor-pointer"
          >
            {loading ? (
              <>
                <svg className="animate-spin h-3.5 w-3.5 text-white" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                <span>Đang Quét Vi Phạm...</span>
              </>
            ) : (
              <span>{aiData ? 'Quét Lại' : 'Kích Hoạt AI Check'}</span>
            )}
          </button>
        </div>
      </div>

      {/* ERROR MSG */}
      {errorMsg && (
        <div className="mt-2.5 p-2 bg-rose-500/10 border border-rose-500/20 rounded-lg text-rose-300 text-[11px] flex items-center gap-1.5">
          <span>❌</span> {errorMsg}
        </div>
      )}

      {/* CHƯA QUÉT */}
      {!aiData && !loading && !errorMsg && (
        <div className="py-3 text-center text-slate-400 text-xs">
          Chế độ: <strong className="text-amber-300">{scanScope === 'WINDOW' ? `Quét nhanh mốc nghi vấn ${timestampText} (${formatSec(windowStart)} -> ${formatSec(windowEnd)})` : 'Quét toàn bộ video'}</strong> cho <strong>{currentTargetLabel}</strong>. Nhấn <strong>"Kích Hoạt AI Check"</strong> để bắt đầu.
        </div>
      )}

      {/* KẾT QUẢ ĐÃ PHÂN TÍCH */}
      {aiData && (
        <div className="mt-3 space-y-2.5">
          {/* STATS BAR */}
          <div className="flex flex-wrap items-center justify-between bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5 text-xs text-slate-300 font-mono gap-2">
            <span>Phạm vi: <strong className="text-amber-300">{aiData.scanned_range || aiData.video_duration_formatted}</strong></span>
            <span>Thời gian quét: <strong className="text-indigo-400">{aiData.processing_time_seconds}s</strong></span>
            <span>Độ tin cậy: <strong className="text-emerald-400">{aiData.confidence_score}%</strong></span>
            <span className={aiData.has_violations ? 'text-rose-400 font-bold' : 'text-emerald-400 font-bold'}>
              {aiData.has_violations ? `⚠️ ${aiData.total_violations} Vi Phạm` : '✅ Sạch'}
            </span>
          </div>

          {/* DANH SÁCH VI PHẠM */}
          {aiData.violations.length === 0 ? (
            <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 rounded-lg text-emerald-300 text-xs flex items-center gap-2">
              <span></span>
              <span>Không phát hiện dấu hiệu vi phạm nào ở video của <strong>{currentTargetLabel}</strong> trong phạm vi kiểm tra!</span>
            </div>
          ) : (
            <div className="space-y-1.5 max-h-[190px] overflow-y-auto pr-1">
              {aiData.violations.map((v, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between gap-2 p-2 bg-slate-800/50 hover:bg-slate-800 border border-slate-700/50 rounded-lg transition text-xs"
                >
                  <div className="flex items-center gap-2 min-w-0">
                    <span className="px-2 py-0.5 bg-slate-900 border border-slate-700 rounded text-[11px] font-mono text-amber-300 font-bold whitespace-nowrap">
                      {v.start_time} - {v.end_time}
                    </span>
                    <div className="min-w-0 truncate">
                      <div className="flex items-center gap-1.5">
                        {getViolationBadge(v.type)}
                        <span className="font-semibold text-slate-200 truncate">{v.title}</span>
                        <span className="text-[10px] text-slate-400">({v.duration_sec}s)</span>
                      </div>
                    </div>
                  </div>

                  {/* NÚT TUA VIDEO & ẢNH CHỤP */}
                  <div className="flex items-center gap-1.5 flex-shrink-0">
                    {v.snapshot_url && (
                      <button
                        type="button"
                        onClick={() => setSelectedSnapshot(v.snapshot_url || null)}
                        className="px-2 py-1 bg-slate-700 hover:bg-slate-600 text-slate-200 rounded text-[11px] font-medium transition cursor-pointer"
                        title="Xem ảnh chụp bằng chứng"
                      >
                        👁️ Ảnh
                      </button>
                    )}

                    <button
                      type="button"
                      onClick={() => onSeekVideo && onSeekVideo(v.start_sec)}
                      className="px-2.5 py-1 bg-indigo-600/30 hover:bg-indigo-600 text-indigo-300 hover:text-white border border-indigo-500/30 rounded text-[11px] font-semibold transition cursor-pointer"
                    >
                      ▶ Nhảy tới {v.start_time}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* NÚT BẬT POPUP XEM VIDEO BẰNG CHỨNG */}
          <div className="pt-2 border-t border-slate-800 flex justify-between items-center text-[11px] text-slate-400">
            <span>Video bằng chứng đã xuất sẵn Bounding Box & Cảnh báo đỏ.</span>
            <button
              type="button"
              onClick={() => setShowEvidenceModal(true)}
              className="text-indigo-400 hover:text-indigo-300 font-bold transition flex items-center gap-1 underline underline-offset-2 cursor-pointer"
            >
              🎬 Xem Video Bằng Chứng AI (Popup)
            </button>
          </div>
        </div>
      )}

      {/* MODAL XEM VIDEO BẰNG CHỨNG (DÙNG REACT PORTAL ĐẢM BẢO 100% CĂN CHÍNH GIỮA MÀN HÌNH) */}
      {mounted && showEvidenceModal && aiData && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setShowEvidenceModal(false)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl space-y-3 animate-in fade-in zoom-in-95 duration-150"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2.5">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>🎬</span> Video Bằng Chứng AI: <span className="text-amber-300">{currentTargetLabel}</span>
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={aiData.evidence_video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  🔗 Mở Tab Mới
                </a>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2.5 py-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-slate-800">
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

      {/* MODAL XEM ẢNH SNAPSHOT (DÙNG REACT PORTAL ĐẢM BẢO 100% CĂN CHÍNH GIỮA MÀN HÌNH) */}
      {mounted && selectedSnapshot && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-black/85 backdrop-blur-sm flex items-center justify-center p-4"
          onClick={() => setSelectedSnapshot(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-slate-900 border border-slate-700 rounded-2xl p-5 shadow-2xl animate-in fade-in zoom-in-95 duration-150 space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-800 pb-2">
              <h4 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                <span>📸</span> Ảnh Chụp Bằng Chứng Vi Phạm (AI Snapshot)
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={selectedSnapshot}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-400 hover:underline font-semibold"
                >
                  🔗 Mở ảnh gốc
                </a>
                <button
                  onClick={() => setSelectedSnapshot(null)}
                  className="text-slate-400 hover:text-white text-lg font-bold px-2.5 py-0.5 rounded-lg hover:bg-slate-800 transition cursor-pointer"
                >
                  ✕
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-black border border-slate-800 flex items-center justify-center">
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
