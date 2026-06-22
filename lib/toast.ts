import { toast as sonnerToast } from 'sonner';

// ============================================================
// CubeNexus Global Toast Notification Helper
// ============================================================
// Reusable system-wide notification utility built on top of sonner.
// Styled to look small, premium, and clean.

export const toast = {
  success: (message: string, description?: string) => {
    sonnerToast.success(message, {
      description,
      duration: 4000,
    });
  },
  error: (message: string, description?: string) => {
    sonnerToast.error(message, {
      description,
      duration: 5000,
    });
  },
  info: (message: string, description?: string) => {
    sonnerToast.info(message, {
      description,
      duration: 4000,
    });
  },
  warning: (message: string, description?: string) => {
    sonnerToast.warning(message, {
      description,
      duration: 4000,
    });
  },
};
