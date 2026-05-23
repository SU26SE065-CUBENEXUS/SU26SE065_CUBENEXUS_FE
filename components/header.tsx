'use client';

import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded bg-accent">
            <span className="font-bold text-accent-foreground">C</span>
          </div>
          <div className="flex flex-col">
            <span className="font-bold tracking-tight text-foreground">CUBENEXUS</span>
            <span className="text-xs text-muted-foreground">Speedcubing Arena</span>
          </div>
        </div>

        {/* Navigation */}
        <div className="hidden gap-8 lg:flex">
          <a href="/" className="text-sm font-medium text-foreground transition hover:text-accent">HOME</a>
          <a href="/arena" className="text-sm font-medium text-foreground transition hover:text-accent">ARENA</a>
          <a href="/tournaments" className="text-sm font-medium text-foreground transition hover:text-accent">TOURNAMENTS</a>
          <a href="/rankings" className="text-sm font-medium text-foreground transition hover:text-accent">RANKINGS</a>
          <a href="/practice" className="text-sm font-medium text-foreground transition hover:text-accent">PRACTICE</a>
          <a href="/community" className="text-sm font-medium text-foreground transition hover:text-accent">COMMUNITY</a>
        </div>

        {/* Auth Buttons */}
        <div className="flex gap-3">
          <Button asChild variant="outline" className="hidden sm:inline-flex border-accent text-accent hover:bg-accent/5">
            <a href="/login">LOGIN</a>
          </Button>
          <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
            <a href="/signup">SIGN UP</a>
          </Button>
        </div>
      </nav>
    </header>
  );
}
