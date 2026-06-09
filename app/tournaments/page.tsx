'use client';

import { useEffect, useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Header } from '@/components/header';
import { Footer } from '@/components/footer';
import { LoaderCircle as LoaderCircleIcon } from 'lucide-react';

// Restructured components
import { TournamentHero } from './_components/TournamentHero';
import { TournamentFlowCards } from './_components/TournamentFlowCards';
import { TournamentList } from './_components/TournamentList';
import { TournamentDialogs } from './_components/TournamentDialogs';

type FlowAction = 'create' | 'register' | 'checkin' | 'dashboard' | null;

function TournamentsPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const routeAction = searchParams.get('action') as FlowAction | null;

  const [activeAction, setActiveAction] = useState<FlowAction>(null);

  useEffect(() => {
    if (
      routeAction === 'create' ||
      routeAction === 'register' ||
      routeAction === 'checkin' ||
      routeAction === 'dashboard'
    ) {
      setActiveAction(routeAction);
      return;
    }

    if (!routeAction) {
      setActiveAction(null);
    }
  }, [routeAction]);

  const handleOpenFlow = (action: Exclude<FlowAction, null>) => {
    setActiveAction(action);
    router.push(`/tournaments?action=${action}`);
  };

  const handleCloseFlow = () => {
    setActiveAction(null);
    router.replace('/tournaments');
  };

  return (
    <main className="min-h-screen bg-background flex flex-col justify-between">
      <div>
        <Header />
        <div className="mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
          <TournamentHero />
          <TournamentFlowCards onOpenFlow={handleOpenFlow} />
          <TournamentList onOpenFlow={handleOpenFlow} />
        </div>
      </div>

      <Footer />

      <TournamentDialogs activeAction={activeAction} onClose={handleCloseFlow} />
    </main>
  );
}

export default function TournamentsPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-background flex items-center justify-center">
          <LoaderCircleIcon className="h-8 w-8 animate-spin text-accent" />
        </div>
      }
    >
      <TournamentsPageContent />
    </Suspense>
  );
}
