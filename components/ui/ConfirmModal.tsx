'use client';

import React from 'react';
import { AlertTriangle, Lock, Loader2, X } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: 'danger' | 'warning' | 'primary';
  isLoading?: boolean;
  onConfirm: () => void | Promise<void>;
  onClose: () => void;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = 'Xác Nhận',
  cancelText = 'Hủy Bỏ',
  variant = 'warning',
  isLoading = false,
  onConfirm,
  onClose,
}: ConfirmModalProps) {
  if (!isOpen) return null;

  const getVariantStyles = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/10 text-red-500 border-red-500/20',
          btnBg: 'bg-red-600 hover:bg-red-500 text-white',
        };
      case 'warning':
        return {
          iconBg: 'bg-amber-500/10 text-amber-500 border-amber-500/20',
          btnBg: 'bg-amber-500 hover:bg-amber-400 text-black font-bold',
        };
      default:
        return {
          iconBg: 'bg-primary/10 text-primary border-primary/20',
          btnBg: 'bg-primary hover:bg-primary/90 text-primary-foreground font-bold',
        };
    }
  };

  const vStyles = getVariantStyles();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className="w-full max-w-md rounded-2xl border border-border bg-card p-6 shadow-2xl space-y-5 animate-in zoom-in-95 duration-200"
        style={{ background: 'oklch(0.16 0.02 255)' }}
      >
        {/* Header */}
        <div className="flex items-start justify-between">
          <div className="flex items-center gap-3">
            <div className={`p-3 rounded-xl border ${vStyles.iconBg}`}>
              {variant === 'warning' ? (
                <Lock className="h-6 w-6" />
              ) : (
                <AlertTriangle className="h-6 w-6" />
              )}
            </div>
            <div>
              <h3 className="text-lg font-bold text-foreground leading-snug">{title}</h3>
              <p className="text-xs text-muted-foreground mt-0.5">Yêu cầu xác nhận hành động</p>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="rounded-lg p-1.5 text-muted-foreground hover:text-foreground hover:bg-muted/50 transition disabled:opacity-50"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Content */}
        <div className="rounded-xl border border-border/60 bg-muted/30 p-4">
          <p className="text-sm text-foreground/90 leading-relaxed">{description}</p>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            onClick={onClose}
            disabled={isLoading}
            className="px-4 py-2.5 rounded-xl border border-border text-sm font-semibold text-muted-foreground hover:bg-muted/50 hover:text-foreground transition disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={isLoading}
            className={`inline-flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm shadow-md transition disabled:opacity-50 ${vStyles.btnBg}`}
          >
            {isLoading && <Loader2 className="h-4 w-4 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
