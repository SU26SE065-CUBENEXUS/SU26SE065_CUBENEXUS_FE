'use client';

import { useState } from 'react';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { TrendingUp, Sparkles, Hash, Plus, Check } from 'lucide-react';

export function CommunitySidebar() {
  const [joinedStates, setJoinedStates] = useState<{ [key: string]: boolean }>({});

  const trendingTags = [
    { tag: '#SpeedCubeChallenge', posts: '42K solves' },
    { tag: '#CFOP_F2L_Tips', posts: '18K threads' },
    { tag: '#MedleyFormatOfficial', posts: '12K reports' },
    { tag: '#RouxCornersFirst', posts: '8.4K posts' },
  ];

  const suggestedCommunities = [
    { name: 'CFOP Method Masters', members: '45.2K members', icon: '🏆' },
    { name: 'Blind Solving Elite', members: '8.9K members', icon: '👁️' },
    { name: 'Speedcube Hardware Mod', members: '32.1K members', icon: '🔧' },
  ];

  const handleToggleJoin = (name: string) => {
    setJoinedStates({
      ...joinedStates,
      [name]: !joinedStates[name],
    });
  };

  return (
    <div className="space-y-6">
      {/* Trending Card */}
      <Card className="border border-border p-6 shadow-sm rounded-2xl relative overflow-hidden">
        <div className="absolute -right-8 -top-8 h-20 w-20 rounded-full bg-accent/5 blur-lg" />
        <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground text-base">
          <TrendingUp className="h-5 w-5 text-accent animate-pulse" />
          Trending Topics
        </h3>
        <div className="space-y-2">
          {trendingTags.map((item) => (
            <button
              key={item.tag}
              className="flex items-center justify-between w-full text-left hover:bg-muted/40 rounded-xl px-3.5 py-2.5 transition-all duration-300 border border-transparent hover:border-border/30 group"
            >
              <div className="flex items-center gap-2">
                <Hash className="h-4 w-4 text-muted-foreground group-hover:text-accent transition-colors" />
                <span className="text-sm font-semibold text-accent/90 group-hover:text-accent transition-colors">{item.tag}</span>
              </div>
              <span className="text-[10px] font-bold text-muted-foreground bg-muted border border-border px-1.5 py-0.5 rounded">
                {item.posts}
              </span>
            </button>
          ))}
        </div>
      </Card>

      {/* Suggested Communities */}
      <Card className="border border-border p-6 shadow-sm rounded-2xl relative overflow-hidden">
        <div className="absolute -right-8 -bottom-8 h-20 w-20 rounded-full bg-accent/5 blur-lg" />
        <h3 className="mb-4 flex items-center gap-2 font-bold text-foreground text-base">
          <Sparkles className="h-5 w-5 text-accent" />
          Suggested Groups
        </h3>
        <div className="space-y-4">
          {suggestedCommunities.map((community) => {
            const isJoined = joinedStates[community.name];
            return (
              <div key={community.name} className="flex items-center justify-between gap-3 text-sm">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-accent/10 text-lg shrink-0">
                    {community.icon}
                  </div>
                  <div>
                    <p className="font-bold text-foreground leading-tight text-xs">{community.name}</p>
                    <p className="text-[10px] text-muted-foreground mt-0.5 font-semibold">{community.members}</p>
                  </div>
                </div>

                <Button
                  onClick={() => handleToggleJoin(community.name)}
                  className={`h-7 px-2.5 text-[10px] font-bold rounded-lg transition-all duration-300 flex items-center gap-1 ${
                    isJoined
                      ? 'bg-muted border border-border text-muted-foreground hover:bg-muted/90'
                      : 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm border border-accent/20'
                  }`}
                >
                  {isJoined ? (
                    <>
                      <Check className="h-3 w-3" />
                      Joined
                    </>
                  ) : (
                    <>
                      <Plus className="h-3 w-3" />
                      Join
                    </>
                  )}
                </Button>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
