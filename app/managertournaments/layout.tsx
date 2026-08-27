'use client';

import { useCallback, useEffect, useState } from 'react';
import { useRouter, usePathname } from 'next/navigation';
import Link from 'next/link';
import Image from 'next/image';
import { useAuth } from '@/contexts/auth-context';
import { getManagerTournaments, getTournamentById } from '@/lib/api/tournaments';
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
  Zap,
  Video,
  Database,
} from 'lucide-react';

import AdminNotificationBell from '@/features/admin/components/AdminNotificationBell';
import { getFraudReports } from '@/features/online-arena/api/onlineArenaApi';

export function isOfflineManagerTournament(t: TournamentDetailDto): boolean {
  if (t.isOnlineAsync || (t as any).tournamentType === 'ONLINE_ASYNC') return false;
  const nameLower = (t.name || '').toLowerCase();
  const descLower = (t.description || '').toLowerCase();
  if (nameLower.includes('async') || nameLower.includes('ao1') || nameLower.includes('a01') || nameLower.includes('online async')) return false;
  if (descLower.includes('async') || descLower.includes('ao1') || descLower.includes('bất đồng bộ')) return false;
  return true;
}

// ─── Sidebar ─────────────────────────────────────────────────
function Sidebar({
  collapsed,
  onToggle,
  tournaments,
  selectedId,
  pendingFraudCount,
}: {
  collapsed: boolean;
  onToggle: () => void;
  tournaments: TournamentDetailDto[];
  selectedId: string | null;
  pendingFraudCount: number;
}) {
  const pathname = usePathname();
  const router = useRouter();
  const { user } = useAuth();
  const isAdmin = user?.role?.toUpperCase() === 'ADMIN';

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
      className={`relative flex flex-col shrink-0 transition-all duration-300 ease-in-out h-screen sticky top-0 z-40 bg-white border-r border-slate-200 shadow-2xs ${collapsed ? 'w-[68px]' : 'w-60'
        }`}
    >
      {/* Logo */}
      <div className="relative flex h-[60px] items-center justify-between px-4 border-b border-slate-200 flex-shrink-0 bg-white">
        {!collapsed && (
          <Link href={isAdmin ? "/admin" : "/managertournaments"} className="flex items-center gap-2.5 min-w-0">
            <div className="relative h-8 w-8 overflow-hidden rounded-lg shrink-0 border border-slate-200 bg-slate-50 flex items-center justify-center p-1">
              <Image src="/logoCube.png" alt="CubeNexus" width={24} height={24} className="object-contain" priority />
            </div>
            <div className="leading-none min-w-0">
              <div className="flex items-baseline gap-0.5">
                <span className="text-[13px] font-extrabold tracking-tight text-slate-900">CUBE</span>
                <span className="text-[13px] font-extrabold tracking-tight text-indigo-600">NEXUS</span>
              </div>
              <p className="text-[9px] font-bold uppercase tracking-wider text-slate-400 mt-0.5 truncate">
                {isAdmin ? 'Admin Portal' : 'Manager Portal'}
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
        className="absolute top-[18px] -right-3 z-50 flex h-6 w-6 items-center justify-center rounded-full bg-white border border-slate-200 text-slate-600 shadow-md transition-all hover:bg-slate-50 hover:text-slate-900 cursor-pointer"
        aria-label="Toggle sidebar"
      >
        <ChevronRight className={`h-3.5 w-3.5 transition-transform duration-300 ${collapsed ? '' : 'rotate-180'}`} />
      </button>

      {/* Active Tournament Selector (Manager View - Real Offline Tournaments Only) */}
      {!isAdmin && !collapsed && (
        <div className="px-3 pt-3.5 pb-3 border-b border-slate-200 flex-shrink-0 bg-slate-50/50">
          <label className="text-[9px] font-bold text-slate-400 uppercase tracking-wider block mb-1.5">
            Active Offline Tournament
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
              {tournaments.length > 0 ? (
                tournaments.map((t) => (
                  <option key={t.id} value={t.id} className="text-slate-900 bg-white font-medium">
                    {t.name}
                  </option>
                ))
              ) : (
                <option value="" disabled className="text-slate-400">
                  No Offline tournaments available
                </option>
              )}
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
              href={isAdmin ? '/admin' : '/managertournaments'}
              className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${(isAdmin ? pathname === '/admin' : pathname === '/managertournaments')
                  ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold'
                  : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                } ${collapsed ? 'justify-center px-2' : ''}`}
              title={collapsed ? 'Dashboard' : undefined}
            >
              <LayoutDashboard className="h-4 w-4 shrink-0 text-indigo-600" />
              {!collapsed && <span>Dashboard</span>}
            </Link>
          </li>

          {/* Manager Specific Navigation */}
          {!isAdmin && (
            <>
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
                      className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${!selectedId
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
                      {!collapsed && isLive && selectedId && (
                        <span className="w-2 h-2 rounded-full bg-emerald-500" />
                      )}
                    </Link>
                  </li>
                );
              })}
            </>
          )}

          {/* Admin Specific Navigation */}
          {isAdmin && (
            <>
              {!collapsed && (
                <li className="pt-3 pb-1">
                  <span className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-amber-600 flex items-center gap-1">
                    <Trophy className="h-3 w-3" /> Tournaments
                  </span>
                </li>
              )}

              <li>
                <Link
                  href="/admin/tournaments/async"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${pathname.startsWith('/admin/tournaments/async')
                      ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? 'Async Online (A01)' : undefined}
                >
                  <Zap className="h-4 w-4 shrink-0 text-indigo-500" />
                  {!collapsed && (
                    <span className="flex-1 truncate">Async Online (A01)</span>
                  )}
                </Link>
              </li>

              <li>
                <Link
                  href="/admin/scrambles"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${pathname.startsWith('/admin/scrambles')
                      ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? 'Scramble Management' : undefined}
                >
                  <Database className="h-4 w-4 shrink-0 text-indigo-500" />
                  {!collapsed && <span className="flex-1 truncate">Scramble Management</span>}
                </Link>
              </li>

              <li>
                <Link
                  href="/admin/a01-video-review"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${pathname.startsWith('/admin/a01-video-review')
                      ? 'text-rose-600 bg-rose-50 border border-rose-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? 'A01 Video Review' : undefined}
                >
                  <Video className="h-4 w-4 shrink-0 text-rose-500" />
                  {!collapsed && <span className="flex-1 truncate">A01 Video Review</span>}
                </Link>
              </li>

              {!collapsed && (
                <li className="pt-4 pb-1">
                  <span className="px-3 text-[9px] font-extrabold uppercase tracking-wider text-rose-500 flex items-center gap-1">
                    <ShieldAlert className="h-3 w-3" /> Anti-Cheat & Audit
                  </span>
                </li>
              )}

              <li>
                <Link
                  href="/admin/users"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${pathname.startsWith('/admin/users')
                      ? 'text-indigo-600 bg-indigo-50 border border-indigo-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? 'User Management' : undefined}
                >
                  <Users className="h-4 w-4 shrink-0 text-indigo-500" />
                  {!collapsed && (
                    <span className="flex-1 truncate">User Management</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/elo-management"
                  className={`flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${pathname.startsWith('/admin/elo-management')
                      ? 'text-orange-600 bg-orange-50 border border-orange-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? 'ELO Configuration' : undefined}
                >
                  <Zap className="h-4 w-4 shrink-0 text-orange-500" />
                  {!collapsed && (
                    <span className="flex-1 truncate">ELO Configuration</span>
                  )}
                </Link>
              </li>
              <li>
                <Link
                  href="/admin/fraud-reports"
                  className={`relative flex items-center gap-2.5 rounded-lg px-3 py-2 text-xs font-semibold transition-all ${pathname.startsWith('/admin/fraud-reports')
                      ? 'text-rose-600 bg-rose-50 border border-rose-100 font-bold'
                      : 'text-slate-600 hover:bg-slate-100/70 hover:text-slate-900 border border-transparent'
                    } ${collapsed ? 'justify-center px-2' : ''}`}
                  title={collapsed ? 'Fraud Reports' : undefined}
                >
                  <ShieldAlert className="h-4 w-4 shrink-0 text-rose-500" />
                  {!collapsed && (
                    <span className="flex-1 truncate">Fraud Reports</span>
                  )}
                  {pendingFraudCount > 0 && (
                    <span className={`inline-flex h-4 min-w-4 items-center justify-center rounded-full bg-rose-600 px-1 text-[9px] font-black text-white ${collapsed ? 'absolute ml-5 -mt-5' : ''}`}>
                      {pendingFraudCount > 99 ? '99+' : pendingFraudCount}
                    </span>
                  )}
                </Link>
              </li>
            </>
          )}
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
function TopHeader({
  selectedTournamentName,
  pendingFraudReportIds,
}: {
  selectedTournamentName?: string;
  pendingFraudReportIds: string[] | null;
}) {
  const { user, logout } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const pathname = usePathname();

  // Breadcrumb label from pathname
  const pathSegments = pathname.split('/').filter(Boolean);
  const lastSegment = pathSegments[pathSegments.length - 1];
  const pageLabels: Record<string, string> = {
    managertournaments: 'Dashboard',
    async: 'Async Online (A01)',
    offline: 'Manager Offline Tournaments',
    registrations: 'Registrations',
    events: 'Events & Competitors',
    groups: 'Groups & Scrambles',
    live: 'Live Operations',
    judges: 'Judge Management',
    'fraud-reports': 'Fraud Reports Queue',
    'elo-management': 'ELO Management',
    scrambles: 'Scramble Control Center',
    'a01-video-review': 'A01 Video Review',
  };
  const pageLabel = pageLabels[lastSegment] || (selectedTournamentName ? 'Overview' : 'Dashboard');

  return (
    <header className="sticky top-0 z-30 flex h-[60px] items-center justify-between px-6 bg-white/90 backdrop-blur-md border-b border-slate-200 flex-shrink-0 shadow-2xs">
      {/* Left: Page Context */}
      <div className="flex items-center gap-2 min-w-0">
        <span className="text-xs font-semibold text-slate-500">
          {selectedTournamentName || 'Management Portal'}
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

      {/* Right: Actions & Profile */}
      <div className="flex items-center gap-3">
        {user?.role?.toUpperCase() === 'ADMIN' && (
          <AdminNotificationBell pendingFraudReportIds={pendingFraudReportIds} />
        )}
        <div
          className="relative"
          onMouseEnter={() => setIsDropdownOpen(true)}
          onMouseLeave={() => setIsDropdownOpen(false)}
        >
        <button
          className="flex items-center gap-2.5 rounded-lg px-3 py-1.5 bg-white border border-slate-200 hover:bg-slate-50 transition-all shadow-2xs cursor-pointer"
        >
          <div
            className="flex h-7 w-7 items-center justify-center rounded-full text-xs font-bold bg-indigo-600 text-white shadow-2xs overflow-hidden shrink-0"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
            ) : (
              user?.displayName?.charAt(0)?.toUpperCase() ?? 'M'
            )}
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
              <div className="px-3 py-2 border-b border-slate-100 flex items-center gap-2.5">
                <div className="flex h-8 w-8 items-center justify-center rounded-full bg-indigo-600 text-xs font-bold text-white shadow-2xs overflow-hidden shrink-0">
                  {user?.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.displayName} className="h-full w-full object-cover" />
                  ) : (
                    user?.displayName?.charAt(0)?.toUpperCase() ?? 'M'
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-bold text-slate-900 truncate">{user?.displayName}</p>
                  <p className="text-[10px] text-slate-500 truncate mt-0.5">{user?.email}</p>
                  <span className="mt-1 inline-block rounded-md px-2 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-indigo-50 text-indigo-700 border border-indigo-100">
                    {user?.role}
                  </span>
                </div>
              </div>
              <div className="mt-1 space-y-0.5">
                {user?.role?.toUpperCase() === 'ADMIN' && (
                  <Link
                    href="/admin/fraud-reports"
                    className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-rose-600 hover:bg-rose-50 transition-colors"
                  >
                    <ShieldAlert size={13} />
                    <span>Fraud Reports Queue</span>
                  </Link>
                )}
                <Link
                  href="/profile"
                  className="flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-slate-700 hover:bg-slate-100 hover:text-slate-900 transition-colors"
                >
                  <User size={13} />
                  <span>My Profile</span>
                </Link>
                <button
                  onClick={logout}
                  className="w-full flex items-center gap-2 rounded-lg px-3 py-1.5 text-xs font-semibold text-red-600 hover:bg-red-50 transition-colors text-left border-none bg-transparent cursor-pointer"
                >
                  <LogOut size={13} />
                  <span>Log Out</span>
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

export default function ManagerLayout({ children }: { children: React.ReactNode }) {
  const { user, isAuthenticated, isLoading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [collapsed, setCollapsed] = useState(false);
  const [tournamentsList, setTournamentsList] = useState<TournamentDetailDto[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [pendingFraudReportIds, setPendingFraudReportIds] = useState<string[] | null>(null);

  const refreshPendingFraudReports = useCallback(async () => {
    if (!isAuthenticated || user?.role?.toUpperCase() !== 'ADMIN') {
      setPendingFraudReportIds([]);
      return;
    }
    try {
      const reports = await getFraudReports();
      const pendingReports = reports.filter(
        (r) => r.statusCode === 'OPEN' || r.statusCode === 'REVIEWING' || r.statusCode === 'PENDING'
      );
      setPendingFraudReportIds(pendingReports.map((report) => report.id));
    } catch {
      // Keep the last successful count during temporary API failures.
    }
  }, [isAuthenticated, user?.role]);

  useEffect(() => {
    void refreshPendingFraudReports();
    const intervalId = window.setInterval(() => void refreshPendingFraudReports(), 30000);
    const handleUpdate = () => void refreshPendingFraudReports();
    window.addEventListener('fraud-reports-updated', handleUpdate);
    window.addEventListener('focus', handleUpdate);
    return () => {
      window.clearInterval(intervalId);
      window.removeEventListener('fraud-reports-updated', handleUpdate);
      window.removeEventListener('focus', handleUpdate);
    };
  }, [refreshPendingFraudReports]);

  // Protected route guard: Redirect unauthenticated users to login
  useEffect(() => {
    if (isLoading) return;
    if (!isAuthenticated) {
      router.replace('/login');
    }
  }, [isLoading, isAuthenticated, router]);

  // Fetch real tournaments list for switcher (Offline Only, Manager's Tournaments)
  const fetchTournamentsList = useCallback(async (preferredId?: string | null) => {
    if (!isAuthenticated) return;
    try {
      const managerList = await getManagerTournaments().catch(() => []);

      // Load local draft tournaments created by Manager in this session
      const storedDraftsJson = typeof window !== 'undefined' ? localStorage.getItem('local_draft_tournaments') : null;
      const storedDrafts: string[] = storedDraftsJson ? JSON.parse(storedDraftsJson) : [];
      const localDrafts: TournamentDetailDto[] = [];

      for (const id of storedDrafts) {
        if (!managerList.some((t) => t.id === id)) {
          try {
            const draft = await getTournamentById(id);
            if (isOfflineManagerTournament(draft)) {
              localDrafts.push(draft);
            }
          } catch {
            // Ignore if draft deleted
          }
        }
      }

      const combined = [...localDrafts, ...managerList].filter(isOfflineManagerTournament);
      setTournamentsList(combined);

      const targetId = preferredId || (typeof window !== 'undefined' ? localStorage.getItem('newly_created_tournament_id') : null);
      if (typeof window !== 'undefined' && targetId) {
        localStorage.removeItem('newly_created_tournament_id');
      }

      const match = pathname.match(/^\/managertournaments\/([^/]+)/);
      const urlActiveId = match && match[1] !== 'layout' && match[1] !== 'page' && match[1] !== 'async' && match[1] !== 'offline' ? match[1] : null;

      const activeId = targetId || urlActiveId;

      if (activeId && combined.some((t) => t.id === activeId)) {
        setSelectedId(activeId);
        localStorage.setItem('last_managed_tournament_id', activeId);
      } else {
        const stored = localStorage.getItem('last_managed_tournament_id');
        if (stored && combined.some((t) => t.id === stored)) {
          setSelectedId(stored);
        } else if (combined.length > 0) {
          setSelectedId(combined[0].id);
          localStorage.setItem('last_managed_tournament_id', combined[0].id);
        } else {
          setSelectedId(null);
        }
      }
    } catch {
      setTournamentsList([]);
      setSelectedId(null);
    }
  }, [isAuthenticated, pathname]);

  useEffect(() => {
    void fetchTournamentsList();

    const handleCustomUpdate = (e: Event) => {
      const detail = (e as CustomEvent).detail;
      const newId = detail?.id || detail;
      void fetchTournamentsList(typeof newId === 'string' ? newId : null);
    };

    const handleFocus = () => void fetchTournamentsList();
    const handleStorage = () => void fetchTournamentsList();

    window.addEventListener('tournament-list-updated', handleCustomUpdate);
    window.addEventListener('focus', handleFocus);
    window.addEventListener('storage', handleStorage);

    return () => {
      window.removeEventListener('tournament-list-updated', handleCustomUpdate);
      window.removeEventListener('focus', handleFocus);
      window.removeEventListener('storage', handleStorage);
    };
  }, [fetchTournamentsList]);

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Loading Portal...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-slate-50">
        <div className="flex flex-col items-center gap-3">
          <Loader2 className="h-8 w-8 animate-spin text-indigo-600" />
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-widest">Redirecting to login...</p>
        </div>
      </div>
    );
  }

  const userRole = user?.role?.toUpperCase();
  const isAdmin = userRole === 'ADMIN' || userRole === 'ADMINISTRATOR';
  const isManager = userRole === 'MANAGER';

  // Administrators can access both the Admin and Manager portals.
  // Managers can access the Manager portal.
  const isAccessDenied = !isAdmin && !isManager;
  const isAdminRoute = pathname?.startsWith('/admin');
  const isManagerRoute = pathname?.startsWith('/managertournaments');

  if (isAccessDenied) {
    let reasonText = 'You do not have permission to access this page.';
    if (isAdminRoute && userRole === 'MANAGER') {
      reasonText = `The path "${pathname}" is restricted to Administrators (ADMIN). Your account has Manager permissions.`;
    } else if (isManagerRoute && userRole === 'ADMIN') {
      reasonText = `The path "${pathname}" is restricted to Tournament Managers (MANAGER). Your account has Admin permissions.`;
    }

    const destinationPath = userRole === 'ADMIN' ? '/admin' : userRole === 'MANAGER' ? '/managertournaments' : '/';
    const buttonLabel = userRole === 'ADMIN' ? 'Back to Admin Portal' : userRole === 'MANAGER' ? 'Back to Manager Portal' : 'Back to Home';

    return (
      <div className="flex min-h-screen flex-col items-center justify-center bg-slate-900 px-4 text-white">
        <div className="w-full max-w-md rounded-3xl bg-slate-800/80 p-8 border border-slate-700/80 shadow-2xl text-center backdrop-blur-xl space-y-6">
          <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-rose-500/20 text-rose-400 border border-rose-500/30">
            <ShieldAlert className="h-8 w-8" />
          </div>
          <div className="space-y-2">
            <span className="inline-block rounded-full bg-rose-500/20 px-3 py-1 text-[10px] font-black uppercase tracking-widest text-rose-300 border border-rose-500/30">
              403 Forbidden
            </span>
            <h1 className="text-2xl font-black text-white tracking-tight">Access Denied</h1>
            <p className="text-xs text-slate-300 font-medium leading-relaxed pt-1">
              {reasonText}
            </p>
          </div>
          <div className="flex flex-col gap-3 pt-2">
            <button
              onClick={() => router.push(destinationPath)}
              className="w-full py-3 px-4 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-extrabold text-xs shadow-lg transition-all cursor-pointer border-none"
            >
              {buttonLabel}
            </button>
            <button
              onClick={() => logout()}
              className="w-full py-2.5 px-4 rounded-xl bg-slate-700/50 hover:bg-slate-700 text-slate-300 font-semibold text-xs transition-all cursor-pointer border border-slate-600/50"
            >
              Log Out
            </button>
          </div>
        </div>
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
        pendingFraudCount={pendingFraudReportIds?.length ?? 0}
      />
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden bg-slate-50">
        <TopHeader
          selectedTournamentName={selectedTournament?.name}
          pendingFraudReportIds={pendingFraudReportIds}
        />
        <div className="flex-1 overflow-y-auto">
          {children}
        </div>
      </main>
    </div>
  );
}
