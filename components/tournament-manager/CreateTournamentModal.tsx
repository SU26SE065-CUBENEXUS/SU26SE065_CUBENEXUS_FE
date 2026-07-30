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
    setEvents((prev) => prev.map((e, idx) => (idx === i ? { ...e, [key]: value } : e)));

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
          .filter((ev) => ev.puzzleTypeId)
          .map((ev, i) => {
            const isMedley = ev.eventFormatCode === 'MEDLEY';
            return {
              puzzleTypeId: ev.puzzleTypeId,
              eventFormatCode: ev.eventFormatCode,
              timeLimitMs: ev.timeLimitSec ? Number(ev.timeLimitSec) * 1000 : undefined,
              cutoffTimeMs: ev.cutoffTimeSec ? Number(ev.cutoffTimeSec) * 1000 : undefined,
              solveCount: isMedley ? 1 : ev.solveCount,
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
        className="absolute inset-0 bg-background/90 backdrop-blur-md"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-3xl max-h-[92vh] flex flex-col rounded-2xl bg-card border border-border/80 shadow-2xl text-foreground overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border/60 bg-card/60 backdrop-blur-md px-6 py-5">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-primary/10 text-primary border border-primary/20">
              <Trophy className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold tracking-tight text-foreground">Create Tournament</h2>
              <p className="text-xs text-muted-foreground mt-0.5">Configure details, timeline, and puzzle events for your competition.</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted/80 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <form noValidate onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-8">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-destructive/10 border border-destructive/20 p-4 text-sm text-destructive">
              <AlertCircle className="h-4.5 w-4.5 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Creation failed:</span> {error}
              </div>
            </div>
          )}

          {/* Section 1: Basic Information */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <FileText className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Basic Information</h3>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Tournament Name <span className="text-destructive/80 font-bold">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="e.g. CubeNexus Open 2026"
                  className={`w-full rounded-xl border ${errors.name ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 transition`}
                />
                {errors.name && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.name}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Location <span className="text-destructive/80 font-bold">*</span>
                </label>
                <div className="relative">
                  <span className="absolute inset-y-0 left-0 flex items-center pl-3 text-muted-foreground/75">
                    <MapPin className="h-4 w-4" />
                  </span>
                  <input
                    type="text"
                    value={location}
                    onChange={(e) => setLocation(e.target.value)}
                    placeholder="e.g. FPT University, Ho Chi Minh City"
                    className={`w-full rounded-xl border ${errors.location ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 pl-10 pr-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 transition`}
                  />
                </div>
                {errors.location && (
                  <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.location}
                  </p>
                )}
              </div>

              <div className="md:col-span-2">
                <label className="block text-xs font-medium text-foreground mb-1.5">Description</label>
                <textarea
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={3}
                  placeholder="Introduce the tournament rules, schedules, sponsors..."
                  className="w-full rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
                />
              </div>

              {/* Max Participants */}
              <div>
                <label className="block text-xs font-medium text-foreground mb-1.5">
                  Competitor Limit (Max Participants)
                </label>
                <input
                  type="number"
                  min="1"
                  value={maxParticipants}
                  onChange={(e) => setMaxParticipants(e.target.value)}
                  placeholder="e.g. 100 (Leave empty for unlimited)"
                  className="w-full rounded-xl border border-border/80 bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                />
              </div>

              {/* Tournament Banner Image */}
              <div className="md:col-span-2 space-y-2">
                <label className="block text-xs font-medium text-foreground">
                  Tournament Banner Image (Ảnh Banner / Poster)
                </label>
                {!bannerPhoto ? (
                  <label className="flex flex-col items-center justify-center gap-2 rounded-2xl border-2 border-dashed border-border/80 bg-muted/10 p-6 text-center cursor-pointer hover:border-primary/50 transition">
                    <span className="text-2xl">🖼️</span>
                    <span className="text-xs font-semibold text-foreground">Upload Banner / Poster Image</span>
                    <span className="text-[10px] text-muted-foreground">JPG, PNG, WEBP supported</span>
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
                  <div className="relative rounded-2xl overflow-hidden border border-border max-h-48 group">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={bannerPhoto} alt="Banner Preview" className="w-full h-44 object-cover" />
                    <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center">
                      <button
                        type="button"
                        onClick={() => setBannerPhoto(null)}
                        className="px-3 py-1.5 rounded-xl bg-destructive text-destructive-foreground text-xs font-bold shadow-lg"
                      >
                        Remove Photo
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Section 2: Schedule */}
          <div className="space-y-4">
            <div className="flex items-center gap-2 pb-2 border-b border-border/40">
              <Calendar className="h-4 w-4 text-primary" />
              <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Schedule Timeline</h3>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              {/* Registration Open */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground">
                    Registration Opens <span className="text-destructive/80 font-bold">*</span>
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={regOpen}
                  onChange={(e) => setRegOpen(e.target.value)}
                  className={`w-full rounded-xl border ${errors.regOpen ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 transition`}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setRegOpen(getPresetDate('now'))}
                    className="text-[10px] bg-muted/65 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded-md transition font-medium"
                  >
                    Now
                  </button>
                  <button
                    type="button"
                    onClick={() => setRegOpen(getPresetDate('tomorrow_9'))}
                    className="text-[10px] bg-muted/65 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded-md transition font-medium"
                  >
                    Tomorrow 9:00
                  </button>
                </div>
                {errors.regOpen && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.regOpen}
                  </p>
                )}
              </div>

              {/* Registration Close */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground">
                    Registration Closes <span className="text-destructive/80 font-bold">*</span>
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={regClose}
                  onChange={(e) => setRegClose(e.target.value)}
                  className={`w-full rounded-xl border ${errors.regClose ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 transition`}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setRegClose(getPresetDate('in_7_days'))}
                    className="text-[10px] bg-muted/65 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded-md transition font-medium"
                  >
                    In 7 Days
                  </button>
                </div>
                {errors.regClose && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.regClose}
                  </p>
                )}
              </div>

              {/* Start Date */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground">
                    Tournament Starts <span className="text-destructive/80 font-bold">*</span>
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className={`w-full rounded-xl border ${errors.startDate ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 transition`}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setStartDate(getPresetDate('next_sat_9'))}
                    className="text-[10px] bg-muted/65 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded-md transition font-medium"
                  >
                    Next Sat 9:00
                  </button>
                </div>
                {errors.startDate && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.startDate}
                  </p>
                )}
              </div>

              {/* End Date */}
              <div className="space-y-2">
                <div className="flex justify-between items-center">
                  <label className="text-xs font-medium text-foreground">
                    Tournament Ends <span className="text-destructive/80 font-bold">*</span>
                  </label>
                </div>
                <input
                  type="datetime-local"
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className={`w-full rounded-xl border ${errors.endDate ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 px-3.5 py-2.5 text-sm text-foreground outline-none focus:ring-2 transition`}
                />
                <div className="flex flex-wrap gap-1.5 mt-1">
                  <button
                    type="button"
                    onClick={() => setEndDate(getPresetDate('next_sun_17'))}
                    className="text-[10px] bg-muted/65 hover:bg-muted text-muted-foreground px-2 py-0.5 rounded-md transition font-medium"
                  >
                    Next Sun 17:00
                  </button>
                </div>
                {errors.endDate && (
                  <p className="text-xs text-destructive mt-1 flex items-center gap-1">
                    <AlertCircle className="h-3 w-3" /> {errors.endDate}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Section 3: Events */}
          <div className="space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-border/40">
              <div className="flex items-center gap-2">
                <Clock className="h-4 w-4 text-primary" />
                <h3 className="text-sm font-semibold uppercase tracking-wider text-muted-foreground">Events Configuration</h3>
              </div>
              <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center gap-1 rounded-xl border border-primary/30 bg-primary/5 hover:bg-primary/10 px-3 py-1.5 text-xs font-semibold text-primary transition"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </button>
            </div>

            {errors.events && (
              <p className="text-xs text-destructive flex items-center gap-1">
                <AlertCircle className="h-3 w-3" /> {errors.events}
              </p>
            )}

            <div className="space-y-4">
              {events.map((ev, i) => (
                <div key={i} className="rounded-2xl border border-border bg-card shadow-sm overflow-hidden">
                  {/* Event Card Header */}
                  <div className="flex items-center justify-between bg-muted/30 px-4 py-3 border-b border-border/40">
                    <span className="text-xs font-bold text-foreground flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-primary" />
                      Event #{i + 1}
                    </span>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvent(i)}
                        className="inline-flex items-center gap-1 text-[11px] text-destructive/80 hover:text-destructive transition font-medium px-2 py-1 rounded-lg hover:bg-destructive/10"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                        Remove
                      </button>
                    )}
                  </div>

                  {/* Event Card Fields */}
                  <div className="p-4 space-y-4">
                    <div className="grid gap-4 md:grid-cols-2">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                          Puzzle Type <span className="text-destructive/80 font-bold">*</span>
                        </label>
                        <select
                          value={ev.puzzleTypeId}
                          onChange={(e) => updateEvent(i, 'puzzleTypeId', e.target.value)}
                          className="w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        >
                          {puzzleTypes.length === 0 ? (
                            <option value="">No puzzle types found</option>
                          ) : (
                            puzzleTypes.map((p) => (
                              <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                            ))
                          )}
                        </select>
                      </div>

                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                          Format
                        </label>
                        <select
                          value={ev.eventFormatCode}
                          onChange={(e) => updateEvent(i, 'eventFormatCode', e.target.value)}
                          className="w-full rounded-xl border border-border/80 bg-muted/20 px-3 py-2.5 text-xs text-foreground outline-none focus:border-primary transition"
                        >
                          {FORMAT_OPTIONS.map((f) => (
                            <option key={f.value} value={f.value}>{f.label}</option>
                          ))}
                        </select>
                      </div>
                    </div>

                    {/* WCA Scoring & Rules */}
                    <div className="grid gap-4 md:grid-cols-3">
                      <div>
                        <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5 flex items-center gap-1">
                          <Clock className="h-3 w-3 text-muted-foreground" />
                          Time Limit (seconds)
                        </label>
                        <input
                          type="number"
                          value={ev.timeLimitSec}
                          onChange={(e) => updateEvent(i, 'timeLimitSec', e.target.value)}
                          placeholder="e.g. 600"
                          className={`w-full rounded-xl border ${errors[`event_${i}_timeLimit`] ? 'border-destructive' : 'border-border/80'} bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition`}
                        />
                        <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                          Leave blank for no limit
                        </span>
                        {errors[`event_${i}_timeLimit`] && (
                          <p className="text-[10px] text-destructive mt-1.5">
                            {errors[`event_${i}_timeLimit`]}
                          </p>
                        )}
                      </div>

                      {ev.eventFormatCode === 'TRADITIONAL' && (
                        <>
                          <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                              Cutoff Time (seconds)
                            </label>
                            <input
                              type="number"
                              value={ev.cutoffTimeSec}
                              onChange={(e) => updateEvent(i, 'cutoffTimeSec', e.target.value)}
                              placeholder="e.g. 60"
                              className={`w-full rounded-xl border ${errors[`event_${i}_cutoffTime`] ? 'border-destructive' : 'border-border/80'} bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition`}
                            />
                            <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                              Must be less than limit
                            </span>
                            {errors[`event_${i}_cutoffTime`] && (
                              <p className="text-[10px] text-destructive mt-1.5">
                                {errors[`event_${i}_cutoffTime`]}
                              </p>
                            )}
                          </div>

                          <div>
                            <label className="block text-[11px] font-semibold text-muted-foreground mb-1.5">
                              Solve Count
                            </label>
                            <input
                              type="number"
                              value={ev.solveCount}
                              onChange={(e) => updateEvent(i, 'solveCount', Number(e.target.value))}
                              className={`w-full rounded-xl border ${errors[`event_${i}_solveCount`] ? 'border-destructive' : 'border-border/80'} bg-muted/20 px-3.5 py-2.5 text-xs text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition`}
                              min="1"
                              max="5"
                            />
                            <span className="text-[10px] text-muted-foreground/80 mt-1 block">
                              Typically 5 (ao5) or 3 (bo3)
                            </span>
                            {errors[`event_${i}_solveCount`] && (
                              <p className="text-[10px] text-destructive mt-1.5">
                                {errors[`event_${i}_solveCount`]}
                              </p>
                            )}
                          </div>
                        </>
                      )}
                    </div>

                    {/* Event Capacity Limit */}
                    <div className="pt-3 border-t border-border/40">
                      <div className="grid gap-4 md:grid-cols-2">
                        <div>
                          <label className="block text-xs font-semibold text-foreground mb-1.5 flex items-center gap-1.5">
                            <Users className="h-3.5 w-3.5 text-primary" />
                            Event Capacity Limit (Max Competitors)
                          </label>
                          <input
                            type="number"
                            value={ev.maxCapacity}
                            onChange={(e) => updateEvent(i, 'maxCapacity', e.target.value)}
                            placeholder="e.g. 16 (Leave empty for no limit)"
                            className={`w-full rounded-xl border ${errors[`event_${i}_maxCapacity`] ? 'border-destructive focus:ring-destructive/20' : 'border-border/80 focus:border-primary focus:ring-primary/20'} bg-muted/20 px-3.5 py-2 text-xs text-foreground outline-none focus:ring-2 transition`}
                            min="1"
                          />
                          <p className="text-[11px] text-muted-foreground mt-1 font-normal">
                            Leave empty for no custom limit (uses overall tournament limit)
                          </p>
                          {errors[`event_${i}_maxCapacity`] && (
                            <p className="text-xs text-destructive font-medium mt-1 flex items-center gap-1">
                              <AlertCircle className="h-3 w-3" /> {errors[`event_${i}_maxCapacity`]}
                            </p>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Medley Relay Sub-puzzles */}
                    {ev.eventFormatCode === 'MEDLEY' && (
                      <div className="mt-2 border-t border-border/40 pt-4 space-y-3">
                        <div className="flex items-center justify-between">
                          <span className="text-[11px] font-bold text-foreground flex items-center gap-1">
                            <Info className="h-3.5 w-3.5 text-primary" />
                            Relay Puzzles (Minimum 2)
                          </span>
                          <button
                            type="button"
                            onClick={() => addMedleyPuzzle(i)}
                            className="inline-flex items-center gap-0.5 rounded-lg border border-border bg-muted/50 hover:bg-muted px-2.5 py-1 text-[10px] font-semibold text-foreground transition"
                          >
                            <Plus className="h-3 w-3" /> Add Puzzle
                          </button>
                        </div>
                        
                        <div className="grid gap-2">
                          {ev.medleyPuzzles.map((mp, mpIdx) => (
                            <div key={mpIdx} className="flex items-center gap-2">
                              <span className="text-[10px] text-muted-foreground w-12 font-mono">#{mpIdx + 1}</span>
                              <select
                                value={mp.puzzleTypeId}
                                onChange={(e) => updateMedleyPuzzle(i, mpIdx, e.target.value)}
                                className="flex-1 rounded-xl border border-border/80 bg-muted/20 px-3 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                              >
                                {puzzleTypes.map((p) => (
                                  <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                                ))}
                              </select>
                              {ev.medleyPuzzles.length > 2 && (
                                <button
                                  type="button"
                                  onClick={() => removeMedleyPuzzle(i, mpIdx)}
                                  className="text-destructive/80 hover:text-destructive hover:bg-destructive/10 p-1.5 rounded-lg transition"
                                >
                                  <Trash2 className="h-3.5 w-3.5" />
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
        <div className="flex items-center justify-end gap-3 border-t border-border/60 bg-card/60 backdrop-blur-md px-6 py-4">
          <button
            type="button"
            onClick={onClose}
            className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-muted/80"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSubmit}
            disabled={isLoading || puzzleTypes.length === 0}
            className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/95 disabled:opacity-60"
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {isLoading ? 'Creating…' : 'Create Tournament'}
          </button>
        </div>
      </div>
    </div>
  );
}
