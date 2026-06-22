'use client';

import dynamic from 'next/dynamic';
import FloatingCube from './FloatingCube';

// Dynamically import RubikCube3D with SSR disabled to prevent browser-only Canvas failures during Next.js SSR
const RubikCube3D = dynamic(() => import('./RubikCube3D'), { ssr: false });

// ─── Auth Visual Panel ─────────────────────────────────────────
// Shared visual panel used by login and signup screens.
// Features a clean minimal light grey background, a 3D rotating Rubik's cube,
// a soft glowing overlay behind the cube, and floating background decorative shapes.
// Hidden on screens smaller than lg (1024px).

/** Soft translucent floating cubes configuration for light background */
const FLOATING_CUBES = [
  { size: 40, x: 15, y: 18, delay: 0, duration: 8, color: 'rgba(252, 191, 73, 0.08)' },
  { size: 25, x: 70, y: 12, delay: 1.5, duration: 10, color: 'rgba(247, 127, 0, 0.06)' },
  { size: 55, x: 80, y: 65, delay: 0.8, duration: 12, color: 'rgba(0, 119, 182, 0.05)' },
  { size: 30, x: 25, y: 78, delay: 2.2, duration: 9, color: 'rgba(56, 176, 0, 0.05)' },
  { size: 20, x: 50, y: 35, delay: 3, duration: 7, color: 'rgba(219, 4, 41, 0.04)' },
  { size: 45, x: 10, y: 48, delay: 1, duration: 11, color: 'rgba(255, 107, 53, 0.05)' },
];

export default function AuthVisualPanel() {
  return (
    <div
      style={{
        display: 'none',
        width: '45%',
        flexShrink: 0,
        flexDirection: 'column',
        justifyContent: 'center',
        padding: '60px 48px',
        position: 'relative',
        overflow: 'hidden',
        background: 'var(--background)',
        borderRight: '1px solid rgba(15, 23, 42, 0.08)',
      }}
      // Use a custom id so we can toggle display via CSS media query
      id="login-visual-panel"
    >
      {/* Soft floating background cubes */}
      {FLOATING_CUBES.map((cube, i) => (
        <FloatingCube key={i} {...cube} />
      ))}

      {/* Main content */}
      <div style={{ position: 'relative', zIndex: 2, width: '100%', maxWidth: 460, margin: '0 auto' }}>
        {/* 3D Rubik Cube with radial gradient glow */}
        <div
          className="animate-slide-up"
          style={{
            height: 480,
            width: '100%',
            position: 'relative',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
          }}
        >
          {/* Soft yellow glow behind the cube */}
          <div
            style={{
              position: 'absolute',
              width: 380,
              height: 380,
              borderRadius: '50%',
              background: 'radial-gradient(circle, rgba(252, 191, 73, 0.22) 0%, rgba(252, 191, 73, 0.04) 55%, transparent 70%)',
              filter: 'blur(20px)',
              pointerEvents: 'none',
              zIndex: 1,
            }}
          />
          <div style={{ width: '100%', height: '100%', position: 'relative', zIndex: 2 }}>
            <RubikCube3D />
          </div>
        </div>
      </div>
    </div>
  );
}
