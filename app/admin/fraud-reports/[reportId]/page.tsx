'use client';

import { AiCheckTimelineAnalysis } from '@/components/admin/AiCheckTimelineAnalysis';
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
  Edit3,
  Lock,
  RotateCcw,
  X,
  Eye,
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
  const reportId = (params?.reportId || params?.id || '') as string;

  const [detail, setDetail] = useState<FraudReportDetailDto | null>(null);
  const [playbackData, setPlaybackData] = useState<PlaybackResponseDto | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [isLoadingVideo, setIsLoadingVideo] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Verdict action state
  const [selectedVerdict, setSelectedVerdict] = useState<'GUILTY' | 'INNOCENT' | 'INCONCLUSIVE'>('GUILTY');
  const [adminComment, setAdminComment] = useState<string>('');
  const [previewImage, setPreviewImage] = useState<string | null>(null);
  const [attachedEvidences, setAttachedEvidences] = useState<{ title: string; time: string; snapshotUrl?: string; details: string }[]>([]);
  const [isEditing, setIsEditing] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [verdictSuccess, setVerdictSuccess] = useState<string | null>(null);

  const handleAttachEvidence = (v: any) => {
    setIsEditing(true);
    if (!attachedEvidences.some(e => e.time === `${v.start_time} - ${v.end_time}` && e.title === v.title)) {
      setAttachedEvidences(prev => [...prev, {
        title: v.title,
        time: `${v.start_time} - ${v.end_time}`,
        snapshotUrl: v.snapshot_url,
        details: v.details
      }]);

      setAdminComment(prev => {
        const entry = `[${v.start_time} - ${v.end_time}] ${v.title}: ${v.details}`;
        if (prev.includes(v.title) && prev.includes(v.start_time)) return prev;
        return prev ? `${prev}\n• ${entry}` : `• ${entry}`;
      });
    }
  };

  const handleAutoFillVerdict = (result: any, playerName: string) => {
    setIsEditing(true);
    if (result.has_violations) {
      setSelectedVerdict('GUILTY');
      const rangeText = result.scanned_range ? ` (${result.scanned_range})` : '';
      setAdminComment(`Fraud was detected${rangeText}. The administrator confirmed the violation and applied the appropriate penalty.`);
    } else {
      setSelectedVerdict('INNOCENT');
      setAdminComment(`No fraud was detected in ${playerName}'s video. The video is valid.\nConclusion: Report dismissed.`);
    }
  };

  const fetchDetail = async () => {
    if (!reportId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await getFraudReportDetail(reportId);
      setDetail(data);

      if (data?.report?.verdictCode) {
        setSelectedVerdict((data.report.verdictCode as any) || 'GUILTY');
      } else if (data?.report?.decision) {
        setSelectedVerdict((data.report.decision as any) || 'GUILTY');
      }

      if (data?.report?.adminNote) {
        setAdminComment(data.report.adminNote);
      }

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
      setError(err?.message || 'Unable to load the fraud report.');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchDetail();
  }, [reportId]);

  // Extract image links from report notes for the evidence gallery.
  const extractImageUrls = (text?: string): string[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|gif))/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches));
  };

  const parseSmartSeconds = (text?: string, existingSec?: number): number => {
    if (existingSec !== undefined && existingSec > 0) return existingSec;
    if (!text || !text.trim()) return 0;
    const raw = text.trim().toLowerCase();
    if (raw.includes(':')) {
      const parts = raw.split(':').map(p => parseInt(p.trim(), 10) || 0);
      if (parts.length === 2) return parts[0] * 60 + parts[1];
    }
    const minMatch = raw.match(/(\d+)\s*(?:phút|phut|p|m|min)/);
    const secMatch = raw.match(/(\d+)\s*(?:giây|giay|s|sec)/);
    let total = 0;
    if (minMatch) total += parseInt(minMatch[1], 10) * 60;
    if (secMatch) total += parseInt(secMatch[1], 10);
    if (minMatch || secMatch) return total;
    const num = parseInt(raw.replace(/\D/g, ''), 10);
    return isNaN(num) ? 0 : num;
  };

  const handleReviewSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!adminComment.trim()) {
      alert('Please enter administrator notes before submitting a verdict.');
      return;
    }

    setIsSubmitting(true);
    setVerdictSuccess(null);
    try {
      await reviewFraudReport(reportId, selectedVerdict, adminComment.trim());
      setVerdictSuccess(`${selectedVerdict} verdict saved and ELO updated successfully.`);
      setIsEditing(false);
      // Reload fresh data from server
      const freshData = await getFraudReportDetail(reportId);
      setDetail(freshData);
    } catch (err: any) {
      console.error('Failed to submit verdict:', err);
      alert(err?.message || 'Unable to submit the verdict. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col items-center justify-center p-6 space-y-4">
        <Loader2 className="h-10 w-10 text-indigo-600 animate-spin" />
        <p className="text-xs font-bold uppercase tracking-widest text-slate-500">
          Loading match review record...
        </p>
      </div>
    );
  }

  if (error || !detail) {
    return (
      <div className="min-h-screen bg-slate-50 text-slate-900 p-10 max-w-4xl mx-auto space-y-6">
        <Link href="/admin/fraud-reports" className="inline-flex items-center gap-2 text-xs text-slate-600 hover:text-slate-900 font-bold">
          <ArrowLeft className="h-4 w-4" /> Back to Fraud Reports
        </Link>
        <div className="p-8 bg-rose-50 border border-rose-200 rounded-2xl text-center space-y-3">
          <AlertTriangle className="h-10 w-10 text-rose-600 mx-auto" />
          <h3 className="text-base font-bold uppercase text-rose-900">Report Not Found</h3>
          <p className="text-xs text-slate-600">{error || 'The fraud report does not exist or was deleted.'}</p>
        </div>
      </div>
    );
  }

  const { report, match, aiChecks, auditLogs } = detail;
  const isResolved = report.statusCode === 'RESOLVED';
  // Map by seat playerId — recordings[] order from API is not guaranteed
  const p1Record = playbackData?.recordings?.find((r) => r.playerId === match.player1Id);
  const p2Record = playbackData?.recordings?.find((r) => r.playerId === match.player2Id);

  return (
    <div className="w-full max-w-full p-4 sm:p-6 lg:p-8 space-y-6 bg-slate-50 min-h-screen transition-all duration-300 animate-fade-in font-sans">

      {/* Navigation & Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-6 rounded-2xl border border-slate-200 shadow-2xs">
        <div className="space-y-1">
          <Link
            href="/admin/fraud-reports"
            className="inline-flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-900 font-semibold transition-colors mb-1"
          >
            <ArrowLeft className="h-3.5 w-3.5" /> Back to Fraud Reports
          </Link>
          <div className="flex items-center gap-2">
            <span className="px-3 py-0.5 text-[10px] font-extrabold uppercase tracking-wider bg-rose-50 text-rose-600 border border-rose-200 rounded-full">
              VERIFICATION AUDIT PANEL
            </span>
            <span className="text-xs text-slate-500 font-medium">Report ID: {report.id.slice(0, 8)}</span>
          </div>
          <h1 className="text-2xl font-extrabold tracking-tight text-slate-900">
            Match Review (Match #{match.id?.slice(0, 8)})
          </h1>
        </div>

        {/* Report Status Badge */}
        <div className="flex items-center gap-3">
          <div
            className={`px-4 py-2 rounded-xl border text-xs font-extrabold uppercase tracking-wider ${isResolved
              ? report.verdictCode === 'GUILTY'
                ? 'bg-rose-50 text-rose-700 border-rose-200'
                : 'bg-emerald-50 text-emerald-700 border-emerald-200'
              : 'bg-amber-50 text-amber-700 border-amber-200'
              }`}
          >
            Status: {report.statusCode} {report.verdictCode ? `(${report.verdictCode})` : ''}
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
                <p className="text-xs font-bold text-slate-500 uppercase tracking-widest">Connecting to Video Replay...</p>
              </div>
            ) : (
              <div className="p-8 bg-white border border-slate-200 rounded-2xl text-center space-y-2 text-slate-500 shadow-2xs">
                <AlertTriangle className="h-8 w-8 text-slate-400 mx-auto" />
                <p className="text-xs font-semibold">Video replay is unavailable or still loading.</p>
              </div>
            )}
          </div>

          {/* Report Information Card */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-rose-600 flex items-center gap-2">
                <FileText className="h-4 w-4" /> Fraud Report Details
              </h3>
              <span className="px-2.5 py-0.5 bg-rose-50 border border-rose-200 text-rose-700 text-[10px] font-bold uppercase rounded-md">
                {report.fraudType || 'OTHER'}
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 text-xs">
              <div className="bg-emerald-50/80 p-3 rounded-xl border border-emerald-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-emerald-800 uppercase tracking-wider">Reporter</span>
                  <span className="px-2 py-0.5 bg-emerald-600 text-white rounded text-[10px] font-bold">
                    {report.reporterUserId === match.player1Id ? 'PLAYER 1' : report.reporterUserId === match.player2Id ? 'PLAYER 2' : 'USER'}
                  </span>
                </div>
                <p className="text-xs font-bold text-slate-900 flex items-center gap-1">
                  <span>{report.reporterUserId === match.player1Id ? (match.player1Name || 'Player 1') : report.reporterUserId === match.player2Id ? (match.player2Name || 'Player 2') : 'Player'}</span>
                </p>
                <p className="font-sans font-medium text-[10px] text-slate-500 truncate" title={report.reporterUserId}>ID: {report.reporterUserId}</p>
              </div>

              <div className="bg-rose-50/80 p-3 rounded-xl border border-rose-200 space-y-1.5 shadow-2xs">
                <div className="flex items-center justify-between">
                  <span className="text-[10px] font-extrabold text-rose-800 uppercase tracking-wider">Reported Player</span>
                  <span className="px-2 py-0.5 bg-rose-600 text-white rounded text-[10px] font-bold animate-pulse">
                    {report.reportedUserId === match.player1Id ? 'PLAYER 1' : report.reportedUserId === match.player2Id ? 'PLAYER 2' : 'USER'}
                  </span>
                </div>
                <p className="text-xs font-bold text-rose-900 flex items-center gap-1">
                  <span>{report.reportedUserId === match.player1Id ? (match.player1Name || 'Player 1') : report.reportedUserId === match.player2Id ? (match.player2Name || 'Player 2') : 'Player'}</span>
                  <span className="text-[10px] text-rose-600 font-semibold">(Reported)</span>
                </p>
                <p className="font-sans font-medium text-[10px] text-slate-500 truncate" title={report.reportedUserId}>ID: {report.reportedUserId}</p>
              </div>
            </div>

            <div className="bg-slate-50 p-4 rounded-xl border border-slate-200 space-y-2">
              <div className="flex items-center justify-between text-xs font-bold text-slate-700">
                <span>Reported Timestamp:</span>
                <span className="font-sans font-semibold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded-md border border-indigo-200">
                  {report.timestampText} ({report.timestampSeconds} seconds)
                </span>
              </div>
              <div className="pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase block mb-1">Reported Behavior:</span>
                <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200">
                  {report.description || 'No detailed description was provided.'}
                </p>
              </div>
            </div>

            {report.evidenceScreenshotUrl && (
              <div className="space-y-1.5 pt-1">
                <span className="text-[10px] font-bold text-slate-400 uppercase flex items-center gap-1">
                  <ExternalLink className="h-3 w-3 text-indigo-600" /> Additional Evidence Images:
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
          <AiCheckTimelineAnalysis
            reportId={report.id}
            videoUrl={
              report.reportedUserId === match.player1Id
                ? (p1Record?.playbackUrl || '')
                : (p2Record?.playbackUrl || '')
            }
            targetPlayerName={
              report.reportedUserId === match.player1Id
                ? `${match.player1Name || 'Player 1'} (Reported Player)`
                : `${match.player2Name || 'Player 2'} (Reported Player)`
            }
            player1VideoUrl={p1Record?.playbackUrl || ''}
            player2VideoUrl={p2Record?.playbackUrl || ''}
            player1Name={match.player1Name || 'Player 1'}
            player2Name={match.player2Name || 'Player 2'}
            defaultTarget={report.reportedUserId === match.player1Id ? 'player1' : 'player2'}
            timestampSeconds={parseSmartSeconds(report.timestampText, report.timestampSeconds) || 75}
            timestampText={report.timestampText || '01:15'}
            onSeekVideo={(sec) => {
              const videoTags = document.querySelectorAll('video');
              videoTags.forEach(v => {
                v.currentTime = sec;
                v.play().catch(() => { });
              });
            }}
            onAttachEvidence={handleAttachEvidence}
            onAutoFillVerdict={handleAutoFillVerdict}
          />

          {/* Audit Logs Timeline Card */}
          {/* Card 2: Administrator verdict */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 space-y-4 shadow-2xs">
            <div className="border-b border-slate-100 pb-3 space-y-1">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-2">
                <ShieldAlert className="h-4 w-4 text-indigo-600" />
                <span>Administrator Verdict</span>
              </h3>
              <p className="text-xs text-slate-500">
                Select a verdict and add notes. The system will automatically update the match result and ELO.
              </p>
            </div>

            {/* Success Toast */}
            {verdictSuccess && (
              <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-xl flex items-center justify-between gap-3 text-xs text-emerald-800 font-semibold animate-in fade-in">
                <div className="flex items-center gap-2">
                  <CheckCircle2 className="h-4 w-4 text-emerald-600 shrink-0" />
                  <span>{verdictSuccess}</span>
                </div>
                <button
                  type="button"
                  onClick={() => setVerdictSuccess(null)}
                  className="text-emerald-600 hover:text-emerald-900 font-bold text-xs cursor-pointer"
                >
                  ✕
                </button>
              </div>
            )}

            {isResolved && !isEditing ? (
              <div className="space-y-4">
                {/* 24-hour Status Banner */}
                {report.canReReview !== false ? (
                  <div className="p-3.5 bg-amber-50 border border-amber-200 rounded-xl flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                    <div className="flex items-center gap-2 text-xs text-amber-800 font-medium">
                      <Clock className="h-4 w-4 text-amber-600 shrink-0" />
                      <span>
                        This verdict can be revised within 24 hours (approximately{' '}
                        <strong>{report.hoursLeftToReReview != null ? `${report.hoursLeftToReReview}h` : '<24h'}</strong>).
                      </span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(true)}
                      className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 cursor-pointer shrink-0 shadow-2xs self-start sm:self-auto border-none"
                    >
                      <Edit3 className="h-3.5 w-3.5" />
                      <span>Revise Verdict</span>
                    </button>
                  </div>
                ) : (
                  <div className="p-3.5 bg-slate-100 border border-slate-200 rounded-xl flex items-center gap-2 text-xs text-slate-600 font-medium">
                    <Lock className="h-4 w-4 text-slate-500 shrink-0" />
                    <span>This verdict is permanently locked because more than 24 hours have passed.</span>
                  </div>
                )}

                <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl space-y-2.5">
                  <div className="flex items-center justify-between border-b border-slate-200/60 pb-2">
                    <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">Final Verdict:</span>
                    <span className={`px-3 py-1 rounded-lg font-bold text-xs uppercase tracking-wider ${
                      report.verdictCode === 'GUILTY'
                        ? 'bg-rose-50 text-rose-700 border border-rose-200 shadow-2xs'
                        : report.verdictCode === 'INNOCENT'
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200 shadow-2xs'
                        : 'bg-slate-100 text-slate-700 border border-slate-200 shadow-2xs'
                    }`}>
                      {report.verdictCode || report.decision || 'RESOLVED'}
                    </span>
                  </div>

                  {report.reviewedAt && (
                    <div className="text-xs text-slate-500 flex items-center gap-1">
                      <Clock className="h-3.5 w-3.5 text-slate-400" />
                      <span>Reviewed At: {new Date(report.reviewedAt).toLocaleString('en-US')}</span>
                    </div>
                  )}

                  <div className="space-y-1">
                    <span className="text-[10px] font-bold uppercase text-slate-400">Administrator Notes:</span>
                    <p className="text-xs text-slate-800 leading-relaxed font-medium bg-white p-3 rounded-lg border border-slate-200 whitespace-pre-wrap">
                      {report.adminNote || 'No additional notes.'}
                    </p>
                  </div>
                </div>

                </div>
            ) : (
              <form onSubmit={handleReviewSubmit} className="space-y-4">
                {isEditing && (
                  <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-xl text-xs text-indigo-800 font-medium flex items-center justify-between gap-2">
                    <div className="flex items-center gap-1.5">
                      <Edit3 className="h-4 w-4 text-indigo-600 shrink-0" />
                      <span>You are revising the verdict. ELO and the match result will be recalculated automatically.</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="text-xs text-indigo-600 hover:text-indigo-900 font-bold underline cursor-pointer shrink-0"
                    >
                      Cancel
                    </button>
                  </div>
                )}

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
                    <span className="text-[9px] font-normal opacity-80">(Fraud Confirmed)</span>
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
                    <span className="text-[9px] font-normal opacity-80">(No Fraud)</span>
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
                    <span className="text-[9px] font-normal opacity-80">(Insufficient Evidence)</span>
                  </button>
                </div>

                {/* Admin Comment Textarea */}

                {/* Admin Comment Textarea */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold uppercase tracking-wider text-slate-700">
                    Administrator Notes
                  </label>
                  <textarea
                    rows={3}
                    placeholder="Enter the verdict rationale and video review conclusion..."
                    value={adminComment}
                    onChange={(e) => setAdminComment(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-indigo-600 transition-colors resize-none"
                  />
                </div>

                {/* Action Buttons */}
                <div className="flex items-center gap-2.5 pt-1">
                  {isEditing && (
                    <button
                      type="button"
                      onClick={() => setIsEditing(false)}
                      className="w-1/3 py-3.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-bold text-xs rounded-xl uppercase tracking-wider transition-all flex items-center justify-center gap-1 cursor-pointer border border-slate-200"
                    >
                      Cancel
                    </button>
                  )}
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className={`flex-1 py-3.5 font-bold text-xs rounded-xl uppercase tracking-wider shadow-md transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed border-none text-white ${
                      isEditing
                        ? 'bg-amber-600 hover:bg-amber-700 shadow-amber-600/20'
                        : 'bg-indigo-600 hover:bg-indigo-700 shadow-indigo-600/20'
                    }`}
                  >
                    {isSubmitting ? (
                      <>
                        <Loader2 className="h-4 w-4 animate-spin" /> Saving Verdict...
                      </>
                    ) : isEditing ? (
                      <>
                        <Edit3 className="h-4 w-4" /> Update Verdict &amp; ELO
                      </>
                    ) : (
                      <>
                        <Send className="h-4 w-4" /> Finalize Verdict &amp; Update ELO
                      </>
                    )}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>

      {/* Enlarged evidence image modal */}
      {previewImage && (
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 flex items-center gap-1.5">
                <span>📸</span> Violation Evidence Image
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Original Image
                </a>
                <button
                  onClick={() => setPreviewImage(null)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-lg hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>
            </div>

            <div className="rounded-xl overflow-hidden bg-slate-100 border border-slate-200 flex items-center justify-center p-1">
              <img
                src={previewImage}
                alt="Evidence Full"
                className="w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
