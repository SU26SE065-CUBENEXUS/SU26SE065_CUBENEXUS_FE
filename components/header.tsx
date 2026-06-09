'use client';

import Image from 'next/image';
import { Button } from '@/components/ui/button';

export function Header() {
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur supports-[backdrop-filter]:bg-background/72">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative h-20 w-20 sm:h-24 sm:w-24">
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
              <span className="text-2xl font-black tracking-tight sm:text-3xl text-accent">NEXUS</span>
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
          <a href="/" className="text-sm font-medium text-foreground transition hover:text-primary">HOME</a>
          <a href="/arena" className="text-sm font-medium text-foreground transition hover:text-green-500">ARENA</a>
          <a href="/tournaments" className="text-sm font-medium text-foreground transition hover:text-orange-500">TOURNAMENTS</a>
          <a href="/rankings" className="text-sm font-medium text-foreground transition hover:text-blue-500">RANKINGS</a>
          {/* <a href="/practice" className="text-sm font-medium text-foreground transition hover:text-green-500">PRACTICE</a> */}
          <a href="/community" className="text-sm font-medium text-foreground transition hover:text-yellow-500">COMMUNITY</a>
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
