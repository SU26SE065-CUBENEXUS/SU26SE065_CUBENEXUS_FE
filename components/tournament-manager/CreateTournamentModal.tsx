'use client';

import { useState, useEffect } from 'react';
import { createTournament, getPuzzleTypes } from '@/lib/api/tournaments';
import type { TournamentDetailDto, PuzzleTypeResponseDto } from '@/lib/api/types';
import {
  X,
  Plus,
  Trash2,
  Loader2,
  AlertCircle,
  Calendar,
  MapPin,
  Info,
  Clock,
  FileText,
  Trophy,
  Users
} from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onCreated: (t: TournamentDetailDto) => void;
}

interface EventFormState {
  puzzleTypeId: string;
  eventFormatCode: string;
  timeLimitSec: string;
  cutoffTimeSec: string;
  solveCount: number;
  maxCapacity: string;
  medleyPuzzles: Array<{ puzzleTypeId: string }>;
}

const FORMAT_OPTIONS = [
  { value: 'TRADITIONAL', label: 'Traditional (ao5/bo3)' },
  { value: 'MEDLEY', label: 'Medley Relay' },
];

// Helper functions for date operations
const formatToLocalDateTime = (date: Date): string => {
  const pad = (n: number) => String(n).padStart(2, '0');
  const y = date.getFullYear();
  const m = pad(date.getMonth() + 1);
  const d = pad(date.getDate());
  const h = pad(date.getHours());
  const min = pad(date.getMinutes());
  return `${y}-${m}-${d}T${h}:${min}`;
};

const getPresetDate = (preset: 'now' | 'tomorrow_9' | 'next_sat_9' | 'next_sun_17' | 'in_7_days'): string => {
  const now = new Date();
  switch (preset) {
    case 'now':
      return formatToLocalDateTime(now);
    case 'tomorrow_9': {
      const tomorrow = new Date(now);
      tomorrow.setDate(now.getDate() + 1);
      tomorrow.setHours(9, 0, 0, 0);
      return formatToLocalDateTime(tomorrow);
    }
    case 'next_sat_9': {
      const sat = new Date(now);
      const day = sat.getDay();
      const daysToAdd = day === 6 ? 7 : (6 - day + 7) % 7;
      sat.setDate(sat.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
      sat.setHours(9, 0, 0, 0);
      return formatToLocalDateTime(sat);
    }
    case 'next_sun_17': {
      const sun = new Date(now);
      const day = sun.getDay();
      const daysToAdd = day === 0 ? 7 : (7 - day + 7) % 7;
      sun.setDate(sun.getDate() + (daysToAdd === 0 ? 7 : daysToAdd));
      sun.setHours(17, 0, 0, 0);
      return formatToLocalDateTime(sun);
    }
    case 'in_7_days': {
      const in7 = new Date(now);
      in7.setDate(now.getDate() + 7);
      in7.setHours(17, 0, 0, 0);
      return formatToLocalDateTime(in7);
    }
    default:
      return '';
  }
};

export function CreateTournamentModal({ onClose, onCreated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [puzzleTypes, setPuzzleTypes] = useState<PuzzleTypeResponseDto[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [maxParticipants, setMaxParticipants] = useState('');
  const [bannerPhoto, setBannerPhoto] = useState<string | null>(null);
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [regOpen, setRegOpen] = useState('');
  const [regClose, setRegClose] = useState('');
  const [events, setEvents] = useState<EventFormState[]>([
    {
      puzzleTypeId: '',
      eventFormatCode: 'TRADITIONAL',
      timeLimitSec: '',
      cutoffTimeSec: '',
      solveCount: 5,
      maxCapacity: '',
      medleyPuzzles: [],
    },
  ]);

  // Load puzzle types
  useEffect(() => {
    (async () => {
      try {
        const types = await getPuzzleTypes();
        setPuzzleTypes(types);
        if (types.length > 0) {
          setEvents([
            {
              puzzleTypeId: types[0].id,
              eventFormatCode: 'TRADITIONAL',
              timeLimitSec: '',
              cutoffTimeSec: '',
              solveCount: 5,
              maxCapacity: '',
              medleyPuzzles: [
                { puzzleTypeId: types[0].id },
                { puzzleTypeId: types[1]?.id || types[0].id },
              ],
            },
          ]);
        }
      } catch (err) {
        console.error('Failed to load puzzle types:', err);
        setError('Could not retrieve puzzle types from API. Please verify the backend is running.');
      }
    })();
  }, []);

  const addEvent = () => {
    const firstId = puzzleTypes[0]?.id || '';
    const secondId = puzzleTypes[1]?.id || firstId;
    setEvents((prev) => [
      ...prev,
      {
        puzzleTypeId: firstId,
        eventFormatCode: 'TRADITIONAL',
        timeLimitSec: '',
        cutoffTimeSec: '',
        solveCount: 5,
        maxCapacity: '',
        medleyPuzzles: [
          { puzzleTypeId: firstId },
          { puzzleTypeId: secondId },
        ],
      },
    ]);
  };

  const removeEvent = (i: number) =>
    setEvents((prev) => prev.filter((_, idx) => idx !== i));

  const updateEvent = (i: number, key: keyof EventFormState, value: any) =>
    setEvents((prev) =>
      prev.map((e, idx) => {
        if (idx !== i) return e;
        const updated = { ...e, [key]: value };
        if (key === 'eventFormatCode' && value === 'MEDLEY') {
          if (!updated.medleyPuzzles || updated.medleyPuzzles.length < 2) {
            const firstId = puzzleTypes[0]?.id || '';
            const secondId = puzzleTypes[1]?.id || firstId;
            updated.medleyPuzzles = [
              { puzzleTypeId: firstId },
              { puzzleTypeId: secondId },
            ];
          }
        }
        return updated;
      })
    );

  const updateMedleyPuzzle = (eventIdx: number, mpIdx: number, value: string) => {
    setEvents((prev) =>
      prev.map((e, idx) => {
        if (idx !== eventIdx) return e;
        const newMedley = e.medleyPuzzles.map((mp, mIdx) =>
          mIdx === mpIdx ? { puzzleTypeId: value } : mp
        );
        return { ...e, medleyPuzzles: newMedley };
      })
    );
  };

  const addMedleyPuzzle = (eventIdx: number) => {
    const firstId = puzzleTypes[0]?.id || '';
    setEvents((prev) =>
      prev.map((e, idx) => {
        if (idx !== eventIdx) return e;
        return {
          ...e,
          medleyPuzzles: [...e.medleyPuzzles, { puzzleTypeId: firstId }],
        };
      })
    );
  };

  const removeMedleyPuzzle = (eventIdx: number, mpIdx: number) => {
    setEvents((prev) =>
      prev.map((e, idx) => {
        if (idx !== eventIdx) return e;
        return {
          ...e,
          medleyPuzzles: e.medleyPuzzles.filter((_, mIdx) => mIdx !== mpIdx),
        };
      })
    );
  };

  const validateForm = () => {
    const errs: Record<string, string> = {};
    if (!name.trim()) errs.name = 'Tournament name is required';
    if (!location.trim()) errs.location = 'Location is required';
    if (!startDate) errs.startDate = 'Start date is required';
    if (!endDate) errs.endDate = 'End date is required';
    if (!regOpen) errs.regOpen = 'Registration start date is required';
    if (!regClose) errs.regClose = 'Registration close date is required';

    if (startDate && endDate) {
      const start = new Date(startDate);
      const end = new Date(endDate);
      if (end <= start) {
        errs.endDate = 'End date must be after the start date';
      }
    }

    if (regOpen && regClose) {
      const open = new Date(regOpen);
      const close = new Date(regClose);
      if (close <= open) {
        errs.regClose = 'Registration close date must be after the opening date';
      }
    }

    if (regClose && startDate) {
      const close = new Date(regClose);
      const start = new Date(startDate);
      if (close > start) {
        errs.regClose = 'Registration must close before or on the tournament start date';
      }
    }

    const tourMaxPart = maxParticipants ? Number(maxParticipants) : null;

    // Validate events
    events.forEach((ev, idx) => {
      const timeLimitVal = Number(ev.timeLimitSec);
      const cutoffVal = Number(ev.cutoffTimeSec);
      const evMaxCap = ev.maxCapacity ? Number(ev.maxCapacity) : null;

      if (ev.timeLimitSec && (isNaN(timeLimitVal) || timeLimitVal <= 0)) {
        errs[`event_${idx}_timeLimit`] = 'Time limit must be greater than 0';
      }
      if (ev.cutoffTimeSec && (isNaN(cutoffVal) || cutoffVal < 0)) {
        errs[`event_${idx}_cutoffTime`] = 'Cutoff time must be 0 or greater';
      }
      if (ev.timeLimitSec && ev.cutoffTimeSec && cutoffVal > timeLimitVal) {
        errs[`event_${idx}_cutoffTime`] = 'Cutoff cannot exceed time limit';
      }
      if (ev.solveCount <= 0) {
        errs[`event_${idx}_solveCount`] = 'Solve count must be greater than 0';
      }
      if (ev.eventFormatCode === 'MEDLEY') {
        if (!ev.medleyPuzzles || ev.medleyPuzzles.length < 2) {
          errs[`event_${idx}_medley`] = 'Hạng mục Medley Relay phải chứa tối thiểu 2 khối Rubik trong chuỗi liên hoàn.';
        }
      }
      if (evMaxCap && tourMaxPart && evMaxCap > tourMaxPart) {
        errs[`event_${idx}_maxCapacity`] = `Event capacity (${evMaxCap}) cannot exceed overall tournament limit (${tourMaxPart})`;
      }
    });

    if (events.length === 0) {
      errs.events = 'At least one event must be added';
    }

    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setErrors({});

    if (!validateForm()) {
      toast.error('Please fix validation errors in the form.');
      return;
    }

    setIsLoading(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        location: location || undefined,
        maxParticipants: maxParticipants ? Number(maxParticipants) : undefined,
        bannerPhotoData: bannerPhoto || undefined,
        startDate: new Date(startDate).toISOString(),
        endDate: new Date(endDate).toISOString(),
        registrationOpenAt: new Date(regOpen).toISOString(),
        registrationCloseAt: new Date(regClose).toISOString(),
        events: events
          .filter((ev) => ev.eventFormatCode === 'MEDLEY' ? ev.medleyPuzzles.length >= 2 : !!ev.puzzleTypeId)
          .map((ev, i) => {
            const isMedley = ev.eventFormatCode === 'MEDLEY';
            const primaryPuzzleId = isMedley ? (ev.medleyPuzzles[0]?.puzzleTypeId || ev.puzzleTypeId) : ev.puzzleTypeId;
            return {
              puzzleTypeId: primaryPuzzleId,
              eventFormatCode: ev.eventFormatCode,
              timeLimitMs: ev.timeLimitSec ? Number(ev.timeLimitSec) * 1000 : undefined,
              cutoffTimeMs: ev.cutoffTimeSec ? Number(ev.cutoffTimeSec) * 1000 : undefined,
              solveCount: ev.solveCount,
              maxCapacity: ev.maxCapacity ? Number(ev.maxCapacity) : undefined,
              sortOrder: i + 1,
              medleyPuzzles: isMedley
                ? ev.medleyPuzzles
                  .filter((mp) => mp.puzzleTypeId)
                  .map((mp, idx) => ({
                    puzzleTypeId: mp.puzzleTypeId,
                    sortOrder: idx + 1,
                  }))
                : undefined,
            };
          }),
      };

      const result = await createTournament(payload);
      toast.success('Tournament created successfully!');
      onCreated(result);
    } catch (err) {
      const errMsg = err instanceof Error ? err.message : 'Failed to create tournament';
      setError(errMsg);
      toast.error(errMsg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-slate-900/40 backdrop-blur-xs"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-xl bg-white border border-slate-200 shadow-2xl text-slate-900 overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-slate-100 bg-white px-6 py-4">
          <div>
            <h2 className="text-xl font-bold tracking-tight text-slate-900">Tạo Giải Đấu Mới</h2>
            <p className="text-xs text-slate-500 mt-0.5">Cấu hình thông tin chi tiết, lịch trình và các hạng mục thi đấu.</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-lg p-1.5 text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          {error && (
            <div className="flex items-start gap-2.5 rounded-lg bg-red-50 border border-red-200 p-3.5 text-xs text-red-700 font-medium">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              <div>
                <span className="font-bold">Lỗi khởi tạo:</span> {error}
              </div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Thông Tin Cơ Bản</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Tên Giải Đấu <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Ví dụ: CubeNexus Open 2026"
                  className={`w-full rounded-lg border ${errors.name ? 'border-red-500' : 'border-slate-200 focus:border-indigo-600'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white transition`}
                />
                {errors.name && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Địa Điểm <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Ví dụ: Đại học FPT, TP. Hồ Chí Minh"
                  className={`w-full rounded-lg border ${errors.location ? 'border-red-500' : 'border-slate-200 focus:border-indigo-600'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white transition`}
                />
                {errors.location && (
                  <p className="text-xs text-red-600 mt-1 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.location}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">Mô Tả Giải Đấu</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Giới thiệu quy định, lịch trình, nhà tài trợ..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition resize-none"
                />
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Giới Hạn Thí Sinh (Tối Đa)
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="Để trống nếu không giới hạn"
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </div>

              {/* Tournament Banner Image */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-semibold text-slate-700">
                  Ảnh Banner / Poster
                </label>
                {!bannerPhoto ? (
                  <label className="flex flex-col items-center justify-center gap-1.5 rounded-xl border-2 border-dashed border-slate-200 bg-slate-50/50 p-6 text-center cursor-pointer hover:bg-slate-50 transition">
                    <span className="text-xs font-semibold text-slate-700">Tải lên ảnh Banner / Poster</span>
                    <span className="text-[10px] text-slate-400">Hỗ trợ JPG, PNG, WEBP</span>
                    <input
                      type="file"
                      accept="image/*"
                      className="hidden"
                      onChange={(e) => {
                        const file = e.target.files?.[0];
                        if (file) {
                          const reader = new FileReader();
                          reader.onload = (ev) => setBannerPhoto(ev.target?.result as string);
                          reader.readAsDataURL(file);
                        }
                      }}
                    />
                  </label>
                ) : (
                  <div className="relative rounded-xl overflow-hidden border border-slate-200 max-h-48 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bannerPhoto} alt="Banner Preview" className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-slate-900/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setBannerPhoto(null)}
                        className="px-3 py-1.5 rounded-lg bg-red-600 text-white text-xs font-semibold shadow-2xs"
                      >
                        Xóa Ảnh Banner
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Schedule */}
          <div className="space-y-4">
            <div className="pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Lịch Trình Thời Gian</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {/* Registration Open */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Mở Đăng Ký <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={regOpen}
                  onChange={(e) => setRegOpen(e.target.value)}
                  className={`w-full rounded-lg border ${errors.regOpen ? 'border-red-500' : 'border-slate-200 focus:border-indigo-600'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white transition`}
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRegOpen(getPresetDate('now'))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition font-medium"
                  >
                    Bây giờ
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegOpen(getPresetDate('tomorrow_9'))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition font-medium"
                  >
                    Sáng mai 9:00
                  </button>
                </div>
                {errors.regOpen && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.regOpen}
                  </p>
                )}
              </div>

              {/* Registration Close */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Đóng Đăng Ký <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={regClose}
                  onChange={(e) => setRegClose(e.target.value)}
                  className={`w-full rounded-lg border ${errors.regClose ? 'border-red-500' : 'border-slate-200 focus:border-indigo-600'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white transition`}
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setRegClose(getPresetDate('in_7_days'))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition font-medium"
                  >
                    Sau 7 ngày
                  </button>
                </div>
                {errors.regClose && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.regClose}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Bắt Đầu Giải Đấu <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full rounded-lg border ${errors.startDate ? 'border-red-500' : 'border-slate-200 focus:border-indigo-600'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white transition`}
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setStartDate(getPresetDate('next_sat_9'))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition font-medium"
                  >
                    Thứ 7 tuần tới 9:00
                  </button>
                </div>
                {errors.startDate && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-1.5">
                <label className="block text-xs font-semibold text-slate-700">
                  Kết Thúc Giải Đấu <span className="text-red-500 font-bold">*</span>
                </label>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full rounded-lg border ${errors.endDate ? 'border-red-500' : 'border-slate-200 focus:border-indigo-600'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white transition`}
                />
                <div className="flex flex-wrap gap-1.5 pt-0.5">
                  <button
                    type="button"
                    onClick={() => setEndDate(getPresetDate('next_sun_17'))}
                    className="text-[10px] bg-slate-100 hover:bg-slate-200 text-slate-600 px-2 py-0.5 rounded transition font-medium"
                  >
                    Chủ nhật tuần tới 17:00
                  </button>
                </div>
                {errors.endDate && (
                  <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                    <AlertCircle className="h-3 w-3" /> {errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">Cấu Hình Môn Thi</h3>
              <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center gap-1 rounded-lg border border-indigo-200 bg-indigo-50 hover:bg-indigo-100 px-3 py-1.5 text-xs font-semibold text-indigo-700 transition"
              >
                + Thêm Môn Thi
              </button>
            </div>

            {errors.events && (
              <p className="text-xs text-red-600 flex items-center gap-1 font-medium">
                <AlertCircle className="h-3 w-3" /> {errors.events}
              </p>
            )}

            <div className="space-y-4">
              {events.map((ev, i) => (
                <div key={i} className="rounded-xl border border-slate-200 bg-white shadow-2xs overflow-hidden">
                  {/* Event Card Header */}
                  <div className="flex items-center justify-between bg-slate-50 px-4 py-2.5 border-b border-slate-200">
                    <span className="text-xs font-bold text-slate-800">
                      Môn Thi #{i + 1}
                    </span>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvent(i)}
                        className="text-[11px] text-red-600 hover:bg-red-50 font-medium px-2 py-1 rounded transition"
                      >
                        Xóa Môn Thi
                      </button>
                    )}
                  </div>

                  {/* Event Card Fields */}
                  <div className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Thể Thức Thi Đấu
                        </label>
                        <select
                          value={ev.eventFormatCode}
                          onChange={(e) => updateEvent(i, 'eventFormatCode', e.target.value)}
                          className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                        >
                          {FORMAT_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>

                      {ev.eventFormatCode === 'TRADITIONAL' ? (
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Loại Rubik <span className="text-red-500 font-bold">*</span>
                          </label>
                          <select
                            value={ev.puzzleTypeId}
                            onChange={(e) => updateEvent(i, 'puzzleTypeId', e.target.value)}
                            className="w-full rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                          >
                            {puzzleTypes.length === 0 ? (
                              <option value="">Không tìm thấy loại Rubik</option>
                            ) : (
                              puzzleTypes.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                              ))
                            )}
                          </select>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          {/* <span className="text-xs font-[14px] text-purple-700 bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 w-full">
                            Đã chọn Thể Thức Medley Relay
                          </span> */}
                        </div>
                      )}
                    </div>

                    {/* WCA Scoring & Rules */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Time Limit (Giây)
                        </label>
                        <input
                          type="number"
                          value={ev.timeLimitSec}
                          onChange={(e) => updateEvent(i, 'timeLimitSec', e.target.value)}
                          placeholder="Ví dụ: 600"
                          className={`w-full rounded-lg border ${errors[`event_${i}_timeLimit`] ? 'border-red-500' : 'border-slate-200'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition`}
                        />
                        {errors[`event_${i}_timeLimit`] && (
                          <p className="text-[10px] text-red-600 mt-1 font-medium">
                            {errors[`event_${i}_timeLimit`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Cutoff Time (Giây)
                        </label>
                        <input
                          type="number"
                          value={ev.cutoffTimeSec}
                          onChange={(e) => updateEvent(i, 'cutoffTimeSec', e.target.value)}
                          placeholder="Ví dụ: 60 (để trống nếu không có)"
                          className={`w-full rounded-lg border ${errors[`event_${i}_cutoffTime`] ? 'border-red-500' : 'border-slate-200'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition`}
                        />
                        {errors[`event_${i}_cutoffTime`] && (
                          <p className="text-[10px] text-red-600 mt-1 font-medium">
                            {errors[`event_${i}_cutoffTime`]}
                          </p>
                        )}
                      </div>

                      <div>
                        <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                          Số Lượt Thử (Solve Count)
                        </label>
                        <input
                          type="number"
                          value={ev.solveCount}
                          onChange={(e) => updateEvent(i, 'solveCount', Number(e.target.value))}
                          className={`w-full rounded-lg border ${errors[`event_${i}_solveCount`] ? 'border-red-500' : 'border-slate-200'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition`}
                          min="1"
                          max="5"
                        />
                        {errors[`event_${i}_solveCount`] && (
                          <p className="text-[10px] text-red-600 mt-1 font-medium">
                            {errors[`event_${i}_solveCount`]}
                          </p>
                        )}
                      </div>
                    </div>

                    {/* Event Capacity Limit */}
                    <div className="pt-3 border-t border-slate-100">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                            Giới Hạn Thí Sinh Môn Thi (Tối Đa)
                          </label>
                          <input
                            type="number"
                            value={ev.maxCapacity}
                            onChange={(e) => updateEvent(i, 'maxCapacity', e.target.value)}
                            placeholder="Để trống nếu áp dụng chung giải đấu"
                            className={`w-full rounded-lg border ${errors[`event_${i}_maxCapacity`] ? 'border-red-500' : 'border-slate-200'} bg-slate-50 px-3.5 py-2 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition`}
                            min="1"
                          />
                          {errors[`event_${i}_maxCapacity`] && (
                            <p className="text-xs text-red-600 font-medium mt-1">
                              {errors[`event_${i}_maxCapacity`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medley Relay Sub-puzzles */}
                    {ev.eventFormatCode === 'MEDLEY' && (
                      <div className="mt-2 border-t border-slate-100 pt-3 space-y-2">
                        <div className="flex items-center justify-between">
                          <span className="text-xs font-bold text-slate-700">
                            Chuỗi Rubik Liên Hoàn (Tối thiểu 2)
                          </span>
                          <button
                            type="button"
                            onClick={() => addMedleyPuzzle(i)}
                            className="rounded border border-slate-200 bg-slate-50 hover:bg-slate-100 px-2.5 py-1 text-[10px] font-semibold text-slate-700 transition"
                          >
                            + Thêm Rubik
                          </button>
                        </div>

                        <div className="grid gap-2">
                          {ev.medleyPuzzles.map((mp, mpIdx) => (
                            <div key={mpIdx} className="flex items-center gap-2">
                              <span className="text-xs text-slate-400 font-mono w-8">#{mpIdx + 1}</span>
                              <select
                                value={mp.puzzleTypeId}
                                onChange={(e) => updateMedleyPuzzle(i, mpIdx, e.target.value)}
                                className="flex-1 rounded-lg border border-slate-200 bg-slate-50 px-3 py-1.5 text-xs text-slate-900 outline-none focus:bg-white focus:border-indigo-600 transition"
                              >
                                {puzzleTypes.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                ))}
                              </select>
                              {ev.medleyPuzzles.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeMedleyPuzzle(i, mpIdx)}
                                  className="text-red-600 hover:bg-red-50 p-1 rounded text-xs transition font-medium"
                                >
                                  Xóa
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </form>

        {/* Footer */}
        <div className="flex items-center justify-end gap-2 border-t border-slate-100 bg-white px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-lg border border-slate-200 bg-white px-4 py-2 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition shadow-2xs"
          >
            Hủy Bỏ
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || puzzleTypes.length === 0}
            className="rounded-lg bg-indigo-600 hover:bg-indigo-700 px-4 py-2 text-xs font-semibold text-white shadow-2xs transition disabled:opacity-60"
          >
            {isLoading ? 'Đang Tạo…' : 'Tạo Giải Đấu'}
          </button>
        </div>
      </div>
    </div>
  );
}
