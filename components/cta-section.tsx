'use client';

import { Button } from '@/components/ui/button';
import { ArrowRight } from 'lucide-react';

export function CTASection() {
  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="rounded-2xl border border-accent/20 bg-gradient-to-br from-accent/5 to-accent/10 px-8 py-16 text-center sm:px-12 sm:py-20">
        <h2 className="text-4xl font-bold text-foreground mb-3">
          Every Solve Counts. Every Second Matters.
        </h2>
        <p className="mb-8 text-lg text-muted-foreground">
          BE THE NEXT CHAMPION!
        </p>
        <Button size="lg" className="bg-accent text-accent-foreground hover:bg-accent/90 font-semibold">
          JOIN CUBENEXUS
          <ArrowRight className="ml-2 h-4 w-4" />
        </Button>
      </div>
    </section>
  );
}
