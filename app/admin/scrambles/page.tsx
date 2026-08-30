'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import {
  Database,
  Loader2,
  RefreshCw,
  CheckCheck,
  Check,
  RotateCcw,
  Sparkles,
  Plus,
  FileText,
  Filter,
} from 'lucide-react';
import { getPuzzleTypes } from '@/lib/api/tournaments';
import type { PuzzleTypeResponseDto } from '@/lib/api/types';
import {
  approveScramble,
  generateScrambles,
  getScrambleMode,
  getScrambles,
  getScrambleSummary,
  importScrambles,
  retireScramble,
  setScrambleMode,
  type ScrambleMode,
  type ScramblePoolItem,
  type ScrambleSummary,
} from '@/features/admin/api/adminScrambleApi';

const MODES: { value: ScrambleMode; label: string; help: string }[] = [
  { value: 'ONLINE_MATCH', label: 'Online Match', help: 'Shared scramble for both competitors.' },
  { value: 'OFFLINE', label: 'Offline', help: 'Group and solve specific scrambles.' },
  { value: 'ONLINE_ASYNC', label: 'Online Async', help: 'Unique scramble generated when competitor starts attempt.' },
];

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  DRAFT: { label: 'DRAFT (Pending Review)', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  AVAILABLE: { label: 'AVAILABLE (Approved)', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RESERVED: { label: 'RESERVED (Allocated)', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  USED: { label: 'USED', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  RETIRED: { label: 'RETIRED', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  INVALID: { label: 'INVALID', style: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ScrambleControlCenterPage() {
  const [mode, setMode] = useState<ScrambleMode>('ONLINE_MATCH');
  const [generationMode, setGenerationMode] = useState<'MANUAL' | 'AUTO'>('MANUAL');
  const [modesSettings, setModesSettings] = useState<Record<ScrambleMode, 'MANUAL' | 'AUTO'>>({
    ONLINE_MATCH: 'MANUAL',
    OFFLINE: 'MANUAL',
    ONLINE_ASYNC: 'MANUAL',
  });
  const [puzzles, setPuzzles] = useState<PuzzleTypeResponseDto[]>([]);
  const [puzzleId, setPuzzleId] = useState('');
  const [listPuzzleId, setListPuzzleId] = useState('');
  const [status, setStatus] = useState('');
  const [items, setItems] = useState<ScramblePoolItem[]>([]);
  const [totalItems, setTotalItems] = useState(0);
  const [summary, setSummary] = useState<ScrambleSummary[]>([]);
  const [count, setCount] = useState(10);
  const [autoApprove, setAutoApprove] = useState(false);
  const [importText, setImportText] = useState('');
  const [notes, setNotes] = useState('');
  const [busy, setBusy] = useState(false);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ ok: boolean; text: string } | null>(null);

  // Read initial mode from URL if present
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      const urlMode = params.get('mode') as ScrambleMode | null;
      if (urlMode && ['ONLINE_MATCH', 'OFFLINE', 'ONLINE_ASYNC'].includes(urlMode)) {
        setMode(urlMode);
      }
    }
  }, []);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [page, totals, matchMode, offlineMode, asyncMode] = await Promise.all([
        getScrambles({ mode, status, puzzleTypeId: listPuzzleId || undefined, pageSize: 100 }),
        getScrambleSummary(),
        getScrambleMode('ONLINE_MATCH').catch(() => ({ competitionMode: 'ONLINE_MATCH' as const, mode: 'MANUAL' as const })),
        getScrambleMode('OFFLINE').catch(() => ({ competitionMode: 'OFFLINE' as const, mode: 'MANUAL' as const })),
        getScrambleMode('ONLINE_ASYNC').catch(() => ({ competitionMode: 'ONLINE_ASYNC' as const, mode: 'MANUAL' as const })),
      ]);
      setItems(page.items);
      setTotalItems(page.total);
      setSummary(totals);

      const newSettings: Record<ScrambleMode, 'MANUAL' | 'AUTO'> = {
        ONLINE_MATCH: matchMode.mode,
        OFFLINE: offlineMode.mode,
        ONLINE_ASYNC: asyncMode.mode,
      };
      setModesSettings(newSettings);
      setGenerationMode(newSettings[mode]);
    } catch (error: any) {
      setMessage({ ok: false, text: error?.message || 'Failed to load scramble pool.' });
    } finally {
      setLoading(false);
    }
  }, [mode, listPuzzleId, status]);

  useEffect(() => {
    getPuzzleTypes().then((types) => {
      const active = types.filter((item) => item.isActive);
      setPuzzles(active);
      setPuzzleId((current) => current || active[0]?.id || '');
    });
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const handleSelectMode = (newMode: ScrambleMode) => {
    setMode(newMode);
    setStatus('');
    setListPuzzleId('');
    setGenerationMode(modesSettings[newMode] || 'MANUAL');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.set('mode', newMode);
      window.history.replaceState(null, '', url.toString());
    }
  };

  const statusCards = useMemo(() => {
    const totals = summary
      .filter((item) => item.competitionMode === mode)
      .reduce<Record<string, number>>((result, item) => {
        result[item.status] = (result[item.status] || 0) + item.count;
        return result;
      }, {});

    return Object.entries(totals).sort(([left], [right]) => left.localeCompare(right));
  }, [mode, summary]);

  const draftItems = useMemo(() => items.filter((item) => item.status === 'DRAFT'), [items]);
  const statusOptions = useMemo(() => ['DRAFT', 'AVAILABLE', 'RESERVED', 'USED', 'RETIRED', 'INVALID'], []);

  const mutate = async (action: () => Promise<unknown>, successText: string) => {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: successText });
      setImportText('');
      setNotes('');
      await load();
    } catch (error: any) {
      setMessage({ ok: false, text: error?.message || 'Action failed.' });
    } finally {
      setBusy(false);
    }
  };

  const handleApproveAll = async () => {
    if (draftItems.length === 0) return;
    setBusy(true);
    setMessage(null);
    try {
      await Promise.all(draftItems.map((item) => approveScramble(item.id)));
      setMessage({ ok: true, text: `Successfully approved all ${draftItems.length} DRAFT scrambles.` });
      await load();
    } catch (error: any) {
      setMessage({ ok: false, text: error?.message || 'Failed to approve all scrambles.' });
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-full bg-slate-50 p-6 text-left">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <header className="flex flex-wrap items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-slate-200 shadow-2xs">
          <div className="flex items-center gap-3.5">
            <div className="p-3 bg-indigo-50 border border-indigo-100 rounded-2xl text-indigo-600 shrink-0">
              <Database className="h-6 w-6" />
            </div>
            <div>
              <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">Scramble Control Center</h1>
              <p className="text-xs text-slate-500 mt-0.5 font-medium">
                Centralized Rubik scramble pool management, isolated by competition mode (Online Match, Offline, Async).
              </p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading || busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Refresh
          </button>
        </header>

        {/* Competition Modes Navigation Cards with live AUTO/MANUAL Badges */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold text-slate-500 uppercase tracking-wider font-mono">
              Select Competition Mode
            </span>
            <span className="text-xs text-indigo-600 font-semibold">
              Currently Editing: <strong>{MODES.find((item) => item.value === mode)?.label}</strong>
            </span>
          </div>
          <div className="grid gap-3.5 md:grid-cols-3">
            {MODES.map((item) => {
              const isActive = mode === item.value;
              const itemSetting = modesSettings[item.value] || 'MANUAL';
              return (
                <button
                  key={item.value}
                  onClick={() => handleSelectMode(item.value)}
                  className={`rounded-2xl border p-4 text-left transition cursor-pointer relative overflow-hidden ${isActive
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-200 shadow-sm'
                    : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/60'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <b className={`text-sm font-extrabold ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                      {item.label}
                    </b>
                    <span
                      className={`rounded-full px-2.5 py-0.5 text-[10px] font-black uppercase tracking-wider border ${itemSetting === 'AUTO'
                        ? 'bg-emerald-100 text-emerald-800 border-emerald-300'
                        : 'bg-amber-100 text-amber-800 border-amber-300'
                        }`}
                    >
                      {itemSetting}
                    </span>
                  </div>
                  <p className="mt-1.5 text-xs text-slate-500 font-medium leading-relaxed">{item.help}</p>
                  {isActive && (
                    <div className="mt-2 text-[11px] font-bold text-indigo-700 flex items-center gap-1">
                      <Check className="h-3 w-3" /> Active Configuration
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Mode Generation Switcher Banner */}
        <section className="rounded-3xl border border-indigo-200 bg-indigo-50/30 p-6 shadow-2xs">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-2.5">
                <h2 className="text-base font-extrabold text-slate-900 tracking-tight">
                  Scramble Generation Mode — <span className="text-indigo-600">{MODES.find((item) => item.value === mode)?.label}</span>
                </h2>
                <span
                  className={`rounded-full px-3 py-1 text-[11px] font-black uppercase tracking-wider ${generationMode === 'AUTO'
                    ? 'bg-emerald-100 text-emerald-800 border border-emerald-300'
                    : 'bg-amber-100 text-amber-800 border border-amber-300'
                    }`}
                >
                  {generationMode === 'AUTO' ? 'AUTO' : 'MANUAL'}
                </span>
              </div>
              <p className="mt-1.5 text-xs text-slate-600 font-medium max-w-3xl leading-relaxed">
                {generationMode === 'AUTO'
                  ? `AUTO GENERATION MODE: When the ${MODES.find((item) => item.value === mode)?.label} pool is depleted, the system automatically generates valid 2-move scrambles on demand without blocking tournament rounds.`
                  : `MANUAL GENERATION MODE: Only pre-approved scrambles in the pool can be used. When empty, admins must generate or import new sets.`}
              </p>
            </div>

            <div className="flex items-center gap-2 bg-white p-1.5 rounded-2xl border border-slate-200 shadow-2xs">
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await setScrambleMode(mode, 'MANUAL');
                    setGenerationMode(res.mode);
                    setModesSettings((prev) => ({ ...prev, [mode]: res.mode }));
                    setMessage({ ok: true, text: `${MODES.find((item) => item.value === mode)?.label} switched to MANUAL. Saved to database.` });
                  } catch (e: any) {
                    setMessage({ ok: false, text: e?.message || 'Failed to switch mode' });
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${generationMode === 'MANUAL'
                  ? 'bg-amber-500 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                MANUAL
              </button>
              <button
                disabled={busy}
                onClick={async () => {
                  setBusy(true);
                  try {
                    const res = await setScrambleMode(mode, 'AUTO');
                    setGenerationMode(res.mode);
                    setModesSettings((prev) => ({ ...prev, [mode]: res.mode }));
                    setMessage({ ok: true, text: `${MODES.find((item) => item.value === mode)?.label} switched to AUTO. Saved to database.` });
                  } catch (e: any) {
                    setMessage({ ok: false, text: e?.message || 'Failed to switch mode' });
                  } finally {
                    setBusy(false);
                  }
                }}
                className={`px-4 py-2 rounded-xl text-xs font-black transition cursor-pointer ${generationMode === 'AUTO'
                  ? 'bg-emerald-600 text-white shadow-2xs'
                  : 'text-slate-600 hover:text-slate-900'
                  }`}
              >
                AUTO
              </button>
            </div>
          </div>
        </section>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs leading-relaxed text-indigo-900">
          <strong>Allocation Rules:</strong> Competitions only draw <strong>AVAILABLE (approved)</strong> scrambles matching the exact mode and puzzle type.
          Scrambles with the earliest approval time are allocated first. Draft, retired, reserved, used, or invalid scrambles are never re-allocated.
        </div>

        {/* Status Summary Cards */}
        {statusCards.length > 0 ? (
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-5">
            {statusCards.map(([statusCode, total]) => {
              const cfg = STATUS_CONFIG[statusCode] || {
                label: statusCode,
                style: 'bg-slate-50 text-slate-700 border-slate-200',
              };
              return (
                <div key={statusCode} className={`rounded-2xl border p-4 ${cfg.style} shadow-2xs`}>
                  <p className="text-[11px] font-extrabold uppercase tracking-wider">{cfg.label}</p>
                  <p className="mt-1 text-2xl font-black">{total}</p>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="rounded-2xl border border-dashed border-slate-200 bg-white p-5 text-xs text-slate-500 font-medium">
            No status data for this mode. Generate or import scrambles to get started.
          </div>
        )}

        {/* Alert Message Banner */}
        {message && (
          <div
            className={`rounded-2xl border p-4 text-xs font-bold transition flex items-center justify-between ${message.ok
              ? 'border-emerald-200 bg-emerald-50 text-emerald-900'
              : 'border-rose-200 bg-rose-50 text-rose-900'
              }`}
          >
            <span>{message.text}</span>
            <button
              onClick={() => setMessage(null)}
              className="text-slate-500 hover:text-slate-700 font-extrabold ml-4 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Scramble Actions Grid */}
        <div className="grid gap-5 lg:grid-cols-2">
          {/* Auto Generate Scrambles */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <Sparkles className="h-4 w-4 text-indigo-600" /> Auto Generate Scrambles
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                Generated scrambles consist of valid move sequences. Newly created scrambles default to DRAFT unless auto-approved.
              </p>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-slate-700">
                Puzzle Type
                <select
                  value={puzzleId}
                  onChange={(event) => setPuzzleId(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                >
                  {puzzles.map((item) => (
                    <option key={item.id} value={item.id}>
                      {item.name} ({item.code})
                    </option>
                  ))}
                </select>
              </label>
              <label className="grid gap-1.5 text-xs font-bold text-slate-700">
                Quantity to Generate
                <input
                  aria-label="Quantity to generate"
                  type="number"
                  min={1}
                  max={500}
                  value={count}
                  onChange={(event) => setCount(Number(event.target.value))}
                  className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-semibold text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
                />
              </label>
            </div>

            <label className="grid gap-1.5 text-xs font-bold text-slate-700">
              Batch Notes <span className="font-medium text-slate-400">(optional)</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="e.g. Online Match Scramble Batch #1"
                className="rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-xs font-medium text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
              />
            </label>

            <label className="flex items-center gap-2 text-xs font-semibold text-slate-700 cursor-pointer">
              <input
                type="checkbox"
                checked={autoApprove}
                onChange={(event) => setAutoApprove(event.target.checked)}
                className="rounded border-slate-300 text-indigo-600 focus:ring-indigo-500"
              />
              <span>Auto-approve & make available immediately (AVAILABLE)</span>
            </label>

            <button
              disabled={busy || !puzzleId}
              onClick={() =>
                void mutate(
                  () => generateScrambles({ competitionMode: mode, puzzleTypeId: puzzleId, count, notes, autoApprove }),
                  `Successfully generated ${count} scrambles.`
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Generate {count} Scrambles
            </button>
          </section>

          {/* Manual Import Scrambles */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Manual Import Scrambles
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                Enter one Rubik scramble sequence per line. Imported scrambles start as DRAFT for review.
              </p>
            </div>

            <textarea
              value={importText}
              onChange={(event) => setImportText(event.target.value)}
              rows={5}
              placeholder={"R U'\nF2 L\nB U"}
              className="w-full rounded-2xl border border-slate-200 bg-slate-50 p-3 font-mono text-xs text-slate-800 outline-none focus:border-indigo-600 focus:bg-white transition"
            />

            <button
              disabled={busy || !puzzleId || !importText.trim()}
              onClick={() => {
                const sequences = importText.split(/\r?\n/).map((item) => item.trim()).filter(Boolean);
                void mutate(
                  () => importScrambles({ competitionMode: mode, puzzleTypeId: puzzleId, sequences, notes }),
                  `Successfully imported ${sequences.length} scrambles.`
                );
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-600 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-extrabold text-xs py-3 transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4" /> Import to Scramble Pool
            </button>
          </section>
        </div>

        {/* Scramble Pool Table Section */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 bg-slate-50/50">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Scramble List ({totalItems})</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {totalItems === 0 ? (
                  <span>No scrambles found matching current filters.</span>
                ) : draftItems.length > 0 ? (
                  <span className="text-amber-700 font-extrabold">{draftItems.length} DRAFT scrambles pending approval</span>
                ) : (
                  <span className="text-emerald-700 font-extrabold">
                    {items.filter((item) => item.status === 'AVAILABLE').length} AVAILABLE scrambles ready for allocation
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Approve All Button */}
              {draftItems.length > 0 && (
                <button
                  onClick={handleApproveAll}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs cursor-pointer disabled:opacity-50 animate-pulse"
                  title="Approve all DRAFT scrambles at once"
                >
                  <CheckCheck className="h-4 w-4" /> Approve All ({draftItems.length})
                </button>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor="list-puzzle-filter" className="text-xs font-bold text-slate-500">Puzzle Type</label>
                <select
                  id="list-puzzle-filter"
                  value={listPuzzleId}
                  onChange={(event) => setListPuzzleId(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 transition cursor-pointer"
                >
                  <option value="">All Puzzle Types</option>
                  {puzzles.map((item) => (
                    <option key={item.id} value={item.id}>{item.name} ({item.code})</option>
                  ))}
                </select>
              </div>

              {/* Status Filter */}
              <div className="flex items-center gap-2">
                <Filter className="h-3.5 w-3.5 text-slate-400 shrink-0" />
                <select
                  value={status}
                  onChange={(event) => setStatus(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 transition cursor-pointer"
                >
                  <option value="">All Statuses</option>
                  {statusOptions.map((item) => (
                    <option key={item} value={item}>
                      {STATUS_CONFIG[item]?.label || item}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Table */}
          {loading ? (
            <div className="flex justify-center p-12">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-600" />
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs border-collapse">
                <thead className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-bold text-slate-500 uppercase tracking-wider">
                  <tr>
                    <th className="px-5 py-3.5">CUBE</th>
                    <th className="px-5 py-3.5">SCRAMBLE SEQUENCE</th>
                    <th className="px-5 py-3.5">STATUS</th>
                    <th className="px-5 py-3.5">APPROVAL</th>
                    <th className="px-5 py-3.5">QUEUE POSITION</th>
                    <th className="px-5 py-3.5">ASSIGNED TO</th>
                    <th className="px-5 py-3.5 text-right">ACTIONS</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 font-medium text-slate-700">
                  {items.map((item) => {
                    const isDraft = item.status === 'DRAFT';
                    const canRetire = ['DRAFT', 'AVAILABLE'].includes(item.status);
                    const cfg = STATUS_CONFIG[item.status] || {
                      label: item.status,
                      style: 'bg-slate-100 text-slate-700 border-slate-200',
                    };

                    return (
                      <tr key={item.id} className="hover:bg-slate-50/70 transition align-middle">
                        <td className="px-5 py-4 font-black text-slate-900 font-sans text-xs">
                          {item.puzzleCode}
                        </td>
                        <td className="px-5 py-4 max-w-md font-mono text-xs font-extrabold text-slate-900 tracking-wider">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-indigo-900">
                            {item.sequence}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span
                            className={`inline-flex items-center rounded-full border px-2.5 py-0.5 text-[10px] font-extrabold uppercase ${cfg.style}`}
                          >
                            {cfg.label}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {item.approvedAt ? (
                            <div>
                              <span className="font-extrabold text-emerald-700">Approved</span>
                              <p className="mt-0.5 text-[10px] text-slate-400">{new Date(item.approvedAt).toLocaleString('en-US')}</p>
                            </div>
                          ) : (
                            <span className="font-extrabold text-amber-700">Pending</span>
                          )}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          {item.queuePosition ? (
                            <span className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 font-black text-indigo-700">
                              #{item.queuePosition}
                            </span>
                          ) : '—'}
                        </td>
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {item.assignedTargetType || '—'}
                        </td>
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {isDraft && (
                              <button
                                disabled={busy}
                                onClick={() => void mutate(() => approveScramble(item.id), 'Scramble approved.')}
                                className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                                title="Approve scramble"
                              >
                                <Check className="h-3.5 w-3.5" /> Approve
                              </button>
                            )}
                            {canRetire && (
                              <button
                                disabled={busy}
                                onClick={() => void mutate(() => retireScramble(item.id), 'Scramble retired.')}
                                className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                                title="Retire scramble"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Retire
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                  {!items.length && (
                    <tr>
                      <td colSpan={7} className="py-14 text-center text-slate-400 font-semibold text-xs">
                        No scrambles found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
