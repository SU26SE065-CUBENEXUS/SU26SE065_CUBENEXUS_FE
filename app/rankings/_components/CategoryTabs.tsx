'use client';

import { Button } from '@/components/ui/button';
import { Globe, MapPin, CalendarRange } from 'lucide-react';

interface Category {
  id: string;
  label: string;
  icon: any;
}

interface CategoryTabsProps {
  selectedCategory: string;
  onSelectCategory: (id: string) => void;
}

export function CategoryTabs({ selectedCategory, onSelectCategory }: CategoryTabsProps) {
  const categories: Category[] = [
    { id: 'global', label: 'Global Rankings', icon: Globe },
    { id: 'asia', label: 'Asia Pacific', icon: MapPin },
    { id: 'europe', label: 'Europe', icon: MapPin },
    { id: 'americas', label: 'Americas', icon: MapPin },
    { id: 'monthly', label: 'Monthly Cup', icon: CalendarRange },
  ];

  return (
    <div className="mb-8 flex flex-wrap gap-2.5">
      {categories.map((category) => {
        const Icon = category.icon;
        const isActive = selectedCategory === category.id;
        return (
          <Button
            key={category.id}
            onClick={() => onSelectCategory(category.id)}
            variant={isActive ? 'default' : 'outline'}
            className={`rounded-xl font-semibold flex items-center gap-2 border transition-all duration-300 ${
              isActive
                ? 'bg-accent text-accent-foreground hover:bg-accent/90 shadow-sm shadow-accent/10 border-accent/25'
                : 'border-border hover:bg-muted/40'
            }`}
          >
            <Icon className={`h-4.5 w-4.5 ${isActive ? 'text-accent-foreground' : 'text-accent'}`} />
            {category.label}
          </Button>
        );
      })}
    </div>
  );
}
