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
    <header className="sticky top-0 z-50 border-b border-border/50 bg-background/80 backdrop-blur-md transition-all duration-200">
      <nav className="mx-auto flex max-w-7xl items-center justify-between px-4 h-14 sm:px-6 lg:px-8">
        {/* Logo */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0 group">
          <div className="relative h-8 w-8 shrink-0 transition-transform duration-200 group-hover:scale-105">
            <Image
              src="/logoCube.png"
              alt="CubeNexus logo"
              fill
              className="object-contain"
              priority
            />
          </div>
          <div className="flex items-center gap-1.5 leading-none">
            <span className="text-base font-black tracking-tight text-foreground">CUBE</span>
            <span className="text-base font-black tracking-tight text-accent">NEXUS</span>
          </div>
        </Link>

        {/* Navigation */}
        <div className="hidden items-center gap-6 lg:flex">
          <Link href="/" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-foreground transition-colors">HOME</Link>
          <Link href="/online" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition-colors">ARENA</Link>
          <Link href="/tournaments" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-orange-400 transition-colors">EVEN</Link>
          <Link href="/rankings" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-blue-400 transition-colors">RANKINGS</Link>
          <Link href="/practice" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-emerald-400 transition-colors">PRACTICE</Link>
          <Link href="/live" className="text-xs font-bold uppercase tracking-wider text-muted-foreground hover:text-amber-400 transition-colors">LIVE</Link>

        </div>

        {/* Auth / Profile Area */}
        <div className="flex items-center gap-3">
          {isAuthenticated ? (
            <div 
              className="relative"
              onMouseEnter={() => setIsDropdownOpen(true)}
              onMouseLeave={() => setIsDropdownOpen(false)}
            >
              {/* Trigger Avatar Button */}
              <button className="flex items-center gap-2 rounded-lg border border-border/60 bg-card/60 px-2.5 py-1 text-left shadow-xs transition-all hover:border-accent/40 hover:bg-accent/5 focus:outline-none cursor-pointer">
                <div className="flex h-6 w-6 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground shadow-xs overflow-hidden shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                  ) : (
                    user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'
                  )}
                </div>
                <div className="hidden flex-col sm:flex">
                  <span className="text-xs font-semibold text-foreground leading-none">{user?.displayName}</span>
                </div>
                <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-accent' : ''}`} />
              </button>

              {/* Hover Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute right-0 top-full pt-1.5 z-50">
                  <div className="w-52 rounded-xl border border-border/60 bg-popover p-1.5 shadow-xl animate-fade-in backdrop-blur-md">
                    {/* User Details header */}
                    <div className="px-2.5 py-2 border-b border-border/40 flex items-center gap-2.5">
                      <div className="flex h-8 w-8 items-center justify-center rounded-full bg-accent text-xs font-bold text-accent-foreground shadow-xs overflow-hidden shrink-0">
                        {user?.avatarUrl ? (
                          <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                        ) : (
                          user?.displayName?.charAt(0)?.toUpperCase() ?? 'U'
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold text-foreground truncate">{user?.displayName}</p>
                        <p className="text-[10px] text-muted-foreground truncate">{user?.email}</p>
                      </div>
                    </div>
                    
                    {/* Action items */}
                    <div className="mt-1 space-y-0.5">
                      <Link 
                        href="/profile" 
                        className="flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-foreground hover:bg-accent/10 hover:text-accent transition-colors"
                      >
                        <User size={13} />
                        <span>MY PROFILE</span>
                      </Link>
                      
                      <button 
                        onClick={logout}
                        className="w-full flex items-center gap-2 rounded-lg px-2.5 py-1.5 text-xs font-semibold text-rose-400 hover:bg-rose-500/10 transition-colors text-left border-none bg-transparent cursor-pointer"
                      >
                        <LogOut size={13} />
                        <span>LOG OUT</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Button asChild variant="ghost" size="sm" className="h-8 text-xs font-semibold">
                <Link href="/login">LOGIN</Link>
              </Button>
              <Button asChild size="sm" className="h-8 text-xs font-bold bg-accent text-accent-foreground hover:bg-accent/90">
                <Link href="/signup">SIGN UP</Link>
              </Button>
            </div>
          )}
        </div>
      </nav>
    </header>
  );
}
