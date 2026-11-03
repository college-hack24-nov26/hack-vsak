'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  KeyRound,
  BookOpen,
  UserCircle,
  Settings,
  Sliders,
  Sparkles,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  Radio,
  ShieldCheck,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface NavItem {
  href: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  { href: '/dashboard', label: 'Overview', icon: <LayoutDashboard className="w-5 h-5" /> },
  { href: '/dashboard/providers', label: 'API Providers', icon: <Cpu className="w-5 h-5" /> },
  { href: '/dashboard/routing', label: 'Routing & Failover', icon: <Sliders className="w-5 h-5" /> },
  { href: '/dashboard/examples', label: 'Live Examples', icon: <Sparkles className="w-5 h-5" /> },
  { href: '/dashboard/keys', label: 'API Keys', icon: <KeyRound className="w-5 h-5" /> },
  { href: '/dashboard/docs', label: 'Documentation', icon: <BookOpen className="w-5 h-5" /> },
  { href: '/dashboard/profile', label: 'Profile', icon: <UserCircle className="w-5 h-5" /> },
  { href: '/dashboard/settings', label: 'Settings', icon: <Settings className="w-5 h-5" /> },
];

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();

  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  useEffect(() => {
    setMounted(true);
    const token = authStorage.getToken();
    if (!token) {
      router.push('/login');
      return;
    }

    const cachedUser = authStorage.getUser();
    if (cachedUser) {
      setUser(cachedUser);
    }

    // Refresh profile in background
    fetchApi('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          authStorage.setUser(res.data.user);
        }
      })
      .catch((err) => {
        console.error('Failed to load user profile in layout:', err);
      });
  }, [router]);

  const handleLogout = async () => {
    try {
      await fetchApi('/api/v1/auth/logout', { method: 'POST' });
    } catch (e) {
      // Ignore
    }
    authStorage.clear();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-base animate-pulse">
            ⚡
          </div>
          <p>Initializing OneAPI Environment...</p>
        </div>
      </div>
    );
  }

  // Determine current page title
  const currentNavItem = NAV_ITEMS.find((item) =>
    item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href)
  );
  const pageTitle = currentNavItem ? currentNavItem.label : 'Developer Gateway';

  return (
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. RESPONSIVE COLLAPSIBLE SIDEBAR                             */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-all duration-300 ease-in-out md:static ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand Header */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <Link href="/dashboard" className="flex items-center gap-2.5 overflow-hidden">
            <span className="w-9 h-9 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-lg shadow-md shadow-sky-500/20 shrink-0">
              ⚡
            </span>
            {!sidebarCollapsed && (
              <span className="text-xl font-bold tracking-tight text-white whitespace-nowrap">
                One<span className="text-sky-400">API</span>
              </span>
            )}
          </Link>

          {/* Desktop Collapse Toggle */}
          <button
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            className="hidden md:flex p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800/60 cursor-pointer transition-colors"
            title={sidebarCollapsed ? 'Expand Sidebar' : 'Collapse Sidebar'}
          >
            {sidebarCollapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
          </button>

          {/* Mobile Close Button */}
          <button
            onClick={() => setMobileMenuOpen(false)}
            className="md:hidden p-1.5 text-slate-400 hover:text-white"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {NAV_ITEMS.map((item) => {
            const isActive =
              item.href === '/dashboard' ? pathname === '/dashboard' : pathname.startsWith(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-850/60 border border-transparent'
                } ${sidebarCollapsed ? 'justify-center px-0' : ''}`}
                title={sidebarCollapsed ? item.label : undefined}
              >
                <span className="shrink-0">{item.icon}</span>
                {!sidebarCollapsed && <span className="truncate">{item.label}</span>}
              </Link>
            );
          })}
        </nav>

        {/* User Mini Profile & Logout */}
        <div className="p-3 border-t border-slate-800/80 bg-[#090d16]/60 shrink-0">
          {!sidebarCollapsed ? (
            <div className="flex items-center justify-between gap-2 p-2 rounded-xl bg-slate-900/60 border border-slate-800">
              <div className="flex items-center gap-2.5 overflow-hidden">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DV'}
                </div>
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-semibold text-white truncate">{user?.name || 'Developer'}</div>
                  <div className="text-[10px] text-slate-400 truncate">{user?.email || 'dev@oneapi.io'}</div>
                </div>
              </div>

              <button
                onClick={handleLogout}
                className="p-1.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                title="Sign Out"
              >
                <LogOut className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-center p-2.5 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-5 h-5" />
            </button>
          )}
        </div>
      </aside>

      {/* Mobile Backdrop */}
      {mobileMenuOpen && (
        <div
          onClick={() => setMobileMenuOpen(false)}
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
        />
      )}

      {/* ------------------------------------------------------------- */}
      {/* 2. MAIN CONTENT AREA                                          */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090d16]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md px-6 flex items-center justify-between shrink-0 z-10">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Current Page Heading */}
            <h1 className="text-lg font-bold text-white capitalize tracking-tight flex items-center gap-2">
              <span>{pageTitle}</span>
            </h1>
          </div>

          {/* Status & Developer Pill */}
          <div className="flex items-center gap-3">
            <div className="hidden sm:flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-sky-500/10 border border-sky-500/20 text-sky-400">
              <ShieldCheck className="w-3.5 h-3.5" />
              Developer Workspace
            </div>

            <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              Gateway 99.9% Uptime
            </div>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto p-6 md:p-8 space-y-6">
          {children}
        </main>
      </div>
    </div>
  );
}
