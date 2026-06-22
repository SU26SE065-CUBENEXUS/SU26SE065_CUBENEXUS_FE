'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';

import AuthVisualPanel from '@/components/auth-visual/AuthVisualPanel';
import LoginForm from './components/LoginForm';

// ─── Login Page ─────────────────────────────────────────────────
// Split-screen layout: Form panel (left) + Visual panel with 3D Rubik's Cube (right).
// Redirects to /tournaments if user is already authenticated.

export default function LoginPage() {
  const router = useRouter();
  const { isAuthenticated } = useAuth();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  // Redirect if already authenticated
  useEffect(() => {
    if (isAuthenticated) {
      router.push('/');
    }
  }, [isAuthenticated, router]);

  return (
    <>
      {/* Responsive rules for visual panel & mobile logo */}
      <style>{`
        @media (min-width: 1024px) {
          #login-visual-panel {
            display: flex !important;
          }
        }
        @media (max-width: 1023px) {
          #login-mobile-logo {
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
        <AuthVisualPanel />
        <LoginForm />
      </main>
    </>
  );
}

