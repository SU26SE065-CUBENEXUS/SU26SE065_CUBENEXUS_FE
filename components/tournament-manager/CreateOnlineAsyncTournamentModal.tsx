'use client';

import { useState, useEffect } from 'react';
import { X, Sparkles, Trophy, Calendar, Clock, Puzzle } from 'lucide-react';
import { createOnlineAsyncTournament, type OnlineAsyncTournamentDto } from '@/lib/api/online-async';
import { getPuzzleTypes } from '@/lib/api/tournaments';
import type { PuzzleTypeResponseDto } from '@/lib/api/types';

interface Props {
  onClose: () => void;
  onCreated: (tourney: OnlineAsyncTournamentDto) => void;
}

export function CreateOnlineAsyncTournamentModal({ onClose, onCreated }: Props) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [puzzleTypeId, setPuzzleTypeId] = useState('');
  const [puzzles, setPuzzles] = useState<PuzzleTypeResponseDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Helper date generators for default inputs
  const now = new Date();
  const regOpenDef = new Date(now.getTime() + 5 * 60000).toISOString().slice(0, 16);
  const regCloseDef = new Date(now.getTime() + 24 * 3600000).toISOString().slice(0, 16);
  const compStartDef = new Date(now.getTime() + 25 * 3600000).toISOString().slice(0, 16);
  const compEndDef = new Date(now.getTime() + 72 * 3600000).toISOString().slice(0, 16);

  const [registrationOpenAt, setRegistrationOpenAt] = useState(regOpenDef);
  const [registrationCloseAt, setRegistrationCloseAt] = useState(regCloseDef);
  const [startDate, setStartDate] = useState(compStartDef);
  const [endDate, setEndDate] = useState(compEndDef);
  const [attemptTimeLimitMins, setAttemptTimeLimitMins] = useState(5);

  useEffect(() => {
    async function loadPuzzles() {
      try {
        const list = await getPuzzleTypes();
        setPuzzles(list);
        if (list.length > 0) {
          setPuzzleTypeId(list[0].id);
        }
      } catch (err) {
        console.warn('Failed to load puzzles:', err);
      }
    }
    loadPuzzles();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Vui lòng nhập tên giải đấu');
      return;
    }

    const registrationOpen = new Date(registrationOpenAt);
    const registrationClose = new Date(registrationCloseAt);
    const competitionStart = new Date(startDate);
    const competitionEnd = new Date(endDate);
    if ([registrationOpen, registrationClose, competitionStart, competitionEnd].some((date) => Number.isNaN(date.getTime()))) {
      setError('Vui lòng nhập đầy đủ thời gian hợp lệ.');
      return;
    }
    if (registrationOpen >= registrationClose || registrationClose > competitionStart || competitionStart >= competitionEnd) {
      setError('Thời gian phải theo thứ tự: mở đăng ký < đóng đăng ký ≤ bắt đầu thi < kết thúc thi.');
      return;
    }
    if (!Number.isInteger(attemptTimeLimitMins) || attemptTimeLimitMins < 1 || attemptTimeLimitMins > 60) {
      setError('Giới hạn thời gian solve phải từ 1 đến 60 phút.');
      return;
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const created = await createOnlineAsyncTournament({
        name: name.trim(),
        description: description.trim() || undefined,
        puzzleTypeId: puzzleTypeId || '33333333-3333-3333-3333-333333333333',
        registrationOpenAt: registrationOpen.toISOString(),
        registrationCloseAt: registrationClose.toISOString(),
        startDate: competitionStart.toISOString(),
        endDate: competitionEnd.toISOString(),
        attemptTimeLimitMs: attemptTimeLimitMins * 60 * 1000,
      });

      onCreated(created);
    } catch (err: any) {
      setError(err?.message || 'Không thể tạo giải đấu online. Vui lòng thử lại.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/60 backdrop-blur-xs p-4 overflow-y-auto">
      <div className="relative w-full max-w-xl rounded-2xl bg-white p-6 shadow-2xl border border-slate-100 my-8">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 rounded-lg p-2 text-slate-400 hover:bg-slate-100 hover:text-slate-700 transition"
        >
          <X className="h-5 w-5" />
        </button>

        <div className="flex items-center gap-3 mb-5">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-50 text-indigo-600">
            <Sparkles className="h-5 w-5" />
          </div>
          <div>
            <h2 className="text-lg font-bold text-slate-900">Tạo Giải Đấu Online Asynchronous (AO1)</h2>
            <p className="text-xs text-slate-500">Mỗi thí sinh có 1 attempt duy nhất, thi tự do trong thời gian mở giải</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 rounded-xl bg-red-50 p-3 text-xs text-red-700 border border-red-200">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4 text-xs">
          <div>
            <label className="block font-bold text-slate-700 mb-1">Tên Giải Đấu</label>
            <input
              type="text"
              placeholder="VD: CubeNexus Async Online Cup 2026"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
              required
            />
          </div>

          <div>
            <label className="block font-bold text-slate-700 mb-1">Mô tả / Thể lệ</label>
            <textarea
              placeholder="Mô tả chi tiết giải đấu..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 focus:ring-1 focus:ring-indigo-600 transition"
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Puzzle className="h-3.5 w-3.5 text-indigo-600" /> Loại Rubik / Puzzle
              </label>
              <select
                value={puzzleTypeId}
                onChange={(e) => setPuzzleTypeId(e.target.value)}
                className="w-full rounded-xl border border-slate-200 p-2.5 bg-white outline-none focus:border-indigo-600 font-semibold text-slate-800"
              >
                {puzzles.length > 0 ? (
                  puzzles.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.code})
                    </option>
                  ))
                ) : (
                  <option value="33333333-3333-3333-3333-333333333333">Rubik 3x3x3</option>
                )}
              </select>
            </div>

            <div>
              <label className="block font-bold text-slate-700 mb-1 flex items-center gap-1">
                <Clock className="h-3.5 w-3.5 text-indigo-600" /> Limit Solve Time (Phút)
              </label>
              <input
                type="number"
                min={1}
                max={60}
                value={attemptTimeLimitMins}
                onChange={(e) => setAttemptTimeLimitMins(Number(e.target.value))}
                className="w-full rounded-xl border border-slate-200 p-2.5 outline-none focus:border-indigo-600 transition"
              />
            </div>
          </div>

          <div className="rounded-xl border border-slate-100 bg-slate-50 p-3 space-y-3">
            <p className="font-bold text-slate-800 flex items-center gap-1.5">
              <Calendar className="h-4 w-4 text-indigo-600" /> Cấu hình Khung Thời gian
            </p>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bắt đầu Đăng ký</label>
                <input
                  type="datetime-local"
                  value={registrationOpenAt}
                  onChange={(e) => setRegistrationOpenAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kết thúc Đăng ký</label>
                <input
                  type="datetime-local"
                  value={registrationCloseAt}
                  onChange={(e) => setRegistrationCloseAt(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Bắt đầu Giải đấu (Comp Start)</label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-slate-600 font-semibold mb-1">Kết thúc Giải đấu (Comp End)</label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full rounded-lg border border-slate-200 bg-white p-2 outline-none"
                  required
                />
              </div>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-slate-200 px-4 py-2.5 text-slate-600 hover:bg-slate-50 transition cursor-pointer"
            >
              Hủy
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="rounded-xl bg-indigo-600 px-5 py-2.5 font-bold text-white hover:bg-indigo-700 transition disabled:opacity-50 cursor-pointer"
            >
              {isSubmitting ? 'Đang tạo...' : 'Tạo Giải Đấu Online'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
