'use client';

import { useEffect, useState, Suspense } from 'react';
import AuthVisualPanel from '@/components/auth-visual/AuthVisualPanel';
import ResetPasswordForm from './components/ResetPasswordForm';

// ─── Reset Password Page ─────────────────────────────────────────
// Main page controller for password reset. Organizes the split-screen
// view on desktop with the modular visual Rubik's Cube panel on the
// left and the ResetPasswordForm card component on the right.
// Uses Suspense to wrap components using useSearchParams.

export default function ResetPasswordPage() {
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

        {/* Right: Reset Form within Suspense boundary */}
        <Suspense
          fallback={
            <div
              style={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'var(--background)',
              }}
            >
              <div style={{ color: '#ff9e00', fontWeight: 600 }}>Loading form...</div>
            </div>
          }
        >
          <ResetPasswordForm />
        </Suspense>
      </main>
    </>
  );
}
