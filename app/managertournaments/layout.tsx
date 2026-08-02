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
  UserCheck,
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
    { label: 'Live Operations', href: selectedId ? `/managertournaments/${selectedId}/live` : '#', icon: Radio, exact: false },
    { label: 'Overview', href: selectedId ? `/managertournaments/${selectedId}` : '#', icon: Trophy, exact: true },
    { label: 'Manage Judges', href: selectedId ? `/managertournaments/${selectedId}/judges` : '#', icon: UserCheck, exact: false },
    { label: 'Registrations', href: selectedId ? `/managertournaments/${selectedId}/registrations` : '#', icon: Users, exact: false },
    { label: 'Events & Competitors', href: selectedId ? `/managertournaments/${selectedId}/events` : '#', icon: Settings, exact: false },
    { label: 'Groups & Scrambles', href: selectedId ? `/managertournaments/${selectedId}/groups` : '#', icon: Layers, exact: false },
  ];

  return (
    <aside
      className={`relative flex flex-col shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 overflow-hidden bg-white border-r border-slate-200 shadow-xs ${
        collapsed ? 'w-[68px]' : 'w-60'
      }`}
    >
      {/* Logo */}
      <div className="relative flex h-[60px] items-center justify-between px-4 border-b border-slate-200 flex-shrink-0 bg-white">
        {!collapsed && (
          <Link href="/managertournaments" className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
              <Image src="/logoCube.png" alt="CubeNexus" width={24} height={24} className="object-contain" priority />
            </div>
            <div className="leading-none min-w-0">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[13px] font-extrabold tracking-tight text-slate-900">CUBE</span>
                <span className="text-[13px] font-extrabold tracking-tight text-indigo-600">NEXUS</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 truncate">
                Manager Portal
              </p>
            </div>
          </Link>
        )}
        {collapsed && (
          <div className="mx-auto relative h-8 w-8 overflow-hidden rounded-lg border border-slate-200 shrink-0 bg-slate-50 flex items-center justify-center p-1">
            <Image src="/logoCube.png" alt="CubeNexus" width={24} height={24} className="object-contain" priority />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <button
        onClick={onToggle}
        className="absolute top-[18px] -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-500 shadow-sm transition-all hover:bg-slate-50 hover:text-slate-900"
        aria-label="Toggle sidebar"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Tournament Selector */}
      {!collapsed && tournaments.length > 0 && (
        <div className="px-3 pt-3.5 pb-3 border-b border-slate-200 flex-shrink-0 bg-slate-50/50">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
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
              className="w-full pl-3 pr-7 py-1.5 text-xs font-semibold text-slate-800 bg-white border border-slate-200 rounded-lg outline-none appearance-none cursor-pointer hover:border-slate-300 transition shadow-2xs"
            >
              {tournaments.map((t) => (
                <option key={t.id} value={t.id} className="text-slate-900 bg-white font-medium">
                  {t.name}
                </option>
              ))}
            </select>
            <ChevronDown size={12} className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3">
        <ul className="space-y-1 px-2.5">
          <li>
            <Link
              href="/managertournaments"
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                pathname === '/managertournaments'
                  ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
              } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0" />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>

          {!collapsed && (
            <li className="pt-3 pb-1">
              <span className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-slate-400">
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
                  className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${
                    !selectedId
                      ? 'opacity-40 cursor-not-allowed text-slate-400 border-transparent'
                      : active
                        ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold'
                        : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                  } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? item.label : undefined}
                >
                  <Icon className="h-4 w-4 shrink-0" />
                  {!collapsed && (
                    <span className="flex-1 truncate">{item.label}</span>
                  )}
                  {collapsed && (
                    <span className="text-[10px] font-bold text-slate-700">{item.label.charAt(0)}</span>
                  )}
                  {!collapsed && isLive && selectedId && (
                    <span className="w-2 h-2 rounded-full bg-emerald-500" />
                  )}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom info */}
      {!collapsed && (
        <div className="p-3 border-t border-slate-200 flex-shrink-0 bg-slate-50/50">
          <div className="flex items-center gap-1.5 text-[10px] text-slate-400 font-medium">
            <span>CubeNexus Manager v1.0</span>
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
    events: 'Events & Competitors',
    groups: 'Groups & Scrambles',
    live: 'Live Operations',
    judges: 'Judge Management',
  };
  const pageLabel = pageLabels[lastSegment] || (selectedTournamentName ? 'Overview' : 'Dashboard');

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-slate-200 flex-shrink-0 shadow-2xs">
      {/* Left: Page Context */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-slate-500">
          {selectedTournamentName || 'Manager Portal'}
        </span>
        {selectedTournamentName && pageLabel !== 'Overview' && (
          <>
            <ChevronRight className="h-3.5 w-3.5 text-slate-300 shrink-0" />
            <span className="text-xs font-bold text-slate-900 truncate">
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
          className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs"
          >
            {user?.displayName?.charAt(0)?.toUpperCase() ?? 'M'}
          </div>
          <div className="hidden flex-col text-left sm:flex">
            <span className="text-xs font-bold text-slate-900 leading-tight">{user?.displayName}</span>
            <span className="text-[9px] font-bold text-indigo-600 uppercase tracking-wider">
              {user?.role}
            </span>
          </div>
          <ChevronDown size={12} className={`text-slate-400 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
        </button>

        {isDropdownOpen && (
          <div className="absolute right-0 top-full pt-1.5 z-50">
            <div className="w-52 rounded-xl p-1.5 bg-white border border-slate-200 shadow-xl animate-fade-in">
              <div className="px-3 py-2 border-b border-slate-100">
                <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName}</p>
                <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                <span className="mt-1.5 inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                  {user?.role}
                </span>
              </div>
              <div className="mt-1 space-y-0.5">
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <User size={13} />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent"
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
    <div className="flex min-h-screen bg-slate-50 text-slate-900 font-sans">
      <Sidebar
        collapsed={collapsed}
        onToggle={() => setCollapsed((v) => !v)}
        tournaments={tournamentsList}
        selectedId={selectedId}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <TopHeader selectedTournamentName={selectedTournament?.name} />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
