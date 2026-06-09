'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Users, FileText, TrendingUp, Check, Plus } from 'lucide-react';

interface Group {
  name: string;
  members: number;
  icon: string;
  posts: number;
  trending: boolean;
  description: string;
}

export function CommunitiesGrid() {
  const [joinedStates, setJoinedStates] = useState<{ [key: string]: boolean }>({});

  const groups: Group[] = [
    {
      name: 'CFOP Method Masters',
      members: 45200,
      icon: '🏆',
      posts: 12400,
      trending: true,
      description: 'The largest community dedicated to perfecting Cross, F2L, OLL, and PLL algorithms and finger tricks.',
    },
    {
      name: 'Blind Solving Enthusiasts',
      members: 8900,
      icon: '👁️',
      posts: 3200,
      trending: false,
      description: 'Dedicated to 3x3 BLD, 4x4 BLD, 5x5 BLD, and Multi-Blind memo techniques (M2/OP, 3-Style).',
    },
    {
      name: 'Speedcube Hardware Mod',
      members: 32100,
      icon: '🔧',
      posts: 8900,
      trending: true,
      description: 'Discuss tensioning, core lubrication, magnet upgrades, custom stickers, and newly released cubes.',
    },
    {
      name: 'Youth Cubers (U18)',
      members: 12400,
      icon: '🎓',
      posts: 5600,
      trending: false,
      description: 'A friendly and safe space for speedcubers under 18 to share progress, chat, and learn together.',
    },
    {
      name: 'Tournament Preparation',
      members: 28900,
      icon: '🎯',
      posts: 7800,
      trending: true,
      description: 'WCA rules review, table judge training, medley scoring guidance, and mental focus tips before tournaments.',
    },
    {
      name: 'Roux & ZZ Solvers',
      members: 19800,
      icon: '⚡',
      posts: 6200,
      trending: false,
      description: 'Focusing on block building, EOLine, COLL, and LSE techniques for alternative solving methods.',
    },
  ];

  const handleToggleJoin = (name: string) => {
    setJoinedStates({
      ...joinedStates,
      [name]: !joinedStates[name],
    });
  };

  return (
    <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
      {groups.map((group) => {
        const isJoined = joinedStates[group.name];
        return (
          <Card
            key={group.name}
            className="group border border-border p-6 hover:border-accent/40 shadow-sm hover:shadow-md transition-all duration-300 rounded-2xl flex flex-col justify-between"
          >
            <div>
              {/* Header Info */}
              <div className="mb-4 flex items-start justify-between gap-4">
                <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent/10 border border-accent/10 text-3xl shadow-inner shrink-0 group-hover:scale-105 transition-transform duration-300">
                  {group.icon}
                </div>
                {group.trending && (
                  <Badge className="bg-accent/15 text-accent border border-accent/20 hover:bg-accent/25 flex items-center gap-1 text-[10px] py-0.5 px-2.5 font-bold animate-pulse">
                    <TrendingUp className="h-3 w-3" />
                    Trending
                  </Badge>
                )}
              </div>

              {/* Title & Description */}
              <h3 className="mb-2 text-lg font-bold text-foreground group-hover:text-accent transition-colors leading-snug">
                {group.name}
              </h3>
              <p className="mb-4 text-xs leading-relaxed text-muted-foreground font-medium">
                {group.description}
              </p>

              {/* Statistics */}
              <div className="mb-6 space-y-1.5 border-t border-border/80 pt-4 text-xs font-semibold text-muted-foreground/80">
                <div className="flex items-center gap-2">
                  <Users className="h-4.5 w-4.5 text-accent/75" />
                  <span>{group.members.toLocaleString()} registered members</span>
                </div>
                <div className="flex items-center gap-2">
                  <FileText className="h-4.5 w-4.5 text-accent/75" />
                  <span>{group.posts.toLocaleString()} active posts</span>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                onClick={() => handleToggleJoin(group.name)}
                className={`flex-grow font-bold rounded-xl transition-all duration-300 flex items-center justify-center gap-1.5 ${
                  isJoined
                    ? 'bg-muted border border-border text-muted-foreground hover:bg-muted/90'
                    : 'bg-accent text-accent-foreground hover:bg-accent/90 border border-accent/20'
                }`}
              >
                {isJoined ? (
                  <>
                    <Check className="h-4 w-4" />
                    Joined Group
                  </>
                ) : (
                  <>
                    <Plus className="h-4 w-4" />
                    Join Group
                  </>
                )}
              </Button>
              <Button variant="outline" className="border-border rounded-xl px-4 hover:bg-muted/40 font-semibold">
                Explore
              </Button>
            </div>
          </Card>
        );
      })}
    </div>
  );
}
