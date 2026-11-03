
'use client';

import React, { Suspense, useCallback, useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  Activity,
  AlertCircle,
  ArrowRight,
  Ban,
  Check,
  CheckCircle2,
  Cloud,
  Cpu,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Leaf,
  Loader2,
  Lock,
  Music2,
  Newspaper,
  Play,
  RefreshCw,
  Shield,
  Sliders,
  Trash2,
  X,
  Zap,
} from 'lucide-react';

import { fetchApi, authStorage } from '@/lib/api';
import {
  PROVIDERS_CATALOG,
  type ProviderCatalogItem,
  type Category,
} from '@/lib/providersCatalog';

type ConfigMessage = {
  type: 'success' | 'error';
  text: string;
} | null;

type TestResult = {
  providerId: string;
  category: Category;
  status: number | string;
  latencyMs: number;
  finalProvider: string;
  fallbackTriggered: boolean;
  fallbackReason?: string;
  summary: string;
  raw: unknown;
};

type CategoryTheme = {
  badge: string;
  glow: string;
  iconBg: string;
};

const CATEGORY_THEMES: Record<Category, CategoryTheme> = {
  ai: {
    badge: 'bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]',
    glow: 'from-[var(--accent-purple)]/10',
    iconBg: 'bg-[var(--accent-purple)]/10 text-[var(--accent-purple)]',
  },
  weather: {
    badge: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
    glow: 'from-sky-500/10',
    iconBg: 'bg-sky-500/10 text-sky-600 dark:text-sky-400',
  },
  music: {
    badge: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
    glow: 'from-pink-500/10',
    iconBg: 'bg-pink-500/10 text-pink-600 dark:text-pink-400',
  },
  news: {
    badge: 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)]',
    glow: 'from-[var(--accent-yellow)]/10',
    iconBg: 'bg-[var(--accent-yellow)]/10 text-[var(--accent-yellow)]',
  },
  environment: {
    badge: 'bg-[var(--success)]/10 text-[var(--success)]',
    glow: 'from-[var(--success)]/10',
    iconBg: 'bg-[var(--success)]/10 text-[var(--success)]',
  },
};

const CATEGORY_META: Record<
  Category,
  { label: string; icon: React.ElementType }
> = {
  ai: { label: 'AI & LLM', icon: Cpu },
  weather: { label: 'Weather', icon: Cloud },
  music: { label: 'Music', icon: Music2 },
  news: { label: 'News', icon: Newspaper },
  environment: { label: 'Environment', icon: Leaf },
};

const surface =
  'rounded-2xl border border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow)]';

const primaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl bg-[var(--primary)] px-4 py-2.5 text-xs font-semibold text-white transition hover:bg-[var(--primary-hover)] disabled:cursor-not-allowed disabled:opacity-50';

const secondaryButton =
  'inline-flex items-center justify-center gap-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] px-4 py-2.5 text-xs font-semibold text-[var(--foreground)] transition hover:bg-[var(--surface-secondary)] disabled:cursor-not-allowed disabled:opacity-50';

const inputClass =
  'w-full rounded-xl border border-[var(--border)] bg-[var(--surface)] px-3.5 py-3 text-sm text-[var(--foreground)] outline-none transition placeholder:text-[var(--muted)] focus:border-[var(--primary)] focus:ring-2 focus:ring-[var(--primary)]/15';

function ProvidersContent() {
  const searchParams = useSearchParams();

  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [vaultSecrets, setVaultSecrets] = useState<any[]>([]);
  const [routingRules, setRoutingRules] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const [activeConfigProvider, setActiveConfigProvider] =
    useState<ProviderCatalogItem | null>(null);

  const [configApiKeyInput, setConfigApiKeyInput] = useState('');
  const [configModelInput, setConfigModelInput] = useState('');
  const [testModelInput, setTestModelInput] = useState('');

  const [showConfigApiKey, setShowConfigApiKey] = useState(false);
  const [savingConfigKey, setSavingConfigKey] = useState(false);
  const [configMsg, setConfigMsg] = useState<ConfigMessage>(null);

  const [testingProviderId, setTestingProviderId] = useState<string | null>(
    null,
  );
  const [testResult, setTestResult] = useState<TestResult | null>(null);

  const projectId =
    searchParams.get('project') ||
    searchParams.get('projectId') ||
    authStorage.getProjectId();

  const loadVaultAndRouting = useCallback(async () => {
    setLoading(true);

    try {
      const query = projectId
        ? `?projectId=${encodeURIComponent(projectId)}`
        : '';

      if (projectId) {
        authStorage.setProjectId(projectId);
      }

      const [vaultRes, routingRes] = await Promise.all([
        fetchApi(`/api/v1/vault${query}`).catch(() => null),
        fetchApi(`/api/v1/routing${query}`).catch(() => null),
      ]);

      if (vaultRes?.success) {
        setVaultSecrets(
          vaultRes.data?.vaultSecrets || vaultRes.data?.secrets || [],
        );
      }

      if (routingRes?.success) {
        setRoutingRules(
          routingRes.data?.routingRules || routingRes.data?.rules || [],
        );
      }
    } catch (error) {
      console.error('Failed to load provider configuration:', error);
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    void loadVaultAndRouting();
  }, [loadVaultAndRouting]);

  const categories = useMemo(() => {
    const categoryIds = Array.from(
      new Set(PROVIDERS_CATALOG.map((provider) => provider.category)),
    );

    return [
      {
        id: 'all',
        label: 'All providers',
        count: PROVIDERS_CATALOG.length,
      },
      ...categoryIds.map((id) => ({
        id,
        label: CATEGORY_META[id as Category]?.label || id,
        count: PROVIDERS_CATALOG.filter(
          (provider) => provider.category === id,
        ).length,
      })),
    ];
  }, []);

  const filteredProviders = useMemo(() => {
    if (selectedCategory === 'all') return PROVIDERS_CATALOG;

    return PROVIDERS_CATALOG.filter(
      (provider) => provider.category === selectedCategory,
    );
  }, [selectedCategory]);

  const configuredCount = vaultSecrets.length;

  const primaryCount = routingRules.filter(
    (rule) => Boolean(rule.primaryProviderId),
  ).length;

  const getStoredSecret = (provider: ProviderCatalogItem) =>
    vaultSecrets.find(
      (secret) =>
        secret.category?.toLowerCase() === provider.category.toLowerCase() &&
        secret.providerId?.toLowerCase() === provider.id.toLowerCase(),
    );

  const handleSaveProviderKey = async (
    event: React.FormEvent<HTMLFormElement>,
  ) => {
    event.preventDefault();

    if (!activeConfigProvider || !configApiKeyInput.trim()) return;

    setSavingConfigKey(true);
    setConfigMsg(null);

    try {
      const res = await fetchApi('/api/v1/vault', {
        method: 'POST',
        body: JSON.stringify({
          category: activeConfigProvider.category,
          providerId: activeConfigProvider.id,
          apiKey: configApiKeyInput.trim(),
          model: configModelInput.trim() || undefined,
        }),
      });

      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: `Credential for ${activeConfigProvider.name} saved successfully.`,
        });

        setConfigApiKeyInput('');
        await loadVaultAndRouting();
      } else {
        setConfigMsg({
          type: 'error',
          text: res.error?.message || 'Failed to save credential.',
        });
      }
    } catch (error: any) {
      setConfigMsg({
        type: 'error',
        text: error.message || 'Failed to save credential.',
      });
    } finally {
      setSavingConfigKey(false);
    }
  };

  const handleDeleteProviderKey = async (providerId: string) => {
    if (!window.confirm('Remove this credential from the vault?')) return;

    try {
      const res = await fetchApi(`/api/v1/vault/${providerId}`, {
        method: 'DELETE',
      });

      if (res.success) {
        setConfigMsg({
          type: 'success',
          text: 'Credential removed from vault.',
        });

        await loadVaultAndRouting();
      } else {
        setConfigMsg({
          type: 'error',
          text: res.error?.message || 'Failed to remove credential.',
        });
      }
    } catch (error: any) {
      setConfigMsg({
        type: 'error',
        text: error.message || 'Failed to delete credential.',
      });
    }
  };

  const handleUpdateRouting = async (
    category: Category,
    primary: string,
    fallback: string,
  ) => {
    setConfigMsg(null);

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
          text: `Updated ${category.toUpperCase()} routing. Primary: ${primary}. Fallback: ${
            fallback === 'none' ? 'Disabled' : fallback
          }.`,
        });

        await loadVaultAndRouting();
      } else {
        setConfigMsg({
          type: 'error',
          text: res.error?.message || 'Failed to update routing rule.',
        });
      }
    } catch (error: any) {
      setConfigMsg({
        type: 'error',
        text: error.message || 'Failed to update routing rule.',
      });
    }
  };

  const handleSetPriorityRouting = async (
    category: Category,
    providerId: string,
    role: 'primary' | 'fallback' | 'disable_fallback',
  ) => {
    const currentRule = routingRules.find(
      (rule) => rule.category === category,
    );

    let primary = currentRule?.primaryProviderId || providerId;
    let fallback = currentRule?.fallbackProviderId || 'none';

    if (role === 'primary') {
      primary = providerId;

      if (fallback === providerId) {
        fallback = 'none';
      }
    } else if (role === 'fallback') {
      fallback = providerId;

      if (primary === providerId) {
        const alternative = PROVIDERS_CATALOG.find(
          (provider) =>
            provider.category === category && provider.id !== providerId,
        );

        if (alternative) {
          primary = alternative.id;
        }
      }
    } else {
      fallback = 'none';
    }

    await handleUpdateRouting(category, primary, fallback);
  };

  const handleTestProvider = async (provider: ProviderCatalogItem) => {
    setTestingProviderId(provider.id);
    setTestResult(null);

    const startTime = performance.now();

    try {
      let endpoint = '';
      let method = 'GET';
      let body: string | undefined;

      if (provider.category === 'ai') {
        endpoint = '/api/v1/proxy/ai/chat';
        method = 'POST';

        body = JSON.stringify({
          provider: provider.id,
          model: testModelInput.trim() || configModelInput.trim() || undefined,
          messages: [
            {
              role: 'user',
              content:
                'Respond in one short sentence: What is OneAPI failover?',
            },
          ],
        });
      } else if (provider.category === 'weather') {
        endpoint = '/api/v1/proxy/weather/current?city=San+Francisco';
      } else if (provider.category === 'music') {
        endpoint = '/api/v1/proxy/music/search?q=Daft+Punk&limit=2';
      } else if (provider.category === 'news') {
        endpoint = '/api/v1/proxy/news/search?q=technology&limit=2';
      } else if (provider.category === 'environment') {
        endpoint =
          '/api/v1/proxy/environment/air-quality?city=London';
      }

      if (!endpoint) {
        throw new Error(
          'No test endpoint is configured for this provider category.',
        );
      }

      const res = await fetchApi(endpoint, {
        method,
        headers: {
          'x-oneapi-provider': provider.id,
        },
        body,
      });

      const latencyMs = Math.round(performance.now() - startTime);
      const payload = (res.data || res) as any;

      let summary = '';

      if (provider.category === 'ai') {
        summary =
          payload.choices?.[0]?.message?.content ||
          payload.content ||
          'AI response received.';
      } else if (provider.category === 'weather') {
        const current = payload.current || {};

        summary = `${payload.location || 'San Francisco'}: ${
          current.condition || 'Current conditions'
        } | Temperature: ${current.temperature ?? '—'}°C | Humidity: ${
          current.humidity ?? '—'
        }%`;
      } else if (provider.category === 'music') {
        const tracks = payload.tracks || [];

        summary = tracks.length
          ? `Found ${tracks.length} tracks. First: "${
              tracks[0]?.title || 'Untitled'
            }" by ${tracks[0]?.artist || 'Unknown artist'}.`
          : 'Music search completed.';
      } else if (provider.category === 'news') {
        const articles = payload.articles || [];

        summary = articles.length
          ? `Headline: "${articles[0]?.title || 'Untitled'}" (${
              articles[0]?.source || 'News'
            }).`
          : 'News search completed.';
      } else if (provider.category === 'environment') {
        const air = payload.airQuality || {};

        summary = `Air Quality in ${
          payload.location || 'London'
        }: ${air.status || 'Response received'} (PM2.5: ${
          air.pm25 ?? '—'
        }).`;
      }

      setTestResult({
        providerId: provider.id,
        category: provider.category,
        status: res.success ? 200 : res.error?.code || 500,
        latencyMs,
        finalProvider: res._oneapi?.finalProvider || provider.id,
        fallbackTriggered: Boolean(res._oneapi?.fallbackTriggered),
        fallbackReason: res._oneapi?.fallbackReason,
        summary,
        raw: res,
      });
    } catch (error: any) {
      setTestResult({
        providerId: provider.id,
        category: provider.category,
        status: 500,
        latencyMs: Math.round(performance.now() - startTime),
        finalProvider: provider.id,
        fallbackTriggered: false,
        summary: `Error: ${error.message || 'Provider test failed.'}`,
        raw: {
          error: error.message || 'Provider test failed.',
        },
      });
    } finally {
      setTestingProviderId(null);
    }
  };

  const openProviderConfig = (provider: ProviderCatalogItem) => {
    setActiveConfigProvider(provider);
    setConfigMsg(null);
    setConfigApiKeyInput('');
    setConfigModelInput('');
    setTestModelInput('');
    setShowConfigApiKey(false);
    setTestResult(null);
  };

  const closeModal = () => {
    setActiveConfigProvider(null);
    setConfigMsg(null);
    setConfigApiKeyInput('');
    setConfigModelInput('');
    setTestModelInput('');
    setTestResult(null);
  };

  return (
    <div className="space-y-6 text-[var(--foreground)]">
      {/* Page heading */}
      <section className={`${surface} relative isolate overflow-hidden p-6 md:p-8`}>
        <div className="pointer-events-none absolute -right-20 -top-28 -z-10 h-72 w-72 rounded-full bg-[var(--primary)]/10 blur-3xl" />

        <div className="flex flex-col justify-between gap-5 md:flex-row md:items-center">
          <div className="min-w-0">
            <div className="mb-3 flex flex-wrap items-center gap-2">
              <span className="rounded-full bg-[var(--primary)]/10 px-3 py-1 text-[10px] font-bold uppercase tracking-[0.16em] text-[var(--primary)]">
                Provider control center
              </span>
              <span className="text-xs text-[var(--muted)]">
                · Unified authentication
              </span>
            </div>

            <h1 className="flex items-center gap-3 text-2xl font-bold tracking-tight md:text-3xl">
              <span className="flex h-11 w-11 items-center justify-center rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)]">
                <Cpu className="h-6 w-6" />
              </span>
              API Providers
            </h1>

            <p className="mt-2 max-w-2xl text-sm leading-6 text-[var(--muted)]">
              Connect provider credentials, manage encrypted vault entries,
              and assign primary and fallback routes from one workspace.
            </p>
          </div>

          <button
            type="button"
            onClick={() => void loadVaultAndRouting()}
            disabled={loading}
            className={secondaryButton}
          >
            <RefreshCw
              className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`}
            />
            {loading ? 'Syncing…' : 'Sync vault & rules'}
          </button>
        </div>

        <div className="mt-7 grid grid-cols-1 gap-3 sm:grid-cols-3">
          {[
            {
              label: 'Available providers',
              value: PROVIDERS_CATALOG.length,
              icon: Cpu,
            },
            {
              label: 'Vault credentials',
              value: configuredCount,
              icon: Lock,
            },
            {
              label: 'Routing rules loaded',
              value: primaryCount,
              icon: Shield,
            },
          ].map((stat) => {
            const Icon = stat.icon;

            return (
              <div
                key={stat.label}
                className="rounded-xl border border-[var(--border)] bg-[var(--surface)]/80 p-4"
              >
                <div className="flex items-center justify-between">
                  <p className="text-xs text-[var(--muted)]">
                    {stat.label}
                  </p>
                  <Icon className="h-4 w-4 text-[var(--muted)]" />
                </div>
                <p className="mt-1 text-2xl font-bold tabular-nums">
                  {stat.value}
                </p>
              </div>
            );
          })}
        </div>
      </section>

      {/* Routing shortcut */}
      <section
        className={`${surface} flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between`}
      >
        <div className="flex items-start gap-3">
          <span className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[var(--primary)]/10 text-[var(--primary)]">
            <Zap className="h-5 w-5" />
          </span>

          <div>
            <h2 className="font-semibold">
              Failover priority & direct-call controls
            </h2>
            <p className="mt-1 max-w-2xl text-xs leading-5 text-[var(--muted)]">
              Configure primary providers and optional fallbacks, or manage
              direct-call behavior in the routing workspace.
            </p>
          </div>
        </div>

        <Link
          href="/dashboard/routing"
          className={`${primaryButton} shrink-0`}
        >
          Configure routing
          <ArrowRight className="h-4 w-4" />
        </Link>
      </section>

      {/* Provider directory */}
      <section className="space-y-4">
        <div className="flex flex-col gap-1 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h2 className="text-lg font-bold">Provider directory</h2>
            <p className="text-xs text-[var(--muted)]">
              Configure credentials or test a provider connection.
            </p>
          </div>

          <span className="text-xs text-[var(--muted)]">
            {filteredProviders.length} providers shown
          </span>
        </div>

        {/* Category filters */}
        <div className="flex gap-2 overflow-x-auto pb-1">
          {categories.map((category) => {
            const active = selectedCategory === category.id;

            return (
              <button
                key={category.id}
                type="button"
                onClick={() => setSelectedCategory(category.id)}
                className={`inline-flex shrink-0 items-center gap-2 rounded-xl border px-3.5 py-2.5 text-xs font-semibold transition ${
                  active
                    ? 'border-[var(--primary)] bg-[var(--primary)] text-white shadow-sm'
                    : 'border-[var(--border)] bg-[var(--card)] text-[var(--muted)] hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]'
                }`}
              >
                {category.label}
                <span
                  className={`rounded-md px-1.5 py-0.5 text-[10px] ${
                    active
                      ? 'bg-white/15 text-white'
                      : 'bg-[var(--surface-secondary)] text-[var(--muted)]'
                  }`}
                >
                  {category.count}
                </span>
              </button>
            );
          })}
        </div>

        {loading && vaultSecrets.length === 0 && routingRules.length === 0 ? (
          <div
            className={`${surface} flex min-h-48 items-center justify-center gap-3 text-sm text-[var(--muted)]`}
          >
            <RefreshCw className="h-4 w-4 animate-spin" />
            Loading provider configuration…
          </div>
        ) : filteredProviders.length === 0 ? (
          <div className={`${surface} p-10 text-center text-sm text-[var(--muted)]`}>
            No providers found in this category.
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 xl:grid-cols-3">
            {filteredProviders.map((provider) => {
              const storedSecret = getStoredSecret(provider);
              const isConfigured = Boolean(storedSecret);

              const currentRule = routingRules.find(
                (rule) => rule.category === provider.category,
              );

              const isPrimary =
                currentRule?.primaryProviderId === provider.id;

              const isFallback =
                currentRule?.fallbackProviderId === provider.id;

              const isTesting = testingProviderId === provider.id;

              const currentTest =
                testResult?.providerId === provider.id ? testResult : null;

              const theme = CATEGORY_THEMES[provider.category];
              const CategoryIcon = CATEGORY_META[provider.category].icon;

              return (
                <article
                  key={provider.id}
                  className={`${surface} group relative flex min-w-0 flex-col overflow-hidden transition duration-200 hover:-translate-y-0.5 hover:border-[var(--primary)]/40`}
                >
                  <div
                    className={`pointer-events-none absolute inset-x-0 top-0 h-28 bg-gradient-to-b ${theme.glow} to-transparent opacity-80`}
                  />

                  <div className="relative flex flex-1 flex-col p-5">
                    <div className="flex items-start justify-between gap-3">
                      <div className="flex min-w-0 items-center gap-3">
                        <div
                          className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${theme.iconBg} ring-1 ring-inset ring-[var(--border)]`}
                        >
                          <img
                            src={provider.iconUrl}
                            alt={`${provider.name} logo`}
                            className="h-8 w-8 object-contain"
                            onError={(event) => {
                              event.currentTarget.style.display = 'none';
                            }}
                          />
                          <CategoryIcon className="hidden h-5 w-5" />
                        </div>

                        <div className="min-w-0">
                          <h3 className="truncate text-sm font-bold">
                            {provider.name}
                          </h3>

                          <div className="mt-1 flex flex-wrap items-center gap-2">
                            <span
                              className={`rounded-md px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${theme.badge}`}
                            >
                              {provider.category}
                            </span>

                            <a
                              href={provider.docUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="inline-flex items-center gap-1 text-[11px] text-[var(--muted)] transition hover:text-[var(--primary)]"
                            >
                              Docs
                              <ExternalLink className="h-3 w-3" />
                            </a>
                          </div>
                        </div>
                      </div>

                      {isConfigured ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--success)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--success)]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          Configured
                        </span>
                      ) : provider.requiresKey ? (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--accent-yellow)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--accent-yellow)]">
                          <Key className="h-3.5 w-3.5" />
                          Key required
                        </span>
                      ) : (
                        <span className="inline-flex shrink-0 items-center gap-1 rounded-lg bg-[var(--success)]/10 px-2 py-1 text-[10px] font-semibold text-[var(--success)]">
                          <Check className="h-3.5 w-3.5" />
                          Keyless
                        </span>
                      )}
                    </div>

                    <p className="mt-4 min-h-10 text-xs leading-5 text-[var(--muted)]">
                      {provider.tagline}
                    </p>

                    {/* Provider status */}
                    <div className="mb-4 mt-3 space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3.5 text-xs">
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--muted)]">
                          Vault credential
                        </span>

                        {isConfigured ? (
                          <span className="flex items-center gap-1 text-right font-semibold text-[var(--success)]">
                            <Lock className="h-3.5 w-3.5 shrink-0" />
                            Encrypted
                            {storedSecret.keyPreview
                              ? ` (${storedSecret.keyPreview})`
                              : ''}
                          </span>
                        ) : provider.requiresKey ? (
                          <span className="flex items-center gap-1 font-semibold text-[var(--danger)]">
                            <Key className="h-3.5 w-3.5" />
                            Not in vault
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 font-semibold text-[var(--success)]">
                            <Check className="h-3.5 w-3.5" />
                            Free & keyless
                          </span>
                        )}
                      </div>

                      <div className="flex items-center justify-between gap-2">
                        <span className="text-[var(--muted)]">
                          Routing role
                        </span>

                        {isPrimary ? (
                          <span className="flex items-center gap-1 font-bold text-[var(--primary)]">
                            <Zap className="h-3.5 w-3.5" />
                            Primary route
                          </span>
                        ) : isFallback ? (
                          <span className="flex items-center gap-1 font-bold text-[var(--accent-purple)]">
                            <Shield className="h-3.5 w-3.5" />
                            Fallback route
                          </span>
                        ) : (
                          <span className="text-[var(--muted)]">
                            Standby route
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Test result */}
                    {currentTest && (
                      <div className="mb-3 space-y-2 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-3 text-xs">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <span
                            className={`font-semibold ${
                              Number(currentTest.status) >= 200 &&
                              Number(currentTest.status) < 300
                                ? 'text-[var(--success)]'
                                : 'text-[var(--danger)]'
                            }`}
                          >
                            HTTP {currentTest.status}
                          </span>

                          <span className="text-[var(--muted)]">
                            {currentTest.latencyMs} ms
                          </span>

                          {currentTest.fallbackTriggered && (
                            <span className="rounded-md bg-[var(--accent-yellow)]/10 px-2 py-1 text-[var(--accent-yellow)]">
                              Failover used
                            </span>
                          )}
                        </div>

                        <p className="line-clamp-3 leading-5 text-[var(--foreground)]">
                          {currentTest.summary}
                        </p>
                      </div>
                    )}

                    {/* Actions */}
                    <div className="mt-auto flex items-center gap-2 pt-2">
                      <button
                        type="button"
                        onClick={() => void handleTestProvider(provider)}
                        disabled={isTesting}
                        className={`${secondaryButton} flex-1`}
                        title="Run a live gateway request"
                      >
                        {isTesting ? (
                          <Loader2 className="h-3.5 w-3.5 animate-spin" />
                        ) : (
                          <Play className="h-3.5 w-3.5" />
                        )}
                        {isTesting ? 'Testing…' : 'Test live'}
                      </button>

                      <button
                        type="button"
                        onClick={() => openProviderConfig(provider)}
                        className={`${primaryButton} flex-1`}
                      >
                        <Sliders className="h-3.5 w-3.5" />
                        Configure
                      </button>
                    </div>
                  </div>
                </article>
              );
            })}
          </div>
        )}
      </section>

      {/* Provider configuration modal */}
      {activeConfigProvider && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center overflow-y-auto bg-black/60 p-3 backdrop-blur-sm sm:p-5"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget) closeModal();
          }}
        >
          <section
            role="dialog"
            aria-modal="true"
            aria-labelledby="provider-config-title"
            className="my-auto max-h-[92dvh] w-full max-w-xl overflow-y-auto rounded-2xl border border-[var(--border)] bg-[var(--card)] p-5 text-[var(--foreground)] shadow-2xl sm:p-7"
          >
            {/* Modal heading */}
            <div className="flex items-start justify-between gap-4 border-b border-[var(--border)] pb-5">
              <div className="flex min-w-0 items-center gap-3">
                <div
                  className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl ${CATEGORY_THEMES[activeConfigProvider.category].iconBg}`}
                >
                  <img
                    src={activeConfigProvider.iconUrl}
                    alt=""
                    className="h-8 w-8 object-contain"
                    onError={(event) => {
                      event.currentTarget.style.display = 'none';
                    }}
                  />
                </div>

                <div className="min-w-0">
                  <h2
                    id="provider-config-title"
                    className="truncate text-lg font-bold"
                  >
                    {activeConfigProvider.name}
                  </h2>

                  <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-[var(--muted)]">
                    <span className="capitalize">
                      {activeConfigProvider.category}
                    </span>
                    <span>·</span>
                    <a
                      href={activeConfigProvider.docUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 text-[var(--primary)] hover:underline"
                    >
                      Official docs
                      <ExternalLink className="h-3 w-3" />
                    </a>
                  </div>
                </div>
              </div>

              <button
                type="button"
                onClick={closeModal}
                aria-label="Close dialog"
                className="rounded-lg p-2 text-[var(--muted)] transition hover:bg-[var(--surface-secondary)] hover:text-[var(--foreground)]"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            {/* Feedback */}
            {configMsg && (
              <div
                className={`mt-5 flex items-start gap-2 rounded-xl border p-3 text-xs ${
                  configMsg.type === 'success'
                    ? 'border-[var(--success)]/25 bg-[var(--success)]/10 text-[var(--success)]'
                    : 'border-[var(--danger)]/25 bg-[var(--danger)]/10 text-[var(--danger)]'
                }`}
              >
                {configMsg.type === 'success' ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertCircle className="h-4 w-4 shrink-0" />
                )}
                <span>{configMsg.text}</span>
              </div>
            )}

            {/* Credential form */}
            <div className="mt-5 space-y-4">
              {activeConfigProvider.requiresKey ? (
                <form
                  onSubmit={handleSaveProviderKey}
                  className="space-y-3"
                >
                  <div>
                    <h3 className="text-sm font-semibold">
                      Provider credentials
                    </h3>
                    <p className="mt-1 text-xs leading-5 text-[var(--muted)]">
                      Add your provider API key to the OneAPI vault.
                    </p>
                  </div>

                  <label className="block text-xs font-semibold">
                    API key
                  </label>

                  <div className="relative">
                    <Key className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-[var(--muted)]" />

                    <input
                      type={showConfigApiKey ? 'text' : 'password'}
                      placeholder={`Paste ${activeConfigProvider.name} API key`}
                      value={configApiKeyInput}
                      onChange={(event) =>
                        setConfigApiKeyInput(event.target.value)
                      }
                      required
                      autoComplete="off"
                      className={`${inputClass} pl-10 pr-11 font-mono`}
                    />

                    <button
                      type="button"
                      onClick={() =>
                        setShowConfigApiKey((current) => !current)
                      }
                      aria-label={
                        showConfigApiKey ? 'Hide API key' : 'Show API key'
                      }
                      className="absolute right-3.5 top-1/2 -translate-y-1/2 text-[var(--muted)] transition hover:text-[var(--foreground)]"
                    >
                      {showConfigApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </button>
                  </div>

                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Model name
                      <span className="ml-1 font-normal text-[var(--muted)]">
                        (optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={configModelInput}
                      onChange={(event) =>
                        setConfigModelInput(event.target.value)
                      }
                      placeholder="Enter default model name"
                      className={inputClass}
                    />
                  </div>

                  <div className="flex items-center gap-2">
                    <button
                      type="submit"
                      disabled={
                        savingConfigKey || !configApiKeyInput.trim()
                      }
                      className={`${primaryButton} flex-1`}
                    >
                      {savingConfigKey ? (
                        <>
                          <Loader2 className="h-4 w-4 animate-spin" />
                          Saving credential…
                        </>
                      ) : (
                        <>
                          <Lock className="h-4 w-4" />
                          Save to vault
                        </>
                      )}
                    </button>

                    {getStoredSecret(activeConfigProvider) && (
                      <button
                        type="button"
                        onClick={() =>
                          void handleDeleteProviderKey(
                            activeConfigProvider.id,
                          )
                        }
                        className="inline-flex items-center gap-1.5 rounded-xl border border-[var(--danger)]/25 bg-[var(--danger)]/10 px-3.5 py-2.5 text-xs font-semibold text-[var(--danger)] transition hover:bg-[var(--danger)]/15"
                        title="Remove credential from vault"
                      >
                        <Trash2 className="h-4 w-4" />
                        Revoke
                      </button>
                    )}
                  </div>
                </form>
              ) : (
                <div className="flex items-center gap-2 rounded-xl border border-[var(--success)]/20 bg-[var(--success)]/10 p-3.5 text-xs text-[var(--success)]">
                  <Check className="h-4 w-4 shrink-0" />
                  <span>
                    <strong>{activeConfigProvider.name}</strong> does not
                    require an API key according to the provider catalog.
                  </span>
                </div>
              )}

              {/* Routing controls */}
              <div className="space-y-3 border-t border-[var(--border)] pt-5">
                <div>
                  <h3 className="text-sm font-semibold">
                    Failover priority assignment
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Assign this provider as the primary or fallback provider
                    for its category.
                  </p>
                </div>

                <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
                  <button
                    type="button"
                    onClick={() =>
                      void handleSetPriorityRouting(
                        activeConfigProvider.category,
                        activeConfigProvider.id,
                        'primary',
                      )
                    }
                    className={secondaryButton}
                  >
                    <Zap className="h-3.5 w-3.5 text-[var(--primary)]" />
                    Primary
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleSetPriorityRouting(
                        activeConfigProvider.category,
                        activeConfigProvider.id,
                        'fallback',
                      )
                    }
                    className={secondaryButton}
                  >
                    <Shield className="h-3.5 w-3.5 text-[var(--accent-purple)]" />
                    Fallback
                  </button>

                  <button
                    type="button"
                    onClick={() =>
                      void handleSetPriorityRouting(
                        activeConfigProvider.category,
                        activeConfigProvider.id,
                        'disable_fallback',
                      )
                    }
                    className={secondaryButton}
                  >
                    <Ban className="h-3.5 w-3.5 text-[var(--danger)]" />
                    Disable fallback
                  </button>
                </div>
              </div>

              {/* Connection test */}
              <div className="space-y-3 border-t border-[var(--border)] pt-5">
                <div>
                  <h3 className="text-sm font-semibold">
                    Connection test
                  </h3>
                  <p className="mt-1 text-xs text-[var(--muted)]">
                    Send a sample request through the OneAPI proxy.
                  </p>
                </div>

                {activeConfigProvider.category === 'ai' && (
                  <div>
                    <label className="mb-2 block text-xs font-semibold">
                      Test model
                      <span className="ml-1 font-normal text-[var(--muted)]">
                        (optional)
                      </span>
                    </label>

                    <input
                      type="text"
                      value={testModelInput}
                      onChange={(event) =>
                        setTestModelInput(event.target.value)
                      }
                      placeholder="Use the provider default model"
                      className={inputClass}
                    />
                  </div>
                )}

                <button
                  type="button"
                  onClick={() =>
                    void handleTestProvider(activeConfigProvider)
                  }
                  disabled={
                    testingProviderId === activeConfigProvider.id
                  }
                  className={`${primaryButton} w-full`}
                >
                  {testingProviderId === activeConfigProvider.id ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Activity className="h-4 w-4" />
                  )}

                  {testingProviderId === activeConfigProvider.id
                    ? 'Executing request…'
                    : 'Test provider response'}
                </button>

                {testResult?.providerId === activeConfigProvider.id && (
                  <div className="space-y-3 rounded-xl border border-[var(--border)] bg-[var(--surface)] p-4">
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 text-xs">
                      <span
                        className={`font-semibold ${
                          Number(testResult.status) >= 200 &&
                          Number(testResult.status) < 300
                            ? 'text-[var(--success)]'
                            : 'text-[var(--danger)]'
                        }`}
                      >
                        HTTP {testResult.status}
                      </span>

                      <span className="text-[var(--muted)]">
                        {testResult.latencyMs} ms
                      </span>

                      <span className="text-[var(--muted)]">
                        Provider: {testResult.finalProvider}
                      </span>

                      {testResult.fallbackTriggered && (
                        <span className="rounded-md bg-[var(--accent-yellow)]/10 px-2 py-1 text-[var(--accent-yellow)]">
                          Fallback used
                        </span>
                      )}
                    </div>

                    {testResult.summary && (
                      <p className="rounded-lg bg-[var(--card)] p-3 text-xs leading-5 text-[var(--foreground)]">
                        {testResult.summary}
                      </p>
                    )}

                    {testResult.fallbackReason && (
                      <p className="text-xs text-[var(--muted)]">
                        Fallback reason: {testResult.fallbackReason}
                      </p>
                    )}

                    <details>
                      <summary className="cursor-pointer text-xs text-[var(--muted)] transition hover:text-[var(--foreground)]">
                        View raw response
                      </summary>

                      <pre className="mt-2 max-h-52 overflow-auto rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 text-[10px] leading-5 text-[var(--foreground)]">
                        {JSON.stringify(testResult.raw, null, 2)}
                      </pre>
                    </details>
                  </div>
                )}
              </div>
            </div>
          </section>
        </div>
      )}
    </div>
  );
}

export default function ProvidersPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-48 items-center justify-center gap-2 p-8 text-sm text-[var(--muted)]">
          <Loader2 className="h-5 w-5 animate-spin text-[var(--primary)]" />
          Loading API providers…
        </div>
      }
    >
      <ProvidersContent />
    </Suspense>
  );
}
