'use client';

import { useState, useEffect } from 'react';

// ─── Stat Counter ───────────────────────────────────────────────
// Animated stat counter that fades in with a staggered delay.
// Used on the visual panel to showcase platform stats.

interface StatCounterProps {
  icon: any;
  value: string;
  label: string;
  delay: number;
}

export default function StatCounter({ icon: Icon, value, label, delay }: StatCounterProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setVisible(true), delay);
    return () => clearTimeout(timer);
  }, [delay]);

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 14,
        padding: '12px 18px',
        borderRadius: 14,
        background: 'rgba(255, 255, 255, 0.85)',
        border: '1px solid rgba(15, 23, 42, 0.06)',
        boxShadow: '0 4px 20px -2px rgba(15, 23, 42, 0.03)',
        backdropFilter: 'blur(10px)',
        opacity: visible ? 1 : 0,
        transform: visible ? 'translateY(0)' : 'translateY(15px)',
        transition: 'all 0.6s cubic-bezier(0.16, 1, 0.3, 1)',
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          width: 42,
          height: 42,
          borderRadius: 12,
          background: 'linear-gradient(135deg, rgba(252, 191, 73, 0.18), rgba(247, 127, 0, 0.12))',
          color: '#e07a00',
          flexShrink: 0,
        }}
      >
        <Icon size={20} strokeWidth={2.2} />
      </div>
      <div>
        <div style={{ fontSize: 18, fontWeight: 700, color: '#0f172a', letterSpacing: '-0.02em', lineHeight: 1.2 }}>
          {value}
        </div>
        <div style={{ fontSize: 12, color: '#475569', fontWeight: 500, letterSpacing: '0.01em', marginTop: 2 }}>
          {label}
        </div>
      </div>
    </div>
  );
}

