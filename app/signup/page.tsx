'use client';

import { useEffect, useState } from 'react';
import AuthVisualPanel from '@/components/auth-visual/AuthVisualPanel';
import SignupForm from './components/SignupForm';

// ─── Signup Page ─────────────────────────────────────────────────
// Main page controller for registration. Organizes the split-screen
// view on desktop with the modular visual Rubik's Cube panel on the
// left and the SignupForm card component on the right.

export default function SignupPage() {
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
        @media (max-width: 1023px) {
          #signup-mobile-logo {
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

        {/* Right: Registration Form */}
        <SignupForm />
      </main>
    </>
  );
}
