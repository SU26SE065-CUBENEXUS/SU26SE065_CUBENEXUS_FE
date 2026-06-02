'use client';

import { Card } from '@/components/ui/card';

export function StatsSection() {
  const stats = [
    {
      value: '52,840+',
      label: 'Active Cubers',
    },
    {
      value: '1,248',
      label: 'Tournaments Hosted',
    },
    {
      value: '98',
      label: 'Countries Represented',
    },
    {
      value: '< 200ms',
      label: 'Timer Sync Latency',
    },
  ];

  return (
    <section className="mx-auto max-w-7xl px-4 py-16 sm:px-6 lg:px-8">
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat, index) => (
          <Card key={index} className="border-border bg-card p-8 text-center">
            <p className="mb-2 text-4xl font-bold text-primary">{stat.value}</p>
            <p className="text-sm font-medium text-muted-foreground">{stat.label}</p>
          </Card>
        ))}
      </div>
    </section>
  );
}
