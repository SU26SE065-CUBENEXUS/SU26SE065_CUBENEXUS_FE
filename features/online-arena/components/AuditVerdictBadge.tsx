'use client';

import React, { useState } from 'react';
import { createPortal } from 'react-dom';
import { ShieldAlert, ShieldCheck, AlertCircle, Clock, FileText, Eye, ExternalLink, X } from 'lucide-react';

interface AuditVerdictBadgeProps {
  reportStatus?: string;
  verdictCode?: string;
  adminNote?: string;
}

export function AuditVerdictBadge({ reportStatus, verdictCode, adminNote }: AuditVerdictBadgeProps) {
  const [previewImage, setPreviewImage] = useState<string | null>(null);

  if (!reportStatus && !verdictCode) return null;

  // Trích xuất link ảnh từ ghi chú của Admin
  const extractImages = (text?: string): string[] => {
    if (!text) return [];
    const urlRegex = /(https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|gif))/gi;
    const matches = text.match(urlRegex) || [];
    return Array.from(new Set(matches));
  };

  // Làm sạch văn bản ghi chú (bỏ link ảnh thô để text đẹp mắt)
  const cleanNoteText = (text?: string): string => {
    if (!text) return '';
    return text
      .replace(/\(Ảnh:\s*https?:\/\/[^\s\)]+\)/gi, '')
      .replace(/\(Image:\s*https?:\/\/[^\s\)]+\)/gi, '')
      .replace(/https?:\/\/[^\s\)]+\.(?:jpg|jpeg|png|webp|gif)/gi, '')
      .trim();
  };

  const images = extractImages(adminNote);
  const cleanText = cleanNoteText(adminNote);

  return (
    <>
      {verdictCode === 'GUILTY' && (
        <div className="bg-rose-50/80 border border-rose-200 rounded-2xl p-4 space-y-3 text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-rose-700 font-extrabold uppercase tracking-wider text-xs">
              <ShieldAlert className="h-4 w-4 text-rose-600" />
              <span>REVIEW VERDICT: FRAUD CONFIRMED (GUILTY)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-rose-100 text-rose-700 border border-rose-300">
              RESOLVED
            </span>
          </div>

          <p className="text-rose-950 text-xs leading-relaxed font-semibold">
            Referees &amp; Admin have confirmed cheating/fraud violation. Match result and ELO ratings have been officially adjusted according to fair play regulations.
          </p>

          {adminNote && (
            <div className="pt-2 border-t border-rose-200/80 space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-rose-600 shrink-0 mt-0.5" />
                <div className="text-rose-900 font-medium leading-relaxed">
                  <strong className="text-rose-800">Referee Note:</strong> &quot;{cleanText || adminNote}&quot;
                </div>
              </div>

              {/* BẰNG CHỨNG HÌNH ẢNH TRỰC QUAN (CLICK ĐỂ PHÓNG TO) */}
              {images.length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-rose-800 flex items-center gap-1.5 font-mono">
                    📸 Attached Evidence Snapshots ({images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(imgUrl)}
                        className="group relative h-20 bg-black rounded-lg overflow-hidden border border-rose-200 shadow-2xs cursor-pointer hover:border-rose-400 transition"
                        title="Click to zoom evidence image"
                      >
                        <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                          <Eye className="h-3.5 w-3.5" /> View
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {verdictCode === 'INNOCENT' && (
        <div className="bg-emerald-50/80 border border-emerald-200 rounded-2xl p-4 space-y-3 text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-emerald-700 font-extrabold uppercase tracking-wider text-xs">
              <ShieldCheck className="h-4 w-4 text-emerald-600" />
              <span>REVIEW VERDICT: NO VIOLATION (INNOCENT)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-emerald-100 text-emerald-700 border border-emerald-300">
              RESOLVED
            </span>
          </div>

          <p className="text-emerald-950 text-xs leading-relaxed font-semibold">
            Referees inspected video replay &amp; AI logs: Match is verified clean with no fraudulent activity detected. Official match result stands.
          </p>

          {adminNote && (
            <div className="pt-2 border-t border-emerald-200/80 space-y-2">
              <div className="flex items-start gap-2 text-xs">
                <FileText className="h-3.5 w-3.5 text-emerald-600 shrink-0 mt-0.5" />
                <div className="text-emerald-900 font-medium leading-relaxed">
                  <strong className="text-emerald-800">Referee Note:</strong> &quot;{cleanText || adminNote}&quot;
                </div>
              </div>

              {images.length > 0 && (
                <div className="pt-1.5 space-y-1.5">
                  <span className="text-[11px] font-extrabold uppercase tracking-wider text-emerald-800 flex items-center gap-1.5 font-mono">
                    📸 Attached Evidence Snapshots ({images.length})
                  </span>
                  <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-2">
                    {images.map((imgUrl, idx) => (
                      <div
                        key={idx}
                        onClick={() => setPreviewImage(imgUrl)}
                        className="group relative h-20 bg-black rounded-lg overflow-hidden border border-emerald-200 shadow-2xs cursor-pointer hover:border-emerald-400 transition"
                        title="Click to zoom evidence image"
                      >
                        <img src={imgUrl} alt="Evidence" className="w-full h-full object-cover group-hover:scale-105 transition" />
                        <div className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 transition flex items-center justify-center text-white text-[11px] font-bold gap-1">
                          <Eye className="h-3.5 w-3.5" /> View
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {verdictCode === 'INCONCLUSIVE' && (
        <div className="bg-amber-50/80 border border-amber-200 rounded-2xl p-4 space-y-3 text-xs animate-fade-in shadow-2xs">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2 text-amber-800 font-extrabold uppercase tracking-wider text-xs">
              <AlertCircle className="h-4 w-4 text-amber-600" />
              <span>REVIEW VERDICT: INCONCLUSIVE (DRAW)</span>
            </div>
            <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300">
              RESOLVED
            </span>
          </div>

          <p className="text-amber-950 text-xs leading-relaxed font-semibold">
            Referee review completed: Evidence is insufficient to verify fraud. Official decision is ruled as <strong>DRAW</strong>.
          </p>

          {adminNote && (
            <div className="pt-2 border-t border-amber-200/80 flex items-start gap-2 text-xs">
              <FileText className="h-3.5 w-3.5 text-amber-600 shrink-0 mt-0.5" />
              <div className="text-amber-900 font-medium leading-relaxed">
                <strong className="text-amber-800">Referee Note:</strong> &quot;{cleanText || adminNote}&quot;
              </div>
            </div>
          )}
        </div>
      )}

      {reportStatus === 'PENDING' && !verdictCode && (
        <div className="bg-amber-50 border border-amber-200 rounded-2xl p-3.5 flex items-center justify-between gap-3 text-xs animate-pulse">
          <div className="flex items-center gap-2.5 text-amber-900 min-w-0">
            <Clock className="h-4 w-4 text-amber-600 shrink-0" />
            <div className="min-w-0">
              <span className="font-bold uppercase tracking-wider text-xs text-amber-800 block">
                DISPUTE REPORT UNDER REVIEW
              </span>
              <p className="text-[11px] text-amber-900/80 truncate mt-0.5">
                Referees &amp; Admin are reviewing dual-camera replay. Verdict will update here shortly.
              </p>
            </div>
          </div>
          <span className="px-2.5 py-1 rounded-full text-[10px] font-black uppercase tracking-wider bg-amber-100 text-amber-800 border border-amber-300 shrink-0">
            PENDING
          </span>
        </div>
      )}

      {/* MODAL POPUP PHÓNG TO ẢNH CHO NGƯỜI XEM (CLICK-TO-VIEW ĐẦY ĐỦ) */}
      {previewImage && typeof document !== 'undefined' && createPortal(
        <div
          className="fixed inset-0 z-[99999] bg-slate-900/85 backdrop-blur-xs flex items-center justify-center p-4 animate-in fade-in"
          onClick={() => setPreviewImage(null)}
        >
          <div
            className="relative max-w-2xl w-full bg-white border border-slate-200 rounded-2xl p-5 shadow-2xl space-y-3"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex justify-between items-center border-b border-slate-100 pb-2.5">
              <h4 className="text-xs font-extrabold uppercase tracking-wider text-slate-900 font-mono flex items-center gap-1.5">
                <ShieldAlert className="h-4 w-4 text-rose-600" />
                <span>Referee AI Evidence Snapshot</span>
              </h4>
              <div className="flex items-center gap-3">
                <a
                  href={previewImage}
                  target="_blank"
                  rel="noreferrer"
                  className="text-xs text-indigo-600 hover:underline font-bold flex items-center gap-1"
                >
                  <ExternalLink className="h-3.5 w-3.5" /> Open Full Image
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
                alt="Referee Evidence"
                className="w-full max-h-[70vh] object-contain mx-auto rounded-lg"
              />
            </div>
          </div>
        </div>,
        document.body
      )}
    </>
  );
}
