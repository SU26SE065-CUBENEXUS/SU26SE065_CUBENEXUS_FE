'use client';

import { useEffect, useState } from 'react';
import AuthVisualPanel from '@/components/auth-visual/AuthVisualPanel';
import ForgotPasswordForm from './components/ForgotPasswordForm';

// ─── Forgot Password Page ─────────────────────────────────────────
// Main page controller for password recovery. Organizes the split-screen
// view on desktop with the modular visual Rubik's Cube panel on the
// left and the ForgotPasswordForm card component on the right.

export default function ForgotPasswordPage() {
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  return (
    <>
      {/* Responsive layout overrides matching login/page.tsx */}
      <style>{`
        @media (min-width: 1024px) {
          #login-visual-panel {
            display: flex !important;
          }
        }
      `}</style>

      <main
        style={{
          display: 'flex',
          minHeight: '100vh',
          opacity: mounted ? 1 : 0,
          transition: 'opacity 0.5s ease-out',
        }}
      >
        {/* Left: Reused Visual Panel */}
        <AuthVisualPanel />

        {/* Right: Recovery Form */}
        <ForgotPasswordForm />
      </main>
    </>
  );
}
