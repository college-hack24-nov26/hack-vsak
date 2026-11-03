'use client';

import React, { useState, useEffect, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Cpu,
  Shield,
  Key,
  Play,
  Trash2,
  Sliders,
  CheckCircle2,
  Lock,
  Eye,
  EyeOff,
  RefreshCw,
  ExternalLink,
  Zap,
  Check,
  Ban,
  ChevronDown,
  ArrowRight,
  Loader2,
} from 'lucide-react';
import { fetchApi, authStorage } from '@/lib/api';
import { PROVIDERS_CATALOG, ProviderCatalogItem, Category } from '@/lib/providersCatalog';

const CATEGORY_THEMES: Record<
  Category,
  {
    badge: string;
    text: string;
    glow: string;
    iconBg: string;
  }
> = {
  ai: {
    badge: 'bg-violet-500/15 text-violet-300',
    text: 'text-violet-400',
    glow: 'from-violet-500/10 to-indigo-500/5',
    iconBg: 'bg-violet-950/40 text-violet-300',
  },
  weather: {
    badge: 'bg-sky-500/15 text-sky-300',
    text: 'text-sky-400',
    glow: 'from-sky-500/10 to-blue-500/5',
    iconBg: 'bg-sky-950/40 text-sky-300',
  },
  music: {
    badge: 'bg-pink-500/15 text-pink-300',
    text: 'text-pink-400',
    glow: 'from-pink-500/10 to-rose-500/5',
    iconBg: 'bg-pink-950/40 text-pink-300',
  },
  news: {
    badge: 'bg-amber-500/15 text-amber-300',
    text: 'text-amber-400',
    glow: 'from-amber-500/10 to-orange-500/5',
    iconBg: 'bg-amber-950/40 text-amber-300',
  },
  environment: {
    badge: 'bg-emerald-500/15 text-emerald-300',
    text: 'text-emerald-400',
    glow: 'from-emerald-500/10 to-teal-500/5',
    iconBg: 'bg-emerald-950/40 text-emerald-300',
  },
};

function ProvidersContent() {
  const searchParams = useSearchParams();
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [routingRules, setRoutingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Modal State
  const [activeConfigProvider, setActiveConfigProvider] = useState<ProviderCatalogItem | null>(null);
  const [configApiKeyInput, setConfigApiKeyInput] = useState('');
  const [configModelInput, setConfigModelInput] = useState('');
  const [testModelInput, setTestModelInput] = useState('');
  const [showConfigApiKey, setShowConfigApiKey] = useState(false);
  const [savingConfigKey, setSavingConfigKey] = useState(false);
  const [configMsg, setConfigMsg] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Testing State (supports both card quick-test and modal test)
  const [testingProviderId, setTestingProviderId] = useState<string | null>(null);
  const [testResult, setTestResult] = useState<any>(null);

  const openConfigModal = (provider: ProviderCatalogItem) => {
    setActiveConfigProvider(provider);
    setConfigApiKeyInput('');
    const existingSecret = vaultSecrets.find(
      (s) =>
        s.category?.toLowerCase() === provider.category?.toLowerCase() &&
        s.providerId?.toLowerCase() === provider.id?.toLowerCase()
    );
    const activeModel = existingSecret?.metadata?.model || provider.defaultModel || '';
    setConfigModelInput(activeModel);
    setTestModelInput(activeModel);
    setConfigMsg(null);
    setTestResult(null);
  };

  const loadVaultAndRouting = async () => {
    setLoading(true);
    try {
      const paramProjectId = searchParams.get('project') || searchParams.get('projectId');
      if (paramProjectId) {
        authStorage.setProjectId(paramProjectId);
      }

      const targetProjectId = paramProjectId || authStorage.getProjectId();
      const vaultPath = targetProjectId
        ? `/api/v1/vault?projectId=${encodeURIComponent(targetProjectId)}`
        : '/api/v1/vault';
      const routingPath = targetProjectId
        ? `/api/v1/routing?projectId=${encodeURIComponent(targetProjectId)}`
        : '/api/v1/routing';

      const [vaultRes, routingRes] = await Promise.all([
        fetchApi(vaultPath).catch(() => null),
        fetchApi(routingPath).catch(() => null),
      ]);

      if (vaultRes?.success) {
        const secrets = vaultRes.data?.vaultSecrets || vaultRes.data?.secrets || [];
        setVaultSecrets(secrets);
      }
      if (routingRes?.success) {
        const rules = routingRes.data?.routingRules || routingRes.data?.rules || [];
        setRoutingRules(rules);
      }
    } catch (err) {
      console.error('Failed to load vault or routing:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVaultAndRouting();

    const handleProjectChanged = () => {
      loadVaultAndRouting();
    };
    window.addEventListener('oneapi_project_changed', handleProjectChanged);

    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, [searchParams]);

  // Save Provider Secret & Preferred Model to AES-256 Vault
  const handleSaveProviderKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeConfigProvider) return;

    const existingSecret = vaultSecrets.find(
      (s) =>
        s.category?.toLowerCase() === activeConfigProvider.category?.toLowerCase() &&
        s.providerId?.toLowerCase() === activeConfigProvider.id?.toLowerCase()
    );

    if (!configApiKeyInput.trim() && !existingSecret && activeConfigProvider.requiresKey) return;

    setSavingConfigKey(true);
    setConfigMsg(null);

    try {
      const res = await fetchApi('/api/v1/vault', {
        method: 'POST',
        body: JSON.stringify({
          category: activeConfigProvider.category,
          providerId: activeConfigProvider.id,
          ...(configApiKeyInput.trim() ? { apiKey: configApiKeyInput.trim() } : {}),
          model: configModelInput.trim() || undefined,
        }),
      });

      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: `Configuration and model for ${activeConfigProvider.name} safely stored in AES-256 Vault.`,
        });
        setConfigApiKeyInput('');
        await loadVaultAndRouting();
      } else {
        setConfigMsg({ type: 'error', text: res.error?.message || 'Failed to save key into vault.' });
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Vault encryption error.' });
    } finally {
      setSavingConfigKey(false);
    }
  };

  // Delete Provider Secret from Vault
  const handleDeleteProviderKey = async (providerId: string) => {
    if (!confirm('Remove this credential from AES-256 Vault?')) return;
    try {
      const res = await fetchApi(`/api/v1/vault/${providerId}`, {
        method: 'DELETE',
      });
      if (res.success) {
        setConfigMsg({ type: 'success', text: 'Credential removed from AES-256 vault.' });
        await loadVaultAndRouting();
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Failed to delete vault secret.' });
    }
  };

  // Update Priority Routing Rule
  const handleUpdateRouting = async (category: Category, primary: string, fallback: string) => {
    try {
      const res = await fetchApi('/api/v1/routing', {
        method: 'PUT',
        body: JSON.stringify({
          category,
          primaryProviderId: primary,
          fallbackProviderId: fallback,
        }),
      });
      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: `Updated ${category.toUpperCase()} routing: Primary = ${primary}, Fallback = ${fallback === 'none' ? 'None (Direct Call Only)' : fallback}`,
        });
        await loadVaultAndRouting();
      }
    } catch (err: any) {
      setConfigMsg({ type: 'error', text: err.message || 'Failed to update routing rule.' });
    }
  };

  // Quick Action for Provider Card Role Toggle
  const handleSetPriorityRouting = async (category: Category, providerId: string, role: 'primary' | 'fallback' | 'disable_fallback') => {
    const currentRule = routingRules.find((r) => r.category === category);
    let primary = currentRule?.primaryProviderId || providerId;
    let fallback = currentRule?.fallbackProviderId || 'none';

    if (role === 'primary') {
      primary = providerId;
      if (fallback === providerId) fallback = 'none';
    } else if (role === 'fallback') {
      fallback = providerId;
      if (primary === providerId) {
        // Swap primary to other candidate if available
        const other = PROVIDERS_CATALOG.find((p) => p.category === category && p.id !== providerId);
        if (other) primary = other.id;
      }
    } else if (role === 'disable_fallback') {
      fallback = 'none';
    }

    await handleUpdateRouting(category, primary, fallback);
  };

  // Test Provider Live Call (Works for AI, Weather, Music, News, Environment)
  const handleTestProvider = async (provider: ProviderCatalogItem, customModel?: string) => {
    setTestingProviderId(provider.id);
    setTestResult(null);

    const startTime = performance.now();
    try {
      let endpoint = '';
      let method = 'GET';
      let body: any = undefined;

      const storedSecret = vaultSecrets.find(
        (s) =>
          s.category?.toLowerCase() === provider.category?.toLowerCase() &&
          s.providerId?.toLowerCase() === provider.id?.toLowerCase()
      );
      const targetModel = customModel || storedSecret?.metadata?.model || provider.defaultModel;

      if (provider.category === 'ai') {
        endpoint = '/api/v1/proxy/ai/chat';
        method = 'POST';
        body = JSON.stringify({
          provider: provider.id,
          model: targetModel,
          messages: [{ role: 'user', content: 'Respond in 1 short sentence: What is OneAPI failover?' }],
        });
      } else if (provider.category === 'weather') {
        endpoint = '/api/v1/proxy/weather/current?city=San+Francisco';
      } else if (provider.category === 'music') {
        endpoint = '/api/v1/proxy/music/search?q=Daft+Punk&limit=2';
      } else if (provider.category === 'news') {
        endpoint = '/api/v1/proxy/news/search?q=technology&limit=2';
      } else if (provider.category === 'environment') {
        endpoint = '/api/v1/proxy/environment/air-quality?city=London';
      }

      const headers: Record<string, string> = {
        'x-oneapi-provider': provider.id,
      };

      const res = await fetchApi(endpoint, { method, headers, body });
      const latencyMs = Math.round(performance.now() - startTime);

      // Extract human-readable summary across ALL 5 categories
      const payload = (res.data || res) as any;
      let summaryText = '';
      if (provider.category === 'ai') {
        summaryText = payload.choices?.[0]?.message?.content || payload.content || 'AI response received.';
      } else if (provider.category === 'weather') {
        const cur = payload.current || {};
        summaryText = `📍 ${payload.location || 'San Francisco'}: ${cur.condition || 'Clear'} | Temp: ${cur.temperature ?? 18}°C | Humidity: ${cur.humidity ?? 65}%`;
      } else if (provider.category === 'music') {
        const tracks = payload.tracks || [];
        summaryText = tracks.length > 0
          ? `🎵 Found ${tracks.length} tracks. First: "${tracks[0]?.title}" by ${tracks[0]?.artist}`
          : 'Music search completed.';
      } else if (provider.category === 'news') {
        const articles = payload.articles || [];
        summaryText = articles.length > 0
          ? `📰 Headline: "${articles[0]?.title}" (${articles[0]?.source || 'News'})`
          : 'News search completed.';
      } else if (provider.category === 'environment') {
        const air = payload.airQuality || {};
        summaryText = `🌱 Air Quality in ${payload.location || 'London'}: Status is "${air.status || 'Moderate'}" (PM2.5: ${air.pm25 ?? 'Normal'})`;
      }

      setTestResult({
        providerId: provider.id,
        category: provider.category,
        status: res.success ? 200 : res.error?.code || 500,
        latencyMs,
        finalProvider: res._oneapi?.finalProvider || provider.id,
        fallbackTriggered: Boolean(res._oneapi?.fallbackTriggered),
        fallbackReason: res._oneapi?.fallbackReason,
        summary: summaryText,
        raw: res,
      });
    } catch (err: any) {
      setTestResult({
        providerId: provider.id,
        category: provider.category,
        status: 500,
        latencyMs: Math.round(performance.now() - startTime),
        finalProvider: provider.id,
        fallbackTriggered: false,
        summary: `Error: ${err.message}`,
        raw: { error: err.message },
      });
    } finally {
      setTestingProviderId(null);
    }
  };

  const filteredProviders =
    selectedCategory === 'all'
      ? PROVIDERS_CATALOG
      : PROVIDERS_CATALOG.filter((p) => p.category === selectedCategory);

  const categories = [
    { id: 'all', label: 'All Providers', count: PROVIDERS_CATALOG.length },
    { id: 'ai', label: 'AI & LLMs', count: PROVIDERS_CATALOG.filter((p) => p.category === 'ai').length },
    { id: 'weather', label: 'Weather', count: PROVIDERS_CATALOG.filter((p) => p.category === 'weather').length },
    { id: 'music', label: 'Music', count: PROVIDERS_CATALOG.filter((p) => p.category === 'music').length },
    { id: 'news', label: 'News', count: PROVIDERS_CATALOG.filter((p) => p.category === 'news').length },
    { id: 'environment', label: 'Environment', count: PROVIDERS_CATALOG.filter((p) => p.category === 'environment').length },
  ];

  return (
    <div className="space-y-6">
      {/* 1. Header & Vault Sync */}
      <div className="p-6 md:p-8 rounded-2xl bg-gradient-to-r from-slate-900 via-slate-900/95 to-slate-950 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-80 h-80 bg-sky-500/10 rounded-full blur-3xl pointer-events-none" />

        <div className="relative z-10">
          <div className="flex items-center gap-2 mb-2">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              FAILOVER &amp; VAULT MATRIX
            </span>
            <span className="text-xs text-slate-400">&bull; Single Unified Auth</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white tracking-tight flex items-center gap-2">
            <Cpu className="w-6 h-6 text-sky-400" />
            API Providers &amp; Fallback Configuration
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Manage AES-256 encrypted provider keys, set primary and optional fallback routes, or configure direct calls without fallback.
          </p>
        </div>

        <button
          onClick={loadVaultAndRouting}
          disabled={loading}
          className="relative z-10 px-4 py-2.5 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white cursor-pointer transition-all flex items-center gap-2 text-xs self-start md:self-auto shrink-0 shadow-md"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
          <span>Sync Vault &amp; Rules</span>
        </button>
      </div>

      {/* 2. Routing & Failover Matrix Quick Link Banner */}
      <div className="p-5 md:p-6 rounded-2xl bg-gradient-to-r from-sky-950/40 via-slate-900 to-slate-950 shadow-xl flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div className="flex items-center gap-3.5">
          <div className="p-3 rounded-xl bg-sky-500/10 text-sky-400 shrink-0">
            <Zap className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm md:text-base font-bold text-white flex items-center gap-2">
              Failover Priority &amp; Direct Call Controls
              <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-bold bg-emerald-500/15 text-emerald-400">
                5 Domains Configured
              </span>
            </h3>
            <p className="text-xs text-slate-400 mt-0.5 max-w-xl">
              Configure primary engines, optional secondary fallbacks (or direct call mode), request timeouts, and status code retry triggers in the dedicated configuration center.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/routing"
          className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-2 cursor-pointer transition-all shrink-0 self-start sm:self-auto"
        >
          <span>Configure Routing &amp; Failover</span>
          <ArrowRight className="w-3.5 h-3.5" />
        </Link>
      </div>

      {/* 3. Category Filter Tabs */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none">
        {categories.map((c) => (
          <button
            key={c.id}
            onClick={() => setSelectedCategory(c.id)}
            className={`px-3.5 py-2 rounded-xl text-xs font-semibold cursor-pointer whitespace-nowrap transition-all flex items-center gap-1.5 ${
              selectedCategory === c.id
                ? 'bg-sky-500 text-white shadow-lg shadow-sky-500/25 ring-2 ring-sky-400/30'
                : 'bg-slate-900/80 text-slate-400 hover:text-slate-200 hover:bg-slate-850'
            }`}
          >
            <span>{c.label}</span>
            <span
              className={`text-[10px] font-mono px-1.5 py-0.5 rounded-full ${
                selectedCategory === c.id ? 'bg-sky-600 text-white' : 'bg-slate-800 text-slate-500'
              }`}
            >
              {c.count}
            </span>
          </button>
        ))}
      </div>

      {/* 4. Redesigned Provider Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredProviders.map((provider) => {
          const storedSecret = vaultSecrets.find(
            (s) =>
              s.category?.toLowerCase() === provider.category?.toLowerCase() &&
              s.providerId?.toLowerCase() === provider.id?.toLowerCase()
          );
          const isConfigured = Boolean(storedSecret);
          const currentRule = routingRules.find((r) => r.category === provider.category);
          const isPrimary = currentRule?.primaryProviderId === provider.id;
          const isFallback = currentRule?.fallbackProviderId === provider.id;
          const isTesting = testingProviderId === provider.id;
          const currentTest = testResult?.providerId === provider.id ? testResult : null;
          const theme = CATEGORY_THEMES[provider.category];

          return (
            <div
              key={provider.id}
              className={`p-6 rounded-2xl bg-gradient-to-b ${theme.glow} via-[#111827] to-[#0f172a] shadow-xl hover:shadow-2xl transition-all duration-300 flex flex-col justify-between group relative overflow-hidden`}
            >
              {/* Card Top Section */}
              <div>
                {/* Header with Logo & Accurate Live Status */}
                <div className="flex items-start justify-between gap-3 mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 rounded-xl bg-slate-900/90 p-2 flex items-center justify-center shrink-0 shadow-inner group-hover:scale-105 transition-transform">
                      <img
                        src={provider.iconUrl}
                        alt={provider.name}
                        className="w-full h-full object-contain"
                        onError={(e) => {
                          const target = e.target as HTMLElement;
                          target.style.display = 'none';
                        }}
                      />
                    </div>
                    <div>
                      <h3 className="text-sm font-bold text-white group-hover:text-sky-300 transition-colors leading-tight">
                        {provider.name}
                      </h3>
                      <div className="flex items-center gap-2 mt-1">
                        <span className={`text-[10px] font-mono uppercase tracking-wider font-extrabold px-2 py-0.5 rounded-full ${theme.badge}`}>
                          {provider.category}
                        </span>
                        <a
                          href={provider.docUrl}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-[11px] text-slate-400 hover:text-sky-400 flex items-center gap-0.5 transition-colors"
                          title="Open official documentation in new tab"
                        >
                          Docs <ExternalLink className="w-3 h-3 ml-0.5" />
                        </a>
                      </div>
                    </div>
                  </div>

                  {/* Dynamic Status Badge (Solves "always says Key Required" bug) */}
                  {isConfigured ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide shrink-0 bg-emerald-500/15 text-emerald-400 flex items-center gap-1 shadow-sm">
                      <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Key Configured</span>
                    </span>
                  ) : provider.requiresKey ? (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide shrink-0 bg-amber-500/15 text-amber-400 flex items-center gap-1">
                      <Key className="w-3.5 h-3.5 text-amber-400" />
                      <span>Key Required</span>
                    </span>
                  ) : (
                    <span className="px-2.5 py-1 rounded-lg text-[10px] font-bold tracking-wide shrink-0 bg-sky-500/15 text-sky-400 flex items-center gap-1">
                      <Check className="w-3.5 h-3.5 text-sky-400" />
                      <span>Free Public API</span>
                    </span>
                  )}
                </div>

                {/* Description Tagline */}
                <p className="text-xs text-slate-400 leading-relaxed mb-4 min-h-[36px]">
                  {provider.tagline}
                </p>

                {/* Status Badges Section */}
                <div className="space-y-2.5 p-3.5 rounded-xl bg-slate-950/80 text-xs font-mono mb-4">
                  {/* Vault Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Vault Credential:</span>
                    {isConfigured ? (
                      <span className="text-emerald-400 font-semibold flex items-center gap-1">
                        <Lock className="w-3.5 h-3.5 text-emerald-400" />
                        <span>Encrypted ({storedSecret.keyPreview})</span>
                      </span>
                    ) : provider.requiresKey ? (
                      <span className="text-rose-400 font-semibold flex items-center gap-1">
                        <Key className="w-3.5 h-3.5" /> Not in Vault
                      </span>
                    ) : (
                      <span className="text-sky-400 font-semibold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" /> Free &amp; Keyless
                      </span>
                    )}
                  </div>

                  {/* Routing Rule Status */}
                  <div className="flex items-center justify-between">
                    <span className="text-slate-500">Routing Role:</span>
                    {isPrimary ? (
                      <span className="text-sky-400 font-bold flex items-center gap-1">
                        <Zap className="w-3.5 h-3.5 fill-sky-400" /> Primary Route
                      </span>
                    ) : isFallback ? (
                      <span className="text-purple-400 font-bold flex items-center gap-1">
                        <Shield className="w-3.5 h-3.5 fill-purple-400" /> Fallback Route
                      </span>
                    ) : (
                      <span className="text-slate-500">Standby Route</span>
                    )}
                  </div>

                  {/* AI Model Status */}
                  {provider.category === 'ai' && (
                    <div className="flex items-center justify-between pt-1 border-t border-slate-900">
                      <span className="text-slate-500">Active Model:</span>
                      <span className="text-sky-300 font-bold font-mono text-[11px] bg-sky-950/40 px-2 py-0.5 rounded border border-sky-800/40">
                        {storedSecret?.metadata?.model || provider.defaultModel || 'gemini-2.5-flash'}
                      </span>
                    </div>
                  )}
                </div>

                {/* AI Supported Models Chips */}
                {provider.category === 'ai' && provider.supportedModels && (
                  <div className="mb-4">
                    <div className="text-[10px] uppercase font-bold text-slate-500 tracking-wider mb-1.5 flex items-center justify-between">
                      <span>Supported Models ({provider.supportedModels.length})</span>
                      <span className="text-slate-500 font-normal">Click Configure to select</span>
                    </div>
                    <div className="flex flex-wrap gap-1">
                      {provider.supportedModels.slice(0, 4).map((m) => {
                        const isCurrent = (storedSecret?.metadata?.model || provider.defaultModel) === m;
                        return (
                          <span
                            key={m}
                            className={`px-2 py-0.5 rounded text-[10px] font-mono transition-colors ${
                              isCurrent
                                ? 'bg-sky-500/20 text-sky-300 border border-sky-500/30 font-bold'
                                : 'bg-slate-900 text-slate-400'
                            }`}
                          >
                            {m}
                          </span>
                        );
                      })}
                      {provider.supportedModels.length > 4 && (
                        <span className="px-1.5 py-0.5 text-[10px] text-slate-500 font-mono">
                          +{provider.supportedModels.length - 4} more
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Inline Test Result Banner (if tested on card) */}
                {currentTest && (
                  <div className="mb-4 p-3 rounded-xl bg-slate-950 text-xs font-mono space-y-1.5 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-[11px]">
                      <span className="text-emerald-400 font-bold">Status: {currentTest.status}</span>
                      <span className="text-sky-400">{currentTest.latencyMs}ms</span>
                      {currentTest.fallbackTriggered && (
                        <span className="text-amber-400 font-semibold bg-amber-950/60 px-1.5 py-0.5 rounded">
                          🛡️ Failover Active
                        </span>
                      )}
                    </div>
                    <p className="text-[11px] text-slate-300 font-sans leading-snug line-clamp-2">
                      {currentTest.summary}
                    </p>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-2">
                {/* Live Test Button */}
                <button
                  type="button"
                  onClick={() => handleTestProvider(provider)}
                  disabled={isTesting}
                  className="flex-1 py-2 px-3 bg-slate-900 hover:bg-slate-800 text-slate-200 hover:text-white font-semibold text-xs rounded-xl transition-all cursor-pointer flex items-center justify-center gap-1.5 disabled:opacity-50"
                  title="Run live gateway request"
                >
                  <Play className={`w-3 h-3 fill-current ${isTesting ? 'animate-spin' : ''}`} />
                  <span>{isTesting ? 'Testing...' : 'Test Live'}</span>
                </button>

                {/* Connect / Config Modal Trigger */}
                <button
                  type="button"
                  onClick={() => openConfigModal(provider)}
                  className="flex-1 py-2 px-3 bg-gradient-to-r from-sky-600 to-blue-600 hover:from-sky-500 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-md shadow-sky-600/20 transition-all cursor-pointer flex items-center justify-center gap-1.5"
                >
                  <Sliders className="w-3 h-3" />
                  <span>Configure</span>
                </button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 5. Interactive Provider Connect / Config Modal */}
      {activeConfigProvider && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150">
          <div className="w-full max-w-xl bg-[#111827] rounded-2xl p-6 md:p-7 shadow-2xl relative space-y-5 max-h-[90vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-slate-900 p-2 flex items-center justify-center shrink-0">
                  <img
                    src={activeConfigProvider.iconUrl}
                    alt=""
                    className="w-full h-full object-contain"
                  />
                </div>
                <div>
                  <h3 className="text-base font-bold text-white">{activeConfigProvider.name}</h3>
                  <div className="flex items-center gap-2 mt-0.5">
                    <span className="text-xs text-slate-400 capitalize">
                      Category: <strong className="text-sky-400">{activeConfigProvider.category}</strong>
                    </span>
                    <a
                      href={activeConfigProvider.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-sky-400 hover:underline flex items-center gap-0.5"
                    >
                      Official Docs <ExternalLink className="w-3 h-3 ml-0.5" />
                    </a>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setActiveConfigProvider(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 cursor-pointer transition-colors"
              >
                ✕
              </button>
            </div>

            {/* Notification Alert Message */}
            {configMsg && (
              <div
                className={`p-3 rounded-xl text-xs font-medium flex items-center gap-2 ${
                  configMsg.type === 'success'
                    ? 'bg-emerald-500/15 text-emerald-400'
                    : 'bg-rose-500/15 text-rose-400'
                }`}
              >
                <CheckCircle2 className="w-4 h-4 shrink-0" />
                <span>{configMsg.text}</span>
              </div>
            )}

            {/* Step A: API Key Vault & AI Model Configuration */}
            {activeConfigProvider.requiresKey ? (
              <form onSubmit={handleSaveProviderKey} className="space-y-3.5">
                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-semibold text-slate-300">
                      AES-256 Encrypted Credential (Key Vault)
                    </label>
                    {vaultSecrets.some(
                      (s) =>
                        s.category?.toLowerCase() === activeConfigProvider.category?.toLowerCase() &&
                        s.providerId?.toLowerCase() === activeConfigProvider.id?.toLowerCase()
                    ) && (
                      <span className="text-[10px] text-emerald-400 font-semibold flex items-center gap-1">
                        <CheckCircle2 className="w-3 h-3" /> Key Stored
                      </span>
                    )}
                  </div>
                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500" />
                    <input
                      type={showConfigApiKey ? 'text' : 'password'}
                      placeholder={
                        vaultSecrets.some(
                          (s) =>
                            s.category?.toLowerCase() === activeConfigProvider.category?.toLowerCase() &&
                            s.providerId?.toLowerCase() === activeConfigProvider.id?.toLowerCase()
                        )
                          ? 'Paste new API key or leave blank to only change model...'
                          : `Paste ${activeConfigProvider.name} API key...`
                      }
                      value={configApiKeyInput}
                      onChange={(e) => setConfigApiKeyInput(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-900 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfigApiKey(!showConfigApiKey)}
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-slate-500 hover:text-slate-300 cursor-pointer"
                    >
                      {showConfigApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                {/* AI Model Selection Dropdown */}
                {activeConfigProvider.category === 'ai' && (
                  <div className="space-y-1.5 p-3 rounded-xl bg-slate-900/70 border border-slate-800">
                    <div className="flex items-center justify-between">
                      <label className="text-xs font-bold text-white flex items-center gap-1.5">
                        <Cpu className="w-3.5 h-3.5 text-sky-400" />
                        Preferred AI Model
                      </label>
                      <span className="text-[10px] font-mono text-sky-400 font-semibold">
                        Default: {activeConfigProvider.defaultModel}
                      </span>
                    </div>
                    <select
                      value={configModelInput}
                      onChange={(e) => {
                        setConfigModelInput(e.target.value);
                        setTestModelInput(e.target.value);
                      }}
                      className="w-full px-3 py-2 bg-slate-950 text-white font-mono text-xs rounded-xl border border-slate-800 focus:outline-none focus:border-sky-500 cursor-pointer"
                    >
                      {(activeConfigProvider.supportedModels || []).map((m) => (
                        <option key={m} value={m} className="bg-slate-950 text-white">
                          {m} {m === activeConfigProvider.defaultModel ? '⭐ (Default)' : ''}
                        </option>
                      ))}
                    </select>
                    <p className="text-[11px] text-slate-400 leading-snug">
                      OneAPI will route requests for {activeConfigProvider.name} using this model.
                    </p>
                  </div>
                )}

                <div className="flex items-center gap-2">
                  <button
                    type="submit"
                    disabled={
                      savingConfigKey ||
                      (!configApiKeyInput.trim() &&
                        !vaultSecrets.some(
                          (s) =>
                            s.category?.toLowerCase() === activeConfigProvider.category?.toLowerCase() &&
                            s.providerId?.toLowerCase() === activeConfigProvider.id?.toLowerCase()
                        ))
                    }
                    className="flex-1 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-600/20 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    {savingConfigKey ? 'Saving...' : 'Save Configuration & Model'}
                  </button>

                  {/* If already stored in vault, allow deletion */}
                  {vaultSecrets.some(
                    (s) =>
                      s.category?.toLowerCase() === activeConfigProvider.category?.toLowerCase() &&
                      s.providerId?.toLowerCase() === activeConfigProvider.id?.toLowerCase()
                  ) && (
                    <button
                      type="button"
                      onClick={() => handleDeleteProviderKey(activeConfigProvider.id)}
                      className="px-3.5 py-2.5 bg-rose-500/15 text-rose-400 rounded-xl text-xs font-semibold cursor-pointer transition-colors flex items-center gap-1.5 hover:bg-rose-500/25"
                      title="Remove credential from vault"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span>Revoke</span>
                    </button>
                  )}
                </div>
              </form>
            ) : (
              <div className="p-3.5 rounded-xl bg-slate-900/80 text-xs text-slate-400 flex items-center gap-2">
                <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                <span>
                  <strong>{activeConfigProvider.name}</strong> is a free public API. No key is required to use this provider in the proxy gateway.
                </span>
              </div>
            )}

            {/* Step B: Routing Role Matrix */}
            <div className="space-y-2.5 pt-3">
              <label className="block text-xs font-semibold text-slate-300">Failover Priority Assignment</label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                <button
                  type="button"
                  onClick={() => handleSetPriorityRouting(activeConfigProvider.category, activeConfigProvider.id, 'primary')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-sky-500/20 text-slate-200 hover:text-sky-300 text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Zap className="w-3.5 h-3.5 text-sky-400" /> Primary Route
                </button>

                <button
                  type="button"
                  onClick={() => handleSetPriorityRouting(activeConfigProvider.category, activeConfigProvider.id, 'fallback')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-purple-500/20 text-slate-200 hover:text-purple-300 text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                >
                  <Shield className="w-3.5 h-3.5 text-purple-400" /> Fallback Route
                </button>

                <button
                  type="button"
                  onClick={() => handleSetPriorityRouting(activeConfigProvider.category, activeConfigProvider.id, 'disable_fallback')}
                  className="py-2.5 px-3 bg-slate-900 hover:bg-rose-500/20 text-slate-200 hover:text-rose-300 text-xs font-semibold rounded-xl cursor-pointer transition-all flex items-center justify-center gap-1.5"
                  title="Disable automated failover for this category"
                >
                  <Ban className="w-3.5 h-3.5 text-rose-400" /> Disable Fallback
                </button>
              </div>
            </div>

            {/* Step C: Live Request Tester in Modal */}
            <div className="space-y-3 pt-3">
              {activeConfigProvider.category === 'ai' && (
                <div className="flex items-center justify-between gap-2 p-2.5 rounded-xl bg-slate-900 border border-slate-800">
                  <span className="text-[11px] font-semibold text-slate-300 shrink-0">Model for Test:</span>
                  <select
                    value={testModelInput}
                    onChange={(e) => setTestModelInput(e.target.value)}
                    className="flex-1 px-2.5 py-1.5 bg-slate-950 text-white font-mono text-xs rounded-lg border border-slate-800 focus:outline-none"
                  >
                    {(activeConfigProvider.supportedModels || []).map((m) => (
                      <option key={m} value={m} className="bg-slate-950 text-white">
                        {m}
                      </option>
                    ))}
                  </select>
                </div>
              )}

              <button
                type="button"
                onClick={() => handleTestProvider(activeConfigProvider, testModelInput || configModelInput)}
                disabled={testingProviderId === activeConfigProvider.id}
                className="w-full py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-emerald-600/25 flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 transition-all"
              >
                <Play className={`w-3.5 h-3.5 fill-current ${testingProviderId === activeConfigProvider.id ? 'animate-spin' : ''}`} />
                {testingProviderId === activeConfigProvider.id
                  ? 'Executing Live Query...'
                  : activeConfigProvider.category === 'ai'
                  ? `Test Live Query (${testModelInput || configModelInput || activeConfigProvider.defaultModel})`
                  : 'Test Provider Live Response'}
              </button>

              {testResult && testResult.providerId === activeConfigProvider.id && (
                <div className="p-4 rounded-xl bg-slate-950 text-xs space-y-2.5 font-mono">
                  <div className="flex items-center justify-between text-[11px] flex-wrap gap-2 pb-2">
                    <span className="text-emerald-400 font-bold">HTTP Status: {testResult.status}</span>
                    <span className="text-sky-400">Latency: {testResult.latencyMs}ms</span>
                    <span className="text-amber-400">Provider: {testResult.finalProvider}</span>
                    {testResult.fallbackTriggered && (
                      <span className="text-purple-400 font-semibold bg-purple-950/60 px-2 py-0.5 rounded">
                        🛡️ Fallback Active
                      </span>
                    )}
                  </div>

                  {/* Formatted Human-Readable Summary */}
                  {testResult.summary && (
                    <div className="p-3 rounded-lg bg-emerald-950/30 text-emerald-200 text-xs font-sans leading-relaxed">
                      <div className="text-[10px] uppercase font-bold text-emerald-400 mb-1 flex items-center gap-1">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                        Live Gateway Output:
                      </div>
                      {testResult.summary}
                    </div>
                  )}

                  {/* Raw JSON Debug View */}
                  <details className="pt-1">
                    <summary className="text-[10px] text-slate-500 hover:text-slate-300 cursor-pointer">
                      View Raw JSON Response Object
                    </summary>
                    <pre className="mt-2 max-h-40 overflow-y-auto p-2 bg-slate-900 rounded-lg text-[10px] text-slate-300 overflow-x-auto">
                      {JSON.stringify(testResult.raw, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense
      fallback={
        <div className="p-8 text-center text-slate-400 flex items-center justify-center gap-2">
          <Loader2 className="w-5 h-5 animate-spin text-sky-400" />
          Loading API providers...
        </div>
      }
    >
      <ProvidersContent />
    </Suspense>
  );
}
