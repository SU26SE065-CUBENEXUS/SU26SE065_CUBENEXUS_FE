'use client';

import Link from 'next/link';
import { Card } from '@/components/ui/card';
import { BarChart3, Zap, Trophy, Globe } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function FeaturesSection() {
  const features = [
    {
      icon: BarChart3,
      title: 'LIVE LEADERBOARD',
      description: "See who's on top right now and track your progress.",
      cta: 'VIEW LEADERBOARD',
      tone: 'from-[#f44336]/15 to-[#ff9800]/15',
      iconColor: 'text-[#f44336]',
      href: '/live',
    },
    {
      icon: Zap,
      title: 'ONLINE ARENA',
      description: 'Challenge real players in exciting 1v1 matches.',
      cta: 'FIND AN OPPONENT',
      tone: 'from-[#ffeb3b]/20 to-[#ff9800]/15',
      iconColor: 'text-[#ff9800]',
      href: '/online',
    },
    {
      icon: Trophy,
      title: 'PRACTICE TIMER',
      description: 'Train, improve, and beat your best time.',
      cta: 'START PRACTICE',
      tone: 'from-[#4caf50]/15 to-[#2196f3]/15',
      iconColor: 'text-[#4caf50]',
      href: '/practice',
    },
    {
      icon: Globe,
      title: 'GLOBAL RANKING',
      description: 'Compete worldwide and climb the ranks.',
      cta: 'SEE RANKING',
      tone: 'from-[#2196f3]/15 to-[#f44336]/15',
      iconColor: 'text-[#2196f3]',
      href: '/rankings',
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
            <Card key={index} className="border-border bg-card p-6 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-xl">
              <div className={`mb-4 inline-block rounded-xl bg-gradient-to-br ${feature.tone} p-3`}>
                <IconComponent className={`h-6 w-6 ${feature.iconColor}`} />
              </div>
              <h3 className="mb-2 font-bold text-foreground">{feature.title}</h3>
              <p className="mb-6 text-sm text-muted-foreground leading-relaxed">
                {feature.description}
              </p>
              <Button 
                asChild
                variant="ghost" 
                className="h-auto p-0 font-semibold text-sm hover:bg-transparent cursor-pointer"
                style={{ color: index === 0 ? '#f44336' : index === 1 ? '#ff9800' : index === 2 ? '#4caf50' : '#2196f3' }}
              >
                <Link href={feature.href}>
                  {feature.cta} →
                </Link>
              </Button>
            </Card>
          );
        })}
      </div>
    </section>
  );
}
