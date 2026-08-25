'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import {
  Sparkles,
  Play,
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
  targetPlayerName = 'Reported player',
  player1VideoUrl,
  player2VideoUrl,
  player1Name = 'Player 1',
  player2Name = 'Player 2',
  defaultTarget = 'player1',
  timestampSeconds = 75,
  timestampText = '01:15',
  onSeekVideo,
  apiUrl = process.env.NEXT_PUBLIC_AI_FRAUD_DETECT_URL || 'https://reset-glue-popper.ngrok-free.dev',
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
  const [attachedKeys, setAttachedKeys] = useState<Record<string, boolean>>({});
  const [autoFilledSuccess, setAutoFilledSuccess] = useState(false);

  const evidenceVideoRef = React.useRef<HTMLVideoElement | null>(null);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Close modal on ESC
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setShowEvidenceModal(false);
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

  const handleSeek = (startSec: number) => {
    if (onSeekVideo) {
      onSeekVideo(startSec);
    }
    if (evidenceVideoRef.current) {
      evidenceVideoRef.current.currentTime = startSec;
      evidenceVideoRef.current.play().catch(() => {});
    }
  };

  const handleRunAiCheck = async () => {
    if (!activeVideoUrl) {
      alert(`No match video was found for ${currentTargetLabel}.`);
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
        throw new Error(`AI microservice error: ${response.statusText}`);
      }

      const data: AiCheckResult = await response.json();
      setAiData(data);
    } catch (err: any) {
      console.error('AI Check Error:', err);
      setErrorMsg(
        err.message ||
          `Unable to connect to the AI Fraud Detection service at ${apiUrl}. Please check the server status.`
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
          <span className="px-2 py-0.5 bg-rose-100 text-rose-700 text-[10px] font-bold rounded-md shrink-0 border border-rose-200">
            Cube Missing
          </span>
        );
      case 'MULTIPLE_PERSONS':
        return (
          <span className="px-2 py-0.5 bg-amber-100 text-amber-800 text-[10px] font-bold rounded-md shrink-0 border border-amber-200">
            Multiple People
          </span>
        );
      case 'EXTRA_HANDS':
        return (
          <span className="px-2 py-0.5 bg-purple-100 text-purple-800 text-[10px] font-bold rounded-md shrink-0 border border-purple-200">
            Third-Party Hand
          </span>
        );
      default:
        return (
          <span className="px-2 py-0.5 bg-slate-100 text-slate-700 text-[10px] font-bold rounded-md shrink-0 border border-slate-200">
            {type}
          </span>
        );
    }
  };

  return (
    <div className="bg-white border border-slate-200 rounded-3xl p-4 shadow-2xs space-y-3 font-sans">
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 pb-3">
        <div className="flex items-center gap-2">
          <div className="h-8 w-8 rounded-xl bg-indigo-50 border border-indigo-100 flex items-center justify-center text-indigo-600 shadow-2xs">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
              <span>AI Check Timeline Analysis</span>
              <span className="bg-indigo-50 border border-indigo-200 text-indigo-700 text-[10px] font-bold px-2 py-0.5 rounded-full uppercase">
                v2.4 YOLO/ResNet
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Scan video frames for a missing cube, an unknown hand, or multiple people in the room.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <div className="bg-slate-100 p-0.5 rounded-xl flex items-center border border-slate-200 text-xs">
            <button
              type="button"
              onClick={() => setSelectedTarget('player1')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedTarget === 'player1'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {player1Name}
            </button>
            <button
              type="button"
              onClick={() => setSelectedTarget('player2')}
              className={`px-3 py-1 rounded-lg font-bold transition-all cursor-pointer ${
                selectedTarget === 'player2'
                  ? 'bg-white text-indigo-600 shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {player2Name}
            </button>
          </div>
        </div>
      </div>

      <div className="bg-slate-50 border border-slate-200 rounded-2xl p-3 space-y-2">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <div className="flex items-center gap-2 text-xs">
            <span className="font-bold text-slate-700">Scan Mode:</span>
            <button
              type="button"
              onClick={() => setScanScope('WINDOW')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-xs cursor-pointer border ${
                scanScope === 'WINDOW'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              ±15s Window ({formatSec(windowStart)} - {formatSec(windowEnd)})
            </button>
            <button
              type="button"
              onClick={() => setScanScope('FULL')}
              className={`px-2.5 py-1 rounded-lg font-bold transition text-xs cursor-pointer border ${
                scanScope === 'FULL'
                  ? 'bg-indigo-600 text-white border-indigo-600 shadow-2xs'
                  : 'bg-white text-slate-600 border-slate-200 hover:bg-slate-100'
              }`}
            >
              Full Video
            </button>
          </div>

          <button
            type="button"
            onClick={handleRunAiCheck}
            disabled={loading}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl shadow-md shadow-indigo-200 transition flex items-center gap-2 cursor-pointer border-none disabled:opacity-50"
          >
            {loading ? (
              <>
                <Zap className="h-3.5 w-3.5 animate-spin" />
                <span>Running AI scan...</span>
              </>
            ) : (
              <>
                <Sparkles className="h-3.5 w-3.5" />
                <span>Run AI Check</span>
              </>
            )}
          </button>
        </div>

        {errorMsg && (
          <div className="p-2.5 bg-rose-50 border border-rose-200 text-rose-700 rounded-xl text-xs flex items-center gap-2 font-medium">
            <AlertTriangle className="h-4 w-4 shrink-0 text-rose-500" />
            <span>{errorMsg}</span>
          </div>
        )}
      </div>

      {/* RESULTS DISPLAY PANEL */}
      {aiData && (
        <div className="space-y-3 pt-1">
          {/* OVERVIEW STATS BANNER */}
          <div className="flex flex-wrap items-center justify-between gap-3 p-3 bg-indigo-50/70 border border-indigo-100 rounded-2xl text-xs">
            <div className="flex items-center gap-3">
              <div>
                <span className="text-slate-500 font-medium">AI Verdict: </span>
                <span
                  className={`font-black uppercase px-2 py-0.5 rounded-md ${
                    aiData.verdict === 'SUSPICIOUS'
                      ? 'bg-rose-100 text-rose-700 border border-rose-200'
                      : 'bg-emerald-100 text-emerald-700 border border-emerald-200'
                  }`}
                >
                  {aiData.verdict === 'SUSPICIOUS' ? 'SUSPICIOUS ACTIVITY' : 'CLEAN / VALID'}
                </span>
              </div>
              <div className="text-slate-600 font-medium">
                Confidence: <strong className="text-slate-900 font-bold">{aiData.confidence_score}%</strong>
              </div>
              <div className="text-slate-600 font-medium">
                Violations: <strong className="text-rose-600 font-bold">{aiData.total_violations}</strong>
              </div>
            </div>

            <div className="flex items-center gap-2">
              {onAutoFillVerdict && (
                <button
                  type="button"
                  onClick={handleAutoFill}
                  className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer border-none shadow-2xs ${
                    autoFilledSuccess
                      ? 'bg-emerald-600 text-white'
                      : 'bg-indigo-600 hover:bg-indigo-700 text-white'
                  }`}
                >
                  {autoFilledSuccess ? (
                    <>
                      <CheckCircle2 className="h-3.5 w-3.5" />
                      <span>Verdict Applied</span>
                    </>
                  ) : (
                    <>
                      <Zap className="h-3.5 w-3.5" />
                      <span>Apply AI Verdict</span>
                    </>
                  )}
                </button>
              )}

              <button
                type="button"
                onClick={() => setShowEvidenceModal(true)}
                className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white font-bold text-xs rounded-xl transition flex items-center gap-1.5 cursor-pointer shadow-sm border-none"
              >
                <Video className="h-3.5 w-3.5" />
                <span>View AI Analysis Video</span>
                <ExternalLink className="h-3 w-3 opacity-80" />
              </button>
            </div>
          </div>
        </div>
      )}

      {/* AI evidence video modal */}
      {mounted && showEvidenceModal && aiData && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/80 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setShowEvidenceModal(false)}
        >
          <div
            className="relative max-w-4xl w-full bg-white border border-slate-200 rounded-3xl p-5 shadow-2xl space-y-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-3">
              <div className="space-y-0.5">
                <h4 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                  <Video className="h-4 w-4 text-indigo-600" />
                  <span>AI Analysis Video (Bounding Boxes &amp; Annotations): <strong>{currentTargetLabel}</strong></span>
                </h4>
                <p className="text-xs text-slate-500">
                  The AI-scanned video includes object-detection overlays.
                </p>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={aiData.evidence_video_url}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open in New Tab
                </a>
                <button
                  onClick={() => setShowEvidenceModal(false)}
                  className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1.5 rounded-xl hover:bg-slate-100 transition cursor-pointer"
                >
                  <X className="h-5 w-5" />
                </button>
              </div>
            </div>

            {/* VIDEO PLAYER CONTAINING ANNOTATED VIDEO */}
            <div className="rounded-2xl overflow-hidden bg-black border border-slate-200 shadow-inner relative group">
              <video
                ref={evidenceVideoRef}
                key={aiData.evidence_video_url}
                src={aiData.evidence_video_url}
                controls
                autoPlay
                playsInline
                className="w-full max-h-[480px] object-contain mx-auto"
              >
                <source src={aiData.evidence_video_url} type="video/mp4" />
              </video>
            </div>
          </div>
        </div>,
        document.body
      )}
    </div>
  );
};
