'use client';

import { useEffect } from 'react';
import { AlertTriangle, AlertCircle, CheckCircle, Info, Loader2 } from 'lucide-react';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void | Promise<void>;
  onCancel: () => void;
  variant?: 'danger' | 'warning' | 'info' | 'success';
  isLoading?: boolean;
}

export function ConfirmationModal({
  isOpen,
  title,
  description,
  confirmText = 'Xác nhận',
  cancelText = 'Hủy',
  onConfirm,
  onCancel,
  variant = 'warning',
  isLoading = false,
}: ConfirmationModalProps) {
  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const getIcon = () => {
    switch (variant) {
      case 'danger':
        return <AlertCircle className="h-6 w-6 text-red-600 dark:text-red-400" />;
      case 'success':
        return <CheckCircle className="h-6 w-6 text-emerald-600 dark:text-emerald-400" />;
      case 'info':
        return <Info className="h-6 w-6 text-blue-600 dark:text-blue-400" />;
      case 'warning':
      default:
        return <AlertTriangle className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />;
    }
  };

  const getThemeClasses = () => {
    switch (variant) {
      case 'danger':
        return {
          iconBg: 'bg-red-500/10 border border-red-500/20',
          confirmBtn: 'bg-red-600 hover:bg-red-500 text-white focus:ring-red-500 shadow-lg shadow-red-500/10',
        };
      case 'success':
        return {
          iconBg: 'bg-emerald-500/10 border border-emerald-500/20',
          confirmBtn: 'bg-emerald-600 hover:bg-emerald-500 text-white focus:ring-emerald-500 shadow-lg shadow-emerald-500/10',
        };
      case 'info':
        return {
          iconBg: 'bg-blue-500/10 border border-blue-500/20',
          confirmBtn: 'bg-blue-600 hover:bg-blue-500 text-white focus:ring-blue-500 shadow-lg shadow-blue-500/10',
        };
      case 'warning':
      default:
        return {
          iconBg: 'bg-yellow-500/10 border border-yellow-500/20',
          confirmBtn: 'bg-yellow-600 hover:bg-yellow-500 text-white focus:ring-yellow-500 shadow-lg shadow-yellow-500/10',
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-background/80 backdrop-blur-sm transition-opacity duration-300"
        onClick={isLoading ? undefined : onCancel}
      />

      {/* Modal Container */}
      <div className="relative w-full max-w-md transform overflow-hidden rounded-2xl border border-border bg-card p-6 shadow-2xl transition-all duration-300 scale-100 animate-in fade-in-50 zoom-in-95">
        <div className="flex items-start gap-4">
          {/* Icon Badge */}
          <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconBg}`}>
            {getIcon()}
          </div>

          {/* Text Content */}
          <div className="space-y-1">
            <h3 className="text-base font-black text-foreground tracking-tight leading-snug">
              {title}
            </h3>
            <p className="text-xs text-muted-foreground leading-relaxed">
              {description}
            </p>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="mt-6 flex items-center justify-end gap-2.5">
          <button
            type="button"
            disabled={isLoading}
            onClick={onCancel}
            className="rounded-xl border border-border bg-card px-4 py-2.5 text-xs font-bold text-muted-foreground shadow-sm transition hover:bg-muted/50 hover:text-foreground disabled:opacity-50"
          >
            {cancelText}
          </button>
          <button
            type="button"
            disabled={isLoading}
            onClick={onConfirm}
            className={`inline-flex items-center gap-1.5 rounded-xl px-4 py-2.5 text-xs font-bold transition disabled:opacity-50 ${theme.confirmBtn}`}
          >
            {isLoading && <Loader2 className="h-3.5 w-3.5 animate-spin" />}
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
