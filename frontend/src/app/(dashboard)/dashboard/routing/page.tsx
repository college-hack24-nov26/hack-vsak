'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import {
  Sliders,
  Zap,
  ShieldCheck,
  RefreshCw,
  CheckCircle2,
  AlertTriangle,
  ArrowRight,
  Clock,
  Sparkles,
  Server,
  Play,
  RotateCcw,
  Check,
  ChevronRight,
  ExternalLink,
  Plus,
  Trash2,
  Layers,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';
import { PROVIDERS_CATALOG, type Category, type ProviderCatalogItem } from '@/lib/providersCatalog';

interface RoutingConfigItem {
  category: Category;
  primaryProviderId: string;
  fallbackProviderId: string;
  fallbackProviderIds?: string[];
  timeoutMs: number;
  retryOnStatusCodes: number[];
  isCustomized?: boolean;
  updatedAt?: string | null;
}

const CATEGORY_DETAILS: Record<Category, { title: string; subtitle: string; icon: string; defaultTimeout: number }> = {
  ai: {
    title: 'AI & Large Language Models',
    subtitle: 'Unified reasoning, streaming chat, and code generation failover pipeline.',
    icon: '✨',
    defaultTimeout: 25000,
  },
  weather: {
    title: 'Meteorological & Weather Data',
    subtitle: 'Real-time hyper-local forecasts and atmospheric metrics with automatic fallback.',
    icon: '⛅',
    defaultTimeout: 5000,
  },
  music: {
    title: 'Music & Audio Catalog',
    subtitle: 'Track metadata, artist discography, and stream query failover engine.',
    icon: '🎵',
    defaultTimeout: 5000,
  },
  news: {
    title: 'Global News & Feeds',
    subtitle: 'Real-time technology news, spaceflight feeds, and headline syndication.',
    icon: '📰',
    defaultTimeout: 5000,
  },
  environment: {
    title: 'Environmental & Air Quality',
    subtitle: 'Global PM2.5, ozone, atmospheric sensor indices, and environmental failover.',
    icon: '🌱',
    defaultTimeout: 5000,
  },
};

const COMMON_STATUS_CODES = [
  { code: 429, label: '429 Rate Limit' },
  { code: 500, label: '500 Server Error' },
  { code: 502, label: '502 Bad Gateway' },
  { code: 503, label: '503 Unavailable' },
  { code: 504, label: '504 Timeout' },
  { code: 401, label: '401 Key Auth Error' },
  { code: 410, label: '410 Endpoint Retired' },
];

export default function RoutingConfigPage() {
  const [routingRules, setRoutingRules] = useState<RoutingConfigItem[]>([]);
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingCat, setSavingCat] = useState<string | null>(null);
  const [toastMessage, setToastMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [testingCat, setTestingCat] = useState<string | null>(null);
  const [testResults, setTestResults] = useState<Record<string, any>>({});
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const loadData = async () => {
    setLoading(true);
    try {
      const [rulesRes, vaultRes] = await Promise.all([
        fetchApi('/api/v1/routing').catch(() => null),
        fetchApi('/api/v1/vault').catch(() => null),
      ]);

      if (rulesRes?.success) {
        const rules = rulesRes.data?.routingRules || rulesRes.data?.rules || [];
        setRoutingRules(rules);
      }
      if (vaultRes?.success) {
        const secrets = vaultRes.data?.vaultSecrets || vaultRes.data?.secrets || [];
        setVaultSecrets(secrets);
      }
    } catch (err) {
      console.error('Failed to load routing data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const showToast = (type: 'success' | 'error', text: string) => {
    setToastMessage({ type, text });
    setTimeout(() => setToastMessage(null), 4000);
  };

  const updateRuleField = (
    category: Category,
    field: keyof RoutingConfigItem,
    value: any
  ) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category === category) {
          return { ...rule, [field]: value };
        }
        return rule;
      })
    );
  };

  const toggleStatusCode = (category: Category, code: number) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category === category) {
          const current = rule.retryOnStatusCodes || [];
          const exists = current.includes(code);
          const updated = exists ? current.filter((c) => c !== code) : [...current, code];
          return { ...rule, retryOnStatusCodes: updated };
        }
        return rule;
      })
    );
  };

  const addFallbackStep = (category: Category, providerId: string) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category === category) {
          const currentList =
            rule.fallbackProviderIds && rule.fallbackProviderIds.length > 0
              ? [...rule.fallbackProviderIds]
              : rule.fallbackProviderId && rule.fallbackProviderId !== 'none'
              ? [rule.fallbackProviderId]
              : [];

          if (!currentList.includes(providerId)) {
            const updated = [...currentList, providerId];
            return {
              ...rule,
              fallbackProviderIds: updated,
              fallbackProviderId: updated[0] || 'none',
            };
          }
        }
        return rule;
      })
    );
  };

  const removeFallbackStep = (category: Category, index: number) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category === category) {
          const currentList =
            rule.fallbackProviderIds && rule.fallbackProviderIds.length > 0
              ? [...rule.fallbackProviderIds]
              : rule.fallbackProviderId && rule.fallbackProviderId !== 'none'
              ? [rule.fallbackProviderId]
              : [];

          const updated = currentList.filter((_, idx) => idx !== index);
          return {
            ...rule,
            fallbackProviderIds: updated,
            fallbackProviderId: updated[0] || 'none',
          };
        }
        return rule;
      })
    );
  };

  const updateFallbackStep = (category: Category, index: number, newProviderId: string) => {
    setRoutingRules((prev) =>
      prev.map((rule) => {
        if (rule.category === category) {
          const currentList =
            rule.fallbackProviderIds && rule.fallbackProviderIds.length > 0
              ? [...rule.fallbackProviderIds]
              : rule.fallbackProviderId && rule.fallbackProviderId !== 'none'
              ? [rule.fallbackProviderId]
              : [];

          currentList[index] = newProviderId;
          const cleaned = Array.from(new Set(currentList.filter((id) => id && id !== 'none')));
          return {
            ...rule,
            fallbackProviderIds: cleaned,
            fallbackProviderId: cleaned[0] || 'none',
          };
        }
        return rule;
      })
    );
  };

  const handleSaveRule = async (category: Category) => {
    const rule = routingRules.find((r) => r.category === category);
    if (!rule) return;

    setSavingCat(category);
    try {
      const fallbackList =
        rule.fallbackProviderIds && rule.fallbackProviderIds.length > 0
          ? rule.fallbackProviderIds
          : rule.fallbackProviderId && rule.fallbackProviderId !== 'none'
          ? [rule.fallbackProviderId]
          : [];

      const res = await fetchApi('/api/v1/routing', {
        method: 'PUT',
        body: JSON.stringify({
          category: rule.category,
          primaryProviderId: rule.primaryProviderId,
          fallbackProviderId: fallbackList[0] || 'none',
          fallbackProviderIds: fallbackList,
          timeoutMs: rule.timeoutMs,
          retryOnStatusCodes: rule.retryOnStatusCodes,
        }),
      });

      if (res.success) {
        showToast(
          'success',
          `Routing for ${category.toUpperCase()} saved: Primary + ${fallbackList.length} Fallbacks in cascade.`
        );
        await loadData();
      } else {
        showToast('error', res.error?.message || 'Failed to update routing configuration.');
      }
    } catch (err: any) {
      showToast('error', err.message || 'Network error saving configuration.');
    } finally {
      setSavingCat(null);
    }
  };

  const handleTestPipeline = async (category: Category) => {
    const rule = routingRules.find((r) => r.category === category);
    if (!rule) return;

    setTestingCat(category);
    const startTime = performance.now();

    try {
      let endpoint = '';
      let method = 'GET';
      let body: any = undefined;

      if (category === 'ai') {
        endpoint = '/api/v1/proxy/ai/chat';
        method = 'POST';
        body = JSON.stringify({
          messages: [{ role: 'user', content: 'What is OneAPI failover in 1 bullet point?' }],
        });
      } else if (category === 'weather') {
        endpoint = '/api/v1/proxy/weather/current?city=Tokyo';
      } else if (category === 'music') {
        endpoint = '/api/v1/proxy/music/search?q=Radiohead&limit=2';
      } else if (category === 'news') {
        endpoint = '/api/v1/proxy/news/search?q=space&limit=2';
      } else if (category === 'environment') {
        endpoint = '/api/v1/proxy/environment/air-quality?city=Paris';
      }

      const res = await fetchApi(endpoint, { method, body });
      const latencyMs = Math.round(performance.now() - startTime);

      const payload = (res.data || res) as any;
      let summary = '';
      if (category === 'ai') {
        summary = payload.choices?.[0]?.message?.content || payload.content || 'Reasoning response received.';
      } else if (category === 'weather') {
        summary = `📍 ${payload.location || 'Tokyo'}: ${payload.current?.condition || 'Clear'} | Temp: ${payload.current?.temperature ?? 20}°C`;
      } else if (category === 'music') {
        const count = payload.tracks?.length || 0;
        summary = `🎵 Retrieved ${count} tracks from ${res._oneapi?.finalProvider || 'provider'}.`;
      } else if (category === 'news') {
        const count = payload.articles?.length || 0;
        summary = `📰 Retrieved ${count} articles from ${res._oneapi?.finalProvider || 'provider'}.`;
      } else if (category === 'environment') {
        summary = `🌱 Air Quality: PM2.5 = ${payload.airQuality?.pm25 ?? 'Normal'} (${payload.location || 'Paris'})`;
      }

      setTestResults((prev) => ({
        ...prev,
        [category]: {
          success: res.success,
          latencyMs,
          finalProvider: res._oneapi?.finalProvider || rule.primaryProviderId,
          fallbackTriggered: Boolean(res._oneapi?.fallbackTriggered),
          fallbackReason: res._oneapi?.fallbackReason,
          summary,
        },
      }));
    } catch (err: any) {
      setTestResults((prev) => ({
        ...prev,
        [category]: {
          success: false,
          latencyMs: Math.round(performance.now() - startTime),
          finalProvider: rule.primaryProviderId,
          fallbackTriggered: false,
          summary: `Execution error: ${err.message}`,
        },
      }));
    } finally {
      setTestingCat(null);
    }
  };

  const categories: Category[] = ['ai', 'weather', 'music', 'news', 'environment'];
  const filteredCategories = filterCategory === 'all' ? categories : categories.filter((c) => c === filterCategory);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {toastMessage && (
        <div
          className={`fixed top-6 right-6 z-50 px-4 py-3 rounded-xl shadow-2xl flex items-center gap-2 text-xs font-semibold backdrop-blur-md transition-all ${
            toastMessage.type === 'success'
              ? 'bg-emerald-950/90 text-emerald-300'
              : 'bg-rose-950/90 text-rose-300'
          }`}
        >
          {toastMessage.type === 'success' ? (
            <CheckCircle2 className="w-4 h-4 text-emerald-400" />
          ) : (
            <AlertTriangle className="w-4 h-4 text-rose-400" />
          )}
          <span>{toastMessage.text}</span>
        </div>
      )}

      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#111827] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              HIGH-AVAILABILITY CONTROLLER
            </span>
            <span className="text-xs text-slate-400">&bull; Multi-Domain Gateway</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Sliders className="w-6 h-6 text-sky-400" />
            Routing &amp; Failover Configuration
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Configure primary engines and optional automated failovers for all domains. Set fallback to <code className="text-sky-300 font-bold">&quot;None (Direct Call Only)&quot;</code> if you want to bypass secondary failovers entirely.
          </p>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <Link
            href="/dashboard/providers"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <Server className="w-3.5 h-3.5 text-sky-400" />
            <span>Provider Catalog</span>
          </Link>
          <button
            onClick={loadData}
            disabled={loading}
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin text-sky-400' : ''}`} />
            <span>Reload</span>
          </button>
        </div>
      </div>

      {/* 2. Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-1">
        <button
          onClick={() => setFilterCategory('all')}
          className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors ${
            filterCategory === 'all' ? 'bg-sky-500 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
          }`}
        >
          All Domains (5)
        </button>
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setFilterCategory(cat)}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold shrink-0 cursor-pointer transition-colors flex items-center gap-1.5 ${
              filterCategory === cat ? 'bg-sky-500 text-white font-bold' : 'bg-slate-900 text-slate-400 hover:text-white'
            }`}
          >
            <span>{CATEGORY_DETAILS[cat].icon}</span>
            <span className="capitalize">{cat}</span>
          </button>
        ))}
      </div>

      {/* 3. Scalable Routing Cards Grid */}
      <div className="space-y-5">
        {filteredCategories.map((cat) => {
          const detail = CATEGORY_DETAILS[cat];
          const catProviders = PROVIDERS_CATALOG.filter((p) => p.category === cat);
          const currentRule =
            routingRules.find((r) => r.category === cat) || {
              category: cat,
              primaryProviderId: catProviders[0]?.id || '',
              fallbackProviderId: 'none',
              timeoutMs: detail.defaultTimeout,
              retryOnStatusCodes: [429, 500, 502, 503, 504],
            };

          const activeFallbackList =
            currentRule.fallbackProviderIds && currentRule.fallbackProviderIds.length > 0
              ? currentRule.fallbackProviderIds
              : currentRule.fallbackProviderId && currentRule.fallbackProviderId !== 'none'
              ? [currentRule.fallbackProviderId]
              : [];

          const availableAdditionalFallbacks = catProviders.filter(
            (p) => p.id !== currentRule.primaryProviderId && !activeFallbackList.includes(p.id)
          );

          const isDirectOnly = activeFallbackList.length === 0;
          const primaryProviderObj = catProviders.find((p) => p.id === currentRule.primaryProviderId);
          const fallbackProviderObj = catProviders.find((p) => p.id === activeFallbackList[0]);
          const isSaving = savingCat === cat;
          const isTesting = testingCat === cat;
          const currentTest = testResults[cat];

          // Check vault key status for primary and fallback
          const primaryHasKey =
            !primaryProviderObj?.requiresKey ||
            vaultSecrets.some((s) => s.category?.toLowerCase() === cat && s.providerId?.toLowerCase() === primaryProviderObj?.id?.toLowerCase());
          const fallbackHasKey =
            isDirectOnly ||
            !fallbackProviderObj?.requiresKey ||
            vaultSecrets.some((s) => s.category?.toLowerCase() === cat && s.providerId?.toLowerCase() === fallbackProviderObj?.id?.toLowerCase());

          return (
            <div
              key={cat}
              className="p-6 md:p-7 rounded-2xl bg-[#111827] shadow-xl space-y-6 relative overflow-hidden"
            >
              {/* Card Header */}
              <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-transparent">
                <div className="flex items-center gap-3.5">
                  <span className="text-3xl p-2.5 rounded-2xl bg-slate-900/90 shadow-inner">
                    {detail.icon}
                  </span>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-base font-bold text-white tracking-wide">
                        {detail.title}
                      </h3>
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-mono font-extrabold uppercase bg-sky-500/10 text-sky-400">
                        {cat}
                      </span>
                    </div>
                    <p className="text-xs text-slate-400 mt-0.5">{detail.subtitle}</p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-start md:self-auto">
                  <span
                    className={`px-3 py-1 rounded-full text-[11px] font-bold flex items-center gap-1.5 ${
                      isDirectOnly
                        ? 'bg-slate-800 text-slate-300'
                        : 'bg-emerald-500/15 text-emerald-400'
                    }`}
                  >
                    <Zap className="w-3 h-3" />
                    <span>{isDirectOnly ? 'Direct Call (Primary Only)' : 'Automated Failover Active'}</span>
                  </span>
                </div>
              </div>

              {/* Main Routing Selectors: 2 Columns */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
                {/* 1. Primary Engine */}
                <div className="p-4 rounded-xl bg-slate-900/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Zap className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
                      <span>Primary Provider</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        primaryHasKey ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                      }`}
                    >
                      {primaryHasKey ? '✓ Ready / Key Set' : '⚠️ Vault Key Needed'}
                    </span>
                  </div>

                  <select
                    value={currentRule.primaryProviderId}
                    onChange={(e) => updateRuleField(cat, 'primaryProviderId', e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-950 text-white font-semibold text-xs rounded-xl focus:outline-none focus:ring-1 focus:ring-sky-500 cursor-pointer"
                  >
                    {catProviders.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name} {p.requiresKey ? '(Key Required)' : '(Public Free API)'}
                      </option>
                    ))}
                  </select>

                  <p className="text-[11px] text-slate-400 leading-relaxed">
                    All incoming requests to <code className="text-sky-300">/api/v1/proxy/{cat}/*</code> will first route directly to this provider.
                  </p>
                </div>

                {/* 2. Multi-Level Fallback Cascade Engine */}
                <div className="p-4 rounded-xl bg-slate-900/90 space-y-3">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Layers className="w-3.5 h-3.5 text-emerald-400" />
                      <span>Fallback Priority Cascade ({activeFallbackList.length} Levels)</span>
                    </label>
                    <span
                      className={`text-[10px] font-bold px-2 py-0.5 rounded ${
                        activeFallbackList.length === 0
                          ? 'bg-slate-800 text-slate-400'
                          : 'bg-emerald-500/15 text-emerald-400'
                      }`}
                    >
                      {activeFallbackList.length === 0 ? 'Direct Only' : `${activeFallbackList.length} Fallbacks Active`}
                    </span>
                  </div>

                  {activeFallbackList.length === 0 ? (
                    <div className="p-3 rounded-xl bg-slate-950/80 text-xs text-slate-400 flex items-center justify-between">
                      <span>No fallback configured. Errors return directly.</span>
                      {availableAdditionalFallbacks.length > 0 && (
                        <button
                          type="button"
                          onClick={() => addFallbackStep(cat, availableAdditionalFallbacks[0].id)}
                          className="px-2.5 py-1 bg-emerald-600/20 text-emerald-300 hover:bg-emerald-600/30 rounded-lg text-[11px] font-bold cursor-pointer transition-colors"
                        >
                          + Enable Fallback
                        </button>
                      )}
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {activeFallbackList.map((fbId, fbIdx) => {
                        const fbObj = catProviders.find((p) => p.id === fbId);
                        const hasKey =
                          !fbObj?.requiresKey ||
                          vaultSecrets.some(
                            (s) =>
                              s.category?.toLowerCase() === cat &&
                              s.providerId?.toLowerCase() === fbId.toLowerCase()
                          );

                        return (
                          <div
                            key={fbIdx}
                            className="p-2.5 rounded-xl bg-slate-950 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs"
                          >
                            <div className="flex items-center gap-2 flex-1">
                              <span className="px-2 py-0.5 rounded bg-emerald-950 text-emerald-400 font-mono text-[10px] font-bold shrink-0">
                                #{fbIdx + 1}
                              </span>
                              <select
                                value={fbId}
                                onChange={(e) => updateFallbackStep(cat, fbIdx, e.target.value)}
                                className="bg-transparent text-white font-semibold text-xs rounded focus:outline-none cursor-pointer flex-1"
                              >
                                {catProviders
                                  .filter((p) => p.id !== currentRule.primaryProviderId)
                                  .map((p) => (
                                    <option key={p.id} value={p.id} className="bg-slate-900 text-white">
                                      {p.name} {p.requiresKey ? '(Key Required)' : '(Public)'}
                                    </option>
                                  ))}
                              </select>
                            </div>

                            <div className="flex items-center gap-2 self-end sm:self-auto">
                              <span
                                className={`text-[10px] font-bold px-1.5 py-0.5 rounded ${
                                  hasKey ? 'bg-emerald-500/15 text-emerald-400' : 'bg-amber-500/15 text-amber-400'
                                }`}
                              >
                                {hasKey ? '✓ Ready' : 'Key Needed'}
                              </span>
                              <button
                                type="button"
                                onClick={() => removeFallbackStep(cat, fbIdx)}
                                className="p-1 text-slate-500 hover:text-rose-400 cursor-pointer"
                                title="Remove this fallback level"
                              >
                                <Trash2 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {/* Add more fallbacks button */}
                  {availableAdditionalFallbacks.length > 0 && activeFallbackList.length > 0 && (
                    <div className="flex items-center justify-between pt-1">
                      <span className="text-[11px] text-slate-400">Available: {availableAdditionalFallbacks.length} more</span>
                      <button
                        type="button"
                        onClick={() => addFallbackStep(cat, availableAdditionalFallbacks[0].id)}
                        className="px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-bold cursor-pointer transition-colors flex items-center gap-1"
                      >
                        <Plus className="w-3 h-3 text-emerald-400" />
                        <span>Add Fallback Stage ({availableAdditionalFallbacks[0].name.split(' (')[0]})</span>
                      </button>
                    </div>
                  )}
                </div>
              </div>

              {/* Visual Multi-Level Failover Cascade Flowchart */}
              <div className="p-3.5 rounded-xl bg-slate-950/60 flex flex-wrap items-center gap-2 text-xs font-mono">
                <span className="text-slate-400 text-[11px] font-sans font-bold">Execution Cascade:</span>
                <span className="px-2.5 py-1 rounded-lg bg-sky-500/15 text-sky-300 font-bold flex items-center gap-1">
                  <Zap className="w-3 h-3" />
                  <span>Primary: {primaryProviderObj?.name.split(' (')[0] || currentRule.primaryProviderId}</span>
                </span>

                {activeFallbackList.length === 0 ? (
                  <span className="text-slate-500 text-[11px]">──► Direct (No Failover)</span>
                ) : (
                  activeFallbackList.map((fbId, fbIdx) => {
                    const fbObj = catProviders.find((p) => p.id === fbId);
                    return (
                      <React.Fragment key={fbIdx}>
                        <span className="text-slate-500 font-bold">──►</span>
                        <span className="px-2.5 py-1 rounded-lg bg-emerald-500/15 text-emerald-300 font-bold flex items-center gap-1">
                          <RotateCcw className="w-3 h-3" />
                          <span>
                            Fallback #{fbIdx + 1}: {fbObj?.name.split(' (')[0] || fbId}
                          </span>
                        </span>
                      </React.Fragment>
                    );
                  })
                )}
              </div>

              {/* Advanced Controls: Timeout & Failover Triggers */}
              <div className="p-4 rounded-xl bg-slate-950/70 space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                  <div>
                    <h4 className="text-xs font-bold text-white flex items-center gap-1.5">
                      <Clock className="w-3.5 h-3.5 text-sky-400" />
                      Request Timeout (ms)
                    </h4>
                    <p className="text-[11px] text-slate-400 mt-0.5">
                      Maximum waiting duration before initiating automatic fallback switchover.
                    </p>
                  </div>

                  <div className="flex items-center gap-2">
                    <input
                      type="number"
                      min={1000}
                      max={60000}
                      step={500}
                      value={currentRule.timeoutMs}
                      onChange={(e) => updateRuleField(cat, 'timeoutMs', Number(e.target.value))}
                      className="w-28 px-3 py-1.5 bg-slate-900 text-white font-mono text-xs rounded-lg focus:outline-none focus:ring-1 focus:ring-sky-500 text-right"
                    />
                    <span className="text-xs text-slate-400 font-mono">ms</span>
                  </div>
                </div>

                <div>
                  <h4 className="text-xs font-bold text-slate-300 mb-1.5">
                    Failover Trigger HTTP Status Codes:
                  </h4>
                  <div className="flex flex-wrap gap-1.5">
                    {COMMON_STATUS_CODES.map((st) => {
                      const isSelected = (currentRule.retryOnStatusCodes || []).includes(st.code);
                      return (
                        <button
                          key={st.code}
                          type="button"
                          onClick={() => toggleStatusCode(cat, st.code)}
                          className={`px-2.5 py-1 rounded-lg text-[10px] font-mono font-bold cursor-pointer transition-colors ${
                            isSelected
                              ? 'bg-sky-500/20 text-sky-300'
                              : 'bg-slate-900 text-slate-500 hover:text-slate-300'
                          }`}
                        >
                          {isSelected ? '✓ ' : ''}{st.label}
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* Test Output Console */}
              {currentTest && (
                <div
                  className={`p-4 rounded-xl text-xs font-mono space-y-2 ${
                    currentTest.success ? 'bg-emerald-950/40 text-emerald-300' : 'bg-rose-950/40 text-rose-300'
                  }`}
                >
                  <div className="flex items-center justify-between font-bold text-[11px]">
                    <span className="flex items-center gap-1.5">
                      {currentTest.success ? <CheckCircle2 className="w-3.5 h-3.5" /> : <AlertTriangle className="w-3.5 h-3.5" />}
                      Pipeline Status: {currentTest.success ? '200 OK' : 'Execution Error'}
                    </span>
                    <span>Latency: {currentTest.latencyMs}ms</span>
                  </div>
                  <p className="text-[11px] leading-relaxed select-all">
                    {currentTest.summary}
                  </p>
                  <div className="text-[10px] text-slate-400 flex items-center gap-3 pt-1 border-t border-transparent">
                    <span>Final Engine: <strong>{currentTest.finalProvider}</strong></span>
                    <span>Fallback Triggered: <strong>{currentTest.fallbackTriggered ? 'YES' : 'NO'}</strong></span>
                  </div>
                </div>
              )}

              {/* Card Actions Footer */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
                <div className="text-[11px] text-slate-400">
                  {currentRule.updatedAt ? (
                    <span>Last updated: {new Date(currentRule.updatedAt).toLocaleTimeString()}</span>
                  ) : (
                    <span>Using default production routing rules</span>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    disabled={isTesting}
                    onClick={() => handleTestPipeline(cat)}
                    className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer transition-colors disabled:opacity-50"
                  >
                    <Play className={`w-3.5 h-3.5 ${isTesting ? 'animate-pulse text-sky-400' : 'text-sky-400'}`} />
                    <span>{isTesting ? 'Testing Pipeline...' : 'Test Pipeline'}</span>
                  </button>

                  <button
                    type="button"
                    disabled={isSaving}
                    onClick={() => handleSaveRule(cat)}
                    className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer transition-all disabled:opacity-50"
                  >
                    <Check className="w-3.5 h-3.5" />
                    <span>{isSaving ? 'Saving...' : 'Save Configuration'}</span>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
