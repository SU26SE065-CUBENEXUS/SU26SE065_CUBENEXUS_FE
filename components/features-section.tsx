'use client';

import { Card } from '@/components/ui/card';
import { BarChart3, Zap, Trophy, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeaturesSection() {
  const features = [
    {
      icon: BarChart3,
      title: 'LIVE LEADERBOARD',
      description: 'See who\'s on top right now and track your progress.',
      cta: 'VIEW LEADERBOARD',
    },
    {
      icon: Zap,
      title: 'ONLINE ARENA',
      description: 'Challenge real players in exciting 1v1 matches.',
      cta: 'FIND AN OPPONENT',
    },
    {
      icon: Trophy,
      title: 'PRACTICE TIMER',
      description: 'Train, improve, and beat your best time.',
      cta: 'START PRACTICE',
    },
    {
      icon: Globe,
      title: 'GLOBAL RANKING',
      description: 'Compete worldwide and climb the ranks.',
      cta: 'SEE RANKING',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-20 sm:px-6 lg:px-8">
      <div className="mb-12 text-center">
        <h2 className="text-3xl font-bold tracking-tight text-foreground sm:text-4xl">
          Everything You Need to Compete
        </h2>
        <p className="mt-3 text-lg text-muted-foreground">
          All the tools to dominate the speedcubing arena
        </p>
      </div>

      <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
        {features.map((feature, index) => {
          const IconComponent = feature.icon;
          return (
            <Card key={index} className="border-border bg-card p-6 hover:shadow-md transition-shadow">
              <div className="mb-4 inline-block rounded-lg bg-accent/10 p-3">
                <IconComponent className="h-6 w-6 text-accent" />
              </div>
              <h3 className="mb-2 font-bold text-foreground">{feature.title}</h3>
              <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              <Button 
                variant="ghost" 
                className="h-auto p-0 text-accent hover:text-accent/80 hover:bg-transparent font-semibold text-sm"
              >
                {feature.cta} →
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
