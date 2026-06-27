'use client';

import { useState, useEffect } from 'react';
import { createTournament, getPuzzleTypes } from '@/lib/api/tournaments';
import type { TournamentDetailDto, PuzzleTypeResponseDto } from '@/lib/api/types';
import { X, Plus, Trash2, Loader2, AlertCircle } from 'lucide-react';
import { toast } from 'sonner';

interface Props {
  onClose: () => void;
  onCreated: (t: TournamentDetailDto) => void;
}

interface EventFormState {
  puzzleTypeId: string;
  eventFormatCode: string;
  timeLimitMs: string;
  cutoffTimeMs: string;
  solveCount: number;
  medleyPuzzles: Array<{ puzzleTypeId: string }>;
}

const FORMAT_OPTIONS = [
  { value: 'TRADITIONAL', label: 'Traditional (ao5/bo3)' },
  { value: 'MEDLEY', label: 'Medley Relay' },
];

export function CreateTournamentModal({ onClose, onCreated }: Props) {
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [puzzleTypes, setPuzzleTypes] = useState<PuzzleTypeResponseDto[]>([]);

  // Form state
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [location, setLocation] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [regOpen, setRegOpen] = useState('');
  const [regClose, setRegClose] = useState('');
  const [events, setEvents] = useState<EventFormState[]>([
    {
      puzzleTypeId: '',
      eventFormatCode: 'TRADITIONAL',
      timeLimitMs: '',
      cutoffTimeMs: '',
      solveCount: 5,
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
              timeLimitMs: '',
              cutoffTimeMs: '',
              solveCount: 5,
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
        timeLimitMs: '',
        cutoffTimeMs: '',
        solveCount: 5,
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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    if (!name || !startDate || !endDate || !regOpen || !regClose) {
      setError('Please fill in all required fields.');
      return;
    }

    // Validate event limits
    for (let i = 0; i < events.length; i++) {
      const ev = events[i];
      if (ev.timeLimitMs && Number(ev.timeLimitMs) <= 0) {
        setError(`Event ${i + 1}: Time Limit must be greater than 0 ms.`);
        return;
      }
      if (ev.cutoffTimeMs && Number(ev.cutoffTimeMs) <= 0) {
        setError(`Event ${i + 1}: Cutoff Time must be greater than 0 ms.`);
        return;
      }
      if (ev.timeLimitMs && ev.cutoffTimeMs && Number(ev.cutoffTimeMs) > Number(ev.timeLimitMs)) {
        setError(`Event ${i + 1}: Cutoff Time must be less than or equal to Time Limit.`);
        return;
      }
    }

    setIsLoading(true);
    try {
      const payload = {
        name,
        description: description || undefined,
        location: location || undefined,
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
              timeLimitMs: ev.timeLimitMs ? Number(ev.timeLimitMs) : undefined,
              cutoffTimeMs: ev.cutoffTimeMs ? Number(ev.cutoffTimeMs) : undefined,
              solveCount: isMedley ? 1 : ev.solveCount,
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
        className="absolute inset-0 bg-background/80 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-card border border-border shadow-2xl text-foreground">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between border-b border-border bg-card px-6 py-4">
          <div>
            <h2 className="text-lg font-bold text-foreground">Create Tournament</h2>
            <p className="text-xs text-muted-foreground mt-0.5">Fill in details to create a new tournament</p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 text-muted-foreground transition hover:bg-muted/50 hover:text-foreground"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {error && (
            <div className="flex items-start gap-2.5 rounded-xl bg-red-500/10 border border-red-500/20 p-3.5 text-sm text-red-600 dark:text-red-400">
              <AlertCircle className="h-4 w-4 shrink-0 mt-0.5" />
              {error}
            </div>
          )}

          {/* Name */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
              Tournament Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. CubeNexus Open 2026"
              className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
              required
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              rows={2}
              placeholder="Short description of the tournament..."
              className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition resize-none"
            />
          </div>

          {/* Location */}
          <div>
            <label className="block text-xs font-semibold text-muted-foreground mb-1.5">Location</label>
            <input
              type="text"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g. FPT University, Ho Chi Minh City"
              className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
            />
          </div>

          {/* Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Start Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={startDate}
                onChange={(e) => setStartDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                End Date <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
              />
            </div>
          </div>

          {/* Registration Dates */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Reg. Opens <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={regOpen}
                onChange={(e) => setRegOpen(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-muted-foreground mb-1.5">
                Reg. Closes <span className="text-red-500">*</span>
              </label>
              <input
                type="datetime-local"
                value={regClose}
                onChange={(e) => setRegClose(e.target.value)}
                className="w-full rounded-xl border border-border bg-muted/10 px-3.5 py-2.5 text-sm text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition"
                required
              />
            </div>
          </div>

          {/* Events */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="block text-xs font-semibold text-muted-foreground">Events</label>
              <button
                type="button"
                onClick={addEvent}
                className="inline-flex items-center gap-1 rounded-lg border border-border bg-card px-2.5 py-1 text-xs font-semibold text-foreground transition hover:bg-muted/50"
              >
                <Plus className="h-3.5 w-3.5" />
                Add Event
              </button>
            </div>
            <div className="space-y-2.5">
              {events.map((ev, i) => (
                <div key={i} className="rounded-xl border border-border bg-muted/20 p-3.5">
                  <div className="flex items-center justify-between mb-3">
                    <span className="text-xs font-semibold text-muted-foreground">Event {i + 1}</span>
                    {events.length > 1 && (
                      <button
                        type="button"
                        onClick={() => removeEvent(i)}
                        className="text-red-400 hover:text-red-600 transition"
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </button>
                    )}
                  </div>
                  <div className="grid grid-cols-2 gap-2.5">
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                        Puzzle Type <span className="text-red-500">*</span>
                      </label>
                      <select
                        value={ev.puzzleTypeId}
                        onChange={(e) => updateEvent(i, 'puzzleTypeId', e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                        required
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
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                        Format
                      </label>
                      <select
                        value={ev.eventFormatCode}
                        onChange={(e) => updateEvent(i, 'eventFormatCode', e.target.value)}
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                      >
                        {FORMAT_OPTIONS.map((f) => (
                          <option key={f.value} value={f.value}>{f.label}</option>
                        ))}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                        Time Limit (ms)
                      </label>
                      <input
                        type="number"
                        value={ev.timeLimitMs}
                        onChange={(e) => updateEvent(i, 'timeLimitMs', e.target.value)}
                        placeholder="e.g. 600000"
                        className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                      />
                    </div>
                    {ev.eventFormatCode === 'TRADITIONAL' && (
                      <>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            Cutoff Time (ms)
                          </label>
                          <input
                            type="number"
                            value={ev.cutoffTimeMs}
                            onChange={(e) => updateEvent(i, 'cutoffTimeMs', e.target.value)}
                            placeholder="e.g. 60000"
                            className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                          />
                        </div>
                        <div>
                          <label className="block text-[10px] font-semibold text-muted-foreground mb-1">
                            Solve Count
                          </label>
                          <input
                            type="number"
                            value={ev.solveCount}
                            onChange={(e) => updateEvent(i, 'solveCount', Number(e.target.value))}
                            className="w-full rounded-lg border border-border bg-card px-2.5 py-2 text-xs text-foreground outline-none focus:border-primary transition"
                            min="1"
                            max="5"
                          />
                        </div>
                      </>
                    )}
                  </div>

                  {/* Medley Relay Sub-puzzles */}
                  {ev.eventFormatCode === 'MEDLEY' && (
                    <div className="mt-4 border-t border-border pt-3 space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] font-bold text-foreground">Relay Puzzles (Minimum 2)</span>
                        <button
                          type="button"
                          onClick={() => addMedleyPuzzle(i)}
                          className="inline-flex items-center gap-0.5 rounded bg-muted hover:bg-muted/80 px-2 py-0.5 text-[10px] font-semibold text-foreground transition"
                        >
                          <Plus className="h-3 w-3" /> Add Puzzle
                        </button>
                      </div>
                      
                      <div className="space-y-2">
                        {ev.medleyPuzzles.map((mp, mpIdx) => (
                          <div key={mpIdx} className="flex items-center gap-2">
                            <span className="text-[10px] text-muted-foreground w-12 font-mono">#{mpIdx + 1}</span>
                            <select
                              value={mp.puzzleTypeId}
                              onChange={(e) => updateMedleyPuzzle(i, mpIdx, e.target.value)}
                              className="flex-1 rounded-lg border border-border bg-card px-2.5 py-1.5 text-xs text-foreground outline-none focus:border-primary transition"
                              required
                            >
                              {puzzleTypes.map((p) => (
                                <option key={p.id} value={p.id}>{p.name} ({p.code})</option>
                              ))}
                            </select>
                            {ev.medleyPuzzles.length > 2 && (
                              <button
                                type="button"
                                onClick={() => removeMedleyPuzzle(i, mpIdx)}
                                className="text-red-400 hover:text-red-600 p-1"
                              >
                                <Trash2 className="h-3 w-3" />
                              </button>
                            )}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-end gap-3 pt-2">
            <button
              type="button"
              onClick={onClose}
              className="rounded-xl border border-border bg-card px-5 py-2.5 text-sm font-semibold text-muted-foreground shadow-sm transition hover:bg-muted/50"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isLoading || puzzleTypes.length === 0}
              className="inline-flex items-center gap-2 rounded-xl bg-primary px-5 py-2.5 text-sm font-bold text-primary-foreground shadow-md transition hover:bg-primary/90 disabled:opacity-60"
            >
              {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
              {isLoading ? 'Creating…' : 'Create Tournament'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
