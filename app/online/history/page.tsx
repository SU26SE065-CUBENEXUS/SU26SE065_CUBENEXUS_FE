'use client';

import React from 'react';
import { Header } from '@/components/header';
import { OnlineMatchHistory } from '@/features/online-arena/components/OnlineMatchHistory';

export default function OnlineMatchHistoryPage() {
  return (
    <div className="min-h-screen bg-background text-foreground selection:bg-orange-500 selection:text-white">
      <Header />
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 pt-24">
        <OnlineMatchHistory />
      </main>
    </div>
  );
}
