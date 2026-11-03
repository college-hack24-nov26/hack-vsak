'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  LayoutDashboard,
  Cpu,
  KeyRound,
  Shield,
  Activity,
  Terminal,
  RefreshCw,
  Zap,
  Clock,
  ArrowRight,
  Layers,
  Settings,
  Loader2,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

interface OverviewData {
  totalRequests: number;
  totalFallbacks: number;
  fallbackRatePercentage: string;
  averageLatencyMs: number;
  activeKeysCount: number;
  configuredVaultCount: number;
  recentLogs: any[];
}

function OverviewContent() {
  const searchParams = useSearchParams();

  const [loading, setLoading] = useState(true);
  const [user, setUser] = useState<any>(null);
  const [currentProject, setCurrentProject] = useState<any>(null);
  const [overview, setOverview] = useState<OverviewData>({
    totalRequests: 0,
    totalFallbacks: 0,
    fallbackRatePercentage: '0.00%',
    averageLatencyMs: 0,
    activeKeysCount: 0,
    configuredVaultCount: 0,
    recentLogs: [],
  });

  const loadData = async () => {
    setLoading(true);
    try {
      const storedUser = authStorage.getUser();
      if (storedUser) setUser(storedUser);

      const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
      if (paramProjectId) {
        authStorage.setProjectId(paramProjectId);
      }

      const storedProject = authStorage.getActiveProject();
      if (storedProject) setCurrentProject(storedProject);

      const [userRes, overviewRes] = await Promise.all([
        fetchApi('/api/v1/auth/me').catch(() => null),
        fetchApi('/api/v1/dashboard/overview').catch(() => null),
      ]);

      if (userRes?.success && userRes.data?.user) {
        setUser(userRes.data.user);
        authStorage.setUser(userRes.data.user);
      }

      if (overviewRes?.success && overviewRes.data) {
        const metrics = overviewRes.data.metrics || overviewRes.data;
        if (overviewRes.data.project) {
          setCurrentProject(overviewRes.data.project);
          authStorage.setActiveProject(overviewRes.data.project);
        }

        setOverview({
          totalRequests: metrics.totalRequests ?? 0,
          totalFallbacks: metrics.totalFallbacks ?? 0,
          fallbackRatePercentage: metrics.fallbackRatePercentage ?? '0.0%',
          averageLatencyMs: metrics.averageLatencyMs ?? 0,
          activeKeysCount: metrics.activeKeysCount ?? 0,
          configuredVaultCount: metrics.configuredVaultCount ?? 0,
          recentLogs: overviewRes.data.recentLogs ?? [],
        });
      }
    } catch (err) {
      console.error('Failed to load dashboard overview data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleProjectChanged = (e: any) => {
      setCurrentProject(e.detail);
      loadData();
    };
    window.addEventListener('oneapi_project_changed', handleProjectChanged);

    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, [searchParams]);

  const activeProjectId = currentProject?._id || currentProject?.id || '';
  const projectQuery = activeProjectId ? `?project=${activeProjectId}` : '';

  return (
    <div className="space-y-6">
      {/* 1. Developer Gateway Hero Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 border border-slate-800 shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="flex flex-col md:flex-row md:items-center justify-between gap-6 relative z-10">
          <div>
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono font-bold tracking-wider uppercase flex items-center gap-1.5">
                <Layers className="w-3 h-3" />
                PROJECT: {currentProject?.name || 'Loading Project...'}
              </span>
              <span className="text-xs text-slate-500 font-mono">
                slug: <span className="text-slate-300">{currentProject?.slug || 'scope'}</span>
              </span>
              <Link
                href="/dashboard/projects"
                className="text-xs text-sky-400 hover:text-sky-300 hover:underline flex items-center gap-1 font-semibold ml-2"
              >
                Switch Project <ArrowRight className="w-3 h-3" />
              </Link>
            </div>

            <h2 className="text-2xl md:text-3xl font-extrabold text-white tracking-tight">
              Welcome back, {user?.name || 'Developer'}!
            </h2>
            <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
              Your reverse proxy gateway for <span className="text-white font-semibold">{currentProject?.name || 'this project'}</span> is operational with zero-downtime automated failover across AI, Music, Weather, News, and Environmental air quality APIs.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2.5 shrink-0">
            <Link
              href={`/dashboard/providers${projectQuery}`}
              className="px-4 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/25 flex items-center gap-1.5 transition-all"
            >
              <Cpu className="w-3.5 h-3.5" /> Configure Providers
            </Link>

            <Link
              href={`/dashboard/keys${projectQuery}`}
              className="px-4 py-2.5 bg-slate-800 hover:bg-slate-700 text-white font-semibold text-xs rounded-xl border border-slate-700 flex items-center gap-1.5 transition-all"
            >
              <KeyRound className="w-3.5 h-3.5" /> API Keys
            </Link>

            <Link
              href={`/dashboard/settings${projectQuery}`}
              className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white font-semibold text-xs rounded-xl border border-slate-800 flex items-center gap-1.5 transition-all"
              title="Project Settings"
            >
              <Settings className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </div>

      {/* 2. Real Telemetry Metric KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Total Proxy Requests */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Proxy Requests</span>
            <div className="w-9 h-9 rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <Activity className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : overview.totalRequests}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-emerald-400 font-medium">Project Scoped</span> &bull; Telemetry Engine
          </div>
        </div>

        {/* Failovers Triggered */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Automated Failovers</span>
            <div className="w-9 h-9 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-400 flex items-center justify-center">
              <Zap className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : overview.totalFallbacks}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-amber-400 font-medium">{overview.fallbackRatePercentage}</span> rate &bull; Zero downtime
          </div>
        </div>

        {/* Developer API Keys */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Project API Keys</span>
            <div className="w-9 h-9 rounded-xl bg-violet-500/10 border border-violet-500/20 text-violet-400 flex items-center justify-center">
              <KeyRound className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : overview.activeKeysCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-violet-400 font-medium">Active Scopes</span> &bull; Client SDK Tokens
          </div>
        </div>

        {/* AES-256 Vault Credentials */}
        <div className="p-5 rounded-2xl bg-[#111827] border border-slate-800 shadow-lg">
          <div className="flex items-center justify-between mb-3">
            <span className="text-xs font-semibold text-slate-400 uppercase tracking-wider">Vault Credentials</span>
            <div className="w-9 h-9 rounded-xl bg-sky-500/10 border border-sky-500/20 text-sky-400 flex items-center justify-center">
              <Shield className="w-4 h-4" />
            </div>
          </div>
          <div className="text-3xl font-extrabold text-white">
            {loading ? '...' : overview.configuredVaultCount}
          </div>
          <div className="text-[11px] text-slate-500 mt-2 flex items-center gap-1.5">
            <span className="text-sky-400 font-medium">AES-256-GCM</span> &bull; Upstream provider keys
          </div>
        </div>
      </div>

      {/* 3. Real Gateway Activity & Telemetry Table */}
      <div className="p-6 rounded-2xl bg-[#111827] border border-slate-800 shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Activity className="w-4 h-4 text-sky-400" />
              Live Gateway Logs & Telemetry
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Real proxy requests handled by OneAPI for <span className="text-slate-200 font-semibold">{currentProject?.name}</span>.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 border border-slate-800 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1.5 text-xs"
            title="Refresh Logs"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {overview.recentLogs.length === 0 ? (
          <div className="text-center py-14 border border-dashed border-slate-800 rounded-xl">
            <Terminal className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-medium text-slate-400">No gateway proxy requests logged yet for this project.</p>
            <p className="text-[11px] text-slate-600 mt-1 max-w-md mx-auto">
              Execute a query via{' '}
              <Link href={`/dashboard/providers${projectQuery}`} className="text-sky-400 hover:underline">
                API Providers Live Tester
              </Link>{' '}
              to see real-time telemetry here.
            </p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-800 text-slate-400 uppercase text-[10px] tracking-wider font-semibold">
                  <th className="pb-3">Timestamp</th>
                  <th className="pb-3">Category</th>
                  <th className="pb-3">Endpoint</th>
                  <th className="pb-3">Provider</th>
                  <th className="pb-3">Status</th>
                  <th className="pb-3">Latency</th>
                  <th className="pb-3">Failover</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800 font-mono">
                {overview.recentLogs.map((log: any) => (
                  <tr key={log._id || Math.random()} className="hover:bg-slate-900/50 transition-colors">
                    <td className="py-2.5 text-slate-500 text-[11px]">
                      {new Date(log.createdAt).toLocaleTimeString()}
                    </td>
                    <td className="py-2.5 text-slate-300 capitalize">{log.category}</td>
                    <td className="py-2.5 text-sky-400 font-semibold">{log.endpoint}</td>
                    <td className="py-2.5 text-amber-300">{log.finalProvider}</td>
                    <td className="py-2.5">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          log.statusCode < 400
                            ? 'bg-emerald-500/10 text-emerald-400'
                            : 'bg-rose-500/10 text-rose-400'
                        }`}
                      >
                        {log.statusCode}
                      </span>
                    </td>
                    <td className="py-2.5 text-slate-400">{log.latencyMs}ms</td>
                    <td className="py-2.5">
                      {log.fallbackTriggered ? (
                        <span className="px-2 py-0.5 rounded bg-amber-500/10 text-amber-400 text-[10px] font-bold">
                          Triggered
                        </span>
                      ) : (
                        <span className="text-slate-600 text-[10px]">Direct</span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

export default function OverviewPage() {
  return (
    <Suspense
      fallback={
        <div className="py-12 flex flex-col items-center justify-center gap-3 text-slate-500 text-xs">
          <Loader2 className="w-6 h-6 animate-spin text-sky-400" />
          <span>Loading project overview...</span>
        </div>
      }
    >
      <OverviewContent />
    </Suspense>
  );
}
