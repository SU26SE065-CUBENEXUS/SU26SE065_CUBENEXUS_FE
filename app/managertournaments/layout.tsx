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
  Wifi,
  WifiOff,
  Zap,
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

  const navItems = [
    { label: 'Overview', href: selectedId ? `/managertournaments/${selectedId}` : '#', icon: Trophy, exact: true },
    { label: 'Registrations', href: selectedId ? `/managertournaments/${selectedId}/registrations` : '#', icon: Users, exact: false },
    { label: 'Events & Cutoffs', href: selectedId ? `/managertournaments/${selectedId}/events` : '#', icon: Settings, exact: false },
    { label: 'Groups & Scrambles', href: selectedId ? `/managertournaments/${selectedId}/groups` : '#', icon: Layers, exact: false },
    { label: 'Live Operations', href: selectedId ? `/managertournaments/${selectedId}/live` : '#', icon: Radio, exact: false },
    { label: 'Disputes & Audits', href: selectedId ? `/managertournaments/${selectedId}/disputes` : '#', icon: Shield, exact: false },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 overflow-hidden ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
      style={{
        background: 'var(--sidebar)',
        borderRight: '1px solid oklch(0.22 0.02 256)',
      }}
    >
      {/* Subtle gradient top */}
      <div className="absolute top-0 left-0 right-0 h-32 pointer-events-none"
        style={{ background: 'radial-gradient(ellipse at top, oklch(0.72 0.21 42 / 0.06) 0%, transparent 70%)' }}
      />

      {/* Logo */}
      <div className="relative flex h-[60px] items-center justify-between px-4 border-b border-sidebar-border flex-shrink-0">
        {!collapsed && (
          <Link href="/managertournaments" className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0"
              style={{ border: '1px solid oklch(0.72 0.21 42 / 0.3)', boxShadow: '0 0 12px oklch(0.72 0.21 42 / 0.15)' }}
            >
              <Image src="/logoCube.png" alt="CubeNexus" fill className="object-contain" priority />
            </div>
            <div className="leading-none min-w-0">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[13px] font-black tracking-tight text-foreground">CUBE</span>
                <span className="text-[13px] font-black tracking-tight" style={{ color: 'oklch(0.72 0.21 42)' }}>NEXUS</span>
              </div>
              <p className="text-[8px] font-bold uppercase tracking-[0.25em] text-muted-foreground mt-0.5 truncate">
                Manager Portal
              </p>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto relative h-8 w-8 overflow-hidden rounded-lg flex-shrink-0"
            style={{ border: '1px solid oklch(0.72 0.21 42 / 0.3)' }}
          >
            <Image src="/logoCube.png" alt="CubeNexus" fill className="object-contain" priority />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute top-[18px] -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full shadow-lg transition-all hover:scale-110"
        style={{
          background: 'var(--card)',
          border: '1px solid oklch(0.28 0.02 256)',
          color: 'var(--muted-foreground)',
        }}
        aria-label="Toggle sidebar"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Tournament Selector */}
      {!collapsed && tournaments.length > 0 && (
        <div className="px-3 pt-3 pb-2.5 border-b border-sidebar-border/60 flex-shrink-0">
          <label className="text-[8px] font-extrabold text-muted-foreground uppercase tracking-[0.2em] block mb-1.5">
            Active Tournament
          </label>
          <div className="relative">
            <select
              value={selectedId || ''}
              onChange={(e) => {
                const val = e.target.value;
                if (val) {
                  const pathParts = pathname.split('/');
                  const subpage = pathParts.slice(3).join('/');
                  router.push(`/managertournaments/${val}${subpage ? '/' + subpage : ''}`);
                }
              }}
              className="w-full pl-3 pr-7 py-2 text-xs font-semibold text-foreground outline-none appearance-none cursor-pointer transition rounded-lg"
              style={{
                background: 'oklch(0.185 0.02 256)',
                border: '1px solid oklch(0.28 0.02 256)',
              }}
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} style={{ background: 'oklch(0.155 0.018 255)', fontWeight: 600 }}>
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-muted-foreground pointer-events-none" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-0.5 px-2">
          <li>
            <Link
              href="/managertournaments"
              className={`flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                pathname === '/managertournaments'
                  ? 'text-primary bg-primary/10 border border-primary/20'
                  : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground border border-transparent'
              } ${collapsed ? 'justify-center' : ''}`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>

          {!collapsed && (
            <li className="pt-3 pb-1">
              <span className="px-2.5 text-[9px] font-extrabold uppercase tracking-[0.2em] text-muted-foreground/60">
                Tournament
              </span>
            </li>
          )}

          {navItems.map((item) => {
            const Icon = item.icon;
            const active = selectedId ? isActive(item.href, item.exact) : false;
            const isLive = item.label === 'Live Operations';
            return (
              <li key={item.label}>
                <Link
                  href={item.href}
                  onClick={(e) => {
                    if (!selectedId) {
                      e.preventDefault();
                    }
                  }}
                  className={`relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-xs font-semibold transition-all ${
                    !selectedId
                      ? 'opacity-35 cursor-not-allowed text-muted-foreground border-transparent'
                      : active
                        ? 'text-primary bg-primary/10 border border-primary/20'
                        : 'text-muted-foreground hover:bg-sidebar-accent/60 hover:text-foreground border border-transparent'
                  } ${collapsed ? 'justify-center' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1">{item.label}</span>
                  )}
                  {!collapsed && isLive && selectedId && (
                    <span className="live-dot w-1.5 h-1.5 rounded-full"
                      style={{ background: 'oklch(0.70 0.19 145)', animation: 'livePulse 1.5s ease-in-out infinite' }}
                    />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom info */}
      {!collapsed && (
        <div className="p-3 border-t border-sidebar-border/60 flex-shrink-0">
          <div className="flex items-center gap-1.5 text-[9px] text-muted-foreground/50 font-medium">
            <Zap className="h-2.5 w-2.5" />
            <span>CubeNexus v1.0 • Manager</span>
          </div>
        </div>
      )}
    </aside>
  );
}

// ─── Top Header Bar ──────────────────────────────────────────
function TopHeader({ selectedTournamentName }: { selectedTournamentName?: string }) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Breadcrumb label from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const pageLabels: Record<string, string> = {
    managertournaments: 'Dashboard',
    registrations: 'Registrations',
    events: 'Events & Cutoffs',
    groups: 'Groups & Scrambles',
    live: 'Live Operations',
    disputes: 'Disputes & Audits',
    judges: 'Judge Management',
  };
  const pageLabel = pageLabels[lastSegment] || (selectedTournamentName ? 'Overview' : 'Dashboard');

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between px-5 flex-shrink-0"
      style={{
        background: 'oklch(0.115 0.018 255 / 0.9)',
        backdropFilter: 'blur(12px)',
        WebkitBackdropFilter: 'blur(12px)',
        borderBottom: '1px solid oklch(0.22 0.02 256)',
      }}
    >
      {/* Left: Page Context */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-[0.15em]">
          {selectedTournamentName || 'Manager Portal'}
        </span>
        {selectedTournamentName && pageLabel !== 'Overview' && (
          <>
            <ChevronRight className="h-3 w-3 text-muted-foreground/40 shrink-0" />
            <span className="text-[10px] font-bold text-foreground uppercase tracking-[0.1em] truncate">
              {pageLabel}
            </span>
          </>
        )}
      </div>

      {/* Right: Profile */}
      <div
        className="relative"
        onMouseEnter={() => setIsDropdownOpen(true)}
        onMouseLeave={() => setIsDropdownOpen(false)}
      >
        <button
          className="flex items-center gap-2 rounded-xl px-3 py-1.5 transition-all hover:bg-sidebar-accent/60"
          style={{ border: '1px solid oklch(0.24 0.02 256)' }}
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-black text-primary-foreground shadow-sm"
            style={{ background: 'oklch(0.72 0.21 42)', boxShadow: '0 0 10px oklch(0.72 0.21 42 / 0.25)' }}
          >
            {user?.displayName?.charAt(0)?.toUpperCase() ?? 'M'}
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-bold text-foreground leading-tight">{user?.displayName}</span>
            <span className="text-[9px] font-bold uppercase tracking-wider mt-0.5" style={{ color: 'oklch(0.72 0.21 42)' }}>
              {user?.role}
            </span>
          </div>
          <ChevronDown size={12} className={`text-muted-foreground transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full pt-2 z-50">
            <div className="w-52 rounded-2xl p-2 shadow-2xl animate-fade-in"
              style={{ background: 'var(--card)', border: '1px solid oklch(0.24 0.02 256)' }}
            >
              <div className="px-3 py-2 border-b border-border/60">
                <p className="text-xs font-extrabold text-foreground truncate">{user?.displayName}</p>
                <p className="text-[10px] text-muted-foreground truncate mt-0.5">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-full px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider"
                  style={{ background: 'oklch(0.72 0.21 42 / 0.12)', border: '1px solid oklch(0.72 0.21 42 / 0.25)', color: 'oklch(0.72 0.21 42)' }}
                >
                  {user?.role}
                </span>
              </div>
              <div className="mt-1.5 space-y-0.5">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-foreground hover:bg-sidebar-accent/60 hover:text-primary transition-colors"
                >
                  <User size={13} />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 rounded-xl px-3 py-2 text-xs font-bold text-red-400 hover:bg-red-500/8 transition-colors text-left border-none bg-transparent"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </header>
  );
}

// ─── Layout ──────────────────────────────────────────────────

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tournamentsList, setTournamentsList] = useState<TournamentDetailDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  // Protected route guard
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) { router.replace('/login'); return; }
    const role = user?.role?.toUpperCase();
    if (role !== 'MANAGER' && role !== 'ADMIN') { router.replace('/'); }
  }, [isLoading, isAuthenticated, user, router]);

  // Fetch tournaments list for switcher
  useEffect(() => {
    if (isAuthenticated) {
      getPublicTournaments()
        .then((list) => {
          setTournamentsList(list);
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
              setSelectedId(null);
            }
          }
        })
        .catch(() => setSelectedId(null));
    }
  }, [isAuthenticated, pathname]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center" style={{ background: 'var(--background)' }}>
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin" style={{ color: 'oklch(0.72 0.21 42)' }} />
          <p className="text-xs font-semibold text-muted-foreground uppercase tracking-widest">Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated || (user?.role?.toUpperCase() !== 'MANAGER' && user?.role?.toUpperCase() !== 'ADMIN')) {
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 bg-background text-foreground">
        <ShieldAlert className="h-12 w-12 text-red-400" />
        <p className="text-lg font-semibold">Access Denied</p>
        <p className="text-sm text-muted-foreground">Redirecting…</p>
      </div>
    );
  }

  const selectedTournament = tournamentsList.find((t) => t.id === selectedId);

  return (
    <div className="flex min-h-screen bg-background text-foreground">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        tournaments={tournamentsList}
        selectedId={selectedId}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <TopHeader selectedTournamentName={selectedTournament?.name} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
