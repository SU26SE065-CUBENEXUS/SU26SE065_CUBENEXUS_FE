'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/auth-context';
import { Header } from '@/components/header';
import { HeroSection } from '@/components/hero-section';
import { LiveSection } from '@/components/live-section';
import { FlowsSection } from '@/components/flows-section';
import { FeaturesSection } from '@/components/features-section';
import { StatsSection } from '@/components/stats-section';
import { CTASection } from '@/components/cta-section';
import { Footer } from '@/components/footer';
import { Loader2 } from 'lucide-react';

export default function Home() {
  const { isAuthenticated, isLoading, user } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && isAuthenticated && user) {
      if (user.role?.toUpperCase() === 'MANAGER' || user.role?.toUpperCase() === 'ADMIN') {
        router.replace('/managertournaments');
      }
    }
  }, [isLoading, isAuthenticated, user, router]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-accent" />
      </div>
    );
  }

  // Redirect manager/admin to manager portal
  if (isAuthenticated && (user?.role?.toUpperCase() === 'MANAGER' || user?.role?.toUpperCase() === 'ADMIN')) {
    return null;
  }

  return (
    <main className="min-h-screen bg-background animate-fade-in">
      <Header />
      <HeroSection />
      <LiveSection />
      <FlowsSection />
      <FeaturesSection />
      <StatsSection />
      <CTASection />
      <Footer />
    </main>
  );
}
