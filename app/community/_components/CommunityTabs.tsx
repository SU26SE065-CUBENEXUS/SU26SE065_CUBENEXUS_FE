'use client';

import { Button } from '@/components/ui/button';
import { Newspaper, Users } from 'lucide-react';

interface CommunityTabsProps {
  selectedTab: string;
  onSelectTab: (tab: string) => void;
}

export function CommunityTabs({ selectedTab, onSelectTab }: CommunityTabsProps) {
  return (
    <div className="mb-8 flex gap-2.5">
      <Button
        onClick={() => onSelectTab('feed')}
        variant={selectedTab === 'feed' ? 'default' : 'outline'}
        className={`rounded-xl font-semibold flex items-center gap-2 border transition-all duration-300 ${
          selectedTab === 'feed'
            ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm border-accent/25'
            : 'border-border hover:bg-muted/40'
        }`}
      >
        <Newspaper className="h-4.5 w-4.5" />
        Activity Feed
      </Button>
      <Button
        onClick={() => onSelectTab('communities')}
        variant={selectedTab === 'communities' ? 'default' : 'outline'}
        className={`rounded-xl font-semibold flex items-center gap-2 border transition-all duration-300 ${
          selectedTab === 'communities'
            ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm border-accent/25'
            : 'border-border hover:bg-muted/40'
        }`}
      >
        <Users className="h-4.5 w-4.5" />
        Group Communities
      </Button>
    </div>
  );
}
