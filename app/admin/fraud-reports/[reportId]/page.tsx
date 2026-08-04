'use client';

import React, { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  ShieldAlert,
  ArrowLeft,
  Clock,
  User,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  Send,
  Loader2,
  Video,
  FileText,
  Activity,
  Award,
  Hash,
  ExternalLink,
} from 'lucide-react';
import {
  getFraudReportDetail,
  reviewFraudReport,
  getMatchRecordingPlaybackUrls,
  FraudReportDetailDto,
  PlaybackResponseDto,
} from '@/features/online-arena/api/onlineArenaApi';
import { SplitScreenReplayPlayer } from '@/features/online-arena/components/SplitScreenReplayPlayer';

export default function AdminFraudReportReviewDetailPage() {
  const params = useParams();
  const router = useRouter();
  const reportId = params?.reportId as string;

  const [detail, setDetail] = useState<FraudReportDetailDto | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verdict action state
  const [selectedVerdict, setSelectedVerdict] = useState<'GUILTY' | 'INNOCENT' | 'INCONCLUSIVE'>('GUILTY');
  const [adminComment, setAdminComment] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verdictSuccess, setVerdictSuccess] = useState<string | null>(null);

  const fetchDetail = async () => {
    if (!reportId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFraudReportDetail(reportId);
      setDetail(data);

      if (data?.report?.matchId) {
        setIsLoadingVideo(true);
        try {
          const videoData = await getMatchRecordingPlaybackUrls(data.report.matchId);
          setPlaybackData(videoData);
        } catch (vErr) {
          console.warn('[AdminReview] Failed to fetch video playback stream:', vErr);
        } finally {
          setIsLoadingVideo(false);
        }
      }
    } catch (err: any) {
      console.error('Failed to load fraud report detail:', err);
      setError(err?.message || 'Không thể tải thông tin báo cáo gian lận.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [reportId]);

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminComment.trim()) {
      alert('Vui lòng nhập nhận xét/ghi chú của Trọng tài trước khi ra phán quyết.');
      return;
    }

    setIsSubmitting(true);
    setVerdictSuccess(null);
    try {
      await reviewFraudReport(reportId, selectedVerdict, adminComment.trim());
      setVerdictSuccess(`Đã xử lý phán quyết ${selectedVerdict} thành công!`);
      setTimeout(() => {
        router.push('/admin/fraud-reports');
      }, 2000);
    } catch (err: any) {
      console.error('Failed to submit verdict:', err);
      alert(err?.message || 'Lỗi khi gửi phán quyết. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-10 w-10 text-orange-500 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">
          Đang tải hồ sơ kiểm duyệt trận đấu...
        </p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-black text-white p-10 max-w-4xl mx-auto space-y-6">
        <Link href="/admin/fraud-reports" className="inline-flex items-center gap-2 text-xs text-zinc-400 hover:text-white">
          <ArrowLeft className="h-4 w-4" /> Trở về danh sách báo cáo
        </Link>
        <div className="p-8 bg-rose-500/10 border border-rose-500/20 rounded-3xl text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-500 mx-auto" />
          <h3 className="text-base font-black uppercase text-rose-400">Không tìm thấy báo cáo</h3>
          <p className="text-xs text-zinc-400">{error || 'Báo cáo gian lận không tồn tại hoặc đã bị xóa.'}</p>
        </div>
      </div>
    );
  }

  const { report, match, aiChecks, auditLogs } = detail;
  const isResolved = report.statusCode === 'RESOLVED';
  const p1Record = playbackData?.recordings?.[0];
  const p2Record = playbackData?.recordings?.[1];

  return (
    <div className="min-h-screen bg-black text-white p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-fade-in">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-zinc-800">
        <div className="space-y-1">
          <Link
            href="/admin/fraud-reports"
            className="inline-flex items-center gap-1.5 text-xs text-zinc-400 hover:text-white font-semibold transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Trở về danh sách báo cáo
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 text-[10px] font-black uppercase tracking-widest bg-rose-500/20 text-rose-400 border border-rose-500/30 rounded-full">
              VERIFICATION AUDIT PANEL
            </span>
            <span className="text-xs font-mono text-zinc-500">Report ID: {report.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-black uppercase tracking-wider text-white">
            Kiểm Duyệt Trận Đấu (Match #{match.id?.slice(0, 8)})
          </h1>
        </div>

        {/* Report Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-2xl border text-xs font-black uppercase tracking-wider ${
              isResolved
                ? report.verdictCode === 'GUILTY'
                  ? 'bg-rose-500/20 text-rose-400 border-rose-500/40'
                  : 'bg-emerald-500/20 text-emerald-400 border-emerald-500/40'
                : 'bg-orange-500/20 text-orange-400 border-orange-500/40 animate-pulse'
            }`}
          >
            Trạng thái: {report.statusCode} {report.verdictCode ? `(${report.verdictCode})` : ''}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Replay + Report Info, Right Column Timeline & Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Left Column (8 cols): Dual Replay Video + Report Summary */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Dual Video Replay Player */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-black uppercase tracking-wider text-zinc-300 flex items-center gap-2">
                <Video className="h-4 w-4 text-orange-400" />
                <span>Dual Video Replay Player (Auto-Seek: {report.timestampText})</span>
              </h3>
              <span className="text-[10px] font-mono text-orange-400 bg-orange-500/10 px-2 py-0.5 rounded-full border border-orange-500/20">
                Timestamp: {report.timestampSeconds}s
              </span>
            </div>

            {playbackData ? (
              <SplitScreenReplayPlayer
                matchId={match.id}
                playerA={{
                  username: match.player1Name || 'Player 1',
                  videoUrl: p1Record?.playbackUrl || '',
                  solveTimeSeconds: (match.player1TimeMs || 10000) / 1000,
                  videoDurationSeconds: p1Record?.durationSeconds,
                }}
                playerB={{
                  username: match.player2Name || 'Player 2',
                  videoUrl: p2Record?.playbackUrl || '',
                  solveTimeSeconds: (match.player2TimeMs || 10000) / 1000,
                  videoDurationSeconds: p2Record?.durationSeconds,
                }}
                officialWinnerName={match.winnerName || 'Unknown'}
                officialWinnerText={match.outcome}
              />
            ) : isLoadingVideo ? (
              <div className="p-12 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-3">
                <Loader2 className="h-8 w-8 text-orange-500 animate-spin mx-auto" />
                <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">Đang kết nối luồng Video Replay...</p>
              </div>
            ) : (
              <div className="p-8 bg-zinc-950 border border-zinc-800 rounded-3xl text-center space-y-2 text-zinc-400">
                <AlertTriangle className="h-8 w-8 text-zinc-600 mx-auto" />
                <p className="text-xs font-semibold">Video Replay không khả dụng hoặc chưa tải xong.</p>
              </div>
            )}
          </div>

          {/* Report Information Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-zinc-800 pb-3">
              <h3 className="text-xs font-black uppercase tracking-wider text-rose-400 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Nội dung Báo cáo Gian lận
              </h3>
              <span className="px-2.5 py-0.5 bg-rose-500/10 border border-rose-500/20 text-rose-400 text-[10px] font-black uppercase rounded-full">
                {report.fraudType || 'OTHER'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Người báo cáo (Reporter)</span>
                <p className="font-mono font-bold text-emerald-400">{report.reporterUserId}</p>
              </div>
              <div className="bg-zinc-900/60 p-3 rounded-2xl border border-zinc-800/80 space-y-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase">Người bị báo cáo (Reported)</span>
                <p className="font-mono font-bold text-rose-400">{report.reportedUserId}</p>
              </div>
            </div>

            <div className="bg-zinc-900/60 p-4 rounded-2xl border border-zinc-800/80 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-zinc-300">
                <span>Mốc thời gian nghi vấn:</span>
                <span className="font-mono text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-md border border-amber-500/20">
                  {report.timestampText} ({report.timestampSeconds} giây)
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase block mb-1">Mô tả hành vi gian lận:</span>
                <p className="text-xs text-zinc-200 leading-relaxed font-medium bg-zinc-950 p-3 rounded-xl border border-zinc-800">
                  {report.description || 'Không có mô tả chi tiết.'}
                </p>
              </div>
            </div>

            {report.evidenceScreenshotUrl && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-zinc-500 uppercase flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 text-orange-400" /> Ảnh minh chứng bổ sung:
                </span>
                <a
                  href={report.evidenceScreenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-orange-400 underline break-all font-mono hover:text-orange-300"
                >
                  {report.evidenceScreenshotUrl}
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Right Column (5 cols): AI Checks, Audit Trail & Verdict Actions */}
        <div className="lg:col-span-5 flex flex-col space-y-6">
          {/* AI Check Timeline Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-4 shadow-xl">
            <h3 className="text-xs font-black uppercase tracking-wider text-amber-400 flex items-center gap-2">
              <Activity className="h-4 w-4" /> AI Check Timeline Analysis
            </h3>
            {aiChecks && aiChecks.length > 0 ? (
              <div className="space-y-2">
                {aiChecks.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-zinc-900/60 border border-zinc-800 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-white uppercase">{item.checkType}</span>
                      <span className="text-[10px] text-zinc-500 block">Model: {item.modelVersion || 'yolov8'}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded-full ${
                          item.status === 'PASSED'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-rose-500/10 text-rose-400 border border-rose-500/20'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.confidence && (
                        <span className="text-[10px] text-zinc-400 block font-mono">
                          {Math.round(item.confidence * 100)}% Conf
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500 font-medium">Chưa có bản ghi AI Check cho trận đấu này.</p>
            )}
          </div>

          {/* Audit Logs Timeline Card */}
          <div className="bg-zinc-950 border border-zinc-800 rounded-3xl p-5 space-y-3 shadow-xl max-h-60 overflow-y-auto">
            <h3 className="text-xs font-black uppercase tracking-wider text-zinc-400 flex items-center gap-2">
              <Clock className="h-4 w-4 text-orange-400" /> System Audit Logs
            </h3>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2 divide-y divide-zinc-900 text-xs font-mono">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="pt-2 flex items-start justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-orange-400">{log.eventType}</span>
                      <span className="text-zinc-500 block text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-zinc-500">Chưa có audit log.</p>
            )}
          </div>

          {/* Admin Verdict Panel */}
          <div className="bg-zinc-950 border border-orange-500/30 rounded-3xl p-6 space-y-5 shadow-2xl backdrop-blur-md">
            <div className="space-y-1">
              <h3 className="text-sm font-black uppercase tracking-wider text-white flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-orange-500" />
                <span>Phán Quyết Trọng Tài (Admin Verdict)</span>
              </h3>
              <p className="text-xs text-zinc-400">
                Chọn phán quyết và nhập ghi chú để hệ thống tự động xử lý kết quả & điểm Elo.
              </p>
            </div>

            {verdictSuccess ? (
              <div className="p-4 bg-emerald-500/10 border border-emerald-500/30 rounded-2xl text-center space-y-2">
                <CheckCircle2 className="h-8 w-8 text-emerald-400 mx-auto" />
                <p className="text-xs font-bold text-emerald-300 uppercase tracking-wider">{verdictSuccess}</p>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* 3 Verdict Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVerdict('GUILTY')}
                    className={`py-3 px-2 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedVerdict === 'GUILTY'
                        ? 'bg-rose-600 text-white border-rose-500 shadow-lg shadow-rose-600/30 scale-[1.02]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>GUILTY</span>
                    <span className="text-[9px] font-normal opacity-80">(Có gian lận)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVerdict('INNOCENT')}
                    className={`py-3 px-2 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedVerdict === 'INNOCENT'
                        ? 'bg-emerald-600 text-white border-emerald-500 shadow-lg shadow-emerald-600/30 scale-[1.02]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>INNOCENT</span>
                    <span className="text-[9px] font-normal opacity-80">(Vô tội)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVerdict('INCONCLUSIVE')}
                    className={`py-3 px-2 rounded-2xl border font-black text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedVerdict === 'INCONCLUSIVE'
                        ? 'bg-zinc-700 text-white border-zinc-600 shadow-lg scale-[1.02]'
                        : 'bg-zinc-900 border-zinc-800 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>INCONCLUSIVE</span>
                    <span className="text-[9px] font-normal opacity-80">(Không đủ BC)</span>
                  </button>
                </div>

                {/* Admin Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                    Ghi chú Trọng tài (Admin Comment)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập lý do phán quyết và kết luận kiểm duyệt video..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
                  />
                </div>

                {/* Submit Verdict Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isResolved}
                  className="w-full py-3.5 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:from-orange-600 hover:to-amber-600 text-white font-black text-xs rounded-2xl uppercase tracking-wider shadow-xl shadow-orange-500/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang chốt phán quyết...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Chốt Phán Quyết & Cập Nhật Elo
                    </>
                  )}
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
