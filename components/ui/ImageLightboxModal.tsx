'use client';

import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function ImageLightboxModal({ isOpen, imageUrl, title = 'Image Preview', onClose }: ImageLightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = '';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-slate-950/95 backdrop-blur-md animate-in fade-in duration-200">
      {/* Top action bar */}
      <div className="flex h-14 items-center justify-between px-4 sm:px-6 bg-slate-900/60 border-b border-white/10 shrink-0">
        <div className="flex items-center gap-2 min-w-0">
          <span className="text-xs font-bold text-white tracking-wide truncate max-w-xs sm:max-w-md">{title}</span>
          <p className="text-[10px] text-white/60 hidden sm:inline">Click image or use controls to zoom</p>
        </div>
        <div className="flex items-center gap-2">
          {/* Zoom toggle button */}
          <button
            type="button"
            onClick={() => setIsZoomed(!isZoomed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white text-xs font-semibold transition border border-white/15 cursor-pointer"
            title={isZoomed ? "Actual size" : "Zoom in 100%"}
          >
            {isZoomed ? <ZoomOut className="h-4 w-4" /> : <ZoomIn className="h-4 w-4" />}
            <span className="hidden sm:inline">{isZoomed ? 'Zoom Out' : 'Zoom In'}</span>
          </button>

          {/* Download button */}
          <a
            href={imageUrl}
            download={`evidence-${Date.now()}.png`}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold transition border border-indigo-400/30 cursor-pointer"
            title="Download image"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Download</span>
          </a>

          {/* Close button */}
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white/80 hover:text-white transition cursor-pointer"
            title="Close (ESC)"
          >
            <X className="h-5 w-5" />
          </button>
        </div>
      </div>

      {/* Main Image Container */}
      <div
        className="w-full h-full flex items-center justify-center p-8 sm:p-12 overflow-auto"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={imageUrl}
          alt={title}
          onClick={() => setIsZoomed(!isZoomed)}
          className={`cursor-zoom-in transition-all duration-300 rounded-2xl border border-white/20 shadow-2xl ${
            isZoomed
              ? 'max-w-none max-h-none w-auto h-auto cursor-zoom-out'
              : 'max-w-full max-h-[82vh] object-contain'
          }`}
        />
      </div>
    </div>
  );
}
