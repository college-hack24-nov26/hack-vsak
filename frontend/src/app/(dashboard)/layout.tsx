
'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  Activity,
  BookOpen,
  ChevronLeft,
  ChevronRight,
  Cpu,
  KeyRound,
  LayoutDashboard,
  LogOut,
  Menu,
  Moon,
  Settings,
  ShieldCheck,
  SlidersHorizontal,
  Sparkles,
  Sun,
  UserCircle,
  X,
} from 'lucide-react';
import { useThemeMode } from '../components/ThemeProvider';
import { authStorage, fetchApi } from '@/lib/api';

interface ProjectNavItem {
  slug: string;
  label: string;
  icon: React.ReactNode;
}

const NAV_ITEMS: NavItem[] = [
  {
    href: '/dashboard',
    label: 'Overview',
    icon: <LayoutDashboard />,
  },
  {
    href: '/dashboard/providers',
    label: 'API Providers',
    icon: <Cpu />,
  },
  {
    href: '/dashboard/routing',
    label: 'Routing & Failover',
    icon: <SlidersHorizontal />,
  },
  {
    href: '/dashboard/examples',
    label: 'Live Examples',
    icon: <Sparkles />,
  },
  {
    href: '/dashboard/keys',
    label: 'API Keys',
    icon: <KeyRound />,
  },
  {
    href: '/dashboard/docs',
    label: 'Documentation',
    icon: <BookOpen />,
  },
  {
    href: '/dashboard/profile',
    label: 'Profile',
    icon: <UserCircle />,
  },
  {
    href: '/dashboard/settings',
    label: 'Settings',
    icon: <Settings />,
  },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
 const { theme, toggleTheme } = useThemeMode();
  const searchParams = useSearchParams();

  const [mounted, setMounted] = useState(false);
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [user, setUser] = useState<any>(null);

  // Projects State
  const [projects, setProjects] = useState<any[]>([]);
  const [activeProject, setActiveProject] = useState<any>(null);
  const [projectDropdownOpen, setProjectDropdownOpen] = useState(false);
  const [projectSearch, setProjectSearch] = useState('');
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Quick Create Modal State
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newProjectName, setNewProjectName] = useState('');
  const [isCreatingProject, setIsCreatingProject] = useState(false);

  // Is current view at Workspace level (no sidebar) or Project level (with 5-item sidebar)
  const isWorkspaceLevel =
    pathname === '/dashboard/projects' ||
    pathname === '/dashboard/profile';

  const loadProjectsList = async () => {
    try {
      const res = await fetchApi('/api/v1/projects');
      if (res.success && res.data?.projects) {
        setProjects(res.data.projects);

        // Check if query param or storage has active project
        const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
        const storedActive = authStorage.getActiveProject();
        const targetId = paramProjectId || storedActive?._id;

        if (targetId) {
          const match = res.data.projects.find((p: any) => p._id === targetId || p.id === targetId);
          if (match) {
            setActiveProject(match);
            authStorage.setActiveProject(match);
            return;
          }
        }

        // If on a project page but no project selected, redirect to workspace projects portal
        if (!targetId && !isWorkspaceLevel) {
          router.push('/dashboard/projects');
        }
      }
    } catch (err) {
      console.error('Failed to load projects list:', err);
    }
  };

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
    if (cachedUser) setUser(cachedUser);

    const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
    const cachedProject = authStorage.getActiveProject();
    if (cachedProject) {
      setActiveProject(cachedProject);
    }

    fetchApi('/api/v1/auth/me')
      .then((res) => {
        if (res.success && res.data?.user) {
          setUser(res.data.user);
          authStorage.setUser(res.data.user);
        }
      })
      .catch((err) => {
        console.error('Failed to load user profile:', err);
      });

    loadProjectsList();

    // Listen to project changed events
    const handleProjectChanged = (e: any) => {
      const p = e.detail;
      setActiveProject(p);
    };
    window.addEventListener('oneapi_project_changed', handleProjectChanged);

    // Close dropdown on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setProjectDropdownOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);

    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [router, pathname, searchParams]);

  const handleSelectProject = (project: any) => {
    authStorage.setActiveProject(project);
    setActiveProject(project);
    setProjectDropdownOpen(false);
    window.dispatchEvent(new CustomEvent('oneapi_project_changed', { detail: project }));

    const projId = project._id || project.id;
    router.push(`/dashboard?project=${projId}`);
  };

  const handleQuickCreateProject = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProjectName.trim()) return;

    setIsCreatingProject(true);
    try {
      const res = await fetchApi('/api/v1/projects', {
        method: 'POST',
        body: JSON.stringify({ name: newProjectName.trim() }),
      });

      if (res.success && res.data?.project) {
        const created = res.data.project;
        setProjects((prev) => [created, ...prev]);
        handleSelectProject(created);
        setIsCreateModalOpen(false);
        setNewProjectName('');
      } else {
        alert(res.error?.message || 'Failed to create project');
      }
    } catch (err: any) {
      alert(err.message || 'Error creating project');
    } finally {
      setIsCreatingProject(false);
    }
  };

  const handleLogout = async () => {
    try {
      await fetchApi('/api/v1/auth/logout', {
        method: 'POST',
      });
    } catch {
      // Continue with local logout.
    }

    authStorage.clear();
    router.push('/login');
  };

  if (!mounted) {
    return (
      <div className="dashboard-loading">
        <div className="dashboard-loading-logo">⚡</div>
        <p>Initializing OneAPI workspace...</p>
      </div>
    );
  }

  const currentNavItem = NAV_ITEMS.find((item) =>
    item.href === '/dashboard'
      ? pathname === '/dashboard'
      : pathname.startsWith(item.href),
  );

  const pageTitle = currentNavItem?.label || 'Developer Gateway';

  const initials = user?.name
    ? user.name
        .trim()
        .split(/\s+/)
        .slice(0, 2)
        .map((part: string) => part[0])
        .join('')
        .toUpperCase()
    : 'DV';

  // Filter projects inside dropdown
  const filteredProjectsDropdown = projects.filter(
    (p) =>
      p.name.toLowerCase().includes(projectSearch.toLowerCase()) ||
      p.slug.toLowerCase().includes(projectSearch.toLowerCase())
  );

  // =========================================================================
  // VIEW 1: WORKSPACE LEVEL (NO SIDEBAR - ONLY HEADER)
  // Used on /dashboard/projects and /dashboard/profile
  // =========================================================================
  if (isWorkspaceLevel) {
    return (
      <div className="min-h-screen bg-[#090d16] text-slate-100 flex flex-col font-sans">
        {/* Workspace Clean Top Header Only (NO SIDEBAR) */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0b0f19]/80 backdrop-blur-md px-6 flex items-center justify-between shrink-0 sticky top-0 z-30">
          <div className="flex items-center gap-6">
            {/* Brand Logo */}
            <Link href="/dashboard/projects" className="flex items-center gap-2.5">
              <span className="w-8 h-8 rounded-xl bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-base shadow-md shadow-sky-500/20">
                ⚡
              </span>
              <span className="text-lg font-bold tracking-tight text-white">
                One<span className="text-sky-400">API</span>
              </span>
            </Link>

            {/* Header Navigation */}
            <nav className="flex items-center gap-2">
              <Link
                href="/dashboard/projects"
                className={`px-3 py-1.5 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors ${
                  pathname === '/dashboard/projects'
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30'
                    : 'text-slate-400 hover:text-white hover:bg-slate-800/60'
                }`}
              >
                <FolderGit2 className="w-3.5 h-3.5" />
                <span>Projects</span>
              </Link>
            </nav>
          </div>

          {/* Right Actions: Create Project, Profile, Logout */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsCreateModalOpen(true)}
              className="px-3.5 py-1.5 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-md shadow-sky-600/20 transition-all cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>New Project</span>
            </button>

            <Link
              href="/dashboard/profile"
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl text-xs font-semibold border transition-all ${
                pathname === '/dashboard/profile'
                  ? 'bg-sky-500/15 text-sky-300 border-sky-500/40 shadow-sm'
                  : 'bg-slate-900 border-slate-800 text-slate-300 hover:text-white hover:bg-slate-800'
              }`}
            >
              <div className="w-5 h-5 rounded-md bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-[10px]">
                {user?.name ? user.name.slice(0, 1).toUpperCase() : 'U'}
              </div>
              <span className="hidden sm:inline">{user?.name || 'Profile'}</span>
            </Link>

            <button
              onClick={handleLogout}
              className="p-2 text-slate-400 hover:text-rose-400 hover:bg-rose-500/10 rounded-xl cursor-pointer transition-colors"
              title="Sign Out"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>
        </header>

        {/* Main Content Area (Full Width, Centered) */}
        <main className="flex-1 p-6 md:p-8 max-w-7xl mx-auto w-full">
          {children}
        </main>

        {/* Modal: Quick Create Project */}
        {isCreateModalOpen && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-bold text-white flex items-center gap-2">
                  <Layers className="w-4 h-4 text-sky-400" />
                  Create New Project
                </h3>
                <button
                  onClick={() => setIsCreateModalOpen(false)}
                  className="text-slate-500 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <form onSubmit={handleQuickCreateProject} className="space-y-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-1.5">
                    Project Name
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Chatbot Router, Mobile Backend"
                    value={newProjectName}
                    onChange={(e) => setNewProjectName(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/60"
                  />
                </div>

                <div className="flex items-center justify-end gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setIsCreateModalOpen(false)}
                    className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isCreatingProject}
                    className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 disabled:opacity-50 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
                  >
                    {isCreatingProject ? (
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    ) : (
                      <Plus className="w-3.5 h-3.5" />
                    )}
                    <span>Create Project</span>
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    );
  }

  // =========================================================================
  // VIEW 2: PROJECT LEVEL (WITH 5-ITEM SIDEBAR & SEARCH PARAMS)
  // Shows only: Overview, API Providers, Routing & Failover, API Keys, Settings
  // =========================================================================
  return (
    <div className="dashboard-shell">

      {/* Mobile backdrop */}
      {mobileMenuOpen && (
        <button
          type="button"
          aria-label="Close navigation"
          onClick={() => setMobileMenuOpen(false)}
          className="dashboard-backdrop"
        />
      )}

      {/* Sidebar */}
      <aside
        className={`dashboard-sidebar ${
          sidebarCollapsed ? 'is-collapsed' : ''
        } ${mobileMenuOpen ? 'mobile-open' : ''}`}
      >
        {/* Brand */}
        <div className="dashboard-brand">
          <Link href="/dashboard" className="dashboard-brand-link">
            <span className="dashboard-brand-mark">⚡</span>

            {!sidebarCollapsed && (
              <span className="dashboard-brand-name">
                One<span>API</span>
              </span>
            )}
          </Link>

          <button
            type="button"
            className="dashboard-icon-button sidebar-collapse"
            onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
            title={sidebarCollapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          >
            {sidebarCollapsed ? (
              <ChevronRight size={17} />
            ) : (
              <ChevronLeft size={17} />
            )}
          </button>

          <button
            type="button"
            className="dashboard-icon-button mobile-close"
            onClick={() => setMobileMenuOpen(false)}
            aria-label="Close sidebar"
          >
            <X size={19} />
          </button>
        </div>

        {/* Navigation */}
        <div className="dashboard-nav-section">
          {!sidebarCollapsed && (
            <p className="dashboard-nav-label">WORKSPACE</p>
          )}

          <nav className="dashboard-navigation">
            {NAV_ITEMS.map((item) => {
              const isActive =
                item.href === '/dashboard'
                  ? pathname === '/dashboard'
                  : pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  onClick={() => setMobileMenuOpen(false)}
                  title={sidebarCollapsed ? item.label : undefined}
                  className={`dashboard-nav-link ${
                    isActive ? 'active' : ''
                  }`}
                >
                  <span className="dashboard-nav-icon">
                    {item.icon}
                  </span>

                  {!sidebarCollapsed && (
                    <span className="dashboard-nav-text">
                      {item.label}
                    </span>
                  )}

                  {isActive && !sidebarCollapsed && (
                    <span className="dashboard-nav-indicator" />
                  )}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Sidebar bottom */}
        <div className="dashboard-sidebar-bottom">
          <div className="dashboard-sidebar-status">
            <span className="dashboard-status-indicator" />
            {!sidebarCollapsed && (
              <span>All systems operational</span>
            )}
          </div>

          <div className="dashboard-user">
            <div className="dashboard-avatar">{initials}</div>

            {!sidebarCollapsed && (
              <div className="dashboard-user-info">
                <p className="dashboard-user-name">
                  {user?.name || 'Developer'}
                </p>
                <p className="dashboard-user-email">
                  {user?.email || 'dev@oneapi.io'}
                </p>
              </div>
            )}

            <button
              type="button"
              className="dashboard-logout"
              onClick={handleLogout}
              title="Sign out"
              aria-label="Sign out"
            >
              <LogOut size={17} />
            </button>
          </div>
        </div>
      </aside>

      {/* Main content */}
      <div className="dashboard-main">

        {/* Header */}
        <header className="dashboard-topbar">
          <div className="dashboard-topbar-left">
            <button
              type="button"
              className="dashboard-icon-button mobile-menu"
              onClick={() => setMobileMenuOpen(true)}
              aria-label="Open navigation"
            >
              <Menu size={20} />
            </button>

            <div>
              <div className="dashboard-breadcrumb">
                <span>Workspace</span>
                <span className="breadcrumb-separator">/</span>
                <span className="breadcrumb-current">{pageTitle}</span>
              </div>

              <h1 className="dashboard-page-title">{pageTitle}</h1>
            </div>
          </div>

          <div className="dashboard-topbar-actions">

            {/* Theme button */}
       <button
  type="button"
  className="dashboard-theme-button"
  onClick={toggleTheme}
  title={`Switch to ${theme === 'dark' ? 'light' : 'dark'} mode`}
  aria-label="Toggle theme"
>
  {theme === 'dark' ? (
    <Sun size={18} />
  ) : (
    <Moon size={18} />
  )}
</button>

            <div className="dashboard-workspace-badge">
              <ShieldCheck size={15} />
              <span>Developer Workspace</span>
            </div>

            <div className="dashboard-gateway-status">
              <span className="dashboard-status-indicator" />
              <span>Gateway Online</span>
            </div>
          </div>
        </header>

        {/* Page content */}
        <main className="dashboard-page-content">
          {children}
        </main>
      </div>

      {/* Quick Create Project Modal from Header */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#0f172a] border border-slate-800 rounded-2xl w-full max-w-md shadow-2xl p-6 space-y-4 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white flex items-center gap-2">
                <Layers className="w-4 h-4 text-sky-400" />
                New Project
              </h3>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-500 hover:text-white"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleQuickCreateProject} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-400 uppercase tracking-wider mb-1">
                  Project Name
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Chatbot Router, Mobile Backend"
                  value={newProjectName}
                  onChange={(e) => setNewProjectName(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-900 border border-slate-800 rounded-xl text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-sky-500/50"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-3 py-1.5 rounded-lg text-xs font-semibold text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isCreatingProject}
                  className="px-4 py-2 rounded-xl bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs flex items-center gap-1.5 shadow-lg shadow-sky-600/20"
                >
                  {isCreatingProject ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <Plus className="w-3.5 h-3.5" />
                  )}
                  <span>Create Project</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-[#090d16] flex items-center justify-center text-slate-400 text-sm">
          <div className="flex flex-col items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 flex items-center justify-center text-white font-black text-base animate-pulse">
              ⚡
            </div>
            <p>Loading Workspace...</p>
          </div>
        </div>
      }
    >
      <DashboardLayoutContent>{children}</DashboardLayoutContent>
    </Suspense>
  );
}
