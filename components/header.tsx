'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative h-14 w-14 overflow-hidden rounded bg-background sm:h-16 sm:w-16">
            <Image
              src="/logoCube.png"
              alt="CubeNexus logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="leading-none">
            <div className="flex items-baseline gap-1 sm:gap-1.5">
              <span className="text-2xl font-black tracking-tight text-foreground sm:text-3xl">CUBE</span>
              <span className="text-2xl font-black tracking-tight text-[#f4b400] sm:text-3xl">NEXUS</span>
            </div>
            <div className="mt-1 flex items-center gap-2 text-[9px] font-semibold tracking-[0.28em] text-muted-foreground sm:text-[10px]">
              <span>SOLVE</span>
              <span className="h-1.5 w-1.5 rounded-full bg-green-500" />
              <span>COMPETE</span>
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              <span>INSPIRE</span>
            </div>
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
