'use client';

import React, { useEffect, useState, useRef, Suspense } from 'react';
import Link from 'next/link';
import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import {
  FolderGit2,
  LayoutDashboard,
  Cpu,
  KeyRound,
  Sliders,
  Settings,
  UserCircle,
  Menu,
  ChevronLeft,
  ChevronRight,
  LogOut,
  ChevronDown,
  Plus,
  Layers,
  CheckCircle2,
  X,
  Loader2,
  Search,
  ArrowLeft,
  ShieldCheck,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface ProjectNavItem {
  slug: string;
  label: string;
  icon: React.ReactNode;
}

// Strictly the 5 project-scoped items requested by user
const PROJECT_SIDEBAR_ITEMS: ProjectNavItem[] = [
  { slug: '', label: 'Overview', icon: <LayoutDashboard className="w-4 h-4" /> },
  { slug: 'providers', label: 'API Providers', icon: <Cpu className="w-4 h-4" /> },
  { slug: 'routing', label: 'Routing & Failover', icon: <Sliders className="w-4 h-4" /> },
  { slug: 'keys', label: 'API Keys', icon: <KeyRound className="w-4 h-4" /> },
  { slug: 'settings', label: 'Settings', icon: <Settings className="w-4 h-4" /> },
];

function DashboardLayoutContent({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const pathname = usePathname();
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
    if (cachedUser) setUser(cachedUser);

    const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
    const cachedProject = authStorage.getActiveProject();
    if (cachedProject) {
      setActiveProject(cachedProject);
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

  const activeProjectId = activeProject?._id || activeProject?.id || '';

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
    <div className="flex h-screen bg-[#090d16] text-slate-100 overflow-hidden font-sans">
      {/* ------------------------------------------------------------- */}
      {/* 1. PROJECT SIDEBAR (STRICTLY 5 ITEMS)                         */}
      {/* ------------------------------------------------------------- */}
      <aside
        className={`fixed inset-y-0 left-0 z-50 flex flex-col bg-[#0b0f19] border-r border-slate-800/80 transition-all duration-300 ease-in-out md:static ${
          sidebarCollapsed ? 'w-20' : 'w-64'
        } ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full md:translate-x-0'}`}
      >
        {/* Brand & Back to Projects Button */}
        <div className="h-16 flex items-center justify-between px-4 border-b border-slate-800/80 shrink-0">
          <Link
            href="/dashboard/projects"
            className="flex items-center gap-2 text-xs font-semibold text-slate-400 hover:text-white transition-colors group"
            title="Return to Projects List"
          >
            <div className="w-7 h-7 rounded-lg bg-slate-900 group-hover:bg-slate-800 border border-slate-800 flex items-center justify-center text-slate-300 group-hover:text-white transition-colors">
              <ArrowLeft className="w-3.5 h-3.5" />
            </div>
            {!sidebarCollapsed && <span className="truncate">All Projects</span>}
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

        {/* Project Scope Badge in Sidebar */}
        {!sidebarCollapsed && activeProject && (
          <div className="p-3 border-b border-slate-800/60 bg-[#0d1322]/50">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0">
                {activeProject.name.slice(0, 2).toUpperCase()}
              </div>
              <div className="overflow-hidden">
                <div className="text-xs font-bold text-white truncate">{activeProject.name}</div>
                <div className="text-[10px] font-mono text-slate-500 truncate">slug: {activeProject.slug}</div>
              </div>
            </div>
          </div>
        )}

        {/* 5 Project Navigation Items */}
        <nav className="flex-1 px-3 py-4 space-y-1.5 overflow-y-auto">
          {PROJECT_SIDEBAR_ITEMS.map((item) => {
            const itemPath = item.slug ? `/dashboard/${item.slug}` : '/dashboard';
            const isActive =
              item.slug === ''
                ? pathname === '/dashboard'
                : pathname === itemPath || pathname.startsWith(`${itemPath}/`);

            const projectQuery = activeProjectId ? `?project=${activeProjectId}` : '';
            const href = `${itemPath}${projectQuery}`;

            return (
              <Link
                key={item.label}
                href={href}
                onClick={() => setMobileMenuOpen(false)}
                className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-xs font-semibold cursor-pointer transition-all ${
                  isActive
                    ? 'bg-sky-500/15 text-sky-400 border border-sky-500/30 shadow-sm shadow-sky-500/10 font-bold'
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
              <Link href="/dashboard/profile" className="flex items-center gap-2.5 overflow-hidden flex-1 group">
                <div className="w-8 h-8 rounded-lg bg-sky-500/20 text-sky-400 flex items-center justify-center font-bold text-xs shrink-0 group-hover:bg-sky-500/30 transition-colors">
                  {user?.name ? user.name.slice(0, 2).toUpperCase() : 'DV'}
                </div>
                <div className="overflow-hidden text-left">
                  <div className="text-xs font-semibold text-white group-hover:text-sky-300 truncate transition-colors">
                    {user?.name || 'Developer'}
                  </div>
                  <div className="text-[10px] text-slate-400 truncate">Profile & Settings</div>
                </div>
              </Link>

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
      {/* 2. PROJECT MAIN CONTENT WITH HEADER SWITCHER                  */}
      {/* ------------------------------------------------------------- */}
      <div className="flex-1 flex flex-col h-full overflow-hidden bg-[#090d16]">
        {/* Top Header Bar */}
        <header className="h-16 border-b border-slate-800/80 bg-[#0f172a]/70 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between shrink-0 z-20">
          <div className="flex items-center gap-3">
            {/* Mobile Menu Button */}
            <button
              onClick={() => setMobileMenuOpen(true)}
              className="md:hidden p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
            >
              <Menu className="w-5 h-5" />
            </button>

            {/* Vercel-Style Breadcrumb & Project Switcher */}
            <div className="flex items-center gap-2 text-xs sm:text-sm font-medium">
              <Link
                href="/dashboard/projects"
                className="text-slate-400 hover:text-white flex items-center gap-1.5 transition-colors"
                title="View All Projects"
              >
                <span className="w-6 h-6 rounded-lg bg-gradient-to-tr from-sky-500 to-blue-600 text-white font-bold text-[11px] flex items-center justify-center shadow-sm shadow-sky-500/20">
                  {user?.name ? user.name.slice(0, 1).toUpperCase() : 'O'}
                </span>
                <span className="hidden sm:inline font-semibold">Projects</span>
              </Link>

              <span className="text-slate-600 font-light text-base select-none">/</span>

              {/* Active Project Switcher Dropdown */}
              <div className="relative" ref={dropdownRef}>
                <button
                  onClick={() => setProjectDropdownOpen(!projectDropdownOpen)}
                  className="flex items-center gap-2 px-2.5 py-1.5 rounded-xl bg-slate-900/90 hover:bg-slate-850 border border-slate-800 text-xs font-bold text-white transition-all cursor-pointer shadow-sm"
                >
                  <Layers className="w-3.5 h-3.5 text-sky-400 shrink-0" />
                  <span className="max-w-[110px] sm:max-w-[180px] truncate">
                    {activeProject?.name || 'Select Project'}
                  </span>
                  <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${projectDropdownOpen ? 'rotate-180' : ''}`} />
                </button>

                {/* Dropdown Menu */}
                {projectDropdownOpen && (
                  <div className="absolute left-0 mt-2 w-72 rounded-2xl bg-[#0f172a] border border-slate-800 shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150">
                    <div className="px-2 pb-2">
                      <div className="relative">
                        <Search className="w-3.5 h-3.5 text-slate-500 absolute left-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
                        <input
                          type="text"
                          placeholder="Search projects..."
                          value={projectSearch}
                          onChange={(e) => setProjectSearch(e.target.value)}
                          className="w-full pl-8 pr-3 py-1.5 bg-slate-900 border border-slate-800 rounded-lg text-xs text-slate-200 placeholder:text-slate-500 focus:outline-none focus:border-sky-500/50"
                        />
                      </div>
                    </div>

                    <div className="px-2 py-1 text-[10px] uppercase font-mono font-bold tracking-wider text-slate-500">
                      Projects ({filteredProjectsDropdown.length})
                    </div>

                    <div className="max-h-60 overflow-y-auto space-y-1 py-1">
                      {filteredProjectsDropdown.map((p) => {
                        const isCurrent = activeProject?._id === p._id;
                        return (
                          <button
                            key={p._id}
                            onClick={() => handleSelectProject(p)}
                            className={`w-full text-left px-2.5 py-2 rounded-xl text-xs flex items-center justify-between transition-colors ${
                              isCurrent
                                ? 'bg-sky-500/15 text-sky-300 font-bold border border-sky-500/30'
                                : 'text-slate-300 hover:bg-slate-850/80 hover:text-white'
                            }`}
                          >
                            <div className="truncate pr-2">
                              <div className="truncate font-semibold">{p.name}</div>
                              <div className="text-[10px] font-mono text-slate-500 truncate">slug: {p.slug}</div>
                            </div>
                            {isCurrent && <CheckCircle2 className="w-4 h-4 text-sky-400 shrink-0" />}
                          </button>
                        );
                      })}
                    </div>

                    <div className="mt-1.5 pt-1.5 border-t border-slate-800/80 space-y-1">
                      <Link
                        href="/dashboard/projects"
                        onClick={() => setProjectDropdownOpen(false)}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-slate-300 hover:text-white hover:bg-slate-800/70 flex items-center gap-2 font-medium"
                      >
                        <FolderGit2 className="w-3.5 h-3.5 text-slate-400" />
                        <span>All Projects Portal</span>
                      </Link>

                      <button
                        onClick={() => {
                          setProjectDropdownOpen(false);
                          setIsCreateModalOpen(true);
                        }}
                        className="w-full text-left px-2.5 py-1.5 rounded-xl text-xs text-sky-400 hover:bg-sky-500/10 flex items-center gap-2 font-semibold transition-colors"
                      >
                        <Plus className="w-3.5 h-3.5" />
                        <span>Create New Project</span>
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Right Action Icons & Status */}
          <div className="flex items-center gap-2.5 sm:gap-3">
            <Link
              href="/dashboard/projects"
              className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold transition-all"
            >
              <FolderGit2 className="w-3.5 h-3.5 text-sky-400" />
              <span>Projects</span>
            </Link>

            <Link
              href="/dashboard/profile"
              className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white transition-colors"
              title="Developer Profile"
            >
              <UserCircle className="w-4 h-4 text-sky-400" />
            </Link>

            <div className="flex items-center gap-2 text-xs font-semibold px-2.5 py-1.5 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="hidden sm:inline">Active Scope</span>
            </div>
          </div>
        </header>

        {/* Dynamic Page Body */}
        <main className="flex-1 overflow-y-auto p-4 sm:p-6 md:p-8 space-y-6">
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
