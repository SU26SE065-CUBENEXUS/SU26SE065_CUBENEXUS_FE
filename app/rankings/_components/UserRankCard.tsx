'use client';

import { Card } from '@/components/ui/card';
import { Award, Zap } from 'lucide-react';

export function UserRankCard() {
  const userRating = 2645;
  const nextRankRating = 2700;
  const prevRankRating = 2500;
  
  const ratingRange = nextRankRating - prevRankRating;
  const userProgress = userRating - prevRankRating;
  const progressPercent = Math.round((userProgress / ratingRange) * 100);

  return (
    <Card className="mb-8 border border-accent/25 bg-accent/5 p-6 shadow-sm rounded-2xl relative overflow-hidden">
      <div className="absolute -right-10 -bottom-10 h-32 w-32 rounded-full bg-accent/10 blur-2xl" />

      <div className="relative z-10 flex flex-col gap-6 md:flex-row md:items-center md:justify-between">
        <div className="flex items-center gap-4">
          <div className="rounded-2xl bg-accent text-accent-foreground p-3.5 border border-accent/25 shadow-md flex items-center justify-center">
            <Award className="h-7 w-7" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-muted-foreground uppercase tracking-widest">Your Current Ladder Rank</h3>
            <p className="mt-1 text-3xl font-extrabold tracking-tight text-foreground sm:text-4xl">#1,284</p>
            <p className="mt-1.5 text-sm font-medium text-muted-foreground">
              Rating: <span className="text-accent font-bold">{userRating} Elo</span> • Master Division II
            </p>
          </div>
        </div>

        <div className="flex flex-col gap-2 w-full md:max-w-xs text-left md:text-right">
          <div className="flex justify-between md:justify-end gap-2 text-xs font-semibold text-muted-foreground">
            <span>Progress to Division III</span>
            <span>{progressPercent}%</span>
          </div>
          
          <div className="h-3 w-full md:w-64 rounded-full bg-muted overflow-hidden border border-border/30 shadow-inner">
            <div
              className="h-full rounded-full bg-gradient-to-r from-accent to-accent/80 transition-all duration-500"
              style={{ width: `${progressPercent}%` }}
            />
          </div>
          <p className="text-[11px] font-medium text-muted-foreground">
            <span className="text-foreground font-semibold">{userRating}</span> / {nextRankRating} Elo points ({nextRankRating - userRating} Elo to Rank Up)
          </p>
        </div>
      </div>
    </Card>
  );
}
