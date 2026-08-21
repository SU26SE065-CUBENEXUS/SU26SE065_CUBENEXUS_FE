'use client';

import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
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
  
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [isSuccess, setIsSuccess] = useState<boolean>(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

    const parseTimestampSeconds = (text: string): { seconds: number; formatted: string } => {
    if (!text || !text.trim()) return { seconds: 0, formatted: '00:00' };
    const raw = text.trim().toLowerCase();

    // 1. Dạng MM:SS hoặc HH:MM:SS (01:15, 1:15, 0:45)
    if (raw.includes(':')) {
      const parts = raw.split(':').map((p) => parseInt(p.trim(), 10) || 0);
      if (parts.length === 2) {
        const sec = parts[0] * 60 + parts[1];
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return { seconds: sec, formatted: `${m}:${s}` };
      }
      if (parts.length === 3) {
        const sec = parts[0] * 3600 + parts[1] * 60 + parts[2];
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return { seconds: sec, formatted: `${m}:${s}` };
      }
    }

    // 2. Dạng tự nhiên (1 phút 15 giây, 1p 15s, 1m15s, 75 giây, 75s)
    const minMatch = raw.match(/(\d+)\s*(?:phút|phut|p|m|min)/);
    const secMatch = raw.match(/(\d+)\s*(?:giây|giay|s|sec)/);

    let totalSec = 0;
    let hasMatch = false;

    if (minMatch) {
      totalSec += parseInt(minMatch[1], 10) * 60;
      hasMatch = true;
    }
    if (secMatch) {
      totalSec += parseInt(secMatch[1], 10);
      hasMatch = true;
    }

    if (hasMatch) {
      const m = Math.floor(totalSec / 60).toString().padStart(2, '0');
      const s = (totalSec % 60).toString().padStart(2, '0');
      return { seconds: totalSec, formatted: `${m}:${s}` };
    }

    // 3. Chỉ nhập số đơn thuần (ví dụ: 75 hoặc 90)
    const num = parseInt(raw.replace(/\D/g, ''), 10);
    if (!isNaN(num) && num > 0) {
      const m = Math.floor(num / 60).toString().padStart(2, '0');
      const s = (num % 60).toString().padStart(2, '0');
      return { seconds: num, formatted: `${m}:${s}` };
    }

    return { seconds: 0, formatted: '00:00' };
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!description.trim()) {
      setError('Vui lòng nhập chi tiết mô tả hành vi gian lận.');
      return;
    }

    setIsSubmitting(true);
    setError(null);

    const parsed = parseTimestampSeconds(timestampText);
    const payload: CreateFraudReportPayload = {
      fraudType,
      timestampText: parsed.formatted,
      timestampSeconds: parsed.seconds,
      description: description.trim(),
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

  return createPortal(
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/50 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white border border-zinc-200 rounded-2xl w-full max-w-md shadow-2xl space-y-4 p-5 sm:p-6 relative text-left text-zinc-800">
        {/* Close Button */}
        <button
          onClick={onClose}
          disabled={isSubmitting}
          className="absolute top-4 right-4 p-1.5 rounded-lg text-zinc-500 hover:text-zinc-900 hover:bg-zinc-100 transition-colors cursor-pointer z-10 disabled:opacity-50"
        >
          <X className="h-4 w-4" />
        </button>

        {/* Header */}
        <div className="flex items-center gap-3 pb-3 border-b border-zinc-200">
          <div className="p-2.5 rounded-2xl bg-rose-50 border border-rose-250 text-rose-600">
            <ShieldAlert className="h-6 w-6" />
          </div>
          <div>
            <h3 className="text-lg font-black text-zinc-900 uppercase tracking-wider">Báo cáo Gian lận Trận đấu</h3>
            <p className="text-xs text-zinc-500 font-semibold">Gửi khiếu nại chi tiết kèm mốc thời gian để Trọng tài kiểm duyệt.</p>
          </div>
        </div>

        {isSuccess ? (
          <div className="py-6 text-center space-y-4 animate-fade-in">
            <CheckCircle2 className="h-12 w-12 text-emerald-500 mx-auto" />
            <div className="space-y-1">
              <h4 className="text-base font-bold text-zinc-900 uppercase">Đã gửi Báo cáo Thành công!</h4>
              <p className="text-xs text-zinc-500 max-w-xs mx-auto font-medium">
                Báo cáo đã được chuyển đến Ban Quản Trị &amp; Trọng tài. Kết quả xử lý sẽ được cập nhật sớm nhất.
              </p>
            </div>
            <button
              onClick={onClose}
              className="w-full py-2.5 bg-orange-500 hover:bg-orange-600 text-white font-bold text-xs rounded-xl uppercase tracking-wider transition-all shadow-md cursor-pointer border-none"
            >
              Quay Lại / Đóng
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            {/* 1. Fraud Type */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-750">
                1. Loại hành vi gian lận (Fraud Type)
              </label>
              <select
                value={fraudType}
                onChange={(e) => setFraudType(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl px-3.5 py-2.5 text-xs font-semibold text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
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
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-750 flex items-center justify-between">
                <span>2. Mốc thời gian xuất hiện gian lận (Timestamp)</span>
                <span className="text-[10px] text-orange-600 font-mono">Định dạng MM:SS</span>
              </label>
              <div className="relative">
                <Clock className="absolute left-3.5 top-3 h-4 w-4 text-zinc-400" />
                <input
                  type="text"
                  placeholder="01:15 hoặc 1 phút 15 giây"
                  value={timestampText}
                  onChange={(e) => setTimestampText(e.target.value)}
                  className="w-full bg-white border border-zinc-200 rounded-xl pl-10 pr-3.5 py-2.5 text-xs font-mono font-bold text-zinc-800 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors"
                />
              </div>
              {timestampText.trim() && (
                <div className="flex items-center gap-1.5 text-[11px] text-zinc-500 font-mono pt-0.5">
                  <span>⏱️ Quy đổi chuẩn:</span>
                  <span className="font-bold text-orange-600 bg-orange-50 px-1.5 py-0.5 rounded border border-orange-200">
                    {parseTimestampSeconds(timestampText).formatted} ({parseTimestampSeconds(timestampText).seconds} giây)
                  </span>
                </div>
              )}
            </div>

            {/* 3. Description */}
            <div className="space-y-1.5">
              <label className="block text-xs font-extrabold uppercase tracking-wider text-zinc-750">
                3. Chi tiết mô tả (Description)
              </label>
              <textarea
                rows={3}
                placeholder="Ví dụ: Đối thủ giấu Rubik bên dưới mép bàn từ phút 01:15 đến 01:22..."
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                className="w-full bg-white border border-zinc-200 rounded-xl p-3 text-xs text-zinc-800 placeholder-zinc-400 focus:outline-none focus:border-orange-500 focus:ring-1 focus:ring-orange-500 transition-colors resize-none"
              />
            </div>

            {/* Error Banner */}
            {error && (
              <div className="flex items-start gap-2 bg-rose-50 border border-rose-200 p-3 rounded-xl text-rose-700 text-xs font-semibold">
                <AlertTriangle className="h-4 w-4 shrink-0 mt-0.5 text-rose-600" />
                <span>{error}</span>
              </div>
            )}

            {/* Submit Actions */}
            <div className="pt-2 flex items-center gap-3">
              <button
                type="button"
                onClick={onClose}
                disabled={isSubmitting}
                className="w-1/3 py-3 bg-zinc-100 hover:bg-zinc-200 text-zinc-700 border border-zinc-200 font-bold text-xs rounded-xl uppercase tracking-wider transition-colors disabled:opacity-50 cursor-pointer"
              >
                Hủy
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-2/3 py-3 bg-gradient-to-r from-rose-600 to-orange-600 hover:from-rose-500 hover:to-orange-500 text-white font-black text-xs rounded-xl uppercase tracking-wider shadow-lg shadow-rose-600/20 transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 border-none"
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
    </div>,
    document.body
  );
}
