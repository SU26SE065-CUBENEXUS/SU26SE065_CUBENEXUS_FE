'use client';

import { useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/contexts/auth-context';
import { LogOut, User, ChevronDown } from 'lucide-react';

export function Header() {
  const { user, isAuthenticated, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  return (
    <header className="sticky top-0 z-50 border-b border-border/80 bg-background/88 backdrop-blur supports-[backdrop-filter]:bg-background/72">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 py-4 sm:px-6 lg:px-8">
        {/* Logo */}
        <div className="flex items-center gap-3 flex-shrink-0">
          <div className="relative h-14 w-14 overflow-hidden rounded-xl border border-border bg-background shadow-sm shadow-primary/10 sm:h-16 sm:w-16">
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
          <Link href="/" className="text-sm font-medium text-foreground transition hover:text-primary">HOME</Link>
          <Link href="/online" className="text-sm font-medium text-foreground transition hover:text-green-500">ARENA</Link>
          <Link href="/tournaments" className="text-sm font-medium text-foreground transition hover:text-orange-500">TOURNAMENTS</Link>
          <Link href="/rankings" className="text-sm font-medium text-foreground transition hover:text-blue-500">RANKINGS</Link>
          <Link href="/practice" className="text-sm font-medium text-foreground transition hover:text-green-500">PRACTICE</Link>
          <Link href="/community" className="text-sm font-medium text-foreground transition hover:text-yellow-500">COMMUNITY</Link>
        </div>

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-4">
          {isAuthenticated ? (
            <div 
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              {/* Trigger Avatar Button */}
              <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm transition-all hover:border-accent/50 focus:outline-none">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-sm font-bold text-accent-foreground shadow-sm">
                  {user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'}
                </div>
                <div className="hidden flex-col text-left sm:flex">
                  <span className="text-xs font-bold text-foreground leading-tight">{user?.displayName}</span>
                  {user?.role?.toUpperCase() !== 'COMPETITOR' && (
                    <span className="text-[10px] text-muted-foreground uppercase tracking-wider leading-none mt-0.5">{user?.role}</span>
                  )}
                </div>
                <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`} />
              </button>

              {/* Hover Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full pt-2 z-50">
                  <div className="w-56 rounded-2xl border border-border bg-card p-2 shadow-xl animate-fade-in">
                    {/* User Details header */}
                    <div className="px-3 py-2 border-b border-border/60">
                      <p className="text-xs font-extrabold text-foreground truncate">{user?.displayName}</p>
                      <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                      {user?.role?.toUpperCase() !== 'COMPETITOR' && (
                        <span className="mt-1.5 inline-block rounded-full bg-accent/10 border border-accent/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-accent">
                          {user?.role}
                        </span>
                      )}
                    </div>
                    
                    {/* Action items */}
                    <div className="mt-1.5 space-y-0.5">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-accent/5 hover:text-accent transition-colors"
                      >
                        <User size={14} />
                        <span>MY PROFILE</span>
                      </Link>
                      
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-red-500 hover:bg-red-500/5 transition-colors text-left border-none bg-transparent"
                      >
                        <LogOut size={14} />
                        <span>LOG OUT</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex gap-3">
              <Button asChild variant="outline" className="hidden sm:inline-flex border-accent text-accent hover:bg-accent/5">
                <Link href="/login">LOGIN</Link>
              </Button>
              <Button asChild className="bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/signup">SIGN UP</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
