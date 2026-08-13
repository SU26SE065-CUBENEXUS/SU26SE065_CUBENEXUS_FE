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
  getScrambles,
  getScrambleSummary,
  importScrambles,
  retireScramble,
  type ScrambleMode,
  type ScramblePoolItem,
  type ScrambleSummary,
} from '@/features/admin/api/adminScrambleApi';

const MODES: { value: ScrambleMode; label: string; help: string }[] = [
  { value: 'ONLINE_MATCH', label: 'Online Match', help: 'Một đề chung cho hai đối thủ.' },
  { value: 'OFFLINE', label: 'Offline', help: 'Đề riêng theo group và solve.' },
  { value: 'ONLINE_ASYNC', label: 'Online Async', help: 'Đề riêng khi competitor bắt đầu attempt.' },
];

const STATUS_CONFIG: Record<string, { label: string; style: string }> = {
  DRAFT: { label: 'Bản Nháp (DRAFT)', style: 'bg-amber-50 text-amber-700 border-amber-200' },
  AVAILABLE: { label: 'Đã Duyệt · Sẵn Sàng (AVAILABLE)', style: 'bg-emerald-50 text-emerald-700 border-emerald-200' },
  RESERVED: { label: 'Đã Cấp Phát (RESERVED)', style: 'bg-indigo-50 text-indigo-700 border-indigo-200' },
  USED: { label: 'Đã Sử Dụng', style: 'bg-purple-50 text-purple-700 border-purple-200' },
  RETIRED: { label: 'Đã Thu Hồi', style: 'bg-rose-50 text-rose-700 border-rose-200' },
  INVALID: { label: 'Không Hợp Lệ (INVALID)', style: 'bg-red-50 text-red-700 border-red-200' },
};

export default function ScrambleControlCenterPage() {
  const [mode, setMode] = useState<ScrambleMode>('ONLINE_MATCH');
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

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [page, totals] = await Promise.all([
        getScrambles({ mode, status, puzzleTypeId: listPuzzleId || undefined, pageSize: 100 }),
        getScrambleSummary(),
      ]);
      setItems(page.items);
      setTotalItems(page.total);
      setSummary(totals);
    } catch (error: any) {
      setMessage({ ok: false, text: error?.message || 'Không tải được kho đề.' });
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

  const statusCards = useMemo(() => {
    const totals = summary
      .filter((item) => item.competitionMode === mode)
      .reduce<Record<string, number>>((result, item) => {
        result[item.status] = (result[item.status] || 0) + item.count;
        return result;
      }, {});

    return Object.entries(totals).sort(([left], [right]) => left.localeCompare(right));
  }, [mode, summary]);

  const statusOptions = useMemo(
    () => [...new Set(summary.filter((item) => item.competitionMode === mode).map((item) => item.status))].sort(),
    [mode, summary],
  );

  const draftItems = useMemo(
    () => items.filter((item) => item.status === 'DRAFT'),
    [items]
  );

  async function mutate(action: () => Promise<unknown>, success: string) {
    setBusy(true);
    setMessage(null);
    try {
      await action();
      setMessage({ ok: true, text: success });
      await load();
    } catch (error: any) {
      setMessage({ ok: false, text: error?.message || 'Thao tác thất bại.' });
    } finally {
      setBusy(false);
    }
  }

  async function handleApproveAll() {
    if (!draftItems.length) return;
    setBusy(true);
    setMessage(null);
    try {
      await Promise.all(draftItems.map((item) => approveScramble(item.id)));
      setMessage({ ok: true, text: `Đã duyệt thành công tất cả ${draftItems.length} đề (DRAFT).` });
      await load();
    } catch (error: any) {
      setMessage({ ok: false, text: error?.message || 'Không thể duyệt tất cả đề.' });
    } finally {
      setBusy(false);
    }
  }

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
                Kho quản lý đề xoay Rubik dùng chung, tách biệt theo từng chế độ thi đấu (Online Match, Offline, Async).
              </p>
            </div>
          </div>
          <button
            onClick={() => void load()}
            disabled={loading || busy}
            className="inline-flex items-center gap-2 px-4 py-2.5 rounded-2xl border border-slate-200 bg-white hover:bg-slate-50 text-xs font-bold text-slate-700 transition shadow-2xs cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} /> Làm mới
          </button>
        </header>

        {/* Competition Modes */}
        <div className="grid gap-3.5 md:grid-cols-3">
          {MODES.map((item) => {
            const isActive = mode === item.value;
            return (
              <button
                key={item.value}
                onClick={() => {
                  setMode(item.value);
                  setStatus('');
                  setListPuzzleId('');
                }}
                className={`rounded-2xl border p-4 text-left transition cursor-pointer ${
                  isActive
                    ? 'border-indigo-600 bg-indigo-50/70 ring-2 ring-indigo-100 shadow-2xs'
                    : 'bg-white border-slate-200 hover:border-slate-300'
                }`}
              >
                <div className="flex items-center justify-between">
                  <b className={`text-sm font-extrabold ${isActive ? 'text-indigo-950' : 'text-slate-800'}`}>
                    {item.label}
                  </b>
                  {isActive && <span className="h-2 w-2 rounded-full bg-indigo-600"></span>}
                </div>
                <p className="mt-1 text-xs text-slate-500 font-medium">{item.help}</p>
              </button>
            );
          })}
        </div>

        <div className="rounded-2xl border border-indigo-100 bg-indigo-50/70 px-4 py-3 text-xs leading-relaxed text-indigo-900">
          <strong>Quy tắc cấp đề:</strong> giải đấu chỉ lấy đề <strong>AVAILABLE (đã duyệt)</strong> đúng chế độ và đúng loại Rubik.
          Đề có thời điểm duyệt sớm nhất được cấp trước; nếu trùng thời điểm, hệ thống lần lượt xét thời điểm tạo rồi ID.
          Các đề DRAFT, RETIRED, RESERVED, USED hoặc INVALID không được lấy lại.
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
            Chưa có dữ liệu trạng thái cho chế độ này. Hãy sinh hoặc nhập đề để bắt đầu.
          </div>
        )}

        {/* Alert Message Banner */}
        {message && (
          <div
            className={`rounded-2xl border p-4 text-xs font-bold transition flex items-center justify-between ${
              message.ok
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
                <Sparkles className="h-4 w-4 text-indigo-600" /> Sinh đề tự động
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                Mỗi đề được sinh tự động gồm đúng 2 bước xoay để phù hợp luồng scan AI. Đề mới tạo mặc định ở trạng thái DRAFT cần duyệt trước khi cấp phát.
              </p>
            </div>

            <div className="grid gap-3.5 sm:grid-cols-2">
              <label className="grid gap-1.5 text-xs font-bold text-slate-700">
                Loại Rubik
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
                Số lượng đề muốn sinh
                <input
                  aria-label="Số lượng đề muốn sinh"
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
              Ghi chú đợt đề <span className="font-medium text-slate-400">(không bắt buộc)</span>
              <input
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
                placeholder="Ví dụ: Đợt đề Online Match tuần 1"
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
              <span>Duyệt và đưa vào kho sử dụng ngay (AVAILABLE)</span>
            </label>

            <button
              disabled={busy || !puzzleId}
              onClick={() =>
                void mutate(
                  () => generateScrambles({ competitionMode: mode, puzzleTypeId: puzzleId, count, notes, autoApprove }),
                  `Đã sinh thành công ${count} đề xoay (2 bước).`
                )
              }
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl bg-indigo-600 hover:bg-indigo-700 text-white font-extrabold text-xs py-3 shadow-2xs transition cursor-pointer disabled:opacity-50"
            >
              <Plus className="h-4 w-4" /> Sinh {count} Đề Xoay
            </button>
          </section>

          {/* Manual Import Scrambles */}
          <section className="rounded-3xl border border-slate-200 bg-white p-6 shadow-2xs space-y-4">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
                <FileText className="h-4 w-4 text-emerald-600" /> Nhập đề thủ công
              </h2>
              <p className="mt-1 text-xs text-slate-500 font-medium leading-relaxed">
                Mỗi dòng là một chuỗi xoay Rubik. Đề sau khi nhập sẽ ở trạng thái DRAFT để kiểm duyệt trước khi cấp phát.
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
                  `Đã nhập thành công ${sequences.length} đề vào kho.`
                );
              }}
              className="w-full inline-flex items-center justify-center gap-2 rounded-2xl border border-indigo-600 text-indigo-700 bg-indigo-50 hover:bg-indigo-100 font-extrabold text-xs py-3 transition cursor-pointer disabled:opacity-50"
            >
              <FileText className="h-4 w-4" /> Nhập Vào Kho Đề
            </button>
          </section>
        </div>

        {/* Scramble Pool Table Section */}
        <section className="overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xs">
          {/* Table Header Controls */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-200 p-5 bg-slate-50/50">
            <div>
              <h2 className="text-base font-extrabold text-slate-900 tracking-tight">Danh sách đề ({totalItems})</h2>
              <p className="text-xs text-slate-500 font-medium mt-0.5">
                {totalItems === 0 ? (
                  <span>Chưa có đề trong bộ lọc hiện tại.</span>
                ) : draftItems.length > 0 ? (
                  <span className="text-amber-700 font-extrabold">Có {draftItems.length} đề DRAFT chờ duyệt</span>
                ) : (
                  <span className="text-emerald-700 font-extrabold">
                    Có {items.filter((item) => item.status === 'AVAILABLE').length} đề đã duyệt và sẵn sàng cấp phát
                  </span>
                )}
              </p>
            </div>

            <div className="flex items-center gap-3">
              {/* Approve All Button (1 Click Duyệt Tất Cả DRAFT) */}
              {draftItems.length > 0 && (
                <button
                  onClick={handleApproveAll}
                  disabled={busy}
                  className="inline-flex items-center gap-1.5 text-xs font-black px-3.5 py-2 rounded-xl bg-emerald-600 hover:bg-emerald-700 text-white transition shadow-2xs cursor-pointer disabled:opacity-50 animate-pulse"
                  title="Duyệt tất cả các đề DRAFT cùng lúc"
                >
                  <CheckCheck className="h-4 w-4" /> Duyệt Tất Cả ({draftItems.length})
                </button>
              )}

              <div className="flex items-center gap-2">
                <label htmlFor="list-puzzle-filter" className="text-xs font-bold text-slate-500">Loại Rubik</label>
                <select
                  id="list-puzzle-filter"
                  value={listPuzzleId}
                  onChange={(event) => setListPuzzleId(event.target.value)}
                  className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-bold text-slate-700 outline-none focus:border-indigo-600 transition cursor-pointer"
                >
                  <option value="">Tất cả loại Rubik</option>
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
                  <option value="">Tất cả trạng thái</option>
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
                    <th className="px-5 py-3.5">SCRAMBLE (CHUỖI XOAY)</th>
                    <th className="px-5 py-3.5">TRẠNG THÁI</th>
                    <th className="px-5 py-3.5">KIỂM DUYỆT</th>
                    <th className="px-5 py-3.5">THỨ TỰ CẤP</th>
                    <th className="px-5 py-3.5">CẤP CHO</th>
                    <th className="px-5 py-3.5 text-right">THAO TÁC</th>
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
                        {/* Cube Code */}
                        <td className="px-5 py-4 font-black text-slate-900 font-mono text-xs">
                          {item.puzzleCode}
                        </td>

                        {/* Scramble Sequence */}
                        <td className="px-5 py-4 max-w-md font-mono text-xs font-extrabold text-slate-900 tracking-wider">
                          <span className="inline-block px-2.5 py-1 rounded-lg bg-slate-100 border border-slate-200 text-indigo-900">
                            {item.sequence}
                          </span>
                        </td>

                        {/* Status Badge */}
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
                              <span className="font-extrabold text-emerald-700">Đã duyệt</span>
                              <p className="mt-0.5 text-[10px] text-slate-400">{new Date(item.approvedAt).toLocaleString('vi-VN')}</p>
                            </div>
                          ) : (
                            <span className="font-extrabold text-amber-700">Chưa duyệt</span>
                          )}
                        </td>

                        <td className="px-5 py-4 whitespace-nowrap">
                          {item.queuePosition ? (
                            <span className="inline-flex rounded-lg border border-indigo-200 bg-indigo-50 px-2 py-1 font-black text-indigo-700">
                              #{item.queuePosition}
                            </span>
                          ) : '—'}
                        </td>

                        {/* Assigned Target */}
                        <td className="px-5 py-4 text-xs font-semibold text-slate-500 whitespace-nowrap">
                          {item.assignedTargetType || '—'}
                        </td>

                        {/* Actions */}
                        <td className="px-5 py-4 text-right whitespace-nowrap">
                          <div className="flex items-center justify-end gap-2">
                            {/* Approve Single Scramble */}
                            {isDraft && (
                              <button
                                disabled={busy}
                                onClick={() => void mutate(() => approveScramble(item.id), 'Đã duyệt đề.')}
                                className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-emerald-50 text-emerald-700 border border-emerald-200 hover:bg-emerald-100 transition cursor-pointer disabled:opacity-50"
                                title="Duyệt đề xoay này"
                              >
                                <Check className="h-3.5 w-3.5" /> Duyệt
                              </button>
                            )}

                            {/* Retire Scramble */}
                            {canRetire && (
                              <button
                                disabled={busy}
                                onClick={() => void mutate(() => retireScramble(item.id), 'Đã thu hồi đề.')}
                                className="inline-flex items-center gap-1 text-xs font-extrabold px-2.5 py-1 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 hover:bg-rose-100 transition cursor-pointer disabled:opacity-50"
                                title="Thu hồi đề xoay này"
                              >
                                <RotateCcw className="h-3.5 w-3.5" /> Thu Hồi
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
                        Chưa có đề xoay nào trong danh sách.
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
