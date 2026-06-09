'use client';

import { useState } from 'react';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';

// Restructured subcomponents
import { RankingsHeader } from './_components/RankingsHeader';
import { SpectatorFeed } from './_components/SpectatorFeed';
import { UserRankCard } from './_components/UserRankCard';
import { CategoryTabs } from './_components/CategoryTabs';
import { RankingsTable } from './_components/RankingsTable';

export default function RankingsPage() {
  const [selectedCategory, setSelectedCategory] = useState('global');

  return (
    <main className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <RankingsHeader />
          <SpectatorFeed />
          <CategoryTabs
            selectedCategory={selectedCategory}
            onSelectCategory={setSelectedCategory}
          />
          <UserRankCard />
          <RankingsTable />
        </div>
      </div>
      <Footer />
    </main>
  );
}
