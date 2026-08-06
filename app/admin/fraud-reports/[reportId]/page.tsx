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
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Đang tải hồ sơ kiểm duyệt trận đấu...
        </p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-10 max-w-4xl mx-auto space-y-6">
        <Link href="/admin/fraud-reports" className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 font-bold">
          <ArrowLeft className="h-4 w-4" /> Trở về danh sách báo cáo
        </Link>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold uppercase text-rose-900">Không tìm thấy báo cáo</h3>
          <p className="text-xs text-slate-600">{error || 'Báo cáo gian lận không tồn tại hoặc đã bị xóa.'}</p>
        </div>
      </div>
    );
  }

  const { report, match, aiChecks, auditLogs } = detail;
  const isResolved = report.statusCode === 'RESOLVED';
  const p1Record = playbackData?.recordings?.[0];
  const p2Record = playbackData?.recordings?.[1];

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-fade-in">
      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <Link
            href="/admin/fraud-reports"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Trở về danh sách báo cáo
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
              VERIFICATION AUDIT PANEL
            </span>
            <span className="text-xs font-mono text-slate-400">Report ID: {report.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Kiểm Duyệt Trận Đấu (Match #{match.id?.slice(0, 8)})
          </h1>
        </div>

        {/* Report Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl border text-xs font-extrabold uppercase tracking-wider ${
              isResolved
                ? report.verdictCode === 'GUILTY'
                  ? 'bg-rose-50 text-rose-700 border-rose-200'
                  : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                : 'bg-amber-50 text-amber-700 border-amber-200'
            }`}
          >
            Trạng thái: {report.statusCode} {report.verdictCode ? `(${report.verdictCode})` : ''}
          </div>
        </div>
      </div>

      {/* Main Grid: Left Column Replay + Report Info, Right Column Timeline & Verdict */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
        {/* Left Column (7 cols): Dual Replay Video + Report Summary */}
        <div className="lg:col-span-7 flex flex-col space-y-6">
          {/* Dual Video Replay Player */}
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-600 flex items-center gap-2">
                <Video className="h-4 w-4 text-indigo-600" />
                <span>Dual Video Replay Player (Auto-Seek: {report.timestampText})</span>
              </h3>
              <span className="text-[10px] font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
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
              <div className="p-12 bg-white border border-slate-200 rounded-2xl text-center space-y-3 shadow-2xs">
                <Loader2 className="h-8 w-8 text-indigo-600 animate-spin mx-auto" />
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Đang kết nối luồng Video Replay...</p>
              </div>
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2 text-slate-500 shadow-2xs">
                <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold">Video Replay không khả dụng hoặc chưa tải xong.</p>
              </div>
            )}
          </div>

          {/* Report Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Nội dung Báo cáo Gian lận
              </h3>
              <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase rounded-md">
                {report.fraudType || 'OTHER'}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-4 text-xs">
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Người báo cáo (Reporter)</span>
                <p className="font-mono font-bold text-emerald-700">{report.reporterUserId}</p>
              </div>
              <div className="bg-slate-50 p-3 rounded-xl border border-slate-200 space-y-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase">Người bị báo cáo (Reported)</span>
                <p className="font-mono font-bold text-rose-700">{report.reportedUserId}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Mốc thời gian nghi vấn:</span>
                <span className="font-mono text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {report.timestampText} ({report.timestampSeconds} giây)
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Mô tả hành vi gian lận:</span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                  {report.description || 'Không có mô tả chi tiết.'}
                </p>
              </div>
            </div>

            {report.evidenceScreenshotUrl && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 text-indigo-600" /> Ảnh minh chứng bổ sung:
                </span>
                <a
                  href={report.evidenceScreenshotUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 underline break-all font-mono hover:text-indigo-800"
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
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-4 shadow-2xs">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-amber-700 flex items-center gap-2">
              <Activity className="h-4 w-4 text-amber-600" /> AI Check Timeline Analysis
            </h3>
            {aiChecks && aiChecks.length > 0 ? (
              <div className="space-y-2">
                {aiChecks.map((item, idx) => (
                  <div
                    key={idx}
                    className="p-3 bg-slate-50 border border-slate-200 rounded-xl flex items-center justify-between text-xs"
                  >
                    <div>
                      <span className="font-bold text-slate-900 uppercase">{item.checkType}</span>
                      <span className="text-[10px] text-slate-500 block">Model: {item.modelVersion || 'yolov8'}</span>
                    </div>
                    <div className="text-right">
                      <span
                        className={`font-mono font-bold uppercase text-[10px] px-2 py-0.5 rounded-md ${
                          item.status === 'PASSED'
                            ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                            : 'bg-rose-50 text-rose-700 border border-rose-200'
                        }`}
                      >
                        {item.status}
                      </span>
                      {item.confidence && (
                        <span className="text-[10px] text-slate-400 block font-mono">
                          {Math.round(item.confidence * 100)}% Conf
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400 font-medium">Chưa có bản ghi AI Check cho trận đấu này.</p>
            )}
          </div>

          {/* Audit Logs Timeline Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 space-y-3 shadow-2xs max-h-60 overflow-y-auto">
            <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-600 flex items-center gap-2">
              <Clock className="h-4 w-4 text-indigo-600" /> System Audit Logs
            </h3>
            {auditLogs && auditLogs.length > 0 ? (
              <div className="space-y-2 divide-y divide-slate-100 text-xs font-mono">
                {auditLogs.map((log, idx) => (
                  <div key={idx} className="pt-2 flex items-start justify-between text-[11px]">
                    <div>
                      <span className="font-bold text-indigo-600">{log.eventType}</span>
                      <span className="text-slate-400 block text-[10px]">
                        {new Date(log.createdAt).toLocaleTimeString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-xs text-slate-400">Chưa có audit log.</p>
            )}
          </div>

          {/* Admin Verdict Panel */}
          <div className="bg-white border border-indigo-200 rounded-2xl p-6 space-y-5 shadow-sm">
            <div className="space-y-1">
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-5 w-5 text-indigo-600" />
                <span>Phán Quyết Trọng Tài (Admin Verdict)</span>
              </h3>
              <p className="text-xs text-slate-500">
                Chọn phán quyết và nhập ghi chú để hệ thống tự động xử lý kết quả &amp; điểm Elo.
              </p>
            </div>

            {verdictSuccess ? (
              <div className="p-5 bg-emerald-50 border border-emerald-200 rounded-xl text-center space-y-3">
                <CheckCircle2 className="h-8 w-8 text-emerald-600 mx-auto" />
                <p className="text-xs font-bold text-emerald-800 uppercase tracking-wider">{verdictSuccess}</p>
                <Link
                  href="/admin/fraud-reports"
                  className="inline-flex items-center justify-center gap-2 w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all cursor-pointer border-none"
                >
                  <ArrowLeft className="h-4 w-4" /> Quay Lại Danh Sách Báo Cáo
                </Link>
              </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {/* 3 Verdict Buttons */}
                <div className="grid grid-cols-3 gap-2">
                  <button
                    type="button"
                    onClick={() => setSelectedVerdict('GUILTY')}
                    className={`py-3 px-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedVerdict === 'GUILTY'
                        ? 'bg-rose-600 text-white border-rose-600 shadow-md shadow-rose-600/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <XCircle className="h-4 w-4" />
                    <span>GUILTY</span>
                    <span className="text-[9px] font-normal opacity-80">(Có gian lận)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVerdict('INNOCENT')}
                    className={`py-3 px-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedVerdict === 'INNOCENT'
                        ? 'bg-emerald-600 text-white border-emerald-600 shadow-md shadow-emerald-600/20'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <CheckCircle2 className="h-4 w-4" />
                    <span>INNOCENT</span>
                    <span className="text-[9px] font-normal opacity-80">(Vô tội)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => setSelectedVerdict('INCONCLUSIVE')}
                    className={`py-3 px-2 rounded-xl border font-bold text-xs uppercase tracking-wider transition-all flex flex-col items-center gap-1 cursor-pointer ${
                      selectedVerdict === 'INCONCLUSIVE'
                        ? 'bg-slate-700 text-white border-slate-700 shadow-md'
                        : 'bg-slate-50 border-slate-200 text-slate-600 hover:text-slate-900'
                    }`}
                  >
                    <AlertTriangle className="h-4 w-4" />
                    <span>INCONCLUSIVE</span>
                    <span className="text-[9px] font-normal opacity-80">(Không đủ BC)</span>
                  </button>
                </div>

                {/* Admin Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Ghi chú Trọng tài (Admin Comment)
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Nhập lý do phán quyết và kết luận kiểm duyệt video..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors resize-none"
                  />
                </div>

                {/* Submit Verdict Button */}
                <button
                  type="submit"
                  disabled={isSubmitting || isResolved}
                  className="w-full py-3.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl uppercase tracking-wider shadow-md shadow-indigo-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none"
                >
                  {isSubmitting ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" /> Đang chốt phán quyết...
                    </>
                  ) : (
                    <>
                      <Send className="h-4 w-4" /> Chốt Phán Quyết &amp; Cập Nhật Elo
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
