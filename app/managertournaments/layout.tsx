'use client';

import { useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { getPublicTournaments } from '@/lib/api/tournaments';
import type { TournamentDetailDto } from '@/lib/api/types';
import {
  Trophy,
  LayoutDashboard,
  LogOut,
  ChevronRight,
  ChevronDown,
  Loader2,
  ShieldAlert,
  User,
  Users,
  Settings,
  Layers,
  Radio,
  Shield,
} from 'lucide-react';

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onToggle,
  tournaments,
  selectedId,
}: {
  collapsed: boolean;
  onToggle: () => void;
  tournaments: TournamentDetailDto[];
  selectedId: string | null;
}) {
  const pathname = usePathname();
  const router = useRouter();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href);
  };

  return (
    <aside
      className={`relative flex flex-col border-r border-border bg-card shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 ${
        collapsed ? 'w-[72px]' : 'w-64'
      }`}
    >
      {/* Logo */}
      <div className="flex h-16 items-center justify-between px-4 border-b border-border">
        {!collapsed && (
          <Link href="/managertournaments" className="flex items-center gap-2.5">
            <div className="relative h-9 w-9 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
              <Image
                src="/logoCube.png"
                alt="CubeNexus"
                fill
                className="object-contain animate-pulse-subtle"
                priority
              />
            </div>
            <div className="leading-none">
              <div className="flex items-baseline gap-0.5">
                <span className="text-sm font-black tracking-tight text-foreground">CUBE</span>
                <span className="text-sm font-black tracking-tight text-primary">NEXUS</span>
              </div>
              <p className="text-[9px] font-semibold uppercase tracking-[0.2em] text-muted-foreground mt-0.5">
                Manager Portal
              </p>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto relative h-9 w-9 overflow-hidden rounded-lg border border-border bg-background shadow-sm">
            <Image
              src="/logoCube.png"
              alt="CubeNexus"
              fill
              className="object-contain"
              priority
            />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className={`absolute top-[18px] -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-sm transition hover:text-primary hover:border-primary/50`}
        aria-label="Toggle sidebar"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Tournament Selector Dropdown */}
      {!collapsed && tournaments.length > 0 && (
        <div className="px-4 pt-4 pb-2 border-b border-border/40">
          <label className="text-[9px] font-extrabold text-muted-foreground uppercase tracking-widest block mb-1.5">
            Select Tournament
          </label>
          <div className="relative">
            <select
              value={selectedId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  // Navigate to corresponding subpage or overview
                  const pathParts = pathname.split('/');
                  const subpage = pathParts.slice(3).join('/'); // registrations, events, etc.
                  router.push(`/managertournaments/${val}${subpage ? '/' + subpage : ''}`);
                }
              }}
              className="w-full bg-muted/40 border border-border rounded-xl pl-3 pr-8 py-2 text-xs font-bold text-foreground outline-none focus:border-primary transition appearance-none cursor-pointer"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} className="bg-card font-semibold">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-4">
        <ul className="space-y-1 px-2">
          <li>
            <Link
              href="/managertournaments"
              className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                pathname === '/managertournaments'
                  ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                  : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className={`h-4.5 w-4.5 shrink-0 ${pathname === '/managertournaments' ? 'text-primary' : ''}`} />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>

          {/* Tournament Administration (unified & flat) */}
          {[
            { label: 'Overview', href: selectedId ? `/managertournaments/${selectedId}` : '#', icon: Trophy, exact: true },
            { label: 'Registrations', href: selectedId ? `/managertournaments/${selectedId}/registrations` : '#', icon: Users, exact: false },
            { label: 'Events & Cutoffs', href: selectedId ? `/managertournaments/${selectedId}/events` : '#', icon: Settings, exact: false },
            { label: 'Groups & Scrambles', href: selectedId ? `/managertournaments/${selectedId}/groups` : '#', icon: Layers, exact: false },
            { label: 'Disputes & Audits', href: selectedId ? `/managertournaments/${selectedId}/disputes` : '#', icon: Shield, exact: false },
            { label: 'Live Operations', href: selectedId ? `/managertournaments/${selectedId}/live` : '#', icon: Radio, exact: false },
          ].map((item) => {
            const Icon = item.icon;
            const active = selectedId ? isActive(item.href, item.exact) : false;
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (!selectedId) {
                      e.preventDefault();
                      alert('Vui lòng tạo hoặc chọn một giải đấu trước khi sử dụng chức năng này!');
                    }
                  }}
                  className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-sm font-semibold transition-all ${
                    !selectedId 
                      ? 'opacity-50 cursor-not-allowed text-muted-foreground bg-transparent border-transparent' 
                      : active
                        ? 'bg-primary/10 text-primary border border-primary/20 shadow-sm'
                        : 'text-muted-foreground hover:bg-muted/50 hover:text-foreground border border-transparent'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className={`h-4.5 w-4.5 shrink-0 ${active ? 'text-primary' : ''}`} />
                  {!collapsed && <span>{item.label}</span>}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>
    </aside>
  );
}

// ─── Top Header Bar ──────────────────────────────────────────
function TopHeader() {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-border bg-background/90 px-6 backdrop-blur supports-[backdrop-filter]:bg-background/70">
      {/* Left: Breadcrumb hint */}
      <div className="flex items-center gap-2">
        <span className="text-xs font-bold text-muted-foreground uppercase tracking-widest">Manager Portal</span>
      </div>

      {/* Right: Profile */}
      <div className="flex items-center gap-3">
        {/* Profile Dropdown */}
        <div
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
          <button className="flex items-center gap-2 rounded-xl border border-border bg-card px-3 py-1.5 shadow-sm transition-all hover:border-primary/50 focus:outline-none">
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-primary text-sm font-bold text-primary-foreground shadow-sm">
              {user?.displayName?.charAt(0)?.toUpperCase() ?? 'M'}
            </div>
            <div className="hidden flex-col text-left sm:flex">
              <span className="text-xs font-bold text-foreground leading-tight">{user?.displayName}</span>
              <span className="text-[10px] text-primary uppercase tracking-wider leading-none mt-0.5 font-semibold">{user?.role}</span>
            </div>
            <ChevronDown size={14} className={`text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180 text-primary' : ''}`} />
          </button>

          {/* Hover Dropdown */}
          {isDropdownOpen && (
            <div className="absolute right-0 top-full pt-2 z-50">
              <div className="w-56 rounded-2xl border border-border bg-card p-2 shadow-xl animate-fade-in">
                {/* User header */}
                <div className="px-3 py-2 border-b border-border/60">
                  <p className="text-xs font-extrabold text-foreground truncate">{user?.displayName}</p>
                  <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                  <span className="mt-1.5 inline-block rounded-full bg-primary/10 border border-primary/20 px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider text-primary">
                    {user?.role}
                  </span>
                </div>

                {/* Actions */}
                <div className="mt-1.5 space-y-0.5">
                  <Link
                    href="/profile"
                    className="flex items-center gap-2.5 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-primary/5 hover:text-primary transition-colors"
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
      </div>
    </header>
  );
}

// ─── Layout ──────────────────────────────────────────────────

export default function ManagerLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tournamentsList, setTournamentsList] = useState<TournamentDetailDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Protected route guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
      return;
    }
    const role = user?.role?.toUpperCase();
    if (role !== 'MANAGER' && role !== 'ADMIN') {
      router.replace('/');
    }
  }, [isLoading, isAuthenticated, user, router]);

  // Fetch tournaments list for switcher
  useEffect(() => {
    if (isAuthenticated) {
      getPublicTournaments()
        .then((list) => {
          setTournamentsList(list);
          // If no active tournament in pathname, try to resolve a selectedId
          const match = pathname.match(/^\/managertournaments\/([^/]+)/);
          const activeId = match && match[1] !== 'layout' && match[1] !== 'page' ? match[1] : null;

          if (activeId && activeId !== 'T001' && activeId !== 'groups') {
            setSelectedId(activeId);
            localStorage.setItem('last_managed_tournament_id', activeId);
          } else {
            const stored = localStorage.getItem('last_managed_tournament_id');
            if (stored && list.some((t) => t.id === stored)) {
              setSelectedId(stored);
            } else if (list.length > 0) {
              setSelectedId(list[0].id);
              localStorage.setItem('last_managed_tournament_id', list[0].id);
            } else {
              setSelectedId(null); // No tournaments exist
            }
          }
        })
        .catch((err) => {
          console.warn('Failed to load tournaments list from API:', err);
          setSelectedId(null); 
        });
    }
  }, [isAuthenticated, pathname]);

  // Loading state
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-background">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  // Not authorized
  if (!isAuthenticated || (user?.role?.toUpperCase() !== 'MANAGER' && user?.role?.toUpperCase() !== 'ADMIN')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  return (
    <div
      className="flex bg-background text-foreground transition-colors duration-300"
      style={{
        height: '100vh',
        overflow: 'hidden',
        '--background': 'oklch(0.925 0.015 240)',     // Clean mid-tone gray-blue background
        '--foreground': 'oklch(0.25 0.02 240)',       // Dark slate text
        '--card': 'oklch(0.97 0.008 240)',            // Lighter card/sidebar background
        '--card-foreground': 'oklch(0.25 0.02 240)',
        '--border': 'oklch(0.87 0.015 240)',          // Soft border color
        '--muted': 'oklch(0.90 0.015 240)',           // Slightly darker gray-blue
        '--muted-foreground': 'oklch(0.48 0.02 240)',
        '--primary': 'oklch(0.58 0.16 260)',          // Premium Indigo/Violet accent
        '--primary-foreground': 'oklch(0.99 0.005 240)',
      } as React.CSSProperties}
    >
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        tournaments={tournamentsList}
        selectedId={selectedId}
      />

      {/* Main content area */}
      <main className="flex-1 flex flex-col min-w-0" style={{ height: '100vh', overflow: 'hidden' }}>
        <TopHeader />

        {/* Page content */}
        <div className="flex-1 overflow-y-auto p-6" style={{ height: 'calc(100vh - 4rem)' }}>{children}</div>
      </main>
    </div>
  );
}
