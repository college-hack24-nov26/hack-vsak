'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import {
  Sparkles,
  ExternalLink,
  MessageSquare,
  CloudSun,
  Music,
  Wind,
  Play,
  Copy,
  Check,
  Zap,
  ArrowRight,
  ShieldCheck,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import { fetchApi } from '@/lib/api';

interface ExampleAppMeta {
  id: string;
  title: string;
  category: 'ai' | 'weather' | 'music' | 'news' | 'environment';
  tagline: string;
  icon: string;
  badge: string;
  badgeColor: string;
  proxyEndpoint: string;
  failoverRoute: string;
  demoUrl: string;
  defaultQuery: string;
  placeholder: string;
}

const APPS: ExampleAppMeta[] = [
  {
    id: 'chat',
    title: 'ChatGPT-Style AI Assistant',
    category: 'ai',
    tagline: 'High-speed conversational reasoning with automated multi-provider failover across Gemini, Groq, and OpenRouter.',
    icon: '💬',
    badge: 'ChatGPT Redesign',
    badgeColor: 'bg-violet-500/15 text-violet-300',
    proxyEndpoint: 'POST /api/v1/proxy/ai/chat',
    failoverRoute: 'Google Gemini 3.5 Flash → Groq Llama 3.3 70B → OpenRouter',
    demoUrl: 'http://localhost:5000/example/index.html',
    defaultQuery: 'Explain how OneAPI failover protects applications in 2 short bullet points.',
    placeholder: 'Ask anything (e.g. Write a TypeScript proxy client)...',
  },
  {
    id: 'weather',
    title: 'Live Weather Station',
    category: 'weather',
    tagline: 'Hyper-local real-time temperature, condition, atmospheric pressure, and wind speed forecasts.',
    icon: '⛅',
    badge: 'Weather App',
    badgeColor: 'bg-sky-500/15 text-sky-300',
    proxyEndpoint: 'GET /api/v1/proxy/weather/current?city=...',
    failoverRoute: 'Open-Meteo Weather API → Weatherstack (APILayer)',
    demoUrl: 'http://localhost:5000/example/weather.html',
    defaultQuery: 'San Francisco',
    placeholder: 'Enter city name (e.g. Tokyo, London, Paris, Delhi)...',
  },
  {
    id: 'music',
    title: 'Music Catalog & Audio Streamer',
    category: 'music',
    tagline: 'Track discovery, album artwork metadata, artist discography, and 30-second audio stream previews.',
    icon: '🎵',
    badge: 'Audio Player',
    badgeColor: 'bg-purple-500/15 text-purple-300',
    proxyEndpoint: 'GET /api/v1/proxy/music/search?q=...&limit=6',
    failoverRoute: 'Deezer Music API → Apple iTunes Search API',
    demoUrl: 'http://localhost:5000/example/music.html',
    defaultQuery: 'Daft Punk',
    placeholder: 'Search song or artist (e.g. The Weeknd, Queen, Adele)...',
  },
  {
    id: 'news',
    title: 'Real-Time News Radar',
    category: 'news',
    tagline: 'Curated real-time technology discussions and spaceflight aerospace news reports with automated fallback.',
    icon: '📰',
    badge: 'News Radar',
    badgeColor: 'bg-amber-500/15 text-amber-300',
    proxyEndpoint: 'GET /api/v1/proxy/news/search?q=...&limit=6',
    failoverRoute: 'HackerNews Algolia API → Spaceflight News API (v4)',
    demoUrl: 'http://localhost:5000/example/news.html',
    defaultQuery: 'technology',
    placeholder: 'Search tech or space news (e.g. quantum, SpaceX, rust)...',
  },
  {
    id: 'environment',
    title: 'Air Quality & Environment Monitor',
    category: 'environment',
    tagline: 'Real-time Air Quality Index (AQI), PM2.5, PM10, ozone, and health advisory indicators.',
    icon: '🌱',
    badge: 'Air Quality',
    badgeColor: 'bg-emerald-500/15 text-emerald-300',
    proxyEndpoint: 'GET /api/v1/proxy/environment/air-quality?city=...',
    failoverRoute: 'OpenAQ Global Sensor v3 → Open-Meteo Atmospheric Air',
    demoUrl: 'http://localhost:5000/example/environment.html',
    defaultQuery: 'London',
    placeholder: 'Enter city or region (e.g. Los Angeles, Paris, Tokyo)...',
  },
];

export default function ExamplesShowcasePage() {
  const [activeTab, setActiveTab] = useState<string>('chat');
  const [queries, setQueries] = useState<Record<string, string>>({
    chat: APPS[0].defaultQuery,
    weather: APPS[1].defaultQuery,
    music: APPS[2].defaultQuery,
    news: APPS[3].defaultQuery,
    environment: APPS[4].defaultQuery,
  });
  const [loadingApp, setLoadingApp] = useState<string | null>(null);
  const [results, setResults] = useState<Record<string, any>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const activeApp = APPS.find((a) => a.id === activeTab) || APPS[0];

  const handleRunDemo = async (appId: string) => {
    const q = queries[appId]?.trim() || '';
    if (!q) return;

    setLoadingApp(appId);
    const startTime = performance.now();

    try {
      let endpoint = '';
      let method = 'GET';
      let body: any = undefined;

      if (appId === 'chat') {
        endpoint = '/api/v1/proxy/ai/chat';
        method = 'POST';
        body = JSON.stringify({
          messages: [{ role: 'user', content: q }],
        });
      } else if (appId === 'weather') {
        endpoint = `/api/v1/proxy/weather/current?city=${encodeURIComponent(q)}`;
      } else if (appId === 'music') {
        endpoint = `/api/v1/proxy/music/search?q=${encodeURIComponent(q)}&limit=6`;
      } else if (appId === 'news') {
        endpoint = `/api/v1/proxy/news/search?q=${encodeURIComponent(q)}&limit=6`;
      } else if (appId === 'environment') {
        endpoint = `/api/v1/proxy/environment/air-quality?city=${encodeURIComponent(q)}`;
      }

      const res = await fetchApi(endpoint, { method, body });
      const latencyMs = Math.round(performance.now() - startTime);

      setResults((prev) => ({
        ...prev,
        [appId]: {
          success: res.success,
          latencyMs,
          finalProvider: res._oneapi?.finalProvider || res.data?.provider || 'oneapi-gateway',
          fallbackTriggered: Boolean(res._oneapi?.fallbackTriggered),
          data: res.data || res,
          raw: res,
        },
      }));
    } catch (err: any) {
      setResults((prev) => ({
        ...prev,
        [appId]: {
          success: false,
          latencyMs: Math.round(performance.now() - startTime),
          finalProvider: 'network',
          fallbackTriggered: false,
          error: err.message,
        },
      }));
    } finally {
      setLoadingApp(null);
    }
  };

  const copyCode = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const currentResult = results[activeApp.id];

  return (
    <div className="space-y-6">
      {/* 1. Header Banner */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#111827] shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 mb-1.5">
            <span className="px-2.5 py-0.5 rounded-full bg-sky-500/10 text-sky-400 text-[10px] font-mono font-bold tracking-wider uppercase">
              CLIENT APPLICATIONS &amp; SHOWCASE
            </span>
            <span className="text-xs text-slate-400">&bull; Multi-Category Failover Demos</span>
          </div>
          <h2 className="text-xl md:text-2xl font-extrabold text-white flex items-center gap-2">
            <Sparkles className="w-6 h-6 text-sky-400" />
            Interactive Examples &amp; Live Client Demos
          </h2>
          <p className="text-xs md:text-sm text-slate-400 mt-1 max-w-2xl leading-relaxed">
            Explore 4 production-ready web applications powered by OneAPI proxy gateways. Test AI reasoning (ChatGPT redesign), hyper-local weather, music catalogs, and environmental air quality live.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <a
            href="http://localhost:5000/example"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>💬 Launch ChatGPT App</span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          </a>
          <a
            href="http://localhost:5000/example/weather.html"
            target="_blank"
            rel="noopener noreferrer"
            className="px-3.5 py-2 rounded-xl bg-slate-900 hover:bg-slate-800 text-white font-semibold text-xs flex items-center gap-1.5 transition-colors"
          >
            <span>⛅ Weather</span>
            <ExternalLink className="w-3.5 h-3.5 text-sky-400" />
          </a>
        </div>
      </div>

      {/* 2. Application Selection Tabs */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {APPS.map((app) => (
          <button
            key={app.id}
            onClick={() => setActiveTab(app.id)}
            className={`p-4 rounded-xl text-left cursor-pointer transition-all flex flex-col justify-between gap-3 ${
              activeTab === app.id
                ? 'bg-gradient-to-b from-slate-900 to-[#111827] ring-2 ring-sky-500 shadow-xl'
                : 'bg-[#111827] hover:bg-slate-900/80 text-slate-400'
            }`}
          >
            <div className="flex items-center justify-between w-full">
              <span className="text-2xl p-2 rounded-xl bg-slate-950">{app.icon}</span>
              <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${app.badgeColor}`}>
                {app.badge}
              </span>
            </div>
            <div>
              <h3 className={`text-xs md:text-sm font-bold ${activeTab === app.id ? 'text-white' : 'text-slate-300'}`}>
                {app.title}
              </h3>
              <p className="text-[11px] text-slate-500 mt-0.5 font-mono truncate">
                {app.proxyEndpoint}
              </p>
            </div>
          </button>
        ))}
      </div>

      {/* 3. Interactive Testbench & Architecture Detail for Active App */}
      <div className="p-6 md:p-8 rounded-2xl bg-[#111827] shadow-xl space-y-6">
        {/* App Title Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-4 border-b border-transparent">
          <div className="flex items-center gap-3">
            <span className="text-3xl p-3 rounded-2xl bg-slate-900 shadow-inner">{activeApp.icon}</span>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="text-lg font-bold text-white">{activeApp.title}</h3>
                <span className={`text-[10px] font-mono font-bold uppercase px-2 py-0.5 rounded-full ${activeApp.badgeColor}`}>
                  {activeApp.category}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5 max-w-xl">{activeApp.tagline}</p>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <a
              href={activeApp.demoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="px-4 py-2 bg-gradient-to-r from-sky-500 to-blue-600 hover:from-sky-400 hover:to-blue-500 text-white font-bold text-xs rounded-xl shadow-lg shadow-sky-500/20 flex items-center gap-1.5 cursor-pointer transition-all shrink-0"
            >
              <span>Open Standalone App</span>
              <ExternalLink className="w-3.5 h-3.5" />
            </a>
          </div>
        </div>

        {/* Failover Architecture Banner */}
        <div className="p-4 rounded-xl bg-slate-900/90 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs font-mono">
          <div className="flex items-center gap-2 text-slate-300">
            <Zap className="w-4 h-4 text-sky-400 shrink-0" />
            <span>Failover Pipeline:</span>
            <strong className="text-white">{activeApp.failoverRoute}</strong>
          </div>
          <div className="text-slate-400 text-[11px]">
            Target Endpoint: <code className="text-sky-300 font-bold">{activeApp.proxyEndpoint}</code>
          </div>
        </div>

        {/* Live Input & Execution Bar */}
        <div className="space-y-2">
          <label className="text-xs font-bold text-white flex items-center gap-1.5">
            <Play className="w-3.5 h-3.5 text-sky-400 fill-sky-400" />
            <span>Live Query Testbench</span>
          </label>
          <div className="flex gap-2">
            <input
              type="text"
              value={queries[activeApp.id] || ''}
              onChange={(e) => setQueries({ ...queries, [activeApp.id]: e.target.value })}
              placeholder={activeApp.placeholder}
              className="flex-1 px-4 py-2.5 bg-slate-900 rounded-xl text-xs text-white placeholder:text-slate-500 focus:outline-none focus:ring-1 focus:ring-sky-500"
            />
            <button
              onClick={() => handleRunDemo(activeApp.id)}
              disabled={loadingApp === activeApp.id}
              className="px-5 py-2.5 bg-sky-600 hover:bg-sky-500 text-white font-bold text-xs rounded-xl shadow cursor-pointer disabled:opacity-50 transition-all flex items-center gap-1.5 shrink-0"
            >
              {loadingApp === activeApp.id ? (
                <>
                  <span className="animate-spin">⚡</span>
                  <span>Executing...</span>
                </>
              ) : (
                <>
                  <span>Send Request</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </>
              )}
            </button>
          </div>
        </div>

        {/* Live Execution Output */}
        {currentResult && (
          <div
            className={`p-5 rounded-2xl text-xs font-mono space-y-3 ${
              currentResult.success ? 'bg-slate-950 text-slate-200' : 'bg-rose-950/40 text-rose-300'
            }`}
          >
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-transparent">
              <div className="flex items-center gap-2 font-bold text-[11px]">
                {currentResult.success ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                ) : (
                  <AlertTriangle className="w-4 h-4 text-rose-400" />
                )}
                <span>Status: {currentResult.success ? '200 OK' : 'Execution Failed'}</span>
              </div>
              <div className="flex items-center gap-3 text-[11px] text-slate-400">
                <span>
                  Provider: <strong className="text-sky-300">{currentResult.finalProvider}</strong>
                </span>
                <span>
                  Latency: <strong className="text-emerald-400">{currentResult.latencyMs}ms</strong>
                </span>
                <span>
                  Failover:{' '}
                  <strong className={currentResult.fallbackTriggered ? 'text-purple-400' : 'text-slate-400'}>
                    {currentResult.fallbackTriggered ? 'YES' : 'NO'}
                  </strong>
                </span>
              </div>
            </div>

            {/* Render Category-Specific Friendly View */}
            {activeApp.id === 'chat' && currentResult.data && (
              <div className="p-3.5 rounded-xl bg-slate-900/90 text-slate-200 font-sans leading-relaxed select-all">
                {currentResult.data.choices?.[0]?.message?.content ||
                  currentResult.data.content ||
                  JSON.stringify(currentResult.data, null, 2)}
              </div>
            )}

            {activeApp.id === 'weather' && currentResult.data && (
              <div className="p-4 rounded-xl bg-slate-900/90 flex items-center justify-between font-sans">
                <div>
                  <div className="text-sm font-bold text-white">{currentResult.data.location || queries.weather}</div>
                  <div className="text-xs text-sky-400 font-semibold mt-0.5">
                    {currentResult.data.current?.condition || 'Clear'}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-white">
                  {currentResult.data.current?.temperature ?? 20}°C
                </div>
              </div>
            )}

            {activeApp.id === 'music' && currentResult.data?.tracks && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-sans">
                {currentResult.data.tracks.slice(0, 3).map((t: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/90 flex items-center gap-3">
                    {t.albumCover && (
                      <img src={t.albumCover} alt={t.title} className="w-10 h-10 rounded-lg object-cover" />
                    )}
                    <div className="overflow-hidden">
                      <div className="text-xs font-bold text-white truncate">{t.title}</div>
                      <div className="text-[11px] text-slate-400 truncate">{t.artist}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeApp.id === 'news' && currentResult.data?.articles && (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3 font-sans">
                {currentResult.data.articles.slice(0, 3).map((a: any, idx: number) => (
                  <div key={idx} className="p-3 rounded-xl bg-slate-900/90 flex flex-col justify-between gap-2">
                    <div>
                      <div className="text-[10px] text-amber-400 font-bold mb-1">{a.source}</div>
                      <div className="text-xs font-bold text-white line-clamp-2">{a.title}</div>
                    </div>
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[10px] text-amber-400 hover:underline flex items-center gap-1 font-semibold"
                    >
                      <span>Read Story</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                ))}
              </div>
            )}

            {activeApp.id === 'environment' && currentResult.data && (
              <div className="p-4 rounded-xl bg-slate-900/90 flex items-center justify-between font-sans">
                <div>
                  <div className="text-sm font-bold text-white">{currentResult.data.location || queries.environment}</div>
                  <div className="text-xs text-emerald-400 font-semibold mt-0.5">
                    Status: {currentResult.data.airQuality?.status || 'Good'}
                  </div>
                </div>
                <div className="text-3xl font-extrabold text-emerald-400">
                  {currentResult.data.airQuality?.aqi ?? 42}{' '}
                  <span className="text-xs text-slate-400 font-normal">AQI</span>
                </div>
              </div>
            )}

            {/* Raw JSON Accordion */}
            <details className="pt-2 text-[10px] text-slate-500">
              <summary className="cursor-pointer hover:text-slate-300">View Full JSON Payload</summary>
              <pre className="mt-2 p-3 rounded-xl bg-slate-900/80 overflow-x-auto text-[10px] text-slate-400">
                {JSON.stringify(currentResult.raw, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* 4. Code Snippet Integration Example */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <span className="text-xs font-bold text-slate-300">Quick Integration Snippet (Fetch API):</span>
            <button
              onClick={() =>
                copyCode(
                  `const res = await fetch('http://localhost:5000${activeApp.proxyEndpoint.split(' ')[1]}', {
  method: '${activeApp.proxyEndpoint.split(' ')[0]}',
  headers: {
    'x-api-key': 'sk_live_YOUR_KEY',
    'Content-Type': 'application/json'
  }${activeApp.category === 'ai' ? `,\n  body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })` : ''}
});
const data = await res.json();
console.log(data);`,
                  `snippet-${activeApp.id}`
                )
              }
              className="text-xs text-sky-400 hover:text-sky-300 cursor-pointer flex items-center gap-1"
            >
              {copiedId === `snippet-${activeApp.id}` ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="text-emerald-400">Copied!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>

          <pre className="p-4 rounded-xl bg-slate-950 text-xs font-mono text-sky-300 overflow-x-auto">
{`const res = await fetch('http://localhost:5000${activeApp.proxyEndpoint.split(' ')[1]}', {
  method: '${activeApp.proxyEndpoint.split(' ')[0]}',
  headers: {
    'x-api-key': 'sk_live_YOUR_KEY',
    'Content-Type': 'application/json'
  }${activeApp.category === 'ai' ? `,\n  body: JSON.stringify({ messages: [{ role: 'user', content: 'Hello' }] })` : ''}
});
const data = await res.json();
console.log('Provider used:', data._oneapi?.finalProvider);`}
          </pre>
        </div>
      </div>
    </div>
  );
}
