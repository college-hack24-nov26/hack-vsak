'use client';

import React, { useState, useEffect } from 'react';
import {
  KeyRound,
  Plus,
  Trash2,
  Copy,
  Check,
  CheckCircle2,
  ShieldCheck,
  Key,
  RefreshCw,
  Eye,
  EyeOff,
  Sparkles,
  Zap,
} from 'lucide-react';
import { authStorage, fetchApi } from '@/lib/api';

const STORAGE_LATEST_RAW_KEY = 'oneapi_latest_raw_developer_api_key';

export default function ApiKeysPage() {
  const [user, setUser] = useState<any>(null);
  const [apiKeys, setApiKeys] = useState<any[]>([]);
  const [newKeyName, setNewKeyName] = useState('');
  const [creatingApiKey, setCreatingApiKey] = useState(false);
  const [freshRawApiKey, setFreshRawApiKey] = useState<string | null>(null);
  const [showFreshKey, setShowFreshKey] = useState(true);
  const [keyToValidate, setKeyToValidate] = useState('');
  const [validatingKey, setValidatingKey] = useState(false);
  const [validationResult, setValidationResult] = useState<any>(null);
  const [copiedId, setCopiedId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});

  const toggleRevealKey = (keyId: string) => {
    setRevealedKeys((prev) => ({ ...prev, [keyId]: !prev[keyId] }));
  };

  const loadData = async () => {
    setLoading(true);
    try {
      const stored = authStorage.getUser();
      if (stored) setUser(stored);

      // Restore last generated raw key if stored in session
      if (typeof window !== 'undefined') {
        const savedRaw = localStorage.getItem(STORAGE_LATEST_RAW_KEY);
        if (savedRaw && !freshRawApiKey) {
          setFreshRawApiKey(savedRaw);
        }
      }

      const [userRes, keysRes] = await Promise.all([
        fetchApi('/api/v1/auth/me').catch(() => null),
        fetchApi('/api/v1/auth/api-keys').catch(() => null),
      ]);

      if (userRes?.success && userRes.data?.user) {
        setUser(userRes.data.user);
        authStorage.setUser(userRes.data.user);
      }

      if (keysRes?.success && keysRes.data?.apiKeys) {
        setApiKeys(keysRes.data.apiKeys);
      }
    } catch (err) {
      console.error('Failed to load API keys:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();

    const handleProjectChanged = () => {
      loadData();
    };
    window.addEventListener('oneapi_project_changed', handleProjectChanged);

    return () => {
      window.removeEventListener('oneapi_project_changed', handleProjectChanged);
    };
  }, []);

  const handleCreateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    setCreatingApiKey(true);
    setFreshRawApiKey(null);

    try {
      const activeProjId = authStorage.getProjectId();
      const res = await fetchApi('/api/v1/auth/create-api-key', {
        method: 'POST',
        body: JSON.stringify({
          name: newKeyName.trim() || 'Production Key',
          scopes: ['read', 'write', 'proxy'],
          ...(activeProjId && { projectId: activeProjId }),
        }),
      });

      if (res.success && (res.data?.rawApiKey || res.data?.apiKey || res.data?.fullKey)) {
        const rawKey = res.data.rawApiKey || res.data.apiKey || res.data.fullKey;
        setFreshRawApiKey(rawKey);
        setShowFreshKey(true);
        if (typeof window !== 'undefined') {
          localStorage.setItem(STORAGE_LATEST_RAW_KEY, rawKey);
        }
        setNewKeyName('');
        await loadData();
      }
    } catch (err) {
      console.error('Failed to create API key:', err);
    } finally {
      setCreatingApiKey(false);
    }
  };

  const handleDeleteApiKey = async (keyId: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Applications using it will immediately be rejected.')) return;
    try {
      const res = await fetchApi(`/api/v1/auth/api-keys/${keyId}`, { method: 'DELETE' });
      if (res.success) {
        loadData();
      }
    } catch (err) {
      console.error('Failed to delete key:', err);
    }
  };

  const handleValidateApiKey = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!keyToValidate.trim() || !user) return;

    setValidatingKey(true);
    setValidationResult(null);

    try {
      const res = await fetchApi('/api/v1/auth/api-keys/validate', {
        method: 'POST',
        body: JSON.stringify({
          apiKey: keyToValidate.trim(),
          userId: user.user_id || user._id,
          email: user.email,
        }),
      });
      setValidationResult(res);
    } catch (err: any) {
      setValidationResult({ success: false, error: { message: err.message } });
    } finally {
      setValidatingKey(false);
    }
  };

  const copyToClipboard = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <div className="space-y-6">
      {/* 1. Header & Generate Form */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#111827] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-violet-500/10 text-violet-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              AUTHENTICATION ENGINE
            </span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <KeyRound className="w-6 h-6 text-sky-400" />
            Developer API Keys ({apiKeys.length})
          </h2>
          <p className="text-xs text-slate-400 mt-1 max-w-xl">
            Generate and manage API keys to authenticate application servers and the official <code className="text-sky-300">@oneapi/sdk</code> against the proxy gateway.
          </p>
        </div>

        <form onSubmit={handleCreateApiKey} className="flex items-center gap-2 shrink-0">
          <input
            type="text"
            placeholder="Key name (e.g. Production Backend)..."
            value={newKeyName}
            onChange={(e) => setNewKeyName(e.target.value)}
            required
            className="px-3.5 py-2.5 bg-slate-900 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={creatingApiKey}
            className="px-4 py-2.5 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-semibold text-xs rounded-xl shadow-lg shadow-sky-500/25 flex items-center gap-1.5 cursor-pointer disabled:opacity-50 transition-all"
          >
            <Plus className="w-3.5 h-3.5" />
            {creatingApiKey ? 'Generating...' : 'Create Key'}
          </button>
        </form>
      </div>

      {/* 2. Prominent Raw API Key Card with Instant 1-Click Copy */}
      {freshRawApiKey && (
        <div className="p-6 rounded-2xl bg-gradient-to-r from-emerald-950/60 via-slate-900 to-slate-950 shadow-2xl space-y-3.5 relative overflow-hidden">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <p className="font-bold flex items-center gap-2 text-emerald-400 text-sm">
                <CheckCircle2 className="w-5 h-5 text-emerald-400" />
                Active Developer API Key Available to Copy:
              </p>
              <p className="text-xs text-slate-400 mt-0.5">
                Use this token with header <code className="text-sky-300">Authorization: Bearer &lt;KEY&gt;</code> or <code className="text-sky-300">x-api-key: &lt;KEY&gt;</code>.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => setShowFreshKey(!showFreshKey)}
                className="px-3 py-1.5 rounded-lg bg-slate-900 text-slate-300 hover:text-white text-xs font-semibold flex items-center gap-1.5 cursor-pointer"
              >
                {showFreshKey ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                <span>{showFreshKey ? 'Mask' : 'Reveal'}</span>
              </button>

              <button
                type="button"
                onClick={() => copyToClipboard(freshRawApiKey, 'fresh-raw-key')}
                className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold rounded-xl text-xs flex items-center gap-1.5 cursor-pointer shadow-lg shadow-emerald-500/20 transition-all"
              >
                {copiedId === 'fresh-raw-key' ? (
                  <>
                    <Check className="w-4 h-4 text-slate-950" />
                    <span>Copied!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4 text-slate-950" />
                    <span>Copy Full API Key</span>
                  </>
                )}
              </button>
            </div>
          </div>

          <div className="p-3.5 rounded-xl bg-slate-950 flex items-center justify-between gap-3 overflow-hidden">
            <code className="font-mono text-xs text-emerald-300 font-bold select-all break-all">
              {showFreshKey
                ? freshRawApiKey
                : `${freshRawApiKey.slice(0, 12)}••••••••••••••••••••••••••••••••••••${freshRawApiKey.slice(-4)}`}
            </code>
          </div>
        </div>
      )}

      {/* 3. Existing Keys Table */}
      <div className="p-6 rounded-2xl bg-[#111827] shadow-xl space-y-4">
        <div className="flex items-center justify-between">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <Key className="w-4 h-4 text-sky-400" />
              Active Registered API Keys
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Click the copy button on any key row to copy the key identifier to your clipboard.
            </p>
          </div>

          <button
            onClick={loadData}
            disabled={loading}
            className="p-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors flex items-center gap-1 text-xs"
            title="Refresh Keys"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loading ? 'animate-spin' : ''}`} />
            <span className="hidden sm:inline">Refresh</span>
          </button>
        </div>

        {apiKeys.length === 0 ? (
          <div className="text-center py-14 rounded-xl bg-slate-900/50">
            <Key className="w-8 h-8 text-slate-600 mx-auto mb-2" />
            <p className="text-xs font-semibold text-slate-400">No developer API keys created yet.</p>
            <p className="text-[11px] text-slate-600 mt-1">Use the form above to generate your first API key.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-slate-400 uppercase text-[10px] tracking-wider font-semibold border-b border-transparent">
                  <th className="pb-3 px-3">Name</th>
                  <th className="pb-3 px-3">API Key Identifier</th>
                  <th className="pb-3 px-3">Scopes</th>
                  <th className="pb-3 px-3">Status</th>
                  <th className="pb-3 px-3">Created</th>
                  <th className="pb-3 px-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800/40 font-mono">
                {apiKeys.map((k) => {
                  const fullKey = k.fullKey || (freshRawApiKey && freshRawApiKey.startsWith(k.keyPrefix?.slice(0, 10)) ? freshRawApiKey : null);
                  const isRevealed = !!revealedKeys[k._id];
                  const keyToCopy = fullKey || k.keyPrefix;
                  const displayString = isRevealed && fullKey ? fullKey : k.keyPrefix;

                  return (
                    <tr key={k._id} className="hover:bg-slate-900/60 transition-colors">
                      <td className="py-3 px-3 font-sans font-bold text-white">{k.name}</td>
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-2">
                          <code className="text-sky-400 font-bold select-all bg-slate-900/80 px-2 py-0.5 rounded text-[11px] max-w-xs truncate">
                            {displayString}
                          </code>
                          <button
                            type="button"
                            onClick={() => toggleRevealKey(k._id)}
                            className="p-1.5 rounded-lg bg-slate-850 hover:bg-slate-800 text-slate-400 hover:text-white cursor-pointer transition-colors"
                            title={isRevealed ? 'Mask Key' : 'Reveal Full Key'}
                          >
                            {isRevealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
                          </button>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(keyToCopy, `row-key-${k._id}`)}
                            className="p-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white cursor-pointer transition-colors flex items-center gap-1"
                            title="Copy Full API Key"
                          >
                            {copiedId === `row-key-${k._id}` ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-[10px] font-sans font-semibold text-emerald-400">Copied!</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5" />
                                <span className="text-[10px] font-sans font-semibold">Copy Full Key</span>
                              </>
                            )}
                          </button>
                        </div>
                      </td>
                      <td className="py-3 px-3 text-slate-400">{k.scopes?.join(', ') || 'read, write, proxy'}</td>
                      <td className="py-3 px-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                            k.isActive !== false ? 'bg-emerald-500/15 text-emerald-400' : 'bg-slate-800 text-slate-500'
                          }`}
                        >
                          {k.isActive !== false ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-slate-500 text-[11px]">
                        {new Date(k.createdAt).toLocaleDateString()}
                      </td>
                      <td className="py-3 px-3 text-right">
                        <button
                          onClick={() => handleDeleteApiKey(k._id)}
                          className="p-1.5 text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 rounded-lg cursor-pointer transition-colors"
                          title="Revoke Key"
                        >
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* 4. Server-Side API Key Validation Tester */}
      <div className="p-6 rounded-2xl bg-[#111827] shadow-xl space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-sm font-bold text-white flex items-center gap-2">
              <ShieldCheck className="w-4 h-4 text-emerald-400" />
              Server-Side Key Validation Test Bench
            </h3>
            <p className="text-xs text-slate-400 mt-0.5">
              Verify an API key against database endpoint <code className="text-sky-300">POST /api/v1/auth/api-keys/validate</code>.
            </p>
          </div>

          {freshRawApiKey && (
            <button
              type="button"
              onClick={() => setKeyToValidate(freshRawApiKey)}
              className="text-xs text-sky-400 hover:text-sky-300 underline cursor-pointer self-start sm:self-auto"
            >
              Auto-fill latest key
            </button>
          )}
        </div>

        <form onSubmit={handleValidateApiKey} className="flex gap-2">
          <input
            type="text"
            placeholder="Paste full API key (e.g. sk_live_...)..."
            value={keyToValidate}
            onChange={(e) => setKeyToValidate(e.target.value)}
            required
            className="flex-1 px-3.5 py-2.5 bg-slate-900 rounded-xl text-xs font-mono text-white placeholder:text-slate-500 focus:outline-none"
          />
          <button
            type="submit"
            disabled={validatingKey}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-500 text-white font-semibold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 transition-all shrink-0"
          >
            {validatingKey ? 'Validating...' : 'Validate Key'}
          </button>
        </form>

        {validationResult && (
          <div
            className={`p-4 rounded-xl text-xs font-mono ${
              validationResult.valid || validationResult.success
                ? 'bg-emerald-500/10 text-emerald-400'
                : 'bg-rose-500/10 text-rose-400'
            }`}
          >
            <pre className="text-[10px] overflow-x-auto">{JSON.stringify(validationResult, null, 2)}</pre>
          </div>
        )}
      </div>
    </div>
  );
}
