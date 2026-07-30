'use client';

import { useState, useEffect } from 'react';
import { X, ZoomIn, ZoomOut, Download, Maximize2, Minimize2 } from 'lucide-react';

interface ImageLightboxModalProps {
  isOpen: boolean;
  imageUrl: string | null;
  title?: string;
  onClose: () => void;
}

export function ImageLightboxModal({ isOpen, imageUrl, title = 'Xem Ảnh Chi Tiết', onClose }: ImageLightboxModalProps) {
  const [isZoomed, setIsZoomed] = useState(false);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  if (!isOpen || !imageUrl) return null;

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `preview_${Date.now()}.png`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 bg-black/90 backdrop-blur-xl animate-fade-in">
      {/* Top Header Bar */}
      <div className="absolute top-0 left-0 right-0 p-4 sm:p-6 flex items-center justify-between z-10 bg-gradient-to-b from-black/80 to-transparent">
        <div className="flex items-center gap-2 text-white">
          <span className="text-xl">🖼️</span>
          <div>
            <h3 className="text-sm font-extrabold tracking-wide uppercase">{title}</h3>
            <p className="text-[10px] text-white/60">Nhấp vào ảnh hoặc dùng các phím điều khiển để thu phóng</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsZoomed(!isZoomed)}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-white/10 hover:bg-white/20 text-white text-xs font-bold transition border border-white/15"
            title={isZoomed ? "Kích thước chuẩn" : "Phóng to 100%"}
          >
            {isZoomed ? <Minimize2 className="h-4 w-4" /> : <Maximize2 className="h-4 w-4" />}
            <span className="hidden sm:inline">{isZoomed ? 'Thu Nhỏ' : 'Phóng To'}</span>
          </button>

          <button
            onClick={handleDownload}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-primary hover:bg-primary/90 text-primary-foreground text-xs font-bold transition border-none shadow-lg shadow-primary/20"
            title="Tải ảnh về máy"
          >
            <Download className="h-4 w-4" />
            <span className="hidden sm:inline">Tải Về</span>
          </button>

          <button
            onClick={onClose}
            className="p-2 rounded-xl bg-white/10 hover:bg-white/20 text-white transition border border-white/15 ml-2"
            title="Đóng (ESC)"
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
