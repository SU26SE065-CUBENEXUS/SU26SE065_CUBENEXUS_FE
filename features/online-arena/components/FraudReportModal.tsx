'use client';

import React, { useState } from 'react';
import { X, ShieldAlert, Clock, AlertTriangle, Send, Loader2, CheckCircle2 } from 'lucide-react';
import { createFraudReport, CreateFraudReportPayload } from '../api/onlineArenaApi';

interface FraudReportModalProps {
  matchId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

const FRAUD_TYPES = [
  { id: 'HIDDEN_CUBE', label: 'Hidden Cube (Giấu Rubik dưới bàn/ngoài camera)' },
  { id: 'TIMER_MANIPULATION', label: 'Timer Manipulation (Bấm dừng/chạy timer bất thường)' },
  { id: 'CAMERA_OBSTRUCTION', label: 'Camera Obstruction (Che khuất camera/mờ đục)' },
  { id: 'ILLEGAL_SCRAMBLE', label: 'Illegal Scramble (Xáo trộn sai quy định/tráo cube)' },
  { id: 'EXTERNAL_ASSISTANCE', label: 'External Assistance (Nhờ sự trợ giúp của người khác)' },
  { id: 'OTHER', label: 'Other (Hành vi nghi vấn khác)' },
];

export function FraudReportModal({ matchId, isOpen, onClose, onSuccess }: FraudReportModalProps) {
  const [fraudType, setFraudType] = useState<string>('HIDDEN_CUBE');
  const [timestampText, setTimestampText] = useState<string>('01:15');
  const [description, setDescription] = useState<string>('');
  const [evidenceScreenshotUrl, setEvidenceScreenshotUrl] = useState<string>('');
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);

  if (!isOpen) return null;

  const parseTimestampSeconds = (text: string): number => {
    const parts = text.split(':');
    if (parts.length === 2) {
      const min = parseInt(parts[0], 10) || 0;
      const sec = parseInt(parts[1], 10) || 0;
      return min * 60 + sec;
    }
    return parseInt(text, 10) || 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Vui lòng nhập chi tiết mô tả hành vi gian lận.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const seconds = parseTimestampSeconds(timestampText);
    const payload: CreateFraudReportPayload = {
      fraudType,
      timestampText,
      timestampSeconds: seconds,
      description: description.trim(),
      evidenceScreenshotUrl: evidenceScreenshotUrl.trim() || undefined,
    };

    try {
      await createFraudReport(matchId, payload);
      setIsSuccess(true);
      setTimeout(() => {
        setIsSuccess(false);
        onSuccess?.();
        onClose();
      }, 1800);
    } catch (err: any) {
      console.error('Failed to submit fraud report:', err);
      setError(err?.message || 'Không thể gửi báo cáo gian lận. Vui lòng thử lại sau.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in">
      <div className="bg-zinc-950 border border-zinc-800 rounded-3xl w-full max-w-lg shadow-2xl space-y-5 p-6 relative">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-5 right-5 p-2 rounded-full bg-zinc-900 hover:bg-zinc-800 text-zinc-400 hover:text-white transition-all cursor-pointer z-10 disabled:opacity-50"
        >
          <X className="h-5 w-5" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-800/80">
          <div className="p-2.5 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-500">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-white uppercase tracking-wider">Báo cáo Gian lận Trận đấu</h3>
            <p className="text-xs text-zinc-400">Gửi khiếu nại chi tiết kèm mốc thời gian để Trọng tài kiểm duyệt.</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-8 text-center space-y-3 animate-fade-in">
            <CheckCircle2 className="h-12 w-12 text-emerald-400 mx-auto" />
            <h4 className="text-base font-black text-white uppercase">Đã gửi Báo cáo Thành công!</h4>
            <p className="text-xs text-zinc-400 max-w-xs mx-auto">
              Báo cáo đã được chuyển đến Ban Quản Trị & Trọng tài. Kết quả xử lý sẽ được cập nhật sớm nhất.
            </p>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Fraud Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                1. Loại hành vi gian lận (Fraud Type)
              </label>
              <select
                value={fraudType}
                onChange={(e) => setFraudType(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-white focus:outline-none focus:border-orange-500 transition-colors"
              >
                {FRAUD_TYPES.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.label}
                  </option>
                ))}
              </select>
            </div>

            {/* 2. Timestamp */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>2. Mốc thời gian xuất hiện gian lận (Timestamp)</span>
                <span className="text-[10px] text-orange-400 font-mono">Định dạng MM:SS</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-500" />
                <input
                  type="text"
                  placeholder="01:15"
                  value={timestampText}
                  onChange={(e) => setTimestampText(e.target.value)}
                  className="w-full bg-zinc-900 border border-zinc-800 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold text-white focus:outline-none focus:border-orange-500 transition-colors"
                />
              </div>
            </div>

            {/* 3. Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300">
                3. Chi tiết mô tả (Description)
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Đối thủ giấu Rubik bên dưới mép bàn từ phút 01:15 đến 01:22..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl p-3 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors resize-none"
              />
            </div>

            {/* 4. Optional Evidence URL */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-300 flex items-center justify-between">
                <span>4. Ảnh minh chứng bổ sung (Optional Screenshot URL)</span>
                <span className="text-[10px] text-zinc-500 font-semibold">Tùy chọn</span>
              </label>
              <input
                type="url"
                placeholder="https://..."
                value={evidenceScreenshotUrl}
                onChange={(e) => setEvidenceScreenshotUrl(e.target.value)}
                className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-orange-500 transition-colors"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-500/10 border border-rose-500/20 p-3 rounded-xl text-rose-300 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-400" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/3 py-3 bg-zinc-900 hover:bg-zinc-800 text-zinc-300 font-bold text-xs rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
              >
                {isSubmitting ? (
                  <>
                    <Loader2 className="h-4 w-4 animate-spin" /> Đang gửi báo cáo...
                  </>
                ) : (
                  <>
                    <Send className="h-4 w-4" /> Gửi Báo Cáo Gian Lận
                  </>
                )}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  );
}
